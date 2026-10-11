# ServiceDesk — Session 33 Remediation Plan

**Date:** 2026-10-12
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 33 follows the session-32 remediation (commits `87a15cf` + `bbd8a1d` + `3252290`; briefing docs `docs/session_53.md` + `docs/remediation-plan-session32.md` + `worklog.md` + `docs/session_54.md`). This session executes the session_53 next-step shortlist: the standing ledger re-checks (the seventh /login wave? the app-route pair on the old split? the s4-defect + the desktop overflow against their newest rebuild) and the own-side audit at the NEW level — **the content-negotiation surface** (the session_53-named third candidate), plus the two sibling candidates measured alongside it (the cookie-attribute mutation surface + the concurrency surface).

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s32 response-layer/bundle/write-path doctrines). This session's headline findings: **the /login pair rotated a SEVENTH time — both halves again, the third consecutive both-halves wave — while the app-route pair STAYS on the old pre-s30 split** (unchanged since s31); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 overflow + their mobile 468-vs-375 overflow all persist unchanged through the new bundle wave**; and the s53-directed content-negotiation audit measured **every unknown path under `/api/**` serving the FRAMEWORK's HTML 404** (content-type `text/html`) — `/api/banana`, `/api/auth/banana`, `/api/tickets/xyz/banana`, `/api` bare, and every method variant — the last non-JSON surface in the API namespace, and the exact content-type-level variant of the s27/s32 grammar doctrine (a JSON client hitting a mistyped route gets an HTML body it cannot parse). The two companion axes measured clean-but-unpinned: the cookie-attribute set under mutation (login/signup/logout all `Path=/; Max-Age; Secure; HttpOnly; SameSite=lax` — pinned at the s30 audit level but never at the attribute level) and the concurrency surface (33 parallel mutations across three probe shapes, all 2xx, final state coherent, no SQLITE_BUSY).

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: the seventh /login rotation (both halves) + the app-route pair stays on the old split (non-gap)

The /login pair rotated a SEVENTH time since s24 — both halves again, the third consecutive both-halves wave: JS `index-Bp10hac5.js` → `index-DKhUPeaf.js` AND CSS `index-pXNNffyR.css` → `index-C15ZH32J.css`. `UserAppMain` renamed `BN_RuQ68` → `C1OAwpzh` (the chunk now at `/static/UserAppMain-C1OAwpzh.js`). The login contract verified in the new bundle source: all five strings ("Sign in to continue" / "Forgot password?" / "Need an account" / "Sign up" / "Google") + `from_url` ×1 in UserAppMain + ×1 in each of AuthAPI/AuthContext/axiosClient (the s29+ re-split distribution); the session's own live login ran through the new bundles. The app-route pair — which s31 found RE-SPLIT to the old pre-s30 pair — **STAYS on that split**: `/` (dashboard) serves `index-DhFaB31Z.js` + `index-DFdILd41.css` (verified live in the authenticated page's script/link tags), unchanged from s31/s32. **Rotation, behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (fifteenth re-verification, non-gap)

All axes hold exactly, both routes: `/login` — viewport-fit=cover + the PWA trio (manifest + theme-color #000000 + apple-touch-icon) + the apple pair + og:image 1200×630 with "Base44 link preview" alt + twitter:card summary_large_image + canonical/og:url/twitter:url at `/login`; `/` (dashboard) — plain viewport + NO PWA trio + the apple pair + canonical/og:url/twitter:url at the origin root. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At desktop 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (the same four decorative gradient blobs anchoring `right-0` to the un-clipped wrapper — fifteenth measurement). Ours: **1280 = 1280** (the `min-w-0` superset holds at desktop). **Their defect documented, NOT cloned — ours the working superset.**

### F4 — the mobile matrix + the s4-defect re-check: it persists unchanged (their defect, NOT cloned)

Their standing `468`-vs-`375` mobile overflow persists (fifteenth). **The s4-documented toast-viewport blocking PERSISTS through the seventh rotation — the geometry unchanged from s32:** the Toggle Sidebar button (rect 24,16 → 52,44) has its center (38,30) inside the `fixed top-0 z-[100]` toast-container bands; the `elementFromPoint` hit-test lands on the container; **agent-browser itself REFUSES the click** ("Element 'header button' is covered by `<div.fixed.top-0…>`") and the menu does NOT open (0 dialogs). Ours: **375 = 375**, the button hit-tests to the BUTTON itself, the real click opens the sheet (Dashboard / Submit Ticket / My Tickets), Escape closes it, and a nav-tap auto-closes + navigates to `/mytickets` with the correct title. **Their defect documented, NOT cloned — ours is the working superset. Non-gap.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in, glm-4.6v) verdicts **LAYOUT-OK** — no meaningful layout difference observed (only dynamic data content, excluded by contract). **Non-gap.** (Probe hygiene: the session's first comparison accidentally captured our `/mytickets` — the VLM flagged it as LAYOUT-DIFF, proving the paired check validates the operator's capture too; re-captured the dashboard → LAYOUT-OK.)

