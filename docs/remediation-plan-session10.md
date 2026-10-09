# ServiceDesk — Session 10 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 10 follows the session-9 remediation (7 findings incl. the Tailwind v4 cursor-preflight regression and the stock shadcn token block; commit `1f12f42`, session log `0fc0fee`, briefing doc `docs/session_10.md`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live interaction probes (per `skills/clone-app-pat-pro`). The session's headline method: **exercising the reference's interactive state machines end-to-end** — not just their at-rest DOM. For the first time, every button on the reference's login card was CLICKED and the resulting views measured (the in-card reset/signup flows had never been opened in 9 sessions), the invalid-ticket detail state was driven, and the SEO surface (robots/sitemap) was enumerated.

**Baseline at session start (`0fc0fee`):** lint ✓ typecheck ✓ 54 unit ✓ build ✓ **134/134 E2E** ✓ smoke 11/11 ✓ (fresh workspace; Playwright Chromium installed). Session-9 commit `1f12f42` audited clean against its documented plan (G1–G7 all verified in code: the cursor preflight in `@layer base`, the stock token block in `:root`, the old-gen Badge base + pill tails, the `border-slate-200/60` sidebar edge).

---

## 1. Findings Inventory

### G1 (HIGH — functional + structural parity): the login card's in-card view state machine

The reference's login card is a four-view state machine on `/login` — "Forgot password?" and "Need an account? Sign up" are **buttons that swap the card content in place** (the URL never changes). Ours renders `<Link>`s that navigate to the standalone `/forgotpassword` and `/signup` pages. Never probed before because every prior session read the at-rest sign-in DOM; the buttons' effects were first clicked this session.

Measured contracts (all live-captured this session):

**Reset view** (after "Forgot password?"):
```html
<div class="w-full">
  <div class="space-y-4 sm:space-y-6">
    <button type="button" class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2">
      <svg class="lucide lucide-arrow-left h-4 w-4" …/>Back to sign in
    </button>
    <div class="text-center space-y-2">
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Reset your password</h2>
      <p class="text-slate-600 text-sm sm:text-base">Enter your email and we'll send you a link to reset your password</p>
    </div>
    <form class="space-y-4 sm:space-y-5">
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-slate-700" for="email">Email</label>
        <div class="relative">
          <svg class="lucide lucide-mail absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"…/>
          <input type="email" class="[Input base] pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400" placeholder="you@example.com">
        </div>
      </div>
      <button type="submit" class="[Button base] w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200">Send reset link</button>
    </form>
  </div>
</div>
```

**Reset success view** (after "Send reset link"):
```html
<div class="w-full">
  <div class="space-y-4 sm:space-y-6">
    <div class="text-center space-y-3 sm:space-y-4">
      <div class="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <svg class="lucide lucide-mail h-7 w-7 sm:h-8 sm:w-8 text-slate-700"…/>
      </div>
      <div class="space-y-2">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Check your email</h2>
        <p class="text-slate-600 text-sm sm:text-base">We've sent password reset instructions to<br><span class="font-medium text-slate-900">{email}</span></p>
      </div>
    </div>
    <div role="alert" class="relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground text-foreground bg-green-50/70 border-green-200 rounded-xl">
      <div class="[&_p]:leading-relaxed text-green-700 text-sm">Please check your email for the password reset link. It may take a few minutes to arrive.</div>
    </div>
    <button class="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
      <svg class="lucide lucide-arrow-left h-4 w-4"…/>Back to sign in
    </button>
  </div>
</div>
```

**Signup view** (after "Need an account? Sign up"):
```html
<div class="w-full">
  <div class="space-y-4">
    <button type="button" class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2">
      <svg class="lucide lucide-arrow-left h-4 w-4"…/>Back to sign in
    </button>
    <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Create your account</h2>
    <form class="space-y-3 sm:space-y-4">
      <div class="space-y-3">
        <div class="space-y-1.5"><!-- Email, mail icon, placeholder "you@example.com" --></div>
        <div class="space-y-1.5"><!-- Password, lock icon, placeholder "Min. 8 characters" --></div>
        <div class="space-y-1.5"><!-- Confirm Password, lock icon, id confirmPassword, placeholder "Re-enter password" --></div>
      </div>
      <button type="submit" class="[Button base] w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200">Create account</button>
    </form>
  </div>
</div>
```

