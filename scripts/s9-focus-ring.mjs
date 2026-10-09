// Session-9 keyboard-focus probe: Tab into the sidebar nav and read the
// focus ring (must be the reference's blue-500 --sidebar-ring).
// Usage: node scripts/s9-focus-ring.mjs
import { chromium } from "@playwright/test";

const CLONE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${CLONE}/login`);
await page.fill('input[type="email"]', "demo@servicedesk.app");
await page.fill('input[type="password"]', "Demo1234!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
await page.waitForSelector("main .text-4xl");

// Tab backward from the content into the sidebar nav (Shift+Tab reaches the
// first sidebar focusable — the group label — then the first nav item).
await page.evaluate(() => document.body.focus());
for (let i = 0; i < 14; i++) {
  await page.keyboard.press("Shift+Tab");
  const info = await page.evaluate(() => {
    const ae = document.activeElement;
    if (!ae || ae === document.body) return null;
    const cs = getComputedStyle(ae);
    return {
      tag: ae.tagName,
      label: (ae.textContent || "").trim().slice(0, 16),
      ring: cs.boxShadow,
      ringColor: cs.boxShadow.includes("rgb") ? cs.boxShadow : null,
    };
  });
  if (info && (info.label === "Dashboard" || info.label === "Submit Ticket" || info.label === "My Tickets" || info.label === "Navigation")) {
    console.log(JSON.stringify({ focused: info, tabCount: i + 1 }, null, 2));
    break;
  }
}
await browser.close();
