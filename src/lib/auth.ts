// ServiceDesk auth — HMAC-signed cookie sessions + scrypt password hashing.
//
// Design notes (ADR-grade):
// - No third-party auth dependency: the app needs email+password only, and a
//   signed `servicedesk_session` cookie (HMAC-SHA256 over a JSON payload) is
//   auditable with zero supply-chain surface. The signing secret comes from
//   AUTH_SECRET (falls back to a dev-only constant with a loud warning).
// - Passwords: Node crypto scrypt (N=16384 via defaults, 64-byte key) with a
//   per-user random 16-byte salt, stored as `scrypt$<salt>$<hash>`.
// - Rate limiting: in-memory sliding window per IP+route for the login,
//   signup and forgot-password endpoints (10 attempts / 15 min — matches the
//   Playwright budget note in tests/e2e/helpers.ts).
//
// Web Crypto (globalThis.crypto) is used for HMAC so the same code runs in
// the Node server runtime without node:crypto imports in the edge-adjacent
// code paths; scrypt only exists in Node, so password helpers live behind
// dynamic imports to stay bundler-friendly.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const SESSION_COOKIE = "servicedesk_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEV_SECRET = "servicedesk-dev-only-insecure-secret";

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  exp: number; // unix seconds
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] AUTH_SECRET is missing or too short in production — set it to `openssl rand -hex 32`.",
    );
  }
  return DEV_SECRET;
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---------------------------------------------------------------------------
// Session token sign/verify (pure — unit-tested)
// ---------------------------------------------------------------------------

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signSession(payload: SessionPayload, key = secret()): string {
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifySessionToken(token: string, key = secret()): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.uid !== "string" || typeof payload.email !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionPayload(uid: string, email: string, name: string): SessionPayload {
  return { uid, email, name, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
}

// ---------------------------------------------------------------------------
// Cookie session (server-side; cookies() is async in Next 16)
// ---------------------------------------------------------------------------

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Returns the live DB user for the session, or null (deleted/expired user). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, name: true },
  });
  return user;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory sliding window; per instance — fine for a single
// server deployment, and the honest documented limitation for horizontal
// scale).
// ---------------------------------------------------------------------------

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP for rate-limit keys (proxy-aware). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
