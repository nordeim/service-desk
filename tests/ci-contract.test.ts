import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 45 — the CI-contract pins (P1: the unpinned workflow surface)
//
// Contract under test (documented in the workflow's own comments, AGENTS.md,
// CLAUDE.md, and the s18/s44 remediation plans, but held by comments alone
// before session 45): the CI workflow is a contract surface like any other
// file — and it carries THREE silent-failure flags plus the s44 governance
// claim:
//
//   1. `bun install --frozen-lockfile` (BOTH jobs) — the enforcement point
//      of "the lockfile governs every byte this project executes." A
//      workflow edit that drops the flag fails NOWHERE: CI stays green
//      while every install silently floats from the lockfile — the exact
//      supply-chain class the s44 closure rejected, one YAML edit away.
//   2. `include-hidden-files: true` — the s18 fix: upload-artifact v4.4+
//      excludes hidden files by default, and the standalone build is full
//      of them (.next/standalone/.next/ + .prisma) — without the flag the
//      e2e job's restored server 500'd everything and CI stayed red for 33
//      runs while the local suite was green.
//   3. `branches: [main]` on BOTH push and pull_request — a narrowed or
//      typo'd trigger silently stops CI from running on main (stale-green
//      badge).
//   4. bun.lock carries the tsx entry — the s44 claim "the lockfile now
//      governs tsx," made testable at the unit layer (the s44 pin checks
//      package.json's devDependencies membership only; a regenerated
//      lockfile without tsx would fail only at CI install time, silently
//      locally).
//
// Pin style: code-shaped occurrence matching (the s43 mutation-C lesson — a
// bare substring check can be satisfied forever by a doc comment). The CI
// file's comments mention these flags narratively; the pins match the
// executable YAML shapes with their exact counts.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const workflowPath = path.join(repoRoot, ".github", "workflows", "ci.yml");
const lockfilePath = path.join(repoRoot, "bun.lock");

const workflow = readFileSync(workflowPath, "utf8");
const lockfile = readFileSync(lockfilePath, "utf8");

