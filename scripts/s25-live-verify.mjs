// Session 25 live verification — the list-API filter-vocabulary contract,
// run against the production standalone server on :3000 with the canonical
// DB. Plain fetch + manual cookie handling (the s22 tool lesson: page.request
// under Bun crashes on set-cookie responses; the s21+ scripts use this idiom).
//
// Checks (all must PASS):
//   1. login 200 + session cookie captured
//   2. ?status=resolved returns exactly the resolved rows (every status matches)
//   3. ?priority=urgent returns exactly the urgent rows
//   4. ?status=open&priority=medium composes (both filters apply)
//   5. ?sort=oldest returns createdAt ascending (the oldest seeded ticket first)
//   6. ?scope=all returns the global feed (11 rows, > the demo user's 5)
//   7. ?status=banana → 400 + "status must be one of: open, in_progress, resolved, closed"
//   8. ?priority=banana → 400 + the priority vocabulary message
//   9. ?sort=banana → 400 + the sort vocabulary message
//  10. ?scope=banana → 400 + the scope vocabulary message
//  11. ?status=all → 400 (the UI sentinel is NOT an API value — the UI omits the param)
//  12. empty-string params (?status=&sort=&scope=) → 200, the defaults
//  13. the filters compose with pagination (?status=open&limit=2 → ≤ 2, all open)

const BASE = "http://localhost:3000";

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log(`[PASS] ${name}`);
  } else {
    fail++;
    console.log(`[FAIL] ${name} ${extra}`);
  }
};

const main = async () => {
  // 1. login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  ok("demo login 200", loginRes.status === 200, `(got ${loginRes.status})`);
  const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
  if (!cookie) {
    console.log("[FAIL] no session cookie — aborting");
    process.exit(1);
  }
  const H = { Cookie: cookie };

  const list = async (qs) => {
    const res = await fetch(`${BASE}/api/tickets${qs}`, { headers: H });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, body };
  };

  // 2. status filter honored (every row resolved)
  const resolved = await list("?status=resolved");
  ok(
    "?status=resolved → 200 + every row resolved",
    resolved.status === 200 &&
      Array.isArray(resolved.body?.tickets) &&
      resolved.body.tickets.length >= 1 &&
      resolved.body.tickets.every((t) => t.status === "resolved"),
    `(got ${resolved.status}, ${resolved.body?.tickets?.length ?? "?"} rows)`,
  );

  // 3. priority filter honored (every row urgent)
  const urgent = await list("?priority=urgent");
  ok(
    "?priority=urgent → 200 + every row urgent",
    urgent.status === 200 &&
      Array.isArray(urgent.body?.tickets) &&
      urgent.body.tickets.length >= 1 &&
      urgent.body.tickets.every((t) => t.priority === "urgent"),
    `(got ${urgent.status}, ${urgent.body?.tickets?.length ?? "?"} rows)`,
  );

  // 4. status + priority compose
  const openMedium = await list("?status=open&priority=medium");
  ok(
    "?status=open&priority=medium composes",
    openMedium.status === 200 &&
      Array.isArray(openMedium.body?.tickets) &&
      openMedium.body.tickets.every((t) => t.status === "open" && t.priority === "medium"),
    `(got ${openMedium.status})`,
  );

  // 5. sort=oldest returns createdAt ascending
  const oldest = await list("?sort=oldest");
  const times = (oldest.body?.tickets ?? []).map((t) => Date.parse(t.createdAt));
  const ascending = times.every((v, i) => i === 0 || times[i - 1] <= v);
  ok(
    "?sort=oldest → createdAt ascending",
    oldest.status === 200 && times.length >= 2 && ascending,
    `(got ${oldest.status}, ${times.length} rows)`,
  );

  // 6. scope=all returns the global feed
  const mine = await list("");
  const all = await list("?scope=all");
  ok(
    "?scope=all → the global feed (> the mine-scope rows)",
    all.status === 200 &&
      Array.isArray(all.body?.tickets) &&
      Array.isArray(mine.body?.tickets) &&
      all.body.tickets.length > mine.body.tickets.length,
    `(all ${all.body?.tickets?.length ?? "?"} > mine ${mine.body?.tickets?.length ?? "?"})`,
  );

  // 7-10. the four vocabulary rejects
  const rejects = [
    ["?status=banana", "status must be one of: open, in_progress, resolved, closed"],
    ["?priority=banana", "priority must be one of: low, medium, high, urgent"],
    ["?sort=banana", "sort must be one of: newest, oldest, priority"],
    ["?scope=banana", "scope must be one of: mine, all"],
  ];
  for (const [qs, msg] of rejects) {
    const r = await list(qs);
    ok(
      `${qs} → 400 + the vocabulary message`,
      r.status === 400 && typeof r.body?.error === "string" && r.body.error.includes(msg),
      `(got ${r.status}, ${JSON.stringify(r.body?.error)})`,
    );
  }

  // 11. the UI's "all" sentinel is NOT an API value
  const allSentinel = await list("?status=all");
  ok(
    '?status=all → 400 (the UI sentinel is not an API value)',
    allSentinel.status === 400,
    `(got ${allSentinel.status})`,
  );

  // 12. empty-string params read as absent (the defaults)
  const empty = await list("?status=&priority=&sort=&scope=");
  ok(
    "empty-string params → 200 (the s24 convention)",
    empty.status === 200 && Array.isArray(empty.body?.tickets),
    `(got ${empty.status})`,
  );

  // 13. filters compose with pagination
  const page = await list("?status=open&limit=2");
  ok(
    "?status=open&limit=2 composes (≤ 2 rows, all open)",
    page.status === 200 &&
      Array.isArray(page.body?.tickets) &&
      page.body.tickets.length <= 2 &&
      page.body.tickets.every((t) => t.status === "open"),
    `(got ${page.status}, ${page.body?.tickets?.length ?? "?"} rows)`,
  );

  console.log(
    fail === 0 ? `\nALL GREEN (${pass} checks)` : `\n${fail} FAILED (${pass} passed)`,
  );
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error("script error:", e);
  process.exit(1);
});
