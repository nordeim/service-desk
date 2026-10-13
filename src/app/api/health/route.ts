import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseNoQuery } from "@/lib/validation";
import { methodNotAllowed, optionsNoContent } from "@/lib/api-methods";

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

// Session 40: the 405 JSON-boundary stubs (the s40 seam — the method-level
// completion of the s33 path-level doctrine: a wrong method answers the house
// {error} envelope + the RFC-mandated Allow header, not the framework's empty
// 405). The explicit OPTIONS keeps the advertisement honest — a stub export
// alone makes the auto-OPTIONS advertise the stubbed methods as ALLOWED
// (measured; see src/lib/api-methods.ts for the full rationale).
export function POST() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function PUT() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function PATCH() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function DELETE() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function OPTIONS() {
  return optionsNoContent("GET, HEAD, OPTIONS");
}
