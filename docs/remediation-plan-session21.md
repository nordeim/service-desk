# ServiceDesk — Session 21 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of all identified gaps, and full re-verification. Session 21 follows the session-20 remediation (commit `891bc75` + the operator's transcript commit `fefa76a`; briefing docs `docs/session_29.md` + `docs/remediation-plan-session20.md` + `worklog.md` + `docs/session_30.md`). This session executes the session_29/30 next-step shortlist: the reference's OAuth return path (the cancelled-flow shape), the rate-limiter surface on their auth endpoints, and the standing drift-ledger re-check.

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes (per `skills/clone-app-pat-pro` + the s14–s20 response-layer/bundle/value-sweep doctrines). This session's headline surface: **the auth flow's response layer** — the OAuth cancel path, the throttling behavior, the error/response envelopes — plus the standing chrome/mobile/TW-v4 re-verification.

**Baseline at session start (`fefa76a`, the pulled-forward workspace):** lint ✓ typecheck ✓ 65 unit ✓ build ✓ **196/196 E2E in the clean environment** (:3000 confirmed down before the run — the CI-equivalent condition) ✓ smoke 11/11 ✓. The GitHub CI badge reads **"CI - passing"** (the s20 push held green). Environment contract verified standing (`.env` with `DATABASE_URL="file:../db/custom.db"` + generated `AUTH_SECRET`, `db/` at the repo root pushed + seeded 4/11/3/0 canonical, `skills/` excluded in all 4 configs by construction, npm scripts pinning `DATABASE_URL` inline, `.env.example` matching the codebase, the Playwright 1248 chromium build installed). The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session).

---

## 1. Findings Inventory

### F1 (LOW — first measurement, documentation): the OAuth cancel path returns a CLEAN login remount; the from_url survives the cancel

**The reference's live-measured behavior (the s20 shortlist probe — the Google flow's RETURN path, never followed until this session):**
- Entering the Google OAuth flow (the s20-measured `accounts.google.com` authorization-code entry) and navigating BACK (browser-back) returns the reference to a **clean signin card**: no error state, no toast, no URL residue (plain `/login`), title = the root default "ServiceDesk". The cancel is stateless — the SPA simply remounts at `/login`.
- From a **deep-link entry** (`/mytickets` → bounce → `/login?from_url=…/mytickets` → Google), the back returns to `/login?from_url=<deep-link>` — **the from_url SURVIVES the OAuth cancel round-trip** (the login state is preserved through the navigation history entry).
- The OAuth `state` param carries the deep-linked from_url (measured: `state={"domain":…, "from_url":"…/mytickets", "app_id":…}` when entered from a bounce) — extending the s20 F1 measurement beyond the login-at-rest entry.

**Our behavior:** the Google button renders the truthful alert (re-verified live this session) and **never navigates** — there is no cancel path to mirror. The zero-third-party-auth doctrine STANDS; the measured cancel shape is recorded as the spec if a real integration is ever wanted (the s20 F1 doctrine extended with the return path).

**Decision: documentation finding — no action.** The cancel-path contract (clean remount, no error UI) joins the s20 F1 ledger entry.

### F2 (LOW-MED — first measurement, documentation + the P1 pin): the reference's auth endpoints show NO visible rate limiting; our limiter is the unpinned security superset

