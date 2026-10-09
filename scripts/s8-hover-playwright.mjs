// Session-8 hover verification under hover:hover emulation (Playwright Desktop Chrome)
// Probes: stat cards, recent rows (dashboard), ticket cards (mytickets) — both sites.
import { chromium } from "@playwright/test";

const REF = "https://service-desk-332a5ae4.base44.app";
const CLONE = process.env.CLONE_URL ?? "http://localhost:3100";

async function login(page, base) {
  await page.goto(`${base}/login`);
  await page.fill('input[type="email"]', base === REF ? "sepnetflix2023@outlook.com" : "demo@servicedesk.app");
  await page.fill('input[type="password"]', base === REF ? "$Abcd1234" : "Demo1234!");
  await page.click('button[type="submit"]');
  // The reference lands on "/" after login; the clone on "/dashboard".
  await page.waitForURL(u => u.pathname === "/" || u.pathname === "/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}

async function probe(base) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await login(page, base);

  const out = { base };
  out.media = await page.evaluate(() => matchMedia("(hover: hover)").matches);

  // 1. Stat card hover (first stat card: the "Total Tickets" tile)
  const statCard = page.locator("main .grid > div").first();
  await statCard.waitFor({ state: "visible" });
  await page.waitForTimeout(800); // let rise-in settle
  await statCard.hover();
  await page.waitForTimeout(450);
  out.statHover = await statCard.evaluate((el) => {
    const c = getComputedStyle(el);
    return { transform: c.transform, shadow: c.boxShadow.slice(0, 70), border: c.borderColor, translateY: el.getBoundingClientRect().top, cls: el.className.toString().slice(0, 150) };
  });

  // 2. Recent row hover (dashboard recent card first row)
  const row = page.locator("main .divide-y > a").first();
  if (await row.count()) {
    await row.hover();
    await page.waitForTimeout(450);
    out.recentRowHover = await row.evaluate((el) => {
      const c = getComputedStyle(el);
      return { bgImage: c.backgroundImage.slice(0, 80), titleColor: (el.querySelector("h3") ? getComputedStyle(el.querySelector("h3")).color : null), arrowTransform: (el.querySelector("svg:last-of-type") ? getComputedStyle(el.querySelector("svg:last-of-type")).transform : null) };
    });
  }

  // 3. Ticket card hover (mytickets)
  await page.goto(`${base}/mytickets`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const card = page.locator("main a[class*=rounded-xl], main a[class*=shadow]").first();
  const cardCount = await page.locator("main a").count();
  const anyCard = page.locator("main a").filter({ has: page.locator("h3") }).first();
  if (await anyCard.count()) {
    await anyCard.hover();
    await page.waitForTimeout(450);
    out.ticketCardHover = await anyCard.evaluate((el) => {
      const c = getComputedStyle(el);
      return { shadow: c.boxShadow.slice(0, 80), transform: c.transform, translateY: c.translate, border: c.borderColor, cls: el.className.toString().slice(0, 160) };
    });
  }
  out.myCardCount = cardCount;

  await browser.close();
  return out;
}

const ref = await probe(REF);
const clone = await probe(CLONE);
console.log("REFERENCE:", JSON.stringify(ref, null, 1));
console.log("CLONE:", JSON.stringify(clone, null, 1));
