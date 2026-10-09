import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateAttachments, validateTicketInput } from "@/lib/validation";
import { isTicketPriority, isTicketStatus } from "@/lib/constants";

export const runtime = "nodejs";

// GET /api/tickets — the signed-in user's tickets (the reference's "My
// Tickets" semantics) with optional search / status / priority / sort
// filters, or the global feed with ?scope=all.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = (url.searchParams.get("search") ?? "").trim();
  const status = url.searchParams.get("status") ?? "all";
  const priority = url.searchParams.get("priority") ?? "all";
  const scope = url.searchParams.get("scope") ?? "mine";
  const sort = url.searchParams.get("sort") ?? "newest";

  const where: Record<string, unknown> = {};
  if (scope !== "all") where.createdById = user.id;
  if (isTicketStatus(status) && status !== undefined && url.searchParams.get("status")) {
    where.status = status;
  }
  if (isTicketPriority(priority) && url.searchParams.get("priority")) {
    where.priority = priority;
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "priority"
        ? { createdAt: "desc" } // priority weight applied in JS (SQLite has no enum ordering)
        : { createdAt: "desc" };

  const tickets = await db.ticket.findMany({
    where,
    orderBy,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
    take: 200,
  });

  if (sort === "priority") {
    const weight = { urgent: 3, high: 2, medium: 1, low: 0 } as const;
    tickets.sort((a, b) => weight[b.priority as keyof typeof weight] - weight[a.priority as keyof typeof weight]);
  }

  return NextResponse.json({ tickets });
}

interface RawAttachmentInput {
  fileName?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  data?: unknown;
}

// POST /api/tickets — create a ticket for the signed-in user (with optional
// base64 attachments, capped at 3 files / 2 MiB each).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = (body ?? {}) as Partial<{
    title: string;
    description: string;
    category: string;
    priority: string;
    attachments: RawAttachmentInput[];
  }>;

  const validation = validateTicketInput(input);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Please check the form", errors: validation.errors },
      { status: 400 },
    );
  }

  const rawAttachments = Array.isArray(input.attachments) ? input.attachments : [];
  const normalized = rawAttachments.map((a) => ({
    fileName: String(a.fileName ?? ""),
    mimeType: String(a.mimeType ?? "application/octet-stream"),
    sizeBytes: Number(a.sizeBytes ?? 0),
    data: String(a.data ?? ""),
  }));
  const attachmentCheck = validateAttachments(normalized);
  if (!attachmentCheck.ok) {
    return NextResponse.json({ error: attachmentCheck.error }, { status: 400 });
  }

  const ticket = await db.ticket.create({
    data: {
      title: input.title!.trim(),
      description: input.description!.trim(),
      category: input.category!,
      priority: input.priority!,
      status: "open",
      createdById: user.id,
      attachments: {
        create: normalized.map((a) => ({
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          data: a.data,
        })),
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } },
    },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
