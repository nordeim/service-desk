// Dashboard stats — computed for the signed-in user ("Your tickets" cards)
// and globally (the sidebar's QUICK STATS block), plus the average
// resolution-time metric over the user's resolved/closed tickets.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [mine, global] = await Promise.all([
    db.ticket.findMany({
      where: { createdById: user.id },
      select: { status: true, createdAt: true, updatedAt: true },
    }),
    db.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const count = (status: string) =>
    mine.filter((t) => t.status === status).length;

  const resolvedDurations = mine
    .filter((t) => t.status === "resolved" || t.status === "closed")
    .map((t) => t.updatedAt.getTime() - t.createdAt.getTime());
  const avgResolutionMs =
    resolvedDurations.length > 0
      ? resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length
      : null;

  const globalCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
  for (const g of global) {
    const n = g._count._all;
    globalCounts.total += n;
    if (g.status === "open") globalCounts.open = n;
    else if (g.status === "in_progress") globalCounts.in_progress = n;
    else if (g.status === "resolved") globalCounts.resolved = n;
    else if (g.status === "closed") globalCounts.closed = n;
  }

  return NextResponse.json({
    mine: {
      total: mine.length,
      open: count("open"),
      in_progress: count("in_progress"),
      resolved: count("resolved"),
      closed: count("closed"),
    },
    global: globalCounts,
    avgResolutionMs,
  });
}
