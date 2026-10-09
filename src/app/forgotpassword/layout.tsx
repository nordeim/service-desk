import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";

// Session 11: the BreadcrumbList JSON-LD contract is per-route (the
// reference's builder emits Home → <segment>). Our /forgotpassword is a
// superset route (theirs renders empty) — the breadcrumb is the
// production-sane treatment of a real page, mirroring /login's contract.
// Passthrough server layout so the head-level markup renders outside the
// client island.
export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd segment="forgotpassword" />
      {children}
    </>
  );
}
