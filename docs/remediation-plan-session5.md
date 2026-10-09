# ServiceDesk — Session 5 Remediation Plan

**Date:** 2026-10-09
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 5 follows the session-4 remediation (16 gaps incl. the nav-wrapper fix; commit `c0a5a39`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live geometry measurements via agent-browser (per `skills/clone-app-pat-pro`). Reference DOM dumps: `/tmp/s5-ref/`; clone dumps: `/tmp/s5-clone/`. VLM used only as a lead generator — every claim verified against DOM/computed styles (11 claims checked, 8 refuted). Side-by-side composites: `compare-s5/`.

**Baseline at session start (all green):** lint ✓ typecheck ✓ 53 unit ✓ build ✓ 73/73 E2E ✓ smoke 11/11 ✓ — working tree clean at `9c3f446`.

---

## 1. Findings Inventory

### A. Headline finding: icon-bearing buttons rendered 12px horizontal padding (reference: 16px)

The vendored shadcn Button base carried the **new**-generation size variants:

```
default: "h-9 px-4 py-2 has-[>svg]:px-3"   sm: "...px-3 has-[>svg]:px-2.5"   lg: "...px-6 has-[>svg]:px-4"
```

`:has(> svg)` (specificity 0-1-1) beats the plain `px-4` (0-1-0) in the v4 cascade, so **every Button containing a direct-child svg rendered at px-3 (12px)** — while the reference's old-shadcn base is always `px-4` (16px). Live-measured on both sites:

| Control | Reference paddingLeft | Clone (before) |
|---|---|---|
| Back buttons ×2 | 16px (196.9px wide) | 12px (174.6px wide) |
| Report New Issue | 16px | 12px |
| View All Tickets CTA | 16px | 12px |
| Add Comment | 16px | 12px |
| Submit Ticket | 16px | 12px |

Unaffected: Cancel/Sign in/text-only buttons (no direct svg → already px-4); the Google button (svg nested inside the `-ml-4` wrapper div → `:has(> svg)` never matched); mobile trigger + logout (fixed `w-7`/`w-9` sizes); scope buttons (superset, no svg).

### A′. Second finding: the v3→v4 shadow-scale naming trap

Tailwind v4 renamed `shadow-sm`→`shadow-xs` and bare `shadow`→`shadow-sm`. The reference (base44, Tailwind v3 scale) writes `shadow-sm` on form controls, outline buttons, the sign-in button, and the mobile header — it COMPUTES to the light `rgba(0,0,0,0.05) 0px 1px 2px 0px`. Our clone had copied the class NAME onto a v4 build, rendering the heavier two-layer `0 1px 3px/0.1 + 0 1px 2px -1px/0.1`.

Live-measured pairs (reference → clone-before-fix):

| Control | Reference computed | Clone computed (before) |
|---|---|---|
| mytickets search input | `rgba(0,0,0,0.05) 0px 1px 2px 0px` | `rgba(0,0,0,0.1) 0px 1px 3px 0px, rgba(0,0,0,0.1) 0px 1px 2px -1px` |
| outline CTA (View All Tickets) | light (as above) | heavy (as above) |
| login sign-in button | light | heavy |
| mobile header | light | heavy |
| Google button (hover) | light on hover | heavy on hover |

NOT affected (names kept their values in v4): `shadow-md` (quick-stat badges), `shadow-lg`, `shadow-xl`, `shadow-2xl`, and bare `shadow` on the status/priority badges — all verified computing IDENTICALLY on both sites (badge shadow: `rgba(0,0,0,0.1) 0px 1px 3px 0px, rgba(0,0,0,0.1) 0px 1px 2px -1px` on both).

> The intermediate "G3" diagnosis (outline variant `shadow-xs` vs reference `shadow-sm` → flip to shadow-sm) was a **FALSE GAP, reverted** — the computed re-measure proved the reference's `shadow-sm` IS the light value. Parity is the computed value, never the class name.

### B. Gap list (final)

| ID | Severity | File(s) | Gap | Fix |
|---|---|---|---|---|
| G1 | MED | `src/components/app-sidebar.tsx` | Quick-stat value badges (Open/In Progress/Total) lack `hover:bg-primary/80` — the reference's old-shadcn Badge base carries it (session-4 measurement table noted it, but no gap ID was ever assigned; it fell between the status/priority badge fixes) | Append `hover:bg-primary/80` to the 3 quick-stat badge strings |
| G2 | **HIGH** | `src/components/ui/button.tsx` | Icon-bearing Buttons render px-3 instead of the reference's px-4 (§A) | Strip `has-[>svg]:px-3/px-2.5/px-4` from the three size variants |
| G3′ | MED | 11 controls + `card.tsx` base | The v3→v4 shadow-scale naming trap, app-wide (§A′) | Flip `shadow-sm`→`shadow-xs` on: mytickets search + 2 selects, submit title + 2 selects + description textarea, comment textarea, sign-in + signup + forgotpassword submit buttons, mobile header, Google button `hover:shadow-sm`→`hover:shadow-xs`; Card base (dead code, hygiene). Flip the session-4 E2E `shadow-sm` class-pins to `shadow-xs` |
| G4 | LOW | `src/app/not-found.tsx` | Go Home control lacks the reference tail: `duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500` | Append the exact reference classes |
| G5 | **HIGH** | `src/app/layout.tsx` + `src/app/globals.css` | **The font-family was never probed**: the reference loads NO webfont (document.fonts empty, zero @font-face rules) — its body computes Tailwind's `ui-sans-serif`-first stack. Our next/font Inter was an unmeasured session-1 assumption producing ~10% text-width deltas on every label/button. The reference also leaves smoothing at `auto` (no `antialiased`) | Remove the Inter next/font; pin `--font-sans` in `@theme inline` to the reference's exact stack (Tailwind 4.3's default is the older explicit vendor list — different string); drop `antialiased` (body rule + className) |
| G6 | MED | submitticket + ticketdetails | Back-button arrows (×2) + the Add Comment svg were missing `mr-2` — icon-to-text spacing 8px vs the reference's 16px (back button 189px vs 197px) | Add `mr-2` to the three svgs — final paired measurement 197px vs 197px |
| G7 | LOW | `dashboard/page.tsx` | View All CTA arrow hover slide `translate-x-0.5` (2px) vs the reference `translate-x-1` (4px) | `group-hover:translate-x-1` |
| G8 | ~~MED~~ **FALSE GAP — REVERTED** | `submitticket/page.tsx` | Initial diagnosis: submit icon "Send → CirclePlus w-5". The probe had matched the SIDEBAR NAV item (also reads "Submit Ticket", carries circle-plus w-5, lives outside main). The reference's actual FORM submit button is `Send w-4 h-4 mr-2` — session 3 was right; the intermediate CirclePlus edit was reverted | REVERTED — submit button back to `Send w-4 h-4 mr-2`; paired width 160px = 160px |

### C. VLM screenshot-claims ledger (computed styles = truth)

| Claim | Verdict |
|---|---|
| Stat-card icon tiles have a light background/border in the clone, absent in reference | FALSE — identical computed gradients (same endpoint colors), identical 48px width; the lab() vs rgb() interpolation is the documented Tailwind v4 engine divergence |
| Clone submit form more indented / increased left padding | FALSE — form x == title x == 384px on BOTH sites |
| Reference category/priority dropdowns empty vs clone populated | FALSE — both render category placeholder "Select category" + priority default "Medium - Normal" |
| Reference attachments dropzone shows only label + empty border | FALSE — the reference's dropzone contains the same `lucide-upload w-8 h-8` svg + label (low-contrast misread) |
| Login form spacing tighter/looser in clone; inputs shorter | FALSE — input height 48px both; card shadow computes the same visible `rgba(0,0,0,0.25) 0px 25px 50px -12px` |
| Login footer links positioned differently | FALSE — identical row classes both sites |
| Reference user-profile block shows → vs clone ↗ | FALSE — both footers render `lucide-log-out w-4 h-4` |
| Reference has a light-gray page background top-right vs clone white | FALSE — identical app-wide gradient wrapper (computed), E2E-pinned since session 2 |
| Reference "Edit with Base44" badge missing in clone | NON-GOAL — base44 builder chrome, not app design (documented since session 1) |
| Ticketdetails composite differences | IDENTICAL — zero claims |
| MyTickets sort/scope + comment counts missing in reference | SUPERSET (documented) — deliberate additions below the reference filter row |

### D. Reference-site defects deliberately NOT copied (re-verified this session)

- **Toast viewport blocks the mobile trigger** (re-confirmed via `elementFromPoint` at the trigger center → the `fixed top-0 z-[100]` container with `pointer-events: auto`). Our Radix viewport region carries inline `pointer-events: none` — the clone trigger hit-tests to the BUTTON itself.
- **No nav highlight at `/`** on the reference — our `/` → `/dashboard` redirect stays (E2E-pinned).
- Reference Sheet console warnings (missing DialogTitle/Description) — ours provides sr-only title/description (a11y superset).

### E. Intentional divergences (documented, do NOT "fix")

- **Display name** = account name (greeting/footer); the reference shows the email local-part (base44 auth has no name concept).
- Button/Input/Select/Label **base-class generations** (old vs new shadcn: `transition-colors` vs `transition-all`, focus-ring styles, div-vs-span Badge) — invisible at rest; EXCEPT where they change computed values (G2/G3′ — fixed this session).
- `asChild` anchors; motion wrappers (`animate-rise-in` on the element vs framer-motion wrapper divs); lab() gradient interpolation (endpoint colors identical).

### F. Session-5 process lessons (recorded for the next agent)

1. **Never derive a dump target origin from `location.origin`.** The dump helper initially read the CURRENT page's origin — the browser was still on the reference, so "clone login" attempts were silently executed against the reference (its base44 API answered `Security verification is required`, its auth `Invalid email or password`). The clone was never broken; the helper now takes the origin as an explicit argument and asserts the post-navigation origin.
2. **`var top = ...` in page context collides with the unforgeable `window.top`** — evaluations return a WindowProxy, not the probed element. Use another name.
3. **Class NAMES are not parity — computed values are.** The reference's `shadow-sm` (v3) is our `shadow-xs` (v4). Every shadow comparison must go through `getComputedStyle().boxShadow` (G3′ and the reverted false G3 are the evidence).
4. Reference data remains volatile (111 open / 116 total this session) — all probes use computed styles/structures, never data.
5. **Disambiguate by scope before measuring buttons.** The sidebar nav items share text with page controls ("Submit Ticket" nav vs form submit). An unscoped `querySelectorAll('button,a').find(...)` matched the nav anchor and produced the false G8. Always scope to `main` (or the form).
6. **Probe the font family, not just sizes/weights.** Four sessions compared typography at every level EXCEPT the family. `document.fonts` + computed `font-family` settled it in one probe.

---

## 2. Execution Plan (TDD — as executed)

1. ✅ **Red E2E parity tests** (8-test "session 5" block + later a 3-test "shadow-scale trap" block appended to `tests/e2e/visual-parity.spec.ts`) — all verified RED against the pre-fix build (8/8; the "1 passed" was the auth setup project).
2. ✅ **Implement G1** (app-sidebar.tsx) → green.
3. ✅ **Implement G2** (button.tsx size variants) → green.
4. ✅ **Implement G4** (not-found.tsx) → green.
5. ✅ **G3 false-gap discovered via computed re-measure → REVERTED**; expanded into G3′ (the shadow-scale trap, 11 controls + Card base + Google hover) → green.
6. ✅ Session-4 `shadow-sm` class-pins flipped to `shadow-xs` (documented re-measure supersede, like session-4's tracking flip).
7. ✅ **Full verification gate:** lint ✓ typecheck ✓ 53 unit ✓ build ✓ **84/84 E2E** ✓ smoke 11/11 ✓.
8. ✅ **Live re-verification** via agent-browser: back buttons 197px = 197px (paired), submit button 160px = 160px, all icon paddings 16px, all shadows light (`rgba(0,0,0,0.05) 0px 1px 2px 0px`), font stack + smoothing matched, quick-stat hover present, 404 focus tail present, mobile menu re-tested (trigger hit-tests to BUTTON, 20px/12px/600 geometry, overlay close, Escape, nav-tap auto-close), zero console errors on every page incl. the 404.
9. ✅ **Refreshed `docs/screenshots/`** (7 shots) + rebuilt side-by-side composites — final VLM dashboard check: **IDENTICAL**.
10. ✅ **Updated docs:** README/AGENTS (session-5 contracts + reference entry)/CLAUDE (font rule + counts)/PAD (test distribution + known-issues row) + `service-desk_SKILL.md` → v2.3.0 (lessons 16–18) + this plan + worklogs.
11. Commit + push via `docs/ssh_git_wrapper_v3.py` (main only).

## 3. Validation of this plan against the codebase

- G1: the 3 quick-stat badge strings live in `app-sidebar.tsx`; adding `hover:bg-primary/80` conflicts with nothing (plain string concatenation; the badges had no hover class).
- G2: `has-[>svg]:px-*` appeared exactly 3 times in `button.tsx` (size variants). No call site relies on smaller icon-button padding (the reference never renders it). The sm size (`px-3`) is only used by the superset scope buttons (no svg) — unchanged.
- G3′: the 11 flips target the exact strings `focus:ring-cyan-500 shadow-sm` (8 controls), `font-medium shadow-sm rounded-xl` (3 submit buttons), the header's `md:hidden shadow-sm`, and the Google button's `hover:shadow-sm`. The E2E pins flipped in lockstep; no other test pins those classes (the mobile-header pin is the trigger's classes, not the header's shadow).
- G4: the Go Home link is a plain `<a>` (not a Button) — the 5 appended classes are inert at rest (focus-only + duration).
- Tailwind v4 cautions honored: no plain-utility overrides of variant-styled primitives introduced (all edits are variant-source or plain string additions).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Stripping `has-[>svg]:px-*` changes button widths app-wide | That IS the fix (reference parity); 6 affected controls measured 12px → 16px; text-only buttons unchanged; full E2E re-run (84/84) |
| `shadow-xs` flips alter hover states | Only at-rest/hover box-shadow changed per the computed reference pairs; E2E pins the values; smoke re-run |
| 404 focus classes never exercised by clicking Go Home | New E2E assertion pins the class list; classes are inert at rest |
| Reference data drift between measurement and fix | All probes structural (classes/computed styles), never data |
| Button base edits ripple into the mobile sheet | The mobile trigger is `SidebarTrigger` (separate component); mobile-navigation spec re-confirmed (84/84 includes it) |
