"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, Send, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/toast";
import {
  ATTACHMENT_ACCEPTED_TYPES,
  ATTACHMENT_ACCEPT_ATTR,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_SELECT_CLASS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
} from "@/lib/constants";

interface PendingAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: string; // base64
}

export default function SubmitTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [priority, setPriority] = React.useState<string>("medium");
  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<PendingAttachment[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result);
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      if (attachments.length + next.length >= ATTACHMENT_MAX_COUNT) {
        toast({
          title: "Too many files",
          description: `At most ${ATTACHMENT_MAX_COUNT} files can be attached.`,
          variant: "destructive",
        });
        break;
      }
      if (file.size > ATTACHMENT_MAX_BYTES) {
        toast({
          title: "File too large",
          description: `"${file.name}" exceeds the 2 MB per-file limit.`,
          variant: "destructive",
        });
        continue;
      }
      // Session 23: the picker's accept attribute is a hint, not a guard —
      // reject unsupported types here too (the server seam is authoritative,
      // this is the UX mirror of the same closed allowlist).
      if (!ATTACHMENT_ACCEPTED_TYPES.includes(file.type || "application/octet-stream")) {
        toast({
          title: "Unsupported file type",
          description: `"${file.name}" is not an image, PDF, document, or archive.`,
          variant: "destructive",
        });
        continue;
      }
      next.push({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        data: await fileToBase64(file),
      });
    }
    if (next.length > 0) setAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, priority, description, attachments }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
        ticket?: { id: string };
      };
      if (!res.ok) {
        setErrors(data.errors ?? {});
        toast({
          title: "Could not submit ticket",
          description: data.error ?? "Please check the form and try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Ticket submitted",
        description: "Our IT team will get back to you shortly.",
        variant: "success",
      });
      router.push("/mytickets");
      router.refresh();
    } catch {
      toast({
        title: "Network error",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    // Reference (measured session 2): max-w-3xl container; mb-8 header block
    // with text-4xl h1; a shadow-2xl form card whose header carries the
    // cyan→blue gradient; body p-8; button-style back control.
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8">
      {/* Reference (session 16 re-measure): the [header + form] block rises
          as ONE 500ms ease-out tween wrapper (their motion.div wraps the
          header, the error alert, and the form card together — the form
          itself carries no separate animation). */}
      <div className="max-w-3xl mx-auto animate-rise-in motion-reduce:animate-none">
        <div className="mb-8">
          {/* Reference (measured session 4): the back control is the GHOST
              variant — borderless at rest, just the hover:bg-slate-100 wash. */}
          <Button asChild variant="ghost" className="mb-4 hover:bg-slate-100">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Submit a Ticket</h1>
          <p className="text-slate-600 mt-2 text-lg">
            Report an issue and our IT team will get back to you shortly
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border text-card-foreground border-none shadow-2xl bg-white overflow-hidden"
          noValidate
        >
          <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 bg-gradient-to-r from-cyan-50/50 to-blue-50/50">
            <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-slate-900">
              <CircleAlert className="w-5 h-5 text-cyan-500" aria-hidden />
              Ticket Details
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              {/* Reference (measured session 4): form labels are
                  text-slate-700 font-semibold with a PLAIN-TEXT asterisk
                  ("Issue Title *" — one text node, so the Label base's flex
                  gap never splits it). */}
              <Label htmlFor="title" className="text-slate-700 font-semibold">
                Issue Title *
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the problem"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!errors.title}
                className="border-slate-300 shadow-xs"
                /* Session-6 supersede: the reference's cyan focus customs are INERT
                    on text inputs (measured: 1px near-black ring + unchanged
                    border) — see the session-6 focus pins. */
              />
              {errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : null}
            </div>

            {/* Reference (session 4): md:grid-cols-2 gap-6 (stacks until md). */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700 font-semibold">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category"
                    className="w-full bg-transparent border-slate-300 focus:border-cyan-500 focus:ring-cyan-500 shadow-xs"
                    aria-invalid={!!errors.category}
                  >
                    <SelectValue placeholder="Select category">
                      {/* Reference (measured sessions 3+6): the selected
                          category renders as emoji-span + PLAIN label inside
                          a flex gap-2 row — exactly one emoji (the labels in
                          CATEGORY_LABELS are emoji-free). */}
                      {category ? (
                        <span className="flex items-center gap-2">
                          <span>{CATEGORY_EMOJI[category as TicketCategory]}</span>
                          {CATEGORY_LABELS[category as TicketCategory]}
                        </span>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Reference (measured session 6): the OPTIONS use the same
                        emoji-span + gap-2 wrapper as the trigger value. */}
                    {TICKET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center gap-2">
                          <span>{CATEGORY_EMOJI[c]}</span>
                          {CATEGORY_LABELS[c]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category ? <p className="text-xs text-red-600">{errors.category}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-700 font-semibold">
                  Priority *
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger
                    id="priority"
                    className="w-full bg-transparent border-slate-300 focus:border-cyan-500 focus:ring-cyan-500 shadow-xs"
                  >
                    <SelectValue>
                      {/* Reference (measured session 6): the trigger renders
                          the SELECTED priority's color (session 3's blue pin
                          was measured at the Medium default — blue IS
                          medium's color). */}
                      <span className={PRIORITY_SELECT_CLASS[priority as TicketPriority]}>
                        {PRIORITY_LABELS[priority as TicketPriority]}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Reference (measured session 6): every option carries
                        its priority color. */}
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className={PRIORITY_SELECT_CLASS[p]}>{PRIORITY_LABELS[p]}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail. Include any error messages, steps to reproduce, etc."
                className="min-h-[120px] border-slate-300 focus:border-cyan-500 shadow-xs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={!!errors.description}
              />
              {errors.description ? (
                <p className="text-xs text-red-600">{errors.description}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Attachments (optional)</Label>
              {/* Reference dropzone (measured session 3): dashed div + hidden
                  input + label-for (icon mb-2, sub-text mt-1, no hover bg).
                  Superset: drag-and-drop handlers live on the wrapper div. */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-cyan-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  aria-label="Upload attachments"
                  accept={ATTACHMENT_ACCEPT_ATTR}
                  onChange={(e) => void handleFiles(e.target.files)}
                />
                <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" aria-hidden />
                  <span className="text-sm text-slate-600 font-medium">Click to upload files</span>
                  <span className="text-xs text-slate-500 mt-1">Images, PDFs, or documents</span>
                </label>
              </div>
              {attachments.length > 0 ? (
                <ul className="space-y-2 mt-4">
                  {attachments.map((a, i) => (
                    <li
                      key={`${a.fileName}-${i}`}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      {/* Session 13: the reference's attached-file row
                          (live-measured — the s8 "reference has no
                          attachments" comment was false): plain
                          text-sm slate-700 truncate flex-1 filename, no emoji,
                          no font-medium, no size display. */}
                      <span className="text-sm text-slate-700 truncate flex-1">{a.fileName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${a.fileName}`}
                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <X className="w-4 h-4" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Reference (measured session 3): the footer is an inline
                justify-end row inside the form body — no border-t card
                footer. Cancel first, then the gradient submit with Send (mr-2). */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
              >
                <Send className="w-4 h-4 mr-2" aria-hidden />
                {loading ? "Submitting…" : "Submit Ticket"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
