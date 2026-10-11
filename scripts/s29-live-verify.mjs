// Session 29 live verification — the API-wide empty-grammar contract, run
// against the production standalone server on :3000 with the canonical DB.
// Plain fetch + manual cookie handling (the s22 tool lesson: page.request
// under Bun crashes on set-cookie responses; the s21+ scripts use this idiom).
//
// Checks (all must PASS):
//   1. login 200 + session cookie captured (fresh rate bucket, slot 1)
//   2. POST /api/auth/login?banana=1 → 400 + both messages (slot 2 — the
//      login grammar pin; the smoke script's s21 429 arithmetic leaves no
//      room for it there)
//   3. POST /api/auth/forgot-password?scope=mine → 400 (its own fresh
//      bucket, slot 1 — the forgot grammar pin)
//   4. GET /api/health?banana=1 → 400 (the public route's grammar)
//   5. the bare /api/health → 200 + status ok + db up
//   6. GET /api/auth/me?scope=mine → 400 (the cross-route pin)
//   7. the bare /api/auth/me → 200 + the user shape
//   8. POST /api/tickets?banana=1 → 400, no ticket created
//   9. GET /api/tickets/[id]?banana=1 → 400 (the seeded ticket)
//  10. PATCH /api/tickets/[id]?banana=1 → 400, no mutation applied
//  11. POST /api/tickets/[id]/comments?scope=mine → 400, no comment created
//  12. the attachment-download grammar: fixture ticket + tiny attachment →
//      GET ?banana=1 → 400; the bare download → 200 + inline disposition
//      (fixture cleaned up via Prisma at the end)
//  13. POST /api/auth/logout?banana=1 → 400 + the session STILL valid
//      (the gate rejects before the cookie clears)
//  14. the s28 stats grammar gate still green next door (?banana=1 → 400)
//  15. the s27 list grammar gate still green (?banana=1 on /api/tickets → 400)
//  16. the no-param happy paths intact (stats aggregate + tickets list)
//  17. logged-out me → 401 (the grammar gate does not bypass auth)

import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log(`[PASS] ${name}`);
  } else {
    fail++;
    console.log(`[FAIL] ${name}${extra ? ` — ${extra}` : ""}`);
  }
};

// --- 1. login (fresh bucket, slot 1) ------------------------------------------
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
});
const setCookie = loginRes.headers.get("set-cookie") ?? "";
const cookie = setCookie.split(";")[0];
ok("1. login 200 + cookie captured", loginRes.status === 200 && cookie.startsWith("servicedesk_session="));

