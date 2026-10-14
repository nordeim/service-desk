// S49: verify the probe ticket + cleanup + the canonical seed check (the s45–s48 lineage)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const probes = await prisma.ticket.findMany({
    where: { title: { contains: "S49" } },
    select: { id: true, title: true, status: true, category: true },
  });
  console.log("probes:", JSON.stringify(probes));
  for (const probe of probes) {
    await prisma.comment.deleteMany({ where: { ticketId: probe.id } });
    await prisma.attachment.deleteMany({ where: { ticketId: probe.id } });
    await prisma.ticket.delete({ where: { id: probe.id } });
  }
  if (probes.length > 0) console.log("probes cleaned");
  const counts = {
    users: await prisma.user.count(),
    tickets: await prisma.ticket.count(),
    comments: await prisma.comment.count(),
  };
  console.log("seed canonical:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
