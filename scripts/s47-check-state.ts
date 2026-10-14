// S47: canonical seed-state check (the s45/s46 lineage)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { email: true } });
  const counts = {
    users: await prisma.user.count(),
    tickets: await prisma.ticket.count(),
    comments: await prisma.comment.count(),
  };
  console.log("seed canonical:", JSON.stringify(counts));
  console.log("users:", users.map(u => u.email).join(", "));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
