# ServiceDesk — Session 47 Remediation Plan

**Date:** 2026-10-14
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the carried-over workspace (lint ✓ typecheck ✓ 238/238 unit ✓ build ✓ 198/198 E2E ✓ (2.8m) smoke 121 ✓ — the s46 closeout state reproduced exactly; the workspace was NOT reset this session — the fourth-session run without a re-clone, so the `.env`/db/binaries survived), remediation of the identified own-side defects, and full re-verification. Session 47 follows the session-46 remediation (commits `ba45b5a` + `c7e10c4` + the operator's `05d7054` transcript commit; briefing docs `docs/session_81.md` + `docs/remediation-plan-session46.md` + `worklog.md` + `docs/session_82.md`).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s46 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP (the 29th)** — **NO seventeenth /login wave**: all three chunks byte-size-identical to the s46 records (`index-CneaUv24.js` 104739, `UserAppMain-DOZft9ba.js` 58761, `index-D0Q6-tUz.css` 900665; `logoutReturnPath-HjtsxsFd.js` hash-stable, 30th consecutive session), the login-contract string counts identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39) — the third quiet session in five. Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click on their mobile toggle still REFUSED by agent-browser's coverage check, 29th re-verification); ours the working superset (375=375, the REAL click opens the sheet at 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; 1280=1280; the paired desktop VLM check **LAYOUT-OK on the first attempt** — the /dashboard recapture held per the s34/s44/s46 operator lesson; the UI round-trip green: the S47 probe created through the real UI, Prisma-verified `cmv7e14ru0001pryqk71xkft1` open/hardware, cleaned, the canonical 4/11/3 restored). The own-side audit (the s81 next-session shortlist, executed): the 238-count drift watch CLEAN (five docs consistent), nothing new grew (the `c7e10c4..05d7054` diff is docs-only — session_82.md), the console-site ledger stable (4 sites, all pinned), the CI YAML bytes od-verified fresh (`[main]` — the display artifact re-fired in the tool output, doctrine re-held), the health-route log-prefix bytes od-verified fresh (`[health]`). **P1 CONFIRMED: the `.gitignore` hygiene surface (the secret-guard) is entirely unpinned** — the s81 shortlist's own named candidate. **P2 CONFIRMED: `docs/DEPLOYMENT.md` carries two STALE numeric claims** (drifted, not merely unpinned — the docs surface that never had a drift watch).

## 1. The gap analysis (all measured this session — the 29th sweep)

### F1 — the bundle sweep: NO seventeenth wave, the third quiet session in five (non-gap)

The reference's /login surface did NOT rotate: the entry is still `index-CneaUv24.js` (104739 bytes — byte-size-identical to the s45/s46 records), the login-contract carrier `UserAppMain-DOZft9ba.js` (58761 bytes), and the login CSS `index-D0Q6-tUz.css` (900665 bytes); `logoutReturnPath-HjtsxsFd.js` remains hash-STABLE (the 30th consecutive session) and live-fetchable (HTTP 200). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. **Non-gap — the platform's vendor graph did not re-hash this session.**

### F2 — the chrome ledger holds (29th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color + apple-touch-icon) — re-measured from the fresh fetch. `/dashboard`: plain viewport (`width=device-width, initial-scale=1.0`) + NO PWA trio (manifest/theme-color/apple-touch-icon all absent — re-measured live after a fresh reference login). **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 29th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified on the fresh standalone build). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 29th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` returns the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse` toast-container div, and agent-browser's coverage check REFUSED the real click on the mobile menu toggle ("Element is covered by <div.fixed.top-0 inside div#root>") — the reference's mobile menu cannot be opened by a real click; zero dialogs after the attempt. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s46 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title — via the snapshot-ref flow). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API, both images in one prompt): **LAYOUT-OK — "The layout structure, including the sidebar navigation, header placement, stats cards arrangement, and ticket table positioning, is identical between the two images."** The check passed on the FIRST attempt this session — the s34/s44/s46 operator lesson (the paired-check-validates-the-operator class: recapture from /dashboard after the mobile-matrix nav-tap, never compare /mytickets) applied proactively. **Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click via fresh refs after the stale-ref lesson re-fired) → typed title/description → submit → /mytickets → the S47 probe listed → Prisma-verified (`cmv7e14ru0001pryqk71xkft1`, status open, category hardware) → cleaned via `scripts/s47-probe-cleanup.ts` → the seed canonical (4 users / 11 tickets / 3 comments).

