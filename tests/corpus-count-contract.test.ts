import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 48 — the corpus-count consistency pins (P1: the drift-watch
// automation — the s83 shortlist's own leading candidate, finding MORE than
// the shortlist expected)
//
// Contract under test: the five docs (README, AGENTS, CLAUDE, PAD, SKILL)
// claim the test-pyramid's corpus figures in ~26 live sites — and the s48
// audit found SIX of them drifted: the SKILL's Appendix quick-reference
// blocks carried session-4-era figures ("54 unit tests", "57 E2E", "11-step
// API contract", "# 107 E2E" ×2) for 44 sessions, and README's feature
// table claimed "163 E2E parity tests" vs the actual 164 — while CLAUDE.md
// correctly said 164 (the exact partial-update failure mode: one doc
// updated, the other not).
//
// Why it drifted silently: the manual per-session drift-watch grep only
// ever checked the CURRENT value's sites (is "245" consistent across the
// docs?) — it never swept for stale-era siblings. The pins below close
// that with FAMILY-SHAPED extraction: every live claim site of a given
// figure (unit / E2E / parity / smoke-steps) must name ONE number, across
// all five docs, with a minimum-site floor so a dropped claim site fails
// loudly instead of silently shrinking the family.
//
// The values themselves (245 / 198 / 164 / 121) stay RUNTIME measures —
// re-verified by every session's gate run (the s47 smoke doctrine: the pin
// closes the DOC side of the contract; a static count of a runtime suite
// would be a false claim — measured: the parity spec's line-anchored
// `test(` count is 155, the runtime count is 164).
//
// Scope carve-outs (deliberate):
//   - the PAD §10 known-issues table is sliced OUT by boundary — the
//     historical RESOLVED rows are immutable by convention (the s47
//     doctrine: the session-47 row's "245 unit / 198 E2E / 121 smoke"
//     record stays as history, not a live claim);
//   - the SKILL project_state's historical prose ("(121 steps —" with a
//     dash, never a closing paren) is excluded by SHAPE — the smoke family
//     requires "«N» steps)" or "«N»-step" forms;
//   - per-file test counts (PAD's "15 unit tests pin the contract" for
//     db-path.test.ts) are NOT corpus claims — out of scope, on the next
//     session's shortlist.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

/** The five docs that carry live corpus claims. */
const DOC_PATHS: Record<string, string> = {
  README: path.join(repoRoot, "README.md"),
  AGENTS: path.join(repoRoot, "AGENTS.md"),
  CLAUDE: path.join(repoRoot, "CLAUDE.md"),
  PAD: path.join(repoRoot, "Project_Architecture_Document.md"),
  SKILL: path.join(repoRoot, "service-desk_SKILL.md"),
  DEPLOYMENT: path.join(repoRoot, "docs", "DEPLOYMENT.md"),
};

/** The PAD's historical known-issues section starts here (immutable rows). */
const PAD_HISTORY_BOUNDARY = "## 10. Known Issues";

/**
 * A doc's LIVE-claim text: the PAD is sliced at its §10 boundary (the
 * historical RESOLVED rows are records, not claims); every other doc is
 * taken whole.
 */
function liveDoc(name: string): string {
  const raw = readFileSync(DOC_PATHS[name], "utf8");
  if (name !== "PAD") return raw;
  const i = raw.indexOf(PAD_HISTORY_BOUNDARY);
  return i === -1 ? raw : raw.slice(0, i);
}

/** Collect one figure across a family of claim shapes (see each pin). */
function collectFamily(shapes: { doc: string; re: RegExp; group?: number }[]): string[] {
  const out: string[] = [];
  for (const { doc, re, group = 1 } of shapes) {
    const text = liveDoc(doc);
    for (const m of text.matchAll(re)) out.push(m[group] ?? "");
  }
  return out;
}

/**
 * The s48 unit family's shapes, shared by pin 1 (the family consistency)
 * and the s50 pin (the BRIDGE: the family canonical == the runtime-derived
 * §7.1 sum). Extracted in s50 so the two pins can never drift apart.
 */
const UNIT_FAMILY_SHAPES: { doc: string; re: RegExp }[] = [
  { doc: "README", re: /tests-(\d{2,4})%20unit/g }, // the badge
  { doc: "README", re: /(\d{2,4}) Vitest unit tests/g }, // verification
  { doc: "README", re: /(\d{2,4}) unit \+ \d{2,4} E2E tests/g }, // pyramid row
  { doc: "README", re: /Vitest unit: (\d{2,4}) tests/g }, // commands
  { doc: "AGENTS", re: /unit suite \((\d{2,4}) tests/g }, // commands
  { doc: "CLAUDE", re: /(\d{2,4}) unit \/ \d{2,4} E2E \(needs/g }, // commands
  { doc: "PAD", re: /`bun run test` — (\d{2,4})\//g }, // §7.4 checklist
  { doc: "SKILL", re: /project_state: (\d{2,4}) unit/g }, // project_state
  { doc: "SKILL", re: /Vitest — (\d{2,4}) unit tests/g }, // Appendix A
];

/**
 * The fs listing of the vitest include patterns: every .test.ts file under
 * src/ and tests/ (recursive). A DIRECTORY LISTING is always exact — the
 * s48 false-claim doctrine applies to counting each-generated TESTS, never
 * to counting FILES. The include patterns never pick up tests/e2e: those
 * are .spec.ts / .setup.ts files, excluded by the suffix.
 */
function unitTestFileListing(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${dir}/${e.name}`);
      else if (e.name.endsWith(".test.ts")) out.push(`${dir}/${e.name}`);
    }
  };
  walk("src");
  walk("tests");
  return out.sort();
}

/**
 * The PAD §7.1 Vitest rows' Tests-figure sum. Every row is runtime-pinned
 * per-file by the s49 pad pins (bidirectionally: every row names its file's
 * runtime count, every runtime file has a row), so the SUM is the runtime
 * total — the s50 BRIDGE's ground truth.
 */
function pad71VitestSum(): number {
  const pad = readFileSync(DOC_PATHS.PAD, "utf8");
  const start = pad.indexOf("### 7.1 Test Distribution");
  if (start < 0) throw new Error("the PAD must carry the §7.1 Test Distribution heading");
  const rest = pad.slice(start);
  const end = rest.indexOf("\n### ", 1);
  const section = end === -1 ? rest : rest.slice(0, end);
  let sum = 0;
  let rows = 0;
  for (const line of section.split("\n")) {
    if (!line.startsWith("| ")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 7) continue;
    if (cells[5] !== "Vitest") continue;
    const num = /(\d+)/.exec(cells[3] ?? "");
    if (!num) continue;
    sum += Number(num[1]);
    rows += 1;
  }
  if (rows < 21) throw new Error(`the §7.1 table must carry at least 21 Vitest rows — found ${rows}`);
  return sum;
}

/** Assert a family names exactly one number and has at least `floor` sites. */
function expectConsistent(
  label: string,
  values: string[],
  floor: number,
): string {
  expect(
    values.length,
    `${label}: at least ${floor} live claim sites must exist (a dropped site must fail loudly, not shrink the family silently) — found ${values.length}`,
  ).toBeGreaterThanOrEqual(floor);
  const unique = [...new Set(values)];
  expect(
    unique,
    `${label}: every live claim site must name ONE number (the partial-update drift the s48 audit caught: SKILL appendices at session-4 figures, README's parity figure one behind CLAUDE's) — found ${unique.join(" & ")}`,
  ).toHaveLength(1);
  return unique[0] as string;
}

describe("the corpus-count consistency contract (session 48)", () => {
  it("the unit-test count: every live claim site names ONE number (9 sites across the five docs — the stale '54' in the SKILL appendix can never return)", () => {
    // The family shapes live in UNIT_FAMILY_SHAPES (shared with the s50
    // BRIDGE pin — extracted so the two pins can never drift apart).
    const values = collectFamily(UNIT_FAMILY_SHAPES);
    const n = expectConsistent("the unit count", values, 9);
    // The current canonical (runtime-verified every session's gate): 288
    // after the s63 worklog pin 4; 291 after the s64 commands-surface pins
    // (the new tests/commands-contract.test.ts — 3 pins: the documented
    // surface, the citation resolution, the helper agreement). A suite
    // change without the doc move fails
    // the consistency check above; a doc move without the suite change
    // fails the gate itself.
    expect(Number(n)).toBe(294);
  });

  it("the E2E-test count: every live claim site names ONE number (10 sites — the stale '57' and '# 107 E2E' ×2 in the SKILL can never return)", () => {
    const values = collectFamily([
      { doc: "README", re: /%2B%20(\d{2,4})%20E2E/g }, // the badge
      { doc: "README", re: /(\d{2,4}) Playwright E2E tests/g }, // verification
      { doc: "README", re: /(\d{2,4}) E2E tests/g }, // pyramid row
      { doc: "README", re: /Playwright E2E \((\d{2,4}) tests\)/g }, // commands
      { doc: "AGENTS", re: /Playwright E2E \((\d{2,4}) tests\)/g }, // commands
      { doc: "CLAUDE", re: /\((\d{2,4}) tests, \d{2,4} of them the visual-parity/g }, // the E2E prose
      { doc: "CLAUDE", re: /(\d{2,4}) E2E \(needs/g }, // commands
      { doc: "SKILL", re: /(\d{2,4}) E2E \(needs/g }, // Appendix A
      { doc: "SKILL", re: /# (\d{2,4}) E2E\s*$/gm }, // the Appendix gate comments ×2
    ]);
    const n = expectConsistent("the E2E count", values, 10);
    expect(Number(n)).toBe(198);
  });

  it("the parity-pins count: README's feature-table claim matches CLAUDE's measured figure (the '163 vs 164' partial-update drift closed)", () => {
    // The parity figure: the actual visual-parity.spec.ts count (the
    // runtime measure, re-verified by the per-session E2E run + --list);
    // the pin holds the DOC sites consistent — CLAUDE carries the figure
    // twice (the "(N tests, M of them" form + the "spec (N tests)" form),
    // README once (the feature table). The s48 fix: 163 → 164.
    const values = collectFamily([
      { doc: "README", re: /(\d{2,4}) E2E parity tests/g },
      { doc: "CLAUDE", re: /\(\d{2,4} tests, (\d{2,4}) of them the visual-parity/g },
      { doc: "CLAUDE", re: /visual-parity\.spec\.ts` \((\d{2,4}) tests\)/g },
    ]);
    const n = expectConsistent("the parity count", values, 3);
    expect(Number(n)).toBe(164);
  });

  it("the smoke-steps count: every live claim site names ONE number (4 sites — the stale '11-step' in the SKILL appendix can never return)", () => {
    // The smoke figure is a runtime property of the server-driven script
    // (the s47 non-goal doctrine, unchanged); the pin closes the DOC side.
    // The shapes: README's "(N steps)" paren forms (verification + pyramid
    // rows), DEPLOYMENT's "N steps (local)" (the s47 line-anchored claim,
    // joining the family), the SKILL appendix's "N-step API contract".
    const values = collectFamily([
      { doc: "README", re: /\((\d{2,4}) steps\)/g },
      { doc: "DEPLOYMENT", re: /(\d{2,4}) steps \(local\)/g },
      { doc: "SKILL", re: /(\d{2,4})-step API contract/g },
    ]);
    const n = expectConsistent("the smoke count", values, 4);
    expect(Number(n)).toBe(121);
  });

  it("the README Quick Start's verify-setup output line: the quoted file/test figures name the suite's truth — the s50 BRIDGE (the family canonical is held to the runtime-pinned §7.1 sum; the '4 files / 55 tests' session-1-era drift can never return)", () => {
    // The Quick Start's Verify Setup block quotes what the three-command
    // gate prints on its last line: "ESLint clean · tsc clean · N files /
    // M tests passed". It carried the session-1-era figures ("4 files /
    // 55 tests") for 49 sessions — a claim shape no s48 family sweeps (the
    // family shapes are corpus-count forms; this line is a QUOTED-OUTPUT
    // form) — the s48 audit's own failure class at a new site: the figure
    // drifted at the session-1 era and every corpus move since (199→254)
    // skipped it because no pin named it.
    //
    // The s50 BRIDGE also closes the s48 design's blind spot: the family
    // pins hold all sites to ONE number — but if every site drifts TOGETHER
    // the family pin still passes. The s49 pads pin §7.1's rows to the
    // runtime per-file (so the §7.1 SUM is the runtime total); this pin
    // holds the quickstart line AND the family canonical to that sum —
    // a whole-family drift now fails loudly.
    const m = /(\d+) files \/ (\d+) tests passed/.exec(liveDoc("README"));
    expect(
      m,
      "the README Quick Start must carry the verify-setup output line (a dropped claim site fails loudly — the s48 floor doctrine)",
    ).toBeTruthy();
    const files = Number((m as RegExpExecArray)[1]);
    const tests = Number((m as RegExpExecArray)[2]);
    // 1. the files figure == the fs listing of the vitest include patterns.
    const listing = unitTestFileListing();
    expect(
      files,
      `the quoted file count must name the vitest include listing — the listing carries ${listing.length} files (${listing.length === 36 ? "src 5 + tests 31" : "walk src/ + tests/ for *.test.ts"})`,
    ).toBe(listing.length);
    // 2. the tests figure == the §7.1 Vitest sum (runtime-pinned per-file).
    const sum = pad71VitestSum();
    expect(
      tests,
      `the quoted test count must name the §7.1 Vitest rows' sum — the sum is ${sum} (every row runtime-pinned by the s49 pads)`,
    ).toBe(sum);
    // 3. THE BRIDGE: the family canonical == the same sum.
    const canonical = expectConsistent("the unit count (the s50 bridge)", collectFamily(UNIT_FAMILY_SHAPES), 9);
    expect(
      Number(canonical),
      "the family canonical must equal the runtime-pinned §7.1 sum — the s48 blind spot closed (a whole-family drift now fails loudly)",
    ).toBe(sum);
  });
});
