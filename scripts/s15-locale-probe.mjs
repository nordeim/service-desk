// Session 15 probe: does the reference's date formatting follow the browser
// locale, or is it pinned en-US like ours? (The s17 shortlist item —
// "a re-probe of their formatDateTime locale under a non-US browser locale".)
//
// Runs headless Chromium contexts with de-DE / ja-JP locales against the
// LIVE reference, signs in, and reads a mytickets card's rendered date text.
// Read-only: it creates nothing and mutates nothing.
import { chromium } from "@playwright/test";

const EMAIL = process.env.REF_EMAIL ?? "sepnetflix2023@outlook.com";
const PASSWORD = process.env.REF_PASSWORD ?? "$Abcd1234";
const BASE = "https://service-desk-332a5ae4.base44.app";

const LOCALES = ["de-DE", "ja-JP"];

const browser = await chromium.launch();
for (const locale of LOCALES) {
  const ctx = await browser.newContext({ locale, timezoneId: "Europe/Berlin" });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForTimeout(6_000); // their SPA signs in client-side
    await page.goto(`${BASE}/mytickets`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4_000); // their SPA fetches client-side
    const cardDate = await page
      .locator("main .text-sm.text-slate-500, main p.text-sm")
      .first()
      .textContent()
      .catch(() => null);
    const title = await page.title();
    const bodySample = await page
      .locator("main")
      .first()
      .textContent()
      .catch(() => "");
    const dateMatch = bodySample.match(
      /[A-Z][a-z]{2} \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M/,
    );
    console.log(
      JSON.stringify({
        locale,
        title,
        cardDate,
        sawEnUsPattern: Boolean(dateMatch),
        enUsSample: dateMatch ? dateMatch[0] : null,
      }),
    );
  } catch (err) {
    console.log(JSON.stringify({ locale, error: String(err).slice(0, 200) }));
  } finally {
    await ctx.close();
  }
}
await browser.close();
