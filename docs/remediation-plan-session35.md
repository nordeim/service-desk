# ServiceDesk — Session 35 Remediation Plan

**Date:** 2026-10-12
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 35 follows the session-34 remediation (commits `2a9b5dd` + `84aab53` + `d12e4ec`; briefing docs `docs/session_57.md` + `docs/remediation-plan-session34.md` + `worklog.md` + `docs/session_58.md`). This session executes the session_57 next-step shortlist: the standing ledger re-checks (the ninth /login wave? the app-route pair on the old split? the s4-defect + the desktop/mobile overflow axes against their newest rebuild) and the own-side audit at the NEW level — **the request-size surface** (the session_57-named leading candidate: the s34-measured 20 MB-buffered finding).

**Method:** Ground truth = computed styles + live interaction probes + HTTP-response probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s34 response-layer/bundle/write-path doctrines). This session's headline findings: **no ninth /login rotation** (the JS/CSS chunks + the UserAppMain chunk all byte-identical to the s34 record; the app-route pair still on the old pre-s30 split); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 + mobile 468-vs-375 overflows all persist unchanged**; and the session_57-directed request-size audit measured **two components of one axis**: (a) NO route-level body cap — a 20 MB JSON body on the ticket CREATE is fully buffered + parsed + rejected at the VALUE level (199 ms, the title-length 400) — and (b) the attachment **data-vs-declared-size divergence** — the per-file cap checks the DECLARED `sizeBytes` (attacker-controlled) while the actual base64 `data` payload is stored unchecked (measured: `sizeBytes: 11` + ~100 KB data → 201 stored), plus the **garbage-base64 hole** that defeats a decoded-length-equality check alone (1 MB of `!` chars decodes to 0 bytes → `sizeBytes: 0` passes equality; the base64 STRING length must also be bounded).

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: NO ninth rotation (non-gap)

The /login chunks are UNCHANGED from the s34 record: `index-BqoEA--d.js` + `index-C15ZH32J.css` (a second quiet session for the CSS) + `UserAppMain-CDMsumUd.js`. The login contract verified in the unchanged bundle source: all five strings ("Sign in to continue" / "Forgot password?" / "Need an account" / "Sign up" / "Google") + `from_url` ×14 in UserAppMain + ×1 in AuthAPI + ×2 in axiosClient. The app-route pair STAYS on the old pre-s30 split: `/` (dashboard) serves `index-DhFaB31Z.js` + `index-DFdILd41.css` (verified live via performance resource entries). **No rotation — behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (seventeenth re-verification, non-gap)

All axes exact, both routes. `/login`: viewport-fit=cover + the PWA trio (manifest + theme-color #000000 + apple-touch-icon 180×180) + og:image 1200×630 with "Base44 link preview" alt + twitter:card summary_large_image + canonical/og:url/twitter:url at `/login`. `/` (dashboard): plain viewport + NO PWA trio + the apple pair + canonical/og:url/twitter:url at the origin root. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (the four decorative gradient blobs anchoring `right-0` to the un-clipped wrapper — seventeenth measurement). Ours: **1280 = 1280**. **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned)

Their `468`-vs-`375` mobile overflow persists (seventeenth). **The s4-documented toast-viewport blocking PERSISTS:** the Toggle Sidebar button (rect 24,16 → 52,44) has its center (38,30) inside the `fixed top-0 z-[100]` toast-container bands; the `elementFromPoint` hit-test lands on the container; agent-browser REFUSES the real click ("covered by `<div.fixed.top-0…>`") and the menu does NOT open (0 dialogs; a raw DOM `.click()` opens it only because it bypasses the hit-test). Ours: **375 = 375**, the button hit-tests to the BUTTON, the real click opens the sheet, Escape closes it, and the My-Tickets nav-tap auto-closes + navigates with the correct title (the snapshot-ref workflow). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh, glm-4.6v) verdicts **LAYOUT-OK** (our capture verified at `/dashboard` before shooting — the operator-capture lesson held; no re-shoot needed this session). **Non-gap.**

### P1 — the own-side audit at the new level: the request-size surface (THE actionable axis, two components)

The session_57 shortlist named the leading candidate: the s34-measured 20 MB-buffered finding — "a shared Content-Length ceiling seam on the write routes, checked before the body is read." Measured live on our production standalone :3000:

