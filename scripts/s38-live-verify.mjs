// Session-38 live verification: the XFF rightmost-element trust — the same
// contracts the s38 smoke pins hold, verified against the canonical seed on
// the real :3000 server, plus the probes the smoke layer cannot reach: the
// LIVE bypass-closure arithmetic on the production standalone (the rotating
// client prefix vs the stable proxy-appended suffix), the key-isolation
// matrix (distinct rightmost values mint distinct buckets — the no-false-
// sharing boundary), the INJECTED-XFF platform discovery (the standalone
// server injects x-forwarded-for: <socket address> into XFF-less requests —
// the x-real-ip fallback is unreachable behind the injection, and honest
// direct clients key on their real socket IP), the login set-cookie
// attributes on this build (the s33 set), the s37 lifecycle contracts
// re-verified (cookie-less probes — zero rate cost), and the seed
// re-verification. Self-contained per the s30 hardening: the DATABASE_URL
// pin runs before the dynamic import (ESM hoisting would defeat a same-file
// assignment). The rate-budget doctrine: ONE real login at most (a fresh
// bucket per server boot — the set-cookie probe needs it; it keys on the
// injected socket IP like every no-XFF request); the explicit-XFF probes
// ride their own keys, and the socket-IP bucket arithmetic is budgeted so
// the login's shared bucket stays at zero hits until the set-cookie probe.
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S38_BASE_URL ?? "http://localhost:3000";

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

const WRONG = JSON.stringify({
  email: "nobody@servicedesk.app",
  password: "wrong",
});

// --- 1. the LIVE bypass closure (the login bucket, the simulated proxy) -----
// Ten attempts whose CLIENT-chosen prefix ROTATES while the proxy-appended
// suffix stays STABLE must exhaust ONE bucket (the rightmost key): the
// tenth answers 401 (the bucket's last allowed slot) and the eleventh
// answers 429 — the pre-fix behavior was 401 forever (each prefix minted
// a fresh bucket; the s38 measured bypass: 30 attempts, zero 429s).
{
  const codes = [];
  for (let i = 1; i <= 10; i++) {
    const r = await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": `attacker-rotate-${i}, 10.0.0.38`,
      },
      body: WRONG,
    });
    codes.push(r.status);
  }
  ok(
    "the ten rotating-prefix attempts all answer 401 (one stable rightmost bucket)",
    codes.every((c) => c === 401),
    `got ${codes.join(",")}`
  );
  const r11 = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "attacker-rotate-11, 10.0.0.38",
    },
    body: WRONG,
  });
  const retryAfter = r11.headers.get("retry-after");
  const body = await r11.text();
  ok(
    "the 11th rotating-prefix attempt is throttled (429 + Retry-After — the bypass CLOSED)",
    r11.status === 429 && retryAfter !== null && body.includes("Too many attempts"),
    `got ${r11.status}, retry-after=${retryAfter}`
  );
}

// --- 2. the key-isolation boundary (distinct rightmost → distinct buckets) --
// A second simulated client behind the SAME proxy shape (a different
// proxy-appended suffix) gets its OWN bucket: 401, not the first client's
// 429 — the fix did not collapse all proxied clients into one bucket.
{
  const r = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "second-client-prefix, 10.0.0.77",
    },
    body: WRONG,
  });
  ok(
    "a distinct rightmost value mints its own bucket (401 — no false sharing)",
    r.status === 401,
    `got ${r.status}`
  );
}

// --- 3. the injected-XFF platform discovery + the x-real-ip shadowing -------
// MEASURED this session (the temporary debug-route probe, since removed):
// the standalone Next server INJECTS `x-forwarded-for: <socket address>`
// into every XFF-less request (plus x-forwarded-host/port/proto), and
// passes a client-sent XFF through VERBATIM (no append). Two consequences:
// (a) the x-real-ip fallback branch in clientIp is UNREACHABLE behind the
// standalone — the injected XFF always wins the precedence; (b) honest
// direct clients (no XFF forging) key on their REAL socket IP — the
// no-proxy limiter posture is STRONGER than the s21 "unknown" narrative
// (only XFF-forging direct clients can rotate, the documented inherent
// limit). Proven here on the forgot bucket (5/15-min): five X-Real-IP-only
// requests (NO XFF → the injected socket IP is the key) exhaust the SHARED
// socket-IP bucket, so the 6th (no headers at all, the same injected key)
// answers 429 — if x-real-ip were the key, the 6th would land on a fresh
// bucket and answer 200. The escape hatch: an explicit XFF request keys on
// its own rightmost value (fresh bucket → 200).
{
  for (let i = 1; i <= 5; i++) {
    const r = await fetch(BASE + "/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Real-IP": "10.0.0.99",
      },
      body: JSON.stringify({ email: "nobody@servicedesk.app" }),
    });
    if (r.status !== 200) {
      ok("the five X-Real-IP-only forgot requests answer 200", false, `got ${r.status}`);
    }
  }
  const r6 = await fetch(BASE + "/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nobody@servicedesk.app" }),
  });
  ok(
    "the injected XFF shadows x-real-ip (the X-Real-IP-only requests exhausted the SHARED socket-IP bucket — the 6th no-header request 429s)",
    r6.status === 429,
    `got ${r6.status}`
  );
  const rEscape = await fetch(BASE + "/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.7",
    },
    body: JSON.stringify({ email: "nobody@servicedesk.app" }),
  });
  ok(
    "an explicit XFF escapes the shared bucket (its own rightmost key — fresh, 200)",
    rEscape.status === 200,
    `got ${rEscape.status}`
  );
}

// --- 4. the login set-cookie attributes (ONE real login — the s33 set) -----
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

// --- 5. the s37 lifecycle contracts re-verified (cookie-less, zero cost) ---
{
  const r = await fetch(BASE + "/ticketdetails?id=s38-check", {
    redirect: "manual",
  });
  const loc = r.headers.get("location") ?? "";
  ok(
    "the cookie-less deep-link bounce still carries from_url (the s19 contract)",
    r.status === 307 &&
      loc.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds38-check"
      ),
    `got ${r.status} ${loc}`
  );
  const rBad = await fetch(BASE + "/ticketdetails?id=s38-check", {
    headers: { Cookie: "servicedesk_session=tampered-body.broken-mac" },
    redirect: "manual",
  });
  const locBad = rBad.headers.get("location") ?? "";
  ok(
    "the invalid-cookie deep-link bounce carries from_url (the s37 contract)",
    rBad.status === 307 &&
      locBad.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds38-check"
      ),
    `got ${rBad.status} ${locBad}`
  );
}

// --- 6. the seed re-verified canonical after -------------------------------
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

console.log(`\ns38 live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
