import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Session 64 — the commands-surface contract pins (P1: the execution-surface
// doc-truth — the AGENTS commands table + the five docs + the CI workflow
// held bidirectionally to package.json)
//
// Contract under test: the repo's execution surface is documented in FOUR
// places — package.json (the ground truth), the AGENTS `## Commands` table
// (the canonical documentation — the FIRST table every agent reads), the
// five core docs' `bun run <x>` citations, and the CI workflow's own
// `bun run <x>` invocations. Before session 64 the surface was pinned
// nowhere in EITHER direction, and the drift was LIVE:
//
//   - the documented side: package.json carried 13 scripts, the AGENTS
//     table documented 10 — `db:generate` (invoked by the CI workflow's own
//     "Generate Prisma client" step in BOTH jobs — a reader following
//     AGENTS.md alone could not reproduce the CI verify sequence),
//     `db:migrate`, and `test:watch` were cited in ZERO of the five docs;
//   - the citation side: clean at s64 (every doc-cited + workflow-cited
//     command resolves) — the s31 doctrine: an unpinned clean contract is a
//     future regression with no alarm. A RENAMED script (the
//     `db:migrate:prod` shape) would leave every doc citation stale with no
//     gate failing.
//
// Pin style (the s60–s63 doctrine):
//   1. the documented-surface pin: every package.json script appears in the
//      AGENTS commands table (bidirectional with floors — a dropped table
//      row fails loudly, never silently un-claiming the surface);
//   2. the citation-resolution pin: every `bun run <x>` citation across the
//      five core docs + the CI workflow resolves to a real script (each
//      offender named with file + line — the renamed-script regression);
//   3. the helper-agreement pin: the standing helper
//      scripts/check-commands.py (the --check/--json CLI contract) agrees —
//      spawnSync + JSON-either-way (the s60 execFileSync-throw lesson), its
//      own 60s timeout (the lesson-115 envelope doctrine), with the paired
//      constants (a neutered helper fails BOTH directions).
//
// Grammar note (the s64 measurement lesson): the citation regex's char
// class MUST carry digits — `test:e2e` truncates to `test:e` without them
// (the s64 measurement's own grep did exactly that).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
) as { scripts: Record<string, string> };
const scripts = Object.keys(packageJson.scripts).sort();
const scriptSet = new Set(scripts);

const agents = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");

const CORE_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "Project_Architecture_Document.md",
  "service-desk_SKILL.md",
] as const;

const WORKFLOW_PATH = ".github/workflows/ci.yml";

/** The citation grammar — digits included (test:e2e), line-anchored capture. */
const CITATION_RE = /bun run ([a-z0-9][a-z0-9:_-]*)/g;

