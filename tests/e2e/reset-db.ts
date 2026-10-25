import { PrismaClient } from "@prisma/client";

/**
 * S90 (the e2e isolation contract): the row-level scratch-database RESET.
 *
 * The seed is upsert-idempotent by natural keys — it guarantees the
 * canonical rows EXIST but never removes spec leftovers, so signup users
 * and test tickets (from aborted runs or unpaired creations) accumulated
 * across runs and leaked into every subsequent suite: the a11y spec
 * (alphabetically first) scanned a contaminated dashboard whose QUICK
 * STATS rendered two-digit counts — and the QUICK STATS amber badge's
 * REAL 2.13:1 white-on-amber (the reference's own identical palette)
 * fires axe's color-contrast rule only at 2+ characters (axe skips
 * single-grapheme text units), so the canonical single-digit state
 * passed while the accumulated state failed — a data-dependent gate.
 *
 * The reset is ROW-LEVEL (deleteMany, children first) and deliberately
 * NOT a file deletion: the E2E webServer boots BEFORE globalSetup and
 * already holds an open handle to db/e2e.db — rm'ing the file under it
 * orphans the inode (the measured failure: the specs read a stale/broken
 * database while the seed wrote a fresh file nobody served). Ordinary
 * writes through a second Prisma connection are the same class the seed
 * itself has always used — the running server sees the emptied tables
 * and the canonical re-seed on its next query.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.comment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();
    console.log("[e2e-reset] scratch database cleared (comments, tickets, users)");
  } finally {
    await prisma.$disconnect();
  }
}

main();
