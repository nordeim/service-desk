# ServiceDesk — Session 27 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 27 follows the session-26 remediation (commit `c4f41ae` + the status commit `7b20a37` + the operator's transcript commits; briefing docs `docs/session_41.md` + `docs/remediation-plan-session26.md` + `worklog.md` + `docs/session_42.md`). This session executes the session_41/42 next-step shortlist: the /login rotation aftermath (sweep both chunk pairs + the app-route graph for further Rolldown waves), their entity-API aggregation surface (does the platform expose count/aggregate endpoints), and the standing drift-ledger + bundle-hash re-check.

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s26 response-layer/bundle/write-path doctrines). This session's headline surfaces: **the aggregation question measured to closure (their platform DOES expose a /count endpoint — a first measurement, their app never uses it)**, **the routing/404 surface measured for the logged-in state (another first: their unknown routes render the in-app 404 — a convergence with our s4 design)**, **both bundle pairs unchanged (no new Rolldown wave)**, and **our own list API's query-param SET — the last open surface after three sessions closed the individual families, carrying the same silent-lie class the s25 lesson-79 named**.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: no new rotation (non-gap)

Both pairs are unchanged since s26. `/login` serves `index-CM-qL9yl.js` + `index-DWYJeyVS.css` (the s26 rotation stands); the app route serves `index-DhFaB31Z.js` + `index-DFdILd41.css` (the eighth consecutive sweep of the app-route pair). The login UI strings live in the dynamically-imported `UserAppMain-12hFZEhy.js` ("Sign in to continue", "Forgot password", "Need an account" — all present; "Welcome to ServiceDesk" renders live), and `from_url` appears ×19 across the chunk graph (AuthAPI, AuthContext, axiosClient, UserAppMain) — the deep-link contract intact. The session's own live login ran through the current bundles. **The Rolldown wave did not continue.**

### F2 — their aggregation surface: the /count endpoint (first measurement, non-gap)

The platform DOES expose a count endpoint — `GET /api/apps/{app_id}/entities/Ticket/count` → `200 {"count":121}` — a capability the decoded SDK client never exposes (the `Le` entity-client factory in `UserAppMain-12hFZEhy.js` lists list/filter/get/create/update/delete/deleteMany/bulkCreate/updateMany/bulkUpdate/importEntities/subscribe — **no count method**). The measured grammar:

| Probe | Result |
|---|---|
| `/Ticket/count` | `200 {"count":121}` — the total |
| `?status=open` (ad-hoc param grammar) | **IGNORED** → 121 (does not compose) |
| `?q={"status":"open"}` (the SDK `filter()` JSON grammar) | `200 {"count":116}` — composes |
| `?q={"status":"banana"}` / `?q={"banana":"1"}` | `{"count":0}` — garbage values AND unknown fields → 0 |
| `?q=not-json` | `400 "q must be a JSON object"` |
| `/Comment/count` | `{"count":61}` |
| `/User/count` | **403** — "Permission denied for count operation on User entity. Only collaborators can view the list of users" (matches the s24 User-entity 403) |

**Decision (consistent with the s26 no-analytics doctrine): we do NOT add a count endpoint.** Their app never calls it (their visible metrics are all client-computed from full lists); our `/api/stats` already ships the server-computed aggregate as the superset. A count endpoint on our side would be surface without a caller. Documented as the platform-capability measurement.

### F3 — the chrome ledger holds (ninth re-verification, non-gap)

