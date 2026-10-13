// Forgot password — an honest local-dev implementation: validates the email
// shape, verifies the account exists (without revealing which one), and logs
// a server-side "reset requested" entry. No mail transport is configured in
// this deployment, so the response always returns the same generic message
// (no account enumeration) and the operator finds the request in the server
// log. A production deployment wires SENDGRID/RESEND here.

import { NextResponse } from "next/server";
import { methodNotAllowed, optionsNoContent } from "@/lib/api-methods";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/auth";
import { parseBodyKeys, parseBodySize, parseNoQuery } from "@/lib/validation";
import { FORGOT_PASSWORD_BODY_FIELDS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`forgot:${ip}`, 5);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam) —
  // after the rate limiter (the s21 429 pins), before the body level (the
  // s27 convention). Before s29 `?scope=mine` was silently ignored and the
  // reset request proceeded (measured live at the s29 audit).
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  // Session 35: the request-body ceiling (the shared parseBodySize seam) —
  // AFTER the rate limiter (the s21/s29/s32 convention: every attempt burns
  // a bucket slot, even one rejected before its body is read), BEFORE
  // req.json() (the header-read cost; see the create route's comment).
  const parsedSize = parseBodySize(req.headers.get("content-length"));
  if (!parsedSize.ok) {
    return NextResponse.json({ error: parsedSize.error }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Session 32: the request-BODY grammar (the parseBodyKeys seam — the
  // route's allowed set is exactly {email}). Before s32 an unknown field
  // was silently ignored — the request proceeded (measured live at the
  // s32 audit). The grammar burns a rate-bucket attempt (the limiter
  // runs first, the s21 convention).
  const parsedBody = parseBodyKeys(body, FORGOT_PASSWORD_BODY_FIELDS);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
  }

  const email = String((body as Partial<{ email: string }>)?.email ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: "Please check the form", errors: { email: "Enter a valid email" } },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    console.info(`[auth] password reset requested for user ${user.id} (${email})`);
  } else {
    console.info(`[auth] password reset requested for unknown email (${email})`);
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
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
