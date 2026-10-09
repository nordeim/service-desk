// Session 11: the reference ships a BreadcrumbList JSON-LD in the <head>
// on every route EXCEPT /dashboard (their builder special-cases its home
// route — the same route map that plain-titles /dashboard to "ServiceDesk";
// a Home→home breadcrumb is noise, and mirroring the ABSENCE is as much
// parity as mirroring the presence). Live-measured contract: position 1 is
// "Home" → the origin; position 2 is the LOWERCASE PATH SEGMENT VERBATIM
// ("login", "mytickets", "submitticket", "ticketdetails") → the route URL.
// Absolute URLs derive from NEXT_PUBLIC_SITE_URL (the sitemap.ts precedent).
//
// Rendered by the per-route SERVER layouts (mytickets/submitticket/
// ticketdetails + login/signup/forgotpassword) next to {children} — the
// session-7 pattern for head-level markup on client-island pages. The
// dangerouslySetInnerHTML <script> is Next's documented structured-data
// pattern; this component never renders on the client.

export function BreadcrumbJsonLd({ segment }: { segment: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: segment, item: `${base}/${segment}` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
