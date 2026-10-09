import { describe, expect, it } from "vitest";
import {
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