### P1 — the own-side audit: the `.gitignore` hygiene surface is entirely unpinned (CONFIRMED actionable)

The s81 shortlist's own named candidate, executed: the secret-guard surface is real, correct TODAY, and held by convention alone.

1. **The measured contract:** `.gitignore` line 31 ignores `.env` (the "local env files — never commit secrets" block — the AUTH_SECRET carrier), lines 35–36 ignore `db/*.db` + `db/*.db-journal` (the database binaries), lines 17–19 ignore `*.pem`/`*.key`/`ssh-key.txt` (the SSH-wrapper key surfaces — the s28 push flow materializes operator keys), and the tracked surface (`git ls-files`) carries none of `.env`/`*.key`/`ssh-key`/`*.pem`/`*.db` (verified clean today). `.env.example` IS tracked (the quickstart's `cp .env.example .env` source).
2. **The drift scenario (the silent failure):** a dropped or reordered `.env` ignore line — a refactor of the ignore blocks, a merge conflict resolution, a careless "clean up the gitignore" commit — and `git add .` stages the secret; the push leaks `AUTH_SECRET` with ZERO test failures (tracked files ignore ignore-rules, so even a RE-ADDED `.env` after the line drops is silent). The operator's guard is the PAD §7.4 checklist line (`git ls-files | grep -E '^\.env$|\.key$|ssh-key'` — manual, "before doc-heavy commits") plus habit.
3. **The defect class:** the s31 doctrine exactly ("an unpinned clean contract is a future regression with no alarm") + the s46 session's own closing words ("a dropped `.env` ignore line would let a future `git add .` commit the secret, currently guarded by convention + the operator's manual `git ls-files` habit") — the environment-contract closure of s46 pinned the example FILE; the ignore RULES that keep the real file out of the index remain unpinned.
4. **Why executable pins (not substring pins):** `git check-ignore` answers the actual question ("would git ignore this path?") at the rule-engine level — a commented-out or reordered rule fails it directly, so the s45/s46 line-anchoring concern is inherent; and `git ls-files` answers the repo-state question ("is a secret already tracked?") that no file-content pin can reach.

### P2 — `docs/DEPLOYMENT.md` carries two stale numeric claims (CONFIRMED drift, the s81 shortlist's other named candidate)

The last major docs surface without a drift watch — written once (session ~3 era) and never re-measured:

1. **Line 14: "The build compiles the page shell and the 16 API route handlers"** — the actual surface: **12 route modules** (`find src/app/api -name route.ts | wc -l` = 12 — the 11 known routes of the s41 cross-check + the s33 catch-all `[[...path]]`); the "16" figure matches no measured property of the codebase (12 modules, 71 exported handlers across them).
2. **§6 (Verification checklist): "`./scripts/smoke-test.sh` # 30 E2E checks (local)"** — the actual: **121 steps** (re-measured this session: 121 PASS lines at runtime; the canonical corpus number claimed in README/AGENTS/PAD/SKILL). The "30" is a session-3-era figure that drifted through 41 sessions of smoke growth without an alarm.

Both are the s31 doctrine class at the docs layer: claims with no pin, drifted silently.

## 2. The remediation

### Component 1 — P1: the `.gitignore` hygiene closure (5 executable pins)

**Code changes:** `tests/gitignore-contract.test.ts` (new, 5 pins — shell-outs to git via `execFileSync`, cwd pinned to the repo root, the db-script-pins pattern). No changes to `.gitignore` itself (correct today), no src changes, no package.json changes.

**The pin set:**
1. **the secret-file pin:** `git check-ignore .env` exits 0 — the quickstart's gitignored contract enforced at the rule-engine level (a dropped, commented, or reordered `.env` line fails immediately; the executable form needs no line-anchoring hardening);
2. **the credential-pattern pin:** `git check-ignore ssh-key.txt`, a `*.key` path, and a `*.pem` path all exit 0 — the wrapper-flow key surfaces (the s28 push materializes operator keys; a dropped pattern line would let one land in `git add .`);
3. **the DB-binary pin:** `git check-ignore db/custom.db`, `db/e2e.db`, and `db/custom.db-journal` exit 0 — the fresh-clone story (`db/*.db` is gitignored; every clone recreates via `db:push` + `db:seed`);
4. **the tracked-surface pin:** `git ls-files` output matches none of `/^\.env$/`, `/\.key$/`, `/\.pem$/`, `/ssh-key/`, `/\.db$/` — the PAD §7.4 pre-commit checklist automated (catches an ALREADY-tracked secret — the case check-ignore cannot see, because tracked files ignore ignore-rules; `db/e2e.db`-style artifacts included);
5. **the inverse pin (the quickstart source):** `.env.example` is tracked (`git ls-files -- .env.example` non-empty) AND not check-ignored — an over-broad `.env*` pattern plus an index removal would break every future fresh clone's `cp .env.example .env` silently (the s46 pins only fire in CI, after the file is already gone from the checkout).

**TDD (the s31/s45/s46 mutation-driven RED — the contract is already green, so the honest RED is BY MUTATION, each observed + reverted + re-verified):**
- A: delete the `.env` line from `.gitignore` → pin 1 fails;
- B: delete the `*.key` line → pin 2 fails;
- C: materialize a fake tracked secret (`touch s47-leak.key && git add -N s47-leak.key`) → pin 4 fails (the tracked-surface alarm — the exact leak the PAD checklist guards manually) → `git reset` revert;
- D: `git rm --cached .env.example` (index-only removal, working file kept) → pin 5 fails → `git reset` revert;
- each mutation reverted, the suite re-run GREEN after every revert, the working tree verified clean against HEAD.

### Component 2 — P2: the DEPLOYMENT.md claims closure (2 line fixes + 2 pins)

**Doc changes (docs/DEPLOYMENT.md):**
- line 14: "the 16 API route handlers" → "the 12 API route modules (11 known routes + the s33 JSON catch-all)" — the measured figure;
- §6: "30 E2E checks" → "121 steps" — the canonical corpus number.

**Code changes:** `tests/docs-contract.test.ts` (new, 2 pins — the drift-watch automation for the docs surface that never had one):
1. **the route-module claim pin:** the filesystem count of `route.ts` under `src/app/api` is **12** AND DEPLOYMENT.md carries the "12 API route modules" claim (line-anchored) — when a 13th route module lands, the count assertion fails, forcing the doc + the pin to move TOGETHER (the doc can never silently claim a stale figure again);
2. **the smoke-claim pin:** DEPLOYMENT.md's verification section claims "**121 steps**" for `scripts/smoke-test.sh` (line-anchored) — consistent with the README/AGENTS/PAD/SKILL corpus claims; the stale "30 E2E checks" form fails the pin. (The 121 itself stays a runtime measure — the smoke's own PASS count, re-verified every session; the pin closes the DOC side of the contract.)

