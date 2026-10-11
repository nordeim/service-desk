# ServiceDesk — Session 29 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 29 follows the session-28 remediation (commits `752e333` + `f61802c`; briefing docs `docs/session_45.md` + `docs/remediation-plan-session28.md` + `worklog.md` + `docs/session_46.md`). This session executes the session_46 next-step shortlist: the rotation-waves re-check (the app-route pair is now the older survivor), the s4 toast-viewport defect re-check (recede or persist), and the new platform chunks in the preload battery.

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s28 response-layer/bundle/write-path doctrines). This session's headline surfaces: **the /login bundle pair rotated a THIRD time (a new Rolldown wave — behavior verified unchanged)**, **a NEW reference-side desktop horizontal overflow measured (1328 vs 1280 — their decorative gradient blobs anchor to an un-clipped 1328-wide wrapper)**, **the s4-documented toast-viewport blocking PERSISTS through their rebuild (the s46 question answered: not receded)**, and **our own remaining routes' query grammars — the last open param surfaces API-wide, all ten families carrying the cross-route confusion variant of the lesson-82 class**.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: the /login pair rotated a third time (non-gap)

The app-route pair is UNCHANGED for the tenth consecutive sweep: `index-DhFaB31Z.js` + `index-DFdILd41.css` — now the older survivor, exactly as the s46 closing note predicted. The **/login pair rotated again**: `index-GvewFNv-.js` + `index-DGHUKY5V.css` (s28) → **`index-NgIJwTZs.js` + `index-CykrcFnx.css`** — the third /login rotation since s24, and this one rotated BOTH halves. `UserAppMain` renamed `BZ-6C68G` → `BgdljW3t`, and the whole chunk graph re-split: the preload battery carries the renamed platform set (`rolldown-runtime-C0FnF6B9`, `WorkspaceAPI-gDyJJnJE`, `WorkspaceContext-BsCSpYs1`, `i18n-DWceIbMI`, `mixpanelUtils-iIoE4wLI`, `errorReporting-DLPoz25o`, `featureFlags-AiQAB9Nd`, `useDesignSystem-6Kcl9LIZ`, `usePlatform-CeQ0MESx`, `useWorkspaceUnlockState-Cg67Ec9B`) plus the new vendor split (`vendor-react`, `vendor-ui`, `vendor-data`, `vendor-utils`). The login UI strings verified present in the new `UserAppMain-BgdljW3t.js` ("Sign in to continue", "Forgot password", "Need an account", "Sign up", "Google" ×2); `from_url` ×14 in UserAppMain + ×1 AuthAPI + ×2 AuthContext + ×2 axiosClient; the session's own live login AND the logged-out gate (`/ticketdetails?id=abc123` with clean storage → `/login?from_url=<abs>` — the gate fired after clearing BOTH cookie and localStorage; their JWT lives in storage, not the cookie) ran through the current bundles. Two new chunks decoded per the s46 directive: `domainValidation-FMKryCR2.js` = platform URL-security (scheme parsing, `@`/encoded-slash detection, control-char rejection) and `logoutReturnPath-HjtsxsFd.js` = workspace-access gating (`getLoginInfoById`, `workspaceRestricted`, i18n keys) — platform infrastructure, not app features (the s2 no-platform-chrome doctrine). **The rotation is platform churn, behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (eleventh re-verification, non-gap)

