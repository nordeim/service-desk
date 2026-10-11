// Session 31 — one-off fixture cleanup: remove the schema-audit probe
// artifacts (the probe ticket + the probe signup user) to restore the
// canonical seed corpus (4 users / 11 tickets / 3 comments / 0 attachments).
// Deterministic DATABASE_URL pin (the s30 doctrine — never trust ambient env).
process.env.DATABASE_URL = "file:../db/custom.db";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const p = new PrismaClient();
  const tickets = await p.ticket.deleteMany({ where: { title: { startsWith: "s31 schema probe" } } });
  const users = await p.user.deleteMany({ where: { email: "probe-s31@example.com" } });
  const [u, t, c, a] = await Promise.all([
    p.user.count(), p.ticket.count(), p.comment.count(), p.attachment.count(),
  ]);
  console.log(JSON.stringify({ deletedTickets: tickets.count, deletedUsers: users.count, now: { users: u, tickets: t, comments: c, attachments: a } }));
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
