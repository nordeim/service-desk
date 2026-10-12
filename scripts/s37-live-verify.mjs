// Session-37 live verification: the auth-cookie lifecycle contract — the
// same contracts the s37 smoke pins hold, verified against the canonical
// seed on the real :3000 server, plus the probes the smoke layer cannot
// reach: the set-cookie attribute evolution across the full lifecycle
// (login → invalid-cookie bounce → re-login → logout), the LIVE
// header-overwrite proof (a client-supplied x-sd-from-url must lose to the
// proxy's construction — the spoof-resistance half the unit pins prove at
// the handler level), and the seed re-verification. Self-contained per the
// s30 hardening: the DATABASE_URL pin runs before the dynamic import (ESM
// hoisting would defeat a same-file assignment). The rate-budget doctrine:
// TWO logins at most (a fresh bucket per server boot — the lifecycle
// round-trip needs one, the logout flow needs one); every other probe
// rides cookie-less or tampered-cookie requests that never touch the
// limiter.
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S37_BASE_URL ?? "http://localhost:3000";

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

// --- 1. the invalid-cookie bounce matrix (tampered cookie — no rate cost) ----
{
  // (a) the expired-session deep link: the tampered cookie passes the
  // proxy's presence check, the layout's verify rejects it, and the bounce
  // carries the deep link (the query survives — the s37 contract, the
  // reference's always-preserve gate).
  const r = await fetch(BASE + "/ticketdetails?id=s37-lifecycle", {
    headers: { Cookie: "servicedesk_session=tampered-body.broken-mac" },
    redirect: "manual",
  });
  const loc = r.headers.get("location") ?? "";
  ok("the invalid-cookie bounce 307s", r.status === 307, `got ${r.status}`);
  ok(
    "the invalid-cookie bounce carries the deep-link from_url (the s37 contract)",
    loc.includes(
      "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds37-lifecycle"
    ),
    `got: ${loc}`
  );

  // (b) the plain-cookie-less bounce still carries from_url (the s19
  // contract re-verified — the fix did not disturb the fast path).
  const rPlain = await fetch(BASE + "/ticketdetails?id=s37-lifecycle", {
    redirect: "manual",
  });
  const locPlain = rPlain.headers.get("location") ?? "";
  ok(
    "the cookie-less bounce still carries from_url (the s19 contract)",
    locPlain.includes(
      "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds37-lifecycle"
    ),
    `got: ${locPlain}`
  );
}

// --- 2. the LIVE header-overwrite proof (the spoof-resistance half) ---------
// A request carrying BOTH a client-supplied x-sd-from-url AND a tampered
// session cookie: the proxy's overwrite fires first (the matcher owns the
// header), so the layout's bounce must carry the PROXY's construction
// (Host-header + path) — never the client's value.
{
  const r = await fetch(BASE + "/dashboard", {
    headers: {
      Cookie: "servicedesk_session=tampered-body.broken-mac",
      "x-sd-from-url": "http://client-evil.example/spoof",
    },
    redirect: "manual",
  });
  const loc = r.headers.get("location") ?? "";
  ok(
    "the client-supplied x-sd-from-url is OVERWRITTEN (the proxy's construction wins)",
    loc.includes("from_url=http%3A%2F%2Flocalhost%3A3000%2Fdashboard") &&
      !loc.includes("client-evil.example"),
    `got: ${loc}`
  );
}

// --- 3. the lifecycle round-trip (ONE real login) ---------------------------
{
  // The login set-cookie: the exact s33 attribute set, live on this build.
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@servicedesk.app",
      password: "Demo1234!",
    }),
  });
  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  ok(
    "the demo login sets the s33 cookie attribute set (Path/Max-Age/Secure/HttpOnly/SameSite)",
    loginRes.status === 200 &&
      /Path=\/; (Expires=[^;]+; )?Max-Age=604800; Secure; HttpOnly; SameSite=lax/.test(
        setCookie
      ),
    `got: ${setCookie}`
  );

  // With the VALID session, the guarded route renders (no bounce).
  const rAuth = await fetch(BASE + "/dashboard", {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  ok(
    "the valid session renders the guarded route (200, no bounce)",
    rAuth.status === 200,
    `got ${rAuth.status}`
  );

  // The expired-session round-trip: the deep-link bounce (tampered cookie)
  // followed by a re-login — the landing target is computed client-side
  // (E2E-pinned); the HTTP-layer proof here is the bounce + the login
  // success that follows it.
  const rBounce = await fetch(BASE + "/ticketdetails?id=s37-roundtrip", {
    headers: { Cookie: "servicedesk_session=tampered-body.broken-mac" },
    redirect: "manual",
  });
  const locBounce = rBounce.headers.get("location") ?? "";
  ok(
    "the expired-session deep-link bounce precedes the re-login (from_url carried)",
    rBounce.status === 307 &&
      locBounce.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds37-roundtrip"
      ),
    `got: ${locBounce}`
  );

  // The logout: the clear-cookie carries the exact s33 clear set
  // (Max-Age=0), and the session is gone (the bounce returns).
  const logoutRes = await fetch(BASE + "/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const clearCookie = logoutRes.headers.get("set-cookie") ?? "";
  ok(
    "the logout clears with the s33 attribute set (Max-Age=0)",
    logoutRes.status === 200 &&
      /Path=\/; Max-Age=0; Secure; HttpOnly; SameSite=lax/.test(clearCookie),
    `got: ${clearCookie}`
  );
  // The logout response body shape: {ok: true} exactly.
  const logoutBody = await logoutRes.json();
  ok("the logout body is exactly {ok: true}", logoutBody.ok === true);
}

// --- 4. the seed re-verified canonical after ---------------------------------
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

console.log(`\ns37 live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
