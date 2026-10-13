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
});
