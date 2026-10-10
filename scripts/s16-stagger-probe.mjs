// Session-16: measure the reference's mytickets card-grid stagger + spring
// and the dashboard recent-rows x-slide stagger. Records per-element
// animation-start times (when opacity first leaves 0) + full timelines.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

await page.goto("https://service-desk-332a5ae4.base44.app/login");
await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
await page.locator("input[type=password]").first().fill("$Abcd1234");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard").catch(() => {});
await page.waitForTimeout(800);

// Instrument: navigate to /mytickets via SPA link, record every card's
// opacity over time (the cards are grid children of main .grid).
const data = await page.evaluate(() => {
  return new Promise((resolve) => {
    const records = []; // {tStart, samples: [{t, o, y}]}
    let start = null;
    const tick = () => {
      const cards = Array.from(document.querySelectorAll("main .grid > div"));
      if (cards.length > 0) {
        if (start === null) start = performance.now();
        cards.forEach((c, i) => {
          const cs = getComputedStyle(c);
          if (!records[i]) records[i] = { samples: [] };
          if (records[i].tStart === undefined && cs.opacity !== "0") {
            records[i].tStart = Math.round(performance.now() - start);
          }
          records[i].samples.push({
            t: Math.round(performance.now() - start),
            o: cs.opacity,
            y: cs.transform.slice(0, 26),
          });
        });
      }
      if (start === null || performance.now() - start < 1500) {
        requestAnimationFrame(tick);
      } else {
        resolve(
          records.map((r) => ({
            tStart: r.tStart,
            midSample:
              r.samples[Math.floor(r.samples.length / 2)] || null,
            lastNon1:
              [...r.samples].reverse().find((s) => s.o !== "1") || null,
          }))
        );
      }
    };
    const link = document.querySelector('a[href="/mytickets"], a[href*="mytickets"]');
    link.click();
    requestAnimationFrame(tick);
  });
});
console.log("REF-MYTICKETS-STAGGER:", JSON.stringify(data));
await ctx.close();

// Recent rows: x-slide + 100ms stagger (go back to dashboard, hard-ish remount)
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto("https://service-desk-332a5ae4.base44.app/login");
await page2.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
await page2.locator("input[type=password]").first().fill("$Abcd1234");
await page2.getByRole("button", { name: "Sign in" }).click();
await page2.waitForURL("**/dashboard").catch(() => {});
await page2.waitForTimeout(800);

const data2 = await page2.evaluate(() => {
  return new Promise((resolve) => {
    const records = [];
    let start = null;
    const tick = () => {
      // recent rows: divide-y container children
      const rows = Array.from(
        document.querySelectorAll("main .divide-y > div")
      );
      if (rows.length > 0) {
        if (start === null) start = performance.now();
        rows.forEach((c, i) => {
          const cs = getComputedStyle(c);
          if (!records[i]) records[i] = { samples: [] };
          if (records[i].tStart === undefined && cs.opacity !== "0") {
            records[i].tStart = Math.round(performance.now() - start);
          }
          records[i].samples.push({
            t: Math.round(performance.now() - start),
            o: cs.opacity,
            x: cs.transform.slice(0, 26),
          });
        });
      }
      if (start === null || performance.now() - start < 1600) {
        requestAnimationFrame(tick);
      } else {
        resolve(
          records.map((r) => ({
            tStart: r.tStart,
            firstX:
              r.samples.find((s) => s.x.includes("matrix"))?.x || "none",
            lastNon1: [...r.samples].reverse().find((s) => s.o !== "1") || null,
          }))
        );
      }
    };
    // remount dashboard by clicking the Dashboard nav link from another route
    const link = document.querySelector('a[href="/mytickets"], a[href*="mytickets"]');
    link.click();
    requestAnimationFrame(tick);
    // after arriving at mytickets, click back to dashboard to remount it
    setTimeout(() => {
      const dash = document.querySelector(
        'a[href="/dashboard"], a[href="/"], a[href*="dashboard"]'
      );
      if (dash) dash.click();
    }, 900);
  });
});
console.log("REF-RECENT-ROWS-STAGGER:", JSON.stringify(data2));
await ctx2.close();
await browser.close();
