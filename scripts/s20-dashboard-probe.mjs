// Session 20 — spot-check our dashboard structure (paired with the reference
// probes via agent-browser). Runs against the production standalone on :3000.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard", { timeout: 10000 });

const data = await page.evaluate(() => {
  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => ({ t: a.textContent.trim().slice(0, 22), h: a.getAttribute("href") }))
    .filter((x) => x.h && !x.h.includes("http"));
  const stats = [...document.querySelectorAll("span")]
    .filter((s) => /^(open|in progress|resolved|closed|total|my tickets|all tickets)$/i.test(s.textContent.trim()))
    .map((s) => s.textContent.trim());
  const h1 = document.querySelector("main h1")?.textContent.trim();
  const recent = [...document.querySelectorAll("main h2, main h3")].map((h) => h.textContent.trim()).slice(0, 6);
  return { navLinks: links.slice(0, 6), stats: stats.slice(0, 6), h1, recent };
});
console.log("[ours-dashboard]", JSON.stringify(data, null, 1));

// Our mobile nav at 390px (iPhone 14 — the fresh-axis spot-check from s19)
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const m = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
console.log("[ours-375spot]", JSON.stringify(m));

await browser.close();
