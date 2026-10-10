# ServiceDesk — Session 15 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 15 follows the session-14 remediation (2 findings — the inline attachment download UX + the ticketdetails URL canonicalization; commit `cd18869` + the operator's log commits `a77d7e9`/`74a0843`, briefing docs `docs/session_17.md` + the operator-committed transcript `docs/session_18.md`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live interaction probes + HTTP response-header probes (per `skills/clone-app-pat-pro`). This session's headline surface: **the session-17 shortlist itself** — the attachment route's HTTP caching semantics, the formatDateTime locale under a non-US browser (which resolved to a NON-gap but exposed the timezone axis), and the CDN URL lifetime question (which turned out to be a probe-method artifact — see F3).

**Baseline at session start (`74a0843`, `git pull` refresh — the workspace survived):** lint ✓ typecheck ✓ 55 unit ✓ build ✓ **181/181 E2E** ✓ smoke 11/11 ✓. Session-14 commit `cd18869` audited CLEAN against its plan (F1 the `inline; filename="<sanitized>"` disposition at the route's header block; F2 the server-page wrapper — `generateMetadata` awaiting searchParams, `routeHead("/ticketdetails?id=<id>")`, the breadcrumb with the `query` prop moved into the page, the client island byte-unchanged in `ticket-details-view.tsx`). Env contract verified standing: `.env` (`DATABASE_URL="file:../db/custom.db"`, AUTH_SECRET present), `db/` at the repo root with the canonical 11-ticket seed, `skills/` excluded by construction in all 4 configs (tsconfig/eslint/vitest/playwright), `.env.example` matching the codebase. The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session).

---

## 1. Findings Inventory

### F1 (LOW-MED — cache semantics): the attachment download route serves a one-hour private cache window where the reference's CDN serves a year-long immutable window

The session-17 shortlist asked: "the attachment route's HTTP caching semantics vs the CDN's." A fresh probe ticket ("S15 CDN cache probe") was submitted on the reference carrying a `.txt` attachment, and the fresh CDN URL was fetched **from inside the authenticated page** (a plain unauthenticated fetch of the `base44.app` hop is a 404 — the auth gate lives at the redirect hop; the underlying `media.base44.com` URL serves publicly).

**Reference (live-measured this session, fresh URL + the direct media URL):**

| Surface | Measured contract |
|---|---|
| CDN file response (redirect hop) | `302` → `media.base44.com/files/public/...` |
| Media file response | `HTTP/2 200`, `content-type: text/plain`, **`cache-control: public, max-age=31536000, immutable`** |
| Validators | `etag`, `last-modified`, `accept-ranges: bytes` (the underlying Wix-media file store's exhaust) |
| Content-Disposition | none (the s14 inline-display contract — unchanged) |
| Auth posture | the media URL is publicly fetchable by URL; CORS `access-control-allow-origin: *` |

**Ours:** `Cache-Control: private, max-age=3600` — a one-hour window. The user-visible delta: revisit an "Attachment N" after an hour → ours re-fetches from the server (a fresh 200); the reference serves from the browser cache without a network hit (for a full year).

**Fix (computed parity):** `Cache-Control: private, max-age=31536000, immutable`. Reasoning per part:
- `max-age=31536000, immutable` — the reference's window, and factually correct in our model: attachments have no mutation path (created once at upload, no update route, no delete route — the API surface has no way to change a stored attachment's bytes), so a year-long immutable window can never serve stale content.
- `private` STAYS (deliberate divergence from the CDN's `public`): our route is owner-scoped (401 without a session) and our attachment URLs are not publicly fetchable by design. The reference's `public` + publicly-fetchable media posture is their platform's decision, not a contract to mirror — same reasoning class as the s14 "their CDN URLs expire ≠ delete ours".
- No ETag/Last-Modified/Accept-Ranges: with a year-long immutable window, a compliant client never revalidates, so the validators are dead weight on our route (they exist on the CDN because the underlying file store serves arbitrary files to arbitrary clients). Not parity-meaningful.

### F2 (MED-HIGH — date rendering timezone): our date formatters render the viewer's local time; the reference renders the stored UTC wall-clock — every non-UTC viewer sees different times on the two sites

The session-17 shortlist asked for "a re-probe of their formatDateTime locale under a non-US browser locale." The locale axis resolved as a NON-gap (below) — but running the paired probe under a **non-UTC timezone** exposed a real divergence the fourteen prior sessions never saw (every probe and every E2E run executes in a UTC environment, where the two behaviors are byte-identical).

**Reference (live-measured this session, Playwright context `locale: de-DE, timezoneId: Europe/Berlin`):**
- A ticket created at `04:29:35Z` renders **"Oct 10, 2026 at 4:29 AM"** under Berlin (UTC+2) — i.e. the **UTC wall-clock digits**, not browser-local (which would be "6:29 AM").
- Mechanism (measured, not guessed): their API returns **naive datetime strings** — `"created_date":"2026-10-10T04:29:36.328000"` (no `Z`, no offset; XHR-intercepted on their mytickets fetch). The browser parses a naive string as LOCAL time and formats it back as LOCAL — the digits round-trip, so every viewer on Earth sees the stored (UTC) wall-clock. This is the classic naive-datetime round-trip; it is the reference's de-facto rendering contract: **dates display the server's UTC wall-clock, timezone-free.**

**Ours (live-measured this session, same context against the production build on :3000):**
- A ticket created at `02:17:50.583Z` renders **"Oct 10, 2026 at 4:17 AM"** under Berlin — i.e. **viewer-local** (02:17Z + 2h = 04:17 Berlin). Our API returns Z-suffixed ISO (Prisma serialization), the browser resolves the true instant, and `Intl.DateTimeFormat` renders it in the viewer's timezone.
- Consequence: for the same underlying ticket instant, the reference and our clone render **different strings to every non-UTC viewer** (the operator's own browser is Asia/Singapore, UTC+8 — the divergence is visible in the operator's primary environment today).

**Fix:** `timeZone: "UTC"` in both formatters' `Intl.DateTimeFormat` options (`formatDateTime` + `formatDate` in `src/lib/utils.ts` — the single seam; every date in the UI flows through these two functions: mytickets cards, detail createdAt/updatedAt/comment timestamps, dashboard recent rows). Rendered digits become the stored UTC wall-clock for every viewer — exactly the reference's behavior. Zero impact for UTC viewers (the E2E suite, CI, and the reference's own hard-load rendering are all unchanged); the change only affects non-UTC browsers, where our output becomes reference-identical. This is a parity fix, not a superset divergence: the rendered timestamps ARE page content (not chrome), and the reference's UTC rendering is a stable, legitimate design for a global service desk — not a defect like stale SPA titles.

### F3 (DOCUMENTATION — no code change): the session-14 "CDN URLs are not durable" finding was a HEAD-method artifact of the base44 file proxy — every probe URL from s13/s15 still serves via GET

The s14 session recorded "the s13 probe's .txt URL 404s today" as evidence that the reference's CDN URLs expire. This session's re-probe found the URL alive — and the difference is the **HTTP method**:
- `HEAD` on the `base44.app/api/apps/.../files/mp/public/...` hop → **404** (the file proxy does not implement HEAD).
- `GET` on the same URL → **302** → `media.base44.com/files/public/...` → **200** with the file (publicly, no auth).

Both the s13 `.txt`, the s13 `.pdf`, and this session's fresh `.txt` URL serve 200 via GET today. The s14 evidence (and this session's first two probes, which also used `curl -I`/HEAD before the correction) hit the method artifact. Corrections to land in the living docs (AGENTS.md session-14 section + the SKILL lesson):
- The "CDN URLs are not durable / expire" claim is retracted as unproven (the 404s were HEAD artifacts). The **design-level** durability contrast stands as reasoning (their URLs are opaque redirect-hop URLs that could rotate; ours are permanent SQLite rows), but no measured lifetime evidence exists.
- New probe lesson: **the HTTP method is part of the measurement.** A 404 on HEAD is not a 404 on GET — probe with the method the browser actually uses (GET), or follow redirects explicitly. (The s14 plan's own §5 lesson "the response layer is a parity surface too" gains its corollary: the response layer must be probed with the right verb.)

### Verified NON-gaps (re-checked this session, no action)

- **The locale axis of the s17 shortlist — the reference pins en-US formatting**: under `de-DE` and `ja-JP` browser locales, their mytickets cards render "Oct 10, 2026 at 4:29 AM" (en-US digits + the "at" separator + AM/PM). Ours pins `"en-US"` in both formatters — identical behavior. No divergence.
- **Standing drift pins — ALL stable**: the `:root` token block (`--primary 0 0% 9%` / `--border 0 0% 89.8%` / `--accent 0 0% 96.1%` / `--sidebar-ring 217.2 91.2% 59.8%` / `--background 0 0% 100%`), the sidebar panel `rgb(250, 250, 250)` (#fafafa), the bare-button `cursor: pointer` (the v3 preflight), the auth-route head set (canonical + og:url + twitter:url all equal, title at the root default).
- **Mobile navigation (the standing priority) — full matrix on BOTH sites at 375×812**: reference stable (288px sheet #fafafa, 80% overlay, scroll lock, their horizontal-overflow defect persists at 468 vs 375; their toast viewport still blocks their own mobile trigger — re-confirmed via a real click attempt that agent-browser rejected with "element is covered"; their sheet left the body scroll-locked after a JS-clicked nav-tap — the platform defect cluster, never mirror). Ours fully green via `scripts/s14-mobile-matrix.mjs`: scrollWidth 375 = clientWidth (the min-w-0 superset), sheet 288px / `rgb(250,250,250)` / `oklab(0 0 0 / 0.8)` overlay, locked while open, nav-tap auto-closes + unlocks, Escape closes + focus → body.
- **The hard-load ticketdetails head set — the s14 contract, no drift**: on a hard load of `/ticketdetails?id=6ac839ba…`, the reference's canonical + og:url + twitter:url + the BreadcrumbList JSON-LD item all carry `?id=` — exactly what our s14 implementation ships.
- **The reference's SPA client-side navigation leaves the head STALE** (new this session): after an in-app link-tap from /mytickets to /ticketdetails, their canonical/og:url/JSON-LD still carry the mytickets values (only `location.href` changes). The extends the s13 stale-title defect to the whole head set — their platform defect, never mirror (our server-rendered head is always route-correct).
- **Space-y trap-log #4 static scan — CLEAN** (`scripts/s13-space-y-scan.mjs`).
- **The reference's dev-DB-facing probes**: this session's "S15 CDN cache probe" ticket stays on the reference (no delete affordance — the s8/s13 precedent); our dev DB was re-verified canonical (4 users / 11 tickets / 3 comments) after the s14-matrix + cache-semantics fixtures were cleaned.

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; the no-fake-verification signup; permanent SQLite attachment storage (vs their opaque redirect-hop URLs); the nav-tap auto-close superset; correct SPA titles + route-correct head; the **`private` (not `public`) cache scope on the auth-scoped attachment route** (new this session); `ul/li` + `aria-label` + `title` a11y supersets on the attachment surfaces.

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. **Red tests first** — a session-15 block in `tests/e2e/visual-parity.spec.ts` (3 substantive tests), plus hardened unit pins in `src/lib/__tests__/utils.test.ts`:
   - F1 (1 E2E test): a fixture ticket with a `text/plain` attachment is created via `page.request.post("/api/tickets", …)` riding the storageState session; the attachment URL is fetched and pinned to `cache-control` **exactly** `private, max-age=31536000, immutable` (plus the standing inline-disposition + 200 + content-type sanity). RED against the current `private, max-age=3600`.
   - F2 (2 E2E tests): a **Singapore-timezone browser context** (`browser.newContext({ ...devices["Desktop Chrome"], storageState, timezoneId: "Asia/Singapore" })`) drives `/mytickets` and `/dashboard`; the first ticket card's date span (and the first recent-row date) is read, the same ticket's `createdAt` is fetched in-page from `/api/tickets`, and the rendered text is asserted EQUAL to the UTC rendering of that instant (computed in-test via `Intl.DateTimeFormat("en-US", { timeZone: "UTC", … })`). RED: ours renders the SGT wall-clock — a +8h offset always changes the time digits (and can shift the date), so the mismatch is deterministic. GREEN: with `timeZone: "UTC"` the rendered digits equal the UTC wall-clock for every viewer.
   - Unit hardening (RED under `TZ=Asia/Singapore bun run test` — the container's default TZ is UTC, so the RED verification forces the timezone): `formatDateTime("2026-10-09T23:47:00.000Z")` pinned to `"Oct 9, 2026 at 11:47 PM"` and `formatDate("2026-12-01T09:15:00.000Z")` pinned to `"Dec 1, 2026"` (replacing the tolerant `/^(Nov 30|Dec 1), 2026$/` regex — that tolerance was exactly the timezone-dependence smell). After the fix the pins hold under ANY runner timezone.
   - Cleanup: the fixture ticket is deleted via the `cleanup-*-tickets.mjs` Prisma pattern after the run (our API has no DELETE — the reference has no delete affordance either).
2. **F1 implementation** — the single header string in `src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts` (`private, max-age=3600` → `private, max-age=31536000, immutable`), comment updated to cite the measured CDN contract + why `private` stays (owner-scoped route; their public posture is not a contract) and why no validators (immutable ⇒ no revalidation).
3. **F2 implementation** — `timeZone: "UTC"` added to both `Intl.DateTimeFormat` option objects in `src/lib/utils.ts`, with the measured-contract comment (the reference's naive-datetime round-trip renders the stored UTC wall-clock to every viewer; our Z-suffixed ISO + `timeZone: "UTC"` renders the same digits — the s17-shortlist locale probe's companion finding).
4. **Full gate**: `bun run lint && bun run typecheck && bun run test && bun run build` — then `bun run test:e2e` (184 expected: 181 + 3) and `bash scripts/smoke-test.sh`.
5. **Live paired re-verification** (production standalone :3000): the attachment route's headers re-fetched (the immutable year-long private window); the Singapore-context probe re-run against our build (rendered dates = UTC wall-clock, matching the reference's paired measurement); the canonical 11-ticket seed re-verified after fixture cleanup.
6. **Refresh `docs/screenshots/`** — the standing 10-shot set via the s15 lineage capture script (the s14 lineage carried forward).
7. **Docs**: README (counts + the session-15 paragraph), AGENTS.md (the session-15 contracts section + the F3 correction to the s14 CDN-lifetime claim), CLAUDE.md (counts + the probe-method anti-pattern), PAD (the session-15 known-issues row + parity count), `service-desk_SKILL.md` v2.13.0 (the new lessons), `docs/session_19.md` (this session's narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
8. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only, `--remote` explicit), the full gate re-run green after the last source edit.

**Execution status (2026-10-10, all green):**
1. ✅ RED: 3 E2E tests + TZ-hardened unit pins — E2E 3/3 failed for the designed reasons (the F2 mytickets failure showed the live-measured divergence: expected "4:46 AM", received "12:46 PM"); unit pins failed under `TZ=Asia/Singapore`/`Pacific/Honolulu`, green at UTC.
2. ✅ F1: `private, max-age=31536000, immutable` + the reasoning comment.
3. ✅ F2: `timeZone: "UTC"` in both formatters (one pre-existing unit test's naive-shorthand inputs hardened to Z-suffixed instants — they shifted under the pin at non-UTC runner TZs).
4. ✅ Gates: lint ✓ typecheck ✓ 56 unit ✓ (green at FIVE runner timezones) build ✓ **184/184 E2E** ✓ smoke 11/11 ✓.
5. ✅ Live re-verification: the attachment headers measured on the production build; the Berlin-context probe renders "Oct 10, 2026 at 4:51 AM" for a 04:51:23Z ticket — the reference's paired rendering; canonical seed re-verified after fixture cleanup.
6. ✅ Screenshots: the standing 10-shot set refreshed (`scripts/capture-screenshots-s15.sh`), VLM-verified (shot 04 format + layout; shot 10 inline text).
7. ✅ Docs: README, AGENTS.md (the session-15 contracts + the F3 correction), CLAUDE.md, PAD, SKILL v2.13.0 (lesson 59 repaired + corrected; lessons 60-62), session_19.md, this status block, worklog.md.
8. ✅ Commit + push via the SSH wrapper (main only).

## 3. Validation of this plan against the codebase

- **F1**: the route is `src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts:38` — a single `Cache-Control` header string; the sanitizer, disposition, and content-type stay. No existing E2E pin or smoke assertion references `max-age` (verified by grep — only the sidebar's cookie `max-age` constant matches, which is a different surface). The s14 E2E pins (inline disposition, hostile-name sanitization) are untouched by the change and re-run in the same gate.
- **F2**: the seam is exactly `src/lib/utils.ts` (`formatDateTime` for mytickets cards + detail createdAt/updatedAt + comment timestamps; `formatDate` for dashboard recent rows) — verified by grep that NO other `Intl`/`toLocale` call exists in `src/` (the sidebar cookie + `Date` usage elsewhere are non-rendering). The formatters are unit-tested (4 pins hardened) and the rendered surfaces are E2E-covered by the existing session-3 format pins — which run in a UTC context and are therefore unaffected (the fix is a no-op under UTC: the current E2E suite stays green, verified in the gate).
- **The F2 E2E test's context strategy**: Playwright's `browser` fixture is available inside test workers; a manual `browser.newContext` with `timezoneId` + the shared `storageState` file (`tests/e2e/.auth/user.json`, produced by the setup project) reproduces the suite's auth pattern without a second login (the rate-limiter budget). The mytickets card selector (`main a[href*="ticketdetails"] span.text-sm.text-slate-500`) and the dashboard row selector (`main span.text-xs.text-slate-500.font-medium`) match the committed components' DOM (`ticket-bits.tsx` TicketCard / RecentTicketRow).
- **`Intl` with `timeZone: "UTC"`** is supported in all target environments (Node ≥ 20, Chromium — the E2E runner; the standalone server never renders these strings — they are client-island formatted).
- **No new margin utilities land inside space-y containers**; no token changes; no visual-class changes (F1 is an HTTP header; F2 changes rendered digit content only, for non-UTC viewers, toward the reference's values).
- **skills/ exclusion**: unchanged, re-verified at baseline.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The year-long cache window serves stale bytes if an attachment ever changes | No mutation path exists (no update/delete route for attachments; the only writes are at creation). If a future feature adds mutation, the cache header must be revisited — the route comment says so. |
| `timeZone: "UTC"` changes rendered dates for existing non-UTC users | That is the parity intent: the reference renders the same UTC wall-clock to those users. For UTC users (the E2E suite, CI, and the reference's own hard-load rendering), the output is byte-identical — zero regression surface in the gate. |
| The Singapore-context E2E test flakes on seed timing | The test derives its expectation FROM the API response for the same ticket it renders (not from a hardcoded instant), so seed drift cannot break it; the +8h offset guarantees the RED/GREEN distinction while the assertion itself is exact. |
| The manual browser context leaks (not closed) | The test closes its context in a `finally` — the standing Playwright hygiene. |
| The fixture ticket pollutes the dev DB | The s7/s13/s14/s15 cleanup-script pattern (Prisma `deleteMany` by title prefix) runs after the E2E fixtures and the live verification; the canonical 11-ticket seed is re-counted after. |
| The reference drifts before push | The F1/F2 contracts were measured THIS session (fresh probes); re-verified live in step 5 before commit. |
| Rate-limiter budget | All new tests ride the shared `storageState`; fixtures use `page.request` (no login). The Singapore context reuses the same storageState file. |

## 5. Process lessons (for the next agent)

1. **The HTTP method is part of the measurement.** The base44 file proxy 404s HEAD and 302s GET — the s14 "CDN URLs expire" conclusion (and this session's first two probe readings) was a verb artifact, not a lifetime observation. When probing a response layer, use the verb the browser uses (GET), follow redirects explicitly, and distinguish "the hop 404s" from "the file 404s".
2. **A pinned rendering is only pinned in the environment it was measured in.** Fourteen sessions of date-format parity held because every probe and every E2E run executed at UTC — the timezone axis was invisible until a non-UTC context was driven (the s17 shortlist's locale probe, one axis over). Enumerate the environment axes (locale, timezone, viewport, input modality) the same way the state axes (at-rest/active, query/no-query) are enumerated.
3. **Paired probes catch what single-site probes cannot.** The timezone divergence was only visible BECAUSE the same Playwright context drove both sites and rendered different strings for the same instant. Keep the probes paired.
