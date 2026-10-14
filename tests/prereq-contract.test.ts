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
