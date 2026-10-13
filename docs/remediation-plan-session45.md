# ServiceDesk — Session 45 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the re-cloned workspace (lint ✓ typecheck ✓ 231/231 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓ — the s44 closeout state reproduced exactly; the workspace WAS reset this session, so the clone + `bun install` + `.env` from example + `db:push` + `db:seed` path ran end to end again, the ADR-002 "clone and run" story), remediation of the identified own-side defect, and full re-verification. Session 45 follows the session-44 remediation (commits `d8497d6` + `cf73754` + the operator's `a31d3b2` transcript commit; briefing docs `docs/session_77.md` + `docs/remediation-plan-session44.md` + `worklog.md` + `docs/session_78.md`).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s44 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP (the 27th)** — the FIFTEENTH /login wave arrived (`index-ItakIlJm.js` → `index-CneaUv24.js` 104739 bytes +762, `UserAppMain-g8BqXFvn.js` → `UserAppMain-DOZft9ba.js` 58761 bytes, `index-ZklCvODH.css` → `index-D0Q6-tUz.css` +1457 bytes) — measured as: the login-contract carrier `UserAppMain-DOZft9ba.js` content-identical (46 string literals both sides, the ONLY 13 changed literals are import-specifier hash substitutions; the +5 bytes are hash-length deltas; every login-contract string count identical: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39); the entry +762 = dependency-map hash substitutions (the vendor graph re-hashed again); the CSS +1457 = 46 generic platform utility rules added + 11 removed (rule-level diff: position/aspect/size/max-w/basis/border-color/padding/ring/disabled-state/dark-mode/max-md responsive utilities — none touching the login-card contract surface). Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click still REFUSED by agent-browser's coverage check, dialogs stay 0; 27th re-verification); ours the working superset (375=375, the real click opens the sheet at 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; 1280=1280; the paired desktop VLM check **LAYOUT-OK**; the UI round-trip green). The own-side audit (the s77 next-session shortlist, executed): the 231-count drift watch CLEAN (five docs consistent), nothing new grew (the `cf73754..a31d3b2` diff is docs-only — session_78.md), the console-site ledger stable (4 sites, all pinned), the CI YAML bytes correct (`branches: [main]` — the s18 display-layer artifact fired an EIGHTH time in tool output, hex-dumped with `od -c`, bytes correct), `bun install --frozen-lockfile` succeeds locally (the lockfile in sync, tsx@4.23.15 entry present). **P1 CONFIRMED: the CI workflow's contract surface is entirely unpinned** — the s77 shortlist's leading candidate ("a `bun install --frozen-lockfile` pin exists nowhere as a test"), zero tests reference `.github/workflows/`.

## 1. The gap analysis (all measured this session — the 27th sweep)

### F1 — the bundle sweep: the FIFTEENTH /login wave, a platform re-hash + generic utility additions (non-gap)

The reference's /login surface rotated for the third consecutive session: entry `index-ItakIlJm.js` → `index-CneaUv24.js` (104739 bytes, +762 vs the s44 chunk), `UserAppMain-g8BqXFvn.js` → `UserAppMain-DOZft9ba.js` (58761 bytes, +5 — the byte delta is entirely import-hash length), and the login CSS `index-ZklCvODH.css` → `index-D0Q6-tUz.css` (900665 vs 899208, +1457). The UserAppMain content-level diff (string-literal multiset, both sides 46 literals): the ONLY 13 changed literals are `./name-HASH.js` import specifiers (axiosClient, appLogo, base, text, text-button, button, index, useFetch, DeadEndPage, separator, label, dist) — zero content strings changed; every login-contract string count identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39). The entry's +762 decompose into dependency-map hash substitutions (the whole vendor graph re-hashed: rolldown-runtime, backend, vendor-react, errorReporting, i18n, vendor-utils, mixpanelUtils, axiosClient, vendor-ui…). The CSS rule-level diff (10511 vs 10476 rules): **46 generic platform utilities added** (`.inset-x-3`, `.-left/-right/-top-[14px]`, `.bottom-space-2`, `.aspect-[660/320]`, `.size-11`, `.w-[40%]`, `.max-w-[288px]`, `.max-w-[472px]`, `.basis-80`, `.border-[var(--sem-border-border-standard)]`, `.bg-superagent-text-muted`, `.py-[50px]`, `.ps-space-8`, `.ring-current`, a disabled-text semantic badge rule, `.dark:border-slate-200`, `.dark:bg-black/60`, four `.max-md:*` responsive utilities, `.xl:sticky`) **and 11 removed** (`.rounded-bl-sm`, `.rounded-br-sm`, `.bg-superagent-border`, `.object-right`, `.pt-[14vh]`, `.ring-superagent-warning/50`, a `:has([role=radio]:focus-visible)` focus rule, `.dark:bg-orange-500`, `.md:z-30`, `.md:mx-auto`, an `xl:sticky` media rule) — none touching the login-card class surface. `logoutReturnPath-HjtsxsFd.js` remains hash-STABLE (the 28th consecutive session; referenced by BOTH entry versions). All old chunks remain live-fetchable (HTTP 200) for the byte comparisons. **Non-gap — the platform rebuilt its graph a fifteenth time; the login contract carrier is content-identical.**

