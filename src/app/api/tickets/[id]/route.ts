import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isTicketStatus, TICKET_PATCH_BODY_FIELDS } from "@/lib/constants";
import { parseBodyKeys, parseBodySize, parseNoQuery } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/tickets/[id] — ticket detail (owner-scoped read; any signed-in
// user can view, mirroring the reference's shareable detail URLs).
export async function GET(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam —
  // the s28 stats convention: auth first, then the grammar level). The
  // route's identity lives in the PATH param, not the query; before s29
  // `?banana=1` was silently ignored (measured live at the s29 audit).
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      attachments: {
        select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
      },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  return NextResponse.json({ ticket });
}

// PATCH /api/tickets/[id] — owner status transitions (superset feature:
// lets a user close/reopen their own ticket).
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Session 29: the empty-grammar gate on the mutation verb (the shared
  // parseNoQuery seam). Before s29 `?banana=1` was silently ignored and
  // the mutation applied (measured live at the s29 audit).
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  // Session 35: the request-body ceiling (the shared parseBodySize seam) —
  // BEFORE req.json(), the header-read cost (see the create route's comment).
  const parsedSize = parseBodySize(req.headers.get("content-length"));
  if (!parsedSize.ok) {
    return NextResponse.json({ error: parsedSize.error }, { status: 413 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Session 32: the request-BODY grammar (the parseBodyKeys seam — the
  // PATCH's allowed set is exactly {status}; an unknown field rejects
  // with 400 before the value level. Before s32 the extra key was
  // silently ignored — the mutation applied (measured live at the s32
  // audit).
  const parsedBody = parseBodyKeys(body, TICKET_PATCH_BODY_FIELDS);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
  }

  const status = (body as Partial<{ status: string }>)?.status;
  if (!isTicketStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.createdById !== user.id) {
    return NextResponse.json({ error: "Only the ticket owner can update it" }, { status: 403 });
  }

  const updated = await db.ticket.update({
    where: { id },
    data: { status },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      attachments: {
        select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ ticket: updated });
}
