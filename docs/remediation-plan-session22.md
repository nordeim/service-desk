# ServiceDesk — Session 22 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of all identified gaps, and full re-verification. Session 22 follows the session-21 remediation (commit `92fb4c8` + the status commit `fca851c` + the operator's transcript commit `43329f1`; briefing docs `docs/session_31.md` + `docs/remediation-plan-session21.md` + `worklog.md` + `docs/session_32.md`). This session executes the session_31/32 next-step shortlist: the reference's comment-validation surface, the ticket-mutation permissions matrix, and the standing drift-ledger + bundle-hash re-check.

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes (per `skills/clone-app-pat-pro` + the s14–s21 response-layer/bundle/value-sweep doctrines). This session's headline surface: **the write-path validation + permissions layer** — the comment API's validation behavior, the ticket-update API's ownership check — plus the standing chrome/mobile/TW-v4 re-verification.

**Baseline at session start (`43329f1`, the fresh clone):** lint ✓ typecheck ✓ 65 unit ✓ build ✓ **196/196 E2E in the clean environment** (:3000 confirmed down before the run — the CI-equivalent condition) ✓ smoke 13 PASS lines ✓. The GitHub CI badge reads **"CI - passing"** (the s21 push held green). Environment contract re-established on the fresh clone (`.env` created with `DATABASE_URL="file:../db/custom.db"` + a generated `AUTH_SECRET`, `db/` at the repo root pushed + seeded 4/11/3/0 canonical, `skills/` excluded in all 4 configs by construction, npm scripts pinning `DATABASE_URL` inline, `.env.example` matching the codebase, the Playwright 1248 chromium build present — the s13 lesson). The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session).

---

## 1. Findings Inventory

### F1 (MED — first measurement, documentation + the P1 pin): the reference's comment API accepts ANYTHING — empty, whitespace, 50k characters, even a bogus ticket_id; ours is the unpinned validation superset

**The reference's live-measured behavior (curl on their public API with the operator's own JWT — the verb the browser uses; their comment entity field is `content`, not `body`):**
- `POST .../entities/Comment` with `content: ""` → **200, stored** (the empty comment persists; the anti-empty guard exists ONLY in their UI — the Add Comment button is `disabled` when the textarea trims to empty).
- `content: "   "` (whitespace-only) → **200, stored**.
- `content: "x" × 50,000` → **200, stored in full** (no length cap at any volume tested; the whole 50,000 characters round-trip in the response body).
- `ticket_id: "nonexistent12345"` (valid `content`) → **200, stored** — the comment is persisted against a ticket that does not exist; there is **no referential-integrity check and no ticket-existence check** at the API layer.
- Missing `ticket_id` or missing `content` field → **422** (pydantic `Field required` — the FastAPI envelope `{"error_type":"ValidationError", ...}`) — the only validation their API performs is field PRESENCE, never field VALUE.
- Their generic entity CRUD also exposes **DELETE** on comments (used to clean up the probe rows: `DELETE .../entities/Comment/{id}` → 200 `{"success":true}`) — any authenticated user can delete any comment row; ours is append-only by design.
- All four probe comments were deleted after the measurement; the probe ticket's visible state was restored.

**Our behavior (all standing, verified this session):**
- Empty or whitespace-only → **400** + `errors.content: "Comment cannot be empty"` (the trim-then-check in `validateCommentInput`, `src/lib/validation.ts:49-55`).
- > 2000 characters → **400** + `"Comment must be at most 2000 characters"`.
- A valid comment against a nonexistent ticket → **404** `"Ticket not found"` (the ticket-existence check in the comment route).
- Comments are append-only (no DELETE route exists — the audit-trail posture).

**Decision: the doctrine STANDS — the reference's missing validation is a platform gap, not a parity target.** But the measurement surfaced a coverage gap on OUR side: the comment-validation API surface is pinned NOWHERE (the unit seam covers the pure validator; the E2E covers only the happy path — `tickets.spec.ts` adds a valid comment). **→ P1b below.**

