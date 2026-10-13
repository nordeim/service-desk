# ServiceDesk — Session 43 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the restored workspace (lint ✓ typecheck ✓ 212/212 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓ — the s42 closeout state reproduced exactly), remediation of the identified own-side defects, and full re-verification. Session 43 follows the session-42 remediation (commit `731731d`; briefing docs `docs/session_73.md` + `docs/remediation-plan-session42.md` + `worklog.md` + `docs/session_74.md`). The session-74 operator transcript records a tool-level interruption AFTER the s42 push: the CI API confirmation was pending when the session died — this session completed it post-hoc (the badge read `passing` on 3 fresh cache-buster reads; the API itself rate-limited, the documented s39–s42 fallback pattern), and the worklog's s42 push entry (the task-after-122 record) is missing — closed in this session's worklog append.

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s42 response-layer/bundle/write-path/proxy/method/log-layer doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP** — the THIRTEENTH /login wave finally arrived (the entry pair `index-DV3Dmjzy.js` → `index-BFXNaE6A.js`, plus `UserAppMain-icZpSP83.js` → `UserAppMain-sbI2Sg7Z.js`), but the measurement shows it is a **pure platform-side dependency-graph re-hash**: both new chunks are byte-size-identical to their predecessors (103851 / 58756), the differing bytes are import-specifier + dependency-map hash substitutions only, every contract-string count is identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39), and `logoutReturnPath-HjtsxsFd.js` + the app-route pair (`index-DhFaB31Z.js` + `index-DFdILd41.css`) + the login CSS (`index-RwB3lDG6.css`) are all hash-stable. Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real toggle click still REFUSED by agent-browser's coverage check, dialogs: 0); ours the working superset, re-verified via the real-click mobile matrix + the paired VLM check (LAYOUT-OK). The own-side audit (the s73 next-session shortlist, executed and then extended one level further): **the new-site sweep CLEAN (exactly 4 console.* sites, all pinned — no drift since s42), the README/AGENTS/PAD cross-counts CLEAN (all five docs claim 212, no drift), nothing new grew (the 731731d..1b1c58e diff is docs-only)** — and the next-level audit found **two actionable defects: P1 — the package.json script-pin invariant (AGENTS.md invariant #3, "Keep the pin when editing scripts") has NO automated guard: 7 scripts carry the inline `DATABASE_URL='file:../db/custom.db'` pin purely by convention; a future edit that drops one fails nowhere until an ambient-DATABASE_URL sandbox silently redirects the database; P2 — the canonical seed corpus (4 users / 11 tickets / 3 comments) is claimed in README + AGENTS + verified manually after every live-verify script, but pinned NOWHERE in the automated suite: the seed logs counts without asserting them, the E2E global-setup seeds without asserting, and no E2E spec pins the totals — a future edit to `SEED_TICKETS` drifts the fixture under 198 E2E tests + the screenshot lineage + the VLM-diff baselines silently.**

## 1. The gap analysis (all measured this session — the 25th sweep)

### F1 — the bundle sweep: the THIRTEENTH /login wave arrived, a pure re-hash (non-gap)

The reference's /login entry JS rotated for the first time since s40: `index-DV3Dmjzy.js` → `index-BFXNaE6A.js`. Measured: **103851 bytes — byte-size-identical to the s40–s42 chunk** (old chunk still live-fetched at 103851 for the comparison); 3553 differing bytes, ALL of them dependency-map hash substitutions (`mixpanelUtils-CSCduZUu` → `mixpanelUtils-CrbdYE-u`, `i18n-Bb0k8gNB` → `i18n-BbNMeiqz`, and ~200 more static/* chunk references — the platform rebuilt its dependency graph). `UserAppMain-icZpSP83.js` → `UserAppMain-sbI2Sg7Z.js`: **58756 bytes — byte-size-identical**, 99 differing bytes, all import specifiers; every login-card contract-string count identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39). `logoutReturnPath-HjtsxsFd.js` hash-STABLE. The app-route pair from their /dashboard: `index-DhFaB31Z.js` hash-STABLE (the /assets/ root); `index-RwB3lDG6.css` hash-STABLE. **Non-gap — the s40 "pure re-rename" precedent, now at the platform-graph scale.**

