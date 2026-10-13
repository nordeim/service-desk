/**
 * ServiceDesk — idempotent seed.
 *
 * Creates the demo login (demo@servicedesk.app / Demo1234!) plus a realistic
 * ticket corpus: the demo user's own tickets power the dashboard cards and
 * My Tickets, and other users' tickets power the global QUICK STATS block.
 *
 * Safe to re-run: every write is an upsert keyed on a natural key (email,
 * ticket title). Run with `bun run db:seed`.
 *
 * Session 43: the corpus data lives in prisma/seed-data.ts (pure data, no
 * side effects) so tests/seed-corpus.test.ts can pin the canonical shape
 * without executing this script. The arrays are NOT duplicated — this file
 * imports them (a relative import within prisma/, no @/ alias needed).
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync, randomBytes } from "node:crypto";
import { SEED_TICKETS, SEED_USERS } from "./seed-data";

// Reuse the same hashing rule as src/lib/auth.ts so the seeded user can
// actually sign in. Duplicated intentionally: prisma/seed.ts must not import
// app code (it runs through its own tsx/bun process with no @/ alias).
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const db = new PrismaClient();

async function main(): Promise<void> {
  const users = SEED_USERS;

  const userIds = new Map<string, string>();
  for (const u of users) {
    const row = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name }, // never overwrite an existing password hash
      create: { email: u.email, name: u.name, passwordHash: hashPassword(u.password) },
    });
    userIds.set(u.email, row.id);
  }

  for (const t of SEED_TICKETS) {
    const existing = await db.ticket.findFirst({ where: { title: t.title } });
    if (existing) continue;
    const created = await db.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdById: userIds.get(t.owner)!,
        createdAt: new Date(Date.now() - t.ageDays * 24 * 3600 * 1000),
      },
    });
    for (const c of t.comments ?? []) {
      await db.comment.create({
        data: {
          ticketId: created.id,
          authorId: userIds.get(c.author)!,
          content: c.content,
          createdAt: new Date(Date.now() - c.ageDays * 24 * 3600 * 1000),
        },
      });
    }
  }

  const counts = {
    users: await db.user.count(),
    tickets: await db.ticket.count(),
    comments: await db.comment.count(),
  };
  console.log(`[seed] idempotent run complete:`, counts);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
