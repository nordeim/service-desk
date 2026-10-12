// Session 35 — the request-size contract (the s34-deferred leading candidate,
// measured this session): the shared parseBodySize seam (a Content-Length
// ceiling checked BEFORE the body is read) + the MAX_BODY_BYTES constant
// contract. A NEW file (not domain.test.ts) so the RED run of a not-yet-
// implemented seam fails THIS file alone, not the whole domain suite.
//
// The measured facts this contract pins (the gap analysis, worklog 88-gap-s35):
//   - a 20 MB JSON body on the CREATE was fully buffered + parsed + rejected
//     at the VALUE level (199 ms) — no route-level cap existed;
//   - the legitimate maximum is ~8,394,006 bytes (3 x 2 MiB canonical base64
//     + the 5000-char description + title + JSON structure, measured);
//   - the reference's platform caps nothing (the s23 15 MiB record) — the cap
//     is OUR DoS-hardening superset, like the s21 rate limiter.
import { describe, expect, it } from "vitest";
import { MAX_BODY_BYTES } from "@/lib/constants";
import { parseBodySize } from "@/lib/validation";

describe("MAX_BODY_BYTES (s35: the constant contract)", () => {
  it("is 10 MiB — the measured legitimate max (~8.39 MB) plus ~20% headroom", () => {
    expect(MAX_BODY_BYTES).toBe(10 * 1024 * 1024);
  });
  it("comfortably admits the legitimate maximum body (the headroom pin)", () => {
    // The worst legitimate request: 3 x 2 MiB attachments as canonical base64
    // + a 120-char title + a 5000-char description + the JSON structure.
    const canonicalB64Len = 4 * Math.ceil((2 * 1024 * 1024) / 3); // one attachment
    const legitMax =
      canonicalB64Len * 3 + // the three attachment payloads
      120 + // title
      5000 + // description
      2048; // the per-file metadata + the JSON structure + escapes, generous
    expect(legitMax).toBeLessThan(MAX_BODY_BYTES);
    // ...and not absurdly generous: within 25% of the legitimate max, so the
    // ceiling cannot silently drift to a meaningless number.
    expect(MAX_BODY_BYTES).toBeLessThan(legitMax * 1.25);
  });
});

describe("parseBodySize (s35: the Content-Length ceiling — checked before the body is read)", () => {
  it("admits a null header (chunked bodies: no pre-read signal, the value caps still apply)", () => {
    expect(parseBodySize(null).ok).toBe(true);
  });
  it("admits an empty-string header (malformed at the HTTP layer; Node rejects it before the handler)", () => {
    expect(parseBodySize("").ok).toBe(true);
  });
  it("admits a zero-length body", () => {
    expect(parseBodySize("0").ok).toBe(true);
  });
  it("admits a normal body", () => {
    expect(parseBodySize("1024").ok).toBe(true);
  });
  it("admits exactly MAX_BODY_BYTES (the inclusive boundary)", () => {
    expect(parseBodySize(String(MAX_BODY_BYTES)).ok).toBe(true);
  });
  it("rejects one byte over the ceiling with the self-documenting message", () => {
    const r = parseBodySize(String(MAX_BODY_BYTES + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe(
        `request body too large: ${MAX_BODY_BYTES + 1} bytes (max ${MAX_BODY_BYTES})`,
      );
    }
  });
  it("rejects the measured 20 MB probe", () => {
    const r = parseBodySize(String(20 * 1024 * 1024));
    expect(r.ok).toBe(false);
  });
  it("rejects an absurd Content-Length without overflow", () => {
    const r = parseBodySize("99999999999999999999");
    expect(r.ok).toBe(false);
  });
  it("admits a non-numeric value (Node's HTTP parser rejects malformed lengths before the handler)", () => {
    // Documented pass-through: the seam's only job is the ceiling on the
    // well-formed lengths; garbage never reaches the handler.
    expect(parseBodySize("banana").ok).toBe(true);
  });
});
