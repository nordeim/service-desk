import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

// Session 36: the proxy-contract pin set — the from_url construction seam.
//
// src/proxy.ts shipped in session 19 and has carried the auth-gate deep-link
// contract through 17 sessions with ZERO direct tests: its behavior was
// pinned only indirectly (the E2E happy-path round-trip + the login page's
// safeRedirectTarget unit pins). The s36 audit measured the construction
// under the full header matrix (spoofed Host, X-Forwarded-Proto,
// X-Forwarded-Host) and found the architecture HOLDS — two independent
// guard layers neutralize every measured spoof:
//   1. The Location the proxy emits is RELATIVE at the live boundary (/login
//      — the middleware runner relativizes it), so the browser never leaves
//      the real origin; and
//   2. The from_url VALUE is validated against the BROWSER'S own origin at
//      use time by safeRedirectTarget (the unit-pinned open-redirect guard
//      in src/lib/__tests__/redirect.test.ts) before any router.push.
// These pins freeze that verified behavior so it cannot drift silently.
//
// The direct-call pattern (the tests/api-catchall.test.ts precedent): the
// handler is pure — it reads the request's cookies/headers/nextUrl and
// returns a NextResponse; the seam is the handler signature itself.
//
// Documented boundary — the X-Forwarded-Proto FLIP is runtime-only: in the
// live middleware runner, nextUrl.protocol honors the X-Forwarded-Proto
// header (measured: the from_url protocol flips to https), but a directly
// constructed NextRequest derives nextUrl.protocol from the URL string, so
// the flip CANNOT be reproduced here. It is pinned LIVE in the smoke
// script's s36 block (scripts/smoke-test.sh) against the real standalone
// server, where the middleware runner is in the loop.
import proxy, { config } from "@/proxy";
import { SESSION_COOKIE } from "@/lib/auth";

const ORIGIN = "http://localhost:3000";

function call(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`${ORIGIN}${path}`, { headers }));
}

function redirectTarget(res: ReturnType<typeof proxy>): {
  pathname: string;
  fromUrl: string | null;
  location: string | null;
} {
  const location = res.headers.get("location");
  if (!location) return { pathname: "", fromUrl: null, location: null };
  // The direct call yields an ABSOLUTE Location (the live runner relativizes
  // it — the live pin is in the smoke block); parse it regardless of shape.
  const url = new URL(location, ORIGIN);
  return {
    pathname: url.pathname,
    fromUrl: url.searchParams.get("from_url"),
    location,
  };
}

describe("proxy: the auth-gate deep-link construction (the s19 seam)", () => {
  it("passes a cookie-carrying request straight through (no redirect)", () => {
    const res = call("/dashboard", { cookie: `${SESSION_COOKIE}=abc` });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("location")).toBeNull();
  });

  it("decorates a cookie-less guarded-route bounce with the full absolute from_url", () => {
    const res = call("/dashboard");
    expect(res.status).toBe(307);
    const target = redirectTarget(res);
    expect(target.pathname).toBe("/login");
    expect(target.fromUrl).toBe("http://localhost:3000/dashboard");
  });

  it("preserves the query in the from_url (the shared deep-link contract)", () => {
    const res = call("/ticketdetails?id=abc123");
    const target = redirectTarget(res);
    expect(target.pathname).toBe("/login");
    expect(target.fromUrl).toBe("http://localhost:3000/ticketdetails?id=abc123");
  });

  it("reflects a spoofed Host header into the from_url — the documented INERT reflection", () => {
    // The s36 measured behavior: the Host header is attacker-controllable on
    // a direct request, and the from_url carries it verbatim. The reflection
    // is INERT by two independent layers (see the file header): the live
    // Location stays RELATIVE (/login — the browser stays on-origin), and the
    // value is rejected at use time by safeRedirectTarget's browser-origin
    // check (pinned in src/lib/__tests__/redirect.test.ts). This pin freezes
    // the construction so a change to the host source is caught — the
    // reflection itself is the documented posture, not a defect.
    const res = proxy(
      new NextRequest("http://127.0.0.1:3000/dashboard", {
        headers: { host: "evil.example" },
      })
    );
    const target = redirectTarget(res);
    expect(target.pathname).toBe("/login");
    expect(target.fromUrl).toBe("http://evil.example/dashboard");
  });

  it("ignores X-Forwarded-Host (the Host header wins)", () => {
    const res = call("/dashboard", {
      "x-forwarded-host": "evil.example",
    });
    const target = redirectTarget(res);
    expect(target.fromUrl).toBe("http://localhost:3000/dashboard");
  });
});

describe("proxy: the matcher boundary (the four-route contract)", () => {
  it("gates exactly the four (app) routes — no auth, no API, no sub-paths", () => {
    // The documented s19 boundary: unmatched sub-paths (e.g.
    // /dashboard/nonexistent) render the public 404 and must NOT be gated,
    // and no auth or API route may be decorated (the login page itself must
    // stay reachable undecorated — a /login matcher would loop the gate).
    expect(config.matcher).toEqual([
      "/dashboard",
      "/submitticket",
      "/mytickets",
      "/ticketdetails",
    ]);
  });
});
