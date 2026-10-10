// Session 20 live re-verification — runs against the production standalone
// on :3000. Mirrors scripts/s19-live-verify.mjs: the deep-link chains, the
// guard behaviors, and the mobile matrix, plus this session's compound
// detour chain (F3) on the live server.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const results = [];
const ok = (name, pass) => results.push([name, pass ? "PASS" : "FAIL"]);

const browser = await chromium.launch();

// --- 1. The F3 detour chain on the live server (the E2E pin's path) -------
{
  const page = await browser.newPage();
  await page.goto(`${BASE}/ticketdetails?id=livetest-s20`);
  await page.waitForURL(/\/login\?from_url=/, { timeout: 10000 });
  const loginUrl = page.url();
  ok("bounce carries from_url", decodeURIComponent(loginUrl.split("from_url=")[1] ?? "") === `${BASE}/ticketdetails?id=livetest-s20`);

  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByRole("heading", { name: "Reset your password" }).waitFor({ timeout: 5000 });
  ok("reset view keeps the URL (view machine)", page.url() === loginUrl);

  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await page.getByRole("heading", { name: "Check your email" }).waitFor({ timeout: 5000 });
  ok("reset-success view keeps the URL", page.url() === loginUrl);

  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor({ timeout: 5000 });
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/ticketdetails?id=livetest-s20", { timeout: 10000 });
  ok("sign-in after the detour lands on the deep link", page.url() === `${BASE}/ticketdetails?id=livetest-s20`);
  await page.getByText("Ticket not found").waitFor({ timeout: 5000 });
  ok("unknown id renders the s10 not-found Alert", true);
  await page.context().close();
}

// --- 2. The guard behaviors (the s19 re-checks) ----------------------------
{
  const page = await browser.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForURL(/\/login\?from_url=/, { timeout: 10000 });
  ok("plain bounce still decorated (regression)", /from_url=/.test(page.url()));

  // The cross-origin from_url must NOT leak (the open-redirect guard) —
  // read directly from the login page: fill the form while a crafted
  // from_url sits in the address bar, sign in, expect /dashboard.
  await page.goto(`${BASE}/login?from_url=${encodeURIComponent("https://evil.example.com/steal")}`);
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  ok("cross-origin from_url falls back to /dashboard", page.url() === `${BASE}/dashboard`);
  await page.context().close();
}

// --- 3. The mobile matrix (the standing priority, s14 contracts) -----------
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  const m1 = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  ok("mobile at rest: no overflow (375=375)", m1.scrollW === m1.clientW);

  await page.locator("header button").click();
  await page.waitForTimeout(700);
  const m2 = await page.evaluate(() => {
    const open = [...document.querySelectorAll('[data-state=open]')];
    const sheet = open.find((e) => e.tagName === "DIV" && !e.className.includes("bg-black"));
    const overlay = open.find((e) => e.className.includes("bg-black"));
    return {
      sheetW: Math.round(sheet.getBoundingClientRect().width),
      sheetBg: getComputedStyle(sheet).backgroundColor,
      overlay: getComputedStyle(overlay).backgroundColor,
      bodyLocked: getComputedStyle(document.body).overflow === "hidden",
    };
  });
  ok("sheet 288px + #fafafa", m2.sheetW === 288 && m2.sheetBg === "rgb(250, 250, 250)");
  ok("80% overlay + body lock", /0\.8/.test(m2.overlay) && m2.bodyLocked);

  await page.locator('[data-state=open] a[href="/mytickets"]').click();
  await page.waitForURL("**/mytickets");
  await page.waitForTimeout(500);
  const m3 = await page.evaluate(() => ({
    closed: document.querySelectorAll("[data-state=open]").length === 0,
    unlocked: getComputedStyle(document.body).overflow !== "hidden",
  }));
  ok("nav-tap auto-close + unlock (our superset)", m3.closed && m3.unlocked);
  await page.context().close();
}

await browser.close();

let failures = 0;
for (const [name, status] of results) {
  console.log(`[${status}] ${name}`);
  if (status === "FAIL") failures++;
}
console.log(failures === 0 ? "ALL GREEN" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
