# ServiceDesk — Session 4 Remediation Plan

**Date:** 2026-10-09
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Includes the largest single parity fix of the project (the sidebar nav layout, present since session 1).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live geometry measurements via agent-browser (per `skills/clone-app-pat-pro`). Reference DOM dumps: `/tmp/s4-ref/` (dashboard, sidebar, mytickets, submitticket, ticketdetails, login, notfound); clone dumps: `/tmp/s4-clone/`. VLM used only as a lead generator — every claim verified against DOM/computed styles (9 claims checked, 5 refuted). Side-by-side composites: `compare-s4/`.

**Baseline at session start (all green):** lint ✓ typecheck ✓ 53 unit ✓ build ✓ 57/57 E2E ✓ smoke 11/11 ✓ — working tree clean at `c02276c`.

---

## 1. Findings Inventory

### A. Reference measurements (new this session)

| Measurement | Value | Source |
|---|---|---|
| Nav item structure | `<a class="…base… flex items-center gap-3 px-4 py-3 justify-between w-full">` wrapping **one** child: `<div class="flex items-center gap-3"><svg class="w-5 h-5"/><span class="font-semibold">Label</span></div>` — the wrapper makes `justify-between` a no-op (single child) and shields the svg from the base's `[&>svg]:size-4` direct-child selector → **20px icons, 12px icon-to-label gap** | ref sidebar DOM + live geometry (iconToTextGap 12px, icon 20px, label weight 600) |
| Clone nav structure | icon + label are DIRECT children of the anchor → `justify-between` pushes the label to the right edge (**132px gap**), and `[&>svg]:size-4` shrinks icons to **16px**; labels weight 400/500 | clone DOM + live geometry + VLM-confirmed (both sites) |
| Active nav item hover | `hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700` — present on BOTH active and inactive items (active hovers to the light gradient) | ref sidebar DOM (active + inactive anchors) |
| Badge base (default variant) | `… shadow hover:bg-primary/80` — every status/priority badge on the reference carries a drop shadow + primary-tint hover | ref dashboard/mytickets/ticketdetails DOM |
| Badge padding per surface | dashboard recent rows: **`px-2.5 py-0.5`** (base, compact) · mytickets cards: `px-3 py-1` · detail status: `px-3 py-1 text-sm font-bold` · **detail priority: `px-2.5 py-0.5` (compact)** | ref DOM per page |
| Badge colors | quick-stat value badges Open=amber-500 / In Progress=blue-500 / Total=slate-600 (+ `hover:bg-primary/80`) — clone already matches ✓ | ref sidebar DOM |
| Submit-form labels | `text-sm … text-slate-700 font-semibold` with the asterisk as **plain text** (`Issue Title *`) — NOT a red span | ref submitticket DOM |
| Category/priority grid | `grid md:grid-cols-2 gap-6` (clone: `grid-cols-1 sm:grid-cols-2 gap-4`) | ref submitticket DOM |
| Non-login form controls | inputs/selects/textareas carry `shadow-sm border-slate-300 focus:border-cyan-500 focus:ring-cyan-500` (mytickets search + filters, submit title + selects, comment textarea); mytickets search/selects are `bg-transparent` (clone: `bg-white`) | ref DOM per page |
| Login inputs | custom: `pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400` — NO shadow-sm (clone already matches ✓) | ref login DOM |
| Back buttons | **ghost variant** — `hover:text-accent-foreground h-9 px-4 py-2 mb-4 hover:bg-slate-100`, NO border/bg at rest (clone: outline variant — bordered) | ref submitticket + ticketdetails DOM |
| Mobile SidebarTrigger | `hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200` (clone: `rounded-md hover:bg-accent`) | ref dashboard DOM (mobile header) |
| Google logo (login) | wrapped in `div.transition-transform.duration-200.-ml-4` (logo shifted 16px left); clone renders the svg bare | ref login DOM |
| Detail info labels | `text-xs font-semibold text-slate-500 uppercase tracking-wider` — **`tracking-wider`, not `tracking-wide`** (the live reference today renders `wider` on all 3 labels; session 3's `wide` measurement is superseded) | ref ticketdetails DOM (3 labels) |
| 404 page | designed: `min-h-screen flex items-center justify-center p-6 bg-slate-50` > `max-w-md` > `text-7xl font-light text-slate-300` "404" + `h-0.5 w-16 bg-slate-200` divider + `text-2xl font-medium` "Page Not Found" + message `The page "X" could not be found in this application.` + "Go Home" outline button | ref `/signup` (404) DOM |
| Reference dead-ends | `/signup` → 404 page; `/forgotpassword` → empty main — the reference has NEITHER working signup NOR forgot-password (clone's flows are pure superset) | live navigation |
| Reference mobile nav hazard | the reference's toast viewport (`fixed top-0 z-[100] w-full … p-4`, computed `pointer-events: auto`, 390×32) sits over the mobile header — `elementFromPoint(trigger center)` returns the toast container, not the button (the trigger is partially blocked). The clone's Radix viewport region carries inline `pointer-events: none` → trigger fully clickable | live elementFromPoint on both sites |
| Submit-card corners | reference card has `overflow: visible` → its gradient header pokes square into the 12px rounded-corner zone; clone clips with `overflow-hidden`. Measured delta ≤ 7/255 RGB units inside a 12×12px corner — imperceptible | pixel analysis both sites |

### B. VLM screenshot-claims ledger (computed styles = truth)

| Claim | Verdict |
|---|---|
| Clone nav labels pushed far from icons (also mobile menu) | **TRUE** — geometry-verified (132px vs 12px) → A1 |
| Reference "Back" is a plain text link, clone is a bordered button | **TRUE** — ref = ghost variant → D1 |
| Clone stat cards tinted, reference plain | FALSE — identical `bg-card` + identical deco circles both sides |
| Clone "Report New Issue" button brighter/more solid | FALSE — identical gradient classes |
| Clone title input significantly narrower | FALSE — 704px on both (ratio difference was the form element, not the input) |
| Clone login card narrower / logo smaller / title stacked / labels centered / input icons missing | FALSE ×5 — card `max-w-md`, logo `h-20 w-20 ring-4`, h1 identical, labels left-aligned both, both inputs `pl-10` with icons |
| Clone mytickets filter bar REPLACED status/priority dropdowns with sort/scope | FALSE — clone has All Status + All Priorities + search (superset adds sort/scope) |
| Clone mobile menu icons stacked above text | FALSE (misread of the justify-between gap) — same A1 root cause |

### C. Parity gaps to fix

| ID | Severity | File(s) | Gap | Fix |
|---|---|---|---|---|
| A1 | **HIGH** | `src/components/app-sidebar.tsx` | Nav icon+label are direct children of the anchor → `justify-between` pushes the label to the right edge (132px gap); `[&>svg]:size-4` shrinks icons to 16px (ref: 20px). Affects desktop sidebar AND mobile sheet — every page, since session 1 | Wrap icon+label in `<span className="flex items-center gap-3">` inside the Link (single child → justify-between no-op; the direct-child svg selector no longer matches → icon stays `w-5 h-5`) |
| A2 | **HIGH** | `src/components/app-sidebar.tsx` | Nav labels weight 400/500 (ref: **600 semibold** on the label span) | `<span className="font-semibold">{title}</span>` |
| A3 | MED | `src/components/app-sidebar.tsx` | Active nav item hovers to `sidebar-accent` (ref: light cyan-blue gradient + `hover:text-cyan-700`) | Append `hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700!` to the active branch (the `!` needed because `text-white!` is important) |
| B1 | MED | `src/components/ticket-bits.tsx` | Status/priority badges lack `shadow` + `hover:bg-primary/80` (all surfaces) | Add both to STATUS_BADGE_CLASSES + PRIORITY_BADGE_CLASSES (NOT the outline CategoryBadge — ref outline has neither) |
| B2 | MED | `ticket-bits.tsx` (RecentTicketRow) | Dashboard recent-row badges use `px-3 py-1` (ref: compact `px-2.5 py-0.5`) | `compact` prop on the badge atoms → padding swap |
| B3 | MED | `src/app/(app)/ticketdetails/page.tsx` | Detail priority badge `px-3 py-1` (ref: compact) | Pass `compact` to the detail PriorityBadge (detail StatusBadge keeps px-3 py-1 + `text-sm! font-bold` ✓) |
| C1 | MED | `src/app/(app)/submitticket/page.tsx` | Labels: default color + `font-medium` + red `<span class="text-red-500">*</span>` (ref: `text-slate-700 font-semibold`, asterisk is plain text) | `className="text-slate-700 font-semibold"` on all 5 labels + inline text ` *` (single text node — avoids the Label base's flex gap) |
| C2 | LOW | `src/app/(app)/submitticket/page.tsx` | Grid `grid-cols-1 sm:grid-cols-2 gap-4` (ref: `md:grid-cols-2 gap-6`) | `grid md:grid-cols-2 gap-6` |
| C3 | MED | `submitticket/page.tsx`, `mytickets/page.tsx`, `ticketdetails/page.tsx` | Submit title input + category/priority selects lack `shadow-sm border-slate-300 focus:border-cyan-500 focus:ring-cyan-500`; mytickets search + selects lack `shadow-sm` (+ `bg-white` vs ref `bg-transparent`); comment textarea lacks `shadow-sm` | Add the reference classes per control (login inputs untouched — they already match their custom reference contract) |
| D1 | MED | `submitticket/page.tsx`, `ticketdetails/page.tsx` | Back buttons `variant="outline"` — bordered (ref: **ghost**, borderless) | `variant="ghost"` (keep `h-9 px-4 py-2 mb-4 hover:bg-slate-100` custom classes — the E2E pin `hover:bg-slate-100` stays satisfied) |
| D2 | LOW | `src/components/app-sidebar-chrome.tsx` | Mobile SidebarTrigger `rounded-md hover:bg-accent` (ref: `rounded-lg hover:bg-slate-100 p-2 transition-colors duration-200`) | `className` props on `<SidebarTrigger />` (tw-merge resolves the hover/radius conflicts) |
| E1 | LOW | `src/app/login/page.tsx` | Google logo rendered bare (ref: wrapped in `transition-transform duration-200 -ml-4`) | Wrap the svg in the reference div |
| F1 | MED | `src/app/not-found.tsx` (new) | No designed 404 (ref has one; Next default is plain) | Root `not-found.tsx` replicating the reference 404 (404 / divider / Page Not Found / dynamic path message / Go Home → `/dashboard`) |
| F2 | MED | `src/app/(app)/ticketdetails/page.tsx` + `tests/e2e/visual-parity.spec.ts` | Info labels `tracking-wide` (ref TODAY: `tracking-wider` — session-3 measurement superseded) | Revert to `tracking-wider`; flip the E2E assertion |

### D. Reference-site defects deliberately NOT copied

- **Toast viewport blocks the mobile trigger** (computed `pointer-events: auto` on a full-width 32px band over the header). Our Radix viewport region has inline `pointer-events: none` — correct by construction. Do NOT "fix" ours to match.
- **No nav highlight at `/`** on the reference (their isActive misses the root) — our `/` → `/dashboard` redirect stays (E2E-pinned).
- **Gradient header square corners** on the reference submit card (`overflow: visible`) — imperceptible (≤7/255 RGB in the 12px corner zone); our clipped rendering stays.

### E. Intentional divergences (documented, do NOT "fix")

- **Display name** = account name (greeting, sidebar footer, comment authors); the reference shows the email local-part because base44 auth has NO name concept (its `/signup` is a 404, `/forgotpassword` is empty). Our signup collects names — the display follows the account.
- Superset affordances: sort/scope controls, comment counts, Update Status panel, attachments, signup/forgot-password, health endpoint, mobile sheet auto-close on navigate.
- `asChild` anchors instead of the reference's `<a><button>` nesting (identical computed styles).
- Motion-wrapper divs: reference wraps items in framer-motion `<div style="opacity…">`; we apply `animate-rise-in` on the element itself (identical measured animation).
- Button/Input/Select **base-class generations** (old vs new shadcn: `transition-colors` vs `transition-all`, focus-ring styles) — invisible at rest; re-vendoring every primitive for zero visual gain is not worth the churn.

---

## 2. Execution Plan (TDD)

Phase order — red tests first, then implementation, then the full gate:

1. **Red E2E parity tests** (extend `tests/e2e/visual-parity.spec.ts` with a "session 4" block):
   - nav structure: every sidebar nav link renders the inner `flex items-center gap-3` wrapper; label span carries `font-semibold`; icon svg carries `w-5`; live geometry — label.x − (icon.x + icon.width) ≤ 16px; computed icon width = 20px
   - active nav item carries the hover-gradient classes
   - badges: mytickets status badge carries `shadow`; dashboard recent-row badges carry `shadow` + `px-2.5` (not `px-3`); detail priority badge `px-2.5`
   - submit labels: first label `text-slate-700 font-semibold`; no `text-red-500` span inside any label
   - submit grid: `md:grid-cols-2` + `gap-6`
   - submit title input: `border-slate-300` + `focus:border-cyan-500` + `shadow-sm`; category select trigger `shadow-sm`
   - mytickets search: `shadow-sm` + `bg-transparent` (not bg-white)
   - comment textarea: `shadow-sm`
   - back buttons: computed `border-top-width: 0px` (ghost — no border at rest)
   - mobile trigger: `rounded-lg` + `hover:bg-slate-100`
   - google logo wrapper: `-ml-4` div present
   - 404: `/page-that-does-not-exist` renders "404", "Page Not Found", and a "Go Home" control
   - flip the session-3 tracking assertion: `tracking-wider`, not `tracking-wide`
2. **Implement A1–A3** (app-sidebar.tsx) → run mobile-navigation + visual-parity specs
3. **Implement B1–B3** (ticket-bits.tsx + ticketdetails) → visual-parity
4. **Implement C1–C3 + D1 + D2 + E1** (submitticket, mytickets, ticketdetails, chrome, login) → visual-parity + auth specs
5. **Implement F1** (not-found.tsx) + **F2** (tracking revert)
6. **Full verification gate:** `lint → typecheck → test → build → test:e2e → smoke`
7. **Live re-verification** via agent-browser: nav geometry (12px gap, 20px icons, 600 weight) on desktop AND mobile sheet; badge shadow/padding; labels; back buttons; 404; mobile menu re-test (open/overlay/Escape/auto-close); zero console errors on all pages
8. **Refresh `docs/screenshots/`** (7 shots) + new side-by-side composites
9. **Update docs:** README/AGENTS/CLAUDE/PAD deltas + `service-desk_SKILL.md` → v2.2.0 + this plan + worklogs
10. Commit + push via `docs/ssh_git_wrapper_v3.py` (main only)

## 3. Validation of this plan against the codebase

- Every C-item was verified by reading the current source AND the live reference DOM this session (dumps in `/tmp/s4-ref/`, `/tmp/s4-clone/`).
- Existing E2E assertions audited for collision: the back-button pin (`hover:bg-slate-100`, line-level check) survives the ghost change; the quick-stats badge pin (`shadow-md`) is untouched (quick-stat badges keep their classes — only status/priority badges change); the tracking assertion is the ONLY one that must flip; badge-case, animation, and structure pins are unaffected.
- `SidebarMenuButton asChild` merges button classes onto the `Link` — adding an inner wrapper `<span>` keeps the anchor class list byte-identical to the reference (verified against the ref anchor's full class dump).
- The badge atoms' padding currently lives inside the per-status class maps — the refactor moves it to a `compact` prop; call sites: TicketCard (default), RecentTicketRow (compact), ticketdetails StatusBadge (default + `detail`), ticketdetails PriorityBadge (compact).
- Tailwind v4 cautions honored: no plain-utility overrides of variant-styled primitives (the `hover:text-cyan-700!` important is deliberate — `text-white!` wins otherwise); tw-merge resolves `rounded-lg`>`rounded-md` and `hover:bg-slate-100`>`hover:bg-accent` conflicts.
- `not-found.tsx` renders inside the root layout (no app chrome) — matching the reference's 404 content design; the reference renders it inside its SPA shell, which Next's routing model does not reproduce without a catch-all route group (not worth it; documented).
- The label asterisk must be a single text node (the vendored Label base is `flex` with `gap-2` — separate children would get an 8px gap; the reference shows a plain space).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Nav wrapper change breaks the mobile sheet (same component renders both) | The wrapper is inside the link content — sheet structure unchanged; run mobile-navigation spec + live sheet test after A1 |
| `hover:text-cyan-700!` interacts with `text-white!` (both important) | Hover variant only applies on hover — verified against Tailwind v4 variant ordering; E2E pins the resting gradient + white text |
| Badge `shadow` + `hover:bg-primary/80` coexists with the new Badge base's `[a&]:hover:bg-primary/90` | Both apply benignly (hover tint 80 vs 90 inside anchors — imperceptible); refuted risk via computed-style check after B1 |
| Compact badges change pinned geometry tests | No existing test pins badge padding; new tests pin the compact contract |
| Ghost back buttons lose the visible affordance | Reference-faithful (ghost + arrow icon); the E2E pin on `hover:bg-slate-100` still passes |
| 404 page catches routes that should 404 differently (e.g. /api) | `not-found.tsx` only renders for unmatched PAGES; API routes return their own 404 JSON (verified behavior) |
| Reference site data is volatile (DB resets) | All probes use computed styles/structures, never data |
