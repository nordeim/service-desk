# ServiceDesk — Session 48 Remediation Plan

**Date:** 2026-10-14
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the carried-over workspace (lint ✓ typecheck ✓ 245/245 unit ✓ build ✓ 198/198 E2E ✓ (2.8m) smoke 121 ✓ — the s47 closeout state reproduced exactly; the workspace carried over again — the second consecutive session, `.env`/db/binaries all survived), remediation of the identified own-side defects, and full re-verification. Session 48 follows the session-47 remediation (commits `ca22fef` + `6c40133` + the operator's `121efde` transcript commit adding `docs/session_84.md`; briefing docs `docs/session_83.md` + `docs/remediation-plan-session47.md` + `worklog.md` + `docs/session_84.md`).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads + installed-artifact reads (per `skills/clone-app-pat-pro` + the s14–s47 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP (the 30th)** — **NO eighteenth /login wave**: all three chunks byte-identical to the s47 records (`index-CneaUv24.js` 104739, `UserAppMain-DOZft9ba.js` 58761, `index-D0Q6-tUz.css` 900665; `logoutReturnPath-HjtsxsFd.js` hash-stable, 31st consecutive session, live HTTP 200), the login-contract string counts identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39) — the fourth quiet session in six. Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click on their mobile toggle still REFUSED by agent-browser's coverage check, 30th re-verification); ours the working superset (1280=1280, 375=375, the REAL click opens the sheet at 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired desktop VLM check **LAYOUT-OK on the first attempt**; the UI round-trip green: the S48 probe created through the real UI, Prisma-verified `cmv7g21fb0001prjqy2dr04e4` open/hardware, cleaned, the canonical 4/11/3 restored). The own-side audit (the s83 next-session shortlist, executed): the 245-count drift watch CLEAN at the live sites, nothing new grew (the `6c40133..121efde` diff is docs-only — session_84.md), the diff-since-s47 surface clean. **P1 CONFIRMED — ACTIVE DRIFT: the corpus-count surface carries SIX stale claim sites** (the s83 shortlist's own leading candidate — the drift-watch automation — finding MORE than the shortlist expected: `service-desk_SKILL.md`'s Appendix quick-reference blocks carry session-4-era figures ("54 unit tests" L320, "57 E2E" L322, "11-step API contract" L323) plus two gate-example comments ("# 107 E2E" L652 + L908), and `README.md` L34 claims "163 E2E parity tests" vs the actual 164 — the manual per-session grep only ever checked the CURRENT value's sites (245/198/121 consistency), never swept for stale-era figures). **P2 CONFIRMED: the stack-version surface (README badges + PAD tech-stack table) entirely unpinned** — the docs claim next 16.4 / react 19.3 / typescript 5.9 / tailwind 4.3 / prisma 6.19 (+ PAD rows 16.4.0 / 19.3.0 / 5.9.3 / 4.3.3 / 6.19.3 / 5.0.3 / 1.64.0); the ground truth agrees today (node_modules installed + bun.lock resolved, both verified byte-exact this session), but any `bun update` or lockfile refresh drifts the claims silently (the s31 clean-contract class; the s45 precedent already pins the lockfile's tsx entry — this closes the whole stack surface).

## 1. The gap analysis (all measured this session — the 30th sweep)

### F1 — the bundle sweep: NO eighteenth wave, the fourth quiet session in six (non-gap)

The reference's /login surface did NOT rotate: the entry is still `index-CneaUv24.js` (104739 bytes — byte-size-identical to the s45–s47 records), the login-contract carrier `UserAppMain-DOZft9ba.js` (58761 bytes), and the login CSS `index-D0Q6-tUz.css` (900665 bytes); `logoutReturnPath-HjtsxsFd.js` remains hash-STABLE (the 31st consecutive session) and live-fetchable (HTTP 200). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. **Non-gap.**

### F2 — the chrome ledger holds (30th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color + apple-touch-icon — from the fresh HTML fetch). `/dashboard`: plain viewport (`width=device-width, initial-scale=1.0`) + NO PWA trio (re-measured live after a fresh reference login). **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 30th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified on the fresh standalone build, at `/dashboard`). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 30th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` returns the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse` toast-container div, and agent-browser's coverage check REFUSED the real click on the mobile menu toggle ("Element is covered by <div.fixed.top-0 inside div#root>") — the reference's mobile menu cannot be opened by a real click; zero dialogs after the attempt. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s47 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, "My Tickets | ServiceDesk" — the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API, both images in one prompt): **LAYOUT-OK — "The layout structure, including the sidebar navigation, header placement, stats cards grid, and ticket table arrangement, is identical between the two images."** First attempt — the s34/s44/s46/s47 operator lesson applied proactively (the /dashboard recapture after the mobile-matrix nav-tap, never a /mytickets comparison). **Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click via fresh refs — one selector iteration: the title input's placeholder is "Brief summary of the problem", not name/title-shaped) → typed title/description → submit → /mytickets → the S48 probe listed → Prisma-verified (`cmv7g21fb0001prjqy2dr04e4`, status open, category hardware) → cleaned → the seed canonical (4 users / 11 tickets / 3 comments).

