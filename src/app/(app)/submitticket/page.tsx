"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, UploadCloud } from "lucide-react";

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
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="outline" className="mb-4 hover:bg-slate-100">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" aria-hidden />
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
              <Info className="w-5 h-5 text-cyan-500" aria-hidden />
              Ticket Details
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Issue Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the problem"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!errors.title}
              />
              {errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category ? <p className="text-xs text-red-600">{errors.category}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail. Include any error messages, steps to reproduce, etc."
                className="min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={!!errors.description}
              />
              {errors.description ? (
                <p className="text-xs text-red-600">{errors.description}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Attachments (optional)</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleFiles(e.dataTransfer.files);
                }}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-500 hover:border-cyan-400 hover:bg-cyan-50/50 transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-slate-400" aria-hidden />
                <span className="text-sm font-medium text-slate-600">Click to upload files</span>
                <span className="text-xs">Images, PDFs, or documents (max 2 MB each, 3 files)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                aria-label="Upload attachments"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.json,.zip"
                onChange={(e) => void handleFiles(e.target.files)}
              />
              {attachments.length > 0 ? (
                <ul className="space-y-2">
                  {attachments.map((a, i) => (
                    <li
                      key={`${a.fileName}-${i}`}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium text-slate-700">📄 {a.fileName}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {(a.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                          onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="px-8 py-6 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
            >
              {loading ? "Submitting…" : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
