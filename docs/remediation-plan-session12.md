# ServiceDesk — Session 12 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 12 follows the session-11 remediation (4 findings incl. the id-less detail route and the PWA/SEO head surface; commit `725d4af`, briefing doc `docs/session_12.md`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live interaction probes (per `skills/clone-app-pat-pro`). This session's headline surfaces: **the social-card URL family nobody ever asserted on OUR side** (the s8 sweep measured the reference's og set, believed "og:url derives from the per-route canonical", and never pinned ours — the belief was false), and **the first live-computed firing of the space-y trap-log #4** (a direct child carrying a margin utility inside a `space-y-*` container — the exact engine difference the trap log warns about, hiding in plain sight since session 10).

**Baseline at session start (`31e7848`):** lint ✓ typecheck ✓ 55 unit ✓ build ✓ **156/156 E2E** ✓ smoke 11/11 ✓ (fresh workspace; Playwright's chromium-1248 build installed — the cache held 1200/1243 and the suite launched nothing until `npx playwright install chromium`). Session-11 commit `725d4af` audited clean against its documented plan (G1 the render-time `missingId` derivation at `ticketdetails/page.tsx:134`; G2 `src/app/manifest.json/route.ts` + `public/icon-{192,512}.png` + `manifest: "/manifest.json"` in the root metadata with the `app/manifest.ts` convention file correctly absent; G3 `themeColor: "#000000"` in the viewport export + `src/app/apple-icon.png`; G4 `src/components/breadcrumb-jsonld.tsx` rendered by the mytickets/submitticket/ticketdetails + login/signup/forgotpassword layouts, with the dashboard layout deliberately carrying none).

---

## 1. Findings Inventory

### F1 (MED — social/head parity): `og:url` + `twitter:url` are missing on EVERY route; `canonical` is missing on the three auth routes

The session-8 social sweep measured the reference's head and shipped ours — with a comment in `src/app/layout.tsx` claiming "og:url derives from the per-route canonical". That belief is false and was never asserted on our side:

- **Reference (live-measured this session, logged in)**: every route carries `<link rel=canonical>` + `<meta property="og:url">` + `<meta name="twitter:url">` — `/login` → all three `…/login`; `/signup` (their 404 catch-all) → all three `…/signup`; `/forgotpassword` → all three; `/` → canonical `…/` but og:url/twitter:url at the bare origin (no trailing slash — their home quirk).
- **Ours (live-measured)**: `/dashboard` has canonical but **no og:url and no twitter:url**; `/login`, `/signup`, `/forgotpassword` have **none of the three** (no canonical either).

Root cause (verified in Next 16's resolver sources, `node_modules/next/dist/lib/metadata/…`):

- `resolveOpenGraph` sets `resolved.url = openGraph.url ? resolveAbsoluteUrlWithPathname(…) : null` — **og:url is emitted ONLY from `openGraph.url`**. Nothing derives it from `alternates.canonical`.
- The Twitter metadata type/renderer has **no url field at all** (`TwitterBasicInfoKeys` = site/siteId/creator/creatorId/description; the element renderer emits only known keys) — `twitter:url` cannot come from the twitter object; it needs `metadata.other` (which renders arbitrary `<meta name=…>` tags).
- Metadata merge semantics (`mergeMetadata`): a child's `openGraph` **wholesale replaces** the parent's — so a per-route `openGraph: { url }` alone would silently drop `og:site_name`/`og:description`/`og:image` on that route.

**Fix:** a shared `src/lib/route-head.ts` helper — the single source for the per-route social set: `routeHead(segment)` returns `{ alternates: { canonical: segment }, openGraph: { …full root og set…, url: segment }, twitter: { card, description }, other: { "twitter:url": <absolute> } }`. The absolute URL derives from a single `SITE_URL` constant (`NEXT_PUBLIC_SITE_URL` ?? `http://localhost:3000`), exported so the root layout's `metadataBase` uses the same source. Applied to the **7 route layouts** (4 app + 3 auth). og:title continues to resolve from each page's title (unchanged); twitter:image continues to flow from the route openGraph (unchanged). Auth-route titles stay at the root default (the s7-documented decision — untouched by this finding).

### F2 (HIGH-visual — Tailwind v4): the space-y trap-log #4 fires on the two session-10 login-view back buttons (`-mb-2` computes an 8px OVERLAP on v4 where the reference renders 8–16px gaps)

The session-10 login view state machine shipped the reference's measured class verbatim: the reset and signup views' "Back to sign in" buttons carry `-mb-2` — and each button is a **direct child of the view's `space-y-*` container** (`login/page.tsx:361` inside `space-y-4 sm:space-y-6`; `login/page.tsx:462` inside `space-y-4`). That is exactly the trap-log #4 configuration the AGENTS.md anti-pattern list forbids ("Never add a margin utility to a direct child of a `space-y-*` container — session-10 verified no instance; keep it that way"). Session 10 introduced it two lines below the s10 view it verified; the s10/s11 static sweeps then missed it (the s11 scan classified its 2 candidates as grandchildren — the depth heuristic that produced today's catch is one the s11 run didn't have; both of today's REAL hits are the login back buttons).

Live-computed on both sites (production builds, settled):

| View | Container | Reference (v3) computed gap, back-bottom → next-top | Ours (v4) computed gap |
|---|---|---|---|
| Reset view, ≥sm | `space-y-4 sm:space-y-6` | **16px** (next.mt 24px collapsed with −8px) | **−8px (8px overlap)** |
| Reset view, <sm | `space-y-4` | 8px (16 − 8) | −8px |
| Signup view | `space-y-4` | **8px** (next.mt 16px − 8px) | **−8px (8px overlap)** |

Mechanism (the v3→v4 selector rewrite): v3's `space-y` puts `margin-top` on later siblings — the reference's `-8px` margin-bottom shrinks the following sibling's 16/24px top margin to 8/16px. v4's `space-y` puts `margin-bottom` on earlier children via a `:where()`-wrapped rule — the plain `-mb-2` utility beats it, and the following sibling gets **no margin-top at all**, so the explicit negative margin is the only spacing left: the h2 block overlaps the back button.

**Fix (computed parity, the s5 shadow-xs doctrine — "parity is the COMPUTED value, never the class name"):** ship the v4 classes that compute the reference's measured gaps:

- Reset view (`login/page.tsx:364`): `-mb-2` → `mb-2 sm:mb-4` (8px below sm, 16px at ≥sm — exactly the reference's computed gaps at both breakpoints; the utility beats the `:where()`-wrapped space-y rule, verified by the current build where `-mb-2` already wins the cascade).
- Signup view (`login/page.tsx:465`): `-mb-2` → `mb-2` (8px at all widths — the reference's constant).
- The s10 E2E class pin (`visual-parity.spec.ts:1604` `toHaveClass(/-mb-2/)`) is superseded to the new classes, and the session-12 block adds the authoritative computed pins.

### Verified NON-gaps (re-checked this session, no action)

- **Standing drift pins — ALL stable** (no reference drift): the `:root` token block (primary 0 0% 9% / border+input 0 0% 89.8% / foreground 0 0% 3.9% / background 0 0% 100% / accent 0 0% 96.1% + accent-foreground 0 0% 9% / sidebar-ring 217.2 91.2% 59.8%), bare-button `cursor: pointer`, the reference's `/` dashboard title "ServiceDesk" (bare — the reference's home special case; our "Dashboard | ServiceDesk" is the s7-documented casing superset, spec-pinned), per-route canonical + og:title on the 4 app routes, the s8 social/PWA meta set, `theme-color`, manifest link, JSON-LD breadcrumbs.
- **Mobile navigation (the standing priority)**: full matrix on both sites at 375×812. Reference contract stable — 288px sheet at `rgb(250,250,250)`, `rgba(0,0,0,0.8)` overlay, scroll lock, Escape → `<body>`, and the sheet **stays open after a nav-tap** (re-confirmed with a real click — the documented reference quirk; our auto-close + scroll-restore is the E2E-pinned superset, SKILL.md "Superset, not divergence"). Our clone fully green: trigger hit-tests to BUTTON, sheet 288px/`rgb(250,250,250)`/`oklab(0 0 0 / 0.8)` overlay, body locked, nav-tap navigates AND auto-closes, zero horizontal overflow (scrollWidth 375 = clientWidth).
- **Console hygiene**: ours emits ZERO errors/warnings through the full app + sheet flow. The reference emits the Radix DialogTitle error + missing-Description warning on its own mobile sheet and runs Tailwind via the CDN in production (`cdn.tailwindcss.com should not be used in production`) — platform artifacts, never mirror.
- **320px narrow viewport** (below the 375px pin): the reference overflows on `/dashboard` (scrollWidth 451) and `/submitticket` (365); ours fits exactly on every route incl. the id-less `/ticketdetails` (320 = 320). The `min-w-0` superset family extends to 320px — do NOT reintroduce overflow to "match".
- **Comment contract, full flow (never driven past the disabled button on the reference)**: a real post on both sites — the new comment appends at the BOTTOM (oldest-first preserved), the textarea clears, Add Comment re-disables; the item markup is byte-parity (`p-4 rounded-xl border bg-slate-50 border-slate-200` + `w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500` avatar + `text-xs text-slate-500` timestamp via formatDateTime). (The probe comment left on the reference's laptop ticket mirrors the s8 probe-comment precedent; ours is removed from the dev DB.)
- **mytickets status filter options**: both sites list exactly `All Status / Open / In Progress / Resolved / Closed` with identical listbox width (311.33px) — the `closed` vocabulary item was already in our constants.
- **Search no-match empty state**: the reference renders the s7-measured empty card with h3 "No tickets found" + the generic p "You haven't submitted any tickets yet."; our distinct filtered/empty message pair is the documented s7 superset (card markup identical).
- **Dashboard performance formats**: "Performance Metrics" / "Average Resolution Time" / "N/A" (no resolved tickets) — identical labels and N/A logic on both sites; ours renders "15d 0h" (formatDuration) with resolved data. "View All Tickets" CTA: identical text + href (`/mytickets`) on both.
- **Detail info panel**: "Ticket Information / Created By / Created On / Last Updated" — label parity (ours at `ticketdetails/page.tsx:329-343`); the reference shows the email local-part as the Created By value (their base44 convention — our account-name display is the documented s4 superset).
- **`/login` while authenticated**: both sites render the login card (no redirect on either) — parity.
- **Reference auth-route bodies**: `/signup` (logged in) renders their designed 404 in the shell ("The page 'signup' could not be found in this application. Go Home"); `/forgotpassword` renders an empty scaffold. Our real standalone pages remain the documented URL supersets; the reference's per-route canonical/og:url on those routes IS mirrored by F1 (the head is real even where their body is catch-all exhaust).
- **Reference 404-head canonicals** (their platform emits canonical + segment titles on catch-alls like `/signup`): platform exhaust — canonicalizing 404s is an anti-pattern in production SEO; ours deliberately ships no canonical on unmatched routes (the s10 sitemap precedent: replicate the infrastructure, not the dead URLs).

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; asChild single-stop CTAs; display names (account name vs their email local-part); autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset (now verified at 320px too); the `/`→`/dashboard` redirect; distinct filtered-empty message; dark-mode block; signup/forgotpassword standalone routes + field-level errors; the no-fake-verification signup superset; the Google-not-configured alert; real-size manifest icons; the nav-tap auto-close superset; auth-route titles at the root default (the s7 decision); our dashboard's "Dashboard | ServiceDesk" title (the s7 casing superset, spec-pinned).

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first** — 11 E2E tests appended to `tests/e2e/visual-parity.spec.ts` (7 per-route social-URL + 1 openGraph-replace mechanism + 3 computed-gap), plus the superseded s10 class pin (`-mb-2` → `mb-2` + `sm:mb-4`). Verified RED against the pre-fix build: **10 failed** (the 7 social-URL + the 3 computed-gap — the current build rendered −8px overlaps and no og:url/twitter:url anywhere); the 2 passes = the setup project + the mechanism guard (trivially green pre-fix because today's og set comes from the root layout — it stays green post-fix, now protecting the helper).
2. ✅ **F1** — `src/lib/route-head.ts` (SITE_URL export + routeHead); wired into the 7 route layouts; the root layout's `metadataBase` now uses the exported SITE_URL and the false "og:url derives from the per-route canonical" comment is corrected (root + dashboard layout both carried it).
3. ✅ **F2** — `login/page.tsx` reset view: `-mb-2` → `mb-2 sm:mb-4`; signup view: `-mb-2` → `mb-2`; both view blocks carry the computed-mapping comments (the shadow-xs doctrine).
4. ✅ **Full gate**: lint ✓ typecheck ✓ 55 unit ✓ build ✓ **167/167 E2E** ✓ (156 + 11 new, zero regressions) smoke 11/11 ✓.
5. ✅ **Live paired re-verification** (production standalone :3000): all 7 routes carry canonical + og:url + twitter:url with all three EQUAL per route (e.g. `http://localhost:3000/login` × 3), og:site_name "ServiceDesk" + og:image /icon.png preserved on every route; the reset view computes a 16px gap at ≥sm (back.mb 16px), 8px at 375px (back.mb 8px), and the signup view an 8px gap (back.mb 8px) — the reference's measured values, no overlap anywhere.
6. ✅ **Refresh `docs/screenshots/`** — 7 shots via `scripts/capture-screenshots-s12.sh` (which also fixes the lineage bug the s11 plan CLAIMED but never landed: the committed s10 AND s11 scripts both carry the invalid `aref*=` selector; the s12 script uses the working `a[href*="ticketdetails"]` + a FATAL guard that verifies the capture page is `/ticketdetails` before shooting). 01/02/03/06/07 byte-identical to the s11 set (deterministic renders); 04/05 changed only by the seed-time-derived timestamp strings (fresh reseed — the same refresh pattern the s11 run saw on 01/04/05).
7. ✅ **Docs**: this plan's execution status + README (counts + session-12 pin list) + AGENTS (session-12 contracts; the session-10 `-mb-2` line amended with the computed-parity mapping; command counts) + CLAUDE (counts + E2E paragraph + the two new rules) + PAD (known-issues row + parity count) + `service-desk_SKILL.md` v2.10.0 (lessons 49–53) + `docs/session_12.md` retrospective + `worklog.md`.
8. ⬜ **Commit + push** via `docs/ssh_git_wrapper_v3.py` (main only). Gate re-run after the last doc file (the session-8 lesson: the gate's unit is the COMMIT).

## 2a. Post-implementation notes

- The probe comment left on the REFERENCE's laptop ticket ("S12 parity probe - ignore this line") stays — the reference has no delete affordance (comment edit/delete absent, session-10 verified); the s8 probe-thread precedent. Ours was removed from the dev DB (sqlite delete, verified 0 remaining).
- The dev DB is the canonical fresh seed (4 users / 11 tickets / 3 comments; demo owns 5) — verified before the screenshot refresh.
- The E2E environment needed `npx playwright install chromium` (chromium-1248 vs the cached 1200/1243) — documented in the plan's baseline note.

## 3. Validation of this plan against the codebase

- **F1**: the 7 route layouts already exist (the s7 title pattern + s11 JSON-LD wiring) — the helper rides the same files; no new layout needed. The root openGraph/twitter blocks stay for unmatched routes (404s). The child-replaces-parent openGraph semantics verified in `mergeMetadata` (`newResolvedMetadata.openGraph = resolveOpenGraph(metadata.openGraph …)` — wholesale assignment); `other` renders name-based metas (the twitter:url slot); `metadataBase` resolution applies to openGraph.url/canonical but NOT to `other` — hence the helper's absolute URL via `SITE_URL`. The 4 app layouts' existing `alternates.canonical` entries are preserved verbatim by the helper (same values).
- **F2**: both call sites verified in full JSX context (the buttons are direct children of the space-y containers — the ONLY two such margin-utility instances in `src/`; the other 7 static candidates were structurally confirmed grandchildren, matching the s11 false-positive class). The `:where()`-wrapped v4 space-y rule loses to plain utilities — proven by the current build where `-mb-2` already computes −8px against the space-y-6 rule's 24px. tw-merge is not involved (separate rules, not competing classes on one element).
- **skills/ exclusion**: unchanged (tsconfig/eslint/vitest/playwright all exclude it — re-verified at baseline).
- **Env contract**: `.env` from `.env.example` (`DATABASE_URL="file:../db/custom.db"` + generated AUTH_SECRET); `db/` at repo root, pushed + seeded (4/11/3); npm scripts pin DATABASE_URL inline; `.env.example` matches the codebase and is tracked (verified — no changes needed this session).

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The per-route openGraph replace drops an og field the helper forgets (og:image/site_name) | The mechanism E2E pin asserts og:site_name + og:image on a route; the helper is the single source (the root's og block moves INTO it verbatim). |
| `metadata.other` renders twitter:url BEFORE/AFTER the twitter card metas — order-sensitive consumers | Head order is not a parity contract (the reference's platform emits its own order); only presence + value are pinned. |
| Next resolves `other` values as raw strings — a relative twitter:url would ship broken | The helper computes the absolute URL from `SITE_URL`; the E2E pin asserts the meta content equals the canonical href (an absolute mismatch fails red). |
| The mb-2/sm:mb-4 classes lose to the space-y rule at some breakpoint | The current build already proves plain utilities beat the `:where()`-wrapped rule (`-mb-2` computing −8px today); the computed pins assert 8px/16px at both breakpoints — a cascade loss fails red. |
| The s10 view-state specs pin the old `-mb-2` class elsewhere | Grep-verified: the only `-mb-2` pin is `visual-parity.spec.ts:1604` (superseded in step 1); no other spec or doc greps the class except AGENTS.md's session-10 contract line (amended in step 7). |
| The E2E launch fails on a stale browser cache (chromium-1248) | Already installed this session; CI installs its own. Document the `npx playwright install chromium` step in the README troubleshooting if it recurs. |
| Rate-limiter budget: the new tests add no logins | All session-12 probes ride the shared `storageState`; the auth-route head checks are public-route fetches. |

## 5. Process lessons (for the next agent)

1. **A measured reference claim is not a shipped clone claim.** The s8 sweep read the reference's og set, wrote "og:url derives from the per-route canonical" as a comment, and four sessions believed it. Every reference-measured value needs a pin against OUR build the same session it's measured.
2. **The engine trap list is a code-review checklist, not a migration memory.** Trap #4 was documented as "verified absent" in the very session that introduced a live instance two screens away. Run the trap scan whenever a diff adds ANY margin utility inside a space-y container — the depth heuristic (grandchild false positives) needs the stack-based walk, and `=>` in JSX attrs breaks naive tag regexes.
3. **Computed margins can diverge with zero class difference.** Both sites shipped identical `-mb-2` DOM for two sessions; only the computed gap (16px vs −8px) revealed the engine difference. The same "computed value is ground truth" rule that governs shadows and radii governs margins.
4. **Attribute the console per-site before filing.** The DialogTitle error and the Tailwind-CDN production warning belong to the reference's platform; a shared console buffer across tabs would have misattributed them to our clone.
5. **The reference's platform head layer is route-blind.** It emits canonical + og:url + twitter:url + segment titles even on 404 catch-alls — mirror the per-route coverage where we have real routes, keep the production-sane refusal where we don't (404s).
