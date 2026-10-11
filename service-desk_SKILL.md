---
name: service-desk
description: >
  Comprehensive engineering skill for the ServiceDesk IT support portal — a
  Next.js 16 / React 19 / Tailwind v4 / Prisma-SQLite clone of the base44
  ServiceDesk reference app, with visual parity as a contract and superset
  functionality. Distilled through the session-25 remediation (2026-10-11).
  Use this when extending, debugging, onboarding onto, or replicating the
  ServiceDesk codebase or its design system.
version: 2.23.0
last_updated: 2026-10-11
project_state: 81 unit tests + 196 E2E green (clean-environment verified) + the s21 smoke rate-limiter pins + the s22 write-path pins + the s23 create-path pins + the s24 pagination pins + the s25 filter-vocabulary pins (34 steps); CI on GitHub Actions green (the s18 fix held through the s19–s24 pushes); all parity contracts E2E-pinned (sessions 1–20, the s21 429 + s22 ownership/validation + s23 create-path/attachment + s24 pagination + s25 filter-vocabulary contracts smoke-pinned)
---

# ServiceDesk — Complete Engineering Skill

> **Purpose:** A single-source-of-truth reference for any coding agent working on this codebase: every design decision, anti-pattern, debugging procedure, parity contract, and lesson learned from sessions 1–4. Every claim here is either **Verified** (executed this session), **Reasoned** (code inspection), or marked as convention.

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
  --primary: #171717;     --ring: #0a0a0a;  # both near-black (stock shadcn, sessions 6+9; --primary was cyan #0891b2 for 8 sessions — the full token diff proved the reference ships stock)
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

