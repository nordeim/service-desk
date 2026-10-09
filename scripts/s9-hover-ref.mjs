// Session-9 hover probe (reference site — evaluate-based, mirrors the working agent-browser logic).
// Usage: node scripts/s9-hover-ref.mjs
import { chromium } from "@playwright/test";

const REF = "https://service-desk-332a5ae4.base44.app";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${REF}/login`);
await page.fill('input[type="email"]', "sepnetflix2023@outlook.com");
await page.fill('input[type="password"]', "$Abcd1234");
await page.click('button[type="submit"]');
await page.waitForURL(`${REF}/`);
await page.waitForLoadState("networkidle");

const pillData = await page.evaluate(async () => {
  let sb = document.querySelector("a[href='/dashboard']").closest('div[class*="flex"]');
  for (let i = 0; i < 6 && sb.parentElement; i++) sb = sb.parentElement;
  const pill = [...sb.querySelectorAll("div,span")].find(
    (e) => /^\d+$/.test(e.textContent.trim()) && (e.className || "").toString().includes("inline-flex")
  );
  if (!pill) return { found: false };
  const before = getComputedStyle(pill).backgroundColor;
  pill.scrollIntoView({ block: "center" });
  const r = pill.getBoundingClientRect();
  // real trusted mouse move via elementFromPoint target
  await new Promise((res) => setTimeout(res, 60));
  return { found: true, before, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, txt: pill.textContent.trim() };
});

// hover the pill rect with the real mouse, then read the color inside the page
let pillHover = null;
if (pillData.found) {
  await page.mouse.move(pillData.rect.x + pillData.rect.w / 2, pillData.rect.y + pillData.rect.h / 2);
  await page.waitForTimeout(350);
  pillHover = await page.evaluate(() => {
    let sb = document.querySelector("a[href='/dashboard']").closest('div[class*="flex"]');
    for (let i = 0; i < 6 && sb.parentElement; i++) sb = sb.parentElement;
    const pill = [...sb.querySelectorAll("div,span")].find(
      (e) => /^\d+$/.test(e.textContent.trim()) && (e.className || "").toString().includes("inline-flex")
    );
    return { hovered: pill.matches(":hover"), bg: getComputedStyle(pill).backgroundColor };
  });
}

await page.goto(`${REF}/mytickets`);
await page.waitForSelector("main a[href*=ticketdetails]");
const badgeInfo = await page.evaluate(() => {
  const card = document.querySelector('main a[href*="ticketdetails"]');
  const b = [...card.querySelectorAll("span,div")].find(
    (e) => e.children.length === 0 && /^\s*(open|in progress|urgent|medium|high|low|resolved|closed)\s*$/i.test(e.textContent)
  );
  if (!b) return { found: false };
  const r = b.getBoundingClientRect();
  return { found: true, txt: b.textContent.trim(), rect: { x: r.x, y: r.y, w: r.width, h: r.height }, rest: getComputedStyle(b).backgroundColor };
});
let badgeHover = null;
if (badgeInfo.found) {
  await page.mouse.move(badgeInfo.rect.x + badgeInfo.rect.w / 2, badgeInfo.rect.y + badgeInfo.rect.h / 2);
  await page.waitForTimeout(350);
  badgeHover = await page.evaluate(() => {
    const card = document.querySelector('main a[href*="ticketdetails"]');
    const b = [...card.querySelectorAll("span,div")].find(
      (e) => e.children.length === 0 && /^\s*(open|in progress|urgent|medium|high|low|resolved|closed)\s*$/i.test(e.textContent)
    );
    return { hovered: b.matches(":hover"), bg: getComputedStyle(b).backgroundColor, transition: getComputedStyle(b).transitionProperty };
  });
}

console.log(JSON.stringify({ pillData, pillHover, badgeInfo, badgeHover }, null, 2));
await browser.close();
