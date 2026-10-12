// Session-34 live verification: the API-namespace no-store cache contract +
// the s15 attachment interplay — the same contracts the s34 smoke pins hold,
// verified against the canonical seed on the real :3000 database with fixtures
// cleaned. Self-contained per the s30 hardening: the DATABASE_URL pin runs
// before the dynamic import (ESM hoisting would defeat a same-file assignment).
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S34_BASE_URL ?? "http://localhost:3000";
const { PrismaClient } = await import("@prisma/client");
const p = new PrismaClient();

let passed = 0;
let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`[PASS] ${name}`);
  } else {
    failed++;
    console.log(`[FAIL] ${name}${detail ? " — " + detail : ""}`);
  }
}

// --- 0. the demo login (ONE request — the rate-budget doctrine) --------------
const loginRes = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
});
const setCookie = loginRes.headers.get("set-cookie") ?? "";
const cookieHeader = setCookie.split(";")[0] ?? "";
ok(
  "0. demo login (session)",
  loginRes.status === 200 && cookieHeader.startsWith("servicedesk_session="),
  `status=${loginRes.status}`,
);

// --- 1. the no-store matrix on the authenticated data surface -----------------
const authedPaths = [
  "/api/auth/me", // the identity-leak surface (id/name/email in the body)
  "/api/tickets", // the list surface
  "/api/tickets?scope=mine&sort=newest", // the full grammar composes + still no-store
  "/api/stats", // the aggregate surface
];
for (const path of authedPaths) {
  const res = await fetch(BASE + path, { headers: { cookie: cookieHeader } });
  const cc = res.headers.get("cache-control");
  ok(
    `no-store: authed GET ${path}`,
    res.status === 200 && cc === "no-store",
    `status=${res.status} cache-control=${cc}`,
  );
}

// --- 2. the unauthenticated + public surfaces --------------------------------
const healthRes = await fetch(BASE + "/api/health");
ok(
  "no-store: /api/health (caching defeats the liveness probe)",
  healthRes.status === 200 && healthRes.headers.get("cache-control") === "no-store",
  `status=${healthRes.status} cache-control=${healthRes.headers.get("cache-control")}`,
);
const me401 = await fetch(BASE + "/api/auth/me");
ok(
  "no-store: the 401 error path on /api/auth/me (error responses too)",
  me401.status === 401 && me401.headers.get("cache-control") === "no-store",
  `status=${me401.status} cache-control=${me401.headers.get("cache-control")}`,
);
const catchall = await fetch(BASE + "/api/banana");
ok(
  "no-store: the catch-all 404 (the s33 surface carries the s34 directive)",
  catchall.status === 404 && catchall.headers.get("cache-control") === "no-store",
  `status=${catchall.status} cache-control=${catchall.headers.get("cache-control")}`,
);

// --- 3. THE INTERPLAY PIN: the s15 attachment exception under the blanket -----
// The fixture: one throwaway ticket with one text attachment (deleted after).
const fixture = await fetch(BASE + "/api/tickets", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: cookieHeader },
  body: JSON.stringify({
    title: "S34 live cache interplay fixture",
    description: "carries one attachment for the no-store interplay pin",
    category: "software",
    priority: "low",
    attachments: [
      {
        fileName: "pin.txt",
        mimeType: "text/plain",
        sizeBytes: 11,
        data: Buffer.from("s34 pin ok!").toString("base64"),
      },
    ],
  }),
});
const fixtureBody = await fixture.json().catch(() => null);
ok(
  "fixture: create-with-attachment (the happy path)",
  fixture.status === 201 && fixtureBody?.ticket?.id,
  `status=${fixture.status}`,
);
const ticketId = fixtureBody?.ticket?.id;
const attachmentId = fixtureBody?.ticket?.attachments?.[0]?.id;

