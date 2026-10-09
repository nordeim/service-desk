# ServiceDesk — Session 2 Remediation Plan

**Date:** 2026-10-09
**Scope:** Visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, test-suite repairs, and re-verification.
**Method:** Ground truth = computed styles + class-attribute DOM diffs extracted from the LIVE reference via agent-browser (per `skills/clone-app-pat-pro`: never trust downscaled screenshot comparisons alone). Reference DOM dumps: `/tmp/ref-*.html`; clone dumps: `/tmp/clone-*.html` (this session).

---

## 1. Findings Inventory

### A. Test-suite defects (blocking the functional gate)

| ID | Severity | File:Line | Defect | Evidence | Fix |
|---|---|---|---|---|---|
| A1 | HIGH | `tests/e2e/tickets.spec.ts:46-47` | `locator.count()` is non-retrying; races the async search fetch — snapshot taken before results render | `Expected: 1, Received: 11` (twice in full-suite runs) | Replace with `await expect(page.locator(...)).toHaveCount(1)` |
| A2 | HIGH | `tests/e2e/tickets.spec.ts:72` | `getByText("Status updated")` strict-mode ambiguity — matches toast title AND Radix aria-live announcer (`Notification Status updated…`) | Strict mode violation, 2 elements | `getByText("Status updated", { exact: true })`; audit all toast-title locators |

### B. Layout chrome parity (all authenticated pages)

| ID | Severity | File | Reference (ground truth) | Clone (current) |
|---|---|---|---|---|
| B1 | MED | `src/app/(app)/layout.tsx` | Outer wrapper `min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-slate-100`; page content wrapped in `flex-1 overflow-auto` div | Outer wrapper has no gradient; page div carries `flex-1 min-h-screen` itself |
| B2 | MED | `src/components/app-sidebar-chrome.tsx` | Mobile header NOT sticky; brand = plain `<h1 class="text-xl font-bold text-slate-900">ServiceDesk</h1>` (no logo tile) | Header has `sticky top-0 z-40`; brand = gradient logo tile + `text-lg tracking-tight` |
| B3 | MED | dashboard/mytickets/submit/detail pages | Page h1 `text-4xl font-bold tracking-tight`; subtitle `text-slate-600 mt-2 text-lg`; header block `mb-8` | h1 `text-3xl`; subtitle `text-slate-500 mt-1` |

### C. Sidebar parity

| ID | Severity | Component | Reference | Clone |
|---|---|---|---|---|
| C1 | HIGH | Quick stats rows | Gradient rows `p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-amber-200/50` (Open), `from-blue-50 to-cyan-50 border-blue-200/50` (In Progress), `from-slate-50 to-gray-50 border-slate-200/50` (Total); label `text-sm font-medium text-slate-700`; value badge `shadow-md`, no tabular-nums/min-w | Flat `bg-amber-50 border-amber-100`; label `text-amber-900` (per-row tint); badge `tabular-nums min-w-8 text-center`, no shadow |
| C2 | LOW | Sidebar footer | `border-t border-slate-200/60` on footer; sign-out icon `w-4 h-4` | No border-t; icon `w-5 h-5` |

### D. Dashboard parity

| ID | Severity | Section | Reference | Clone |
|---|---|---|---|---|
| D1 | MED | Stat cards (4) | `bg-card shadow-lg hover:shadow-xl`; value no `tabular-nums` | `bg-white shadow-xl hover:shadow-2xl`; value has `tabular-nums` |
| D2 | HIGH | Recent tickets list | FLAT rows: body `p-0` > `divide-y divide-slate-100` > `a.block.p-6 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/50`; emoji tile `w-12 h-12`; title `font-semibold … truncate` (no text-lg, no arrow); desc `text-sm line-clamp-1 mb-3`; date `text-xs text-slate-500 font-medium` | Card-per-row via `TicketCard` (border, shadow-lg, arrow icon, `w-14 h-14` tile, `text-lg font-bold` title, `line-clamp-2 mb-4`) |
| D3 | LOW | Recent tickets header | `p-6 border-b border-slate-100` | `p-6 pb-3` |
| D4 | LOW | Performance value | `<p>` tag | `<div>` tag |
| D5 | LOW | View All Tickets CTA | `h-9 px-4 py-2 rounded-md border-slate-300 hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-300` + arrow | `size="lg" rounded-xl px-8` outline |

### E. My Tickets parity

