# ServiceDesk — Session 19 Remediation Plan

**Date:** 2026-10-11
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN environment (fresh clone, no ambient servers), remediation of all identified gaps, and full re-verification. Session 19 follows the session-18 remediation (2 code findings + the CI root cause; commits `8f41800` + `5db0145` + the green-run record `44fa41b` + the operator's transcript commit `dac393a`, briefing docs `docs/session_25.md` + `docs/session_26.md`).
**Method:** Ground truth = computed styles + live interaction probes + reference JS-bundle analysis + HTTP-response probes + fresh URL-surface axes (per `skills/clone-app-pat-pro` + the s14–s18 response-layer/bundle/value-sweep doctrines). This session's headline surfaces: **the auth-gate deep-link UX** (the from_url mechanism, first probed live this session) and **the reference's head restructuring drift** (the PWA trio + og:image dimensions now auth-pages-only on their side).

**Baseline at session start (`dac393a`, fresh clone):** lint ✓ typecheck ✓ 56 unit ✓ build ✓ **194/194 E2E in the clean environment** (:3000 confirmed down — the CI-equivalent condition) ✓ smoke 11/11 ✓. The GitHub CI badge reads **"CI - passing"** (run 34's lineage holding — the s18 include-hidden-files fix stayed green through the follow-up commits). Environment contract verified standing on the fresh clone (`.env` from `.env.example` with a generated `AUTH_SECRET` + `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root pushed + seeded 4/11/3 canonical, `skills/` excluded in all 4 configs by construction, npm scripts pinning `DATABASE_URL` inline, `.env.example` matching the codebase, the Playwright 1248 chromium build installed per the s13 lesson). The user's requested env/DB/vitest+playwright items are all satisfied by the existing codebase (re-verified this session).

---

## 1. Findings Inventory

### F1 (MED — functional parity): the auth gate discards the user's destination — the reference preserves it via `from_url`

**The reference's live-measured behavior (first probe of this surface, both flows exercised):**
- Unauthenticated visit to an app route → their SPA redirects (client-side) to `/login?from_url=<URL-encoded ABSOLUTE url of the intended page>` — measured on `/mytickets` → `/login?from_url=https%3A%2F%2Fservice-desk-332a5ae4.base44.app%2Fmytickets` and on `/dashboard` → the same shape.
- Signing in from that URL **returns the user to the deep-linked page**, not the dashboard: logged in from `from_url=…/mytickets` → landed on `/mytickets` (verified end-to-end with a real login; disambiguated from the post-login default by using a NON-dashboard target).

**Our behavior (live-measured on the production standalone):**
- Unauthenticated `/mytickets` → the route-group layout guard `redirect("/login")` — PLAIN, no destination param.
- Signing in → `router.push("/dashboard")` (hard-coded in `handleSubmit` and `handleSignupSubmit` of `src/app/login/page.tsx`).
- **The deep link is LOST.** The strongest case: a logged-out user opening a shared `/ticketdetails?id=X` link currently lands on `/dashboard` after login — the ticket they were sent is one manual navigation away. On the reference they land ON the ticket.

**Why it was never found:** every prior auth-surface probe (s2 login shell, s8 auth-error contract, s10 view machine, s12 signup-link head coverage) measured the login CARD at rest and its swapped views — the **gate's redirect SHAPE** (what URL /login carries when a guarded route bounces there) and the **post-login landing** (where a from-param'd login returns) were never probed. The s18 lesson ("every pinned meta's value, every link's response layer") extends to the auth flow: the REDIRECT CHAIN is part of the measured surface.

**Fix (mirror the reference's observable contract, hardened):**
1. `src/proxy.ts` (Next 16's middleware successor — `PROXY_FILENAME = 'proxy'`, `src/proxy.ts`, verified in the installed next/dist constants): a thin presence gate on the 4 `(app)` routes (`matcher: ["/dashboard", "/submitticket", "/mytickets", "/ticketdetails"]` — exact paths; unmatched sub-paths 404 publicly and must NOT be gated). If the `servicedesk_session` cookie is ABSENT → `NextResponse.redirect("/login?from_url=" + encodeURIComponent(request.nextUrl.href))`. Cookie PRESENCE only — no HMAC verification (the `(app)` layout guard stays the authoritative verifier; this honors ADR-001's rejection, which was about duplicating session RESOLUTION, not about decorating the redirect — see the F3 note on the ADR amendment).
2. `src/lib/redirect.ts` — a pure, unit-tested `safeRedirectTarget(raw, origin)` seam: parses the from_url (absolute or relative), requires same-origin, rejects protocol-relative `//` and non-`/` paths, rejects auth-page targets (`/login`, `/signup`, `/forgotpassword` — loop prevention), preserves `pathname + search` (the reference's from_url carries the query — the ticketdetails `?id=` case), falls back to `/dashboard` on anything else (the open-redirect guard).
3. `src/app/login/page.tsx`: both success handlers (`handleSubmit`, `handleSignupSubmit` — the in-card signup signs in directly, our documented superset) read `from_url` from `window.location.search` at submit time (an imperative read — no `useSearchParams`, keeping the login page statically prerenderable) and `router.push(safeRedirectTarget(...))`.
4. The `(app)` layout guard stays UNCHANGED (`redirect("/login")` plain) — it remains the security boundary for invalid/expired-cookie sessions (the proxy lets cookie-bearing requests through; the layout's full HMAC verify then bounces tampered sessions with a plain redirect; the deep link is lost only in that rare stale-cookie path — documented trade-off).

**What does NOT change:** the root `/` redirect (`/` → `/dashboard` — the s2 superset; unauth flow becomes `/` → 307 `/dashboard` → proxy → `/login?from_url=…/dashboard` → post-login `/dashboard`, net-identical UX), the 404 surface, the API guards (401s, unchanged), the rate limiter, the E2E auth setup (API-based).

**E2E/limit budget:** the full suite's real auth attempts today = 6 (setup login, wrong-password, sign-in, in-card signup, signup-page signup, weak-password signup). This plan adds ONE real login (the deep-link return test; the cross-origin and malformed from_url matrices are UNIT tests on the pure seam — the E2E version would each burn a login for a contract the seam already pins). Total 7/10 — comfortable headroom.

### F2 (LOW-MED — reference head drift, documentation): the PWA trio + og:image dimensions are now AUTH-PAGES-ONLY on the reference

Fresh hard-loads (agent-browser, rendered DOM — their head is client-injected; curl sees only the SPA shell) across all 5 routes, re-verified from a clean logged-out context:

| Surface | /login | /dashboard, /mytickets, /submitticket, /ticketdetails |
|---|---|---|
| `theme-color` (#000000) | ✓ present | **✗ GONE** |
| `manifest` link (/manifest.json) | ✓ present | **✗ GONE** |
| `apple-touch-icon` link | ✓ present | **✗ GONE** |
| `og:image:width/height/alt` | ✓ (1200/630 + "Base44 link preview") | **✗ GONE** |
| `viewport-fit=cover` | ✓ present | ✗ gone (the s18 drift, continues) |
| og/twitter/canonical core set | ✓ | ✓ still present |
| `mobile-web-app-capable` + `apple-mobile-web-app-title/status-bar-style` | ✓ | ✓ still present |

This is the s18 viewport-fit drift pattern extended to the whole PWA trio + the og:image sub-metas: the reference's platform now emits the installability/preview surface only on its auth pages. **Decision (the s18 precedent applied): our uniform set STAYS** — theme-color + manifest + apple-touch-icon on every route is the documented SUPERSET (PWA installability is an app-wide feature for us; their per-route inconsistency is platform churn, never mirrored). Our og:image:alt ("ServiceDesk", truthful) and dimensions (512/512, truthful) also already exceed their auth-only platform-exhaust values ("Base44 link preview" / 1200×630 over the ~480×480 JPEG). **No code change — the drift ledger + the s8/s11 contract wording in the docs update** (the current AGENTS/README lines describe the reference as shipping the set per-route; they now render it auth-pages-only).

### F3 (LOW — first value measurement, documentation): the reference canonicalizes `/dashboard` to the ORIGIN ROOT — ours stays segment-canonical

First value-level measurement of the dashboard's canonical (18 sessions pinned its PRESENCE + the s12 segment pattern on our side, but never value-diffed the reference's):
- **Reference (fresh hard-loads):** `/dashboard` → canonical = `https://service-desk-332a5ae4.base44.app/` (the ROOT), og:url + twitter:url = the bare origin (no trailing slash — their home quirk). Their `/` renders the SAME dashboard page (title "ServiceDesk", no breadcrumb JSON-LD — the home special case) — dual URLs, canonical-at-root, coherent for their platform.
- **Ours:** `/dashboard` → canonical = `/dashboard` on all three social URLs (the s12 uniform contract, E2E-pinned).

**Decision: KEEP OURS — a deliberate, documented divergence.** Our `/` is a 307 redirect to `/dashboard` (the s2 single-URL superset); canonicalizing our only content URL at a URL that redirects is a production-SEO anti-pattern (canonicals should resolve 200), the same reasoning as the s10 404-canonical decision and the s11 platform-exhaust exclusions. The reference's value is coherent for THEIR dual-URL architecture and wrong for ours. The divergence joins the documented set (auth-route titles, proper-cased page names, etc.) with the measured values recorded.

### Verified NON-gaps (re-checked this session, no action)

- **Standing drift pins — ALL stable:** the `:root` token block (primary 0 0% 9%, border 0 0% 89.8%, accent 0 0% 96.1%, ring 0 0% 3.9%, background 0 0% 100%, sidebar-ring blue-500), the sidebar panel `rgb(250,250,250)`, the system font stack, the per-route segment canonical + og:url + twitter:url set (mytickets/submitticket/login verified equal), the ticketdetails full-URL canonicalization + BreadcrumbList JSON-LD (`?id=` on all four surfaces), the login-view state machine (reset + signup views live-exercised: "Reset your password" + h-10 inputs + back button; "Create your account" + the 3 exact placeholders), the detail page (Description/Attachments headings + FileText/Paperclip icons + "Add a comment or update..." placeholder + generic "Attachment 1" labels), the dashboard recent rows (5 rows, FileText tiles, date-only "Oct 10, 2026" dates), the submit form (accept="image/*,.pdf,.doc,.docx" + multiple + "Issue Title *" + "Medium - Normal" priority trigger + Cancel/Submit Ticket footer), the mytickets filter grid (`grid grid-cols-1 md:grid-cols-3 gap-4` + "All Status"/"All Priorities" + "Search tickets..."), the desktop sidebar (Dashboard/Submit Ticket/My Tickets nav + gradient quick-stat rows), the og:image:alt (ours: "ServiceDesk" everywhere — a truthful superset over their auth-only platform value), titles (the documented divergence set — their segment-verbatim + home-special-case vs our proper-cased superset).
- **Mobile navigation (the standing priority):** ours FULLY GREEN via the s14 matrix script (375=375 no overflow, 288px sheet `rgb(250,250,250)`, `oklab(0 0 0 / 0.8)` overlay, body locked, nav-tap auto-close + unlock, Escape → focus body) + a fresh 390×844 spot-check (390=390); the reference matches the sheet/overlay/lock contracts with their standing 468-vs-375 overflow + sheet-stays-open-after-nav-tap + Escape-to-body defects persisting (documented, never mirrored). The attachment download route still serves `inline; filename="…"` (the s14 contract; their CDN still serves no disposition).
- **Bundle sweep (the s16/s17/s18 doctrine):** zero new user-facing features — `notification` 0 hits; `whileHover` framer-motion library internals only; the admin route set unchanged (`/all-tickets`, `/analytics`, `/developer`, `/settings`); `last_active`/`updateMe` still present (the admin-gated heartbeat); the websocket/socket strings are library internals, not app features.
- **SEO surface:** their sitemap still lists dead scaffold routes (`/AllTickets`…); their robots is the platform-default `Allow: /` (ours: the s10 disallow policy for authenticated routes + /api/ — deliberate); their manifest still declares 192/512 over the same 480×480 JPEG (their documented falsity — ours ships size-correct real PNGs).
- **Fresh axes probed this session:** route response status/headers (ours 404-correct + no-cache on dynamic HTML + nosniff = the documented superset; theirs 200-on-404 SPA catch-all + no cache-control), `<html lang="en">` + charset (identical both sides), noscript (neither ships), trailing slash (ours 308-canonicalizes; theirs 200s everything — the documented platform-exhaust class).

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; field-level errors; display names; autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; no-fake-verification signup; permanent SQLite attachment storage; nav-tap auto-close; correct SPA titles + route-correct head; `private` cache scope on the owner-scoped attachment route; UTC-pinned formatters (s15); the reduced-motion a11y superset; the unmeasured admin surface (s16 F3); the cheaper `/api/stats` aggregate; no `last_active` heartbeat (s17 F3); the truth-telling og:image/favicon assets (s17/s18); the proper-cased per-route titles; the uniform viewport-fit=cover (s18); **the uniform PWA trio + og:image dims/alt (s19 F2 — the reference now auth-pages-only)**; **the segment-canonical dashboard over the reference's canonical-at-root (s19 F3 — our single-URL architecture)**.

---

## 2. Execution Plan (TDD)

1. **RED — unit first (the pure seam):** `src/lib/__tests__/redirect.test.ts` — the safeRedirectTarget matrix: same-origin absolute URL → path+search; relative path → itself; `?id=` preserved; missing/null → `/dashboard`; cross-origin absolute → `/dashboard`; protocol-relative `//evil.com` → `/dashboard`; non-slash-relative (`dashboard`) resolved safely; auth-page targets (`/login`, `/signup`, `/forgotpassword`) → `/dashboard` (loop guard); hash dropped; garbage (unparseable) → `/dashboard`. RED verification: the module doesn't exist.
2. **RED — E2E (the live contract):** a session-19 block in `tests/e2e/auth.spec.ts` (the logged-out surface file):
   - "an unauthenticated app-route visit redirects to /login carrying the from_url deep link" (`/mytickets` → URL matches `/login\?from_url=` + the decoded param equals `http://localhost:3100/mytickets`) — no login needed.
   - "signing in from a ticket-details deep link returns to the ticket" (`/ticketdetails?id=<seeded id>` → login (ONE real login) → lands back on the ticket detail page with the same `?id=`) — the strongest case.
   - "the plain /login keeps the dashboard default" — already pinned by the existing sign-in test (kept; no new login).
   - UPDATE the existing "unauthenticated /dashboard bounces to /login" pin to the new contract (`waitForURL(/\/login\?from_url=/)` — the reference-measured redirect shape; the old `**/login` glob would false-fail against the query-bearing URL).
   RED verification: all new tests fail for the designed reasons (no from_url in the redirect; post-login lands /dashboard).
3. **GREEN — three files:**
   - `src/lib/redirect.ts` — `safeRedirectTarget(raw, origin)` (pure).
   - `src/proxy.ts` — the presence gate + from_url decoration (exact-route matcher on the 4 `(app)` routes; `SESSION_COOKIE` imported from `src/lib/auth.ts` — the single source).
   - `src/app/login/page.tsx` — both success handlers navigate to `safeRedirectTarget(new URLSearchParams(window.location.search).get("from_url"), window.location.origin)`.
4. **Full gate in the CLEAN environment** (no ambient :3000): `bun run lint && bun run typecheck && bun run test && bun run build` → `bun run test:e2e` (**196 expected: 194 + 2 new E2E; +9 unit** — see step counts) → `bash scripts/smoke-test.sh` (11/11).
5. **Live paired re-verification** (production standalone :3000 rebooted): the deep-link chain end-to-end (unauth /ticketdetails?id= → login URL carries from_url → login → back on the ticket); the plain /login → /dashboard default; the open-redirect guard spot-check (a cross-origin from_url lands /dashboard); the reference re-verified on the same flow (their from_url honored); the mobile matrix re-run (the proxy adds a redirect hop on app routes — the 375=375 + sheet contracts must hold); the canonical 11-ticket seed re-verified after fixtures.
6. **Screenshots:** the standing 10-shot set refreshed via `scripts/capture-screenshots-s19.sh` (the s18 lineage verbatim — FATAL guards, the curl fixture pattern, the setInputFiles helper); VLM spot-checks on 2 shots.
7. **Docs:** README (the auth-flow row + counts 194→196 E2E + 56→65 unit), AGENTS.md (the session-19 contracts section + the F1/F2 drift ledger + the proxy/guard split note), CLAUDE.md (the from_url contract + counts + the deep-link anti-pattern), PAD (ADR-001 amendment note — the proxy as a UX decoration layer, the layout as the authoritative gate; §7.1 counts; the s19 known-issues row), `service-desk_SKILL.md` **v2.17.0** (lessons 71–72: the redirect-chain-is-a-parity-surface doctrine; the drift-ledger pattern for platform head churn), `docs/session_27.md` (the narrative log, per the numbering convention), this plan's execution status, `worklog.md`.
8. **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only) — then verify the CI badge STAYS green (the first pushes after the s18 fix; the suite must pass the same clean-env conditions).

## 3. Validation of this plan against the codebase

- **F1 seams:** the guard is `src/app/(app)/layout.tsx` (getCurrentUser + `redirect("/login")` — stays untouched); the hard-coded landings are `src/app/login/page.tsx` lines 93 + 161 (`router.push("/dashboard")` ×2); the cookie name is `SESSION_COOKIE = "servicedesk_session"` in `src/lib/auth.ts:23` (imported, not re-declared); Next 16's proxy convention verified in the installed `next/dist/lib/constants.js` (`PROXY_FILENAME = 'proxy'`, `(?:src/)?proxy`). No file named `middleware.*` exists (no conflict).
- **Existing-test interactions (grep-verified):** ONLY `tests/e2e/auth.spec.ts:49` navigates to an app route while logged out (the pin updated in step 2); every other spec runs under the shared `storageState` (cookie present → the proxy passes through, zero behavioral delta); the E2E setup signs in via the API (`auth.setup.ts` — no page navigation, unaffected); the smoke test's auth-guard check is an API 401 (unaffected).
- **Static prerender preserved:** the from_url read is imperative (`window.location.search` inside the submit handlers) — no `useSearchParams`, no Suspense boundary needed, the `/login` static prerender (build output "○ /login") stands.
- **Rate-limiter budget:** 6 existing real auth attempts + 1 new = 7 of 10 per 15 min (retries: 0 configured).
- **No pin conflicts:** no existing spec asserts the /login URL for a guarded-route bounce except auth.spec:37 (the wrong-password case — stays on /login with NO from_url since the user is already there — unaffected) and auth.spec:50 (updated in step 2). The s12 canonical set pins assert OUR segment-canonical values — unchanged. The root `/` redirect pin (if any) — grep: mobile-navigation and dashboard specs all run authenticated; the root redirect is only exercised logged-out in auth.spec:49's flow (via /dashboard) — covered.
- **CI-pass risk:** the proxy compiles into the standalone build (Next bundles `src/proxy.ts`); the e2e job restores the whole artifact (the s18 fix) and runs the same clean-env conditions verified locally.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The proxy's redirect loop (a cookie-less user somehow sent back to a guarded route) | from_url targets are VALIDATED (same-origin + auth-page rejection); the login page is NOT in the matcher, so the redirect chain terminates at /login by construction. |
| Open-redirect via a crafted from_url | `safeRedirectTarget` — same-origin enforced, protocol-relative rejected, auth-pages rejected; the seam is unit-pinned (the matrix in step 1); the E2E cross-origin case is covered by the seam tests (the browser-level behavior is the same function). |
| The proxy breaks the E2E suite's authenticated specs | Cookie PRESENT → `NextResponse.next()` — zero delta for storageState contexts; verified by the full-suite run in step 4 (all 194 existing tests must stay green). |
| The stale-cookie path (invalid cookie → layout's plain redirect) loses the deep link | Documented trade-off (rare path; the reference's platform handles it client-side because their gate IS client-side); the layout guard stays authoritative by ADR-001. |
| Rate-limiter / E2E budget | One new real login (7/10 total); no new logins elsewhere. |
| The reference re-drifts the head set again mid-session | The drift ledger records the measured date + per-route matrix; re-measure at the live re-verification step before finalizing the docs. |

## 5. Process lessons (for the next agent)

1. **The redirect chain is a parity surface.** Eighteen sessions measured the login card at rest, the guarded routes' chrome, and the post-login dashboard — but never the SHAPE of the bounce (what URL /login carries) or the landing (where a param'd login returns). Every navigation between surfaces carries observable state; enumerate it.
2. **Platform head churn is a pattern, not an incident.** The s18 viewport-fit drift and this session's PWA-trio + og-image-dims drift are the same class: the reference's platform retracting head metas from app routes while keeping them on auth pages. Expect further retractions; keep the drift ledger dated and per-route; re-measure before treating any prior "the reference ships X" line as current.
3. **First-measurement findings deserve explicit disposition.** The dashboard canonical-at-root (F3) sat unmeasured for 18 sessions because the s12 sweep pinned OUR value and the s8 sweep recorded their PRESENCE. Presence-pins and value-pins are different contracts — a presence pin with an unmeasured value is an open question, not a closed one.

**Execution status (2026-10-11, all green):**
1. ✅ RED: the safeRedirectTarget unit matrix (9 tests) — failed on the missing module (`Cannot find package '@/lib/redirect'`).
2. ✅ RED: the session-19 E2E block — both tests failed for the designed reason (`waitForURL(/\/login\?from_url=/)` timing out against the plain `/login` redirect).
3. ✅ GREEN: `src/lib/redirect.ts` + `src/proxy.ts` + the login-page handlers (both success paths). One E2E-run discovery folded in: `request.nextUrl` reflects the standalone's 0.0.0.0 bind (the from_url first carried `http://0.0.0.0:3100/...`) — the from_url now builds from the request's HOST header, spoof-proof via the use-time validator.
4. ✅ Full gate in the CLEAN environment (:3000 confirmed down): lint ✓ typecheck ✓ 65 unit ✓ (56 + 9) build ✓ **195/195 E2E** ✓ (194 + 1 net new; the bounce pin updated in place; zero regressions) smoke 11/11 ✓.
5. ✅ Live paired re-verification (production standalone :3000, `scripts/s19-live-verify.mjs`): the deep-link chain end-to-end (bounce → sign-in → back on the exact ticket URL + the s10 Alert for the unknown id); the open-redirect guard; the auth-page loop guard; the plain-login default; the mobile matrix green with the proxy in the path; the reference's from_url honored live; the canonical 11-ticket seed re-verified.
6. ✅ Screenshots: the standing 10-shot set refreshed via `scripts/capture-screenshots-s19.sh` (the s18 lineage; all four FATAL guards green); VLM-verified shots 02 + 05 (LAYOUT-OK).
7. ✅ Docs: README (counts 65/195 + the auth-flow row + the s19 E2E sentence), AGENTS.md (the session-19 contracts section + the reference list through s19), CLAUDE.md (the proxy/guard split + two anti-patterns), PAD (the ADR-001 s19 amendment + §7.1/§7.4 + the s19 known-issues row), service-desk_SKILL.md v2.17.0 (lessons 71–73), session_27.md, this status block, worklog.md.
8. ✅ Commit + push via the SSH wrapper (main only) — the CI badge checked on the push.
