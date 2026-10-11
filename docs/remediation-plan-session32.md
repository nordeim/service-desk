# ServiceDesk — Session 32 Remediation Plan

**Date:** 2026-10-12
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 32 follows the session-31 remediation (commits `7d6724d` + `f08a8cf` + `3e93c8b`; briefing docs `docs/session_51.md` + `docs/remediation-plan-session31.md` + `worklog.md` + `docs/session_52.md`). This session executes the session_51 next-step shortlist: the standing ledger re-checks (the sixth /login wave? the app-route pair on the old split? the s4-defect + the desktop overflow against their newest rebuild) and the own-side audit at the NEW level — **the request-body strictness surface** (the session_51-named first candidate: unknown/extra JSON keys on the write paths), plus the two remaining shortlist candidates measured alongside it (the error-envelope consistency and the OPTIONS/HEAD body convention).

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s31 response-layer/bundle/write-path doctrines). This session's headline findings: **the /login pair rotated a SIXTH time — again both halves — while the app-route pair STAYS on the old pre-s30 split** (the graph re-split of s31 held); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 overflow + their mobile 468-vs-375 overflow all persist unchanged through the new bundle wave**; and the s51-directed request-body audit measured **every write route silently accepting unknown top-level JSON body keys** (a create carrying `"banana":1` stores the ticket; a login carrying `banana` logs in) — the exact body-level variant of the s27 lesson-79 class, and the last unaudited request surface on the write paths. The two companion axes measured clean: the error-envelope convention (`{error}` everywhere; the `{error, errors}` field-record split ONLY on form-validation surfaces) and the HEAD/OPTIONS body convention (standard, header-gated) — both clean but unpinned.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: the sixth /login rotation (both halves) + the app-route pair stays on the old split (non-gap)

The /login pair rotated a SIXTH time since s24 — both halves again, the second consecutive both-halves wave: JS `index-yqAONkSu.js` → `index-Bp10hac5.js` AND CSS `index-BQkILzMl.css` → `index-pXNNffyR.css`. `UserAppMain` renamed `B2UjrI81` → `BN_RuQ68` (the chunk now fetched from `/static/UserAppMain-BN_RuQ68.js`). The login contract verified in the new bundle source: all five strings ("Sign in to continue" / "Forgot password?" / "Need an account" / "Sign up" / "Google") + `from_url` ×14 (byte-identical count to s29/s30/s31); the session's own live login ran through the new bundles. The app-route pair — which s31 found RE-SPLIT to the old pre-s30 pair — **STAYS on that split**: `/` (dashboard) serves `index-DhFaB31Z.js` + `index-DFdILd41.css`, unchanged from s31. **Rotation, behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (fourteenth re-verification, non-gap)

