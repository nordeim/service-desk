import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseListFilters, parseListParams, validateAttachments, validateTicketInput } from "@/lib/validation";

export const runtime = "nodejs";

// GET /api/tickets — the signed-in user's tickets (the reference's "My
// Tickets" semantics) with optional search / status / priority / sort
// filters, or the global feed with ?scope=all.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = (url.searchParams.get("search") ?? "").trim();

  // Session 25: the filter-vocabulary contract — the s24 strict-validation
  // doctrine extended to the whole list route. The four filter params
  // (status/priority/sort/scope) accept ONLY their documented vocabulary;
  // out-of-vocabulary values reject with 400 (the reference's platform
  // silently ignores them — ours never does). Empty-string values read as
  // absent; the UI's "All Status"/"All Priorities" select values are UI
  // state that omits the param ("all" is not an API value).
  const parsedFilters = parseListFilters(url.searchParams);
  if (!parsedFilters.ok) {
    return NextResponse.json({ error: parsedFilters.error }, { status: 400 });
  }
  const { status, priority, sort, scope } = parsedFilters.value;

  // Session 24: the pagination contract — limit/skip (the reference entity
  // API's measured param names). The default ceiling (200) is the DoS-safety
  // superset; garbage values reject with 400 rather than silently ignoring
  // (the strict-validation doctrine).
  const parsed = parseListParams(url.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (scope !== "all") where.createdById = user.id;
  if (status) where.status = status;
  if (priority) where.priority = priority;
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
    take: parsed.value.limit,
    skip: parsed.value.skip,
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
