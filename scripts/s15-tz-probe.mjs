// Session 15 probe B: timezone behavior of the date rendering. The reference
// rendered a ticket created at 04:29 UTC as "4:29 AM" under a Europe/Berlin
// (UTC+2) locale context — i.e. they format in UTC, not browser-local time.
// This probe drives OUR production build the same way to see whether ours
// renders browser-local (a divergence) or UTC (parity).
import { chromium } from "@playwright/test";

const BASE = process.env.OURS ?? "http://localhost:3000";
const EMAIL = "demo@servicedesk.app";
const PASSWORD = "Demo1234!";

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: "de-DE", timezoneId: "Europe/Berlin" });
const page = await ctx.newPage();
try {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/dashboard/, { timeout: 30_000 });
  await page.goto(`${BASE}/mytickets`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2_500);
  // Read the first ticket card's date text + the raw API value for the same ticket.
  const cardDate = await page
    .locator("main .text-sm.text-slate-500, main p.text-sm")
    .first()
    .textContent()
    .catch(() => null);
  const api = await page.evaluate(async () => {
    const r = await fetch("/api/tickets?scope=all", { credentials: "include" });
    const j = await r.json();
    const t = (j.tickets ?? [])[0];
    return t ? { createdAt: t.createdAt, updatedAt: t.updatedAt } : null;
  });
  const nowUtc = new Date().toISOString();
  console.log(
    JSON.stringify({ cardDate, api, nowUtc, browserTz: "Europe/Berlin (UTC+2)" }),
  );
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 300) }));
} finally {
  await ctx.close();
  await browser.close();
}
