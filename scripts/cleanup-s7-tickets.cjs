// Delete session-7 probe tickets from the dev DB (long-title test tickets).
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const del = await p.ticket.deleteMany({ where: { title: { startsWith: "Extremely long" } } });
  console.log("deleted:", del.count, "remaining:", await p.ticket.count());
}
main().finally(() => p.$disconnect());
