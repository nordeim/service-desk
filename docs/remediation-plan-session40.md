# ServiceDesk — Session 40 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN re-cloned environment, remediation of the identified gap, and full re-verification. Session 40 follows the session-39 remediation (commits `3f67029` + `8caaddf` + the operator's `8c29aff` transcript commit; briefing docs `docs/session_67.md` + `docs/remediation-plan-session39.md` + `worklog.md` + `docs/session_68.md`). This session executes the s67 next-step shortlist: the standing ledger re-checks (a TWELFTH /login wave arrived), the s4-defect + overflow ledgers, and the own-side audit at the next level (the s67 candidates: the multi-window sweep assumption — verified documented-and-holding; the test-observer seam hygiene — verified clean; and the NEW surface audit that found the P1 below).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s39 response-layer/bundle/write-path/proxy doctrines). This session's headline findings: **the TWELFTH /login wave is a PURE RE-RENAME** (the entry pair rotated to `index-DV3Dmjzy.js` + `index-RwB3lDG6.css`; the eleventh-wave chunks are STILL on the CDN and byte-size-IDENTICAL to the twelfth's — `index-CBO659Ce.js` 103851 = `index-DV3Dmjzy.js` 103851, `UserAppMain-DJkeAsKI.js` 58756 = `UserAppMain-icZpSP83.js` 58756 — the only diff is the dependency-chunk hashes in the import statements; the app-route pair STILL the pre-s30 split `index-DhFaB31Z.js` + `index-DFdILd41.css`; `logoutReturnPath-HjtsxsFd.js` hash-stable; the live logout still carries `/login?from_url=…`); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 + mobile 468-vs-375 overflows all persist unchanged (22nd measurement; agent-browser itself refused the covered toggle click — its own coverage check names the `fixed top-0 z-[100]` toast div as the blocker)**; and the own-side audit found **one actionable defect: the 405 (Method Not Allowed) surface on known routes is EMPTY-BODY with NO content-type — the JSON boundary's remaining hole**.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: THE TWELFTH /login WAVE (a pure re-rename, non-gap)

The reference rotated its /login entry pair again: `index-CBO659Ce.js` + `index-BWbcAqev.css` (s39) → `index-DV3Dmjzy.js` + `index-RwB3lDG6.css`; `UserAppMain` renamed `DJkeAsKI` → `icZpSP83`; AuthAPI/AuthContext/axiosClient re-hashed. The eleventh-wave chunks are still on the CDN, and the twelfth-wave chunks are **byte-size-IDENTICAL** to them (index 103851 = 103851; UserAppMain 58756 = 58756) — the diff resolves to **dependency-chunk hash renames in the import statements only** (`axiosClient-j27914vq` → `axiosClient-By-uc5ii`, `base-dkMhIoLV` → `base-CGGs-6Ez`, …): even weaker than the eleventh's minifier-identifier renames. The login contract verified in the new sources: `from_url` ×14/1/2/2 in UserAppMain/AuthAPI/AuthContext/axiosClient (identical counts to the s38/s39 records) + all six login-card strings (`Sign in to`+`your account`, `Forgot password?`, `Sign up`, `Email`, `Password`, `Create your account`). The app-route pair is UNCHANGED (`index-DhFaB31Z.js` + `index-DFdILd41.css`, verified in the live DOM's script/link tags); `logoutReturnPath-HjtsxsFd.js` is hash-stable. The reference's LIVE logout measured: `/login?from_url=https%3A%2F%2F…%2F` — the s37 contract intact in the twelfth-wave bundle. **Non-gap (rotation).**

### F2 — the chrome ledger holds (twenty-second re-verification, non-gap)

