// Session-16: CLEAN hard-load measurement of the reference's staggered
// animations — mytickets card grid + dashboard recent rows. Installs the
// sampler before page load, hard-loads the route, reads timelines.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

const INIT = `
window.__cards = [];
window.__rows = [];
(function () {
  let start = null;
  function tick() {
    if (location.pathname.includes("mytickets")) {
      var cards = document.querySelectorAll("main .grid > div");
      cards.forEach(function (c, i) {
        var cs = getComputedStyle(c);
        if (!window.__cards[i]) window.__cards[i] = [];
        window.__cards[i].push({
          t: Math.round(performance.now()),
          o: cs.opacity,
          y: cs.transform.slice(0, 26),
        });
      });
    }
    if (location.pathname.includes("dashboard")) {
      var rows = document.querySelectorAll("main .divide-y > div");
      rows.forEach(function (c, i) {
        var cs = getComputedStyle(c);
        if (!window.__rows[i]) window.__rows[i] = [];
        window.__rows[i].push({
          t: Math.round(performance.now()),
          o: cs.opacity,
          x: cs.transform.slice(0, 26),
        });
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
`;

async function loginAndLoad(target) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await page.goto("https://service-desk-332a5ae4.base44.app/login");
  await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
  await page.locator("input[type=password]").first().fill("$Abcd1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  await page.waitForTimeout(1500); // let the dashboard anim finish
  await page.goto(target); // HARD LOAD of the target route
  await page.waitForTimeout(1600);
  const data = await page.evaluate(() => {
    const src = location.pathname.includes("mytickets")
      ? window.__cards
      : window.__rows;
    // normalize t to the first observed element sample
    const t0 = Math.min(
      ...src
        .filter(Boolean)
        .map((s) => (s.length ? s[0].t : Infinity))
    );
    return src.filter(Boolean).map((s) => {
      const firstNon0 = s.find((x) => x.o !== "0");
      const lastNon1 = [...s].reverse().find((x) => x.o !== "1");
      return {
        startMs: firstNon0 ? firstNon0.t - t0 : null,
        endMs: lastNon1 ? lastNon1.t - t0 : null,
        firstTransform: s.length ? s[0].y || s[0].x : null,
        midTransform:
          s[Math.floor(s.length / 2)] &&
          (s[Math.floor(s.length / 2)].y || s[Math.floor(s.length / 2)].x),
        count: s.length,
      };
    });
  });
  await ctx.close();
  return data;
}

console.log(
  "REF-MYTICKETS-CARDS:",
  JSON.stringify(await loginAndLoad("https://service-desk-332a5ae4.base44.app/mytickets"))
);
console.log(
  "REF-DASHBOARD-ROWS:",
  JSON.stringify(await loginAndLoad("https://service-desk-332a5ae4.base44.app/dashboard"))
);
await browser.close();
