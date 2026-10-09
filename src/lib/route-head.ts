import type { Metadata } from "next";

// Session 12: the single source for the canonical origin — the same value
// the root layout's metadataBase resolves against. Exported so the two can
// never drift (the picker/list lesson from session 10).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The reference's own description text (session-8 live measure).
const DESCRIPTION =
  "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.";

// The per-route social URL set the reference's platform emits on EVERY route
// (session-12 live measure): <link rel=canonical> + <meta property="og:url"> +
// <meta name="twitter:url">, all three equal. Two Next-16 facts make this a
// helper rather than a line per layout:
//
// 1. og:url is emitted ONLY from openGraph.url (resolveOpenGraph sets it to
//    null otherwise) — NOTHING derives it from alternates.canonical. The
//    session-8 comment claiming otherwise was a false belief that shipped no
//    og:url for four sessions.
// 2. A child's openGraph REPLACES the parent's wholesale in the metadata
//    merge — so this object carries the full og set (the root's block,
//    verbatim) plus the url. Dropping a field here would silently drop the
//    og meta on every route that spreads it — pinned by the session-12
//    mechanism test.
//
// twitter:url has no field in the twitter metadata type (the renderer emits
// only known keys), so it rides metadata.other — and `other` values are NOT
// resolved against metadataBase, hence the absolute URL below.
export function routeHead(
  segment: string,
): Pick<Metadata, "alternates" | "openGraph" | "twitter" | "other"> {
  return {
    alternates: { canonical: segment },
    openGraph: {
      type: "website",
      siteName: "ServiceDesk",
      description: DESCRIPTION,
      images: [{ url: "/icon.png", width: 512, height: 512, alt: "ServiceDesk" }],
      url: segment,
    },
    twitter: {
      card: "summary_large_image",
      description: DESCRIPTION,
    },
    other: { "twitter:url": new URL(segment, SITE_URL).href },
  };
}
