# Deployment Guide

ServiceDesk ships as a single Next.js **standalone** build with a SQLite file
database — one process, zero external services. This guide covers the
supported production paths and the environment contract.

## 1. Build

```bash
bun install
bun run build          # next build + standalone assembly (.next/standalone)
```

The build compiles the page shell and the 16 API route handlers, then copies
`.next/static` and `public/` into `.next/standalone/` (see the `build`
script in `package.json`). `next.config.ts` pins `outputFileTracingRoot` to
the repo root — keep it; the standalone trace depends on it.

## 2. Run

```bash
bun run start          # NODE_ENV=production bun .next/standalone/server.js
```

The server listens on port 3000 by default (`PORT` overrides). Always start
it from the repo root via the npm/bun script — the scripts guarantee the
working directory that the SQLite path resolution and the standalone trace
rely on. Behind a reverse proxy, forward `X-Forwarded-Proto` so the
auth-gate `from_url` deep links carry the right scheme (the middleware
runner honors it when constructing the pre-auth destination URL — session 36
contract). Note the cookie's `Secure` attribute derives from `NODE_ENV`
alone, not from `X-Forwarded-Proto`: the production standalone ships
`Secure` cookies, and browsers DROP `Secure` set-cookies on plain-HTTP
non-localhost origins — a production deployment on `http://<lan-host>:3000`
fails login silently. Terminate TLS in front of the app (the forwarded
`X-Forwarded-Proto` then also makes the from_url protocol correct); plain
HTTP is only for `localhost` development.

**`X-Forwarded-For` and the rate-limit key (session 38 contract).** The
auth rate limiters (login 10/IP/15-min, forgot-password 5/IP/15-min) key
on `clientIp()` (`src/lib/auth.ts`), which takes the **RIGHTMOST**
`X-Forwarded-For` element and falls back to `X-Real-IP`, then `unknown`.
XFF is an APPEND list: your proxy adds the socket address it saw to the
END, so the rightmost is the proxy-controlled value and any client-chosen
prefix is discarded. Configure the proxy to APPEND:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # append ✓
proxy_set_header X-Real-IP $remote_addr;                      # alternative ✓
```

Anti-patterns: forwarding the client's XFF verbatim
(`proxy_set_header X-Forwarded-For $http_x_forwarded_for`) leaves the
rightmost client-controlled — a rotating prefix mints a fresh rate-limit
bucket per request and the limiter never fires (the s38 measured bypass).
Replacing instead of appending (`$remote_addr` alone) is safe — the single
element is the proxy-observed address. Without any proxy the socket
address is not exposed to route handlers at all: the header stays
best-effort and the limiter is a backstop, not a boundary (the s21
doctrine, unchanged).

**The standalone's own XFF injection (the s38 measured platform
behavior).** The Next standalone server INJECTS
`X-Forwarded-For: <socket address>` into every request that arrives
without one (plus `X-Forwarded-Host`/`-Port`/`-Proto`), and passes a
client-sent XFF through verbatim (no append). Two measured consequences:
(a) the `x-real-ip` fallback in `clientIp()` is unreachable behind the
standalone — the injected XFF always wins the precedence (the fallback
remains for other hosting shapes and is unit-pinned); (b) honest direct
clients — those that do not forge an XFF — key the rate limiter on their
REAL socket IP: the no-proxy posture is stronger than the s21 "unknown"
narrative. The only no-proxy bypass left is deliberate XFF forging (send
`X-Forwarded-For: <random>` per request) — inherent to the web-Request
API (no socket address), closed by putting the appending proxy in front
per the guidance above.

**The limiter's memory posture (the s39 eviction contract).** The in-memory
`buckets` Map evicts fully-expired entries once it crosses 1,000 live keys
(at most one sweep per minute; a bucket with any live hit is never touched).
The honest bound during an ACTIVE window is inherent to every sliding-window
limiter: memory grows with the number of unique keys seen in the last 15
minutes (~2.2 KB per key, measured) — an attacker forging unique XFF values
at high rate can hold that much for the window's duration, but the memory
now RETURNS when the window expires instead of accumulating monotonically
over the process lifetime (the pre-s39 behavior: measured +111 MB retained
per 50k unique keys, never reclaimed). The limiter remains per-instance
(the s21 doctrine: a backstop, not a boundary; horizontal scale needs an
external store).

## 3. Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite connection string. See §4. |
| `AUTH_SECRET` | **Yes in production** | HMAC secret for session cookies. Generate with `openssl rand -hex 32`. An insecure dev constant is used when unset — never ship that. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public origin, used for metadata URLs and `sitemap.xml` (e.g. `https://orbital.example.com`). |

## 4. Database location (§4 — the `.env.example` reference)

`DATABASE_URL` accepts three forms:

1. **Relative `file:` URL (the default, zero-config local story).**
   ```
   DATABASE_URL="file:../db/custom.db"
   ```
   Relative URLs resolve against the **`prisma/` directory that owns
   `schema.prisma`** — exactly like the Prisma CLI — so this string points
   at `<repo>/db/custom.db` for `prisma db push`, `prisma/seed.ts`,
   `next build` and the running server alike, regardless of the process
   working directory. The resolution rule lives in
   `src/lib/db-path.ts` and is pinned by `tests/db-path.test.ts`.

2. **Absolute `file:` URL (recommended for production).**
   ```
   DATABASE_URL="file:/var/lib/orbital/custom.db"
   ```
   Absolute paths pass through untouched — immune to any working-directory
   ambiguity across service managers, containers, or cron wrappers. Point
   them at a persisted volume and back the file up.

3. **PostgreSQL.** Switch `provider = "postgresql"` in
   `prisma/schema.prisma`, set a `postgresql://` URL, then
   `bun run db:push && bun run db:seed`.

Initialize (or reset) the database with:

```bash
bun run db:push        # apply schema (db push — no migrations folder)
bun run db:seed        # idempotent demo workspace (wipes domain tables)
```

`db/*.db` is gitignored; every fresh clone recreates it from the two
commands above.

## 5. Updating

```bash
git pull
bun install
bunx prisma generate   # after schema changes
bun run db:push
bun run build
# restart the server process
```

## 6. Verification checklist

```bash
curl -s https://your-host/api/health          # {"status":"ok",...}
bun run lint && bun run typecheck && bun run test
./scripts/smoke-test.sh                       # 30 E2E checks (local)
bun run test:e2e                              # Playwright suite (local)
```

## 7. Common production issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Error code 14: Unable to open the database file` | Server started from a directory that has no `prisma/schema.prisma` and no absolute `DATABASE_URL` | Start via `bun run start`, or set an absolute `file:` URL (§4) |
| Logins loop back to `/login` | `AUTH_SECRET` changed between restarts | Keep the secret stable across restarts |
| Rate-limited logins (429) | 10 attempts/IP/15 min fixed window | Wait for `Retry-After`, or restart to clear the in-memory buckets (single-node) |