/** The AGENTS `## Commands` section (the canonical table's home). */
function agentsCommandsSection(): string {
  const start = agents.indexOf("## Commands");
  if (start < 0) throw new Error("AGENTS.md must carry the ## Commands heading");
  const rest = agents.slice(start);
  const next = rest.indexOf("\n## ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

/** The scripts named in the AGENTS commands table — the `bun run <x>` cell
 * form or the bare `<x>` combined-cell form (the `db:seed` shape). */
function documentedInTable(): Set<string> {
  const section = agentsCommandsSection();
  const found = new Set<string>();
  for (const m of section.matchAll(/`([^`\n]+)`/g)) {
    const token = m[1].trim();
    if (token.startsWith("bun run ")) {
      const name = token.slice("bun run ".length).trim();
      if (scriptSet.has(name)) found.add(name);
    } else if (scriptSet.has(token)) {
      found.add(token);
    }
  }
  return found;
}

/** Every `bun run <x>` citation in a file → { count, stale[] } with lines. */
function citationsIn(relPath: string): {
  count: number;
  stale: { file: string; line: number; command: string }[];
} {
  const text = readFileSync(path.join(repoRoot, relPath), "utf8");
  const lines = text.split("\n");
  let count = 0;
  const stale: { file: string; line: number; command: string }[] = [];
  lines.forEach((line, i) => {
    for (const m of line.matchAll(CITATION_RE)) {
      count += 1;
      if (!scriptSet.has(m[1])) {
        stale.push({ file: relPath, line: i + 1, command: m[1] });
      }
    }
  });
  return { count, stale };
}

describe("the commands-surface contract (session 64)", () => {
  it("pin 1: every package.json script is documented in the AGENTS commands table (the canonical table — the first table every agent reads; a dropped row fails loudly, never silently un-claiming)", () => {
    // The vacuous-pass guard: the measured corpus at s64 is 13 scripts.
    expect(
      scripts.length,
      `the scripts floor: expected >= 13 package.json scripts, found ${scripts.length} — the execution surface changed shape`,
    ).toBeGreaterThanOrEqual(13);

    const documented = documentedInTable();
    const undocumented = scripts.filter((s) => !documented.has(s));

    // The documented floor: at least 10 real scripts named (the s64 measured
    // set BEFORE the fix was 10 — a table stripped to a handful fails here).
    expect(
      documented.size,
      `the documented floor: expected >= 10 scripts named in the AGENTS commands table, found ${documented.size}`,
    ).toBeGreaterThanOrEqual(10);

    if (undocumented.length > 0) {
      throw new Error(
        `undocumented scripts — package.json carries them but the AGENTS ## Commands table does not: ${undocumented.join(", ")}. ` +
          `The table is the canonical execution reference (the pin's contract source, documented in the AGENTS Session-64 section); ` +
          `an undocumented script is a command the repo runs but the docs disown — the CI workflow's own invocations must be reproducible from the table alone.`,
      );
    }
    expect(undocumented).toEqual([]);
  });

  it("pin 2: every bun-run citation across the five core docs + the CI workflow resolves to a real package.json script (the renamed-script regression fails naming file + line)", () => {
    // The five docs: each must cite at least one command (a doc that stops
    // citing any command has silently left the family — the floor).
    let docsCiting = 0;
    const stale: { file: string; line: number; command: string }[] = [];
    for (const doc of CORE_DOCS) {
      const { count, stale: docStale } = citationsIn(doc);
      if (count > 0) docsCiting += 1;
      stale.push(...docStale);
    }
    expect(
      docsCiting,
      `the citing-docs floor: expected >= 5 of the core docs to carry at least one bun-run citation, found ${docsCiting}`,
    ).toBeGreaterThanOrEqual(5);

    // The CI workflow: its bun-run invocations are commands too (the s64
    // finding: db:generate lived ONLY here — invisible to every doc).
    const wf = citationsIn(WORKFLOW_PATH);
    expect(
      wf.count,
      `the workflow floor: expected >= 6 bun-run invocations in ${WORKFLOW_PATH}, found ${wf.count}`,
    ).toBeGreaterThanOrEqual(6);
    stale.push(...wf.stale);

    if (stale.length > 0) {
      throw new Error(
        `stale bun-run citations (no such package.json script): ${stale.map((s) => `${s.file} line ${s.line}: bun run ${s.command}`).join("; ")}. ` +
          `A cited command must name a real script — fix the citation, or (if the script was renamed) move every citation with it.`,
      );
    }
    expect(stale).toEqual([]);
  });

  it("pin 3 (the helper agreement): scripts/check-commands.py reports the surface complete — ok + the paired constants (a neutered helper fails both directions)", { timeout: 60000 }, () => {
    // The spawnSync + JSON-either-way form (the s60 execFileSync-throw
    // lesson: the helper exits 1 when offenders exist — the pin reads the
    // JSON either way and NAMES the offenders itself). The 60s timeout is
    // the lesson-115 envelope doctrine.
    const r = spawnSync(
      "python3",
      ["scripts/check-commands.py", "--check", "--json"],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, cwd: repoRoot },
    );
    if (r.error) {
      throw new Error(`the commands checker could not run: ${r.error.message}`);
    }
    if (r.status !== 0 && r.status !== 1) {
      throw new Error(
        `the commands checker exited with an unexpected status ${r.status} (0 = clean, 1 = offenders found — anything else is a checker defect): ${r.stderr}`,
      );
    }
    let report: {
      ok: boolean;
      script_count: number;
      documented_count: number;
      undocumented: string[];
      stale_citations: unknown[];
      docs_citing: number;
      workflow_invocations: number;
      offenders: string[];
    };
    try {
      report = JSON.parse(r.stdout);
    } catch {
      throw new Error(
        `the commands checker's --json output did not parse (the machine-readable contract): ${r.stdout.slice(0, 300)}`,
      );
    }

    // The paired constants (the paired-constant form): the pin holds its own
    // copies of the measured floors — a neutered helper that drops its
    // floors or empties its parse fails HERE, both directions.
    expect(
      report.script_count,
      `the paired scripts constant: the helper reports ${report.script_count}, the pin holds >= 13 — a neutered parse (an empty scripts dict) fails here`,
    ).toBeGreaterThanOrEqual(13);
    expect(
      report.documented_count,
      `the paired documented constant: the helper reports ${report.documented_count}, the pin holds >= 13 — the table-complete state is the contract`,
    ).toBeGreaterThanOrEqual(13);
    expect(report.docs_citing, `the paired citing-docs constant: expected 5, found ${report.docs_citing}`).toBe(5);
    expect(
      report.workflow_invocations,
      `the paired workflow constant: expected >= 6, found ${report.workflow_invocations}`,
    ).toBeGreaterThanOrEqual(6);

    // The helper's own ok rollup — the single source of truth for future
    // checker extensions (a new offender family fails here without this
    // pin growing a bespoke assertion).
    expect(
      report.ok,
      `the commands checker reported offenders: ${report.offenders?.join(" | ") ?? JSON.stringify(report).slice(0, 400)}`,
    ).toBe(true);
  });
});
