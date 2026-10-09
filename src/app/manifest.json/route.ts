import type { MetadataRoute } from "next";

// Session 11: the reference ships a PWA manifest at /manifest.json (302 →
// their platform API) linked from the head. Fields live-measured this
// session: name/short_name "ServiceDesk", their description, icons at
// 192x192 + 512x512, start_url = the origin, display "standalone",
// theme_color #000000, background_color #ffffff, scope = the origin.
//
// Implementation note: Next's app/manifest.ts convention serves
// /manifest.webmanifest AND auto-emits a head link to it — overriding the
// metadata.manifest field. The reference's URL is /manifest.json, so this
// is a plain route handler at that exact URL instead (the head link comes
// from metadata.manifest in src/app/layout.tsx).
//
// Production-sane mirror (the sitemap precedent): the absolute URLs derive
// from NEXT_PUBLIC_SITE_URL — a static absolute URL would be wrong across
// deployments. The icons are REAL size-correct PNGs (public/icon-192.png +
// icon-512.png, generated from the same 480x480 logo the reference declares
// both sizes against) instead of their two size declarations on one file.
function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    name: "ServiceDesk",
    short_name: "ServiceDesk",
    description:
      "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    start_url: `${base}/`,
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff",
    scope: `${base}/`,
  };
}

export function GET() {
  return Response.json(manifest());
}
