// Session 19 live paired re-verification (production standalone :3000):
// the from_url deep-link contract end-to-end + the mobile matrix re-run.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// [1] unauth deep-link bounce carries the from_url (id-bearing)
await page.goto(`${BASE}/ticketdetails?id=livetest123`, { waitUntil: "domcontentloaded" });
const bounceUrl = page.url();
console.log("[1-bounce]", bounceUrl.includes("from_url=") ? "PASS" : "FAIL", bounceUrl.slice(0, 110));

// [2] sign in from the from_url page → return to the SAME URL (the ticket page)
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/ticketdetails?id=livetest123", { timeout: 15000 });
console.log("[2-return]", page.url().endsWith("ticketdetails?id=livetest123") ? "PASS" : "FAIL", page.url());
await page.waitForTimeout(1200);
const nf = await page.getByText("Ticket not found").isVisible();
console.log("[2-notfound-alert]", nf ? "PASS (s10 Alert renders for unknown id)" : "FAIL");

// [3] open-redirect guard: cross-origin from_url falls back to /dashboard
await ctx.clearCookies();
await page.goto(`${BASE}/login?from_url=${encodeURIComponent("https://evil.example/steal")}`, { waitUntil: "domcontentloaded" });
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard", { timeout: 15000 });
console.log("[3-open-redirect-guard]", page.url().endsWith("/dashboard") ? "PASS (fell back)" : "FAIL", page.url());

// [4] plain /login keeps the dashboard default
await ctx.clearCookies();
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard", { timeout: 15000 });
console.log("[4-default]", page.url().endsWith("/dashboard") ? "PASS" : "FAIL", page.url());

// [5] auth-page from_url target → loop prevention (falls back)
await ctx.clearCookies();
await page.goto(`${BASE}/login?from_url=${encodeURIComponent(`${BASE}/login`)}`, { waitUntil: "domcontentloaded" });
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard", { timeout: 15000 });
console.log("[5-loop-guard]", page.url().endsWith("/dashboard") ? "PASS" : "FAIL", page.url());

// [6] mobile matrix re-run (the proxy adds a redirect hop — contracts must hold)
await ctx.clearCookies();
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard", { timeout: 15000 });
await page.waitForTimeout(1500);
const m1 = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
await page.locator("header button").click();
await page.waitForTimeout(700);
const m2 = await page.evaluate(() => {
  const open = [...document.querySelectorAll("[data-state=open]")];
  const sheet = open.find((e) => e.tagName === "DIV" && !e.className.includes("bg-black"));
  const overlay = open.find((e) => e.className.includes("bg-black"));
  return {
    sheetW: Math.round(sheet.getBoundingClientRect().width),
    sheetBg: getComputedStyle(sheet).backgroundColor,
    overlayBg: getComputedStyle(overlay).backgroundColor,
    bodyLocked: getComputedStyle(document.body).overflow === "hidden",
  };
});
await page.locator('[data-state=open] [href="/mytickets"]').click();
await page.waitForURL("**/mytickets");
await page.waitForTimeout(500);
const m3 = await page.evaluate(() => ({
  sheetClosed: document.querySelectorAll("[data-state=open]").length === 0,
  bodyUnlocked: getComputedStyle(document.body).overflow !== "hidden",
}));
console.log("[6-mobile]", JSON.stringify({ ...m1, ...m2, ...m3 }));

// [7] the canonical seed survived the fixtures (this run created no tickets)
const badge = await page.locator("main").innerHTML();
console.log("[7-info] page renders; run cleanup check separately");

await browser.close();