All axes hold exactly, both routes, logged in and out: viewport-fit=cover auth-pages-only; the PWA trio (manifest + theme-color #000000 + apple-touch-icon) on `/login` only; the apple pair (status-bar-style black + apple-mobile-web-app-title) on both routes; og:image 1200×630 with true declared dims; twitter:card summary_large_image; the dashboard-home (`/`) canonical + og:url at the origin root; segment-verbatim titles. **Non-gap.**

### F3 — a NEW reference-side desktop horizontal overflow (first measurement; their defect, NOT cloned)

At desktop 1280×800 their dashboard renders `scrollWidth 1328` vs `clientWidth 1280` — a **48px horizontal overflow at desktop**, new with their latest rebuild. The offenders are the four decorative gradient blobs (`absolute top-0 right-0 w-32 h-32`: violet→purple, amber→orange, blue→cyan, emerald→green, the background motif both sites share) — they anchor `right-0` to a wrapper that is itself 1328 wide, with no `overflow-hidden` on the outermost container. The element walk confirms: the only elements past x=1281 are those four blobs (right: 1328). Ours: **1280 = 1280** (no desktop overflow — the `min-w-0` superset that already protects mobile extends here; our decorative blobs are anchored inside the clipped layout). **Their defect documented, NOT cloned — ours the working superset.**

### F4 — the mobile matrix: the s4-defect re-check (the s46 question answered — it persists; non-gap)

Their standing pair persists (eleventh re-verification): `scrollWidth 468` at `clientWidth 375` on `/dashboard`. **The s4-documented toast-viewport blocking PERSISTS through their rebuild — it did NOT recede.** The geometry morphed from the s28 doubled stack: TWO stacked empty toast-container divs now OVERLAP (both `fixed top-0 z-[100] w-full p-4 …` at top 0, h 32, `pointer-events: auto`, one at left 0 and one at left 16 — one nested in the other, both EMPTY). The Toggle Sidebar button (rect 24,16 → 52,44) has its center (38,30) inside the 0–32 band: the `elementFromPoint` hit-test lands on the container, and a REAL mouse click at the button's coordinates does NOT open the menu (verified: no dialog, no sheet, state unchanged). Desktop unaffected (the `sm:` re-anchoring). Ours: **375 = 375**, the button hit-tests to the BUTTON itself, the real click opens the sheet (3 nav links), nav-tap auto-closes + navigates (`/mytickets` + the correct title). The TW v4 guards code-verified standing (`@theme inline` ×2, the cursor preflight in `@layer base`, `--radius-sm: 0.25rem`, the pinned system font stack, no config file). **Their defect is documented, NOT cloned — ours is the working superset. Non-gap.**

### F5 — the desktop paired check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in) verdicts **LAYOUT-OK**: identical structure, spacing, component hierarchy, colors, typography. All observed differences are dynamic data content (their 121-ticket global corpus vs our seeded 11; the operator's account vs the demo user), the "Edit with Base44" platform badge (the s2 platform-chrome exclusion), and their missing Dashboard active-highlight at `/` (the s20-documented reference quirk). **Non-gap.**

### P1 — the own-side audit: every REMAINING route's query grammar is silently open (the actionable gap)

The s27 seam closed the LIST route's grammar to the seven-name set; the s28 seam closed `/api/stats`'s empty grammar. The audit this session measured **every remaining route family** — and all ten carry the same silently-open grammar, the cross-route confusion variant of the lesson-82 class (a caller carrying a REAL param name from the sibling `/api/tickets` route gets a silently-wrong response with no signal):

| Route | Method | Measured probe | Result (before the fix) |
|---|---|---|---|
| `/api/health` | GET | `?banana=1` | 200, the fixed status body |
| `/api/auth/login` | POST | `?scope=mine` | 200, login proceeds |
| `/api/auth/signup` | POST | `?banana=1` | 201, account created |
| `/api/auth/forgot-password` | POST | `?scope=mine` | 200, the generic message |
| `/api/auth/logout` | POST | `?banana=1` | 200, cookie cleared |
| `/api/auth/me` | GET | `?scope=mine` / `?banana=1` | 200, the unchanged user |
| `/api/tickets` | POST | `?banana=1` | 201, ticket created |
| `/api/tickets/[id]` | GET | `?banana=1` | 200, the detail |
| `/api/tickets/[id]` | PATCH | `?banana=1` | 200, mutation applied |
| `/api/tickets/[id]/comments` | POST | `?scope=mine` | 201, comment created |

(The `/api/tickets/[id]/attachments/[attachmentId]` download route follows the same handler pattern — wired in the fix, verified by the live-verify script.)

The caller's cost is the lesson-79/82 lie: a monitoring probe appending `?probe=1` to `/api/health` believes it measured health; a client carrying `?scope=mine` to `/api/auth/me` believes it scoped something. No error, no signal — the silently-ignored param.

**Callers audited (zero breakage from closing them):** every UI fetch is bare (grepped `src/` — no query string on any of these routes); the E2E suite fetches bare (the route mocks intercept `**/api/stats` and the auth/ticket routes without query strings); the smoke script probes bare. The Playwright webServer gate hits `/api/health` bare; CI runs the same suite. No legitimate caller sends any query param to any of these routes.

## 2. The remediation (P1 — TDD)

**The design: the shared empty-grammar seam, wired API-wide.**

1. **`parseNoQuery` seam** in `src/lib/validation.ts` — the same contract + message as the s28 `parseStatsQuery` (`unknown query parameter: ${name} (this endpoint takes no query parameters)`), factored as ONE shared function; `parseStatsQuery` is refactored to delegate to it (its unit pins pin the message + behavior, which stay byte-identical). The s27-consistent ordering: on an empty grammar every name is unknown, so the unknown message subsumes duplicates; the grammar precedes the value level (an empty `?status=` is still an unknown NAME).
2. **Route wiring** — the gate lands in every remaining handler, ordered per the s28 convention: the rate limiter (where present — the s21 429 contract pins the 11th login / 6th forgot attempt and must keep firing FIRST), then auth (where present — 401 precedes 400, matching the stats route), then the grammar gate, then body/param validation:
   - `src/app/api/health/route.ts` GET
   - `src/app/api/auth/login/route.ts` POST (+ the DELETE handler — same grammar)
   - `src/app/api/auth/signup/route.ts` POST
   - `src/app/api/auth/forgot-password/route.ts` POST
   - `src/app/api/auth/logout/route.ts` POST
   - `src/app/api/auth/me/route.ts` GET
   - `src/app/api/tickets/route.ts` POST (the GET is already s27-seamed)
   - `src/app/api/tickets/[id]/route.ts` GET + PATCH
   - `src/app/api/tickets/[id]/comments/route.ts` POST
   - `src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts` GET
3. **Unit pins** (`src/lib/__tests__/domain.test.ts`, the `parseNoQuery` describe): the no-param happy path; the unknown-name reject with the exact message; the real-sibling-name reject (`?scope=mine` — the cross-route pin); the empty-value-still-unknown reject; the duplicate-subsumed-by-unknown reject; the multi-param first-name reject.
4. **Smoke pins** (`scripts/smoke-test.sh`, the s29 block — the zero-budget routes): `GET /api/health?banana=1` → 400 + the messages; `GET /api/auth/me?scope=mine` → 400 (the cross-route pin); `POST /api/auth/signup?banana=1` → 400; `POST /api/auth/logout?banana=1` → 400 (the gate rejects before the cookie clears — the session stays valid for the rest of the run); `POST /api/tickets?banana=1` → 400; `GET /api/tickets/[id]?banana=1` → 400; `PATCH /api/tickets/[id]?banana=1` → 400; `POST /api/tickets/[id]/comments?scope=mine` → 400; the no-param happy paths intact (health 200 + me 200 + the standing routes). The login + forgot-password grammar pins live in the live-verify script (their rate buckets are exactly consumed by the s21 smoke pins — a grammar probe inside smoke would shift the 429 arithmetic; the live-verify server's buckets are fresh).
5. **The s29 live-verify script** (`scripts/s29-live-verify.mjs`): the login grammar probe FIRST (fresh bucket), the forgot-password grammar probe (its own fresh bucket), the attachment-download grammar probe (a fixture ticket with one tiny attachment, created + cleaned up), the full remaining-route grammar matrix, the no-param happy paths, and the standing re-verification set.

**Non-goals (documented decisions, no code):** no analytics surface (the s26 doctrine); no cloning of their desktop-overflow (F3) or their toast-viewport blocking (F4) — ours works; no new routes; no changes to any response body or status code on the bare happy paths (the gate only adds the 400 branch on non-empty query strings).

## 3. The verification plan

1. Full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → unit (99 + the new pins) → build → E2E 196 → smoke (44 + the s29 lines).
2. Live re-verification on the production standalone :3000: the new `scripts/s29-live-verify.mjs` (the grammar matrix on every remaining route + the happy paths + the attachment fixture) + re-runs of the s24/s25/s26/s27/s28 live-verify scripts (all green = the five prior sessions' contracts hold on the current build).
3. The UI round-trip: the real login → dashboard → tickets flow through the grammar-gated routes (every UI fetch is bare → 200s unchanged).
4. The mobile matrix re-verified on the new build (375=375, menu opens, nav-tap auto-close + navigate) + the desktop paired VLM check.
5. Screenshots (the 10-shot set) refreshed to `docs/screenshots/`; VLM spot-checks on the standing convention shots.
6. Docs alignment: README (the counts + the smoke description + the s29 E2E-notes sentence), AGENTS.md (the session-29 contracts section + the commands table + the reference-findings list through s29), CLAUDE.md (the counts + the anti-pattern line), PAD (§7.1 + the s29 known-issues row), `service-desk_SKILL.md` v2.27.0 (the new lesson), `docs/session_47.md` (this agent log), this plan's execution status, `worklog.md`.
7. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 4. Execution status

- [x] Gap analysis (F1–F5 + P1) — complete, recorded in worklog task 2-gap-s29
- [x] P1 TDD: RED (7 pins — `parseNoQuery is not a function`) → GREEN (the shared seam + `parseStatsQuery` delegation + the gate wired into 11 handlers across 10 route files) → 106 unit (99+7)
- [x] Smoke pins added → the s29 block (10 pins — the zero-budget routes) → 54 PASS lines (44+10)
- [x] Full gate in the clean environment: lint ✓ typecheck ✓ 106 unit ✓ build ✓ 196/196 E2E ✓ smoke 54 ✓; seed canonical (4/11/3/0) after
- [x] Live re-verification: s29-live-verify.mjs ALL GREEN (22 checks — incl. the login + forgot grammar pins on fresh buckets, the attachment-download grammar via a cleaned-up fixture, the logout-gate-preserves-session check, the s27 + s28 gates re-verified next door) + the s24/s25/s26/s27/s28 re-runs ALL GREEN; the UI round-trip (the dashboard + stat cards + QUICK STATS + Performance Metrics through the grammar gates) + the mobile matrix on the new build (375=375, real clicks, nav-tap auto-close + navigate) + the desktop paired VLM check (LAYOUT-OK)
- [x] Screenshots (the 10-shot set, FATAL guards green, VLM shots 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.27.0/session_47.md/plan/worklog)
- [x] Commit + push + CI verification — `74f124f` pushed to main via `docs/ssh_git_wrapper_v3.py` (the paramiko shim at `/home/z/my-project/bin/ssh` on PATH; the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson; dry-run green first: the clean fast-forward `b171d1c..74f124f`; the real push verified: remote == local HEAD, tracking synced); operator key + the wrapper's temp key both shredded; **CI Run 66 on the push completed success** (verified via the browser aria-label method — the anonymous REST API 403 rate-limited, the standing condition); Run 65 (the operator's b171d1c) green before it
