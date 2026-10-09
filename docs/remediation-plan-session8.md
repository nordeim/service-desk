# ServiceDesk — Session 8 Remediation Plan

**Date:** 2026-10-09
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 8 follows the session-7 remediation (10 findings incl. the accent-token pair, the reference `rounded-sm` drift, and fetch-failure resilience; commit `c9f4470`, briefing doc `e8eca32`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live geometry via agent-browser + Playwright hover-capable probes (per `skills/clone-app-pat-pro`). New probe surfaces this session: **toast behavior** (never compared — the reference's Radix toaster was observed idle AND under live triggers), **auth error-state styling** (wrong-password alert markup/computed), **the mobile sheet OVERLAY color** (geometry was pinned in earlier sessions; the backdrop color never was), **viewport extremes** (320/360/375/390/1024/1920 — horizontal-overflow behavior + min-content chains), **head metadata** (og/twitter/canonical/apple — never probed), **keyboard tab order** (focusable enumeration on login + dashboard), **sidebar footer / sign-out button** (never probed), and **stat-card / recent-row / ticket-card hover states** (session 7 covered CTA + back buttons only). Standing surfaces re-verified: mobile navigation (full close-path matrix), select flip behavior, accent tokens + option radius (reference drift re-check), nav active mechanism, mytickets filter grid.

**Baseline at session start:** typecheck ✓ 54 unit ✓ build ✓ 116/116 E2E ✓ smoke 11/11 ✓ — but **lint ✗** (see G1; the session-7 commit shipped a post-gate script that breaks the gate — CI on `main` is red).

---

## 1. Findings Inventory

### A. Headline finding: the lint gate is RED on main — a post-gate artifact shipped in the session-7 commit

`scripts/cleanup-s7-tickets.cjs` (a one-off dev-DB cleanup used before the screenshot recapture, created AFTER the session-7 gate run) uses CommonJS `require()` and fails `@typescript-eslint/no-require-imports`. Every other repo script is ESM (`.mjs`) by convention. CI (lint → typecheck → unit → build) fails at the lint step on `c9f4470` — a production-readiness defect, not cosmetics. **Fix:** convert the script to ESM `.mjs` (keeps the artifact + history, restores the gate).

### B. The never-probed surfaces produced 6 more findings

| ID | Severity | File(s) | Gap | Fix |
|---|---|---|---|---|
| G2 | **HIGH** | `login/page.tsx`, `signup/page.tsx`, `forgotpassword/page.tsx` | **Auth error alert styling** (wrong-password path, live-measured on the reference): the reference renders a shadcn Alert — `p-4` (16px), `rounded-xl` (12px), `bg-red-50/70` (translucent `rgba(254,242,242,0.7)`), `border-red-200`, inner text `text-red-700` (`rgb(185,28,28)`), positioned between the password field and the submit button (position already matches). Ours: `px-3 py-2` (12/8px), `rounded-lg` (8px), opaque `bg-red-50`, `text-red-600` | Restyle the alert P (keep `p[role=alert]` — the a11y superset + the existing auth.spec pin) to `text-sm text-red-700 bg-red-50/70 border border-red-200 rounded-xl p-4` on all three auth pages. Field-level error Ps (`text-xs text-red-600`) stay — superset (our API returns field errors; the reference has a single alert) |
| G3 | MED | `src/components/ui/sheet.tsx` | **Mobile sheet overlay opacity**: the reference dims at `rgba(0,0,0,0.8)` (live-measured on their open sheet); ours at `oklab(0 0 0 / 0.5)` — the backdrop is visibly lighter on every mobile menu open | Overlay class `bg-black/50` → `bg-black/80` (single call site; the reference's own viewport classes are identical to ours except this) |
| G4 | MED | `src/components/ui/sidebar.tsx` (SidebarInset) | **Mobile horizontal overflow on every page**: at 375px the document scrollWidth is 516 (main grows to the recent-card rows' intrinsic min-content — the truncate chain's intrinsic contribution defeats `min-w-0` wrappers; bisected live). The reference has the IDENTICAL defect (their scrollWidth 451 = our single-row test with the same ticket title — structurally confirmed, data-dependent). Deliberate improvement divergence (like the `/`→`/dashboard` redirect): `min-w-0` on `<main>` — verified live: scrollW 516→375 AND the recent-row title then truncates properly (ellipsis active) | Add `min-w-0` to the SidebarInset main; document as an intentional superset over a shared reference defect |
| G5 | MED | `src/app/layout.tsx` + 4 per-route `layout.tsx` | **Head metadata**: the reference ships, per route: `description` ("An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently." — live-measured), `og:title/description/url/type/site_name/image`, `twitter:card (summary_large_image)/title/description/url/image`, `canonical`, `apple-mobile-web-app-status-bar-style/title`, `mobile-web-app-capable`. Ours: only a different description + the favicon | Root layout: `metadataBase` (NEXT_PUBLIC_SITE_URL), the reference's description text, `openGraph` (type website, siteName ServiceDesk, image `/icon.png`), `twitter` (summary_large_image), `appleWebApp` (capable/title). Per-route layouts (4): `alternates.canonical` — og:title/og:url derive from the existing title template + canonical. Auth pages keep the root defaults (reference parity: their `/login` also carries the set, but the auth pages are our superset surface; the root-level metadata covers them once titles stay default) |
| G6 | LOW | `src/components/app-sidebar.tsx` | **Sign-out button focus tail**: the reference's sign-out renders the shadcn base incl. `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`; ours is a raw `<button>` with no focus-visible styling (the session-6 focus matrix covered Button/Input/Textarea/SelectTrigger — not raw buttons) | Add the focus tail to the raw button's classes (keeps aria-label superset) |
| G7 | LOW | `src/app/(app)/submitticket/page.tsx` | The attachment **Remove** raw button has no focus tail either (superset surface — the reference has no attachments; internal consistency with G6) | Same tail |

### C. Verified NON-gaps (re-checked this session, no action)

- **Toast behavior**: the reference renders NO toast on comment-add, ticket-submit (success), or login-error (verified with live triggers + MutationObservers on their viewport — their Radix toaster exists but stays idle in these flows; their login error is an inline Alert). Our toasts (submit/status/errors) = documented superset feedback. Our viewport classes are IDENTICAL to theirs; our idle viewport is `pointer-events: none` (the session-4 fix — re-verified: the mobile trigger hit-tests to BUTTON; theirs is STILL blocked by their own `pointer-events: auto` viewport — their standing defect). Our toast item: 12px radius, 16px padding, close-on-hover — sound.
- **Mobile navigation (standing priority, full pass on both sites)**: sheet geometry 288×812 @ x:0, bg `#fafafa`, nav items h:32/gap 12px/20px icons, labels semibold 600 via span (anchor-level 500-vs-400 is invisible); trigger 28×28 radius 8px hit-tests to BUTTON; Escape ✓, overlay close via REAL pointer events ✓, nav-tap navigates + auto-closes ✓. (Probe gotcha recorded: our mobile sidebar content carries `data-slot="sidebar"`, NOT `sheet-content` — a bad selector false-negatived three probes before correction.)
- **Tab order (login)**: identical focusable sequence (Google → email → password → Sign in → Forgot → Sign up). Ours renders anchors where the reference uses buttons (real-href superset). Dashboard: reference CTAs are `<a><button/></a>` (nested — TWO Tab stops); ours asChild anchors (ONE stop) — documented superset.
- **Sidebar footer / user area**: identical structure (gradient avatar tile, name/email truncation, sign-out 36×36 radius 6px icon 16×16, `hover:bg-red-50 hover:text-red-600` identical).
- **Viewport extremes**: 1024/1920 parity (sidebar 256px, container max-w-7xl 1280px, 4-col stat grid, no overflow). 320px: BOTH sites overflow (theirs 451px min-content, ours 516px with our seed data) — same defect class (see G4); the reference ALSO overflows at 1920 (their decorative `w-32` blobs push scrollWidth to 1968 — their own defect, not copied).
- **Select flip**: both sites render the dropdown below the trigger with Radix collision handling (`data-side="bottom"`, fits) — framework-identical.
- **Hover states (Playwright, hover:hover)**: stat card `shadow-lg`→`hover:shadow-xl` (identical class contracts; our computed rest shadow = the v4 two-layer `0 10px 15px -3px / 0 4px 6px -4px` @ 10% — identical); recent-row hover = the cyan-50/50→blue-50/50 gradient + cyan-600 title + cyan arrow (ours in oklab — the documented pipeline divergence); mytickets card hover (session-2/3 pins, E2E-green).
- **Reference drift re-check (session-7 ledger)**: `--accent`/`--accent-foreground` (hsl 0 0% 96.1%/9%), option radius 4px, per-route titles, active-nav gradient mechanism — ALL unchanged. New drift observations: their sidebar renders plain `div`s (no `aside`/`nav`) — ours too (structure parity); their post-login lands on `/` (dashboard content, no nav highlight — the known `/`-root quirk; our redirect stays the documented superset).
- **MyTickets filter row**: `mb-6 grid grid-cols-1 md:grid-cols-3 gap-4` + "Search tickets..." placeholder — identical; our sort + scope selects remain the documented superset.
- **Toast viewport position at mobile**: top-anchored full-width on BOTH sites at <sm (identical classes) — an earlier "top-left at desktop" reading was a leftover-375px-viewport artifact, re-verified at 1280.

### D. Intentional divergences (documented, do NOT "fix")

- Our toast feedback (reference never toasts); error+retry panels; asChild single-stop CTAs; display names; lab() color pipeline; the v4 hover media-guard; G4's `min-w-0` (once shipped — superset over the shared mobile-overflow defect); distinct filtered-empty message; dark-mode block; signup/forgotpassword pages + field-level errors.

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first**: 9 E2E tests written (the session-8 block of `tests/e2e/visual-parity.spec.ts`) — all verified RED against the pre-fix build (9/9 + the setup project pass).
2. ✅ **G1** `scripts/cleanup-s7-tickets.cjs` → `cleanup-s7-tickets.mjs` (ESM import; the artifact stays, the gate restores).
3. ✅ **G2** the three auth alert Ps restyled (`text-sm text-red-700 bg-red-50/70 border border-red-200 rounded-xl p-4`, `p[role=alert]` preserved; the forgotpassword SUCCESS div already matched the scale).
4. ✅ **G3** `bg-black/50` → `bg-black/80` in sheet.tsx.
5. ✅ **G4** `min-w-0` on the SidebarInset main (with the in-code superset rationale).
6. ✅ **G5** root layout metadata (metadataBase, the reference's description, openGraph, twitter, appleWebApp) + `alternates.canonical` in the 4 app-route layouts.
7. ✅ **G6/G7** focus tails on the sign-out + Remove raw buttons.
8. ✅ **Full gate:** lint ✓ typecheck ✓ 54 unit ✓ build ✓ **125/125 E2E** ✓ smoke 11/11 ✓.
9. ✅ **Live paired re-verification** (production standalone vs the live reference): the login alert computes 12px radius / 16px padding / 0.7-alpha red-50 / red-700 = the reference exactly (oklab pipeline); the overlay `oklab(0 0 0 / 0.8)` = the reference's 80%; scrollWidth 375 = clientWidth 375 with the sheet open, the recent-row h3 ellipsis-active; the head ships the full og/twitter/canonical/apple set (live dump matches the reference's inventory); the keyboard-focused sign-out renders the 1px near-black ring (`rgb(10,10,10) 0 0 0 1px`) via REAL Tab presses (programmatic `.focus()` doesn't trigger :focus-visible — Chromium heuristic).
10. ✅ **Refreshed `docs/screenshots/`** (7 shots via `scripts/capture-screenshots-s8.sh` against the production standalone).
11. ✅ Docs updated: this plan + README + AGENTS (session-8 contracts) + CLAUDE (gate rule + alert/overlay/min-w-0 rules) + PAD (known-issues row) + SKILL v2.6.0 (lessons 27–32) + session_8.md retrospective + worklog.
12. Commit + push via `docs/ssh_git_wrapper_v3.py` (main only).

### Original plan (as written pre-execution)

1. **Red tests first** (`tests/e2e/visual-parity.spec.ts` session-8 block, 7 tests):
   - login wrong-password alert: class contract (`bg-red-50/70`, `text-red-700`, `rounded-xl`, `p-4`) + computed radius 12px + padding 16px
   - signup alert carries the same contract (field-error trigger via API-mocked duplicate email or a direct class probe — simplest: submit an already-registered email → the alert P renders)
   - mobile sheet overlay computes 80% black (accept `rgba(0,0,0,0.8)` / `oklab(0 0 0 / 0.8)` / `color-mix` with 0.8 alpha)
   - no horizontal document overflow at 375px on all 4 app pages (`scrollWidth <= clientWidth`)
   - the recent-row h3 actually truncates at 375px (`scrollWidth > clientWidth` on the h3)
   - head meta: description text (reference's), og:title/site_name/type/image, twitter:card, canonical on /dashboard + /submitticket
   - sign-out button + attachment Remove button carry `focus-visible:ring-1` (class pins; Remove reached via `setInputFiles('#file-upload')`)
2. **G1** convert `cleanup-s7-tickets.cjs` → `.mjs` (ESM import) — lint gate green.
3. **G2** restyle the three auth alert Ps (classes only; `p[role=alert]` selector preserved).
4. **G3** `bg-black/50` → `bg-black/80` in sheet.tsx.
5. **G4** `min-w-0` on SidebarInset main.
6. **G5** root layout metadata (metadataBase, description, openGraph, twitter, appleWebApp) + `alternates.canonical` in the 4 app-route layouts.
7. **G6/G7** focus tails on the two raw buttons.
8. Full gate: lint → typecheck → 54 unit → build → E2E (116 + 7) → smoke.
9. Live paired re-verification (agent-browser + Playwright, both sites): the alert on both auth flows, overlay color, 375px overflow on all pages, meta tags, focus rings.
10. Refresh `docs/screenshots/` (7 shots); update README/AGENTS/CLAUDE/PAD/SKILL + session_8.md retrospective + this plan's execution status + worklog.
11. Commit + push via `docs/ssh_git_wrapper_v3.py` (main only).

## 3. Validation of this plan against the codebase

- G1: `eslint.config.mjs` ignores `skills` but not `scripts/` — the other `.mjs` scripts pass (ESM); only the `.cjs` fails.
- G2: the alert P appears at login:185-192, signup:146-149, forgotpassword:101-104 (same pattern); `auth.spec.ts:34` pins `p[role="alert"]` + text only (unaffected by class changes). The forgotpassword SUCCESS div (`bg-emerald-50 … rounded-xl px-4 py-3`) already matches the target visual scale.
- G3: `sheet.tsx:33` is the only overlay definition; no E2E pins the overlay color (mobile-navigation.spec asserts close behavior only — grep-verified).
- G4: `sidebar.tsx:292` renders exactly `flex-1 flex flex-col` (the session-3 measured contract — the note stays; `min-w-0` is an additive superset documented in-code). The h3 truncate chain (`flex-1 min-w-0` wrapper + `truncate` h3) exists at ticket-bits.tsx:166-172 — the intrinsic contribution defeats it without the main-level fix (empirically bisected: hiding the recent card → 375; forcing `main.min-width:0` → 375 + ellipsis active).
- G5: root `layout.tsx` metadata is title+description only; `NEXT_PUBLIC_SITE_URL` is already an env contract (`.env.example`); the 4 app-route layouts already export `metadata.title` (canonical can join them); Next.js derives og:title from the title template and og:url from canonical + metadataBase.
- G6/G7: raw buttons at app-sidebar.tsx:196-204 and submitticket/page.tsx:324-330; no existing pins.
- The mobile-navigation spec's geometry assertions (288px sheet etc.) don't touch the overlay color — safe.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `bg-red-50/70` renders as `color-mix()`/`oklab(… / 0.7)` in v4 — brittle color pins | Assert the class attribute + representation-stable computed values (radius 12px, padding 16px); accept any alpha-0.7 background representation |
| `min-w-0` on main changes desktop layout | Main is `flex-1` next to the 256px sidebar — `min-width: 0` only relaxes the automatic minimum (no desktop overflow exists; verified at 1024/1920 after the fix) |
| Overlay /80 makes the sheet feel "darker than before" | It IS the reference's measured value — parity over familiarity; E2E pins it |
| Canonical URLs wrong under the E2E server (port 3100) | `metadataBase` from `NEXT_PUBLIC_SITE_URL` (default localhost:3000); assertions check presence + path shape, not the origin |
| The 375px overflow test flakes on slow content load | Assert after `networkidle` + a settle timeout; the recent list must be rendered (wait for the first row) |

## 5. Session-8 process lessons (for the next agent)

1. **Run the gate AFTER the last file lands, not after the last feature.** The session-7 lint break was a post-gate cleanup script committed without a re-run — CI on main went red for a fully-green codebase.
2. **Probe the head, not just the body.** Six sessions of pixel-perfect body work never noticed the reference ships a full OG/Twitter/canonical/PWA meta set — a one-line `querySelectorAll('head meta')` enumerates the contract.
3. **The reference never toasts** — a whole UI subsystem (their Radix toaster) sits idle in the flows we cloned; observing the ABSENCE of a behavior is also parity data (and explains why their viewport defect never fires for their users, only for their mobile menu).
4. **Horizontal overflow needs data-controlled probes.** The 516-vs-451 min-content difference was the SEED CORPUS, not the structure — the same ticket title produced byte-identical scrollWidths on both sites. Bisect by hiding sections, then verify with equal data before calling it a gap.
5. **A `data-slot` prop can be overridden by call sites** (our mobile sidebar renders `data-slot="sidebar"`, not `sheet-content`) — enumerate the actual DOM before trusting component-file defaults for probe selectors.
6. **Check the viewport AFTER every tab switch** — a leftover 375px emulation made a desktop toast viewport read as "top-anchored"; `matchMedia('(min-width: 40rem)')` in the probe output exposes it immediately.
