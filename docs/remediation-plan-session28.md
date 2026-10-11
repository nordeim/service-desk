# ServiceDesk — Session 28 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 28 follows the session-27 remediation (commits `0317db1` + `cec1b77` + `af7bb65`; briefing docs `docs/session_43.md` + `docs/remediation-plan-session27.md` + `worklog.md` + `docs/session_44.md`). This session executes the session_43/44 next-step shortlist: the standing ledger re-check (the platform churns in waves), the `/api/stats` param-surface question (deliberately scoped out in s27, revisitable), and their mobile-app chunks (`native-mobile-app`, `useHideNativeBottomTabs`).

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s27 response-layer/bundle/write-path doctrines). This session's headline surfaces: **the /login bundle pair rotated a SECOND time (a new Rolldown wave — behavior verified unchanged)**, **the mobile-app chunks decoded to closure (the Wix native-shell bridge, inert in the browser)**, **a NEW reference-side mobile defect measured (their menu button blocked by empty toast viewports)**, and **our own `/api/stats` empty grammar — the last open param surface, carrying the cross-route variant of the s25 lesson-79 class**.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: the /login pair rotated a second time (non-gap)

The app-route pair is UNCHANGED for the ninth consecutive sweep: `index-DhFaB31Z.js` + `index-DFdILd41.css`. The **/login pair rotated again**: `index-CM-qL9yl.js` + `index-DWYJeyVS.css` (s26) → **`index-GvewFNv-.js` + `index-DGHUKY5V.css`** — the second /login rotation since s24. The `UserAppMain` chunk renamed `12hFZEhy` → `BZ-6C68G`, and the whole chunk graph re-split: the /login HTML now modulepreloads a large platform set (`WorkspaceAPI`/`WorkspaceContext`, `i18n`, `mixpanelUtils`, `errorReporting`, `featureFlags`, `useDesignSystem`, `usePlatform`, `useWorkspaceUnlockState`, `rolldown-runtime` — the platform rebuild marker). The UI strings verified present in the new `UserAppMain-BZ-6C68G.js` ("Sign in to continue", "Forgot password", "Need an account"); `from_url` ×1 in each of `AuthAPI`, `AuthContext`, `axiosClient`, and the new `UserAppMain` (the re-split moved the string, the contract didn't change); the session's own live login AND the logged-out gate (`/dashboard` with clean storage → `/login?from_url=…`) ran through the current bundles. **The rotation is platform churn, behavior unchanged. Non-gap.**

### F2 — the mobile-app chunks decoded (the s44 shortlist, first measurement, non-gap)

`useHideNativeBottomTabs-1BpAstUW.js` + `native-mobile-app-J-txITCo.js` decoded to closure. They are the **Wix native-shell bridge**: `window.wixMobileNativeBridge.base44.*` — `onItemClicked`, `openBottomSheet`, `showModal`, `requestWebViewNavigation`, `setBottomTabsVisible`, `handlePageNotFoundRetry`, linking `openUrl`. Every call is guarded by `isNativeMobile` (from the `bridge` chunk's platform detection) and the bridge-object presence — **all of it inert in the browser**. This is platform infrastructure for their mobile app shell (the same class as `badge.js`, `mixpanel`, `errorReporting` — the s2 no-platform-chrome exclusion). **Non-gap: documented as the first-measurement capability decode.**

### F3 — the chrome ledger holds (tenth re-verification, non-gap)

All axes hold exactly, both routes, logged in and out: viewport-fit=cover auth-pages-only; the PWA trio (manifest + theme-color #000000 + apple-touch-icon 180×180) on `/login` only; the apple pair (status-bar-style black + apple-mobile-web-app-title) on both routes; og:image 1200×630 with true declared dims; twitter:card summary_large_image; `/dashboard` canonical + og:url at the origin root; segment-verbatim titles. **Non-gap.**

### F4 — the mobile matrix: their standing defects + a NEW third defect (non-gap — ours is the working superset)

Their standing pair persists (tenth re-verification): `scrollWidth 468` at `clientWidth 375` on `/dashboard`; the `rgba(0,0,0,0.8)` overlay. **The s4-documented mobile defect RECURRED and WORSENED: their mobile menu button is BLOCKED.** Two stacked empty toast-viewport divs (`fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0…`, `pointer-events: auto`, one nested inside the other, both EMPTY — no toasts rendered) cover the top ~64px of the mobile viewport. A real mouse click at the Toggle Sidebar button's coordinates (38,30) lands on the container and the menu does NOT open; the state is persistent after reload. The empty containers spanning full-width at `top-0` is their toast-viewport CSS regressing on mobile (`sm:` breakpoints re-anchor it bottom-right at ≥640px — desktop unaffected). The s4 measurement recorded the band as a single 390×32 partially-blocking strip (their plan: "the trigger is partially blocked"); the second `/login` rotation brought it back doubled (~64px at 375), the button's click center now fully inside.

Ours: **375 = 375** on both routes, the `oklab(0 0 0 / 0.8)` overlay, the menu button clickable, **nav-tap auto-close + navigate** (the real-click verification). The TW v4 guards code-verified standing (`@theme inline` ×2, the cursor preflight in `@layer base`, `--radius-sm: 0.25rem`, no config file). **Their defect is documented, NOT cloned — ours is the working superset. Non-gap.**

### F5 — the desktop paired check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in) verdicts **LAYOUT-OK**: identical structure, spacing, component hierarchy, colors, typography. All observed differences are dynamic data content (their 121-ticket global corpus vs our seeded 11; the operator's account vs the demo user) and the "Edit with Base44" platform badge (the s2 platform-chrome exclusion). **Non-gap.**

### P1 — the own-side audit: `/api/stats` is the last open param surface (the actionable gap)

The s27 seam closed the LIST route's grammar to the seven-name set. The `/api/stats` route — our server-computed superset surface (the reference has no equivalent; their metrics are client-computed, the s26/s27 no-analytics doctrine) — takes **no params at all**, and its empty grammar was never closed. Measured live (authenticated): `?banana=1`, **`?scope=mine`**, **`?status=open&limit=5`** — the last two are REAL param names from the sibling `/api/tickets` route — all return **200 with the identical full aggregate**. This is the **cross-route param-confusion variant of the s25 lesson-79 class**: a caller carrying over real param names gets a silently-wrong-shaped response (they asked for a scoped/filtered aggregate, they got the global one, with no error to tell them otherwise).

Callers audited (zero breakage from closing it): `AppSidebar` sends `fetch("/api/stats")` — no params; the dashboard page sends `fetch("/api/stats")` — no params; the E2E suite intercepts `**/api/stats` with no query string; the smoke script probes the happy path only. Every other route re-audited clean this session: the auth family (login/signup/logout/me/forgot-password — body-validated, rate-limited), health, the tickets list (s27-seamed), detail + attachments (s14/s15/s22/s23), comments (POST-only — no query surface).

## 2. The remediation (P1 — TDD)

**The design: the stats empty-grammar contract.**

1. **`parseStatsQuery` seam** in `src/lib/validation.ts` — the same shape as the s27 `parseListQuery`, but the allowed set is EMPTY: any query param name → `{ ok: false, error: "unknown query parameter: ${name} (this endpoint takes no query parameters)" }`; a duplicate name → the s27 duplicate message. The grammar level precedes the value level (an empty value `?status=` is still an unknown NAME here — there are no known names).
2. **Route wiring** — `src/app/api/stats/route.ts` GET calls the seam FIRST; a failure returns 400 + `{ error }` (the one-envelope shape — never a second error shape).
3. **Unit pins** (`src/lib/__tests__/domain.test.ts`, the `parseStatsQuery` describe): the no-param happy path; the unknown-name reject with the exact message; the real-sibling-name reject (`?scope=mine` — the cross-route confusion pin); the duplicate reject; the empty-value-still-unknown reject; the multi-param reject; the message names the offending param.
4. **Smoke pins** (`scripts/smoke-test.sh`, the s28 block): `GET /api/stats?banana=1` → 400 + the unknown message; `GET /api/stats?scope=mine` → 400 (the cross-route pin at the HTTP layer); the no-param 200 with the full `{mine, global, avgResolutionMs}` shape intact.

**Non-goals (documented decisions, no code):** no count endpoint (the s27 F2 decision stands); no analytics surface (the s26 doctrine); no cloning of their toast-viewport defect or their menu-blocking bug (ours works); no native-bridge chunks (platform infrastructure, the s2 doctrine).

## 3. The verification plan

1. Full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → unit (94 + the new pins) → build → E2E 196 → smoke (41 + the new lines).
2. Live paired re-verification on the production standalone :3000: the new `scripts/s28-live-verify.mjs` (the stats grammar matrix + the stats happy path + the logged-out 401) + re-runs of the s24/s25/s26/s27 live-verify scripts (all green = the four prior sessions' contracts hold on the current build).
3. The UI round-trip: the real dashboard + sidebar QUICK STATS through the grammar gate (the mount fetch + the 5s poll both no-param → 200).
4. The mobile matrix re-verified on the new build (375=375, menu opens, nav-tap auto-close + navigate) + the desktop paired VLM check.
5. Screenshots (10-shot set) refreshed to `docs/screenshots/`; VLM spot-checks on the standing convention shots.
6. Docs alignment: README (the counts + the smoke description), AGENTS.md (the session-28 contracts + the commands table), CLAUDE.md (the counts + the anti-pattern), PAD (§7.1 + the known-issues row), `service-desk_SKILL.md` version bump + the new lesson, `docs/session_45.md` (this agent log), this plan's execution status, `worklog.md`.
7. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the paramiko ssh shim at `/home/z/my-project/bin/ssh`), verify CI green, record the run status.

## 4. Execution status

- [x] Gap analysis (F1–F5 + P1) — complete, recorded in worklog task 63-gap-s28 (+ the task-63 correction: the F4 toast-viewport finding re-attributed to the s4-documented defect, recurred + worsened)
- [x] P1 TDD: RED (5 pins — `parseStatsQuery is not a function`) → GREEN (the seam in validation.ts + the GET handler wiring) → 99 unit (94+5)
- [x] Smoke pins added → 41 + 3 = 44 PASS lines (GREEN on the clean-environment run)
- [x] Full gate in the clean environment: lint ✓ typecheck ✓ 99 unit ✓ build ✓ 196/196 E2E ✓ smoke 44 ✓; seed canonical (4/11/3/0) after
- [x] Live paired re-verification: s28-live-verify.mjs ALL GREEN (12 checks) + s27 (14) + s26 (15) + s25 (13) + s24 re-runs ALL GREEN; the UI round-trip (the dashboard stat cards + QUICK STATS + Performance Metrics through the grammar gate) + the mobile matrix on the new build (375=375, real clicks, nav-tap auto-close + navigate) + the desktop paired VLM check (LAYOUT-OK)
- [x] Screenshots (the 10-shot set, FATAL guards green, VLM shots 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.26.0/session_45.md/plan/worklog)
- [ ] Commit + push + CI verification
