---
name: service-desk
description: >
  Comprehensive engineering skill for the ServiceDesk IT support portal — a
  Next.js 16 / React 19 / Tailwind v4 / Prisma-SQLite clone of the base44
  ServiceDesk reference app, with visual parity as a contract and superset
  functionality. Distilled after the session-2 remediation (2026-10-09).
  Use this when extending, debugging, onboarding onto, or replicating the
  ServiceDesk codebase or its design system.
version: 2.0.0
last_updated: 2026-10-09
project_state: 50 unit tests + 46 E2E green; all parity contracts E2E-pinned
---

# ServiceDesk — Complete Engineering Skill

> **Purpose:** A single-source-of-truth reference for any coding agent working on this codebase: every design decision, anti-pattern, debugging procedure, parity contract, and lesson learned from sessions 1–2. Every claim here is either **Verified** (executed this session), **Reasoned** (code inspection), or marked as convention.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Data Management & API Layer](#7-data-management--api-layer)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
- [Appendix A: The Meticulous Approach](#appendix-a-the-meticulous-approach)
- [Appendix B: Quick Reference Card](#appendix-b-quick-reference-card)

---

## 1. Project Identity & Design Philosophy

ServiceDesk is an IT support ticketing portal: employees sign in, submit tickets across six issue categories (hardware / software / network / access / email / other), converse in comment threads, attach files, and track their tickets to resolution. It is a **visual-parity, feature-superset clone** of the base44 ServiceDesk reference app (`https://service-desk-332a5ae4.base44.app/`), rebuilt as a single deployable Next.js process with SQLite — zero external services, zero third-party auth.

Three principles govern every change:

1. **Visual parity is a contract.** The reference app's design was *measured* (computed styles + DOM class structures extracted via agent-browser), never guessed. Where the reference renders a cyan→blue gradient, the clone renders the same gradient at the same geometry. Where the reference uses proportional digits, the clone does not add `tabular-nums`. Parity claims are only ever made from computed styles, not from screenshot eyeballing — downscaled screenshot comparisons (VLM or human) produce both false positives and false negatives (verified twice in session 2: the VLM claimed the reference's active nav was "light gray" when its computed style is `linear-gradient(to right, rgb(6,182,212), rgb(37,99,235))` with white text).
2. **Superset, not divergence.** Additions (working signup, forgot-password, attachments, owner-side status control, search/sort/scope, rate limiting, security headers) must not alter reference-visible structure. The reference's own quirks are preserved deliberately: the mobile `<header>` sits inside `<main>` (no implicit `banner` role), sheet-close sends focus to `<body>`, and the mobile menu stays open after tapping a nav link — except our one intentional UX improvement (auto-close on navigate), which is E2E-pinned as a superset behavior.
3. **Zero third-party auth dependency.** HMAC-SHA256 cookie sessions + scrypt password hashing live in `src/lib/auth.ts` (~170 auditable lines, 11 unit tests) — no auth library, no supply-chain surface. Do not swap in an auth library casually.

**Rendering strategy:** Server Components by default; `"use client"` only for interactive leaves. Authenticated pages are client islands (they fetch per-route) that hydrate onto a server-rendered shell; the `(app)` route-group layout guards the session server-side and redirects to `/login` before any page markup streams.

---

## 2. Tech Stack & Environment

| Layer | Technology | Exact installed version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router, `output: "standalone"`) | 16.4.0 | `cookies()`/`params`/`searchParams` are async — always `await` |
| UI runtime | React | 19.3.0 | No `forwardRef` needed (ref props) |
| Language | TypeScript (strict) | 5.9.3 | `noImplicitAny: false` by config, but new code uses `unknown` + guards |
| Styling | Tailwind CSS (CSS-first, no config file) | 4.3.3 | Tokens in `src/app/globals.css` via `@theme inline` |
| Components | shadcn/ui on Radix primitives | — | `src/components/ui/*` vendored and customized |
| ORM | Prisma + SQLite | 6.19.3 | `db/custom.db` at repo root (gitignored) |
| Auth | Custom HMAC cookie + scrypt | — | `src/lib/auth.ts`; zero third-party |
| Unit tests | Vitest | 5.0.3 | 50 tests; `*.test.ts` only |
| E2E tests | Playwright (Chromium) | 1.64.0 | 46 tests; production standalone server on :3100 |
| Icons | lucide-react | 0.525.0 | `w-4/w-5/w-6 h-*` sizing conventions per context |

**Environment variables** (`.env.example` is the contract; `.env` is gitignored):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | `file:../db/custom.db` — **relative to `prisma/schema.prisma`** (Prisma CLI rule); `src/lib/db-path.ts` replicates the rule at runtime. Production recommends an absolute path. |
| `AUTH_SECRET` | prod | HMAC signing key for session cookies (`openssl rand -hex 32`); falls back to an insecure dev constant with a loud warning. |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical origin for metadata (default `http://localhost:3000`). |

> **Gotcha (verified the hard way):** npm scripts pin `DATABASE_URL='file:../db/custom.db'` inline. Sandboxes export an absolute `DATABASE_URL` that overrides `.env` files; the inline pin keeps every script (dev/build/db:push/db:seed/start) pointed at `<repo>/db/custom.db`. Keep the pin when editing scripts.

Runtime: **Bun** is the documented runtime (Node ≥ 20 works for everything except `db:seed`, which uses Bun's TS execution — fall back to `npx tsx prisma/seed.ts`).

---

## 3. Bootstrapping & Configuration

```bash
git clone https://github.com/nordeim/service-desk.git
cd service-desk
bun install
cp .env.example .env
# generate AUTH_SECRET: python3 -c "import secrets; print(secrets.token_hex(32))"
bun run db:push && bun run db:seed   # db/custom.db + demo corpus (4 users, 11 tickets)
bun run dev                           # http://localhost:3000 — demo@servicedesk.app / Demo1234!
```

**Configuration files and what is load-bearing in each:**

- `next.config.ts` — `output: "standalone"` + `outputFileTracingRoot` pinned to the repo (standalone server always lands at `.next/standalone/server.js`, even when cloned inside a parent workspace that has its own lockfile); `devIndicators: false` (the dev overlay renders a fixed dark circle at bottom-left inside a shadow root that pollutes screenshots — production never renders it); security headers on `/(.*)` (nosniff, DENY, strict-origin-when-cross-origin, camera/mic/geo locked).
- `tsconfig.json` — `strict: true`; **`exclude: ["skills"]`** — the in-repo `skills/` folder is documentation, never type-checked, linted, tested, or compiled.
- `eslint.config.mjs` — flat config; `ignores` includes `skills`, `research/**`, `tool-results/**`. `react-hooks/set-state-in-effect` is an ERROR (see §9).
- `vitest.config.ts` — `include: ["src/**/*.test.ts", "tests/**/*.test.ts"]` only; explicit `describe/it/expect` imports (no globals).
- `playwright.config.ts` — `testDir: "./tests/e2e"`; one worker (specs share a single seeded SQLite file); the "setup" project signs in ONCE and saves `storageState` (auth endpoints are rate-limited: 10 attempts/IP/15 min — per-test logins would trip the limiter); `db/e2e.db` is schema-pushed and seeded by `global-setup.ts`.
- `postcss.config.mjs` — `@tailwindcss/postcss` only.

**Git contract:** main branch only; pushes go to `git@github.com:nordeim/service-desk.git` via `docs/ssh_git_wrapper_v3.py` (see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) — no resident `~/.ssh` identity required; the wrapper materializes the key to a 0600 temp file and shreds it after; the remote ref is re-verified against local HEAD after every push.

---

## 4. The Design System (Code-First)

All tokens live in `src/app/globals.css` (Tailwind v4 CSS-first — there is NO `tailwind.config.js` and adding one is an anti-pattern).

### 4.1 Token architecture

```css
:root {
  --background: #f8fafc;  --foreground: #0f172a;
  --card: #ffffff;        --card-foreground: #0f172a;
  --sidebar: #fafafa;     /* measured — NOT white */
  --primary: #0891b2;     --ring: #06b6d4;
  --navy-950: #0a1628;    --navy-900: #0f2744;  --navy-800: #1a3a5c;
  --amber-500: #f59e0b;   --emerald-500: #10b981;
  /* …full palette in the file */
}
@theme inline {
  --color-background: var(--background);
  --color-sidebar: var(--sidebar);
  /* …semantic tokens map onto the :root vars */
}
```

Two **mandatory** v4 rules (both verified the hard way):

1. The `inline` keyword in `@theme inline { --color-x: var(--x) }` is REQUIRED — a bare `@theme` with `var()` chains is silently dropped by the build, killing every semantic utility.
2. Keep `:root` palette **literal hex** — no `var()` chains, no oklch indirection.

### 4.2 The signature motif

`bg-gradient-to-r from-cyan-500 to-blue-600` — active nav item, primary action buttons. Per-context gradients elsewhere: icon tiles (violet→purple, amber→orange, blue→cyan, emerald→green), card headers (`from-cyan-50/50 to-blue-50/50`), quick-stats rows (`from-amber-50 to-orange-50` / `from-blue-50 to-cyan-50` / `from-slate-50 to-gray-50`), login logo glow (`from-slate-200 to-slate-300`).

### 4.3 Measured parity contracts (the ones agents get wrong)

| Contract | Measured value | Where pinned |
|---|---|---|
| Sidebar panel background | `#fafafa` (`rgb(250,250,250)`), width 255px | computed-style probe |
| Active nav item | `linear-gradient(to right, rgb(6,182,212), rgb(37,99,235))` + `color: rgb(255,255,255)` | mobile-navigation.spec.ts |
| Page h1 scale | `text-4xl` (36px) + subtitle `text-lg text-slate-600 mt-2` | visual-parity.spec.ts |
| Quick stats geometry | 48px row height, 16px group offset (mt-4), 14px labels | computed probe, both sites identical |
| Stat card shadows | `shadow-lg` → `hover:shadow-xl` (never `shadow-xl`/`2xl`) | visual-parity.spec.ts |
| Counters | proportional digits — NO `tabular-nums` | visual-parity.spec.ts |
| Mobile header | NOT sticky (`position: static`), plain `text-xl` h1 "ServiceDesk", no logo tile | visual-parity.spec.ts |
| Login card | `max-w-md`, `bg-white/95 backdrop-blur-sm shadow-2xl`, slate top bar, `ring-4` in-card logo, `bg-slate-900` sign-in button | visual-parity.spec.ts |

### 4.4 Typography and motion

Inter (next/font), `tracking-tight` on headings. Dates: `formatDateTime` → "Oct 9, 2026 at 12:47 AM" (separate Intl parts joined with " at" — reference format). Durations: `formatDuration` → "3d 4h" / "N/A". Motion: 300–500ms `transition-all` on cards/links; sheet slide-in 500ms; hover lift + arrow slide on mytickets ticket cards only (dashboard recent rows are flat — no arrow).

---

## 5. Component Architecture & Patterns

### 5.1 The shell (`src/components/app-sidebar-chrome.tsx`)

```
SidebarProvider                                  ← shadcn context (cookie-driven mobile state)
└─ div.min-h-screen.flex.w-full.bg-gradient-to-br.from-slate-50.via-white.to-slate-100   ← app-wide gradient (reference)
   ├─ AppSidebar                                 ← desktop panel + mobile Sheet
   └─ SidebarInset (main)
      ├─ header (md:hidden, NOT sticky, plain h1) ← mobile-only top bar
      └─ div.flex-1.overflow-auto                ← THE scroll container (content scrolls here, not the body)
         └─ {children}                           ← pages render min-h-screen roots WITHOUT flex-1
```

The scroll-container architecture is reference-measured: the mobile header never scrolls away *because it sits above the scroll container*, not because it is sticky. Pages render `<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">` roots; adding `flex-1` back to pages is a regression.

### 5.2 Two ticket-row renderers — never interchangeable (`src/components/ticket-bits.tsx`)

| Renderer | Used on | Anatomy |
|---|---|---|
| `TicketCard` | /mytickets | bordered card (`rounded-xl … shadow-lg hover:shadow-xl bg-white`), `w-14 h-14` emoji tile, arrow icon (`group-hover:translate-x-1`), `font-bold text-lg` title, `line-clamp-2 mb-4` description |
| `RecentTicketRow` | /dashboard | flat `divide-y` row (`a.block.p-6 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/50`), `w-12 h-12` tile, `font-semibold truncate` title, `text-sm line-clamp-1 mb-3` description, NO arrow, NO border/shadow |

Both are measured from the reference. Reusing `TicketCard` on the dashboard (or vice versa) is a parity regression — pinned by visual-parity.spec.ts.

### 5.3 Badge system (`ticket-bits.tsx`)

- `StatusBadge` — row treatment (text-xs base, `font-medium`); `detail` prop renders the detail-page treatment (`text-sm! font-bold` — the `!` is load-bearing, the Badge base forces `text-xs` and plain utilities lose to component-base ordering).
- `PriorityBadge` — `showWord` prop appends " priority" (the reference detail page puts the word inside the badge: "medium priority"); rows keep it bare.
- `CategoryBadge` — plain outline treatment.

### 5.4 Page inventory

| Page | Container | Distinctive structure |
|---|---|---|
| /dashboard | `max-w-7xl space-y-8` | 4 stat cards (`bg-card shadow-lg` + decorative gradient blob), Performance card (`slate-50→white` gradient), Recent Tickets (flat rows, header `p-6 border-b`), centered View-All CTA |
| /mytickets | `max-w-7xl` | `mb-8` header; `mb-6 grid md:grid-cols-3` filter row (search `pl-10` + 2 selects); superset sort/scope row below; `grid gap-4` of TicketCards |
| /submitticket | `max-w-3xl` | `mb-8` header w/ back button; `shadow-2xl` form card, gradient header "Ticket Details", `p-8` body |
| /ticketdetails | `max-w-5xl` | `mb-6` back button; `grid lg:grid-cols-3`: left `lg:col-span-2` (ticket card w/ gradient header + comments card), right `space-y-6` (Ticket Information + superset Update Status) |
| /login, /signup, /forgotpassword | `max-w-md` centered | reference login card: slate top bar, `ring-4` logo (`public/logo.png`), Google button, OR divider, `bg-slate-50/50` inputs, `bg-slate-900` submit |

### 5.5 Client/server split

- `(app)/layout.tsx` — server component: `getCurrentUser()` → `redirect("/login")` → wraps children in `ToastProvider` (client) + `AppSidebarChrome` (client).
- Pages under `(app)/` are `"use client"` islands; data fetching in effects with `AbortController` cancellation.
- Mutations are ALWAYS route handlers (`src/app/api/**`) returning JSON with field-level `errors` records; the UI maps them onto form fields. Never throw across the boundary; never add a second error envelope shape.

---

## 6. Custom Hooks Deep Dive

Only one custom hook ships in the app layer:

**`use-mobile.ts`** (`src/hooks/use-mobile.ts`) — media-query state via `useSyncExternalStore`:

```ts
// The set-state-in-effect lint rule is an ERROR under this ESLint config.
// Media queries are external stores: subscribe + snapshot, never effect-setState.
const isMobile = useIsMobile(); // < 768px
```

The pattern is mandatory for any future media/external state (see AGENTS.md §quirks). The toast system exposes `useToast()` (context) from `src/components/toast.tsx` — Radix-based with a `role="status"` announcer that concatenates title+description (the reason toast-title locators need `{ exact: true }` in tests).

---

## 7. Data Management & API Layer

### 7.1 Schema (`prisma/schema.prisma`, 73 lines)

`User` / `Ticket` / `Comment` / `Attachment`. SQLite has no enums — `Ticket.category/priority/status` allowed values live ONLY in `src/lib/constants.ts` (type guards + label maps); API routes and tests import from there; never inline the vocabulary.

### 7.2 The db-path contract (`src/lib/db-path.ts`, 107 lines — 15-test-pinned)

`DATABASE_URL="file:../db/custom.db"` resolves against `prisma/schema.prisma` (CLI rule); `db-path.ts` replicates the rule at runtime by anchoring on the repo that owns `prisma/schema.prisma` (works in dev, `next build`, and the standalone server regardless of process cwd). Absolute URLs pass through untouched. Never "simplify" it.

### 7.3 API surface

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/auth/login` `signup` `logout` `me` `forgot-password` | POST/GET | — | rate-limited 10/IP/15min; signup → session; forgot-password is enumeration-safe (generic response) |
| `/api/tickets` | GET | ✓ | filters: `search`, `status`, `priority`, `sort` (newest/oldest/priority), `scope` (mine/all) |
| `/api/tickets` | POST | ✓ | create + optional base64 attachments (2MiB × 3) |
| `/api/tickets/[id]` | GET/PATCH | ✓ | PATCH is owner-only status transition |
| `/api/tickets/[id]/comments` | POST | ✓ | touches ticket `updatedAt` in one transaction |
| `/api/tickets/[id]/attachments/[attachmentId]` | GET | ✓ | streamed download, sanitized Content-Disposition |
| `/api/stats` | GET | ✓ | mine + global counts + average resolution time |
| `/api/health` | GET | — | liveness + DB readiness |

### 7.4 Seed (`prisma/seed.ts`) — idempotent demo corpus: 4 users, 11 tickets, 3 comments. `bun run db:reset` drops + recreates + reseeds.

---

## 8. Accessibility Implementation

- Focus rings: `focus-visible:ring-2`/`ring-[3px]` conventions in the vendored shadcn components; visible focus never removed.
- The mobile Sheet carries a `sr-only` title/description ("Sidebar" / "Displays the mobile sidebar.") — shadcn convention; screen readers announce the dialog properly.
- Form errors render as `<p role="alert">` (the `p[role="alert"]` selector in tests — Next's route announcer also has `role="alert"`, so scope to the paragraph).
- Decorative icons are `aria-hidden`; the toast system announces via `role="status"`.
- Attachments upload via a visually-hidden `<input type="file" class="sr-only">` triggered by a labeled button; drag-drop is a progressive enhancement, not the only path.
- Sheet close returns focus to `<body>` (context-controlled sheet has no trigger ref) — matches the reference deliberately.

---

## 9. Anti-Patterns & Common Bugs

Each entry below was hit and verified in this codebase (sessions 1–2):

1. **Tailwind v4 variant cascade:** `data-[active=true]:text-sidebar-accent-foreground` (variant) outranks a plain `text-white` regardless of class order — the active nav uses `text-white!` (important modifier). If you override a variant-styled primitive, use `!` and say why in a comment.
2. **`@theme` without `inline`:** silently dropped by the build — every semantic utility dies. `@theme inline` is mandatory.
3. **`react-hooks/set-state-in-effect` is an ERROR:** effect-body setState is rejected by lint; use `useSyncExternalStore` for external state (media queries).
4. **Ambient `DATABASE_URL`:** sandboxes export absolute paths that override `.env`; the npm scripts pin the URL inline. Trusting the ambient var over the pin breaks the db location.
5. **`locator.count()` races:** it snapshots once; async fetches render after. Use `expect(locator).toHaveCount(n)` (retries). Verified: counted 11 unfiltered rows before a search applied.
6. **Toast-title locators:** Radix's announcer concatenates title+description → substring `getByText` matches 2 elements → strict-mode violation. Use `{ exact: true }`.
7. **`getByRole("alert")` ambiguity:** Next injects `#__next-route-announcer__` with `role="alert"`. Scope to `p[role="alert"]`.
8. **Parity probes must scope to `main`:** the sidebar (quick stats, footer email) is outside main; bare locators resolve to sidebar elements first.
9. **`tabular-nums` on counters:** the reference uses proportional digits — adding tabular-nums is a parity regression (typography is part of the contract).
10. **Interchanging the two ticket-row renderers:** TicketCard on the dashboard (or RecentTicketRow on mytickets) breaks measured structure.
11. **Next dev overlay false positive:** a fixed dark circle at bottom-left (inside `nextjs-portal` shadow root) overlaps the sidebar footer in dev screenshots — do not "fix" dark pixels before checking for it; production never renders it (`devIndicators: false` anyway).
12. **HTML nesting:** `p > div` (Skeleton inside a paragraph) is invalid and React warns — keep skeletons as siblings.
13. **Prisma + ambient env:** `bunx prisma db push` may pick up an ambient `DATABASE_URL` — always go through the npm scripts (which pin it).
14. **Badge base ordering:** the Badge component forces `text-xs`; overriding font size needs `text-sm!` (plain `text-sm` loses the ordering) — hit on the detail status badge.
15. **Async cookies/params:** `cookies()`, `params`, `searchParams` must be awaited (Next 16) — a non-awaited call returns a Promise, not the value.
16. **Rate-limiter budget in E2E:** per-test logins trip 429s; the setup project's shared `storageState` exists for this reason.

---

## 10. Debugging Guide

| Symptom | First checks |
|---|---|
| A page renders unstyled / all semantic utilities dead | `globals.css` — is `@theme inline` intact? A bare `@theme` with `var()` chains is dropped silently |
| Active nav text is dark instead of white | The `text-white!` modifier was lost (variant cascade — §9.1) |
| DB "missing" / wrong file | `curl /api/health` → `db: up`? Check for an ambient `DATABASE_URL`; scripts pin it inline |
| E2E fails with strict-mode violation (2 elements) | A substring `getByText` matched an announcer/duplicate — add `{ exact: true }` or scope |
| E2E count assertion flakes | `locator.count()` raced an async fetch — switch to `toHaveCount` |
| Dark circle over the sidebar footer (screenshots) | Next dev overlay (shadow DOM) — dev-only artifact; `devIndicators: false` already set |
| Gradient renders "dark" in a screenshot but computed style is correct | Screenshot-capture artifact — re-probe computed styles before trusting pixels (session 1's "dark avatar" was the dev overlay; session 2's "missing gradient header" was composite downscaling) |
| 429s during E2E runs | Real logins exceeded the rate budget — use the shared `storageState` |
| Sheet doesn't close on outside tap in a synthetic event test | Radix listens for pointer events; synthetic `MouseEvent('mousedown')` won't dismiss — use real pointer coordinates (`agent-browser mouse move/down/up`) |

Debug toolkit: `dev.log` (dev server), `server.log` (standalone), Playwright traces in `test-results/`, `scripts/probe-gradients.mjs` + `gradient-test*.mjs` (Tailwind v4 gradient rendering questions), `curl localhost:3000/api/health`.

---

## 11. Pre-Ship Checklist

Bash gates (in order — every commit):

```bash
bun run lint          # ESLint 9 flat — zero warnings tolerated
bun run typecheck     # tsc --noEmit
bun run test          # Vitest — 50 unit tests
bun run build         # production standalone build
bun run test:e2e      # 46 E2E (needs the prior build)
bash scripts/smoke-test.sh   # 10-step API contract on :3999
```

Manual/visual checks:

- [ ] Mobile navigation: opens via trigger, overlay tap closes, Escape closes (focus → body), nav tap navigates AND auto-closes (superset behavior)
- [ ] Active nav item renders the cyan→blue gradient with white text (computed style, not screenshot)
- [ ] Quick stats rows show gradient backgrounds with `shadow-md` badges
- [ ] Dashboard recent tickets are FLAT rows (no card borders), mytickets rows ARE cards (border + arrow)
- [ ] No `tabular-nums` on any counter
- [ ] Login card: slate top bar + ring-4 logo + bg-slate-900 sign-in button
- [ ] `curl localhost:3000/api/health` → `{"status":"ok","db":"up"}`
- [ ] No console errors on any page (agent-browser `errors`)
- [ ] `git ls-files | grep -E '^\.env$|\.key$'` → empty (no secrets staged)

---

## 12. Lessons Learnt & How to Avoid Them

1. **Computed styles are ground truth; screenshots are leads.** (Session 1 + 2, multiple times.) Every VLM/visual claim must be re-verified via `getComputedStyle` on the live DOM before acting on it. Two VLM claims were flat-out wrong (active-nav color, quick-stats style); one was a capture artifact (gradient header).
2. **Measure the reference FRESH each session.** The reference is a live app — its data resets, its DOM evolves. Session-1 measurements were re-verified in session 2 and 25 new gaps were found (the codebase had drifted from the reference on quick stats, recent rows, detail layout, login shell, heading scale, mobile header).
3. **Non-retrying assertions lie under load.** `locator.count()` snapshot races; `toHaveCount` retries. (Verified: expected 1, received 11 — twice.)
4. **Announcer regions duplicate visible text.** Radix toasts (and any aria-live region) concatenate title+description — substring locators break. `{ exact: true }` or scope to the visible element.
5. **The scroll architecture explains "missing" stickiness.** The reference's mobile header is not sticky because content scrolls in a container BELOW the header. Copying the visual (no sticky) without the architecture (overflow container) would break on long pages.
6. **Two renderers for "a ticket row".** The same entity has different measured presentations per context. Parity work must be per-context, not per-entity.
7. **Component-base ordering beats class-string order.** The Badge base forces `text-xs`; overriding needs `!`. Class-list order in the source is irrelevant — the generated stylesheet order decides.
8. **Inline env pins beat ambient env.** The sandbox exports `DATABASE_URL`; the npm scripts pin it inline. Determinism > DRY here.
9. **Data-level differences are not parity gaps.** Ticket titles, counts, dates, and user names differ between the reference and any clone by construction. Filter them out of every comparison.
10. **The superset rule needs a home.** Superset additions (sort/scope row, Update Status card, attachments section) are placed to not alter reference-visible structure — extra elements go below/beside reference structure, never inside its measured containers.

---

## 13. Pitfalls to Avoid

- Adding `tailwind.config.js` (v4 is CSS-first — tokens live in `globals.css`).
- Plain `text-*`/`bg-*` overrides fighting shadcn variant utilities without `!`.
- Trusting an ambient `DATABASE_URL` over the repo `.env` (scripts pin it for a reason).
- "Fixing" the dark circle over the sidebar footer in dev screenshots (Next dev overlay, shadow DOM, dev-only).
- Real logins per E2E test (rate limiter) — use the shared `storageState`.
- `getByRole("alert")` in Playwright (route announcer ambiguity).
- Bare `page.locator(...)` for parity probes (sidebar lives outside main).
- Interchanging TicketCard and RecentTicketRow.
- Adding `tabular-nums`, `sticky` headers, or logo tiles where the reference has none — each was measured absent and is E2E-pinned.
- Running `db:push` outside the npm scripts (ambient env redirection).
- Deleting `text-white!`'s comment — the rationale is load-bearing for future agents.

---

## 14. Best Practices

- **Parity workflow (the clone-app-pat-pro discipline):** navigate the reference → `getComputedStyle` + `outerHTML` extraction → diff class structures programmatically → implement → E2E-pin → re-verify computed styles on both sites. Tools that worked: agent-browser (`eval`, `get styles`), a class-tuple SequenceMatcher diff (python), full-page composites only as VLM leads.
- **TDD for every fix:** red test first (unit for domain seams, E2E for UI contract) → implement → full gate. The session-2 remediation followed exactly this: 18 red parity tests → implementation → 46 green.
- **Comments explain why** (see the `text-white!` rationale), never narrate the obvious.
- **One logical change per commit**; Conventional Commits; message explains why-not-just-what.
- **State confidence labels** for non-trivial claims: Verified (executed) / Reasoned (code inspection) / Assumed.
- **Keep the scratch probes out of the product tree:** parity probes live in `scripts/` or `/tmp`, never in `src/`; lint ignores `skills/`, `research/`, `tool-results/` — keep it that way.

---

## 15. Coding Patterns

### 15.1 Client data fetching with cancellation (every `(app)` page)

```tsx
React.useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/tickets?${params}`, { signal: controller.signal })
    .then((r) => (r.ok ? r.json() : { tickets: [] }))
    .then((d) => setTickets(d.tickets ?? []))
    .catch((err) => { if (err.name !== "AbortError") setTickets([]); });
  return () => controller.abort();
}, [search, status, priority, sort, scope]);
```

### 15.2 Field-level API errors mapped onto forms

```tsx
// Route handler returns { error, errors?: Record<string,string> }
if (!res.ok) { setErrors(data.errors ?? {}); return; }
// UI renders <p className="text-xs text-red-600" role="alert">{errors.title}</p>
```

### 15.3 External-store media query (the ONLY sanctioned pattern)

```tsx
// src/hooks/use-mobile.ts — useSyncExternalStore over matchMedia
const isMobile = useIsMobile();
```

### 15.4 Parity-pinned conditional classes (the active nav)

```tsx
className={`... ${isActive
  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white! shadow-lg shadow-cyan-500/30"
  : "text-slate-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700"}`}
