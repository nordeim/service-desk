import { describe, it, expect, vi } from "vitest";

// Session 42: the forgot-password log lines — the operator's audit-trail
// pins (the s31 clean-but-unpinned closure; the s71 log-layer
// generalization candidate, closed this session).
//
// The route's own design (its header comment): "verifies the account
// exists (without revealing which one), and logs a server-side 'reset
// requested' entry … the operator finds the request in the server log."
// The CLIENT-facing response is enumeration-safe (identical 200 + the
// generic body for known and unknown emails); the LOGS legitimately
// distinguish (the operator-side audit is the route's documented
// purpose — reset-request trails and enumeration-attempt trails).
//
// These pins freeze BOTH halves: the log distinction (the [auth]-prefixed
// lines with the user-id / unknown-email shapes) AND the response
// non-distinction (deep-equal bodies). The s41 session pinned the health
// route's degraded-path log; this file + tests/auth-secret-warning.test.ts
// close the log-layer class: every console.* site in src/ is now pinned.

// The db mock: the route's only DB touch on this path is
// db.user.findUnique({ where: { email } }) — controlled per test (the
// health-degraded vi.mock pattern, s41). The route reads user.id only, so
// the mock value is the partial shape cast to the Prisma return type (the
// full User shape is irrelevant to this seam).
vi.mock("../src/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

type FindUnique = Awaited<ReturnType<typeof db.user.findUnique>>;
const aUser = (id: string, email: string): FindUnique =>
  ({ id, email }) as FindUnique;

import { db } from "../src/lib/db";
import { POST } from "../src/app/api/auth/forgot-password/route";

const KNOWN_EMAIL = "s42-known@servicedesk.test";
const UNKNOWN_EMAIL = "s42-unknown@nowhere.test";

function resetRequest(email: string, ip: string): Request {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // The s38 XFF seam (rightmost element trusted): a distinct IP per
      // request lands in a fresh rate-limit bucket — the pins never burn
      // each other's budgets.
      "x-forwarded-for": `203.0.113.7, ${ip}`,
    },
    body: JSON.stringify({ email }),
  });
}

describe("the forgot-password log lines (s42 — the audit-trail closure)", () => {
  it("logs the known-user line with the [auth] prefix (the operator's reset-request trail)", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      vi.mocked(db.user.findUnique).mockResolvedValue(aUser("s42-user-id", KNOWN_EMAIL));
      const res = await POST(resetRequest(KNOWN_EMAIL, "10.0.42.1"));
      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);
      // The exact template shape (byte-correct here; the display layer
      // may eat the leading bracket — the s18 doctrine).
      expect(spy.mock.calls[0]?.[0]).toBe(
        `[auth] password reset requested for user s42-user-id (${KNOWN_EMAIL})`,
      );
    } finally {
      spy.mockRestore();
      vi.mocked(db.user.findUnique).mockReset();
    }
  });

  it("logs the unknown-email line (the enumeration-attempt trail — the operator's security signal)", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);
      const res = await POST(resetRequest(UNKNOWN_EMAIL, "10.0.42.2"));
      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]?.[0]).toBe(
        `[auth] password reset requested for unknown email (${UNKNOWN_EMAIL})`,
      );
    } finally {
      spy.mockRestore();
      vi.mocked(db.user.findUnique).mockReset();
    }
  });

  it("the response is enumeration-safe (identical status + body for known and unknown — the client contract frozen alongside the log distinction)", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce(aUser("s42-user-id", KNOWN_EMAIL))
        .mockResolvedValueOnce(null);
      const knownRes = await POST(resetRequest(KNOWN_EMAIL, "10.0.42.3"));
      const unknownRes = await POST(resetRequest(UNKNOWN_EMAIL, "10.0.42.4"));
      expect(knownRes.status).toBe(unknownRes.status);
      expect(await knownRes.json()).toEqual(await unknownRes.json());
      // And the two log lines DID differ (the audit trail is the only
      // surface that distinguishes — by design, for the operator).
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0]?.[0]).not.toBe(spy.mock.calls[1]?.[0]);
    } finally {
      spy.mockRestore();
      vi.mocked(db.user.findUnique).mockReset();
    }
  });
});
