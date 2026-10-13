// S45: verify the probe ticket + cleanup + the canonical seed check
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const probe = await prisma.ticket.findFirst({
    where: { title: { contains: "S45 probe" } },
    select: { id: true, title: true, status: true, category: true },
  });
  console.log("probe:", JSON.stringify(probe));
  if (probe) {
    await prisma.comment.deleteMany({ where: { ticketId: probe.id } });
    await prisma.attachment.deleteMany({ where: { ticketId: probe.id } });
    await prisma.ticket.delete({ where: { id: probe.id } });
    console.log("probe cleaned");
  }
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
