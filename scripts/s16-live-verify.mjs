// Session-16 live paired re-verification: our animation timelines vs the
// reference's measured numbers, plus the stats-polling behavior and the
// mobile overflow re-check at 375px.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

const INIT_OURS = `
window.__samples = [];
window.__rows = [];
window.__cards = [];
(function () {
  let start = null;
  function pickStat() {
    var grids = document.querySelectorAll("main .grid");
    for (var g of grids) { if (g.firstElementChild) return g.firstElementChild; }
    return null;
  }
  function tick() {
    var el = pickStat();
    if (el) {
      if (start === null) start = performance.now();
      var cs = getComputedStyle(el);
      window.__samples.push({
        t: Math.round(performance.now() - start),
        o: cs.opacity,
        y: cs.transform.slice(0, 26),
      });
    }
    // rows + cards when present
    document.querySelectorAll("main .divide-y > a").forEach(function (c, i) {
      var cs = getComputedStyle(c);
      if (!window.__rows[i]) window.__rows[i] = [];
      window.__rows[i].push({ t: Math.round(performance.now()), o: cs.opacity, x: cs.transform.slice(0, 26) });
    });
    document.querySelectorAll("main .grid > a > div").forEach(function (c, i) {
      var cs = getComputedStyle(c);
      if (!window.__cards[i]) window.__cards[i] = [];
      window.__cards[i].push({ t: Math.round(performance.now()), o: cs.opacity, y: cs.transform.slice(0, 26) });
    });
    if (start === null || performance.now() - start < 1400) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
`;

async function oursTimeline(route) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(INIT_OURS);
  await page.goto("http://localhost:3000/login");
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  await page.waitForTimeout(1500);
  await page.goto("http://localhost:3000" + route);
  await page.waitForTimeout(1600);
  const data = await page.evaluate(() => {
    const pick = (arr) =>
      (arr || [])
        .filter(Boolean)
        .map((s) => {
          const t0 = Math.min(...(s.length ? [s[0].t] : [Infinity]));
          const firstNon0 = s.find((x) => x.o !== "0");
          const lastNon1 = [...s].reverse().find((x) => x.o !== "1");
          return {
            startMs: firstNon0 ? firstNon0.t - t0 : null,
            endMs: lastNon1 ? lastNon1.t - t0 : null,
            firstT: s.length ? s[0].y || s[0].x : null,
            midT: s[Math.floor(s.length / 2)]
              ? s[Math.floor(s.length / 2)].y || s[Math.floor(s.length / 2)].x
              : null,
          };
        });
    return { stat: pick(window.__samples && [window.__samples])[0], rows: pick(window.__rows), cards: pick(window.__cards) };
  });
  await ctx.close();
  return data;
}

console.log("OURS-DASHBOARD:", JSON.stringify(await oursTimeline("/dashboard")));
console.log("OURS-MYTICKETS:", JSON.stringify(await oursTimeline("/mytickets")));

// The submit wrapper + mobile overflow + stats polling
const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page2 = await ctx2.newPage();
let statsCalls = 0;
await page2.route("**/api/stats", (route) => {
  statsCalls++;
  return route.continue();
});
await page2.goto("http://localhost:3000/login");
await page2.getByLabel("Email").fill("demo@servicedesk.app");
await page2.getByLabel("Password").fill("Demo1234!");
await page2.getByRole("button", { name: "Sign in", exact: true }).click();
await page2.waitForURL("**/dashboard").catch(() => {});
await page2.waitForTimeout(1200);
const mobile = await page2.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  rowAnim: getComputedStyle(document.querySelector("main .divide-y a")).animationName,
  statAnim: getComputedStyle(document.querySelector("main .grid > div")).animationName,
}));
console.log("OURS-MOBILE-375:", JSON.stringify(mobile));
// count stats over 6.5s on mytickets (sidebar-only surface)
await page2.goto("http://localhost:3000/mytickets");
await page2.waitForTimeout(6500);
console.log("OURS-STATS-CALLS-6.5s:", statsCalls, "(expect >= 2: mount + 5s interval)");

// The submit wrapper animates as one (mobile viewport ok)
const submit = await page2.evaluate(() => {
  const w = document.querySelector("main .max-w-3xl");
  return w ? { anim: getComputedStyle(w).animationName, dur: getComputedStyle(w).animationDuration } : null;
});
console.log("OURS-SUBMIT-WRAPPER:", JSON.stringify(submit));
await ctx2.close();
await browser.close();
