// Session-16 fresh-axis probes on the reference: dark color scheme +
// prefers-reduced-motion (axes never probed in sessions 1-15).
import { chromium } from "@playwright/test";

const browser = await chromium.launch();

// Probe 1: dark scheme on the reference login + dashboard
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("https://service-desk-332a5ae4.base44.app/login");
await page.waitForTimeout(2500);
const dark = await page.evaluate(() => {
  const card = document.querySelector("main div[class*=backdrop]");
  return {
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    htmlClass: document.documentElement.className,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    cardSurface: card ? getComputedStyle(card).backgroundColor : "n/a",
  };
});
console.log("REF-DARK-LOGIN:", JSON.stringify(dark));

// login and check the dashboard under dark scheme
await page.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
await page.locator("input[type=password]").first().fill("$Abcd1234");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForTimeout(3000);
const darkDash = await page.evaluate(() => {
  const main = document.querySelector("main");
  const sidebar = document.querySelector("div[class*=bg-sidebar]");
  return {
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    mainBg: main ? getComputedStyle(main).backgroundColor : "n/a",
    sidebarBg: sidebar ? getComputedStyle(sidebar).backgroundColor : "n/a",
    htmlClass: document.documentElement.className,
  };
});
console.log("REF-DARK-DASHBOARD:", JSON.stringify(darkDash));
await ctx.close();

// Probe 2: reduced motion on the reference
const ctx2 = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});
const page2 = await ctx2.newPage();
await page2.goto("https://service-desk-332a5ae4.base44.app/login");
await page2.waitForTimeout(2000);
await page2.locator("input[type=email]").first().fill("sepnetflix2023@outlook.com");
await page2.locator("input[type=password]").first().fill("$Abcd1234");
await page2.getByRole("button", { name: "Sign in" }).click();
await page2.waitForTimeout(3500);
const rm = await page2.evaluate(() => {
  // probe a dashboard stat card (framer-motion animated surface)
  const cards = document.querySelectorAll("main div");
  let animated = 0;
  cards.forEach((c) => {
    const cs = getComputedStyle(c);
    if (cs.animationName !== "none" && cs.animationName !== "") animated++;
  });
  const first = cards[1] || cards[0];
  return {
    mediaQuery: matchMedia("(prefers-reduced-motion: reduce)").matches,
    animatedElementCount: animated,
    sampleTransition: first ? getComputedStyle(first).transitionProperty : "n/a",
  };
});
console.log("REF-REDUCED-MOTION:", JSON.stringify(rm));

// probe 2b: the entrance animation state under reduce — check for
// framer-motion's style attributes on a stat card
const rmAnim = await page2.evaluate(() => {
  const card = document.querySelector("main h1")?.parentElement;
  const statCard = Array.from(document.querySelectorAll("main div")).find(
    (d) => d.className && String(d.className).includes("rounded-2xl")
  );
  return {
    statCardStyle: statCard ? statCard.getAttribute("style") : "n/a",
    statCardOpacity: statCard ? getComputedStyle(statCard).opacity : "n/a",
  };
});
console.log("REF-REDUCED-ANIM-STATE:", JSON.stringify(rmAnim));
await ctx2.close();
await browser.close();
