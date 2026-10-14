# ServiceDesk — Session 49 Remediation Plan

**Date:** 2026-10-14
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the freshly-cloned workspace (lint ✓ typecheck ✓ 251/251 unit ✓ build ✓ 198/198 E2E ✓ (2.8m) smoke 121 ✓ — the s48 closeout state reproduced exactly after ONE environment repair: the Playwright chromium_headless_shell-1248 install the fresh cache lacked; `bun install --frozen-lockfile` + db:push + db:seed + the canonical 4/11/3 on arrival), remediation of the identified own-side defects, and full re-verification. Session 49 follows the session-48 remediation (commits `3f945bc` + `b69d0b3` + the operator's `7dfc0e3` transcript commit adding `docs/session_86.md`; briefing docs `docs/session_85.md` + `docs/remediation-plan-session48.md` + `worklog.md` + `docs/session_86.md`).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads + installed-artifact reads + RUNTIME per-file test-count extraction (per `skills/clone-app-pat-pro`, `skills/tdd`, `skills/agent-browser` + the s14–s48 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP (the 31st)** — **NO nineteenth /login wave**: all three chunks byte-identical to the s48 records (`index-CneaUv24.js` 104739, `UserAppMain-DOZft9ba.js` 58761, `index-D0Q6-tUz.css` 900665; `logoutReturnPath-HjtsxsFd.js` hash-stable, 32nd consecutive session, live HTTP 200), the login-contract string counts identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39) — the fifth quiet session in seven. Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click on their mobile toggle still REFUSED by agent-browser's coverage check, 31st re-verification); ours the working superset (1280=1280, 375=375, the REAL click opens the sheet at 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired desktop VLM check **LAYOUT-OK on the first attempt**; the UI round-trip green: the S49 probe created through the real UI, Prisma-verified `cmv7keksc0001p9vivz7dnkfi` open/hardware, cleaned, the canonical 4/11/3 restored). **P1 CONFIRMED — ACTIVE DRIFT: the PAD §7.1 Test Distribution table** (the s85 shortlist's leading candidate — the per-file test-count class): the per-session drift watch verified the TOTALS (251/198 — the s48 corpus pins hold that family), but never the per-file DISTRIBUTION; the §7.1 table's own rows carry three stale counts and three missing files.

## 1. The gap analysis (all measured this session — the 31st sweep)

### F1 — the bundle sweep: NO nineteenth wave, the fifth quiet session in seven (non-gap)

The reference's /login surface did NOT rotate: the entry is still `index-CneaUv24.js` (104739 bytes — byte-size-identical to the s45–s48 records), the login-contract carrier `UserAppMain-DOZft9ba.js` (58761 bytes), and the login CSS `index-D0Q6-tUz.css` (900665 bytes); `logoutReturnPath-HjtsxsFd.js` remains hash-STABLE (the 32nd consecutive session) and live-fetchable (HTTP 200). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. **Non-gap.**

### F2 — the chrome ledger holds (31st re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color + apple-touch-icon — from the fresh HTML fetch). `/dashboard`: plain viewport (`width=device-width, initial-scale=1.0`) + NO PWA trio (re-measured live after a fresh reference login). **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 31st)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified on the fresh standalone build, at `/dashboard`). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 31st)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(24,16)` (their toggle's own rect) returns the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse` toast-container div — the reference's mobile menu cannot be opened by a real click; zero dialogs after the attempt. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s48 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, "My Tickets | ServiceDesk" — the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API, both images in one prompt): **LAYOUT-OK — "The layout structure, including sidebar width, header placement, card arrangement, and spacing rhythm, is identical between the two images."** First attempt — the s34/s44/s46/s47/s48 operator lesson applied proactively (the /dashboard recapture after the mobile-matrix nav-tap, never a /mytickets comparison). **Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click via fresh refs — the s48 lesson held: the title input's placeholder is "Brief summary of the problem") → typed title/description → submit → /mytickets → the S49 probe listed → Prisma-verified (`cmv7keksc0001p9vivz7dnkfi`, status open, category hardware) → cleaned → the seed canonical (4 users / 11 tickets / 3 comments).

### P1 — the own-side audit: the PAD §7.1 Test Distribution table (CONFIRMED ACTIVE DRIFT)

The s85 shortlist's leading candidate ("the per-file test-count claims — the class generalizes to every per-file count in §7.1") executed: the TOTALS held by the s48 corpus pins are correct (251 unit / 198 E2E — the family-consistency pins verified green in the baseline gate), but the §7.1 DISTRIBUTION rows were never re-measured after the sessions that grew them. The runtime ground truth (the nested `vitest run --reporter=json` per-file counts — the same runtime the gate itself runs, NOT a static count: `vitest list` undercounts `each`-generated tests, measured 226 vs the runtime 251; the s48 non-goal doctrine holds — static shapes are false claims, the RUN is the truth) surfaces SIX defects:

1. **`src/lib/__tests__/domain.test.ts`: the row claims 61, the runtime count is 75** — 14 tests stale (the s35 `validateAttachments` data-honesty pins + the later validation-seam growth never moved the row);
2. **`tests/headers-config.test.ts`: the row claims 4, the runtime count is 9** — 5 stale (the row description still says "the s30 HSTS + poweredByHeader pins"; the s34 cache-behavior contract (7 more tests) never reached the row or its description);
3. **`tests/e2e/auth.spec.ts`: the row claims 9, the `--list` count is 11** — 2 stale (the signup-page pair "creates an account…" + "rejects a weak password" never moved the row);
4. **`tests/api-catchall.test.ts` (19 runtime tests): NO ROW AT ALL** — the s33 catch-all contract's unit file absent from the table;
5. **`tests/proxy-fromurl.test.ts` (8 runtime tests): NO ROW** — the s36 proxy-contract pins absent;
6. **`tests/body-size.test.ts` (11 runtime tests): NO ROW** — the s35 request-size seam absent.

The aggregate: the table's Vitest rows sum to 194 vs the canonical 251 (57 under: 38 missing-file + 14 domain + 5 headers); the Playwright rows sum to 196 vs 198 (2 under). The failure mode is the s48 corpus class at the per-file layer: a distribution table with no consistency pin drifts on partial updates (each session grew a file's count and moved the TOTALS' sites, never the §7.1 row).

### The remaining shortlist candidates (measured, clean, documented)

- **CLAUDE.md major-only prose claims** ("Next.js 16 App Router", "React 19", "Tailwind CSS v4", "Prisma 6"): verified correct today against the installed versions (16.4.0 / 19.3.0 / 4.3.3 / 6.19.3) — unpinned at the major level, no drift (a future session's candidate);
- **DEPLOYMENT.md rate-limit prose figures** (login 10/IP/15-min, forgot 5/IP/15-min, 1000-key sweep, one sweep per minute): verified correct against `src/lib/auth.ts` constants — unpinned doc-side, no drift (a future session's candidate).

## 2. The remediation

### Component 1 — P1: the §7.1 distribution closure (6 row fixes + 3 per-file pins)

**Doc changes (the fixes — the stale counts replaced by the runtime truth, the missing rows added):**
- the domain row: 61 → 75;
- the headers-config row: 4 → 9 + the row description extended (the s34 cache-behavior contract);
- the auth.spec row: 9 → 11 + the row description extended (the signup-page pair);
- THREE new rows: `tests/api-catchall.test.ts` (19 — the s33 API catch-all 404 contract), `tests/proxy-fromurl.test.ts` (8 — the s36 proxy-contract pins), `tests/body-size.test.ts` (11 — the s35 request-size seam + the validateAttachments data-honesty pins);
- ONE new row for the pin file itself: `tests/pad-testcount-contract.test.ts` (3 — the s49 pins; the nested runtime includes the pin file, so the table's completeness contract covers its own guard).

**Code changes:** `tests/pad-testcount-contract.test.ts` (new, 3 pins — the runtime-distribution pins):

1. **the unit-side per-file pin:** spawns a NESTED `bunx vitest run --reporter=json --outputFile=.vitest/pad-counts.json --max-workers=4` (the recursion guarded by the `SD_PAD_NESTED` env re-entrancy sentinel — the nested run sees the sentinel and the pin's own tests pass trivially, bounding the depth at 1; the worker count bounded for CI's 2-core runners), reads the JSON report's per-file `assertionResults` counts (the RUNTIME truth — the same run the gate executes), and asserts BOTH directions: every §7.1 Vitest row's Tests figure equals the runtime count of its Location, AND every runtime test file has a row (the missing-row class — the s33/s35/s36 files can never silently vanish again);
2. **the E2E-side per-file pin:** spawns `bunx playwright test --list` (0.7s, no server boot, no global-setup side effects — measured), parses the per-file counts, and asserts both directions against the §7.1 Playwright rows (the 9→11 auth.spec drift closed; a future spec file or per-file growth fails loudly);
3. **the smoke-row agreement pin:** the §7.1 API-smoke row's step figure agrees with the corpus canonical (the same family the s48 corpus pins hold — the §7.1 smoke row joins the family; a smoke-row edit that disagrees with the 9-site family fails).

**TDD:** the pins land RED first on the CURRENT table (the honest RED: the unit-side pin fails on "domain 61 ≠ 75, headers-config 4 ≠ 9" + the 4 missing rows; the E2E-side pin on "auth.spec 9 ≠ 11") → the six row fixes + the new rows → GREEN; then the corpus-count move 251 → 254 (the pin file's 3 tests) across the 9 live sites + the s48 corpus pins' own literals.

**Supporting changes:** `.gitignore` gains `.vitest/` (the JSON report artifact — the same testing-artifact class as `coverage/`); the `tests/corpus-count-contract.test.ts` canonical literal moves 251 → 254.

### Component 2 — the docs alignment (the standing set)

README (the counts 251 → 254 ×4 sites + the s49 pin description in the commands table), AGENTS.md (the commands-table test description + the NEW Session-49 contracts section + the reference list through s49 + the screenshots lineage s48→s49), CLAUDE.md (the counts + the s49 anti-pattern: the distribution-table doctrine — a per-file table needs per-file runtime pins, totals-only watches leave the distribution to drift), PAD (§7.1 the fixes + the two new test rows + the checklist 254 + the RESOLVED session-49 known-issues row), `service-desk_SKILL.md` **v2.47.0** (lesson 103 + the project_state + the description line), `docs/session_87.md` (this session's agent log per the numbering convention: odd docs = agent logs, the operator's transcript landed at session_86), this plan's execution status, the repo `worklog.md` (tasks 148+).

## 3. Non-goals (documented decisions, no code)

- **No pin on the E2E runtime count via the playwright LIST as a total:** the `--list` total (198) equals the runtime total today, but the canonical total stays the RUN count (the gate's own measure); the per-file pin compares row-by-row against the list, which is Playwright's load-time-expanded truth (test.each expands at collection — measured identical to the run).
- **No static per-file `test(` counting:** the s48 doctrine holds — `vitest list` undercounts each-generated tests (226 vs 251, measured); only the RUN is the truth.
- **No CLAUDE.md major-level or DEPLOYMENT rate-limit pins this session:** both surfaces measured clean; they stay on the next-session shortlist (the s85 lineage convention: candidates are named, measured, and left documented).
- **No behavior changes on any surface:** the env contract, the provisioning, the seed output, every script's execution, and every API path stay byte-identical (a test-only + docs-only session on the code side, + one additive .gitignore line).

## 4. The verification plan

1. **TDD:** the 3 pins land RED on the current table (the honest RED — the stale rows failing exactly their pins) → the row fixes + the new rows → GREEN; the corpus-count move (251 → 254 ×9 sites + the s48 pins' literals) → the full suite green at the new count.
2. **The mutation checks (≥6, each observed + reverted + re-verified — REVERSE-REPLACE reverts, never `git checkout`, the s48 harness lesson):** a §7.1 count revert (domain 75→61) must bite the unit pin; a dropped §7.1 row must bite the completeness direction; a §7.1 E2E count revert (auth.spec 11→9) must bite the E2E pin; a smoke-row figure edit must bite the smoke-agreement pin; a corpus site revert (254→251 at one site) must bite the s48 corpus family pin; the dropped `.gitignore` line must... (checked: `.vitest/` is a fresh artifact dir, not part of the s47 secret-guard family — the mutation set stays within the session's own pins).
3. **The full gate in the CLEAN environment** (the standalone :3000 server stopped first): lint → typecheck → unit (**254**) → build → E2E (198 — unchanged) → smoke (121 — unchanged).
4. **Live re-verification** on the production standalone :3000 (booted INSIDE each script's process lifetime — the sandbox kills detached processes; the s48/s49 battery pattern): the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap) + the paired VLM check + the UI round-trip (the S49 remediated probe).
5. **Screenshots:** the 10-shot set refreshed (the s48 lineage + the S49 fixture title); changed shots VLM-diffed benign against the s48 baselines.
6. **Docs alignment** (Component 2).
7. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1) — complete, recorded in the workspace worklog
- [x] The 3 pins landed (tests/pad-testcount-contract.test.ts) — RED first on the stale rows (the honest RED: the unit pin on "domain 61 ≠ 75", the E2E pin on "auth.spec 9 ≠ 11"; the smoke pin green — the clean contract; two pin-harness bugs fixed in flight: the --list regex extension capture + toHaveLength on a number)
- [x] The 6 row fixes + the new rows (3 missing + the pin file's own) + the corpus-count move (251 → 254 ×9 sites + the s48 corpus pins' literal) — GREEN 254/254 = 251 + 3
- [x] The mutation checks (6: A–F — each observed + reverted + re-verified; A the domain count revert bit the unit pin; B the dropped body-size row bit the completeness direction — the first run's empty-string revert could never be count-verified (the live harness lesson: deletion mutations revert via the NEIGHBOR-ANCHOR pair, recovered idempotently, the runner fixed); C the auth.spec revert bit the E2E pin; D the smoke figure bit the smoke pin; E the corpus site revert bit the s48 family pin; F the pin row's own count bit the unit pin)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 254/254 unit ✓ build ✓ 198/198 E2E ✓ (2.8m) smoke 121 ✓
- [x] Live re-verification (mobile matrix 375=375, the real click opens 0,0,288,667, Escape, the nav-tap; desktop 1280=1280; the paired VLM LAYOUT-OK post-remediation, first attempt; the UI round-trip: the S49 remediated probe Prisma-verified cmv7l4kk00001p90qiozbcx2a + cleaned + the canonical 4/11/3) + screenshots (the 10-shot set via scripts/capture-screenshots-s49.sh — SIX byte-identical to the s48 baselines + the FOUR changed shots (02/04/05 the timestamp class + 09 the S49 fixture title) VLM-diffed BENIGN) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.47.0/session_87.md/plan/worklog tasks 148+) + `.env.example` re-verified (by the s46 pins, passing inside the 254 suite)
- [x] Commit + push + CI verification — pushed to git@github.com:nordeim/service-desk.git main via docs/ssh_git_wrapper_v3.py (the explicit --remote, the dry-run green first; the fingerprint verified BEFORE the push: SHA256:3ddaNlFhMz1JXiGEDgVEaRsUzI4Ev0IpGEEB7NnU4PU, byte-identical to the s30–s48 records; the key + the wrapper's temp key both shredded, no residue; the remote verified == local HEAD, tracking synced, main only, tree clean); CI green (the badge read passing on fresh cache-buster reads past the run duration + the runs page)
