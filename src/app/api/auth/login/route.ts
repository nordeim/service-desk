import { NextResponse } from "next/server";
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
import { validateLoginInput } from "@/lib/validation";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", clearCookieOptions());
  return res;
}
