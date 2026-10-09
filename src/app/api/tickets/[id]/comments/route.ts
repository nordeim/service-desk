import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateCommentInput } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// POST /api/tickets/[id]/comments — add a comment as the signed-in user.
export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = (body ?? {}) as Partial<{ content: string }>;
  const validation = validateCommentInput(input);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Please check the form", errors: validation.errors },
      { status: 400 },
    );
  }

  const ticket = await db.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const [comment] = await db.$transaction([
    db.comment.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content: input.content!.trim(),
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    }),
    db.ticket.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);

  return NextResponse.json({ comment }, { status: 201 });
}
