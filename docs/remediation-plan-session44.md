# ServiceDesk — Session 44 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the re-cloned workspace (lint ✓ typecheck ✓ 227/227 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓ — the s43 closeout state reproduced exactly, the workspace WAS reset this session so the clone + `bun install` + `db:push` + `db:seed` path re-verified end to end), remediation of the identified own-side defect, and full re-verification. Session 44 follows the session-43 remediation (commits `7510152` + `ee5453a`; briefing docs `docs/session_75.md` + `docs/remediation-plan-session43.md` + `worklog.md` + `docs/session_76.md` — the operator's transcript of the s43 run). `.env` recreated from `.env.example` (the gitignored casualty of the workspace reset) with a fresh `AUTH_SECRET`; `db/custom.db` provisioned via `bun run db:push && bun run db:seed` (the canonical 4/11/3).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s43 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP (the 26th)** — the FOURTEENTH /login wave arrived (`index-BFXNaE6A.js` → `index-ItakIlJm.js`, `UserAppMain-sbI2Sg7Z.js` → `UserAppMain-g8BqXFvn.js`, and for the first time since s17 the login CSS rotated `index-RwB3lDG6.css` → `index-ZklCvODH.css`), measured as: the login-contract carrier `UserAppMain-g8BqXFvn.js` **byte-size-identical at 58756 bytes with 100 differing bytes (all import specifiers — the s43 class)** and every contract-string count identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39); the entry +126 bytes, ALL dependency-map hash substitutions plus ONE new platform chunk reference (`HandleSmall-BOjIk7ow.js`); the CSS +1068 bytes = **12 generic platform utility rules added + 1 hardcoded accent rule removed** (rule-level diff; none touch the login contract surface — semantic badge/focus-ring/destructive vars, a `min-h-[var(--space-*)]` pair, a webkit-search-cancel-button rule); the old chunks remain live-fetchable for the byte comparisons. Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click still REFUSED by agent-browser's coverage check, dialogs stay 0); ours the working superset, re-verified via the real-click mobile matrix (375=375, the sheet opens at 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates) + the paired VLM check (**LAYOUT-OK**). The own-side audit (the s75 next-session shortlist, executed then extended): the corpus-count drift watch CLEAN (all five docs claim 227, no drift), nothing new grew (the `7510152..ee5453a` diff is docs-only), and **the e2e-db provisioning surface TESTED for the first time** (the s75-documented "npx path UNTESTED in a bun environment" candidate) — the full bun-missing simulation (PATH stripped of bun) shows the fallback chain WORKS, but exposes **one actionable defect: P1 — the seed fallback `npx tsx prisma/seed.ts` executes `tsx` — a tool that is NOT a project dependency — by fetching it from the npm registry at fallback time** (measured this session: tsx@4.23.15 auto-installed with the npm warning "The following package was not found and will be installed"). The s18 display-layer artifact fired a SIXTH time (the CI YAML's `branches: [main]` rendered as `ain]` in tool output — hex-dumped, bytes correct; the doctrine extends to bracketed YAML scalars).

## 1. The gap analysis (all measured this session — the 26th sweep)

### F1 — the bundle sweep: the FOURTEENTH /login wave arrived, a platform re-hash + generic utility additions (non-gap)

