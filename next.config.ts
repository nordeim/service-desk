import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin file tracing to this project so the standalone server always lands
  // at .next/standalone/server.js — even when the repo is cloned inside a
  // parent workspace that has its own lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Hide the dev-mode toast/indicator bubble: it renders as a fixed dark
  // circle at the bottom-left of the viewport, which overlaps the sidebar's
  // user footer and pollutes screenshots and visual-parity checks. It only
  // exists in `next dev` (production builds never render it).
  devIndicators: false,
  // Suppress the `X-Powered-By: Next.js` disclosure (session 30): the
  // reference's app responses carry no framework disclosure, and the header
  // leaks the stack to any caller for free. Pure parity + hardening — no
  // behavioral change.
  poweredByHeader: false,
  // Baseline security headers (the (app) route-group layout enforces auth;
  // these headers harden every response). Session 30 added HSTS for parity:
  // the reference's stack emits `Strict-Transport-Security: max-age=31536000`
  // on every response (their CDN edge); we emit it from the app itself —
  // inert over plain HTTP (RFC 6797 browsers must ignore it on insecure
  // transport, so dev/E2E/smoke are unaffected) and effective behind any
  // TLS-terminating proxy without depending on an undocumented proxy rule
  // (the s17/s21 deferral was never operationalized in DEPLOYMENT.md).
  // No includeSubDomains/preload: host-policy decisions, not parity.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

export default nextConfig;
