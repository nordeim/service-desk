import { describe, it, expect } from "vitest";
// The s40 method-shape seam (the tests/headers-config.test.ts level: the
// source-of-truth pin — the LIVE surface is pinned by the s40 block in
// scripts/smoke-test.sh against the real standalone server). Session 40's
// P1: every unimplemented method on every known /api route answered the
// framework's 405 with an EMPTY body and NO content-type — the JSON
// boundary the s33 catch-all closed for unknown PATHS was still open at
// the METHOD level (a JSON client PUT'ing /api/tickets got an unparseable
// response; the reference's platform answers a JSON 405, measured live).
// The fix pairs every stub with an explicit OPTIONS because exporting a
// 405-stub method makes Next's AUTO-OPTIONS advertise it as ALLOWED
// (experiment-measured: with a PUT stub, OPTIONS /api/health flipped to
// "GET, HEAD, OPTIONS, PUT" — a lie) — the explicit honest advertisement
// is part of the same contract.
import { methodNotAllowed, optionsNoContent } from "../src/lib/api-methods";

describe("api-methods seam (session 40)", () => {
  it("methodNotAllowed answers 405 with the exact {error} envelope and the RFC-mandated Allow header", async () => {
    const res = methodNotAllowed("GET, HEAD, OPTIONS");
    expect(res.status).toBe(405);
    // RFC 9110 §15.5.6: a 405 MUST carry Allow — the framework default
    // shipped none (the second half of the s40 finding).
    expect(res.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
    // The s32/s33 single-message convention: {error} — the reference's
    // FastAPI envelope (error_type/message/detail) is platform exhaust,
    // never mirrored; the parity axis is JSON-parseability.
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["error"]);
    expect(body.error).toBe("Method not allowed");
  });

  it("methodNotAllowed carries the honest allow list for a POST-only route", () => {
    const res = methodNotAllowed("POST, OPTIONS");
    expect(res.headers.get("allow")).toBe("POST, OPTIONS");
  });

  it("optionsNoContent answers 204 with an empty body and the honest Allow advertisement", async () => {
    const res = optionsNoContent("GET, HEAD, OPTIONS");
    expect(res.status).toBe(204);
    expect(res.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
    // The auto-OPTIONS contract the s32 pin froze: empty body on 204.
    expect(await res.text()).toBe("");
  });
});
