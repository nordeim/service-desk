# ServiceDesk — Session 39 Remediation Plan

**Date:** 2026-10-13
**Scope:** Fresh visual + functional parity audit of the clone vs the live reference (`https://service-desk-332a5ae4.base44.app/`), full verification-gate baseline in a CLEAN re-cloned environment, remediation of the identified gap, and full re-verification. Session 39 follows the session-38 remediation (commits `221141a` + `7fa3c8f` + the operator's `352fd34` transcript commit; briefing docs `docs/session_65.md` + `docs/remediation-plan-session38.md` + `worklog.md` + `docs/session_66.md`). This session executes the session_65 next-step shortlist: the standing ledger re-checks (an ELEVENTH /login wave arrived), the s4-defect + overflow ledgers, and the own-side audit candidates (the **rate-limit bucket memory growth** — the leading candidate; the **signup bucket's XFF interplay** — verified clean but unpinned).

**Method:** Ground truth = computed styles + live interaction probes + raw-header HTTP probes + bundle-source reads + a live RSS measurement (per `skills/clone-app-pat-pro` + the s14–s38 response-layer/bundle/write-path/proxy doctrines). This session's headline findings: **the ELEVENTH /login wave arrived as another pure re-hash** (the entry pair rotated to `index-CBO659Ce.js` + `index-BWbcAqev.css` with real byte deltas that diff to minifier identifier renames ONLY — the login view code functionally unchanged; the app-route pair STILL the pre-s30 split `index-DhFaB31Z.js` + `index-DFdILd41.css`); **the s4-documented toast-viewport blocking + their desktop 1328-vs-1280 + mobile 468-vs-375 overflows all persist unchanged**; and the own-side audit found **one actionable defect: the rate-limit `buckets` Map has NO eviction — measured live, a 50k unique-XFF flood left +111 MB of RETAINED memory (never reclaimed after GC settle), because `buckets.delete` is never called anywhere in the codebase**. One shortlist item verified clean: the signup route derives its limiter key through the shared s38 `clientIp` seam (the live probe: the 11th rotating-prefix attempt 429s) — but the surface is UNPINNED (the s38 pins cover login + forgot only), closed per the s31 clean-but-unpinned doctrine.

## 1. The gap analysis (all measured this session)

### F1 — the bundle sweep: THE ELEVENTH /login WAVE (rotation, non-gap)

The reference rotated its /login entry pair again: `index-DubVZJFz.js` + `index-j9r1q4QJ.css` (s38) → `index-CBO659Ce.js` + `index-BWbcAqev.css`; `UserAppMain` renamed `BG9KtJ0q` → `DJkeAsKI`; AuthAPI/AuthContext/axiosClient re-hashed. Unlike the tenth wave this one has REAL byte deltas (index +371 B, CSS +2384 B, AuthAPI +83 B, UserAppMain −319 B) — but the hash-normalized string-literal diff shows ONLY minifier identifier renames (`kt`→`Tt`, `Oe`→`we`, `ct`→`it`: the same letter sequence shifted): the login view code is functionally UNCHANGED. The login contract verified in the new sources: `from_url` ×14/1/2/2 in UserAppMain/AuthAPI/AuthContext/axiosClient (identical counts to the s38 record) + all six login-card strings. The app-route pair is UNCHANGED (`index-DhFaB31Z.js` + `index-DFdILd41.css`, live-verified via the performance resource API); `logoutReturnPath-HjtsxsFd.js` is hash-stable. The reference's LIVE logout measured: it navigated to `/login?from_url=https%3A%2F%2F…%2F` — the s37-mirrored carry. **Non-gap (rotation).**

### F2 — the chrome ledger holds (twenty-first re-verification, non-gap)

All axes exact, both routes. `/login`: `viewport-fit=cover` + the PWA trio (manifest + theme-color `#000000` + apple-touch-icon) + og:image. `/dashboard`: plain viewport + NO PWA trio. **Non-gap.**

### F3 — the desktop-overflow axis: their 1328-vs-1280 persists (their defect, NOT cloned)

At 1280×800 their dashboard still renders `scrollWidth 1328` vs `clientWidth 1280` (twenty-first measurement). Ours: **1280 = 1280**. **Their defect documented, NOT cloned.**