### F2 — the chrome ledger holds (25th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon). `/dashboard`: plain viewport + NO PWA trio. Both re-measured live via agent-browser this session. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 25th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified this session). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 25th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` still returns the `fixed top-0 z-[100]` toast-container div, and agent-browser's own coverage check REFUSED the real click on the Toggle Sidebar button ("Element is covered by `<div.fixed.top-0`…") — the reference's mobile menu cannot be opened by a real click (dialogs: 0 after the attempt). Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41/s42 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision CLI with both images in one prompt): **LAYOUT-OK. Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click) → typed title/description → submit → /mytickets → the S43 probe listed → cleaned via Prisma → the seed canonical (4/11/3).

### P1 — the own-side audit: the script-pin invariant is unguarded (CONFIRMED actionable)

AGENTS.md invariant #3 documents the contract: "npm scripts pin `DATABASE_URL` inline. An ambient exported `DATABASE_URL` (sandboxes do this) overrides `.env` files; the inline pin keeps every script pointed at `<repo>/db/custom.db`. **Keep the pin when editing scripts.**" The measured surface: **7 package.json scripts carry the pin** (`dev`, `build`, `start`, `db:push`, `db:seed`, `db:migrate`, `db:reset`), plus two sibling layers — the smoke script's own throwaway pin (`file:../db/smoke.db`, 3 occurrences in `scripts/smoke-test.sh`) and the E2E pair (`file:../db/e2e.db` in `playwright.config.ts` twice + `tests/e2e/global-setup.ts` once). **No automated guard exists anywhere.** The failure mode is exactly the s42 doctrine's class: a documented invariant held only by convention; the drift (a script edit that drops or corrupts a pin) fails nowhere locally — the developer's `.env` still points correctly — and only manifests in ambient-DATABASE_URL sandboxes as a silently redirected database. The same class the s27 param-set, s41 allow-list, and s42 routeAllow seams closed: documented invariant → automated pin.

**The pin design:** `tests/db-script-pins.test.ts` reads `package.json` + the two config surfaces as text and asserts the RULE, not the list — every script named `dev`/`build`/`start` AND every `db:*` script carries the exact inline pin `DATABASE_URL='file:../db/custom.db'` (so a NEW db script added without a pin fails the rule, not the enumeration); the smoke script carries ≥3 `file:../db/smoke.db` pins (the push + seed + server boots); the playwright config + the global-setup each carry `file:../db/e2e.db`. The `db-path.test.ts` seam already pins the RESOLUTION logic; this file pins the LITERALS at their three config layers — together the full db-location contract.

### P2 — the own-side audit: the canonical seed corpus is unpinned (CONFIRMED actionable — a refactor + pins)

The corpus contract is claimed in five places (README "demo corpus: 4 users, 11 tickets, 3 comments" + the AGENTS.md commands table + the PAD + the skill + every worklog live-verify entry) and is load-bearing as the fixture under 198 E2E tests, the screenshot lineage (VLM-diffed BENIGN between sessions — corpus drift would invalidate the baselines), and the live-verify arithmetic (the 4/11/3 checks after every standing re-run). Measured: `prisma/seed.ts` logs the counts without asserting them; `tests/e2e/global-setup.ts` seeds without asserting; no E2E spec pins the totals (dashboard.spec asserts label VISIBILITY; tickets.spec:90 carries only the soft "11+ total" comment). **A future edit to `SEED_TICKETS` (add/remove/retitle a row) drifts the fixture silently.** The structural obstacle to pinning it: `seed.ts` executes `main()` at module scope and instantiates `PrismaClient` — importing it from a unit test would run the seed.