### P1 — the own-side audit: the corpus-count surface carries SIX stale claim sites (CONFIRMED ACTIVE DRIFT)

The s83 shortlist's own leading candidate ("the corpus-count drift watch — the s73/s77 class, one grep") executed with a twist: the manual watch had only ever grepped the CURRENT value (245/198/121) for cross-doc consistency — CLEAN today at 9 unit-claim sites, 6 e2e-claim sites, 4 smoke-claim sites. But the drift-watch probe (a family-shaped extraction over all five docs) surfaced **stale-era figures no one had re-measured:**

1. `service-desk_SKILL.md` L320 (Appendix A quick-reference): "bun run test # Vitest — **54 unit tests**" — the actual: **245** (a session-4-era figure, 44 sessions stale);
2. `service-desk_SKILL.md` L322: "bun run test:e2e # **57 E2E** (needs the prior build)" — the actual: **198**;
3. `service-desk_SKILL.md` L323: "bash scripts/smoke-test.sh # **11-step** API contract on :3999" — the actual: **121 steps**;
4. `service-desk_SKILL.md` L652 (Appendix gate example): "# **107 E2E**" — the actual: **198**;
5. `service-desk_SKILL.md` L908 (Appendix B quick-reference card, same gate line): "# **107 E2E**" — the actual: **198**;
6. `README.md` L34 (the feature table): "**163 E2E parity tests** pin the reference's measured contracts" — the actual: **164** (playwright --list counted 164 in `visual-parity.spec.ts`; `CLAUDE.md` L96 correctly says "164 of them the visual-parity pins" and "visual-parity.spec.ts (164 tests)" — the exact partial-update failure mode: one doc updated, the other not).

The defect class: the s31 doctrine at the corpus layer — the docs' test-pyramid claims have no consistency pin, so partial updates (a session updates CLAUDE but not README; the SKILL appendices written once at session 4 and never swept) drift silently. The manual grep checked the value's presence, never the absence of stale-era siblings.

### P2 — the stack-version surface is entirely unpinned (CONFIRMED, the clean-contract class)

The README badge row claims Next.js 16.4 / React 19.3 / TypeScript 5.9 / Tailwind CSS 4.3 / Prisma 6.19; the PAD §2 tech-stack table claims 16.4.0 / 19.3.0 / 5.9.3 / 4.3.3 / 6.19.3 (Prisma row) / 5.0.3 (Vitest row) / 1.64.0 (Playwright row). The ground truth, measured both ways this session: `node_modules/<pkg>/package.json` versions (what the gate actually runs on: 16.4.0 / 19.3.0 / 5.9.3 / 4.3.3 / 6.19.3 / 5.0.3 / 1.64.0) and the `bun.lock` resolved entries (`"next@16.4.0"` … `"@playwright/test@1.64.0"` — what CI installs under `--frozen-lockfile`) — **all agree today.** The drift scenario: any `bun update`, lockfile refresh, or fresh range resolution moves the installed versions while the badges/table stay — the repo's face claims a stack it no longer runs. The s45 ci-contract precedent already pins ONE lockfile entry (the tsx one); this session closes the whole stack surface the same way.

## 2. The remediation

### Component 1 — P1: the corpus-count closure (6 stale-site fixes + 4 consistency pins)

**Doc changes (the fixes — each a stale-era figure replaced by the current canonical):**
- SKILL L320: "Vitest — 54 unit tests" → "Vitest — 245 unit tests";
- SKILL L322: "# 57 E2E (needs the prior build)" → "# 198 E2E (needs the prior build)";
- SKILL L323: "# 11-step API contract on :3999" → "# 121-step API contract on :3999";
- SKILL L652 + L908: "# 107 E2E" → "# 198 E2E" (both gate-example comments);
- README L34: "163 E2E parity tests" → "164 E2E parity tests".

**Code changes:** `tests/corpus-count-contract.test.ts` (new, 4 pins — the drift-watch automation, family-shaped):