All axes exact, both routes. `/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon) + og:image. `/dashboard`: plain viewport + NO PWA trio + og:image. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (twenty-second measurement). Ours: **1280 = 1280**. **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned)

Their `468`-vs-`375` mobile overflow persists (twenty-second). **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` still returns the `fixed top-0 z-[100]` toast-container div, and agent-browser's own coverage check REFUSED the REAL click on the Toggle Sidebar button ("covered by `<div.fixed.top-0`…") — the reference's mobile menu cannot be opened by a real click. Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667`), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision CLI): **LAYOUT-OK. Non-gap.**

### P1 — the own-side audit: the 405 surface on known routes (THE DEFECT)

The s33 doctrine closed the JSON boundary for unknown **paths** (the `[[...path]]` catch-all answers JSON 404 on every method). The s67 shortlist's "anything NEW" probe extended the audit one level: unknown **methods** on KNOWN paths. Measured live on the production standalone:

| Probe | Result |
|---|---|
| **The wrong-method matrix** | 16/16 probes across every known route (`PUT/POST/PATCH/DELETE /api/health`, `PUT/POST/DELETE /api/auth/me`, `PUT/PATCH/DELETE /api/stats`, `PATCH/DELETE /api/tickets`, `PUT/GET /api/tickets/<id>/comments`, `PATCH /api/auth/login`, `PUT /api/auth/logout`, `GET /api/auth/login`, …) → **405 with a 0-byte body and NO content-type** — the framework default for unimplemented methods |
| **The boundary hole** | A JSON client (`fetch` → `response.json()`) that PUTs to `/api/tickets` or DELETEs `/api/stats` gets an unparseable empty response — the exact defect class the s33 catch-all closed for unknown paths, still open at the method level |
| **The Allow-header gap** | RFC 9110 §15.5.6: "The origin server MUST generate an Allow header field in a 405 response" — the framework's 405 carries none |
| **The reference's posture** | Their platform (FastAPI, measured live with a safe wrong-method probe on their public-settings endpoint): **405 + `content-type: application/json` + a JSON body** (`{"error_type":"HTTPException","message":"Method Not Allowed",…}`) |
| **The design hazard (experiment-measured)** | Exporting a 405-stub method on a route makes Next's AUTO-OPTIONS advertise the stub as ALLOWED — measured live: with a PUT stub on `/api/health`, `OPTIONS /api/health` flipped to `allow: GET, HEAD, OPTIONS, PUT` (a lie — PUT 405s). The fix MUST pair every stub with an explicit honest OPTIONS |

**The judgment call.** The 405 status itself is correct everywhere (the dispatch works); the defect is the response SHAPE — the JSON boundary (our own s33 contract, not a mirror of their FastAPI envelope) and the missing Allow header. The fix: a shared `methodNotAllowed(allow)` seam returning `405 + {error} + Allow`, stubbed onto every unimplemented method of every known route, PAIRED with an explicit `OPTIONS` per route that re-asserts the honest allow list (replacing the framework's auto-advertisement, which would otherwise list the stub methods as allowed). The envelope follows OUR `{error}` convention (the s32/s33 single-message convention — the reference's FastAPI platform shape is a platform artifact, never mirrored; the parity axis here is the JSON-parseability, not the envelope's field names). The 405-by-method dispatch precedes auth/rate-limiting/body-grammar — same precedence as the s33 404-by-path (a wrong method never burns a rate-bucket slot, never reads a body: the s21 429 arithmetic is untouched).

## 2. The remediation

### Component 1 — P1: the 405 JSON-boundary closure (the seam + the per-route stubs)

**Code change (one new seam + 11 route edits):**

1. The new seam `src/lib/api-methods.ts`:
   - `methodNotAllowed(allow: string)` → `NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: allow } })` — the JSON body, the content-type, and the RFC-mandated Allow header in one place.
   - `optionsNoContent(allow: string)` → `new NextResponse(null, { status: 204, headers: { Allow: allow } })` — the explicit honest OPTIONS (the auto-advertisement's replacement; the s32 health pin's `204 + allow: GET, HEAD, OPTIONS + empty body` stays byte-identical).

2. The per-route stub matrix (the honest allow list = the CURRENT auto-OPTIONS advertisement, measured this session on the clean build):

| Route | Implemented | New 405 stubs | Honest `Allow` |
|---|---|---|---|
| `/api/health` | GET | POST, PUT, PATCH, DELETE | `GET, HEAD, OPTIONS` |
| `/api/auth/me` | GET | POST, PUT, PATCH, DELETE | `GET, HEAD, OPTIONS` |
| `/api/auth/login` | POST, DELETE | GET, HEAD, PUT, PATCH | `POST, DELETE, OPTIONS` |
| `/api/auth/logout` | POST | GET, HEAD, PUT, PATCH, DELETE | `POST, OPTIONS` |
| `/api/auth/signup` | POST | GET, HEAD, PUT, PATCH, DELETE | `POST, OPTIONS` |
| `/api/auth/forgot-password` | POST | GET, HEAD, PUT, PATCH, DELETE | `POST, OPTIONS` |
| `/api/stats` | GET | POST, PUT, PATCH, DELETE | `GET, HEAD, OPTIONS` |
| `/api/tickets` | GET, POST | PUT, PATCH, DELETE | `GET, HEAD, POST, OPTIONS` |
| `/api/tickets/[id]` | GET, PATCH | POST, PUT, DELETE | `GET, HEAD, PATCH, OPTIONS` |
| `/api/tickets/[id]/comments` | POST | GET, HEAD, PUT, PATCH, DELETE | `POST, OPTIONS` |
| `/api/tickets/[id]/attachments/[attachmentId]` | GET | POST, PUT, PATCH, DELETE | `GET, HEAD, OPTIONS` |

   Notes: HEAD is auto-derived (200-empty) on GET routes — NEVER stubbed there (the s32 pin); on POST-only routes HEAD is a 405 stub (the body is stripped by the HTTP layer, the status + Allow still speak). The catch-all `[[...path]]` route is UNCHANGED (it already answers every method with the JSON 404). The wrong-method probes on dynamic routes (`/api/tickets/<any>/comments`) need no fixture — the 405 dispatch precedes the DB lookup.

**TDD (the honest RED → GREEN):**
- Unit pins FIRST in a new `tests/api-methods.test.ts`: the `methodNotAllowed` shape (405 + `{error: "Method not allowed"}` + the Allow header) + the `optionsNoContent` shape (204 + empty body + the Allow header). RED against the missing seam (the import fails).
- Smoke pins (the s40 block, inserted after the s39-evict block): a per-route loop over the matrix above — each route's representative wrong method must answer **405 + `content-type: application/json` + `{"error":"Method not allowed"}` + an `Allow` header**, AND the route's OPTIONS must answer **204 + the exact honest allow string + an empty body** (the anti-lie pin: it fails if the explicit OPTIONS is dropped and the auto-advertisement grows the stub methods). Plus the HEAD-on-POST-only pin (`HEAD /api/auth/login` → 405) and the non-shadow re-affirmation (`GET /api/health` still 200 after the stubs). RED against the current tree: the 405 matrix fails on the empty body (16/16 measured); the OPTIONS pins pass pre-change on the auto-generated values (clean-but-unpinned closures, the s31 doctrine) EXCEPT the pins would catch the post-change lie if the explicit OPTIONS were forgotten.
- **No E2E pins** (the s21 doctrine — API contracts pin at the smoke layer; the E2E suite's 198 specs are untouched).

**The mutation check (post-GREEN):**
- Mutation A: remove the PUT stub from `/api/health` → the matrix pin for health fails (the framework's empty 405 returns).
- Mutation B: remove the explicit OPTIONS from `/api/health` → the auto-OPTIONS advertises `GET, HEAD, OPTIONS, PUT` (the stub lie) → the honest-allow pin fails.
- Mutation C: change the seam's body to `{error: "x"}` (wrong envelope) → the body pin fails.
- Each observed, reverted, re-verified clean.

### Component 2 — the docs alignment (the standing set)

README (the smoke description + the counts), AGENTS.md (the commands-table smoke description + the Session-40 contracts section + the reference list + the screenshots lineage), CLAUDE.md (the counts + the s40 anti-pattern — the boundary doctrine extends to the method level; the stub/OPTIONS pairing), PAD (§7.1 + the checklist + the known-issues row), `service-desk_SKILL.md` (lesson 94 + the version bump v2.38.0), `docs/DEPLOYMENT.md` (the 405 note in the API section if warranted), `docs/session_69.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.

