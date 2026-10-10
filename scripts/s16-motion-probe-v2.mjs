// Session-16 v2: precise in-flight entrance-animation probe.
// Reference: framer-motion sets inline opacity/transform while animating.
// Ours: CSS animate-rise-in (computed animation-name) — disabled under reduce.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

async function refProbe(reducedMotion) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion,
  });
  const page = await ctx.newPage();
  await page.goto("https://service-desk-332a5ae4.base44.app/login");
  await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
  await page.locator("input[type=password]").first().fill("$Abcd1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  // sample twice, early and mid-flight
  const samples = [];
  for (const wait of [60, 150]) {
    await page.waitForTimeout(wait);
    const s = await page.evaluate(() => {
      // framer-motion animates the stat-card wrappers via inline style
      const cards = Array.from(document.querySelectorAll("main div.p-6"));
      const anyAnimating = cards.some((c) => {
        const st = c.getAttribute("style") || "";
        return st.includes("opacity");
      });
      const first = cards[0];
      return {
        cardCount: cards.length,
        firstInline: first ? first.getAttribute("style") : "n/a",
        firstOpacity: first ? getComputedStyle(first).opacity : "n/a",
        anyAnimating,
      };
    });
    samples.push({ atWaitMs: wait, ...s });
  }
  await ctx.close();
  return samples;
}

async function ourProbe(reducedMotion) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion,
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/login");
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  const samples = [];
  for (const wait of [60, 150]) {
    await page.waitForTimeout(wait);
    const s = await page.evaluate(() => {
      const card = document.querySelector(".animate-rise-in");
      if (!card) return { found: false };
      const cs = getComputedStyle(card);
      return {
        found: true,
        animName: cs.animationName,
        opacity: cs.opacity,
        playState: cs.animationPlayState,
      };
    });
    samples.push({ atWaitMs: wait, ...s });
  }
  await ctx.close();
  return samples;
}

console.log("REF-NORMAL:", JSON.stringify(await refProbe("no-preference")));
console.log("REF-REDUCE:", JSON.stringify(await refProbe("reduce")));
console.log("OURS-NORMAL:", JSON.stringify(await ourProbe("no-preference")));
console.log("OURS-REDUCE:", JSON.stringify(await ourProbe("reduce")));
await browser.close();
