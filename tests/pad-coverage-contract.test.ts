import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 54 — the source-side coverage pins (P1: the coverage-completeness
// claim class — the s95 shortlist's successor audit, CONFIRMED ACTIVE DRIFT)
//
// Contract under test: the PAD §7.3 universal claim "every pure seam in
// `src/lib/` is unit-tested" — and the s54 audit found it FALSE for exactly
// one file: src/lib/route-head.ts, a pure seam (the s12 social URL set
// construction) that landed at dcfc542 with E2E mechanism pins only, no unit
// layer. The claim was BORN TRUE at cf8e4f0 (session 1: every src/lib seam
// had its test) and went FALSE at session 12 — 42 sessions of drift.
//
// The class survived because the COVERAGE shape matches no pin family's form:
// the s49 pads map the RUNTIME to the §7.1 table (every row names its file's
// runtime count, every runtime file has a row) — but a source file with NO
// test never enters the runtime, so the bidirectional map never asks about
// it. Nothing compared the CLAIM's universal to the SOURCE-side ground truth.
//
// Ground truth: the fs + the test-import graph —
//   - the fs enumeration of src/lib/*.ts (the seams that exist);
//   - for each mapped entry, the named test file's IMPORT STATEMENTS
//     (resolved: relative forms against the test's directory + the @/ alias
//     to src/) must actually import the mapped source. The map is honest,
//     not a naming convention.
//
// The three-sided design (the s53 precedent):
//   pin 1 — the fs boundary: a NEW seam lands unmapped -> FAILS LOUDLY until
//           it is either mapped (with a test that imports it) or excluded
//           with a comment naming why it is not a pure seam (the db.ts
//           precedent: the side-effectful Prisma-client holder whose pure
//           URL rule lives in db-path.ts, mapped + tested).
//   pin 2 — the map verification: every mapped test exists AND imports its
//           source (two-sided: existence + the import).
//   pin 3 — the exclusion exactness + the claim-presence: a stale exclusion
//           fails, a both-listed file fails, and the PAD §7.3 claim site
//           keeps its universal text AND names this pin (the sentence
//           cannot be silently weakened — the s52 coherence form).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

/** The MAP: source seam -> the unit test that covers it (the single source,
 *  explicit — the s41 allow-list pattern, never a naming-convention guess). */
const MAP: Record<string, string> = {
  "src/lib/api-methods.ts": "tests/api-methods.test.ts",
  "src/lib/auth.ts": "src/lib/__tests__/auth.test.ts",
  "src/lib/constants.ts": "src/lib/__tests__/domain.test.ts",
  "src/lib/db-path.ts": "tests/db-path.test.ts",
  "src/lib/redirect.ts": "src/lib/__tests__/redirect.test.ts",
  "src/lib/route-head.ts": "src/lib/__tests__/route-head.test.ts",
  "src/lib/utils.ts": "src/lib/__tests__/utils.test.ts",
  "src/lib/validation.ts": "src/lib/__tests__/domain.test.ts",
};

/** The EXCLUSIONS: src/lib files that are NOT pure seams, each with its
 *  named reason. db.ts — the side-effectful Prisma-client holder (the
 *  process.env assignment + the client instantiation); its pure URL rule
 *  lives in src/lib/db-path.ts (mapped, unit-tested by db-path.test.ts). */
const EXCLUSIONS: Record<string, string> = {
  "src/lib/db.ts": "the side-effectful Prisma-client holder; its pure URL rule lives in db-path.ts (mapped)",
};

/** The fs enumeration of the seam candidates: src/lib/*.ts, tests excluded. */
function seamCandidates(): string[] {
  return readdirSync(path.join(repoRoot, "src/lib"), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => `src/lib/${e.name}`);
}

/** Resolve every import specifier in a test file; true if one resolves to
 *  the source (relative forms against the test's dir + the @/ alias). */
function testImports(testPath: string, sourcePath: string): boolean {
  const t = readFileSync(path.join(repoRoot, testPath), "utf8");
  const tfDir = path.dirname(path.join(repoRoot, testPath));
  const srcAbs = path.join(repoRoot, sourcePath);
  for (const m of t.matchAll(/(?:from\s+|require\()["']([^"']+)["']/g)) {
    const s = m[1];
    let abs: string | null = null;
    if (s.startsWith("@/")) abs = path.join(repoRoot, "src", s.slice(2));
    else if (s.startsWith(".")) abs = path.resolve(tfDir, s);
    if (abs) {
      for (const cand of [abs, `${abs}.ts`, `${abs}.tsx`])
        if (cand === srcAbs) return true;
    }
  }
  return false;
}

/** The PAD §7.3 section, sliced between its heading and the next. */
function section73(): string {
  const pad = readFileSync(path.join(repoRoot, "Project_Architecture_Document.md"), "utf8");
  const start = pad.indexOf("### 7.3 Coverage Thresholds");
  expect(start, "the PAD must carry the §7.3 Coverage Thresholds heading").toBeGreaterThanOrEqual(0);
  const rest = pad.slice(start);
  return rest.slice(0, rest.indexOf("\n### ", 1));
}

describe("session 54: the source-side coverage pins (the coverage-completeness closure)", () => {
  it("pin 1 — the fs boundary: every src/lib seam is mapped or excluded (a new seam fails loudly)", () => {
    const covered = new Set([...Object.keys(MAP), ...Object.keys(EXCLUSIONS)]);
    const unmapped = seamCandidates().filter((f) => !covered.has(f));
    expect(
      unmapped,
      "src/lib seams with no unit test — map each (a test that imports it) or exclude it with a comment naming why it is not a pure seam (the db.ts precedent)",
    ).toEqual([]);
  });

  it("pin 2 — the map verification: every mapped test exists AND imports its source", () => {
    for (const [src, tf] of Object.entries(MAP)) {
      expect(existsSync(path.join(repoRoot, tf)), `the mapped test ${tf} does not exist (fs) — ${src} has no unit test`).toBe(true);
      expect(testImports(tf, src), `the mapped test ${tf} does not import the mapped source ${src} — the map entry is dishonest`).toBe(true);
    }
  });

  it("pin 3 — the exclusion exactness + the §7.3 claim-presence (the sentence cannot be silently weakened)", () => {
    for (const [excl] of Object.entries(EXCLUSIONS)) {
      expect(existsSync(path.join(repoRoot, excl)), `the exclusion ${excl} is stale (not on the fs)`).toBe(true);
      expect(!(excl in MAP), `${excl} is both mapped and excluded — a contradiction`).toBe(true);
    }
    const s73 = section73();
    expect(s73.includes("every pure seam in `src/lib/` is unit-tested"), "the §7.3 universal claim text is missing (it cannot be silently weakened)").toBe(true);
    expect(s73.includes("tests/pad-coverage-contract.test.ts"), "the §7.3 claim site must name the coverage pin (the s54 doctrine note)").toBe(true);
  });
});
