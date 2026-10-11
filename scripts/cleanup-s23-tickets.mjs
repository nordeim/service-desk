// Session 23 cleanup — removes the live-verify probe fixtures from the
// canonical db/custom.db (the s7/s14/s15/s22 cleanup-script convention):
// the "s23 live-verify create-path probe" + "s23 live-verify attachment
// probe" tickets and the s23-probe-* users.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const tickets = await db.ticket.deleteMany({
  where: { title: { startsWith: "s23 live-verify" } },
});
const users = await db.user.deleteMany({
  where: { email: { startsWith: "s23-probe-" } },
});

console.log("deleted:", { tickets: tickets.count, users: users.count });
const [userCount, ticketCount, commentCount, attachmentCount] = await Promise.all([
  db.user.count(),
  db.ticket.count(),
  db.comment.count(),
  db.attachment.count(),
]);
console.log("canonical seed check:", {
  users: userCount,
  tickets: ticketCount,
  comments: commentCount,
  attachments: attachmentCount,
});
await db.$disconnect();
