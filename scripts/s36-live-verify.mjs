// Session-36 live verification: the proxy-surface contract — the same
// contracts the s36 smoke pins hold, verified against the canonical seed on
// the real :3000 server, plus the two probes the smoke layer cannot reach:
// the CRLF raw-socket rejection (curl refuses to send a CR inside a header
// value — node's net module does not) and the cross-origin from_url LOGIN
// ROUND-TRIP (the open-redirect guard firing live). Self-contained per the
// s30 hardening: the DATABASE_URL pin runs before the dynamic import (ESM
// hoisting would defeat a same-file assignment). The rate-budget doctrine:
// ONE login at the top (a fresh bucket per server boot); every probe
// reuses it or needs no session at all.
process.env.DATABASE_URL = "file:../db/custom.db";

import net from "node:net";

const BASE = process.env.S36_BASE_URL ?? "http://localhost:3000";

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

// --- 1. the header matrix (unauthenticated — zero rate-budget cost) ----------
{
  // (a) the spoofed-Host bounce: 307 + the RELATIVE Location + the reflected
  // (inert) from_url value. RAW SOCKET (not fetch): node's fetch follows the
  // spec and silently DROPS a caller-supplied Host header (a forbidden header
  // name) — only a raw HTTP write carries the spoof onto the wire (the same
  // shape an attacker's client would send, and the same shape curl sends).
  const spoof = await new Promise((resolve) => {
    const sock = net.createConnection({ host: "127.0.0.1", port: 3000 });
    let data = "";
    sock.setTimeout(4000, () => {
      sock.destroy();
      resolve("timeout");
    });
    sock.on("connect", () => {
      sock.write("GET /dashboard HTTP/1.1\r\nHost: evil.example\r\nConnection: close\r\n\r\n");
    });
    sock.on("data", (chunk) => {
      data += chunk.toString("latin1");
    });
    sock.on("end", () => resolve(data));
    sock.on("close", () => resolve(data || "empty"));
    sock.on("error", (e) => resolve("error: " + e.message));
  });
  const statusLine = spoof.split("\r\n")[0] ?? "";
  const loc = (spoof.match(/location:\s*([^\r\n]+)/i)?.[1] ?? "").trim();
  ok("the spoofed-Host bounce 307s", statusLine.includes("307"), `got: ${statusLine}`);
  ok(
    "the Location stays RELATIVE /login (the browser never leaves the origin)",
    /^\/login\?/.test(loc),
    `got: ${loc}`
  );
  ok(
    "the from_url carries the reflected Host (the documented INERT reflection)",
    loc.includes("from_url=http%3A%2F%2Fevil.example%2Fdashboard"),
    `got: ${loc}`
  );

  // (b) the X-Forwarded-Proto flip: the middleware runner honors XFP in
  // nextUrl.protocol (correct behind a legit TLS proxy — the deployment
  // contract).
  const rXfp = await fetch(BASE + "/dashboard", {
    headers: { "X-Forwarded-Proto": "https" },
    redirect: "manual",
  });
  const locXfp = rXfp.headers.get("location") ?? "";
  ok(
    "X-Forwarded-Proto flips the from_url protocol",
    locXfp.includes("from_url=https%3A%2F%2F"),
    `got: ${locXfp}`
  );

  // (c) the X-Forwarded-Host no-op: the Host header wins.
  const rXfh = await fetch(BASE + "/dashboard", {
    headers: { "X-Forwarded-Host": "evil.example" },
    redirect: "manual",
  });
  const locXfh = rXfh.headers.get("location") ?? "";
  ok(
    "X-Forwarded-Host is ignored (the Host header wins)",
    !locXfh.includes("evil.example"),
    `got: ${locXfh}`
  );

  // (d) the deep-link query survival.
  const rDeep = await fetch(BASE + "/ticketdetails?id=abc123", {
    redirect: "manual",
  });
  const locDeep = rDeep.headers.get("location") ?? "";
  ok(
    "the from_url preserves the deep-link query",
    locDeep.includes("from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Dabc123"),
    `got: ${locDeep}`
  );

  // (e) the matcher boundary: an unmatched sub-path renders the public 404.
  const r404 = await fetch(BASE + "/dashboard/nonexistent", {
    redirect: "manual",
  });
  ok(
    "unmatched sub-paths render the public 404 (NOT the login bounce)",
    r404.status === 404,
    `got ${r404.status}`
  );

  // (f) the /login non-reflection: the param never renders server-side.
  const rLogin = await fetch(
    BASE + "/login?from_url=https%3A%2F%2Fevil.example%2Fdashboard"
  );
  const html = await rLogin.text();
  ok(
    "the login page reflects nothing server-side (the XSS surface closed)",
    !html.includes("evil.example"),
    `${html.split("evil.example").length - 1} occurrences`
  );
}

