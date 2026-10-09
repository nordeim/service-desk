import type { Metadata } from "next";

// Per-route document titles (session 7) — see dashboard/layout.tsx for the
// rationale (client-island pages + reference per-route title pattern).
export const metadata: Metadata = {
  title: "Ticket Details",
};

export default function TicketDetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
