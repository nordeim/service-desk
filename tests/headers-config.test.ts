import { describe, it, expect } from "vitest";
// The config-contract seam (the tests/db-path.test.ts level): next.config.ts
// is a plain TS module, so the exported NextConfig object can be imported and
// its async headers() invoked directly — pinning the response-header contract
// (the session-30 P1: the HSTS parity header + the poweredByHeader lockdown)
// at the source of truth, with the live surface pinned in scripts/smoke-test.sh
// (the s30 block) against the real standalone server.
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

describe("next.config headers contract (session 30)", () => {
  it("disables the X-Powered-By framework disclosure", () => {
    // The reference sends no framework disclosure on their app responses;
    // `X-Powered-By: Next.js` was an information leak on every HTML response.
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("defines exactly one universal header rule matching every route", async () => {
    const rules = (await nextConfig.headers?.()) as HeadersRule[];
    expect(rules).toBeDefined();
    expect(rules!.length).toBe(1);
    expect(rules![0].source).toBe("/(.*)");
  });

  it("applies the full five-header security set with exact values", async () => {
    const rules = (await nextConfig.headers?.()) as HeadersRule[];
    const applied = rules![0].headers;
    // The exact set — no extras sneaking in, none missing.
    expect(applied.length).toBe(EXPECTED_SECURITY_HEADERS.length);
    for (const expected of EXPECTED_SECURITY_HEADERS) {
      const found = applied.find((h) => h.key === expected.key);
      expect(found, `header ${expected.key} must be configured`).toBeDefined();
      expect(found!.value).toBe(expected.value);
    }
  });

  it("carries the HSTS header (the reference-parity contract — session 30)", async () => {
    const rules = (await nextConfig.headers?.()) as HeadersRule[];
    const hsts = rules![0].headers.find(
      (h) => h.key === "Strict-Transport-Security",
    );
    expect(hsts).toBeDefined();
    expect(hsts!.value).toBe("max-age=31536000");
  });
});
