import type { Metadata } from "next";

import { routeHead } from "@/lib/route-head";

// Per-route document titles (session 7) — see dashboard/layout.tsx for the
// rationale (client-island pages + reference per-route title pattern).
// Session 14: the BreadcrumbList JSON-LD moved from here into the route's
// server PAGE wrapper — the reference's builder canonicalizes the current
// URL, so the ticketdetails breadcrumb item carries ?id=<id> when one
// exists, and only the page can read searchParams. The routeHead spread
// stays for the bare-route fallback; the page's generateMetadata overrides
// the alternates/openGraph/twitter/other keys per-URL when an id exists.
export const metadata: Metadata = {
  title: "Ticket Details",
  ...routeHead("/ticketdetails"),
};

export default function TicketDetailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