The reference's /login surface rotated for the second consecutive session: entry `index-BFXNaE6A.js` → `index-ItakIlJm.js` (103977 bytes, +126 vs the s43 chunk), `UserAppMain-sbI2Sg7Z.js` → `UserAppMain-g8BqXFvn.js` (**58756 bytes — byte-size-identical; 100 differing bytes, all import specifiers — the same class as the s43 re-hash's 99**), and — for the first time since the s17 measurement — the login CSS `index-RwB3lDG6.css` → `index-ZklCvODH.css` (899208 vs 898140 bytes, +1068). Every login-contract string count is identical in the UserAppMain carrier (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39). The entry's +126 bytes decompose entirely into dependency-map hash substitutions + one NEW platform chunk reference (`static/HandleSmall-BOjIk7ow.js`). The CSS diff decomposes (rule-level, 10567 vs 10556 rules) into **12 added generic platform utilities** (`max-h-[min(350px,calc(100dvh-8rem))]`, `min-h-[var(--space-8)]`/`--space-10`, `min-w-[var(--space-8)]`, `bg-[var(--sem-badge-fill-accent-light)]`, `accent-[var(--sem-text-icon-success)]`, `focus:ring-[var(--sem-border-focus-ring)]`, a `group:has([data-slide-grip]:focus-visible)` visibility rule, two dark-mode destructive color rules, a webkit-search-cancel-button appearance rule, a `dark:[&>svg]` destructive rule) **and 1 removed rule** (`.accent-[\#228B22]` — a hardcoded forest-green replaced by the semantic-var variant). None of the added/removed rules touch the login-card class surface. `logoutReturnPath-HjtsxsFd.js` remains hash-STABLE (the 27th consecutive session). All old chunks remain live-fetchable (HTTP 200) for the byte comparisons. **Non-gap — the platform rebuilt its graph again and grew generic utilities; the login contract carrier is untouched.**

### F2 — the chrome ledger holds (26th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon). `/dashboard`: plain viewport + NO PWA trio. Both re-measured live via agent-browser after a fresh reference login. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 26th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified this session on the freshly built standalone). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 26th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` and the toggle button's own center point both return the `fixed top-0 z-[100]` toast-container div, and agent-browser's coverage check REFUSED the real click on the mobile menu toggle ("Element 'header button' is covered by `<div.fixed.top-0`…") — the reference's mobile menu cannot be opened by a real click (a programmatic `.click()` opens it, confirming the button works and the defect is the toast overlay; dialogs stay 0 after any real-click attempt). Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s43 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API via `scripts/s44-vlm-check.mjs`, both images in one prompt): **LAYOUT-OK — "The layout structure, including the sidebar navigation, header placement, stats cards grid, and ticket table arrangement, is identical between the two images." Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click) → typed title/description → submit → /mytickets → the S44 probe listed → cleaned via Prisma → the seed canonical (4/11/3).

### P1 — the own-side audit: the E2E provisioning fallback runs an unpinned, non-dependency tool from the network (CONFIRMED actionable)

The s75 shortlist's leading candidate — "the e2e-db provisioning surface (the global-setup's bun/npx fallback chain — the npx path UNTESTED in a bun environment)" — was tested for the first time this session, two ways. **First, the direct fallback commands:** `npx tsx --version` auto-installed `tsx@4.23.15` from the npm registry with the warning "The following package was not found and will be installed" — tsx is NOT in the project's devDependencies. **Second, the full bun-missing simulation** (PATH stripped of `/usr/local/bin`, the bun/bunx location): `npx prisma db push --skip-generate` succeeded (prisma IS a local dependency) and `npx tsx prisma/seed.ts` succeeded (via the network fetch) — producing the canonical 4/11/3 seed.

**The defect, stated precisely:** AGENTS.md documents the contract ("Node ≥ 20 works for everything except `db:seed` … fall back to `npx tsx prisma/seed.ts`"), and `tests/e2e/global-setup.ts` implements it for the E2E provisioning path — but the fallback (a) requires network access on its first firing (a fresh machine, an air-gapped CI runner, or a registry outage breaks the documented contract), (b) executes whatever `tsx` version the registry serves at fallback time — the lockfile (`bun.lock`, `--frozen-lockfile` in CI) governs every OTHER byte this project executes; this one path runs unpinned, un-audited code, the exact supply-chain surface class the project's principles reject elsewhere, and (c) fails offline with a confusing npx error that masks the simple root cause (the tool is absent). The same class as the s43 P1 (a documented invariant held only by convention): a documented contract that works only by network accident.

