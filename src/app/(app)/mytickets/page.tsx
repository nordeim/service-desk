"use client";

import * as React from "react";
import { FileSearch, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketCard } from "@/components/ticket-bits";
import { formatDateTime } from "@/lib/utils";
import type { TicketCardData } from "@/components/ticket-bits";

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent";
type SortMode = "newest" | "oldest" | "priority";

export default function MyTicketsPage() {
  const [tickets, setTickets] = React.useState<TicketCardData[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [priority, setPriority] = React.useState<PriorityFilter>("all");
  const [sort, setSort] = React.useState<SortMode>("newest");
  const [scope, setScope] = React.useState<"mine" | "all">("mine");

  React.useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ scope, sort });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (priority !== "all") params.set("priority", priority);

    fetch(`/api/tickets?${params.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { tickets: [] }))
      .then((d) => setTickets(d.tickets ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setTickets([]);
      });
    return () => controller.abort();
  }, [search, status, priority, sort, scope]);

  const isFiltered = search.trim() !== "" || status !== "all" || priority !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">
      {/* Reference: max-w-7xl container, mb-8 header, mb-6 3-col filter grid. */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">My Tickets</h1>
          <p className="text-slate-600 mt-2 text-lg">View and track your support requests</p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="pl-10 bg-white border-slate-300 focus:border-cyan-500 focus:ring-cyan-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tickets"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-full bg-white border-slate-300 focus:border-cyan-500 focus:ring-cyan-500" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as PriorityFilter)}>
            <SelectTrigger className="w-full bg-white border-slate-300 focus:border-cyan-500 focus:ring-cyan-500" aria-label="Filter by priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Superset (not in the reference): sort + scope controls, styled to
            stay quiet below the reference filter row. */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="w-[170px] bg-white border-slate-300 focus:border-cyan-500 focus:ring-cyan-500" aria-label="Sort tickets">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2" role="group" aria-label="Ticket scope">
            {(["mine", "all"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={scope === s ? "default" : "outline"}
                className={
                  scope === s
                    ? "rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "rounded-full"
                }
                onClick={() => setScope(s)}
              >
                {s === "mine" ? "My Tickets" : "All Tickets"}
              </Button>
            ))}
          </div>
        </div>

        {/* Reference: rows are grid gap-4 cards (TicketCard already implements
            the measured classes: w-14 tile, arrow, text-lg font-bold title). */}
        {tickets === null ? (
          <div className="grid gap-4" aria-label="Loading tickets">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSearch className="w-8 h-8 text-slate-300" aria-hidden />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              {isFiltered ? "No tickets match your filters" : "No tickets found"}
            </h3>
            <p className="text-sm text-slate-400">
              {isFiltered
                ? "Try adjusting the search or filters."
                : "You haven't submitted any tickets yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} formattedDate={formatDateTime(t.createdAt)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
