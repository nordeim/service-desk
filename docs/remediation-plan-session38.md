# ServiceDesk — Session 38 Remediation Plan

**Date:** 2026-10-12
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 38 follows the session-37 remediation (commits `afc3a25` + `34eb70a` + the operator's `21c7c06` transcript commit; briefing docs `docs/session_63.md` + `docs/remediation-plan-session37.md` + `worklog.md` + `docs/session_64.md`). This session executes the session_63 next-step shortlist: the standing ledger re-checks (the TENTH /login wave after four consecutive quiet sessions — it finally arrived), the s4-defect + overflow ledgers, and the own-side audit candidates (the XFF-trust posture in `clientIp` — the leading candidate; the static-asset cache posture; the auth-bucket arithmetic).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro`` + the s14–s37 response-layer/bundle/write-path/proxy doctrines). This session's headline findings: **the TENTH /login wave arrived as a full module-graph rebuild** (the Rolldown re-hash: the /login pair rotated to `index-DubVZJFz.js` + `index-j9r1q4QJ.css`; `UserAppMain` renamed `CDMsumUd` → `BG9KtJ0q` — byte-identical after chunk-hash normalization, the login view code unchanged; a NEW `logoutReturnPath` chunk is OIDC-only — the email-password logout keeps the from_url carry, verified live); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 + mobile 468-vs-375 overflows all persist unchanged**; and the own-side audit found **one actionable gap: the XFF first-element trust in `clientIp` lets a client rotate its rate-limit key at will** (measured live: 30 rotating-XFF login attempts, zero 429s — the s21 rate limiter is the documented security superset over the reference, and the bypass defangs it behind a trusted proxy). Two shortlist items closed as non-gaps: the static-asset cache posture (measured equivalent — both sides ship ETag revalidation on the metadata surface and identical immutable windows on the hashed chunks) and the auth-bucket arithmetic (noted; this session adds no E2E login pins — the XFF pins go to the unit + smoke layers per the s21 zero-fixture doctrine).

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: THE TENTH /login WAVE ARRIVED (rotation, non-gap)

After four consecutive quiet sessions, the reference rebuilt its whole module graph: `/login` now serves `index-DubVZJFz.js` + `index-j9r1q4QJ.css`; the platform's chunk set re-hashed wholesale (AuthAPI `Ic7wCbYu` → `C44ikVxG`, AuthContext `BTluc1QR` → `CEid9Hxn`, axiosClient `oQdHWduI` → `DMoXBGGZ`, …); `UserAppMain` renamed `CDMsumUd` → `BG9KtJ0q` — but the two chunks are **byte-identical after chunk-hash normalization** (59075 bytes both): the login view code is UNCHANGED. The app-route pair STAYS on the old pre-s30 split (`index-DhFaB31Z.js` + `index-DFdILd41.css`). The login contract verified in the new sources: `from_url` ×1 in each of UserAppMain / AuthAPI / AuthContext / axiosClient (the s29+ re-split distribution) + the login-card string set. The reference's live logout measured: it navigated to `/login?from_url=https%3A%2F%2F…%2F` — the exact s37-mirrored carry. **A NEW `logoutReturnPath-HjtsxsFd.js` chunk appeared** (sessionStorage `base44_logout_return_path`) — decoded: it is set ONLY on the OIDC/SSO logout branch (`J(window.location.host)` returning an OIDC endpoint); the email-password branch (our parity surface) keeps `window.location.href = /login?from_url=<current href>` verbatim. The sessionStorage value measured null after our live logout — the OIDC path never ran. **Non-gap (rotation); the platform's OIDC surface is out of clone scope (the reference app's reachable auth for our credentials is email+password).**

### F2 — the chrome ledger holds (twentieth re-verification, non-gap)