1. **the unit-count consistency pin:** every live "«N» unit / «N» Vitest" claim across the five docs names ONE number — the extraction shapes: the README badge (`tests-«N»%20unit`), "«N» Vitest unit tests", "«N» unit + «M» E2E tests", "Vitest unit: «N» tests", the AGENTS "unit suite («N» tests", the CLAUDE "«N» unit / «M» E2E", the PAD §7.4 checklist "`bun run test` — «N»/", the SKILL "project_state: «N» unit tests" + the Appendix "Vitest — «N» unit tests" — 9 sites today, with a minimum-site floor (a dropped claim site fails loudly rather than silently shrinking the family);
2. **the E2E-count consistency pin:** every live "«N» E2E" claim names ONE number — the badge `%2B%20«N»%20E2E`, "«N» Playwright E2E tests", "«N» E2E tests", "Playwright E2E («N» tests)" (README + AGENTS), "«N» E2E (needs…" (CLAUDE + the SKILL appendix), the gate comments "# «N» E2E" (SKILL ×2) — 9 sites today, same floor doctrine;
3. **the parity-count consistency pin:** the "«N» E2E parity tests" claim (README L34), "«N» of them the visual-parity pins" + "visual-parity.spec.ts («N» tests)" (CLAUDE L96) — 3 sites, one number (the 164; the count itself stays a runtime measure — the per-session E2E run + `--list` — per the s47 smoke doctrine; the pin closes the DOC side and catches the partial update);
4. **the smoke-steps consistency pin:** the "«N» steps)" claims (README verification + pyramid rows), "«N» steps (local)" (DEPLOYMENT §6 — already s47-line-anchored, joining the family), "«N»-step API contract" (the SKILL appendix) — 4 sites, one number (the 121 — a runtime measure per the s47 non-goal; the pin closes the doc side).

The PAD §10 known-issues table is excluded by boundary (the historical rows are immutable by convention — the s47 doctrine: the historical "245 unit / 198 E2E / 121 smoke" inside the RESOLVED session-47 row stays). The SKILL's project_state historical prose ("(121 steps —" with a dash, not a closing paren) is excluded by shape.

**TDD:** the pins land RED first on the CURRENT docs (the honest RED — the six stale figures failing exactly their families) → the six doc fixes → GREEN.

### Component 2 — P2: the stack-version closure (2 pins)

**Code changes:** `tests/version-contract.test.ts` (new, 2 pins):

1. **the documented-figures ↔ installed-versions pin:** for each of the 7 packages (next, react, typescript, tailwindcss, prisma, vitest, @playwright/test): the installed `node_modules/<pkg>/package.json` version equals the PAD §2 row's full figure (16.4.0 / 19.3.0 / 5.9.3 / 4.3.3 / 6.19.3 / 5.0.3 / 1.64.0), and for the 5 badge-bearing packages the README badge's major.minor figure equals the installed major.minor (16.4 / 19.3 / 5.9 / 4.3 / 6.19) — every extraction must find ≥1 match per surface (a dropped badge line or PAD row fails loudly). No doc changes needed (correct today — the clean-contract case, the s31/s47-gitignore class);
2. **the lockfile-agreement pin:** the `bun.lock` resolved entry `"«pkg»@«version»"` exists for each of the 7 and equals the installed version — the CI artifact (what `--frozen-lockfile` installs) and the local runtime (what the gate runs on) agree; the s45 tsx-entry doctrine generalized to the whole stack.

**TDD (mutation-driven RED — the contract is green, the honest RED is BY MUTATION, each observed + reverted + re-verified):** badge-figure bump (README "Next.js-16.4" → 16.5), PAD-row drift (16.4.0 → 16.5.0), lockfile-entry drift ("next@16.4.0" → next@16.4.1), each biting exactly its pin.

### Component 3 — the docs alignment (the standing set)

