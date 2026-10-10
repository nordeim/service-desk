---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-single-app
version: 1.0.0
last_updated: 2026-10-09
---

# ServiceDesk — IT Support Portal

Full-stack IT ticketing portal (Next.js 16 App Router standalone · React 19 · TypeScript strict · Tailwind CSS v4 CSS-first · shadcn/ui · Prisma 6 + SQLite · Vitest + Playwright). A visual-parity, feature-superset clone of the base44 ServiceDesk reference app, maintained as a single deployable process with zero external services.

**Verification gate (must be green before any commit):** `bun run lint && bun run typecheck && bun run test && bun run build` — plus `bun run test:e2e` (193 specs against the production standalone build) when UI/auth behavior changes. **Re-run the gate after EVERY file that lands — including one-off scripts** (a post-gate `.cjs` script broke CI on main in session 7; an inert screenshot-script guard shipped in s12 because nobody executed its failure path). CI (`.github/workflows/ci.yml`) runs the same gate on every push/PR to main.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — Read the relevant page/component/route and its tests in full before writing. Identify which contract (db-path, validation, auth session, UI parity) governs the change.
2. **PLAN** — State the smallest correct path; name the files touched and the specs that must be updated alongside.
3. **VALIDATE** — Confirm scope for anything touching auth, sessions, or the ticket vocabulary before coding.
4. **IMPLEMENT** — Modular, typed, test-backed increments. Domain rules go in `src/lib/` seams; UI consumes them.
5. **VERIFY** — Run the full gate; for visual changes, capture a screenshot and compare against `docs/screenshots/` and the reference captures.
6. **DELIVER** — Report what was verified, what was not, and any deferred debt. Never claim "works" without executed evidence.

### Project-Specific Principles

- **Visual parity is a contract.** The reference app's design was measured (computed styles + DOM classes), not guessed — sidebar `#fafafa`, the cyan→blue gradient motif, badge colors + lowercase badge text, the stacked dashboard layout, `text-4xl` page headings, gradient quick-stats rows, the flat divide-y recent list (FileText tiles, arrows, date-only dates), the detail grid, the login card shell, and the rise-in entrance animations are pinned by E2E specs (`visual-parity.spec.ts`, sessions 2–3). Style changes need a parity reason.
- **Superset, not divergence.** Additions (signup, forgot-password, attachments, owner status control, sort/scope) must not alter reference-visible structure. The reference's own quirks (header inside `<main>`, focus-to-body on sheet close, no nav highlight at `/`) are preserved or deliberately improved (the `/`→`/dashboard` redirect) — document any intentional divergence.
- **Zero third-party auth dependency.** HMAC cookie sessions + scrypt hashing in `src/lib/auth.ts` — auditable, unit-tested, no supply-chain surface. Do not swap in an auth library casually.
- **The database path is load-bearing.** `file:../db/custom.db` anchors against `prisma/schema.prisma`; `src/lib/db-path.ts` replicates the CLI rule at runtime so dev, build, and the standalone server open ONE file. Pinned by 15 tests.

## Implementation Standards

### TypeScript (strict, enforced)

- `strict: true`; no `any` in new code (use `unknown` + guards). Type-only imports stay inline (`import type`).
- Validated-string enums: the ticket vocabulary (categories/priorities/statuses) lives in `src/lib/constants.ts` with type guards — single source of truth for API, UI, and tests.
- Early returns; no deeply nested conditionals; domain guards in `src/lib/validation.ts` return `{ ok, errors }` records the UI maps onto fields.

### React 19 / Next.js 16

- Server Components by default; `"use client"` only for interactive leaves. Authenticated pages live under `src/app/(app)/` — the group layout guards the session server-side (`redirect("/login")`), so pages never re-check.
- `cookies()`, `params`, `searchParams` are **async** — always `await` them.
- Page files export only `default` + `metadata`/`generateMetadata`/`revalidate`/`dynamic`.
- `react-hooks/set-state-in-effect` is an ERROR: external-store state (media queries) uses `useSyncExternalStore` (`src/hooks/use-mobile.ts`), never effect-body setState.
- Client data fetching happens in effects with cancellation (`AbortController`, `cancelled` flags) — pages are hydratable islands over the server shell.

