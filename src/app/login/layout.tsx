import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";

// Session 11: the reference ships a BreadcrumbList JSON-LD on /login
// (live-measured: Home → "login", the lowercase path segment). The page is
// a client island (session-10 view state machine), so the head-level markup
// lives on this passthrough server layout — the session-7 title pattern.
// The auth pages keep the root-default title (reference convention).
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd segment="login" />
      {children}
    </>
  );
}
