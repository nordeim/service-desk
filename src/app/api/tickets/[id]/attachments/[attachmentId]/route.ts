// Attachment download — streams a stored attachment back with a safe
// Content-Disposition. Owner-scoped: any signed-in user can download
// (mirroring the ticket detail visibility).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, attachmentId } = await params;
  const attachment = await db.attachment.findFirst({
    where: { id: attachmentId, ticketId: id },
  });
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  const bytes = Buffer.from(attachment.data, "base64");
  // RFC 6266: strip anything that could break out of the quoted-string.
  const safeName = attachment.fileName.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
