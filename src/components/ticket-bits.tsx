"use client";

// Ticket display atoms — status/priority/category chips and the ticket
// card, reproducing the reference app's exact utility classes (measured
// from its DOM): amber-100/amber-800 open chip, blue-100/blue-700 medium
// chip, gradient emoji tile, group-hover arrow slide.

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_EMOJI,
  STATUS_LABELS,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

// Reference badge base (measured session 4): every default-variant badge
// carries `shadow` + `hover:bg-primary/80` (the old shadcn Badge base). The
// outline CategoryBadge has NEITHER — do not add them there.
const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-800 border-amber-300 border font-medium shadow hover:bg-primary/80",
  in_progress: "bg-blue-100 text-blue-700 border-transparent font-medium shadow hover:bg-primary/80",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-300 border font-medium shadow hover:bg-primary/80",
  closed: "bg-slate-100 text-slate-600 border-slate-300 border font-medium shadow hover:bg-primary/80",
};

const PRIORITY_BADGE_CLASSES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-600 font-medium shadow hover:bg-primary/80",
  medium: "bg-blue-100 text-blue-700 font-medium shadow hover:bg-primary/80",
  high: "bg-orange-100 text-orange-700 font-medium shadow hover:bg-primary/80",
  urgent: "bg-red-100 text-red-700 font-medium shadow hover:bg-primary/80",
};

// Padding is per-surface (reference, session 4): mytickets cards + the detail
// status badge use px-3 py-1; dashboard recent rows + the detail priority
// badge use the base-compact px-2.5 py-0.5.
const BADGE_PAD_REGULAR = "px-3 py-1";
const BADGE_PAD_COMPACT = "px-2.5 py-0.5";

export function StatusBadge({
  status,
  detail = false,
  compact = false,
}: {
  status: TicketStatus;
  /** detail=true renders the reference's larger detail-page treatment
   *  (text-sm font-bold) instead of the row treatment (text-xs font-medium). */
  detail?: boolean;
  /** compact=true renders the small px-2.5 py-0.5 padding (dashboard recent
   *  rows; measured session 4) instead of the regular px-3 py-1. */
  compact?: boolean;
}) {
  const extra = detail ? "text-sm! font-bold" : "";
  const pad = compact ? BADGE_PAD_COMPACT : BADGE_PAD_REGULAR;
  // Reference renders badge text lowercase ("open", "in progress") —
  // no capitalize (measured session 3).
  return (
    <Badge className={cn(STATUS_BADGE_CLASSES[status], extra, pad)}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  showWord = false,
  compact = false,
}: {
  priority: TicketPriority;
  /** showWord=true appends " priority" — the reference detail page puts the
   *  word inside the badge ("medium priority"), rows keep it bare. */
  showWord?: boolean;
  /** compact=true renders the small px-2.5 py-0.5 padding — the reference
   *  detail page uses it on the priority badge (session 4). */
  compact?: boolean;
}) {
  const pad = compact ? BADGE_PAD_COMPACT : BADGE_PAD_REGULAR;
  return (
    <Badge className={cn(PRIORITY_BADGE_CLASSES[priority], pad)}>
      {showWord ? `${priority.replace("_", " ")} priority` : priority}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
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
      <div className="animate-rise-in motion-reduce:animate-none rounded-xl border text-card-foreground p-6 border-none shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white">
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

// Reference "Recent Tickets" row (dashboard): flat divide-y list entry —
// measured from the reference DOM (session 3 refresh). NOT a card: no
// border/shadow; the tile renders a FileText SVG icon (w-6 h-6 cyan-600,
// NOT the category emoji); the title sits in a flex justify-between wrapper
// with the hover-sliding arrow; badges are status + priority only (no
// category); the date is DATE-ONLY ("Oct 9, 2026") — mytickets cards keep
// the full datetime.
export function RecentTicketRow({ ticket }: { ticket: TicketCardData }) {
  return (
    <Link
      href={`/ticketdetails?id=${ticket.id}`}
      className="animate-rise-in motion-reduce:animate-none block p-6 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/50 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <FileText className="w-6 h-6 text-cyan-600" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-cyan-600 transition-colors">
              {ticket.title}
            </h3>
            <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" aria-hidden />
          </div>
          <p className="text-sm text-slate-600 line-clamp-1 mb-3">{ticket.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Reference (session 4): dashboard recent-row badges use the
                compact px-2.5 py-0.5 padding. */}
            <StatusBadge status={ticket.status as TicketStatus} compact />
            <PriorityBadge priority={ticket.priority as TicketPriority} compact />
            <span className="text-xs text-slate-500 font-medium">{formatDate(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