### P1 — the own-side audit at the new level: the content-negotiation surface (THE actionable gap)

The s53 directive named the third candidate axis: what does the API namespace serve under content negotiation? Measured live on our production standalone :3000:

| Probe | Result |
|---|---|
| `Accept: text/html` on `/api/tickets` (authed) | 200 + `application/json` — correct (known routes ignore Accept) |
| `Accept: application/xml` on `/api/health` | 200 + `application/json` — correct |
| 405 matrix on API routes (`DELETE/PATCH/POST /api/health`) | 405, empty body, no content-type — the s32 framework standard |
| trailing slash (`/api/health/`) | 308 → `/api/health` — the framework standard redirect |
| **`GET /api/banana`** | **404 + `text/html` — the framework's HTML 404 page** |
| **`GET /api/auth/banana`** | **404 + `text/html`** |
| **`GET /api/tickets/xyz/banana`** | **404 + `text/html`** |
| **`GET /api` (bare)** | **404 + `text/html`** |
| **`HEAD` / `OPTIONS` on the same unknown paths** | **404 + `text/html`** |

**The reference measured for comparison:** their unknown paths — including their API paths (`/api/banana`, `/entities/Banana`) — serve the SPA HTML shell at **200** (the s11-documented SPA catch-all class: their client-side router cannot know a route is invalid until after auth; platform exhaust, never mirrored). They have no server-side JSON 404 concept at all.