**The reference's live-measured behavior (curl on their public API, the verb the browser uses):**
- `POST /api/apps/{id}/auth/reset-password-request`: **20 sequential requests in ~1 minute, ALL 200** — no visible throttle at any volume a real user session produces. The response is the anti-enumeration shape: `{"message":"If an account exists with this email, you will receive a password reset link."}`.
- `POST /api/apps/{id}/auth/login` (wrong password, non-existent account): **12 attempts, ALL 400** — no visible throttle. The error envelope is their FastAPI backend's: `{"error_type":"HTTPException","message":"Invalid email or password","detail":"Invalid email or password","traceback":"","request_id":null}`.
- Their successful-login response carries `{user, success, access_token (a JWT in the response body — client-side storage), country_code: "HK" (login geolocation)}` and the user record includes `last_active`, `is_verified`, `force_password_reset` — the platform-exhaust surface (s17's `last_active` finding extended to the response layer).
- Their wrong-password **status is 400** (FastAPI convention), not 401; ours is 401 with `{error:"Invalid email or password"}` — semantically correct (401 = authentication failure), and the UI-visible message is identical on both sites.

**Our behavior (all standing, verified this session):**
- The login bucket: 10 attempts/IP/15 min → the 11th returns **429 + `Retry-After` + "Too many attempts. Try again in N minutes."** (`src/app/api/auth/login/route.ts`).
- The forgot bucket: 5/15 min (its own `forgot:${ip}` key) → 429 + `Retry-After` (`src/app/api/auth/forgot-password/route.ts`).
- Session: httpOnly HMAC-SHA256 cookie — no token in the response body, no geolocation, no `last_active` (the zero-third-party-auth + data-privacy doctrine).

**Decision: the doctrine STANDS — the reference's missing limiter is a platform gap, not a parity target (the security-superset posture: ours is deliberately stricter).** But the measurement surfaced a coverage gap on OUR side: the 429 response contract is pinned NOWHERE (the unit seam `rateLimit` is tested; the API surface — the status, the `Retry-After` header, the message — has no test). **→ P1 below.** The E2E layer cannot pin it: burning 11 login attempts would consume the entire rate budget and cascade-flake the suite (the budget doctrine); the smoke script's throwaway server with its fresh in-memory bucket is the correct layer.

### F3 (verified non-gap): the s19/s20 drift ledger holds EXACTLY — no new drift wave

Fresh hard-loads, clean logged-out context (the browser, not curl — their head is client-injected):
- **The app routes** (`/dashboard`, `/mytickets`, `/submitticket`, `/ticketdetails`): the PWA trio (theme-color #000000 + manifest link + apple-touch-icon) + og:image:width/height **ABSENT** on all four; viewport-fit **absent**; `mobile-web-app-capable` "yes" + `apple-mobile-web-app-title` "ServiceDesk" + `apple-mobile-web-app-status-bar-style` "black" + the og/twitter/canonical core set **present** on all four; `/dashboard` canonical = the ORIGIN ROOT (their home special case); titles segment-verbatim ("Mytickets | ServiceDesk" …).
- **`/login`**: the PWA trio + og:image:width/height 1200/630 + `viewport-fit=cover` **present** (the auth-pages-only pattern — the s19 ledger, unchanged).
- **`/forgotpassword`**: still the empty SPA scaffold (7263 bytes, no title, root div only) — our real page is the documented URL superset.
- Ours ships the uniform superset on every axis (the standing doctrine).

### F4 (verified non-gap, fresh axis — first measurement): the HTTP security-header set — ours is the superset

- **The reference** (both /login and /dashboard): `referrer-policy: strict-origin-when-cross-origin`, `strict-transport-security: max-age=31536000` (their HTTPS edge), `x-content-type-options: nosniff`. **NO X-Frame-Options. NO Permissions-Policy.**
- **Ours** (production standalone): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` — plus `Cache-Control: s-maxage=31536000` on the static /login. HSTS is a TLS-edge concern (documented for the deployment layer, inert on plain-HTTP localhost).
- **Decision: verified superset — no action** (the reference's missing clickjacking/permissions headers are their platform gap, not a parity target).

### Verified NON-gaps (re-checked this session, no action)

- **The mobile matrix (the user's standing priority), both sides:** the reference at 375×812 renders their standing **468-vs-375 overflow defect**; their sheet contracts identical to ours (288px, `rgb(250,250,250)`, 80% overlay, body lock); their sheet **STAYS OPEN after nav-tap** (their standing defect — worked around via the JS dispatch, their toast viewport still blocks their own trigger). Ours: **375=375 AND 390=390** (the min-w-0 superset), the sheet 288px/`oklab(0 0 0 / 0.8)`/body-lock, nav-tap **auto-closes + unlocks + navigates** (the superset). The mobile-navigation E2E suite green (part of the 196/196).
- **The Tailwind v4 guards all standing** (`@theme inline` semantic tokens, the button-cursor preflight in `@layer base`, the v3 radius scale with the 4px `--radius-sm`, the pinned system font stack, no `tailwind.config.js`) — verified in `globals.css` this session; zero v4-related regressions in the mobile navigation (geometry, overlay, animation contracts all green).
- **The bundle sweep clean:** the reference's `index-DhFaB31Z.js` (same content hash as the s20 sweep) + `index-DFdILd41.css` — no new chunks, no new user-facing features (`notification` 0 hits; `whileHover` library-internals only; the admin route set unchanged; `last_active` still the admin-gated heartbeat).
- **The standing visual pins stable on the reference (live):** the sidebar nav (Dashboard/Submit Ticket/My Tickets), the quick stats (Open/In Progress/ Total), the CTAs (Report New Issue / View All Tickets), the recent rows (h3 titles + the FileText tile + the arrow + bare lowercase badges "open"/"medium" + date-only dates — the DOM class set matches the pinned contracts), the detail badges (status + "medium priority" with the word + category "software"). Our side verified to match (the "urgent priority" detail badge + the bare recent-row badges).
- **Our Google button renders the truthful alert** (re-verified live): "Google sign-in is not configured in this deployment. Use email and password."

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; no-fake-verification signup; permanent SQLite attachment storage; nav-tap auto-close; correct SPA titles + route-correct head; `private` cache scope on the owner-scoped attachment route; UTC-pinned formatters (s15); the reduced-motion a11y superset; the unmeasured admin surface (s16 F3); the cheaper `/api/stats` aggregate; no `last_active` heartbeat (s17 F3); the truth-telling og:image/favicon assets (s17/s18); the proper-cased per-route titles; the uniform viewport-fit=cover (s18); the uniform PWA trio + og:image dims/alt (s19); the segment-canonical dashboard (s19); the truthful not-configured Google button (s20 F1); the exact-route gate + public 404s + real /signup (s20 F2); **the httpOnly HMAC cookie over their JWT-in-body + geolocation + last_active response surface (s21 F2)**; **the 401 + `{error}` envelope over their 400 + FastAPI envelope (s21 F2 — semantically correct status, UI-identical message)**; **the rate-limited auth endpoints over their unthrottled surface (s21 F2 — the security superset)**; **the X-Frame-Options + Permissions-Policy header superset (s21 F4)**.

---

## 2. Execution Plan (TDD)

1. **P1 — the rate-limiter smoke guard (a regression pin, the coverage-addition class):** extend `scripts/smoke-test.sh` with the 429-surface check block (after the validation guard, before the cleanup):
   - **Login bucket:** the earlier demo login consumed slot 1; POST 9 wrong-password logins (slots 2–10, each 401); the 11th POST must return **429**, carry the **`Retry-After` header**, and the body "Too many attempts".
   - **Forgot bucket (its own `forgot:${ip}` key):** POST 5 forgot-password requests (all 200 — the anti-enumeration shape); the 6th must return **429** + `Retry-After`.
   - The buckets live in the throwaway server's memory (fresh per run) — the pin cannot affect the E2E suite or the dev database. The E2E layer deliberately does NOT pin this (the budget doctrine: burning 11 login attempts would cascade-flake the suite).
   - **RED check (the designed failure mode):** the pin's assertions (`[ "$CODE" = "429" ]`, the Retry-After grep) fail against any build whose limiter is removed or broken — the 11th request returns 200/400/401 instead. Expected GREEN on first run (the behavior is live-verified by the unit seam + the standing deployment); this is a coverage addition in the s18-favicon-pin class, not a bug fix.
2. **Full gate in the CLEAN environment** (no ambient :3000): `bun run lint && bun run typecheck && bun run test && bun run build` → `bun run test:e2e` (**196 expected — unchanged; the pin is smoke-layer only**) → `bash scripts/smoke-test.sh` (**13 PASS lines expected: the standing 11 + 2 new rate-limiter checks**).
3. **Live paired re-verification** (production standalone :3000): the s20 live-verify script re-run (the detour chain + the mobile matrix + the bounce guards) + the fresh s21 probes re-confirmed on our side (the login 429 live check via a throwaway server — NOT on :3000, to keep the live-verify bucket clean; the security-header set re-checked).
4. **Screenshots:** the standing 10-shot set refreshed via the s20 lineage (`scripts/capture-screenshots-s20.sh` → copied as `scripts/capture-screenshots-s21.sh`) — all four FATAL guards green; VLM spot-checks on 2 shots (the standing convention).
5. **Docs:** README (the smoke count 11→12 + the auth-rate-limit row's s21 sentence), AGENTS.md (the session-21 contracts section + the reference list through s21), CLAUDE.md (the smoke count + the response-layer lesson), PAD (§7.1 counts + the s21 known-issues row), `service-desk_SKILL.md` **v2.19.0** (lesson 75: the response-layer enumeration — the throttle, the envelope, the cancel path), `docs/session_31.md` (the narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
6. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only) — then verify the CI badge STAYS green.

## 3. Validation of this plan against the codebase

- **P1 seams verified:** `rateLimit(key, limit=10)` in `src/lib/auth.ts` (lines 155–171: the first 10 calls in the window return ok; the 11th+ return `{ok:false, retryAfterSeconds}`); `clientIp` (proxy-aware — all smoke curls share the "unknown" IP → one bucket, deterministic); the login route's 429 response (`{ status: 429, headers: { "Retry-After": … } }` + the "Too many attempts" message, lines 20–25); the forgot route's 429 (5-limit, lines 13–18); the smoke script's throwaway server (fresh in-memory buckets — `scripts/smoke-test.sh` lines 27–40; the DB at `db/smoke.db`, isolated from `db/custom.db`).
- **Counting verified:** the demo login (1) + 9 wrong passwords (2–10) = 10 consumed; the assert POST = the 11th → 429. The forgot loop: 5 ok + the assert = the 6th → 429. The buckets are independent keys (`login:${ip}` / `forgot:${ip}`) — the login-bucket pin does not affect the forgot pin.
- **No pin conflicts:** grep-verified — "Too many attempts"/429 appears in no test file; the smoke script's existing checks do not POST forgot-password; the auth.spec E2E budget is untouched (no new real logins).
- **CI-pass risk:** the smoke change is shell-only (no lint/typecheck surface); the gate re-run covers the doctrine (the s7 lesson — every file that lands gets the gate).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The 11-attempt login sequence makes the smoke script slow (~11 sequential curls) | Each curl is a local round-trip (<50 ms) — the added wall-clock is <2 s against the script's existing ~15 s. |
| A future smoke check between the demo login and the pin could consume a bucket slot and shift the counting | The pin block documents the slot arithmetic in a comment (the demo login = slot 1) and asserts the 429 — any drift in earlier login counts makes the pin fail LOUDLY (429 arriving early = the counting comment updated; the contract itself is what matters). |
| The 429 message text changes shape ("minutes" wording) | The grep matches the stable prefix "Too many attempts" — the wording contract documented in the AGENTS.md session-21 section. |
| The reference re-drifts mid-session | The ledger is re-measured at the live re-verification step before the docs finalize (the s19 process lesson 73). |

## 5. Process lessons (for the next agent)

1. **The auth flow's RESPONSE LAYER is a parity surface too** — the s14/s15 HTTP-response doctrine extends to the auth endpoints: the status codes (their 400 vs our 401), the envelopes (their FastAPI shape vs our `{error}`), the throttling behavior (none visible on theirs), the response-body surface (their JWT-in-body + geolocation + last_active vs our httpOnly cookie). Enumerate the response layer of every flow, not just the UI it feeds.
2. **A missing security control on the reference is not a mandate to remove ours** — the parity doctrine covers the VISIBLE contract; the deliberate supersets (rate limiting, security headers, httpOnly sessions) are the production-ready posture the clone exists to demonstrate. Measure theirs, document the divergence, pin OURS.
3. **The pin layer must match the budget layer** — a 429 E2E pin would burn the entire rate budget and flake the suite; the smoke layer (throwaway server, fresh buckets) pins the same contract for free. Choose the layer where the fixture cost is zero.

**Execution status (2026-10-11, all green):**
1. ✅ P1: the rate-limiter smoke pins added to `scripts/smoke-test.sh` (both buckets: the login 11th-attempt 429 + Retry-After + "Too many attempts"; the forgot 6th-attempt 429 + Retry-After) — GREEN on first run (the regression pin, as designed: the behavior is unit-seamed and live-deployed).
2. ✅ Full gate in the CLEAN environment (:3000 confirmed down): lint ✓ typecheck ✓ 65 unit ✓ build ✓ **196/196 E2E** ✓ (unchanged; zero regressions) smoke **13 PASS lines** ✓ (the standing 11 + 2 new).
3. ✅ Live paired re-verification (production standalone :3000): `scripts/s20-live-verify.mjs` re-run ALL GREEN (the detour chain + the bounce guards + the mobile matrix); the new `scripts/s21-live-verify.mjs` ALL GREEN (the security-header superset + the 401 envelope + the s19/s10 regressions). The 429 surface live-verified on the throwaway server (the smoke pin IS the live verification at that layer — the :3000 bucket left clean for the live-verify logins).
4. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s21.sh` (the s20 lineage verbatim; all four FATAL guards green); VLM-verified shots 02 + 05 (LAYOUT-OK). Seed re-verified canonical (4/11/3/0) after the fixtures.
5. ✅ Docs: README (the smoke pins + the auth-flow row's s21 sentences + the E2E-notes sentence), AGENTS.md (the session-21 contracts section + the reference list through s21 + the screenshot-lineage pointer), CLAUDE.md (the smoke line + the response-layer anti-pattern), PAD (§7.1 smoke row 13 steps + the s21 known-issues row), service-desk_SKILL.md **v2.19.0** (lesson 75), `docs/session_31.md` (the narrative log), this status block, `worklog.md`.
6. ⏳ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only) — the CI badge to be checked on the push.
