import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { COMMENT_CREATE_BODY_FIELDS } from "@/lib/constants";
import { parseBodyKeys, parseNoQuery, validateCommentInput } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// POST /api/tickets/[id]/comments — add a comment as the signed-in user.
export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam).
  // The route's identity lives in the PATH param; before s29 `?scope=mine`
  // — a REAL param name from the sibling list route — was silently ignored
  // and the comment was created (measured live at the s29 audit).
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Session 32: the request-BODY grammar (the parseBodyKeys seam — the
  // comment's allowed set is exactly {content}). Before s32 an unknown
  // field was silently ignored — the comment was created (measured live
  // at the s32 audit).
  const parsedBody = parseBodyKeys(body, COMMENT_CREATE_BODY_FIELDS);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
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
