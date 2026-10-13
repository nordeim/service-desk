# ServiceDesk — Session 41 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline (the workspace INTACT this session — no re-clone needed; `git pull` → main @ `0c7e974`), remediation of the identified own-side defects, and full re-verification. Session 41 follows the session-40 remediation (commits `6219241` + `ffdf5bc` + the operator's `0c7e974` transcript commit; briefing docs `docs/session_69.md` + `docs/remediation-plan-session40.md` + `worklog.md` + `docs/session_70.md`). This session executes the s69 next-step shortlist: the standing ledger re-checks (NO thirteenth /login wave — the entry pair is hash-stable), the s4-defect + overflow ledgers (23rd measurement), and the own-side audit at the next level (the s69 candidates: **the OPTIONS allow-list single source** — CONFIRMED actionable; the catch-all's OPTIONS-vs-known-route boundary — verified documented-and-holding, non-defect; plus the NEW-surface probe that found the health degraded-path closure below).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s40 response-layer/bundle/write-path/proxy/method doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP** (the twelfth /login wave persists byte-identical — no thirteenth rotation; the chrome ledger exact; their three standing defects persist — ours the working superset, re-verified via real clicks + the paired VLM check LAYOUT-OK); and the own-side audit found **one actionable defect + one false finding turned lesson: P1 — the OPTIONS allow-list is hard-coded ~56× across the 11 routes (the s69 drift-risk candidate, remediated below); P2 — an apparent first-commit-vintage log-prefix typo that hex-dumped to a FALSE FINDING (the s18 display-layer class — the third firing) behind which sat the REAL defect: the 503 degraded path is completely unpinned** (no test anywhere exercises it — the s31 clean-but-unpinned doctrine applied to the log layer).

## 1. The gap analysis (all measured this session — the 23rd sweep)

### F1 — the bundle sweep: NO THIRTEENTH /login WAVE (non-gap)

The reference's /login entry pair is UNCHANGED from the s40 measurement: `index-DV3Dmjzy.js` (103851 bytes — byte-size-identical) + `index-RwB3lDG6.css`; `UserAppMain-icZpSP83.js` hash-stable at 58756 bytes with `from_url` ×14 (identical counts) + all six login-card strings; `logoutReturnPath-HjtsxsFd.js` hash-stable; the app-route pair UNCHANGED (`index-DhFaB31Z.js`, live-DOM-verified); the live logout measured: `/login?from_url=<encoded dashboard>` — the s37 contract intact. **Non-gap (the twelfth wave persists).**

### F2 — the chrome ledger holds (23rd re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon 180×180). `/dashboard`: plain viewport + NO PWA trio. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 23rd)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified this session). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 23rd)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` still returns the `fixed top-0 z-[100]` toast-container div, and agent-browser's own coverage check REFUSED the real click on the Toggle Sidebar button ("covered by `<div.fixed.top-0`…") — the reference's mobile menu cannot be opened by a real click (dialogs: 0 after the attempt). Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667`), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision CLI, after correcting the first capture to OUR dashboard — the initial run compared their dashboard against our /mytickets, an invalid pairing): **LAYOUT-OK. Non-gap.**

### P1 — the own-side audit: the OPTIONS allow-list is ~56 hard-coded literals (THE DRIFT RISK, the s69 candidate)

The s40 remediation shipped the 11-route stub matrix with the honest allow lists — as **duplicated string literals**: each route file carries its allow string 5-6× (every stub + the explicit OPTIONS), ~56 literals total across 11 files. Measured:

| Route | Implemented | Duplicated literal | Instances |
|---|---|---|---|
| `/api/health` | GET | `"GET, HEAD, OPTIONS"` | 5 |
| `/api/auth/me` | GET | `"GET, HEAD, OPTIONS"` | 5 |
| `/api/auth/login` | POST, DELETE | `"POST, DELETE, OPTIONS"` | 5 |
| `/api/auth/logout` | POST | `"POST, OPTIONS"` | 6 |
| `/api/auth/signup` | POST | `"POST, OPTIONS"` | 6 |
| `/api/auth/forgot-password` | POST | `"POST, OPTIONS"` | 6 |
| `/api/stats` | GET | `"GET, HEAD, OPTIONS"` | 5 |
| `/api/tickets` | GET, POST | `"GET, HEAD, POST, OPTIONS"` | 4 |
| `/api/tickets/[id]` | GET, PATCH | `"GET, HEAD, PATCH, OPTIONS"` | 4 |
| `/api/tickets/[id]/comments` | POST | `"POST, OPTIONS"` | 6 |
| `/api/tickets/[id]/attachments/[attachmentId]` | GET | `"GET, HEAD, OPTIONS"` | 5 |

