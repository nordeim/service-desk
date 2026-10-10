// Delete session-14 probe tickets from the dev DB (download-UX probe,
// selector-probe, and canonicalization fixtures). ESM per the repo
// convention (the s8 lesson). DATABASE_URL is pinned inline the same way
// the npm scripts pin it (an ambient env var would override).
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient({
  datasources: { db: { url: "file:../db/custom.db" } },
});
async function main() {
  const del = await p.ticket.deleteMany({
    where: {
      OR: [
        { title: { startsWith: "S14 download-UX" } },
        { title: { startsWith: "Selector probe" } },
        { title: { startsWith: "Mangled selector probe" } },
        { title: { contains: "s14-probe" } },
        { title: { contains: "S14 E2E" } },
        { title: { contains: "S14 live-verify" } },
      ],
    },
  });
  console.log("deleted:", del.count, "remaining:", await p.ticket.count());
}
main().finally(() => p.$disconnect());
