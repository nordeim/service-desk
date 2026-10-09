"use client";

// Ticket display atoms — status/priority/category chips and the ticket
// card, reproducing the reference app's exact utility classes (measured
// from its DOM): amber-100/amber-800 open chip, blue-100/blue-700 medium
// chip, gradient emoji tile, group-hover arrow slide.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_EMOJI,
  STATUS_LABELS,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-800 border-amber-300 border font-medium px-3 py-1",
  in_progress: "bg-blue-100 text-blue-700 border-transparent font-medium px-3 py-1",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-300 border font-medium px-3 py-1",
  closed: "bg-slate-100 text-slate-600 border-slate-300 border font-medium px-3 py-1",
};

const PRIORITY_BADGE_CLASSES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-600 font-medium px-3 py-1",
  medium: "bg-blue-100 text-blue-700 font-medium px-3 py-1",
  high: "bg-orange-100 text-orange-700 font-medium px-3 py-1",
  urgent: "bg-red-100 text-red-700 font-medium px-3 py-1",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={cn("capitalize", STATUS_BADGE_CLASSES[status])}>{status.replace("_", " ")}</Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge className={cn("capitalize", PRIORITY_BADGE_CLASSES[priority])}>{priority}</Badge>;
}

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium capitalize">
      {category}
    </Badge>
  );
}

export interface TicketCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  _count?: { comments: number };
}

export function TicketCard({
  ticket,
  formattedDate,
}: {
  ticket: TicketCardData;
  formattedDate: string;
}) {
  const emoji = CATEGORY_EMOJI[(ticket.category as TicketCategory) ?? "other"] ?? "📋";
  return (
    <Link href={`/ticketdetails?id=${ticket.id}`} className="block group">
      <div className="rounded-xl border text-card-foreground p-6 border-none shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 text-2xl">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-cyan-600 transition-colors">
                {ticket.title}
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" aria-hidden />
            </div>
            <p className="text-slate-600 line-clamp-2 mb-4">{ticket.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status as TicketStatus} />
              <PriorityBadge priority={ticket.priority as TicketPriority} />
              <CategoryBadge category={ticket.category as TicketCategory} />
              <span className="text-sm text-slate-500 font-medium ml-2">{formattedDate}</span>
              {ticket._count && ticket._count.comments > 0 ? (
                <span className="text-xs text-slate-400 ml-auto inline-flex items-center gap-1">
                  💬 {ticket._count.comments}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
