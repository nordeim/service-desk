# ServiceDesk — Session 36 Remediation Plan

**Date:** 2026-10-12
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 36 follows the session-35 remediation (commits `a04ba6a` + `482e8e6` + the operator's `dffd9e3`; briefing docs `docs/session_59.md` + `docs/remediation-plan-session35.md` + `worklog.md` + `docs/session_60.md`). This session executes the session_59 next-step shortlist: the standing ledger re-checks (the ninth /login wave? the s4-defect + the desktop/mobile overflow axes) and the own-side audit at the NEW level — **the proxy/matcher surface** (the from_url construction under spoofed Host/X-Forwarded-Proto headers, the s19 seam revisited at the header level).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s35 response-layer/bundle/write-path doctrines). This session's headline findings: **no ninth /login rotation** (the third consecutive quiet session — all three chunks identical to the s34/s35 record); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 + mobile 468-vs-375 overflows all persist unchanged**; and the session_59-directed proxy-surface audit measured the from_url construction under the full header matrix and found **the architecture HOLDS** — the reflection is inert (two independent guard layers) and the parser boundary rejects injection. **The actionable axis is the PIN GAP**: `src/proxy.ts` ships zero direct tests, the E2E suite pins the deep-link happy path but not the cross-origin rejection, and no live pin freezes the header matrix.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: NO ninth rotation (non-gap)

The /login chunks are UNCHANGED from the s34/s35 record: `index-BqoEA--d.js` + `index-C15ZH32J.css` + `UserAppMain-CDMsumUd.js` (the third consecutive quiet session). The login contract verified in the unchanged UserAppMain source (all five strings — "Sign in to continue" / "Forgot password?" / "Need an account" / "Sign up" / "Google" — + `from_url` ×14). The app-route pair STAYS on the old pre-s30 split: `/` (dashboard) serves `index-DhFaB31Z.js` + `index-DFdILd41.css` (verified live via performance resource entries). **No rotation — behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (eighteenth re-verification, non-gap)

All axes exact, both routes. `/login`: viewport-fit=cover + the PWA trio (manifest + theme-color #000000 + apple-touch-icon 180×180) + og:image 1200×630 + twitter:card summary_large_image + canonical at `/login`. `/` (dashboard): plain viewport + NO PWA trio + canonical/og:url/twitter:url at the origin root. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (the four decorative gradient blobs anchoring `right-0` to the un-clipped wrapper — eighteenth measurement). Ours: **1280 = 1280**. **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned)

Their `468`-vs-`375` mobile overflow persists (eighteenth). **The s4-documented toast-viewport blocking PERSISTS:** the Toggle Sidebar button (rect 24,16 → 52,44) has its center (38,30) inside the `fixed top-0 z-[100]` toast-container bands; the `elementFromPoint` hit-test lands on the container; the menu does NOT open on the reference. Ours: **375 = 375**, the button hit-tests to the BUTTON, the REAL agent-browser click opens the sheet, Escape closes it, and the My-Tickets nav-tap auto-closes + navigates with the correct title. One probe-tooling artifact documented: a synthetic DOM `.click()` on the nav Link left the sheet open — two independent REAL-click verifications (Playwright's suite + agent-browser's click) are green, so the user-facing behavior holds; the synthetic path is a non-verification, not a defect (recorded as a tooling lesson). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh, both captures verified on `/` and `/dashboard` before shooting): **LAYOUT-OK**. **Non-gap.**

### P1 — the own-side audit at the new level: the proxy/matcher surface (the pin gap)

The session_59 shortlist named the leading candidate: the from_url construction under spoofed Host/X-Forwarded-Proto headers. Measured live on our production standalone :3000 with raw-header probes:

| Probe | Result |
|---|---|
| **Spoofed Host on a guarded route** | `Host: evil.example` on `/dashboard` → 307, Location `/login?from_url=http%3A%2F%2Fevil.example%2Fdashboard` — the Location is RELATIVE (the browser stays on-origin) and the value is REJECTED at use time by `safeRedirectTarget`'s browser-origin check (the unit-pinned guard) — **two independent layers, the reflection INERT** |
| **X-Forwarded-Proto honored** | `X-Forwarded-Proto: https` flips the from_url to `https://…` — CORRECT behind a legit TLS proxy; under an attacker-supplied XFP it only breaks the attacker's own deep link (origin mismatch → /dashboard) — functional, not a hole |
| **X-Forwarded-Host ignored** | The Host header wins; XFH changes nothing |
| **CRLF injection in Host** | A raw-socket probe with CR inside the Host value → **400 Bad Request** (Node's http_parser — the framework boundary holds) |
| **The matcher boundary** | `/dashboard/nonexistent` renders the public 404 (NOT gated); no auth or API route is decorated |
| **The /login reflection surface** | `/login?from_url=<cross-origin>` reflects NOTHING into the HTML (grep-verified — the param is read client-side at submit time only; the XSS surface is closed) |
| **clientIp trusts XFF** | The documented s21 best-effort rate-limit key posture — unchanged, out of scope |

**The judgment call.** The code is CORRECT — the audit's job at this surface was to verify the s19 reasoning at the header level, and every measured spoof is neutralized by the two-layer guard (the relative Location keeps the browser on-origin; the client-side origin check rejects the reflected value at use time). What's missing is the FREEZE: `src/proxy.ts` has shipped through 17 sessions with zero direct tests (its behavior is pinned only indirectly, through the E2E happy path); the E2E suite pins the deep-link round-trip but never the cross-origin REJECTION; the header matrix (the reflection, the flip, the relative-Location property, the parser boundary) is documented nowhere executable. Per the pin-evolution doctrine (s32) and lesson 74's corollary (an unrecorded unchanged reads as an unsampled axis), **the remediation is the pin set**: unit pins on the proxy handler itself (the direct-call pattern the api-catchall tests established), one E2E pin for the open-redirect guard firing end-to-end, a smoke block freezing the live header matrix, and the standing live-verify script.

## 2. The remediation (P1 — the proxy-contract pin set)

### Component 1 — the unit pin file (a NEW `tests/proxy-fromurl.test.ts`)

Direct handler calls with constructed `NextRequest`s (the `tests/api-catchall.test.ts` pattern — the handler is pure; the seam is the handler signature):

1. **The cookie-present passthrough:** `servicedesk_session=…` on a guarded route → `NextResponse.next()` — status 200, `x-middleware-next: 1`, no Location.
2. **The plain construction:** cookie-less `/dashboard` → 307, the Location pathname is `/login`, and its `from_url` param equals `http://localhost:3000/dashboard` (the full absolute URL: protocol + host + path).
3. **The deep-link query survival:** `/ticketdetails?id=abc123` → the from_url carries the full URL including `?id=abc123` (the s19 shared-link contract).
4. **The spoofed-Host reflection (the documented INERT behavior):** `Host: evil.example` → the from_url equals `http://evil.example/dashboard` — pinning the MEASURED reflection with the two-layer-guard rationale in the comment (the Location pathname stays `/login`; the value is rejected at use time by the safeRedirectTarget pins in `src/lib/__tests__/redirect.test.ts`).
5. **The X-Forwarded-Host no-op:** XFH `evil.example` with a normal Host → the from_url still carries the Host-header value.
6. **The matcher source pin:** the exported `config.matcher` is EXACTLY `["/dashboard", "/submitticket", "/mytickets", "/ticketdetails"]` — the four-route boundary (unmatched sub-paths render the public 404; no auth or API route may be decorated).
7. **Documented in the file header:** the X-Forwarded-Proto protocol flip is a MIDDLEWARE-RUNTIME behavior (the direct call does not reproduce it — `nextUrl.protocol` derives from the constructed URL outside the runner) — it is pinned LIVE in the smoke block instead.

### Component 2 — the E2E pin (`tests/e2e/auth.spec.ts`, +1 test)

**"signing in from a cross-origin from_url lands on the dashboard (open-redirect guard)"** — visit `/login?from_url=https://evil.example/dashboard`, sign in with the demo credentials, `waitForURL("**/dashboard")`, assert the browser never leaves `localhost:3100`. This is the end-to-end firing of the guard the unit pins prove at the function level — the wiring pin (the login page passes the raw param through `safeRedirectTarget` before `router.push`). One real login (the suite moves from 6 to 7 of the 10-per-15-min budget).

### Component 3 — the smoke block (`scripts/smoke-test.sh`, the s36 section, ~6 pins, zero auth budget)

All probes ride the throwaway :3999 server the script already boots; none touches the login/forgot buckets:

1. **The spoofed-Host bounce:** `curl -H "Host: evil.example" $BASE/dashboard` → 307 + the Location is RELATIVE (starts with `/login`, not `http://evil.example`) + the from_url carries `evil.example`.
2. **The XFP flip:** `curl -H "X-Forwarded-Proto: https" $BASE/dashboard` → the from_url decodes to `https://localhost:3999/dashboard`.
3. **The XFH no-op:** `curl -H "X-Forwarded-Host: evil.example" $BASE/dashboard` → the from_url still carries `localhost:3999`.
4. **The /login non-reflection:** `GET $BASE/login?from_url=https%3A%2F%2Fevil.example%2Fdashboard` → the HTML contains zero `evil.example` occurrences (the param never renders server-side).
5. **The matcher boundary:** `GET $BASE/dashboard/nonexistent` → 404 (the public not-found page, NOT the login bounce).
6. **The deep-link query survival:** `GET $BASE/ticketdetails?id=abc123` → the from_url carries the `?id=abc123`.

### Component 4 — the live-verify script (a NEW `scripts/s36-live-verify.mjs`)

The full matrix against the real :3000 canonical server (the s30–s35 standing-script pattern, self-contained, fixtures cleaned):

1. The header matrix (the five curl-equivalent probes via fetch with custom headers).
2. **The CRLF raw-socket probe** (node's `net` module): a CR inside the Host value → the connection answers 400 Bad Request (the parser boundary — the one probe curl cannot send).
3. **The login round-trip with a cross-origin from_url** (ONE real login, its own fresh bucket): `GET /login?from_url=https://evil.example/s36` → sign in → the landing is `/dashboard` (the guard firing live).
4. The unguarded-sub-path 404 + the from_url non-reflection.
5. The seed re-verified canonical after.

### The pin-quality proof (the mutation check — the honest RED for a pin-only session)

No production code changes ship, so the classic TDD RED does not apply. The equivalent proof that the pins BITE — each mutation applied, the unit file run, the failure observed, the mutation reverted:

1. **Mutation A (the host source):** `request.headers.get("host")` → `request.nextUrl.host` — the spoofed-Host reflection pin must FAIL (the from_url would carry the constructed URL's host, not the header's).
2. **Mutation B (the query drop):** remove `${request.nextUrl.search}` from the target — the deep-link pin must FAIL.
3. **Mutation C (the matcher drift):** add `/api` to the matcher — the matcher source pin must FAIL.

Each observed failure proves the pin guards the contract; the revert restores the verified tree (the full gate re-runs after).

## 3. Non-goals (documented decisions, no code)

- **No change to `src/proxy.ts`:** the audit verified the two-layer guard architecture (the relative Location + the browser-origin check) under every measured spoof — the code is correct; the pins freeze it.
- **No change to `safeRedirectTarget`:** already 9-pinned at the function level (the cross-origin, protocol-relative, auth-page, hash, and unparseable cases).
- **No XFF hardening in `clientIp`:** the documented s21 best-effort posture — the limiter's keying is the shipped contract; changing it would alter the rate-limit arithmetic the s21 pins freeze.
- **No matcher expansion:** the four-route list is the documented boundary (unmatched sub-paths render the public 404 — the s19 ADR boundary).
- **The reference's posture:** their from_url is platform-generated (never user-suppliable pre-auth) — our guard is the documented superset for our user-suppliable param; nothing to clone.

## 4. The verification plan

1. **TDD-equivalent (the mutation check):** write the unit pins FIRST, run them against the verified tree (all green — they characterize existing behavior), then the three mutations each prove the pins fail (the bite check), then the revert.
2. The E2E pin + the smoke block + the live-verify script land with the same reasoning (the smoke probes re-verified against the live :3000 before the block is written — the measured-behavior-first doctrine).
3. The full gate in the CLEAN environment (no ambient :3000/:3100/:3999): lint → typecheck → unit (159 + the new pins) → build → E2E (196 + 1) → smoke (95 + the s36 lines).
4. Live re-verification on the production standalone :3000: the s36 matrix by hand + re-runs of the s24–s35 standing live-verify scripts (all green = the twelve prior sessions' contracts hold on the current build; the rate-budget doctrine — restart the server for fresh buckets, batch the re-runs).
5. The UI round-trip (the real login → dashboard → submitticket flow) + the mobile matrix on the new build (375=375, the button hit-tests to the BUTTON, the real click opens the sheet, nav-tap auto-close + navigate) + the desktop paired VLM check.
6. Screenshots (the 10-shot set) refreshed to `docs/screenshots/` via the s36 capture script (the s35 lineage verbatim); VLM spot-checks on the standing convention shots.
7. Docs alignment: README (the badge/counts + the s36 notes), AGENTS.md (the session-36 contracts section + the commands table + the reference list through s36), CLAUDE.md (the counts + the smoke line + the s36 lesson), PAD (§7.1 the smoke row + the s36 known-issues row), `service-desk_SKILL.md` (the new lesson — v2.34.0), `docs/session_61.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.
8. Git: commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 + P1) — complete, recorded in worklog task 92-gap-s36
- [x] The unit pin file (`tests/proxy-fromurl.test.ts`) — written, green on the verified tree (165 unit), the mutation check (A/B/C) each observed failing exactly one pin, the revert clean (6/6 re-verified)
- [x] The E2E pin (auth.spec.ts) — the cross-origin from_url round-trip (ran green in the 197/197 suite)
- [x] The smoke block (the s36 section, 6 pins) + the temp-file declarations in the trap cleanup — 101 PASS lines (95 + 6), 0 failures, the rate-limiter arithmetic unchanged
- [x] The live-verify script (`scripts/s36-live-verify.mjs`) — the full matrix (13/13, incl. the CRLF raw-socket 400 + the poisoned-/login checks)
- [x] Full gate in the clean environment: lint → typecheck → 165 unit → build → 197/197 E2E → smoke 101 — ALL GREEN
- [x] Live re-verification: the s36 matrix + the standing re-runs (s24–s35 ALL GREEN after the fresh-bucket restart) + the UI round-trip (the probe ticket created + listed + cleaned) + the mobile matrix (real clicks) + the VLM check (LAYOUT-OK)
- [x] Screenshots (the 10-shot set via capture-screenshots-s36.sh, all FATAL guards passed; VLM 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.34.0/session_61.md/plan/worklog)
- [x] Commit + push + CI verification — `42c3b92` pushed to main via `docs/ssh_git_wrapper_v3.py` (the paramiko shim at /home/z/my-project/bin/ssh on PATH, the venv python carrying paramiko 5.0.0; the key fingerprint verified before the push — SHA256:3ddaNlFhMz1JXiGEDgVEaRsUzI4Ev0IpGEEB7NnU4PU, identical to the s30–s35 records; the dry-run green first with the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson held; the remote verified untouched after the dry-run, then the real push verified: remote == local HEAD @ 42c3b92, tracking synced, main only, tree clean; the operator key + the wrapper's temp key both shredded — no residue) — **the CI run on the push (run 38199539146) completed SUCCESS** (verified via the GitHub API runs-list endpoint after the rate-limit window; the prior runs on dffd9e3 (38196310273) + 482e8e6 (38195557891) also green)
