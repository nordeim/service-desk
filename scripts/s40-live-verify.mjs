// Session-40 live verification: the 405 JSON-boundary closure — the same
// contracts the s40 unit + smoke pins hold, verified against the canonical
// seed on the real :3000 server, plus the probes the smoke layer cannot
// reach: the LIVE wrong-method matrix across all 11 known routes (status +
// content-type + the {error} envelope + the RFC-mandated Allow header),
// the honest OPTIONS advertisement table, the HEAD-on-POST-only contract,
// the non-shadow happy paths, the rate-budget non-interference proof (the
// wrong-method dispatch never burns a bucket slot — the s21 arithmetic),
// the s33 login set-cookie, the s37 lifecycle contracts, and the seed
// re-verification. Self-contained per the s30 hardening: the DATABASE_URL
// pin runs before the dynamic import. The rate-budget doctrine: ONE real
// login at most (the set-cookie probe); every other probe rides an
// explicit-XFF key or a cookie-less path.
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S40_BASE_URL ?? "http://localhost:3000";

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

// --- 1. the LIVE wrong-method matrix (the 405 JSON-boundary proof) ---------
// Every known route × a representative wrong method: 405 +
// content-type: application/json + the exact {error: "Method not allowed"}
// envelope + the Allow header (RFC 9110 §15.5.6). Pre-fix (measured live
// at the gap analysis): 16/16 probes answered the framework's empty-body,
// no-content-type 405.
{
  const probes = [
    ["PUT", "/api/health", "GET, HEAD, OPTIONS"],
    ["POST", "/api/auth/me", "GET, HEAD, OPTIONS"],
    ["GET", "/api/auth/login", "POST, DELETE, OPTIONS"],
    ["PUT", "/api/auth/logout", "POST, OPTIONS"],
    ["DELETE", "/api/auth/signup", "POST, OPTIONS"],
    ["PATCH", "/api/auth/forgot-password", "POST, OPTIONS"],
    ["DELETE", "/api/stats", "GET, HEAD, OPTIONS"],
    ["PATCH", "/api/tickets", "GET, HEAD, POST, OPTIONS"],
    ["POST", "/api/tickets/s40-live-probe", "GET, HEAD, PATCH, OPTIONS"],
    ["GET", "/api/tickets/s40-live-probe/comments", "POST, OPTIONS"],
    ["DELETE", "/api/tickets/s40-live-probe/attachments/s40-live-aid", "GET, HEAD, OPTIONS"],
  ];
  for (const [method, path, allow] of probes) {
    const r = await fetch(BASE + path, { method });
    const ct = r.headers.get("content-type") ?? "";
    const allowHdr = r.headers.get("allow") ?? "";
    let bodyOk = false;
    try {
      const body = await r.json();
      bodyOk =
        Object.keys(body).length === 1 &&
        body.error === "Method not allowed";
    } catch {
      bodyOk = false;
    }
    ok(
      `${method} ${path} answers 405 + JSON + {error} + Allow`,
      r.status === 405 &&
        ct.includes("application/json") &&
        bodyOk &&
        allowHdr === allow,
      `got ${r.status} ct=${ct} allow=${allowHdr}`
    );
  }
}

// --- 2. the honest OPTIONS advertisement table (the anti-lie proof) -------
// The explicit OPTIONS per route: 204 + the exact honest allow list + an
// empty body. Dropping the explicit export lets the auto-OPTIONS grow the
// stub methods (measured at the gap analysis) — this table is the alarm.
{
  const probes = [
    ["/api/health", "GET, HEAD, OPTIONS"],
    ["/api/auth/me", "GET, HEAD, OPTIONS"],
    ["/api/auth/login", "POST, DELETE, OPTIONS"],
    ["/api/auth/logout", "POST, OPTIONS"],
    ["/api/auth/signup", "POST, OPTIONS"],
    ["/api/auth/forgot-password", "POST, OPTIONS"],
    ["/api/stats", "GET, HEAD, OPTIONS"],
    ["/api/tickets", "GET, HEAD, POST, OPTIONS"],
    ["/api/tickets/s40-live-probe", "GET, HEAD, PATCH, OPTIONS"],
    ["/api/tickets/s40-live-probe/comments", "POST, OPTIONS"],
    ["/api/tickets/s40-live-probe/attachments/s40-live-aid", "GET, HEAD, OPTIONS"],
  ];
  for (const [path, allow] of probes) {
    const r = await fetch(BASE + path, { method: "OPTIONS" });
    const allowHdr = r.headers.get("allow") ?? "";
    const body = await r.text();
    ok(
      `OPTIONS ${path} advertises ${allow} (204, empty body)`,
      r.status === 204 && allowHdr === allow && body === "",
      `got ${r.status} allow=${allowHdr} body=${body.slice(0, 40)}`
    );
  }
}

