import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/route-head";
import "./globals.css";

// Reference parity (measured session 5): the reference app loads NO webfont —
// its body computes Tailwind's default system stack (ui-sans-serif, system-ui,
// …). The next/font Inter here was an unmeasured session-1 assumption and a
// real family-level divergence (~10% text-width deltas on button labels),
// so it was removed; `font-sans` now resolves to the default stack. The
// reference also leaves font smoothing at `auto` (no `antialiased`).

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ServiceDesk | IT Support Portal",
    template: "%s | ServiceDesk",
  },
  // Session 8 (live-measured from the reference's <head>): their description
  // text — parity over our older wording.
  description:
    "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.",
  // Session 8: the reference ships a full social/PWA meta set per route —
  // og:title/description/type/site_name/image, twitter:card
  // summary_large_image, apple-mobile-web-app-*. og:title follows the title
  // template above. Session 12 correction: og:url does NOT derive from the
  // per-route canonical (a false s8-era belief — Next emits og:url only from
  // openGraph.url); the per-route social URL set (canonical + og:url +
  // twitter:url) now ships via src/lib/route-head.ts on the route layouts.
  openGraph: {
    type: "website",
    siteName: "ServiceDesk",
    description:
      "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "ServiceDesk" }],
  },
  twitter: {
    card: "summary_large_image",
    description:
      "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.",
  },
  appleWebApp: {
    capable: true,
    title: "ServiceDesk",
    statusBarStyle: "black",
  },
  // Session 11: the reference's head links rel="manifest" -> /manifest.json
  // (their platform API behind a 302). Ours is the app/manifest.ts route.
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Session 11 (live-measured): the reference ships
  // <meta name="theme-color" content="#000000"> — missed by the session-8
  // social/PWA sweep. Next 16 emits it from the Viewport export.
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
