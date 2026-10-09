"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, FileText, MessageSquare, Send, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/toast";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ticket-bits";
import { formatDateTime } from "@/lib/utils";
import { STATUS_LABELS, TICKET_STATUSES, type TicketStatus } from "@/lib/constants";

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string; email: string };
  }[];
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }[];
}

export default function TicketDetailsPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("id") ?? params?.id;
  const { toast } = useToast();

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  const load = React.useCallback(() => {
    if (!ticketId) return;
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setTicket(d.ticket))
      .catch(() => setNotFound(true));
  }, [ticketId]);

  React.useEffect(load, [load]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !ticketId) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast({
          title: "Could not add comment",
          description: data.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }
      setComment("");
      load();
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  }

  async function handleStatusChange(next: string) {
    if (!ticketId || !ticket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ticket?: TicketDetail };
      if (!res.ok) {
        toast({
          title: "Could not update status",
          description: data.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }
      setTicket(data.ticket ?? null);
      toast({ title: "Status updated", description: `Ticket marked as ${next.replace("_", " ")}.`, variant: "success" });
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ticket not found</h1>
          <p className="text-slate-500 mb-6">This ticket may have been deleted.</p>
          <Button asChild variant="outline">
            <Link href="/mytickets">Back to Tickets</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6" aria-label="Loading ticket">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    // Reference structure (measured session 2): max-w-5xl container, a
    // mb-6 back button, then grid lg:grid-cols-3 — left col-span-2 holds the
    // ticket card (gradient header + description) and the comments card;
    // the right column holds the Ticket Information panel.
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Reference (measured session 3): the back button + grid animate in
            together inside ONE motion wrapper. */}
        <div className="animate-rise-in motion-reduce:animate-none">
        <div className="mb-6">
          {/* Reference (measured session 4): the back control is the GHOST
              variant — borderless at rest, just the hover:bg-slate-100 wash. */}
          <Button asChild variant="ghost" className="mb-4 hover:bg-slate-100">
            <Link href="/mytickets">
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back to Tickets
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column (reference: lg:col-span-2 space-y-6) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket card: gradient header with inline title + badges */}
            <div className="rounded-xl border text-card-foreground border-none shadow-xl bg-white">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 bg-gradient-to-r from-cyan-50/50 to-blue-50/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-semibold tracking-tight text-2xl text-slate-900">
                      {ticket.title}
                    </div>
                    <StatusBadge status={ticket.status as TicketStatus} detail />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Reference (session 4): the detail priority badge uses the
                        compact px-2.5 py-0.5 padding (the status badge above
                        keeps the larger text-sm treatment). */}
                    <PriorityBadge priority={ticket.priority as never} showWord compact />
                    <CategoryBadge category={ticket.category as never} />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-500" aria-hidden />
                    Description
                  </h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>

                {/* Superset: attachments (kept inside the reference card body) */}
                {ticket.attachments.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Download className="w-5 h-5 text-cyan-500" aria-hidden />
                      Attachments
                    </h3>
                    <ul className="space-y-2">
                      {ticket.attachments.map((a) => (
                        <li key={a.id}>
                          <a
                            href={`/api/tickets/${ticket.id}/attachments/${a.id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2 transition-colors"
                          >
                            <Download className="w-4 h-4" aria-hidden />
                            {a.fileName}
                            <span className="text-xs text-slate-400 font-normal">
                              {(a.sizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Comments card (reference: avatar circles + ml-10 indent) */}
            <div className="rounded-xl border text-card-foreground border-none shadow-xl bg-white">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
                <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-slate-900">
                  <MessageSquare className="w-5 h-5 text-cyan-500" aria-hidden />
                  Comments &amp; Updates
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {ticket.comments.length === 0 ? (
                    <p className="text-center text-slate-400 py-6">No comments yet</p>
                  ) : (
                    ticket.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border bg-slate-50 border-slate-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-white" aria-hidden />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{c.author.name}</p>
                              <p className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap ml-10">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t border-slate-200">
                  <Textarea
                    placeholder="Add a comment or update..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    aria-label="Add a comment or update"
                    className="min-h-24 border-slate-300 focus:border-cyan-500 focus:ring-cyan-500 shadow-sm"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      type="submit"
                      disabled={posting || !comment.trim()}
                      className="ml-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    >
                      <Send className="w-4 h-4" aria-hidden />
                      {posting ? "Adding…" : "Add Comment"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right column (reference: space-y-6) */}
          <div className="space-y-6">
            <div className="rounded-xl border text-card-foreground border-none shadow-xl bg-white">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
                <div className="tracking-tight text-sm font-semibold text-slate-900">
                  Ticket Information
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Created By
                  </p>
                  <p className="text-sm text-slate-900 font-medium">{ticket.createdBy.email}</p>
                </div>
                <Separator className="h-[1px] w-full" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Created On
                  </p>
                  <p className="text-sm text-slate-900 font-medium">{formatDateTime(ticket.createdAt)}</p>
                </div>
                <Separator className="h-[1px] w-full" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Last Updated
                  </p>
                  <p className="text-sm text-slate-900 font-medium">{formatDateTime(ticket.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Superset: owner status control */}
            <div className="rounded-xl border text-card-foreground border-none shadow-xl bg-white">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
                <div className="tracking-tight text-sm font-semibold text-slate-900">Update Status</div>
              </div>
              <div className="p-6 space-y-2">
                <p className="text-xs text-slate-400">Owners can close or reopen their own tickets.</p>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => void handleStatusChange(v)}
                  disabled={updating}
                >
                  <SelectTrigger className="w-full bg-white" aria-label="Ticket status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
