import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";

// Session 19 (F1): the auth-gate deep-link decoration. The reference's
// platform preserves the user's pre-auth destination — an unauthenticated
// visit to an app route lands on /login?from_url=<absolute url> and sign-in
// returns them to that page. Our (app) layout guard redirected PLAIN to
// /login, discarding the deep link (a shared /ticketdetails?id=X link opened
// logged-out landed on /dashboard after login).
//
// Division of labor (the ADR-001 boundary holds — this proxy does NOT
// resolve sessions):
//   - THIS FILE: cookie PRESENCE only. A cookie-less request to one of the
//     four guarded routes is decorated with from_url and bounced to /login
//     before any page markup streams. No HMAC verification, no session
//     resolution — the layout remains the single authoritative guard.
//   - src/app/(app)/layout.tsx: the full verify (getCurrentUser + redirect).
//     Requests that CARRY a cookie pass through here untouched, so an
//     invalid or expired cookie still hits the layout's plain /login
//     redirect (the security boundary is unchanged; only the cookie-less
//     fast path gains the from_url decoration).
//
// The matcher lists the (app) group's four routes EXACTLY — unmatched
// sub-paths (e.g. /dashboard/nonexistent) render the public 404 and must
// NOT be gated (the group layout never sees them either), and no auth or
// API route may be decorated.
export default function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  // Build the from_url from the REQUEST'S HOST HEADER, not request.nextUrl:
  // the standalone server binds 0.0.0.0, and nextUrl reflects the bind
  // address — the user-facing origin is what the browser's Host header
  // carries (and what the deep link must round-trip through). Spoofing is
  // moot: safeRedirectTarget validates the param against the BROWSER'S own
  // origin at use time (the open-redirect guard lives there).
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const target = `${request.nextUrl.protocol}//${host}${request.nextUrl.pathname}${request.nextUrl.search}`;

  const loginUrl = new URL("/login", request.url);
  // The reference's param shape: the FULL absolute URL of the intended
  // page (pathname + query — the ticketdetails ?id= deep link survives).
  loginUrl.searchParams.set("from_url", target);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard", "/submitticket", "/mytickets", "/ticketdetails"],
};