## 3. Non-goals (documented decisions, no code)

- **No FastAPI envelope mirror:** the reference's 405 body (`error_type`/`message`/`detail`/`traceback`) is platform exhaust; ours stays `{error}` (the s32/s33 convention — the parity axis is JSON-parseability, not the envelope's field names).
- **No method-dispatch changes on the pages:** the JSON boundary is exactly `/api/**` (the s33 boundary — the pages' HTML surface is unchanged).
- **No new OPTIONS behaviors:** the explicit OPTIONS returns exactly what the auto-OPTIONS returned pre-change (the honest list — measured per route this session); nothing new is advertised, nothing old is removed.
- **No catch-all changes:** the `[[...path]]` route already answers every method with the JSON 404 (pinned s33); the known routes' 405s are the framework's dispatch, only their SHAPE is fixed.
- **No E2E method pins:** the smoke layer is the honest pin layer for the API surface (the s21 zero-fixture doctrine); the E2E count stays 198.

## 4. The verification plan

1. **TDD RED:** the unit pins (the new `tests/api-methods.test.ts`) + the smoke s40 block → observe the RED set against the current tree (the 405 matrix fails on the empty bodies; the OPTIONS pins are clean-but-unpinned closures passing on the auto-generated values).
2. **GREEN:** the seam + the 11 route edits → the unit pins green (178 → 181), the smoke block green (108 → 120 steps).
3. **The mutation check:** mutations A/B/C each prove the pins bite; revert; re-verify (the full unit suite clean).
4. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit → build → E2E (198 — unchanged) → smoke (120).
5. **Live re-verification** on the production standalone :3000 (PID-managed): the s40 live matrix (the wrong-method matrix re-probed on the fixed build + the OPTIONS advertisement table + the seed canonical) + the standing re-runs s24–s39 (the fresh-boot-between-batches doctrine, one script at a time with full output).
6. **The UI round-trip** (real login → dashboard → submitticket → submit → the toast → mytickets → the probe cleaned via Prisma, seed canonical) + the mobile matrix on the new build (375=375, the real click opens, Escape closes, nav-tap auto-close + navigate) + the desktop paired VLM check.
7. **Screenshots:** the 10-shot set refreshed via `scripts/capture-screenshots-s40.sh` (the s39 lineage + the header + the fixture title S40); VLM spot-checks on the convention shots.
8. **Docs alignment** (Component 2) + `.env.example` re-verified against the codebase.
9. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status, push the final status commit.

## 5. Execution status

- [x] Gap analysis (F1–F5 + P1) — complete, recorded in worklog task 111-gap-s40
- [x] The TDD RED (the unit import failed against the missing seam; the smoke s40 block failed at the first pin — PUT /api/health must carry content-type — the framework empty 405, 16/16 probes measured pre-change)
- [x] The GREEN (the src/lib/api-methods.ts seam + the 11-route stub matrices, applied via the persisted scripts/s40-apply-stubs.py)
- [x] The mutation check (A: the PUT stub removed — bit exactly the 405-shape pin; B: the explicit OPTIONS removed — bit the allow pin, the auto-advertisement grew the stubs exactly as predicted; C: the envelope corrupted — bit exactly the body pin; each observed, reverted, 181/181 re-verified)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 181/181 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓ (13 new steps: the 11-route matrix + the HEAD pin + the non-shadow pin)
- [x] Live re-verification: the s40 matrix 33/33 (the wrong-method matrix + the OPTIONS table + the HEAD contract + the non-shadow paths + the rate-budget non-interference + the s33 set-cookie + the s19/s37 bounces + the seed canonical) + the standing re-runs s24–s39 ALL GREEN (fresh boots between batches, the seed canonical after every script) + the UI round-trip (the probe submitted, listed, cleaned) + the mobile matrix (real clicks: 375=375, open, Escape, nav-tap) + the VLM check (LAYOUT-OK on the fixed build)
- [x] Screenshots (the 10-shot set via capture-screenshots-s40.sh, all FATAL guards passed; VLM 02 + 05 LAYOUT-OK; the four changed shots — 02/04/05 the time-relative seed dates, 09 the S40 fixture title — VLM-diffed BENIGN) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.38.0/DEPLOYMENT/session_69.md/plan/worklog) + .env.example re-verified
- [x] Commit + push + CI verification — commit 6219241 pushed to git@github.com:nordeim/service-desk.git main via docs/ssh_git_wrapper_v3.py (the dry-run green first with the explicit --remote — the s28 lesson held; the real push verified: remote == local HEAD @ 6219241, tracking synced, main only, tree clean; the operator key + the wrapper's temp key both shredded — no residue); the CI run on the push (run 38337613112, run_number 102) COMPLETED SUCCESS — verified both via the GitHub API directly and the live badge (build: passing on main, cache-buster-read)
