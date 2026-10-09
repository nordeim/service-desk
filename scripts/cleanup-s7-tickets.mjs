// Delete session-7 probe tickets from the dev DB (long-title test tickets).
// ESM (session 8): the original CommonJS `.cjs` (require()) broke the ESLint
// gate — committed after the session-7 gate ran — every other repo script is
// ESM by convention.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const del = await p.ticket.deleteMany({ where: { title: { startsWith: "Extremely long" } } });
  console.log("deleted:", del.count, "remaining:", await p.ticket.count());
}
main().finally(() => p.$disconnect());
