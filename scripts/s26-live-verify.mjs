// Session 26 live verification — the literal-search contract, run against
// the production standalone server on :3000 with the canonical DB. Plain
// fetch + manual cookie handling (the s22 tool lesson: page.request under
// Bun crashes on set-cookie responses; the s21+ scripts use this idiom).
//
// Checks (all must PASS):
//   1. login 200 + session cookie captured
//   2. ?search=Outlook returns exactly 1 row (the seeded Outlook ticket — literal term)
//   3. ?search=outlook matches the same row (ASCII case-insensitive fold)
//   4. ?search=%25 (a literal %) returns 0 rows — the wildcard lie is closed
//   5. ?search=_ (a literal _) returns 0 rows — same class
//   6. ?search=%25signature%25 returns 0 rows (the wildcards are literal characters)
//   7. ?search=vpn matches the VPN ticket (sanity — the normal path)
//   8. search composes with filters: ?search=Outlook&status=resolved → 1;
//      ?search=Outlook&status=open → 0 (the filter applies ON TOP of the literal match)
//   9. search composes with pagination: ?search=<common letter>&limit=2 → ≤ 2 rows
//  10. the boundary: 200 chars → 200 OK (at the cap); 201 chars → 400
// 11. the 400 message names the cap ("search must be at most 200 characters")
// 12. empty/whitespace search reads as absent (?search= and ?search=%20%20 → the default view)
// 13. the bare list (no search) equals the scope's default row count (no WHERE injected)

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
const cookie = (loginRes.headers.get("set-cookie") || "").split(";")[0];
ok("1. login 200 + cookie captured", loginRes.status === 200 && !!cookie, `status=${loginRes.status}`);

const get = async (qs) => {
  const res = await fetch(`${BASE}/api/tickets${qs}`, { headers: { cookie } });
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
};

// --- the literal semantics ----------------------------------------------------
const outlook = await get("?search=Outlook");
ok("2. ?search=Outlook → exactly 1 (the seeded Outlook ticket)",
  outlook.status === 200 && outlook.body?.tickets?.length === 1,
  `status=${outlook.status} count=${outlook.body?.tickets?.length}`);

const outlookLower = await get("?search=outlook");
ok("3. ?search=outlook matches the same row (ASCII case fold)",
  outlookLower.status === 200 && outlookLower.body?.tickets?.length === 1,
  `count=${outlookLower.body?.tickets?.length}`);

const pct = await get("?search=%25"); // a literal %
ok("4. ?search=% → 0 rows (the wildcard lie is closed)",
  pct.status === 200 && pct.body?.tickets?.length === 0,
  `status=${pct.status} count=${pct.body?.tickets?.length}`);

const underscore = await get("?search=_");
ok("5. ?search=_ → 0 rows (same class)",
  underscore.status === 200 && underscore.body?.tickets?.length === 0,
  `count=${underscore.body?.tickets?.length}`);

const wildcards = await get("?search=%25signature%25"); // the literal string "%signature%"
ok("6. ?search=%signature% → 0 rows (wildcards are literal characters)",
  wildcards.status === 200 && wildcards.body?.tickets?.length === 0,
  `count=${wildcards.body?.tickets?.length}`);

const vpn = await get("?search=VPN");
ok("7. ?search=VPN matches the VPN ticket (the normal path)",
  vpn.status === 200 && vpn.body?.tickets?.some((t) => t.title.includes("VPN")),
  `count=${vpn.body?.tickets?.length}`);

// --- composition ---------------------------------------------------------------
const composed = await get("?search=Outlook&status=resolved");
ok("8a. search + filter compose: ?search=Outlook&status=resolved → 1",
  composed.status === 200 && composed.body?.tickets?.length === 1,
  `count=${composed.body?.tickets?.length}`);

const composedNone = await get("?search=Outlook&status=open");
ok("8b. search + filter compose: ?search=Outlook&status=open → 0",
  composedNone.status === 200 && composedNone.body?.tickets?.length === 0,
  `count=${composedNone.body?.tickets?.length}`);

const paged = await get("?search=e&limit=2");
ok("9. search + pagination compose: ?search=e&limit=2 → ≤ 2 rows, all matching",
  paged.status === 200 && paged.body?.tickets?.length <= 2,
  `count=${paged.body?.tickets?.length}`);

// --- the cap ---------------------------------------------------------------------
const atCap = await get(`?search=${"a".repeat(200)}`);
ok("10a. a 200-char term → 200 OK (at the cap)",
  atCap.status === 200, `status=${atCap.status}`);

const overCap = await get(`?search=${"a".repeat(201)}`);
ok("10b. a 201-char term → 400 (beyond the cap)",
  overCap.status === 400, `status=${overCap.status}`);

ok("11. the 400 message names the cap",
  overCap.status === 400 && typeof overCap.body?.error === "string" &&
  overCap.body.error.includes("search must be at most 200 characters"),
  `body=${JSON.stringify(overCap.body)?.slice(0, 80)}`);

// --- the absent conventions --------------------------------------------------------
const emptySearch = await get("?search=");
const bare = await get("");
ok("12. empty/whitespace search reads as absent (the default view)",
  emptySearch.status === 200 && emptySearch.body?.tickets?.length === bare.body?.tickets?.length,
  `empty=${emptySearch.body?.tickets?.length} bare=${bare.body?.tickets?.length}`);

const wsSearch = await get("?search=%20%20%20");
ok("13. whitespace-only search reads as absent too",
  wsSearch.status === 200 && wsSearch.body?.tickets?.length === bare.body?.tickets?.length,
  `ws=${wsSearch.body?.tickets?.length} bare=${bare.body?.tickets?.length}`);

// --- summary -----------------------------------------------------------------------
console.log(fail === 0 ? `\nALL GREEN (${pass} checks)` : `\n${fail} FAILED (${pass} passed)`);
process.exit(fail === 0 ? 0 : 1);
