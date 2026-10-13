import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseNoQuery } from "@/lib/validation";
import { methodNotAllowed, optionsNoContent, routeAllow } from "@/lib/api-methods";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam — the
  // s28 stats convention: auth first, then the grammar level). This endpoint
  // takes no query params; before s29 `?scope=mine` — a REAL param name from
  // the sibling /api/tickets route — was silently ignored, returning the
  // unchanged user (the cross-route confusion variant of the lesson-82
  // class, measured live at the s29 audit).
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  return NextResponse.json({ user });
}

// Session 40: the 405 JSON-boundary stubs + the honest OPTIONS (the s40
// seam — see src/lib/api-methods.ts). HEAD stays auto-derived from GET.
// Session 41: the single source — this route's implemented methods.
// The stubs and the OPTIONS advertisement below all derive from it
// (never edit the allow string by hand; the consistency pins in
// tests/api-allow-source.test.ts freeze the equivalence, and the s40
// smoke block pins the live surface).
const ALLOW = routeAllow(["GET"]);

export function POST() {
  return methodNotAllowed(ALLOW);
}

export function PUT() {
  return methodNotAllowed(ALLOW);
}

export function PATCH() {
  return methodNotAllowed(ALLOW);
}

export function DELETE() {
  return methodNotAllowed(ALLOW);
}

export function OPTIONS() {
  return optionsNoContent(ALLOW);
}
