# ServiceDesk — Session 42 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline (the workspace RESET this session — a fresh clone; `bun install` + `.env` from `.env.example` + db:push/db:seed restored the canonical 4/11/3), remediation of the identified own-side defects, and full re-verification. Session 42 follows the session-41 remediation (commits `ac7601d` + `45c7cb2` + `12482a7`; briefing docs `docs/session_71.md` + `docs/remediation-plan-session41.md` + `worklog.md` + `docs/session_72.md`). This session executes the s71 next-step shortlist: the standing ledger re-checks (NO thirteenth /login wave — the entry pair hash-stable, byte-identical), the s4-defect + overflow ledgers (24th measurement), and the own-side audit at the next level (the s71 candidates: **the log-layer generalization** — CONFIRMED actionable; **the routeAllow input validation** — CONFIRMED actionable).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads (per `skills/clone-app-pat-pro` + the s14–s41 response-layer/bundle/write-path/proxy/method doctrines). This session's headline findings: **the parity sweep is ALL NON-GAP** (the twelfth /login wave persists byte-identical — no thirteenth rotation; the chrome ledger exact; their three standing defects persist — ours the working superset, re-verified via real clicks + the paired VLM check LAYOUT-OK); and the own-side audit found **two actionable defects: P1 — the log-layer generalization (3 of the 4 console.* sites in src/ are unpinned stderr surfaces; only the health route's line is pinned, s41); P2 — the routeAllow seam accepts garbage silently (a typo'd method name is dropped by the canonical filter with no signal — the fail-fast contract missing).**

## 1. The gap analysis (all measured this session — the 24th sweep)

### F1 — the bundle sweep: NO THIRTEENTH /login WAVE (non-gap)

The reference's /login entry pair is UNCHANGED from the s40/s41 measurements: `index-DV3Dmjzy.js` (103851 bytes — byte-size-identical, live-fetched this session) + `index-RwB3lDG6.css`; `UserAppMain-icZpSP83.js` hash-stable at 58756 bytes with `from_url` ×14 (identical counts); `logoutReturnPath-HjtsxsFd.js` hash-stable; the app-route pair UNCHANGED (`index-DhFaB31Z.js` + `index-DFdILd41.css`, fetched from their /dashboard root). **Non-gap (the twelfth wave persists).**

### F2 — the chrome ledger holds (24th re-verification, non-gap)

`/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon). `/dashboard` (their app root): plain viewport + NO PWA trio. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned, 24th)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280`. Ours: **1280 = 1280** (live-verified this session). **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned, 24th)

