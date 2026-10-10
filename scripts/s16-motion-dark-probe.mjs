// Session-16: in-flight entrance-animation probe under prefers-reduced-motion.
// Samples the stat card's opacity ~120ms after navigation commit — before the
// 310ms entrance animation could complete — on the reference (framer-motion)
// and on our clone (CSS animate-rise-in), under normal + reduce.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

async function probeLoginDash(colorScheme, reducedMotion) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme,
    reducedMotion,
  });
  const page = await ctx.newPage();
  await page.goto("https://service-desk-332a5ae4.base44.app/login");
  await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
  await page.locator("input[type=password]").first().fill("$Abcd1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard").catch(() => {});
  const t0 = Date.now();
  await page.waitForTimeout(120);
  const sample = await page.evaluate(() => {
    const statCard = Array.from(document.querySelectorAll("main div")).find((d) =>
      String(d.className).includes("rounded-2xl")
    );
    if (!statCard) return { found: false };
    return {
      found: true,
      opacity: getComputedStyle(statCard).opacity,
      animName: getComputedStyle(statCard).animationName,
      inlineStyle: statCard.getAttribute("style"),
    };
  });
  const out = { atMs: Date.now() - t0, ...sample };
  await ctx.close();
  return out;
}

// Reference under NORMAL motion (expect the entrance animation in flight)
const refNormal = await probeLoginDash("light", "no-preference");
console.log("REF-NORMAL-MOTION:", JSON.stringify(refNormal));
// Reference under REDUCED motion (does framer-motion respect it?)
const refReduce = await probeLoginDash("light", "reduce");
console.log("REF-REDUCE-MOTION:", JSON.stringify(refReduce));

// Ours under NORMAL + REDUCE (expect animate-rise-in / animate-none)
async function probeOurs(reducedMotion) {
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
  const t0 = Date.now();
  await page.waitForTimeout(120);
  const sample = await page.evaluate(() => {
    const statCard = Array.from(document.querySelectorAll("main div")).find((d) =>
      String(d.className).includes("rounded-2xl")
    );
    if (!statCard) return { found: false };
    return {
      found: true,
      opacity: getComputedStyle(statCard).opacity,
      animName: getComputedStyle(statCard).animationName,
    };
  });
  const out = { atMs: Date.now() - t0, ...sample };
  await ctx.close();
  return out;
}
const ourNormal = await probeOurs("no-preference");
console.log("OURS-NORMAL-MOTION:", JSON.stringify(ourNormal));
const ourReduce = await probeOurs("reduce");
console.log("OURS-REDUCE-MOTION:", JSON.stringify(ourReduce));

// Our dark-scheme behavior (reference ignores dark — do we?)
const ctxD = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: "dark",
});
const pageD = await ctxD.newPage();
await pageD.goto("http://localhost:3000/login");
await pageD.waitForTimeout(1500);
const darkOurs = await pageD.evaluate(() => ({
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color,
  htmlClass: document.documentElement.className,
}));
console.log("OURS-DARK-LOGIN:", JSON.stringify(darkOurs));
await ctxD.close();

await browser.close();
