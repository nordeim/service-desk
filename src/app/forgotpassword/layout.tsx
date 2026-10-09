import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { routeHead } from "@/lib/route-head";

// Session 11: the BreadcrumbList JSON-LD contract is per-route (the
// reference's builder emits Home → <segment>). Our /forgotpassword is a
// superset route (theirs renders empty) — the breadcrumb is the
// production-sane treatment of a real page, mirroring /login's contract.
// Passthrough server layout so the head-level markup renders outside the
// client island.
//
// Session 12: the per-route social URL set (canonical + og:url +
// twitter:url — the reference's platform emits all three even on its empty
// scaffold routes; live-measured) rides routeHead on our real page.
export const metadata: Metadata = {
  ...routeHead("/forgotpassword"),
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd segment="forgotpassword" />
      {children}
    </>
  );
}
