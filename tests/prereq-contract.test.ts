import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 51 — the prerequisites-contract pins (P1: the README Quick Start's
// requirements line — the claim class no family sweeps, CONFIRMED ACTIVE
// DRIFT)
//
// Contract under test: the README Quick Start's prerequisites line claimed
// "Python ≥ 3.9 for the seed's crypto imports" for 50 sessions — and the
// claim was born wrong (the session-1 docs commit cf8e4f0 described a
// Python requirement the seed never had: prisma/seed.ts has imported its
// crypto from node:crypto since its first line). The claim shape — a
// REQUIREMENTS line, the first thing a fresh-clone operator reads and
// trusts — is swept by no s48 corpus family (corpus-count forms), no s49
// pad row (§7.1 distribution rows), and no s50 BRIDGE (the quickstart
// OUTPUT line). The only Python in the Quick Start is the AUTH_SECRET
// generation comment — a working convenience, not a requirement, and the
// canonical generator recommendation (.env.example + DEPLOYMENT.md) is
// `openssl rand -hex 32`.
//
// The false claim's user-facing harm: a fresh-clone operator believes
// Python ≥ 3.9 must be installed before `bun run db:seed` can work. It
// must not — the seed is pure Node/Bun.
//
// Pin style: two-sided (the s47/s48 doctrine):
//   1. the seed-crypto ground-truth pin — prisma/seed.ts imports its
//      password-hashing crypto from node:crypto and invokes no Python
//      (if the seed's crypto ever moves, the prerequisites line and this
//      pin move together);
//   2. the README prerequisites-claim pin — the Quick Start's Requires
//      line exists (the floor: a deleted prerequisites line fails loudly,
//      the dropped-site doctrine), claims Node.js ≥ 20, claims Bun ≥ 1.1,
//      and carries NO Python token (the false-requirement guard: a
//      requirement the codebase does not have can never return).
//
// Deliberate scope: the openssl-vs-python3 comment ordering inside the
// quickstart block is a coherence convenience, NOT a pinned claim (the
// s48 lesson: pin the claims, not the universe — pinning prose
// recommendations creates brittle pins). The PINNED surface is the
// false-requirement class alone.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

describe("the prerequisites contract (session 51)", () => {
  it("the seed's crypto is Node's built-in node:crypto — the ground truth the prerequisites line describes (no Python anywhere in the seed)", () => {
    const seed = readFileSync(path.join(repoRoot, "prisma", "seed.ts"), "utf8");
    // The password-hashing primitive the (former) claim described:
    // scryptSync + randomBytes + randomUUID, imported from node:crypto.
    expect(
      /import \{ randomUUID, scryptSync, randomBytes \} from "node:crypto";/.test(seed),
      "prisma/seed.ts must import its crypto from node:crypto (the seed's password hashing is scryptSync from node:crypto — the ground-truth side of the prerequisites claim)",
    ).toBe(true);
    // The false-claim guard's ground truth: the seed invokes no Python
    // (no python token anywhere in the file — the seed is pure Node/Bun).
    expect(
      /python/i.test(seed),
      "prisma/seed.ts must not invoke Python (the seed is pure Node/Bun — a Python token in the seed would make the retired claim true again, and the prerequisites line would need to move WITH it)",
    ).toBe(false);
  });

  it("the README Quick Start's Requires line claims the REAL requirements — Node.js ≥ 20 + Bun ≥ 1.1, and carries NO Python requirement the seed does not have (the 'Python ≥ 3.9 for the seed's crypto' 50-session drift can never return)", () => {
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
    // The prerequisites line: the "Requires **Node.js ≥ 20** (or Bun ≥ 1.1)"
    // shape, the Quick Start's first prose line. The REQUIREMENTS ENUMERATION
    // is the first sentence — the part before the first period. The original
    // false claim lived there ("... (or Bun ≥ 1.1) and Python ≥ 3.9 for the
    // seed's crypto imports."); explanatory prose after the enumeration (the
    // honest "no Python required" clarification) is NOT a requirement claim,
    // so the Python guard is scoped to the enumeration alone ([^.]* stops at
    // the first period — the greedy .* would swallow the clarification).
    const m = /Requires \*\*Node\.js ≥ 20\*\* \(or Bun ≥ 1\.1\)([^.]*)\./.exec(readme);
    expect(
      m,
      "the README Quick Start must carry the Requires line (a dropped prerequisites line fails loudly — the dropped-site doctrine)",
    ).toBeTruthy();
    // The false-requirement guard: the requirements enumeration names no
    // Python. (The enumeration is a CLAIM SITE like any other — a requirement
    // the codebase does not have is a false claim, and no corpus family
    // would ever catch it: the s51 doctrine.)
    expect(
      /python/i.test((m as RegExpExecArray)[1] ?? ""),
      "the README Requires line's requirements enumeration must not carry a Python requirement — the seed's crypto is node:crypto (the false 'Python ≥ 3.9 for the seed's crypto imports' claim survived 50 sessions; it can never return)",
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Session 102 — the fresh-clone E2E-browser prerequisite pins (P1: the
// s51 prerequisites genus extended to the E2E tier)
//
// Contract under test: every local doc names EXACTLY ONE prerequisite for
// the E2E gate — "a prior build" — but on a fresh clone the E2E gate fails
// on INFRASTRUCTURE before any test runs: `browserType.launch: Executable
// doesn't exist at ~/.cache/ms-playwright/...`. The causal mechanism:
// `bun install` does NOT download the Playwright browser, because Bun
// skips dependency postinstall scripts unless the package is listed in
// package.json's `trustedDependencies` — and playwright is NOT trusted
// (the list carries the prisma family + unrs-resolver only). The one-time
// `bunx playwright install chromium` is the real fresh-clone prerequisite,
// and the CI workflow has known it since session 45 (its e2e job runs
// `bunx playwright install --with-deps chromium` before the suite) — but
// the local docs never said it. The gap survived 51 sessions because every
// post-s51 session ran on a warm workspace (the browser cache persists
// outside the repo); only a reset window can surface it — measured live at
// the s102 open (the era's first reset since s100): bun install → build →
// test:e2e errored browserType.launch across every spec until the browser
// install landed, the re-run then reading 232/232 green.
//
// Pin style: two-sided (the s51 doctrine):
//   Pin A (the ground truth — the causal mechanism): playwright is NOT in
//   trustedDependencies (so `bun install` alone never lands the browser)
//   AND the CI e2e job installs the browser explicitly before the suite
//   (the workflow's own knowledge of the prerequisite).
//   Pin B (the doc side — the claim coherence): the README Testing section
//   AND the AGENTS commands row name the one-time fresh-clone browser
//   bootstrap at their test:e2e claim sites.
//
// Either drift direction bites: a doc that drops the prerequisite fails
// pin B; a workflow/toolchain change that alters the mechanism (playwright
// moving into trustedDependencies, or CI dropping its explicit install)
// fails pin A — forcing the doc line and the mechanism to move together.
// ---------------------------------------------------------------------------

describe("the prerequisites contract (session 102 — the fresh-clone E2E-browser leg)", () => {
  it("pin A: the ground truth — bun install never lands the Playwright browser (playwright NOT in trustedDependencies) and the CI e2e job installs it explicitly before the suite", () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
      trustedDependencies?: string[];
    };
    const trusted = pkg.trustedDependencies ?? [];
    // The causal mechanism: Bun skips untrusted postinstall scripts, and
    // the Playwright browser download lives in playwright's postinstall.
    // If playwright ever moves into trustedDependencies, `bun install`
    // would start auto-downloading the browser — the doc line (pin B) and
    // this pin must then be revisited together.
    expect(
      trusted.some((t) => t === "playwright" || t === "@playwright/test"),
      "playwright must NOT be in package.json trustedDependencies (the s102 mechanism: Bun skips untrusted postinstalls, so `bun install` alone never lands the Playwright browser — the fresh-clone prerequisite is the explicit one-time install; if this pin ever fails because playwright WAS trusted, the README/AGENTS doc lines and this contract must move together)",
    ).toBe(false);
    // The CI workflow's own knowledge: the e2e job installs the browser
    // explicitly between the artifact restore and the suite.
    const ci = readFileSync(path.join(repoRoot, ".github", "workflows", "ci.yml"), "utf8");
    const installIdx = ci.indexOf("bunx playwright install --with-deps chromium");
    const suiteIdx = ci.indexOf("bun run test:e2e");
    expect(installIdx, "the CI e2e job must carry the explicit Playwright browser install (`bunx playwright install --with-deps chromium`) — the workflow has known the fresh-clone prerequisite since session 45; dropping it would break CI on every cold runner").toBeGreaterThanOrEqual(0);
    expect(
      suiteIdx > installIdx,
      "the CI e2e job must install the Playwright browser BEFORE running the suite (the browser install precedes `bun run test:e2e` in ci.yml — the ordering is the prerequisite made visible)",
    ).toBe(true);
  });

  it("pin B: the local docs name the one-time fresh-clone browser bootstrap at their test:e2e claim sites (the README Testing section + the AGENTS commands row)", () => {
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
    // The README Testing section's test:e2e site: the command row plus its
    // trailing comment block must name the browser install.
    const e2eIdx = readme.indexOf("bun run test:e2e");
    expect(e2eIdx, "the README Testing section must carry the test:e2e command (a dropped E2E claim site fails loudly — the dropped-site doctrine)").toBeGreaterThanOrEqual(0);
    // The claim window: the test:e2e row plus its comment lines (through the
    // next command row — the same fenced block).
    const windowEnd = readme.indexOf("bun run test:coverage", e2eIdx);
    const claimWindow = readme.slice(e2eIdx, windowEnd > e2eIdx ? windowEnd : e2eIdx + 2000);
    expect(
      /bunx playwright install chromium/.test(claimWindow),
      "the README Testing section's test:e2e site must name the one-time fresh-clone browser bootstrap (`bunx playwright install chromium`) — `bun install` alone never lands the Playwright browser (Bun skips untrusted postinstalls), so a fresh clone following only the documented prerequisites hits browserType.launch: Executable doesn't exist (the 51-session drift the s102 open measured live)",
    ).toBe(true);
    // The AGENTS commands row: the test:e2e row must name it too.
    const agents = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
    const rowIdx = agents.indexOf("| `bun run test:e2e` |");
    expect(rowIdx, "the AGENTS commands table must carry the test:e2e row (the dropped-site doctrine)").toBeGreaterThanOrEqual(0);
    const rowEnd = agents.indexOf("\n", rowIdx);
    const row = agents.slice(rowIdx, rowEnd > rowIdx ? rowEnd : rowIdx + 2000);
    expect(
      /bunx playwright install chromium/.test(row),
      "the AGENTS commands row for test:e2e must name the one-time fresh-clone browser bootstrap (`bunx playwright install chromium`) — the commands table is the agent-facing prerequisites surface; the silent 'requires a prior build' clause is the exact drift class this pin closes",
    ).toBe(true);
  });
});
