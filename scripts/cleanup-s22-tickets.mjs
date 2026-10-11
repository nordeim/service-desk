// Session 22 cleanup — removes the live-verify probe fixtures from the
// canonical db/custom.db (the s7/s14/s15 cleanup-script convention): the
// "s22 live-verify ownership probe" ticket and the s22-probe-* user.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ticket = await db.ticket.deleteMany({
  where: { title: "s22 live-verify ownership probe" },
});
const user = await db.user.deleteMany({
  where: { email: { startsWith: "s22-probe-" } },
});

console.log("deleted:", { tickets: ticket.count, users: user.count });
const [users, tickets, comments] = await Promise.all([
  db.user.count(),
  db.ticket.count(),
  db.comment.count(),
]);
console.log("canonical seed check:", { users, tickets, comments });
await db.$disconnect();
