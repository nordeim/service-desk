import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

// ---------------------------------------------------------------------------
// Session 60 — the scripts-integrity pins (P1: the UNDEFINED-NAME LINEAGE
// class — the battery generator's blind-replace bug)
//
// Contract under test: the repo's scripts/ family is a DURABLE artifact
// corpus (the s42+ convention: every session's analysis scripts are
// committed), and the doc corpus' wave figures cite them as their
// reproducers. The s60 fresh-clone baseline found the class live: the
// make-battery generators derive each session's wave-analysis script from
// the prior session's copy via .replace() on their OWN session-pair
// variable vocabulary — and any OLDER leftover name on a line survives
// every generation untouched:
//
//   scripts/s58-wave-analysis.py:24  added = cur_b - s56_b   ← s56_b NOWHERE
//   scripts/s59-wave-analysis.py:24  added = cur_b - s56_b   ← s56_b NOWHERE
//
// Both committed scripts crashed with NameError the moment their /tmp
// inputs existed — the s58/s59 wave figures were produced from in-flight
// fixed copies that never landed (the durability gap; the s57 one-session-
// lag lineage-bug precedent, now at the variable level). Measured by
// scripts/s60-audit-undefined-names.py: 75 scripts scanned, exactly 2
// undefined-name loads — both the live class (the s57/s60 copies CLEAN).
//
// Ground truth: the AST itself. scripts/check-undefined-names.py (the
// standing helper) parses every scripts/*.py and reports every name LOADED
// but defined NOWHERE in its file (assignments, def/class, imports,
// parameters, exception binds, global/nonlocal, builtins, dunders all
// count as definitions). The helper's honest boundary: it collects ALL
// stores — module AND nested scopes — into one defined-anywhere set, so a
// name defined in one function and loaded in another passes; the observed
// class is defined-NOWHERE, and that is caught exactly (the boundary is
// documented in both the helper and here so the over-acceptance cannot
// masquerade as scope-precision).
//
// skills/ is excluded (the repo convention: the skills/ folder is outside
// code checking and testing).
// ---------------------------------------------------------------------------

// The scanned-files floor: the family carried 75 scripts at s60 (76 with
// the helper itself). An emptied scripts/ folder must fail loudly instead
// of vacuous-passing (the s56 mapDeps lesson). Recalibrated at s61:
// 83 .py measured (the s61 battery + the new .py helper).
const SCANNED_FLOOR = 75;

// The wave-analysis family floor: the battery convention regenerates one
// wave-analysis script per session (s57..s61 measured at s61). The
// live bug lived exactly here for two generations — the family's shape is
// the pin's own subject.
const WAVE_FAMILY_FLOOR = 5;

// The per-language syntax floors (pin 3, the s61 language-symmetry closure):
// the vacuous-pass guards — an emptied language family fails loudly instead
// of vacuous-passing (the s56 mapDeps lesson). Calibrated at s61: 132 .sh /
// 125 .mjs / 18 .ts measured.
const SH_FLOOR = 120;
const MJS_FLOOR = 115;
const TS_FLOOR = 15;

interface SyntaxReport {
  ok: boolean;
  scanned: { sh: number; mjs: number; ts: number };
  offenders: { file: string; tool: string; message: string }[];
}

interface CheckerReport {
  scanned: number;
  total: number;
  offenders: Record<string, { line: number; name: string }[]>;
}

function runChecker(): CheckerReport {
  // spawnSync (never execFileSync): the helper exits 1 when offenders exist
  // (--check form) — an execFileSync call would THROW "Command failed" and
  // swallow the machine-readable report; the pin must read the JSON either
  // way and do its own failing (the in-flight mutation observation caught
  // the shape: the bite must NAME the offenders, not the exit code).
  const r = spawnSync(
    "python3",
    ["scripts/check-undefined-names.py", "--check", "--json"],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, cwd: process.cwd() },
  );
  if (r.error) {
    throw new Error(`the checker could not run: ${r.error.message}`);
  }
  if (r.status !== 0 && r.status !== 1) {
    throw new Error(
      `the checker exited with an unexpected status ${r.status} (0 = clean, 1 = offenders found — anything else is a checker defect): ${r.stderr}`,
    );
  }
  const stdout = r.stdout;
  try {
    return JSON.parse(stdout) as CheckerReport;
  } catch {
    throw new Error(
      `the checker's --json output did not parse (the machine-readable contract): ${stdout.slice(0, 300)}`,
    );
  }
}

function runSyntaxChecker(): SyntaxReport {
  // The same spawnSync + JSON-either-way contract as runChecker (the s60
  // execFileSync-throw lesson: the helper exits 1 when offenders exist — the
  // pin must read the JSON either way and NAME the offenders itself).
  const r = spawnSync(
    "python3",
    ["scripts/check-syntax.py", "--check", "--json"],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, cwd: process.cwd() },
  );
  if (r.error) {
    throw new Error(`the syntax checker could not run: ${r.error.message}`);
  }
  if (r.status !== 0 && r.status !== 1) {
    throw new Error(
      `the syntax checker exited with an unexpected status ${r.status} (0 = clean, 1 = offenders found — anything else is a checker defect): ${r.stderr}`,
    );
  }
  try {
    return JSON.parse(r.stdout) as SyntaxReport;
  } catch {
    throw new Error(
      `the syntax checker's --json output did not parse (the machine-readable contract): ${r.stdout.slice(0, 300)}`,
    );
  }
}

