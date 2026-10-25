import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Playwright global setup: guarantee the isolated e2e database exists and
 * carries the demo seed, so every spec run starts from the same state.
 *
 * The database lives at <repo>/db/e2e.db (gitignored like every db/*.db).
 * `DATABASE_URL="file:../db/e2e.db"` resolves against prisma/ for the CLI
 * and against the schema anchor at runtime — one file, both tools.
 */
export default function globalSetup(): void {
  const repo = path.resolve(__dirname, "..", "..");
  const env = {
    ...process.env,
    DATABASE_URL: "file:../db/e2e.db",
  } as NodeJS.ProcessEnv;

  // Prefer bun (the documented runtime); fall back to npx tsx for npm users.
  const run = (cmd: string) =>
    execSync(cmd, { cwd: repo, env, stdio: "pipe" }).toString();

  try {
    run("bunx prisma db push --skip-generate");
  } catch {
    run("npx prisma db push --skip-generate");
  }
  // S90 (the e2e isolation contract): the ROW-LEVEL scratch-database reset
  // AFTER the schema push (the tables must exist for deleteMany — a fresh
  // clone's first run has no db/e2e.db until the push creates it), BEFORE
  // the seed — see tests/e2e/reset-db.ts for the full contract and the
  // measured failure (the accumulated-leftovers class; the file-level rm
  // alternative is UNSAFE: the webServer boots before globalSetup and
  // holds an open handle to db/e2e.db — the row-level deleteMany is the
  // same write class the seed itself has always used).
  try {
    run("bun tests/e2e/reset-db.ts");
  } catch {
    run("npx tsx tests/e2e/reset-db.ts");
  }
  try {
    run("bun prisma/seed.ts");
  } catch {
    run("npx tsx prisma/seed.ts");
  }
}