// text-white! — important modifier is load-bearing (variant cascade). See §9.1.
```

### 15.5 Two-renderer ticket rows

```tsx
// mytickets: <TicketCard ticket={t} formattedDate={...} />
// dashboard: <RecentTicketRow ticket={t} formattedDate={...} />
// Same TicketCardData shape; different measured presentations.
```

### 15.6 Enumerated-string vocabulary (single source of truth)

```ts
// src/lib/constants.ts — the ONLY place the ticket vocabulary lives
export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
// type guards + label maps; API routes and tests import from here
```

---

## 16. Coding Anti-Patterns

- **Effect-body setState** (lint ERROR) — external stores use `useSyncExternalStore`.
- **Inline enum vocabularies** — `"open"` literals in components; import from constants.
- **Raw SQL with user input** — all queries go through Prisma.
- **Throwing across the API boundary** — route handlers return typed JSON errors.
- **Second error envelope shapes** — one `{ error, errors? }` contract.
- **`forwardRef`** — React 19 ref props.
- **`<img>` in lists without `alt`** — decorative images get `aria-hidden`; content images need alt text (the login logo carries `alt="ServiceDesk logo"`).
- **Duplicated page shells** — copy-pasting the login card across auth pages; they share the same structure by convention (login/signup/forgotpassword all follow the reference login design language).

---

## 17. Responsive Breakpoint Reference

Tailwind v4 default scale (no custom breakpoints):

| Breakpoint | Width | Used for |
|---|---|---|
| `sm` | ≥ 640px | login card paddings (`p-8 sm:p-10`), logo size (`h-20 w-20 sm:h-24 sm:w-24`), input heights (`h-11 sm:h-12`), footer link row (`flex-col sm:flex-row`) |
| `md` | ≥ 768px | **the sidebar/mobile split** (`md:hidden` header; `hidden md:flex` desktop panel); page padding (`p-6 md:p-8`); filter row (`grid-cols-1 md:grid-cols-3`); submit category/priority row (`sm:grid-cols-2`) |
| `lg` | ≥ 1024px | stat cards (`md:grid-cols-2 lg:grid-cols-4`); **detail layout** (`grid lg:grid-cols-3` + `lg:col-span-2`) |
| `xl` | ≥ 1280px | (available; not currently load-bearing) |

Mobile behavior contract (E2E-pinned): below 768px the sidebar becomes an off-canvas Sheet (`slide-in-from-left`, 500ms), the mobile header (inside main, NOT sticky) shows the trigger + plain h1, and the scroll happens in the layout's `flex-1 overflow-auto` container.

---

## 18. Z-Index Layer Map

| Layer | Z | Source |
|---|---|---|
| Sidebar panel (desktop, fixed) | 10 | `sidebar.tsx` (`z-10`) |
| Mobile header / page chrome | z-40 default | header is static (no z fight) |
| Sheet overlay + content | 50 | shadcn Sheet (`z-50`) |
| Radix portals (select, toast viewport) | 50+ | `z-[50]`, viewport `top-0 z-[100]` (mobile) |
| Next dev overlay | shadow DOM | bottom-left dark circle — dev only, invisible to z-index probing |

Rules: never introduce a z above 50 for page chrome; portals own 50+; the dev overlay lives in a shadow root and cannot collide.

---

## 19. Color Reference (Complete)

`src/app/globals.css` — light palette (verified against the file):

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#f8fafc` | page base (slate-50) |
| `--foreground` | `#0f172a` | body text |
| `--card` | `#ffffff` | cards (stat cards use `bg-card`) |
| `--card-foreground` | `#0f172a` | card text |
| `--sidebar` | `#fafafa` | sidebar panel — **measured, not white** |
| `--sidebar-foreground` | `#0f172a` | sidebar text |
| `--primary` | `#0891b2` | cyan accent (buttons, links) |
| `--primary-foreground` | `#ffffff` | text on primary |
| `--secondary` | `#f1f5f9` | secondary bg |
| `--muted` | `#f1f5f9` / `--muted-foreground: #64748b` | quiet text |
| `--accent` | `#f1f5f9` | hover surfaces |
| `--destructive` | `#ef4444` / fg `#fff` | destructive actions |
| `--border` | `#e2e8f0` | hairlines |
| `--ring` | `#06b6d4` | focus rings |
| `--navy-950` | `#0a1628` | darkest surface |
| `--navy-900` | `#0f2744` | dark surface |
| `--navy-800` | `#1a3a5c` | dark surface |
| `--amber-500` | `#f59e0b` | Open stat badge, warning accents |
| `--emerald-500` | `#10b981` | resolved accent |

