// ServiceDesk auth — HMAC-signed cookie sessions + scrypt password hashing.
//
// Design notes (ADR-grade):
// - No third-party auth dependency: the app needs email+password only, and a
//   signed `servicedesk_session` cookie (HMAC-SHA256 over a JSON payload) is
//   auditable with zero supply-chain surface. The signing secret comes from
//   AUTH_SECRET (fails HARD in production when missing or under 16 chars;
//   dev/test falls back to a dev-only constant — the s87 fail-hard posture).
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
  // Session 87 (the family skill §16 contract: "AUTH_SECRET enforced
  // >= 16 chars, fails hard in production" — the neo-crm sibling's
  // committed precedent): the pre-fix form warned once and returned the
  // module-level DEV_SECRET — a constant committed to this public repo —
  // so a production boot without the secret stayed fully functional and
  // SILENTLY forgeable (session payloads are base64url JSON, not
  // encrypted, and user ids ride the comment-author API objects: anyone
  // holding the public constant could mint a cookie for any user). A
  // warn-and-continue on a forgeable-seam misconfiguration is a degraded
  // mode, not an alarm — the throw is the honest server posture, and it
  // rides secret(), the default key of BOTH signSession and
  // verifySessionToken, so no token is ever minted OR accepted on a
  // misconfigured boot. Dev/test keeps the documented silent DEV fallback
  // (the quiet-in-dev contract, unchanged).
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] AUTH_SECRET is missing or shorter than 16 chars in production — sessions would be forgeable. Generate one with: openssl rand -hex 32",
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

// Session 86: the login route's timing equalizer (the family skill §16
// contract — the miss branch burns the same scrypt). The pre-fix
// `!user || !verifyPassword(...)` short-circuit skipped the scrypt work
// for unknown emails, so response latency distinguished registered emails
// even through the uniform 401 envelope. The equalizer hash is a REAL
// scrypt hash of a throwaway constant in the SAME scrypt$salt$hash format
// the passwordHash column carries, so burning it costs exactly one
// scryptSync — the format IS the structural burn guarantee (the seam's
// unit pin). LAZY: computed once on the first miss, never a cold-start
// scrypt at module import — the login route is the only consumer. (The
// neo-crm session-163 form — the digma S72-C port — adapted to this
// repo's scrypt$ separator.)
let equalizerHash: string | null = null;

export function timingEqualizerHash(): string {
  if (equalizerHash === null) {
    equalizerHash = hashPassword("servicedesk-timing-equalizer-constant");
  }
  return equalizerHash;
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

// Session 39: the eviction seam. For 38 sessions every unique key ever seen
// left a PERMANENT entry — the hits expire from the array on access, but the
// SHELL never leaves the Map (buckets.delete was never called anywhere): a
// slow leak under honest traffic (one entry per unique (IP, route) pair ever
// seen — monotonic growth over process lifetime) and an OOM vector under a
// unique-XFF flood (measured live, s39: a 50k unique-key flood left +111 MB
// of RETAINED RSS after GC settle — the memory never comes back). The sweep
// deletes entries whose hits are ALL expired. Two gates keep it free of
// steady-state cost and free of the flood amplification a naive every-call
// sweep would add (O(size) per request):
//   1. the size threshold — honest traffic never crosses it (zero sweeps);
//   2. the time gate — at most one sweep per minute whatever the request
//      rate, and the gate RE-ARMS (a stale shell above the threshold leaves
//      on the first threshold-crossing call after its window AND the gate —
//      no ratchet: the gate never wedges the Map above the threshold).
// A bucket with ANY live hit is never touched (the s21/s38 window contract).
// All current callers share the default 15-min window, so sweeping with the
// current call's windowMs is consistent; the flood-shape ceiling (memory ≤
// unique keys × window × ~2.2 KB during an ACTIVE window) is inherent to
// every sliding-window limiter and documented in docs/DEPLOYMENT.md.
const BUCKETS_SWEEP_THRESHOLD = 1_000;
const BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000;
let bucketsNextSweepAt = 0;

function sweepExpiredBuckets(now: number, windowMs: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || bucket.hits.every((t) => now - t >= windowMs)) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000): RateLimitResult {
  const now = Date.now();
  if (buckets.size >= BUCKETS_SWEEP_THRESHOLD && now >= bucketsNextSweepAt) {
    bucketsNextSweepAt = now + BUCKETS_SWEEP_MIN_INTERVAL_MS;
    sweepExpiredBuckets(now, windowMs);
  }
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

/** Test-only observer for the s39 eviction pins — never call from app code. */
export function __rateLimitBucketCountForTests(): number {
  return buckets.size;
}

/**
 * Best-effort client IP for rate-limit keys (single-trusted-proxy-aware).
 *
 * X-Forwarded-For is an APPEND list: each hop adds the socket address it
 * saw to the END of the list. The client controls the FRONT — it can send
 * an arbitrary XFF prefix to rotate its rate-limit key (the s38 live
 * measurement: 30 rotating-prefix logins, zero 429s under the old
 * first-element trust) — while the LAST element is the address the
 * CLOSEST proxy observed. Behind the single TLS-terminating proxy that
 * docs/DEPLOYMENT.md documents (nginx `proxy_add_x_forwarded_for`,
 * Caddy's default, the Render platform proxy — all APPEND), the rightmost
 * element is therefore the proxy-controlled truth and every client-chosen
 * prefix is discarded. Direct (proxy-less) access has no trusted element
 * at all — the socket address is not exposed to route handlers, so the
 * header stays best-effort: the limiter is a backstop, not a boundary.
 * A malformed/empty tail falls back to "unknown" (never to a
 * client-chosen element).
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").at(-1)?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
