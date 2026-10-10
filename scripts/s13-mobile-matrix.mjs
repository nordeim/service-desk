// Session-13 live mobile-nav matrix on OUR clone (production standalone :3000),
// paired with the agent-browser matrix run on the reference this session.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard");

const m1 = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  headerVisible: getComputedStyle(document.querySelector("header")).display !== "none",
}));
console.log("[mobile-at-rest]", JSON.stringify(m1));

// open the sheet
await page.locator("header button").click();
await page.waitForTimeout(700); // slide-in 500ms
const m2 = await page.evaluate(() => {
  const open = [...document.querySelectorAll("[data-state=open]")];
  const sheet = open.find((e) => e.tagName === "DIV" && !e.className.includes("bg-black"));
  const overlay = open.find((e) => e.className.includes("bg-black"));
  return {
    sheetW: Math.round(sheet.getBoundingClientRect().width),
    sheetBg: getComputedStyle(sheet).backgroundColor,
    overlayBg: getComputedStyle(overlay).backgroundColor,
    bodyLocked: getComputedStyle(document.body).overflow === "hidden",
  };
});
console.log("[mobile-sheet]", JSON.stringify(m2));

// nav-tap auto-close (our E2E-pinned superset) — NB: our mobile sidebar
// content carries data-slot="sidebar" (the s8 probe lesson).
await page.locator('[data-state=open] a[href="/mytickets"]').click();
await page.waitForURL("**/mytickets");
await page.waitForTimeout(500);
const m3 = await page.evaluate(() => ({
  sheetClosed: document.querySelectorAll("[data-state=open]").length === 0,
  bodyUnlocked: getComputedStyle(document.body).overflow !== "hidden",
}));
console.log("[mobile-navtap]", JSON.stringify(m3));

// escape close
await page.goBack();
await page.waitForURL("**/dashboard");
await page.locator("header button").click();
await page.waitForTimeout(700);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const m4 = await page.evaluate(() => ({
  sheetClosed: document.querySelectorAll("[data-state=open]").length === 0,
  activeIsBody: document.activeElement === document.body,
}));
console.log("[mobile-escape]", JSON.stringify(m4));

await browser.close();
