import { describe, it, expect, vi } from "vitest";

// Session 87: the AUTH_SECRET production fail-hard pins (the s42
// config-safety tripwire, RESHAPED at the security-surface gap the family
// skill §16 contract names: "AUTH_SECRET enforced ≥ 16 chars, fails hard
// in production" — the neo-crm sibling's committed secret() precedent,
// the same §16 checklist line directly under the s86 timing equalizer).
//
// The defect (measured live at the s87 audit): the pre-fix secret()
// warned ONCE and returned the module-level DEV_SECRET — a constant
// committed to the public repository — for a missing/short AUTH_SECRET
// in production, so a misconfigured boot stayed fully functional and
// SILENTLY forgeable: the session payload is base64url JSON (not
// encrypted) and the comment-author API objects carry user ids, so an
// attacker who knows the public constant can mint a valid-looking
// servicedesk_session for any user id and the misconfigured server will
// VERIFY it. A warn-and-continue on a forgeable-seam misconfiguration is
// a degraded mode, not an alarm; the thrown Error is the honest server
// posture (the sibling's own comment records the class: the warn-once
// fallback "shipped forgeable sessions silently").
//
// The seam: secret() is the default-parameter key of BOTH
// signSession AND verifySessionToken — the mint and the verify faces.
// The six pins: prod+missing → signSession THROWS (no token minted; the
// actionable [auth] message with the openssl rand -hex 32 remedy);
// prod+short (15, the boundary) → THROWS; prod+valid (>=16) → silent +
// signs (the configured boot); dev+missing → silent + the DEV fallback
// signs (the quiet-in-dev contract, unchanged — the DX story); prod+
// missing → verifySessionToken THROWS on an attacker-crafted token (the
// forged-cookie ACCEPTANCE path — the exact attack the public constant
// enables; the DEV fallback is unreachable in production at BOTH
// default-parameter faces); the environment-restore module contract.

// The db mock: auth.ts imports ./db at module level (Prisma instantiates
// eagerly); signSession never touches it — the mock keeps this file
// Prisma-free (the health-degraded pattern, s41).
vi.mock("../src/lib/db", () => ({
  db: {},
}));

import { signSession, verifySessionToken, type SessionPayload } from "../src/lib/auth";

const PAYLOAD: SessionPayload = {
  uid: "s42-pin-user",
  email: "s42-pin@servicedesk.test",
  name: "S42 Pin",
  exp: 4102444800, // 2100-01-01 — far-future, irrelevant to the fail-hard path
};

// The PUBLIC dev constant (committed verbatim in src/lib/auth.ts) — the
// attacker's signing key in the forged-cookie pin below. Inlined here
// deliberately: the pin must keep working even if the constant is
// renamed (the attack assumes the repo is public knowledge).
const PUBLIC_DEV_SECRET = "servicedesk-dev-only-insecure-secret";

describe("the AUTH_SECRET production fail-hard posture (s87 — the forgeable-session closure)", () => {
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
    "fails hard in production when AUTH_SECRET is missing — signSession throws, no token is minted (the forgeable mint closed)",
    withEnv("production", undefined, async () => {
      expect(() => signSession(PAYLOAD)).toThrow(
        /AUTH_SECRET is missing or shorter than 16 chars in production — sessions would be forgeable/,
      );
      // The message carries the actionable remedy (the sibling's form).
      expect(() => signSession(PAYLOAD)).toThrow(/openssl rand -hex 32/);
    }),
  );

  it(
    "fails hard in production when AUTH_SECRET is too short (15 chars — the boundary just under 16)",
    withEnv("production", "a".repeat(15), async () => {
      expect(() => signSession(PAYLOAD)).toThrow(/AUTH_SECRET is missing or shorter than 16 chars in production/);
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
      const token = signSession(PAYLOAD); // no key — the default param triggers secret()
      expect(token.split(".")).toHaveLength(2); // body.mac — signed with DEV_SECRET
      expect(consoleError).not.toHaveBeenCalled();
    }),
  );

  it(
    "fails hard in production on the forged-cookie ACCEPTANCE path — verifySessionToken throws on an attacker-crafted token (the pre-fix code verified it)",
    withEnv("production", undefined, async () => {
      // The attacker's craft: a WELL-FORMED token signed with the public
      // dev constant (the repo is public — the constant is the attack's
      // signing key; the payload shape rides the base64url JSON body).
      // The pre-fix secret() verified exactly this token in production.
      const forged = signSession(PAYLOAD, PUBLIC_DEV_SECRET);
      expect(() => verifySessionToken(forged)).toThrow(
        /AUTH_SECRET is missing or shorter than 16 chars in production — sessions would be forgeable/,
      );
    }),
  );

  it("restores the environment (no cross-file pollution — the module contract)", () => {
    expect(process.env.NODE_ENV).toBe(ORIGINAL_ENV);
    expect(process.env.AUTH_SECRET).toBe(ORIGINAL_SECRET);
  });
});
