// Session-16: confirm the reference's mytickets-card opacity follows the same
// spring-settle profile as their recent rows (the fade-in-spring keyframes).
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const INIT = `
window.__card0 = [];
(function () {
  function tick() {
    var cards = document.querySelectorAll("main .grid.gap-4 > div");
    if (cards[0]) {
      var cs = getComputedStyle(cards[0]);
      window.__card0.push({ t: Math.round(performance.now()), o: cs.opacity, y: cs.transform.slice(0, 28) });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
`;
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(INIT);
await page.goto("https://service-desk-332a5ae4.base44.app/login");
await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
await page.locator("input[type=password]").first().fill("$Abcd1234");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard").catch(() => {});
await page.waitForTimeout(1200);
await page.goto("https://service-desk-332a5ae4.base44.app/mytickets");
await page.waitForTimeout(1400);
const card0 = await page.evaluate(() => {
  const s = window.__card0;
  if (!s.length) return [];
  const t0 = s[0].t;
  return s
    .filter((x) => x.o !== "1" || x.y.includes("matrix"))
    .map((x) => ({ t: x.t - t0, o: x.o, y: x.y }))
    .filter((x, i) => i % 2 === 0)
    .slice(0, 22);
});
console.log("REF-CARD0-PROFILE:", JSON.stringify(card0));
await ctx.close();
await browser.close();
