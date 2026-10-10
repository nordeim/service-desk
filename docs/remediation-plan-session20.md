# ServiceDesk — Session 20 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of all identified gaps, and full re-verification. Session 20 follows the session-19 remediation (commits `3bf8686` + the operator's transcript commit `c11eb76`; briefing docs `docs/session_27.md` + `docs/remediation-plan-session19.md` + `docs/session_28.md` + `worklog.md`). This session executes the session_27/28 next-step shortlist: the reference's standalone `/signup` from_url behavior, the Google button's click-through shape, and the reset-flow landing interplay.
**Method:** Ground truth = computed styles + live interaction probes + reference JS-bundle analysis + HTTP-response probes (per `skills/clone-app-pat-pro` + the s14–s19 response-layer/bundle/value-sweep doctrines). This session's headline surfaces: **the auth-flow's remaining unmeasured branches** (the Google OAuth entry, the reference's gate route-set, the reset-detour deep-link interplay).

**Baseline at session start (`c11eb76`, the pulled-forward workspace):** lint ✓ typecheck ✓ 65 unit ✓ build ✓ **195/195 E2E in the clean environment** (:3000 confirmed down before the run — the CI-equivalent condition) ✓ smoke 11/11 ✓. The GitHub CI badge reads **"CI - passing"** (the s19 push held green — the fix lineage continues). Environment contract verified standing (`.env` with `DATABASE_URL="file:../db/custom.db"` + generated `AUTH_SECRET`, `db/` at the repo root pushed + seeded 4/11/3/0 canonical, `skills/` excluded in all 4 configs by construction, npm scripts pinning `DATABASE_URL` inline, `.env.example` matching the codebase, the Playwright 1248 chromium build installed). The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session).

---

## 1. Findings Inventory

### F1 (LOW-MED — first measurement, documentation): the Google button's click-through is a REAL Google OAuth flow whose state carries the deep link

**The reference's live-measured behavior (first probe of this surface — the click was never followed until this session):**
- Clicking "Continue with Google" on their login card navigates to `accounts.google.com/v3/signin/identifier` — a REAL Google OAuth authorization-code flow (`client_id=185178814199-6a35e9aqcmlm15ig0upncg07c91av8do.apps.googleusercontent.com`, `redirect_uri=https://app.base44.com/api/apps/auth/callback`, `response_type=code`, `scope=openid email profile`, `prompt=select_account`).
- **The OAuth `state` param carries `{"domain": "https://service-desk-332a5ae4.base44.app", "from_url": "https://service-desk-332a5ae4.base44.app/", "app_id": "690d8ec0e8f00c84332a5ae4"}`** — their platform threads the from_url (the s19 deep-link contract) through the OAuth round-trip: after Google auth + the base44 callback, the user returns to their intended page, not the dashboard.
- The Google page renders their platform branding ("base44.com" account chooser, language selector — the standard Google sign-in UI).

**Our behavior:** the button renders the truthful alert "Google sign-in is not configured in this deployment. Use email and password." (`src/app/login/page.tsx` — the zero-third-party-auth doctrine: HMAC cookie sessions + scrypt in `src/lib/auth.ts`, "auditable, unit-tested, no supply-chain surface. Do not swap in an auth library casually" — CLAUDE.md).

**Decision: the doctrine STANDS — the finding is recorded as a first-time measurement, not a mirror candidate.** Faking the OAuth redirect chain would add a third-party auth dependency (exactly what the architecture rejects) or a misleading dead-end (worse than the truthful alert). Our superset behavior (truthful error + working email/password on the same card) already exceeds what an unconfigured OAuth button offers a user. The measured shape (client_id, callback, state-from_url) is documented in the ledger for future sessions — if the operator ever wants REAL Google OAuth, the reference's exact flow shape (including the state-carried from_url) is now the spec.

### F2 (LOW — first measurement, documentation): the reference's logged-out gate is a CATCH-ALL — /signup AND unknown routes bounce to /login?from_url=<url>

