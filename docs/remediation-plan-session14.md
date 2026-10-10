# ServiceDesk — Session 14 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 14 follows the session-13 remediation (3 findings — the attachment UI the reference actually ships; commit `9f4183f` + log commits `f7b2159`/`a77d7e9`, briefing docs `docs/session_15.md` + the operator-committed transcript `docs/session_16.md`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live interaction probes + HTTP response-header probes (per `skills/clone-app-pat-pro`). This session's headline surface: **the attachment DOWNLOAD UX and the reference's URL canonicalization** — both are probe-driven discoveries on surfaces that previous sessions measured only at the rendered-DOM layer (the s13 lesson "probe the states, not just the surfaces" applied one layer deeper: past the DOM to the HTTP response).

**Baseline at session start (`a77d7e9`, fresh clone):** lint ✓ typecheck ✓ 55 unit ✓ build ✓ **176/176 E2E** ✓ smoke 11/11 ✓. Session-13 commit `9f4183f` audited CLEAN against its plan (F1 the `space-y-2 mt-4` rows + bare filename + X icon button at `submitticket/page.tsx:313-344`; F2 the neutral Paperclip rows + "Attachment N" labels + `mb-3` heading at `ticketdetails/page.tsx:224-256`; F3 `text-slate-500 py-8` at `:271`). Env contract verified: `.env` from `.env.example` (`DATABASE_URL="file:../db/custom.db"`, generated AUTH_SECRET), `db/` at the repo root pushed + seeded (4 users / 11 tickets / 3 comments), skills/ excluded in all 4 configs (tsconfig/eslint/vitest/playwright). The user's requested env/DB/test-config items are all satisfied by the existing codebase (re-verified this session: `.env.example` matches, the db-path unit tests pass, both test suites run green with skills/ excluded).

---

## 1. Findings Inventory

### F1 (MED-HIGH — download UX parity): the attachment download route forces a browser download where the reference's new tab displays the file inline

The session-13 remediation pinned the detail-page attachment ROWS (markup, labels, icons, `target="_blank"`) and the submit-form rows — but the row's `href` behavior was never followed past the click. Probing the actual HTTP response this session (the s13 lesson, one layer deeper):

**Reference (live-measured this session, logged in, curl on the s13 probe tickets' CDN URLs):**

| Surface | Measured contract |
|---|---|
| CDN file response | `HTTP/2 200`, `content-type: application/pdf`, **NO `Content-Disposition` header** → the new tab renders the PDF inline |
| Redirect chain | `base44.app/api/apps/…/files/mp/public/…` → `302` → `media.base44.com/files/public/…` → `200` with the file |
| New-tab UX | click "Attachment N" → the file DISPLAYS (PDF viewer / text / image); the browser's save-as still works from there |

**Ours:** `/api/tickets/[id]/attachments/[attachmentId]` returns `Content-Disposition: attachment; filename="<sanitized>"` — the new tab immediately triggers a browser DOWNLOAD (an empty tab flashes; the file lands in the download bar). The view-in-new-tab experience — the exact behavior the s13 `target="_blank"` pin implies — is broken by our own header.

**Fix (computed parity):** the disposition swaps to **`inline; filename="<sanitized>"`**. RFC 6266: `inline` displays the entity when the type is renderable (pdf, text, images); the `filename` parameter still supplies the save-as name, and non-renderable types (zip, doc) download with the proper filename exactly as before. The sanitized filename logic, `Content-Type` (the stored, upload-validated mimeType), `Content-Length`, and `Cache-Control: private, max-age=3600` all stay. Safety analysis: the mimeType is validated at upload against the closed `ATTACHMENT_ACCEPTED_TYPES` list (no `text/html`, no `image/svg+xml` — the s10 XSS decision), stored verbatim, and re-served with the same type; `X-Content-Type-Options: nosniff` already ships on every response via `next.config.ts` — inline rendering of the accepted set is safe, and no new type becomes renderable by the change.

### F2 (MED-LOW — head/canonicalization parity): the ticketdetails route's canonical + og:url + twitter:url + breadcrumb JSON-LD item omit the `?id=` query string the reference's URL canonicalization carries

The session-12 sweep pinned the per-route social URL set (canonical + og:url + twitter:url, all three equal) — measured on their auth routes and `/` (routes with NO query params). The reference's platform canonicalizes the **full current URL**; on their query-driven detail route that includes the ticket id — a state the s12 measurement never exercised (the same class of gap as s13's "at-rest only": the set was measured only on query-less routes).

**Reference (live-measured this session, on `/ticketdetails?id=6ac839ba…`):**

