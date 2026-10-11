// Session 23 live re-verification — runs against the production standalone
// on :3000. Mirrors the s22 script pattern (plain fetch + manual cookies —
// the page.request set-cookie crash under Bun, the s22 tool lesson): this
// session's fresh-axis surface is the CREATE-PATH + attachment-write guards
// (the server-controlled status, the attachment count/size/filename/MIME
// caps), plus the standing regression spot-checks. The full matrix is also
// pinned by scripts/smoke-test.sh on its throwaway server (the budget
// doctrine — this script keeps the live-server logins minimal: one login).
//
// The reference's measured contrast (s23): their create stores a "banana"
// status (rendered as a fallback badge in their UI), their upload caps
// nothing (15 MiB accepted, 10 attachment URLs per ticket), and their MIME
// blocking is a partial extension list. Ours is the validated superset —
// this script verifies it on the LIVE server.
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

// --- 1. The create-path matrix (F1 — ours ignores the client-sent status
// and validates the vocabulary; the reference stores the "banana") ---------
{
  const login = await withCookie("", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  ok("demo login 200", login.status === 200);
  const cookie = cookieFrom(login);

  // A client-sent status must be IGNORED — the created row comes back "open".
  const created = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      title: "s23 live-verify create-path probe",
      description:
        "Throwaway ticket for the live create-path matrix. Resolved and left in the demo user's list.",
      category: "software",
      priority: "low",
      status: "banana",
    }),
  });
  ok("banana-status create 201", created.status === 201);
  const { ticket } = await created.json();
  ok("created status is open (server-controlled)", ticket.status === "open");
  const ticketId = ticket.id;

  // The owner-side teardown: resolve the probe so it does not pollute the
  // open-ticket stats surface (the s22 convention — probes stay, closed).
  await withCookie(cookie, `/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "resolved" }),
  });

  // The empty-title create (the reference stores it, 200 — s23 measurement).
  const emptyTitle = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      title: "",
      description: "The empty title must be rejected.",
      category: "software",
      priority: "low",
    }),
  });
  ok("empty-title create 400", emptyTitle.status === 400);

  // The out-of-vocabulary category (the reference stores "spacecraft").
  const badCategory = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      title: "s23 live-verify probe",
      description: "The bogus category must be rejected.",
      category: "spacecraft",
      priority: "low",
    }),
  });
  ok("out-of-vocabulary category 400", badCategory.status === 400);
}

// --- 2. The attachment-write matrix (F2 — ours caps 3 x 2 MiB with a closed
// MIME allowlist; the reference caps nothing) --------------------------------
{
  const login = await withCookie("", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "demo@servicedesk.app", password: "Demo1234!" }),
  });
  const cookie = cookieFrom(login);

  const base = {
    title: "s23 live-verify attachment probe",
    description: "The attachment guard matrix. Rejected creates store nothing.",
    category: "software",
    priority: "low",
  };

  const fourFiles = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      ...base,
      attachments: Array.from({ length: 4 }, (_, i) => ({
        fileName: `f${i}.txt`,
        mimeType: "text/plain",
        sizeBytes: 10,
        data: "",
      })),
    }),
  });
  ok("4 attachments 400", fourFiles.status === 400);
  const fourBody = await fourFiles.json();
  ok("count-cap message: At most 3 files", fourBody.error === "At most 3 files can be attached");

  const oversized = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      ...base,
      attachments: [{ fileName: "big.bin", mimeType: "text/plain", sizeBytes: 2 * 1024 * 1024 + 1, data: "" }],
    }),
  });
  ok("2MiB+1 attachment 400", oversized.status === 400);

  const traversal = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      ...base,
      attachments: [{ fileName: "../evil.txt", mimeType: "text/plain", sizeBytes: 10, data: "" }],
    }),
  });
  ok("path-traversal filename 400", traversal.status === 400);

  const badMime = await withCookie(cookie, "/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      ...base,
      attachments: [{ fileName: "evil.exe", mimeType: "application/x-msdownload", sizeBytes: 10, data: "" }],
    }),
  });
  ok("unsupported mimeType 400 (the s23 guard)", badMime.status === 400);
  const mimeBody = await badMime.json();
  ok(
    "MIME message: unsupported file type",
    mimeBody.error === '"evil.exe" has an unsupported file type',
  );
}

// --- 3. The standing regressions (the s19/s10 spot-checks) -------------------
{
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