**The reference's live-measured behavior (the gate's ROUTE SET, first sweep of non-(app) routes):**
- Logged-out `/signup` → client-side redirect to `/login?from_url=https%3A%2F%2F…%2Fsignup` (their platform has no standalone signup page: logged-in it 404s — the s12 measurement; logged-out it is GATED — this session's measurement).
- Logged-out `/nonexistent-page` → the SAME bounce shape (`/login?from_url=…/nonexistent-page`). Their gate is a catch-all over everything except the public set (`/login`, `/forgotpassword`, `/`): the SPA cannot know a route is invalid until after authentication, so it gates first and 404s after.
- The from_url round-trips even onto their 404s: signing in from `from_url=…/nonexistent-page` landed on `/nonexistent-page` → their designed 404 (verified end-to-end with a real login).

**Our behavior (verified this session, all standing decisions):**
- The 4 exact `(app)` routes are gated (`src/proxy.ts` matcher) — `/ticketdetails?id=X` logged-out → 307 → `/login?from_url=<abs>` ✓ (re-verified live).
- `/signup` renders the REAL standalone signup form (200 — the URL superset, the s12 decision; the in-card signup on the login card is the measured s10 surface, and IT honors from_url since s19).
- Unknown routes (`/nonexistent-page`) render the public designed 404 (the s4 contract).

**Decision: documented architecture-driven divergence — now with the reference's route-set measured.** Our server-rendered app knows the route map at request time (the designed 404 needs no auth); their SPA cannot. Gating our 404s behind login would degrade the 404 contract (public correctness — the s10 SEO surface links to it) to match a platform limitation; gating our REAL /signup behind login would be circular (signup requires no session). The divergence joins the documented set with measured values on both sides.

### F3 (MED — code, TDD pin): the reset-detour deep-link interplay is verified-but-unpinned

**The compound flow (verified live on BOTH sites this session — identical behavior):** an unauthenticated visit to a guarded route bounces to `/login?from_url=<url>`; the user clicks "Forgot password?" (the s10 in-card view machine — the URL never changes through the swaps, which is WHY the from_url survives); submits the reset request (the green "Check your email" view); clicks "Back to sign in"; signs in → **lands on the deep-linked page** (verified on ours with `/ticketdetails?id=…` and on the reference with `/mytickets` and `/nonexistent-page`).

**Why this matters:** this is the most common real-world path to a shared ticket link (open link → realize you forgot your password → reset → sign in → expect THE TICKET, not the dashboard). The chain crosses THREE previously-pinned features (the s19 from_url contract, the s10 view machine, the s8 auth-error contract) — compound flows are where interactions regress. The s19 E2E pins the direct bounce+return; the interaction with the view machine is covered by NO test.

**Fix: ONE new E2E test in `tests/e2e/auth.spec.ts`** — "signing in after the forgot-password detour returns to the deep link": `goto /ticketdetails?id=e2e-reset-detour` → bounce → Forgot password? → Send reset link (Check your email) → Back to sign in → sign in → `waitForURL **/ticketdetails?id=e2e-reset-detour` + the not-found Alert (a nonexistent id — the proxy bounce precedes any data fetch; the assertion is the URL, mirroring the s19 test's design). The test is expected GREEN on first run (the behavior was verified live this session) — it is a REGRESSION PIN for a verified compound contract, not a bug fix (the repo's TDD doctrine requires red-first for BUG fixes; this is a coverage addition in the same class as the s18 favicon pin).

**E2E/limit budget:** the login bucket goes 7→8 of 10/15-min (the new test's ONE real login); the forgot-password POST rides its SEPARATE bucket (`forgot:${ip}`, 5/15-min — currently 0 E2E hits → 1/5). Comfortable headroom in both.

### Verified NON-gaps (re-checked this session, no action)

- **The s19 drift ledger holds EXACTLY (fresh hard-loads, clean logged-out context re-verified):** the PWA trio (theme-color #000000 + manifest link + apple-touch-icon) + og:image:width/height/alt render AUTH-PAGES-ONLY on the reference (present on `/login`; GONE on all four app routes); viewport-fit=cover auth-pages-only; the app routes keep `mobile-web-app-capable` + `apple-mobile-web-app-title` "ServiceDesk" + `apple-mobile-web-app-status-bar-style` "black" + the og/twitter/canonical core set; `/dashboard` canonical = the ORIGIN ROOT (their home special case). Ours ships the uniform superset on every axis (the documented doctrine).
- **The reference's mobile sheet contracts (agent-browser at 375×812 + 390×844):** sheet 288px + `rgb(250,250,250)` + overlay `rgba(0,0,0,0.8)` + body lock — ALL identical to ours; their standing defects persist (468-vs-375 AND 468-vs-390 horizontal overflow; the sheet STAYS OPEN after nav-tap — ours auto-closes, the documented superset; their toast viewport — a 375×32 `pointer-events: auto` band at the top — blocks their own mobile sheet trigger, worked around via a JS dispatch to complete the matrix; Escape closes + unlocks on both).
- **Our mobile matrix FULLY GREEN** (the s14 script + a fresh 390 spot-check: 390=390 no overflow; 375=375; 288px sheet; oklab(0 0 0 / 0.8) overlay = the 80% black; body lock/unlock; nav-tap auto-close; Escape → focus body; the inline attachment download UX).
- **The Tailwind v4 guards all standing** (`@theme inline` semantic tokens, the button-cursor preflight in `@layer base`, the v3 radius scale with the 4px `--radius-sm`, the pinned system font stack, no `tailwind.config.js`); the mobile navigation — the user's standing priority — shows zero v4-related regressions (geometry, overlay, animation contracts all green).
- **The bundle sweep (fresh `index-DhFaB31Z.js`):** zero new user-facing features — `notification` 0 hits; `whileHover` = framer-motion library internals only; the admin route set unchanged (`/all-tickets`, `/analytics`, `/developer`, `/settings`); `last_active` still the admin-gated heartbeat; websocket strings still library internals.
- **The standing visual pins all stable on the reference:** the dashboard chrome (nav: Dashboard/Submit Ticket/My Tickets; quick stats: My Tickets/Open/In Progress/Total; the Report New Issue CTA + View All Tickets; 5 anchor-structured recent rows), the submit form (labels `Issue Title *`/`Category *`/`Priority *`/`Description *`/`Attachments (optional)`; `accept="image/*,.pdf,.doc,.docx"` + `multiple`; 2 comboboxes; the Cancel/Submit Ticket footer; the Medium - Normal priority trigger), mytickets ("Search tickets..." + the 2-filter grid + anchor cards), the detail page (the Description/Attachments h3s, the Comments & Updates/Ticket Information/Created By/Created On/Last Updated panel, the generic "Attachment 1" label, the "Add a comment or update..." placeholder). Our side verified to match (nav/CTA/stats/recent rows with lowercase badges — the h3 titles + open/open/in progress/resolved/closed set).
- **The standalone `/signup` landing on ours stays `/dashboard`** (considered and left): the page is a pure superset with no reference counterpart (their /signup gates logged-out, 404s logged-in); the only path to it is direct URL entry; the login card's "Need an account? Sign up" is the s10 in-card BUTTON (honors from_url since s19), not a link to the standalone page — the deep-link continuity through the measured surface is complete.

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; no-fake-verification signup; permanent SQLite attachment storage; nav-tap auto-close; correct SPA titles + route-correct head; `private` cache scope on the owner-scoped attachment route; UTC-pinned formatters (s15); the reduced-motion a11y superset; the unmeasured admin surface (s16 F3); the cheaper `/api/stats` aggregate; no `last_active` heartbeat (s17 F3); the truth-telling og:image/favicon assets (s17/s18); the proper-cased per-route titles; the uniform viewport-fit=cover (s18); the uniform PWA trio + og:image dims/alt (s19); the segment-canonical dashboard (s19); **the truthful not-configured Google button over the reference's real OAuth entry (s20 F1)**; **the exact-route gate + public 404s + real /signup over the reference's catch-all gate (s20 F2)**.

---

## 2. Execution Plan (TDD)

1. **RED check (expected GREEN — a regression pin, not a bug fix):** add the session-20 E2E test to `tests/e2e/auth.spec.ts` (the logged-out file — after the s19 deep-link test): the full detour chain (bounce → Forgot password? → Send reset link → Check your email → Back to sign in → sign in → the deep-linked ticket URL + the not-found Alert). Run it against the current build — expected PASS (the behavior was live-verified this session on both sites). If it FAILS, a real bug exists in the compound flow — fix it before proceeding (the TDD doctrine).
2. **Full gate in the CLEAN environment** (no ambient :3000): `bun run lint && bun run typecheck && bun run test && bun run build` → `bun run test:e2e` (**196 expected: 195 + 1 new E2E; unit stays 65**) → `bash scripts/smoke-test.sh` (11/11).
3. **Live paired re-verification** (production standalone :3000): the detour chain end-to-end (the E2E path on the live server); the mobile matrix re-run (the s14 script); the seed re-verified after fixtures.
4. **Screenshots:** the standing 10-shot set refreshed via the s19 lineage (`scripts/capture-screenshots-s19.sh` → copied as the s20 lineage) — all four FATAL guards green; VLM spot-checks on 2 shots.
5. **Docs:** README (the auth-flow row's s20 sentence + the Google-button/gate-route-set measurements + counts 195→196 E2E), AGENTS.md (the session-20 contracts section + the F1/F2 first-measurement ledger), CLAUDE.md (counts + the compound-flow pin note), PAD (§7.1 counts + the s20 known-issues row), `service-desk_SKILL.md` **v2.18.0** (lesson 74: the auth-flow branch enumeration — the click-through shape, the gate route-set, and the compound-flow pin), `docs/session_29.md` (the narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
6. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only) — then verify the CI badge STAYS green.

## 3. Validation of this plan against the codebase

- **F3 seams:** the detour chain components are all verified live this session (the bounce via the proxy — `src/proxy.ts`; the view machine — `switchView` in `src/app/login/page.tsx` (the s10 contract: the URL never changes through the swaps); the from_url read — both success handlers read `window.location.search` imperatively at submit time; the landing — `safeRedirectTarget` returns `path + search`, preserving `?id=`). The test's selectors verified against the live DOM (the exact accessible names used by the s10 E2E pins + this session's live probes: "Forgot password?", "Reset your password", "Send reset link", "Check your email", "Back to sign in", the Email/Password labels, "Sign in" exact).
- **Budget mapping:** the login bucket: 6 existing real attempts (setup, wrong-password, sign-in, in-card signup, signup-page signup, weak-password signup) + 1 s19 deep-link + 1 new detour = 8 of 10 per 15 min. The forgot bucket: 0 existing + 1 new = 1 of 5.
- **No pin conflicts:** no existing spec exercises the forgot-password POST (grep-verified: `forgot-password` has 0 E2E references); the reset-view machine pins (visual-parity s10) render the views but never submit the reset form.
- **CI-pass risk:** the single new test rides the same clean-env conditions verified locally (step 2).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The new E2E test flakes on the view-swap timing (the sign-in click racing the view transition) | The test uses auto-retrying locators + `waitForURL` (the Playwright patterns the suite already relies on); the live probes completed the identical chain twice with zero flakes. |
| The forgot-password POST 429s in CI (a shared bucket) | The bucket is at 1/5 with the new test — and the CI runner is a fresh process per run (the in-memory buckets start empty). |
| The reference re-drifts mid-session | The ledger is re-measured at the live re-verification step before the docs finalize (the s19 process lesson 73). |
| The pin test masks a future behavior change in the view machine (e.g., a view swap that pushes a URL) | That is exactly the regression the pin exists to catch — the deep link through the most common real-world path is the contract. |

## 5. Process lessons (for the next agent)

1. **The auth flow has BRANCHES — enumerate them all before calling the gate "measured."** Session 19 measured the direct chain (bounce + return); this session found three more branches (the Google OAuth entry — whose state carries from_url; the gate's route-set — a catch-all on their side; the reset-detour interplay). Each branch was a first measurement.
2. **A probe's regex can match its own measurement target's encoding.** The first detour probe's `waitForURL(/ticketdetails|dashboard/)` matched the LOGIN URL because "ticketdetails" appears inside the URL-ENCODED from_url param — a green that measured nothing. When asserting on URLs that carry other URLs as params, assert the FULL decoded value or anchor the pattern (`^`), never a bare substring.
3. **A blocked interaction is still a measurable surface.** The reference's own toast viewport blocks their mobile sheet trigger (their standing defect) — the matrix completed via a JS `element.click()` dispatch. When the hit-test blocks, dispatch the event; the DOM contracts (sheet geometry, overlay, body lock) are unchanged by the entry path.

**Execution status (2026-10-11, all green):**
1. ✅ The session-20 E2E pin added to `tests/e2e/auth.spec.ts` and GREEN on first run ("signing in after the forgot-password detour returns to the deep link" — the regression pin, as designed; the compound chain was live-verified on both sites before the pin).
2. ✅ Full gate in the CLEAN environment (:3000 confirmed down): lint ✓ typecheck ✓ 65 unit ✓ build ✓ **196/196 E2E** ✓ (195 + 1 new; zero regressions) smoke 11/11 ✓.
3. ✅ Live paired re-verification (production standalone :3000, `scripts/s20-live-verify.mjs`): the detour chain end-to-end (bounce → reset view URL-stable → reset-success URL-stable → sign-in lands on the deep-linked ticket + the s10 not-found Alert); the plain-bounce regression check; the cross-origin open-redirect guard; the mobile matrix (375=375, 288px sheet, 80% overlay, body lock, nav-tap auto-close). ALL GREEN.
4. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s20.sh` (the s19 lineage verbatim; all four FATAL guards green); VLM-verified shots 02 + 05 (LAYOUT-OK). Seed re-verified canonical (4/11/3/0) after the fixtures.
5. ✅ Docs: README (counts 196 + the auth-flow row's s20 sentence + the E2E-notes sentence), AGENTS.md (the session-20 contracts section + the reference list through s20 + the screenshot-lineage pointer), CLAUDE.md (counts + the s20 E2E-notes sentence + the encoded-URL anti-pattern), PAD (§7.1 distribution + §7.4 checklist + the s20 known-issues row), service-desk_SKILL.md **v2.18.0** (lesson 74), `docs/session_29.md` (the narrative log), this status block, `worklog.md`.
6. ✅ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only) — the CI badge checked on the push.
