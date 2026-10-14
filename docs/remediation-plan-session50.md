# ServiceDesk — Session 50 Remediation Plan

**Date:** 2026-10-14
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline on the freshly-cloned workspace (lint ✓ typecheck ✓ 254/254 unit ✓ build ✓ 198/198 E2E ✓ (2.9m) smoke 121 ✓ — the s49 closeout state reproduced exactly after ONE environment repair: the Playwright chromium_headless_shell-1248 install the fresh cache lacked; `bun install --frozen-lockfile` 485 packages + `.env` from `.env.example` + db:generate + db:push + db:seed + the canonical 4/11/3 on arrival), remediation of the identified own-side defect, and full re-verification. Session 50 follows the session-49 remediation (commits `f62a99e` + `a9c5154` + the operator's `ff20ef6` transcript commit adding `docs/session_88.md`; briefing docs `docs/session_87.md` + `docs/remediation-plan-session49.md` + `worklog.md` + `docs/session_88.md`).

**Method:** Ground truth = computed styles + live interaction probes + raw HTTP probes + bundle-source reads + fs listings + the runtime-pinned §7.1 table (per `skills/clone-app-pat-pro`, `skills/tdd`, `skills/agent-browser` + the s14–s49 doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP at the RENDERED level — but the TWENTIETH /login wave finally ARRIVED** (the first bundle rotation in six sessions): the reference restructured its entire frontend bundle onto a **rolldown build** — the entry rotated `index-CneaUv24.js` (104739) → `index-C-ulo5ek.js` (105055), the login CSS `index-D0Q6-tUz.css` (900665) → `index-BIWjBcok.css` (904487; the old CSS now 404), a 40-chunk topology (`rolldown-runtime`, `vendor-react`, `AuthAPI`, `AuthContext`, `i18n`…) replacing the vite-era chunk set, and the login-contract strings moved OUT of the entry (the new carriers: AuthAPI/AuthContext/i18n chunks + the rendered DOM). **The rendered DOM is UNCHANGED on every surface** (verified live at the computed-style level: the login card `bg-white/95` + `blur(4px)` + `shadow-2xl` + `rounded-2xl` 16px + the `bg-slate-900` sign-in button; the active-nav `linear-gradient(to right, rgb(6,182,212), rgb(37,99,235))` + white; the sidebar `#fafafa`; the page h1 36px; the quick-stats 48px gradient rows; the 3-col detail grid; the `mb-6 grid grid-cols-1 md:grid-cols-3 gap-4` filter row; "Search tickets..." placeholder). `logoutReturnPath-HjtsxsFd.js` hash-STABLE (33rd consecutive session, live HTTP 200). Their three standing defects persist (32nd re-verification); ours the working superset. **P1 CONFIRMED — ACTIVE DRIFT at a NEW audit level: the README Quick Start's verify-setup output line** — `README.md` L120 quotes `bun run test`'s output as "ESLint clean · tsc clean · **4 files / 55 tests passed**" — session-1-era figures (the truth: 25 files / 254→255 tests), a claim shape (`«N» files / «M» tests passed`) that **no s48 family sweeps** (the family shapes are corpus-count forms; this line is a QUOTED-OUTPUT form) — the s48 audit's own failure class at a new site: a shape the family design never saw.

## 1. The gap analysis (all measured this session — the 32nd sweep)

### F1 — the bundle sweep: the TWENTIETH /login wave ARRIVED (bundle-internal; the rendered DOM unchanged — NON-GAP at the parity level)

The reference rotated its entire frontend build onto **rolldown** (the runtime chunk `rolldown-runtime-C0FnF6B9.js` is the signature; 40+ chunks now ship on /login vs the vite-era 5). Measured: the entry `index-C-ulo5ek.js` (105055 bytes — the s45–s49 records carried `index-CneaUv24.js` at 104739, +316), the login CSS `index-BIWjBcok.css` (904487 vs `index-D0Q6-tUz.css` 900665, +3822; the old CSS now **404** — first time a referenced-then-dropped chunk went fully dark), `logoutReturnPath-HjtsxsFd.js` hash-STABLE (33rd, live HTTP 200 — still referenced by the new HTML). The login-contract strings moved out of the entry chunk: the new carriers are `AuthAPI-DYx9riQU.js` (from_url ×1, Password ×3), `AuthContext-CqGIYc-6.js` (from_url ×2), `i18n-E-KvTYsw.js` (Password ×23, Email ×50) + the rendered DOM (the login card still renders "Welcome to ServiceDesk" / "Continue with Google" / Email / Password / "Sign in" / "Forgot password?" / "Need an account? Sign up" — all live-verified). The old chunks (`index-CneaUv24.js`, `UserAppMain-DOZft9ba.js`) still return 200 but are no longer referenced. **The parity sweep's ground truth is the RENDERED DOM — verified unchanged on every surface** (the computed-style probes listed above; login card, dashboard, submitticket, mytickets, ticketdetails). **NON-GAP.**

### F2 — the chrome ledger holds (32nd, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color + apple-touch-icon). `/dashboard`: plain viewport (`width=device-width, initial-scale=1.0`) + NO PWA trio (re-measured live after a fresh reference login). **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 32nd)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified on the fresh standalone build, at `/dashboard`). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 32nd)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` (the toggle's own rect, measured `x:24 y:16 28×28`) returns the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse` toast-container div — the reference's mobile menu cannot be opened by a real click; zero dialogs after the attempt. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` — byte-identical to the s41–s49 records), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, "My Tickets | ServiceDesk"). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision API, both images in one prompt): **LAYOUT-OK — "The layout structure, including the sidebar navigation, header placement, four-column stats grid, performance metrics card, and recent tickets list arrangement, is identical between the two images."** First attempt. **Non-gap.**

### The UI round-trip (green)

Real login → submitticket → the category dropdown (the Radix option click via fresh refs — the s48/s49 lesson held: the title input's placeholder is "Brief summary of the problem") → typed title/description → submit → /mytickets → the S50 probe listed → Prisma-verified (`cmv8mfghv0001uccglum3iuyt`, status open, category hardware) → cleaned → the seed canonical (4 users / 11 tickets / 3 comments).

### P1 — the own-side audit at a NEW level: the README Quick Start's verify-setup output line (CONFIRMED ACTIVE DRIFT)

The s87 shortlist's two leading candidates measured CLEAN + unpinned again (the CLAUDE.md major-only prose claims: "Next.js 16" / "React 19" / "Tailwind CSS v4" / "Prisma 6" all satisfied by the installed 16.4.0 / 19.3.0 / 4.3.3 / 6.19.3; the DEPLOYMENT.md rate-limit prose figures: 10/IP/15-min + 5/IP/15-min + the 1000-key sweep threshold (`BUCKETS_SWEEP_THRESHOLD = 1_000`) + the one-sweep-per-minute gate (`BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000`) — all match `src/lib/auth.ts`). The audit then went one level deeper — sweeping the five docs for test-shaped numerals OUTSIDE every s48 family shape — and found exactly ONE live stale site:

- **`README.md` L120** (the "Verify Setup" block): `# ESLint clean · tsc clean · 4 files / 55 tests passed` — session-1-era figures. The truth today: `bun run test` prints **"Test Files 25 passed (25) / Tests 254 passed (254)"** (fs-counted: 25 test files matching the vitest include patterns). The shape (`«N» files / «M» tests passed` — a QUOTED-OUTPUT form) is swept by NO s48 family (the unit family's shapes are corpus-count forms: badge/verification/pyramid/commands; the quickstart output line never joined). The exact s48 failure class at a new site: the figure drifted at the session-1 era and every corpus move since (199→254) skipped it because no pin names it.

**The deeper design defect exposed (the s48 blind spot):** the corpus family pins hold all sites to ONE number — but if every site drifts TOGETHER (a whole-family move to a wrong number), the family pin still passes: nothing links the family canonical to the RUNTIME total. The s49 pins link §7.1's rows to the runtime per-file — so the §7.1 sum IS the runtime total — but nothing links the family canonical to that sum. This session's pin closes that gap (the BRIDGE design below).

## 2. The remediation

### Component 1 — P1: the quickstart output-line closure (1 doc fix + 1 BRIDGE pin)

**Doc changes:**
- `README.md` L120: `4 files / 55 tests passed` → `25 files / 255 tests passed` (the post-pin truth: the suite lands at 255 after this pin; the file count is 25 — the fs listing of the vitest include patterns).

**Code changes:** the 5th test in `tests/corpus-count-contract.test.ts` (the file moves 4 → 5 tests) — **the BRIDGE pin**, three assertions in one:
1. **the files figure** == the exact fs listing of the vitest include patterns (`src/**/*.test.ts` + `tests/**/*.test.ts` walked with `readdirSync` — a directory listing is always exact; the s48 false-claim doctrine applies to counting each-generated TESTS, never to counting FILES);
2. **the tests figure** == the PAD §7.1 Vitest rows' sum — runtime-pinned per-file by the s49 pad pins (bidirectionally), so the sum IS the runtime total;
3. **the BRIDGE** — the corpus family's canonical figure (the ONE number the s48 unit family holds across its 9 sites, collected by the same shapes as pin 1) == that same §7.1 sum. This closes the s48 blind spot: a whole-family drift to a wrong number now fails (the family canonical is held to the runtime-derived sum for the first time).

The pin carries its own floor (`expect(m).toBeTruthy()` — a deleted quickstart line fails loudly, the dropped-site doctrine) and reuses the family shapes via a shared module-level constant (no duplication between pin 1 and pin 5).

**The corpus move 254 → 255** (the pin file's +1): the 9 family sites (README badge `tests-255%20unit`, README verification "255 Vitest unit tests", README pyramid "255 unit + 198 E2E", README commands "Vitest unit: 255 tests", AGENTS commands "unit suite (255 tests", CLAUDE commands "255 unit / 198 E2E", PAD §7.4 checklist "`bun run test` — 255/", SKILL project_state "255 unit", SKILL Appendix A "Vitest — 255 unit tests") + pin 1's `toBe(254)` literal → `toBe(255)` + pin 1's comment (the lineage note s48+s49 → s48+s49+s50) + the PAD §7.1 corpus-count row 4 → 5 (its description extended with the s50 pin).

**TDD:** the pin lands RED first (the honest RED: my pin fails "the quickstart line claims 4 files / 55 tests — the listing is 25 files / the §7.1 sum is 254"; AND the s49 unit pad pin fails on the corpus row "claims 4 — the runtime count is 5" — the file's own row moved by the pin landing) → the README fix + the §7.1 row fix + the corpus move → GREEN 255/255 = 254 + 1.

### Component 2 — the docs alignment (the standing set)

README (the L120 fix + the counts 255 ×4 sites + the s50 pin description in the commands table), AGENTS.md (the commands-table test description 255 + the NEW Session-50 contracts section + the reference list through s50 + the screenshots lineage s49→s50), CLAUDE.md (the counts + the s50 anti-pattern: the quoted-output doctrine — a quoted CLI output is a claim site like any other, and consistency families need a runtime bridge or they drift together), PAD (§7.1 the corpus row 5 + the description + the §7.4 checklist 255 + the RESOLVED session-50 known-issues row), `service-desk_SKILL.md` **v2.48.0** (lesson 104 + the project_state + the description line), `docs/session_89.md` (this session's agent log per the numbering convention: odd docs = agent logs, the operator's transcript landed at session_88), this plan's execution status, the repo `worklog.md` (tasks 152+).

## 3. Non-goals (documented decisions, no code)

- **No CLAUDE.md major-level or DEPLOYMENT rate-limit pins this session:** both surfaces measured clean again; they stay on the next-session shortlist (the s85 lineage convention: candidates are named, measured, and left documented).
- **No reference-side remediation for the 20th wave:** the wave is bundle-internal (their build system); the rendered DOM is unchanged on every surface — parity holds. The old-chunk 404s and the string-count relocation are recorded, not cloned (the clone reproduces the RENDERED DOM, never their build topology).
- **No behavior changes on any surface:** the env contract, the provisioning, the seed output, every script's execution, and every API path stay byte-identical (a test-only + docs-only session on the code side).
- **No static per-file `test(` counting** (the s48 doctrine holds — only the RUN is the truth); the fs listing is exact for FILE counts (a listing, never a count of each-generated tests).
- **The .env.example is verified, not rebuilt:** the s46 env-contract pins verify it bidirectionally inside the suite (every code-read env var documented, every documented var live, the canonical DATABASE_URL literal) — it already matches the codebase and is already tracked (the s47 inverse pin); no changes required.

## 4. The verification plan

1. **TDD:** the pin lands RED on the current README line (the honest RED — my pin on "4 files / 55 tests", the s49 unit pad pin on the corpus row 4≠5) → the README fix + the §7.1 row fix + the corpus move (254 → 255 ×9 sites + pin 1's literal + the §7.1 corpus row description) → the full suite green at the new count.
2. **The mutation checks (≥6, each observed + reverted + re-verified — REVERSE-REPLACE reverts, never `git checkout`, the s48 harness doctrine; deletion mutations via the NEIGHBOR-ANCHOR pair, the s49 empty-needle doctrine):** (A) the quickstart tests figure 255→254 must bite my pin; (B) the quickstart files figure 25→4 must bite my pin (the files direction); (C) one family site revert (the README badge 255→254) must bite pin 1's family + my pin's BRIDGE; (D) the §7.1 corpus row 5→4 revert must bite the s49 unit pad pin + my pin (the sum); (E) the quickstart LINE deletion must bite my pin (the dropped-site floor); (F) the §7.1 corpus row DELETION must bite the s49 unit pad pin (the missing-row direction) + my pin (the sum drops).
3. **The full gate in the CLEAN environment** (ports 3000/3100/3999 free): lint → typecheck → unit (**255**) → build → E2E (198 — unchanged) → smoke (121 — unchanged).
4. **Live re-verification** on the production standalone :3000 (booted INSIDE each script's process lifetime — the s48/s49 battery pattern): the mobile matrix (375=375, the real click opens 0,0,288,667, Escape, the nav-tap) + the paired VLM check + the UI round-trip (the S50 remediated probe).
5. **Screenshots:** the 10-shot set refreshed (the s49 lineage + the S50 fixture title); changed shots VLM-diffed benign against the s49 baselines.
6. **Docs alignment** (Component 2).
7. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap at the rendered level + the 20th-wave records + P1) — complete, recorded in the workspace worklog
- [x] The pin lands RED first (the honest RED — my pin: "the quoted file count must name the vitest include listing — the listing carries 25 files: expected 4 to be 25"; the s49 unit pad pin: "the §7.1 row for tests/corpus-count-contract.test.ts claims 4 tests — the runtime count is 5"; one pin-harness bug fixed in flight: the `**/` sequence inside a block comment terminates it early — the s50 comment class, rewritten glob-free)
- [x] The README fix + the §7.1 row fix + the corpus move (254 → 255 ×9 sites + pin 1's literal) — GREEN 255/255 = 254 + 1 (scripts/s50-doc-fixes.py, 12 replacements count-verified exactly-once)
- [x] The mutation checks (6: A–F, each observed + reverted + re-verified — reverse-replace, never checkout; A the quickstart tests one-behind bit my pin's assertion 2; B the files revert bit assertion 1; C the badge revert bit pin 1's family + the BRIDGE; D the §7.1 row revert bit the s49 pad pin + my pin; E the line deletion bit my pin's floor — the live harness lesson: a non-unique revert needle can never be count-verified, the anchor fixed to the "← server + database healthy" prefix; F the row DELETION bit the s49 pad pin's missing-row direction + my pin)
- [x] The full gate in the clean environment (ports 3000/3100/3999 free): lint ✓ typecheck ✓ 255/255 unit ✓ build ✓ 198/198 E2E (2.8m) ✓ smoke 121 ✓
- [x] Live re-verification + screenshots + docs alignment + worklog tasks 152+ (the mobile matrix 375=375 green on the remediated build, the real click opens 0,0,288,667, Escape, the nav-tap; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip: the S50 remediated probe Prisma-verified cmv8mzbgl0001ucc16ij1b8r2 open/hardware + cleaned + the canonical 4/11/3; the 10-shot set: SEVEN byte-identical to the s49 baselines + the THREE changed shots (04/05 the timestamp class + 09 the S50 fixture title) VLM-diffed BENIGN)
- [x] Commit + push + CI verification — see the worklog tasks 152+ and docs/session_89.md
