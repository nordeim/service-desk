# ServiceDesk — Session 37 Remediation Plan

**Date:** 2026-10-12
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment, remediation of the identified gap, and full re-verification. Session 37 follows the session-36 remediation (commits `42c3b92` + `c65eb96` + `774ba15` + the operator's `50f2707`; briefing docs `docs/session_61.md` + `docs/remediation-plan-session36.md` + `worklog.md` + `docs/session_62.md`). This session executes the session_61 next-step shortlist: the standing ledger re-checks (the NINTH /login wave after four consecutive quiet sessions raises the odds, the s4-defect + the desktop/mobile overflow axes) and the own-side audit at the NEW level — **the auth-cookie lifecycle surface** (the s36 shortlist's leading candidate: the cookie's interaction with the proxy bounce + the logout path).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s36 response-layer/bundle/write-path/proxy doctrines). This session's headline findings: **no ninth /login rotation** (the FOURTH consecutive quiet session — all chunks identical to the s34–s36 record); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 + mobile 468-vs-375 overflows all persist unchanged**; and the session_61-directed auth-cookie lifecycle audit measured the full cookie lifecycle and found the login set-cookie, the logout clear, and the spoofed-origin postures CLEAN — but **one actionable parity gap: the invalid/expired-cookie deep link is LOST** (the cookie-less bounce decorates from_url per the s19 contract; the cookie-present-but-invalid bounce redirects PLAIN to /login, dropping the deep link — while the reference's client-side gate preserves it in ALL unauthenticated cases, bundle-verified). Two secondary items: the logout navigation lacks the reference's from_url carry (P2), and a DEPLOYMENT.md accuracy fix (P3).

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: NO ninth rotation (non-gap)

The /login chunks are UNCHANGED from the s34–s36 record: `index-BqoEA--d.js` + `index-C15ZH32J.css` + `UserAppMain-CDMsumUd.js` (the fourth consecutive quiet session). The login contract verified in the unchanged sources (all five strings + `from_url` ×1 in each of UserAppMain / AuthAPI-Ic7wCbYu / AuthContext-BTluc1QR / axiosClient-oQdHWduI — the s29+ re-split distribution). The app-route pair STAYS on the old pre-s30 split: `/` (dashboard) serves `index-DhFaB31Z.js` + `index-DFdILd41.css` (verified live via performance resource entries + the DOM script tags). **No rotation — behavior unchanged. Non-gap.**

### F2 — the chrome ledger holds (nineteenth re-verification, non-gap)

All axes exact, both routes. `/login`: viewport-fit=cover + the PWA trio (manifest + theme-color #000000 + apple-touch-icon 180×180) + og:image 1200×630. `/` (dashboard): plain viewport + NO PWA trio + canonical/og:url/twitter:url at the origin root. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (nineteenth measurement — the decorative gradient blobs anchoring `right-0` to the un-clipped wrapper). Ours: **1280 = 1280**. **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned)

Their `468`-vs-`375` mobile overflow persists (nineteenth). **The s4-documented toast-viewport blocking PERSISTS:** the Toggle Sidebar button's center hit-test lands on the `fixed top-0 z-[100]` toast-container band; the menu does NOT open on the reference. Ours: **375 = 375**, the REAL agent-browser click opens the sheet, Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (re-verified with real clicks on this session's build). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh, both captures verified on-page before shooting): **LAYOUT-OK**. **Non-gap.**

### P1 — the own-side audit at the new level: the auth-cookie lifecycle surface

The session_61 shortlist's leading candidate, measured live on the production standalone :3000:

| Probe | Result |
|---|---|
| **Login set-cookie attributes** | The exact s33 set: `Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=lax`; NO `Domain` attribute → host-only cookie → no cross-origin cookie-scoping surface. CLEAN |
| **Logout under spoofed Host** | The clear-cookie carries the exact s33 set (`Path=/; Max-Age=0; Secure; HttpOnly; SameSite=lax`); host-only → the spoofed Host cannot redirect the cookie to another host; post-logout the from_url bounce returns with the spoofed host reflected — the same INERT two-layer guard (s36). CLEAN |
| **Cookie-less deep link** (the s19 contract) | `/ticketdetails?id=abc123` → 307 → `/login?from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Dabc123` — the deep link survives. HOLDS |
| **Invalid/expired-cookie deep link** | `/ticketdetails?id=abc123` with `Cookie: servicedesk_session=<tampered>` → 307 → **PLAIN `/login` — THE DEEP LINK IS LOST**. Same for a wrong-key-signed token. **THE GAP** |
| **The reference's expired-session posture** | Their gate is CLIENT-SIDE (bundle: `window.location.href = '/login?from_url=' + encodeURIComponent(window.location.href)`) — the deep link is preserved in ALL unauthenticated cases, expired JWT included. Our server-side split preserves it only for the cookie-less fast path. **Verified asymmetry** |
| **The reference's logout navigation** | Their logout navigates to `/login?from_url=<current page href>` (bundle: the `v()` function) — after re-login they RETURN to where they were. Ours pushes plain `/login` → after re-login `/dashboard`. **P2 (minor parity)** |
| **DEPLOYMENT.md XFP line** | "forward X-Forwarded-Proto so cookie attributes derive the right scheme" is INACCURATE — the cookie Secure attribute derives from `NODE_ENV` only; XFP affects the proxy's from_url protocol (the s36 contract). The Secure-cookie-over-plain-HTTP trap (browsers drop Secure cookies on plain-HTTP non-localhost origins → login silently fails) is undocumented. **P3 (doc accuracy)** |

**The judgment call.** The user-visible scenario for P1: a user whose 7-day session expired clicks a shared `/ticketdetails?id=X` link → lands on `/login` → signs in → lands on **/dashboard** instead of the ticket. The reference returns them to the ticket. The gap has been live since the s19 proxy split (17 sessions) — the asymmetry was documented in the proxy's comments as a trade-off ("only the cookie-less fast path gains the from_url decoration") but never measured against the reference's expired-session behavior until this session. The fix must respect the ADR-001 boundary (the proxy never resolves sessions): the LAYOUT remains the authoritative verifier; the proxy merely passes the constructed target to it as a request header (the same value it already builds for the cookie-less bounce — one construction site). The header overwrite must be total (a client-supplied `x-sd-from-url` must never survive), and the value stays inert-at-use (safeRedirectTarget validates it against the browser origin at submit time — the s36 two-layer-guard pattern: relative Location + use-time validation).

## 2. The remediation

### Component 1 — P1: the expired-cookie deep-link preservation (the layout-side from_url bounce)

**Code changes:**

1. `src/proxy.ts` — on the cookie-PRESENT path, pass the constructed target downstream: `NextResponse.next({ request: { headers } })` where `headers` is a copy of the request headers with `x-sd-from-url: <target>` OVERWRITTEN (probing verified the mechanism: the runner applies `x-middleware-request-x-sd-from-url` and the full `x-middleware-override-headers` set). The target construction is extracted so the cookie-less bounce and the header share ONE site (`buildTarget(request)`).
2. `src/lib/redirect.ts` — a new pure seam `loginBounceUrl(fromUrl: string | null | undefined): string`: absent → `/login`; present → `/login?from_url=${encodeURIComponent(fromUrl)}` (the layout-side mirror of the proxy's Location construction).
3. `src/app/(app)/layout.tsx` — when `getCurrentUser()` returns null, read `x-sd-from-url` via `await headers()` and `redirect(loginBounceUrl(target))` (plain `/login` only as the defensive fallback when the header is absent — the layout is only reachable behind the proxy for the four routes, but the fallback keeps the guard total).

**Security posture (unchanged from s36's measured two-layer guard):** the from_url value may carry a spoofed Host — the Location stays RELATIVE (the browser never leaves the origin), and the value is validated against the BROWSER'S origin at use time by `safeRedirectTarget` (the 9 unit-pinned guard). The client-supplied `x-sd-from-url` header is overwritten by the proxy on every matched request (a client value never reaches the layout); even if one did, the value is inert at use.

**TDD:**
- Unit pins FIRST (the honest RED — these fail against the current tree):
  - `tests/proxy-fromurl.test.ts` +2: the cookie-present passthrough carries `x-middleware-request-x-sd-from-url` = the constructed target (incl. the query for a deep link); a CLIENT-SUPPLIED `x-sd-from-url` is OVERWRITTEN (the spoof-resistance pin).
  - `src/lib/__tests__/redirect.test.ts` +2: `loginBounceUrl(null)` → `/login`; `loginBounceUrl(<absolute url>)` → the encoded `/login?from_url=…`.
- E2E pin (auth.spec.ts, +1 test, +1 real login — the suite moves 7 → 8 of the 10/15-min budget): "an expired-session deep link bounces to /login carrying from_url and returns after sign-in" — inject a tampered session cookie, visit `/ticketdetails?id=<seeded>`, assert the `/login?from_url=…` bounce (RED against the current tree: the bounce is plain `/login`), sign in, land back on the ticket.
- Smoke pins (the s37 block, zero auth budget): the invalid-cookie bounce carries from_url (curl with a tampered cookie on `/ticketdetails?id=…`); the invalid-cookie bounce under a spoofed Host keeps the RELATIVE Location (the two-layer guard preserved); the header mechanism does not leak to unguarded routes (the four-route matcher boundary unchanged).
- Live-verify script (`scripts/s37-live-verify.mjs`): the full lifecycle matrix — the login set-cookie attributes, the invalid-cookie bounce (plain + deep-link + spoofed-Host variants), the layout-side from_url round-trip with one real login, the logout clear-cookie + the post-logout bounce, and the seed re-verified canonical after.

### Component 2 — P2: the logout from_url parity

**Code change:** `src/components/app-sidebar.tsx` — the sign-out handler navigates to `` `/login?from_url=${encodeURIComponent(window.location.href)}` `` (the reference's measured `v()` behavior: after re-login the user returns to where they signed out from). The value is same-origin by construction and validated at use time by the existing safeRedirectTarget seam.

**TDD:** an E2E pin in dashboard.spec.ts (uses the shared storageState): click the sidebar sign-out on /dashboard → the URL becomes `/login?from_url=http://localhost:3100/dashboard` (RED against the current plain `/login` push) — the sign-out clears the session and carries the deep link. No unit pin (the change is a one-line navigation string; the E2E pin is the honest layer).

### Component 3 — P3: the DEPLOYMENT.md accuracy fix

- Correct the XFP line: X-Forwarded-Proto serves the auth-gate from_url scheme (the s36 contract); the cookie Secure attribute derives from NODE_ENV.
- Document the Secure-over-plain-HTTP trap: a production standalone on a plain-HTTP non-localhost origin has its Secure set-cookie dropped by browsers — login silently fails; deploy behind TLS (the XFP flip then makes the from_url protocol correct too).

### The pin-quality proof

- P1 is a REAL TDD cycle (not pin-only): every new pin is written FIRST and observed RED against the current tree (the unit pins: no header / no helper; the E2E pin: the plain `/login` bounce; the smoke pin: the plain bounce), then the implementation lands and each goes GREEN.
- The mutation check (the belt-and-braces that the pins BITE, post-green): (A) the proxy's header-set removed → the two new proxy pins fail; (B) `loginBounceUrl` hardcoded to `/login` → the two redirect pins fail; each observed, then reverted, the tree re-verified clean.

## 3. Non-goals (documented decisions, no code)

- **No HMAC verification in the proxy:** the ADR-001 boundary holds — the proxy checks cookie PRESENCE only; the layout remains the single authoritative verifier. The fix passes information downstream; it does not move the verify.
- **No change to the cookie attribute set:** the s33-pinned set (Path, Max-Age, Secure, HttpOnly, SameSite=lax) is the frozen contract; the audit verified it CLEAN under spoofed origins.
- **No `__Host-`/`__Secure-` cookie prefix:** a hardening option, not a parity item (the reference sets no prefixes); the host-only no-Domain cookie is the measured reference posture.
- **No logout rate limiting:** the logout route clears a host-only cookie; there is no brute-force or abuse surface (the s21 limiter covers credential endpoints only).
- **No XFF hardening in `clientIp`:** the documented s21 best-effort posture — unchanged, out of scope (the session_61 shortlist's third candidate, still deferred).
- **The reference's platform logout URL flow** (`/api/apps/auth/logout?from_url=…` + full page navigation) is NOT mirrored — our server-side clear + client navigation is the documented superset; only the from_url CARRY is parity.

## 4. The verification plan

1. **TDD RED:** write the 4 unit pins + the 2 E2E pins + the smoke block → observe each FAIL against the current tree (the honest RED; the E2E RED needs a build first).
2. **GREEN:** implement Component 1 (proxy header + loginBounceUrl + layout) and Component 2 (sign-out from_url) → the unit pins green (169 unit), the E2E pins green, the smoke block green (104 steps).
3. **The mutation check:** mutations A/B each prove the pins bite; revert; re-verify.
4. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (165 + 4) → build → E2E (197 + 2) → smoke (101 + 3).
5. **Live re-verification** on the production standalone :3000: the s37 lifecycle matrix by hand + re-runs of the s24–s36 standing live-verify scripts (all green = the thirteen prior sessions' contracts hold on the current build; the rate-budget doctrine — restart the server for fresh buckets, batch the re-runs).
6. **The UI round-trip** (real login → dashboard → submitticket → submit → toast → mytickets → probe cleaned) + the mobile matrix on the new build (375=375, real click opens, Escape closes, nav-tap auto-close + navigate) + the desktop paired VLM check.
7. **Screenshots** (the 10-shot set) refreshed to `docs/screenshots/` via the s37 capture script (the s36 lineage); VLM spot-checks on the standing convention shots.
8. **Docs alignment:** README (the counts + the s37 notes), AGENTS.md (the session-37 contracts section + the commands table), CLAUDE.md (the counts + the s37 lesson), PAD (§7.1 + the checklist + the known-issues row), `service-desk_SKILL.md` (the new lesson — v2.35.0), `docs/session_63.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`, `docs/DEPLOYMENT.md` (the P3 fix).
9. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status.

## 5. Execution status

- [x] Gap analysis (F1–F5 + P1/P2/P3) — complete, recorded in worklog task 96-gap-s37
- [x] The TDD RED (4 unit + 2 E2E pins + the smoke block, each observed failing against the pre-fix tree — the unit pins on the missing seam/header, the E2E pins on the plain /login bounce, the smoke pin identically)
- [x] The GREEN (proxy header + loginBounceUrl + layout bounce + sign-out from_url) — the full gate re-verified: lint ✓ typecheck ✓ 169/169 unit ✓ build ✓ 198/198 E2E ✓ (the sign-out pin superseded in place, net +1) smoke 104 ✓
- [x] The mutation check (A/B observed, reverted, re-verified — mutation A bit exactly the two downstream pins; mutation B bit the encoding pin)
- [x] Full gate in the clean environment: lint → typecheck → 169 unit → build → 198/198 E2E → smoke 104 — ALL GREEN
- [x] Live re-verification: the s37 matrix 11/11 + the standing re-runs (s24–s36 ALL GREEN, s35 under node — the Bun fetch large-body timeout noted) + the UI round-trip (the probe ticket created + listed + cleaned) + the mobile matrix (real clicks) + the VLM check (LAYOUT-OK on the new build)
- [x] Screenshots (the 10-shot set via capture-screenshots-s37.sh, all FATAL guards passed; VLM 02 + 05 LAYOUT-OK) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.35.0/DEPLOYMENT/session_63.md/plan/worklog)
- [x] Commit + push + CI verification — `afc3a25` pushed to main via `docs/ssh_git_wrapper_v3.py` (the paramiko shim rebuilt at /home/z/my-project/bin/ssh on PATH after the workspace reset, paramiko 5.0.0 via pip --break-system-packages; the key fingerprint verified before the push — SHA256:3ddaNlFhMz1JXiGEDgVEaRsUzI4Ev0IpGEEB7NnU4PU, identical to the s30–s36 records; the dry-run green first with the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson held; the remote verified untouched after the dry-run, then the real push verified: remote == local HEAD @ afc3a25, tracking synced, main only, tree clean; the operator key + the wrapper's temp key both shredded — no residue) — **the CI run on the push (run 38209295092 on afc3a25) completed SUCCESS** (verified via the GitHub API runs-list endpoint after the rate-limit window — the badge endpoint used as the interim signal per the s34–s36 fallback, passing throughout; the prior runs on 50f2707 (38204776410) + 774ba15 (38202879947) also green)