**The fix:** add `tsx` to `devDependencies` (pinned by `bun.lock`) — the `npx tsx` fallback then resolves from `node_modules/.bin` on every machine that ran `npm install`/`bun install`, no network, pinned version, and the documented AGENTS.md line becomes true offline. Plus the pins that keep it true: a new `tests/e2e-provisioning.test.ts` freezing the fallback-chain shape and the two local-resolution guarantees.

### The environment reset proven end to end (a bonus verification)

The workspace was reset this session (the re-clone path): `git clone` → `bun install` → `cp .env.example .env` (+ AUTH_SECRET) → `bun run db:push && bun run db:seed` → the full gate green. The README quickstart contract (the "clone and run" story ADR-002 protects) is verified on a cold machine — worth recording because the previous four sessions all started from a warm workspace.

## 2. The remediation

### Component 1 — P1: the e2e-provisioning closure (the pinned-tool + the chain pins)

**Code changes:** `package.json` + `bun.lock` — `tsx` added to `devDependencies` (a dev-time-only tool; the standalone build's file tracer never includes it; `bun install` lays it into `node_modules/.bin` for bun users and npm users alike). `tests/e2e/global-setup.ts` — **unchanged** (the chain's code shape is already correct; the fix is the dependency, not the logic). AGENTS.md's fallback line gains the "pinned devDependency" note (Component 3).

**TDD (the honest RED → GREEN):**
- The RED (observed first): `tests/e2e-provisioning.test.ts` fails on the tsx-membership pin against the current `package.json` (tsx absent from devDependencies);
- The GREEN: `bun add -d tsx` lands the pinned dependency; the pin passes; the EXISTING 227 unit tests re-run GREEN (the no-regression proof);
- The offline resolution verified behaviorally: after the fix, `npx tsx --version` resolves from `node_modules/.bin` with NO registry warning, and the bun-missing simulation re-run succeeds offline-style (local resolution).

**The pin set (tests/e2e-provisioning.test.ts, 4 pins):**
1. the chain-shape pin (db push): `global-setup.ts` carries BOTH the bun primary (`bunx prisma db push --skip-generate`) AND the npx fallback (`npx prisma db push --skip-generate`) — the documented AGENTS.md contract, frozen in its code shape (the s43 mutation-C lesson: code-shaped occurrence matching);
2. the chain-shape pin (seed): the same pair for `bun prisma/seed.ts` / `npx tsx prisma/seed.ts`;
3. the offline guarantee: `tsx` ∈ `devDependencies` (the seed fallback never needs the network; the executed version is lockfile-pinned);
4. the local prisma guarantee: `prisma` ∈ `dependencies` (the db-push fallback resolves locally the same way).

**The mutation checks (post-land, each observed + reverted + re-verified):**
- A: remove `tsx` from devDependencies → pin 3 fails (and only pin 3);
- B: corrupt the seed fallback in global-setup (`npx tsx prisma/seed.ts` → `npx ts-node prisma/seed.ts`) → pin 2 fails (and only pin 2);
- C: drop the db-push fallback line entirely → pin 1 fails.

### Component 2 — the docs alignment (the standing set)

