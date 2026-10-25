import { PrismaClient } from "@prisma/client";

// S90: the round-trip probe cleanup — verifies the probe ticket exists with the
// exact S90 title + category, prints the row, then deletes it (the s78 lineage).
const prisma = new PrismaClient();

async function main() {
  const title = "S90 remediation probe ticket";
  const found = await prisma.ticket.findFirst({ where: { title } });
  console.log("probe found:", JSON.stringify(found ? {
    id: found.id,
    title: found.title,
    status: found.status,
    category: found.category,
  } : null));
  if (!found) {
    console.log("PROBE NOT FOUND — the round-trip FAILED to create it");
    process.exitCode = 1;
  } else {
    const ok = found.status === "open" && found.category === "hardware";
    console.log("probe shape ok (open + hardware):", ok);
    if (!ok) process.exitCode = 1;
    await prisma.ticket.delete({ where: { id: found.id } });
    console.log("probe deleted");
  }
  const count = await prisma.ticket.count();
  console.log("tickets after cleanup:", count);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
