// Session-8: precise hover probes on the INNER cards (the reference wraps cards in bare motion divs)
import { chromium } from "@playwright/test";

const REF = "https://service-desk-332a5ae4.base44.app";
const CLONE = process.env.CLONE_URL ?? "http://localhost:3100";

async function login(page, base) {
  await page.goto(`${base}/login`);
  await page.fill('input[type="email"]', base === REF ? "sepnetflix2023@outlook.com" : "demo@servicedesk.app");
  await page.fill('input[type="password"]', base === REF ? "$Abcd1234" : "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL(u => u.pathname === "/" || u.pathname === "/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}

async function probe(base) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await login(page, base);
  const out = { base };

  await page.waitForTimeout(800);
  // stat card = the element carrying rounded-xl ... shadow-lg (skip wrappers)
  const stat = page.locator("main .grid [class*='shadow-lg']").first();
  await stat.hover();
  await page.waitForTimeout(450);
  out.statHover = await stat.evaluate((el) => {
    const c = getComputedStyle(el);
    return { shadow: c.boxShadow.slice(0, 90), cls: el.className.toString().slice(0, 130) };
  });
  await page.mouse.move(640, 400); // unhover

  // recent row = the divide-y child (or the link inside it)
  const rowWrap = page.locator("main .divide-y > *").first();
  const row = rowWrap.locator("a").count() ? rowWrap.locator("a").first() : rowWrap;
  if (await row.count()) {
    await row.hover();
    await page.waitForTimeout(450);
    out.recentRowHover = await row.evaluate((el) => {
      const c = getComputedStyle(el);
      const h3 = el.querySelector("h3");
      const arrow = el.querySelector("svg");
      return { bg: c.backgroundImage.slice(0, 70) || c.backgroundColor, h3Color: h3 ? getComputedStyle(h3).color : null, arrowColor: arrow ? getComputedStyle(arrow).color : null, arrowTransform: arrow ? getComputedStyle(arrow).transform : null };
    });
  }

  // mytickets card hover
  await page.goto(`${base}/mytickets`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const card = page.locator("main a[class*='group']").first();
  if (!await card.count()) {
    // fallback: first ticket link containing an h3
    const c2 = page.locator("main a").filter({ has: page.locator("h3") }).first();
    if (await c2.count()) {
      await c2.hover();
      await page.waitForTimeout(450);
      out.myCardHover = await c2.evaluate((el) => { const c = getComputedStyle(el); return { shadow: c.boxShadow.slice(0, 90), border: c.borderColor, translateY: c.translate, cls: el.className.toString().slice(0, 140) }; });
    }
  } else {
    await card.hover();
    await page.waitForTimeout(450);
    out.myCardHover = await card.evaluate((el) => { const c = getComputedStyle(el); return { shadow: c.boxShadow.slice(0, 90), border: c.borderColor, translateY: c.translate, cls: el.className.toString().slice(0, 140) }; });
  }

  await browser.close();
  return out;
}

console.log("REFERENCE:", JSON.stringify(await probe(REF), null, 1));
console.log("CLONE:", JSON.stringify(await probe(CLONE), null, 1));