Their `468`-vs-`375` mobile overflow persists. **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` still returns the `fixed top-0 z-[100]` toast-container div, and agent-browser's own coverage check REFUSED the real click on the Toggle Sidebar button ("Element is covered by `<div.fixed.top-0`…") — the reference's mobile menu cannot be opened by a real click (dialogs: 0 after the attempt). Ours: **375 = 375**, the REAL click opens the sheet (dialog rect `0,0,288,667` after the entrance animation), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.**

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh; the z-ai vision CLI with both images in one prompt): **LAYOUT-OK. Non-gap.**

### P1 — the own-side audit: the log-layer generalization (the s71 leading candidate, CONFIRMED)

The s41 session pinned the health route's degraded-path log line (`tests/health-degraded.test.ts` — the first and only stderr-surface pin). The full inventory this session: **4 `console.*` sites in `src/`**, of which 3 are UNPINNED:

| Site | Line | Level | Prefix convention | Pinned? |
|---|---|---|---|---|
| `src/app/api/health/route.ts` | 26 | error | `[health]` | ✓ (s41) |
| `src/lib/auth.ts` | 38 | error | `[auth]` | ✗ |
| `src/app/api/auth/forgot-password/route.ts` | 74 | info | `[auth]` | ✗ |
| `src/app/api/auth/forgot-password/route.ts` | 76 | info | `[auth]` | ✗ |

The three unpinned sites, measured against the code:

1. **The auth.ts AUTH_SECRET production warning** — the `secret()` helper falls back to `DEV_SECRET` when `AUTH_SECRET` is missing or shorter than 16 chars, warning ONLY in production (`NODE_ENV === "production"`): `"[auth] AUTH_SECRET is missing or too short in production — set it to \`openssl rand -hex 32\`."` The warning fires through the default-parameter seam (`key = secret()` in `signSession`/`verifySessionToken`). This is the deployment-safety tripwire: an operator booting the standalone server without AUTH_SECRET gets exactly one console.error on the first token operation. Unpinned = a future refactor of `secret()` ships with no alarm (the s31 clean-but-unpinned doctrine applied to the config-safety layer).
2. **The forgot-password known-user log** — `"[auth] password reset requested for user <id> (<email>)"` (line 74): the operator's audit trail for reset requests.
3. **The forgot-password unknown-email log** — `"[auth] password reset requested for unknown email (<email>)"` (line 76): the enumeration-attempt trail.

The client-facing contract alongside the logs: the response is enumeration-safe (identical 200 + generic body for known and unknown emails — the route's own comment: "without revealing which one"). The LOGS legitimately distinguish (the operator-side audit is the route's documented purpose — "the operator finds the request in the server log"); the pins must freeze BOTH halves: the log distinction AND the response non-distinction.

**The pin design (validated against the code):**

- `tests/auth-secret-warning.test.ts` (the s31 clean-but-unpinned closure):
  - production + missing AUTH_SECRET → the warning fires with the `[auth]` prefix; the token still signs (the DEV_SECRET fallback — the documented degraded mode);
  - production + short AUTH_SECRET (15 chars) → the warning fires;
  - production + valid AUTH_SECRET (≥16 chars) → NO warning;
  - dev (NODE_ENV="test"/unset) + missing → NO warning (the dev-silent contract).
  - Mechanism: mutate `process.env.NODE_ENV`/`AUTH_SECRET` around the call, spy `console.error`, call `signSession(payload)` (the default-parameter seam triggers `secret()`), restore in `finally`. The `next/headers` import in auth.ts is inert at unit scope (no cookies() call on this path).
- `tests/forgot-password-logs.test.ts` (the s31 closure + the enumeration-safety pin):
  - known email (db.user.findUnique → a user) → `console.info` with the exact `[auth] password reset requested for user <id> (<email>)` shape;
  - unknown email (findUnique → null) → `console.info` with the exact `[auth] password reset requested for unknown email (<email>)` shape;
  - both responses deep-equal (the enumeration-safe client contract frozen alongside the log distinction).
  - Mechanism: `vi.mock` on `@/lib/db` (the health-degraded pattern — the findUnique result injected), distinct `x-forwarded-for` IPs per POST (the s38 rightmost-element seam) so each test's request lands in a fresh rate-limit bucket.

### P2 — the own-side audit: the routeAllow input validation (the s71 candidate #2, CONFIRMED — a TRUE defect class this time)

The s41 seam's documented contract: "Unknown method names in the input are dropped by the filter; the consistency pins catch a typo'd declaration via the export-surface mismatch." Measured: `routeAllow(["GET", "POTS"])` returns `"GET, HEAD, OPTIONS"` — **the typo vanishes silently**. The indirect catch works ONLY at the per-route layer (a declared-but-not-exported method fails the api-allow-source key-set assertion) and ONLY if the typo'd name also gets a stub export; a typo in an implemented-method declaration (e.g. `routeAllow(["POST", "POTS"])` where POTS was meant to be POST) produces a silently-wrong advertisement with NO alarm anywhere until someone probes the route.

**The design (fail-fast at the module-scope evaluation):** every route file computes `const ALLOW = routeAllow([...])` at module scope — an input-validation throw makes a typo'd declaration crash the module import (the dev server, the build, and the test layer all surface it immediately, with the method name in the message). The 11 current declarations pass valid canonical names only (verified by inspection: every array ∈ {GET, HEAD, POST, PUT, PATCH, DELETE} minus HEAD — never directly implemented), so the throw is behavior-preserving for the whole live surface.

```ts
for (const m of implemented) {
  if (!CANONICAL_METHOD_ORDER.includes(m)) {
    throw new Error(
      `routeAllow: unknown method "${m}" — the canonical set is ${CANONICAL_METHOD_ORDER.join(", ")}`,
    );
  }
}
```

The error message is self-documenting: the offending name + the canonical set (the operator's fix path). The s41 comment block updates to the new contract (unknown names THROW, not drop).

### The s18 display-layer artifact — the FOURTH firing (process lesson, no action)

This session's grep AND the Read tool both rendered `"[health]"` as `"ealth]"` again (the health route + the s41 test file's own assertion). Hex-dumped both files: the bytes correct in both. The doctrine stands validated — **any bracket-prefixed string read through a terminal/capture layer is suspect; hex-dump before declaring a string defect.** The new session-42 pins are written with this in mind (the assertion strings in the new test files are hex-verified in the execution log below).

## 2. The remediation

### Component 1 — P1: the log-layer pins (no code change — the s31 clean-but-unpinned closure)

**Code changes: NONE.** The three sites were always correct (the prefixes, levels, and shapes verified against the source this session; the AUTH_SECRET message text byte-verified).

**TDD (the s31 pins-on-clean-contracts doctrine):** the pins land GREEN against the current tree (the honest TDD for clean-but-unpinned surfaces is the MUTATION check).

**The mutation checks (post-land, each observed + reverted + re-verified):**
- A: corrupt the auth.ts warning prefix `[auth]` → `[authX` → the prefix pin fails;
- B: drop the production condition (warn in dev too — invert the NODE_ENV check) → the dev-silent pin fails;
- C: corrupt the known-user log line (drop the user id from the template) → the known-email pin fails;
- D: make the response differ for the unknown email (leak `exists: false`) → the enumeration-safety pin fails.

### Component 2 — P2: the routeAllow fail-fast seam (a true RED → GREEN)

**Code change:** the input-validation loop at the top of `routeAllow` (the design above) + the comment-block contract update in `src/lib/api-methods.ts`.

**TDD:**
- The RED (observed first): `tests/route-allow-validation.test.ts` — the throw pins fail against the current silently-dropping seam (`expect(() => routeAllow(["POTS"])).toThrow()`);
- The GREEN: the validation loop lands; the throw pins pass; the EXISTING 17 api-allow-source pins re-run GREEN (the 11 valid declarations unaffected — the import of all 11 route modules in that file is itself the no-regression proof, now doubly so: a module-scope throw would fail the import);
- **No E2E pins** (the s21 doctrine); **no smoke changes** (the s40 block pins the live strings — the throw must keep them green, which IS the behavior-preservation proof).

**The mutation checks:**
- E: remove the validation loop → the throw pin fails (the silent-drop regression);
- F: over-validate — reject a valid canonical member ("PUT") as input → the boundary pin in route-allow-validation fails (the "accepts every canonical member" pin); the api-allow-source import stays green because no current route declares PUT (the implemented arrays use GET/POST/PATCH/DELETE only — the stubs are separate exports). The pin still bit exactly (the over-validation regression caught at the seam's own boundary test).

### Component 3 — the docs alignment (the standing set)

README (the unit counts 200 → 212 + the s42 lines), AGENTS.md (the commands-table test description + the Session-42 contracts section + the reference list through s42 + the screenshots lineage s41→s42), CLAUDE.md (the counts + the s42 anti-pattern — the fail-fast-input-validation doctrine), PAD (§7.1 the two new test rows + the checklist + the RESOLVED session-42 known-issues row), `service-desk_SKILL.md` (lesson 96 + the version bump v2.40.0), `docs/session_73.md` (this session's agent log per the numbering convention: odd docs = agent logs), this plan's execution status, the repo `worklog.md`. `.env.example` re-verified against the codebase (no env changes this session — expected unchanged).

## 3. Non-goals (documented decisions, no code)

- **No lint rule for console.* sites:** a no-console ESLint rule would flag the four INTENTIONAL operator-facing sites (the health/auth/forgot-password logs are the design, not exhaust) and force `eslint-disable` noise on each. The pins-sweep closure (this session) covers the class the honest way: every existing site pinned, new sites start unpinned-by-definition (the s71 "anything NEW starts unaudited" doctrine — the next session's standing probe).
- **No log-library migration (pino et al.):** the app's logging surface is exactly 4 sites on Node's console; a transport abstraction adds supply-chain surface for zero operator value (the ADR-grade minimal-dependency doctrine in auth.ts's own header).
- **No routeAllow lowercase-normalization:** `"get"` throws (the canonical set is case-sensitive uppercase — HTTP methods are); normalizing would HIDE a case bug rather than surface it.
- **No behavior changes on the method surface:** every 405 body, every Allow string, every OPTIONS advertisement stays byte-identical (the s40 smoke block's pins are the frozen contract; the throw only fires on inputs that never occur in the 11 valid declarations).
- **No new smoke steps:** the s40 block (121 steps) already pins the live matrix; the s42 pins are unit-level.

## 4. The verification plan

1. **TDD:** the P2 RED observed (the throw pins fail against the silent-drop seam) → the GREEN (the validation loop; the throw pins + the 17 existing pins + the 200 existing tests all green) → the P1 pins land GREEN (the s31 closure).
2. **The mutation checks (A–F, each observed + reverted + re-verified):** the four P1 mutations bit exactly their pins; the two P2 mutations bit exactly their pins.
3. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit (212) → build → E2E (198 — unchanged) → smoke (121 — unchanged, the behavior-preservation proof).
4. **Live re-verification** on the production standalone :3000 (PID-managed): the s40 live-verify re-run (33/33 — the wrong-method matrix + the OPTIONS table + the standing contracts on the validated seam) + the standing re-runs (the fresh-boot doctrine, one script at a time, the seed canonical after every batch) + the UI round-trip + the mobile matrix on the new build.
5. **Screenshots:** the 10-shot set refreshed (the s41 lineage verbatim + the header + the fixture title S42); VLM spot-checks on the convention shots; the one expected changed shot (09: the S42 fixture title) VLM-diffed benign.
6. **Docs alignment** (Component 3) + `.env.example` re-verified.
7. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the s28 lesson), verify CI green, record the run status, push the final status commit.

## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + P1 + P2) — complete, recorded in worklog task 120-gap-s42
- [x] The TDD RED (the routeAllow throw pins — failed against the silent-drop seam, observed) + the P1 pins landed GREEN (the s31 clean-but-unpinned closure)
- [x] The GREEN (the validation loop — 212/212 unit: 200 + 12)
- [x] The mutation checks (A/B/C/D/E/F — each bit exactly its pin, reverted, re-verified)
- [x] The full gate in the clean environment: lint ✓ typecheck ✓ 212/212 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓
- [x] Live re-verification: the s40 matrix 33/33 re-run on the validated seam + the standing re-runs (s24–s40, fresh boots, seed canonical after every batch) + the UI round-trip + the mobile matrix + the VLM check (LAYOUT-OK)
- [x] Screenshots (the 10-shot set, all FATAL guards passed; VLM spot-checks LAYOUT-OK; the changed shot VLM-diffed BENIGN) + docs alignment + `.env.example` re-verified (unchanged, matches)
- [x] Commit + push + CI verification — the run on the push COMPLETED SUCCESS
