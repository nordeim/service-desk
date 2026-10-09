// Session-9 hover probe: badge hover (bg-primary/80) on BOTH sites under a
// hover-capable Playwright Chromium (agent-browser reports hover:none, which
// makes every Tailwind v4 hover: rule inert — the session-7 lesson).
// Usage: node scripts/s9-hover-badges.mjs
import { chromium } from "@playwright/test";

const CLONE = "http://localhost:3000";
const REF = "https://service-desk-332a5ae4.base44.app";

async function probeClone(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${CLONE}/login`);
  await page.fill('input[type="email"]', "demo@servicedesk.app");
  await page.fill('input[type="password"]', "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  await page.waitForSelector("main .text-4xl");
  // quick-stat pill in the sidebar
  const pill = page.locator("div.group\\/sidebar span:has-text('4')").first();
  // fallback: any inline-flex pill with shadow-md inside the sidebar
  const pillSel = page.locator("span.inline-flex.shadow-md").first();
  await pillSel.hover();
  const pillHover = await pillSel.evaluate((el) => getComputedStyle(el).backgroundColor);
  // status badge on mytickets
  await page.goto(`${CLONE}/mytickets`);
  await page.waitForSelector("main a[href*=ticketdetails]");
  const badge = page.locator("main a[href*=ticketdetails] span:has-text('open'), main a[href*=ticketdetails] span:has-text('urgent'), main a[href*=ticketdetails] span:has-text('medium')").first();
  await badge.hover();
  const badgeHover = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
  const badgeTransition = await badge.evaluate((el) => getComputedStyle(el).transitionProperty);
  // cursor on a true button (the sign-out)
  const signoutCursor = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Sign out");
    return b ? getComputedStyle(b).cursor : "not found";
  });
  await page.close();
  return { pillHover, badgeHover, badgeTransition, signoutCursor };
}

async function probeRef(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${REF}/login`);
  await page.fill('input[type="email"]', "sepnetflix2023@outlook.com");
  await page.fill('input[type="password"]', "$Abcd1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${REF}/`);
  await page.waitForLoadState("networkidle");
  const pillSel = page.locator("span.inline-flex.shadow-md, div.inline-flex.shadow-md").first();
  await pillSel.hover();
  const pillHover = await pillSel.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.goto(`${REF}/mytickets`);
  await page.waitForSelector("main a[href*=ticketdetails]");
  const badge = page.locator("main a[href*=ticketdetails] span, main a[href*=ticketdetails] div").filter({ hasText: /^(open|urgent|medium|high|low)/ }).first();
  await badge.hover();
  const badgeHover = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
  const badgeTransition = await badge.evaluate((el) => getComputedStyle(el).transitionProperty);
  const signoutCursor = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.className || "").toString().includes("red-50"));
    return b ? getComputedStyle(b).cursor : "not found";
  });
  await page.close();
  return { pillHover, badgeHover, badgeTransition, signoutCursor };
}

const browser = await chromium.launch();
const clone = await probeClone(browser);
const ref = await probeRef(browser);
await browser.close();
console.log(JSON.stringify({ clone, ref }, null, 2));
