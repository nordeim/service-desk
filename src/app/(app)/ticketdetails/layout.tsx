import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { routeHead } from "@/lib/route-head";

// Per-route document titles (session 7) — see dashboard/layout.tsx for the
// rationale (client-island pages + reference per-route title pattern).
export const metadata: Metadata = {
  title: "Ticket Details",
  // The page is query-driven (?id=…) — the bare route is the stable URL.
  // Session 12: the per-route social URL set (canonical + og:url +
  // twitter:url, the reference's per-route platform head) rides routeHead.
  ...routeHead("/ticketdetails"),
};

export default function TicketDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Session 11: the reference's per-route BreadcrumbList JSON-LD
          (name = the lowercase path segment). Dashboard carries NONE —
          their builder's home special case. */}
      <BreadcrumbJsonLd segment="ticketdetails" />
      {children}
    </>
  );
}