const attRes = await fetch(
  `${BASE}/api/tickets/${ticketId}/attachments/${attachmentId}`,
  { headers: { cookie: cookieHeader } },
);
ok(
  "interplay: the attachment download KEEPS the s15 window (private, max-age=31536000, immutable)",
  attRes.status === 200 &&
    attRes.headers.get("cache-control") === "private, max-age=31536000, immutable",
  `status=${attRes.status} cache-control=${attRes.headers.get("cache-control")}`,
);
ok(
  "interplay: the s14 inline disposition survives too",
  (attRes.headers.get("content-disposition") ?? "").startsWith("inline"),
  `cd=${attRes.headers.get("content-disposition")}`,
);
ok(
  "interplay: the s30 universal set still rides the attachment response",
  attRes.headers.get("strict-transport-security") === "max-age=31536000" &&
    !attRes.headers.get("x-powered-by"),
  `hsts=${attRes.headers.get("strict-transport-security")}`,
);

// The attachment route's 404 (bogus attachment id) — the exception rule is
// path-scoped, so the 404 carries the same s15 window (the route's own error
// path did too under the route-level code; the config exception now owns it).
const att404 = await fetch(
  `${BASE}/api/tickets/${ticketId}/attachments/nonexistent-attachment`,
  { headers: { cookie: cookieHeader } },
);
ok(
  "interplay: the attachment 404 path is path-scoped (carries the exception window, not no-store)",
  att404.status === 404 &&
    att404.headers.get("cache-control") === "private, max-age=31536000, immutable",
  `status=${att404.status} cache-control=${att404.headers.get("cache-control")}`,
);

// The comments sub-route (a NON-exception /api path under /api/tickets/:id):
// still no-store — the exception is scoped to the attachment segment only.
// (GET on the comments route 405s by design — comments are embedded in the
// ticket-detail response, the s19 architecture; the scoping question is the
// CACHE-DIRECTIVE on the path, whatever status it legitimately answers.)
const comments = await fetch(`${BASE}/api/tickets/${ticketId}/comments`, {
  headers: { cookie: cookieHeader },
});
ok(
  "scoping: /api/tickets/:id/comments carries no-store (the exception is attachment-only)",
  (comments.status === 200 || comments.status === 405) &&
    comments.headers.get("cache-control") === "no-store",
  `status=${comments.status} cache-control=${comments.headers.get("cache-control")}`,
);

// --- 4. the authenticated PAGES keep their framework contract ----------------
// (The s34 non-goals: the dynamic pages already ship the safe set — verified
// once here so the boundary between the two postures is itself measured.)
const dash = await fetch(BASE + "/dashboard", {
  headers: { cookie: cookieHeader },
});
ok(
  "boundary: the authenticated /dashboard page keeps the framework's private no-store set",
  dash.status === 200 &&
    (dash.headers.get("cache-control") ?? "").includes("no-store"),
  `status=${dash.status} cache-control=${dash.headers.get("cache-control")}`,
);
const loginPage = await fetch(BASE + "/login");
ok(
  "boundary: the static /login page keeps the framework prerender default (the documented non-goal)",
  loginPage.status === 200 &&
    (loginPage.headers.get("cache-control") ?? "").includes("s-maxage"),
  `status=${loginPage.status} cache-control=${loginPage.headers.get("cache-control")}`,
);

// --- 5. cleanup: the fixture removed + the canonical seed intact ---------------
// s39 hardening: the fixture create can FAIL (an exhausted login bucket 429s
// the auth, the create answers 401, ticketId stays undefined) — the unguarded
// deleteMany({ where: { id: undefined } }) then treats the all-undefined
// where as NO FILTER and WIPES THE TICKETS TABLE (the cascade takes the
// comments — the s39 mid-run corruption of the canonical seed, measured
// live: 11 tickets → 0 in one cleanup). Guard: delete only when the fixture
// id exists; the seed-canonical check below still fails loudly.
if (ticketId) {
  await p.ticket.deleteMany({ where: { id: ticketId } });
}
const [u, t, c, a] = await Promise.all([
  p.user.count(),
  p.ticket.count(),
  p.comment.count(),
  p.attachment.count(),
]);
ok(
  "cleanup — canonical seed restored (4/11/3/0)",
  u === 4 && t === 11 && c === 3 && a === 0,
  `users=${u} tickets=${t} comments=${c} attachments=${a}`,
);

await p.$disconnect();
console.log(
  `\n${passed} passed, ${failed} failed` +
    (failed ? " — FIX THE FAILURES BEFORE SHIPPING" : " — ALL GREEN"),
);
process.exit(failed ? 1 : 0);