Key deltas vs the sign-in view (all measured):
- The logo, h1 "Welcome to ServiceDesk", Google button, and OR divider are **absent** in the swapped views; the card shell (slate top bar, `p-8 sm:p-10 …` body, `text-center` chain) stays.
- The swapped-view inputs are a **shorter generation**: `h-10 sm:h-11` (vs the sign-in form's `h-11 sm:h-12`), `placeholder:text-slate-400` (vs `-600`), and — on the signup view only — `text-sm sm:text-base`.
- The swapped-view submits are `h-10 sm:h-11` (vs `h-11 sm:h-12`) with `shadow-sm` **in the reference's v3 scale** → translates to `shadow-xs` on our v4 build (the session-5 naming trap).
- Focus contract: the reference's inputs carry `focus:ring-slate-400` (plain focus, color-only) over the v3-old Input base — computes to the same 2px slate-400 + offset ring our session-6 auth-input contract already pins; our call-site override pattern renders identically.
- The in-card signup has **no name field** (Email/Password/Confirm Password only).

**Superset decisions (documented divergences, do NOT fake):**
- The reference's signup then shows a base44-platform "Verify your email" 6-digit code view. We have no mail transport (ADR-003); a stubbed verification flow would be fake. Our in-card signup signs the created account in directly (the same behavior as our working standalone `/signup` — the documented superset over the reference's dead `/signup` route).
- The in-card signup derives the account `name` from the email local-part client-side (base44 auth has no name concept — the reference displays local-parts everywhere; session-4 ledger). The API validation seam is untouched.
- The standalone `/signup` and `/forgotpassword` pages remain reachable at their URLs (supersets — the reference's own routes are a 404 and an empty page respectively).
- Our `noValidate` + field-level error superset stays (the reference leans on native `required` bubbles).

### G2 (HIGH — structural parity): the ticket-not-found state

`/ticketdetails?id=<unknown>` on the reference renders a **shadcn destructive Alert inline in the page flow** — not a centered card. Measured (live):

```html
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-6 md:p-8">
  <div class="max-w-5xl mx-auto">
    <div role="alert" class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
      <div class="text-sm [&_p]:leading-relaxed">Ticket not found</div>
    </div>
  </div>
</div>
```

Computed: color `rgb(239, 68, 68)`, border `rgba(239, 68, 68, 0.5)`, radius 8px, padding 12px 16px, font 14px, bg transparent. Our `--destructive: #ef4444` already matches (stock red-500).

Ours renders a centered `text-2xl` heading + subtext + button card (`flex items-center justify-center`). Fix: swap to the Alert contract inside the standard `max-w-5xl` page wrapper; keep the "Back to Tickets" control as a documented superset below the alert (the ghost back-control pattern from session 4). No Alert atom is warranted — the two call sites this quarter (red + green) carry different measured classes; inline each verbatim.

### G3 (MED — functional parity): the attachment accept list misses the reference's doc/docx

The reference's upload input carries `accept="image/*,.pdf,.doc,.docx"`. Ours: `.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.json,.zip` — no Word families (a `.docx` the reference accepts gets hidden by our file picker). Fix: add `application/msword` + `application/vnd.openxmlformats-officedocument.wordprocessingml.document` to `ATTACHMENT_ACCEPTED_TYPES` and `.doc,.docx` to the input's `accept` attribute (keep our precise extension list — it excludes `image/svg+xml`, an XSS vector the reference's wildcard permits; production-sane superset). The accept string becomes a constant (`ATTACHMENT_ACCEPT_ATTR`) so the picker and the validation list can't drift apart again.

### G4 (MED-LOW — superset/SEO): no sitemap.xml; robots.txt lacks the Sitemap directive

The reference ships `robots.txt` (`User-agent: * / Allow: /` + `Sitemap:` line) and a `sitemap.xml` (base44 auto-generated — it lists **dead scaffold routes**: /AllTickets, /Analytics, /Developer, /Home, /Settings each 200 with an empty render; verified live). Ours ships a robots.txt with a production-sane policy (Disallow the authenticated routes + /api/) but **no sitemap.xml and no Sitemap directive**.

Fix (production-ready superset, NOT copying their dead routes): add `src/app/sitemap.ts` (Next MetadataRoute) serving the four public routes (`/`, `/login`, `/signup`, `/forgotpassword`) from `NEXT_PUBLIC_SITE_URL`, and replace the static `public/robots.txt` with `src/app/robots.ts` that keeps our disallow policy and adds the `Sitemap:` directive with the correct origin (a static file cannot know the deployed origin; the route can).

### Verified NON-gaps (re-checked this session, no action)

- **Standing drift pins — ALL stable**: `:root` token block (primary/border/accent/sidebar-ring at the stock shadcn values), active-nav gradient + `data-active=false` mechanism, bare-button `cursor: pointer`, `/dashboard` title plain "ServiceDesk" (our proper-cased titles remain the documented superset), head meta set.
- **Mobile navigation (the standing priority)**: reference sheet contract stable (288px sheet, `#fafafa`, 80% overlay, 20px icons / 12px gap / weight-600 labels, scroll lock); the reference's own trigger remains hit-test-blocked by their toast viewport (their standing defect — never copy). Our clone verified live at 375px: trigger hit-tests to BUTTON, sheet opens at 288×812 with `oklab(0 0 0 / 0.8)` overlay, active-nav gradient + white text, nav-tap navigates AND auto-closes (superset) with body scroll restored, Escape closes to `<body>`, **zero horizontal overflow** (session-8 `min-w-0` holding; the reference overflows at 451px).
- **The space-y selector rewrite (Tailwind v4 trap log #4)**: computed-margin walk of every `space-y-*` container on `/dashboard` + `/ticketdetails` on BOTH sites — the v3 (margin-top on later children) vs v4 (margin-bottom on earlier children) swap renders **identical gaps everywhere** (32/24/16/12/8px pairs match); no direct child of any space-y container carries its own margin utility (the only trigger condition). No instance — documented, no fix.
- **Comment management**: the reference's detail page exposes NO edit/delete on comments (buttons: Toggle Sidebar / Back to Tickets / Add Comment only).
- **`<html>`/`<body>` attributes**: `lang=en`, no dir, body class absent on the reference vs our `font-sans bg-background text-foreground` — computed identical (white body bg after the session-9 `--background` flip; system font stack pinned session 5). Viewport meta `initial-scale=1` vs `1.0` — string cosmetic, semantically identical.
- **touch-action**: `auto` on every interactive element on both sites (no double-tap-zoom prevention anywhere).
- **Console**: zero errors/rejections across our dashboard/submitticket/mytickets.
- **The reference's base44 "Verify your email" view** (6× `text-center w-10 h-11` numeric inputs): platform auth artifact — unfulfillable without mail transport (documented; our direct sign-in is the superset).
- **Their sitemap's scaffold routes**: /AllTickets, /Analytics, /Developer, /Home, /Settings render 200-empty — base44 boilerplate; listing dead URLs in a sitemap is an SEO anti-pattern we deliberately do not copy.

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; asChild single-stop CTAs; display names (account name vs their email local-part); autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset; the `/`→`/dashboard` redirect; distinct filtered-empty message; dark-mode block; signup/forgotpassword standalone routes + field-level errors; `aria-label` on the sign-out; the no-fake-verification signup superset (this session).

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first** — 11 E2E tests (the session-10 blocks of `tests/e2e/visual-parity.spec.ts`) + 1 unit pin (`domain.test.ts` attachment accept list) + 3 superseded pins updated (the session-6 whole-line link pin → the button form; auth.spec's two link pins → buttons) + 1 new auth.spec flow test (the in-card signup creates an account and lands on the dashboard). All session-10 tests verified RED against the pre-fix build (10 failed + the sitemap/robots pair; the 1 pass = the setup project).
   - Mid-cycle test hardenings (the recurring pattern): the `div[role=alert]` probes needed `main` scoping (Next's route announcer — the AGENTS.md gotcha); `getByLabel("Password")` needed `{ exact: true }` (the Confirm Password label also contains "Password"); the green/destructive color pins needed the lab() representation acceptance (v4 emits palette colors as lab()); the sitemap pin parses `<loc>` pathnames instead of substring-matching (absolute URLs); the Back-to-Tickets pin targets `role=link` (asChild renders an anchor).
2. ✅ **G1** — `src/app/login/page.tsx` became the four-view `LoginView` state machine (`signin | reset | reset-success | signup`) rendering the measured contracts inside the unchanged card shell; the footer controls are buttons; the standalone pages stay.
3. ✅ **G2** — `src/app/(app)/ticketdetails/page.tsx` not-found block → the measured destructive Alert + the superset ghost Back-to-Tickets control below.
4. ✅ **G3** — `src/lib/constants.ts` +`application/msword` + `application/vnd.openxmlformats-officedocument.wordprocessingml.document` + the new `ATTACHMENT_ACCEPT_ATTR`; `submitticket/page.tsx` consumes the constant.
5. ✅ **G4** — `src/app/sitemap.ts` (4 public routes) + `src/app/robots.ts` (disallow policy + Sitemap directive); the static `public/robots.txt` deleted.
6. ✅ **Full gate**: lint ✓ typecheck ✓ 55 unit ✓ build ✓ **145/145 E2E** ✓ smoke 11/11 ✓.
7. ✅ **Live paired re-verification** (production standalone on :3000): the reset view renders h2 + `-mb-2` back button + 44px input (sm:h-11) + slate-400 placeholder (lab rep) at `/login` with the logo absent; the Check-your-email view renders the slate icon circle + the green alert (`p-4 rounded-xl bg-green-50/70 border-green-200`) + the full-width back (368px = card width); the signup view renders 3 fields with the exact placeholders + `space-y-3 sm:space-y-4`; the not-found Alert computes `rgb(239, 68, 68)` text + `oklab(… / 0.5)` border + 8px radius + 12px 16px padding inside `max-w-5xl` — all = the reference's measured values; `/sitemap.xml` serves the 4 public locs; `/robots.txt` carries the disallow policy + the Sitemap directive; the picker accepts `.doc,.docx`.
8. ✅ **Refresh `docs/screenshots/`** — 7 shots via `scripts/capture-screenshots-s10.sh` (also fixes the s9 script's `aref*=` typo in the new copy).
9. ✅ **Docs**: this plan's execution status + README (counts + features + session-10 pin list) + AGENTS (session-10 contracts + reference list) + CLAUDE (counts + E2E paragraph + two new anti-patterns) + PAD (known-issues row + parity count) + `service-desk_SKILL.md` v2.8.0 (lessons 38–42) + `docs/session_10.md` retrospective + `worklog.md`.
10. ✅ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only). The gate was re-run after the last doc file landed (the session-8 lesson).

## 3. Validation of this plan against the codebase

- **G1**: our login page already renders the exact card shell the swapped views live in (`p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10` body + `flex flex-col items-center text-center space-y-6 sm:space-y-8` content root — the `w-full` swap-in point is the same node the sign-in form occupies). The footer controls' current classes ARE the reference's button classes (session-6 measured) — only the tag changes (`<Link>` → `<button>`, `onClick` swaps the view). Affected pins: auth.spec lines 22/25 (link → button), visual-parity session-6 `a[href="/signup"]` pin. The signup POST path exists (`/api/auth/signup`); name is derived client-side (`email.split("@")[0]`) so the validation seam and its unit tests are untouched. The E2E signup adds ONE real login-equivalent POST per run (well under the 10/15-min rate budget; the suite currently signs in twice — setup + auth.spec's demo login).
- **G2**: our not-found block (`ticketdetails/page.tsx:126-138`) is a standalone render path — no other surface consumes it; no existing E2E pin references it (grepped: zero matches for not-found in specs). The `--destructive` token already equals the reference's red-500 (`#ef4444` → `rgb(239,68,68)`); `border-destructive/50` resolves `rgba(239,68,68,0.5)` on our build.
- **G3**: `ATTACHMENT_ACCEPTED_TYPES` is defined but referenced nowhere (client filter is the accept attribute; the API enforces count/size/name only) — extending it is inert to the API contract; the accept attr is a single hardcoded string at `submitticket/page.tsx:303`.
- **G4**: no test or script references robots.txt/sitemap.xml (grepped). `NEXT_PUBLIC_SITE_URL` is the documented canonical-origin variable (`.env.example`); Next 16 serves `app/robots.ts` + `app/sitemap.ts` as route handlers automatically. Deleting `public/robots.txt` avoids the static/route conflict. The smoke test hits `/api/health` only — unaffected.
- **skills/ exclusion**: `tsconfig.json` excludes `skills`; eslint ignores it; vitest matches `src/**/*.test.ts` + `tests/**/*.test.ts` only; playwright's testDir is `tests/e2e` — the contract holds (re-verified this session).
- **Env contract**: `.env` created from `.env.example` (`DATABASE_URL="file:../db/custom.db"` + generated `AUTH_SECRET`); `db/` at repo root; the npm scripts pin `DATABASE_URL` inline; `.env.example` matches the codebase (DATABASE_URL / AUTH_SECRET / NEXT_PUBLIC_SITE_URL) and is tracked.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The login-page rewrite breaks the 8 existing login/auth E2E pins | The sign-in view's markup is untouched except the two footer controls' tag; run the full suite (134) after the change — a regression renders red, not shipped |
| The in-card signup E2E consumes rate-limiter budget | One POST per run (suite currently uses 2 sign-ins of the 10/15-min budget); the shared storageState pattern is unaffected |
| `shadow-sm` on the swapped-view submits renders one step heavy on v4 | Translated to `shadow-xs` (the session-5 computed-value rule) — pinned by the E2E submit-class assertion |
| `app/robots.ts` + leftover `public/robots.txt` conflict (route vs static) | Delete the static file in the same commit; E2E fetches `/robots.txt` expecting the Sitemap directive — a conflict serves the static file and the pin fails loudly |
| The green success-alert `[&_p]:leading-relaxed` arbitrary variant doesn't compile on v4 | Arbitrary variants are supported in v4 CSS-first; if the build drops it, the class is decorative on a text-only child — verify via the class-attribute pin (not computed) |
| View-swap state persists across browser back/forward unexpectedly | The state is component-local (no URL change — matching the reference); Playwright's fresh contexts are unaffected |

## 5. Session-10 process lessons (for the next agent)

1. **Click every control before claiming parity.** Nine sessions read the login card's at-rest DOM; the card's three other views were one click away the whole time. The at-rest DOM is the floor of parity, not the ceiling.
2. **A "dead" route can hide a live flow.** The reference's `/signup` route 404s — but the login card's Sign-up button works (in-card swap). Route-level probing misses view-state machines; interaction-level probing finds them.
3. **Platform artifacts are not features.** The base44 verify-email view and the auto-generated sitemap of dead routes are platform exhaust — replicate the DESIGN (card views, sitemap infrastructure) with production-sane substance (no fake verification, no dead URLs).
4. **The engine trap log pays dividends — verify, don't assume.** The space-y selector rewrite (trap 4) had zero instances here, but only because the computed-margin walk ran on both sites. Keep walking the scales (font/radius/shadow/spacing) each session.
5. **Enumerate the invisible surfaces too.** robots.txt/sitemap.xml lived outside every DOM probe for nine sessions — one curl each. The `<head>` lesson (session 8) extends to the server's root files.