| ID | Severity | Section | Reference | Clone |
|---|---|---|---|---|
| E1 | MED | Container + filter row | `max-w-7xl mx-auto`; header block `mb-8`; filters `mb-6 grid grid-cols-1 md:grid-cols-3 gap-4`; search `pl-10` (icon in `relative` wrapper) | `max-w-5xl`; `flex flex-col sm:flex-row gap-3`; search icon placement differs |
| E2 | LOW | Ticket rows | `grid gap-4` of `TicketCard`-style cards (`w-14 h-14` tile, arrow, `font-bold text-lg`, `line-clamp-2 mb-4`) — **matches clone's TicketCard**; keep | ✓ already correct — only container/header/filters need fixes |

### F. Ticket detail parity

| ID | Severity | Section | Reference | Clone |
|---|---|---|---|---|
| F1 | HIGH | Page layout | `grid lg:grid-cols-3 gap-6`; left `lg:col-span-2 space-y-6`; right `space-y-6`; back button `mb-6` div with `h-9 px-4 py-2 mb-4 hover:bg-slate-100` button style | `flex flex-col lg:flex-row gap-6`; back = link-style anchor |
| F2 | HIGH | Main card | ONE card: gradient header `p-6 border-b border-slate-100 bg-gradient-to-r from-cyan-50/50 to-blue-50/50` holding title `font-semibold tracking-tight text-2xl`, status badge `text-sm font-bold px-3 py-1` (amber-100/800/300), priority badge **with " priority" inside the badge** (blue-100/blue-700), category badge plain; body `p-6 space-y-6` with Description section | Title/badges loose above separate Description card; priority badge without "priority"; status badge text-xs/font-medium |
| F3 | MED | Comments | Comment card with avatar circle `w-8 h-8 from-cyan-400 to-blue-500`; name `text-slate-900`; date `text-slate-500`; body `ml-10 text-slate-700`; form `space-y-3 pt-4 border-t border-slate-200`; textarea `min-h-24 border-slate-300 focus:border-cyan-500`; Add Comment gradient button `ml-auto` | No avatar; `ml-10` missing; text colors slate-600/800; textarea `min-h-16`; form `pt-2` |
| F4 | MED | Ticket Information panel | Labels `text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1`; values `text-sm text-slate-900 font-medium`; rows `p-6 space-y-4`; header `tracking-tight text-sm font-semibold` + `border-b border-slate-100` header | Labels `text-[11px]`; values `text-slate-800 break-words`; rows `px-6 py-4` |
| F5 | MED | Back to Tickets | Button style `hover:bg-slate-100`, inside `mb-6` wrapper | Link style `text-slate-600 hover:text-cyan-600` |

### G. Submit ticket parity

| ID | Severity | Section | Reference | Clone |
|---|---|---|---|---|
| G1 | MED | Form card | `rounded-xl shadow-2xl bg-white` (border-none); header `p-6 border-b border-slate-100 bg-gradient-to-r from-cyan-50/50 to-blue-50/50` with plain icon `flex items-center gap-2` title; body `p-8`; labels `text-sm font-semibold text-slate-700` | `rounded-2xl shadow-xl border-slate-200/60`; header `bg-sky-50 border-sky-100 px-6 py-4` with white icon tile; body padding differs |
| G2 | LOW | Back link + header | Same as F5/B3 pattern | Link style + text-3xl header |

### H. Login parity

| ID | Severity | Section | Reference | Clone |
|---|---|---|---|---|
| H1 | MED | Card shell | `w-full max-w-md`; `relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl`; top bar `h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200`; body `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10` | `max-w-[420px]`; `bg-white rounded-2xl shadow-xl border-slate-200/60 px-8 py-10 pt-14` |
| H2 | MED | Logo | In-card avatar circle `h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white/50 shadow-lg` + blur glow `from-slate-200 to-slate-300 blur-xl opacity-30`, real logo `<img>` | Overlapping dark badge with ticket icon + "SERVICE DESK" caption |
| H3 | MED | Form | h1 `text-2xl sm:text-3xl`; sub `text-slate-500 text-sm sm:text-base font-medium`; Google btn `w-full px-5 py-3.5 rounded-xl border-slate-200 text-[16px]`; OR divider `relative my-6` + `bg-white px-3 text-slate-500 font-medium tracking-wider text-xs uppercase`; inputs `pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 rounded-xl placeholder:text-slate-600`; Sign in `w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 rounded-xl`; footer row `flex flex-col sm:flex-row justify-between` | text sizes/paddings/`bg-slate-900` button present but shell classes differ; OR divider simpler; inputs `h-11 pl-10` white bg |
| H4 | LOW | Page background | `bg-gradient-to-br from-slate-50 to-slate-100 p-4` | `from-slate-100 via-slate-50 to-cyan-50` |