| Probe | Result |
|---|---|
| **The 20 MB JSON body on the CREATE** | 400 at the VALUE level (title-length), 199 ms — the full 20 MB **buffered + JSON-parsed** per request; NO route-level body cap exists (the 2 MiB ceiling is per-ATTACHMENT only) |
| **The sizeBytes/data divergence** | `sizeBytes: 11` (declared) + ~100 KB base64 (actual) → **201 — STORED**: the per-file cap checks the DECLARED number, the payload is stored unchecked |
| **The garbage-base64 probe** | 1 MB of `!` chars (Node decodes to 0 bytes) + `sizeBytes: 0` → **201 — STORED**: a decoded-length-equality check alone would NOT catch this (0 === 0) — the base64 STRING length must also be bounded |
| **The max-legit boundary** | 3 × 2 MiB attachments as canonical base64 (body ≈ 8,394,006 bytes) → 201 in 178 ms — the ceiling must stay above ~8.4 MB |
| The reference's posture | The documented s23 record: their platform caps nothing (15 MiB accepted) — re-probing their API blind 405s (their entity API is UI-issued-JWT-authed; their bundle is byte-identical this session, so no drift) — **a DoS-hardening superset like the s21 rate limiter, not a parity gap** |

**The judgment call.** Two components, one axis — what a request can CARRY:

1. **The envelope (no body cap).** Every write route calls `req.json()` with no ceiling: an attacker sends arbitrarily large JSON bodies and the server buffers + parses each one before the value-level rejection. A shared `Content-Length` ceiling, checked BEFORE the body is read, bounds the per-request memory + parse CPU at the header-read cost (~free). `MAX_BODY_BYTES = 10 MiB` (10,485,760): ~20% headroom above the legitimate maximum (measured 8,394,006 bytes: 3 × 2 MiB canonical base64 + the 5000-char description + title + JSON structure) while bounding the abuse at a tenth of the s34 probe. Chunked bodies (no Content-Length header) pass through the seam — the value-level caps still apply (documented honestly: the header is the only pre-read signal).

2. **The payload (the data-vs-declared-size divergence).** `validateAttachments` checks the DECLARED `sizeBytes` — a number the attacker fully controls — while the actual base64 `data` is stored unchecked. The honest contract: **the declared size must be the true size.** Two checks close it: (a) the base64 string length is bounded by the canonical maximum for a ≤2 MiB payload (`4 × ceil(ATTACHMENT_MAX_BYTES / 3)` = 2,796,204 chars — catches the garbage-padding probe that decodes to 0 bytes but stores megabytes), and (b) the decoded length EQUALS the declared `sizeBytes` (the UI satisfies this exactly: both derive from the same `File`; verified in `src/app/(app)/submitticket/page.tsx`). The checks go AFTER the four existing per-file guards (declared-size cap → filename → MIME) so every pinned error message keeps its order — the smoke probes for count/size/traversal/MIME all reject before the data checks fire.

