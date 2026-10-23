import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin file tracing to this project so the standalone server always lands
  // at .next/standalone/server.js — even when the repo is cloned inside a
  // parent workspace that has its own lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
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
      // Session 34 — the API-namespace no-store contract (the cache-behavior
      // remediation): every authenticated JSON response under /api/** shipped
      // with NO Cache-Control (measured live: /api/auth/me — the user's
      // id/name/email — /api/tickets, /api/stats). Cookie sessions ride the
      // Cookie header, which RFC 9111's mandatory shared-cache no-store (the
      // Authorization-header rule) does NOT cover, so a shared intermediary
      // (corporate proxy / ISP cache / a CDN in front of the standalone) could
      // store these responses keyed by URL and serve one user's identity JSON
      // to another — the cross-user shared-cache leak, invisible in dev/E2E
      // exactly like the s15 timezone divergence. no-store (not private):
      // the strongest single directive; nothing in the app benefits from
      // caching these responses (the sidebar re-fetches /api/stats every 5s
      // by contract).
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      // Session 34 — the s15 exception (load-bearing ORDER): a headers()
      // rule OVERRIDES the route handler's own Cache-Control (measured
      // empirically: the blanket above alone clobbered the attachment
      // route's `private, max-age=31536000, immutable`), and a more-specific
      // rule listed AFTER the blanket WINS for the same key. This rule
      // restores the s15 year-long immutable private window on the
      // attachment download path — the byte-identical value the route sets
      // in code (src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts
      // stays untouched; the config now owns the final value and the
      // config-contract pin owns the config). Do NOT reorder these rules.
      {
        source: "/api/tickets/:id/attachments/:attachmentId",
        headers: [
          { key: "Cache-Control", value: "private, max-age=31536000, immutable" },
        ],
      },
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
