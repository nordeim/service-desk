// Session-16: hard-load entrance-animation timing — reference vs ours.
// Installs a rAF sampler BEFORE the page loads (addInitScript), hard-loads
// /dashboard, reads the recorded opacity timeline of the first stat card.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

const INIT_REF = `
window.__samples = [];
(function () {
  let start = null;
  function pick() {
    var grids = document.querySelectorAll("main .grid");
    for (var g of grids) {
      if (g.firstElementChild) return g.firstElementChild;
    }
    return null;
  }
  function tick() {
    var el = pick();
    if (el) {
      if (start === null) start = performance.now();
      var cs = getComputedStyle(el);
      window.__samples.push({
        t: Math.round(performance.now() - start),
        o: cs.opacity,
        y: cs.transform.slice(0, 26),
      });
    }
    if (start === null || performance.now() - start < 1500) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
})();
`;

const INIT_OURS = `
window.__samples = [];
(function () {
  let start = null;
  function pick() {
    return document.querySelector(".animate-rise-in");
  }
  function tick() {
    var el = pick();
    if (el) {
      if (start === null) start = performance.now();
      var cs = getComputedStyle(el);
      window.__samples.push({
        t: Math.round(performance.now() - start),
        o: cs.opacity,
        y: cs.transform.slice(0, 26),
      });
    }
    if (start === null || performance.now() - start < 1500) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
})();
`;

async function measure(initScript, loginFn, target) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(initScript);
  await loginFn(page);
  await page.goto(target);
  await page.waitForTimeout(1800);
  const samples = await page.evaluate(() =>
    window.__samples.filter((s, i) => i % 3 === 0 || s.o !== "1").slice(0, 26)
  );
  await ctx.close();
  return samples;
}

const refLogin = async (page) => {
  await page.goto("https://service-desk-332a5ae4.base44.app/login");
  await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
  await page.locator("input[type=password]").first().fill("$Abcd1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  await page.waitForTimeout(600);
};

const ourLogin = async (page) => {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  await page.waitForTimeout(600);
};

console.log(
  "REF-STATCARD:",
  JSON.stringify(
    await measure(
      INIT_REF,
      refLogin,
      "https://service-desk-332a5ae4.base44.app/dashboard"
    )
  )
);
console.log(
  "OURS-STATCARD:",
  JSON.stringify(
    await measure(INIT_OURS, ourLogin, "http://localhost:3000/dashboard")
  )
);
await browser.close();
