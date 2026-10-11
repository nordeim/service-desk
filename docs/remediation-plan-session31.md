# ServiceDesk — Session 31 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 31 follows the session-30 remediation (commits `aa578d6` + `a41d3a6` + `d72aea0`; briefing docs `docs/session_49.md` + `docs/remediation-plan-session30.md` + `worklog.md` + `docs/session_50.md`). This session executes the session_50 next-step shortlist: the shared-pair rotation re-check (fifth wave?), the s4-defect + desktop-overflow re-checks against their newest rebuild, and the own-side audit at the NEW level — **the response-BODY schema surface (the JSON key sets + types on every route family)**.

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s30 response-layer/bundle/write-path doctrines; `skills/security-and-hardening` for the leak-guard framing). This session's headline findings: **the /login pair rotated a FIFTH time — BOTH halves this wave — and the app-route pair RE-SPLIT to the old pre-s30 pair** (exactly the re-split the s49 shortlist predicted); **the s4-documented toast-viewport blocking PERSISTS unchanged through the new bundle wave**; **their desktop 1328-vs-1280 overflow persists**; and the s50-directed response-body schema audit measured **every route family CLEAN but UNPINNED** — the actionable remediation is closing the axis with regression pins (the smoke-layer key-set contracts), because a future refactor that widens a Prisma include would silently ship base64 attachment blobs or the passwordHash in API responses, and nothing today would catch it.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: the fifth /login rotation (both halves) + the app-route re-split (non-gap)

The /login pair rotated a FIFTH time since s24 — and this wave rotated BOTH halves: JS `index-Bv7e1rqD.js` → `index-yqAONkSu.js` AND CSS `index-CykrcFnx.css` → `index-BQkILzMl.css` (the s30 wave had split its rotation across halves; this one moved both). The app-route pair — which s30 found finally rotated after eleven unchanged sweeps (both routes sharing one pair) — **RE-SPLIT exactly as the s49 shortlist predicted**: `/` (dashboard) now serves the OLD pre-s30 pair `index-DhFaB31Z.js` + `index-DFdILd41.css` again. `UserAppMain` renamed `CDUve4NQ` → `B2UjrI81`. The login contract verified in the new bundle source: all five strings ("Sign in to continue" / "Forgot password?" / "Need an account" / "Sign up" / "Google" ×2) + `from_url` ×14 (byte-identical count to s29/s30); the session's own live login ran through the new bundles. **Rotation, behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (thirteenth re-verification, non-gap)

