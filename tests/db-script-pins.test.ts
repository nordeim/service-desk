import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The db-script-pin contract (Session 43 — the AGENTS.md invariant #3,
// finally guarded): every script that touches the main SQLite database
// pins `DATABASE_URL='file:../db/custom.db'` INLINE. Why: an ambient
// exported DATABASE_URL (sandboxes do this — measured, the AGENTS.md
// warning) overrides .env files; the inline pin keeps every script
// pointed at <repo>/db/custom.db deterministically. Until this test the
// invariant was held by convention alone: a script edit that dropped a
// pin failed NOWHERE locally (the developer's .env still points
// correctly) and only manifested in ambient-env sandboxes as a silently
// redirected database — the exact documented-invariant-without-a-guard
// class the s27 (param-set), s41 (allow-list), and s42 (routeAllow
// input) seams closed before this one.
//
// The pins are RULE-based, not list-based: every script named
// dev/build/start AND every db:* script must carry the pin — so a NEW
// db script added without a pin fails the rule, not an enumeration.
// The two sibling layers are pinned alongside (the same doctrine at the
// config surface): the smoke script's throwaway database and the E2E
// pair's isolated database. Together with tests/db-path.test.ts (the
// RESOLUTION logic), this file pins the LITERALS — the full
// db-location contract.
const repo = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(path.join(repo, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const scripts = pkg.scripts;

const MAIN_PIN = "DATABASE_URL='file:../db/custom.db'";
const RUNTIME_SCRIPTS = ["dev", "build", "start"] as const;
// The one db:* script that does NOT touch a database: `prisma generate`
// is schema-to-client codegen (DATABASE_URL is irrelevant to it — every
// other db:* command resolves the URL against prisma/schema.prisma).
const DB_SCRIPT_CODEGEN_EXCEPTION = "db:generate";

const smoke = readFileSync(path.join(repo, "scripts", "smoke-test.sh"), "utf8");
const playwrightConfig = readFileSync(path.join(repo, "playwright.config.ts"), "utf8");
const globalSetup = readFileSync(
  path.join(repo, "tests", "e2e", "global-setup.ts"),
  "utf8",
);

describe("the package.json db-script pins (AGENTS.md invariant #3)", () => {
  it("every runtime script (dev/build/start) carries the inline pin", () => {
    for (const name of RUNTIME_SCRIPTS) {
      expect(scripts[name], `script "${name}"`).toContain(MAIN_PIN);
    }
  });

  it("every db:* script carries the inline pin (the RULE — new db scripts fail without one; db:generate is the codegen exception)", () => {
    const dbScripts = Object.keys(scripts).filter(
      (k) => k.startsWith("db:") && k !== DB_SCRIPT_CODEGEN_EXCEPTION,
    );
    expect(dbScripts.length).toBeGreaterThanOrEqual(4);
    for (const name of dbScripts) {
      expect(scripts[name], `script "${name}"`).toContain(MAIN_PIN);
    }
  });

  it("the pin value is exactly file:../db/custom.db — db/ at the repo root", () => {
    // A corrupted pin (custom2.db, a missing quote, a different path)
    // fails the exact-substring check above; this pin states the
    // contract's target explicitly so a future reader cannot mistake
    // the assertion for an arbitrary contains-any-pin.
    expect(MAIN_PIN).toBe("DATABASE_URL='file:../db/custom.db'");
    const pinned = [...RUNTIME_SCRIPTS, ...Object.keys(scripts).filter(
      (k) => k.startsWith("db:") && k !== DB_SCRIPT_CODEGEN_EXCEPTION,
    )];
    for (const name of pinned) {
      expect(scripts[name]).toContain("DATABASE_URL='file:../db/custom.db'");
    }
  });
});

describe("the smoke script's throwaway-database pin", () => {
  it("smoke-test.sh pins DATABASE_URL=file:../db/smoke.db on the db push, the seed, and the server boot", () => {
    // Code-shaped (the env-var assignment form), NOT a bare substring:
    // a bare `file:../db/smoke.db` match is satisfiable by a comment
    // occurrence while the executable pins drift — caught by the s43
    // mutation C on the global-setup twin of this pin.
    const pins = smoke.match(/DATABASE_URL="file:\.\.\/db\/smoke\.db"/g) ?? [];
    expect(pins.length).toBeGreaterThanOrEqual(3);
  });
});

describe("the E2E pair's isolated-database pin", () => {
  it("playwright.config.ts defines file:../db/e2e.db AND wires it into the webServer env", () => {
    // The config carries the literal ONCE (the E2E_DATABASE_URL const)
    // and consumes it via `DATABASE_URL: E2E_DATABASE_URL` — pinning the
    // definition alone would let the wiring drift to a different value.
    expect(playwrightConfig).toContain('"file:../db/e2e.db"');
    expect(playwrightConfig).toContain("DATABASE_URL: E2E_DATABASE_URL");
  });

  it("tests/e2e/global-setup.ts wires DATABASE_URL: file:../db/e2e.db into the provisioning env", () => {
    // Code-shaped (the env object assignment), NOT a bare substring:
    // mutation C corrupted the executable literal to e2e2.db and the
    // bare-substring pin stayed GREEN off the doc-comment occurrence —
    // the exact false-green the mutation check exists to catch.
    expect(globalSetup).toContain('DATABASE_URL: "file:../db/e2e.db"');
  });
});