| Surface | Measured contract |
|---|---|
| canonical | `https://service-desk-332a5ae4.base44.app/ticketdetails?id=6ac839ba…` (query included) |
| og:url / twitter:url | identical to the canonical (the s12 equality contract holds WITH the query) |
| BreadcrumbList JSON-LD | `{"position": 2, "name": "ticketdetails", "item": "https://…/ticketdetails?id=6ac839ba…"}` — the item URL carries the query too |
| mytickets filters | NO query params pushed (canonical stays `/mytickets`) — the behavior is scoped to ticketdetails |

**Ours:** all three head URLs ship `/ticketdetails` (segment only), and the breadcrumb item ships `…/ticketdetails` — the BARE route, which renders the not-found Alert (the s11 finding). A social card or search snippet for a specific ticket points at the "missing id" state.

**Fix:** the ticketdetails page becomes a server wrapper: `page.tsx` exports `generateMetadata({ searchParams })` (awaited — Next 16) that spreads `routeHead("/ticketdetails?id=" + id)` when an id is present and `routeHead("/ticketdetails")` when not (all three URLs + the full og set stay equal-by-construction via the helper); the 385-line client island moves, byte-unchanged, to `ticket-details-view.tsx` and is rendered by the wrapper. The `BreadcrumbJsonLd` moves from the route layout (which cannot see searchParams) into the wrapper, extended with an optional `query` prop so the ticketdetails item carries `?id=<id>`; the other five routes' breadcrumbs are untouched. The layout keeps its `title` + `routeHead("/ticketdetails")` (the page's metadata overrides per-key, so the title survives and the bare-route case — generateMetadata sees no id — resolves to the same segment URL; no behavior change where no id exists).

### F3 (INFORMATIONAL — no code change; documentation)

- **The reference's CDN attachment URLs are not durable**: the s13 probe's `.txt` URL (`base44.app/api/apps/…/files/mp/public/…`) now returns **404** (the file expired or was pruned); the `.pdf` of the same probe survives via the 302 to `media.base44.com`. Their platform's file URLs have a limited lifetime. Our attachments live in SQLite for the database's lifetime — a retention SUPERSET (data retention is a production feature, never a divergence to close). Documented here + in AGENTS.md; no code change.
- **The touch-hover divergence re-confirmed at the stylesheet layer**: the reference's compiled CSS ships `hover:shadow-xl:hover` as a plain unguarded `:hover` rule (their `index-*.css`, inspected directly) — sticky hover on touch devices; our v4 build media-guards every `hover:` variant (`@media (hover: hover)`), the documented intentional modern-behavior divergence (s7). No change.
- **The reference's platform console warnings persist** (Tailwind-CDN-in-production + the Radix DialogTitle/Description errors) and their SPA titles still go stale on client-side navigation (re-confirmed on /mytickets this session: title stayed "ServiceDesk"). Never mirror.

### Verified NON-gaps (re-checked this session, no action)

