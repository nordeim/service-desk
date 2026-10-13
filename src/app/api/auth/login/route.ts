import { NextResponse } from "next/server";
import { methodNotAllowed, optionsNoContent, routeAllow } from "@/lib/api-methods";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  clearCookieOptions,
  clientIp,
  createSessionPayload,
  rateLimit,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { validateLoginInput, parseBodyKeys, parseBodySize, parseNoQuery } from "@/lib/validation";
import { LOGIN_BODY_FIELDS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`login:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam — the
  // s28 stats contract extended API-wide). The rate limiter stays FIRST (the
  // s21 429 contract pins the 11th attempt); then the grammar level precedes
  // the body level (the s27 convention). Before s29 `?scope=mine` — a REAL
  // param name from the sibling /api/tickets route — was silently ignored
  // and the login proceeded (the cross-route confusion variant of the
  // lesson-82 class, measured live at the s29 audit).
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
  // login's allowed set is exactly {email, password}; a signup-shape body
  // carrying `name` rejects here, the cross-route catch). The grammar
  // burns a rate-bucket attempt (the limiter runs first, the s21
  // convention — the 400 is still an attempt). Before s32 an unknown
  // field was silently ignored — the login proceeded (measured live at
  // the s32 audit).
  const parsedBody = parseBodyKeys(body, LOGIN_BODY_FIELDS);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
  }

  const input = (body ?? {}) as Partial<{ email: string; password: string }>;
  const validation = validateLoginInput(input);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Please check the form", errors: validation.errors },
      { status: 400 },
    );
  }

  const email = input.email!.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(input.password!, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const payload = createSessionPayload(user.id, user.email, user.name);
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  res.cookies.set(SESSION_COOKIE, signSession(payload), sessionCookieOptions());
  return res;
}

export async function DELETE(req: Request) {
  // Session 29: the DELETE variant carries the same empty-grammar gate
  // (the shared seam — one contract per route, both verbs).
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
// Session 41: the single source — this route's implemented methods.
// The stubs and the OPTIONS advertisement below all derive from it
// (never edit the allow string by hand; the consistency pins in
// tests/api-allow-source.test.ts freeze the equivalence, and the s40
// smoke block pins the live surface).
const ALLOW = routeAllow(["POST", "DELETE"]);

export function GET() {
  return methodNotAllowed(ALLOW);
}

export function HEAD() {
  return methodNotAllowed(ALLOW);
}

export function PUT() {
  return methodNotAllowed(ALLOW);
}

export function PATCH() {
  return methodNotAllowed(ALLOW);
}

export function OPTIONS() {
  return optionsNoContent(ALLOW);
}