describe("session 60+61: the scripts-integrity pins (the committed scripts' own-name + own-syntax contracts)", () => {
  it("pin 1: every committed scripts/*.py passes the static undefined-name check (a loaded name is defined in its file, imported, a param, a builtin, or a dunder)", () => {
    const report = runChecker();

    // The vacuous-pass guard: an emptied scripts/ folder scans zero files
    // and reports zero offenders — the floor fails it loudly.
    expect(
      report.scanned,
      `the scanned-files floor: expected >= ${SCANNED_FLOOR} scripts/*.py scanned, found ${report.scanned} — the scripts/ corpus changed shape (the family is a durable artifact corpus, not an optional one)`,
    ).toBeGreaterThanOrEqual(SCANNED_FLOOR);

    const offenderLines = Object.entries(report.offenders).flatMap(([file, errs]) =>
      errs.map((e) => `${file} line ${e.line}: \`${e.name}\` is loaded but never defined in the file`),
    );
    if (offenderLines.length > 0) {
      throw new Error(
        `committed scripts with undefined-name loads: ${offenderLines.join("; ")}. ` +
          `A script that references a name defined nowhere in itself cannot have produced the figures the docs cite for it — the s56_b lineage class (the make-battery's blind .replace() propagates stale names across generations). ` +
          `Fix the script's own vocabulary (the variable its file actually defines), or commit the copy that really ran.`,
      );
    }
    expect(report.total).toBe(0);
  });

  it("pin 2: the wave-analysis family floor — the battery convention's per-session scripts form a sequence on the fs (>= 4 s*-wave-analysis.py files)", () => {
    const family = readdirSync("scripts").filter((f) => /^s\d+-wave-analysis\.py$/.test(f)).sort();
    expect(
      family.length,
      `the wave-analysis family floor: expected >= ${WAVE_FAMILY_FLOOR} scripts/s*-wave-analysis.py files, found ${family.length} (${family.join(", ") || "none"}) — ` +
        `the battery convention regenerates one wave-analysis script per session (the s57 origin); the family is a sequence, and the live s56_b bug lived exactly here for two generations`,
    ).toBeGreaterThanOrEqual(WAVE_FAMILY_FLOOR);
    // The sequence shape: the family carries the s57..s61 quintuple at s61
    // (numbered, no gaps inside its own span — the doc-enumeration
    // doctrine applied to the scripts family).
    const nums = family.map((f) => Number(/^s(\d+)-/.exec(f)?.[1])).sort((a, b) => a - b);
    for (let i = 1; i < nums.length; i++) {
      expect(
        nums[i] - nums[i - 1],
        `the wave-analysis family has an interior gap: ${nums[i - 1]} -> ${nums[i]} (the per-session sequence must be contiguous inside its span)`,
      ).toBe(1);
    }
  });

  it("pin 3: every committed scripts/*.sh + *.mjs + *.ts passes its language's standard static check (the s61 language-symmetry closure)", () => {
    const report = runSyntaxChecker();

    // The per-language vacuous-pass guards: an emptied language family scans
    // zero files and reports zero offenders — the floors fail it loudly.
    expect(
      report.scanned.sh,
      `the .sh floor: expected >= ${SH_FLOOR} scripts/*.sh scanned, found ${report.scanned.sh} — the scripts/ corpus changed shape`,
    ).toBeGreaterThanOrEqual(SH_FLOOR);
    expect(
      report.scanned.mjs,
      `the .mjs floor: expected >= ${MJS_FLOOR} scripts/*.mjs scanned, found ${report.scanned.mjs} — the scripts/ corpus changed shape`,
    ).toBeGreaterThanOrEqual(MJS_FLOOR);
    expect(
      report.scanned.ts,
      `the .ts floor: expected >= ${TS_FLOOR} scripts/*.ts scanned, found ${report.scanned.ts} — the scripts/ corpus changed shape`,
    ).toBeGreaterThanOrEqual(TS_FLOOR);

    const offenderLines = report.offenders.map(
      (o) => `${o.file}: [${o.tool}] ${o.message}`,
    );
    if (offenderLines.length > 0) {
      throw new Error(
        `committed scripts failing their language's static check: ${offenderLines.join("; ")}. ` +
          `The s61 language-symmetry class: the s60 closure protected the .py family only — a syntax-broken .sh/.mjs, or a type-broken .ts, fails only at invocation (the s12 inert-guard lesson + the s58 durability-gap class at the language level). ` +
          `Fix the script, or commit the copy that really ran.`,
      );
    }
    expect(report.ok).toBe(true);
    expect(report.offenders.length).toBe(0);
  });
});