### F2 — the chrome ledger holds (27th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon). `/dashboard`: plain viewport + NO PWA trio. Both re-measured live via agent-browser after a fresh reference login. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 27th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified this session on the freshly built standalone). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 27th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` returns the `fixed top-0 z-[100]` toast-container div, and agent-browser's coverage check REFUSED the real click on the mobile menu toggle ("Element 'header button' is covered by <div.fixed.top-0…") — the reference's mobile menu cannot be opened by a real click; dialogs stay 0 after any real-click attempt. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s44 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title — via the snapshot-ref flow). **Ours the working superset.** (One agent-browser interaction note recorded: the CSS selector `a[href='/mytickets']` resolves the FIRST match in DOM order — the hidden desktop-sidebar link, whose click point sits under the open sheet's content, so the coverage check correctly refuses; the snapshot-ref flow resolves the sheet's visible link and works. Selector ambiguity, not a UI defect.)

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API via `scripts/s44-vlm-check.mjs`, both images in one prompt): **LAYOUT-OK — "The layout structure, including the sidebar navigation, header placement, stats cards arrangement, and ticket table positioning, is identical between the two images." Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click via refs) → typed title/description → submit → /mytickets → the S45 probe listed (Prisma-verified: `cmv75b16m0001rogf2iz5mk7q`, status open, category software) → cleaned via Prisma → the seed canonical (4/11/3).

### P1 — the own-side audit: the CI workflow's contract surface is entirely unpinned (CONFIRMED actionable)

The s77 shortlist's leading candidate — "the bun.lock contract surface (the lockfile now governs tsx — a `bun install --frozen-lockfile` pin exists nowhere as a test)" — was investigated: zero tests reference `.github/workflows/` (rg across the whole test tree), while the CI file carries THREE unpinned silent-failure contracts:

