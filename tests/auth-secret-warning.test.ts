import { describe, it, expect, vi } from "vitest";

// Session 42: the AUTH_SECRET production warning — the config-safety
// tripwire pin (the s31 clean-but-unpinned closure; the s71 log-layer
// generalization candidate, closed this session).
//
// The warning (src/lib/auth.ts): secret() falls back to DEV_SECRET when
// AUTH_SECRET is missing or shorter than 16 chars, warning ONLY when
// NODE_ENV === "production". It fires through the default-parameter seam
// (key = secret() in signSession/verifySessionToken) — every token
// operation in a misconfigured production boot passes through here.
// This is the deployment-safety tripwire: the operator gets exactly one
// console.error on the first session sign. Unpinned = a future refactor
// of secret() ships with no alarm (the s31 doctrine applied to the
// config-safety layer).
//
// The four pins: prod+missing → warn; prod+short(<16) → warn;
// prod+valid(>=16) → silent; dev+missing → silent (the dev-only fallback
// contract — the loud-in-production, quiet-in-dev asymmetry is the
// documented design, not an accident).

// The db mock: auth.ts imports ./db at module level (Prisma instantiates
// eagerly); signSession never touches it — the mock keeps this file
// Prisma-free (the health-degraded pattern, s41).
vi.mock("../src/lib/db", () => ({
  db: {},
}));

import { signSession, type SessionPayload } from "../src/lib/auth";

const PAYLOAD: SessionPayload = {
  uid: "s42-pin-user",
  email: "s42-pin@servicedesk.test",
  name: "S42 Pin",
  exp: 4102444800, // 2100-01-01 — far-future, irrelevant to the warning path
};

describe("the AUTH_SECRET production warning (s42 — the config-safety tripwire)", () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  const ORIGINAL_SECRET = process.env.AUTH_SECRET;

  function withEnv(env: string | undefined, secret: string | undefined, fn: () => Promise<void>) {
    return async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      // A mutable view of process.env — the @types/node NODE_ENV is
      // read-only (rightly so for app code); the test's env-mutation
      // seam needs the record view.
      const mutableEnv = process.env as Record<string, string | undefined>;
      const prevEnv = mutableEnv.NODE_ENV;
      const prevSecret = mutableEnv.AUTH_SECRET;
      try {
        if (env === undefined) delete mutableEnv.NODE_ENV;
        else mutableEnv.NODE_ENV = env;
        if (secret === undefined) delete mutableEnv.AUTH_SECRET;
        else mutableEnv.AUTH_SECRET = secret;
        await fn();
      } finally {
        // Node quirk: assigning undefined to process.env.X stores the
        // STRING "undefined" — restore deletions with delete, not
        // assignment.
        if (prevEnv === undefined) delete mutableEnv.NODE_ENV;
        else mutableEnv.NODE_ENV = prevEnv;
        if (prevSecret === undefined) delete mutableEnv.AUTH_SECRET;
        else mutableEnv.AUTH_SECRET = prevSecret;
        spy.mockRestore();
      }
    };
  }

  it(
    "warns in production when AUTH_SECRET is missing — and the DEV_SECRET fallback still signs (the degraded mode is functional, not fatal)",
    withEnv("production", undefined, async () => {
      const consoleError = vi.mocked(console.error);
      const token = signSession(PAYLOAD); // no key — the default param triggers secret()
      expect(token.split(".")).toHaveLength(2); // body.mac — signed with DEV_SECRET
      expect(consoleError).toHaveBeenCalledTimes(1);
      const firstArg = consoleError.mock.calls[0]?.[0];
      expect(typeof firstArg).toBe("string");
      // The prefix convention (byte-correct here; the display layer may
      // eat the leading bracket — the s18 doctrine).
      expect(firstArg.startsWith("[auth]")).toBe(true);
      expect(String(firstArg)).toContain("AUTH_SECRET");
      expect(String(firstArg)).toContain("openssl rand -hex 32");
    }),
  );

  it(
    "warns in production when AUTH_SECRET is too short (15 chars — the boundary just under 16)",
    withEnv("production", "a".repeat(15), async () => {
      const consoleError = vi.mocked(console.error);
      signSession(PAYLOAD);
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(String(consoleError.mock.calls[0]?.[0]).startsWith("[auth]")).toBe(true);
    }),
  );

  it(
    "stays silent in production with a valid AUTH_SECRET (>= 16 chars — the configured boot)",
    withEnv("production", "s42-valid-secret-0123456789abcdef", async () => {
      const consoleError = vi.mocked(console.error);
      const token = signSession(PAYLOAD);
      expect(token.split(".")).toHaveLength(2);
      expect(consoleError).not.toHaveBeenCalled();
    }),
  );

  it(
    "stays silent in dev when AUTH_SECRET is missing (the dev-only fallback contract — loud in production, quiet in dev)",
    withEnv("test", undefined, async () => {
      const consoleError = vi.mocked(console.error);
      const token = signSession(PAYLOAD);
      expect(token.split(".")).toHaveLength(2);
      expect(consoleError).not.toHaveBeenCalled();
    }),
  );

  it("restores the environment (no cross-file pollution — the module contract)", () => {
    expect(process.env.NODE_ENV).toBe(ORIGINAL_ENV);
    expect(process.env.AUTH_SECRET).toBe(ORIGINAL_SECRET);
  });
});
