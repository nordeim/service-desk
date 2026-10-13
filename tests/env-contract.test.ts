import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 46 — the environment-contract pins (P1: the unpinned .env.example
// surface)
//
// Contract under test (documented in AGENTS.md "Environment" — "`.env.example`
// documents every variable" — the README environment table + the quickstart
// `cp .env.example .env`, and the operator's standing per-session task
// "create a working .env.example that matches the codebase," but held by
// MANUAL re-verification alone before session 46 — zero tests referenced
// `.env.example`):
//
//   1. documents-every-variable (code → example): every `process.env.NAME`
//      the production code reads has an ACTIVE, uncommented `NAME=` line in
//      `.env.example`. The drift scenario: a new env var lands in the code
//      (the PAD known-issues row literally proposes wiring Resend/SendGrid
//      someday) and nothing fails — the quickstart yields an app missing
//      its configuration, silently.
//   2. working-example (example → code): every ACTIVE var documented in
//      `.env.example` is actually read by the code — the bidirectional
//      "matches the codebase" contract. The reverse drift: a documented var
//      nothing reads (a stale line after a reverted feature) — dead
//      configuration that misleads every operator who sets it.
//   3. the canonical DATABASE_URL literal: `.env.example` carries the
//      db-path contract's documented entry point in its executable,
//      LINE-ANCHORED shape (the s45 hardening — a commented-out or corrupted
//      literal must FAIL the pin, never satisfy it via a comment or a
//      partial match).
//
// Pin style: code-shaped occurrence matching (the s43 mutation-C doctrine —
// a bare substring check can be satisfied forever by a doc comment; the
// commented PostgreSQL URL in `.env.example` must never count as an active
// var). NODE_ENV is excluded by design: Next.js injects it, no user sets it,
// and `.env.example`'s job is user-facing configuration.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const envExamplePath = path.join(repoRoot, ".env.example");

const envExample = readFileSync(envExamplePath, "utf8");

/** Active (uncommented, line-anchored) `NAME=` declarations in .env.example. */
const documentedVars = new Set(
  [...envExample.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]),
);

/** Recursively collect non-test source files under src/. */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__") continue; // unit-test mocks, not production reads
      files.push(...collectSourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

/** Every `process.env.NAME` referenced in non-test production code. */
function collectCodeEnvVars(): Set<string> {
  const vars = new Set<string>();
  for (const file of collectSourceFiles(path.join(repoRoot, "src"))) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      vars.add(m[1]);
    }
  }
  return vars;
}

const codeVars = collectCodeEnvVars();
// The framework's own injection — not user configuration, never documented.
const userConfigurableVars = new Set(
  [...codeVars].filter((name) => name !== "NODE_ENV"),
);

describe("the environment contract (session 46)", () => {
  it("documents every variable the code reads — .env.example is complete (AGENTS.md's claim, enforced)", () => {
    // A new code-side env var without documentation fails HERE, at the
    // layer where the fix is a one-line .env.example edit — not in a
    // broken quickstart on a cold machine months later.
    const undocumented = [...userConfigurableVars].filter(
      (name) => !documentedVars.has(name),
    );
    expect(undocumented).toEqual([]);
  });

  it("documents no dead variables — every active .env.example entry is read by the code (the working-example contract)", () => {
    // The reverse closure: `cp .env.example .env` must yield a working app
    // with no inert keys. A stale documented var (a reverted feature's
    // leftover) misleads every operator who sets it.
    const dead = [...documentedVars].filter((name) => !codeVars.has(name));
    expect(dead).toEqual([]);
  });

  it("carries the canonical DATABASE_URL literal — the db-path contract's entry point, line-anchored", () => {
    // The executable shape, exactly once, uncommented: a commented-out or
    // corrupted literal (file:../db/wrong.db) must FAIL the pin (the s45
    // line-anchoring doctrine), never satisfy it via the file's doc
    // comments or the commented PostgreSQL alternative.
    const occurrences =
      envExample.match(/^DATABASE_URL="file:..\/db\/custom\.db"$/gm) ?? [];
    expect(occurrences.length).toBe(1);
  });
});
