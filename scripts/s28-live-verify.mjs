// Session 28 live verification — the stats empty-grammar contract, run against
// the production standalone server on :3000 with the canonical DB. Plain
// fetch + manual cookie handling (the s22 tool lesson: page.request under
// Bun crashes on set-cookie responses; the s21+ scripts use this idiom).
//
// Checks (all must PASS):
//   1. login 200 + session cookie captured
//   2. GET /api/stats?banana=1 → 400 + "unknown query parameter: banana" + "this endpoint takes no query parameters"
//   3. GET /api/stats?scope=mine → 400 (the cross-route pin: a REAL sibling-route name)
//   4. GET /api/stats?status=open&limit=5 → 400 (names the FIRST unknown param — status)
//   5. GET /api/stats?status= → 400 (the grammar precedes the value: an empty value is still an unknown NAME)
//   6. GET /api/stats?banana=1&banana=2 → 400 (the unknown message subsumes duplicates on an empty grammar)
//   7. the no-param aggregate intact: GET /api/stats → 200 + mine + global + avgResolutionMs
//   8. the aggregate is the canonical shape: mine.total = 5 (the demo user's seeded set) + global.total = 11
//   9. the sidebar contract: the mount fetch shape (mine counts sum to mine.total)
// 10. logged-out stats → 401 (the grammar gate does not bypass auth)
// 11. the s27 grammar gate still green next door (?banana=1 on /api/tickets → 400 + the allowed set)
// 12. the tickets list default view unchanged (the bare 200)

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

// --- login -------------------------------------------------------------------
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
});
const setCookie = loginRes.headers.get("set-cookie") ?? "";
const cookie = setCookie.split(";")[0];
ok("1. login 200 + cookie captured", loginRes.status === 200 && cookie.startsWith("servicedesk_session="));

const stats = async (qs) => {
  const res = await fetch(`${BASE}/api/stats${qs ? `?${qs}` : ""}`, {
    headers: { Cookie: cookie },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { status: res.status, body };
};

// --- 2-6: the empty-grammar rejections ----------------------------------------
{
  const { status, body } = await stats("banana=1");
  ok(
    "2. ?banana=1 → 400 + unknown + no-params messages",
    status === 400 &&
      typeof body.error === "string" &&
      body.error.includes("unknown query parameter: banana") &&
      body.error.includes("this endpoint takes no query parameters"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const { status, body } = await stats("scope=mine");
  ok(
    "3. ?scope=mine → 400 (the cross-route pin)",
    status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: scope"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const { status, body } = await stats("status=open&limit=5");
  ok(
    "4. ?status=open&limit=5 → 400 naming status (the first unknown)",
    status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: status"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const { status, body } = await stats("status=");
  ok(
    "5. ?status= (empty value) → 400 (the grammar precedes the value)",
    status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: status"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const { status, body } = await stats("banana=1&banana=2");
  ok(
    "6. ?banana=1&banana=2 → 400 (unknown subsumes the duplicate)",
    status === 400 && typeof body.error === "string" && body.error.includes("unknown query parameter: banana"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}

// --- 7-9: the aggregate intact -------------------------------------------------
{
  const { status, body } = await stats("");
  ok(
    "7. the no-param aggregate: 200 + mine + global + avgResolutionMs",
    status === 200 && body && typeof body === "object" &&
      "mine" in body && "global" in body && "avgResolutionMs" in body,
    `status=${status} body=${JSON.stringify(body).slice(0, 80)}`,
  );
  ok(
    "8. the canonical counts: mine.total = 5 + global.total = 11",
    body?.mine?.total === 5 && body?.global?.total === 11,
    `mine.total=${body?.mine?.total} global.total=${body?.global?.total}`,
  );
  const m = body?.mine ?? {};
  ok(
    "9. the mine counts sum to mine.total (the sidebar contract shape)",
    m.open + m.in_progress + m.resolved + m.closed === m.total,
    `mine=${JSON.stringify(m)}`,
  );
}

// --- 10-12: the standing contracts around the new gate -------------------------
{
  const res = await fetch(`${BASE}/api/stats`);
  ok("10. logged-out stats → 401", res.status === 401, `status=${res.status}`);
}
{
  const res = await fetch(`${BASE}/api/tickets?banana=1`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "11. the s27 grammar gate next door: /api/tickets?banana=1 → 400 + the allowed set",
    res.status === 400 &&
      typeof body.error === "string" &&
      body.error.includes("search, status, priority, sort, scope, limit, skip"),
    `status=${res.status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const res = await fetch(`${BASE}/api/tickets`, { headers: { Cookie: cookie } });
  const body = await res.json().catch(() => ({}));
  ok(
    "12. the tickets default view unchanged (the bare 200 + the array)",
    res.status === 200 && Array.isArray(body.tickets),
    `status=${res.status}`,
  );
}

console.log(`\n${pass} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