All axes hold exactly, both routes, logged in and out: viewport-fit=cover auth-pages-only; the PWA trio (manifest + theme-color #000000 + apple-touch-icon) on `/login` only; the apple pair (status-bar-style black + apple-mobile-web-app-title) on both routes; og:image 1200×630 with true declared dims; twitter:card summary_large_image; the dashboard-home (`/`) canonical + og:url at the origin root; segment-verbatim titles. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At desktop 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` — the element walk re-confirmed the same four decorative gradient blobs (`absolute top-0 right-0 w-32 h-32` — violet→purple, amber→orange, blue→cyan, emerald→green) anchoring `right-0` to the un-clipped 1328-wide wrapper. Ours: **1280 = 1280** (the `min-w-0` superset holds at desktop). **Their defect documented, NOT cloned — ours the working superset.**

### F4 — the mobile matrix + the s4-defect re-check: it persists unchanged (their defect, NOT cloned)

Their standing `468`-vs-`375` overflow persists (thirteenth). **The s4-documented toast-viewport blocking PERSISTS through the new bundle wave — the geometry unchanged from s30:** two OVERLAPPING 32px bands (both `fixed top-0 z-[100] w-full p-4`, one at left 0 with one nested child, one at left 16, both `pointer-events: auto`, both EMPTY of visible content). The Toggle Sidebar button (rect 24,16 → 52,44) has its center (38,30) inside both bands; the `elementFromPoint` hit-test lands on the container; **a REAL mouse click (move + down + up) at the button's coordinates does NOT open the menu** (verified this session on the current build — no dialog, no sheet). Ours: **375 = 375**, the button hit-tests to the BUTTON itself, the real click opens the sheet (Dashboard / Submit Ticket / My Tickets + QUICK STATS + the Demo User footer + the Sign-out icon button), Escape closes it, and a nav-tap auto-closes + navigates to `/mytickets` with the correct title. The TW v4 guards code-verified standing (`@theme inline` ×2, the cursor preflight in `@layer base`, `--radius-sm: 0.25rem`, the pinned system font stack, no config file). **Their defect documented, NOT cloned — ours is the working superset. Non-gap.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in, glm-5v-turbo) verdicts **LAYOUT-OK** — no meaningful layout difference observed (only dynamic data content + the platform badge, both excluded by contract). **Non-gap.**

### P1 — the own-side audit at the new level: the response-body schema surface (THE actionable gap: clean but unpinned)

The s50 directive named the next audit axis: the response BODY schemas — the JSON key sets + types on the gated routes. Every route family measured live on both sides:

| Route family | Our measurement | Verdict |
|---|---|---|
| `/api/auth/me` | `{user:{id,name,email}}` — exact select, all strings | CLEAN — no passwordHash leak |
| `/api/auth/login` | 200 `{user:{id,email,name}}` / 401 `{error}` — the route fetches the FULL user (passwordHash in scope for verifyPassword) and hand-builds the narrow response | CLEAN — but the highest-risk seam (one refactor to `user: user` ships the hash) |
| `/api/auth/signup` · `logout` · `forgot-password` | 201 `{user}` / 200 `{ok:true}` / 200 `{ok,message}` — consistent envelopes | CLEAN |
| `/api/tickets` GET | `{tickets:[…]}` — rows carry `createdBy{id,name,email}` + `_count{comments}`, no comments array, no attachment data | CLEAN — bounded payload |
| `/api/tickets` POST → 201 `{ticket}` | attachments select `{id,fileName,mimeType,sizeBytes,createdAt}` — no `data` blob; the fresh ticket lacks a `comments` key (inert: the UI reads only `ticket.id` and redirects to /mytickets) | CLEAN |
| `/api/tickets/[id]` GET / PATCH | `{ticket}` with attachments (same clean select) + comments (author `{id,name,email}`) + createdBy | CLEAN |
| `/api/tickets/[id]/comments` POST | 201 `{comment}` with author `{id,name,email}`; GET → 405 by design (comments ride the detail response) | CLEAN |
| `/api/stats` | `{mine:{open,in_progress,resolved,closed,total}, global:{same}, avgResolutionMs:number\|null}` — symmetric, numeric | CLEAN |
| HEAD/OPTIONS surface | HEAD → 200 + the header set; OPTIONS → 204 + `allow: GET, HEAD, OPTIONS`; HEAD / → the 307 redirect | CLEAN — standard + header-gated |
| The attachment-route header interplay (the s49-named probe, first explicit verification) | The s15 contract (`content-disposition: inline`, `cache-control: private, max-age=31536000, immutable`) coexists with the s30 universal five-header set — no conflict, no X-Powered-By | CLEAN |
| The reference's platform API (probed live: User/me + the Ticket entity + a create-then-delete probe, cleaned up) | Bare entities (no wrapper), snake_case keys, 200-on-create, the 15-key platform Ticket schema (`assigned_to`/`attachment_urls`/`is_sample`/`resolution_notes`/`resolved_at` — fields our schema deliberately lacks; no UI parity surface) | The shape deltas are the documented internal-API class (our own frontend consumes our API) — NOT parity gaps |

**The judgment call.** The audit axis is CLEAN — but every clean contract on this surface is UNPINNED, and the surface is exactly the class where regressions are silent and severe: (a) the login route holds the full user row (passwordHash included) in scope and hand-builds the narrow response — one shorthand refactor ships the hash to every client; (b) the ticket-detail/attachment selects exclude the base64 `data` column by explicit select — one widened `include` (dropping the select) ships the blob in every detail fetch (payload bloat + data exposure); (c) the list route's bounded row shape (no comments array, no attachment data) and the stats route's symmetric five-status vocabulary have no guard either. The smoke layer is the established seam for response-contract pins (s21–s30 all pinned response contracts there — the rate-limiter 429s, the write-path 400/403 matrix, the pagination/filter/search/param-set/empty-grammar grammar, the response headers). This session closes the schema axis the same way: **six key-set pins that fail the moment a response shape widens.**

## 2. The remediation (P1 — TDD)

**The design: six smoke-layer key-set pins (the s31 block), appended after the s30 header block in `scripts/smoke-test.sh`.**

1. **The me-route user key pin**: `GET /api/auth/me` → `user` keys exactly `{email,id,name}`, all values strings (the no-leak contract — a select widening or relation inclusion fails the exact-set assertion).
2. **The login-response user key pin**: `POST /api/auth/login` (the demo login, one more probe on the throwaway server's fresh bucket — budget-safe at 2 of 10) → `user` keys exactly `{email,id,name}` (the route where the full row is in scope — the pin is the guard).
3. **The list-route row key pin**: `GET /api/tickets?limit=1` → the row's keys exactly the eleven-key set (`_count, category, createdAt, createdBy, createdById, description, id, priority, status, title, updatedAt`) + `createdBy` keys exactly `{email,id,name}` + `_count` keys exactly `{comments}` (the bounded-payload contract: no comments array, no attachment data, no future `assigned_to`-style platform field).
4. **The detail-route attachment key pin**: a create WITH one valid base64 attachment (the smoke suite's first attachment happy-path — the s23 block covers the rejects only) → `GET /api/tickets/[id]` → each attachment object's keys exactly `{createdAt,fileName,id,mimeType,sizeBytes}` — **no `data`** (the base64-blob leak guard — the pin that catches the widened include).
5. **The comment-response author key pin**: the existing add-comment probe's response (captured, not re-sent) → `comment.author` keys exactly `{email,id,name}`.
6. **The stats key-set pin**: `GET /api/stats` → `mine` and `global` keys exactly `{closed,in_progress,open,resolved,total}` with numeric values, `avgResolutionMs` number-or-null (the symmetric-aggregate contract).

**The RED phase — mutation-testing the pin (the honest TDD for pins-on-clean-contracts):** the contracts are already green in the code, so the RED demonstration proves the pin has teeth by breaking the code deliberately: temporarily remove the `select` from the me route's `findUnique` (the full user row — passwordHash included — flows into the response) → run the s31 pin → it MUST FAIL (`user keys must be exactly {id,name,email}`) → restore the select → GREEN. The mutation is applied to the me route (the same class as the login seam) and reverted before any commit; the failure output is captured as the RED evidence.

**Non-goals (documented decisions, no code):** no response-body changes anywhere (the audit found the surface clean — this session only PINS it); no change to the create-response's missing `comments` key (inert asymmetry — the UI reads only `ticket.id`); no cloning of the reference's platform-API shape (bare entities, snake_case, 200-on-create — the documented internal-API class); no new schema fields (`assigned_to`/`resolution_notes`/`resolved_at`/`is_sample` are platform fields with no UI parity surface); no unit-test seam for the pins (the route handlers import the Prisma client — the pure-seams-only doctrine keeps the unit suite DB-free; the smoke layer is the established response-contract seam, proven by s21–s30).

## 3. The verification plan

1. The mutation RED demonstration on the me pin (break → FAIL captured → restore).
2. Full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → 110 unit → build → E2E 196 → smoke (58 + the s31 lines).
3. Live re-verification on the production standalone :3000: the schema matrix re-run by hand (every pin re-asserted live) + re-runs of the s24–s30 standing live-verify scripts (all green = the seven prior sessions' contracts hold on the current build).
4. The UI round-trip (the real login → dashboard → tickets flow) + the mobile matrix on the new build (375=375, menu opens, nav-tap auto-close + navigate) + the desktop paired VLM check.
5. Screenshots (the 10-shot set) refreshed to `docs/screenshots/`; VLM spot-checks on the standing convention shots.
6. Docs alignment: README (the smoke count + the s31 E2E-notes sentence), AGENTS.md (the session-31 contracts section + the commands table + the reference-findings list through s31), CLAUDE.md (the counts + the smoke line), PAD (the checklist + the s31 known-issues row), `service-desk_SKILL.md` v2.29.0 (the new lesson: a clean audit axis is closed by pinning it — an unpinned clean contract is a future regression), `docs/session_51.md` (this session's agent log), this plan's execution status, `worklog.md`.
7. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 4. Execution status

- [x] Gap analysis (F1–F5 + P1) — complete, recorded in worklog task 71-gap-s31
- [x] P1 TDD: the pins written into the s31 smoke block first → **the RED demonstrated by MUTATION** (removing the `select` from `getCurrentUser`'s `findUnique` → rebuild → `FAIL s31-schema: /api/auth/me user keys must be exactly {id,name,email}` captured) → the select restored (git-diff-verified clean) → rebuild → **GREEN: 64 PASS lines** (the standing 58 + the 6 new s31 pins — the me no-leak contract, the login full-row guard, the list bounded eleven-key set, the detail attachment no-data-blob guard + the create-with-attachment happy path (the smoke suite's first), the comment author keys, the stats symmetric vocabulary)
- [x] Full gate in the clean environment: lint → typecheck → 110 unit → build → 196/196 E2E → smoke 64 — ALL GREEN; seed canonical after
- [x] Live re-verification: the s30 header matrix by hand (every response class carries the five security headers, zero X-Powered-By) + the s24 (ALL GREEN) + s25 (13) + s26 (15) + s27 (14) + s28 (12) + s29 (22/22) re-runs ALL GREEN + the NEW s31 live schema matrix (`scripts/s31-live-verify.mjs`, 14/14 — the six contracts on the real :3000 DB, fixtures cleaned, seed canonical) + the UI round-trip (login → dashboard stat cards + QUICK STATS + Performance Metrics + the 5 seeded recent tickets → /mytickets) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, nav-tap auto-closes + navigates) + the desktop paired VLM check (LAYOUT-OK; one comparison retake — the first shot captured /mytickets, a probe-hygiene note)
- [x] Screenshots (the 10-shot set via `capture-screenshots-s31.sh`, the s30 lineage verbatim; FATAL guards green; VLM shots 02 + 05 RENDER-OK; seed canonical after the fixture removal; one server restart for fresh login buckets — the standing rate-budget doctrine) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.29.0 lesson 85/session_51.md/plan/worklog)
- [ ] Commit + push + CI verification
