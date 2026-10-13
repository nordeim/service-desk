import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseNoQuery } from "@/lib/validation";
import { methodNotAllowed, optionsNoContent } from "@/lib/api-methods";

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