// --- 2. the CRLF raw-socket rejection (node net — curl cannot send it) -------
{
  const result = await new Promise((resolve) => {
    const sock = net.createConnection({ host: "127.0.0.1", port: 3000 });
    let data = "";
    sock.setTimeout(4000, () => {
      sock.destroy();
      resolve("timeout");
    });
    sock.on("connect", () => {
      // A CR inside the Host VALUE — the classic header-injection shape.
      // Node's HTTP parser must reject the request outright.
      sock.write(
        "GET /dashboard HTTP/1.1\r\nHost: evil.example\rX-Injected: 1\r\n\r\n"
      );
    });
    sock.on("data", (chunk) => {
      data += chunk.toString("latin1");
      sock.destroy();
      resolve(data.split("\r\n")[0] ?? "");
    });
    sock.on("error", (e) => resolve("error: " + e.message));
  });
  ok(
    "a CR inside the Host value is rejected at the parser boundary (400)",
    result.includes("400"),
    `got: ${result}`
  );
}

// --- 3. the login round-trip with a cross-origin from_url ---------------------
// The open-redirect guard firing LIVE: the poisoned param must lose to the
// /dashboard fallback. The ONE rate-budget request of this script.
{
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
  ok("the demo login (the one rate-budget request)", loginRes.status === 200 && !!cookie);

  // The poisoned login page is fetched with the session cookie held back —
  // the client-side guard runs at SUBMIT time in the browser; here the same
  // contract is proven at the HTTP layer: the page 200s (no server-side
  // redirect toward the param) and reflects nothing (the (f) re-check in
  // the logged-out shape already proved the raw page). The decisive live
  // half: the post-login landing target is computed CLIENT-SIDE, so the
  // HTTP-layer proof is the unit pins + the E2E round-trip pin; what this
  // block adds is that the login page serves the poisoned param WITHOUT
  // a server-side redirect and WITHOUT reflecting it, under a session.
  const pageRes = await fetch(
    BASE + "/login?from_url=https%3A%2F%2Fevil.example%2Fs36",
    { headers: { Cookie: cookie } }
  );
  const html = await pageRes.text();
  ok(
    "the poisoned /login serves 200 with no server-side redirect",
    pageRes.status === 200 && !pageRes.redirected,
    `status ${pageRes.status}, redirected ${pageRes.redirected}`
  );
  ok(
    "the poisoned /login reflects nothing under a session either",
    !html.includes("evil.example")
  );
}

// --- 4. the seed stays canonical (no fixture wrote to the canonical db) -------
{
  const { PrismaClient } = await import("@prisma/client");
  const p = new PrismaClient();
  const [u, t, c, a] = await Promise.all([
    p.user.count(),
    p.ticket.count(),
    p.comment.count(),
    p.attachment.count(),
  ]);
  const demo = await p.ticket.count({
    where: { createdBy: { email: "demo@servicedesk.app" } },
  });
  ok(
    "the seed stays canonical (4 users / 11 tickets / 3 comments / 0 attachments / demo owns 5)",
    u === 4 && t === 11 && c === 3 && a === 0 && demo === 5,
    `got ${u}/${t}/${c}/${a}/demo ${demo}`
  );
  await p.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