### F2 (HIGH — first measurement, documentation + the P1 pin): the reference's ticket-update API has NO ownership check — any authenticated user can mutate any ticket; our owner-only 403 is the unpinned superset

**The reference's live-measured behavior:**
- The UI layer hides the status-change control on non-owned tickets (verified: the operator's detail view of another user's ticket renders title/badges/description/comments but NO status control) — a UI-only guard.
- `PATCH .../entities/Ticket/{id}` → **405 Method Not Allowed** (their generic CRUD accepts PUT, not PATCH).
- `PUT .../entities/Ticket/{id}` `{"status":"in_progress"}` on **another user's ticket** (owned by a different account) → **200, the mutation is applied** — no ownership check, no scoping. (The probe mutated `status` only; the round-trip was immediately reverted with a second PUT restoring `status:"open"`; all other fields verified intact — title/priority/category/description/resolution_notes/resolved_at/attachments all unchanged. Only `updated_date` moved, which is unavoidable and non-destructive.)
- The PUT is partial-update semantics despite the verb (sending only `status` does not wipe the other fields).
- **Our behavior:** `PATCH /api/tickets/[id]` → **403** `"Only the ticket owner can update it"` for any non-owner (`src/app/api/tickets/[id]/route.ts:56-58`); `GET` stays any-signed-in-user (the shareable-URL parity contract, mirroring the reference's readable detail pages). The superset stance: write is owner-scoped, read is shareable.

**Decision: the doctrine STANDS — theirs is the platform's generic-entity gap, not a parity target (the s21 "a missing security control on the reference is not a mandate to remove ours" lesson).** But our ownership guard has **zero test coverage** (grep-verified: no 403 anywhere in `tests/e2e/`, not in the smoke script, not in the unit layer — the exact s21 rate-limiter coverage-gap class). **→ P1a below.**

### F3 (verified non-gap): the s19/s20/s21 drift ledger holds EXACTLY — no new drift wave

Fresh hard-loads, clean context (the browser, not curl — their head is client-injected):
- **The app routes** (`/dashboard`, `/mytickets`, `/submitticket`, `/ticketdetails`): the PWA trio (theme-color + manifest link + apple-touch-icon) + og:image:width/height **ABSENT** on all four; viewport-fit **absent** (`width=device-width, initial-scale=1.0`); `apple-mobile-web-app-title` "ServiceDesk" + `apple-mobile-web-app-status-bar-style` "black" + the og:image/twitter/canonical core **present** on all four; `/dashboard` canonical = the ORIGIN ROOT (their home special case); titles segment-verbatim ("Mytickets | ServiceDesk" …).
- **`/login`**: the PWA trio + og:image dims 1200/630 + `viewport-fit=cover` **present** (the auth-pages-only pattern — the s19 ledger, unchanged through s22).
- Ours ships the uniform superset on every axis (the standing doctrine).

### F4 (verified non-gap): the bundle hash has NOT rotated — no new features on their side

Fresh `document.querySelectorAll('script[src]')` + stylesheet sweep on their `/dashboard`: **the same `/assets/index-DhFaB31Z.js` + `/assets/index-DFdILd41.css` as the s20 and s21 sweeps** — their production bundle is unchanged across three sessions; no new chunks, no new user-facing features (the s21 shortlist's "does their bundle hash rotate" question answered: NO).

### Verified NON-gaps (re-checked this session, no action)

- **The mobile matrix (the user's standing priority), both sides:** the reference at 375×812 renders their standing **468-vs-375 overflow defect** (re-measured this session); their sheet contracts identical to ours (288px, `rgb(250,250,250)`, body lock) — worked around via the JS dispatch (their toast viewport still blocks their own trigger, the s20 probe lesson); their sheet **STAYS OPEN after nav-tap with the body still locked** (their standing defect). Ours: **375=375 AND 390=390** (the min-w-0 superset), the 288px sheet, the 80% overlay (`oklab(0 0 0 / 0.8)` ≡ their `rgba(0,0,0,0.8)`), nav-tap **auto-closes + unlocks + navigates** (the superset). The mobile-navigation E2E suite green (part of the 196/196).
- **The Tailwind v4 guards all standing** (verified in `globals.css` this session: `@theme inline` semantic tokens, the button-cursor preflight in `@layer base`, the radius scale with the 4px `--radius-sm`, the pinned system font stack, no `tailwind.config.js`) — zero v4-related regressions in the mobile navigation (geometry, overlay, animation contracts all green).
- **The standing visual structures match:** the sidebar nav + quick stats (Open/In Progress/Total) + the CTAs; the recent rows (h3 titles + lowercase badges "open"/"urgent" + date-only dates on ours; the reference's rows carry the same bare-word badge set); the dashboard `text-4xl` headings; the login-card structure (re-verified via the paired probes this session).
- **The from_url deep-link contract fired live** during the paired probes (an unauthenticated `:3000/dashboard` visit bounced to `/login?from_url=http%3A%2F%2Flocalhost%3A3000%2Fdashboard` — the s19 contract working in the field, unprompted).

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; no-fake-verification signup; permanent SQLite attachment storage; nav-tap auto-close; correct SPA titles + route-correct head; `private` cache scope on the owner-scoped attachment route; UTC-pinned formatters (s15); the reduced-motion a11y superset; the unmeasured admin surface (s16 F3); the cheaper `/api/stats` aggregate; no `last_active` heartbeat (s17 F3); the truth-telling og:image/favicon assets (s17/s18); the proper-cased per-route titles; the uniform viewport-fit=cover (s18); the uniform PWA trio + og:image dims/alt (s19); the segment-canonical dashboard (s19); the truthful not-configured Google button (s20 F1); the exact-route gate + public 404s + real /signup (s20 F2); the httpOnly HMAC cookie over their JWT-in-body (s21 F2); the 401 + `{error}` envelope over their FastAPI 400 (s21 F2); the rate-limited auth endpoints (s21 F2); the security-header superset (s21 F4); **the server-side comment validation over their anything-goes API (s22 F1)**; **the append-only comment store over their deletable-entity CRUD (s22 F1)**; **the owner-only ticket mutation over their unscoped PUT (s22 F2)**.

---

## 2. Execution Plan (TDD)

1. **P1 — the ownership-guard + comment-validation smoke pins (a regression pin, the coverage-addition class; the s21 precedent):** extend `scripts/smoke-test.sh` with two new blocks after the standing "validation guard (400)" step and before the rate-limiter block:
   - **P1a · the permissions matrix:** sign up a second user (`smoke-nonowner@servicedesk.app`, own `signup:${ip}` rate bucket — zero login-budget cost; the smoke DB is fresh each run so the fixed email is deterministic) with its own cookie jar → GET the demo user's ticket as user B → assert **200** (the shareable-URL read contract) → PATCH the demo user's ticket as user B → assert **403** + the "Only the ticket owner" message (the ownership guard).
   - **P1b · the comment-validation matrix:** POST an empty `content` → assert **400** + "Comment cannot be empty"; POST a whitespace-only `content` → assert **400**; POST a > 2000-char `content` → assert **400** + "at most 2000 characters"; POST a valid `content` to a nonexistent ticket id → assert **404** + "Ticket not found". (All four are no-side-effect probes — nothing is stored; no cleanup needed.)
   - **RED check (the designed failure mode):** every assertion fails against a build whose guards are removed — a 403-less build returns 200 on the non-owner PATCH (the reference's measured behavior!); a validation-less build returns 201 on the empty comment (the reference's measured behavior!). The pins exist precisely to keep OUR contract from regressing toward THEIRS. Expected GREEN on first run (the behavior is unit-seamed/live-deployed; the s18/s21 coverage-addition class).
   - **Pin-layer decision (the s21 doctrine):** the smoke layer's throwaway server pins the HTTP contracts at zero fixture cost. An E2E pin would need a second storageState (a second real login per run) and burns setup complexity for a pure API contract; the unit layer already covers the pure validator seam — the HTTP surface is what's missing.
2. **Full gate in the CLEAN environment** (no ambient :3000): `bun run lint && bun run typecheck && bun run test && bun run build` → `bun run test:e2e` (**196 expected — unchanged; the pins are smoke-layer only**) → `bash scripts/smoke-test.sh` (**19 PASS lines expected: the standing 13 + 6 new** — the non-owner read, the 403, the three comment-400s, and the bogus-ticket 404).
3. **Live paired re-verification** (production standalone :3000): the s21 live-verify script re-run (the security-header superset + the 401 envelope + the s19/s10 regressions) + the fresh s22 permissions/validation checks re-confirmed on our side.
4. **Screenshots:** the standing 10-shot set refreshed via the s21 lineage (`scripts/capture-screenshots-s21.sh` → copied as `scripts/capture-screenshots-s22.sh`) — all four FATAL guards green; VLM spot-checks on 2 shots (the standing convention).
5. **Docs:** README (the smoke pins + the auth/testing rows' s22 sentences), AGENTS.md (the session-22 contracts section + the reference list through s22), CLAUDE.md (the smoke line + the write-path validation lesson), PAD (§7.1 counts + the s22 known-issues row), `service-desk_SKILL.md` **v2.20.0** (lesson 76: the write-path validation/permissions enumeration — the UI guard is not the API guard), `docs/session_33.md` (the narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
6. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only) — then verify the CI badge STAYS green.

## 3. Validation of this plan against the codebase

- **P1a seams verified:** the signup route (`src/app/api/auth/signup/route.ts`) sets the session cookie directly on 201 (no login needed — zero login-budget impact); the PATCH guard (`src/app/api/tickets/[id]/route.ts:56-58`) returns 403 + "Only the ticket owner can update it"; the GET route returns the ticket to ANY signed-in user (the shareable-URL contract, line 15-16 comment); `validateSignupInput` requires email + name + password ≥ 8 chars with letters+numbers (user B's fixture: `smoke-nonowner@servicedesk.app` / `Smoke NonOwner` / `NonOwner1234` — valid).
- **P1b seams verified:** `validateCommentInput` (`src/lib/validation.ts:49-55`): empty → "Comment cannot be empty", > 2000 → "Comment must be at most 2000 characters"; the comment route (`src/app/api/tickets/[id]/comments/route.ts`): the validation failure → 400 `{error: "Please check the form", errors: {...}}`, the ticket-existence check → 404 `"Ticket not found"` — and the 404 fires AFTER validation (an invalid comment on a bogus ticket correctly 400s first).
- **Rate-budget arithmetic unchanged:** user B signs up (the signup bucket, 1/10) — never logs in; the login bucket keeps its standing 10-slot arithmetic (demo login = slot 1, 9 wrong passwords = 2–10, the assert = the 11th); the forgot bucket untouched by the new pins.
- **No pin conflicts:** grep-verified — "Only the ticket owner" appears in no test file; the smoke script's existing checks do not sign up a second user; the E2E suite's fixtures are untouched (no new logins).
- **CI-pass risk:** the smoke change is shell-only (no lint/typecheck surface); the gate re-run covers the doctrine (the s7 lesson — every file that lands gets the gate).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The signup POST fails on a pre-existing email (a stale smoke.db) | The smoke script re-pushes + reseeds `db/smoke.db` fresh at the top of every run (lines 30-31) — the fixed email is deterministic on the fresh DB. |
| The 403 pin's message drift ("Only the ticket owner can update it") | The grep matches the stable prefix "Only the ticket owner" — the wording contract documented in the AGENTS.md session-22 section. |
| The comment-400 pins depend on the error envelope shape (`errors.content`) | The pins assert the status code + the message fragment, not the full envelope — resilient to envelope additions, sensitive to contract breaks (the intended sensitivity). |
| The reference re-drifts mid-session | The ledger was re-measured at the live probes (this session's F3) — the docs finalize against the measured state. |

## 5. Process lessons (for the next agent)

1. **The UI guard is not the API guard** — the reference's comment box disables the empty submit (a UI guard) while their API accepts the empty comment (200, stored); their detail page hides the status control for non-owners (a UI guard) while their API applies any user's mutation (200). Enumerate the WRITE PATH of every flow at the HTTP layer, not just the rendered controls: the status codes, the field validation, the ownership scoping, the referential integrity. A disabled button proves nothing about the endpoint behind it.
2. **A generic-entity backend is an unscoped backend** — the reference's platform CRUD (create/read/PUT/delete on any entity with only field-PRESENCE validation) is the structural cause of both s22 findings: no value validation, no ownership scoping, no referential integrity, deletable comments. Our route-by-route handlers (validated-string enums, owner checks, existence checks) are the architecture the superset doctrine documents.
3. **Probe artifacts must be reverted in the same session** — the s22 mutation probe (a non-owner status PUT on another user's ticket) was reverted immediately with a verify pass confirming every field intact; the comment probes were deleted via their own DELETE endpoint. Live shared workspaces (121 tickets, many real users) demand probe hygiene: measure, revert, verify, document.

**Execution status (2026-10-11, all green):**
1. ✅ P1: the write-path smoke pins added to `scripts/smoke-test.sh` (both blocks — the ownership matrix: the non-owner read 200 + the non-owner PATCH 403 + "Only the ticket owner"; the comment-validation matrix: empty 400 + "Comment cannot be empty", whitespace 400, overlong 400 + "at most 2000 characters", the unknown-ticket 404 + "Ticket not found") — GREEN on first run (the regression pins, as designed: the behavior is unit-seamed and live-deployed; the pins' designed failure mode is the reference's measured anything-goes behavior).
2. ✅ Full gate in the CLEAN environment (:3000 confirmed down): lint ✓ typecheck ✓ 65 unit ✓ build ✓ **196/196 E2E** ✓ (unchanged; zero regressions) smoke **19 PASS lines** ✓ (the standing 13 + 6 new).
3. ✅ Live paired re-verification (production standalone :3000): `scripts/s21-live-verify.mjs` re-run ALL GREEN (the security-header superset + the 401 envelope + the s19/s10 regressions); the new `scripts/s22-live-verify.mjs` ALL GREEN (the ownership matrix + the comment-validation matrix + the 307-bounce — via plain fetch + manual cookies after the Bun `page.request` set-cookie crash; the tool lesson documented). Probe fixtures cleaned (`scripts/cleanup-s22-tickets.mjs`); the canonical seed re-verified (4/11/3/0).
4. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s22.sh` (the s21 lineage verbatim; all four FATAL guards green); VLM-verified shots 02 + 05 (LAYOUT-OK).
5. ✅ Docs: README (the smoke write-path pins + the ticket-lifecycle row's s22 sentences + the E2E-notes s22 paragraph), AGENTS.md (the session-22 contracts section + the commands-table smoke line + the reference list through s22 + the screenshot-lineage pointer), CLAUDE.md (the smoke line + the write-path anti-pattern), PAD (§7.1 smoke row 19 steps + the s22 known-issues row), service-desk_SKILL.md **v2.20.0** (lesson 75 landed retroactively — the s21 commit had bumped the header without adding the lesson to the list, an audit finding this session — + lesson 76: the write-path enumeration), `docs/session_33.md` (the narrative log), this status block, `worklog.md`.
6. ✅ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only) — remote verified == local HEAD; the CI run verified (see the session_33.md closing note).
