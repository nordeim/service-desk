# ServiceDesk — Session 16 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 16 follows the session-15 remediation (2 findings — the attachment cache window + the timezone-stable date rendering; commit `cd65bfe` + the operator's log commit `32b7369`, briefing docs `docs/session_19.md` + the operator-committed transcript `docs/session_20.md`).
**Method:** Ground truth = computed styles + live interaction probes + high-frequency rAF timeline sampling + reference JS-bundle analysis (per `skills/clone-app-pat-pro` — the bundle is the authoritative source for animation parameters that timing probes can only approximate). This session's headline surface: **the entrance-animation contract re-measured from first principles** (the session-3 measurement turned out to be one spring applied to four different reference animations), plus the session-19 fresh-probe shortlist.

**Baseline at session start (`32b7369`, fresh clone):** lint ✓ typecheck ✓ 56 unit ✓ build ✓ **184/184 E2E** ✓ smoke 11/11 ✓. Session-15 commit `cd65bfe` audited CLEAN against its plan (F1 `Cache-Control: private, max-age=31536000, immutable` at the attachment route; F2 `timeZone: "UTC"` in both formatters). Env contract verified standing (`.env` from `.env.example` with a generated AUTH_SECRET, `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root pushed + seeded 4/11/3, `skills/` excluded in all 4 configs). The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session). One environment note: the fresh workspace needed `npx playwright install chromium` (the 1.64 runner expects build 1248; the cache held 1200/1243 — the s13 lesson).

---

## 1. Findings Inventory

### F1 (MED-HIGH — the headline): the entrance-animation contract is per-surface on the reference; ours ships one spring everywhere

The session-3 contract ("opacity 0→1 + y 20→0, ~310 ms spring with ~12% overshoot, no stagger, on stat cards + recent rows + mytickets cards + the submit card + the detail wrapper") is **superseded by measurement**. This session re-measured the reference's animations three ways: (a) high-frequency rAF timeline sampling on hard-loaded routes, (b) stagger start-times per element on clean loads, and (c) the reference's production JS bundle, which carries the exact framer-motion parameters. All three agree.

**Reference (measured live + bundle-verified this session):**

| Surface | Initial → Final | Duration | Easing | Stagger |
|---|---|---|---|---|
| Dashboard stat cards (each) | opacity 0→1, **y 20→0** | **~500 ms** | **gentle ease-out tween, NO overshoot** — fits `cubic-bezier(0.61, 1, 0.88, 1)` (framer-motion's default tween ease, RMSE 0.025 over 24 samples) | none |
| Dashboard recent rows (each) | opacity 0→1, **x −20→0** (slides from the LEFT) | ~275–300 ms | spring with overshoot (mid-flight x +2.39 = ~12%) | **100 ms/index** |
| MyTickets cards (each) | opacity 0→1, y 20→0 | ~270–300 ms | spring with overshoot (peak y −2.2 = 11%) | **50 ms/index** |
| Submit page: [header + error alert + form card] as ONE wrapper | opacity 0→1, y 20→0 | ~500 ms | ease-out tween | none |
| Detail page: [back + grid] as ONE wrapper | opacity 0→1, y 20→0 | ~500 ms | ease-out tween | none |
| Dashboard header, Performance Metrics, MyTickets header + filters | — | — | static (no motion wrapper in the bundle) | — |

Bundle evidence: stat cards + the submit/detail wrappers carry `transition:{duration:.5}` (a tween — no spring, no overshoot; the measured curve fits framer-motion's default ease); the card grids carry `transition:{delay:o*.05}` (stagger + DEFAULT spring); the recent-rows list carries `initial:{opacity:0,x:-20}, animate:{opacity:1,x:0}, transition:{delay:o*.1}` (x-axis! 100 ms stagger). Live timelines: stat card at t=132 ms → opacity 0.379, at t=415 ms → 0.947 (still in flight — ~500 ms total, monotonic, no overshoot); mytickets cards start 417/437/487/537/587/637 ms (50 ms apart), each ~270 ms long with peak overshoot y=−2.2; recent rows start 24/99/199/298/399 ms (100 ms apart), first transform `matrix(1,0,0,1,-20,0)` — the x-slide.

**Why the s3 measurement missed this:** the s3 agent sampled computed styles at intervals and reconciled everything to ONE spring (~310 ms, ~12% overshoot) — which is exactly the MyTickets card animation (the only spring the reference ships). The stat cards' 500 ms tween, the recent rows' x-axis slide, both staggers, and the submit wrapper's scope (header + form together) were never separately measured. Fourteen sessions of E2E pins then enforced the single-spring approximation.

**Ours (current):** ONE utility everywhere — `animate-rise-in` = 0.3 s `cubic-bezier(0.34, 1.56, 0.64, 1)` (springy, overshoots to y=−1.7): stat cards (wrong duration + overshoot the reference doesn't have), recent rows (wrong AXIS — rises from below instead of sliding from the left, no stagger), mytickets cards (right axis + right spring, but no stagger), submit form card alone (the header never animates; the reference animates header + form as one 500 ms tween), detail wrapper (right structure, wrong timing).

**User-visible delta:** on every dashboard load, our stat cards pop up 40% faster with a bounce the reference never shows; our recent rows rise from below instead of sliding in from the left, all at once instead of cascading 100 ms apart; our mytickets cards all arrive simultaneously instead of cascading 50 ms apart; on the submit page our header snaps in while the reference's whole content block rises together.

**Fix (computed parity, pure CSS — keep the no-framer-motion stack):**
1. Redefine `@utility animate-rise-in` → `animation: rise-in 0.5s cubic-bezier(0.61, 1, 0.88, 1) backwards` (the tween — stat cards, the submit wrapper, the detail wrapper).
2. Add `@utility animate-rise-in-spring` → `animation: rise-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards` (the spring — mytickets cards; the s3 curve keeps its measured fit).
3. Add `@keyframes slide-in` (x −20→0 + opacity) and `@utility animate-slide-in` → `animation: slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards` (recent rows).
4. RecentTicketRow: `animate-rise-in` → `animate-slide-in` + `style={{ animationDelay: `${index * 100}ms` }}` (new `index` prop).
5. TicketCard: → `animate-rise-in-spring` + `style={{ animationDelay: `${index * 50}ms` }}` (new `index` prop).
6. Submit page: move the animation from the `<form>` to the `max-w-3xl mx-auto` wrapper div (whose only children are the header block + the form — the reference's one motion wrapper; zero structural change: no new DOM nodes).
7. Detail page: no structural change — the back+grid wrapper keeps `animate-rise-in` and inherits the new 500 ms tween.
8. Every animated element keeps `motion-reduce:animate-none`; the global `prefers-reduced-motion` block already collapses everything else. `fill-mode: backwards` (already in the utilities) holds each element at its from-state during its stagger delay — exactly framer-motion's `initial` behavior.

### F2 (LOW — behavior): the sidebar QUICK STATS poll every 5 s on the reference; ours fetch only on route change

The reference's sidebar (`$Pe` in the bundle — `currentPageName` prop) runs `useEffect(() => { l(); c(); const h = setInterval(() => { c() }, 5e3); return () => clearInterval(h) }, [])` — it fetches ticket counts on mount and **every 5 seconds**, forever. Ours (`src/components/app-sidebar.tsx`) fetches `/api/stats` on `pathname` change only.

**User-visible delta:** a user sitting on any page while tickets change elsewhere sees the reference's sidebar counts update within 5 s; ours stay stale until the next route navigation.

**Fix:** add the 5 s interval to the existing effect (fetch on mount + every 5 s + on route change; cleanup clears the interval on unmount/re-run). We keep our `/api/stats` aggregate (their 5 s poll fetches the FULL ticket list and counts client-side — our mechanism is the cheaper superset; the visible freshness contract is what we're matching).

### F3 (DOCUMENTATION — no code change): the reference ships an admin-gated surface we cannot measure — All Tickets / Analytics / Settings / Developer

The reference's bundle contains a role-gated nav extension: `{title:"Dashboard"},{title:"Submit Ticket"},{title:"My Tickets"}, …(role === "admin" ? [{All Tickets},{Analytics},{Settings},{Developer}] : [])` — plus full page implementations (an Analytics page with charts + PDF report generation, a Settings page, a Developer/Code-Editor page, an All Tickets page) that the live nav never shows for our login (`/entities/User/me` returns `role: "user"` for `sepnetflix2023@outlook.com`).

**Decision (per the parity doctrine):** we deliberately do NOT implement these surfaces. Measured design is the only design we ship; with no admin credentials on the reference, their admin pages are unmeasurable, and inventing UI violates the computed-styles-are-ground-truth contract. The functional core of "All Tickets" is already our mytickets scope toggle (the documented superset). This finding lands in the living docs as a known unmeasurable surface — if the operator ever provides admin credentials, a future session can measure and close it properly.

### Verified NON-gaps (re-checked this session, no action)

- **The hour12:false OS-setting axis (the session-19 shortlist, resolved at the code level):** the reference's bundle carries the exact date-fns format string `"MMM d, yyyy 'at' h:mm a"` — the `h` + `a` tokens pin 12-hour rendering STRUCTURALLY (date-fns consults its own en-US locale data; `Intl`/hourCycle never enters the path; framer-motion's motion context defaults `reducedMotion:"never"`, same isolation). Our `formatDateTime` passes `hour12: true` explicitly (plus `timeZone: "UTC"` per s15) — equally structural. No browser or OS setting can flip either site to 24-hour rendering. The s19 locale-axis probes (en-US held under de-DE/ja-JP) are now explained at the mechanism level.
- **Comment-list ordering/pagination (the session-19 shortlist):** the reference's comment API returns a FLAT array (61 comments globally on one response, `sort=-created_date`, no pagination fields, no limit) and the client filters per ticket + renders oldest-first (measured on the 7-comment laptop ticket: 12:48 AM → 10:26 AM ×3 → 10:27 → 11:27 PM — chronological). Ours: per-ticket `orderBy createdAt asc` from the API — visually identical ordering, server-side filtered (our cheaper superset). NON-GAP at 61 comments and structurally beyond (no pagination exists on either side).
- **Cache revalidation after the `immutable` window (the session-19 shortlist):** unprobeable today (a year out from the s15 measurement). Note only.
- **Dark color scheme (fresh axis, never probed before):** the reference ignores `prefers-color-scheme` entirely (body stays `rgb(255,255,255)`, no `.dark` class, `color-scheme: normal` under a dark context — measured live). Ours: also stays light (the `.dark` block in globals.css activates only via a class nothing sets). NON-GAP, verified both sides.
- **`prefers-reduced-motion` on the reference:** framer-motion's context defaults to `reducedMotion: "never"` (bundle-verified) — the reference ANIMATES under reduced motion; ours disables every entrance (our documented a11y superset, stands — never mirror an accessibility defect).
- **Standing drift pins — ALL stable:** the `:root` token block (`--primary 0 0% 9%` / `--border 0 0% 89.8%` / `--accent 0 0% 96.1%` / `--ring 0 0% 3.9%`), the sidebar panel `rgb(250,250,250)` (#fafafa), the bare-button `cursor: pointer`, the system font stack, the auth-route head set.
- **Mobile navigation (the standing priority) — full matrix on BOTH sites at 375×812:** ours fully green via the committed `scripts/s14-mobile-matrix.mjs` (375=375 no overflow, 288 px sheet #fafafa, `oklab(0 0 0 / 0.8)` overlay, body locked while open, nav-tap auto-closes + unlocks, Escape closes + focus → body). The reference stable with their documented standing defects: their 468-vs-375 overflow persists (dashboard), their sheet STAYS OPEN after a JS-clicked nav-tap with the body scroll-lock stranded (`overflow: hidden` measured post-nav), their toast viewport still blocks their own mobile trigger. Never mirror.
- **Space-y trap-log static scan — CLEAN** (`scripts/s13-space-y-scan.mjs`).
- **The reference-side probe state:** no new probe tickets created on the reference this session (the comment/animation probes read existing data); our dev DB kept the canonical 11-ticket seed (re-counted after the s14-matrix fixture cleanup).

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; no-fake-verification signup; permanent SQLite attachment storage; nav-tap auto-close; correct SPA titles + route-correct head; `private` cache scope on the owner-scoped attachment route; UTC-pinned formatters (s15); the reduced-motion a11y superset (extends to the entrance animations — ours are disabled under reduce, theirs run); the unmeasured admin surface (F3, above); the cheaper `/api/stats` aggregate behind the same 5 s freshness contract (F2).

---

## 2. Execution Plan (TDD)

1. **RED — rewrite the session-3 E2E animation pins** in `tests/e2e/visual-parity.spec.ts` to the measured contract (a session-16 describe block replacing the session-3 expectations):
   - Stat cards: class `animate-rise-in` + computed `animation-name: rise-in` + `animation-duration: 0.5s` + `animation-timing-function: cubic-bezier(0.61, 1, 0.88, 1)`.
   - Recent rows: class `animate-slide-in` + `animation-name: slide-in` + `animation-duration: 0.3s` + the stagger: row index 1 computes `animation-delay: 0.1s`, index 2 → `0.2s`.
   - MyTickets cards: class `animate-rise-in-spring` + `animation-name: rise-in` + the stagger: card index 1 → `animation-delay: 0.05s`, index 2 → `0.1s`.
   - Submit: the `max-w-3xl` wrapper carries `animate-rise-in`; the `<form>` carries NO animation class.
   - Detail: the back+grid wrapper keeps `animate-rise-in` with computed duration `0.5s`.
   - Reduced motion: every surface above computes `animation-name: none` under `reducedMotion: "reduce"` (extends the existing pin).
   - F2: a new E2E test routes `/api/stats`, counts interceptions over a ~6.5 s window on a static page, expects ≥ 2 (mount fetch + the 5 s interval).
   - RED verification: each test fails against the current build for the designed reason (wrong timing function / wrong axis class / no delay / form carrying the class / single fetch).
2. **GREEN — F1** (globals.css utilities + the five component changes listed in §1-F1) **and F2** (the sidebar interval). One seam per file; no token changes; no DOM structure changes.
3. **Full gate:** `bun run lint && bun run typecheck && bun run test && bun run build` — then `bun run test:e2e` (185 expected: 184 + 1 new) and `bash scripts/smoke-test.sh`.
4. **Live paired re-verification** (production standalone :3000): re-run the s16 timing probes against our build and compare against the reference's measured numbers (stat card ≈ 500 ms monotonic; mytickets cards staggered 50 ms; recent rows x-slide staggered 100 ms; submit header+form rise together). Also re-verify the mobile matrix (the sheet slide-in still 500 ms; no overflow regressions from the new animations — the transforms must not reintroduce horizontal overflow at 375 px).
5. **Refresh `docs/screenshots/`** via the standing s15-lineage capture script (the fixes are motion-timing-level; the 10-shot set captures at-rest states — the E2E computed pins + the paired timelines are the F1 evidence, per the s15 precedent).
6. **Docs:** README (the animation + polling sentences + counts), AGENTS.md (the session-16 contracts section + the s3-contract supersede note), CLAUDE.md (counts + the timing-probe anti-pattern: "one timing curve fitted to all surfaces" is how s3's error shipped), PAD (the s16 known-issues row + the F3 admin-surface row), `service-desk_SKILL.md` v2.14.0 (the new lessons), `docs/session_21.md` (this session's narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
7. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only, `--remote` explicit), the full gate re-run green after the last source edit.

**Execution status (2026-10-10, all green):**
1. ✅ RED: the session-3 animation pins rewritten + a 7-test session-16 block — 7 failed for the designed reasons (wrong duration/easing/axis/stagger/wrapper + the single stats fetch). One authored-red fix: the polling pin moved off /dashboard (the dashboard's own /api/stats fetch false-greens it there — run behavioral pins on a page where only the surface under test fetches).
2. ✅ GREEN F1: the three utilities (`animate-rise-in` = the 500ms tween; `animate-rise-in-spring` = the 300ms spring + the split piecewise `fade-in-spring` opacity; `animate-slide-in` = the x-slide + the same fade) + the inline staggers + the submit wrapper move. Mid-implementation upgrade: the opacity/transform split on the spring surfaces (the live paired profiles showed our single-bezier opacity reaching 1.0 at 53% of the motion where the reference settles at ~90% — the piecewise keyframes sampled from both measured surfaces close it).
3. ✅ GREEN F2: the sidebar interval (mount + 5s + route-change; cleanup clears).
4. ✅ Gates: lint ✓ typecheck ✓ 56 unit ✓ build ✓ **191/191 E2E** ✓ (184 + 7, zero regressions) smoke 11/11 ✓.
5. ✅ Live paired re-verification: our stat card 50→516ms monotonic (≈ their 500ms); our rows x-slide + ~100ms stagger + ~280ms/row (theirs ~275ms); our cards ~50ms stagger + ~285ms (theirs ~270ms); the rendered opacity curve within one frame of theirs on both spring surfaces; mobile 375 = 375 (no overflow regression); 4 stats calls in 6.5s static.
6. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s16.sh` (the s15 lineage); VLM-verified shots 02 + 04 (LAYOUT-OK, animations completed).
7. ✅ Docs: README, AGENTS.md (the session-16 contracts section), CLAUDE.md (the single-spring anti-pattern), PAD (the s16 row), SKILL v2.14.0 (lessons 63-65), session_21.md, this status block, worklog.md.
8. ✅ Commit + push via the SSH wrapper (main only).

## 3. Validation of this plan against the codebase

- **F1 seams:** `src/app/globals.css:216-229` (the keyframes + utility — one block); `src/components/ticket-bits.tsx:118` (TicketCard's animated div) and `:160` (RecentTicketRow's anchor); `src/app/(app)/dashboard/page.tsx:150` (stat cards — class unchanged, inherits the redefined utility) and `:235` (the `recent.map` — add the index); `src/app/(app)/mytickets/page.tsx:196` (the cards map — add the index); `src/app/(app)/submitticket/page.tsx:143` (the max-w-3xl wrapper) and `:161` (the form — class removal). The detail wrapper (`ticket-details-view.tsx:190`) needs no edit. No other `animate-rise-in` usage exists (grep-verified).
- **F1 selectors:** the existing pins use `main .grid > div` (stat cards), `div.divide-y a` (rows), `a[href*="ticketdetails"] > div` (mytickets cards), `form` (submit), `main div.animate-rise-in` (detail) — all still resolve post-change (the submit pin retargets to the wrapper `main .max-w-3xl` div; the form pin asserts the ABSENCE of the class).
- **F1 risk — the submit wrapper:** animating the `max-w-3xl` div applies `transform` to a max-width container — no layout impact (transforms never affect layout). The `backwards` fill mode holds opacity 0 + y 20 during... no delay on this surface, so the from-state applies for one frame at mount (same as the form today).
- **F1 risk — recent-row x-slide at 375 px:** `translateX(-20px)` on rows inside `overflow-auto` — during the animation the row extends 20 px LEFT of its box; the scroll container clips it (no horizontal scrollbar can appear from a transform: transforms don't affect scrollWidth). The s8 `min-w-0` pin re-verifies in the gate.
- **F1 risk — hydration:** the animation classes are SSR-rendered on first paint; the stagger delays are inline styles computed at render (deterministic per index) — no hydration mismatch (the existing clean-hydration pin re-verifies).
- **F2 seam:** `src/components/app-sidebar.tsx:57-76` (the stats effect — one block). The interval must clear on unmount AND on effect re-runs (the `cancelled` flag pattern extends to an interval handle; the `pathname` dep stays). No other consumer of `/api/stats` changes (the dashboard cards fetch their own route-scoped stats separately — the reference's sidebar interval does not touch them; verified in the bundle: the sidebar's `c()` only sets the sidebar state).
- **F2 E2E design:** `page.route("**/api/stats")` + a counter; the test page stays static for 6.5 s; mount fetch (t≈0) + interval (t=5 s) ⇒ ≥ 2 by 6.5 s. No navigation in the window (a route change would add a third fetch — the test must not click). The suite's single-worker topology keeps this deterministic.
- **No existing pin conflicts:** grep for `animation-duration|animation-timing|animation-delay` in the spec file returns nothing (the pins today only assert `animation-name` + classes) — the new assertions add, not contradict. The one retarget: the submit-form pin (`form.animate-rise-in`) becomes the wrapper pin + a form-absence pin.
- **`skills/` exclusion:** unchanged, re-verified at baseline.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The 500 ms tween feels slower to the operator (habituated to our 300 ms spring) | It is the reference's measured behavior — parity is the contract. The E2E pins enforce it from now on. |
| Stagger delays push late items' visibility out (11 tickets ⇒ last card at 500 ms delay + 300 ms animation ≈ 800 ms total entrance) | Exactly the reference's formula (`delay: i*0.05`, no cap — their 6-card list shows the same cascade). Parity, not a defect. |
| The recent-row x-slide collides with the row hover gradient (`hover:bg-gradient...`) | Independent properties (transform vs background); the reference ships both on the same anchor. |
| The 5 s stats interval adds background load | One cheap aggregate query per 5 s (the sidebar is the only consumer; the reference polls the full ticket list — ours is strictly cheaper). The interval clears on unmount (the `return () => clearInterval` cleanup). |
| The submit wrapper animation shifts the error-alert scope (the alert now animates with the wrapper) | The reference wraps [header + alert + card] together (bundle-verified) — the alert riding the wrapper IS the measured contract. |
| Rate-limiter / E2E budget | The new F2 test rides the shared storageState; no new logins. The timing pins read computed styles (no waiting on animations except `toHaveCSS` auto-retry). |
| The reference drifts before push | The F1/F2 contracts were measured THIS session (bundle + live probes); re-verified live in step 4 before commit. |

## 5. Process lessons (for the next agent)

1. **A timing contract measured once and applied everywhere is a single-spring trap.** Session 3 fitted one curve to four different reference animations because the probe reconciled all surfaces to the one it could see. When a surface animates, enumerate its per-surface parameters (axis, duration, easing, stagger) independently — and read the reference's bundle for the exact framer-motion parameters; the live probe then only confirms.
2. **The bundle is a legitimate measurement instrument.** The production JS carries the exact `transition` objects (`duration:.5`, `delay:o*.05`, `x:-20`) — no timing-probe approximation can beat the source values. Paired with live rAF timelines (which confirm the rendered behavior), the two close the loop.
3. **Some surfaces are unmeasurable without credentials — document them, never invent them.** The admin-gated pages exist in the bundle but are invisible to every probe we can run. The parity doctrine (computed styles = ground truth) means unmeasured UI is out of scope by design, and the functional superset covers what we CAN verify.
