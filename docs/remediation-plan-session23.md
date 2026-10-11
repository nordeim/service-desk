# ServiceDesk — Session 23 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of all identified gaps, and full re-verification. Session 23 follows the session-22 remediation (commit `7e38b8a` + the status commit `6d9a593` + the operator's transcript commit `c72c922`; briefing docs `docs/session_33.md` + `docs/remediation-plan-session22.md` + `worklog.md` + `docs/session_34.md`). This session executes the session_33/34 next-step shortlist: the reference's ticket-CREATE validation surface, the attachment-write surface, and the standing drift-ledger + bundle-hash re-check.

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes (per `skills/clone-app-pat-pro` + the s14–s22 response-layer/bundle/write-path doctrines). This session's headline surfaces: **the ticket-CREATE validation layer** and **the attachment-write layer** — plus the standing chrome/mobile/TW-v4 re-verification.

**Baseline at session start (`c72c922`, the pulled workspace):** lint ✓ typecheck ✓ 65 unit ✓ build ✓ **196/196 E2E in the clean environment** (:3000 confirmed down before the run) ✓ smoke 19 PASS lines ✓. The GitHub CI run-history aria-labels read **"Run 45 … completed successfully"** (the s22 push held green; Run 44 verified in the s22 docs). Environment contract verified standing (`.env` with `DATABASE_URL="file:../db/custom.db"` + `AUTH_SECRET`, `db/` at the repo root seeded 4/11/3/0 canonical, `skills/` excluded in all 4 configs — eslint + tsconfig explicit, vitest + playwright by include-pattern construction, npm scripts pinning `DATABASE_URL` inline, `.env.example` matching the codebase). The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session).

---

## 1. Findings Inventory

### F1 (MED — first measurement, documentation): the reference's ticket-CREATE accepts anything PRESENT — empty titles, out-of-vocabulary status/category/priority, unbounded lengths; only missing fields 422

**The reference's live-measured behavior (curl on their public API with the operator's own JWT — the verb the browser uses; probed 2026-10-11, all probe rows deleted after the measurement):**

- `POST .../entities/Ticket` with **no `title` field** → **422** (pydantic `Field required` — presence, never value); missing `description` → **422** likewise.
- `title: ""` (empty string) → **200, stored** — an empty-titled ticket persists; the anti-empty guard exists only in their UI's submit-time client check ("Please fill in all required fields").
- `status: "banana"` at create → **200, stored** — a ticket can be CREATED directly in an out-of-vocabulary status. Their own UI then renders the bogus status as a **fallback near-black badge** (`rgb(23,23,23)` bg / `rgb(250,250,250)` text, computed-live on their `/ticketdetails` — the unknown enum leaks straight into the rendered UI), and the ticket is un-filterable by their status filter's fixed vocabulary.
- `category: "spacecraft"` → **200, stored**; `priority: "ultra-critical"` → **200, stored** — the validated-string enums are entirely absent from their create path.
- `title` of 10,000 characters → **200, stored in full** (no length cap).
- Their generic-entity CRUD exposes DELETE on tickets (used for the probe cleanup — `DELETE .../entities/Ticket/{id}` → 200 `{"success":true}`).

**Our behavior (all standing):** `validateTicketInput` requires title 5–120 chars + description 10–5000 chars + the validated-string enums (`src/lib/validation.ts:24-43`); the POST handler **forces `status: "open"`** — a client-sent `status` field is not read into the create (`src/app/api/tickets/route.ts:118`); the 400 envelope carries per-field errors.

**Decision: the doctrine STANDS** — theirs is the platform's generic-entity gap (the s22 structural finding: presence-only pydantic, no value validation), not a parity target. But the audit surfaced that OUR create-path HTTP contracts are only partially pinned: the smoke script's "validation guard" pins one aggregate 400 (an invalid category); the **status-forced-open contract** (a client-sent bogus status must NOT be stored) and the **attachment caps** are pinned nowhere at the API layer. **→ P2 below.**

### F2 (HIGH — first measurement, documentation + the P1 fix): the reference's attachment-write surface has a partial server-side blocklist but NO size cap and NO count cap — and the audit exposed a REAL GAP ON OUR SIDE: our closed-MIME-list is enforced NOWHERE

**The reference's live-measured behavior (their upload fires at submit time via `POST .../integration-endpoints/Core/UploadFile`, multipart — captured from the browser's resource timeline):**

