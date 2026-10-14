import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 47 — the DEPLOYMENT.md claims pins (P2: the docs surface that
// never had a drift watch)
//
// Contract under test: docs/DEPLOYMENT.md is the operator-facing deployment
// guide — its numeric claims about the codebase's shape were written once
// (session-3 era) and NEVER re-measured: the s47 audit found two stale
// figures ("the 16 API route handlers" — the actual surface is 12 route
// modules, the 11 known routes of the s41 cross-check + the s33 catch-all;
// "30 E2E checks" for the smoke script — the actual canonical number is
// 121 steps, claimed consistently in README/AGENTS/PAD/SKILL). The guide
// drifted silently for 41 sessions of smoke growth because nothing pins it.
//
// The pins close BOTH sides of each claim:
//   1. the route-module claim: the FILESYSTEM count of route.ts modules
//      under src/app/api (an executable find — the ground truth) is 12,
//      AND DEPLOYMENT.md carries the "12 API route modules" figure. When a
//      13th route module lands, the count assertion fails, forcing the doc
//      and the pin to move TOGETHER — the doc can never silently claim a
//      stale figure again.
//   2. the smoke-claim: DEPLOYMENT.md's verification section claims "121
//      steps" — the canonical corpus number (README/AGENTS/PAD/SKILL all
//      claim it; the smoke re-prints its PASS count every session's gate).
//      The stale "30 E2E checks" form fails the pin.
//
// Pin style: line-anchored claim matching on the doc side (the s45/s46
// doctrine — a claim that drifted into a comment or a different phrasing
// must FAIL, never satisfy via a partial match), executable fs counting on
// the code side (the s43 code-shaped doctrine). The 121 itself stays a
// runtime property of the server-driven smoke script (re-verified live
// every session in the standing gate); the pin closes the DOC side of the
// contract — that is the honest split between a static pin and a runtime
// measure.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const deployment = readFileSync(
  path.join(repoRoot, "docs", "DEPLOYMENT.md"),
  "utf8",
);

/** The ground-truth count of API route modules (executable, not a claim). */
function countRouteModules(): number {
  // route.ts modules under src/app/api/** — the 11 known routes + the s33
  // catch-all = 12. Counted on the FILESYSTEM (what `next build` actually
  // compiles — the doc's claim is about the build surface, and a new route
  // module counts the moment it lands on disk, not after the commit): the
  // recursive readdir walk of the env-contract pattern, never git state.
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (entry === "route.ts") files.push(full);
    }
  };
  walk(path.join(repoRoot, "src", "app", "api"));
  return files.length;
}

const routeModuleCount = countRouteModules();

describe("the DEPLOYMENT.md claims contract (session 47)", () => {
  it("claims the real API route-module count — 12 modules on disk, 12 in the doc (the stale '16' can never return)", () => {
    // Code side: the executable ground truth. Doc side: the line-anchored
    // claim. Both must agree — a new route module forces the pair to move
    // together; a doc-only regression fails the second assertion.
    expect(routeModuleCount).toBe(12);

    const claims =
      deployment.match(/^.*the 12 API route modules.*$/gm) ?? [];
    expect(
      claims.length,
      "DEPLOYMENT.md must claim 'the 12 API route modules' (the s47 fix of the session-3-era '16' figure)",
    ).toBeGreaterThanOrEqual(1);

    // The stale figure, in its exact line shape, must be gone — a
    // regression back to "16 API route handlers" fails loudly.
    const stale =
      deployment.match(/^.*16 API route.*$/gm) ?? [];
    expect(stale).toEqual([]);
  });

  it("claims the canonical smoke step count — '121 steps', not the stale '30 E2E checks'", () => {
    // The corpus number: README ("API smoke script (121 steps)"), AGENTS,
    // PAD, and the SKILL project_state all claim 121; the smoke script
    // re-prints its PASS count in every session's gate run. The doc must
    // carry the same figure in its verification section.
    const smokeClaims = deployment.match(/^.*smoke-test\.sh.*121 steps.*$/gm) ?? [];
    expect(
      smokeClaims.length,
      "DEPLOYMENT.md's smoke-test.sh line must claim 121 steps (the canonical corpus number)",
    ).toBeGreaterThanOrEqual(1);

    // The stale session-3-era figure, in its exact shape, must be gone.
    const stale = deployment.match(/^.*30 E2E checks.*$/gm) ?? [];
    expect(stale).toEqual([]);
  });
});
