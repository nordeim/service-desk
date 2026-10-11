// Session 24 live verification — the list-API pagination contract, run
// against the production standalone server on :3000 with the canonical DB.
// Plain fetch + manual cookie handling (the s22 tool lesson: page.request
// under Bun crashes on set-cookie responses; the s21+ scripts use this idiom).
//
// Checks (all must PASS):
//   1. login 200 + session cookie captured
//   2. ?limit=2 returns exactly 2 tickets (the reference's param name)
//   3. ?limit=2&skip=2 returns exactly 2, disjoint from page 1 (skip advances)
//   4. ?limit=1&skip=1 returns exactly 1, != the first ticket (a second page)
//   5. ?limit=0 → 400 + "limit must be an integer between 1 and 500"
//   6. ?limit=501 → 400 (the 500 ceiling)
//   7. ?limit=abc → 400 (strict validation — their platform ignores garbage)
//   8. ?skip=-1 → 400 + "skip must be a non-negative integer"
//   9. bare /api/tickets still ≤ 200 rows (the default ceiling unchanged)
//  10. the default response equals ?limit=200&skip=0 (byte-identical ids)

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

  // 2. limit=2 honored
  const p1 = await list("?limit=2");
  ok("?limit=2 → 200", p1.status === 200, `(got ${p1.status})`);
  ok("?limit=2 returns exactly 2 tickets", p1.body?.tickets?.length === 2,
    `(got ${p1.body?.tickets?.length})`);

  // 3. skip pages disjointly
  const p2 = await list("?limit=2&skip=2");
  ok("?limit=2&skip=2 → 200 + exactly 2", p2.status === 200 && p2.body?.tickets?.length === 2,
    `(got ${p2.status} / ${p2.body?.tickets?.length})`);
  const ids1 = new Set((p1.body?.tickets ?? []).map((t) => t.id));
  const overlap = (p2.body?.tickets ?? []).filter((t) => ids1.has(t.id));
  ok("skip=2 pages disjointly (no overlap with page 1)", overlap.length === 0,
    `(overlap: ${overlap.map((t) => t.id).join(",")})`);

  // 4. limit=1&skip=1 — the minimal second page
  const single2 = await list("?limit=1&skip=1");
  ok("?limit=1&skip=1 → 1 ticket, different from the first",
    single2.status === 200 &&
    single2.body?.tickets?.length === 1 &&
    single2.body.tickets[0].id !== p1.body?.tickets?.[0]?.id);

  // 5-8. the rejects
  const r0 = await list("?limit=0");
  ok("?limit=0 → 400 + range message",
    r0.status === 400 && /limit must be an integer between 1 and 500/.test(r0.body?.error ?? ""),
    `(got ${r0.status} / ${r0.body?.error})`);
  const rMax = await list("?limit=501");
  ok("?limit=501 → 400 (the 500 ceiling)",
    rMax.status === 400, `(got ${rMax.status})`);
  const rAbc = await list("?limit=abc");
  ok("?limit=abc → 400 (strict validation)",
    rAbc.status === 400, `(got ${rAbc.status})`);
  const rSkip = await list("?skip=-1");
  ok("?skip=-1 → 400 + skip message",
    rSkip.status === 400 && /skip must be a non-negative integer/.test(rSkip.body?.error ?? ""),
    `(got ${rSkip.status} / ${rSkip.body?.error})`);

  // 9-10. the default path unchanged
  const def = await list("");
  ok("bare /api/tickets → 200", def.status === 200, `(got ${def.status})`);
  ok("default ceiling ≤ 200 rows", (def.body?.tickets?.length ?? 999) <= 200,
    `(got ${def.body?.tickets?.length})`);
  const exp = await list("?limit=200&skip=0");
  const sameIds = JSON.stringify((def.body?.tickets ?? []).map((t) => t.id)) ===
    JSON.stringify((exp.body?.tickets ?? []).map((t) => t.id));
  ok("default == ?limit=200&skip=0 (byte-identical id order)", sameIds);

  console.log(fail === 0 ? "ALL GREEN" : `${fail} FAILURES`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error("[FAIL] script error:", e.message);
  process.exit(1);
});
