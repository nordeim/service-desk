import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 49 — the PAD §7.1 test-distribution pins (P1: the per-file
// test-count class — the s85 shortlist's leading candidate, CONFIRMED
// ACTIVE DRIFT)
//
// Contract under test: the PAD §7.1 "Test Distribution" table claims a
// per-file breakdown of the corpus — and the s49 audit found SIX defects
// the totals-only drift watch could never see: three stale counts
// (domain.test.ts 61 vs the runtime 75; headers-config.test.ts 4 vs 9;
// auth.spec.ts 9 vs the --list 11) and three MISSING rows (api-catchall
// 19, proxy-fromurl 8, body-size 11 — the s33/s35/s36 unit files absent
// from the table entirely). The table's Vitest rows summed to 194 against
// the canonical 251 the corpus pins held — the totals were consistent
// while the distribution rotted.
//
// Ground truth: the RUNTIME, not a static count (the s48 non-goal
// doctrine — measured: `vitest list` undercounts each-generated tests
// 226 vs the runtime 251, so only a RUN is the truth):
//   - the unit side: a NESTED `vitest run --reporter=json` — the same
//     suite the gate itself executes, its JSON report carrying per-file
//     assertion counts;
//   - the E2E side: `playwright test --list` — Playwright expands
//     test.each at collection time, so the list IS the per-file runtime
//     truth (measured identical to the run: 198); it boots no server and
//     runs no global-setup (0.7s, side-effect-free, measured).
//
// Recursion guard: the nested vitest run includes THIS file (the config
// matches tests/**/*.test.ts), which would spawn another nested run —
// unbounded. The SD_PAD_NESTED sentinel bounds the depth at 1: the spawn
// sets it, and the pins below return trivially (passing, still counted)
// when they see it — so the nested JSON reports this file's true test
// count and the §7.1 row for the pin file is held by the pin itself.
//
// Workers are bounded (--max-workers=4) for CI's runners: the nested run
// shares the box with the outer suite's own workers.
//
// The corpus TOTALS stay pinned by the s48 corpus-count family (the
// 9-site unit family, the 10-site E2E family); these pins close the
// DISTRIBUTION side: per-file counts bidirectionally — every row names
// the runtime count of its file, and every runtime file has a row (the
// missing-row class).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

/** The re-entrancy sentinel — set on the nested spawn, seen by this file. */
const NESTED = process.env.SD_PAD_NESTED === "1";

/** The PAD §7.1 table's live text, sliced between its heading and the next. */
function section71(): string {
  const pad = readFileSync(path.join(repoRoot, "Project_Architecture_Document.md"), "utf8");
  const start = pad.indexOf("### 7.1 Test Distribution");
  expect(start, "the PAD must carry the §7.1 Test Distribution heading").toBeGreaterThanOrEqual(0);
  const rest = pad.slice(start);
  const end = rest.indexOf("\n### ", 1);
  return end === -1 ? rest : rest.slice(0, end);
}

/** One parsed §7.1 row: the backticked Location path, the Tests figure, the framework. */
interface Row {
  location: string;
  tests: number;
  framework: string;
}

/** Parse the §7.1 table rows (| Category | Files | Tests | Location | Framework |). */
function parseRows(): Row[] {
  const rows: Row[] = [];
  for (const line of section71().split("\n")) {
    if (!line.startsWith("| ")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // ['', category, files, tests, location, framework, '']
    if (cells.length < 7) continue;
    const framework = cells[5] ?? "";
    if (framework !== "Vitest" && framework !== "Playwright" && framework !== "bash + curl") continue;
    const loc = /\`([^\`]+)\`/.exec(cells[4] ?? "");
    if (!loc) continue;
    const num = /(\d+)/.exec(cells[3] ?? "");
    if (!num) continue;
    rows.push({ location: loc[1] as string, tests: Number(num[1]), framework });
  }
  return rows;
}

/** Run vitest in the repo root; returns stdout (propagates failures). */
function runNestedVitest(): void {
  try {
    execFileSync(
      "bunx",
      [
        "vitest",
        "run",
        "--reporter=json",
        "--outputFile=.vitest/pad-counts.json",
        "--max-workers=4",
      ],
      { cwd: repoRoot, env: { ...process.env, SD_PAD_NESTED: "1" }, stdio: "pipe", timeout: 300_000 },
    );
  } catch {
    // The nested run may fail elsewhere (the gate is red anyway); the JSON
    // report is still written — the counts are what these pins test. A
    // missing report (a crashed run) surfaces as the readFileSync throw.
  }
}

/** The per-file RUNTIME unit counts: { relativePath: assertionCount }. */
function unitRuntimeCounts(): Map<string, number> {
  const reportPath = path.join(repoRoot, ".vitest", "pad-counts.json");
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
    testResults: { name: string; assertionResults: unknown[] }[];
  };
  const counts = new Map<string, number>();
  for (const file of report.testResults) {
    const rel = file.name.replace(repoRoot + path.sep, "");
    counts.set(rel, file.assertionResults.length);
  }
  return counts;
}

/** The per-file E2E counts from `playwright test --list` (test.each expanded). */
function e2eRuntimeCounts(): Map<string, number> {
  const out = execFileSync("bunx", ["playwright", "test", "--list"], {
    cwd: repoRoot,
    stdio: "pipe",
    timeout: 120_000,
  }).toString();
  const counts = new Map<string, number>();
  for (const m of out.matchAll(/› (\S+\.spec\.ts):\d+:\d+|› (\S+\.setup\.ts):\d+:\d+/g)) {
    const file = (m[1] ?? m[2]) as string;
    // --list prints testDir-relative paths; the PAD rows use repo-relative.
    const rel = file.startsWith("tests/") ? file : `tests/e2e/${file}`;
    counts.set(rel, (counts.get(rel) ?? 0) + 1);
  }
  return counts;
}

/** Bidirectional comparison: every row matches its runtime count; every runtime file has a row. */
function expectDistributionMatches(
  label: string,
  rows: Row[],
  runtime: Map<string, number>,
): void {
  const claimed = new Map(rows.map((r) => [r.location, r.tests] as const));
  // Direction 1: every row's figure equals the runtime count of its file.
  for (const [location, tests] of claimed) {
    const actual = runtime.get(location);
    expect(
      actual,
      `${label}: the §7.1 row for ${location} claims ${tests} tests — the runtime count is ${actual ?? "MISSING (the row names a file the suite no longer runs)"}`,
    ).toBe(tests);
  }
  // Direction 2: every runtime file has a row (the missing-row class).
  for (const [location, actual] of runtime) {
    expect(
      claimed.has(location),
      `${label}: the suite runs ${location} (${actual} tests) with NO §7.1 row — the missing-row drift the s49 audit caught (api-catchall / proxy-fromurl / body-size)`,
    ).toBe(true);
  }
}

describe("the PAD §7.1 test-distribution contract (session 49)", () => {
  it("every §7.1 Vitest row names the runtime per-file count, and every runtime test file has a row (the nested-run ground truth)", { timeout: 300_000 }, () => {
    if (NESTED) return; // the re-entrancy guard: trivially pass inside the nested run
    runNestedVitest();
    const rows = parseRows().filter((r) => r.framework === "Vitest");
    expect(rows.length, "the §7.1 table must carry at least 21 Vitest rows (a dropped row fails loudly)").toBeGreaterThanOrEqual(21);
    expectDistributionMatches("the unit distribution", rows, unitRuntimeCounts());
  });

  it("every §7.1 Playwright row names the --list per-file count, and every listed spec has a row (the 9-vs-11 auth.spec drift closed)", () => {
    if (NESTED) return; // the re-entrancy guard
    const rows = parseRows().filter((r) => r.framework === "Playwright");
    expect(rows.length, "the §7.1 table must carry at least 6 Playwright rows").toBeGreaterThanOrEqual(6);
    expectDistributionMatches("the E2E distribution", rows, e2eRuntimeCounts());
  });

  it("the §7.1 smoke row's step figure agrees with the corpus family (the row joins the s48 121 family)", () => {
    if (NESTED) return; // the re-entrancy guard
    const smokeRows = parseRows().filter((r) => r.framework === "bash + curl");
    expect(smokeRows, "the §7.1 table must carry exactly one API-smoke row").toHaveLength(1);
    // The corpus canonical the s48 smoke family holds across its 4 sites.
    expect(smokeRows[0]?.tests).toBe(121);
  });
});
