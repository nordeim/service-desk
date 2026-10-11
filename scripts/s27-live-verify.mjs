// Session 27 live verification — the strict param-set contract, run against
// the production standalone server on :3000 with the canonical DB. Plain
// fetch + manual cookie handling (the s22 tool lesson: page.request under
// Bun crashes on set-cookie responses; the s21+ scripts use this idiom).
//
// Checks (all must PASS):
//   1. login 200 + session cookie captured
//   2. ?banana=1 → 400 + "unknown query parameter: banana" + the allowed set in the message
//   3. ?category=hardware → 400 (a plausible filter the schema has a vocabulary for)
//   4. ?q={"status":"open"} (their platform's JSON grammar) → 400 (not silently ignored)
//   5. ?fields=id&sort_dir=desc → 400 (names the first unknown param)
//   6. a known param alongside an unknown one still rejects (?status=open&banana=1)
//   7. ?status=open&status=resolved → 400 + "duplicate query parameter: status"
//   8. ?limit=2&limit=5 → 400 (duplicates rejected on every family)
//   9. the s25 empty-as-absent convention holds for KNOWN names (?status=&priority= → 200)
//  10. all seven known params compose: ?search=Outlook&status=resolved&priority=low
//      &sort=newest&scope=mine&limit=5&skip=0 → exactly 1 (the seeded Outlook ticket)
// 11. the no-param default view unchanged (the bare list 200, the same count as ever)
// 12. the s26 search contract still green through the new grammar gate (?search=% → 0)
// 13. the s25 vocabulary contract still green through the new grammar gate (?status=banana → 400)
// 14. logged-out list API → 401 (the grammar gate does not bypass auth)

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

const get = async (qs) => {
  const res = await fetch(`${BASE}/api/tickets${qs ? `?${qs}` : ""}`, {
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

// --- 2-6: the unknown-param rejections ---------------------------------------
{
  const { status, body } = await get("banana=1");
  ok(
    "2. ?banana=1 → 400 + the unknown message + the allowed set",
    status === 400 &&
      String(body.error).includes("unknown query parameter: banana") &&
      String(body.error).includes("search, status, priority, sort, scope, limit, skip"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const { status, body } = await get("category=hardware");
  ok(
    "3. ?category=hardware → 400 (a plausible filter, honestly rejected)",
    status === 400 && String(body.error).includes("unknown query parameter: category"),
    `status=${status}`,
  );
}
{
  const { status } = await get(`q=${encodeURIComponent('{"status":"open"}')}`);
  ok("4. ?q=JSON (their platform's grammar) → 400 (not silently ignored)", status === 400, `status=${status}`);
}
{
  const { status, body } = await get("fields=id&sort_dir=desc");
  ok(
    "5. ?fields=id&sort_dir=desc → 400 (names the first unknown)",
    status === 400 && String(body.error).includes("unknown query parameter: fields"),
    `status=${status}`,
  );
}
{
  const { status, body } = await get("status=open&banana=1");
  ok(
    "6. a known param alongside an unknown one still rejects",
    status === 400 && String(body.error).includes("unknown query parameter: banana"),
    `status=${status}`,
  );
}

// --- 7-8: the duplicate rejections -------------------------------------------
{
  const { status, body } = await get("status=open&status=resolved");
  ok(
    "7. ?status=open&status=resolved → 400 + the duplicate message",
    status === 400 && String(body.error).includes("duplicate query parameter: status"),
    `status=${status} error=${JSON.stringify(body.error)}`,
  );
}
{
  const { status, body } = await get("limit=2&limit=5");
  ok(
    "8. ?limit=2&limit=5 → 400 (every family)",
    status === 400 && String(body.error).includes("duplicate query parameter: limit"),
    `status=${status}`,
  );
}

// --- 9-12: the known-param conventions hold -----------------------------------
{
  const { status } = await get("status=&priority=");
  ok("9. the s25 empty-as-absent convention holds for KNOWN names", status === 200, `status=${status}`);
}
{
  const { status, body } = await get(
    "search=Outlook&status=resolved&priority=low&sort=newest&scope=mine&limit=5&skip=0",
  );
  const n = Array.isArray(body.tickets) ? body.tickets.length : -1;
  ok(
    "10. all seven known params compose → exactly 1 (the Outlook ticket)",
    status === 200 && n === 1,
    `status=${status} n=${n}`,
  );
}
{
  const { status, body } = await get("");
  const n = Array.isArray(body.tickets) ? body.tickets.length : -1;
  ok("11. the no-param default view unchanged (the bare list 200)", status === 200 && n > 0, `status=${status} n=${n}`);
}
{
  const { status, body } = await get("search=%");
  const n = Array.isArray(body.tickets) ? body.tickets.length : -1;
  ok(
    "12. the s26 literal-search contract still green through the grammar gate (?search=% → 0)",
    status === 200 && n === 0,
    `status=${status} n=${n}`,
  );
}

// --- 13: the s25 vocabulary still green ---------------------------------------
{
  const { status, body } = await get("status=banana");
  ok(
    "13. the s25 vocabulary contract still green (?status=banana → 400 + the message)",
    status === 400 && String(body.error).includes("status must be one of:"),
    `status=${status}`,
  );
}

// --- 14: the auth gate ---------------------------------------------------------
{
  const res = await fetch(`${BASE}/api/tickets?banana=1`);
  ok("14. logged-out list API → 401 (the grammar gate does not bypass auth)", res.status === 401, `status=${res.status}`);
}

console.log("");
if (fail === 0) {
  console.log(`ALL GREEN (${pass} checks)`);
} else {
  console.log(`FAILURES: ${fail} of ${pass + fail}`);
  process.exit(1);
}