**TDD (mutation-driven RED):**
- E: revert the DEPLOYMENT.md "12" fix back to "16" → the route-claim pin fails (the doc-side assertion);
- F: touch a 13th route module (`src/app/api/s47-fake/route.ts`) → the fs-count assertion fails → delete it;
- each mutation reverted, re-verified green.

### Component 3 — the docs alignment (the standing set)

README (the counts 238 → 245 + the s47 pin description), AGENTS.md (the commands-table test description + the NEW Session-47 contracts section + the reference list through s47 + the screenshots lineage s46→s47), CLAUDE.md (the counts + the s47 anti-pattern: the ignore-rules-are-a-contract doctrine — `.gitignore` is the secret-guard surface; executable check-ignore pins + the tracked-surface pin, not substring pins), PAD (§7.1 the two new test rows + the checklist 245 + the RESOLVED session-47 known-issues row), `service-desk_SKILL.md` **v2.45.0** (lesson 101 + the project_state + the description line), `docs/session_83.md` (this session's agent log per the numbering convention: odd docs = agent logs, the operator's transcript will land at session_84), this plan's execution status, the repo `worklog.md` (tasks 140+).

## 3. Non-goals (documented decisions, no code)

- **No pin on every `.gitignore` line:** the dependency/build-output lines (`node_modules`, `.next`, `test-results`, …) drift by design as the toolchain evolves; pinning them would make routine tooling changes test failures. The pins cover the SECRET surfaces (env, keys, pem, ssh-key), the DB binaries, and the quickstart source — the lines whose drift is a security or correctness incident, not a tooling change.
- **No pin on the smoke's runtime step count (121) at the unit layer:** the number is a runtime property of a server-driven script; the honest pin is the doc-side claim (Component 2) + the per-session live re-verification (the standing gate). A static `grep -c 'step "PASS"'` pin would measure 111 (the static count), not the canonical 121 (runtime, loops included) — pinning the static figure would be a false claim.
- **No changes to `.gitignore` itself:** it is correct today; the session closes the PIN gap, not a content gap (the s31 "clean contract" case exactly).
- **No behavior changes on any surface:** the env contract, the provisioning, the seed output, every script's execution, and every API path stay byte-identical (a test-only session on the code side).

