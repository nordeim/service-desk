import { NextResponse } from "next/server";
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