### F4 — the mobile matrix + the s4-defect re-check: both persist (their defects, NOT cloned)

Their `468`-vs-`375` mobile overflow persists (twenty-first). **The s4-documented toast-viewport blocking PERSISTS:** `elementFromPoint(38,30)` still returns the `fixed top-0 z-[100]` toast-container div, and the REAL agent-browser click on the Toggle Sidebar button does NOT open the menu. Ours: **375 = 375**, the REAL click opens the sheet (the dialog rect `0,0,288,667`), Escape closes it, and the My-Tickets nav-tap auto-closes + navigates (`/mytickets`, the correct title). **Ours the working superset.** (Measurement note for the record: a Radix sheet's visibility must be read from the dialog's bounding rect — a `position: fixed` element reports `offsetParent: null` while open; the session's first check mis-read that as closed.)

### F5 — the desktop paired VLM check (non-gap)

The side-by-side dashboard comparison (1280×800, both logged in fresh, both captures verified on-page before shooting; the z-ai vision CLI — the chat API rejects image content): **LAYOUT-OK. Non-gap.**

### P1 — the own-side audit: the rate-limit bucket memory growth (THE DEFECT)

The session_65 leading candidate, measured live on the production standalone (PID-managed per the s38 doctrine):

| Probe | Result |
|---|---|
| **The live leak measurement** | A 50k-request flood with a UNIQUE rightmost XFF element per request (`X-Forwarded-For: 10.70.x.y` — login with a wrong password: 401s, zero DB writes, each unique value minting a fresh bucket key) took the server's RSS from **191.6 MB → 344.7 MB**, settling at **302.8 MB RETAINED (+111 MB, ~2.2 KB per entry) after GC settle + a health request** — the memory does NOT come back |
| **The seam** | `src/lib/auth.ts` — the module-level `const buckets = new Map<string, Bucket>()`. `buckets.delete` is NEVER called anywhere in the codebase. Entries whose hits have ALL expired (the filter runs only on ACCESS, and only prunes the `hits` ARRAY) remain in the Map forever: the SHELL never leaves |
| **The honest-traffic shape** | A slow leak: one PERMANENT entry per unique (IP, route) pair ever seen. Monotonic growth over process lifetime — a months-running server accumulates every unique visitor's shell |
| **The attack shape** | The no-proxy XFF-forging posture the s38 plan documented as best-effort: an attacker rotating unique rightmost values grows the Map by ~2.2 KB per request — **never reclaimed, even after the 15-min window expires** (the entries do not leave on their own). At sustained rates this is an OOM vector: the limiter survives (each key gets its 10 attempts) but the process dies |
| **The reference's posture** | Their platform shows no visible rate limiting at all (the s21 measurement). Ours deliberately rate-limits — the documented security SUPERSET. The leak is a defect in OUR superset implementation, not a parity gap |

**The judgment call.** The limiter's semantics are correct (the s38 pins hold); the DEFECT is purely the Map's unbounded growth. The fix must evict expired entries WITHOUT changing the limiting semantics and WITHOUT creating a new DoS amplification surface (a naive every-call sweep is O(size) per request — an attacker who grows the Map to 1M entries would make EVERY limiter call scan 1M entries). The design: a **threshold-gated, time-gated sweep** — it runs only when the Map has crossed a size threshold (honest traffic never crosses it: zero overhead) AND at most once per minute (the amplification guard); it deletes only entries whose hits are ALL expired (a bucket with any live hit is the s21/s38 contract — never touched). The attack-shape bound (memory ≤ unique keys × window × ~2.2 KB during an ACTIVE flood) is inherent to every sliding-window limiter and is documented, not papered over — the fix restores the honest ceiling: memory ∝ keys in the ACTIVE window, not keys EVER SEEN.

### P2 — the signup bucket's XFF interplay (the s65 shortlist item: verified clean, UNPINNED — closed by a pin)

Measured live on the production standalone: 10 rotating-prefix signup POSTs (`X-Forwarded-For: attacker-N, 10.0.0.39` — invalid bodies, 400s, zero DB writes) exhausted the stable rightmost-keyed bucket and the **11th answered 429 + `Retry-After: 900`** — the shared `clientIp` seam covers the signup route; the s38 fix works there. The surface was UNPINNED (the s38 smoke pins cover the login + forgot buckets only). Per the s31 doctrine (a clean-but-unpinned contract is a future regression with no alarm), close it with a smoke pin. **Non-gap; pinned this session.**

## 2. The remediation

### Component 1 — P1: the rate-limit bucket eviction (the memory-growth fix)

**Code change (one seam, three additions to `src/lib/auth.ts`):**

1. The sweep function — deletes entries whose hits are ALL expired:

```ts
function sweepExpiredBuckets(now: number, windowMs: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || bucket.hits.every((t) => now - t >= windowMs)) {
      buckets.delete(key);
    }
  }
}
```

2. The gates — the sweep runs only past the size threshold AND at most once per minute:

```ts
const BUCKETS_SWEEP_THRESHOLD = 1_000;   // honest traffic never crosses it
const BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000; // the amplification guard
let bucketsNextSweepAt = 0;

// inside rateLimit(), before the bucket lookup:
if (buckets.size >= BUCKETS_SWEEP_THRESHOLD && now >= bucketsNextSweepAt) {
  bucketsNextSweepAt = now + BUCKETS_SWEEP_MIN_INTERVAL_MS;
  sweepExpiredBuckets(now, windowMs);
}
```

3. The test-only observer (the Map's size is the leak surface; production code never reads it):

```ts
/** Test-only observer for the s39 eviction pins — never call from app code. */
export function __rateLimitBucketCountForTests(): number {
  return buckets.size;
}
```

**The design invariants (each pinned):**
- An entry with ANY live hit is NEVER evicted (the s21/s38 window semantics byte-identical).
- The blocked path, the Retry-After arithmetic, the key namespacing — all untouched (the existing unit + smoke + s38 pins re-verify).
- Honest traffic (a few dozen unique keys per window): the threshold is never crossed, the sweep never runs — zero steady-state overhead.
- A unique-key flood: the sweep fires at most 1×/min (O(size) each, amortized) — the amplification surface is bounded by design.
- After a flood's window expires, the next threshold-crossing call sweeps every expired shell — memory returns to the active-window working set (the leak's defining property, gone).

**TDD (the honest RED → GREEN, fake-timer deterministic):**
- Unit pins FIRST in `src/lib/__tests__/auth.test.ts` (a new `describe("rateLimit bucket eviction")` block; `vi.useFakeTimers()` + `vi.setSystemTime()` make the 15-min window deterministic):
  - RED: **the eviction pin** — 1000 unique keys each with one hit at T0; advance past the window; one more `rateLimit` call crosses the threshold → the sweep runs → `__rateLimitBucketCountForTests()` must be **1** (only the fresh key). Pre-fix: 1001 — the shells never leave → RED.
  - keep: **the live-bucket survival pin** — a key with a LIVE hit (within the window) survives a sweep triggered by 1000 expired shells; its window semantics are intact (with `limit: 1`, the pre-sweep hit still blocks the post-sweep call). Guards over-eviction.
  - keep: **the time-gate pin** — after a sweep at instant T, a second threshold-crossing call at the SAME instant does NOT sweep again (the gate) — 1000 more expired shells stay (count 1001) — and after advancing 61 s past the window the next call sweeps them (count 1). Pins the amplification guard AND the re-arm (no ratchet trap: stale shells above the threshold eventually leave).
- Smoke pins (the s39 block in `scripts/smoke-test.sh`, inserted after the s38 block — see Component 2).
- **No E2E pins** (the s21 zero-fixture doctrine; the login budget stays at 8/10).

**The mutation check (post-GREEN, the belt-and-braces):**
- Mutation A: remove the sweep call → the eviction pin + the time-gate pin fail (exactly the expected set).
- Mutation B: evict LIVE buckets too (`hits.some` instead of `hits.every`) → the live-bucket survival pin fails.
- Each observed, then reverted; the tree re-verified clean.

### Component 2 — the smoke s39 block (2 pins: the P2 signup closure + the flood-survival guard)

- **The signup XFF pin (the s65 shortlist closed):** 10 rotating-prefix signup POSTs with the stable proxy-appended suffix `10.0.0.39` (invalid bodies — 400s, zero DB writes, the s23-rejected shapes) → the 11th must answer **429 + Retry-After** (the bucket keyed on the stable rightmost — the s38 fix's coverage of the SIGNUP surface, previously verified live-only). XFF-keyed requests never touch the shared socket-IP bucket (the injection model) — the s21/s38 slot arithmetic stays exact.
- **The flood-survival guard:** 1050 unique-rightmost-XFF login POSTs (crossing the 1000 threshold; each 401, zero DB writes) → the server must stay healthy (`/api/health` 200) AND the limiter must stay exact (the NEXT login attempt on a fresh unique XFF answers 401 — not 429, not 5xx: the flood keys each burned exactly one slot of their OWN bucket; the sweep never touched live entries). Pins the eviction change's integration-level innocence: a flood exercises the sweep path, and the limiter's semantics survive byte-identical.
- Net: +2 smoke steps (106 → 108).

### Component 3 — the docs alignment (the standing set)

README (the counts + the rate-limiting feature row's eviction note), AGENTS.md (the commands-table smoke description + the Session-39 contracts section + the reference list + the screenshots lineage), CLAUDE.md (the counts + the s39 anti-pattern — the never-evicted Map), PAD (§7.1 + the checklist + the known-issues row), `service-desk_SKILL.md` (lesson 93 + the version bump), `docs/DEPLOYMENT.md` (the memory posture note in the rate-limit section), `docs/session_67.md` (this session's agent log per the numbering convention), this plan's execution status, `worklog.md`.

## 3. Non-goals (documented decisions, no code)

- **No hard cap on live buckets:** evicting LIVE entries under flood would silently reset attackers' limits (the limiter defanged — a worse trade-off than bounded memory pressure for a backstop). The honest flood ceiling (memory ≤ unique keys × window × ~2.2 KB) is inherent to every sliding-window limiter and is documented in DEPLOYMENT.md, not papered over.
- **No persistence / no shared store:** the s21 doctrine — the in-memory limiter is a single-instance backstop; horizontal scale remains the documented limitation.
- **No background timer:** the sweep rides the request path (threshold- AND time-gated) — no `setInterval` (the standalone's lifecycle owns no timers today; a timer would outlive route handlers and complicate the Bun/Node parity story).
- **No E2E login pins:** the auth budget stays 8/10 (the s37/s38 arithmetic); the unit + smoke layers are the honest pin layers for a seam change (the s21 doctrine).
- **No reference-side change:** the reference shows no visible rate limiting (the s21 measurement); the leak is a defect in OUR superset implementation, not a parity gap.

## 4. The verification plan

1. **TDD RED:** write the unit pins (1 RED + 2 keep) + the smoke s39 block (2 pins) → observe the RED set against the current tree (the eviction pin fails on the never-deleting Map; the smoke pins are integration-level — the signup pin should PASS pre-change (the seam already works — it's the UNPINNED closure, not a fix), the flood-survival guard should PASS pre-change (the current code survives the flood — it just leaks). The honest RED is the unit eviction pin; the smoke pins are the s31-style closure of clean-but-unpinned contracts).
2. **GREEN:** the sweep + the gates + the observer (one seam) → the unit pins green (175 → ~178), the smoke block green (106 → 108).
3. **The mutation check:** mutations A/B each prove the pins bite; revert; re-verify (the full unit suite clean).
4. **The full gate in the CLEAN environment** (no ambient :3000/:3100/:3999): lint → typecheck → unit → build → E2E (198 — no change; the login budget untouched) → smoke (108).
5. **Live re-verification** on the production standalone :3000 (PID-managed): the NEW `scripts/s39-live-verify.mjs` (the eviction matrix: the pre-flood count baseline, a unique-key flood crossing the threshold, the post-window sweep returning the Map to the active set — via the process RSS as the honest external signal + the seam's behavioral contract; the signup XFF closure; the s38 pins re-verified on the new build) + the standing re-runs s24–s38 (the rate-budget doctrine: fresh-bucket restarts between batches, one script at a time with full output).
6. **The UI round-trip** (real login → dashboard → submitticket → submit → the toast → mytickets → the probe cleaned via Prisma, seed canonical) + the mobile matrix on the new build (375=375, the real click opens, Escape closes, nav-tap auto-close + navigate) + the desktop paired VLM check.
7. **Screenshots:** the 10-shot set refreshed via `scripts/capture-screenshots-s39.sh` (the s38 lineage + the header + the fixture title S39); VLM spot-checks on the convention shots.
8. **Docs alignment** (Component 3) + `.env.example` re-verified against the codebase.
9. **Git:** commit to main, push via `docs/ssh_git_wrapper_v3.py` (the explicit `--remote git@github.com:nordeim/service-desk.git` — the wrapper's default is task-management.git, the s28 lesson), verify CI green, record the run status, push the final status commit.

## 5. Execution status

- [x] Gap analysis (F1–F5 + P1/P2) — complete, recorded in worklog task 105-gap-s39
- [x] The TDD RED (the 3 eviction unit pins observed failing against the never-deleting Map: the eviction pin expected 1 got 1001; the live-survival pin 1001; the time-gate pin 2001; the observer export added FIRST as a pure additive test seam — the other 17 tests stayed green. The smoke s39 pins are integration-level closures: the signup pin passed pre-change (the seam already works — the s31-style closure of a clean-but-unpinned contract), the flood-survival guard passed pre-change (the current code survives the flood — it just leaks). The honest RED is the unit eviction pin.)
- [x] The GREEN (the threshold-gated, time-gated sweep + the test observer) — PLUS the mid-execution strengthening: the first `some`-for-`every` mutation check silently PASSED (the pins only created single-hit buckets — one timestamp makes some and every indistinguishable); the strengthened pin 2 builds the MIXED shape (one expired hit + one live hit) and only then does the mutation bite
- [x] The mutation check (A: the sweep disabled — bit exactly the 3 eviction pins; B: the over-evicting some — bit exactly the live-survival pin; each observed, reverted, the tree re-verified clean 178/178)
- [x] Full gate in the clean environment: lint ✓ typecheck ✓ 178/178 unit ✓ (175 + 3) build ✓ 198/198 E2E ✓ (unchanged — the login budget untouched) smoke 108 ✓ (106 + 2, the s21 slot arithmetic verified intact)
- [x] Live re-verification: the s39 matrix 11/11 (the 50k-flood survival with the RSS signal recorded, the signup closure, the s38 pins, the s33 set-cookie, the s19/s37 bounces, the seed canonical) + the standing re-runs s24–s38 ALL GREEN — plus the MID-RUN DISCOVERY: the first batch (one boot, the doctrine violated) exhausted the login bucket → the s33 crash point + the s34 cleanup's `deleteMany({ where: { id: undefined } })` WIPED the tickets table (Prisma: an all-undefined where is NO FILTER; the `| tail` pipes masked the non-zero exits); root-caused, re-seeded (canonical), BOTH scripts hardened (`if (ticket?.id)` guards), the re-runs repeated with fresh boots — s24 ✓ s25 13 ✓ s26 15 ✓ s27 14 ✓ s28 12 ✓ s29 22 ✓ s31 14 ✓ s32 18 ✓ s33 24/24 ✓ s34 17/17 ✓ s35 13 ✓ s36 13 ✓ s37 11 ✓ s38 10 ✓ — the seed canonical throughout + the UI round-trip (the toast + the navigation + the probe cleaned) + the mobile matrix (real clicks: 375=375, open, Escape, nav-tap) + the VLM check (LAYOUT-OK on the fixed build)
- [x] Screenshots (the 10-shot set via capture-screenshots-s39.sh, all FATAL guards passed; VLM 02 + 05 LAYOUT-OK; the three changed shots — 04/05 the time-relative seed dates, 09 the S39 fixture title — VLM-diffed benign) + docs alignment (README/AGENTS/CLAUDE/PAD/SKILL v2.37.0/DEPLOYMENT/session_67.md/plan/worklog)
- [x] Commit + push + CI verification — commit 3f67029 pushed to git@github.com:nordeim/service-desk.git main via docs/ssh_git_wrapper_v3.py (the dry-run green first with the explicit --remote — the s28 lesson held; the real push verified: remote == local HEAD @ 3f67029, tracking synced, main only, tree clean; the operator key + the wrapper's temp key both shredded); the CI run on the push registered (run 38317464954); the API rate-limited the direct read — the LIVE BADGE (the s18 doctrine) read with cache-busters at 12/17/22 min post-push: build: passing on main (the local gate — the identical command set — all green in the clean environment)
