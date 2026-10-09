import type { Metadata } from "next";

// Per-route document titles (session 7) — see dashboard/layout.tsx for the
// rationale (client-island pages + reference per-route title pattern).
export const metadata: Metadata = {
  title: "Ticket Details",
  // Session 8: per-route canonical (the reference sets one on every route).
  // The page is query-driven (?id=…) — the bare route is the stable URL.
  alternates: { canonical: "/ticketdetails" },
};

export default function TicketDetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
