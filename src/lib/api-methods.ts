import { NextResponse } from "next/server";

// Session 40: the 405/OPTIONS shape seam. For 39 sessions every
// unimplemented method on every known /api route answered the framework's
// default 405 — an EMPTY body with NO content-type (16/16 probes measured
// live on the production standalone; the reference's platform answers a
// JSON 405, measured live on their public-settings endpoint). The s33
// catch-all closed the JSON boundary for unknown PATHS; this seam closes
// it for unknown METHODS on KNOWN paths: a JSON client (`fetch` →
// `response.json()`) that PUTs /api/tickets or DELETEs /api/stats now
// gets a parseable, self-documenting 405 in the house `{error}` envelope
// (the s32/s33 single-message convention — the reference's FastAPI
// envelope is platform exhaust, never mirrored; the parity axis is
// JSON-parseability, not the envelope's field names).
//
// The Allow header is part of the same contract: RFC 9110 §15.5.6 — "The
// origin server MUST generate an Allow header field in a 405 response" —
// and the framework default shipped none. The stub passes the route's
// HONEST allow list (the implemented methods + auto-HEAD where a GET
// exists + OPTIONS).
//
// The pairing rule (the design's load-bearing half): every route that
// stubs a method MUST ALSO export the explicit `optionsNoContent` for its
// honest list — because exporting a stub makes Next's AUTO-OPTIONS
// advertise the stubbed method as ALLOWED (experiment-measured, s40: with
// a PUT stub on /api/health, OPTIONS flipped to `GET, HEAD, OPTIONS, PUT`
// — a lie: PUT answers 405). The explicit OPTIONS replaces the lying
// auto-advertisement with the same values the auto-OPTIONS generated
// pre-stub (the honest list, measured per route on the clean build).
//
// Dispatch precedence (why the stubs are safe to wire first): the 405
// fires at the method-dispatch level — BEFORE auth, rate limiting, the
// query/body grammars and the DB lookup. A wrong-method request never
// burns a rate-bucket slot (the s21 429 arithmetic is untouched) and
// never needs a fixture on dynamic routes (any id 405s before the query).

/** The JSON 405 + the RFC-mandated Allow header, for unimplemented methods. */
export function methodNotAllowed(allow: string): NextResponse {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: allow } },
  );
}

/**
 * The explicit honest OPTIONS (204 + Allow, empty body) — the replacement
 * for the framework's auto-advertisement on stubbed routes (the auto list
 * grows the stub methods; the honest list does not).
 */
export function optionsNoContent(allow: string): NextResponse {
  return new NextResponse(null, { status: 204, headers: { Allow: allow } });
}
