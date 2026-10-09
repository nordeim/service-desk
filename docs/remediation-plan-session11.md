# ServiceDesk — Session 11 Remediation Plan

**Date:** 2026-10-10
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), remediation of all identified gaps, and full re-verification. Session 11 follows the session-10 remediation (4 findings incl. the in-card login view state machine and the ticket-not-found Alert; commit `43ac03d`, briefing doc `docs/session_11.md`).
**Method:** Ground truth = computed styles + class-attribute DOM diffs + live interaction probes (per `skills/clone-app-pat-pro`). The session's headline method: **enumerating the surfaces OUTSIDE the rendered page** — the PWA manifest (found via the head's `rel="manifest"` link, then fetched through its 302), `theme-color`/`apple-touch-icon` metas, the per-route JSON-LD structured data (never enumerated in 10 sessions of `og:`/`title` head sweeps), plus the id-less ticket-detail route (a render path every prior session reached only WITH an id).

**Baseline at session start (`aa0e069`):** lint ✓ typecheck ✓ 55 unit ✓ build ✓ **145/145 E2E** ✓ smoke 11/11 ✓ (fresh workspace). Session-10 commit `43ac03d` audited clean against its documented plan (G1 the `LoginView` state machine in `src/app/login/page.tsx`; G2 the destructive Alert + superset back control in `src/app/(app)/ticketdetails/page.tsx`; G3 `ATTACHMENT_ACCEPTED_TYPES` + `ATTACHMENT_ACCEPT_ATTR` in `src/lib/constants.ts` consumed by `submitticket/page.tsx:304`; G4 `src/app/sitemap.ts` + `src/app/robots.ts` with the static `public/robots.txt` deleted).

---

## 1. Findings Inventory

### G1 (HIGH — functional parity): `/ticketdetails` without an `?id` renders an infinite loading skeleton

Every prior session drove the detail page WITH an id (valid or unknown). The id-less path was never opened. Live-probed this session:

- **Reference** (`/ticketdetails`, no query): renders the "Ticket not found" destructive Alert — byte-identical markup to the unknown-id case (session 10's measured contract: `rounded-lg border px-4 py-3 text-sm border-destructive/50 text-destructive` inside `max-w-5xl mx-auto`, computed `rgb(239, 68, 68)` text + 50%-alpha border + 8px radius + 12px/16px padding). No back control below it (our Back-to-Tickets stays the documented superset).
- **Ours** (`/ticketdetails`, no query): `ticketId` is `null` → `load()` early-returns → `ticket` stays `null` forever → the loading skeleton (`aria-label="Loading ticket"`) renders indefinitely. A user who lands on the bare route (stale bookmark, edited URL, shared link stripped by a chat client) sees a page that never resolves.

**Fix:** derive at render time — when `ticketId` is absent, render the existing not-found block (the session-10 Alert markup) instead of the skeleton. Render-time derivation (not `setNotFound` in the effect body — `react-hooks/set-state-in-effect` is an ERROR in this config). The `load` callback keeps its early return (harmless — nothing to fetch); the `if (!ticket)` skeleton branch is simply unreachable on the id-less path.

### G2 (MED — PWA parity): no `manifest.json`; the head lacks the `rel="manifest"` link

The reference's head ships `<link rel="manifest" href="/manifest.json">`; the URL 302-redirects to their platform's manifest API. Fetched through the redirect (live-measured):

```json
{
  "name": "ServiceDesk",
  "short_name": "ServiceDesk",
  "description": "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.",
  "icons": [
    { "src": "<their logo URL>", "sizes": "192x192", "type": "image/png" },
    { "src": "<their logo URL>", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": "https://service-desk-332a5ae4.base44.app",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "scope": "https://service-desk-332a5ae4.base44.app"
}
```

Ours ships neither the route nor the link. (Note: their `/site.webmanifest` URL returning 200 is their SPA catch-all rendering HTML — a platform artifact, NOT a webmanifest; deliberately not mirrored.)

**Fix (production-sane mirror, the sitemap precedent):** add `src/app/manifest.ts` (Next `MetadataRoute.Manifest`) with the reference's measured fields — name/short_name "ServiceDesk", their description text (the s8-measured string), `display: "standalone"`, `theme_color: "#000000"`, `background_color: "#ffffff"`, and `start_url`/`scope` derived from `NEXT_PUBLIC_SITE_URL` (a static absolute URL would be wrong across deployments — the same reasoning as `sitemap.ts`). Add `manifest: "/manifest.json"` to the root `metadata` export so the head link emits.

**Icons — production-sane superset:** the reference declares both sizes against ONE 480x480 JPEG masquerading as `.png` (verified: their logo and our `src/app/icon.png` are byte-identical 480x480 JPEGs). We generate REAL size-correct PNGs — `public/icon-192.png` (192x192) and `public/icon-512.png` (512x512) — from the same source logo, and declare them accurately (`type: "image/png"`). Same visual result; honest metadata.

### G3 (MED — head parity): `theme-color` meta + `apple-touch-icon` link missing

Live-measured on the reference's head (never enumerated in the s8 social/PWA sweep — it captured `apple-mobile-web-app-*` but missed the two links below):

- `<meta name="theme-color" content="#000000">` — the browser chrome / task-bar tint. Ours: absent.
- `<link rel="apple-touch-icon" href="<their logo>">` — the iOS home-screen icon. Ours: absent (we ship only the favicon via `src/app/icon.png`).

**Fix:** `themeColor: "#000000"` in the root `viewport` export (Next 16's location for the meta — it moved off `metadata`), and `src/app/apple-icon.png` (a real 180x180 PNG generated from the same logo source — Next's file convention auto-emits `<link rel="apple-touch-icon" href="/apple-icon.png?…">` exactly like `icon.png` emits the favicon link, s7).

### G4 (MED-LOW — SEO parity): no BreadcrumbList JSON-LD structured data

The reference ships `@type: BreadcrumbList` JSON-LD in the `<head>` (`data-seo-source="builder"` — their platform's SEO layer, never enumerated until this session). Measured contract across routes:

- `/login` → `[{"name": "Home", "item": "<origin>/"}, {"name": "login", "item": "<origin>/login"}]`
- `/mytickets` → `Home` + `"mytickets"`; `/submitticket` → `Home` + `"submitticket"`; `/ticketdetails` → `Home` + `"ticketdetails"`
- Names are the **lowercase path segment verbatim** (not the proper-cased titles).
- **`/dashboard` carries NO JSON-LD** — their builder special-cases it (the same route map that plain-titles `/dashboard` to "ServiceDesk"; the dashboard IS their home, and a Home→home breadcrumb is noise). Re-verified twice with long settles — genuinely absent, not a load race.
- `/mytickets` and `/submitticket` DO carry it (verified) — authenticated routes are not exempt.

**Fix:** a shared server component (`src/components/breadcrumb-jsonld.tsx`) emitting the exact schema (position 1 `Home` → origin, position 2 `<segment>` → route URL, absolute URLs from `NEXT_PUBLIC_SITE_URL`), rendered in the per-route layouts: the four existing `(app)` route layouts minus `dashboard` (mirroring the reference's special case), plus new `layout.tsx` files for `login`/`signup`/`forgotpassword` (client-island pages need a server layout to render head-level markup — the same pattern session 7 used for titles). The `/` redirect route emits nothing (it renders no content).

### Verified NON-gaps (re-checked this session, no action)

- **Standing drift pins — ALL stable**: the `:root` token block (primary/border/foreground/sidebar-ring/background/accent at the stock shadcn values), bare-button `cursor: pointer`, `/dashboard` plain "ServiceDesk" title, per-route canonical + og:url/og:title, the s8 social/PWA meta set.
- **Mobile navigation (the standing priority)**: reference contract stable at 375×812 — 288px left sheet at `#fafafa`, `bg-black/80` overlay, scroll lock, Escape closes with focus → `<body>` (the shared Radix quirk), non-sticky plain header. Our clone: trigger hit-tests to BUTTON (cursor pointer), sheet 288px/`rgb(250,250,250)`/`oklab(0 0 0 / 0.8)` overlay, body locked, nav-tap navigates AND auto-closes with scroll restored, zero horizontal overflow (scrollWidth 375 = clientWidth). The 10-test E2E spec passed at baseline (the authoritative pin).
- **Stat cards**: inert on both sites (plain `<div>`/`<p>`, no anchor/button ancestor, cursor auto) — the dashboard's Total/Open/In-Progress/Resolved cards navigate nowhere on the reference either.
- **Empty-form validation**: the reference relies on native `required` bubbles on BOTH forms (login + submitticket — `formNoValidate: false`, "Please fill out this field." on empty submit, zero custom error elements). Our `noValidate` + field-level errors is the documented superset (s10).
- **Google button**: the reference's "Continue with Google" opens a REAL Google OAuth flow (`accounts.google.com/…client_id=185178814199-…` — "to continue to base44.com") — a platform artifact we cannot replicate without their OAuth client. Ours renders the production-sane "not configured" alert (documented superset).
- **Comment section contract**: textarea placeholder "Add a comment or update…", Add Comment disabled at empty, "No comments yet" empty state, **oldest-first ordering** (their 6-comment thread renders 12:48 AM → 10:27 AM; our 2-comment thread renders agent → demo reply) — parity on every axis.
- **Large viewport 1920×1080**: the reference overflows horizontally (scrollWidth 1968 > 1920 — their decorative-blob defect, the same one from the s9 landscape probe); ours fits exactly (1920/1920). Deliberate superset (the `min-w-0` family of improvements) — do NOT reintroduce overflow to "match".
- **HTTP response headers**: the reference ships platform infra headers (cloudflare/caddy/uvicorn/rndr-id); ours ships the Next.js set plus `X-Frame-Options: DENY` + `Permissions-Policy` (production-sane superset). Nothing to mirror.
- **Password eye toggle**: absent on both sites. **Print rules**: zero `@media print` rules in either stylesheet. Parity.
- **`/site.webmanifest` on the reference**: returns their SPA catch-all HTML (title "Site.webmanifest | ServiceDesk") — platform exhaust, not a webmanifest. Deliberately not mirrored (we have no SPA catch-all; our `manifest.json` route is the real thing).
- **og:image**: theirs is a supabase-rendered 1200×630 canvas of the logo; ours is `/icon.png` 512×512 (the s8 documented decision — no image-rendering service to mirror theirs; the same logo file).

### Intentional divergences (documented, do NOT "fix")

Our toast feedback; error+retry panels; asChild single-stop CTAs; display names (account name vs their email local-part); autocomplete attributes; lab() color pipeline; the v4 hover media-guard; `min-w-0` mobile-overflow superset + the 1920px fit; the `/`→`/dashboard` redirect; distinct filtered-empty message; dark-mode block; signup/forgotpassword standalone routes + field-level errors; the no-fake-verification signup superset; the Google-not-configured alert; real-size manifest icons (G2); the proper 180×180 apple icon (G3).

---

## 2. Execution Plan (TDD — EXECUTED, all green)

1. ✅ **Red tests first** — 11 E2E tests (the session-11 blocks of `tests/e2e/visual-parity.spec.ts`: 2 id-less-route + 2 manifest + 2 theme-color/apple-icon + 5 JSON-LD). All verified RED against the pre-fix build (10 failed + the setup project; the `/dashboard carries NO JSON-LD` guard passed trivially pre-fix and stays green as the absence pin). One test hardened mid-cycle: `manifest.theme_color` needed `String()` coercion for the `Record<string, unknown>` cast (TS18046).
2. ✅ **G1** — `src/app/(app)/ticketdetails/page.tsx`: the render-time `missingId = !ticketId` derivation short-circuits the not-found branch ahead of the skeleton; `?id=` (empty string) is falsy and covered.
3. ✅ **G2** — `public/icon-192.png` + `public/icon-512.png` (real PNGs, LANCZOS-resized from the 480×480 logo via `scripts/gen-icons-s11.py`); `src/app/manifest.json/route.ts` serving the measured contract at the reference's URL. **Mid-cycle correction:** Next's `app/manifest.ts` convention serves `/manifest.webmanifest` AND auto-emits its own head link — overriding `metadata.manifest` (the link test caught it). The convention file was dropped for a plain route handler at `/manifest.json`; `manifest: "/manifest.json"` in `src/app/layout.tsx` now controls the link.
4. ✅ **G3** — `themeColor: "#000000"` in the root `viewport` export; `src/app/apple-icon.png` (180×180 PNG — Next's file convention emits `<link rel="apple-touch-icon" href="/apple-icon.png?…">`).
5. ✅ **G4** — `src/components/breadcrumb-jsonld.tsx` + the three `(app)` route layouts (mytickets/submitticket/ticketdetails) + new `login`/`signup`/`forgotpassword` layouts; dashboard deliberately excluded.
6. ✅ **Full gate**: lint ✓ typecheck ✓ 55 unit ✓ build ✓ **156/156 E2E** ✓ (145 + 11 new, zero regressions) smoke 11/11 ✓.
7. ✅ **Live paired re-verification** (production standalone :3000): the bare `/ticketdetails` renders the Alert computing `rgb(239, 68, 68)` + `oklab(… / 0.5)` border + 8px radius + 12px/16px padding (the reference's measured contract) with no skeleton and the superset Back control; `/manifest.json` serves the full measured field set; `link[rel=manifest]` → `/manifest.json`, `meta[name=theme-color]` → `#000000`, `link[rel=apple-touch-icon]` → the 180×180 PNG; the JSON-LD breadcrumbs render `[Home, login]` / `[Home, mytickets]` / `[Home, submitticket]` / `[Home, ticketdetails]` (+ the superset `signup`/`forgotpassword`), and `/dashboard` carries none.
8. ✅ **Refresh `docs/screenshots/`** — 7 shots via `scripts/capture-screenshots-s11.sh` (also fixes the s9/s10 lineage bug: the ticket-link selector was the invalid `aref*=` — the s10 "fix" kept the typo; the s11 script uses the working `a[href*="ticketdetails"]`). 02/03/06/07 rendered byte-identical to the s10 set (deterministic DOM); 01/04/05 refreshed.
9. ✅ **Docs**: this plan's execution status + README + AGENTS (session-11 contracts) + CLAUDE (counts + rules) + PAD (known-issues row) + `service-desk_SKILL.md` v2.9.0 + `docs/session_11.md` retrospective + `worklog.md`.
10. ✅ Commit + push via `docs/ssh_git_wrapper_v3.py` (main only). Gate re-run after the last doc file (the session-8 lesson: the gate's unit is the COMMIT).

## 3. Validation of this plan against the codebase

- **G1**: the not-found block already exists verbatim at `ticketdetails/page.tsx:126-158` (session-10 G2) — the fix only changes WHICH state reaches it. No existing spec drives the bare route (grepped: the session-10 not-found tests use `?id=unknown`); the `load` callback's early return stays (nothing to fetch when there is no id — the effect is a no-op, no lint exposure). The `useParams` fallback (`/ticketdetails/<id>`) still hits the fetch path and the API 404 → `notFound` — unchanged behavior.
- **G2**: `src/app/sitemap.ts` establishes the `NEXT_PUBLIC_SITE_URL` derivation pattern; `manifest.ts` rides the same convention. Next 16 serves `app/manifest.ts` at `/manifest.json` automatically (same mechanism as `robots.ts`/`sitemap.ts`, verified in the build output). The `metadata.manifest` field is the documented Next API for the head link. The 480×480 source (`src/app/icon.png`) is byte-identical to the reference's logo — upscaling to 512 is visually lossless for a flat logo (PIL LANCZOS).
- **G3**: Next 16 moved `themeColor` from `Metadata` to `Viewport` (the `viewport` export already exists in `src/app/layout.tsx:46-49`). The `apple-icon.png` file convention emits the `apple-touch-icon` link (the `icon.png` favicon mechanism, s7-verified).
- **G4**: the four `(app)` route layouts are server components rendering `{children}` — appending the script is additive. The auth pages have no layouts (client-island pages; root-default titles) — new minimal `layout.tsx` files follow the session-7 pattern. No spec greps `application/ld+json` today; the route names mirror the URL segments exactly.
- **skills/ exclusion**: `tsconfig.json` excludes `skills`; eslint ignores it; vitest matches `src|tests` `*.test.ts` only; playwright's testDir is `tests/e2e` — the contract holds (re-verified this session).
- **Env contract**: `.env` created from `.env.example` (`DATABASE_URL="file:../db/custom.db"` + generated `AUTH_SECRET`); `db/` at repo root (schema pushed + seeded: 4 users / 11 tickets / 3 comments); the npm scripts pin `DATABASE_URL` inline; `.env.example` matches the codebase and is tracked.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| The G1 render-time branch breaks the loading-state spec (the `aria-label="Loading ticket"` skeleton) | The skeleton branch still renders for the WITH-id loading path; only the id-less path short-circuits. The full suite re-run catches any regression. |
| `app/manifest.ts` + a stray `public/manifest.json` would conflict (route vs static) | No static manifest exists (verified) and none is created — the route is the only source. |
| Next 16 emits the manifest link with a version query (`/manifest.json?v=…`) breaking the `href` pin | The E2E pin asserts the link's `href` ends with `/manifest.json` (tolerant to the query) and fetches the route directly. |
| The apple-icon route emits `<link rel="apple-touch-icon">` only when the file convention resolves | The E2E pin asserts the link's presence + the 180×180 fetch — a miss renders red, not silently green. |
| JSON-LD in layouts duplicates across nested layouts (root + route) | Only per-route layouts render the component; the root layout never does. Dashboard deliberately renders none. |
| The JSON-LD script trips ESLint (`react/no-danger`) or hydration warnings | `dangerouslySetInnerHTML` on a `<script>` is the documented Next structured-data pattern; the dashboard hydration-clean spec (console watcher) guards the render path. |
| Rate-limiter budget: the new tests add no logins | All session-11 probes run through the shared `storageState` (fetch-level assertions on routes/manifest/robots need no auth for the public ones; the app-route JSON-LD checks reuse the authenticated session). |

## 5. Session-11 process lessons (for the next agent)

1. **The head is bigger than the metas you grep for.** Ten sessions swept `og:`/`twitter:`/`apple-` metas; the `rel="manifest"` LINK and the JSON-LD SCRIPT lived beside them the whole time. Enumerate every `<link>` and every `<script type>` in the head — not just the meta tags.
2. **Follow the redirect.** `/manifest.json` answered 302 — the lazy probe stops at "not 200". The manifest contract was one `-L` away.
3. **Drive the route matrix, including the degenerate cells.** Every session opened `/ticketdetails?id=X`; the id-less cell of the matrix hid an infinite skeleton. Parameterized routes deserve their empty-parameter probes.
4. **The platform's special cases are contract too.** `/dashboard` carrying no JSON-LD (and no proper title) is not noise — it's their builder's home-route special case, and mirroring the ABSENCE is as much parity as mirroring the presence.
5. **Static scans need structural confirmation.** The space-y trap detector flagged 2 "hits" — both grandchildren (the s11-known false-positive class). Verify JSX depth before filing engine-trap findings.