All axes hold exactly, both routes, logged in and out: `/login` — viewport-fit=cover + the PWA trio (manifest + theme-color #000000 + apple-touch-icon) + the apple pair + og:image 1200×630 with true declared dims + twitter:card summary_large_image + canonical/og:url at `/login`; `/` (dashboard) — plain viewport + NO PWA trio + the apple pair + canonical/og:url at the origin root. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At desktop 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (the same four decorative gradient blobs anchoring `right-0` to the un-clipped wrapper — fourteenth measurement). Ours: **1280 = 1280** (the `min-w-0` superset holds at desktop). **Their defect documented, NOT cloned — ours the working superset.**

### F4 — the mobile matrix + the s4-defect re-check: it persists unchanged (their defect, NOT cloned)

Their standing `468`-vs-`375` mobile overflow persists (fourteenth). **The s4-documented toast-viewport blocking PERSISTS through the new bundle wave — the geometry unchanged from s31:** two OVERLAPPING 32px bands (both `fixed top-0 z-[100] w-full p-4`, `pointer-events: auto`, one at left 0 with one nested child, one at left 16, both EMPTY of visible content). The Toggle Sidebar button (rect 24,16 → 52,44) has its center (38,30) inside both bands; the `elementFromPoint` hit-test lands on the container; **agent-browser itself REFUSES the click** ("Element 'button' is covered by <div.fixed.top-0…>") and the menu does NOT open (0 dialogs). Ours: **375 = 375**, the button hit-tests to the BUTTON itself, the real click opens the sheet (verified live this session on the new build), Escape closes it, and a nav-tap auto-closes + navigates. The TW v4 guards code-verified standing (`@theme inline` ×2, the cursor preflight in `@layer base`, `--radius-sm: 0.25rem`, the pinned system font stack, no config file). **Their defect documented, NOT cloned — ours is the working superset. Non-gap.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in, glm-5v-turbo) verdicts **LAYOUT-OK** — no meaningful layout difference observed (only our correct Dashboard active-highlight — the known s20 quirk — plus dynamic data content and the platform badge, all excluded by contract; the stat-card tints the model noted are the reference's animated-entrance timing, not structure). **Non-gap.**

### P1 — the own-side audit at the new level: the request-body strictness surface (THE actionable gap)

The s51 directive named the first candidate axis: the request-BODY strictness on the write paths — does a create carrying `"banana":1` store it silently? Measured live on every write route (our production standalone :3000):

| Route | Probe | Result |
|---|---|---|
| `POST /api/tickets` | `+banana:1` on a valid create | **201 — the ticket is created, the unknown key silently ignored** |
| `POST /api/tickets` | `+status:"resolved"` (a REAL sibling-route key — the PATCH vocabulary) | **201 — created with status:open (the s23 server-controlled contract held), but the key itself is silently ignored** |
| `POST /api/auth/login` | `+banana:1` | **200 — logged in** |
| `POST /api/auth/signup` | `+banana:1` | **201 — the account is created** |
| `POST /api/auth/forgot-password` | `+banana:1` | **200** |
| `POST /api/tickets/[id]/comments` | `+banana:1` | **201 — the comment is created** |
| `PATCH /api/tickets/[id]` | `+banana:1` | **200 — the mutation applies** |
| `POST /api/tickets` | array body / `null` body | 400 (the existing value-level guards — correct) |

**The reference measured for comparison** (their entity API, from within the authenticated page, a create-then-delete probe cleaned up): their platform **silently DROPS** unknown body keys (a create carrying `banana:1` → 200, stored WITHOUT the key — the standard Pydantic/FastAPI ignore-extras behavior). So both sides silently ignore the unknown key; the difference is our own doctrine: sessions 24–29 established strict rejection as the deliberate superset on the QUERY surface (the s27 param-set contract: "validate the grammar, not just the values — three sessions closed the value families while `?banana=1` sailed through every gate because no test asked 'is this param allowed to exist?'"). The body surface is the last place that question is unasked.

**The judgment call.** This is the body-level variant of the s27 lesson-79 class: a caller sending the wrong endpoint's payload shape (the PATCH shape to the CREATE route), a platform-drift field, or a client bug gets a silently-wrong-shaped request accepted with no signal. The strict-validation doctrine says ours rejects with a self-documenting 400. The remediation closes the axis the same way the query surface was closed across s24–s29: **one shared seam, wired into every write route, unit-pinned + smoke-pinned.**

### P2 — the error-envelope consistency axis (clean but unpinned — closed with pins)

Every 4xx family measured live for its JSON key set:

| Family | Envelope | Verdict |
|---|---|---|
| 401 (unauthenticated) | `{error}` | CLEAN |
| 403 (non-owner PATCH) | `{error}` | CLEAN |
| 404 (unknown ticket / comment target) | `{error}` | CLEAN |
| 400 — grammar level (query) | `{error}` | CLEAN |
| 400 — malformed JSON | `{error}` | CLEAN |
| 400 — value level, non-form (PATCH invalid status) | `{error}` | CLEAN |
| 400 — form validation (create/comment/login/signup) | `{error, errors}` — the field record the UI maps onto form fields | CLEAN — the designed split |
| 409 (duplicate signup email) | `{error, errors}` | CLEAN — the same form-surface split |
| 405 (wrong method) | empty body, framework-generated | CLEAN — standard |

The convention is consistent BY DESIGN: the `errors` field-record rides ONLY the form-validation surfaces (where the UI consumes it); every single-message failure is `{error}` alone; 405 is the framework's. **Clean but unpinned** — the class where a future route hand-rolls a third shape (`{message}`, a bare string, `{detail}`) ships with no test failing. Closed with envelope pins in the s32 smoke block.

### P3 — the OPTIONS/HEAD body-surface axis (clean but unpinned — closed with pins)

Measured live: `HEAD /api/health` → 200 + the full header set, no body (per spec); `OPTIONS /api/health` → 204 + `allow: GET, HEAD, OPTIONS` + empty body; `HEAD /api/tickets` (unauthenticated) → 401 + the header set; `OPTIONS /api/stats` → 204 + the allow set; `HEAD /login` + `HEAD /` → 200. The s30 five-header set carries on every one (the s31 interplay contract). **Clean but unpinned** — closed with pins in the s32 smoke block (the API-route subset; the `/` → `/dashboard` redirect is the s2-pinned behavior).

## 2. The remediation (P1 TDD + P2/P3 pins)

### P1 — the request-body grammar seam (`parseBodyKeys`), wired into every write route

**The design:** one pure seam in `src/lib/validation.ts`, mirroring the s27 `parseListQuery` contract at the body level:

1. `parseBodyKeys(body: unknown, allowed: readonly string[])` → `{ ok: true } | { ok: false; error: string }` — rejects any top-level key outside the allowed set with `unknown request-body field: ${name} (allowed: ${allowed.join(", ")})`. Non-object bodies pass through untouched (the existing value-level validators already 400 them — measured: array/null bodies reject). The seam runs AFTER the JSON parse + (on rate-limited routes) after the limiter, BEFORE the field validators — the grammar level precedes the value level (the s27 ordering).
2. Wired into all six write routes with their allowed sets: tickets POST `{title, description, category, priority, attachments}` · PATCH `{status}` · comments POST `{content}` · login `{email, password}` · signup `{email, name, password}` · forgot-password `{email}`. (The DELETE logout consumes no body — no grammar to validate.)
3. **The s23 pin evolves** (the one deliberate behavior change on an existing pin): the create carrying a client-sent `status` previously 201'd with the status ignored; under the grammar seam it now 400s — `status` is not in the create's allowed set (a caller sending the PATCH shape to the CREATE route is exactly the cross-route confusion the seam exists to catch). The s23 contract — the SERVER controls the status — carries forward RE-PINNED: the happy-path create (no `status` sent) → 201 + `status:"open"`.
4. **Unit pins** in `src/lib/__tests__/domain.test.ts` (the pure seam): unknown key rejected with the message, the allowed set listed; known keys pass; empty object passes; non-objects pass through; each route's allowed set pinned via a constants export.
5. **Smoke pins** in the s32 block: the six grammar probes (each route's `+banana` → 400 + the message) + the cross-route probe (create `+status` → 400) + the evolved s23 formulation + the happy-path 201 + `status:"open"` re-pin.
6. **The rate-limiter arithmetic re-derived** (the s31 discipline): the s32 login grammar probe consumes login slot 3 (the limiter runs first — the grammar 400 still burns the attempt); the forgot grammar probe consumes forgot slot 1. Both 429 pins stay green by construction (the loops are unchecked; the asserted requests land past the bucket either way) — the comments updated to the true slot bookkeeping.

**The RED phase (a true TDD RED — no mutation needed):** unlike s31 (a clean contract pinned after the fact), this seam does not exist yet — the pins written first GENUINELY fail: the unit tests fail to import the seam; the smoke probes measure 201/200 (the silently-accepted behavior) against the 400 expectations. RED captured → implement the seam + wiring → GREEN.

**Non-goals (documented decisions, no code):** no nested-key strictness inside attachment objects (the normalizer already rebuilds each row field-by-field — `fileName/mimeType/sizeBytes/data` — so nothing unknown is ever STORED; the top-level grammar is where caller-shape bugs live); no body-grammar on GET/DELETE routes (they consume no body — a body sent to them is never read, and no caller does); no cloning of the reference's platform envelope shapes (their snake_case bare entities + the FastAPI `{message, detail, traceback}` error class stay the documented internal-API divergence); no change to any success-response shape (the s31 pins stay byte-green).

### P2 — the error-envelope pins (the s32 smoke block, pins only)

Three exact-key-set envelope pins: the 401 `{error}` exactly; the form-validation 400 `{error, errors}` exactly (the create route's invalid-category probe — the field record present); the 404 `{error}` exactly. The convention documented in the plan + AGENTS.md (the `{error}` / `{error, errors}` split is the contract; 405 is framework-standard empty).

### P3 — the HEAD/OPTIONS pins (the s32 smoke block, pins only)

Two pins: `HEAD /api/health` → 200 + the s30 header set (HSTS present, no X-Powered-By); `OPTIONS /api/health` → 204 + `allow: GET, HEAD, OPTIONS` + empty body. The API-route subset — the standing convention pinned where the framework surface is deterministic.

## 3. The verification plan

1. **TDD RED:** the unit pins written first (import fails against the current validation.ts) + the smoke probes run against the current build measuring the silent-accept behavior (201/200 where 400 is expected).
2. Implement the seam + the six-route wiring; unit suite → 110 + N green.
3. The full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → unit → build → E2E 196 → smoke (64 + the s32 lines).
4. Live re-verification on the production standalone :3000: the grammar matrix re-run by hand (every write route's `+banana` → 400, the happy paths intact) + re-runs of the s24–s31 standing live-verify scripts (all green = the eight prior sessions' contracts hold on the current build).
5. The UI round-trip (the real login → dashboard → submit-ticket → mytickets flow) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, nav-tap auto-close + navigate) + the desktop paired VLM check.
6. Screenshots (the 10-shot set) refreshed to `docs/screenshots/`; VLM spot-checks on the standing convention shots.
7. Docs alignment: README (the smoke count + the s32 notes), AGENTS.md (the session-32 contracts section + the commands table + the reference list through s32), CLAUDE.md (the counts + the smoke line + the s32 anti-pattern), PAD (§7.1 the smoke row + the s32 known-issues row), `service-desk_SKILL.md` (the new lesson), `docs/session_53.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.
8. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 4. Execution status

- [x] Gap analysis (F1–F5 + P1–P3) — complete, recorded in worklog task 75-gap-s32
- [x] P1 TDD (a TRUE RED — no mutation needed this time): the 9 unit pins written FIRST (the seam imports fail → **9 tests RED**, `parseBodyKeys is not a function`) → the `parseBodyKeys` seam implemented in `src/lib/validation.ts` + the six per-route allowed sets exported from `constants.ts` → **119 unit GREEN** → the seam wired into all six write routes → the s32 smoke block (12 pins) + the s23 pin EVOLVED in place (the banana-status create now asserts 400 + the grammar message) + the bare-create 201 + status:open re-pin + the rate-limiter comments re-derived (the s32 login probe consumes slot 3, the forgot probe consumes forgot slot 1 — both 429 pins stay green by construction) → rebuild → **GREEN: 76 PASS lines** (the standing 64 + the 12 new s32 pins — the six grammar probes with the allowed-set messages, the cross-route status-key reject, the happy-path re-pin, the three envelope pins, the two HEAD/OPTIONS pins)
- [x] Full gate in the clean environment: lint → typecheck → 119 unit → build → 196/196 E2E → smoke 76 — ALL GREEN; seed canonical after
- [x] Live re-verification: the standing re-runs ALL GREEN (s24 ALL GREEN + s25 13 + s26 15 + s27 14 + s28 12 + s29 22/22 + s31 14/14) + the NEW s32 live matrix (`scripts/s32-live-verify.mjs`, 18/18 — the six grammar contracts on the real :3000 DB, the cross-route shape, the happy-path round-trip, the envelope spot-checks, the HEAD/OPTIONS surface, fixtures cleaned, seed canonical) + the UI round-trip (login → dashboard stat cards + QUICK STATS + Performance Metrics + Average Resolution Time + Recent Tickets → /mytickets with the 5 demo tickets) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, Escape closes, nav-tap auto-closes + navigates) + the desktop paired VLM check (LAYOUT-OK; one rate-budget lesson re-learned — the re-runs + probes exhausted the login bucket mid-session, server restarted for fresh buckets, the standing doctrine)
- [x] Screenshots (the 10-shot set via `capture-screenshots-s32.sh`, the s31 lineage verbatim; FATAL guards green; VLM shots 02 + 05 RENDER-OK; seed canonical after the fixture removal) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.30.0 lesson 86/session_53.md/plan/worklog)
- [ ] Commit + push + CI verification
