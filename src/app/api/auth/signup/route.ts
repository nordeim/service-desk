import { NextResponse } from "next/server";
import { methodNotAllowed, optionsNoContent } from "@/lib/api-methods";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  clientIp,
  createSessionPayload,
  hashPassword,
  rateLimit,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth";
import { validateSignupInput, parseBodyKeys, parseBodySize, parseNoQuery } from "@/lib/validation";
import { SIGNUP_BODY_FIELDS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`signup:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam) —
  // after the rate limiter (the s21 convention), before the body level
  // (the s27 convention). Before s29 `?banana=1` was silently ignored and
  // the account was created (measured live at the s29 audit).
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
  // signup's allowed set is exactly {email, name, password}). Before s32
  // an unknown field was silently ignored — the account was created
  // (measured live at the s32 audit).
  const parsedBody = parseBodyKeys(body, SIGNUP_BODY_FIELDS);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
  }

  const input = (body ?? {}) as Partial<{ email: string; name: string; password: string }>;
  const validation = validateSignupInput(input);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Please check the form", errors: validation.errors },
      { status: 400 },
    );
  }

  const email = input.email!.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists", errors: { email: "Email already registered" } },
      { status: 409 },
    );
  }

  const user = await db.user.create({
    data: {
      email,
      name: input.name!.trim(),
      passwordHash: hashPassword(input.password!),
    },
    select: { id: true, email: true, name: true },
  });

  const payload = createSessionPayload(user.id, user.email, user.name);
  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, signSession(payload), sessionCookieOptions());
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
