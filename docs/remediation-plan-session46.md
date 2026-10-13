# ServiceDesk — Session 46 Remediation Plan

**Date:** 2026-10-14
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the re-cloned workspace (lint ✓ typecheck ✓ 235/235 unit ✓ build ✓ 198/198 E2E ✓ (2.7m) smoke 121 ✓ — the s45 closeout state reproduced exactly; the workspace WAS reset this session — the third consecutive reset — so the clone + `bun install --frozen-lockfile` + `.env` from example + `db:push` + `db:seed` path ran end to end again, the ADR-002 "clone and run" story; one environment repair was needed: the Playwright browser binaries (`npx playwright install chromium` — the reset wiped `~/.cache/ms-playwright`'s 1248 build; the first E2E run failed at `browserType.launch` with every chromium test at 1ms), remediation of the identified own-side defect, and full re-verification. Session 46 follows the session-45 remediation (commits `50a79ca` + `c4f42f4` + the operator's `cd9fd58` transcript commit; briefing docs `docs/session_79.md` + `docs/remediation-plan-session45.md` + `worklog.md` + `docs/session_80.md`).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s45 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP (the 28th)** — **NO sixteenth /login wave arrived**: all three chunks byte-size-identical to the s45 records (`index-CneaUv24.js` 104739, `UserAppMain-DOZft9ba.js` 58761, `index-D0Q6-tUz.css` 900665; `logoutReturnPath-HjtsxsFd.js` hash-stable, 29th consecutive session), the login-contract string counts identical (`from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39) — the second quiet session in three (the s35/s41/s42 pattern). Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — `elementFromPoint(38,30)` still returns the `fixed top-0 z-[100]` toast div, the real click on their mobile toggle still REFUSED by agent-browser's coverage check; 28th re-verification); ours the working superset (375=375, the REAL click opens the sheet at 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; 1280=1280; the paired desktop VLM check **LAYOUT-OK**; the UI round-trip green: the S46 probe created through the real UI, Prisma-verified `cmv7b5ify0001prxfe3lfnxo1` open/software, cleaned, the canonical 4/11/3 restored). The own-side audit (the s79 next-session shortlist, executed): the 235-count drift watch CLEAN (five docs consistent), nothing new grew (the `50a79ca..cd9fd58` diff is docs-only — session_80.md + the worklog), the console-site ledger stable (4 sites in src/, all pinned — the grep includes `console.info`), the CI YAML bytes correct (the `branches: ain]` display artifact did NOT fire this session — the od-verified bytes stand from s45; a fresh grep confirms `[main]` ×2), the health-route log-prefix bytes od-verified fresh this session (`[health]` — the display artifact's tenth firing, in-session, doctrine re-held). **P1 CONFIRMED: the environment-contract surface (`.env.example` ↔ the codebase) is entirely unpinned** — zero tests reference `.env.example` while AGENTS.md claims "`.env.example` documents every variable," the README's environment table + quickstart lean on `cp .env.example .env`, and every session's closeout re-verifies the match MANUALLY (s45: "re-verified against the codebase (no env changes this session — unchanged, matches)") — the exact s31/s43/s45 doctrine class: a documented invariant held by convention alone.

## 1. The gap analysis (all measured this session — the 28th sweep)

### F1 — the bundle sweep: NO sixteenth wave, the second quiet session in three (non-gap)

The reference's /login surface did NOT rotate: the entry is still `index-CneaUv24.js` (104739 bytes — byte-size-identical to the s45 record), the login-contract carrier `UserAppMain-DOZft9ba.js` (58761 bytes), and the login CSS `index-D0Q6-tUz.css` (900665 bytes); `logoutReturnPath-HjtsxsFd.js` remains hash-STABLE (the 29th consecutive session, referenced by the entry). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. The old chunks remain live-fetchable (HTTP 200). **Non-gap — the platform's vendor graph did not re-hash this session; the login contract carrier is untouched.**

### F2 — the chrome ledger holds (28th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color + apple-touch-icon) — re-measured from the fresh fetch. `/dashboard`: plain viewport + NO PWA trio (re-measured live after a fresh reference login). **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 28th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified on the fresh standalone build). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 28th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` returns the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse` toast-container div, and agent-browser's coverage check REFUSED the real click on the mobile menu toggle ("Element '@e35' is covered by <div.fixed.top-0 inside div#root>") — the reference's mobile menu cannot be opened by a real click. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s45 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title — via the snapshot-ref flow; the s44/s45 selector-ambiguity note stands: a bare CSS `a[href='/mytickets']` resolves the hidden desktop-sidebar copy first). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API, both images in one prompt): **LAYOUT-OK — "The layout structure, including the sidebar navigation, header placement, stats cards arrangement, and ticket table positioning, is identical between the two images."** One operator lesson re-fired (the s34/s44 paired-check-validates-the-operator class): the first comparison captured our /mytickets (the mobile-matrix nav-tap had left the browser there) and the VLM correctly flagged LAYOUT-DIFF — recaptured from /dashboard and the check passed. **Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click via fresh refs) → typed title/description → submit → /mytickets → the S46 probe listed (Prisma-verified: `cmv7b5ify0001prxfe3lfnxo1`, status open, category software) → cleaned via `scripts/s46-probe-cleanup.ts` → the seed canonical (4/11/3).

### P1 — the own-side audit: the environment-contract surface is entirely unpinned (CONFIRMED actionable)

The s79 shortlist's own-side candidates were executed clean (the count drift watch, the docs-only diff, the console ledger, the CI YAML bytes). The next-level audit axis — the s31 doctrine's "measure every documented claim for a pin" applied to the remaining file surfaces — found the gap:

1. **AGENTS.md (Environment): "`.env.example` documents every variable."** Zero tests reference `.env.example` (rg across the whole test tree). The measured contract: the code reads exactly three production env vars (`DATABASE_URL` — `src/lib/db.ts` + `src/lib/db-path.ts`; `AUTH_SECRET` — `src/lib/auth.ts`; `NEXT_PUBLIC_SITE_URL` — five sites) plus the framework-managed `NODE_ENV`; `.env.example` documents exactly those three (lines 20/27/32). They match TODAY — held by manual re-verification every session closeout since the file was born.
2. **The drift scenario (the silent failure):** a new env var lands in the code — the PAD known-issues row literally proposes "wire Resend/SendGrid" someday — and nothing fails: the quickstart `cp .env.example .env` yields an app missing its configuration, the README environment table goes stale, and the next agent's "re-verify .env.example" is a manual grep with no alarm. The reverse drift: a documented var nothing reads (a stale `RESEND_API_KEY=` line after a reverted feature) — dead configuration that misleads every operator who sets it.
3. **The user's own standing task makes this a per-session contract:** "create a working `.env.example` that matches the codebase" — the bidirectional word "matches" is exactly the unpinned invariant (every code var documented; every documented var live).

**The defect class:** the s31 doctrine exactly ("a clean audit is closed by pinning it: an unpinned clean contract is a future regression with no alarm") + the s43 doctrine ("EVERY documented invariant gets a pin — the docs say it, the tests enforce it") + the s45 doctrine generalized beyond config files that gate the pipeline to the config file that gates the quickstart: an environment example is a contract surface, not a README decoration.

**The fix:** a new `tests/env-contract.test.ts` (3 pins, code-shaped + line-anchored where a comment could false-green, per the s43 mutation-C / s45 line-anchoring doctrines):

1. **the documents-every-variable pin (code → example):** every `process.env.NAME` referenced in non-test `src/**` code (excluding the framework-managed `NODE_ENV`, which Next itself injects and no user sets) has an ACTIVE, uncommented `NAME=` line in `.env.example`;
2. **the working-example pin (example → code):** every ACTIVE var documented in `.env.example` is referenced somewhere in non-test `src/**` code — the bidirectional closure (the "matches the codebase" contract);
3. **the canonical DATABASE_URL pin:** `.env.example` carries the canonical literal in its executable, line-anchored shape — `^DATABASE_URL="file:../db/custom.db"$` — the db-path contract's documented entry point (the pin the AGENTS.md Environment section and the README quickstart both lean on).

No production code changes — `.env.example` is already correct; the pins close the regression surface.

## 2. The remediation

### Component 1 — P1: the environment-contract closure (the 3 pins)

**Code changes:** `tests/env-contract.test.ts` (new, 3 pins). No changes to `.env.example`, `package.json`, or any src file.

**The pin set (tests/env-contract.test.ts, 3 pins):**
1. the documents-every-variable pin: the set of `process.env.NAME` occurrences in non-test src code, minus `NODE_ENV`, is a subset of `.env.example`'s active var set — a new code-side env var without documentation fails immediately;
2. the working-example pin: `.env.example`'s active var set is a subset of the code-side var set — a documented-but-dead var fails immediately (the bidirectional "matches");
3. the canonical DATABASE_URL pin: the line-anchored executable literal `DATABASE_URL="file:../db/custom.db"` (a commented-out or corrupted literal must FAIL the pin, never satisfy it).

**TDD (the s31/s45 mutation-driven RED — the code is already green, so the honest RED is BY MUTATION, each observed + reverted + re-verified):**
- A: add a `process.env.RESEND_API_KEY` read to `src/lib/constants.ts` → pin 1 fails (the documented drift scenario, live);
- B: comment out the `NEXT_PUBLIC_SITE_URL=` line in `.env.example` → pin 1 fails (the commented line's doc-comment neighbors must not satisfy it — the s45 line-anchoring class);
- C: append an undocumented `DEAD_VAR=1` line to `.env.example` → pin 2 fails;
- D: corrupt the DATABASE_URL literal (`file:../db/wrong.db`) → pin 3 fails;
- each mutation reverted, the suite re-run GREEN after every revert.

### Component 2 — the docs alignment (the standing set)

README (the counts 235 → 238 + the s46 pin description), AGENTS.md (the commands-table test description + the NEW Session-46 contracts section + the reference list through s46 + the screenshots lineage s45→s46), CLAUDE.md (the counts + the s46 anti-pattern: the environment-example-is-a-contract doctrine — `.env.example` is the quickstart's config surface; bidirectional coverage pins, line-anchored literals), PAD (§7.1 the new test row + the checklist 238 + the RESOLVED session-46 known-issues row), `service-desk_SKILL.md` **v2.44.0** (lesson 100 + the project_state + the description line), `docs/session_81.md` (this session's agent log per the numbering convention: odd docs = agent logs, the operator's transcript will land at session_82), this plan's execution status, the repo `worklog.md`. `.env.example` re-verified against the codebase — BY THE NEW PINS THEMSELVES (the session's manual closeout step automated).

## 3. Non-goals (documented decisions, no code)

- **No pin on `NODE_ENV`:** framework-managed — Next.js injects it; no user configures it, and `.env.example`'s job is user-facing configuration.
- **No pin on `.env` itself:** gitignored, machine-local; its DATABASE_URL contract is already pinned at the db-path/db-script layers (s43).
- **No pin on `.env.example`'s commented alternatives (the PostgreSQL URL block):** an alternative-config comment is documentation, not an active var — the line-anchored extraction naturally excludes it, and pinning comment prose adds false precision.
- **No pin on `AUTH_SECRET`'s empty-string default in `.env.example`:** the value's semantics (required in production, insecure dev fallback) are already pinned at the code layer (`tests/auth-secret-warning.test.ts`, s42); the example's `AUTH_SECRET=""` shape is a presentation choice whose drift is loud (the quickstart's own comment explains it).
- **No behavior changes on any surface:** the env contract, the provisioning, the seed output, every script's execution, and every API path stay byte-identical (a test-only session on the code side).

## 4. The verification plan

1. **TDD (mutation-driven RED):** the 3 pins land green first (the s31 clean-contract pattern — 238 = 235 + 3), then mutations A/B/C/D — each observed failing EXACTLY its pin, reverted, re-verified green.
2. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999 — the s46 server stopped first): lint → typecheck → unit (**238**) → build → E2E (198 — unchanged) → smoke (121 — unchanged).
3. **Live re-verification** on the production standalone :3000 (PID-managed): the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap) + the paired VLM check (re-run post-remediation for the record) + the UI round-trip (re-run on the remediated build).
4. **Screenshots:** the 10-shot set refreshed (the s45 lineage verbatim + the header + the fixture title S46); VLM spot-checks on the convention shots; changed shots VLM-diffed benign against the s45 baselines.
5. **Docs alignment** (Component 2) + `.env.example` re-verified (by the pins).
6. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1) — complete, recorded in worklog
- [x] The 3 pins landed (tests/env-contract.test.ts — 238/238)
- [x] The mutation checks (A/B/C/D — each observed + reverted + re-verified; B's commented-out form bit exactly pin 1 — the line-anchored extraction held on the first attempt)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 238/238 unit ✓ build ✓ 198/198 E2E ✓ (2.8m) smoke 121 ✓
- [x] Live re-verification: the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap via refs) + desktop 1280=1280 + the paired VLM check LAYOUT-OK (post-remediation) + the UI round-trip (the S46 remediated probe: 201 + listed + navigated + Prisma-verified + cleaned + the canonical 4/11/3)
- [x] Screenshots (the 10-shot set via scripts/capture-screenshots-s46.sh, all FATAL guards passed; seven byte-identical to the s45 baselines + THREE changed shots (09 the S46 fixture title; 04/05 the fresh-seed relative timestamps) VLM-diffed BENIGN; the VLM spot-checks 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.44.0/session_81.md/plan/worklog) + `.env.example` re-verified (by the pins themselves)
- [x] Commit + push + CI verification — see the worklog's final entries for the status
