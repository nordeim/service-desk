# ServiceDesk — Session 13 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 13 follows the session-12 remediation (2 findings — the per-route social URL set + the space-y trap firing live; commit `dcfc542` + log commits `a73f88d`/`7c462f5`, briefing docs `docs/session_13.md` + the operator-committed transcript `docs/session_14.md`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live interaction probes (per `skills/clone-app-pat-pro`). This session's headline surface: **the attachment UI both sites actually ship** — a probe-driven discovery that the session-8-era comment "the reference has no attachments" was FALSE all along (the same class of stale-belief defect as the s12 og:url finding: a comment nobody re-verified against the live reference for five sessions).

**Baseline at session start (`7c462f5`, fresh clone):** lint ✓ typecheck ✓ 55 unit ✓ build ✓ **167/167 E2E** ✓ smoke 11/11 ✓. Session-12 commit `dcfc542` audited CLEAN against its plan (F1 `src/lib/route-head.ts` wired into all 7 route layouts; F2 the computed-parity margins `mb-2 sm:mb-4` / `mb-2` at `login/page.tsx:372`/`477`). Env contract verified: `.env` from `.env.example` (`DATABASE_URL="file:../db/custom.db"`, generated AUTH_SECRET), `db/` at the repo root pushed + seeded (4 users / 11 tickets / 3 comments), skills/ excluded in all 4 configs (tsconfig/eslint/vitest/playwright).

---

## 1. Findings Inventory

### F1 (MED-HIGH — submit-form parity): the attached-file row state never matched the reference (the "reference has no attachments" comment was false)

The session-3 dropzone measurement covered the at-rest state only (dashed div + hidden input + label — byte-identical on both sites, re-verified this session). The state AFTER a file is attached was never compared because `submitticket/page.tsx`'s session-8 comment claimed "the reference has no attachments" — but the reference ships a full attach UI: `multiple` file input, appended rows, an X remove button, and (verified by submitting probe tickets) a real upload pipeline with CDN-hosted downloads.

**Reference (live-measured this session, logged in, files attached via the real picker path):**

| Surface | Measured contract |
|---|---|
| Row container | `div.space-y-2.mt-4` (follows the dropzone) |
| Row | `flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200` — computed 12px padding, 8px radius, `rgb(248,250,252)` bg, `rgb(226,232,240)` border |
| Filename | `<span class="text-sm text-slate-700 truncate flex-1">{name}</span>` — no emoji, no font-weight, no size display |
| Remove control | shadcn Button base + `h-9 w-9` (36×36) + `hover:bg-red-50 hover:text-red-600`, `lucide-x w-4 h-4` (16×16 icon), `cursor: pointer` |
| Multi-select | appends across successive selections (verified: 1 + 2 + 1 files → 4 rows) |
| Count limit | none visible at 4 files |

**Ours:** container `ul.space-y-2` (no `mt-4`), row `px-3 py-2` (8px vertical), filename `📄 {name}` with `font-medium` + a `.txt`-style size span (`text-xs text-slate-400`), remove = a TEXT button "Remove" (`text-xs text-red-500 hover:text-red-600 font-medium`).

**Fix (computed parity):** row → `p-3`; filename span → `text-sm text-slate-700 truncate flex-1` (emoji prefix, font-medium and the size display removed); remove control → `<Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 hover:text-red-600">` wrapping `<X className="w-4 h-4"/>` (tw-merge dedupes ghost's hover utilities against the custom ones — same mechanism the s4 trigger used); container → `space-y-2 mt-4`. The `ul`/`li` tags stay (our a11y superset, the `p[role=alert]` precedent); the X button gains `aria-label="Remove {fileName}"` (invisible superset). The 3-file / 2 MiB caps stay (documented architecture — the base64-in-SQLite constraint; the reference's own backend limits are invisible).

### F2 (MED — detail-page parity): the ticket-detail attachment display renders the reference's neutral Paperclip rows with the generic "Attachment N" label — ours renders a cyan Download chip with the filename

Verified by submitting two probe tickets to the reference (one 1-file, one 2-file — the s8 probe-ticket precedent; the reference has no delete affordance, documented).

