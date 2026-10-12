// Session 31 — live schema matrix re-verification (the six pins, asserted
// live on the production standalone server — the smoke layer already passed
// on the throwaway server; this is the same contract on the real :3000 DB).
process.env.DATABASE_URL = "file:../db/custom.db";

const BASE = "http://localhost:3000";
let cookie = "";
let pass = 0, failN = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`[PASS] ${name}`); }
  else { failN++; console.log(`[FAIL] ${name} ${detail}`); }
};

async function main() {
  // login (demo) — grabs the session cookie
  const lr = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  const sc = lr.headers.getSetCookie?.()[0] || lr.headers.get("set-cookie") || "";
  cookie = sc.split(";")[0];
  const lj = await lr.json();
  check("1. login user keys exactly {email,id,name}", JSON.stringify(Object.keys(lj.user).sort()) === JSON.stringify(["email","id","name"]));

  const me = await (await fetch(`${BASE}/api/auth/me`, { headers: { cookie } })).json();
  check("2. me user keys exactly {email,id,name}", JSON.stringify(Object.keys(me.user).sort()) === JSON.stringify(["email","id","name"]));
  check("3. me user values all strings", Object.values(me.user).every((v) => typeof v === "string"));

  const list = await (await fetch(`${BASE}/api/tickets?limit=1`, { headers: { cookie } })).json();
  const t = list.tickets[0];
  const expectedRow = ["_count","category","createdAt","createdBy","createdById","description","id","priority","status","title","updatedAt"];
  check("4. list row keys = the bounded eleven-key set", JSON.stringify(Object.keys(t).sort()) === JSON.stringify(expectedRow), JSON.stringify(Object.keys(t).sort()));
  check("5. list row createdBy keys {email,id,name}", JSON.stringify(Object.keys(t.createdBy).sort()) === JSON.stringify(["email","id","name"]));
  check("6. list row _count keys {comments}", JSON.stringify(Object.keys(t._count).sort()) === JSON.stringify(["comments"]));

  // create WITH an attachment → detail → the attachment key set
  const cr = await fetch(`${BASE}/api/tickets`, {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "s31 live schema matrix ticket", description: "carries one attachment for the live matrix",
      category: "software", priority: "low",
      // s35 fixture honesty: "schema pin" decodes to 10 bytes (was 11).
      attachments: [{ fileName: "pin.txt", mimeType: "text/plain", sizeBytes: 10, data: "c2NoZW1hIHBpbg==" }],
    }),
  });
  const cj = await cr.json();
  const tid = cj.ticket?.id;
  check("7. create-with-attachment 201", cr.status === 201);
  const dj = await (await fetch(`${BASE}/api/tickets/${tid}`, { headers: { cookie } })).json();
  const a = dj.ticket.attachments[0];
  check("8. detail attachment keys exactly {createdAt,fileName,id,mimeType,sizeBytes}",
    JSON.stringify(Object.keys(a).sort()) === JSON.stringify(["createdAt","fileName","id","mimeType","sizeBytes"]), JSON.stringify(Object.keys(a).sort()));
  check("9. no data blob in the detail response", !("data" in a) && !JSON.stringify(dj).includes("c2NoZW1hIHBpbg=="));

  const cm = await fetch(`${BASE}/api/tickets/${tid}/comments`, {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ content: "s31 live matrix comment" }),
  });
  const cmj = await cm.json();
  check("10. comment keys + author keys exact",
    JSON.stringify(Object.keys(cmj.comment).sort()) === JSON.stringify(["author","authorId","content","createdAt","id","ticketId"]) &&
    JSON.stringify(Object.keys(cmj.comment.author).sort()) === JSON.stringify(["email","id","name"]));

  const st = await (await fetch(`${BASE}/api/stats`, { headers: { cookie } })).json();
  const five = ["closed","in_progress","open","resolved","total"];
  check("11. stats top keys {avgResolutionMs,global,mine}", JSON.stringify(Object.keys(st).sort()) === JSON.stringify(["avgResolutionMs","global","mine"]));
  check("12. stats mine + global exactly the five-status vocabulary",
    JSON.stringify(Object.keys(st.mine).sort()) === JSON.stringify(five) && JSON.stringify(Object.keys(st.global).sort()) === JSON.stringify(five));
  check("13. stats values int + avgResolutionMs number-or-null",
    Object.values(st.mine).every((v) => Number.isInteger(v)) && Object.values(st.global).every((v) => Number.isInteger(v)) &&
    (st.avgResolutionMs === null || typeof st.avgResolutionMs === "number"));

  // cleanup: remove the fixture ticket (comments cascade)
  const { PrismaClient } = await import("@prisma/client");
  const p = new PrismaClient();
  await p.ticket.deleteMany({ where: { title: { startsWith: "s31 live schema matrix" } } });
  const [u, tk, c, at] = await Promise.all([p.user.count(), p.ticket.count(), p.comment.count(), p.attachment.count()]);
  check("14. cleanup — canonical seed restored (4/11/3/0)", u === 4 && tk === 11 && c === 3 && at === 0, JSON.stringify({ u, tk, c, at }));
  await p.$disconnect();

  console.log(`\n${pass} passed, ${failN} failed`);
  process.exit(failN ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