README (L34 the parity fix + the counts 245 → 251 ×4 sites + the s48 pin description in the commands table), AGENTS.md (the commands-table test description + the NEW Session-48 contracts section + the reference list through s48 + the screenshots lineage s47→s48), CLAUDE.md (the counts + the s48 anti-pattern: the corpus-claims-are-a-contract doctrine — sweep the family shapes, not just the current value's sites), PAD (§7.1 the two new test rows + the checklist 251 + the RESOLVED session-48 known-issues row), `service-desk_SKILL.md` **v2.46.0** (lesson 102 + the project_state + the description line + the six stale-figure fixes), `docs/session_85.md` (this session's agent log per the numbering convention: odd docs = agent logs, the operator's transcript will land at session_86), this plan's execution status, the repo `worklog.md` (tasks 144+).

## 3. Non-goals (documented decisions, no code)

- **No pin on the corpus values themselves (245/198/164/121 as literals):** the counts are runtime properties of the suites; the honest pin is the doc-side consistency (the s47 smoke doctrine: "the 121 itself stays a runtime measure — the pin closes the DOC side of the contract"). The values are re-verified by every session's gate run.
- **No static count of the parity spec's tests:** measured this session — the line-anchored `test(` count (155) does not equal the runtime count (164; multi-line declarations) — a static pin would be a false claim. The parity figure joins the doc-consistency family only.
- **No pad-level version pins for the transitive dependency tree:** the 7 pinned packages are the ones the docs CLAIM (badges + tech table); the transitive tree (radix, lucide, …) is lockfile-governed and undocumented — out of scope by the documented-claim-without-a-pin doctrine (pin the claims, not the universe).
- **No changes to package.json / bun.lock / any dependency version:** the surface is correct today; the session closes the PIN gap, not a content gap.
- **No behavior changes on any surface:** the env contract, the provisioning, the seed output, every script's execution, and every API path stay byte-identical (a test-only + docs-only session on the code side).

## 4. The verification plan

1. **TDD:** the 4 corpus pins land RED on the current docs (the six stale figures — the honest RED) → the six doc fixes → GREEN; the 2 version pins land green (the clean contract — RED by mutation); then the mutations (≥6: corpus-family reverts ×4 + version-surface bumps ×3, each observed failing EXACTLY its pin, reverted, re-verified green).
2. **The full gate in the CLEAN environment** (the standalone :3000 server stopped first): lint → typecheck → unit (**251**) → build → E2E (198 — unchanged) → smoke (121 — unchanged).
3. **Live re-verification** on the production standalone :3000 (PID-managed within one script lifetime — the sandbox kills detached processes; the s48 battery pattern): the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap) + the paired VLM check (re-run post-remediation for the record) + the UI round-trip (the S48 remediated probe).
4. **Screenshots:** the 10-shot set refreshed (the s47 lineage + the header + the fixture title S48); changed shots VLM-diffed benign against the s47 baselines.
5. **Docs alignment** (Component 3).
6. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1 + P2) — complete, recorded in the workspace worklog
- [x] The 6 pins landed (tests/corpus-count-contract.test.ts (4) + tests/version-contract.test.ts (2) — 251/251; the corpus pins landed RED first on the stale figures — the honest RED: unit "245 & 54", e2e "198 & 57 & 107", parity "163 & 164", smoke "121 & 11" — then the six doc fixes + the 8-site count move 245→251 closed them GREEN; the version pins green first, the clean-contract case)
- [x] The mutation checks (8: A–H — each observed + reverted + re-verified; A/B/C/D bit exactly their corpus families, E/F/G bit exactly the version pins, H (the dropped README pyramid claim site) bit BOTH the unit and e2e families — the site carries one claim of each. The first run's `git checkout` revert wiped the uncommitted SKILL fixes (recovered idempotently); the runner hardened to REVERSE-REPLACE reverts, the session's live harness lesson)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 251/251 unit ✓ build ✓ 198/198 E2E ✓ (2.9m) smoke 121 ✓
- [x] Live re-verification (mobile matrix 375=375, the real click opens 0,0,288,667, Escape, the nav-tap; desktop 1280=1280; the paired VLM LAYOUT-OK post-remediation, first attempt; the UI round-trip: the S48 remediated probe Prisma-verified + cleaned + the canonical 4/11/3) + screenshots (the 10-shot set via scripts/capture-screenshots-s48.sh — NINE byte-identical to the s47 baselines + the ONE changed shot (09 the S48 fixture title) VLM-diffed BENIGN; the VLM spot-checks 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.46.0/session_85.md/plan/worklog tasks 144+) + `.env.example` re-verified (by the s46 pins, passing inside the 251 suite)
- [x] Commit + push + CI verification — 3f945bc pushed to git@github.com:nordeim/service-desk.git main via docs/ssh_git_wrapper_v3.py (the explicit --remote, the dry-run green first; the fingerprint verified BEFORE the push: SHA256:3ddaNlFhMz1JXiGEDgVEaRsUzI4Ev0IpGEEB7NnU4PU, byte-identical to the s30–s47 records; the key + the wrapper's temp key both shredded, no residue; the remote verified == local HEAD, tracking synced, main only, tree clean); CI green (the badge read passing on 6 fresh cache-buster reads, 3 past the run duration; the workflow runs page shows the session-48 run 'completed successfully' bracketing the 3f945bc commit, zero failure strings)
