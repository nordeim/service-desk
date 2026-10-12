import { describe, it, expect } from "vitest";
// The config-contract seam (the tests/db-path.test.ts level): next.config.ts
// is a plain TS module, so the exported NextConfig object can be imported and
// its async headers() invoked directly — pinning the response-header contract
// (the session-30 P1: the HSTS parity header + the poweredByHeader lockdown;
// the session-34 P1: the API-namespace no-store contract + the s15 attachment
// exception) at the source of truth, with the live surface pinned in
// scripts/smoke-test.sh (the s30 + s34 blocks) against the real standalone
// server.
import nextConfig from "../next.config";

// The NextConfig type's Header lives in Next's internal dist tree (not a
// stable export), so the contract is pinned with a structural local type —
// identical in shape to what next.config.headers() returns.
type Header = { key: string; value: string };
type HeadersRule = { source: string; headers: Header[] };

const EXPECTED_SECURITY_HEADERS: Header[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Session 30 — the reference-parity HSTS contract: the reference's stack
  // emits `Strict-Transport-Security: max-age=31536000` on EVERY response
  // (measured on their 200s, 405s, and catch-all 200s). Our app-level rule
  // now emits the same value universally — inert over plain HTTP (RFC 6797),
  // effective behind any TLS-terminating proxy. No includeSubDomains/preload:
  // those are host-policy decisions, not parity.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

// Session 34 — the API-namespace no-store contract + the s15 exception.
// Every authenticated JSON response under /api/** carried NO Cache-Control
// (measured live: /api/auth/me — the user's id/name/email — /api/tickets,
// /api/stats, all 200 with only the Next RSC Vary set). Cookie sessions ride
// the Cookie header, which RFC 9111's mandatory shared-cache no-store (the
// Authorization-header rule) does NOT cover — a shared intermediary could
// store these responses keyed by URL and serve user A's identity JSON to
// user B. The blanket no-store closes the class, app-level (the s30 HSTS
// posture: inert locally, load-bearing behind any proxy).
const API_CACHE_CONTROL = "no-store";
// The s15 attachment-route exception: the year-long immutable private window
// (the measured reference-CDN contract, pinned since s15). A headers() rule
// OVERRIDES the route handler's own Cache-Control (measured empirically,
// session 34: the blanket alone clobbered the route-level value), so the
// exception must live as its OWN more-specific rule listed AFTER the blanket
// (later-in-array wins for the same key — the order is load-bearing).
const ATTACHMENT_CACHE_CONTROL = "private, max-age=31536000, immutable";

async function rules(): Promise<HeadersRule[]> {
  const r = (await nextConfig.headers?.()) as HeadersRule[];
  expect(r).toBeDefined();
  return r!;
}

describe("next.config headers contract (session 30)", () => {
  it("disables the X-Powered-By framework disclosure", () => {
    // The reference sends no framework disclosure on their app responses;
    // `X-Powered-By: Next.js` was an information leak on every HTML response.
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("defines exactly three header rules (the s34 evolution: universal + the API blanket + the attachment exception)", async () => {
    const r = await rules();
    // Session 30 shipped ONE universal rule; session 34 added the two
    // Cache-Control rules. The exact count is pinned so a future rule
    // lands as a DELIBERATE contract change, never by accident.
    expect(r.length).toBe(3);
  });

  it("keeps the universal rule matching every route (found by source, not array index)", async () => {
    const r = await rules();
    const universal = r.find((x) => x.source === "/(.*)");
    expect(universal).toBeDefined();
  });

  it("applies the full five-header security set with exact values on the universal rule", async () => {
    const r = await rules();
    const universal = r.find((x) => x.source === "/(.*)");
    expect(universal).toBeDefined();
    const applied = universal!.headers;
    // The exact set — no extras sneaking in, none missing.
    expect(applied.length).toBe(EXPECTED_SECURITY_HEADERS.length);
    for (const expected of EXPECTED_SECURITY_HEADERS) {
      const found = applied.find((h) => h.key === expected.key);
      expect(found, `header ${expected.key} must be configured`).toBeDefined();
      expect(found!.value).toBe(expected.value);
    }
  });

  it("carries the HSTS header (the reference-parity contract — session 30)", async () => {
    const r = await rules();
    const universal = r.find((x) => x.source === "/(.*)");
    const hsts = universal!.headers.find(
      (h) => h.key === "Strict-Transport-Security",
    );
    expect(hsts).toBeDefined();
    expect(hsts!.value).toBe("max-age=31536000");
  });
});

describe("next.config API cache-control contract (session 34)", () => {
  it("blankets the whole API namespace with Cache-Control: no-store", async () => {
    const r = await rules();
    const blanket = r.find((x) => x.source === "/api/:path*");
    expect(blanket, "the /api/:path* blanket rule must exist").toBeDefined();
    expect(blanket!.headers.length).toBe(1);
    expect(blanket!.headers[0]!.key).toBe("Cache-Control");
    expect(blanket!.headers[0]!.value).toBe(API_CACHE_CONTROL);
  });

  it("carries the s15 attachment exception with the exact immutable-private window", async () => {
    const r = await rules();
    const exception = r.find(
      (x) => x.source === "/api/tickets/:id/attachments/:attachmentId",
    );
    expect(
      exception,
      "the attachment exception rule must exist (the s15 contract)",
    ).toBeDefined();
    expect(exception!.headers.length).toBe(1);
    expect(exception!.headers[0]!.key).toBe("Cache-Control");
    expect(exception!.headers[0]!.value).toBe(ATTACHMENT_CACHE_CONTROL);
  });

  it("lists the attachment exception AFTER the blanket rule (the order is load-bearing — later-in-array wins for the same key)", async () => {
    const r = await rules();
    const blanketIndex = r.findIndex((x) => x.source === "/api/:path*");
    const exceptionIndex = r.findIndex(
      (x) => x.source === "/api/tickets/:id/attachments/:attachmentId",
    );
    expect(blanketIndex).toBeGreaterThanOrEqual(0);
    expect(exceptionIndex).toBeGreaterThan(blanketIndex);
  });

  it("keeps the blanket rule scoped to /api (never leaking no-store onto the pages or static assets)", async () => {
    const r = await rules();
    // Only the two API-shaped sources may set Cache-Control — the universal
    // rule must NOT carry one (the pages' cache posture is the framework's:
    // the authenticated dynamic pages already ship no-store; the static auth
    // pages keep the prerender default — documented s34 non-goals).
    const universal = r.find((x) => x.source === "/(.*)");
    const universalCC = universal!.headers.find(
      (h) => h.key.toLowerCase() === "cache-control",
    );
    expect(universalCC).toBeUndefined();
  });
});
