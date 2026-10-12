import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __rateLimitBucketCountForTests,
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

// Session 39: the rateLimit bucket eviction — the memory-growth contract.
//
// The s39 live measurement: a 50k unique-XFF flood left +111 MB of RETAINED
// RSS on the production standalone (never reclaimed after GC settle) — the
// buckets Map has no eviction: entries whose hits have ALL expired remain
// in the Map forever (the hits ARRAY is filtered on access; the SHELL never
// leaves — buckets.delete was never called anywhere). The fix: a
// threshold-gated, time-gated sweep inside rateLimit. The pins use fake
// timers to make the 15-min window deterministic, and vi.resetModules() +
// dynamic import for a FRESH module instance per pin (the module-level Map
// is the leak surface — each pin observes its own count from zero).
describe("rateLimit bucket eviction (the s39 memory-growth contract)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // A fresh module instance: imported BEFORE the fake timers engage (async
  // module resolution under fake timers is a documented non-starter).
  async function freshAuth() {
    vi.resetModules();
    return await import("@/lib/auth");
  }

  it("evicts fully-expired buckets once the threshold is crossed (the shells do not outlive their window forever — the slow leak is bounded)", async () => {
    const mod = await freshAuth();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
    const t0 = Date.now();
    // 1000 unique keys, one hit each at t0 — the threshold-crossing mass.
    for (let i = 0; i < 1000; i++) {
      expect(mod.rateLimit(`leak1:${i}`, 10).ok).toBe(true);
    }
    // Let the window pass: every hit above is now expired.
    vi.setSystemTime(t0 + 15 * 60 * 1000 + 1000);
    // This call crosses the size threshold → the sweep must run → the 1000
    // expired shells gone; only this fresh key remains. Pre-fix: 1001 —
    // the shells never leave (the RED).
    expect(mod.rateLimit("leak1:after", 10).ok).toBe(true);
    expect(mod.__rateLimitBucketCountForTests()).toBe(1);
  });

  it("never evicts a bucket with a live hit (the s21/s38 window semantics are unchanged by the sweep)", async () => {
    const mod = await freshAuth();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
    const t0 = Date.now();
    // 999 single-hit shells (all expired by the sweep instant) + one MIXED
    // bucket — hit at t0 (expired by the sweep) and again 14 min later
    // (still live): the over-eviction shape. A sweep that drops a bucket
    // on ANY expired hit (`some` instead of `every`) would reset that
    // key's window — a silent limiter bypass.
    for (let i = 0; i < 999; i++) {
      mod.rateLimit(`leak2:old:${i}`, 10);
    }
    expect(mod.rateLimit("leak2:mixed", 10).ok).toBe(true); // hit A at t0
    const t14 = t0 + 14 * 60 * 1000;
    vi.setSystemTime(t14);
    expect(mod.rateLimit("leak2:mixed", 10).ok).toBe(true); // hit B at t14 (A survives the filter)
    // Sweep instant: 16 min — the 999 shells and hit A are expired; hit B
    // (2 min old) is live. The live-key call crosses the threshold.
    const tSweep = t0 + 16 * 60 * 1000;
    vi.setSystemTime(tSweep);
    expect(mod.rateLimit("leak2:live", 1).ok).toBe(true); // triggers the sweep
    // The live hit must SURVIVE (over-eviction guard): with limit 1, the
    // pre-sweep hit still blocks this call.
    expect(mod.rateLimit("leak2:live", 1).ok).toBe(false);
    // And the mixed bucket must survive too (hit B is live): the shells
    // leave, the two live buckets stay.
    expect(mod.__rateLimitBucketCountForTests()).toBe(2);
  });

  it("sweeps at most once per minute and re-arms after the gate (the flood-amplifier guard — no O(size) scan per request)", async () => {
    const mod = await freshAuth();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
    const t0 = Date.now();
    // Shells A (expire at t0+window) and X (hit at t0+30s — expire at
    // t0+30s+window, i.e. 30s AFTER A).
    for (let i = 0; i < 1000; i++) {
      mod.rateLimit(`leak3:a:${i}`, 10);
    }
    const tX = t0 + 30_000;
    vi.setSystemTime(tX);
    for (let i = 0; i < 1000; i++) {
      mod.rateLimit(`leak3:x:${i}`, 10);
    }
    // t1 (A expired, X live): the trigger call sweeps — A leaves (1000
    // entries), X survives, the trigger joins → count 1001. The gate arms
    // for 60s from t1.
    const t1 = t0 + 15 * 60 * 1000 + 1000;
    vi.setSystemTime(t1);
    mod.rateLimit("leak3:trigger1", 10);
    expect(mod.__rateLimitBucketCountForTests()).toBe(1001);
    // t2 (X NOW expired too; still inside the 60s gate): a threshold-
    // crossing call must NOT sweep (the gate) — X stays → count 1002. An
    // ungated sweep here would delete X → count 2 (the mutation signal).
    const t2 = t1 + 30_000;
    vi.setSystemTime(t2);
    mod.rateLimit("leak3:trigger2", 10);
    expect(mod.__rateLimitBucketCountForTests()).toBe(1002);
    // t3 (past the gate): the next threshold-crossing call re-arms and
    // sweeps — X leaves; the three trigger keys hold live hits → count 3.
    // The re-arm proves no ratchet: stale shells above the threshold
    // eventually leave (the gate never wedges the Map above threshold).
    const t3 = t1 + 61_000;
    vi.setSystemTime(t3);
    mod.rateLimit("leak3:trigger3", 10);
    expect(mod.__rateLimitBucketCountForTests()).toBe(3);
  });
});