**The judgment call.** Our ENTIRE API namespace speaks JSON — every known route's success AND error path (`{error}` / `{error, errors}` envelopes, the s32 pins; `application/json;charset=utf-8` on every response including the 401/403/404/400/405 matrix) — EXCEPT the unknown-path 404, which serves the framework's human-facing HTML 404 page. A JSON client (`fetch` → `response.json()`) that hits a mistyped route (`/api/tikets`, a stale deployment's removed route, a client bug) gets a 200-byte HTML document it cannot parse, with no self-documenting message. This is the content-type-level variant of the s27/s32 grammar doctrine: the API's CONTRACT is JSON end-to-end; the unknown-path 404 is the last HTML speaker under `/api/**`. The pages keep the designed HTML 404 (the s4 contract — humans get the human page); the API namespace gets the JSON 404. **Our superset, never mirroring their SPA-shell 200.**

### P2 — the cookie-attribute surface under mutation (clean but unpinned — closed with pins)

Measured live on all three mutation paths: login set-cookie `servicedesk_session=<hmac>; Path=/; Expires=…; Max-Age=604800; Secure; HttpOnly; SameSite=lax`; signup set-cookie — the identical attribute set; logout clear-cookie — `Path=/; Max-Age=0; Secure; HttpOnly; SameSite=lax`. Matches the s30 audit exactly (clean). **But the pins only assert the cookie WORKS** (the login + me round-trip) — a future refactor dropping `Secure`, `HttpOnly`, or `SameSite=lax` from either the set or the clear path ships with no test failing (the s31/s32 clean-but-unpinned class). Closed with three attribute-level smoke pins.

### P3 — the concurrency surface (clean but unpinned — closed with pins)

Measured live with three probe shapes on one ticket: 10 parallel comments (all 201), 10 parallel PATCHes with interleaved status flips (all 200), and a mixed wave of 13 mutations (5 comments + 5 PATCHes + 3 creates — all 2xx); final state coherent (exactly 15 comments on the probe ticket — 10 + 5, the exact count; a valid status; no SQLITE_BUSY / P2024 anywhere). Prisma's SQLite driver handles the busy behavior (the connection pool serializes writers with the busy timeout). **Clean but completely unpinned** — the class where a future Prisma upgrade or pool-size change could introduce SQLITE_BUSY flakiness with no test failing. Closed with a parallel-mutation smoke block.

## 2. The remediation (P1 TDD + P2/P3 pins)

### P1 — the API-namespace JSON 404 catch-all (`src/app/api/[[...path]]/route.ts`)

**The design:** one optional catch-all route handler at the `/api` segment root, mirroring the s32 envelope convention:

1. `src/app/api/[[...path]]/route.ts` exports `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` — every one returning `NextResponse.json({ error: "API route not found" }, { status: 404 })`. The constant message (no path reflection — deterministic for pins, zero reflection surface). `HEAD` derives from `GET` automatically (the framework's auto-HEAD on GET handlers — the body is stripped by the HTTP layer; the smoke pin verifies it live).
2. **The optional catch-all (`[[...path]]`, not `[...path]`)** catches BOTH the nested unknowns (`/api/banana`, `/api/auth/banana`, `/api/tickets/xyz/banana`) AND the bare `/api` segment. Next's route precedence keeps every known route in front (static segments and dynamic segments beat catch-alls) — zero shadowing.
3. **The 404-by-path fires before auth and before any body grammar** — an unknown path is unknown regardless of session or payload (no rate-limiter interaction: the limiter lives on the known login/forgot routes).
4. **The s30 universal header set carries** (the `/(.*)` `headers()` rule in `next.config.ts` applies to the catch-all response — HSTS + nosniff + X-Frame-Options + Referrer-Policy, no X-Powered-By; the smoke pin asserts HSTS on the 404).
5. **Unit pins** (`tests/api-catchall.test.ts` — a new test file at the handler seam, importing the route module and calling the exported handlers with a synthetic `Request`; the route module is pure — no db import): each method → 404 + `application/json` + the `{error}` envelope exactly (the key set is exactly `["error"]` — the s32 envelope convention extended to the catch-all) + the constant message.
6. **Smoke pins** (the s33 block): the unknown-path matrix — `GET /api/banana`, `GET /api/auth/banana`, `GET /api/tickets/xyz/banana`, `GET /api` (bare) → 404 + `application/json` + `{error}` + HSTS; `HEAD /api/banana` → 404 + the header set + an empty body; `OPTIONS /api/banana` → 404 + the JSON body (NOT the framework's 204-with-allow — a nonexistent path has no method set); and the non-shadow re-pins — `/api/health` still 200 + JSON, `/api/auth/me` still 401 + JSON (unauthenticated), and the real-ticket detail GET still 200 (the known-route families in front of the catch-all).
7. **Rate-limiter arithmetic UNCHANGED:** the catch-all pins hit no rate-limited route (login/forgot); the cookie pins reuse the existing top-of-script login (via a `-D` header dump added to the existing call — zero new requests) + a fresh signup (user C — signup is not rate-limited) + user C's logout (not rate-limited). The s21 429 pins keep their exact slot bookkeeping.

**The RED phase (a true TDD RED):** the catch-all route does not exist — the unit pins written first GENUINELY fail (the module import fails against the current tree), and the smoke probes measure the HTML-404 behavior (`text/html` + the `<!DOCTYPE html>` body) against the JSON expectations. RED captured → implement the route → GREEN.

**Non-goals (documented decisions, no code):** no change to the PAGES' designed HTML 404 (`src/app/not-found.tsx` — the s4 human-facing contract stays for non-API paths); no path reflection in the error message (constant string; a reflected path is debugging sugar with a reflection surface); no `405`-on-unknown-path (a nonexistent path 404s for every method — the OPTIONS export exists precisely to prevent the framework's 204-with-allow from implying the path exists); no change to the trailing-slash 308 (the framework standard, consistent with the pages); no JSON 404 for non-API paths (the JSON namespace boundary is exactly `/api/**`).

### P2 — the cookie-attribute pins (the s33 smoke block, pins only)

Three attribute-level pins: (1) the login set-cookie — captured from the existing top-of-script login call via the added `-D` header dump (zero new requests, zero slot shifts) — asserts `Path=/`, `Max-Age=604800`, `Secure`, `HttpOnly`, `SameSite=lax`; (2) the signup set-cookie — a fresh signup (user C, throwaway-db user, no cleanup needed — the smoke db is deleted at the end) with `-D` — asserts the identical attribute set; (3) the logout clear-cookie — user C's logout with `-D` — asserts `Path=/`, `Max-Age=0`, `Secure`, `HttpOnly`, `SameSite=lax`. The attribute contract documented in the plan + AGENTS.md (the s30 audit values, now pinned at the attribute level across all three mutation paths).

### P3 — the concurrency pins (the s33 smoke block, pins only)

A parallel-mutation block on the smoke ticket (owned by the demo session): (1) 5 simultaneous comments via background curls + `wait` → all 201, then the detail GET embeds exactly the pre-count + 5 comments (counted via the API's JSON — the coherent-final-state assertion); (2) 5 simultaneous PATCHes (interleaved status flips) → all 200. The pins prove SQLite-under-Prisma's busy handling holds under the suite's own concurrency budget (a future driver/pool regression fails a pin instead of flaking in production).

## 3. The verification plan

1. **TDD RED:** the unit pins written first (`tests/api-catchall.test.ts` — the module import fails against the current tree) + the smoke probes run against the current build measuring the HTML-404 behavior.
2. Implement the catch-all route; unit suite → 119 + N green.
3. The full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → unit → build → E2E 196 → smoke (76 + the s33 lines).
4. Live re-verification on the production standalone :3000: the catch-all matrix re-run by hand + re-runs of the s24–s32 standing live-verify scripts (all green = the nine prior sessions' contracts hold on the current build).
5. The UI round-trip (the real login → dashboard → mytickets flow) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, nav-tap auto-close + navigate) + the desktop paired VLM check.
6. Screenshots (the 10-shot set) refreshed to `docs/screenshots/`; VLM spot-checks on the standing convention shots.
7. Docs alignment: README (the smoke count + the s33 notes), AGENTS.md (the session-33 contracts section + the commands table + the reference list through s33), CLAUDE.md (the counts + the smoke line + the s33 anti-pattern), PAD (§7.1 the smoke row + the s33 known-issues row), `service-desk_SKILL.md` (the new lesson), `docs/session_55.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.
8. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 4. Execution status

- [x] Gap analysis (F1–F5 + P1–P3) — complete, recorded in worklog task 80-gap-s33
- [x] P1 TDD (a TRUE RED): the 19 unit pins written FIRST (`tests/api-catchall.test.ts` — the module import fails → **19 tests RED**, `Cannot find package '@/app/api/[[...path]]/route'`) → the catch-all route implemented (`src/app/api/[[...path]]/route.ts` — six explicit method exports + the HEAD-from-GET derivation + the explicit OPTIONS export) → **138 unit GREEN** → the s33 smoke block (9 pins: the 4-path catch-all matrix + HSTS, the HEAD empty-body via `%{size_download}`, the OPTIONS 404-not-204, the non-shadow re-pins, the three cookie-attribute pins, the 5+5 concurrency pins) + the login `-D` capture on the existing top-of-script login (zero extra requests — the 429 slot arithmetic UNCHANGED) + the smoke-script failure-path hardening (the trap now removes db/smoke.db — a mid-run FAIL used to poison the next run's filter pins) → rebuild → **GREEN: 85 PASS lines** (the standing 76 + the 9 new s33 pins), 0 failures
- [x] Full gate in the clean environment: lint → typecheck → 138 unit → build → 196/196 E2E → smoke 85 — ALL GREEN; seed canonical after
- [x] Live re-verification: the standing re-runs ALL GREEN (s24 ALL GREEN + s25 13 + s26 15 + s27 14 + s28 12 + s29 22/22 + s31 14/14 + s32 18/18) + the NEW s33 live matrix (`scripts/s33-live-verify.mjs`, 24/24 — the 5-path catch-all matrix + HSTS, the method variants, the non-shadow re-pins, the trailing-slash 308, the pages' HTML 404 preserved, the three cookie-attribute sets, the 5+5 concurrency, fixtures cleaned, seed canonical) + the UI round-trip (login → dashboard stat cards + QUICK STATS + Performance Metrics + Average Resolution Time + Recent Tickets → /mytickets with the 5 demo tickets) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, Escape closes, nav-tap auto-closes + navigates) + the desktop paired VLM check (LAYOUT-OK; one rate-budget lesson re-learned — the re-runs exhausted the login bucket mid-session, server restarted for fresh buckets, the standing doctrine)
- [x] Screenshots (the 10-shot set via `capture-screenshots-s33.sh`, the s32 lineage verbatim; VLM shots 02 + 05 LAYOUT-OK; seed canonical after) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.31.0 lesson 87/session_55.md/plan/worklog)
- [ ] Commit + push + CI verification