**The drift scenario (the s69 log's own words):** "a future method addition must update both the stub set and the allow string" — every copy. A dev adding a `PUT` handler to `/api/stats` must remember to delete the PUT stub AND update 5 copies of the allow string (or the OPTIONS advertisement becomes a lie exactly like the one the s40 experiment measured). The same single-source doctrine that `LIST_QUERY_PARAMS` (s27) and `ROUTE_METHODS`-style tables solved for the query/body grammars applies here.

**The design (validated against every current string):** a derivation seam `routeAllow(implemented: readonly string[]): string` in `src/lib/api-methods.ts` — the canonical HTTP method order `[GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS]` filtered to (the implemented set ∪ {HEAD if GET ∈ implemented} ∪ {OPTIONS}). Every one of the 11 current strings reproduces exactly under this derivation (verified by inspection: the s40 measurements all list methods in this order with OPTIONS last, HEAD iff a GET exists). Each route file then carries ONE declaration:

```ts
// The single source: this route's implemented methods. The stubs and the
// OPTIONS advertisement both derive from it — never edit the string by hand.
const ALLOW = routeAllow(["GET"]);
```

with every stub + the OPTIONS consuming `ALLOW`. The test layer freezes the equivalence (below), the smoke s40 block (121 steps, unchanged) pins the live surface, and the s40 live-verify script re-runs on the refactored build.

**The consistency pin (the load-bearing half):** a new `tests/api-allow-source.test.ts` imports all 11 route modules (the `tests/api-catchall.test.ts` pattern — the handlers are importable pure modules; `@/lib/db` is vi-mocked so no Prisma instantiation) and, per route: (a) the module's exported HTTP-method keys exactly equal the declared implemented set ∪ the derived stub set ∪ {OPTIONS} — catches a missing stub (the framework's empty 405 returns) or an unexpected export; (b) `OPTIONS()` answers 204 + the derived allow string — catches allow drift; (c) every stub answers 405 + `{error}` + the same derived Allow. Plus direct `routeAllow` derivation pins (the ordering rule, the HEAD-iff-GET rule, the OPTIONS-append rule, input-order independence).

### P2 — the own-side audit: the health degraded path (the LOG-LAYER closure — RESOLVED AS A FALSE FINDING + A REAL UNPINNED PATH)

**EXECUTION UPDATE (the honest correction):** the "typo" was a FALSE FINDING — the s18 hex-dump doctrine's THIRD firing, caught mid-session before any "fix" shipped. The display layer (grep / git show / the vitest stderr trace) renders `"[health] database check failed:"` as `"ealth] database check failed:"` — the output-capture layer eats the `[h` as a CSI-style escape, exactly the s18 class (`branches: [main]` read as `branches: ain]` through cat/grep). The hex dump (`od -c` on the working tree AND on the first commit's blob `02d8fd8`) shows the bytes were always correct. The root-cause trigger: the new prefix pin PASSED where the "typo" predicted a FAIL — the inverted s38 rule (a pin passing for a reason you did not design is a signal, not a success) — and the investigation that followed hex-dumped the evidence before acting. **The generalized lesson: ANY bracket-prefixed string read through a terminal/capture layer is suspect — hex-dump before declaring a string defect.**

The REAL defect behind the false finding stands:

