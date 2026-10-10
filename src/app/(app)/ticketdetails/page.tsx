import type { Metadata } from "next";

import { routeHead } from "@/lib/route-head";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { TicketDetailsView } from "./ticket-details-view";

// Session 14: the page is a server wrapper so the route's head can carry the
// FULL canonicalized URL the reference's platform emits — on
// /ticketdetails?id=X their canonical + og:url + twitter:url (and their
// BreadcrumbList JSON-LD item) all include the query string (live-measured;
// the s12 set was only ever measured on query-less routes). generateMetadata
// awaiting searchParams forces the route dynamic (it already rendered
// on-demand); the client island moved, byte-unchanged, to
// ticket-details-view.tsx. The breadcrumb moved here from the layout because
// only the page can see the searchParams (layouts never receive them).
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function resolveId(sp: Record<string, string | string[] | undefined>): string | null {
  const raw = Array.isArray(sp.id) ? sp.id[0] : sp.id;
  // An empty ?id= is the s11 Alert state — canonicalize to the bare segment
  // (no query invented for degenerate states, the s12 404-canonical decision).
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const id = resolveId(await searchParams);
  return routeHead(id ? `/ticketdetails?id=${id}` : "/ticketdetails");
}

export default async function TicketDetailsPage({ searchParams }: PageProps) {
  const id = resolveId(await searchParams);
  return (
    <>
      <BreadcrumbJsonLd segment="ticketdetails" query={id ? `?id=${id}` : undefined} />
      <TicketDetailsView />
    </>
  );
}
