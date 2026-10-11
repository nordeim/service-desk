// Session 29 cleanup — removes the live-verify probe fixtures from the
// canonical db/custom.db (the s7/s14/s15/s22/s23 cleanup-script convention):
// the "S29 probe ticket" + its grammar-probe comment + the probe-s29 user.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const comments = await db.comment.deleteMany({
  where: { content: { startsWith: "S29 grammar probe" } },
});
const tickets = await db.ticket.deleteMany({
  where: { title: "S29 probe ticket" },
});
const users = await db.user.deleteMany({
  where: { email: "probe-s29@example.com" },
});

console.log("deleted:", {
  comments: comments.count,
  tickets: tickets.count,
  users: users.count,
});
const [userCount, ticketCount, commentCount] = await Promise.all([
  db.user.count(),
  db.ticket.count(),
  db.comment.count(),
]);
console.log("canonical seed check:", {
  users: userCount,
  tickets: ticketCount,
  comments: commentCount,
});
await db.$disconnect();
