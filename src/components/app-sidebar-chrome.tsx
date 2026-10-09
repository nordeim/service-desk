"use client";

// Client chrome: the shadcn SidebarProvider + mobile header + inset main.
// Extracted from the server AppShell so the provider tree stays in one
// client component (context must wrap both sidebar and trigger).

import * as React from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { SidebarUser } from "@/components/app-sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function AppSidebarChrome({
  user,
  children,
}: {
  user: SidebarUser;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="flex-1 flex flex-col">
        {/* Mobile-only top bar (reference: md:hidden, backdrop blur). */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 md:hidden shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              aria-label="ServiceDesk home"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" aria-hidden />
              </div>
              <h1 className="font-bold text-slate-900 text-lg tracking-tight">ServiceDesk</h1>
            </Link>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
