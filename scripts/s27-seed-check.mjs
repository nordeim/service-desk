// Session-27 onboarding: verify the canonical seed state (4 users / 11 tickets / 3 comments / 0 attachments).
// Run from inside the repo (the s26 lesson: outside-repo scripts resolve @prisma/client from bun's global cache).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: "file:/home/z/my-project/service-desk/db/custom.db" } },
});

const [users, tickets, comments, attachments] = await Promise.all([
  db.user.count(),
  db.ticket.count(),
  db.comment.count(),
  db.attachment.count(),
]);
console.log(`users=${users} tickets=${tickets} comments=${comments} attachments=${attachments}`);
await db.$disconnect();
