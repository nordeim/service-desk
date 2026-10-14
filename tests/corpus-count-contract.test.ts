import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
    // The family shapes, per doc: the README badge (URL-encoded), the
    // verification line, the feature-table row, the commands-table comment;
    // the AGENTS commands table; the CLAUDE commands table; the PAD §7.4
    // checklist; the SKILL project_state + the Appendix quick-reference
    // (the s48 fix of the session-4-era '54').
    const values = collectFamily([
      { doc: "README", re: /tests-(\d{2,4})%20unit/g }, // the badge
      { doc: "README", re: /(\d{2,4}) Vitest unit tests/g }, // verification
      { doc: "README", re: /(\d{2,4}) unit \+ \d{2,4} E2E tests/g }, // pyramid row
      { doc: "README", re: /Vitest unit: (\d{2,4}) tests/g }, // commands
      { doc: "AGENTS", re: /unit suite \((\d{2,4}) tests/g }, // commands
      { doc: "CLAUDE", re: /(\d{2,4}) unit \/ \d{2,4} E2E \(needs/g }, // commands
      { doc: "PAD", re: /`bun run test` — (\d{2,4})\//g }, // §7.4 checklist
      { doc: "SKILL", re: /project_state: (\d{2,4}) unit/g }, // project_state
      { doc: "SKILL", re: /Vitest — (\d{2,4}) unit tests/g }, // Appendix A
    ]);
    const n = expectConsistent("the unit count", values, 9);
    // The current canonical (runtime-verified every session's gate): 251
    // after this session's 6 pins. A suite change without the doc move
    // fails the consistency check above; a doc move without the suite
    // change fails the gate itself.
    expect(Number(n)).toBe(251);
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
});
