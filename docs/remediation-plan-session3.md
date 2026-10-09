# ServiceDesk — Session 3 Remediation Plan

**Date:** 2026-10-09
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, closure of the two open known issues from the PAD (hosted CI + `prefers-reduced-motion`), and full re-verification.
**Method:** Ground truth = computed styles + class-attribute DOM diffs extracted from the LIVE reference via agent-browser (per `skills/clone-app-pat-pro`). Reference DOM dumps: `/tmp/s3-ref/*.html`; clone dumps: `/tmp/s3-clone/*.html`. Entrance-animation parameters measured with a Playwright MutationObserver probe (`/home/z/my-project/scripts/probe-motion.mjs`) because the animation completes faster than CLI round-trips can sample.

---

## 1. Findings Inventory

### A. Reference behavior measurements (new this session)

| Measurement | Value | Source |
|---|---|---|
| Entrance animation initial state | `opacity: 0; transform: translateY(20px)` | MutationObserver on client-side nav |
| Entrance animation settle | `opacity: 1; transform: none`, **spring with ~12% overshoot** (dips to `translateY(-2.37px)`), total **~310 ms** | style-change log, mytickets card |
| Stat-card stagger | **None** — all 4 cards start at the same timestamp | dashboard style log |
| Motion-wrapped elements | dashboard: 4 stat cards + each recent-ticket row (the Recent Tickets card itself is NOT wrapped) · mytickets: each ticket card · submitticket: the form card · ticketdetails: one wrapper around back-button + grid · login: **none** | per-page `[style*=opacity]` counts |
| Dashboard recent-row tile | `FileText` SVG `w-6 h-6 text-cyan-600` — **not** the category emoji, no `text-2xl` | ref dashboard DOM |
| Dashboard recent-row title | wrapped in `flex items-start justify-between gap-4 mb-2` **with** `ArrowRight w-5 h-5` (hover slide) — session 2's "no arrow" reading is superseded by today's live DOM | ref dashboard DOM |
| Dashboard recent-row badges | status + priority only — **no category badge** | ref dashboard DOM |
| Dashboard recent-row date | **date-only** ("Oct 9, 2026"), `text-xs text-slate-500 font-medium` (mytickets cards keep the full "Oct 9, 2026 at 12:47 AM") | ref dashboard + mytickets DOM |
| Badge text case | **lowercase** everywhere: "open", "medium", "medium priority", "hardware" | ref DOM (dashboard, mytickets, detail) |
| Priority select trigger value | `<span class="text-blue-600">Medium - Normal</span>` (blue) | ref submitticket DOM |
| Category select trigger value | `<span class="flex items-center gap-2"><span>🖥️</span>Hardware Issue</span>` (emoji in own span) | ref submitticket DOM, live interaction |
| Submit card header icon | `lucide-circle-alert w-5 h-5 text-cyan-500` (clone uses `Info`) | ref submitticket DOM |
| Attachments dropzone | `div.border-2.border-dashed.border-slate-300.rounded-xl.p-6.hover:border-cyan-400.transition-colors` > hidden input + `label.flex.flex-col.items-center.cursor-pointer`; icon = `lucide-upload w-8 h-8 text-slate-400 mb-2`; sub-text "Images, PDFs, or documents" `text-xs text-slate-500 mt-1` | ref submitticket DOM |
| Submit footer | `div.flex.justify-end.gap-3.pt-4` **inside** the space-y-6 body — **no border-t card footer**; submit button = `Send w-4 h-4 mr-2` + "Submit Ticket"; plain outline `Cancel` (type=button) before it | ref submitticket DOM |
| Login card footer | reference shows an **empty** `sm:hidden` nbsp div below the card — no visible caption (clone renders "ServiceDesk — IT Support Portal" at all sizes) | ref login DOM |
| MyTickets search icon | `w-5 h-5` (clone: `w-4 h-4`) | ref mytickets DOM |
| Info-panel labels (detail) | `text-xs font-semibold text-slate-500 uppercase tracking-wide` (clone: `tracking-wider`) | ref detail DOM |
| `<main>` (SidebarInset) | `class="flex-1 flex flex-col"` — transparent, no `bg-background`/`relative`/`w-full` (clone keeps shadcn defaults incl. opaque `bg-background`) | ref all pages |
| Active nav at `/` | reference lands on `/` after login and does **NOT** highlight Dashboard there (their isActive misses the root); at `/dashboard` it does (gradient + white text — measured) | live reference, both URLs |

### B. VLM screenshot claims — verification ledger (computed styles = truth)