Frequently used raw utilities (not tokens — Tailwind palette): `slate-50/100/200/300/400/500/600/700/800/900`, `cyan-50/100/400/500/600`, `blue-50/100/200/300/400/500/600/700`, `amber-50/100/200/300/500/800`, `orange-50/600`, `violet-500`, `purple-600`, `emerald-100/300/500/800`, `red-100/200/500/700`, `slate-600` (Total badge).

Signature gradients: `from-cyan-500 to-blue-600` (active nav, primary buttons) · `from-cyan-400 to-blue-500` (avatars) · `from-cyan-100 to-blue-100` (emoji tiles) · `from-violet-500 to-purple-600` / `from-amber-500 to-orange-600` / `from-blue-500 to-cyan-600` / `from-emerald-500 to-green-600` (stat icon tiles) · `from-slate-50 to-white` (performance card) · `from-amber-50 to-orange-50` / `from-blue-50 to-cyan-50` / `from-slate-50 to-gray-50` (quick stats) · `from-cyan-50/50 to-blue-50/50` (card headers) · `from-slate-200 to-slate-300` (login logo glow) · `from-slate-50 via-white to-slate-100` (app-wide shell gradient) · `from-slate-50 via-white to-blue-50/30` (page content gradient) · `from-slate-200 via-slate-300 to-slate-200` (login top bar).

