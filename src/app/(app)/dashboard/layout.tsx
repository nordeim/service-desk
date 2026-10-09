import type { Metadata } from "next";

import { routeHead } from "@/lib/route-head";

// Per-route document titles (session 7): the reference sets per-route titles
// ("/mytickets" → "Mytickets | ServiceDesk", live-measured); ours were static
// ("ServiceDesk | IT Support Portal") on every route. Superset: proper-cased
// page names over the reference's concatenated route segments. The pages are
// client islands ("use client" — they cannot export metadata), so the title
// lives on a passthrough server layout per route folder.
//
// Session 8 added the per-route canonical; session 12 corrected the record —
// og:url does NOT derive from it (Next emits og:url only from openGraph.url).
// The full per-route social URL set (canonical + og:url + twitter:url) now
// rides routeHead.
export const metadata: Metadata = {
  title: "Dashboard",
  ...routeHead("/dashboard"),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