All axes exact, both routes. `/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon) + og:image (the supabase render URL). `/dashboard`: plain viewport + NO PWA trio. Ours ships the documented viewport/PWA superset (the root layout's viewport-fit on every route + the PWA trio — pinned since s8/s11/s17). **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (twentieth measurement). Ours: **1280 = 1280**. **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned)

Their `468`-vs-`375` mobile overflow persists (twentieth). **The s4-documented toast-viewport blocking PERSISTS:** the REAL agent-browser click on the Toggle Sidebar button is covered by the `fixed top-0 z-[100]` toast-container band (`elementFromPoint(38,30)` = the toast div); the menu does NOT open on the reference. Ours: **375 = 375**, the REAL click opens the sheet (a 375px overlay), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh, both captures verified on-page before shooting): **LAYOUT-OK**. **Non-gap.**

### P1 — the own-side audit: the XFF-trust posture in `clientIp` (THE GAP)

The session_63 shortlist's leading candidate, measured live on the production standalone :3000:

| Probe | Result |
|---|---|
| **The rotating-XFF bypass** | 30 rapid login POSTs with a client-supplied `X-Forwarded-For: 1.2.3.<rotating>` → **ALL 401, ZERO 429s** — the rate limiter never fires. Each rotated first-element value mints a fresh in-memory bucket; the 10-per-15-min ceiling is never reached. **THE BYPASS** |
| **The control (no XFF)** | 11 rapid login POSTs from the same source → 401 ×9 then **429 at the 10th and 11th** — the s21 contract works when the key is stable. The limiter itself is healthy; only the KEY DERIVATION is spoofable |
| **The seam** | `src/lib/auth.ts` `clientIp()` takes `fwd.split(",")[0]` — the FIRST element. XFF is an APPEND list: each hop adds the socket address it saw to the END. The client controls the FRONT (it can send an arbitrary XFF prefix); the LAST element is the address the CLOSEST proxy observed. First-element trust = trusting the attacker |
| **The reference's posture** | Their platform shows no visible rate limiting at all (the s21 measurement: 20 reset requests + 12 login attempts, all non-429). Ours deliberately rate-limits — the documented security SUPERSET. The bypass defangs that superset behind any proxy that forwards client-supplied XFF |
| **The fix's trust model** | Take the RIGHTMOST element: behind the single TLS-terminating proxy that DEPLOYMENT.md documents (nginx/Caddy/Render — all APPEND the socket IP they saw), the rightmost is proxy-controlled truth and every client-chosen prefix is discarded. Direct (proxy-less) access has no trusted element at all — the socket address is not exposed to Next route handlers, so the header stays best-effort (documented; the limiter is a backstop, not a boundary) |

**The judgment call.** The user-visible scenario: an attacker brute-forcing the login endpoint behind the documented TLS proxy. Pre-fix: send `X-Forwarded-For: <random>` on every request → a fresh bucket per request → unlimited attempts (the s21 superset is void). Post-fix: the proxy appends the real socket IP → the rightmost is stable → exactly 10 attempts per 15 minutes per real client. The no-proxy dev posture is unchanged in trust level (a direct client's single-element XFF is still client-chosen — first or last, equally untrusted), so the fix is strictly-better-or-equal on every deployment shape. The `x-real-ip` fallback (the single-proxy alternative header, set by nginx) is already proxy-controlled and stays as-is.

### P2 — the static-asset cache posture (the s34 non-goal re-examined: NON-GAP)

Measured both sides: our metadata routes (`/icon.png`, `/apple-icon.png`, `/icon-512.png`, `/robots.txt`, `/sitemap.xml`, `/manifest.json`) ship `max-age=0` (+ ETag revalidation) — functionally equivalent to the reference's supabase-hosted icon surface (`cache-control: no-cache` + ETag). The hashed static chunks match EXACTLY: both sides serve `public, max-age=31536000, immutable` (`/_next/static/*` ours, `/static/*` theirs). The postures are equivalent; the deployment story's emergence does not change the verdict. **Non-gap — the shortlist item closes with no code change.**

### P3 — the auth-bucket arithmetic (noted, no code)

The E2E suite signs in 8 of the 10-per-15-min budget (the s37 note). This session's pins deliberately avoid the E2E layer: the clientIp change is a pure seam change, and the s21 doctrine (the smoke layer chosen for zero fixture cost — an E2E pin would burn the login budget and cascade-flake the suite) applies verbatim. **Documented note only.**

## 2. The remediation

### Component 1 — P1: the XFF rightmost-element trust (the rate-limit key hardening)

**Code change (one seam):**

`src/lib/auth.ts` — `clientIp()` takes the LAST element of the XFF list instead of the first:

```ts
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").at(-1)?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
```

with the ADR-grade comment: XFF is an append list; the client controls the front, the closest trusted proxy appends the real socket address to the end; the rightmost is the proxy-controlled value behind the single-proxy deployment DEPLOYMENT.md documents; a malformed/empty tail falls back to `unknown` (never to a client-chosen element). The `x-real-ip` fallback and the bare-`unknown` fallback are unchanged (both already pinned postures).

**Consumers (no changes needed — the seam is shared):** the three rate-limited routes (`/api/auth/login`, `/api/auth/signup`, `/api/auth/forgot-password`) all derive their keys through `clientIp`; the fix hardens all three at once.

**TDD (the honest RED → GREEN):**
- Unit pins FIRST in `src/lib/__tests__/auth.test.ts` (a new `describe("clientIp")` block — the seam was never unit-pinned; the s21 posture was documentation-only):
  - RED: `clientIp` with a multi-element XFF `"spoofed-prefix, 203.0.113.9"` → `"203.0.113.9"` (the rightmost — the current code returns the first: RED).
  - RED: `clientIp` with spaces `"client-a, client-b, proxy-seen"` → `"proxy-seen"` (trim + rightmost; RED).
  - Keep-pins (GREEN pre and post — the unchanged fallbacks frozen): a single-element XFF → that element; no XFF + `X-Real-IP: 10.0.0.99` → `"10.0.0.99"`; no headers at all → `"unknown"` (the s21 contract); an empty-string XFF tail → `"unknown"`.
- Smoke pins FIRST (the s38 block in `scripts/smoke-test.sh`, inserted after the s37 block, before the s21 rate-limiter section — XFF-keyed requests never touch the shared socket-IP bucket, so the s21 slot arithmetic stays exact):
  - **The bypass-closure pin (RED pre-fix):** 10 login POSTs with `X-Forwarded-For: attacker-<rotating>, 10.0.0.38` (the client-controlled prefix ROTATES; the proxy-appended suffix is STABLE — the simulated trusted proxy) → the first 10 answer 401 and the 11th answers **429 + Retry-After** (the bucket keyed on the stable rightmost). Pre-fix: each request mints a fresh first-element key → the 11th answers 401 → the pin's 429 assertion fails (RED).
  - **The injected-XFF shadowing pin:** 5 forgot-password POSTs carrying `X-Real-IP` but NO XFF → they key on the INJECTED socket IP (the shared bucket), so the 6th (no headers at all) answers **429** — if x-real-ip were the key, the 6th would land on a fresh bucket and answer 200. (The original plan called this an "x-real-ip forms its own bucket" pin — the mid-execution discovery below corrected the narrative; the test logic is identical and now claims the measured truth.)
  - Net: +2 smoke steps (104 → 106).
- **No E2E pins** (the P3 note — the s21 zero-fixture doctrine; the login budget stays at 8/10).

**The mutation check (post-GREEN, the belt-and-braces):**
- Mutation A: revert `clientIp` to the first element → the two RED-origin unit pins + the smoke bypass-closure pin fail (exactly the expected set).
- Mutation B: hardcode `"unknown"` on the XFF path → the rightmost pin + the single-element keep-pin + the smoke pins fail.
- Each observed, then reverted; the tree re-verified clean.

### Component 2 — the DEPLOYMENT.md XFF-trust documentation

Document the proxy contract the fix assumes (and its anti-patterns):
- The proxy MUST append the client IP to `X-Forwarded-For` (nginx `proxy_add_x_forwarded_for` / Caddy default / Render's platform proxy — all append). The app trusts the RIGHTMOST element; every client-chosen prefix is discarded.
- The anti-patterns: (1) a proxy that FORWARDS the client's XFF verbatim without appending (`proxy_set_header X-Forwarded-For $http_x_forwarded_for`) leaves the rightmost client-controlled — the bypass persists; (2) a proxy that REPLACES (`proxy_set_header X-Forwarded-For $remote_addr`) is also safe (the single element is the proxy-observed address).
- The `X-Real-IP` alternative (nginx's `proxy_set_header X-Real-IP $remote_addr`) — honored as the fallback by the seam (unit-pinned), though the standalone's own XFF injection makes it unreachable in that deployment shape (Component 3).
- The no-proxy caveat: the socket address is not exposed to Next route handlers; direct access has no trusted element — the limiter is a backstop, not a boundary (unchanged from the s21 doctrine).

### Component 3 — the mid-execution discovery: the standalone's XFF injection (P1b)

While proving the GREEN live, two measurement anomalies (a mysteriously-exhausted "unknown" bucket; an x-real-ip fallback that appeared dead) triggered a root-cause investigation (the s37 doctrine: a failing verification is a FINDING, not noise). A temporary debug route (built, measured, then removed — never committed) established the platform ground truth:

- **The standalone Next server INJECTS `X-Forwarded-For: <socket address>` into every request that arrives without one** (plus `X-Forwarded-Host`/`-Port`/`-Proto`), and passes a client-sent XFF through VERBATIM (no append). Measured under both runtimes (node and bun — identical).
- Consequence (a): the `x-real-ip` fallback in `clientIp` is **unreachable behind the standalone** — the injected XFF always wins the precedence. The fallback remains for other hosting shapes and stays unit-pinned.
- Consequence (b): honest direct clients (no XFF forging) key the limiter on their **REAL socket IP** — the no-proxy posture is STRONGER than the s21 "unknown" narrative documented. The only no-proxy bypass left is deliberate XFF forging — inherent to the web-Request API, closed by the appending proxy per DEPLOYMENT.md.
- The rightmost-element fix is UNAFFECTED (it operates on whatever XFF value is present — injected or proxied); the discovery refines the documentation and the pin narratives, not the code.

**Narrative corrections (the honest-pins doctrine):** the smoke pin 2 and the live-verify sections were rewritten to claim the measured truth (the injected-XFF shadowing + the socket-IP keying) instead of the planned-but-false "x-real-ip forms its own bucket" / "the unknown key fires" claims. The test LOGIC is unchanged (the assertions already distinguished the real behavior); the claims now match. The unit pins are unaffected (the seam's branch logic is honestly pinned at the unit layer where no injection occurs).

**The operational lesson (recorded in CLAUDE.md's s38 anti-pattern):** the investigation was initially misled by a stale-server artifact — `pkill -f "standalone/server.js"` does NOT match the Next server process (Next rewrites its process title to `next-server (v16.x)`), so "restarts" silently no-opped and old builds/buckets kept serving. The doctrine: kill by the PID from `ss -tlnp` (or `pkill -f "next-server"`), then verify the port is free before rebooting.

### Component 4 — the docs alignment (the standing set)

README (the counts 172 unit + 106 smoke + the s38 lines), AGENTS.md (the session-38 contracts section + the commands-table smoke description), CLAUDE.md (the counts + the s38 lesson — the append-list trust model), PAD (§7.1 + the checklist + the known-issues row), `service-desk_SKILL.md` v2.36.0 (lesson 92), `docs/session_65.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.

## 3. Non-goals (documented decisions, no code)

- **No socket-IP derivation:** Next's route handlers expose no socket address (the web-standard Request). XFF/x-real-ip is the platform's ceiling — the rightmost-element trust is the strongest posture available at the app layer; the no-proxy caveat is documented rather than papered over.
- **No trusted-proxy-count configuration:** the rightmost is correct behind exactly ONE trusted proxy (the DEPLOYMENT.md story). A multi-hop chain would need a configurable hop count — deferred until a deployment story requires it (the documented single-proxy posture is the measured reference deployment shape).
- **No OIDC logout surface:** the reference's new `logoutReturnPath` chunk is platform OIDC-only (sessionStorage set exclusively on the OIDC branch). Our clone's auth surface is email+password; the s37 from_url carry is the measured parity behavior for that surface. Out of scope.
- **No cache-posture change:** P2 measured both sides equivalent (ETag revalidation both; the immutable hashed-chunk windows identical). The s34 non-goal verdict stands under the emerged deployment story.
- **No rate-limit ceiling change:** the 10/15-min (login) and 5/15-min (forgot) windows and the 429 contract (status + Retry-After + message) are s21-frozen; only the KEY DERIVATION changes.
- **No E2E login pins:** the auth budget stays 8/10 (the s37 arithmetic); the unit + smoke layers are the honest pin layers for a seam change (the s21 doctrine).

## 4. The verification plan

1. **TDD RED:** write the unit pins (2 RED + 4 keep) + the smoke s38 block (2 pins) → observe the RED set against the current tree (the unit rightmost pins fail on the first-element return; the smoke 429 assertion fails on the rotating-prefix bypass).
2. **GREEN:** the `clientIp` fix (one seam) → the unit pins green (172 unit), the smoke block green (106 steps).
3. **The mutation check:** mutations A/B each prove the pins bite; revert; re-verify (the full unit suite clean).
4. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (169 + ~3 net new) → build → E2E (198 — no change; the login budget untouched) → smoke (104 + 2).
5. **Live re-verification** on the production standalone :3000: the NEW `scripts/s38-live-verify.mjs` (the rightmost-element derivation matrix, the LIVE bypass closure — the rotating-prefix + stable-suffix exhaustion at the 11th, the no-XFF s21 contract intact, the x-real-ip fallback, the login set-cookie attributes on this session's build, the s37 invalid-cookie bounce re-verified, the seed canonical after) + re-runs of the s24–s37 standing live-verify scripts (the rate-budget doctrine: restart the server for fresh buckets between batches, one script at a time with full output).
6. **The UI round-trip** (real login → dashboard → submitticket → submit → the toast → mytickets → the probe cleaned) + the mobile matrix on the new build (375=375, the real click opens, Escape closes, nav-tap auto-close + navigate) + the desktop paired VLM check.
7. **Screenshots:** the 10-shot set refreshed via `scripts/capture-screenshots-s38.sh` (the s37 lineage + the header + the fixture title S38); VLM spot-checks on the convention shots.
8. **Docs alignment** (Component 3) + `.env.example` re-verified against the codebase.
9. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status, push the final status commit.

## 5. Execution status

- [ ] Gap analysis (F1–F5 + P1/P2/P3) — complete, recorded in worklog task 100-gap-s38
- [x] The TDD RED (the unit pins + the smoke s38 block, each observed failing against the pre-fix tree — 3 unit pins RED on the first-element return; the smoke 429 assertion RED on the rotating-prefix bypass)
- [x] The GREEN (the clientIp rightmost-element fix) — the full gate re-verified: lint ✓ typecheck ✓ 175/175 unit ✓ build ✓ 198/198 E2E ✓ smoke 106 ✓
- [x] The mutation check (A/B observed, reverted, re-verified — A bit exactly the 3 rightmost pins; B bit the rightmost/trim/single-element set)
- [x] Full gate in the clean environment (no ambient :3000/:3100/:3999)
- [x] Live re-verification: the s38 matrix 10/10 + the standing re-runs (s24–s37 ALL GREEN; s33 after a fresh-bucket restart per the doctrine) + the UI round-trip (the toast + the navigation + the probe cleaned) + the mobile matrix (real clicks) + the VLM check (LAYOUT-OK on the new build)
- [x] Screenshots (the 10-shot set via capture-screenshots-s38.sh, all FATAL guards passed; VLM 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.36.0/DEPLOYMENT/session_65.md/plan/worklog) — plus the P1b discovery recorded (the standalone's XFF injection) + the pin narratives corrected
- [x] Commit + push + CI verification — `221141a` pushed to main via `docs/ssh_git_wrapper_v3.py` (the paramiko shim at /home/z/my-project/bin/ssh on PATH, paramiko 5.0.0; the key fingerprint verified BEFORE the push — SHA256:3ddaNlFhMz1JXiGEDgVEaRsUzI4Ev0IpGEEB7NnU4PU, byte-identical to the s30–s37 records; the dry-run green first with the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson held; the real push verified: remote == local HEAD @ 221141a, tracking synced, main only, tree clean; the operator key + the wrapper's temp key both shredded — no residue) — **the CI run on the push (run 38222837506 on 221141a) completed SUCCESS** (verified via the GitHub API runs-list endpoint; the prior runs on 21c7c06 (38217641463), 34eb70a (38212469522) + afc3a25 (38209295092) also green)