- **Standing drift pins — ALL stable** (token block `--primary 0 0% 9%` / `--border 0 0% 89.8%` / `--accent 0 0% 96.1%` / `--sidebar-ring 217.2 91.2% 59.8%` / `--background 0 0% 100%`; bare-button `cursor: pointer`; the `/` dashboard title "ServiceDesk").
- **Mobile navigation (the standing priority) — full matrix on BOTH sites at 375×812**: reference stable (288px sheet `rgb(250,250,250)`, `rgba(0,0,0,0.8)` overlay, scroll lock, Escape → body, sheet STAYS OPEN after nav-tap — the documented quirk; their overflow defect persists: scrollWidth 468 vs clientWidth 375). Ours fully green via the Playwright live probe (`scripts/s14-mobile-matrix.mjs`): scrollWidth 375 = clientWidth (the min-w-0 superset), sheet 288px / `rgb(250,250,250)` / `oklab(0 0 0 / 0.8)` (the 80% black), locked, nav-tap auto-closes + unlocks, Escape closes + focus → body. The Tailwind v4 mobile-nav bug classes from the taxonomy (A–H) all still pass — the 176-test baseline includes the full `mobile-navigation.spec.ts`.
- **Space-y trap-log #4 static scan — CLEAN** (`scripts/s13-space-y-scan.mjs`: no direct-child margin instances).
- **The avg-resolution "N/A" state — parity**: the reference currently has ZERO resolved tickets; their Performance Metrics card renders "N/A" — matching our `formatDuration` contract (never probed before; both render N/A on an empty denominator).
- **The reference's mytickets filters do NOT push query params** (probed: status filter applied → URL + canonical stay `/mytickets`) — F2 stays scoped to ticketdetails.
- **Comment form parity**: placeholder "Add a comment or update…", "Add Comment" button, no native `required`/`maxlength` on the textarea — matches ours (custom validation is the documented superset).
- **formatDateTime on mytickets cards + date-only dashboard rows** — re-verified in the live DOM ("Oct 10, 2026 at 12:36 AM" / "Oct 10, 2026").
- **The reference's head set on the auth routes** — unchanged (the s12 set: description + og:* + twitter:card + apple-web-app + favicon; og:url/twitter:url/canonical all equal).
- **The 5 reference tickets are all `open`** — no closed/resolved ticket exists on their side to probe comment-on-closed behavior against; our comment policy stays a superset decision.

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard (re-confirmed this session); `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; the no-fake-verification signup; permanent SQLite attachment storage (vs their expiring CDN URLs — new this session); the nav-tap auto-close superset; correct SPA titles; `ul/li` + `aria-label` + `title` a11y supersets on the attachment surfaces.

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first** — a session-14 block in `tests/e2e/visual-parity.spec.ts` (5 substantive tests + the bare-route regression guard), verified RED against the pre-fix build (4 failed as designed — the bare-route guard passed, as it must before AND after):
   - F1 (2 tests): a fixture ticket with a `text/plain` attachment is created via `page.request.post("/api/tickets", …)` riding the storageState session; the attachment URL is fetched and pinned to `status 200` + `content-type: text/plain` + **`content-disposition: inline; filename="s14-probe.txt"`**; a second test pins the sanitized-filename survival on a hostile name (`../../etc/passwd` style → `filename="etc_passwd.txt"`-style sanitization, inline). RED against the current `attachment` disposition.
   - F2 (3 tests): on `/ticketdetails?id=<real id>` — canonical + og:url + twitter:url all equal `<base>/ticketdetails?id=<id>` (query included, equality held); the BreadcrumbList JSON-LD's second item URL carries the same query; on the bare `/ticketdetails` — all three URLs stay the segment (no query; the s11 Alert state). RED against the current segment-only URLs.
   - Cleanup: the fixture ticket is deleted via a Prisma script after the run (our API has no DELETE — the reference has no delete affordance either; the s7/s13/s14 `cleanup-*-tickets.mjs` pattern).
2. ✅ **F1 implementation** — the single-line disposition swap in `src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts` (`attachment; filename=` → `inline; filename=`), comment updated to cite the measured reference contract (no Content-Disposition → inline rendering in the new tab).
3. ✅ **F2 implementation** — `ticketdetails/page.tsx` split: the client island moves to `ticket-details-view.tsx` (byte-unchanged logic); the new server `page.tsx` exports `generateMetadata` (reads `searchParams.id`, awaits it, spreads `routeHead` with the query-bearing segment) + renders the view; `BreadcrumbJsonLd` gains an optional `query` prop and moves from the ticketdetails layout into the page (the layout keeps title + routeHead — the page's metadata overrides per-key, so the bare route is unchanged); the other five routes' breadcrumb call sites are untouched.
4. ✅ **Full gate**: lint ✓ typecheck ✓ 55 unit ✓ build ✓ **181/181 E2E** ✓ (176 + 5, zero regressions) smoke 11/11 ✓.
5. ✅ **Live paired re-verification** (production standalone :3000): F1 — 200 + text/plain + `inline; filename="s14-live.txt"`; F2 — canonical + og:url + twitter:url + the breadcrumb item ALL `http://localhost:3000/ticketdetails?id=<id>` (equal, query-bearing); the bare route — segment-canonical, no query. Probe fixtures removed (the canonical 11-ticket seed re-verified: 4 users / 11 tickets / 3 comments). A live browser check confirmed clean hydration on the detail route (zero console errors post-split) + the 288px mobile sheet.
6. ✅ **Refresh `docs/screenshots/`** — the standing 9 + a NEW 10th shot (`10-attachment-inline-view.png` — the attachment URL rendered INLINE in the tab, the F1 remediation documented visually) via `scripts/capture-screenshots-s14.sh` (the s13 lineage carried forward; all FATAL guards green). VLM-verified: shot 10 renders the text file in-page (not a download bar); the dashboard spot-check shows no visual regression from the page split.
7. ✅ **Docs**: README (counts 181/151 + the attachment-row amendment + the session-14 pin paragraph), AGENTS.md (the session-14 contracts section), CLAUDE.md (counts + the response-layer anti-pattern), PAD (the session-14 row + 151 parity), `service-desk_SKILL.md` v2.12.0 (lessons 57–59), `docs/session_17.md`, this plan's execution status, `worklog.md`.
8. ✅ **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only, `--remote` explicit), the full gate re-run green after the last source edit.

