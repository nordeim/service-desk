// Delete session-15 probe tickets from the dev DB (the cache-semantics
// fixture + the live-verify fixture). ESM per the repo convention (the s8
// lesson). DATABASE_URL is pinned inline the same way the npm scripts pin
// it (an ambient env var would override).
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient({
  datasources: { db: { url: "file:../db/custom.db" } },
});
async function main() {
  const del = await p.ticket.deleteMany({
    where: {
      OR: [
        { title: { startsWith: "S15 cache-semantics" } },
        { title: { startsWith: "S15 live-verify" } },
        { title: { contains: "S15 E2E" } },
      ],
    },
  });
  console.log("deleted:", del.count, "remaining:", await p.ticket.count());
}
main().finally(() => p.$disconnect());