**The fixture audit for the equality contract** (the pin-evolution doctrine, s32): the E2E visual-parity fixtures carry sloppy declared sizes — `sizeBytes: 8` with 25–30-byte payloads (the s13 detail/heading/description fixtures ×4 sites), `26` vs 25 (s14-probe), `19` vs 18 (quoted-name), `15` vs 13 (s15-cache) — and the smoke s31 fixture declares `11` with a 10-byte payload. All corrected to the honest decoded lengths. The detail view renders "Attachment N" (the reference's generic labels) — `sizeBytes` is display-inert (verified in `ticket-details-view.tsx`), so the corrections change nothing visible.

## 2. The remediation (P1 — the request-size contract)

### Component 1 — the shared `parseBodySize` seam

1. **The constant** (`src/lib/constants.ts`): `MAX_BODY_BYTES = 10 * 1024 * 1024` with the measured-rationale comment (the 8,394,006-byte legitimate max + the headroom).
2. **The seam** (`src/lib/validation.ts`): `parseBodySize(contentLength: string | null): { ok: true } | { ok: false; error: string }` — null/absent (chunked) → ok (the value caps still apply downstream — documented); a non-numeric value → ok (Node's HTTP parser rejects malformed Content-Length before the handler — documented); a numeric value > MAX_BODY_BYTES → `{ ok: false, error: "request body too large: N bytes (max 10485760)" }`.
3. **The wiring** (all six write routes): the seam runs between `parseNoQuery` and `req.json()` — AFTER the rate limiter on login/signup/forgot (the s21/s29/s32 convention: every attempt burns a bucket slot, and the s21 pins stay green), BEFORE any body read. A failure returns **413** (`Payload Too Large` — the semantic code; the envelope stays the family's `{error}`) — `NextResponse.json({ error: parsedSize.error }, { status: 413 })`. Routes: `POST /api/tickets` (create), `PATCH /api/tickets/[id]`, `POST /api/tickets/[id]/comments`, `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/forgot-password`. The catch-all POST/PUT/PATCH never reads the body (404 without buffering — no seam needed there).

### Component 2 — the `validateAttachments` data contract

1. **The interface**: `RawAttachment` gains the required `data: string` (the row IS its data; the route's normalizer already builds it — `String(a.data ?? "")`).
2. **The checks** (appended AFTER the existing per-file guards — the pinned message order preserved): (a) `data.length > 4 * Math.ceil(ATTACHMENT_MAX_BYTES / 3)` → `"${fileName}" has an invalid encoded payload` (the string bound — catches the garbage-padding hole); (b) `Buffer.from(data, "base64").length !== sizeBytes` → `"${fileName}" does not match its declared size` (the honesty contract — catches the divergence).
3. **The route** (`src/app/api/tickets/route.ts` POST): the normalized array already carries `data` — the `validateAttachments` call passes it through unchanged.

### The pins (the s30–s34 pattern — the seam contract at the unit level + the live surface)

1. **Unit pins (a NEW `tests/body-size.test.ts` + the `domain.test.ts` extension):** `parseBodySize` — null → ok; "0"/small → ok; exactly 10,485,760 → ok (the inclusive boundary); 10,485,761 → the 413 message; a huge value → the message. `validateAttachments` — the honest row → ok; the divergence row (11 declared, 100 KB actual) → the mismatch message; the garbage row (0 declared, 1 MB of `!`) → the string-bound message; the max-legit row (2 MiB canonical) → ok (the no-false-rejection boundary). The constant relation pin: the legitimate max body (3 × canonical-2 MiB base64 + the 5000-char description + title + JSON structure) < MAX_BODY_BYTES (the headroom pin).
2. **Smoke pins (the s35 block, ~5 pins):** (a) the 20 MB body on the CREATE → 413 + the message (the envelope pin, no fixture); (b) the 20 MB body on the COMMENT route → 413 (the shared-seam-across-routes pin — NOT login: the rate-limiter arithmetic must stay UNCHANGED); (c) the divergence probe (11 declared + 100 KB actual) → 400 "does not match its declared size"; (d) the garbage probe (0 declared + 1 MB `!`) → 400 "invalid encoded payload"; (e) the max-legit boundary (3 × 2 MiB) → 201 + the fixture ticket cleaned (the no-false-rejection pin); (f) the chunked probe (no Content-Length, an oversized-title body via `-H "Transfer-Encoding: chunked"`) → the value-level 400, NOT 413 (the documented pass-through).

### Non-goals (documented decisions, no code)

- **No `next.config.ts` body cap:** the standalone server has no framework-level request-size knob (the `headers()` rules are response headers); the seam is ours to own at the route layer — same reasoning as the s30 HSTS decision (app-level, proxy-independent).
- **No ceiling on the GET routes:** GETs never read bodies (no `req.json()` anywhere on the read paths — grep-verified); the catch-all 404 never reads the body.
- **No change to the per-attachment 2 MiB cap or the 3-file cap:** those are the s23 contracts; the new checks complete them (the declared-size cap was enforcing a number the attacker controlled — now the number must be true).
- **No `Vary`/method-level changes; no middleware/proxy edits:** the seam is the six write routes only.
- **The reference's uncapped posture is NOT cloned:** the s23 15 MiB measurement + this session's posture re-check (their bundle byte-identical → no drift) — the cap is our superset, like the s21 rate limiter and the s34 no-store.

## 3. The verification plan

1. **TDD RED:** the new unit pins written FIRST (`tests/body-size.test.ts` fails to collect — the `parseBodySize`/`MAX_BODY_BYTES` exports do not exist; the `domain.test.ts` data-pins fail individually against the current unchecked `validateAttachments`) + the smoke probes re-run against the current build measuring the pre-fix behavior (the 400-at-value-level 20 MB probe, the 201-stored divergence).
2. Implement: the constant → the seam → the `validateAttachments` extension → the six route wirings → the fixture corrections (7 E2E sites + the smoke s31 site).
3. The full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → unit → build → E2E 196 → smoke (89 + the s35 lines).
4. Live re-verification on the production standalone :3000: the s35 request-size matrix by hand (the 20 MB → 413 fast; the divergence → 400; the garbage → 400; the max-legit → 201 + cleaned) + re-runs of the s24–s34 standing live-verify scripts (all green = the eleven prior sessions' contracts hold on the current build).
5. The UI round-trip (the real login → dashboard → submitticket flow — the attachment picker still works end-to-end on the new contract) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, nav-tap auto-close + navigate) + the desktop paired VLM check.
6. Screenshots (the 10-shot set) refreshed to `docs/screenshots/`; VLM spot-checks on the standing convention shots.
7. Docs alignment: README (the badge/counts + the s35 notes), AGENTS.md (the session-35 contracts section + the commands table + the reference list through s35), CLAUDE.md (the counts + the smoke line + the s35 anti-pattern), PAD (§7.1 the smoke row + the s35 known-issues row), `service-desk_SKILL.md` (the new lesson — v2.33.0), `docs/session_59.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.
8. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 4. Execution status

- [x] Gap analysis (F1–F5 + P1) — complete, recorded in worklog task 88-gap-s35
- [x] P1 TDD (a TRUE RED): the unit pins written FIRST — the 11 pins in a NEW tests/body-size.test.ts (the constant value + the headroom relation + the boundary/pass-through matrix; a NEW file so the missing-export load-failure REDs alone, not the whole domain suite) + the 5 data pins into the existing domain.test.ts describe (the divergence, the garbage form, the overlong interplay, the honest boundary, the empty-data lie) → RED confirmed (11 load-failures + 3 individual failures; the existing 144 kept passing) → the implementation (MAX_BODY_BYTES in constants.ts → the parseBodySize seam + the RawAttachment.data required field + the canonical-form check + the decoded-length equality in validation.ts → the six route wirings between parseNoQuery and req.json(), after the limiter on the rate-limited routes per the s21/s29/s32 convention) → 159 unit GREEN (143 + 16) + lint ✓ typecheck ✓
- [x] The fixture corrections (the pin-evolution doctrine): the 7 E2E visual-parity sites (8→25 ×2, 8→26, 8→30, 26→25, 19→18, 15→13) + the smoke s31 fixture (11→10) + the s29/s31 live-verify fixtures (4→5, 11→10) + the screenshot script's curl fixture (44→36) — sizeBytes display-inert (the detail view renders the generic "Attachment N", verified)
- [x] The s35 smoke block (6 pins: the 20 MB create 413 + the ceiling message; the 20 MB comment 413 — the shared seam; the divergence 400 "does not match its declared size"; the garbage 400 "invalid encoded payload"; the 3×2MiB max-legit 201 — the no-false-rejection boundary; the chunked pass-through 400-not-413) + the six new temp files in the trap cleanup (the s33 hardening doctrine); the rate-limiter arithmetic UNCHANGED (zero new login/forgot requests — the comment-route cross-pin chosen over login precisely to keep it)
- [x] Full gate in the clean environment: lint → typecheck → 159 unit → build → 196/196 E2E (the fixture corrections hold) → smoke 95 — ALL GREEN; seed canonical after (4/11/3/0)
- [x] Live re-verification: the NEW s35 live matrix (scripts/s35-live-verify.mjs, 13/13 — the 20 MB create 413 in 6.6 ms vs the pre-fix 199 ms, the comment-route 413, the divergence + garbage 400s, the 3×2MiB boundary 201 + cleaned, the chunked pass-through) + the standing re-runs ALL GREEN (s24 + s25 13 + s26 15 + s27 14 + s28 12 + s29 22/22 + s31 14/14 + s32 18/18 + s33 24/24 + s34 17/17 — two rate-budget lessons re-learned: the bucket exhausted mid-sequence; the server restarted for fresh buckets + the re-runs batched; one probe-tooling incident handled per the doctrine: the re-run chaos left the canonical db empty — all the write-scripts provably scoped, the seed re-pushed + re-seeded + the leftover probe user removed → canonical verified, then the controlled two-batch sequence all green) + the UI round-trip (login → dashboard → submitticket with a REAL attachment through the picker → 201 → listed in mytickets — the FileReader-derived sizeBytes + data pass the new equality end-to-end → the probe cleaned) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, Escape closes, nav-tap auto-closes + navigates) + the desktop paired VLM check (LAYOUT-OK)
- [x] Screenshots (the 10-shot set via capture-screenshots-s35.sh, the s34 lineage verbatim + the fixture honesty fix 44→36; VLM shots 02 + 05 LAYOUT-OK; seed canonical after) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.33.0 lesson 89/session_59.md/plan/worklog)
- [ ] Commit + push + CI verification
