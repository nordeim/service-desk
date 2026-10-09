"use client";

// Client chrome: the shadcn SidebarProvider + mobile header + inset main.
// Extracted from the server AppShell so the provider tree stays in one
// client component (context must wrap both sidebar and trigger).
//
// Reference parity (measured session 2 from the live reference DOM):
// - an app-wide gradient wrapper `min-h-screen flex w-full bg-gradient-to-br
//   from-slate-50 via-white to-slate-100` paints behind sidebar + content;
// - the mobile header is NOT sticky — it sits ABOVE the scroll container,
//   which is why it never scrolls away;
// - the mobile brand is a plain `text-xl font-bold` "ServiceDesk" h1.

import * as React from "react";

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
      {/* Reference: this wrapper carries the app-wide gradient. */}
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <AppSidebar user={user} />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Mobile-only top bar (reference: md:hidden, backdrop blur, no
              sticky — the scroll container below keeps it in place). */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold text-slate-900">ServiceDesk</h1>
            </div>
          </header>
          {/* Reference: content scrolls inside this container, under the
              header — not the document body. */}
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
