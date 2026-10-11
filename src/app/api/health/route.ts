import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseNoQuery } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness + readiness probe (used by the Playwright webServer gate and any
// reverse proxy health check). Verifies the process is up AND the SQLite
// database is reachable.
export async function GET(req: Request) {
  // Session 29: the empty-grammar gate (the shared parseNoQuery seam). This
  // endpoint takes no query params; before s29 any `?probe=1`-style param
  // was silently ignored — a monitoring caller could believe it measured
  // something it didn't. Every caller (Playwright gate, smoke, CI) is bare.
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", time: new Date().toISOString() });
  } catch (err) {
    console.error("[health] database check failed:", err);
    return NextResponse.json(
      { status: "degraded", db: "down", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
