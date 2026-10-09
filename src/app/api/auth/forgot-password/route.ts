// Forgot password — an honest local-dev implementation: validates the email
// shape, verifies the account exists (without revealing which one), and logs
// a server-side "reset requested" entry. No mail transport is configured in
// this deployment, so the response always returns the same generic message
// (no account enumeration) and the operator finds the request in the server
// log. A production deployment wires SENDGRID/RESEND here.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/auth";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
