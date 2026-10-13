// S43 live-verify: cleanup the probe ticket + verify the canonical seed corpus.
// Usage: node scripts/s43-cleanup.mjs  (from repo root; resolves deps via cwd)
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const db = new PrismaClient({
  datasources: { db: { url: `file:${path.join(repo, "db", "custom.db")}` } },
});

const probes = await db.ticket.findMany({
  where: { title: { startsWith: "S43 " } },
});
for (const probe of probes) {
  await db.comment.deleteMany({ where: { ticketId: probe.id } });
  await db.attachment.deleteMany({ where: { ticketId: probe.id } });
  await db.ticket.delete({ where: { id: probe.id } });
  console.log(`[s43-cleanup] deleted probe ticket ${probe.id} ("${probe.title}")`);
}
if (probes.length === 0) {
  console.log("[s43-cleanup] no probe found (already clean)");
}

const counts = {
  users: await db.user.count(),
  tickets: await db.ticket.count(),
  comments: await db.comment.count(),
};
console.log("[s43-cleanup] seed canonical:", JSON.stringify(counts));
const ok = counts.users === 4 && counts.tickets === 11 && counts.comments === 3;
console.log(ok ? "[s43-cleanup] CANONICAL 4/11/3 OK" : "[s43-cleanup] NOT CANONICAL");
await db.$disconnect();
process.exit(ok ? 0 : 1);