---

## 20. The Complete TypeScript Interface Reference

Core domain shapes (verified against source):

```ts
// src/lib/constants.ts
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type TicketCategory = "hardware" | "software" | "network" | "access" | "email" | "other";
const STATUS_LABELS: Record<TicketStatus, string>;
const PRIORITY_LABELS: Record<TicketPriority, string>;
const CATEGORY_LABELS: Record<TicketCategory, string>;
const CATEGORY_EMOJI: Record<TicketCategory, string>;
const ATTACHMENT_MAX_BYTES: number;   // 2 MiB
const ATTACHMENT_MAX_COUNT: number;   // 3

// src/components/ticket-bits.tsx
interface TicketCardData {
  id: string; title: string; description: string;
  category: string; priority: string; status: string;
  createdAt: string;
  _count?: { comments: number };
}

// src/components/app-sidebar.tsx
interface SidebarUser { id: string; email: string; name: string }
interface SidebarStats { open: number; in_progress: number; total: number }

// ticket detail page (client-side shape)
interface TicketDetail {
  id: string; title: string; description: string;
  category: string; priority: string; status: string;
  createdAt: string; updatedAt: string;
  createdBy: { id: string; name: string; email: string };
  comments: { id: string; content: string; createdAt: string;
              author: { id: string; name: string; email: string } }[];
  attachments: { id: string; fileName: string; mimeType: string;
                 sizeBytes: number; createdAt: string }[];
}

// API contracts (route handlers)
// POST /api/auth/login  → { user } | { error, errors? }
// GET  /api/stats        → { mine: {total,open,in_progress,resolved,closed},
//                             global: {open,in_progress,resolved,closed,total},
//                             avgResolutionMs: number | null }
// validation results: { ok: boolean; errors?: Record<string, string> }  (src/lib/validation.ts)
```