- A **5 MiB** .txt → **200, uploaded in full**; a **15 MiB** .txt → **200, uploaded in full** — **no size cap at any volume tested**.
- An **extension blocklist exists**: `.exe` → **400** `"Upload blocked: '.exe' files are not allowed."`; `.bat` → **400** likewise. But `.sh`, `.js`, and `.html` → **200, uploaded** (the blocklist is partial).
- The stored files serve via a **302 redirect chain to `media.base44.com`** with **`Content-Type: application/octet-stream`** — the .html/.js uploads do NOT execute in a browser context (the octet-stream serving is the platform's XSS mitigation).
- The uploaded files are **publicly fetchable with NO authentication** (an anonymous GET → 200; security-by-obscurity via the random filename prefix).
- **No DELETE** on files (405) — orphaned uploads persist forever (this session's five orphaned probe uploads join the s15 one; documented, unavoidable).
- `attachment_urls` is a plain array field with presence-only validation: a create carrying **10 attachment URLs → 200, stored** — **no count cap** (ours caps at 3).

**The gap on OUR side (the session's actionable finding):** `ATTACHMENT_ACCEPTED_TYPES` is defined in `src/lib/constants.ts:96` — but it is enforced **NOWHERE**:

- The client (`src/app/(app)/submitticket/page.tsx:75-91`) checks only `file.size > ATTACHMENT_MAX_BYTES`; the `accept={ATTACHMENT_ACCEPT_ATTR}` on the file input is a **picker hint only** (users can bypass it via "All files" in the dialog).
- `validateAttachments` (`src/lib/validation.ts:97-112`) checks count + per-file size + filename sanitation — **not the mimeType**.
- The download route (`src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts:45-47`) serves **`Content-Type: <stored mimeType>` with `Content-Disposition: inline`**.

So a direct API POST (or a picker-filter bypass) can store an attachment with ANY mimeType — `text/html`, `application/javascript` — and our download route will serve it **inline from OUR origin** with the attacker-chosen content type. That is a **stored-XSS surface on our app** — and it is *worse than the reference's*, whose platform forces `application/octet-stream` on everything it stores. Our own docs claim "ours caps 2 MiB × 3 with a closed MIME list" — the closed MIME list has been a UI-only guard, the exact s22 lesson ("the UI guard is not the API guard") applied to ourselves. **→ P1 below (the server-side MIME guard).**

### F3 (verified non-gap): the s19–s22 drift ledger holds EXACTLY — no new drift wave

Fresh hard-loads, clean context (the browser, not curl — their head is client-injected): the four app routes keep the PWA trio + og:image dims ABSENT + viewport-fit ABSENT + the apple title/status-bar pair + og/twitter/canonical core PRESENT; `/dashboard` canonical remains the ORIGIN ROOT (their home special case); `/login` keeps the PWA trio + og:image 1200/630 + `viewport-fit=cover` (the auth-pages-only pattern — fifth consecutive re-verification). Ours ships the uniform superset on every axis (the standing doctrine).

### F4 (verified non-gap): the bundle hash has NOT rotated

Fresh `script[src]` + stylesheet sweep on their `/dashboard`: **the same `/assets/index-DhFaB31Z.js` + `/assets/index-DFdILd41.css` as the s20/s21/s22 sweeps** — four sessions without a deployment on their side; no new chunks, no new user-facing features.

### Verified NON-gaps (re-checked this session, no action)

- **The mobile matrix (the user's standing priority), both sides:** the reference at 375×812 still renders their standing **468-vs-375 overflow defect** (re-measured); their sheet contracts 288px + `rgb(250,250,250)` + the 80% overlay (worked around via the JS dispatch — their toast viewport still blocks their own trigger, the s20 probe lesson); their sheet **STAYS OPEN after nav-tap** (their standing defect). Ours: **375=375** (the min-w-0 superset), the 288px sheet, the 80% overlay, and **nav-tap auto-closes + navigates** (re-verified live: tap → `/mytickets`, no stuck overlay). The mobile-navigation E2E suite (9 tests) green in the 196/196.
- **One nuance recorded:** neither side's sheet applies an inline `overflow` body lock on the JS-dispatch path this session (their sheet and ours behave identically — measured on both). The visible lock/scroll contracts remain owned by the green E2E pins; no action, no drift between the two apps.
- **The Tailwind v4 guards all standing** (re-verified in `globals.css`: `@theme inline` semantic tokens, the button-cursor preflight in `@layer base`, the radius scale with the 4px `--radius-sm`, the pinned system font stack, no config file).
- **The desktop visual structures match:** the sidebar nav + quick stats + CTAs; the recent rows (h3 titles + bare lowercase badges); the dashboard `text-4xl` headings.

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; no-fake-verification signup; permanent SQLite attachment storage; nav-tap auto-close; correct SPA titles + route-correct head; `private` cache scope on the owner-scoped attachment route; UTC-pinned formatters (s15); the reduced-motion a11y superset; the unmeasured admin surface (s16 F3); the cheaper `/api/stats` aggregate; no `last_active` heartbeat (s17 F3); the truth-telling og:image/favicon assets (s17/s18); the proper-cased per-route titles; the uniform viewport-fit=cover (s18); the uniform PWA trio + og:image dims/alt (s19); the segment-canonical dashboard (s19); the truthful not-configured Google button (s20 F1); the exact-route gate + public 404s + real /signup (s20 F2); the httpOnly HMAC cookie over their JWT-in-body (s21 F2); the 401 + `{error}` envelope over their FastAPI 400 (s21 F2); the rate-limited auth endpoints (s21 F2); the security-header superset (s21 F4); the server-side comment validation over their anything-goes API (s22 F1); the append-only comment store over their deletable-entity CRUD (s22 F1); the owner-only ticket mutation over their unscoped PUT (s22 F2); **the server-side create-path validation over their presence-only pydantic (s23 F1)**; **the 3 × 2 MiB attachment caps over their uncapped upload (s23 F2)**; **the server-side MIME allowlist over their partial extension blocklist (s23 F2 — the P1 fix closing OUR gap)**.

---

## 2. Execution Plan (TDD)

1. **P1 — the server-side MIME allowlist guard (a REAL gap on our side; the unit RED → GREEN first, per the TDD doctrine):**
   - **RED:** extend `src/lib/__tests__/domain.test.ts` (the `validateAttachments` describe block) with the failing pin: `validateAttachments([{ fileName: "evil.html", mimeType: "text/html", sizeBytes: 10 }])` → `.ok === false` (currently passes — the guard is absent).
   - **GREEN:** extend `validateAttachments` (`src/lib/validation.ts`) with the allowlist check after the filename guard: a `mimeType` not in `ATTACHMENT_ACCEPTED_TYPES` → `{ ok: false, error: "\"<name>\" has an unsupported file type" }`. The API POST route already rejects on `!attachmentCheck.ok` with 400 — the seam needs no route change.
   - **Client defense-in-depth (the UX layer):** extend the submit-form's `handleFiles` to toast-reject a `file.type` outside the accepted list (mirroring the existing "File too large" toast — the documented toast-feedback divergence; the picker's `accept` attr stays a hint, never the guard).
   - **The stored-XSS surface closes at the seam:** with the mimeType pinned at upload to the closed allowlist (images/PDF/office/text/zip), the download route's inline serving is safe for every row that can exist.
2. **P2 — the create-path smoke pins (the coverage-addition class; the s21/s22 doctrine — the smoke layer pins the HTTP contracts at zero fixture cost):** extend `scripts/smoke-test.sh` after the standing "validation guard (400)" step:
   - **P2a · the server-controlled status:** POST a valid ticket with `status: "banana"` in the body → assert **201** + the response `status === "open"` (the client-sent status is ignored — the direct F1 contrast; their create stores "banana").
   - **P2b · the count cap:** POST a valid ticket with 4 attachments → assert **400** + "At most 3 files can be attached".
   - **P2c · the size cap:** POST a valid ticket with one attachment declaring `sizeBytes` = 2 MiB + 1 → assert **400** + "exceeds the 2 MB per-file limit" (the declared-size seam — no 2 MB base64 payload needed).
   - **P2d · the filename guard:** POST with `fileName: "../evil.txt"` → assert **400** + "invalid file name".
   - **P2e · the MIME guard (P1's pin):** POST with `mimeType: "application/x-msdownload"` → assert **400** + "unsupported file type".
   - **RED check (the designed failure mode):** every pin fails against a build whose guards are removed — a status-reading create returns the stored "banana" (the reference's measured behavior); a cap-less create stores the 4th file and the 2 MiB+1 file (the reference's measured behavior); a MIME-less create stores the .exe our download route would serve inline. The pins keep OUR contract from regressing toward THEIRS.
3. **Full gate in the CLEAN environment** (no ambient :3000): `bun run lint && bun run typecheck && bun run test` (**66+ unit expected — the new RED→GREEN pin lands**) `&& bun run build` → `bun run test:e2e` (**196 expected — unchanged; the pins are smoke-layer only; the E2E attachment specs use valid MIMEs so the new guard cannot trip them**) → `bash scripts/smoke-test.sh` (**24 PASS lines expected: the standing 19 + 5 new**).
4. **Live paired re-verification** (production standalone :3000): the s22 live-verify script re-run (the ownership matrix + the comment-validation matrix + the 307-bounce) + a fresh s23 create-path check (the banana-status create → 201 + open; the 4-file → 400; the oversized → 400; the traversal → 400; the bad MIME → 400) via plain fetch + manual cookies (the s22 tool lesson — no `page.request` under Bun).
5. **Screenshots:** the standing 10-shot set refreshed via the s22 lineage (`scripts/capture-screenshots-s22.sh` → copied as `scripts/capture-screenshots-s23.sh`) — all four FATAL guards green.
6. **Docs:** README (the smoke create-path pins + the attachment-validation row's s23 sentences), AGENTS.md (the session-23 contracts section + the commands-table smoke line + the reference list through s23), CLAUDE.md (the smoke line + the own-side-UI-guard anti-pattern), PAD (§7.1 smoke row 24 steps + the s23 known-issues row + the attachment-validation row), `service-desk_SKILL.md` **v2.21.0** (lesson 77: the own-side audit — measure YOUR guards with the same rigor as theirs), `docs/session_35.md` (the narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
7. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only) — then verify the CI badge STAYS green.

## 3. Validation of this plan against the codebase

- **P1 seams verified:** `validateAttachments` (`src/lib/validation.ts:97-112`) is the single validation seam the POST route calls (`src/app/api/tickets/route.ts:100-107` — the 400 on `!attachmentCheck.ok` is standing); `ATTACHMENT_ACCEPTED_TYPES` (`src/lib/constants.ts:96`) already exports the closed list; the unit seam (`src/lib/__tests__/domain.test.ts:161`) already imports `validateAttachments` — the new pin drops into the existing describe block. The E2E attachment specs use png/txt/docx (the s10/s13 families) — inside the allowlist; zero E2E impact.
- **P2a seam verified:** the POST handler (`src/app/api/tickets/route.ts:83-99`) reads only title/description/category/priority/attachments from the body — a client-sent `status` key is never read; the create data pins `status: "open"` (line 118) and the 201 response echoes the stored ticket. The smoke DB is fresh each run — the banana-status create leaves a real row; the pin cleans up after itself via the smoke server's throwaway `db/smoke.db` (destroyed at script end — no canonical-DB impact).
- **P2b/c/d/e seams verified:** the error strings match the validator exactly ("At most 3 files can be attached" / "exceeds the 2 MB per-file limit" / "has an invalid file name" / the new "has an unsupported file type"); the route returns `{ error: <attachmentCheck.error> }` at 400 — the pins grep the message fragment, not the envelope (resilient to envelope additions, sensitive to contract breaks — the s22 pattern).
- **Rate-budget arithmetic unchanged:** all P2 pins ride the demo user's existing cookie jar (one login — already the smoke script's standing slot 1); no new users, no new logins; the login/forgot buckets untouched.
- **CI-pass risk:** the P1 change touches `src/lib/validation.ts` (the lint/typecheck surface — gate-covered), the client page (E2E-covered), and the smoke script (shell-only). The E2E submit-form specs drive the real UI with valid files — the new client toast cannot fire on them.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The new MIME guard breaks a legitimate existing flow (an accepted type missing from the list) | The allowlist already ships in `ATTACHMENT_ACCEPTED_TYPES` and is the SAME list the picker's `accept` attr advertises — the guard closes the gap between the advertised and the enforced; the E2E suite (196) exercises every documented attachment flow and must stay green. |
| A stored attachment from BEFORE the guard carries a bad MIME | The canonical DB's attachments are 0 (the seeded corpus); e2e.db is rebuilt each run; smoke.db is throwaway — no legacy rows exist to serve. |
| The banana-status create pin pollutes the canonical DB | The smoke script pins `DATABASE_URL` to its throwaway `db/smoke.db` (re-pushed + reseeded at the top of every run) — the probe row dies with the scratch DB. |
| The client toast fires on an at-rest visual-parity assertion | The toast only fires on a rejected file select (a user action); the parity pins assert at-rest markup — no assertion drives a file dialog with a disallowed type. |
| The reference re-drifts mid-session | The ledger was re-measured at the live probes (this session's F3/F4) — the docs finalize against the measured state. |

## 5. Process lessons (for the next agent)

1. **Turn the write-path doctrine on YOUR OWN code** — the s22 lesson ("the UI guard is not the API guard") was applied to the reference two sessions in a row while our own closed-MIME-list sat UI-only for thirteen sessions: the `accept` attribute is a picker hint, the client checked only size, the server validator checked only count/size/filename, and the download route served the stored MIME inline. Audit OUR advertised guards with the same curl-the-API rigor we point at theirs — every "ours validates X" doc line is a claim about a SEAM, and the seam must be the server.
2. **Partial blocklists are the reference platform's pattern, allowlists are ours** — their upload blocks .exe/.bat but stores .sh/.js/.html (mitigated only by octet-stream serving), and caps nothing (15 MiB accepted, 10 URLs per ticket). An allowlist + caps is the stricter, simpler contract — and once it exists, PIN IT (the pins' designed failure mode is the reference's measured anything-goes behavior).
3. **Probe artifacts must be reverted in the same session** — this session's five create-path probe tickets were deleted immediately after the measurement (field-verified via the list re-query); the five orphaned upload files cannot be deleted (their API exposes no DELETE on files — 405, the s15 precedent) and are documented here.

**Execution status (2026-10-11, all green):**
1. ✅ P1: the server-side MIME allowlist — the RED pin added to `domain.test.ts` (RED confirmed: 1 failed, the guard absent) → the GREEN at the `validateAttachments` seam (`ATTACHMENT_ACCEPTED_TYPES.includes(f.mimeType)` → `"unsupported file type"`) + the client toast mirror → **67 unit GREEN** (65 + 2).
2. ✅ P2: the create-path smoke pins — all five added (the client-sent status ignored 201+open, the count cap, the size cap, the path-traversal filename, the MIME allowlist), the shared temp-file lifecycle moved up (created once before the s23 block; the s22/s21 blocks reuse it) — **GREEN on first run, 24 PASS lines** (the standing 19 + 5 new).
3. ✅ Full gate in the CLEAN environment (:3000 confirmed down): lint ✓ typecheck ✓ 67 unit ✓ build ✓ **196/196 E2E** ✓ (unchanged; zero regressions) smoke **24 PASS lines** ✓.
4. ✅ Live paired re-verification (production standalone :3000): `scripts/s22-live-verify.mjs` re-run ALL GREEN (the ownership matrix + the comment-validation matrix + the 307-bounce); the new `scripts/s23-live-verify.mjs` ALL GREEN (12 checks — the create-path matrix + the attachment-write matrix + the standing regressions, via plain fetch + manual cookies). Probe fixtures cleaned (`scripts/cleanup-s23-tickets.mjs` + the s22 re-run's fixtures); the canonical seed re-verified (4/11/3/0) after the fixtures and after the screenshots.
5. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s23.sh` (the s22 lineage verbatim; all four FATAL guards green); VLM-verified shots 02 + 05 (LAYOUT-OK).
6. ✅ Docs: README (the badges 65→67 + the attachment row's s23 sentence + the smoke create-path pins + the E2E-notes s23 paragraph), AGENTS.md (the session-23 contracts section + the commands-table unit/smoke lines + the reference list through s23 + the screenshot-lineage pointer), CLAUDE.md (the unit/smoke lines + the own-side-UI-guard anti-pattern), PAD (§7.1 counts + the security-table MIME row + the s23 known-issues row), service-desk_SKILL.md **v2.21.0** (lesson 77: every advertised guard is a claim about a SEAM), `docs/session_35.md` (the narrative log), this status block, `worklog.md`.
7. ✅ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only) — remote verified == local HEAD; the CI run on the push verified green (see the worklog's close-out).
