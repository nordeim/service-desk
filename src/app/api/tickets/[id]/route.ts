import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isTicketStatus } from "@/lib/constants";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/tickets/[id] — ticket detail (owner-scoped read; any signed-in
// user can view, mirroring the reference's shareable detail URLs).
export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
