// Session 22 live re-verification — runs against the production standalone
// on :3000. Mirrors the s21 script pattern: this session's fresh-axis
// surfaces (the write-path guards — the ownership scoping + the comment
// validation), plus the standing regression spot-checks. The full 429 +
// write-path matrix is pinned by scripts/smoke-test.sh on its throwaway
// server (the budget doctrine — this script keeps the live-server logins
// minimal: one demo login, one signup).
//
// NOTE: uses plain fetch with manual cookie handling (not page.request —
// the page-bound APIRequestContext's set-cookie parsing crashes under Bun
// on successful logins; the s21 script never hit it because its login probe
// is a wrong-password 401, which sets no cookie).
const BASE = "http://localhost:3000";
const results = [];
const ok = (name, pass) => results.push([name, pass ? "PASS" : "FAIL"]);

function cookieFrom(res) {
  const raw = res.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : "";
}

async function withCookie(cookie, path, init = {}) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers ?? {}),
    },
    redirect: "manual",
  });
}

// --- 1. The ownership matrix (F2 — ours 403 on non-owner writes, 200 on
// the shareable reads; the reference's PUT applies any user's mutation) ---
{
  // Owner session (demo) creates a ticket.
  const login = await withCookie("", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  ok("demo login 200", login.status === 200);
  const ownerCookie = cookieFrom(login);

  const created = await withCookie(ownerCookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      title: "s22 live-verify ownership probe",
      description:
        "Throwaway ticket for the live permissions matrix. Resolved and left in the demo user's list.",
      category: "software",
      priority: "low",
    }),
  });
  ok("create probe ticket 201", created.status === 201);
  const { ticket } = await created.json();
  const ticketId = ticket.id;

  // Non-owner session (a fresh signup — zero login-budget cost).
  const suffix = Date.now();
  const signup = await withCookie("", "/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: `s22-probe-${suffix}@servicedesk.app`,
      name: "S22 Probe",
      password: "Probe1234",
    }),
  });
  ok("signup (user B) 201", signup.status === 201);
  const userBCookie = cookieFrom(signup);

  // The shareable-URL read: user B can VIEW...
  const read = await withCookie(userBCookie, `/api/tickets/${ticketId}`);
  ok("non-owner read 200 (shareable URLs)", read.status === 200);

  // ...but cannot MUTATE.
  const mutate = await withCookie(userBCookie, `/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "resolved" }),
  });
  ok("non-owner PATCH 403", mutate.status === 403);
  const mutateBody = await mutate.json();
  ok("403 message: Only the ticket owner", mutateBody.error === "Only the ticket owner can update it");

  // The owner still can.
  const ownerPatch = await withCookie(ownerCookie, `/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "resolved" }),
  });
  ok("owner PATCH 200", ownerPatch.status === 200);
}

// --- 2. The comment-validation matrix (F1 — ours rejects what the
// reference's API stores: empty, whitespace, overlong, bogus ticket) ------
{
  const login = await withCookie("", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  const cookie = cookieFrom(login);

  const empty = await withCookie(cookie, "/api/tickets/some-id/comments", {
    method: "POST",
    body: JSON.stringify({ content: "" }),
  });
  ok("empty comment 400", empty.status === 400);

  const ws = await withCookie(cookie, "/api/tickets/some-id/comments", {
    method: "POST",
    body: JSON.stringify({ content: "   " }),
  });
  ok("whitespace comment 400", ws.status === 400);

  const overlong = await withCookie(cookie, "/api/tickets/some-id/comments", {
    method: "POST",
    body: JSON.stringify({ content: "x".repeat(5001) }),
  });
  ok("overlong comment 400", overlong.status === 400);

  const bogus = await withCookie(cookie, "/api/tickets/nonexistent-id/comments", {
    method: "POST",
    body: JSON.stringify({ content: "probe" }),
  });
  ok("bogus-ticket comment 404", bogus.status === 404);
  const bogusBody = await bogus.json();
  ok("404 message: Ticket not found", bogusBody.error === "Ticket not found");
}

// --- 3. The standing regressions (the s19/s10 spot-checks) -----------------
{
  // Unauthenticated /dashboard must bounce to /login?from_url=... (307 + Location).
  const res = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  ok("unauth /dashboard 307-bounces with from_url", res.status === 307 && location.includes("/login?from_url="));
}

let allGreen = true;
for (const [name, status] of results) {
  console.log(`[${status}] ${name}`);
  if (status === "FAIL") allGreen = false;
}
console.log(allGreen ? "ALL GREEN" : "FAILURES PRESENT");
process.exit(allGreen ? 0 : 1);
