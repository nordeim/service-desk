import { PrismaClient } from "@prisma/client";

// S107: the canonical seed verification (4/11/3) — the s103-probe-cleanup.ts query pattern.
const prisma = new PrismaClient();

async function main() {
  const [users, tickets, comments, attachments] = await Promise.all([
    prisma.user.count(),
    prisma.ticket.count(),
    prisma.comment.count(),
    prisma.attachment.count(),
  ]);
  console.log(`SEED: users=${users} tickets=${tickets} comments=${comments} attachments=${attachments}`);
  const canonical = users === 4 && tickets === 11 && comments === 3 && attachments === 0;
  console.log("canonical 4/11/3, zero fixtures:", canonical);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