| Claim | Verdict |
|---|---|
| Clone sidebar icon-only (no text labels) | **FALSE** — DOM: all 3 links render text, `offsetWidth > 0` |
| Reference active nav has no gradient | **FALSE at /dashboard** (computed `linear-gradient(to right, rgb(6,182,212), rgb(37,99,235))`); true only at the `/` quirk |
| Stat-card icon tiles tinted only in clone | **FALSE** — reference tiles compute the same violet/orange/blue/emerald gradients |
| Clone category select shows "Medium - Normal" | **FALSE** — DOM shows placeholder "Select category" |
| Reference "Back" is a plain text link | **FALSE** — `<a><button class="inline-flex…border…">` (button look) |
| Reference footer has an external-link icon | **FALSE** — identical `log-out w-4 h-4` button (DOM-diffed) |
| Clone mobile menu missing nav icons | **FALSE** — DOM: all 3 links carry SVG icons |
| Upload icon differs (arrow-up vs cloud) | **TRUE** — ref `lucide-upload`, clone `UploadCloud` |
| Badge capitalization differs | **TRUE** — reference lowercase (see A) |

### C. Parity gaps to fix

| ID | Severity | File(s) | Gap | Fix |
|---|---|---|---|---|
| C1 | HIGH | `src/components/ticket-bits.tsx` (RecentTicketRow) | Tile uses category emoji + `text-2xl`; missing title/arrow wrapper; renders CategoryBadge; full datetime | FileText icon `w-6 h-6 text-cyan-600`; `flex items-start justify-between gap-4 mb-2` wrapper + `ArrowRight w-5 h-5` (hover slide); drop CategoryBadge; date-only via new `formatDate` |
| C2 | HIGH | `src/components/ticket-bits.tsx` (all 3 badges) | `capitalize` class → "Open"/"Medium"/"Hardware" | Remove `capitalize` — reference renders lowercase |
| C3 | HIGH | `globals.css` + dashboard/mytickets/submitticket/ticketdetails pages | No entrance animations (reference: opacity 0→1 + translateY(20px)→0, spring ~310 ms, no stagger) | CSS `@keyframes rise-in` + `@utility animate-rise-in` (cubic-bezier(0.34, 1.56, 0.64, 1), 0.3 s, `backwards`) applied to: 4 stat cards, each recent row, each mytickets card, submit form card, detail back+grid wrapper; `motion-reduce:animate-none` everywhere |
| C4 | MED | `src/app/(app)/submitticket/page.tsx` | Header icon `Info`; priority value not blue; dropzone structure/icon/text; footer has `border-t px-8 py-6`; submit button lacks Send icon | `CircleAlert w-5 h-5 text-cyan-500`; SelectValue children `<span class="text-blue-600">`; reference dropzone (div + label + `Upload` icon + `p-6` + sub-text w/o limits); footer `flex justify-end gap-3 pt-4` inside body; `Send w-4 h-4 mr-2` |
| C5 | LOW | `src/app/login/page.tsx` (+ signup/forgotpassword for consistency) | Visible caption under card (reference: none) | Remove the caption |
| C6 | LOW | `src/app/(app)/mytickets/page.tsx` | Search icon `w-4 h-4` | `w-5 h-5` |
| C7 | LOW | `src/app/(app)/ticketdetails/page.tsx` | Info labels `tracking-wider` | `tracking-wide` |
| C8 | MED | `src/components/ui/sidebar.tsx` (SidebarInset) | main = `bg-background relative flex w-full flex-1 flex-col` (+ inset-variant classes) — opaque bg over the app gradient; reference = `flex-1 flex flex-col` | Render exactly `flex-1 flex flex-col` (documented vendored divergence) |
| C9 | MED | `src/app/(app)/submitticket/page.tsx` | Category trigger value plain text | `<span class="flex items-center gap-2"><span>{emoji}</span>{label}</span>` (DOM parity; visually identical) |

### D. Known open issues (PAD §10) — closing this session

| ID | Issue | Fix |
|---|---|---|
| D1 | No hosted CI (MEDIUM) | `.github/workflows/ci.yml`: bun install → prisma generate → lint → typecheck → unit → build; separate e2e job (playwright chromium + `bun run test:e2e`, self-contained per playwright.config.ts) on push/PR to main |
| D2 | No `prefers-reduced-motion` (LOW) | Global reduced-motion block in `globals.css` (standard a11y pattern: near-zero animation/transition durations) + `motion-reduce:animate-none` on the new entrance utility |
| D3 | `vitest.config.ts` header comment still describes the orbital scaffolding | Rewrite comment for the ServiceDesk seams |
| D4 | Coverage threshold (LOW) | **Deferred** (documented; suite is small and convention-gated) |

### E. Intentional divergences (documented, do NOT "fix")

