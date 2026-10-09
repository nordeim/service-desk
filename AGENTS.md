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
| `bun run test` | Vitest unit suite (53 tests — auth, validation, db-path, utils incl. formatDate) |
| `bun run test:e2e` | Playwright E2E (57 tests) — boots the **production standalone server** on :3100 with an isolated `db/e2e.db`; requires a prior `bun run build` |
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

## Environment

`.env.example` documents every variable; `.env` is gitignored. `AUTH_SECRET` = `openssl rand -hex 32` (required in production — the dev fallback logs a loud warning). `DATABASE_URL="file:../db/custom.db"` → `<repo>/db/custom.db`. Production deployments should switch to an absolute `file:` URL (see `docs/DEPLOYMENT.md`).

## Reference

- `Project_Architecture_Document.md` — the full engineering reference (ADRs, layer model, security architecture).
- `docs/DEPLOYMENT.md` — standalone build + production environment contract.
- `docs/Tailwind-V4-Validation-Report.md` — the v3→v4 migration facts behind the CSS-first rules above.
- `docs/remediation-plan-session2.md` / `docs/remediation-plan-session3.md` — the session-2 (25 findings) and session-3 (12 findings + known-issue closure) gap inventories and how each was verified against the live reference.
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` + `docs/ssh_git_wrapper_v3.py` — how pushes to `git@github.com:nordeim/service-desk.git` work without a resident `~/.ssh` identity.
- `docs/screenshots/` — the 7-shot dev-server capture set (desktop × 5, mobile × 2).
- `skills/` — the in-repo skill catalog (`skills/skills-catalog.md`) used to build this clone.
