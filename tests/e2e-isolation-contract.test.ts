import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 93 — the e2e-isolation pins (the §14 shared-state reset-leg contract)
//
// Contract under test (documented in tests/e2e/reset-db.ts + wired into
// tests/e2e/global-setup.ts at s90; the family skill §14 line: "Shared
// mutable e2e state is a time bomb — each spec owns its data or reseeds"):
// the E2E suite RESEEDS between runs — the row-level scratch-database reset
// runs in the global setup BETWEEN the schema push and the seed, answering
// the s90 measured contamination failure (31 accumulated tickets rendering
// two-digit QUICK STATS that fired the amber badge's real 2.13:1
// white-on-amber through axe's single-grapheme skip — a data-dependent gate).
//
// THE MEASURED FIND (the honest audit, this session): the mechanism is
// carried by NO pin. The s44 e2e-provisioning pins hold the db-push pair
// and the seed pair — they were never extended when s90 landed the reset
// leg between them. The removal is SILENT: the unit corpus stays green
// (nothing reads the leg), and the E2E suite does not red on the first
// contaminated run — the s90 sanctioned register entry correctly absorbs
// the two-digit amber badge (the reference ships the identical palette;
// the sanction was added "so the gate holds at every data state") — the
// same honesty that absorbs the SYMPTOM leaves the CAUSE with zero signal.
// A refactor that drops the leg, reorders it (reset-after-seed wipes the
// canonical rows; reset-before-push crashes deleteMany on a fresh clone's
// nonexistent tables — the s90-documented ordering constraint), or
// "simplifies" the script to the file-level rm form (the s90-measured
// UNSAFE alternative: the webServer boots BEFORE globalSetup and holds the
// open handle to db/e2e.db — rm'ing the file orphans the inode; the specs
// read a stale/broken database while the seed wrote a fresh file nobody
// served) shrinks the isolation contract with NO failure anywhere — the
// s92 smoke-count find's own class (a mechanism whose removal is silent).
//
// Pin style: code-shaped occurrence matching (the s43 mutation-C lesson — a
// bare substring check can be satisfied forever by a doc comment) + index
// comparison for the ordering constraint (the s90 prose contract made
// mechanical).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const globalSetupPath = path.join(repoRoot, "tests", "e2e", "global-setup.ts");
const resetDbPath = path.join(repoRoot, "tests", "e2e", "reset-db.ts");

const globalSetup = readFileSync(globalSetupPath, "utf8");
const resetDb = readFileSync(resetDbPath, "utf8");

// The provisioning chain's three legs, in their exact invocation shapes
// (the s44 chain form — bun primary, npx/npx-tsx fallback, code-shaped).
const PUSH_PRIMARY = 'run("bunx prisma db push --skip-generate")';
const RESET_PRIMARY = 'run("bun tests/e2e/reset-db.ts")';
const RESET_FALLBACK = 'run("npx tsx tests/e2e/reset-db.ts")';
const SEED_PRIMARY = 'run("bun prisma/seed.ts")';

describe("session 93: the e2e-isolation pins (the §14 shared-state reset-leg contract)", () => {
  it("pin 1: the provisioning chain carries the reset leg (the bun invocation, code-shaped)", () => {
    // The between-run reseed the §14 line demands: without this leg the
    // scratch db accumulates spec leftovers across runs (the s90 measured
    // 31-ticket contamination class) and NO gate reds — the sanctions and
    // clamps that keep the assertions honest at every data state absorb
    // the symptom. The pin is the leg's existence at the chain layer.
    expect(globalSetup).toContain(RESET_PRIMARY);
  });

  it("pin 2: the reset leg carries its fallback pair (the npx tsx form — the s44 offline chain extended to the third leg)", () => {
    // The s44 contract: every bun → npx fallback in the provisioning chain
    // must resolve LOCALLY (tsx is a pinned devDependency — pinned by the
    // s44 battery) so the documented npm-user path works without registry
    // access and executes the lockfile-pinned version. The reset leg
    // joined the chain at s90 — the fallback shape joins with it.
    expect(globalSetup).toContain(RESET_FALLBACK);
  });

  it("pin 3: the ORDERING — the reset sits strictly AFTER the schema push and strictly BEFORE the seed (the s90 constraint, measured by index)", () => {
    // The s90 prose contract made mechanical: "AFTER the schema push (the
    // tables must exist for deleteMany — a fresh clone's first run has no
    // db/e2e.db until the push creates it), BEFORE the seed (the canonical
    // rows must land on the emptied tables)". A reorder is a silent
    // shape-preserving drift: both wrong orders keep every invocation
    // string present — only the index relation catches them.
    const pushAt = globalSetup.indexOf(PUSH_PRIMARY);
    const resetAt = globalSetup.indexOf(RESET_PRIMARY);
    const seedAt = globalSetup.indexOf(SEED_PRIMARY);
    expect(pushAt).toBeGreaterThanOrEqual(0);
    expect(resetAt).toBeGreaterThan(pushAt);
    expect(seedAt).toBeGreaterThan(resetAt);
  });

  it("pin 4: the script is the row-level reset, children first (comment → ticket → user — the foreign-key-safe order)", () => {
    // The s90 row-level form: deleteMany on the three domain tables,
    // children first. The order is load-bearing (SQLite foreign-key
    // enforcement aside, the children-first order is the shape the s90
    // session measured and the convention every cleanup script in this
    // repo follows — the measured order in the source).
    const commentAt = resetDb.indexOf("prisma.comment.deleteMany()");
    const ticketAt = resetDb.indexOf("prisma.ticket.deleteMany()");
    const userAt = resetDb.indexOf("prisma.user.deleteMany()");
    expect(commentAt).toBeGreaterThanOrEqual(0);
    expect(ticketAt).toBeGreaterThan(commentAt);
    expect(userAt).toBeGreaterThan(ticketAt);
  });

  it("pin 5: the NOT-a-file-deletion guard — the script carries no file-removal form (the s90-measured UNSAFE alternative can never return silently)", () => {
    // The s90 record: "the reset is ROW-LEVEL ... and deliberately NOT a
    // file deletion: the E2E webServer boots BEFORE globalSetup and
    // already holds an open handle to db/e2e.db — rm'ing the file under it
    // orphans the inode (the measured failure: the specs read a
    // stale/broken database while the seed wrote a fresh file nobody
    // served)". A refactor to the rm form keeps every OTHER pin green —
    // only this guard names the trap.
    for (const forbidden of ["rmSync", "unlinkSync", "rm -f", "fs.rm("]) {
      expect(resetDb.includes(forbidden), `reset-db.ts must not carry the file-removal form ${forbidden!}`).toBe(false);
    }
  });

  it("pin 6: the self-executing form — the script invokes main() at module scope with the disconnect-in-finally shape (the execSync invocation contract)", () => {
    // The global setup drives the script through execSync (bun / npx tsx)
    // — the script must RUN when executed, not merely export. The
    // try/finally $disconnect shape is the same write-class hygiene the
    // seed itself carries: the connection always closes, even on a failed
    // deleteMany (a leaked pool would hang the execSync call).
    expect(resetDb).toContain("main();");
    expect(resetDb).toContain("finally {");
    expect(resetDb).toContain("prisma.$disconnect()");
  });
});
