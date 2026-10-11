import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Session 33: the API-namespace JSON 404 catch-all. Before s33 every
// UNKNOWN path under /api/** served the framework's HTML 404 page
// (content-type text/html) — /api/banana, /api/auth/banana,
// /api/tickets/xyz/banana, and /api bare, on every method — the last
// non-JSON surface in the API namespace. The known routes' error paths
// already speak JSON ({error} / {error, errors} — the s32 envelope
// convention); this catch-all extends the JSON contract to the unknown
// paths, so a JSON client (fetch → response.json()) that hits a mistyped
// route gets a parseable, self-documenting 404 instead of an HTML page.
//
// Design notes (the decisions behind the shape):
// - The OPTIONAL catch-all ([[...path]]) matches both the nested unknowns
//   (/api/banana) and the bare /api segment. Next's route precedence keeps
//   every known route in front (static + dynamic segments beat catch-alls)
//   — nothing is shadowed (pinned live by the s33 smoke block's non-shadow
//   re-pins: /api/health 200, /api/auth/me 401, the real-ticket detail 200).
// - Every method answers the same 404: a nonexistent path is unknown
//   regardless of verb. The explicit OPTIONS export exists precisely to
//   prevent the framework's auto-204-with-allow from implying the path
//   exists with a method set. HEAD derives from GET automatically (the
//   HTTP layer strips the body — pinned live in the s33 smoke block).
// - The message is a CONSTANT (no path reflection): deterministic for
//   pins, zero reflection surface.
// - No auth, no rate limiter, no body grammar here — the 404-by-path
//   precedes all of them (unknown means unknown).
// - The s30 universal header set (HSTS + nosniff + X-Frame-Options +
//   Referrer-Policy, no X-Powered-By) applies via the next.config.ts
//   "/(.*)" headers rule — pinned live in the s33 smoke block.
//
// NOT changed by this contract (documented non-goals): the PAGES' designed
// HTML 404 (src/app/not-found.tsx — the s4 human-facing page for non-API
// paths) and the trailing-slash 308 (the framework standard, consistent
// with the pages). The reference, for comparison, serves its SPA HTML
// shell at 200 for every unknown path including its API paths (the s11
// platform-exhaust class — never mirrored; our JSON 404 is the superset).

const notFound = () =>
  NextResponse.json({ error: "API route not found" }, { status: 404 });

export async function GET(_req: Request) {
  return notFound();
}

export async function POST(_req: Request) {
  return notFound();
}

export async function PUT(_req: Request) {
  return notFound();
}

export async function PATCH(_req: Request) {
  return notFound();
}

export async function DELETE(_req: Request) {
  return notFound();
}

export async function OPTIONS(_req: Request) {
  return notFound();
}