All axes hold exactly: viewport-fit=cover auth-pages-only (`/login` has it, `/dashboard` doesn't); the PWA trio (manifest + theme-color #000000 + apple-touch-icon 180×180) on `/login` only; the apple pair (status-bar-style + apple-mobile-web-app-title) on both routes; og:image 1200×630 with true declared dims; twitter:card summary_large_image; `/dashboard` canonical + og:url at the origin root; segment-verbatim titles on every route tested (including the newly-noted unknown routes — `Banana | ServiceDesk`).

### F4 — the mobile matrix + the TW v4 guards (ninth re-verification, non-gap)

Their standing defects persist: `scrollWidth 468` at `clientWidth 375` on `/dashboard`; the sheet STAYS OPEN after a nav-tap (the 288×812 drawer + its overlay remain in the DOM post-navigation to `/mytickets`); the `rgba(0,0,0,0.8)` overlay. Ours: **375 = 375** on both routes, the `oklab(0 0 0 / 0.8)` overlay, **nav-tap auto-close + navigate** (zero open data-state elements after the tap). The TW v4 guards code-verified standing: `@theme inline` ×2, the cursor preflight in `@layer base`, `--radius-sm: 0.25rem`, the pinned system font stack, no config file.

### NEW — the routing/404 surface (first measurement of the logged-in state, non-gap — convergence)

The s20 ledger recorded their logged-OUT catch-all gate (unknown routes + their own /signup bounce to `/login?from_url=…`). This session measured the logged-IN state for the first time:

- **Unknown routes logged-in render the in-app 404** — HTTP 200 shell, `{$Path} | ServiceDesk` title, `h1 "404"` + `h2 "Page Not Found"` + a "Go Home" button. No login bounce.
- **Their `/signup` ROUTE 404s** (logged-in too) — their signup entry is the in-card view state on `/login` (the "Need an account? Sign up" button switches the login card to "Create your account" — Email/Password/Confirm Password/"Create account"/"Back to sign in"), NOT a route.
- **Their logged-out gate HOLDS** (the s20 ledger entry is intact — verified with a clean localStorage: `/banana` → client-side redirect to `/login?from_url=…`).

Ours: the true **404 status** + the same 404 design ("404" / "Page Not Found" / "Go Home" → link to `/dashboard`) + the **real `/signup` route** (the s20 superset) + the **same in-card signup view** on `/login` (the parity path). Their in-app 404 design converged to what our s4 design already shipped. **Parity + the SEO superset; nothing to change.**

### P1 — the own-side audit: the list API's query-param SET is the last silent lie (the actionable gap)

The route's known families were each strict-validated across s24–s26: pagination (`limit`/`skip`, s24), vocabulary (`status`/`priority`/`sort`/`scope`, s25), free text (`search`, s26). But the SET itself was never closed. Measured live this session (authenticated):

| Probe | Result |
|---|---|
| `?banana=1` | **200, the unfiltered set** — silently ignored |
| `?category=hardware` | **200, the unfiltered set** — a plausible filter (the schema has categories; their platform filters any field) presented as ignored |
| `?q={"status":"open"}` | **200, the unfiltered set** — their platform's JSON grammar, silently ignored |
| `?fields=id` / `?sort_dir=desc` | **200, the unfiltered set** |
| `?status=open&status=resolved` | **200, open's rows** — duplicates are FIRST-wins by the `URLSearchParams.get()` accident; their platform is LAST-wins (the s26 F1 measurement) |

This is exactly the s25 lesson-79 class ("a silently-ignored param is a lie the caller pays for"): a caller who sends `?category=hardware` gets the unfiltered feed presented as matches — indistinguishable from "no hardware tickets exist". The duplicate-param ambiguity (first-wins vs the reference's last-wins) is the same lie in a different shape: the caller cannot know which value was honored.

**Callers audited (no legitimate caller breaks):** the mytickets UI sends `{scope, sort, search?, status?, priority?}` — all known, all single-valued (`URLSearchParams.set`); the sidebar stats fetches `/api/stats` (no params); the E2E spec fetches `/api/tickets?scope=mine&sort=newest`; the smoke script sends `search`/`limit`/`skip`/`status`/`priority` — all known, all single-valued. Zero callers send unknown or duplicate params today.

## 2. The remediation — P1: the strict param-set contract

**Design (the `parseListQuery` seam, completing the route's param matrix):**

1. **The closed set** — `LIST_QUERY_PARAMS` in `src/lib/constants.ts`: `["search", "status", "priority", "sort", "scope", "limit", "skip"]` (the seven the route reads, in the documented order), with the semantics-contract comment.
2. **The seam** — `parseListQuery(searchParams: URLSearchParams)` in `src/lib/validation.ts`, called FIRST in the GET handler (before `parseListSearch`/`parseListFilters`/`parseListParams`):
   - Any param name outside the set → `{ ok: false, error: "unknown query parameter: ${name} (allowed: search, status, priority, sort, scope, limit, skip)" }`.
   - Any param appearing more than once (`searchParams.getAll(name).length > 1`) → `{ ok: false, error: "duplicate query parameter: ${name}" }` — the honest resolution of the first-vs-last ambiguity: neither value is honored, the caller is told.
   - Otherwise `{ ok: true }` — the individual families' validation proceeds exactly as today (the empty-as-absent s25 convention for KNOWN names is untouched).
3. **The route wiring** — `src/app/api/tickets/route.ts` GET: parse the set first, 400 with the message on failure (the s24/s25/s26 message style).
4. **The smoke pins** (3): `?banana=1` → 400 + the unknown message; `?status=open&status=resolved` → 400 + the duplicate message; the seven-known-param composition `?search=Outlook&status=resolved&priority=low&sort=newest&scope=mine&limit=5&skip=0` → 200 with exactly 1 row (the seeded Outlook ticket — resolved/low).
5. **The unit pins** (7, RED first): unknown param rejected with the exact message; a second unknown param alongside a known one still rejected; each of the seven known names accepted (a loop pin); duplicates rejected with the exact message; duplicate limit rejected; the no-param happy path ok; all-seven-present ok.
6. **Docs**: README (badges 87→94 + the API-table param-set row + the testing notes), AGENTS.md (the session-27 contracts section + the commands-table unit/smoke lines), CLAUDE.md (the unit/smoke lines + the closed-set anti-pattern), PAD (§7.1 counts + the s27 known-issues row), service-desk_SKILL.md v2.25.0 (lesson 81: an unclosed param set is a silent lie — validate the grammar, not just the values), `docs/session_43.md` (the narrative log), this plan's execution status, `worklog.md`.

**Explicitly NOT in scope** (considered and deferred, with reasons):
- **A count endpoint** — their app never calls the platform's; our `/api/stats` is the superset (F2 decision above).
- **Strict param-set on `/api/stats`** — the route has zero params; no caller story for sending any. The list API is the surface with the caller-composable grammar.
- **Adopting their last-wins duplicate semantics** — a duplicate is a caller bug; the 400 is the honest answer (and matches our 400-on-garbage doctrine rather than their platform's silent pick).
- **The `q=` JSON grammar** — the s24/s26 architecture divergence stands (our strict-vocabulary 400 superset vs their generic platform trait).

## 3. Validation of this plan against the codebase

- **The seams verified:** `GET /api/tickets` (`src/app/api/tickets/route.ts`) — the GET handler currently calls `parseListSearch` (line 34) → `parseListFilters` (line 47) → `parseListParams` (line 57); the `parseListQuery` call drops in before `parseListSearch`, returning the 400 before any other parsing (fail-fast on the grammar level, then the family level). The unit seam (`src/lib/__tests__/domain.test.ts`) already imports from `validation.ts` + `constants.ts` and carries the `parseListParams`/`parseListFilters`/`parseListSearch` describes — the new block drops in beside them. `URLSearchParams` is a pure standard-type input (the vitest node environment constraint holds).
- **The iteration protocol verified:** `searchParams` is iterable (`for (const [key] of searchParams)`) and `searchParams.getAll(key)` returns every occurrence — both verified against the live Node in this session's probes. No new dependencies.
- **The smoke-pin fixtures verified:** the demo user owns 5 seeded tickets + the smoke script's fixture (created + cleaned within the run); the Outlook ticket ("Outlook signature resets on restart" — resolved/low) is the same idempotent pin the s26 smoke uses (`?search=Outlook` → exactly 1) — the composition pin composes the same row across six more known params, all of which it satisfies (status=resolved ✓, priority=low ✓, sort=newest ✓ — it is the newest resolved/low match, scope=mine ✓ it's the demo user's, limit=5/skip=0 ✓ one row within the first five). The pin block creates no fixtures (read-only + 400 probes).
- **The E2E surface unchanged:** the one direct API caller in the suite fetches `/api/tickets?scope=mine&sort=newest` (known, single-valued); every UI-driven flow goes through the mytickets page's `URLSearchParams.set` construction (known, single-valued). The 196 specs cannot see the grammar change.
- **Rate-budget arithmetic unchanged:** the pins ride the demo user's existing cookie jar; no new logins.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| A legitimate future caller sends an unknown param and now gets a 400 | That is the contract working as designed — the message names the param AND the allowed set (self-documenting). No caller today sends any (audited: UI, E2E, smoke). The reference's own generic-grammar surface (unknown fields → `[]`) is stricter still. |
| A future proxy/CDN appends a tracking param to the query string | None exists in this deployment (no analytics middleware — verified in the layout/middleware surface). The 400 would surface it immediately rather than silently mis-filtering. |
| The duplicate 400 breaks a URL-builder that appends | None ships today (the only builder is the mytickets `URLSearchParams.set` — replace-semantics by construction). |
| The E2E suite's fetch pin (`?scope=mine&sort=newest`) | Both params known + single-valued — unaffected. |
| The smoke script's own probes (`?search=Smoke`, `?limit=2`, …) | All known + single-valued — unaffected. |
| The reference re-drifts mid-session | The ledger re-measured at the live probes (F3/F4); the docs finalize against the measured state. |

## 5. Process lessons (for the next agent)

1. **Validate the grammar, not just the values.** Three sessions closed the value vocabularies (limit/skip, status/priority/sort/scope, search) while the SET stayed open — `?banana=1` sailed through every gate because no test asked "is this param allowed to exist?". The strict-param doctrine completes at the SET level: unknown names → 400, duplicates → 400, then the family validations. The route's matrix is now closed twice over.
2. **A capability with no caller is a documentation finding, not a feature.** Their platform's /count endpoint took five curls to discover and zero product decisions to resolve — their own SDK never wraps it. The clone question is never "what does the platform expose" but "what does the app's user-visible surface use" — the s26 analytics doctrine applied again.
3. **Verify suspected string corruption at the byte level.** This session's audit flagged two "defects" (a health-route log prefix and a stats-route destructuring that both LOOKED truncated in tool output) — both were display-layer artifacts (the output renderer ate the `[h`/`[m` bracket prefixes). `od -c` on the exact line refuted both in seconds. A corruption claim needs the bytes, not the echo.

**Execution status (2026-10-11):**

**Execution status (2026-10-11, all green):**
1. ✅ P1: the strict param-set contract — the RED pin added to `domain.test.ts` (a `parseListQuery` describe: 7 pins — the no-param happy path, every known name accepted, the all-seven composition, the unknown-name rejects with the exact message naming the param AND the allowed set, the unknown-alongside-known reject, the duplicate rejects across families, the s25 empty-as-absent convention preserved for KNOWN names) — RED confirmed (7 failed: `parseListQuery is not a function`) → the GREEN: `LIST_QUERY_PARAMS` in `constants.ts` (with the semantics-contract comment) + `parseListQuery` in `validation.ts` + the GET handler gated FIRST (the grammar level precedes the value level; the known families' validators untouched) → **94 unit GREEN** (87 + 7).
2. ✅ P2: the param-set smoke pins — all three added (`?banana=1` → 400 + the unknown message + the allowed set; `?status=open&status=resolved` → 400 + the duplicate message; the seven-known-param composition → exactly 1 — the seeded Outlook ticket) — **GREEN on first run, 41 PASS lines** (the standing 38 + 3 new).
3. ✅ Full gate in the CLEAN environment (:3000 confirmed down): lint ✓ typecheck ✓ 94 unit ✓ build ✓ **196/196 E2E** ✓ (unchanged; zero regressions — every UI-driven fetch sends known single-valued params) smoke **41 PASS lines** ✓. Seed re-verified canonical (4/11/3/0) after the gate.
4. ✅ Live paired re-verification (production standalone :3000): the new `scripts/s27-live-verify.mjs` ALL GREEN (14 checks — the login + cookie capture, the banana/category/q/fields/sort_dir unknown rejects, the known-alongside-unknown reject, the status + limit duplicate rejects, the s25 empty-as-absent convention, the seven-param composition → exactly 1, the no-param default view, the s26 search contract re-verified through the grammar gate, the s25 vocabulary contract re-verified, the logged-out 401). The s26 re-run ALL GREEN (15 checks); the s25 re-run ALL GREEN (13); the s24 re-run ALL GREEN. The UI round-trip verified through the real mytickets page (5 cards → typing "VPN" → exactly 1 card) + the mobile matrix re-verified on the new build at 375×812 (375=375, the menu opens, the nav-tap auto-closes + navigates — verified with a real browser click after an eval-based `.click()` produced a false alarm).
5. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s27.sh` (the s26 lineage verbatim; all four FATAL guards green); VLM-verified shots 02 + 05 (LAYOUT-OK).
6. ✅ Docs: README (the badges 87→94 + the unit/smoke command lines + the E2E-notes s27 paragraph), AGENTS.md (the session-27 contracts section + the commands-table unit/smoke lines + the reference list through s27), CLAUDE.md (the unit/smoke lines + the closed-set anti-pattern), PAD (§7.1 counts — domain 49, smoke 41 steps, the checklist 94/94 — + the s27 known-issues row), service-desk_SKILL.md **v2.25.0** (lesson 81), `docs/session_43.md` (the narrative log), this status block, `worklog.md`.
7. ✅ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only, `0317db1`) — remote verified == local HEAD; tracking synced; keys shredded (the wrapper's temp copy + the operator key); tree clean; no new branches. The CI run on the push (**Run 59**) completed **success** (verified via the run-history aria-labels — the s18 method; the anonymous REST API was 403 rate-limited this session, the standing s25/s26 condition; Run 58 on the operator's transcript commit also verified green).
