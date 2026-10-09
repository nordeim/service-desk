// session-7 hover verification under hover:hover emulation (Playwright Desktop Chrome)
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // login
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', "demo@servicedesk.app");
  await page.fill('input[type="password"]', "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  await page.waitForSelector("main a:has-text('View All Tickets')");

  console.log("hover media:", await page.evaluate(() => ({
    hoverHover: matchMedia("(hover: hover)").matches,
    pointerFine: matchMedia("(pointer: fine)").matches,
  })));

  // CTA hover
  const cta = page.locator("main a", { hasText: "View All Tickets" });
  await cta.hover();
  await page.waitForTimeout(450); // let transition settle
  const ctaState = await cta.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, border: cs.borderColor, color: cs.color, hovering: el.matches(":hover") };
  });
  console.log("CTA hover:", JSON.stringify(ctaState));

  // Ghost back button hover (submitticket)
  await page.goto(`${BASE}/submitticket`);
  await page.waitForSelector("main a:has-text('Dashboard')");
  const back = page.locator("main a", { hasText: "Dashboard" }).first();
  await back.hover();
  await page.waitForTimeout(450);
  const backState = await back.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color };
  });
  console.log("Back hover:", JSON.stringify(backState));

  // Inactive nav item hover (mytickets page -> Dashboard nav inactive)
  const nav = page.locator("aside a", { hasText: "Dashboard" });
  await nav.hover();
  await page.waitForTimeout(450);
  const navState = await nav.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bgImage: cs.backgroundImage.slice(0, 60), color: cs.color };
  });
  console.log("Nav hover:", JSON.stringify(navState));

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
