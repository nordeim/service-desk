// Session-33 live verification: the API-namespace JSON 404 catch-all +
// the cookie-attribute set under mutation + the concurrency surface — the
// same contracts the s33 smoke pins hold, verified against the canonical
// seed on the real :3000 database with fixtures cleaned. Self-contained per
// the s30 hardening: the DATABASE_URL pin runs before the dynamic import
// (ESM hoisting would defeat a same-file assignment).
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = process.env.S33_BASE_URL ?? "http://localhost:3000";
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

// --- 1. the catch-all matrix (no auth — the 404-by-path precedes it) ---
const CATCHALL_PATHS = [
  "/api/banana",
  "/api/auth/banana",
  "/api/tickets/xyz/banana",
  "/api/tickets/xyz/comments/banana",
  "/api",
];
for (const path of CATCHALL_PATHS) {
  const res = await fetch(BASE + path);
  const ct = res.headers.get("content-type") ?? "";
  const body = await res.json().catch(() => null);
  ok(
    `catchall GET ${path} → 404 + JSON + {error}`,
    res.status === 404 && ct.includes("application/json") &&
      body !== null && Object.keys(body).join(",") === "error" &&
      body.error === "API route not found",
    `status=${res.status} ct=${ct} body=${JSON.stringify(body)}`,
  );
  const hsts = res.headers.get("strict-transport-security");
  ok(
    `catchall GET ${path} carries HSTS (the s30 universal set)`,
    hsts === "max-age=31536000" && !res.headers.get("x-powered-by"),
    `hsts=${hsts}`,
  );
}

// The method variants on one representative unknown path.
const head = await fetch(BASE + "/api/banana", { method: "HEAD" });
ok(
  "catchall HEAD /api/banana → 404 + HSTS + no body",
  head.status === 404 &&
    head.headers.get("strict-transport-security") === "max-age=31536000",
  `status=${head.status}`,
);
const options = await fetch(BASE + "/api/banana", { method: "OPTIONS" });
const optBody = await options.json().catch(() => null);
ok(
  "catchall OPTIONS /api/banana → 404 + JSON (no allow header)",
  options.status === 404 && (options.headers.get("content-type") ?? "").includes("application/json") &&
    optBody?.error === "API route not found",
  `status=${options.status} allow=${options.headers.get("allow")}`,
);
const post = await fetch(BASE + "/api/banana", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ x: 1 }),
});
ok(
  "catchall POST /api/banana (with body) → 404 + JSON",
  post.status === 404 && (post.headers.get("content-type") ?? "").includes("application/json"),
  `status=${post.status}`,
);

// The non-shadow re-pins: the known routes stay in FRONT of the catch-all.
const health = await fetch(BASE + "/api/health");
ok(
  "shadow: /api/health still 200 + JSON",
  health.status === 200 && (health.headers.get("content-type") ?? "").includes("application/json"),
  `status=${health.status}`,
);
const me = await fetch(BASE + "/api/auth/me");
const meBody = await me.json().catch(() => null);
ok(
  "shadow: unauth /api/auth/me still 401 + {user:null} (the known-route shape)",
  me.status === 401 && meBody && Object.keys(meBody).join(",") === "user" && meBody.user === null,
  `status=${me.status} body=${JSON.stringify(meBody)}`,
);
const trailing = await fetch(BASE + "/api/banana/", { redirect: "manual" });
ok(
  "trailing slash still the framework 308 (unchanged by the catch-all)",
  trailing.status === 308,
  `status=${trailing.status}`,
);

// The PAGES' HTML 404 stays (the s4 human-facing contract — not the API's).
const page404 = await fetch(BASE + "/banana");
const pageCt = page404.headers.get("content-type") ?? "";
ok(
  "pages: /banana still the designed HTML 404 (the JSON boundary is /api/**)",
  page404.status === 404 && pageCt.includes("text/html"),
  `status=${page404.status} ct=${pageCt}`,
);