Prisma schema (73 lines): `User { id, email @unique, name, passwordHash, createdAt }` · `Ticket { id, title, description, category, priority, status, createdAt, updatedAt, createdBy → User, comments[], attachments[] }` · `Comment { id, content, createdAt, author → User, ticket → Ticket }` · `Attachment { id, fileName, mimeType, sizeBytes, data (base64), createdAt, ticket → Ticket }`.

---

## Appendix A: The Meticulous Approach

The six-phase workflow every change follows (from CLAUDE.md):

1. **ANALYZE** — read the relevant page/component/route and its tests in full; identify which contract governs (db-path, validation, auth session, UI parity).
2. **PLAN** — state the smallest correct path; name the files touched and the specs updated alongside.
3. **VALIDATE** — confirm scope for anything touching auth, sessions, or the ticket vocabulary before coding.
4. **IMPLEMENT** — modular, typed, test-backed increments; domain rules in `src/lib/` seams; UI consumes them.
5. **VERIFY** — run the full gate; for visual changes, capture a screenshot AND re-probe computed styles against the reference.
6. **DELIVER** — report what was verified, what was not, and any deferred debt. Never claim "works" without executed evidence.

Session-2 application of this loop: 25 findings → remediation plan (docs/remediation-plan-session2.md) → plan validated against source → 18 red parity tests → implementation (9 groups: tests, chrome, sidebar, dashboard, mytickets, detail, submit, login, housekeeping) → 46/46 E2E green → computed-style re-verification on both sites → docs + this skill.

