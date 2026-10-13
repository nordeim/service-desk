// Attachment download — streams a stored attachment back with a safe
// Content-Disposition. Owner-scoped: any signed-in user can download
// (mirroring the ticket detail visibility).
import { NextResponse } from "next/server";
import { methodNotAllowed, optionsNoContent } from "@/lib/api-methods";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseNoQuery } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Session 29: the empty-grammar gate (the shared parseNoQuery seam). The
  // route's identity lives in the PATH params; before s29 any query string
  // was silently ignored (the same handler pattern as the ten families
  // measured live at the s29 audit).
  const parsedQuery = parseNoQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }

  const { id, attachmentId } = await params;
  const attachment = await db.attachment.findFirst({
    where: { id: attachmentId, ticketId: id },
  });
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  const bytes = Buffer.from(attachment.data, "base64");
  // RFC 6266: strip anything that could break out of the quoted-string.
  const safeName = attachment.fileName.replace(/[^\w.\- ]+/g, "_");
  // Session 14: the disposition is INLINE — the reference's CDN serves its
  // attachment files with NO Content-Disposition at all (curl-verified on
  // their probe tickets' file URLs), so the target=_blank row opens the file
  // and the browser DISPLAYS it. `inline` renders renderable types (pdf,
  // text, images) in the new tab; the sanitized filename stays the save-as
  // name, and non-renderable types (zip/doc) download exactly as before.
  // Safe: the mimeType was pinned at upload to the closed accepted list
  // (no text/html, no svg — the s10 XSS decision) and nosniff ships globally.
  // Session 15: the cache window matches the reference's CDN, which serves
  // its files with `public, max-age=31536000, immutable` (live-measured on a
  // fresh upload, authenticated fetch). `private` stays — the route is
  // owner-scoped and our attachment URLs are not publicly fetchable by design
  // (their `public` + open-media posture is not a contract to mirror); the
  // year-long immutable window is factually correct here: attachments have
  // no mutation path (created once at upload; no update/delete route exists),
  // so the window can never serve stale bytes. No ETag/Last-Modified: with an
  // immutable year a compliant client never revalidates. If a future feature
  // adds attachment mutation, revisit this header.
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

// Session 40: the 405 JSON-boundary stubs + the honest OPTIONS (the s40 seam —
// src/lib/api-methods.ts for the full rationale: a stub export alone makes
// the auto-OPTIONS advertise the stubbed methods as ALLOWED — the explicit
// OPTIONS below re-asserts the honest list.
export function POST() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function PUT() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function PATCH() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function DELETE() {
  return methodNotAllowed("GET, HEAD, OPTIONS");
}

export function OPTIONS() {
  return optionsNoContent("GET, HEAD, OPTIONS");
}
