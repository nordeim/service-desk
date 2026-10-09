import { NextResponse } from "next/server";
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
import { validateSignupInput } from "@/lib/validation";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