README (the counts 227 → 231 + the tsx note in the dev-requirements line), AGENTS.md (the commands-table test description + the NEW Session-44 contracts section + the reference list through s44 + the screenshots lineage s43→s44 + the fallback-line note), CLAUDE.md (the counts + the s44 anti-pattern: the documented-fallback-that-needs-the-network doctrine — a fallback is part of the contract surface, so its tools are dependencies, not registry assumptions), PAD (§7.1 the new test row + the checklist 231 + the RESOLVED session-44 known-issues row), `service-desk_SKILL.md` **v2.42.0** (lesson 98 + the project_state + the description line), `docs/session_77.md` (this session's agent log per the numbering convention: odd docs = agent logs), this plan's execution status, the repo `worklog.md`. `.env.example` re-verified against the codebase (no env changes this session — expected unchanged).

## 3. Non-goals (documented decisions, no code)

- **No global-setup logic refactor:** the try/catch chain's code shape is correct and now pinned; restructuring it (e.g., a shared runner module or error aggregation) would churn a verified provisioning path for zero contract gain.
- **No error-masking fix in the chain:** if the bun command fails for a REAL reason (a corrupt schema, a locked db), the npx retry re-runs the same operation and surfaces the same underlying error from the second command — the root cause remains visible in the output; converting that into aggregated error reporting couples the E2E boot path to error-formatting code for no observed failure class.
- **No switch to `node --experimental-strip-types`:** the documented server floor is Node ≥ 20; type stripping needs 22.6+ — swapping a documented fallback for an undocumented runtime requirement narrows the contract instead of widening it.
- **No CI change:** CI runs under bun (setup-bun), so the fallback never fires there; the fix targets the npm-user + offline audience the AGENTS.md line documents.
- **No behavior changes on any surface:** the E2E provisioning, the seed output, every script's execution, and every API path stay byte-identical (the dependency addition moves nothing at runtime).

## 4. The verification plan

1. **TDD:** the RED observed (the tsx-membership pin fails against the current package.json) → the GREEN (`bun add -d tsx`; the pin + the 227 existing tests all green) → the offline-resolution behavioral check (`npx tsx --version` with no registry warning; the bun-missing simulation re-run).
2. **The mutation checks (A/B/C, each observed + reverted + re-verified):** each mutation bit exactly its pin.
3. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (231) → build → E2E (198 — unchanged; the provisioning path now resolves tsx locally but the bun primary is the one that fires here) → smoke (121 — unchanged).
4. **Live re-verification** on the production standalone :3000 (PID-managed): the s40 live-verify matrix re-run + the UI round-trip + the mobile matrix on the new build + the paired VLM check.
5. **Screenshots:** the 10-shot set refreshed (the s43 lineage verbatim + the header + the fixture title S44); VLM spot-checks on the convention shots; the one expected changed shot (09: the S44 fixture title) VLM-diffed benign against the s43 baseline.
6. **Docs alignment** (Component 2) + `.env.example` re-verified.
7. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1) — complete, recorded in worklog
- [x] The TDD RED (the tsx-membership pin — failed exactly on the tsx pin; one authoring defect fixed en route: the first draft resolved the repo root one level too high, module-scope failure) + the GREEN (tsx → devDependencies; 231/231 unit)
- [x] The offline-resolution behavioral check (npx tsx --version runs with NO registry warning; node_modules/.bin/tsx present; the bun-missing simulation re-run all-local: push ✓ + seed ✓ + the canonical 4/11/3)
- [x] The mutation checks (A/B/C — each bit exactly its pin: A the tsx-membership pin, B the seed-pair pin, C the db-push-pair pin; each observed + reverted + re-verified; one process note: git checkout during mutation A discarded the uncommitted GREEN — re-landed, the remaining mutations switched to surgical sed)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 231/231 unit ✓ build ✓ (one cold-build Turbopack CSS warning, absent on rebuild — no CSS touched) 198/198 E2E ✓ (2.8m) smoke 121 ✓
- [x] Live re-verification: the s40 matrix 33/33 + the standing re-runs s24–s40 ALL GREEN (16 scripts, fresh boots, the persisted scripts/s44-standing-rerun.sh, the seed canonical after every script) + the UI round-trip (the S44 probe C: 201 + listed + navigation, via the response-interceptor diagnosis) + the mobile matrix (375=375, 0,0,288,667, Escape, nav-tap) + the paired VLM check LAYOUT-OK
- [x] Screenshots (the 10-shot set via scripts/capture-screenshots-s44.sh, all FATAL guards passed; VLM spot-checks 02 + 05 LAYOUT-OK; the THREE changed shots — 09 the S44 fixture title, 04/05 the fresh-seed relative timestamps — VLM-diffed BENIGN; the other seven byte-identical) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.42.0/session_77.md/plan/worklog) + `.env.example` re-verified (unchanged, matches)
- [ ] Commit + push + CI verification
