import { describe, expect, it } from "vitest";
import {
  clientIp,
  createSessionPayload,
  hashPassword,
  rateLimit,
  signSession,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth";

// The HMAC session contract: sign → verify round-trips, tampering fails,
// expiry fails, and the scrypt password hash verifies only the original.

describe("signSession / verifySessionToken", () => {
  const key = "test-signing-key-0123456789abcdef";
  const payload = createSessionPayload("user-1", "a@b.co", "Alice");

  it("round-trips a valid token", () => {
    const token = signSession(payload, key);
    const out = verifySessionToken(token, key);
    expect(out).not.toBeNull();
    expect(out?.uid).toBe("user-1");
    expect(out?.email).toBe("a@b.co");
    expect(out?.name).toBe("Alice");
  });

  it("rejects a token signed with a different key", () => {
    const token = signSession(payload, key);
    expect(verifySessionToken(token, "another-key-9876543210fedcba")).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signSession(payload, key);
    const [body, mac] = token.split(".");
    void body;
    const forged = Buffer.from(
      JSON.stringify({ ...payload, uid: "user-2" }),
    ).toString("base64url");
    expect(verifySessionToken(`${forged}.${mac}`, key)).toBeNull();
  });

  it("rejects an expired payload", () => {
    const expired = { ...payload, exp: Math.floor(Date.now() / 1000) - 10 };
    expect(verifySessionToken(signSession(expired, key), key)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifySessionToken("", key)).toBeNull();
    expect(verifySessionToken("no-dot-here", key)).toBeNull();
    expect(verifySessionToken("a.b.c.d", key)).toBeNull();
  });
});

describe("password hashing", () => {
  it("hashes and verifies the original password", () => {
    const stored = hashPassword("Demo1234!");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("Demo1234!", stored)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const stored = hashPassword("Demo1234!");
    expect(verifyPassword("wrong-pass", stored)).toBe(false);
  });

  it("salts every hash (two hashes of the same password differ)", () => {
    expect(hashPassword("Demo1234!")).not.toBe(hashPassword("Demo1234!"));
  });

  it("rejects a malformed stored hash", () => {
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
    expect(verifyPassword("x", "bcrypt$abc$def")).toBe(false);
  });
});

describe("rateLimit", () => {
  it("allows up to the limit and then blocks", () => {
    const key = `login:${Math.random()}`;
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(key, 10).ok).toBe(true);
    }
    const blocked = rateLimit(key, 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const a = `ka:${Math.random()}`;
    const b = `kb:${Math.random()}`;
    expect(rateLimit(a, 1).ok).toBe(true);
    expect(rateLimit(b, 1).ok).toBe(true);
    expect(rateLimit(a, 1).ok).toBe(false);
  });
});

// Session 38: the clientIp contract — the XFF rightmost-element trust.
//
// The seam had ZERO direct pins (the s21 "best-effort" posture was
// documentation-only). The s38 live measurement: 30 login attempts with a
// ROTATING client-supplied X-Forwarded-For → zero 429s — first-element
// trust lets the attacker mint a fresh rate-limit bucket per request.
// XFF is an APPEND list: the client controls the FRONT, the closest
// trusted proxy appends the socket address it saw to the END — so the
// RIGHTMOST element is the proxy-controlled value behind the single-proxy
// deployment DEPLOYMENT.md documents, and every client-chosen prefix is
// discarded. The direct-call pattern (the api-catchall precedent): the
// seam reads the request's headers and returns a string.
describe("clientIp", () => {
  function reqWith(headers: Record<string, string>): Request {
    return new Request("http://localhost:3000/api/auth/login", { headers });
  }

  it("derives the RIGHTMOST XFF element — the proxy-appended value (the client-chosen prefix is discarded)", () => {
    // The simulated trusted proxy: the client sent an arbitrary XFF prefix,
    // the proxy appended the real socket address it saw ("spoofed-prefix, 203.0.113.9").
    expect(clientIp(reqWith({ "x-forwarded-for": "spoofed-prefix, 203.0.113.9" }))).toBe(
      "203.0.113.9"
    );
  });

  it("trims the rightmost element (spaces between list items)", () => {
    expect(
      clientIp(reqWith({ "x-forwarded-for": "client-a, client-b, proxy-seen" }))
    ).toBe("proxy-seen");
  });

  it("uses the single element when XFF has exactly one (the direct/proxy-less case)", () => {
    expect(clientIp(reqWith({ "x-forwarded-for": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip when XFF is absent (the nginx alternative, proxy-controlled)", () => {
    expect(clientIp(reqWith({ "x-real-ip": "10.0.0.99" }))).toBe("10.0.0.99");
  });

  it("falls back to unknown when no IP headers exist (the s21 contract)", () => {
    expect(clientIp(reqWith({}))).toBe("unknown");
  });

  it("falls back to unknown when the XFF tail is empty (a malformed list — never a client-chosen element)", () => {
    expect(clientIp(reqWith({ "x-forwarded-for": "spoofed-prefix, " }))).toBe("unknown");
    expect(clientIp(reqWith({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
