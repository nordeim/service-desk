import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppSidebarChrome } from "@/components/app-sidebar-chrome";
import { ToastProvider } from "@/components/toast";

// Authenticated route-group layout: every page under (app) — /dashboard,
// /submitticket, /mytickets, /ticketdetails — renders inside the sidebar
// chrome, and unauthenticated visitors are bounced to /login BEFORE any
// page markup streams.
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <AppSidebarChrome user={user}>{children}</AppSidebarChrome>
    </ToastProvider>
  );
}