// --- 2. the cookie-attribute set under mutation (the s30 audit, now pinned) ---
const login = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
});
const loginCookie = (login.headers.getSetCookie?.() ?? [])[0] ?? "";
ok(
  "cookie: login set-cookie attribute set (Path/Max-Age/Secure/HttpOnly/SameSite)",
  /Path=\//.test(loginCookie) && /Max-Age=604800/.test(loginCookie) &&
    /Secure/.test(loginCookie) && /HttpOnly/.test(loginCookie) && /SameSite=lax/i.test(loginCookie),
  loginCookie.slice(0, 80),
);
const cookieHeader = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const signup = await fetch(BASE + "/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "s33-live@servicedesk.app", name: "S33 Live", password: "Live1234!" }),
});
const signupCookie = (signup.headers.getSetCookie?.() ?? [])[0] ?? "";
ok(
  "cookie: signup set-cookie attribute set (identical)",
  signup.status === 201 && /Path=\//.test(signupCookie) && /Max-Age=604800/.test(signupCookie) &&
    /Secure/.test(signupCookie) && /HttpOnly/.test(signupCookie) && /SameSite=lax/i.test(signupCookie),
  `status=${signup.status} ${signupCookie.slice(0, 80)}`,
);
const signupCookieHeader = (signup.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const logout = await fetch(BASE + "/api/auth/logout", {
  method: "POST",
  headers: { cookie: signupCookieHeader },
});
const logoutCookie = (logout.headers.getSetCookie?.() ?? [])[0] ?? "";
ok(
  "cookie: logout clear-cookie attribute set (Max-Age=0 + the same tails)",
  logout.status === 200 && /Path=\//.test(logoutCookie) && /Max-Age=0/.test(logoutCookie) &&
    /Secure/.test(logoutCookie) && /HttpOnly/.test(logoutCookie) && /SameSite=lax/i.test(logoutCookie),
  `status=${logout.status} ${logoutCookie.slice(0, 80)}`,
);

// --- 3. the concurrency surface on the real DB (fixtures cleaned below) ---
const create = await fetch(BASE + "/api/tickets", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: cookieHeader },
  body: JSON.stringify({
    title: "s33 live concurrency probe",
    description: "parallel mutation probe — cleaned after",
    category: "software",
    priority: "low",
  }),
});
const ticket = (await create.json()).ticket;
ok("concurrency: fixture ticket created", create.status === 201 && !!ticket?.id, `status=${create.status}`);

// s39 hardening: if the fixture create failed (the exhausted-bucket shape),
// report the dependent checks as failed and skip to cleanup — reading
// `.ticket.comments` on the error body crashed the script mid-run for 38
// sessions (the un-run cleanup then left the failure without a verdict).
if (!ticket?.id) {
  ok(
    "concurrency: the fixture-dependent checks skipped (fixture missing)",
    false,
    "the create failed — see the fixture check above"
  );
} else {
const before = await fetch(BASE + `/api/tickets/${ticket.id}`, { headers: { cookie: cookieHeader } });
const beforeCount = (await before.json()).ticket.comments.length;

const commentResults = await Promise.all(
  Array.from({ length: 5 }, () =>
    fetch(BASE + `/api/tickets/${ticket.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ content: "s33 live concurrent comment" }),
    }).then((r) => r.status),
  ),
);
const after = await fetch(BASE + `/api/tickets/${ticket.id}`, { headers: { cookie: cookieHeader } });
const afterCount = (await after.json()).ticket.comments.length;
ok(
  "concurrency: 5 parallel comments all 201 + coherent final state",
  commentResults.every((s) => s === 201) && afterCount === beforeCount + 5,
  `results=${JSON.stringify(commentResults)} ${beforeCount}→${afterCount}`,
);

const patchResults = await Promise.all(
  Array.from({ length: 5 }, (_, i) =>
    fetch(BASE + `/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ status: i % 2 === 0 ? "in_progress" : "resolved" }),
    }).then((r) => r.status),
  ),
);
ok(
  "concurrency: 5 parallel PATCHes all 200 (no SQLITE_BUSY)",
  patchResults.every((s) => s === 200),
  `results=${JSON.stringify(patchResults)}`,
);
}

// --- cleanup: fixtures removed, seed canonical ---
// s39 hardening: the fixture create can FAIL (an exhausted login bucket 429s
// the auth, the create answers 401, ticket is undefined) — an unguarded
// cleanup then deletes with an all-undefined where, which Prisma treats as
// NO FILTER (deleteMany wipes the whole table; the cascade wipes comments —
// the s39 mid-run corruption, measured live). Guard: skip the fixture
// deletes when the fixture never existed; the seed-canonical check below
// still fails loudly so the run never passes on a broken fixture path.
if (ticket?.id) {
  await p.comment.deleteMany({ where: { ticketId: ticket.id } });
  await p.ticket.delete({ where: { id: ticket.id } });
}
await p.user.delete({ where: { email: "s33-live@servicedesk.app" } });
const [tu, tt, tc, ta] = await Promise.all([
  p.user.count(),
  p.ticket.count(),
  p.comment.count(),
  p.attachment.count(),
]);
ok(
  "cleanup: fixtures removed, seed canonical (4/11/3/0)",
  tu === 4 && tt === 11 && tc === 3 && ta === 0,
  `users=${tu} tickets=${tt} comments=${tc} attachments=${ta}`,
);
await p.$disconnect();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