1. **The 503 path is unpinned everywhere**: the smoke script pins `/api/health` 200-ok and 400-grammar only; no unit test, E2E spec, or live-verify script ever exercises the DB-down branch (every gate runs with the DB up — the honest reason 41 sessions never verified the log line's actual bytes either).
2. **The log layer (the server's STDERR) is an unaudited axis**: every session from s21 to s40 audited a response layer — statuses, envelopes, headers, cookies, grammars, methods — never the operator-facing log stream. The `[prefix]` convention is a grep contract; it is now pinned at the byte level.

**The pin (no code change — the route was always correct):** `tests/health-degraded.test.ts` with `vi.mock` on `@/lib/db` (the `$queryRaw` rejection is injected; the health handler is otherwise pure): the 503 status + the exact degraded body (`{status: "degraded", db: "down", time}`) + the console.error spy asserting the call's first argument starts with `[health]`. The pins pass against the current tree (clean-but-unpinned, the s31 doctrine — the mutation checks demonstrate the bite).

### The s69 candidate verified non-defect: the catch-all's OPTIONS-vs-known-route boundary

The `[[...path]]` catch-all answers OPTIONS with the JSON 404 (not 204) on unknown paths — DELIBERATE (the route's own comment: "The explicit OPTIONS export exists precisely to prevent the framework's auto-204-with-allow from implying the path exists with a method set"), pinned live by the s33 smoke block ("OPTIONS 404-not-204"). A nonexistent path is unknown regardless of verb. **Documented-and-holding — non-defect, no change.**

## 2. The remediation

### Component 1 — P1: the routeAllow derivation seam + the 11-route single-source refactor

**Code changes (one seam + 11 route files):**

1. `src/lib/api-methods.ts` — add `routeAllow(implemented: readonly string[]): string`:
   - The canonical order constant `[GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS]`.
   - The rules: union with `{HEAD}` iff `GET` ∈ implemented (the framework's auto-HEAD derivation — never advertised on GET-less routes); always union `{OPTIONS}`; filter by the canonical order; join with `", "`.
   - Unknown method names in the input are dropped by the filter (documented; the consistency pin's export-key check catches a typo'd declaration — the declared-but-not-exported method fails the key-set assertion).
2. The 11 route files — replace each route's 5-6 duplicated literals with `const ALLOW = routeAllow([...])` (the implemented-methods array, one per route, exactly the s40 matrix) + the header comment pointing at the single source. No behavioral change (every derived string is byte-identical to the current literal — verified per route).

**TDD (the honest RED → GREEN per the s31 pins-on-clean-contracts doctrine):**
- The RED: the `routeAllow` unit pins import a seam that does not exist → the module-level import fails (the s40 RED pattern).
- The GREEN: the seam + the refactor; the consistency pins then prove the equivalence (the 11-route table cross-check: export keys, the 204 advertisement, every 405 stub shape — all against the DERIVED string, not a re-declared literal).
- **No E2E pins** (the s21 doctrine); **no smoke changes** (the s40 block already pins the live matrix — the refactor must keep it green, which IS the behavior-preservation proof).

**The mutation check (post-GREEN, each observed + reverted + re-verified):**
- Mutation A: drop `"POST"` from `/api/tickets`'s `routeAllow(["GET", "POST"])` → the advertisement pin AND the stub pins fail (the derived string no longer matches the module's true surface).
- Mutation B: remove the `PUT` stub export from `/api/health` → the export-key pin fails (the module no longer stubs PUT; the framework's empty 405 would return — the exact s40 regression class).
- Mutation C: reorder `routeAllow`'s canonical array (e.g. move OPTIONS first) → the derivation pins fail (the order is part of the frozen contract — every smoke s40 string pins exact equality).

### Component 2 — P2: the health degraded-path closure (the pins only — the false finding resolved, no code change)

**Code change: NONE** — the route's log prefix and 503 shape were always correct (hex-verified this session against the working tree and the first commit's blob).

**The pins:** the new `tests/health-degraded.test.ts` (vi.mock on `@/lib/db` with a rejecting `$queryRaw`; the console.error spied): the degraded-path pin asserts 503 + the exact body shape + the log line's `[health]` prefix. All pass against the current tree (the s31 clean-but-unpinned closure — the honest TDD for pins-on-clean-contracts is the MUTATION check).

**The mutation check (observed):** corrupt the catch's status 503→500 → the status/body pin fails; corrupt the log prefix `[health]`→`[healthX` → the prefix pin fails (the byte-level pin that would have caught 41 display-layer lies); each observed, reverted, re-verified.

### Component 3 — the docs alignment (the standing set)

README (the unit count 181 → 200 + the s41 lines), AGENTS.md (the commands-table test description + the Session-41 contracts section + the reference list + the screenshots lineage s40→s41), CLAUDE.md (the counts + the s41 anti-pattern — the log-layer/stderr audit axis + the single-source doctrine), PAD (§7.1 the routeAllow row + the checklist + the RESOLVED session-41 known-issues row), `service-desk_SKILL.md` (lesson 95 + the version bump v2.39.0), `docs/session_71.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`. `.env.example` re-verified against the codebase (no env changes this session — expected unchanged).

## 3. Non-goals (documented decisions, no code)

- **No behavior changes on the method surface:** every 405 body, every Allow string, every OPTIONS advertisement stays byte-identical (the s40 smoke block's 13 pins are the frozen contract; the refactor is exactly behavior-preserving).
- **No central ROUTE_METHODS registry:** the implemented-set declaration lives IN each route file (next to the handlers it describes); a central string-keyed table adds a key-typ drift class (a route importing the wrong row) that the in-file array cannot have. The test table is the independent cross-check, not the source.
- **No extra exports from route files:** Next's route typegen validates the export surface; `ALLOW` stays a module-local const (never exported).
- **No catch-all changes:** the OPTIONS-404-on-unknown-paths is deliberate and pinned (s33).
- **No E2E method pins:** the smoke layer is the honest pin layer for the API surface (the s21 zero-fixture doctrine); the E2E count stays 198.
- **No new smoke steps:** the s40 block (121 steps) already pins the live matrix; the s41 pins are unit-level (the source-of-truth layer, per the s40 test's own comment pattern).

## 4. The verification plan

1. **TDD RED (observed):** the `routeAllow` derivation pins — 17/17 failed at the import against the missing seam (the s40 RED pattern). The health degraded-path pins: BOTH PASSED — the expected prefix-RED was a false prediction that triggered the hex-dump root-cause (the P2 correction above: the display layer, not the code, was lying).
2. **GREEN (observed):** the seam + the 11-route refactor (56 literals → 11 declarations, byte-identical strings) → 200/200 unit (+6 derivation pins + 11 route consistency pins + 2 health pins).
3. **The mutation checks (observed, 5 total):** A (drop POST from the tickets declaration) bit the /api/tickets consistency pin; B (remove the health PUT stub) bit the /api/health consistency pin; C (reorder the canonical array) bit all 6 derivation pins; D (corrupt the 503→500) bit the degraded-body pin; E (corrupt the log prefix) bit the prefix pin — each observed, reverted, re-verified clean (200/200).
4. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (200) → build → E2E (198 — unchanged) → smoke (121 — unchanged, the behavior-preservation proof).
5. **Live re-verification** on the production standalone :3000 (PID-managed): the s40-live-verify re-run (33/33 — the wrong-method matrix + the OPTIONS table + the standing contracts on the REFACTORED build) + the standing re-runs s24–s40 (the fresh-boot-between-batches doctrine, one script at a time, the seed canonical after every batch).
6. **The UI round-trip** (real login → dashboard → submitticket → the category dropdown → typed title/description → submit → /mytickets → the probe listed → the probe cleaned via Prisma → the seed canonical) + the mobile matrix on the new build (375=375, the real click opens, Escape closes, the nav-tap auto-closes + navigates) — both already GREEN this session on the pre-refactor build; re-run on the refactored build.
7. **Screenshots:** the 10-shot set refreshed via `scripts/capture-screenshots-s41.sh` (the s40 lineage verbatim + the header + the fixture title S41); VLM spot-checks on the convention shots; the four expected changed shots (02/04/05: the time-relative seed dates; 09: the S41 fixture title) VLM-diffed benign.
8. **Docs alignment** (Component 3) + `.env.example` re-verified.
9. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status, push the final status commit.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1 + P2) — complete, recorded in worklog task 116-gap-s41
- [x] The TDD RED (the routeAllow import failure, 17/17; the health pins' unexpected GREEN → the hex-dump root-cause → the P2 false-finding correction)
- [x] The GREEN (the seam + the 11-route refactor — 200/200 unit, no code change to the health route)
- [x] The mutation checks (A/B/C/D/E — each bit exactly its pin, reverted, re-verified)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 200/200 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓ (the behavior-preservation proof — the untouched s40 block green on the refactored routes)
- [x] Live re-verification: the s40 matrix 33/33 re-run on the REFACTORED build + the standing re-runs s24–s40 ALL GREEN (16 scripts, fresh boots, seed canonical after every batch) + the UI round-trip (the S41 probe submitted, listed, cleaned) + the mobile matrix (real clicks: 375=375, open, Escape, nav-tap) + the VLM check (LAYOUT-OK on the refactored build)
- [x] Screenshots (the 10-shot set via capture-screenshots-s41.sh, all FATAL guards passed; VLM 02 + 05 LAYOUT-OK; the one changed shot — 09 the S41 fixture title — VLM-diffed BENIGN) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.39.0/session_71.md/plan/worklog) + `.env.example` re-verified (unchanged, matches)
- [x] Commit + push + CI verification — commit ac7601d pushed to git@github.com:nordeim/service-desk.git main via docs/ssh_git_wrapper_v3.py (the dry-run green first with the explicit --remote — the s28 lesson held; the real push verified: remote == local HEAD @ ac7601d, tracking synced, main only, tree clean; both keys shredded); the CI run on the push (run 38343002663, run_number 105) COMPLETED SUCCESS — verified via the GitHub API + the live badge (build: passing on main, triple cache-buster-read during the API rate-limit window); the final status commit 45c7cb2 pushed after
