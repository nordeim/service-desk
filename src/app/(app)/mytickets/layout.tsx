import type { Metadata } from "next";

// Per-route document titles (session 7) — see dashboard/layout.tsx for the
// rationale (client-island pages + reference per-route title pattern).
export const metadata: Metadata = {
  title: "My Tickets",
  // Session 8: per-route canonical (the reference sets one on every route).
  alternates: { canonical: "/mytickets" },
};

export default function MyTicketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
