// Session-32 live verification: the request-body grammar contract (the
// parseBodyKeys seam) on the REAL :3000 database — the same contracts the
// s32 smoke pins hold, verified against the canonical seed with fixtures
// cleaned. Self-contained per the s30 hardening: the DATABASE_URL pin runs
// before the dynamic import (ESM hoisting would defeat a same-file
// assignment).
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S32_BASE_URL ?? "http://localhost:3000";
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

async function jfetch(method, path, body, cookies) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookies ? { cookie: cookies } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

// --- session (demo login) ---
const login = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
});
const cookies = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
ok("0. demo login (session)", login.status === 200);

// 1. create +banana → 400 + the message
let r = await jfetch("POST", "/api/tickets", {
  title: "s32 live probe", description: "grammar probe on the real db",
  category: "software", priority: "low", banana: 1,
}, cookies);
ok("1. create +banana → 400", r.status === 400 && /unknown request-body field: banana \(allowed: title, description, category, priority, attachments\)/.test(r.json?.error ?? ""), JSON.stringify(r.json));

// 2. the cross-route shape: create +status → 400 (the s23 evolved contract)
r = await jfetch("POST", "/api/tickets", {
  title: "s32 live probe", description: "cross-route shape probe",
  category: "software", priority: "low", status: "resolved",
}, cookies);
ok("2. create +status (the PATCH shape) → 400", r.status === 400 && /unknown request-body field: status/.test(r.json?.error ?? ""));

// 3. the happy path: bare create → 201 + status:open (the s23 contract carried)
r = await jfetch("POST", "/api/tickets", {
  title: "s32 live fixture ticket", description: "the fixture for the live grammar matrix",
  category: "software", priority: "low",
}, cookies);
const fixtureId = r.json?.ticket?.id;
ok("3. bare create → 201 + status:open", r.status === 201 && r.json?.ticket?.status === "open");
ok("3a. nothing leaked: the bare create's ticket keys carry no banana", fixtureId && !("banana" in (r.json?.ticket ?? {})));

// 4. PATCH +banana → 400
r = await jfetch("PATCH", `/api/tickets/${fixtureId}`, { status: "in_progress", banana: 1 }, cookies);
ok("4. PATCH +banana → 400", r.status === 400 && /unknown request-body field: banana \(allowed: status\)/.test(r.json?.error ?? ""));

// 5. comment +banana → 400
r = await jfetch("POST", `/api/tickets/${fixtureId}/comments`, { content: "probe", banana: 1 }, cookies);
ok("5. comment +banana → 400", r.status === 400 && /unknown request-body field: banana \(allowed: content\)/.test(r.json?.error ?? ""));

// 6. login +banana → 400 (burns a rate slot — budget-safe: 2 of 10 so far)
r = await jfetch("POST", "/api/auth/login", { email: "demo@servicedesk.app", password: "Demo1234!", banana: 1 });
ok("6. login +banana → 400", r.status === 400 && /unknown request-body field: banana \(allowed: email, password\)/.test(r.json?.error ?? ""));

// 7. signup +banana → 400 (its own bucket)
r = await jfetch("POST", "/api/auth/signup", { email: `s32-live-${Date.now()}@example.com`, name: "Probe", password: "Passw0rd123", banana: 1 });
ok("7. signup +banana → 400", r.status === 400 && /unknown request-body field: banana \(allowed: email, name, password\)/.test(r.json?.error ?? ""));

// 8. forgot-password +banana → 400 (its own bucket)
r = await jfetch("POST", "/api/auth/forgot-password", { email: "demo@servicedesk.app", banana: 1 });
ok("8. forgot-password +banana → 400", r.status === 400 && /unknown request-body field: banana \(allowed: email\)/.test(r.json?.error ?? ""));

// 9. the array body still 400s (the value level)
r = await jfetch("POST", "/api/tickets", ["array"], cookies);
ok("9. array body → 400 (the value level owns non-objects)", r.status === 400);

// 10. the happy-path UI shapes still pass: comment + PATCH round-trip
r = await jfetch("POST", `/api/tickets/${fixtureId}/comments`, { content: "s32 live happy-path comment" }, cookies);
ok("10. bare comment → 201", r.status === 201);
r = await jfetch("PATCH", `/api/tickets/${fixtureId}`, { status: "resolved" }, cookies);
ok("11. bare PATCH → 200 + resolved", r.status === 200 && r.json?.ticket?.status === "resolved");

// 12. the envelope convention spot-checks (the P2 axis)
r = await jfetch("GET", "/api/tickets", undefined, null);
ok("12. 401 envelope exactly {error}", r.status === 401 && Object.keys(r.json ?? {}).length === 1 && "error" in r.json);
r = await jfetch("GET", "/api/tickets/nonexistent-s32", undefined, cookies);
ok("13. 404 envelope exactly {error}", r.status === 404 && Object.keys(r.json ?? {}).length === 1 && "error" in r.json);

// 14. HEAD/OPTIONS on the real server (the P3 axis)
const head = await fetch(BASE + "/api/health", { method: "HEAD" });
ok("14. HEAD /api/health → 200 + HSTS + no X-Powered-By",
  head.status === 200 &&
  (head.headers.get("strict-transport-security") ?? "") === "max-age=31536000" &&
  !head.headers.get("x-powered-by"));
const opt = await fetch(BASE + "/api/health", { method: "OPTIONS" });
const allow = opt.headers.get("allow") ?? "";
ok("15. OPTIONS /api/health → 204 + allow: GET, HEAD, OPTIONS",
  opt.status === 204 && /GET, HEAD, OPTIONS/.test(allow) && (await opt.text()) === "");

// --- cleanup: remove the fixture, restore the canonical seed ---
await p.ticket.delete({ where: { id: fixtureId } }).catch(() => {});
await p.user.deleteMany({ where: { email: { startsWith: "s32-live-" } } });
const [u, t, c, a] = await Promise.all([p.user.count(), p.ticket.count(), p.comment.count(), p.attachment.count()]);
ok("16. cleanup — canonical seed restored (4/11/3/0)", u === 4 && t === 11 && c === 3 && a === 0, `got ${u}/${t}/${c}/${a}`);

console.log(`\n${passed} passed, ${failed} failed`);
await p.$disconnect();
process.exit(failed ? 1 : 0);