## Appendix B: Quick Reference Card

```bash
# gates (in order)
bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e
bash scripts/smoke-test.sh

# db
bun run db:push && bun run db:seed      # db/custom.db at repo root
bun run db:reset

# dev / verify
bun run dev                             # :3000 — demo@servicedesk.app / Demo1234!
curl localhost:3000/api/health

# parity probes (session-2 workflow)
agent-browser open <reference-url>       # login as needed
agent-browser eval "getComputedStyle(document.querySelector('<sel>')).<prop>"
# diff class structures with a SequenceMatcher over (tag, class) tuples
```

Key files: `src/lib/auth.ts` (security core) · `src/lib/db-path.ts` (db anchor) · `src/lib/constants.ts` (vocabulary) · `src/components/ui/sidebar.tsx` (parity keystone) · `src/components/app-sidebar-chrome.tsx` (shell + scroll container) · `src/components/ticket-bits.tsx` (two row renderers + badges) · `tests/e2e/mobile-navigation.spec.ts` (highest-regression chrome) · `tests/e2e/visual-parity.spec.ts` (session-2 contracts) · `docs/remediation-plan-session2.md` (gap inventory).

Push: `git@github.com:nordeim/service-desk.git` main-only via `docs/ssh_git_wrapper_v3.py` — key materialized to 0600 temp file, shredded after; remote ref re-verified against local HEAD.
