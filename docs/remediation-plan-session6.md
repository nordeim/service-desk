# ServiceDesk — Session 6 Remediation Plan

**Date:** 2026-10-09
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 6 follows the session-5 remediation (8 gaps incl. the icon-button padding + shadow-scale traps + the system font stack; commit `0b65112`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live geometry measurements via agent-browser (per `skills/clone-app-pat-pro`). Reference DOM dumps: `/tmp/s6-ref/`; clone dumps: `/tmp/s6-clone/` (helper: `scripts/s6-dump.sh`, explicit origins — session-5 lesson honored). VLM used only as a lead generator for the post-fix composite sweep. New probe surfaces this session: **border-radius scale** (never probed in sessions 1–5, like the font family before session 5), **focus-visible interaction states**, and **select dropdown open states** (trigger values + option rendering).

**Baseline at session start (all green):** lint ✓ typecheck ✓ 53 unit ✓ build ✓ 90/90 E2E ✓ smoke 11/11 ✓ — working tree clean at `67ebad4` (session-5 code + session-6 briefing doc).

---

## 1. Findings Inventory

### A. Headline finding: the radius scale — every rounded control renders +2px (never probed in 5 sessions)

The vendored shadcn v4 `globals.css` wires the radius tokens as a calc chain off `--radius: 0.625rem` (10px):

```
--radius-sm: calc(var(--radius) - 4px)   → 6px
--radius-md: calc(var(--radius) - 2px)   → 8px
--radius-lg: var(--radius)               → 10px
--radius-xl: calc(var(--radius) + 4px)   → 14px
```

The reference renders Tailwind **v3 default** radii: `rounded-sm`=2px, `rounded-md`=6px, `rounded-lg`=8px, `rounded-xl`=12px. Every `rounded-md/lg/xl` element in the clone renders **exactly +2px** vs the reference (rounded-sm: +4px; `rounded-2xl`/`rounded-full` are identical — v4 defaults match v3 there). Live-measured pairs:

| Element (matched by class) | Reference computed | Clone computed |
|---|---|---|
| Dashboard stat card `rounded-xl` | 12px | 14px |
| Badge `rounded-md` | 6px | 8px |
| Button base `rounded-md` | 6px | 8px |
| Mobile SidebarTrigger `rounded-lg` | 8px | 10px |
| Select listbox `rounded-md` | 6px | 8px |
| Select option `rounded-sm` | 2px | 6px |

Usage census (source grep): `rounded-xl` ×39, `rounded-md` ×25, `rounded-lg` ×8, `rounded-sm` ×1, plus `rounded-2xl` ×6 / `rounded-full` ×15 (unaffected). Like session-5's font finding, this is a scale-level divergence invisible to class-name diffs — the class names are IDENTICAL on both sites; only the computed values differ.

### B. Second finding: focus-visible interaction states (keyboard/focus surfaces, never probed)

All four interactive base components (Button, Input, Textarea, SelectTrigger) render the new-shadcn focus tail `outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`, producing on focus a **3px 50%-alpha cyan ring + cyan border**. The reference's old-shadcn bases render **no border change** and a solid ring: `focus-visible:ring-1 focus-visible:ring-ring` (buttons + app-page inputs/selects/textareas; the select trigger uses plain `focus:`), and the auth pages (login/signup/forgotpassword) use an older input generation with `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (2px ring + 2px offset). Live-measured pairs (keyboard focus):

| Surface | Reference | Clone |
|---|---|---|
| Login email input | border slate-400; ring `#fff 0 0 0 2px, slate-400 0 0 0 4px`; outline transparent (v3 `outline-none` = 2px solid transparent) | border **cyan-500** (base `focus-visible:border-ring` beat the custom `focus:border-slate-400` in the v4 variant cascade); 3px 50% cyan ring |
| Regular button (old base) | 1px solid slate ring, no border change | 3px 50% cyan ring + cyan border |
| Google button | **browser-default outline** (raw button, no focus classes at all) | 3px 50% cyan ring + cyan border |

The base-transition family also differs (`transition-[color,box-shadow]`/`transition-all` vs the reference's `transition-colors`/none) — ours fades the ring in over 150 ms; the reference's appears instantly. Fixed alongside (same lines).

**Scope decision:** the Google button's browser-default outline is an *accidental* raw-button state, not a design contract — our styled 1px ring (post-fix) is a proper focus indicator and a deliberate a11y superset (documented, like the sr-only sheet title). Everything else is aligned to the measured reference values.

### C. Gap list (final)

| ID | Severity | File(s) | Gap | Fix |
|---|---|---|---|---|
| G1 | MED | `src/app/login/page.tsx` (+ signup/forgot if same pattern) | "Need an account? Sign up" renders as `<p>` + inner `<a>`; the reference renders the WHOLE line as one control: `text-sm text-slate-500 hover:text-slate-700 transition-colors` with inner `<span class="font-medium text-slate-700">Sign up</span>`. Hover behavior differs (ours: only "Sign up" darkens, to slate-900; ref: the whole line goes slate-700) | Single `<a href="/signup">` wrapping the whole line with the reference classes + inner span (keeps the real-href superset) |
| G2 | MED | `src/app/login/page.tsx` | Google button renders an at-rest `shadow-xs` inherited from the `outline` variant base (computed `rgba(0,0,0,0.05) 0 1px 2px`); the reference's Google button is a raw custom button with **no** at-rest shadow (`none`) | Append `shadow-none` to the call-site className (tw-merge drops the variant's `shadow-xs`; the outline variant itself keeps `shadow-xs` — the CTA + Cancel both measure light at rest on the reference, so the variant base is correct) |
| G3 | MED | `src/app/(app)/submitticket/page.tsx` + `src/lib/constants.ts` | Category dropdown OPTIONS render `"🖥️ Hardware Issue"` as a single text node; the reference renders `<span class="flex items-center gap-2"><span>🖥️</span>Hardware Issue</span>` (8px gap, emoji isolated) | SelectItem children get the emoji-span structure; `CATEGORY_LABELS` values drop the emoji prefix (single source of truth stays) |
| G4 | **HIGH** | `src/app/globals.css` | The radius-scale trap (§A): rounded-sm/md/lg/xl render 6/8/10/14px vs the reference's 2/6/8/12px — app-wide, every card/button/input/badge +2px | Pin the four tokens to the v3-computed literals in `@theme inline` (like the session-5 font pin): sm=0.125rem, md=0.375rem, lg=0.5rem, xl=0.75rem. `rounded-2xl`/`full` untouched |
| G5 | **HIGH** | `src/components/ui/{button,input,textarea,select}.tsx` + auth pages | Focus-visible states (§B): 3px 50% cyan ring + border change on every control vs the reference's solid slate 1px ring (app) / 2px+offset-2 (auth), no border change | Swap the focus tails on the four bases to the measured reference tails (`focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`; select trigger: `focus:outline-none focus:ring-1`); auth inputs append `focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white` at the call sites; base transitions → `transition-colors` (Button) / `transition-colors` (Input) matching the reference generation |
| G6 | **HIGH** | `src/app/(app)/submitticket/page.tsx` + `src/lib/constants.ts` + `src/lib/__tests__/domain.test.ts` | **Double-emoji bug**: selecting a category renders the trigger as `🖥️🖥️ Hardware Issue` — `CATEGORY_EMOJI[c]` + `CATEGORY_LABELS[c]` where the label already contains the emoji. The reference renders a single emoji (verified: trigger `🖥️Hardware Issue`, one emoji span). Never caught: no E2E test selects a category and reads the trigger text | With G3: labels drop the emoji; the trigger keeps its existing (correct) emoji-span structure. Unit pin updated: `CATEGORY_LABELS.hardware === "Hardware Issue"` |
| G7 | MED | `src/app/(app)/submitticket/page.tsx` (+ constants) | Priority dropdown OPTIONS render plain text; the reference colors each option: Low=`text-slate-600`, Medium=`text-blue-600`, High=`text-orange-600`, Urgent=`text-red-600` (measured computed colors). The mytickets priority FILTER options are plain on the reference — correctly left plain | Wrap option labels in per-priority color spans (new `PRIORITY_SELECT_CLASS` map in constants, single source of truth) |
| G8 | MED | `src/app/(app)/submitticket/page.tsx` (+ constants) | The priority TRIGGER always renders `text-blue-600`; the reference renders the SELECTED priority's color (verified: select High → trigger `text-orange-600`). Session-3's blue pin was measured at the Medium default — correct at rest, incomplete for other values | Trigger value uses the same `PRIORITY_SELECT_CLASS[priority]` map (supersedes the session-3 constant-blue reading; the at-rest Medium case still renders blue) |

### D. Verified NON-gaps (re-checked this session, no action)

- **Back-button tags:** the reference renders `<button onClick=navigate("Dashboard"|"AllTickets"/"MyTickets")>`; ours are `<a href="/dashboard"|"href=/mytickets">` — the asChild divergence family; navigation targets verified identical (submitticket back → Dashboard both sites; ticketdetails back → the tickets list both sites).
- **OR divider:** ref `div.shrink-0.h-[1px]` vs our `span.w-full.h-px` — computed identical (1px × 368px, slate-200; ours renders via the documented lab() color pipeline).
- **Sheet close button:** `focus:ring-2 focus:ring-offset-2` + `rounded-xs`(=2px) both sites — at parity.
- **rounded-2xl / rounded-full:** 16px / 9999px on both sites (v4 defaults match v3).
- **Badge contracts** (shadow + hover:bg-primary/80 + compact paddings + lowercase), **shadow-scale pins** (all form controls light at rest; badge shadow two-layer), **font stack + smoothing**, **login footer "Forgot password?"** classes, **Google `text-[16px]` == `text-base`**, **mytickets filter option labels** (short "Low/Medium/High/Urgent" + "All Priorities"/"All Status"), **mobile nav geometry** (20px icons / 12px gap / 600 labels / 288px sheet), **console cleanliness** (zero errors/warnings on all 5 pages both sites).
- **Reference's mobile trigger still blocked by its own toast viewport** (`elementFromPoint` → the `fixed top-0 z-[100]` container) — the documented reference defect, deliberately not copied.

### E. Intentional divergences (documented, do NOT "fix")

- Display name = account name (reference shows the email local-part).
- asChild anchors, motion wrappers (`animate-rise-in` on the element vs framer-motion wrapper divs), lab() gradient/color pipeline, comment-form `<form>` wrapper (reference uses a bare div — ours submits on Enter), superset rows (sort/scope, comment counts, Update Status card), the empty `sm:hidden` login caption div omitted, Google button focus ring (a11y superset, §B scope decision).

---

## 2. Execution Plan (TDD — as executed)

1. ✅ **Red tests first**: 2 unit pins (emoji-free `CATEGORY_LABELS` + `PRIORITY_SELECT_CLASS`) + 16 E2E "session 6" tests — all verified RED against the pre-fix build (16/16 + the auth-setup project pass; the unit pins failed on import + value).
2. ✅ **G4** (globals.css radius tokens → v3 literals) → radius tests green.
3. ✅ **G5** (four base components' focus tails + base transitions) + **G5b discovered during test hardening**: the auth inputs also render the base's at-rest `shadow-xs` while the reference's auth-generation inputs have NO shadow → `shadow-none` on all 6 auth inputs (login ×2, signup ×3, forgotpassword ×1).
4. ✅ **G1 + G2** (login signup line + Google `shadow-none`); signup page's "Already have an account?" line given the same whole-link pattern (superset page, coherent design language).
5. ✅ **G3 + G6** (constants emoji-free labels + option/trigger emoji-span structure; the double-emoji bug gone).
6. ✅ **G7 + G8** (`PRIORITY_SELECT_CLASS` map: options + trigger render the selected priority's color).
7. ✅ Session-4 cyan-focus pins superseded (title/search inputs drop the inert customs; selects + textareas keep the ACTIVE ones — each per the reference's computed behavior).
8. ✅ **Test-authoring fixes during the red→green cycle** (recorded as process lessons): (a) Tailwind v4 emits palette colors as `lab()` — assertions accept both representations; (b) one-shot `evaluate` catches `transition-colors` mid-flight — border assertions use auto-retrying `toHaveCSS`/`expect.poll`; (c) a Tab-loop must check `activeElement` ITSELF — BODY's `textContent` contains the whole page (the loop broke at stop 0); (d) our Radix generation moves focus INTO the open dropdown — the select-trigger test uses `.focus()` (the reference-parity base is plain-`focus:` scoped, so it applies); (e) the auth spec's `getByRole("link", { name: "Sign up", exact: true })` updated to the whole-line accessible name.
9. ✅ **Full verification gate:** lint ✓ typecheck ✓ **54 unit** ✓ build ✓ **107/107 E2E** ✓ smoke 11/11 ✓.
10. ✅ **Live re-verification (paired, both sites):** radius table identical (stat card 12px, badge/button 6px, mobile trigger 8px, select option 2px); focus states identical (app input 1px near-black ring + unchanged slate-300 border; textarea near-black ring + cyan border; select 1px cyan ring + cyan border; auth input 2px slate-400 ring + 2px white offset + no at-rest shadow; category option structure + single-emoji trigger `🖥️Hardware Issue`; priority option colors + High→orange trigger; Google button no at-rest shadow; signup line whole-link structure). Mobile menu re-tested: trigger hit-tests to BUTTON (radius now 8px), sheet geometry 20px/12px/600 identical, overlay close (real pointer), Escape close, nav-tap auto-close, zero console errors on every page.
11. ✅ **VLM composite sweep** (7 side-by-side composites, `compare-s6/`): login / ticket-detail / mobile-dashboard = **IDENTICAL**; dashboard + mobile-menu claims = the documented `/`-no-highlight divergence (the reference DOES highlight the active item on real routes — verified at /mytickets — but never at its `/` root; our redirect superset stands) + data; submit-ticket claims refuted by DOM (trigger texts + description placeholder identical — same low-contrast VLM misread as session 5); mytickets claims = data + the documented sort/scope superset row. Stat-tile "larger icons" claim refuted by computed (48px = 48px — the 56px reading had matched the mytickets card tile, wrong page).
12. ✅ **Refreshed `docs/screenshots/`** (7 shots) + updated README / AGENTS (session-6 contracts) / CLAUDE / PAD / `service-desk_SKILL.md` v2.4.0 + worklogs + this plan.
13. Commit + push via `docs/ssh_git_wrapper_v3.py` (main only).

## 3. Validation of this plan against the codebase

- G4: the four token lines live in the `@theme inline` block (globals.css:54-57); nothing else references `var(--radius)` in src/ (grep-verified) — `--radius: 0.625rem` in `:root` becomes decorative (kept for documentation; the comment explains the pin).
- G5: the four bases' focus tails are isolated class strings (button.tsx base, input.tsx:12, textarea.tsx:10, select.tsx:34) — string edits, no call-site changes needed except the auth pages (login/signup/forgotpassword inputs share one custom className string each; 2 in login, 1-2 in signup/forgot). The custom `focus:border-cyan-500 focus:ring-cyan-500` (app) / `focus:border-slate-400 focus:ring-slate-400` (auth) call-site tails stay — after the base swap the width comes from the base ring-1/ring-2 and the color from the custom, exactly like the reference's composition.
- G5 risk — cascade: removing `focus-visible:border-ring` from the bases eliminates the variant-beats-custom border conflict (the login input measured cyan border from the BASE beating the custom slate-400 — the very conflict session 4 documented in reverse for `text-white!`). Post-fix the custom `focus:border-*` classes are the only border-changers ✓.
- G1: the signup line is a static JSX block in login/page.tsx (and possibly signup/forgotpassword "already have an account" lines — checked during implementation; the reference's signup page is a 404, so only the reference login matters, but our superset signup page keeps its own coherent line).
- G2: `shadow-none` in Tailwind v4 computes to a fully-transparent zero stack (visually none); the E2E pin asserts no layer with non-zero alpha/blur, matching "none" for visual parity.
- G3/G6: `CATEGORY_LABELS` is referenced only by the submitticket page + the unit test (grep-verified); the mytickets category badge path uses a different lowercase-label rendering (pinned separately).
- G7/G8: the mytickets priority filter is verified plain on the reference — the color map is used by the submit form only.
- Tailwind v4 cautions honored: all edits are variant-source or plain string additions on already-variant-styled primitives; no new plain-vs-variant overrides introduced.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Radius token pin shifts every rounded element (39+25+8 call sites) | That IS the fix; every pair re-measured live post-fix; full E2E re-run |
| Focus-tail swap changes what keyboard users see on every control | Paired computed measurements against the reference define the target; mobile-navigation + visual-parity specs re-run |
| `CATEGORY_LABELS` value change breaks unknown consumers | Grep census: 2 call sites (both in submitticket) + 1 unit test; the badge/emoji-tile paths use separate maps |
| shadow-none vs none computed difference (v4 transparent stack) | Visually identical (zero alpha, zero blur); the E2E pin asserts visual-layer absence, and the paired live probe confirms |
| Session-3 blue-priority pin conflicts with G8 | Documented supersede (like session-4's tracking-wider flip): the pin's at-rest case (Medium → blue) still holds; new pins cover the full map |
| E2E focus-visible tests flake on :focus-visible heuristics | Text inputs always match :focus-visible when focused (spec behavior) — plain `.focus()` works for inputs; the button test uses a real keyboard Tab (trusted CDP key events, verified in the probe phase) |

---

## 5. Session-6 process lessons (recorded for the next agent)

1. **The reference's focus customs are NOT uniformly inert OR active — verify per control type.** Text inputs render their `focus:border-cyan-500 focus:ring-cyan-500` customs inert (1px near-black `ring-ring` + unchanged border wins), textareas render the border custom active but the ring custom inert, and select triggers render BOTH active (their base `focus:ring-1` carries no color — the custom supplies it). Only paired computed measurements per surface reveal this; class-name diffs cannot.
2. **Probe the RADIUS scale, not just colors and shadows.** Like the session-5 font, the radius scale had never been probed — the shadcn v4 calc chain (`--radius: 0.625rem` → sm/md/lg/xl = 6/8/10/14px) silently rendered every rounded control +2px vs the reference's v3 defaults (2/6/8/12px) for five sessions. A scale-level probe is: `getComputedStyle(el).borderRadius` on one matched element per radius class.
3. **Tailwind v4 emits palette colors as `lab()` functions** (slate-400 computes `lab(65.5349 -2.25151 -14.5072)`); tokens authored as literal hex (our `--ring: #0a0a0a`) stay rgb. E2E color pins must accept both representations — or normalize — or they break on the representation, not the color.
4. **`transition-colors` races one-shot computed reads**: a border that fades over 150 ms read via a single `evaluate` right after focus returns the interpolated midpoint. Use auto-retrying `toHaveCSS` / `expect.poll`.
5. **Never match `document.activeElement` by `textContent` against page text** — the BODY's textContent contains the entire page. Check `activeElement instanceof HTMLAnchorElement && el.textContent.includes(...)`.
6. **Our Radix generation moves focus INTO the open dropdown** (the reference's keeps it on the trigger) — click-then-assert-on-trigger races the focus hand-off; use `.focus()`.
7. **A "selected value" needs an E2E pin that EXERCISES the selection** — the double-emoji bug (G6) survived five sessions because every pin read the at-rest placeholder; none selected an option and read the trigger.
8. **The reference's active-nav styling exists on real routes** (gradient + white verified at /mytickets) — the "no highlight" look is their `/`-root quirk only. When a VLM composite shows a nav difference on the dashboard, check which ROUTE each side is on before accepting the claim.