1. **`bun install --frozen-lockfile` (×2 jobs)** — the enforcement point of the "the lockfile governs every byte this project executes" doctrine (AGENTS.md/CLAUDE.md/the s44 remediation all lean on it; CI installs with `--frozen-lockfile`). If a workflow edit drops the flag (a cleanup PR, someone debugging an install), **NOTHING FAILS** — CI stays green while every install silently floats from the lockfile: the exact supply-chain class the s44 closure rejected (unpinned, un-audited resolution), now one YAML edit away.
2. **`include-hidden-files: true`** — the s18 fix (documented in the workflow's own comments, AGENTS.md session-18 contracts, CLAUDE.md, PAD): upload-artifact v4.4+ excludes hidden files by default, and the standalone build is full of them — without the flag, the e2e job's restored server 500'd everything and CI stayed red for 33 runs while the local suite was green. The comment is the only guard; the flag has no pin.
3. **The push + PR `branches: [main]` triggers** — if narrowed or typo'd, CI silently stops running on main and the badge goes stale-green.

Plus the s44 governance claim made testable: "the lockfile now governs tsx" is claimed in three docs, but no test checks `bun.lock` actually carries the tsx entry (the s44 pin checks package.json's devDependencies membership only — a regenerated lockfile without tsx would fail only at CI install time, silently locally).

**The defect class:** the s31 doctrine exactly — "a clean audit is closed by pinning it: an unpinned clean contract is a future regression with no alarm" — and the s43 doctrine: "EVERY documented invariant gets a pin." The CI config is a documented invariant surface held by comments alone.

**The fix:** a new `tests/ci-contract.test.ts` (4 pins, code-shaped occurrence matching per the s43 mutation-C doctrine): the frozen-install pin (the `run: bun install --frozen-lockfile` step present in BOTH jobs), the hidden-files artifact pin (`include-hidden-files: true`), the trigger pin (`branches: [main]` on both push and pull_request), and the lockfile-governance pin (bun.lock carries the tsx entry, code-shaped). No production code changes — the CI is already correct; the pins close the regression surface.

## 2. The remediation

### Component 1 — P1: the CI-contract closure (the 4 pins)

**Code changes:** `tests/ci-contract.test.ts` (new, 4 pins). No changes to `.github/workflows/ci.yml` (already correct), `package.json`, or any src file.

**The pin set (tests/ci-contract.test.ts, 4 pins):**
1. the frozen-install pin: the code-shaped `run: bun install --frozen-lockfile` occurs exactly TWICE (both jobs — the verify job AND the e2e job; one job floating is still a floating install);
2. the hidden-files artifact pin: `include-hidden-files: true` (the s18 standalone-500 guard, present exactly once — the artifact upload);
3. the trigger pin: `branches: [main]` occurs exactly TWICE (the push trigger AND the pull_request trigger — both must target main);
4. the lockfile-governance pin: `bun.lock` contains the code-shaped tsx entry (`"tsx": ["tsx@`) — the s44 "the lockfile governs tsx" claim, made testable at the unit layer.

**TDD (the s31 mutation-driven RED — the code is already green, so the honest RED is BY MUTATION, each observed + reverted + re-verified):**
- A: drop `--frozen-lockfile` from ONE install line → pin 1 fails (count 2 → 1);
- B: remove `include-hidden-files: true` → pin 2 fails;
- C: typo one trigger's `main` → pin 3 fails (count 2 → 1);
- D: remove the tsx entry from bun.lock (the entry line only) → pin 4 fails;
- each mutation reverted, the suite re-run GREEN after every revert.

### Component 2 — the docs alignment (the standing set)

README (the counts 231 → 235 + the s45 pin description), AGENTS.md (the commands-table test description + the NEW Session-45 contracts section + the reference list through s45), CLAUDE.md (the counts + the s45 anti-pattern: the unpinned-CI-config doctrine — a workflow file is a contract surface like any other; its silent-failure flags (frozen-lockfile, hidden-files, triggers) get pins, not just comments), PAD (§7.1 the new test row + the checklist 235 + the RESOLVED session-45 known-issues row), `service-desk_SKILL.md` **v2.43.0** (lesson 99 + the project_state + the description line), `docs/session_79.md` (this session's agent log per the numbering convention: odd docs = agent logs, the operator's transcript will land at session_80), this plan's execution status, the repo `worklog.md`. `.env.example` re-verified against the codebase (no env changes this session — expected unchanged).

## 3. Non-goals (documented decisions, no code)

- **No CI workflow refactor:** the file is correct and heavily commented; restructuring it (matrix jobs, path filters, caching) churns a verified pipeline for zero contract gain.
- **No YAML-schema test layer:** parsing the workflow with a YAML parser would add a dependency and false precision — the text-shaped occurrence pins (the s43/s44 house style) bite exactly the mutations that matter (a dropped flag, a narrowed trigger).
- **No pin on CI's AUTH_SECRET value or retention-days:** hygiene settings whose regression is loud or cosmetic, not silent — the pin set targets the silent-failure surface only.
- **No pin on the e2e artifact path/restore:** a path change fails loudly at the e2e job's restore step (the job goes red with a clear artifact error).
- **No behavior changes on any surface:** the CI, the provisioning, the seed output, every script's execution, and every API path stay byte-identical (a test-only session on the code side).

## 4. The verification plan

1. **TDD (mutation-driven RED):** the 4 pins land green first (the s31 clean-contract pattern), then mutations A/B/C/D — each observed failing EXACTLY its pin, reverted, re-verified green.
2. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (**235** = 231 + 4) → build → E2E (198 — unchanged) → smoke (121 — unchanged).
3. **Live re-verification** on the production standalone :3000 (PID-managed): the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap) + the paired VLM check (done pre-remediation this session — LAYOUT-OK; re-run post-remediation for the record).
4. **Screenshots:** the 10-shot set refreshed (the s44 lineage verbatim + the header + the fixture title S45); VLM spot-checks on the convention shots; changed shots VLM-diffed benign against the s44 baselines.
5. **Docs alignment** (Component 2) + `.env.example` re-verified.
6. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1) — complete, recorded in worklog
- [x] The 4 pins landed (tests/ci-contract.test.ts — 235/235); the pins line-anchored after mutation B exposed the first draft's false-green (the s43 mutation-C class firing LIVE in the pin-authoring session: a commented-out flag kept the substring pin GREEN — the pin hardened so a commented-out flag FAILS it)
- [x] The mutation checks (A/B/C/D — each bit exactly its pin; B's first attempt (the commented flag) bit NOTHING and drove the hardening; B re-run (true → false) bit exactly the hardened pin; each observed + reverted (reverse-sed) + re-verified; the working tree verified clean against HEAD after the set)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 235/235 unit ✓ build ✓ 198/198 E2E ✓ (2.9m) smoke 121 ✓
- [x] Live re-verification: the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap via refs) + desktop 1280=1280 + the paired VLM check LAYOUT-OK (post-remediation) + the UI round-trip (the S45 probe: 201 + listed + navigated + Prisma-verified + cleaned + the canonical 4/11/3)
- [x] Screenshots (the 10-shot set via scripts/capture-screenshots-s45.sh, all FATAL guards passed; seven byte-identical to the s44 baselines + THREE changed shots (09 the S45 fixture title; 04/05 the fresh-seed relative timestamps) VLM-diffed BENIGN; the VLM spot-checks 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.43.0/session_79.md/plan/worklog) + `.env.example` re-verified (unchanged, matches)
- [x] Commit + push + CI verification — see the worklog's task-135 entry for the final status
