"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, MessageSquare, Send, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8 flex items-center justify-center">
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
      <div className="flex-1 bg-slate-50">
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
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/mytickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to Tickets
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main column */}
          <div className="flex-1 space-y-6 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight break-words">
                {ticket.title}
              </h1>
              <StatusBadge status={ticket.status as TicketStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={ticket.priority as never} />
              <span className="text-xs text-slate-400">priority</span>
              <CategoryBadge category={ticket.category as never} />
            </div>

            <Card className="border-none shadow-lg">
              <CardHeader className="flex-row items-center gap-2 border-b border-slate-100">
                <FileText className="w-5 h-5 text-cyan-500" aria-hidden />
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                {ticket.attachments.length > 0 ? (
                  <>
                    <Separator className="my-4" />
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
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="flex-row items-center gap-2 border-b border-slate-100">
                <MessageSquare className="w-5 h-5 text-cyan-500" aria-hidden />
                <CardTitle className="text-lg">Comments &amp; Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.comments.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No comments yet</p>
                ) : (
                  <ul className="space-y-4">
                    {ticket.comments.map((c) => (
                      <li key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-sm text-slate-800">{c.author.name}</span>
                          <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.content}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleAddComment} className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Add a comment or update..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    aria-label="Add a comment or update"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={posting || !comment.trim()}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
                    >
                      <Send className="w-4 h-4" aria-hidden />
                      {posting ? "Adding…" : "Add Comment"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-base">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-0">
                {[
                  ["Created By", ticket.createdBy.email],
                  ["Created On", formatDateTime(ticket.createdAt)],
                  ["Last Updated", formatDateTime(ticket.updatedAt)],
                  ["Comments", String(ticket.comments.length)],
                ].map(([label, value], i, arr) => (
                  <div key={label}>
                    <div className="px-6 py-4">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {label}
                      </p>
                      <p className="text-sm text-slate-800 break-words">{value}</p>
                    </div>
                    {i < arr.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Superset: owner status control */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-400">
                  Owners can close or reopen their own tickets.
                </p>
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
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
