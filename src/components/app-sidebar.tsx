"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CirclePlus,
  FileText,
  LayoutDashboard,
  LogOut,
  Ticket,
  User as UserIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/components/toast";

export interface SidebarUser {
  id: string;
  email: string;
  name: string;
}

export interface SidebarStats {
  open: number;
  in_progress: number;
  total: number;
}

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Submit Ticket", href: "/submitticket", icon: CirclePlus },
  { title: "My Tickets", href: "/mytickets", icon: FileText },
];

// The sidebar chrome is a client island: session user comes from the server
// layout; QUICK STATS are refreshed on route change (cheap groupBy query).
export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();
  const [stats, setStats] = React.useState<SidebarStats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.global) {
          setStats({
            open: data.global.open,
            in_progress: data.global.in_progress,
            total: data.global.total,
          });
        }
      })
      .catch(() => {
        /* sidebar stats are non-critical; leave the skeleton */
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({ title: "Signed out", description: "See you soon!" });
      router.push("/login");
      router.refresh();
    } catch {
      toast({ title: "Sign out failed", description: "Please try again.", variant: "destructive" });
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col gap-2 border-b border-slate-200/60 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Ticket className="w-6 h-6 text-white" aria-hidden />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg tracking-tight">ServiceDesk</h2>
            <p className="text-xs text-slate-500 font-medium">IT Support Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/dashboard" && pathname === "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-8 text-sm transition-all duration-300 rounded-xl mb-1 flex items-center gap-3 px-4 py-3 justify-between w-full ${
                        isActive
                          ? // `text-white!` — the important modifier is load-bearing: the
                            // base SidebarMenuButton carries `data-[active=true]:text-sidebar-accent-foreground`,
                            // and Tailwind v4 orders variant utilities AFTER plain utilities,
                            // so a plain `text-white` would lose the cascade to the dark accent color.
                            "bg-gradient-to-r from-cyan-500 to-blue-600 text-white! shadow-lg shadow-cyan-500/30"
                          : "text-slate-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700"
                      }`}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon className="w-5 h-5" aria-hidden />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Quick Stats
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2 px-1">
            <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between border border-amber-100">
              <span className="text-sm font-medium text-amber-900">Open</span>
              <span className="bg-amber-500 text-white text-xs font-bold rounded-md px-2.5 py-0.5 min-w-8 text-center tabular-nums">
                {stats ? stats.open : "…"}
              </span>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between border border-blue-100">
              <span className="text-sm font-medium text-blue-900">In Progress</span>
              <span className="bg-blue-500 text-white text-xs font-bold rounded-md px-2.5 py-0.5 min-w-8 text-center tabular-nums">
                {stats ? stats.in_progress : "…"}
              </span>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 flex items-center justify-between border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Total</span>
              <span className="bg-slate-600 text-white text-xs font-bold rounded-md px-2.5 py-0.5 min-w-8 text-center tabular-nums">
                {stats ? stats.total : "…"}
              </span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-md shrink-0">
            <UserIcon className="w-5 h-5 text-white" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" aria-hidden />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
