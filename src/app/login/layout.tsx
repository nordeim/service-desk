import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { routeHead } from "@/lib/route-head";

// Session 11: the reference ships a BreadcrumbList JSON-LD on /login
// (live-measured: Home → "login", the lowercase path segment). The page is
// a client island (session-10 view state machine), so the head-level markup
// lives on this passthrough server layout — the session-7 title pattern.
// The auth pages keep the root-default title (reference convention).
//
// Session 12: the per-route social URL set (canonical + og:url +
// twitter:url — the reference ships all three on /login, live-measured)
// rides routeHead; the title stays root-default by the s7 decision.
export const metadata: Metadata = {
  ...routeHead("/login"),
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd segment="login" />
      {children}
    </>
  );
}
