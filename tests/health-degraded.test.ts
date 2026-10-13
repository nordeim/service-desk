import { describe, it, expect, vi } from "vitest";

// Session 41: the health route's DEGRADED path — the unpinned-contract
// closure (the s31 doctrine) + the s18 hex-dump lesson's third firing.
//
// Part 1 — the unpinned path: the 503 branch was exercised by NO test in
// 41 sessions (the smoke script pins the 200-ok and 400-grammar shapes
// only; every gate, E2E run, and live-verify script executes with the
// database UP). An error path with zero pins is the s31 clean-but-unpinned
// defect: a future refactor of the catch block ships with no alarm.
//
// Part 2 — the false finding this session almost shipped: the log line
// READ as a 41-session-old typo through every display surface
// ("ealth] database check failed:") — grep, git show, and the vitest
// stderr trace all rendered the prefix without its "[h". The hex dump
// (od -c on the working tree AND on the first commit's blob) shows the
// bytes were always "[health] database check failed:" — the output
// capture layer eats "[h" as a CSI-style escape, exactly the s18
// lesson's class (branches: [main] read as "branches: ain]" through
// cat/grep). The lesson generalized: ANY bracket-prefixed string read
// through a terminal/capture layer is suspect — hex-dump before
// declaring a string defect, and root-cause a pin that passes when you
// expected it to fail (the inverted s38 rule: a pin passing for a
// reason you did not design is a signal, not a success).
//
// The pin design: vi.mock replaces @/lib/db with a rejecting $queryRaw
// (the health handler is otherwise pure — parseNoQuery then the query),
// so the degraded branch is reachable deterministically at the unit
// layer. The console.error spy pins the prefix convention itself.

vi.mock("../src/lib/db", () => ({
  db: {
    $queryRaw: () =>
      Promise.reject(new Error("simulated database outage (s41 pin)")),
  },
}));

import { GET } from "../src/app/api/health/route";

function healthRequest() {
  return new Request("http://localhost:3000/api/health");
}

describe("the health route's degraded path (s41 — the unpinned-contract closure)", () => {
  it("answers 503 with the JSON degraded body when the database is unreachable", async () => {
    const res = await GET(healthRequest());
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("down");
    expect(typeof body.time).toBe("string");
    // The body's key set is exact (the s31 no-leak/no-drift convention).
    expect(Object.keys(body).sort()).toEqual(["db", "status", "time"]);
  });

  it("logs the failure with the [health] prefix (the operator's grep convention — hex-verified: the display layer eats the '[' + 'h')", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await GET(healthRequest());
      expect(spy).toHaveBeenCalled();
      const firstArg = spy.mock.calls[0]?.[0];
      expect(typeof firstArg).toBe("string");
      expect(firstArg.startsWith("[health]")).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
