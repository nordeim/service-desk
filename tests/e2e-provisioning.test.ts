import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 44 — the e2e-provisioning pins (P1: the offline fallback closure)
//
// Contract under test (documented in AGENTS.md + implemented in
// tests/e2e/global-setup.ts): the E2E database provisioning prefers bun (the
// documented runtime) and falls back to npx for npm users. A fallback is part
// of the contract surface — so the tools it invokes must be PROJECT
// DEPENDENCIES (locally resolvable, lockfile-pinned), never registry
// assumptions. Before session 44 the seed fallback (`npx tsx`) fetched an
// unpinned tsx from the network on its first firing (measured: tsx@4.23.15
// auto-installed with the npm "not found" warning) — a documented contract
// that broke offline and ran un-audited code.
//
// Pin style: code-shaped occurrence matching (the s43 mutation-C lesson — a
// bare substring check can be satisfied forever by a doc comment).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const globalSetupPath = path.join(repoRoot, "tests", "e2e", "global-setup.ts");
const packageJsonPath = path.join(repoRoot, "package.json");

const globalSetup = readFileSync(globalSetupPath, "utf8");
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe("the e2e provisioning fallback chain (session 44)", () => {
  it("keeps the db-push pair: the bun primary and the npx fallback, in their code shape", () => {
    // The primary path: bunx (the documented runtime's package runner).
    expect(globalSetup).toContain('run("bunx prisma db push --skip-generate")');
    // The fallback path: npx, resolvable locally because prisma is a
    // project dependency (pinned below).
    expect(globalSetup).toContain('run("npx prisma db push --skip-generate")');
  });

  it("keeps the seed pair: the bun primary and the npx tsx fallback, in their code shape", () => {
    expect(globalSetup).toContain('run("bun prisma/seed.ts")');
    expect(globalSetup).toContain('run("npx tsx prisma/seed.ts")');
  });

  it("pins tsx as a devDependency — the seed fallback resolves locally, never the network", () => {
    // The offline guarantee: `npx tsx` finds the binary in
    // node_modules/.bin on any machine that ran install, so the
    // AGENTS.md-documented fallback works without registry access and
    // executes the lockfile-pinned version.
    expect(Object.keys(pkg.devDependencies)).toContain("tsx");
  });

  it("pins prisma as a dependency — the db-push fallback resolves locally the same way", () => {
    expect(Object.keys(pkg.dependencies)).toContain("prisma");
  });
});
