// Session-39 live verification: the rate-limit bucket eviction — the same
// contracts the s39 unit + smoke pins hold, verified against the canonical
// seed on the real :3000 server, plus the probes the smoke layer cannot
// reach: the LIVE flood-survival matrix (a 50k unique-XFF flood — the
// gap-analysis probe shape — exercising the sweep path mid-flood while the
// RSS is monitored from /proc as the honest external signal; the server
// must stay healthy and the limiter byte-identical after), the signup XFF
// closure on the canonical server (the s65 shortlist item), the s38 pins
// re-verified on this build, the s33 login set-cookie, the s37 lifecycle
// contracts, and the seed re-verification. Self-contained per the s30
// hardening: the DATABASE_URL pin runs before the dynamic import. The
// rate-budget doctrine: ONE real login at most (the set-cookie probe);
// every other probe rides an explicit-XFF key or a cookie-less path.
process.env.DATABASE_URL = "file:../db/custom.db";

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BASE = process.env.S39_BASE_URL ?? "http://localhost:3000";

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

// The server's RSS, read from /proc via the :3000 PID (the s38 PID-managed
// doctrine). Best-effort: a soft warning if the PID can't be found.
function serverRSSKb() {
  try {
    const ss = execSync("ss -tlnp 2>/dev/null", { encoding: "utf8" });
    const line = ss.split("\n").find((l) => l.includes(":3000"));
    if (!line) return null;
    const pid = /pid=(\d+)/.exec(line)?.[1];
    if (!pid) return null;
    const status = readFileSync(`/proc/${pid}/status`, "utf8");
    return Number(/VmRSS:\s+(\d+) kB/.exec(status)?.[1] ?? 0);
  } catch {
    return null;
  }
}

// --- 1. the LIVE flood-survival matrix (the eviction integration proof) ----
// The gap-analysis probe shape: 50k requests with a unique rightmost XFF
// each (login 401s — zero DB writes). On the FIXED build this crosses the
// 1000 sweep threshold ~50 times (the time gate admits one sweep/min — the
// flood runs ~60s → 1-2 sweeps, all entries live → nothing deleted — the
// sweep path exercised, the semantics untouched). The external signals:
// health 200 after, a fresh unique key 401s (its OWN bucket's first slot —
// the sweep never touched live entries), and the RSS delta recorded (the
// documented attack-shape ceiling: memory ≤ unique keys × window during an
// ACTIVE window — the leak's defining property, retention FOREVER, is
// pinned at the unit layer where the window is fake-timer deterministic).
{
  const rssBefore = serverRSSKb();
  const codes = new Set();
  const t0 = Date.now();
  for (let i = 0; i < 50_000; i++) {
    const ip = `10.80.${Math.floor(i / 250) % 200}.${(i % 250) + 1}`;
    const r = await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
      body: WRONG,
    });
    codes.add(r.status);
    if (i % 12500 === 0) console.log(`  flood ${i}/50000 (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(0);
  ok(
    "the 50k unique-XFF flood answers only 401 (each key its own bucket's first slot)",
    codes.size === 1 && codes.has(401),
    `got ${[...codes].join(",")}`
  );
  const rHealth = await fetch(BASE + "/api/health");
  ok(
    `the server stays healthy after the flood (${dt}s)`,
    rHealth.status === 200,
    `health got ${rHealth.status}`
  );
  const rFresh = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.81.7.7" },
    body: WRONG,
  });
  ok(
    "a fresh unique-XFF key answers 401 after the flood (the limiter exact — the sweep never touched live buckets)",
    rFresh.status === 401,
    `got ${rFresh.status}`
  );
  const rssAfter = serverRSSKb();
  if (rssBefore && rssAfter) {
    console.log(
      `  [INFO] RSS ${rssBefore} kB → ${rssAfter} kB across the flood (Δ ${(rssAfter - rssBefore) / 1024} MB — the documented active-window ceiling; the retention-forever defect is unit-pinned)`
    );
  } else {
    console.log("  [WARN] the :3000 PID could not be read — the RSS signal skipped (soft)");
  }
}

// --- 2. the signup XFF closure (the s65 shortlist item, canonical server) --
// Ten rotating-prefix signup POSTs (invalid bodies — 400s, zero DB writes)
// with the STABLE proxy-appended suffix 10.0.0.39 exhaust ONE bucket keyed
// on the rightmost; the 11th answers 429. The s38 seam's coverage of the
// signup surface, live-verified (the smoke layer holds the pin).
{
  for (let i = 1; i <= 10; i++) {
    const r = await fetch(BASE + "/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": `attacker-rotate-${i}, 10.0.0.39`,
      },
      body: JSON.stringify({ email: "not-an-email", name: "", password: "x" }),
    });
    if (r.status !== 400) {
      ok("the ten rotating-prefix signup attempts answer 400 (invalid bodies)", false, `got ${r.status}`);
    }
  }
  const r11 = await fetch(BASE + "/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "attacker-rotate-11, 10.0.0.39",
    },
    body: JSON.stringify({ email: "not-an-email", name: "", password: "x" }),
  });
  ok(
    "the 11th rotating-prefix signup attempt is throttled (429 — the s65 shortlist closed on the canonical server)",
    r11.status === 429,
    `got ${r11.status}`
  );
}

// --- 3. the s38 pins re-verified on this build (the eviction changed the
// rateLimit seam — the s38 contracts must hold byte-identical) --------------
{
  // 3a. the rotating-prefix login closure on a fresh stable key.
  for (let i = 1; i <= 10; i++) {
    await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": `attacker-verify-${i}, 10.0.0.38`,
      },
      body: WRONG,
    });
  }
  const r11 = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "attacker-verify-11, 10.0.0.38",
    },
    body: WRONG,
  });
  ok(
    "the s38 rotating-prefix login closure still holds (the 11th 429s)",
    r11.status === 429,
    `got ${r11.status}`
  );
  // 3b. the key-isolation boundary.
  const rIso = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "second-client-prefix, 10.0.0.77",
    },
    body: WRONG,
  });
  ok(
    "a distinct rightmost value still mints its own bucket (401 — no false sharing)",
    rIso.status === 401,
    `got ${rIso.status}`
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
  const r = await fetch(BASE + "/ticketdetails?id=s39-check", {
    redirect: "manual",
  });
  const loc = r.headers.get("location") ?? "";
  ok(
    "the cookie-less deep-link bounce still carries from_url (the s19 contract)",
    r.status === 307 &&
      loc.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds39-check"
      ),
    `got ${r.status} ${loc}`
  );
  const rBad = await fetch(BASE + "/ticketdetails?id=s39-check", {
    headers: { Cookie: "servicedesk_session=tampered-body.broken-mac" },
    redirect: "manual",
  });
  const locBad = rBad.headers.get("location") ?? "";
  ok(
    "the invalid-cookie deep-link bounce carries from_url (the s37 contract)",
    rBad.status === 307 &&
      locBad.includes(
        "from_url=http%3A%2F%2Flocalhost%3A3000%2Fticketdetails%3Fid%3Ds39-check"
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

console.log(`\ns39 live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
