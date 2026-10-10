// Session-16: precise opacity-curve comparison for the recent-rows slide-in.
// Reference (framer-motion spring) vs ours (CSS bezier) — sampling one row's
// opacity + transform densely during the entrance.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

const INIT = `
window.__row0 = [];
(function () {
  function tick() {
    var rows = document.querySelectorAll("main .divide-y > a, main .divide-y > div");
    if (rows[0]) {
      var cs = getComputedStyle(rows[0]);
      window.__row0.push({
        t: Math.round(performance.now()),
        o: cs.opacity,
        x: cs.transform.slice(0, 28),
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
`;

async function profile(url, login) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  if (login === "ref") {
    await page.goto("https://service-desk-332a5ae4.base44.app/login");
    await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
    await page.locator("input[type=password]").first().fill("$Abcd1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard").catch(() => {});
    await page.waitForTimeout(1200);
  } else {
    await page.goto("http://localhost:3000/login");
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard").catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.goto(url);
  await page.waitForTimeout(1400);
  const row0 = await page.evaluate(() => {
    const s = window.__row0;
    if (!s.length) return [];
    const t0 = s[0].t;
    return s
      .filter((x) => x.o !== "1" || x.x.includes("matrix"))
      .map((x) => ({ t: x.t - t0, o: x.o, x: x.x }))
      .filter((x, i) => i % 2 === 0)
      .slice(0, 22);
  });
  await ctx.close();
  return row0;
}

console.log("REF-ROW0-PROFILE:", JSON.stringify(await profile("https://service-desk-332a5ae4.base44.app/dashboard", "ref")));
console.log("OURS-ROW0-PROFILE:", JSON.stringify(await profile("http://localhost:3000/dashboard", "ours")));
await browser.close();
