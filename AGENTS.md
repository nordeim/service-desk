# AGENTS.md

Instructions for AI coding agents working in this repository. Every line answers: "would you get this wrong without being told?" Verified against the toolchain on 2026-10-09.

## Commands

Run from the repo root. Bun is the documented runtime (Node ≥ 20 works for everything except `db:seed`, which uses Bun's TS execution — fall back to `npx tsx prisma/seed.ts`).

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on :3000 (Turbopack), logs to `dev.log` |
| `bun run build` | Production standalone build (`.next/standalone/server.js` + static + public) |
| `bun run start` | Boot the standalone server in production mode |
| `bun run lint` / `bun run typecheck` | ESLint 9 flat / `tsc --noEmit` |
| `bun run test` | Vitest unit suite (54 tests — auth, validation, db-path, utils incl. formatDate + priority-select colors) |
| `bun run test:e2e` | Playwright E2E (125 tests) — boots the **production standalone server** on :3100 with an isolated `db/e2e.db`; requires a prior `bun run build` |
| `bash scripts/smoke-test.sh` | API smoke: throwaway server on :3999, exercises auth + CRUD + guards |
| CI (`.github/workflows/ci.yml`) | GitHub Actions on push/PR to main: verify job (lint → typecheck → unit → build) + e2e job (Playwright against the restored standalone build) |
| `bun run db:push` / `db:seed` | Push `prisma/schema.prisma` → `db/custom.db` / idempotent seed (4 users, 11 tickets) |
| `bun run db:reset` | Drop + recreate + reseed |

Clean-check order: `bun run lint typecheck test build` — then `bun run test:e2e` (it needs the build). With no database, run `bun run db:push && bun run db:seed` first; the E2E global setup manages its own `db/e2e.db`.

## Architecture invariants

- **Route group auth guard:** all authenticated pages live in `src/app/(app)/` whose `layout.tsx` calls `getCurrentUser()` and `redirect("/login")` server-side. Do not add authenticated routes outside the group; do not duplicate the guard in pages.
- **One database contract:** `DATABASE_URL="file:../db/custom.db"` resolves **against `prisma/schema.prisma`** (Prisma CLI rule) and at runtime via `src/lib/db-path.ts` (anchors on the repo that owns `prisma/schema.prisma`, incl. the standalone build). Absolute URLs pass through untouched. Pinned by `tests/db-path.test.ts` — never "simplify" it.
- **npm scripts pin `DATABASE_URL` inline.** An ambient exported `DATABASE_URL` (sandboxes do this) overrides `.env` files; the inline pin keeps every script pointed at `<repo>/db/custom.db`. Keep the pin when editing scripts.
- **Mutations are route handlers** (`src/app/api/**`) returning JSON with field-level `errors` records; the UI maps them onto form fields. Never throw across the boundary; never add a second error envelope shape.
- **Validated-string enums:** SQLite has no enums — `Ticket.category/priority/status` allowed values live ONLY in `src/lib/constants.ts` (type guards + label maps). API routes and tests import from there; never inline the vocabulary.
- **Client islands:** pages are `"use client"` leaves; the server chrome (sidebar, session) renders in the `(app)` layout. `AppSidebar` stats fetch happens client-side per route change — keep it that way (it's what makes the QUICK STATS live).

## Framework quirks (verified the hard way)

- **Never put a block component (e.g. the Skeleton `<div>`) inside a `<p>`.** The browser parser hoists the div out, the client tree mismatches, and React 19 logs a hydration error on every load (found via the console during session-3 live verification; pinned by `dashboard.spec.ts` "hydrates cleanly"). Use an inline `<span className="inline-block … animate-pulse">` skeleton inside paragraphs.
- **Next.js 16:** `cookies()`, `params`, `searchParams` are **async** — always `await`. Page files may export only `default` + `metadata`/`generateMetadata`/`revalidate`/`dynamic`. `output: "standalone"` + `outputFileTracingRoot` pin in `next.config.ts` are load-bearing (standalone server path + prisma trace).
- **Tailwind v4 (CSS-first, no `tailwind.config.js`):** semantic tokens use `@theme inline { --color-x: var(--x) }` — the `inline` keyword is REQUIRED (a bare `@theme` with `var()` chains is dropped by the build, silently killing every semantic utility). Keep the `:root` palette literal-hex and in sync.
- **Variant utilities beat plain utilities in the v4 cascade.** `data-[active=true]:text-sidebar-accent-foreground` (variant) outranks a plain `text-white` regardless of class order — that's why the active nav item uses `text-white!` (important modifier). E2E-pinned by `mobile-navigation.spec.ts` ("the active nav item carries the cyan→blue gradient").
- **Raw `evaluate(getComputedStyle)` races stylesheet load** — a full-suite run flaked on it once (session 3). Use `await expect(locator).toHaveCSS(...)` (auto-retrying) instead.
- **`react-hooks/set-state-in-effect` is an ERROR** under this ESLint config. For media-query state use the `useSyncExternalStore` idiom in `src/hooks/use-mobile.ts`; never an effect-body `setState`.
- **The Next.js dev overlay is disabled** (`devIndicators: false` in `next.config.ts`). It renders a fixed dark circle at the bottom-left **inside a shadow root** (`nextjs-portal` → `.nextjs-toast`) that overlaps the sidebar user footer and pollutes screenshots/visual checks — do not "fix" dark pixels there before checking for it; production builds never render it.
- **Playwright `getByRole("alert")` is ambiguous in this app:** Next injects `#__next-route-announcer__` with `role="alert"`. Scope to `p[role="alert"]` (the form error paragraphs).
- **Toast-title locators need `{ exact: true }`:** Radix's toast announcer (`role="status"`, shadow-hidden `sr-only`) concatenates title+description, so a substring `getByText("Status updated")` resolves to 2 elements → strict-mode violation. Same for any toast title.
- **`locator.count()` never retries:** it snapshots once and races async fetches. For "the list should now contain N items" use `await expect(locator).toHaveCount(N)` (auto-retry).
- **Parity probes must scope to `main`:** the sidebar (quick stats, footer email) lives OUTSIDE main; a bare `page.locator(...)` will resolve to sidebar elements first. `tests/e2e/visual-parity.spec.ts` shows the working patterns (parent via `xpath=..`, structural selectors like `main div.p-6.border-b`).
- **The mobile `<header>` has no implicit `banner` role** because it lives inside `<main>` (reference structure) — target `page.locator("header")` in specs.
- **Rate limiter budget:** auth endpoints allow 10 attempts/IP/15 min (in-memory, `src/lib/auth.ts`). E2E signs in ONCE via the setup project's `storageState`; keep per-run real logins well under the budget or the suite flakes with 429s.
- **Prisma + Bun:** `bunx prisma db push` may silently pick up an ambient `DATABASE_URL` env var — always go through the npm scripts (which pin it) or export the var explicitly.

## Conventions that differ from defaults

- Server Components by default; `"use client"` only for interactive leaves (pages under `(app)/` are client islands by design — they hydrate onto the server-rendered shell).
- Password hashing: Node `scrypt` with a per-user salt, stored as `scrypt$salt$hash` — verified in constant time (`timingSafeEqual`). Sessions: HMAC-SHA256 over a base64url JSON payload in an httpOnly cookie; both pure functions in `src/lib/auth.ts` are unit-tested — reuse them, don't reimplement.
- Attachments: base64 in SQLite, capped 2 MiB/file × 3 files (`ATTACHMENT_*` in constants + `validateAttachments`). Download route sanitizes the filename for `Content-Disposition`.
- Dates render via `formatDateTime` ("Oct 9, 2026 at 12:47 AM" — reference format, separate Intl parts joined with " at") on mytickets cards and the detail panel; `formatDate` ("Oct 9, 2026", date-only) on dashboard recent rows (reference convention, session 3); durations via `formatDuration` ("3d 4h" / "N/A").
- **No `tabular-nums` on counters** — the reference renders proportional digits; parity-as-contract applies to typography too (session 2).
- **Content scrolls inside the layout's `flex-1 overflow-auto` container, not the document body** (reference architecture). The mobile header is deliberately NOT sticky — it sits above the scroll container. Pages render `min-h-screen` roots without `flex-1`.
- **Two ticket-row renderers, never interchangeable:** `TicketCard` (mytickets: bordered card, `w-14` emoji tile, arrow, `text-lg font-bold` title) vs `RecentTicketRow` (dashboard: flat `divide-y` row, `w-12` **FileText-icon** tile, title inside a flex wrapper with the arrow, no category badge, **date-only** via `formatDate`) — both measured from the reference (session 3 re-measure).
- **Badge text is lowercase** ("open", "medium priority", "hardware") — the reference never capitalizes; no `capitalize` on the badge atoms.
- **Entrance animation:** `animate-rise-in motion-reduce:animate-none` (custom `@utility` in globals.css) on stat cards, recent rows, mytickets cards, the submit form card, and the detail back+grid wrapper. Measured from the reference's framer-motion spring (opacity 0→1 + y 20→0, ~310 ms, ~12% overshoot, no stagger). A global `prefers-reduced-motion` block also collapses sheet/hover transitions.
- Vitest imports `describe/it/expect` explicitly (no globals config) and matches `*.test.ts` only — Playwright's `*.spec.ts` never run twice.
- E2E geometry assertions wait out animations (`page.waitForTimeout(700)` after the sheet opens — the slide-in is 500 ms) before `boundingBox()`.

## Session-2 parity contracts (pinned by `tests/e2e/visual-parity.spec.ts`)

- Quick stats: gradient rows + `shadow-md` badges — geometry verified identical to the live reference (48 px row height, 16 px group offset, 14 px labels).
- Detail page: `grid lg:grid-cols-3` + `lg:col-span-2` left column; ticket card header carries `bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border-b border-slate-100`; the priority badge includes the word "priority"; the status badge is `text-sm! font-bold` (needs the `!` — the Badge base forces `text-xs`).
- Mobile header: NOT sticky, plain `text-xl` "ServiceDesk" h1, no logo tile (all three measured from the reference DOM).
- Login card: `max-w-md` + `bg-white/95 backdrop-blur-sm` + slate top bar + `ring-4` in-card logo (`public/logo.png`, fetched from the reference app); sign-in button is `bg-slate-900` (NOT the cyan gradient).
- Page headings: `text-4xl` + `text-lg text-slate-600 mt-2` subtitles; containers: dashboard `max-w-7xl`, mytickets `max-w-7xl` + 3-col filter grid, submit `max-w-3xl`, detail `max-w-5xl`.

## Session-3 parity contracts (same spec file; inventory in `docs/remediation-plan-session3.md`)

- Dashboard recent rows: `w-12` tile with a **FileText SVG icon** (`w-6 h-6 text-cyan-600`, no `text-2xl`), title inside `flex items-start justify-between gap-4 mb-2` **with the arrow**, status + priority badges only (no category), **date-only** dates.
- Badge text is lowercase everywhere ("open", "medium priority", "hardware").
- Entrance animations: `animate-rise-in motion-reduce:animate-none` on stat cards, recent rows, mytickets cards, the submit card, and the detail back+grid wrapper; computed `animation-name: rise-in` (and `none` under `reducedMotion: "reduce"`).
- Submit form: circle-alert header icon; priority trigger value `text-blue-600`; category value = emoji span + label in a flex row; dropzone = dashed div + hidden input + `label[for]` with the plain `Upload` icon (p-6, sub-text "Images, PDFs, or documents"); footer = inline `flex justify-end gap-3 pt-4` row (no `border-t`) with the `Send` icon on the submit button.
- Login: no caption text below the card (reference renders an empty sm:hidden div).
- MyTickets: search icon `w-5 h-5`.
- Detail info panel: labels `tracking-wide` (not `wider`).
- `<main>` (SidebarInset) renders exactly `flex-1 flex flex-col` — transparent; the app gradient wrapper paints through.
- Hydration is clean (no console hydration-mismatch errors on any page).

## Session-4 parity contracts (same spec file; inventory in `docs/remediation-plan-session4.md`)

- **Sidebar nav items wrap icon+label in ONE inner `flex items-center gap-3` div** (reference structure). This is load-bearing twice over: the anchor's `justify-between` becomes a no-op (single child — without the wrapper the label gets pushed to the right edge), and the button base's `[&>svg]:size-4` direct-child selector no longer matches, so the icon keeps its `w-5 h-5` (20px). Labels are `font-semibold` (600).
- Active nav item hovers to the light gradient (`hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700!`) — same as inactive; the `!` is required because `text-white!` is important.
- Status/priority badges carry `shadow` + `hover:bg-primary/80` (the reference's old-shadcn base); the outline CategoryBadge carries NEITHER.
- Badge padding is per-surface: mytickets cards + detail status = `px-3 py-1`; dashboard recent rows + detail priority = `px-2.5 py-0.5` (the `compact` prop on the badge atoms).
- Submit-form labels: `text-slate-700 font-semibold` with a plain-text asterisk (ONE text node — the Label base is flex, so a separate span child would get an 8px gap); the reference has NO red asterisk span.
- Submit grid: `md:grid-cols-2 gap-6`. Non-login form controls (mytickets search/filters, submit title/selects, comment textarea): `shadow-sm border-slate-300 focus:border-cyan-500 focus:ring-cyan-500`; mytickets controls are `bg-transparent` (not white).
- Back controls are the GHOST Button variant (borderless at rest) — not outline.
- The mobile SidebarTrigger is `rounded-lg hover:bg-slate-100 p-2` (overriding the ghost base via tw-merge).
- Detail info labels are `tracking-wider` (session-4 re-measure — the reference renders wider on all 3 labels; session 3's `wide` reading is superseded).
- Unmatched routes render the reference-designed 404 (`src/app/not-found.tsx`): `text-7xl font-light` 404, `h-0.5 w-16` divider, "Page Not Found", path-aware message, Go Home → `/dashboard`.
- The reference's own toast viewport BLOCKS its mobile trigger (`pointer-events: auto` band over the header) — our Radix viewport region is `pointer-events: none` by construction. Do not "fix" ours to match.
- Display names use the account name (greeting/footer/comments); the reference shows the email local-part because base44 auth has no name concept (its `/signup` is a 404, `/forgotpassword` empty). Superset divergence — documented.

## Session-5 parity contracts (pinned by `tests/e2e/visual-parity.spec.ts`; inventory in `docs/remediation-plan-session5.md`)

- **Icon-bearing Buttons render px-4 (16px) horizontal padding** — the Button size variants carry NO `has-[>svg]:px-*` (the reference's old base has no `:has(> svg)` adaptation; with it, every direct-svg button shrank to 12px).
- **The v3→v4 shadow naming trap:** the reference's `shadow-sm` (Tailwind v3 name) COMPUTES to the light `0 1px 2px 0/0.05` step — which is `shadow-xs` on the v4 scale. Form controls, submit buttons, the mobile header, and the Google button's hover therefore use `shadow-xs` on our build; `shadow-md/lg/xl/2xl` and bare `shadow` kept their values (names unchanged). Parity is the COMPUTED box-shadow, never the class name.
- **The font is the system stack** — the reference loads NO webfont (`document.fonts` empty); `--font-sans` is pinned in `@theme inline` to `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", …` (Tailwind 4.3's default `--font-sans` is a different, older vendor list). No `antialiased` (the reference leaves smoothing at `auto`).
- Back-button arrows + the Add Comment svg carry `mr-2` (16px icon-to-text spacing); the View All CTA arrow slides `group-hover:translate-x-1` (4px); the form submit button is `Send w-4 h-4 mr-2` (session-3 was right — the "CirclePlus" reading was the sidebar NAV item, which also reads "Submit Ticket": scope probes to `main`/the form).
- Quick-stat value badges carry `hover:bg-primary/80` (the reference's old-shadcn base).
- The 404 Go Home control carries the reference focus tail: `duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500`.

## Session-6 parity contracts (pinned by `tests/e2e/visual-parity.spec.ts`; inventory in `docs/remediation-plan-session6.md`)

- **The radius scale is Tailwind v3 defaults:** `--radius-sm/md/lg/xl` pinned in `@theme inline` to 0.375/0.5/0.75rem (6/8/12px) — EXCEPT `--radius-sm`, superseded in session 7 to 0.25rem (4px): the reference's own `rounded-sm` (their SelectItem — the only usage on either site) re-measured at 4px (their build drifted; v3's `rounded` (4px) became v4's `rounded-sm`, and md/lg/xl are identical on both scales). `rounded-2xl`/`rounded-full` keep Tailwind defaults (16px/9999px — same on v3/v4).
- **Focus-visible states match the reference's old-shadcn generation:** Button/Input/Textarea bases carry `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring` (1px near-black ring, NO border change); the SelectTrigger base carries plain `focus:outline-none focus:ring-1` (ring on click too). `--ring` is near-black `#0a0a0a` (the reference's hsl(0 0% 3.9%)) — NOT cyan.
- **The reference's cyan focus customs are per-surface:** INERT on text inputs (title/search render 1px near-black ring + unchanged slate-300 border — we dropped them there), ACTIVE on select triggers (cyan ring + cyan border) and the textarea BORDER (cyan border, near-black ring). Auth inputs (login/signup/forgotpassword) use their older generation: `focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white` + `focus:border-slate-400` + `shadow-none` (no at-rest shadow).
- **Select dropdowns:** category OPTIONS and the trigger value render `<span class="flex items-center gap-2"><span>{emoji}</span>{label}</span>` — `CATEGORY_LABELS` values are emoji-free (emoji-prefixed labels rendered a double emoji once the span was added). Priority options AND the trigger value render the selected priority's color via `PRIORITY_SELECT_CLASS` (low=slate-600, medium=blue-600, high=orange-600, urgent=red-600); the mytickets priority FILTER options stay plain (the reference renders those without color).
- **Login footer:** the whole "Need an account? Sign up" line is ONE anchor (`text-sm text-slate-500 hover:text-slate-700 transition-colors`) with an inner `font-medium text-slate-700` span — hovering darkens the line (not just the link). Same pattern on the signup page's "Already have an account?" line.
- **The Google button renders NO at-rest shadow** (`shadow-none` on the call site — the reference's raw button has none; the outline variant base keeps `shadow-xs` for the CTA/Cancel which DO render it).
- E2E color pins accept both `rgb()` and `lab()` representations — Tailwind v4 emits palette colors as lab() functions (slate-400 → `lab(65.5349 -2.25151 -14.5072)`); literal-hex tokens stay rgb.

## Session-7 parity contracts (pinned by `tests/e2e/visual-parity.spec.ts`; inventory in `docs/remediation-plan-session7.md`)

- **The accent pair is the stock shadcn light scale, NOT cyan:** `--accent: #f5f5f5` (hsl 0 0% 96.1%) + `--accent-foreground: #171717` (hsl 0 0% 9%) — live-measured from the reference's `:root`. It drives the select-option highlight (bg+text), ghost/outline hover TEXT (near-black, not cyan-700), and the Skeleton. The cyan motif lives in explicit utilities (from-cyan-500, text-cyan-700…), never in these tokens.
- **Tailwind v4 wraps every `hover:` variant in `@media (hover:hover)`** — on touch/hover:none devices our hover styles are inert while the reference's v3-style unguarded `:hover` still applies (sticky hover). Intentional divergence (modern behavior, like the lab() pipeline). Consequence for tooling: agent-browser's browser reports `hover: none` — hover probes must run under Playwright's Desktop Chrome (hover:hover) or they read at-rest values.
- **Per-route document titles** via passthrough `layout.tsx` files (client-island pages cannot export metadata): "Dashboard | ServiceDesk", "Submit Ticket | ServiceDesk", "My Tickets | ServiceDesk", "Ticket Details | ServiceDesk" — the reference's own pattern (live-measured) with proper-cased names; auth pages keep the root default.
- **Favicon** = `src/app/icon.png` (the reference app's logo, fetched in session 2) — Next.js generates the `<link rel=icon>` + `/icon.png` route.
- **Empty states match the reference markup** (mytickets search-empty, measured): card `rounded-xl border bg-card text-card-foreground p-12 text-center border-none shadow-xl`, icon circle `w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200` + **FileText** `w-10 h-10 text-slate-400`, h3 `text-xl font-semibold text-slate-900 mb-2`, p `text-slate-500` (16px, no text-sm). Our distinct filtered/empty message pair stays (superset — the reference shows "You haven't submitted any tickets yet." even for a no-match search). Dashboard recent-empty: `p-12 text-center` wrapper, icon `text-slate-400`, label `text-slate-500`.
- **Fetch failures surface, never silently hang** (superset): dashboard + mytickets render an error panel (empty-state visual language) with a **Try again** button on non-ok; the dashboard no longer hangs in skeleton forever (one transient 401 proved it), and mytickets no longer misleads with "No tickets found". The reference renders silent zeros on failure (verified live by blocking their API).
- **The reference DRIFTS** (session-7 ledger): their active-nav no longer sets `data-active` (gradient hardcoded — visually identical); they now set per-route titles; their `rounded-sm` moved 2px→4px. Re-measure before accepting any previously-pinned value as current — and probe the TOKEN layer (`:root` `getPropertyValue`), not just utilities.

## Session-8 parity contracts (pinned by `tests/e2e/visual-parity.spec.ts`; inventory in `docs/remediation-plan-session8.md`)

- **The auth-error alert is a shadcn-Alert-style banner** (live-measured on the reference's wrong-password flow): `p-4` (16px), `rounded-xl` (12px), **translucent** `bg-red-50/70`, `border-red-200`, `text-red-700` — on login + signup + forgotpassword. The `p[role=alert]` element is our a11y superset (the reference renders a div.Alert; the auth.spec pin keys on the selector). Field-level error Ps (`text-xs text-red-600`) stay — our API returns field errors, the reference has a single alert.
- **The mobile sheet overlay dims at 80% black** (`bg-black/80` — the reference's measured backdrop; ours was /50 for seven sessions).
- **Zero horizontal overflow at 375px** — `min-w-0` on the SidebarInset `<main>`. Without it the flex item's automatic minimum (min-content) let the recent-card rows' intrinsic nowrap width widen the whole document (scrollWidth 516 at 375). **The reference has the identical defect** (their 451 = our single-row measurement with their ticket title — structurally confirmed); our fix is a deliberate superset (like the `/`→`/dashboard` redirect) and the row titles now truncate with ellipsis as designed. Do NOT remove `min-w-0` to "match" the reference.
- **The head ships the reference's social/PWA set**: description "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently." (their text), `og:title/description/url/type/site_name/image` (og:title follows the title template; og:url derives from the per-route canonical), `twitter:card summary_large_image`, `apple-mobile-web-app-*`, and per-route `alternates.canonical` (4 app routes).
- **Raw buttons carry the focus tail** (`focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`): the sidebar sign-out + the attachment Remove. The session-6 focus matrix covered the Button/Input/Textarea/SelectTrigger bases — raw `<button>`s need the tail spelled out per call site.
- **The reference never toasts** (comment-add / ticket-submit / login-error verified idle under live triggers + MutationObservers); our toast feedback is the documented superset. Our viewport classes are IDENTICAL to theirs — keep the idle viewport `pointer-events: none` (their `pointer-events: auto` viewport still blocks their own mobile trigger — their standing defect, never copy it).

## Environment

`.env.example` documents every variable; `.env` is gitignored. `AUTH_SECRET` = `openssl rand -hex 32` (required in production — the dev fallback logs a loud warning). `DATABASE_URL="file:../db/custom.db"` → `<repo>/db/custom.db`. Production deployments should switch to an absolute `file:` URL (see `docs/DEPLOYMENT.md`).

## Reference

- `Project_Architecture_Document.md` — the full engineering reference (ADRs, layer model, security architecture).
- `docs/DEPLOYMENT.md` — standalone build + production environment contract.
- `docs/Tailwind-V4-Validation-Report.md` — the v3→v4 migration facts behind the CSS-first rules above.
- `docs/remediation-plan-session2.md` … `-session8.md` — the per-session gap inventories and how each was verified against the live reference: session 2 (25 findings), session 3 (12 + known-issue closure), session 4 (16 incl. the nav-wrapper fix + designed 404), session 5 (8 incl. the icon-button padding + shadow-scale trap + system font stack), session 6 (9 incl. the radius-scale trap, focus-state matrix, select dropdown contracts, and the double-emoji bug), session 7 (10 findings incl. the accent-token pair, the reference's rounded-sm drift, fetch-failure resilience, empty-state markup, favicon + per-route titles), session 8 (7 findings incl. the post-gate lint break, the auth-error alert contract, the 80% overlay, the min-w-0 mobile-overflow superset, the social/PWA head set).
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` + `docs/ssh_git_wrapper_v3.py` — how pushes to `git@github.com:nordeim/service-desk.git` work without a resident `~/.ssh` identity.
- `docs/screenshots/` — the 7-shot dev-server capture set (desktop × 5, mobile × 2).
- `skills/` — the in-repo skill catalog (`skills/skills-catalog.md`) used to build this clone.
