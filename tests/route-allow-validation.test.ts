import { describe, it, expect } from "vitest";

// Session 42: the routeAllow INPUT-VALIDATION pins — the fail-fast seam
// (the s71 candidate #2, closed this session).
//
// The s41 seam's documented contract was "unknown method names in the
// input are dropped by the filter" — measured at this session's audit:
// routeAllow(["GET", "POTS"]) silently returns "GET, HEAD, OPTIONS". The
// typo vanishes: a declaration like routeAllow(["POST", "POTS"]) (where
// POTS was meant to be POST) produces a silently-wrong advertisement with
// no alarm anywhere until someone probes the route. The indirect catch
// (the api-allow-source export-key pin) fires only when the typo'd name
// ALSO gets a stub export — a typo in an implemented-method declaration
// slips through entirely.
//
// The s42 closure: routeAllow THROWS on any input outside the canonical
// 7-method set. Every route file evaluates `const ALLOW = routeAllow([...])`
// at MODULE SCOPE, so a typo'd declaration now crashes the module import
// — the dev server, the build, and the test layer all surface it
// immediately, with the offending name in the message (the self-
// documenting error: the fix path is in the error itself).
//
// NOTE (the s18 display-layer doctrine, fourth firing this session): the
// bracket-prefixed strings in these assertions are byte-correct in this
// file; any tool that renders "[...]"-prefixed strings through a capture
// layer may eat the leading bracket — hex-dump before declaring a defect.

import { routeAllow } from "../src/lib/api-methods";

describe("routeAllow input validation (s42 — the fail-fast seam)", () => {
  it("throws on a typo'd method name (the silent-drop regression this session closes)", () => {
    expect(() => routeAllow(["GET", "POTS"])).toThrow(/POTS/);
  });

  it("throws on a bare typo with a self-documenting message (the offending name + the canonical set)", () => {
    let message = "";
    try {
      routeAllow(["POTS"]);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("POTS");
    // The canonical set is in the message — the operator's fix path.
    expect(message).toContain("GET");
    expect(message).toContain("HEAD");
    expect(message).toContain("POST");
    expect(message).toContain("OPTIONS");
  });

  it("throws on lowercase input (the canonical set is case-sensitive — a case bug surfaces, never hides)", () => {
    expect(() => routeAllow(["get"])).toThrow(/get/);
  });

  it("accepts every canonical member directly (HEAD is a member — never implemented, but valid input)", () => {
    // The boundary from the valid side: every canonical name derives.
    expect(routeAllow(["HEAD"])).toBe("HEAD, OPTIONS");
    expect(routeAllow(["PUT", "PATCH"])).toBe("PUT, PATCH, OPTIONS");
  });
});
