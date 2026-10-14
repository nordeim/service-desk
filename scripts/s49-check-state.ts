// S49: the canonical seed check (the standing closeout probe)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const counts = {
    users: await prisma.user.count(),
    tickets: await prisma.ticket.count(),
    comments: await prisma.comment.count(),
  };
  console.log("seed canonical:", JSON.stringify(counts));
  if (counts.users !== 4 || counts.tickets !== 11 || counts.comments !== 3) {
    console.error("FATAL: the seed is NOT canonical");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