## 4. The verification plan

1. **TDD (mutation-driven RED):** the 7 pins land green first (245 = 238 + 7), then mutations A/B/C/D/E/F — each observed failing EXACTLY its pin, reverted, re-verified green.
2. **The full gate in the CLEAN environment** (the standalone :3000 server stopped first): lint → typecheck → unit (**245**) → build → E2E (198 — unchanged) → smoke (121 — unchanged).
3. **Live re-verification** on the production standalone :3000 (PID-managed): the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap) + the paired VLM check (re-run post-remediation for the record) + the UI round-trip (the S47 remediated probe).
4. **Screenshots:** the 10-shot set refreshed (the s46 lineage verbatim + the header + the fixture title S47); VLM spot-checks on the convention shots; changed shots VLM-diffed benign against the s46 baselines.
5. **Docs alignment** (Component 3).
6. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1 + P2) — complete, recorded in worklog
- [x] The 7 pins landed (tests/gitignore-contract.test.ts (5) + tests/docs-contract.test.ts (2) — 245/245; the docs pins landed RED first on the stale figures, the honest RED, then GREEN after the two DEPLOYMENT.md line fixes)
- [x] The mutation checks (A/B/C/D/E/F — each observed + reverted + re-verified; C needed the force-add form (the plain `git add -N` was REFUSED by the `*.key` pattern — the complementary-layers lesson); F's first draft used the tracked-surface count and did NOT bite on an untracked route file — the pin hardened to the fs walk, the s45 live-pin-lesson class, then bit exactly)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 245/245 unit ✓ build ✓ 198/198 E2E ✓ (2.8m) smoke 121 ✓
- [x] Live re-verification: the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap via refs) + desktop 1280=1280 + the paired VLM check LAYOUT-OK (post-remediation, first attempt) + the UI round-trip (the S47 remediated probe: 201 + listed + navigated + Prisma-verified + cleaned + the canonical 4/11/3)
- [x] Screenshots (the 10-shot set via scripts/capture-screenshots-s47.sh, all FATAL guards passed; NINE byte-identical to the s46 baselines + the ONE changed shot (09 the S47 fixture title) VLM-diffed BENIGN; the VLM spot-checks 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.45.0/session_83.md/plan/worklog tasks 140-142) + `.env.example` re-verified (by the s46 pins, still passing inside the 245 suite)
- [x] Commit + push + CI verification — see the worklog's final entries for the status