### I. Housekeeping

| ID | Severity | Item |
|---|---|---|
| I1 | LOW | Remove empty untracked dirs `src/app/mytickets/`, `src/app/submitticket/`, `src/app/ticketdetails/` (route conflicts in the making; not in git) |
| I2 | LOW | `.env.example` re-verify (already de-orbitalized) — confirm it matches `.env` contract |

### Superset behaviors PRESERVED (do not "fix" these)

- Mobile sheet **auto-close on navigate** (reference keeps the sheet open — our behavior is the intended superset, E2E-pinned).
- Owner status control, attachments, signup, forgot-password, search/sort/scope, health endpoint, rate limiting.
- a11y additions (`aria-hidden`, `sr-only` sheet title, focus states) — invisible to visual parity, required by CLAUDE.md standards.
- Sign out via footer; toast system; skeletons.

---

## 2. Execution Plan (TDD)

Phase order — tests first, then code, then gates:

1. **Repair the test suite (A1, A2)** — failing tests fixed; full E2E goes green BEFORE any visual refactor, so later failures are attributable.
2. **Pin new parity contracts (red)** — extend E2E specs:
   - quick stats rows carry gradient backgrounds + `shadow-md` badges (computed-style probe)
   - dashboard recent tickets render flat `divide-y` rows (no per-row card border/shadow; `w-12 h-12` tiles)
   - detail page uses `grid lg:grid-cols-3` with `lg:col-span-2` left column
   - page h1s are `text-4xl`; subtitles `text-lg`
   - mobile header is NOT sticky and shows plain `ServiceDesk` h1
3. **Implement visual fixes (green)** in this order (each = one verifiable change):
   - C1, C2 (sidebar) → re-run sidebar-related E2E
   - B1, B2, B3 (chrome + headers) → re-run mobile-navigation spec
   - D1–D5 (dashboard) → dashboard spec
   - E1 (mytickets filters/container)
   - F1–F5 (detail restructure — biggest change)
   - G1, G2 (submit card)
   - H1–H4 (login restructure)
4. **Housekeeping (I1, I2)**.
5. **Full verification gate**: `lint → typecheck → test (50) → build → test:e2e (28+) → smoke`.
6. **Live re-verification** with agent-browser: re-extract computed styles for every fixed contract; confirm parity.
7. **Refresh `docs/screenshots/`** from the dev server (7+ shots: login, dashboard, submit, mytickets, detail, mobile dashboard, mobile menu open).
8. **Regenerate/update docs**: README/AGENTS/CLAUDE/PAD deltas + `.env.example` audit; create `service-desk_SKILL.md` (via `skills/distill-codebase-skill` + `skills/to-distill-project-into-skill`).
9. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only).

## 3. Validation of this plan against the codebase

Each finding above was verified by reading the current source file AND the live reference DOM in this session:

- A1/A2: reproduced twice in full-suite runs; failure artifacts read from `test-results/*/error-context.md`.
- B–H: reference DOM extracted via agent-browser (`document.querySelector(...).outerHTML` → `/tmp/ref-*.html`), clone DOM likewise (`/tmp/clone-*.html`); class-level structural diff via `scripts/diff-pages.py`.
- VLM screenshot comparison was used only as a lead generator; every VLM claim was then confirmed or refuted against computed styles (e.g. VLM's "reference active nav = light gray" was REFUTED — the reference renders `linear-gradient(to right, rgb(6,182,212), rgb(37,99,235))` with white text, exactly as the clone already does).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Detail-page restructure (F1–F5) breaks owner-status/attachments superset features | Keep superset sections inside the reference-shaped containers; E2E tickets spec covers comment + status flows |
| Removing `tabular-nums`/`sticky` changes pinned E2E expectations | Update specs in the same commit; grep for `tabular`/`sticky` in specs first |
| Reference site data is volatile (their DB reset since session 1) | All parity probes use computed styles/structures, never data |
| Tailwind v4 variant cascade surprises during restyle | Follow AGENTS.md rules: `@theme inline`, literal hex, `!` modifier when overriding variants; re-run mobile-navigation spec after any sidebar/sheet change |