- **`/` → `/dashboard` redirect:** the reference serves its dashboard at `/` without highlighting the Dashboard nav item (their isActive misses the root route — verified live). The clone redirects to the canonical `/dashboard` where the item highlights (matching the reference's own behavior at `/dashboard`). Keep — better UX, E2E-pinned since session 1.
- **Mobile sheet auto-close on navigate** (reference keeps it open) — superset, E2E-pinned.
- **`asChild` anchors instead of the reference's `<a><button>` nesting** — identical computed styles, valid HTML/a11y.
- **Superset affordances** (sort/scope controls, comment counts on cards, Update Status panel, attachments, signup/forgot-password, health endpoint) — styled to stay quiet.
- **Date formats:** mytickets cards + detail panel keep the full reference datetime; only the dashboard recent rows switch to date-only (per C1).

---

## 2. Execution Plan (TDD)

Phase order — tests first, then code, then gates:

1. **Red unit tests:** `formatDate` (new util in `src/lib/utils.ts`) — reference shape "Oct 9, 2026", string + Date inputs.
2. **Red E2E parity tests** (extend `tests/e2e/visual-parity.spec.ts`):
   - recent-row contract: FileText SVG tile (no `text-2xl`), title/arrow wrapper, no category badge, date matches `/^[A-Z][a-z]{2} \d+, \d{4}$/`
   - badge case: mytickets + detail badges match `/^(open|in progress|resolved|closed|low|medium|high|urgent|hardware|software|network|access|email|other)( priority)?$/`
   - submit form: header icon is circle-alert SVG; priority trigger value carries `text-blue-600`; dropzone contains `lucide-upload`; footer row has `pt-4` and no `border-t`; submit button contains `lucide-send`
   - entrance animations: stat cards + recent rows + mytickets cards + submit card + detail wrapper carry `animate-rise-in`; `animation-name: rise-in` computed; with `reducedMotion: "reduce"` the computed `animation-name` becomes `none`
   - login card: no caption text below the card
   - main element: `class` starts with `flex-1 flex flex-col` and lacks `bg-background`
3. **Implement C1–C9** (each = one verifiable change; run the affected specs after each group):
   - C8 (SidebarInset) → re-run mobile-navigation + visual-parity
   - C2 (badges) → visual-parity
   - C1 + formatDate (C1) → dashboard + visual-parity
   - C3 (animations + reduced-motion + keyframes) → all page specs
   - C4 + C9 (submit) → visual-parity
   - C5, C6, C7 → login + mytickets + detail specs
4. **D1–D3** (CI workflow, vitest comment).
5. **Full verification gate:** `lint → typecheck → test → build → test:e2e → smoke`.
6. **Live re-verification** with agent-browser: re-extract computed styles for every fixed contract; confirm parity; re-test the mobile menu (open/overlay/Escape/auto-close) on the clone.
7. **Refresh `docs/screenshots/`** (7 shots from the dev server).
8. **Update docs:** README/AGENTS/CLAUDE/PAD deltas (counts, new contracts, known-issues table), `service-desk_SKILL.md` → v2.1.0, `.env.example` audit (no change expected).
9. **Update worklogs**, commit, push via `docs/ssh_git_wrapper_v3.py` (main only).

## 3. Validation of this plan against the codebase

- Every C-item was verified by reading the current source file AND the live reference DOM this session (dumps in `/tmp/s3-ref/`, `/tmp/s3-clone/`).
- Existing E2E assertions audited for collision: the "Open"/"In Progress" `getByText` hits are sidebar quick-stats labels and dashboard stat-card labels (not badges — unaffected by C2); badge filters already use lowercase regexes (`/^(open|in progress|…)$/`); the priority-badge "priority word" contract (session 2) is preserved — only the case changes.
- `formatDate` does not exist yet (verified); `formatDateTime` stays for mytickets/detail (reference-verified).
- Radix `SelectValue` renders children in place of the selected item's text (C4/C9 pattern) — verified against the vendored `src/components/ui/select.tsx`.
- CI feasibility: `playwright.config.ts` is self-contained (global-setup pushes + seeds `db/e2e.db`; webServer boots the standalone build on :3100); every gate command runs green locally this session.
- Tailwind v4 cautions honored: new utility via `@utility` (CSS-first); animation uses `backwards` fill so no residual transform blocks hover transitions; no plain-utility overrides of variant-styled primitives introduced.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Entrance animations break geometry-waiting E2E (sheet 500 ms waits, boundingBox) | Animations apply to page content, not the sheet; fill-mode `backwards` leaves no residual transform; run the full E2E suite after C3 |
| Removing `border-t` footer changes submit-card height expectations in specs | No spec pins the footer; the new `pt-4` row is pinned by a new test |
| `bg-background` removal exposes the wrapper gradient behind pages | Every page root paints its own full-coverage gradient (min-h-screen) — verified in all 5 page sources; E2E parity specs pin the page gradients |
| CI e2e job fails in GitHub's environment (never run there before) | Job mirrors the exact local gate; Chromium via `bunx playwright install --with-deps`; if it flakes, the fast job still gates lint/typecheck/unit/build |
| Reference site data is volatile (DB resets) | All probes use computed styles/structures, never data |