describe("the CI workflow contract (session 45)", () => {
  it("installs with --frozen-lockfile in BOTH jobs — the lockfile governs every byte CI executes", () => {
    // The code-shaped step, exactly twice: once in the verify job, once in
    // the e2e job. One job pinning while the other floats is still a
    // floating install. Line-anchored (the s43 mutation-C doctrine — a
    // commented-out step must fail this pin, not satisfy it forever).
    const occurrences = workflow.match(/^\s*run: bun install --frozen-lockfile$/gm) ?? [];
    expect(occurrences.length).toBe(2);
  });

  it("uploads the standalone artifact with include-hidden-files: true (the s18 guard)", () => {
    // upload-artifact v4.4+ EXCLUDES hidden files by default; the
    // standalone build is full of them. Without this flag the e2e job's
    // restored server 500s every page.
    // Code-shaped (the s43 mutation-C doctrine, live-rediscovered in this
    // session's mutation B): the LINE-ANCHORED, uncommented YAML form — a
    // commented-out flag must fail this pin, not satisfy it forever.
    const occurrences = workflow.match(/^\s*include-hidden-files: true$/gm) ?? [];
    expect(occurrences.length).toBe(1);
  });

  it("triggers on push AND pull_request to [main] — CI never silently stops running", () => {
    // Both trigger surfaces target main; a narrowed or typo'd branch list
    // leaves a stale-green badge with no failure anywhere. Line-anchored,
    // uncommented (the s43 mutation-C doctrine).
    const occurrences = workflow.match(/^\s*branches: \[main\]$/gm) ?? [];
    expect(occurrences.length).toBe(2);
  });

  it("bun.lock carries the tsx entry — the s44 lockfile-governance claim, unit-checked", () => {
    // "the lockfile now governs tsx" (claimed in three docs) — the
    // code-shaped entry in bun.lock, not just the package.json membership
    // the s44 pin checks.
    expect(lockfile).toContain('"tsx": ["tsx@');
  });

  // -------------------------------------------------------------------------
  // Session 66 — pins 5 + 6 (P1: the CI RUNNER/TOOLCHAIN PINNING SURFACE)
  //
  // The workflow carried `runs-on: ubuntu-latest` in both jobs and
  // `bun-version: latest` in both setup-bun steps since its first commit —
  // while AGENTS.md claimed CI "runs the same gate on every push/PR to
  // main" and "Bun is the documented runtime". The environment under the
  // gate floated freely: the s65 closeout run #38948165037 failed at the
  // Install-dependencies step on a runner image in flux (the Node-20
  // deprecation + the ubuntu-latest -> Ubuntu-26 migration notices, the
  // migration effective 2026-10-19), and `bun-version: latest` drifts the
  // CI toolchain away from the local gate's bun (1.3.14) with zero repo
  // changes. The s45 pins above hold the workflow's silent-failure
  // surface; these two hold its ENVIRONMENT IDENTITY.
  // -------------------------------------------------------------------------

  it("pin 5: both jobs pin the runner OS — never ubuntu-latest, both jobs the SAME literal", () => {
    // Line-anchored, uncommented (the s43 mutation-C doctrine): exactly two
    // runs-on lines (one per job), none of them the floating ubuntu-latest.
    const pinnedRuns = workflow.match(/^\s*runs-on: (\S+)\s*$/gm) ?? [];
    expect(
      pinnedRuns.length,
      "exactly 2 runs-on lines expected (one per job) — a job added or renamed must consciously extend this pin",
    ).toBe(2);
    const osLiterals = pinnedRuns.map((l) => l.replace(/^\s*runs-on:\s*/, "").trim());
    expect(
      osLiterals.includes("ubuntu-latest"),
      'no job may run on the floating "ubuntu-latest" — pin the OS image (the s66 class: the runner flip of 2026-10-19 changes CI behavior with zero repo changes while every local gate stays green)',
    ).toBe(false);
    expect(
      new Set(osLiterals).size,
      `both jobs must carry the SAME pinned runner literal (a one-job drift is a split CI environment) — found ${JSON.stringify(osLiterals)}`,
    ).toBe(1);
    // And the pinned literal is a concrete OS image, not a bare label that
    // could resolve differently later (ubuntu-24.04 today; a deliberate
    // future bump changes BOTH lines together).
    expect(
      osLiterals[0],
      "the runner literal must be a concrete versioned image (e.g. ubuntu-24.04), never a floating alias",
    ).toMatch(/^ubuntu-\d+\.\d+$/);
  });

  it("pin 6: both setup-bun steps pin a concrete bun version — never latest, both steps the SAME literal", () => {
    // Line-anchored, uncommented (the s43 mutation-C doctrine): exactly two
    // bun-version lines (one per job), none of them the floating `latest`.
    const pinnedBuns = workflow.match(/^\s*bun-version: (\S+)\s*$/gm) ?? [];
    expect(
      pinnedBuns.length,
      "exactly 2 uncommented bun-version lines expected (one per setup-bun step) — a commented-out pin must fail this pin, not satisfy it forever",
    ).toBe(2);
    const bunLiterals = pinnedBuns.map((l) => l.replace(/^\s*bun-version:\s*/, "").trim());
    expect(
      bunLiterals.includes("latest"),
      'no setup-bun step may use bun-version: latest — the CI toolchain must be pinned (the s66 class: the local gate runs a documented bun while CI floats; the reproducibility claim "CI runs the same gate" held by prose alone)',
    ).toBe(false);
    expect(
      new Set(bunLiterals).size,
      `both setup-bun steps must carry the SAME pinned bun version (a one-step drift is a split CI toolchain) — found ${JSON.stringify(bunLiterals)}`,
    ).toBe(1);
    // The pinned literal is a concrete semver — a floating tag, a range, or
    // a dist tag all fail (the local/CI parity is checkable, not aspirational).
    expect(
      bunLiterals[0],
      "the bun version must be a concrete semver (N.N.N) — ranges and dist-tags float",
    ).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