## 3. Validation of this plan against the codebase

- **F1**: the route is `src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts:29` — a single `Content-Disposition` header string; the sanitizer (`:24`) and all other headers stay. The upload validation (`validateAttachments` in `src/lib/validation.ts` + `ATTACHMENT_ACCEPTED_TYPES` in constants) pins the closed type list — the inline-safety precondition. `next.config.ts` ships `X-Content-Type-Options: nosniff` on every response. The E2E fixture shape mirrors the documented API contract (`{ title, description, category, priority, attachments: [{ fileName, mimeType, sizeBytes, data }] }`, response `{ ticket }` — verified in the route source and by this session's live probe).
- **F2**: `page.tsx` is a 385-line `"use client"` file whose only navigation dependency is `useSearchParams` + `useParams` (lines 4, 42-44) — both work identically inside the moved view file. `routeHead` (src/lib/route-head.ts) already URL-resolves its segment via `new URL(segment, SITE_URL)` and passes it to `alternates.canonical` + `openGraph.url` — a query-bearing string (`/ticketdetails?id=x`) flows through all three outputs unchanged; the helper needs NO modification. `BreadcrumbJsonLd` (src/components/breadcrumb-jsonld.tsx:16) takes `{ segment }` — the `query` prop is additive. The ticketdetails layout (`layout.tsx:13`) spreads `routeHead("/ticketdetails")` — the page-level generateMetadata overrides `alternates`/`openGraph`/`twitter`/`other` per-key while the layout's `title` survives the merge (Next's metadata merge semantics — the s12 wholesale-replace lesson documented in route-head.ts). No existing E2E pin asserts the ticketdetails head URLs WITHOUT a query: the s12 block drives `/ticketdetails` bare (the bare case keeps the segment URLs — no query added where none exists).
- **Page-export rule**: the new `page.tsx` exports `default` + `generateMetadata` only (the AGENTS.md invariant). The client view file is not a page file — it may export its component freely.
- **Static/dynamic rendering**: generateMetadata awaiting `searchParams` forces the route dynamic (it already renders `ƒ (Dynamic)` in the build output); the client view's `useSearchParams` needs no Suspense boundary on a dynamically-rendered route.
- **No new margin utilities land inside space-y containers** (neither finding touches layout). No token changes; no visual-class changes (F1 is an HTTP header; F2 is head metadata + JSON-LD).
- **skills/ exclusion**: unchanged, re-verified at baseline.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `inline` disposition introduces a content-injection vector | The mimeType is pinned at upload to the closed accepted list (no HTML/SVG — the s10 decision), stored verbatim, re-served identical; `nosniff` ships globally. Only the already-accepted types become inline-renderable — exactly the reference's behavior. |
| The page-split breaks the detail route's client behavior (params, focus, toast flows) | The view file moves byte-unchanged (a pure file rename + import-path fix); the E2E suite's detail-page pins (the s2-s13 blocks) run in the same gate — a regression fails loudly. The E2E also re-verifies hydration cleanliness. |
| generateMetadata + layout metadata merge drops a head field | The helper carries the FULL og set by construction (the s12 mechanism test pins site_name + image survival); the new F2 tests pin the equality of all three URLs WITH the query on the id-bearing route. |
| The fixture ticket pollutes the dev DB | The s7/s13/s14 cleanup-script pattern (Prisma `deleteMany` by title prefix) runs after the E2E fixture and the live verification; the canonical 11-ticket seed is re-counted after. |
| The reference drifts before push | The F1/F2 contracts were measured THIS session (fresh probes); re-verified live in step 5 before commit. |
| Rate-limiter budget | All new tests ride the shared `storageState`; fixtures use `page.request` (no login). The live re-verification reuses the running session. |

## 5. Process lessons (for the next agent)

1. **The response layer is a parity surface too.** Thirteen sessions pinned markup, computed styles, and the head — but the HTTP response behind a link (disposition, content-type, redirect chain) was first probed this session, and it carried a real UX gap. Every user-visible "click → what happens" has a DOM contract AND a response contract.
2. **A pinned set is only pinned on the states it was measured in.** The s12 social-URL set was measured on query-less routes; the reference's canonicalization includes query strings on their one query-driven route. When pinning a mechanism, enumerate its input states (query/no-query is a state axis, like at-rest/active).
3. **Reference platform artifacts age.** Their CDN file URLs expire (the s13 probe's .txt 404s today). Durable storage on our side is a superset to keep — and "the reference's file is gone" must never be read as "delete ours to match."