### Tailwind CSS v4 (CSS-first — no config file)

- Semantic tokens: `@theme inline { --color-*: var(--*) }` in `src/app/globals.css`. The `inline` keyword is mandatory — a bare `@theme` with `var()` chains is dropped by the build.
- Variant utilities outrank plain utilities in the cascade (order-independent). This is why the active nav item uses `text-white!` — a plain `text-white` loses to `data-[active=true]:text-sidebar-accent-foreground`. If you override a variant-styled primitive, use the `!` modifier and say why in a comment.
- Design tokens (`--navy-950`, `--cyan-500`, `--amber-500`…) mirror the reference app's `:root` block — keep the `:root` palette literal hex and in sync with the `.dark` block.
- **Font: the system stack, no webfont** (session 5). The reference loads no webfont; `--font-sans` is pinned in `@theme inline` to the reference's computed stack (`ui-sans-serif, system-ui, …` — Tailwind 4.3's default is a different string). Do NOT reintroduce next/font Inter or `antialiased`.
- **Radius scale: Tailwind v3 defaults** (session 6, superseded in 7): `--radius-md/lg/xl` are pinned to 0.375/0.5/0.75rem; `--radius-sm` is 0.25rem (4px — the reference's own rounded-sm re-measured at 4px in session 7; only rounded-sm differs between the v3 and v4 scales). Do NOT reintroduce the calc chain.
- **The accent pair is gray + near-black, not cyan** (session 7): `--accent: #f5f5f5`, `--accent-foreground: #171717` (the reference's stock shadcn pair). It drives select-option highlights, ghost/outline hover text, and the Skeleton. Do NOT tint it cyan — the cyan motif lives in explicit utilities.
- **Hover variants are media-guarded in v4** (`@media (hover:hover)`): on touch devices our hovers are inert while the reference's v3 hovers still apply — an intentional documented divergence. Hover E2E assertions must run under Playwright's Desktop Chrome (hover:hover); agent-browser reports hover:none and reads at-rest values.
- **Focus states are part of parity** (session 6): the Button/Input/Textarea bases use `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring` (near-black `--ring: #0a0a0a`); the SelectTrigger base uses plain `focus:ring-1`. Do NOT restore the new-gen `ring-[3px] ring-ring/50` tail. The reference's cyan focus customs are inert on text inputs, active on selects + the textarea border — see AGENTS.md session-6 contracts. **Raw `<button>`s need the tail spelled out per call site** (session 8: sign-out + attachment Remove).
- **The button cursor preflight is restored** (session 9): Tailwind v4 dropped v3's `button, [role="button"] { cursor: pointer }` preflight; `@layer base` in globals.css carries the rule verbatim (the reference's v3 build renders the hand cursor on every true button). Do NOT remove it.
- **The `:root` block is verbatim STOCK shadcn** (session 9, full token diff): `--primary #171717` (near-black — badge hovers go dark, never cyan), `--border`/`--input #e5e5e5` (neutral-200, not slate-200), `--foreground`/`--card-foreground`/`--popover-foreground #0a0a0a`, `--sidebar-ring #3b82f6` (blue-500, not cyan), `--background #ffffff`. The cyan→blue motif lives ONLY in explicit utilities. Do NOT re-tint the semantic tokens.
- **The Badge atom is the OLD shadcn generation** (session 9): base = `inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2` + `/80` variant hovers — NOT the new-gen `transition-[color,box-shadow]`/`ring-[3px]` base (the visible delta: hover backgrounds must FADE, not snap).
- **The desktop sidebar edge is `border-slate-200/60`** (session 9, translucent) and the mobile sheet overlay is 80% black (session 8, live-measured). **`min-w-0` on the SidebarInset main is load-bearing** — it kills a mobile horizontal-overflow defect the reference itself has; without it the recent-card rows' intrinsic nowrap width widens the whole document at 375px.
- **Auth error alerts** (session 8): `text-sm text-red-700 bg-red-50/70 border border-red-200 rounded-xl p-4` on `p[role=alert]` — the reference's measured shadcn-Alert contract (was red-600/rounded-lg/px-3 py-2/opaque).

### Data Layer (Prisma + SQLite)

- Schema in `prisma/schema.prisma`; the client singleton in `src/lib/db.ts` resolves `DATABASE_URL` through `db-path.ts` BEFORE instantiating Prisma — never import `@prisma/client` directly in app code.
- npm scripts pin `DATABASE_URL='file:../db/custom.db'` inline — an ambient env var (sandbox default) would otherwise override `.env`. Keep the pin when editing scripts.
- Mutations are route handlers under `src/app/api/**` returning JSON; the comment route updates the ticket's `updatedAt` in one transaction. Never introduce raw SQL with user input; all queries go through Prisma.

## Development Workflow

### Environment Setup

```bash
bun install
cp .env.example .env            # DATABASE_URL="file:../db/custom.db" + AUTH_SECRET
bun run db:push && bun run db:seed
bun run dev                     # http://localhost:3000  (demo@servicedesk.app / Demo1234!)
```

### Build Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server :3000 |
| `bun run build` | Production standalone build |
| `bun run start` | Boot standalone server |
| `bun run lint` / `bun run typecheck` | ESLint / tsc |
| `bun run test` / `bun run test:e2e` | 56 unit / 193 E2E (needs prior build) |
| `bash scripts/smoke-test.sh` | API smoke on a throwaway server |
| `bun run db:push` / `db:seed` / `db:reset` | Schema push / idempotent seed / reset |

## Testing Strategy

- **Unit (Vitest, `*.test.ts`)**: pure seams only — auth sign/verify + scrypt + rate limiting, input validation, constants vocabulary, db-path resolution, date/duration formatting (`formatDate` date-only, `formatDateTime`, `formatDuration` — the formatters pin `timeZone: "UTC"`, rendering the stored UTC wall-clock at any viewer/runner timezone: the reference's naive-datetime round-trip contract, s15). No DOM, no DB.
- **E2E (Playwright, `tests/e2e/*.spec.ts`)**: boots the PRODUCTION standalone server on :3100 with an isolated seeded `db/e2e.db` (193 tests, 163 of them the visual-parity pins through session 17). One authenticated session via the setup project's `storageState` (auth is rate-limited — keep real logins under 10/run). `auth.spec.ts` opts out to test the logged-out surface. `visual-parity.spec.ts` (163 tests) pins the reference-measured design contracts (sessions 2–17; session 6 added the computed-value pins — the radius scale, the focus-state matrix, select dropdown structure + priority colors; session 7 added the accent-token pair, the option-radius drift supersede, empty-state markup, fetch-failure resilience, favicon + per-route titles; session 8 added the auth-error alert contract, the 80% sheet overlay, zero-overflow-at-375px + ellipsis truncation, the social/PWA head set, and the raw-button focus tails; session 9 added the button-cursor preflight, the stock shadcn token block, the old-gen Badge base, and the translucent sidebar edge; session 10 added the in-card login view state machine — reset + Check-your-email + signup views with the shorter h-10/sm:h-11 input generation — the ticket-not-found destructive Alert, the doc/docx picker families, and the sitemap/robots SEO surface; session 11 added the id-less detail route (bare + empty `?id` render the Alert, never a skeleton), the PWA manifest contract (`/manifest.json` + the head link + real-size PNG icons), the theme-color/apple-touch-icon pair, and the per-route BreadcrumbList JSON-LD incl. the dashboard absence; session 12 added the per-route social URL set (canonical + og:url + twitter:url, all three equal on every route — via `openGraph.url` + `metadata.other`; ours had shipped none for four sessions on a false "derives from canonical" belief) and the login-view back buttons' computed margins (the space-y trap-log #4 firing live — the reference's `-mb-2` computed an 8px overlap on v4; `mb-2 sm:mb-4`/`mb-2` compute the reference's 8–16px gaps). Session-13 additions pin the attachment UI the reference actually ships (the submit-form rows + the detail-page display + the no-comments empty state). Session-14 additions pin the attachment download route's inline disposition (the reference CDN serves no Content-Disposition — the new tab displays the file) and the ticketdetails full-URL canonicalization (canonical + og:url + twitter:url + the breadcrumb JSON-LD item all carry ?id=<id> on the id-bearing route; the bare route stays segment-canonical). Session-15 additions pin the attachment route's cache window (the reference CDN's year-long immutable max-age, with our private scope on the owner-scoped route) and the timezone-stable date rendering (the reference's naive datetimes round-trip as the stored UTC wall-clock to every viewer; our formatters pin timeZone "UTC" — verified in Singapore + extreme +14/-12 browser contexts). Session-16 additions pin the per-surface entrance-animation contract (the reference's framer-motion parameters read from their production bundle + confirmed with live rAF timelines: ONE 500ms ease-out tween per stat card and per the submit/detail wrappers — no overshoot; the mytickets cards as a ~300ms spring with a 50ms/index stagger; the recent rows as an x-axis slide-in with a 100ms/index stagger; the spring surfaces' opacity on a separate piecewise curve — the framer-motion spring's slower opacity settle) and the sidebar stats' 5-second polling. Session-17 additions pin the head-layer VALUE contracts (the first value-level head sweep: the viewport meta's `viewport-fit=cover`, and the og:image pointing at the REAL 512×512 PNG with the asset GET + PNG magic bytes pinned — two true-looking declarations over false assets closed in one sweep). Color pins accept both rgb() and lab() representations (v4 emits palette colors as lab()). `dashboard.spec.ts` pins clean hydration (no console hydration-mismatch errors — a `<div>`-in-`<p>` skeleton once broke it).
- **Smoke (`scripts/smoke-test.sh`)**: API contract on a throwaway server — health, login, CRUD, comments, guards (401/400).
- Bug fixes require a failing test first (unit for domain seams, E2E for UI contract). The mobile-navigation spec is the highest-regression-risk chrome — run it after any sidebar/sheet/Tailwind change; run visual-parity after any page-layout change.

## Code Quality Standards

- ESLint 9 flat config + `eslint-config-next`; zero warnings tolerated on the gate.
- No secrets in code or logs; `.env` is gitignored; the CI habit is `git ls-files | grep -E '^\.env$|\.key$'` before doc-heavy commits.
- Comments explain **why** (see the `text-white!` rationale in `app-sidebar.tsx`), never narrate the obvious.

## Git & Version Control

- Push target: `git@github.com:nordeim/service-desk.git` (main only) via `docs/ssh_git_wrapper_v3.py` — see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. Never commit keys; the wrapper shreds its temp material.
- Conventional Commits, atomic units, message explains why-not-just-what.

## Error Handling & Debugging

- Route handlers return typed JSON errors (`{ error, errors? }`) with correct status codes (401/403/400/404/429); the UI renders field errors inline and surfaces toasts for flow outcomes.
- Unexpected server errors are logged with context (`[auth]`, `[health]` prefixes) — never silently swallowed.
- Debug toolkit: `dev.log` for the dev server; Playwright traces live in `test-results/` on failure; `scripts/probe-gradients.mjs` + `gradient-test*.mjs` reproduce the Tailwind v4 `lab()`/oklab gradient rendering questions (they also document the Next dev-overlay false positive — a fixed dark circle at bottom-left in dev screenshots only).

## Communication & Documentation

- Update `README.md` (user-facing) and `Project_Architecture_Document.md` (engineering reference) when behavior, commands, or contracts change.
- State confidence labels for non-trivial claims: Verified (executed) / Reasoned (code inspection) / Assumed.

## Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | SQLite path, relative to `prisma/schema.prisma` | `file:../db/custom.db` |
| `AUTH_SECRET` | HMAC key for session cookies (required in prod) | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata | `http://localhost:3000` |

## Anti-Patterns to Avoid

- Adding `tailwind.config.js` (v4 is CSS-first — tokens live in `globals.css`).
- Plain `text-*`/`bg-*` overrides fighting shadcn variant utilities without `!` — they lose the cascade.
- Using `app/manifest.ts` when the manifest must live at a custom URL — the convention serves `/manifest.webmanifest` AND auto-emits its own head link, silently overriding `metadata.manifest` (session 11: the E2E link pin caught it). Use a plain route handler (`app/manifest.json/route.ts`).
- `getByRole("alert")` in Playwright (ambiguous — Next's route announcer also matches).
- Trusting an ambient `DATABASE_URL` env var over the repo `.env` (scripts pin it for this reason).
- "Fixing" the dark circle over the sidebar footer in dev screenshots (Next dev overlay, shadow DOM, dev-only).
- Deriving "not found" via setState inside an effect body (`react-hooks/set-state-in-effect` is an ERROR) — derive at render time instead (session 11's `missingId` pattern).
- Real logins per E2E test (rate limiter) — use the shared `storageState`.
- Adding a margin utility to a DIRECT child of a `space-y-*` container (the v3→v4 selector rewrite makes it render differently than the reference). **This trap FIRED live in session 12** — the session-10 login-view back buttons shipped the reference's `-mb-2` in exactly this configuration and computed an 8px OVERLAP on v4 for two sessions (the reference's v3 computes 8–16px gaps). "Verified absent" claims go stale — run the trap scan on every diff that adds any margin utility near a space-y container, and verify COMPUTED margins, never identical class names (the shadow-xs doctrine: parity is the COMPUTED value).
- Believing og:url/twitter:url "derive from the canonical" (a false s8-era comment that shipped no og:url or twitter:url anywhere for four sessions). Next emits og:url ONLY from `openGraph.url` (a child's `openGraph` wholesale-REPLACES the parent's — see `src/lib/route-head.ts`); twitter:url has no metadata field at all — it must ride `metadata.other`, whose values are NOT metadataBase-resolved (absolute URLs required).
- Faking the reference's base44 "Verify your email" flow (platform artifact; no mail transport — the direct sign-in on create is the documented superset).
- Stopping the parity probe at the DOM layer — the HTTP response behind a link (Content-Disposition, content-type, redirect chain) is a parity surface too (session 14: our download route forced `attachment` downloads for six sessions while the reference's new tab displayed the file inline, one curl away). **And the HTTP method is part of the measurement**: the base44 file proxy 404s HEAD and 302s GET (session 15: the s14 "CDN URLs expire" finding was a HEAD artifact — every probe URL still serves via GET; probe with the verb the browser uses).
- Rendering dates in the viewer's local timezone when the reference renders the stored UTC wall-clock (session 15: their API returns naive datetimes that round-trip; ours returned Z-suffixed ISO and rendered local — an 8h-visible divergence for the Singapore operator, invisible at UTC where every probe and E2E run executes). The formatters pin `timeZone: "UTC"`; unit pins are deterministic at any runner TZ (verify RED phases under `TZ=Asia/Singapore`).
- Believing a code comment's claim about the reference's FEATURE SET without re-probing it live ("the reference has no attachments" shipped in session 8 and survived five sessions while their full attach UI sat one probe away — the s13 finding; same defect class as the s12 og:url belief).
- Pinning a meta's PRESENCE while never value-diffing its CONTENT or the asset behind it (session 17: the viewport string lacked `viewport-fit=cover` and the og:image claimed 512×512 over a 480×480 JPEG for 16 sessions — every head sweep enumerated meta names, none read the values; "probe the head" extends to what each meta SAYS and whether the asset it points at is what it claims).
- Duplicating an openGraph block between the root layout and a per-route helper (session 17: a child's openGraph REPLACES the parent's wholesale, so both must carry the same images array — the root-layout fix alone left every routeHead route serving the old URL; `OG_IMAGES` in `route-head.ts` is the single source).
- Fitting ONE timing curve to every animated surface (the session-3 single-spring error, superseded in session 16: the reference ships a 500ms tween on stat cards/wrappers, a staggered spring on card grids, and an x-axis slide on recent rows — four different contracts reconciled into one spring because the probe only sampled one). Enumerate the per-surface parameters (axis, duration, easing, stagger) and read the reference's bundle for the exact framer-motion values — the live probe confirms, the bundle defines.
- Asserting attachment-adjacent UI without driving the attached STATE (the s3 dropzone measurement pinned at-rest markup only; the attached rows — the state users actually see — were never compared until session 13. Every interactive surface has at least two contracts: at-rest and active).