**Reference (live-measured on the probe tickets' detail pages):**

| Surface | Measured contract |
|---|---|
| Section heading (Description) | `<h3 class="font-semibold text-slate-900 mb-2 flex items-center gap-2">` + **`lucide-file-text w-4 h-4 text-cyan-500`** — ours renders the same icon at `w-5 h-5` (20px vs their 16px; the s5 icon-size trap in reverse) |
| Section heading (Attachments) | `<h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">` + **`lucide-paperclip w-4 h-4 text-cyan-500`** — note `mb-3`, not the Description heading's `mb-2` |
| Row container | `div.space-y-2` |
| Row | `<a target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">` |
| Icon | `lucide-paperclip w-4 h-4 text-slate-500` |
| Label | `<span class="text-sm text-slate-700">Attachment 1</span>` — the GENERIC INDEXED label ("Attachment 1", "Attachment 2" — verified with the 2-file ticket), never the filename |
| Placement | inside the left-column ticket card, after Description (ours is too) |
| Card indicators | none (mytickets cards show no attachment badge on either site) |

**Ours:** Description heading icon `FileText w-5 h-5` (16px→20px size gap); attachments heading icon `Download w-5 h-5` + `mb-2` (wrong icon + wrong size + wrong bottom margin); item = cyan chip `inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2 transition-colors` with a Download icon + the FILENAME + a size span; same-tab navigation.

**Fix:** mirror the measured rows (`flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200` + Paperclip `w-4 h-4 text-slate-500` + `text-sm text-slate-700` "Attachment {i+1}") + `target="_blank" rel="noopener noreferrer"`; the Attachments heading → Paperclip `w-4 h-4 text-cyan-500` + `mb-3`; the Description heading icon → `w-4 h-4`. Invisible superset kept: `title={a.fileName}` on the anchor (hover tooltip — the filename stays discoverable without altering the rendered label). Our `/api/.../attachments/[id]` href stays (the streaming route with the sanitized Content-Disposition is our backend equivalent of their CDN link).

### F3 (LOW — detail-page parity): the no-comments empty paragraph computes slate-400 + 24px where the reference computes slate-500 + 32px

Reference: `<p class="text-center text-slate-500 py-8">No comments yet</p>` (computed `rgb(100,116,139)`, `32px 0px`, measured on the reference's no-comment probe ticket). Ours: `text-center text-slate-400 py-6`. Fix: `text-slate-500 py-8`. (The comment-ITEM markup was already byte-parity — s12; only the empty-state paragraph drifted, a session-1-era class never re-measured.)

### Verified NON-gaps (re-checked this session, no action)

- **Standing drift pins — ALL stable**: the `:root` token block (`--primary 0 0% 9%`, `--border 0 0% 89.8%`, `--accent 0 0% 96.1%`, `--sidebar-ring 217.2 91.2% 59.8%`), bare-button `cursor: pointer`, the reference's `/` dashboard title "ServiceDesk" (their home special case).
- **Mobile navigation (the standing priority) — full matrix on BOTH sites at 375×812**: reference stable (288px sheet at `rgb(250,250,250)`, `rgba(0,0,0,0.8)` overlay, scroll lock, Escape → body, sheet STAYS OPEN after nav-tap — the documented reference quirk; their trigger is still blocked by their own toast viewport, the s4 defect). Ours fully green (scrollWidth 375 = clientWidth, sheet 288px/`rgb(250,250,250)`/`oklab(0 0 0 / 0.8)`, locked, nav-tap auto-closes + unlocks, Escape closes + focus → body). The Tailwind v4 mobile-nav bug classes from the taxonomy (A–H) all still pass — 167/167 baseline includes the full `mobile-navigation.spec.ts`.
- **Space-y trap-log #4 static scan — CLEAN**: the stack-based JSX walk finds NO direct-child margin instances (the s12 fix holds; the scanner is committed as `scripts/s13-space-y-scan.mjs`).
- **Submit-success navigation — parity**: the reference navigates to `/mytickets` after a successful submit (probe-verified); ours does too (`router.push("/mytickets")` + our toast superset).
- **Sign-out flow — parity**: the reference's sidebar sign-out navigates straight to `/login` (no confirmation, no toast — probe-verified); ours matches (+ our toast superset).
- **The reference has NO**: status control on the detail page (our owner-side status = genuine superset), sort or scope controls on mytickets (our sort/scope = superset), attachment indicators on ticket cards (matches ours).
- **The reference's SPA titles go STALE on client-side navigation** (probe-verified: link-taps to /mytickets and /submitticket leave the previous page's title; only /dashboard updates — and the post-submit /mytickets keeps "Submitticket | ServiceDesk"). Platform defect, never mirror — our Next.js per-route titles update on every navigation (the s7 superset, spec-pinned).
- **The reference's submit-form validation is native HTML5** (`required` on title/description; empty submit → browser bubbles, no custom error UI, no toasts). Our field-level error Ps + API errors are the documented superset (the s10 auth-form precedent). Ours carries no `required` attrs — our custom validation covers it; do NOT add native bubbles on top.
- **Dropzone at-rest — byte-identical** (`border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-cyan-400 transition-colors`, `id="file-upload"`, same label structure) — the s3 pin holds.
- **Attachment accept list**: the reference's `image/*,.pdf,.doc,.docx` vs our precise extension list (svg excluded — the s10 XSS decision; txt/md/csv/json/zip = functional superset). No change.
- **Comments card header — parity** (`MessageSquare w-5 h-5 text-cyan-500` + "Comments & Updates", `flex flex-col space-y-1.5 p-6 border-b border-slate-100` — re-measured).
- **Multi-select append behavior — identical** (both sites append across successive picker selections).
- **Reference console**: their platform warnings persist (Radix DialogTitle + Tailwind-CDN-in-production); ours zero. Never mirror.

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors (submit + auth); display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; distinct filtered-empty message; the no-fake-verification signup; the Google-not-configured alert; real-size manifest icons; the nav-tap auto-close superset; correct SPA titles (vs their stale-title defect); the attachment caps (3 × 2 MiB); `ul/li` + `aria-label` + `title` a11y supersets on the new attachment rows.

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first** — a session-13 block in `tests/e2e/visual-parity.spec.ts`: 9 substantive tests (5 × F1 + 3 × F2 + 1 × F3) + the superseded s8 pin retarget (`name: "Remove"` → `name: /Remove {fileName}/`), all verified RED against the pre-fix build (10 failed). Two authored-red fixes during the cycle: the slate-50/slate-500 pins joined the session-6 `ACCEPT` lab()-representation map (Tailwind v4 emits palette colors as lab(); the first run failed on `lab(98.1434 …)` / `lab(48.0876 …)` — the documented trap).
2. ✅ **F1** — the attached-row block rewritten (`space-y-2 mt-4` container; `p-3` rows; the bare filename span; the ghost/icon X button with the red hover + `aria-label`; size display dropped; `X` imported).
3. ✅ **F2** — the detail attachment block rewritten (Paperclip `w-4` + `mb-3` heading; neutral rows; Paperclip row icon; "Attachment {i+1}"; target/rel; the `title` tooltip; size span dropped; the Description heading icon `w-5` → `w-4`; `Paperclip` imported, unused `Download` removed).
4. ✅ **F3** — `text-slate-500 py-8`.
5. ✅ **Full gate**: lint ✓ typecheck ✓ 55 unit ✓ build ✓ **176/176 E2E** ✓ (167 + 9 new, zero regressions) smoke 11/11 ✓.
6. ✅ **Live paired re-verification** (production standalone :3000, `scripts/s13-live-verify.mjs`): F1 — pad 12px / radius 8px / bare filename / 36×36 pointer X button / lucide-x w-4 / container mt 16px; F2 — 2 rows labeled "Attachment 1"/"Attachment 2" with the byte-identical neutral class set, `_blank` + `noopener noreferrer`, title tooltip, paperclip heading icon + 12px mb, Description icon 16px; F3 — slate-500 (lab representation) + 32px padding. Probe fixtures removed from the dev DB (canonical 11-ticket seed verified after every step).
7. ✅ **Refresh `docs/screenshots/`** — 9 shots (the standing 7 + the new 08-submit-attachment-row + 09-ticket-detail-attachments) via `scripts/capture-screenshots-s13.sh`. The script ALSO fixed two latent s12-lineage bugs found while executing it: the FATAL guards were doubly broken (the inverted `!=` condition fires on "ok" and passes on "wrong:...", and the `.text-4xl` selector matches nothing on the detail page — the ticket-title h1 is `text-xl`), and the s13 attachment shot needs Playwright's `setInputFiles` (the agent-browser DataTransfer dispatch never reaches React's onChange; the row also sits below the 800px fold — the helper scrolls it into view). VLM-verified: shot 08 shows the row + X button with NO size text; shot 09 shows "Attachment 1"/"Attachment 2" with paperclip icons on neutral gray; zero glitches. The 2-attachment fixture for shot 09 is curl-created and deleted after the shot (the dev DB stays the canonical seed — verified).
8. ✅ **Docs**: README (counts 176/147 + the attachment row in the features table + the session-13 pin paragraph) + AGENTS.md (the session-13 contracts section + the corrected attachment lineage + the screenshot-script guard bugs) + CLAUDE.md (counts + two new anti-patterns: the false feature-set comment, the unprobed active state) + PAD (the session-13 known-issues row + the parity count) + `service-desk_SKILL.md` v2.11.0 (lessons 54–56) + the `docs/session_13.md` retrospective + `docs/session_15.md` narrative log + this plan's execution status + `worklog.md`.
9. ✅ **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only, `--remote` explicit — the wrapper defaults elsewhere), the full gate re-run green after the last source edit: commit `9f4183f`, dry-run then real push, remote verified `refs/heads/main @ 9f4183f == local HEAD`, tracking ref synced, operator key shredded, tree clean.

