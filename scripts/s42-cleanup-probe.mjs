// Cleanup the S42 probe ticket + verify seed canonical
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const del = await db.ticket.deleteMany({ where: { title: { contains: "S42 audit probe" } } });
const counts = {
  users: await db.user.count(),
  tickets: await db.ticket.count(),
  comments: await db.comment.count(),
};
console.log("deleted:", del.count, "counts:", JSON.stringify(counts));
await db.$disconnect();