**The design (behavior-preserving extraction + pins):** the corpus moves to a NEW side-effect-free module `prisma/seed-data.ts` (the users array + `SEED_TICKETS` + the `SeedTicket` type — pure data, no Prisma, no main, no crypto). `prisma/seed.ts` imports it (a relative import within `prisma/` — the documented no-`@/`-alias constraint is untouched; the hashPassword + upsert/create logic stays verbatim). `tests/seed-corpus.test.ts` imports the data module (a relative path — vitest resolves it fine) and `@/lib/constants` for the vocabulary cross-check, pinning: exactly 4 users / 11 tickets / 3 comments (the canonical corpus); unique emails + unique ticket titles (the upsert natural keys — a duplicate title would silently skip on re-seed); every ticket owner and comment author ∈ the user set (the referential integrity the seed relies on); every category/priority/status ∈ the app vocabulary (`TICKET_CATEGORIES`/`TICKET_PRIORITIES`/`TICKET_STATUSES` — the guard on the seed's intentionally-duplicated vocabulary); all four statuses present in the corpus (the QUICK STATS fixture — every status counter renders nonzero); the demo login contract (demo@servicedesk.app / Demo1234! — the README quickstart promise).

## 2. The remediation

### Component 1 — P1: the db-script-pins closure (no src/ code change — the pins-on-config doctrine)

**Code changes: NONE.** The 7 pins + the smoke + the E2E literals are all correct (verified by inspection + this session's green gates: the E2E ran against e2e.db, the smoke against smoke.db, the unit/build path resolution against custom.db).

**TDD (the s31/s42 pins-on-clean-contracts doctrine):** the pins land GREEN against the current tree; the honest closure is the MUTATION check.

**The mutation checks (post-land, each observed + reverted + re-verified):**
- A: drop the pin from `db:seed` → the db-script rule pin fails;
- B: corrupt the `start` script's pin value (`custom2.db`) → the runtime-pin + exact-value pins fail;
- C: corrupt the E2E database URL in `global-setup.ts` (`e2e2.db`) → the E2E-layer pin fails.

### Component 2 — P2: the seed-data extraction + the corpus pins (a true RED → GREEN)

**Code change:** the NEW `prisma/seed-data.ts` (pure data module) + the `prisma/seed.ts` import switch (the corpus arrays replaced by the import; hashPassword, main(), and the upsert/create logic byte-identical). Behavior-preserving by construction: the seed's output for a fresh database is the same corpus the old inline arrays produced (the values move, nothing recomputes).

**TDD:**
- The RED (observed first): `tests/seed-corpus.test.ts` fails at the import against the missing `prisma/seed-data.ts` module (the s41 RED pattern — the module-scope failure);
- The GREEN: the extraction lands; the corpus pins pass; the EXISTING 212 unit tests re-run GREEN (the no-regression proof);
- **No E2E pins** (the s21 doctrine); **no smoke changes**; the E2E global-setup keeps seeding through the SAME seed.ts entry point — the extraction is invisible to it.

**The mutation checks:**
- D: drop a ticket from `SEED_TICKETS` → the canonical-counts pin fails;
- E: corrupt a ticket's category to a non-vocabulary value ("hardware2") → the vocabulary pin fails;
- F: break the demo login password ("Demo1235!") → the demo-login pin fails.

### Component 3 — the docs alignment (the standing set)

README (the unit counts 212 → 227 + the seed-data note), AGENTS.md (the commands-table test description + the NEW Session-43 contracts section + the reference list through s43 + the screenshots lineage s42→s43), CLAUDE.md (the counts + the s43 anti-pattern — the fixture-corpus-is-a-contract doctrine), PAD (§7.1 the two new test rows + the checklist + the RESOLVED session-43 known-issues row), `service-desk_SKILL.md` (lesson 97 + the version bump v2.41.0), `docs/session_75.md` (this session's agent log per the numbering convention: odd docs = agent logs), this plan's execution status, the repo `worklog.md` (including the missing s42 push/CI record — the session-74 interruption closure). `.env.example` re-verified against the codebase (no env changes this session — expected unchanged).

## 3. Non-goals (documented decisions, no code)

- **No seed-side assertions at runtime:** the seed keeps logging (not asserting) its counts — a failed seed should finish with a visible log line, not a mid-script throw; the CONTRACT lives in the test layer where it belongs (the s31 doctrine: pins-on-clean-contracts, not asserts-in-the-clean-path).
- **No E2E global-setup count assertions:** the global-setup's job is provisioning; adding assertions couples the boot path to the corpus evolution and doubles the failure surface for the same contract the unit layer now pins.
- **No vocabulary single-sourcing into seed.ts:** the intentional duplication (seed.ts's local vocabulary consts vs `src/lib/constants.ts`) is documented and load-bearing (the no-`@/`-alias constraint); the pin cross-checks the two sides instead of forcing a shared module — the drift guard without the import.
- **No playwright.config/global-setup refactor to a shared E2E_DATABASE_URL module:** three agreeing literals pinned in one test is the honest closure; a shared config module would couple the playwright TS context to the vitest TS context for one string.
- **No behavior changes on any surface:** the seed output, every script's execution, and every E2E/smoke path stay byte-identical (the extraction moves data, not logic).

## 4. The verification plan

1. **TDD:** the P2 RED observed (the corpus pins fail at the missing module import) → the GREEN (the extraction; the corpus pins + the 212 existing tests all green) → the P1 pins land GREEN (the clean-contract closure).
2. **The mutation checks (A–F, each observed + reverted + re-verified):** the three P1 mutations bit exactly their pins; the three P2 mutations bit exactly their pins.
3. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (227) → build → E2E (198 — unchanged) → smoke (121 — unchanged, the behavior-preservation proof).
4. **Live re-verification** on the production standalone :3000 (PID-managed): the s40 live-verify re-run (33/33) + the standing re-runs (the fresh-boot doctrine, one script at a time, the seed canonical after every batch) + the UI round-trip + the mobile matrix on the new build.
5. **Screenshots:** the 10-shot set refreshed (the s42 lineage verbatim + the header + the fixture title S43); VLM spot-checks on the convention shots; the one expected changed shot (09: the S43 fixture title) VLM-diffed benign.
6. **Docs alignment** (Component 3) + `.env.example` re-verified.
7. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status, push the final status commit if needed.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1 + P2) — complete, recorded in worklog
- [x] The TDD RED (the seed-corpus pins — failed at the missing module, observed) + the P1 pins authored (two honest authoring defects fixed en route: the db:generate codegen exception + the playwright const-and-wiring pin)
- [x] The GREEN (the seed-data extraction; 227/227 unit: 212 + 15) — the seed re-run behavior-preserving (the canonical 4/11/3)
- [x] The mutation checks (A/B/C/D/D2/E/F — 7 observations; C's first attempt exposed the bare-substring pin's own false-green (the doc-comment occurrence), hardened to code-shaped + re-verified; D recorded honestly as the sed-artifact variant (an emptied ticket, still length 11) bit the 3 integrity pins; D2 the clean drop bit the counts pin)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 227/227 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓
- [x] Live re-verification: the s40 matrix 33/33 + the standing re-runs s24–s40 ALL GREEN (16 scripts, fresh boots, seed canonical after every script) + the UI round-trip + the mobile matrix + the paired VLM check LAYOUT-OK (pre- and post-remediation builds)
- [x] Screenshots (the 10-shot set, all FATAL guards passed; VLM spot-checks 02 + 05 LAYOUT-OK; the one changed shot 09 VLM-diffed BENIGN — the other nine byte-identical to the s42 baseline) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.41.0/session_75.md/worklog incl. the s42 push-entry closure) + `.env.example` re-verified (unchanged, matches)
- [x] Commit + push + CI verification — see the final status below
