// S90 census: the §13 44px touch-target floor audit on mobile bands.
// Measures every VISIBLE interactive control (button, link, input, select,
// textarea, [role=button], [role=combobox], [role=tab]) on every mobile
// surface at 375x667, recording bounding boxes + accessible names.
// Classification happens offline: <44px in EITHER dimension = offender
// candidate; the parity check vs the reference's own controls follows.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const BASE = "http://127.0.0.1:3000";
const OUT = "/tmp/s90-results/touch-census";
mkdirSync(OUT, { recursive: true });

const SURFACES_AUTHED = [
  { name: "dashboard", url: "/dashboard" },
  { name: "mytickets", url: "/mytickets" },
  { name: "submitticket", url: "/submitticket" },
  { name: "ticketdetails", url: null }, // first seeded ticket id
  { name: "dashboard-navsheet", url: "/dashboard", openNav: true },
];

const SURFACES_PUBLIC = [
  { name: "login", url: "/login" },
  { name: "signup", url: "/signup" },
  { name: "forgotpassword", url: "/forgotpassword" },
];

const SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='combobox']",
  "[role='tab']",
  "[role='switch']",
  "[role='checkbox']",
].join(", ");

async function census(page) {
  return page.evaluate((sel) => {
    const els = Array.from(document.querySelectorAll(sel));
    const out = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      // skip aria-hidden shadow internals (the s89 doctrine: hidden elements
      // are skipped by a11y rules by their own semantics)
      if (el.closest("[aria-hidden='true']")) continue;
      const inVp = r.bottom > 0 && r.top < window.innerHeight;
      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : "") ||
        el.textContent.trim().slice(0, 60);
      out.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type") || "",
        role: el.getAttribute("role") || "",
        name: name.slice(0, 70),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        inViewport: inVp,
        id: el.id || "",
        cls: (el.className && typeof el.className === "string" ? el.className : "").slice(0, 90),
      });
    }
    return out;
  }, SELECTOR);
}

(async () => {
  const browser = await chromium.launch();
  const all = {};

  // --- authed surfaces ---
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "demo@servicedesk.app");
  await page.fill('input[type="password"]', "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  console.log("[census] auth ok");

  await page.goto(`${BASE}/mytickets`, { waitUntil: "networkidle" });
  const firstTicketHref = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/ticketdetails?id="]');
    return a ? a.getAttribute("href") : null;
  });
  console.log("[census] detail href:", firstTicketHref);

  for (const s of SURFACES_AUTHED) {
    const url = s.name === "ticketdetails" ? firstTicketHref : s.url;
    if (!url) {
      console.log(`[census] ${s.name}: SKIPPED (no ticket href)`);
      continue;
    }
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400); // s81 settle form (exit animations)
    if (s.openNav) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      const toggle = page
        .locator('button[aria-label*="menu" i], button[aria-label*="Open" i]')
        .first();
      try {
        await toggle.click({ timeout: 3000 });
        await page.waitForTimeout(500); // sheet entrance settle
      } catch {
        console.log(`[census] ${s.name}: nav toggle not found`);
      }
    }
    const rows = await census(page);
    all[s.name] = rows;
    const offenders = rows.filter((r) => r.inViewport && (r.w < 44 || r.h < 44));
    console.log(
      `[census] ${s.name}: ${rows.length} controls, ${rows.filter((r) => r.inViewport).length} in-viewport, ${offenders.length} under-44`
    );
    if (s.openNav) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  }
  await ctx.close();

  // --- public trio (fresh context, logged out) ---
  const ctx2 = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page2 = await ctx2.newPage();
  for (const s of SURFACES_PUBLIC) {
    await page2.goto(`${BASE}${s.url}`, { waitUntil: "networkidle" });
    await page2.waitForTimeout(400);
    const rows = await census(page2);
    all[s.name] = rows;
    const offenders = rows.filter((r) => r.inViewport && (r.w < 44 || r.h < 44));
    console.log(
      `[census-public] ${s.name}: ${rows.length} controls, ${rows.filter((r) => r.inViewport).length} in-viewport, ${offenders.length} under-44`
    );
  }
  await ctx2.close();

  writeFileSync(`${OUT}/ours-375.json`, JSON.stringify(all, null, 1));
  console.log(`[census] written ${OUT}/ours-375.json`);
  await browser.close();
})();
