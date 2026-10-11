// Session 30 one-off — remove the s29 live-verify fixture left behind by a
// cleanup crash (the script's PrismaClient ran without DATABASE_URL in the
// ambient env; the fixture ticket + its attachment persisted in db/custom.db).
// The seed must return to the canonical 4/11/3/0 after this runs.
// (Session-30 hardening: the deterministic pin follows the repo doctrine —
// the npm scripts pin DATABASE_URL inline; the pin is authoritative.)
process.env.DATABASE_URL = "file:../db/custom.db";
const { PrismaClient } = await import("@prisma/client");

const db = new PrismaClient();

const att = await db.attachment.deleteMany({
  where: { fileName: "s29-probe.txt" },
});
const tickets = await db.ticket.deleteMany({
  where: { title: { contains: "s29 live-verify" } },
});
const comments = await db.comment.deleteMany({
  where: { content: { contains: "s29 live-verify grammar probe" } },
});

console.log("deleted:", {
  attachments: att.count,
  tickets: tickets.count,
  comments: comments.count,
});
const [u, t, c, a] = await Promise.all([
  db.user.count(),
  db.ticket.count(),
  db.comment.count(),
  db.attachment.count(),
]);
console.log(`canonical seed check: users=${u} tickets=${t} comments=${c} attachments=${a}`);
await db.$disconnect();
