import { describe, expect, it } from "vitest";

import { loginBounceUrl, safeRedirectTarget } from "@/lib/redirect";

// Session 19 (F1): the reference preserves the user's pre-auth destination
// via /login?from_url=<absolute url> — after login they land back on the
// deep-linked page, not the dashboard. safeRedirectTarget is the seam that
// turns the raw from_url param into a safe internal navigation target:
// same-origin only, auth-page targets rejected (loop prevention), query
// preserved (the ticketdetails ?id= case), /dashboard as the fallback.
describe("safeRedirectTarget", () => {
  const ORIGIN = "http://localhost:3000";

  it("returns /dashboard when the param is missing or empty", () => {
    expect(safeRedirectTarget(null, ORIGIN)).toBe("/dashboard");
    expect(safeRedirectTarget(undefined, ORIGIN)).toBe("/dashboard");
    expect(safeRedirectTarget("", ORIGIN)).toBe("/dashboard");
  });

  it("accepts a same-origin absolute URL and returns path + search", () => {
    expect(safeRedirectTarget(`${ORIGIN}/mytickets`, ORIGIN)).toBe("/mytickets");
    expect(
      safeRedirectTarget(`${ORIGIN}/ticketdetails?id=abc123`, ORIGIN)
    ).toBe("/ticketdetails?id=abc123");
  });

  it("accepts a relative path and preserves its query", () => {
    expect(safeRedirectTarget("/submitticket", ORIGIN)).toBe("/submitticket");
    expect(safeRedirectTarget("/ticketdetails?id=x%20y", ORIGIN)).toBe(
      "/ticketdetails?id=x%20y"
    );
  });

  it("rejects cross-origin absolute URLs (open-redirect guard)", () => {
    expect(safeRedirectTarget("https://evil.example/path", ORIGIN)).toBe(
      "/dashboard"
    );
    expect(safeRedirectTarget("http://localhost:3000.evil.com/", ORIGIN)).toBe(
      "/dashboard"
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectTarget("//evil.example/path", ORIGIN)).toBe(
      "/dashboard"
    );
  });

  it("rejects auth-page targets (login-loop prevention)", () => {
    expect(safeRedirectTarget(`${ORIGIN}/login`, ORIGIN)).toBe("/dashboard");
    expect(safeRedirectTarget(`${ORIGIN}/signup`, ORIGIN)).toBe("/dashboard");
    expect(
      safeRedirectTarget(`${ORIGIN}/forgotpassword`, ORIGIN)
    ).toBe("/dashboard");
    expect(safeRedirectTarget("/login?from_url=x", ORIGIN)).toBe("/dashboard");
  });

  it("drops the hash (client-side-only state, never a server target)", () => {
    expect(
      safeRedirectTarget(`${ORIGIN}/mytickets#section`, ORIGIN)
    ).toBe("/mytickets");
  });

  it("falls back to /dashboard on unparseable input", () => {
    expect(safeRedirectTarget("http://", ORIGIN)).toBe("/dashboard");
  });

  it("resolves scheme-relative-bare words against the origin safely", () => {
    // A bare word resolves relative to the origin → a root-level path.
    // It is NOT an external redirect, but it is not a designed app surface
    // either — the path lands outside the (app) group's routes and the
    // router handles it as a normal internal navigation (404 if unknown).
    expect(safeRedirectTarget("dashboard", ORIGIN)).toBe("/dashboard");
  });
});

// Session 37 (P1): the layout-side from_url bounce. The reference's
// client-side gate preserves the pre-auth destination in ALL unauthenticated
// cases — expired session included (bundle-verified). Our server-side split
// only decorated the cookie-less fast path (the proxy's 307); the
// cookie-present-but-INVALID request hit the (app) layout's plain /login
// redirect and LOST the deep link (measured: 307 Location: /login). The fix
// passes the proxy-constructed target to the layout as a request header;
// loginBounceUrl is the pure seam the layout consumes to build the bounce
// URL — the mirror of the proxy's Location construction.
describe("loginBounceUrl", () => {
  it("returns the plain /login when no target is available (the defensive fallback)", () => {
    expect(loginBounceUrl(null)).toBe("/login");
    expect(loginBounceUrl(undefined)).toBe("/login");
  });

  it("encodes the target as the from_url param (the layout-side deep-link bounce)", () => {
    expect(loginBounceUrl("http://localhost:3000/ticketdetails?id=abc123")).toBe(
      "/login?from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Dabc123"
    );
    // The query inside the target survives as encoded data, not as live
    // params of the bounce URL — one from_url param exactly.
    expect(loginBounceUrl("http://localhost:3000/dashboard")).toBe(
      "/login?from_url=http%3A%2F%2Flocalhost%3A3000%2Fdashboard"
    );
  });
});
