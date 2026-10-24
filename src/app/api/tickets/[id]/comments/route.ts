import { NextResponse } from "next/server";
import { methodNotAllowed, optionsNoContent, routeAllow } from "@/lib/api-methods";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { COMMENT_CREATE_BODY_FIELDS } from "@/lib/constants";
import { parseBodyKeys, parseBodyContentType, parseBodySize, parseNoQuery, validateCommentInput } from "@/lib/validation";

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

  // Session 35: the request-body ceiling (the shared parseBodySize seam) —
  // BEFORE req.json(), the header-read cost (see the create route's comment).
  const parsedSize = parseBodySize(req.headers.get("content-length"));
  if (!parsedSize.ok) {
    return NextResponse.json({ error: parsedSize.error }, { status: 413 });
  }

  // Session 88: the Content-Type CSRF gate (the shared parseBodyContentType
  // seam — the family skill §16 contract; the login route's comment carries
  // the full doctrine). 415 on any non-JSON transport; the limiter still
  // runs first (the s21 convention).
  const parsedContentType = parseBodyContentType(req.headers.get("content-type"));
  if (!parsedContentType.ok) {
    return NextResponse.json({ error: parsedContentType.error }, { status: 415 });
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

// Session 40: the 405 JSON-boundary stubs + the honest OPTIONS (the s40 seam —
// HEAD has no GET to derive from on this route, so it stubs too. See
// src/lib/api-methods.ts for the full rationale: a stub export alone makes
// the auto-OPTIONS advertise the stubbed methods as ALLOWED — the explicit
// OPTIONS below re-asserts the honest list.
// Session 41: the single source — this route's implemented methods.
// The stubs and the OPTIONS advertisement below all derive from it
// (never edit the allow string by hand; the consistency pins in
// tests/api-allow-source.test.ts freeze the equivalence, and the s40
// smoke block pins the live surface).
const ALLOW = routeAllow(["POST"]);

export function GET() {
  return methodNotAllowed(ALLOW);
}

export function HEAD() {
  return methodNotAllowed(ALLOW);
}

export function PUT() {
  return methodNotAllowed(ALLOW);
}

export function PATCH() {
  return methodNotAllowed(ALLOW);
}

export function DELETE() {
  return methodNotAllowed(ALLOW);
}

export function OPTIONS() {
  return optionsNoContent(ALLOW);
}
