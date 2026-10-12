import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loginBounceUrl } from "@/lib/redirect";
import { AppSidebarChrome } from "@/components/app-sidebar-chrome";
import { ToastProvider } from "@/components/toast";

// Authenticated route-group layout: every page under (app) — /dashboard,
// /submitticket, /mytickets, /ticketdetails — renders inside the sidebar
// chrome, and unauthenticated visitors are bounced to /login BEFORE any
// page markup streams.
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // Session 37 (P1): the verify-FAILURE bounce preserves the deep link.
    // The proxy (which never resolves sessions — the ADR-001 boundary)
    // forwards its constructed target as the x-sd-from-url request header
    // on cookie-present requests; an invalid or expired token reaches THIS
    // verify, and the bounce carries the same from_url the cookie-less
    // path gets (the reference's client-side gate preserves it in ALL
    // unauthenticated cases, expired session included). The header is
    // proxy-controlled (the overwrite is total — a client-supplied value
    // never survives the matcher), and the relayed value stays inert at
    // use time: safeRedirectTarget validates it against the browser's
    // origin on the login page. The plain /login is the defensive fallback
    // (the layout is only reachable behind the proxy for these routes).
    const target = (await headers()).get("x-sd-from-url");
    redirect(loginBounceUrl(target));
  }

  return (
    <ToastProvider>
      <AppSidebarChrome user={user}>{children}</AppSidebarChrome>
    </ToastProvider>
  );
}