## 3. Validation of this plan against the codebase

- **F1**: the attached-row block is `submitticket/page.tsx:314-340`; the `Button` component already has `size: "icon"` (`button.tsx:42` — `size-9`) and the ghost variant whose hover utilities tw-merge replaces when the custom classes come later in `className` (the same mechanism the s4 mobile trigger uses: `rounded-lg hover:bg-slate-100 p-2` over the ghost base). `X` needs importing from lucide-react (not currently imported in this file).
- **F2**: the detail block is `ticketdetails/page.tsx:232-253`; `FileText` is already imported (the Description heading at :224 — its icon size drops to `w-4 h-4` per the fresh measurement); `Paperclip` needs an import line; `Download` becomes unused after the swap (no-unused-vars is OFF in this ESLint config — remove it manually). The Description h3's own classes already match (`font-semibold text-slate-900 mb-2 flex items-center gap-2`). The reference's two probe tickets BOTH measure: Description → `file-text w-4`, Attachments → `paperclip w-4` + `mb-3` (the s13 first reading misattributed the Description icon to the Attachments heading via a sibling-walk; the direct h3 enumeration on both tickets is authoritative).
- **F3**: the paragraph is `ticketdetails/page.tsx:271`.
- **Test authoring**: `page.setInputFiles("#file-upload", { name, mimeType, buffer })` is the established pattern (the s8 pin at :1418 uses it); detail-page fixtures can be created via `page.request.post("/api/tickets", { data: { ..., attachments: [{ fileName, mimeType, sizeBytes, data: base64 }] } })` riding the storageState session (the API contract accepts base64 attachments — README API table + `validation.ts`).
- **No new margin utilities land inside space-y containers** (F1's row has no margins; the trap scan re-runs clean post-fix). No token changes; no layout changes outside the two attachment blocks + one paragraph.
- **skills/ exclusion**: unchanged, re-verified at baseline.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The ghost variant's `hover:bg-accent hover:text-accent-foreground` survives tw-merge and double-styles the X button | tw-merge keeps the LAST conflicting utility (`hover:bg-red-50` later) — the same mechanism the s4 trigger proves live; the E2E pin asserts the class set includes the red hover and NOT the accent hover. |
| Removing the size display loses functionality users may rely on | Parity is the contract; the size stays available server-side (validation caps) and on the detail page via the `title` tooltip superset. |
| "Attachment N" hides the filename from keyboard/screen-reader users | The `aria-label` on the remove control + `title` on the anchor carry the filename (invisible supersets); the download filename comes from Content-Disposition. |
| The E2E attachment POST fixture breaks on the base64 shape | The API contract is pinned by unit tests (`validateAttachments`) + the smoke script; the fixture mirrors the documented shape. |
| The s8 superseded-pin retarget misses another "Remove" reference | Grep-verified: the only pin on the text button is `visual-parity.spec.ts:1418`; no other spec or doc references the "Remove" label except the s8 contracts line in AGENTS.md (amended in step 8). |
| The reference drifts before push | The F1/F2/F3 contracts were measured THIS session (fresh probes); re-verified live in step 6 before commit. |
| Rate-limiter budget | All new tests ride the shared `storageState`; detail fixtures use `page.request` (no login). The live re-verification reuses the running session. |

## 5. Process lessons (for the next agent)

1. **An unverified claim about the reference's FEATURE SET is a finding waiting to happen.** "The reference has no attachments" shipped as a code comment in session 8 and survived five sessions — while the reference's file input, row UI, X buttons, CDN pipeline, and detail-page rendering sat one probe away. Feature-level claims ("they don't have X") need the same live re-verification cadence as style-level claims.
2. **Probe the states, not just the surfaces.** The s3 dropzone measurement pinned the at-rest markup; the attached state (the state users spend time in) was never measured. Every interactive surface has at least two contracts: at-rest and active.
3. **The reference's platform defects keep accumulating documentation value.** The stale-SPA-title defect and the native-bubble validation are now recorded so no future session "fixes" toward them or away from them by accident.
4. **Generic labels can be parity too.** "Attachment 1" is worse UX than a filename — but parity is the contract; supersets ride INVISIBLE channels (aria-label, title) where the reference shows none.
