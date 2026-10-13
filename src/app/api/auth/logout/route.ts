import { NextResponse } from "next/server";
import { methodNotAllowed, optionsNoContent } from "@/lib/api-methods";
import { SESSION_COOKIE, clearCookieOptions } from "@/lib/auth";
import { parseNoQuery } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Session 29: the empty-grammar gate (the shared parseNoQuery seam). This
  // endpoint takes no query params; before s29 `?banana=1` was silently
  // ignored and the cookie was cleared (measured live at the s29 audit).
  // The gate rejecting BEFORE the cookie clear means a stray-param logout
  // fails loudly instead of half-acting.
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", clearCookieOptions());
  return res;
}

// Session 40: the 405 JSON-boundary stubs + the honest OPTIONS (the s40 seam —
// HEAD has no GET to derive from on this route, so it stubs too. See
// src/lib/api-methods.ts for the full rationale: a stub export alone makes
// the auto-OPTIONS advertise the stubbed methods as ALLOWED — the explicit
// OPTIONS below re-asserts the honest list.
export function GET() {
  return methodNotAllowed("POST, OPTIONS");
}

export function HEAD() {
  return methodNotAllowed("POST, OPTIONS");
}

export function PUT() {
  return methodNotAllowed("POST, OPTIONS");
}

export function PATCH() {
  return methodNotAllowed("POST, OPTIONS");
}

export function DELETE() {
  return methodNotAllowed("POST, OPTIONS");
}

export function OPTIONS() {
  return optionsNoContent("POST, OPTIONS");
}
