import { describe, expect, it, vi } from "vitest";
import { OG_IMAGES, SITE_URL, routeHead } from "@/lib/route-head";

// ---------------------------------------------------------------------------
// Session 54 — the missing unit layer for the s12 social URL seam (the s54
// coverage closure: the PAD §7.3 claim "every pure seam in src/lib/ is
// unit-tested" was FALSE for this file for 42 sessions — it landed at
// dcfc542 (session 12) with E2E mechanism pins only. The behavior was never
// wrong; the CLAIM was. These pins hold the seam's contract at the unit
// layer (no server, no DOM):
//   - the s12 trio: canonical + og:url + twitter:url all equal, twitter:url
//     as the segment's absolute (the reference's platform emits the set on
//     every route);
//   - the s17 wholesale-REPLACES lesson: the og block carries the FULL set —
//     a dropped field would silently drop og meta on every route that
//     spreads it;
//   - the s17 declaration-is-a-claim doctrine: OG_IMAGES declares the real
//     512x512 PNG (the reference's 1200x630-vs-480x480-JPEG is their defect,
//     never mirrored);
//   - the s8 live-measured DESCRIPTION freeze.
// The E2E layer keeps the per-route mechanism pins (visual-parity.spec.ts);
// this file pins the seam itself.
// ---------------------------------------------------------------------------

const SEGMENTS = ["/dashboard", "/mytickets", "/ticketdetails?id=cmv8abc"] as const;

describe("session 54: the route-head social URL set (the s12 seam, unit-pinned at last)", () => {
  it("the s12 trio agreement: canonical == og:url == the segment, twitter:url == the segment's absolute", () => {
    for (const segment of SEGMENTS) {
      const h = routeHead(segment);
      expect(h.alternates?.canonical, `canonical for ${segment}`).toBe(segment);
      expect(h.openGraph?.url, `og:url for ${segment}`).toBe(segment);
      expect(h.other?.["twitter:url"], `twitter:url for ${segment}`).toBe(new URL(segment, SITE_URL).href);
    }
  });

  it("the og-set completeness (the s17 wholesale-REPLACES lesson): a dropped field silently drops og meta on every route that spreads it", () => {
    const h = routeHead("/dashboard");
    // the og block carries the FULL set — the root's block verbatim plus the url
    // (the OpenGraph type is a union — the bare OpenGraphMetadata member carries
    // no type field, so the type access narrows the same way)
    const og = h.openGraph as { type?: string } | null | undefined;
    expect(og?.type).toBe("website");
    expect(h.openGraph?.siteName).toBe("ServiceDesk");
    expect(h.openGraph?.url).toBe("/dashboard");
    expect(typeof h.openGraph?.description).toBe("string");
    expect(h.openGraph?.images).toBe(OG_IMAGES); // the single source — root layout and routeHead can never drift apart
    // the twitter block carries its pair (the Twitter type is a union — the
    // bare TwitterMetadata member carries no card, so the card access narrows)
    const tw = h.twitter as { card?: string } | null | undefined;
    expect(tw?.card).toBe("summary_large_image");
    expect(typeof h.twitter?.description).toBe("string");
  });

  it("the asset-truth pair: OG_IMAGES declares the real 512x512 PNG (a declaration is a claim — the s17 doctrine); SITE_URL falls back to the localhost canonical when the env is unset", async () => {
    expect(OG_IMAGES).toEqual([{ url: "/icon-512.png", width: 512, height: 512, alt: "ServiceDesk" }]);
    // the fallback + the derivation, measured on a FRESH module read (the
    // module-scope env read happens once per evaluation — resetModules gives
    // this test its own, with the env deliberately unset)
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    try {
      const fresh = await import("@/lib/route-head");
      expect(fresh.SITE_URL).toBe("http://localhost:3000");
      expect(fresh.routeHead("/anywhere").other?.["twitter:url"]).toBe("http://localhost:3000/anywhere");
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prev;
      vi.resetModules();
    }
  });

  it("the DESCRIPTION freeze (the s8 live measure) — the exact string on BOTH the og and twitter blocks", () => {
    const h = routeHead("/submitticket");
    const expected = "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently.";
    expect(h.openGraph?.description).toBe(expected);
    expect(h.twitter?.description).toBe(expected);
  });
});