// --- 2. the login grammar pin (slot 2) ----------------------------------------
{
  const res = await fetch(`${BASE}/api/auth/login?banana=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  const body = await res.json().catch(() => ({}));
  ok(
    "2. POST /api/auth/login?banana=1 → 400 + both messages",
    res.status === 400 &&
      typeof body.error === "string" &&
      body.error.includes("unknown query parameter: banana") &&
      body.error.includes("this endpoint takes no query parameters"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 3. the forgot-password grammar pin (its own fresh bucket) ----------------
{
  const res = await fetch(`${BASE}/api/auth/forgot-password?scope=mine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nobody@servicedesk.app" }),
  });
  const body = await res.json().catch(() => ({}));
  ok(
    "3. POST /api/auth/forgot-password?scope=mine → 400 (the cross-route name)",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: scope"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 4-5. the health route -----------------------------------------------------
{
  const res = await fetch(`${BASE}/api/health?banana=1`);
  const body = await res.json().catch(() => ({}));
  ok(
    "4. GET /api/health?banana=1 → 400 (the public route's grammar)",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: banana"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const res = await fetch(`${BASE}/api/health`);
  const body = await res.json().catch(() => ({}));
  ok(
    "5. the bare /api/health → 200 + ok + db up",
    res.status === 200 && body.status === "ok" && body.db === "up",
    `status=${res.status} body=${JSON.stringify(body)}`,
  );
}

// --- 6-7. the me route ----------------------------------------------------------
{
  const res = await fetch(`${BASE}/api/auth/me?scope=mine`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "6. GET /api/auth/me?scope=mine → 400 (the cross-route pin)",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: scope"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const res = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "7. the bare /api/auth/me → 200 + the user shape",
    res.status === 200 && body.user?.email === "demo@servicedesk.app",
    `status=${res.status} body=${JSON.stringify(body)}`,
  );
}

// --- 8. the create grammar -------------------------------------------------------
{
  const res = await fetch(`${BASE}/api/tickets?banana=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "s29 live-verify grammar probe (must not persist)",
      description: "The query-grammar probe must be rejected without creating anything.",
      category: "software",
      priority: "low",
    }),
  });
  const body = await res.json().catch(() => ({}));
  ok(
    "8. POST /api/tickets?banana=1 → 400, no ticket created",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: banana"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 16. the no-param happy paths intact (BEFORE the fixture — the canonical
// counts must reflect the seed, not the probe fixtures below) ----------------
{
  const res = await fetch(`${BASE}/api/stats`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "16a. the no-param stats aggregate intact (mine + global + avgResolutionMs)",
    res.status === 200 && typeof body.mine === "object" && typeof body.global === "object" && "avgResolutionMs" in body,
    `status=${res.status} body=${JSON.stringify(body).slice(0, 120)}`,
  );
  ok(
    "16b. the canonical counts (mine.total = 5, global.total = 11)",
    body.mine?.total === 5 && body.global?.total === 11,
    `mine=${body.mine?.total} global=${body.global?.total}`,
  );
}

// --- 9-11. the detail / patch / comments grammars (a seeded ticket) -------------
const listRes = await fetch(`${BASE}/api/tickets`, { headers: { Cookie: cookie } });
const listBody = await listRes.json();
const seeded = listBody.tickets?.[0];
ok("9a. the seeded list fetched (the bare 200)", listRes.status === 200 && !!seeded);
const TID = seeded?.id ?? "none";
{
  const res = await fetch(`${BASE}/api/tickets/${TID}?banana=1`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "9. GET /api/tickets/[id]?banana=1 → 400",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: banana"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const res = await fetch(`${BASE}/api/tickets/${TID}?banana=1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "open" }),
  });
  const body = await res.json().catch(() => ({}));
  ok(
    "10. PATCH /api/tickets/[id]?banana=1 → 400, no mutation",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: banana"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const res = await fetch(`${BASE}/api/tickets/${TID}/comments?scope=mine`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ content: "s29 live-verify grammar probe (must not persist)" }),
  });
  const body = await res.json().catch(() => ({}));
  ok(
    "11. POST comments?scope=mine → 400, no comment created",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: scope"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 12. the attachment-download grammar (fixture + cleanup) ---------------------
const fx = await fetch(`${BASE}/api/tickets`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title: "s29 live-verify attachment fixture",
    description: "One tiny attachment for the download-route grammar probe. Cleaned up after.",
    category: "software",
    priority: "low",
    attachments: [
      {
        fileName: "s29-probe.txt",
        mimeType: "text/plain",
        sizeBytes: 4,
        data: Buffer.from("probe").toString("base64"),
      },
    ],
  }),
});
const fxBody = await fx.json();
const fxTicket = fxBody.ticket?.id;
const fxAttachment = fxBody.ticket?.attachments?.[0]?.id;
ok(
  "12a. the fixture created (ticket + 1 attachment)",
  fx.status === 201 && !!fxTicket && !!fxAttachment,
  `status=${fx.status} body=${JSON.stringify(fxBody).slice(0, 120)}`,
);
{
  const res = await fetch(`${BASE}/api/tickets/${fxTicket}/attachments/${fxAttachment}?banana=1`, {
    headers: { Cookie: cookie },
  });
  const body = await res.json().catch(() => ({}));
  ok(
    "12. GET the attachment route?banana=1 → 400",
    res.status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: banana"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
  const bare = await fetch(`${BASE}/api/tickets/${fxTicket}/attachments/${fxAttachment}`, {
    headers: { Cookie: cookie },
  });
  const disp = bare.headers.get("content-disposition") ?? "";
  ok(
    "12b. the bare download → 200 + inline disposition (the happy path intact)",
    bare.status === 200 && disp.includes("inline"),
    `status=${bare.status} disposition=${JSON.stringify(disp)}`,
  );
}

// --- 13. the logout grammar (the session must survive the reject) -----------------
{
  const res = await fetch(`${BASE}/api/auth/logout?banana=1`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const body = await res.json().catch(() => ({}));
  const stillValid = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  ok(
    "13. POST /api/auth/logout?banana=1 → 400 + the session STILL valid",
    res.status === 400 &&
      typeof body.error === "string" &&
      body.error.includes("unknown query parameter: banana") &&
      stillValid.status === 200,
    `status=${res.status} me-after=${stillValid.status}`,
  );
}

// --- 14. the s28 stats grammar gate still green next door -------------------------
{
  const res = await fetch(`${BASE}/api/stats?banana=1`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "14. the s28 stats grammar gate (?banana=1 → 400 + the messages)",
    res.status === 400 &&
      typeof body.error === "string" &&
      body.error.includes("this endpoint takes no query parameters"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 15. the s27 list grammar gate still green -------------------------------------
{
  const res = await fetch(`${BASE}/api/tickets?banana=1`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "15. the s27 list grammar gate (?banana=1 → 400 + the allowed set)",
    res.status === 400 &&
      typeof body.error === "string" &&
      body.error.includes("unknown query parameter: banana") &&
      body.error.includes("allowed:"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 17. logged-out me → 401 (the gate does not bypass auth) -----------------------
{
  const res = await fetch(`${BASE}/api/auth/me`);
  ok("17. logged-out me → 401", res.status === 401, `status=${res.status}`);
}

// --- cleanup: the fixture ticket + attachment + any stray probes -------------------
const db = new PrismaClient();
const delC = await db.comment.deleteMany({ where: { content: { contains: "s29 live-verify grammar probe" } } });
const delT = await db.ticket.deleteMany({ where: { title: { contains: "s29 live-verify" } } });
const [u, t, c, a] = await Promise.all([db.user.count(), db.ticket.count(), db.comment.count(), db.attachment.count()]);
await db.$disconnect();
ok(
  "cleanup. the fixture removed + the canonical seed intact (4/11/3/0)",
  delT.count >= 1 && u === 4 && t === 11 && c === 3 && a === 0,
  `deleted tickets=${delT.count} comments=${delC.count} seed=${u}/${t}/${c}/${a}`,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
