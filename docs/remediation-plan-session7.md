# ServiceDesk — Session 7 Remediation Plan

**Date:** 2026-10-09
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 7 follows the session-6 remediation (9 gaps incl. the radius-scale trap, focus-state matrix, and double-emoji bug; commit `fca7030`, log update `1a1f040`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live geometry measurements via agent-browser + Playwright hover-capable probes (per `skills/clone-app-pat-pro`). New probe surfaces this session: **accent tokens** (`--accent`/`--accent-foreground` — never measured; they drive the select-option highlight, ghost/outline hover text, and the Skeleton), **hover states under a hover-capable device** (agent-browser's browser reports `hover: none`, which silently disables every Tailwind v4 `hover:` rule via its `@media (hover:hover)` guard — Playwright's Desktop Chrome reports `hover: hover`, so hovers were re-verified there), **document titles + favicon** (never probed), **fetch-failure resilience** (never exercised), and **empty-state visuals** (mytickets search-empty, dashboard recent-empty).

**Baseline at session start (all green):** lint ✓ typecheck ✓ 54 unit ✓ build ✓ 107/107 E2E ✓ smoke 11/11 ✓ — working tree clean at `1a1f040` (session-6 code + session-7 briefing doc).

---

## 1. Findings Inventory

### A. Headline finding: the accent tokens were never measured — every "highlight" surface renders cyan where the reference renders gray + near-black

Our `:root` carries `--accent: #ecfeff` (cyan-50) and `--accent-foreground: #0e7490` (cyan-700) — a session-1 theme choice, never verified against the reference. The reference's `:root` (live-measured): `--accent: hsl(0 0% 96.1%)` = **#f5f5f5** (light gray) and `--accent-foreground: hsl(0 0% 9%)` = **#171717** (near-black) — the stock shadcn light accent pair. Verified surfaces (paired live measurements):

| Surface | Reference (computed) | Clone (computed) |
|---|---|---|
| Select option highlight (first option, dropdown open) | bg `rgb(245,245,245)` + text `rgb(23,23,23)` | bg `rgb(236,254,255)` (cyan-50) + text `rgb(14,116,144)` (cyan-700) |
| CTA "View All Tickets" hover text (hover-capable device, Playwright) | `rgb(23,23,23)` | `rgb(14,116,144)` |
| Ghost back-button hover text | near-black | `rgb(14,116,144)` |
| Skeleton (`bg-accent` at rest — every loading state) | (token) `#f5f5f5` | `#ecfeff` cyan-tinted |

The option-highlight is keyboard/mouse-visible on EVERY dropdown interaction; the hover text on every ghost/outline hover. Single fix: flip the two `:root` tokens (the `.dark` block keeps its own values — dark mode is our superset, unused by the reference).

### B. Reference drift: their `rounded-sm` now computes 4px (was 2px at session 6)

Re-measured live this session: the reference's `SelectItem` still carries class `rounded-sm`, but it now computes **4px** (v4 semantics: v3's `rounded` (4px) became v4's `rounded-sm`; v3's `rounded-sm` (2px) became v4's `rounded-xs`). At session 6 the same element measured 2px — the reference's build has drifted (consistent with two other observed drifts: their active-nav no longer sets `data-active="true"` but hardcodes the gradient classes — visually identical; and they now set per-route document titles). All their OTHER radius classes still compute the session-6 values (rounded-md 6px, rounded-lg 8px, rounded-xl 12px — identical on the v3 and v4 scales). **rounded-sm is the only class where the two scales differ.** Our `--radius-sm: 0.125rem` (2px) pin must be superseded to `0.25rem` (4px). Scope is safe: `rounded-sm` has exactly ONE call site in our codebase (the SelectItem, matching the reference's own usage).

### C. Gap list (final)

| ID | Severity | File(s) | Gap | Fix |
|---|---|---|---|---|
| G1 | **HIGH** | `src/app/globals.css` | The accent tokens (§A): every select-option highlight renders cyan-50/cyan-700 instead of the reference's gray #f5f5f5 / near-black #171717; ghost/outline hover text renders cyan-700 instead of near-black; Skeleton renders cyan-tinted | `--accent: #f5f5f5`, `--accent-foreground: #171717` (the `.dark` block untouched — our superset) |
| G2 | **HIGH** | `src/app/globals.css` | The option-radius drift (§B): our `--radius-sm: 0.125rem` renders the select option at 2px; the reference now computes 4px (class `rounded-sm` on both sites) | `--radius-sm: 0.25rem`; supersede the session-6 E2E pin (2px → 4px); update the AGENTS radius-scale note |
| G3 | **HIGH** | `src/app/(app)/dashboard/page.tsx` | **Fetch-failure resilience**: when `/api/stats` or `/api/tickets` returns non-ok, the page hangs in skeleton/"…" FOREVER (verified live: one transient 401 left the dashboard skeletoned; the reference renders zeros — its own silent failure). No error state, no retry | `loadFailed` state when either fetch is non-ok → compact error panel ("Could not load dashboard data" + Retry button, the empty-state visual language); retry re-runs the effect. Superset — invisible in normal operation |
| G4 | MED | `src/app/(app)/mytickets/page.tsx` | Fetch failure silently shows the EMPTY state ("No tickets found") — misleading (the user has tickets; the fetch failed) | Same error+retry pattern; distinguish error (any non-ok/abort ≠ user's emptiness) from a genuine empty list |
| G5 | MED | `src/app/(app)/mytickets/page.tsx` | Empty-state visuals (measured from the reference's search-no-match state): card `rounded-xl border bg-card text-card-foreground p-12 text-center border-none shadow-xl` (ours: `bg-white rounded-2xl border border-slate-200/60 shadow-lg`); icon circle `w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200` + **FileText** `w-10 h-10 text-slate-400` (ours: `w-16 h-16 bg-slate-100` + FileSearch `w-8 h-8 text-slate-300`); h3 `text-xl font-semibold text-slate-900 mb-2` (ours: 16px slate-700 mb-1); p `text-slate-500` 16px (ours: `text-sm text-slate-400`) | Align every element to the measured reference markup. KEEP our distinct filtered-message superset (the reference confusingly shows "You haven't submitted any tickets yet." even for a no-match search; ours says "No tickets match your filters / Try adjusting the search or filters.") |
| G6 | LOW | `src/app/(app)/dashboard/page.tsx` | Dashboard recent-empty micro-gaps: icon `text-slate-300` → reference `text-slate-400`; "No tickets yet" `text-slate-600` → reference `text-slate-500`; wrapper `text-center py-12` → reference `p-12 text-center` (48px horizontal padding too) | Three class flips (the circle, icon size, and sub-line already match) |
| G7 | MED | `src/app/icon.png` (new) | **No favicon**: `/favicon.ico` → 404, no `<link rel=icon>` — the reference serves one (their logo). Production-readiness + parity gap | Copy `public/logo.png` (fetched from the reference app in session 2) → `src/app/icon.png`; Next.js generates the link tag + route |
| G8 | MED | per-route `layout.tsx` (new) | **Static document title everywhere** ("ServiceDesk | IT Support Portal"); the reference sets per-route titles (live-measured: `/mytickets` → "Mytickets \| ServiceDesk", `/submitticket` → "Submitticket \| ServiceDesk", `/ticketdetails` → "Ticketdetails \| ServiceDesk", `/dashboard` + `/login` → "ServiceDesk"). Browser-tab/history/bookmark UX gap | Per-route `layout.tsx` metadata exports with proper-cased names (superset over the reference's concatenated route names): "Dashboard \| ServiceDesk", "Submit Ticket \| ServiceDesk", "My Tickets \| ServiceDesk", "Ticket Details \| ServiceDesk"; auth pages keep the default. Layouts are server components — the client-island pages are unaffected |
| G9 | — | docs | **Tailwind v4 hover media-guard**: v4 wraps every `hover:` variant in `@media (hover:hover)`; the reference (v3-style build, unguarded `:hover`) applies hover styles on touch devices too (sticky hover after tap). On hover-capable devices both sites are identical (verified: CTA hover bg cyan-50 + border cyan-500 both sites). Keeping the v4 guard is the modern, correct behavior — an intentional, documented divergence (like the lab() color pipeline) | Document in AGENTS.md + this plan; hover E2E pins run under Playwright's hover-capable Desktop Chrome |
| G10 | — | docs | **Reference drift ledger** (session 7): (a) active-nav mechanism — `data-active` no longer set, gradient hardcoded (visual identical); (b) per-route titles added; (c) `rounded-sm` 2px→4px (G2). The reference is a moving target; re-measure before "fixing" anything that looks newly different | Documented here + in AGENTS.md reference section |

### D. Verified NON-gaps (re-checked this session, no action)

- **Hover states under hover-capable devices** (Playwright, `hover:hover` ✓): CTA hover bg = cyan-50 (`lab(98.33 -5.97 -2.62)`), border = cyan-500, both matching the reference's computed values (only the TEXT color was wrong — G1).
- **Back-button hover bg** = slate-100 both sites (the call-site `hover:bg-slate-100` wins via tw-merge; only the text color was wrong — G1).
- **Typography scale**: h1 36px/40px/-0.9px, sidebar brand h2 18px/28px/-0.45px, recent-row h3 16px/24px — identical computed values on both sites (v3/v4 line-heights match on the type scale).
- **Truncation contracts**: mytickets card title wraps (no clamp), description `line-clamp-2`; dashboard recent-row title `truncate` (ellipsis) + description `line-clamp-1` — identical classes AND computed behavior on both sites (verified with a live-created 115-char ticket).
- **Sidebar collapse breakpoint**: visible at 768px, hidden at 767px — exact parity on both sites (the `md:` boundary).
- **Mobile navigation** (standing priority, both sites): reference sheet geometry 288px/20px icons/12px gap; clone identical + weight 600; trigger hit-tests to BUTTON (the reference's own toast-viewport block remains their defect, deliberately not copied); Escape close ✓, overlay close via real pointer ✓, nav-tap navigates + auto-closes ✓.
- **Dashboard empty-recent text**: "No tickets yet" / "Submit your first ticket to get started" — exact text match (visual deltas = G6).
- **Drag-and-drop upload**: `onDragOver`/`onDrop` handlers present on the dropzone wrapper (superset; the reference has no attachments at all).
- **Submit button loading state**: disables + "Submitting…" (superset feedback).
- **Nav active-state rendering**: gradient + white on the active route — visually identical on both sites despite the reference's mechanism change (G10a).

### E. Intentional divergences (documented, do NOT "fix")

- Display name = account name (reference shows the email local-part); asChild anchors; lab() gradient/color pipeline; the v4 hover media-guard (G9); loading skeletons during fetch (the reference renders zeros immediately — modern loading UX, superset); distinct filtered-empty message (G5 keeps it); dark-mode block (our superset, reference has none); error+retry states (G3/G4 — the reference has no error UI at all).

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first**: 10 E2E tests written (9 session-7 + the session-6 option-radius pin superseded in place to 4px) — all verified RED against the pre-fix build (the radius supersede included). One test hardened during the cycle: the CTA-hover test now waits for the recent list to settle + the 300ms rise-in animation (the async fetch shifts the CTA after an early hover — batch runs failed while isolated runs passed).
2. ✅ **G1** globals.css accent tokens → #f5f5f5/#171717 (with the rationale comment).
3. ✅ **G2** `--radius-sm: 0.25rem` + session-6 pin superseded in place + AGENTS/CLAUDE notes updated.
4. ✅ **G3/G4** error+retry states on dashboard + mytickets (`loadFailed`/`error` + `reloadKey`; the panel replaces the stat cards + recent list / the ticket grid, not the header/filters).
5. ✅ **G5/G6** empty-state alignment (mytickets reference markup + the dashboard recent-empty flips: icon slate-400, label slate-500, wrapper p-12).
6. ✅ **G7** `src/app/icon.png` (Next.js generates `<link rel=icon>` + the `/icon.png` route — verified 200 + link present).
7. ✅ **G8** per-route `layout.tsx` metadata ×4 (the root layout's `%s | ServiceDesk` template appends the suffix — the first iteration double-suffixed and was caught by the red test).
8. ✅ **Full gate:** lint ✓ typecheck ✓ 54 unit ✓ build ✓ **116/116 E2E** ✓ smoke 11/11 ✓.
9. ✅ **Live paired re-verification** (production standalone + the live reference): option highlight bg `rgb(245,245,245)` + text `rgb(23,23,23)` + radius 4px = reference exactly; per-route titles + favicon verified; hover verification under Playwright (hover:hover): CTA hover = cyan-50 bg + cyan-500 border + **near-black text** (= reference; was cyan-700), back-button hover = slate-100 bg + near-black text (= reference).
10. ✅ **VLM composite sweep** (7 side-by-side composites, `compare-s7/`): EVERY significant claim refuted by computed/pixel verification — login card 448px both sites (max-w-md); the reference's submit form HAS the 2-col grid (`md:grid-cols-2 gap-6` — VLM misread); the reference's priority trigger IS pre-filled "Medium - Normal" blue; the Report-button gradient endpoints identical (lab() representation); quick-stat badge colors identical (amber-500/blue-500/slate-600 in lab()); the Performance card clock icon present (64px tile, verified in DOM); both mobile headers white (pixel-sampled); the active-nav difference = the documented "/"-root quirk; the "Edit with Base44" FAB = the REFERENCE's own badge (VLM confused left/right). Data-driven claims: the long-title test ticket (deleted; screenshots 04/05 recaptured), the documented sort/scope superset, display names.
11. ✅ **Refreshed `docs/screenshots/`** (7 shots; 04/05 recaptured after deleting the session-7 probe ticket from the dev DB).
12. ✅ Docs updated: this plan + README + AGENTS (session-7 contracts + radius supersede + reference ledger) + CLAUDE (accent + hover-guard + radius rules, counts) + PAD (known-issues row) + SKILL v2.5.0 (lessons 23–26) + session_7.md retrospective + worklog.
13. Commit + push via `docs/ssh_git_wrapper_v3.py` (main only).

### Original plan (as written pre-execution)

1. **Red tests first** (E2E, `tests/e2e/visual-parity.spec.ts` session-7 block + one dashboard/mytickets resilience block):
   - select-option highlight colors (bg #f5f5f5, text #171717 — literal-hex tokens render rgb())
   - select-option radius 4px (supersedes session-6's 2px pin in place)
   - CTA hover text #171717 (hover-capable Playwright, both color representations)
   - back-button hover text #171717
   - mytickets empty-state structure (search no-match → card classes, w-20 gradient circle, FileText w-10 text-slate-400, h3 text-xl slate-900 mb-2, p text-slate-500)
   - dashboard recent-empty (route-mocked empty tickets list): icon slate-400, label slate-500, wrapper p-12
   - dashboard error state (route 500 on stats+tickets): error panel + Retry; unroute → retry → data renders
   - mytickets error state (route 500): error panel + Retry (NOT the empty state)
   - favicon: `<link rel=icon>` present + `/icon.png` 200
   - per-page titles on all 4 app routes
2. **G1** globals.css accent tokens → gray/near-black (option-highlight + hover-text + skeleton tests green)
3. **G2** `--radius-sm: 0.25rem` + supersede the session-6 pin + AGENTS note
4. **G3/G4** error+retry states on dashboard + mytickets
5. **G5/G6** empty-state alignment (mytickets + dashboard)
6. **G7** `src/app/icon.png`
7. **G8** per-route `layout.tsx` metadata
8. Full gate: lint → typecheck → 54 unit → build → E2E (107 + ~12 new) → smoke
9. Live paired re-verification (agent-browser, both sites) + VLM composite sweep
10. Refresh `docs/screenshots/`; update README/AGENTS/CLAUDE/PAD/SKILL + worklogs; commit + push via `docs/ssh_git_wrapper_v3.py` (main only)

## 3. Validation of this plan against the codebase

- G1: `--accent`/`--accent-foreground` are defined once in `:root` (globals.css:85-86); usage census: `select.tsx` SelectItem (focus:), `button.tsx` ghost+outline (hover:), `skeleton.tsx` (bg-accent), `badge.tsx` ([a&]:hover:) — no page-level usage (grep-verified); the sidebar uses the separate `--sidebar-accent` tokens (measured from the reference, untouched).
- G2: `rounded-sm` has exactly one call site (`select.tsx:105`); the token flip affects nothing else; the session-6 E2E pin lives at visual-parity.spec.ts:843-848 (supersede in place).
- G3: the dashboard fetch effect (page.tsx:68-85) maps non-ok → null → state stays null forever; the fix adds a `loadFailed` flag set on non-ok (both fetches) or catch, reset on retry; the error panel replaces the stat-card values + recent section (same visual language as the empty state).
- G4: mytickets maps fetch error → `setTickets([])` (page.tsx:42-43) — the empty state renders; the fix adds `setError` on non-ok and renders the error panel instead.
- G5/G6: the reference markup was captured live this session (see §1.C); our empty-state JSX is a static block in each page.
- G7: `public/logo.png` exists (fetched from the reference app, session 2); Next 16 App Router serves `src/app/icon.png` as the favicon automatically.
- G8: all `(app)` pages are `"use client"` (cannot export metadata) — per-route `layout.tsx` files are the documented Next.js pattern; the root layout keeps the default title for auth pages.
- G9/G10: documentation-only.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Accent flip changes the Skeleton + every ghost hover at once | That IS the fix (all measured against the reference's own tokens); paired live re-verification per surface |
| `--radius-sm` flip collides with future `rounded-sm` usage | Single call site today; the AGENTS note documents the v3↔v4 sm-only difference |
| Error-state tests flake on route interception timing | `page.route` interception is deterministic; assertions auto-retry (`toHaveText`/`toBeVisible`); the retry path unroutes first |
| Per-route layouts break the route-group guard | Layouts are passthrough (render `children` only); the `(app)` layout guard stays the single guard (AGENTS invariant) |
| Signup/login rate limiter affected | No new logins: resilience tests use `page.route` mocks on the shared storageState session |

## 5. Session-7 process lessons (recorded for the next agent)

1. **The agent-browser browser reports `hover: none`** — every Tailwind v4 `hover:` rule is silently inert under it (the `@media (hover:hover)` guard). Hover probes MUST run under a hover-capable context (Playwright Desktop Chrome, or a real device) — agent-browser hover reads will show at-rest values and look like bugs that don't exist.
2. **Probe the TOKEN LAYER, not just the utilities that consume it.** The accent tokens drove three visible surface families (option highlight, hover text, skeleton) and had never been measured in six sessions because no probe ever asked "what is the reference's `--accent`?" — a one-line `getPropertyValue` on `:root`.
3. **The reference DRIFTS.** Three changes observed this session (data-active mechanism, per-route titles, rounded-sm 2→4px). Re-measure before accepting any previously-pinned value as still-current — and re-measure before "fixing" something that suddenly looks different (the active-nav mechanism change would have looked like a parity break if judged by the attribute instead of the computed gradient).
4. **A class-level pin is a snapshot, not a contract.** Session-6's option-radius pin (2px) encoded a fact about the reference that has since changed; computed-value pins with a documented measurement date age better than class-name pins.
5. **Exercise the FAILURE path, not just the happy path.** One transient 401 during live probing exposed that the dashboard hangs in skeleton forever — six sessions of E2E never tested a failing fetch. Resilience is part of "production-ready superset."
6. **`querySelectorAll('main button')` misses `asChild` anchors** — the clone renders CTAs/back buttons as `<a>` (the reference uses `<button onClick>`). Probes must select `main a, main button` on our side.