// --- 3. the HEAD-on-POST-only contract --------------------------------------
// HEAD auto-derives (200-empty) only from GET; on a POST-only route it
// answers the 405 stub (status + Allow; the HTTP layer strips the body).
{
  const r = await fetch(BASE + "/api/auth/login", { method: "HEAD" });
  ok(
    "HEAD /api/auth/login answers 405 + the honest Allow (no auto-HEAD derivation)",
    r.status === 405 && (r.headers.get("allow") ?? "") === "POST, DELETE, OPTIONS",
    `got ${r.status} allow=${r.headers.get("allow")}`
  );
}

// --- 4. the non-shadow happy paths (the implemented methods unshadowed) ---
{
  const rHealth = await fetch(BASE + "/api/health");
  ok("GET /api/health still 200 (the stubs never shadow)", rHealth.status === 200, `got ${rHealth.status}`);
  const rMe = await fetch(BASE + "/api/auth/me");
  ok("GET /api/auth/me still 401 unauthenticated (unshadowed)", rMe.status === 401, `got ${rMe.status}`);
  const rTickets = await fetch(BASE + "/api/tickets");
  ok("GET /api/tickets still 401 unauthenticated (unshadowed)", rTickets.status === 401, `got ${rTickets.status}`);
  const rCatchall = await fetch(BASE + "/api/s40-unknown-path");
  ok(
    "the s33 catch-all still owns the unknown paths (404 + JSON — the boundary's path half)",
    rCatchall.status === 404 && (rCatchall.headers.get("content-type") ?? "").includes("application/json"),
    `got ${rCatchall.status}`
  );
}

// --- 5. the rate-budget non-interference proof (the s21 arithmetic) -------
// The wrong-method dispatch precedes the rate limiter: 15 wrong-method
// requests to the login route on ONE XFF key must burn ZERO bucket slots —
// the 16th request, a real POST on the SAME key, answers 401 (its bucket's
// FIRST slot), never 429. (The smoke layer holds the same contract; this
// is the canonical-server proof.)
{
  const key = "10.0.0.40";
  for (let i = 0; i < 15; i++) {
    const r = await fetch(BASE + "/api/auth/login", {
      method: "GET",
      headers: { "X-Forwarded-For": key },
    });
    if (r.status !== 405) {
      ok("the 15 wrong-method login requests answer 405", false, `got ${r.status}`);
    }
  }
  const rPost = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": key },
    body: JSON.stringify({ email: "nobody@servicedesk.app", password: "wrong" }),
  });
  ok(
    "the wrong-method requests burn ZERO rate-bucket slots (a POST on the same key answers 401 — the s21 arithmetic untouched)",
    rPost.status === 401,
    `got ${rPost.status}`
  );
}

// --- 6. the s33 login set-cookie (ONE real login — the rate budget) -------
{
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@servicedesk.app",
      password: "Demo1234!",
    }),
  });
  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  ok(
    "the demo login sets the s33 cookie attribute set (Path/Max-Age/Secure/HttpOnly/SameSite)",
    loginRes.status === 200 &&
      /Path=\/; (Expires=[^;]+; )?Max-Age=604800; Secure; HttpOnly; SameSite=lax/.test(
        setCookie
      ),
    `got: ${setCookie}`
  );
}

// --- 7. the s37 lifecycle contracts re-verified (cookie-less, zero cost) --
{
  const r = await fetch(BASE + "/ticketdetails?id=s40-check", {
    redirect: "manual",
  });
  const loc = r.headers.get("location") ?? "";
  ok(
    "the cookie-less deep-link bounce still carries from_url (the s19 contract)",
    r.status === 307 &&
      loc.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds40-check"
      ),
    `got ${r.status} ${loc}`
  );
  const rBad = await fetch(BASE + "/ticketdetails?id=s40-check", {
    headers: { Cookie: "servicedesk_session=tampered-body.broken-mac" },
    redirect: "manual",
  });
  const locBad = rBad.headers.get("location") ?? "";
  ok(
    "the invalid-cookie deep-link bounce carries from_url (the s37 contract)",
    rBad.status === 307 &&
      locBad.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds40-check"
      ),
    `got ${rBad.status} ${locBad}`
  );
}

// --- 8. the seed re-verified canonical after ------------------------------
{
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const [users, tickets, comments, demoTickets] = await Promise.all([
    db.user.count(),
    db.ticket.count(),
    db.comment.count(),
    db.ticket.count({ where: { createdBy: { email: "demo@servicedesk.app" } } }),
  ]);
  const statuses = await db.ticket.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const statusMap = Object.fromEntries(
    statuses.map((s) => [s.status, s._count._all])
  );
  await db.$disconnect();
  ok(
    "the seed is canonical after (4 users / 11 tickets / 3 comments / demo owns 5)",
    users === 4 && tickets === 11 && comments === 3 && demoTickets === 5,
    `got ${users}/${tickets}/${comments}/${demoTickets}`
  );
  ok(
    "the status vocabulary is the seeded distribution (4 open / 2 in_progress / 3 resolved / 2 closed)",
    (statusMap.open ?? 0) === 4 &&
      (statusMap.in_progress ?? 0) === 2 &&
      (statusMap.resolved ?? 0) === 3 &&
      (statusMap.closed ?? 0) === 2,
    `got ${JSON.stringify(statusMap)}`
  );
}

console.log(`\ns40 live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
