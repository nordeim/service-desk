// Session 21 live re-verification — runs against the production standalone
// on :3000. Mirrors the s19/s20 script pattern: this session's fresh-axis
// surfaces (the HTTP security-header superset + the login-error response
// envelope), plus the standing regression spot-checks. The 429 rate-limiter
// surface is pinned by scripts/smoke-test.sh on its throwaway server (the
// budget doctrine — burning 11 real attempts here would throttle the live
// server for every later fixture).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const results = [];
const ok = (name, pass) => results.push([name, pass ? "PASS" : "FAIL"]);

const browser = await chromium.launch();

// --- 1. The HTTP security-header superset (F4, the s21 fresh axis) ---------
{
  const page = await browser.newPage();
  const res = await page.request.get(`${BASE}/login`);
  const h = (name) => res.headers()[name] ?? "";
  ok("login 200", res.status() === 200);
  ok("X-Frame-Options: DENY", h("x-frame-options") === "DENY");
  ok("X-Content-Type-Options: nosniff", h("x-content-type-options") === "nosniff");
  ok("Referrer-Policy present", h("referrer-policy") === "strict-origin-when-cross-origin");
  ok(
    "Permissions-Policy locks camera/mic/geo",
    /camera=\(\)/.test(h("permissions-policy")) &&
      /microphone=\(\)/.test(h("permissions-policy")) &&
      /geolocation=\(\)/.test(h("permissions-policy")),
  );
  await page.context().close();
}

// --- 2. The login-error response envelope (F2 — ours 401 + {error}, the
// reference's 400 + FastAPI envelope; the UI-visible message identical) ----
{
  const page = await browser.newPage();
  const res = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: "nobody@servicedesk.app", password: "wrong" },
  });
  const body = await res.json();
  ok("wrong password returns 401 (not the reference's 400)", res.status() === 401);
  ok("error envelope is {error: string}", typeof body.error === "string" && body.error === "Invalid email or password");
  await page.context().close();
}

// --- 3. The standing regression spot-checks on the live server ------------
{
  const page = await browser.newPage();
  // The s19 deep-link bounce shape (the proxy decorates the cookie-less hit).
  await page.goto(`${BASE}/mytickets`);
  await page.waitForURL(/\/login\?from_url=/, { timeout: 10000 });
  ok(
    "bounce carries from_url (s19 regression)",
    decodeURIComponent(page.url().split("from_url=")[1] ?? "") === `${BASE}/mytickets`,
  );
  // The s10 view machine reachable from the bounced state.
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByRole("heading", { name: "Reset your password" }).waitFor({ timeout: 5000 });
  ok("reset view swaps in place (s10 regression)", true);
  await page.context().close();
}

await browser.close();

let failed = 0;
for (const [name, status] of results) {
  console.log(`[${status}] ${name}`);
  if (status === "FAIL") failed++;
}
console.log(failed === 0 ? "ALL GREEN" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
