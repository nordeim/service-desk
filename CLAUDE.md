---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-single-app
version: 1.0.0
last_updated: 2026-10-09
---

# ServiceDesk — IT Support Portal

Full-stack IT ticketing portal (Next.js 16 App Router standalone · React 19 · TypeScript strict · Tailwind CSS v4 CSS-first · shadcn/ui · Prisma 6 + SQLite · Vitest + Playwright). A visual-parity, feature-superset clone of the base44 ServiceDesk reference app, maintained as a single deployable process with zero external services.

**Verification gate (must be green before any commit):** `bun run lint && bun run typecheck && bun run test && bun run build` — plus `bun run test:e2e` (125 specs against the production standalone build) when UI/auth behavior changes. **Re-run the gate after EVERY file that lands — including one-off scripts** (a post-gate `.cjs` script broke CI on main in session 7). CI (`.github/workflows/ci.yml`) runs the same gate on every push/PR to main.

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
- **The mobile sheet overlay is 80% black** (session 8, live-measured) and **`min-w-0` on the SidebarInset main is load-bearing** — it kills a mobile horizontal-overflow defect the reference itself has; without it the recent-card rows' intrinsic nowrap width widens the whole document at 375px.
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
| `bun run test` / `bun run test:e2e` | 54 unit / 125 E2E (needs prior build) |
| `bash scripts/smoke-test.sh` | API smoke on a throwaway server |
| `bun run db:push` / `db:seed` / `db:reset` | Schema push / idempotent seed / reset |

## Testing Strategy

- **Unit (Vitest, `*.test.ts`)**: pure seams only — auth sign/verify + scrypt + rate limiting, input validation, constants vocabulary, db-path resolution, date/duration formatting (`formatDate` date-only, `formatDateTime`, `formatDuration`). No DOM, no DB.
- **E2E (Playwright, `tests/e2e/*.spec.ts`)**: boots the PRODUCTION standalone server on :3100 with an isolated seeded `db/e2e.db`. One authenticated session via the setup project's `storageState` (auth is rate-limited — keep real logins under 10/run). `auth.spec.ts` opts out to test the logged-out surface. `visual-parity.spec.ts` (96 tests) pins the reference-measured design contracts (sessions 2–8; session 6 added the computed-value pins — the radius scale, the focus-state matrix, select dropdown structure + priority colors; session 7 added the accent-token pair, the option-radius drift supersede, empty-state markup, fetch-failure resilience, favicon + per-route titles; session 8 added the auth-error alert contract, the 80% sheet overlay, zero-overflow-at-375px + ellipsis truncation, the social/PWA head set, and the raw-button focus tails). Color pins accept both rgb() and lab() representations (v4 emits palette colors as lab()). `dashboard.spec.ts` pins clean hydration (no console hydration-mismatch errors — a `<div>`-in-`<p>` skeleton once broke it).
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
- `getByRole("alert")` in Playwright (ambiguous — Next's route announcer also matches).
- Trusting an ambient `DATABASE_URL` env var over the repo `.env` (scripts pin it for this reason).
- "Fixing" the dark circle over the sidebar footer in dev screenshots (Next dev overlay, shadow DOM, dev-only).
- Real logins per E2E test (rate limiter) — use the shared `storageState`.
