"use client";

import * as React from "react";
import Link from "next/link";
import {
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentTicketRow } from "@/components/ticket-bits";
import { formatDuration } from "@/lib/utils";
import type { TicketCardData } from "@/components/ticket-bits";

interface StatsResponse {
  mine: { total: number; open: number; in_progress: number; resolved: number; closed: number };
  global: { open: number; in_progress: number; resolved: number; closed: number; total: number };
  avgResolutionMs: number | null;
}

// Card specs measured from the reference DOM: icon tile gradients and the
// lucide icon per card (users / circle-alert / clock / circle-check).
const STAT_CARDS = [
  {
    key: "total",
    label: "Total Tickets",
    sub: "Your tickets",
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    deco: "from-violet-500 to-purple-600",
  },
  {
    key: "open",
    label: "Open",
    sub: "Awaiting response",
    icon: CircleAlert,
    gradient: "from-amber-500 to-orange-600",
    deco: "from-amber-500 to-orange-600",
  },
  {
    key: "in_progress",
    label: "In Progress",
    sub: "Being worked on",
    icon: Clock,
    gradient: "from-blue-500 to-cyan-600",
    deco: "from-blue-500 to-cyan-600",
  },
  {
    key: "resolved",
    label: "Resolved",
    sub: "Completed tickets",
    icon: CircleCheck,
    gradient: "from-emerald-500 to-green-600",
    deco: "from-emerald-500 to-green-600",
  },
] as const;

function DashboardContent({ userName }: { userName: string }) {
  const [stats, setStats] = React.useState<StatsResponse | null>(null);
  const [recent, setRecent] = React.useState<TicketCardData[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tickets").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([s, t]) => {
        if (cancelled) return;
        if (s) setStats(s);
        if (t?.tickets) {
          setRecent((t.tickets as (TicketCardData & { createdAt: string })[]).slice(0, 5));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page header (reference: text-4xl + text-lg subtitle) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Welcome back, {userName}
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Track your support requests</p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40"
          >
            <Link href="/submitticket">
              <CircleAlert className="w-5 h-5 mr-2" aria-hidden />
              Report New Issue
            </Link>
          </Button>
        </div>

        {/* Stat cards (reference: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
            cards shadow-lg → hover:shadow-xl; values plain text-4xl, no
            tabular-nums — measured session 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="animate-rise-in motion-reduce:animate-none rounded-xl border bg-card text-card-foreground border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.deco} opacity-10 rounded-full transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500`}
                aria-hidden
              />
              <div className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{card.label}</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {stats ? stats.mine[card.key] : "…"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" aria-hidden />
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Metrics (reference: full width, slate-50→white gradient card;
            value is a <p> — measured session 2) */}
        <div className="rounded-xl border text-card-foreground border-none shadow-xl bg-gradient-to-br from-slate-50 to-white">
          <div className="flex flex-col space-y-1.5 p-6 pb-3">
            <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5 text-cyan-500" aria-hidden />
              Performance Metrics
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Average Resolution Time</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats ? (
                    formatDuration(stats.avgResolutionMs)
                  ) : (
                    // Inline skeleton — the Skeleton component renders a
                    // <div>, which is invalid inside <p> and broke hydration
                    // (the browser parser hoists it; React then mismatched).
                    // Session 3: pin with dashboard.spec "hydrates cleanly".
                    <span className="inline-block h-9 w-20 animate-pulse rounded-md bg-slate-200/80" aria-hidden />
                  )}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-cyan-600" aria-hidden />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tickets (reference: white card, header with bottom border,
            flat divide-y rows — NOT cards. Measured session 2.) */}
        <div className="rounded-xl border text-card-foreground border-none shadow-xl bg-white">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
            <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-cyan-500" aria-hidden />
              Recent Tickets
            </div>
          </div>
          <div className="p-0">
            {recent === null ? (
              <div className="space-y-3 p-6" aria-label="Loading tickets">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-300" aria-hidden />
                </div>
                <p className="text-slate-600 font-medium">No tickets yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Submit your first ticket to get started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((t) => (
                  <RecentTicketRow key={t.id} ticket={t} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA (reference: centered outline button) */}
        <div className="flex justify-center">
          <Button
            asChild
            variant="outline"
            className="group border-slate-300 hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-300"
          >
            <Link href="/mytickets">
              View All Tickets
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = React.useState<string | null>(null);

  // The greeting name comes from the session endpoint; the shell's user is
  // already server-rendered by the (app) layout.
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUserName(d?.user?.name ?? d?.user?.email ?? "there"))
      .catch(() => setUserName("there"));
  }, []);

  return <DashboardContent userName={userName ?? "…"} />;
}
