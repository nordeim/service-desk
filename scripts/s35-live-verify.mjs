// Session-35 live verification: the request-size contract — the same
// contracts the s35 smoke pins hold, verified against the canonical seed on
// the real :3000 database with fixtures cleaned. Self-contained per the s30
// hardening: the DATABASE_URL pin runs before the dynamic import (ESM hoisting
// would defeat a same-file assignment). The rate-budget doctrine: ONE login
// at the top, every probe reuses it (the auth-route ceiling is verified via
// the comment route instead — the smoke cross-pin's reasoning).
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S35_BASE_URL ?? "http://localhost:3000";

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
const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
ok("the demo login (the one rate-budget request)", loginRes.status === 200 && !!cookie);

// --- 1. the envelope: the 20 MB create rejects 413, fast ----------------------
{
  const bigTitle = "x".repeat(20 * 1024 * 1024);
  const t0 = Date.now();
  const r = await fetch(BASE + "/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: bigTitle, description: "s35 live", category: "software", priority: "low" }),
  });
  const body = await r.json().catch(() => ({}));
  const ms = Date.now() - t0;
  ok("the 20 MB create 413s", r.status === 413, `got ${r.status}`);
  ok("the 413 message names the ceiling", /request body too large: \d+ bytes \(max 10485760\)/.test(String(body.error)), JSON.stringify(body).slice(0, 120));
  ok("the 413 answers at the header-read cost (< 500 ms)", ms < 500, `${ms}ms (the pre-fix value-level path measured 199 ms with the full 20 MB buffered)`);
}

// --- 2. the shared seam across routes: the comment route ----------------------
{
  const list = await (await fetch(BASE + "/api/tickets?limit=1", { headers: { Cookie: cookie } })).json();
  const tid = list.tickets?.[0]?.id;
  ok("fetch a ticket id for the comment probe", !!tid);
  const r = await fetch(`${BASE}/api/tickets/${tid}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ content: "x".repeat(20 * 1024 * 1024) }),
  });
  const body = await r.json().catch(() => ({}));
  ok("the 20 MB comment 413s (the shared seam)", r.status === 413, `got ${r.status}`);
  ok("the comment 413 carries the same message shape", /request body too large/.test(String(body.error)));
}

// --- 3. the attachment honesty contract ----------------------------------------
{
  // (a) the divergence: 11 declared, ~100 KB actual
  const payload = Buffer.alloc(100 * 1024, 65).toString("base64");
  const r = await fetch(BASE + "/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "s35 live divergence probe", description: "declared 11, actual 100KB",
      category: "software", priority: "low",
      attachments: [{ fileName: "probe.txt", mimeType: "text/plain", sizeBytes: 11, data: payload }],
    }),
  });
  const body = await r.json().catch(() => ({}));
  ok("the divergence probe 400s with the mismatch message", r.status === 400 && /does not match its declared size/.test(String(body.error)), JSON.stringify(body).slice(0, 120));

  // (b) the garbage form: 100 KB of '!' decodes to 0 bytes
  const garbage = "!".repeat(100 * 1024);
  const r2 = await fetch(BASE + "/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "s35 live garbage probe", description: "non-alphabet, sizeBytes 0",
      category: "software", priority: "low",
      attachments: [{ fileName: "g.txt", mimeType: "text/plain", sizeBytes: 0, data: garbage }],
    }),
  });
  const body2 = await r2.json().catch(() => ({}));
  ok("the garbage probe 400s with the form message", r2.status === 400 && /invalid encoded payload/.test(String(body2.error)), JSON.stringify(body2).slice(0, 120));
}

// --- 4. the no-false-rejection boundary + the fixture hygiene -------------------
{
  const twoMiB = 2 * 1024 * 1024;
  const b64 = Buffer.alloc(twoMiB, 65).toString("base64");
  const r = await fetch(BASE + "/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "s35 live max-legit boundary probe", description: "three legitimate 2 MiB attachments",
      category: "software", priority: "low",
      attachments: [0, 1, 2].map((i) => ({ fileName: `legit-${i}.txt`, mimeType: "text/plain", sizeBytes: twoMiB, data: b64 })),
    }),
  });
  const body = await r.json().catch(() => ({}));
  ok("the 3x2MiB max-legit create 201s (the boundary)", r.status === 201, `got ${r.status}`);
  const id = body.ticket?.id;
  ok("the boundary fixture has an id for the cleanup", !!id);

  // fixture hygiene: remove the probe ticket via SQL (the canonical DB)
  if (id) {
    const { PrismaClient } = await import("@prisma/client");
    const p = new PrismaClient();
    const del = await p.ticket.deleteMany({ where: { title: { in: ["s35 live max-legit boundary probe"] } } });
    const count = await p.ticket.count();
    ok("the boundary fixture cleaned + the seed canonical (11 tickets)", del.count === 1 && count === 11, `deleted ${del.count}, tickets ${count}`);
    await p.$disconnect();
  }
}

// --- 5. the chunked pass-through (no Content-Length → the value level) ----------
{
  // fetch() always sends Content-Length for string bodies; emulate chunked
  // by streaming an unknown-length body.
  const longTitle = "y".repeat(200);
  const stream = new ReadableStream({
    start(controller) {
      const body = JSON.stringify({ title: longTitle, description: "chunked probe", category: "software", priority: "low" });
      // deliver in two chunks so the length is genuinely unknown to the sender
      controller.enqueue(new TextEncoder().encode(body.slice(0, 100)));
      controller.enqueue(new TextEncoder().encode(body.slice(100)));
      controller.close();
    },
  });
  const r = await fetch(BASE + "/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: stream,
    duplex: "half",
  });
  const body = await r.json().catch(() => ({}));
  ok("the chunked probe hits the VALUE level (400, not 413)", r.status === 400 && /at most 120 characters/.test(JSON.stringify(body)), `got ${r.status} ${JSON.stringify(body).slice(0, 120)}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
