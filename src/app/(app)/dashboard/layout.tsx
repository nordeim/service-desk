import type { Metadata } from "next";

// Per-route document titles (session 7): the reference sets per-route titles
// ("/mytickets" → "Mytickets | ServiceDesk", live-measured); ours were static
// ("ServiceDesk | IT Support Portal") on every route. Superset: proper-cased
// page names over the reference's concatenated route segments. The pages are
// client islands ("use client" — they cannot export metadata), so the title
// lives on a passthrough server layout per route folder.
export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