The system font stack — the reference loads NO webfont (session 5); `--font-sans` is pinned to `ui-sans-serif, system-ui, sans-serif, …`, smoothing `auto`. `tracking-tight` on headings. Dates: `formatDateTime` → "Oct 9, 2026 at 12:47 AM" (separate Intl parts joined with " at" — reference format). Durations: `formatDuration` → "3d 4h" / "N/A". Motion: 300–500ms `transition-all` on cards/links; sheet slide-in 500ms; hover lift + arrow slide on mytickets ticket cards only (dashboard recent rows are flat — no arrow).

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
| `RecentTicketRow` | /dashboard | flat `divide-y` row (`a.block.p-6 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/50` + `animate-rise-in`), `w-12 h-12` tile with a **FileText SVG icon** (`w-6 h-6 text-cyan-600`, NOT the category emoji), title inside `flex items-start justify-between gap-4 mb-2` **with the ArrowRight**, status + priority badges only (no category), **date-only** date (`formatDate`), NO border/shadow |

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
| `/api/tickets` | GET | ✓ | filters: `search`, `status`, `priority`, `sort` (newest/oldest/priority), `scope` (mine/all); pagination: `limit` 1-500 (default 200) + `skip` >= 0 — strict 400 on garbage (s24) |
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
17. **`has-[>svg]:px-*` on Button size variants:** shrinks every icon-bearing button to 12px padding (the reference renders 16px) — removed from the vendored base (session 5).
18. **Copying a reference class NAME across Tailwind majors:** `shadow-sm` means different VALUES in v3 vs v4. Convert to the computed value first (`getComputedStyle().boxShadow`).

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
bun run test          # Vitest — 54 unit tests
bun run build         # production standalone build
bun run test:e2e      # 57 E2E (needs the prior build)
bash scripts/smoke-test.sh   # 11-step API contract on :3999
```

CI (`.github/workflows/ci.yml`) runs the verify job (lint → typecheck → unit → build) + an e2e job on every push/PR to main.

Manual/visual checks:

- [ ] Mobile navigation: opens via trigger, overlay tap closes, Escape closes (focus → body), nav tap navigates AND auto-closes (superset behavior)
- [ ] Active nav item renders the cyan→blue gradient with white text (computed style, not screenshot)
- [ ] Quick stats rows show gradient backgrounds with `shadow-md` badges
- [ ] Dashboard recent tickets are FLAT rows (no card borders) with FileText icon tiles + arrows + date-only dates; mytickets rows ARE cards (border + arrow + emoji tile + full datetime)
- [ ] Badge text is lowercase ("open", "medium priority", "hardware")
- [ ] Entrance animations play once on mount (`animate-rise-in`) and vanish under `prefers-reduced-motion`
- [ ] No `tabular-nums` on any counter
- [ ] Zero console errors on every page (no hydration mismatches — never put a block component inside `<p>`)
- [ ] Login card: slate top bar + ring-4 logo + bg-slate-900 sign-in button
- [ ] `curl localhost:3000/api/health` → `{"status":"ok","db":"up"}`
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
11. **A wrapper div can be load-bearing twice.** (Session 4.) The reference wraps nav icon+label in an inner `flex items-center gap-3` div. Without it, the anchor's `justify-between` pushed labels to the right edge (132px vs 12px) AND the button base's `[&>svg]:size-4` direct-child selector shrank the icons — one missing div, two visible bugs, invisible to three sessions of screenshot composites. Structure matters as much as classes; diff the DOM tree, not just utility lists.
12. **VLM comparisons are not sensitive to intra-element layout.** (Session 4.) Three sessions of "IDENTICAL" composites missed a 132px label displacement inside the nav buttons. Geometric assertions (boundingBox deltas) catch what visual diffing cannot — pin them in E2E.
13. **Verify "obvious" regressions before fixing them.** (Session 4.) The CI workflow appeared corrupted (`branches: ain]`); byte-level verification proved the tool-output renderer eats `[m` sequences and the file was correct. The reverse also holds: a passing VLM check is not evidence of parity.
14. **Per-surface badge padding.** (Session 4.) The reference renders the SAME badge component at `px-3 py-1` on mytickets/detail-status but `px-2.5 py-0.5` on dashboard rows and detail-priority. Measure per call site, not per component.
15. **The reference has its own bugs — never copy them.** (Session 4.) Its toast viewport blocks its own mobile menu trigger (`pointer-events: auto` band over the header); its signup/forgot-password are dead-ends; its active-nav misses the root route. Parity means matching the DESIGN, not reproducing the defects.
16. **Class NAMES are not parity — computed values are.** (Session 5.) Tailwind v4 renamed `shadow-sm`→`shadow-xs`; the reference (v3 scale) writes `shadow-sm` for the light `0 1px 2px/0.05` step. Copying the NAME onto a v4 build rendered one step HEAVIER on 11 controls. An intermediate "fix" based on the name (outline→shadow-sm) was caught and reverted by a computed re-measure. Every shadow/font/spacing comparison goes through `getComputedStyle`.
17. **Probe the font family, not just sizes/weights.** (Session 5.) Four sessions pinned typography at every level EXCEPT the family. The reference loads NO webfont (`document.fonts` empty) — our next/font Inter was a session-1 assumption causing ~10% text-width deltas everywhere. One probe settled it; `--font-sans` is now pinned to the reference's exact stack.
18. **Disambiguate by scope before measuring.** (Session 5.) The sidebar nav items share text with page controls ("Submit Ticket" nav vs form submit). An unscoped `querySelectorAll('button,a').find(...)` matched the NAV anchor (circle-plus w-5) and nearly shipped a wrong submit-icon fix. Always scope to `main`/the form — same class as the existing parity-probe scolding rule.
19. **Probe the SCALES, not just instances.** (Session 6.) The radius scale had never been probed in five sessions — the shadcn v4 calc chain (`--radius: 0.625rem` → sm/md/lg/xl = 6/8/10/14px) rendered every rounded control +2px vs the reference's v3 defaults (2/6/8/12px) with IDENTICAL class names. Like the session-5 font: a scale-level probe (one matched element per radius class) settles it. Scales to probe: font-family, radius, shadow, spacing, ring.
20. **Focus states are parity surface.** (Session 6.) "Invisible at rest" base-generation divergences become visible the moment a keyboard user Tabs. The new-gen `focus-visible:ring-[3px] ring-ring/50 + border-ring` tail renders a 3px translucent ring + border change; the reference's old-gen renders solid 1px near-black, no border change. Pin the focused COMPUTED state per control type.
21. **A reference's custom classes can be inert per-surface — verify each.** (Session 6.) The reference's `focus:border-cyan-500 focus:ring-cyan-500` customs: INERT on text inputs (near-black ring + unchanged border wins), border-only active on textareas, fully active on select triggers. Only paired computed measurements per surface reveal the matrix; class diffs cannot.
22. **Exercise the interaction in a pin, not just the rest state.** (Session 6.) The double-emoji category-trigger bug (`🖥️🖥️ Hardware Issue`) survived five sessions because every pin read the at-rest placeholder — none SELECTED an option and read the trigger. Selected states, open states, and focus states all need pins that drive them.
23. **Probe the TOKEN layer, not just the utilities that consume it.** (Session 7.) The accent tokens (`--accent`/`--accent-foreground`) drove three visible surface families (select-option highlights, ghost/outline hover text, the Skeleton) and had never been measured in six sessions — because no probe ever asked "what is the reference's `--accent`?". One `getPropertyValue` on `:root` settles a whole token family. Tokens to probe: accent, ring, border, input, secondary, muted.
24. **Hover probes need a hover-capable context.** (Session 7.) agent-browser's browser reports `hover: none` — every Tailwind v4 `hover:` rule is silently inert under it (the `@media (hover:hover)` guard), so hover probes read at-rest values and look like bugs that don't exist. Run hover assertions under Playwright's Desktop Chrome (hover:hover) or a real device.
25. **The reference DRIFTS — re-measure before trusting old pins.** (Session 7.) Three reference changes observed in one session: the active-nav mechanism (data-active removed, gradient hardcoded — visually identical), per-route document titles added, and `rounded-sm` moved 2px→4px. A class-level pin is a snapshot, not a contract; re-verify against the live site before "fixing" anything that suddenly looks different.
26. **Exercise the FAILURE path, not just the happy path.** (Session 7.) Six sessions of E2E never tested a failing fetch — until a transient 401 during live probing left the dashboard skeletoned forever (non-ok mapped to null; state never settled). Production-ready supersets need error states + retry, and pins that force failures (`page.route` 500s) to keep them honest.
27. **Run the gate AFTER the last file lands — including one-off scripts.** (Session 8.) A post-gate `.cjs` DB-cleanup script (CommonJS `require()`) was committed without re-running lint, turning CI on main red for an otherwise fully-green codebase. The gate's unit is the COMMIT, not the feature.
28. **Probe the `<head>`, not just the body.** (Session 8.) Six sessions of pixel-perfect body work never noticed the reference ships a full OG/Twitter/canonical/PWA meta set. A one-line `querySelectorAll('head meta')` enumeration is the whole probe.
29. **Observing the ABSENCE of a behavior is also parity data.** (Session 8.) The reference never toasts — comment-add, ticket-submit, and login-error all verified idle under live triggers + MutationObservers. That explained why their broken `pointer-events: auto` viewport never fires for their users, and why our toast feedback is a superset, not a gap.
30. **Horizontal-overflow probes need data control.** (Session 8.) Our mobile scrollWidth (516) vs theirs (451) was the SEED CORPUS, not structure — the same ticket title produced byte-identical scrollWidths on both sites. Bisect by hiding sections, then re-measure with equal data before calling a structural gap.
31. **A `data-slot` prop can be overridden by call sites.** (Session 8.) Our mobile sidebar content renders `data-slot="sidebar"` (not `sheet-content`) because the sidebar passes its own prop — probe selectors built from component-file defaults false-negatived three close-path tests. Enumerate the live DOM before trusting the component source.
32. **Read FULL computed values — string truncation manufactures bugs.** (Sessions 7–8, twice.) A 90-char `boxShadow.slice()` hid the visible shadow layers behind the animate-in zeros and nearly shipped a phantom "stat-card shadow missing" finding; the same truncation struck again on the focus ring. Never slice computed strings in probes.
33. **Diff the whole `:root`, not just the tokens you know.** (Session 9.) Six sessions of surface probes never noticed half the token block was a session-1 theme guess — one CSSOM enumeration (`:root` rule dump → resolve to RGB → diff) catches the entire class in one probe.
34. **Preflight is part of parity.** (Session 9.) The v3→v4 migration changed more than utilities: v4 removed `button, [role="button"] { cursor: pointer }` — invisible to every class-based probe. Diff the BASE layer rules too.
35. **Component generation matters even when classes look right.** (Session 9.) Our Badge carried the new-gen base under old-gen variant classes; class-level pins passed while `transition-property` silently diverged (hover backgrounds snapped, never faded). Pin computed `transition-property` on interactive surfaces.
36. **The reference's DOM is twMerge output — compare merged strings.** (Session 9.) Their "two different badge bases" resolved into one base + variant dedupe once read as cn() output; compare the final class attribute, not the source arrays.
37. **Shared defects are parity too.** (Session 9.) The `transition-argin,opacity]` upstream mangling and the sheet-open focus landing on the sign-out button live in BOTH sites — verify the reference shares a quirk before "fixing" it, and never fix only one side.
38. **Click every control before claiming parity.** (Session 10.) Nine sessions read the login card's at-rest DOM; the card's three other views (in-card reset, Check-your-email, signup) were one click away the whole time. The at-rest DOM is the floor of parity, not the ceiling.
39. **A "dead" route can hide a live flow.** (Session 10.) The reference's `/signup` route 404s — but the login card's Sign-up button works (an in-card view swap). Route-level probing misses view-state machines; interaction-level probing finds them.
40. **Platform artifacts are not features.** (Session 10.) The base44 verify-email view and the auto-generated sitemap of dead routes are platform exhaust — replicate the DESIGN (card views, sitemap infrastructure) with production-sane substance (no fake verification, no dead URLs).
41. **The engine trap log pays dividends — verify, don't assume.** (Session 10.) The space-y v3→v4 selector rewrite (margin-side swap + `:where()` specificity) had zero instances in this app, but only because a computed-margin walk ran on both sites. Keep walking the scales each session.
42. **Enumerate the invisible surfaces too.** (Session 10.) robots.txt/sitemap.xml lived outside every DOM probe for nine sessions — one curl each. The session-8 `<head>` lesson extends to the server's root files.
43. **The head is bigger than the metas you grep for.** (Session 11.) Ten sessions swept og:/twitter:/apple- metas; the `rel="manifest"` LINK and the JSON-LD SCRIPT lived beside them the whole time. Enumerate every `<link>` and every `<script type>` in the head, not just meta tags.
44. **Follow the redirect.** (Session 11.) `/manifest.json` answered 302 — the lazy probe stops at "not 200". The manifest contract was one `curl -L` away.
45. **Drive the route matrix, including the degenerate cells.** (Session 11.) Every session opened `/ticketdetails?id=X`; the id-less cell of the matrix hid an infinite skeleton. Parameterized routes deserve their empty-parameter probes.
46. **The platform's special cases are contract too.** (Session 11.) `/dashboard` carrying no JSON-LD (and no proper title) is their builder's home-route special case — mirroring the ABSENCE is as much parity as mirroring the presence.
47. **Next's `app/manifest.ts` convention overrides `metadata.manifest`.** (Session 11.) The convention file serves `/manifest.webmanifest` AND auto-emits its own head link — silently defeating the metadata field. When the manifest URL matters (parity), use a plain route handler.
48. **Static engine-trap scans need structural confirmation.** (Session 11.) The space-y detector flagged 2 "hits" — both grandchildren (the known false-positive class). Verify JSX depth before filing engine-trap findings.
49. **A measured reference claim is not a shipped clone claim.** (Session 12.) The session-8 sweep measured the reference's og set, wrote "og:url derives from the per-route canonical" as a code comment, and four sessions believed it — while our side shipped NO og:url or twitter:url anywhere. Every reference-measured value needs a pin against OUR build the same session it's measured; an unpinned "parity" is a hypothesis.
50. **The engine trap list is a code-review checklist, not a migration memory.** (Session 12.) Trap #4 (margin utilities on direct children of space-y containers) was documented as "verified absent" in the very session that introduced a live instance two views away — it then shipped an 8px overlap for two sessions. "Verified absent" goes stale: run the trap scan on every diff that adds any margin utility, and remember `=>` in JSX attributes breaks naive tag-regex scanners (the depth walk needs care).
51. **Computed margins can diverge with zero class difference.** (Session 12.) Both sites shipped identical `-mb-2` DOM on the login-view back buttons — only the computed gap (the reference's 16px vs our −8px overlap) revealed the v3→v4 engine difference. The computed-value-is-ground-truth rule that governs shadows and radii governs margins too: measure the gap, never trust the shared class.
52. **Attribute the console per-site before filing.** (Session 12.) A shared browser session's console buffer mixes tabs: the reference's DialogTitle error and its Tailwind-CDN-in-production warning would have misattributed to our clone. Clear and re-check per origin before writing a finding.
53. **The reference's platform head layer is route-blind.** (Session 12.) It emits canonical + og:url + twitter:url + segment titles on every route — 404 catch-alls included. Mirror the per-route coverage where we have real routes; keep the production-sane refusal where we don't (canonicalizing 404s is an SEO anti-pattern). Platform exhaust rules: replicate the infrastructure, never the dead content.
54. **A code comment's claim about the reference's feature set is a finding waiting to happen.** (Session 13.) "The reference has no attachments" shipped in session 8 and survived five sessions — while their full attach UI (multiple picker, appended rows, X icon removes, CDN uploads, the detail display) sat one probe away. Feature-level claims ("they don't have X") need the same live re-verification cadence as style claims; the s12 og:url belief was the same defect class.
55. **Probe the STATES, not just the surfaces.** (Session 13.) The s3 dropzone measurement pinned the at-rest markup; the attached-file row — the state users spend time in — was never measured. Every interactive surface has at least two contracts: at-rest and active. Enumerate them when planning a gap analysis.
56. **A guard nobody has fired is a guard that lies.** (Session 13.) The s12 screenshot script's FATAL checks were doubly broken — an inverted condition (`!=` fires on "ok", passes on "wrong:...") and a selector matching nothing on the target page (`.text-4xl` on the detail page, whose h1 is text-xl). Execute the failure path of every guard before trusting the success path.

57. **The response layer is a parity surface too.** (Session 14.) Thirteen sessions pinned markup, computed styles, and the head — but the HTTP response behind a link (Content-Disposition, content-type, redirect chain) was first probed this session, and it carried a real UX gap: our download route forced browser downloads for six sessions while the reference's new tab displayed the file inline. Every user-visible "click → what happens" has a DOM contract AND a response contract.
58. **A pinned mechanism is only pinned on the states it was measured in.** (Session 14.) The s12 social-URL set was measured on query-less routes; the reference's canonicalization includes the query string on their one query-driven route. When pinning a mechanism, enumerate its input states — query/no-query is a state axis, like at-rest/active.
59. **Reference platform artifacts age — but verify the probe method before believing it.** (Session 14, corrected in 15.) The s14 claim "their CDN file URLs expire" was a HEAD-method artifact — the base44 file proxy 404s HEAD and 302s GET; every probe URL from s13/s15 still serves via GET (see lesson 60). The standing principle survives: durable storage on our side is a superset to keep — "their file is gone" must never be read as "delete ours to match." And beware the shell transmission layer: it mangles `a[href` sequences on read display — verify selector bytes (hexdump) before diagnosing a "broken" locator, and never let String.replace's `$'` (after-match) expansion touch a replacement string — use plain concatenation.
60. **The HTTP method is part of the measurement.** (Session 15.) `curl -I` (HEAD) on the base44 file proxy returns 404 while GET returns 302 → 200 — the s14 "CDN URLs are not durable" evidence was entirely this artifact. When probing a response layer, use the verb the browser actually uses (GET), follow redirects explicitly, and distinguish "the redirect hop 404s" from "the file 404s." A 404 is not a 404 until the method matches.
61. **A pinned rendering is only pinned in the environment it was measured in — enumerate the environment axes.** (Session 15.) Fourteen sessions of date-format parity held because every probe and every E2E run executed at UTC; the timezone axis was invisible until a Singapore-context browser was driven. The reference's API returns NAIVE datetimes (no Z) that the browser parses-as-local and formats-as-local — the digits round-trip, so every viewer sees the stored UTC wall-clock. Ours returned Z-suffixed ISO and rendered the viewer's local time: an 8h-visible divergence for the Singapore operator. The fix: `timeZone: "UTC"` in the formatters, pinned by Singapore/extreme-timezone E2E contexts and TZ-hardened unit pins (RED verified under `TZ=Asia/Singapore`/`Pacific/Honolulu`). Enumerate locale, timezone, and viewport the way you enumerate at-rest/active and query/no-query.
62. **Paired probes catch what single-site probes cannot.** (Session 15.) The timezone divergence was only visible because the SAME Playwright context drove both sites and rendered different strings for the same instant (reference "4:29 AM" vs ours "6:29 AM" under Europe/Berlin). Keep the probes paired — and for cache semantics, measure the full response-header set (the reference CDN's `public, max-age=31536000, immutable` vs our `private, max-age=3600`) from inside the authenticated page context, where the redirect hop's auth gate lets the fetch through.
63. **A timing contract measured once and applied everywhere is a single-spring trap.** (Session 16.) Session 3 fitted one curve (~310ms spring, 12% overshoot, no stagger) to what are actually FOUR different reference animations: the stat cards + submit/detail wrappers run a 500ms ease-out TWEEN (cubic-bezier(0.61, 1, 0.88, 1) — framer-motion's default tween ease), the mytickets cards run a staggered spring (50ms/index), the recent rows run an X-AXIS slide (translateX(-20px), 100ms/index), and the spring surfaces' opacity settles on a DIFFERENT curve than their transform (framer-motion springs work in absolute units — the 0→1 opacity distance settles slower than the 20px transform). When a surface animates, enumerate the per-surface parameters (axis, duration, easing, stagger, per-property curves) independently.
64. **The reference's production bundle is a legitimate measurement instrument — often the BEST one.** (Session 16.) The bundle carries the exact framer-motion `transition` objects (`duration:.5`, `delay:o*.05`, `initial:{opacity:0,x:-20}`) — no timing-probe approximation can beat the source values, and the bundle explains WHY probes read as they do (the absolute-unit spring). The method: extract the parameters from the bundle, then confirm the rendered behavior with live rAF timelines. The bundle defines; the probe confirms.
65. **Some surfaces are unmeasurable without credentials — document them, never invent them.** (Session 16.) The reference's nav extends with All Tickets / Analytics / Settings / Developer items when `user.role === "admin"` (full implementations live in their bundle; the operator login is `role: "user"`). The parity doctrine (computed styles = ground truth) means unmeasured UI is out of scope by design — do not guess an admin UI into existence. Document the surface, note what a future session needs (admin credentials) to measure it, and move on. Meanwhile the cheap E2E false-green trap: a /api/stats polling pin on /dashboard counts the DASHBOARD's own stats fetch — run behavioral pins on a page where only the surface under test fetches.
66. **Meta VALUES are a probe surface, not just meta PRESENCE.** (Session 17.) Sixteen sessions of head work pinned which metas EXIST (the s8 enumeration lesson) — the viewport meta string and the og:image's pointed-at asset were never value-diffed. The first value-level head sweep found two real gaps: our viewport lacked `viewport-fit=cover` (the reference ships it — the notched-device full-bleed companion to the standalone PWA display), and our og:image declared 512×512 over a 480×480 JPEG (false on both the dimensions and the type; the reference declares 1200×630 against the same file — their platform default, never mirrored). For every pinned meta, ask what its content RESOLVES to and whether the asset behind it is what it claims.
67. **The response layer extends to metadata assertions.** (Session 17.) The s14 doctrine (probe the HTTP response behind every user-visible click) also covers crawler-facing surfaces: an og:image declaration is a CLAIM about an asset — GET it, read the content type, parse the magic bytes. And when a metadata block is duplicated across the root layout AND a per-route helper, remember the s12 merge rule (a child's openGraph REPLACES the parent's wholesale) — both copies must stay identical, which is why `OG_IMAGES` lives in ONE exported constant beside `SITE_URL` (the picker/list lesson applied to the OG card: the root-layout-only fix left every routeHead route serving the old URL until the single source landed).
68. **A green suite under an ambient server is a false green.** (Session 18.) The s17 og:image pin fetched the rendered ABSOLUTE URL (baked from NEXT_PUBLIC_SITE_URL — localhost:3000 by default, CI's fallback included) and passed session 17's local run ONLY because a live-verification production server was listening on :3000 at the time. In CI and every fresh clone it failed ECONNREFUSED — the badge sat red between sessions while the docs said 193/193 green. When a test fetches an absolute URL, it tests whatever answers at that origin: resolve the PATHNAME against the page under test (`page.request.get(new URL(url, page.url()).pathname)`) so the fetch rides the E2E server's own origin, and run the suite with NO ambient :3000 listener before claiming environment-independent results.
69. **The output layer is part of the measurement.** (Session 18, from a retracted finding.) The CI trigger read as `branches: ain]` through cat/grep output — the raw bytes on disk and in the session-3 git blob were `branches: [main]` all along; the output-capture layer ate `[m` as an ANSI reset escape. A whole "CI has never run" finding (with a fix queued) was built on a display artifact until the hex dump retracted it. The s15 lesson ("the HTTP method is part of the measurement") extends to every layer between the artifact and your eyes: hex-dump suspicious strings, and treat infrastructure "corruption" claims as unverified until the bytes confirm them. Corollary: a gate's STATUS is also a claim — check the CI badge after every push; a red badge between sessions means a clean-env failure shipped unnoticed. The artifact struck TWICE in session 18: the same bracket-eating also produced a false "the s14-s17 screenshot scripts carry a mangled aref*= selector" finding — the passing s16 spec pins (which display as aref*= yet execute green) were the tell that the display was lying, and the od byte-dumps retracted both findings.



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
// mytickets: <TicketCard ticket={t} formattedDate={formatDateTime(t.createdAt)} />
// dashboard: <RecentTicketRow ticket={t} />  // formats its own date-only date
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
| `--primary` | `#171717` | near-black (stock shadcn, session 9) — drives the dark `hover:bg-primary/80` badge washes; cyan accents come from explicit utilities |
| `--primary-foreground` | `#ffffff` | text on primary |
| `--secondary` | `#f1f5f9` | secondary bg |
| `--muted` | `#f1f5f9` / `--muted-foreground: #64748b` | quiet text |
| `--accent` | `#f1f5f9` | hover surfaces |
| `--destructive` | `#ef4444` / fg `#fff` | destructive actions |
| `--border` | `#e2e8f0` | hairlines |
| `--ring` | `#0a0a0a` | focus rings (near-black, reference-measured session 6; cyan accents use explicit `*-cyan-500` utilities) |
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

Session-3 application of this loop: fresh DOM/computed-style diff + a MutationObserver motion probe → 12 findings + 1 latent hydration bug (`<div>`-in-`<p>` Skeleton) → remediation plan (docs/remediation-plan-session3.md) → 11 red parity tests + clean-hydration pin + `formatDate` unit tests → implementation (recent-row rework, lowercase badges, CSS entrance animations + `prefers-reduced-motion`, submit-form details, login caption, search icon, info-panel tracking, transparent `<main>`, CI workflow) → 57/57 E2E green → live re-verification (all contracts + zero console errors) → docs + this skill (v2.1.0).

Session-4 application of this loop: full 5-page DOM diff + live geometry probes + VLM lead-generation (9 claims, 5 refuted) → 16 findings — the headline one being the **sidebar nav layout bug present since session 1** (the missing inner `flex items-center gap-3` wrapper made `justify-between` push labels to the right edge AND let `[&>svg]:size-4` shrink icons to 16px) → remediation plan (docs/remediation-plan-session4.md) → 16 red parity tests → implementation (nav wrapper + semibold labels + active hover gradient, badge shadow + compact padding, submit labels/grid/cyan-focus controls, ghost back buttons, rounded-lg mobile trigger, Google-logo wrapper, tracking-wider revert, reference-designed 404 page) → 73/73 E2E green → live re-verification (12px gap / 20px icons / weight 600 on desktop AND mobile, zero console errors) → docs + this skill (v2.2.0).

## Appendix B: Quick Reference Card

```bash
# gates (in order)
bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e  # 107 E2E
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
` expansion near a replacement string containing dollar-quote.


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
// mytickets: <TicketCard ticket={t} formattedDate={formatDateTime(t.createdAt)} />
// dashboard: <RecentTicketRow ticket={t} />  // formats its own date-only date
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
| `--primary` | `#171717` | near-black (stock shadcn, session 9) — drives the dark `hover:bg-primary/80` badge washes; cyan accents come from explicit utilities |
| `--primary-foreground` | `#ffffff` | text on primary |
| `--secondary` | `#f1f5f9` | secondary bg |
| `--muted` | `#f1f5f9` / `--muted-foreground: #64748b` | quiet text |
| `--accent` | `#f1f5f9` | hover surfaces |
| `--destructive` | `#ef4444` / fg `#fff` | destructive actions |
| `--border` | `#e2e8f0` | hairlines |
| `--ring` | `#0a0a0a` | focus rings (near-black, reference-measured session 6; cyan accents use explicit `*-cyan-500` utilities) |
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

Session-3 application of this loop: fresh DOM/computed-style diff + a MutationObserver motion probe → 12 findings + 1 latent hydration bug (`<div>`-in-`<p>` Skeleton) → remediation plan (docs/remediation-plan-session3.md) → 11 red parity tests + clean-hydration pin + `formatDate` unit tests → implementation (recent-row rework, lowercase badges, CSS entrance animations + `prefers-reduced-motion`, submit-form details, login caption, search icon, info-panel tracking, transparent `<main>`, CI workflow) → 57/57 E2E green → live re-verification (all contracts + zero console errors) → docs + this skill (v2.1.0).

Session-4 application of this loop: full 5-page DOM diff + live geometry probes + VLM lead-generation (9 claims, 5 refuted) → 16 findings — the headline one being the **sidebar nav layout bug present since session 1** (the missing inner `flex items-center gap-3` wrapper made `justify-between` push labels to the right edge AND let `[&>svg]:size-4` shrink icons to 16px) → remediation plan (docs/remediation-plan-session4.md) → 16 red parity tests → implementation (nav wrapper + semibold labels + active hover gradient, badge shadow + compact padding, submit labels/grid/cyan-focus controls, ghost back buttons, rounded-lg mobile trigger, Google-logo wrapper, tracking-wider revert, reference-designed 404 page) → 73/73 E2E green → live re-verification (12px gap / 20px icons / weight 600 on desktop AND mobile, zero console errors) → docs + this skill (v2.2.0).

## Appendix B: Quick Reference Card

```bash
# gates (in order)
bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e  # 107 E2E
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

70. **A gate that has never been green is a broken gate, not a flaky one — and default-flag drift in shared actions breaks CI silently.** (Session 18, found post-push.) `actions/upload-artifact@v4` (v4.4+) EXCLUDES hidden files by default, and a Next.js standalone build is full of them: `.next/standalone/.next/` (server chunks, manifests, static) and `node_modules/.prisma` (the generated Prisma client). The e2e artifact had carried a gutted build since the workflow's first run — CI red on all 33 runs while every local simulation stayed green, because `tar`-based round-trips (and any local copy) do not discriminate against dot-directories. The debugging path that cracked it: the never-worked history pointed at a STRUCTURAL, environment-only break; local CI-exact simulations (no `.env`, CI's AUTH_SECRET, artifact round-trip) all passed, eliminating the code; the one difference left was the upload step itself. Fixes: `include-hidden-files: true`. General rules: (1) scrape the anonymous run-history aria-labels to see a gate's full record before assuming recency; (2) any artifact that must carry dot-directories needs the flag; (3) "CI ✓" in docs is a claim about EXECUTED runs — verify one exists.
71. **The redirect chain is a parity surface — the URL a guard bounces to, the params it carries, and where a param'd login returns.** (Session 19.) Eighteen sessions measured the login card at rest (the s2 shell, the s8 error contract, the s10 view machine) and the guarded routes' chrome — but never the bounce SHAPE. The reference's gate lands unauthenticated visitors on `/login?from_url=<absolute url>` and returns them to that exact page after sign-in (verified with a non-dashboard target — the dashboard target is ambiguous with the post-login default). Ours shipped a plain bounce + a hard-coded `/dashboard` landing: a shared `/ticketdetails?id=X` link opened logged-out lost its ticket for 18 sessions. Every navigation between surfaces carries observable state; enumerate it. The fix pattern worth copying: a cookie-PRESENCE proxy decorating the bounce (never the session-resolving gate — that stays in the authoritative layout), plus a pure, unit-pinned target validator (same-origin, auth-page-loop prevention, query preservation, safe fallback), plus an imperative param read in the login page (no `useSearchParams` — static prerender survives).
72. **`request.nextUrl` inside a proxy reflects the BIND address, not the user-facing origin.** (Session 19, found in the E2E RED run.) The standalone server binds 0.0.0.0; the s19 from_url initially carried `http://0.0.0.0:3100/dashboard` while the browser sat on `localhost:3100`. Build user-facing URLs from the request's HOST header (what the browser sent), and keep the use-time validator comparing against the BROWSER's own origin (`window.location.origin`) — a spoofed Host then cannot produce an open redirect. Related: the reference's platform builds from_url client-side (their gate is client-side), so the value always matched `window.location` — our server-side construction needs the explicit Host-header step to match the same observable contract.
73. **Platform head retractions arrive in waves — keep a dated, per-route drift ledger.** (Session 19.) The s18 viewport-fit retraction (auth-pages-only) extended in s19 to the whole PWA trio (theme-color + manifest + apple-touch-icon) AND og:image:width/height/alt — same pattern, one session later. Two implications: (1) any prior "the reference ships X per-route" doc line is a claim with a shelf life — re-measure per session on FRESH HARD LOADS (their head is client-injected: curl sees only the SPA shell; the rendered DOM is the truth); (2) a presence-pin with an unmeasured VALUE is an open question, not a closed contract — the dashboard canonical sat unmeasured for 18 sessions (their value: the origin ROOT, their home special case; ours stays segment-canonical for our single-URL architecture — an architecture-driven documented divergence, like the s10 404-canonical decision).
74. **An auth flow has BRANCHES — enumerate every one before calling the gate "measured," and pin the compound paths users actually take.** (Session 20.) Session 19 measured the direct chain (bounce + sign-in return); session 20 found three more branches hiding behind it: the Google OAuth entry (a real accounts.google.com flow whose `state` param carries THEIR from_url — the deep link threads through the OAuth round-trip; ours renders the truthful not-configured alert per the zero-third-party-auth doctrine), the gate's ROUTE-SET (theirs is a catch-all that bounces even unknown routes and their own /signup to login when cookie-less — the SPA cannot know a route is invalid until after auth; ours gates exactly the four app routes, serves the real /signup, and 404s unknown routes publicly), and the reset detour (the from_url survives the in-card forgot-password view machine because the view swaps NEVER change the URL — then E2E-pinned as the s10×s19 interaction, the most common real-world path to a shared link). Two probe lessons ride along: a bare-substring `waitForURL` regex matches its own measurement target's ENCODING ("ticketdetails" appears inside the URL-encoded from_url param — a green that measured nothing; assert the full decoded value); and when the reference's own toast viewport blocks their mobile sheet trigger (their standing defect), dispatch the event via JS `element.click()` — the DOM contracts (sheet geometry, overlay, body lock) are unchanged by the entry path.
75. **The auth flow's RESPONSE layer is a parity surface too — and the pin layer must match the budget layer.** (Session 21; the lesson the s21 commit's header claimed but never landed in this list — landed here in s22.) The s14/s15 HTTP-response doctrine extends to the auth endpoints: the status codes (their wrong-password 400 vs our semantically-correct 401), the envelopes (their FastAPI shape vs our `{error}`), the throttling behavior (none visible on theirs at 20+ requests — ours the deliberate security superset), the response-body surface (their JWT-in-body + geolocation + last_active vs our httpOnly cookie). And when a security superset needs pinning, choose the layer where the fixture cost is zero: the smoke script's throwaway server (fresh in-memory buckets) pins the 429 contract for free where an E2E pin would consume the entire rate budget and cascade-flake the suite. A missing security control on the reference is not a mandate to remove ours — measure theirs, document the divergence, pin OURS.
76. **The UI guard is not the API guard — enumerate the WRITE PATH of every flow.** (Session 22.) The reference's comment box disables the empty submit (a UI guard) while their API stores the empty comment at 200 — and the whitespace-only, the 50,000-character, and even the bogus-ticket-id comments too (only missing FIELDS 422 — pydantic presence, never value; no ticket-existence check, no referential integrity, a deletable-entity CRUD). Their detail page hides the status control for non-owners (a UI guard) while their update PUT applies ANY authenticated user's mutation on ANY ticket. A disabled button proves nothing about the endpoint behind it: validation, ownership scoping, and referential integrity are all API-layer surfaces. The structural cause is generic-entity backends — unscoped by construction; our route-by-route handlers (validated-string enums, owner checks, existence checks) are the architecture the superset doctrine documents. Pin the guards at the smoke layer (zero fixture cost — a second user via signup needs no login budget). And probe hygiene on live shared workspaces: measure, revert in the same session, verify field-by-field, document.
77. **Turn the write-path doctrine on YOUR OWN code — every advertised guard is a claim about a SEAM.** (Session 23.) While measuring the reference's attachment-write surface (their upload caps nothing: 15 MiB accepted, 10 URLs per ticket, a partial .exe/.bat blocklist), the audit turned inward and found OUR closed MIME list enforced NOWHERE: `ATTACHMENT_ACCEPTED_TYPES` was defined but unused at the API, the picker's `accept` attribute is a hint a user can bypass, the client checked only `file.size`, `validateAttachments` checked only count/size/filename, and the download route serves the stored mimeType with `Content-Disposition: inline` — so a direct API POST could store `text/html` for inline serving from OUR origin (a stored-XSS surface WORSE than the reference's octet-stream platform, sat open for thirteen sessions behind a true-sounding doc line). The fix pattern: curl your own API exactly the way you curl theirs; RED→GREEN the missing guard at the server seam (not the UI); mirror it in the UX layer for feedback; pin it at the smoke layer with the designed failure mode being the reference's measured behavior. The same session's create-path matrix found the other unpinned seam: the server-controlled status (ours never reads the client-sent status; theirs stores "banana" and renders it as a fallback badge).
78. **A cap without params is a silent truncation — every numeric ceiling in an API needs its documented escape hatch.** (Session 24.) Our list API shipped `take: 200` in session 2 and survived 22 sessions of curl-the-API rigor pointed at the reference's endpoints while OUR list contract went unpinned: no `limit`/`skip` params, no error past the cap, no pin, no doc. The reference's entity APIs page with exactly `limit` + `skip` (their `offset` yields `[]` — the param NAME is part of the measured contract) against an unbounded default (all 121 tickets in one bare array). The fix pattern: adopt the reference's param names, keep OUR ceiling as the documented DoS-safety superset (default limit 200, max 500), strict-validate garbage with 400 (the doctrine — their platform silently ignores unknown params, ours never does), extract the parsing into a pure seam (`parseListParams`) so the contract is unit-pinnable, and pin the HTTP layer at the smoke script (zero fixture cost). The broader class: audit OUR numeric constants (`take`, `MAX_*`, page sizes) with the same rigor as the reference's — a ceiling is a CONTRACT only when a caller can page past it and a pin proves they can. Two sibling lessons from the same session: route-level access control is a parity surface measured as a MATRIX, not a page (the reference's admin surface turned out to be three different implementations — an unguarded /alltickets leaking every user's email to any authenticated user, an "IT staff" notice, two administrator notices, plus one real server-side 403 on their User entity list — and the s16 "unmeasurable surface" note closed without ever needing admin credentials: probe "can a non-admin reach it" per route, not "does the nav show it"); and record what a SWEEP did not sample (four sessions of bundle sweeps read /dashboard only; /login has served its own chunk pair all along — per-route code splitting — and an unrecorded scope reads as a confirmed absence, the s12 og:url lesson class).
79. **A silently-ignored param is a lie the caller pays for — every param family on a route needs the same explicit strictness decision.** (Session 25.) The s24 fix strict-validated the list API's pagination params (`?limit=0` → 400) while the SAME route's filter params silently defaulted garbage to 200 (`?status=banana` → all rows; `?sort=banana` → newest; `?scope=banana` fail-closed to mine) — two doctrines side by side for a session, the filter one since session 2. The caller's cost: a misspelled filter renders the unfiltered feed with a 200 and no signal — the same silent-truncation class as lesson 78 in a different axis. The fix pattern: a pure seam (`parseListFilters` beside `parseListParams` in `src/lib/validation.ts`), the vocabularies constants-borne (TICKET_STATUSES, TICKET_PRIORITIES, LIST_SORT_OPTIONS, LIST_SCOPE_OPTIONS), per-param error messages naming the allowed set (self-documenting 400s), RED→GREEN unit pins, smoke pins at zero fixture cost, and an explicit decision about UI sentinels (the UI's "All Status" select value is UI-only state that OMITS the param — `?status=all` is NOT an API value and rejects like any other garbage; make that a pinned test, not a surprise). Two sibling lessons from the same session: close tier/role questions at the BUNDLE, not the UI copy (the s24 "/analytics is for IT staff" phrasing implied a third role tier; the bundle read — one `role === "admin"` guard + the platform's own two-role inviteUser validation string — closed it in minutes; the copy lies, the guard doesn't); and sweep what the last sweep didn't (the s24 /login-own-chunk completeness note became this session's sweep axis — every "unchanged" claim should name its scope).
