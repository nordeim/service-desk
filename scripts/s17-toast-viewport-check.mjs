// s17: verify OUR toast viewport stays pointer-events: none (never blocks the
// mobile trigger / submit button — the reference's standing defect class).
import { chromium } from "@playwright/test";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/login");
await page.fill('input[type="email"]', 'demo@servicedesk.app');
await page.fill('input[type="password"]', 'Demo1234!');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');
const r = await page.evaluate(() => {
  const viewports = [...document.querySelectorAll('[role="region"][aria-label^="Notifications"], ol[tabindex]')];
  return JSON.stringify(viewports.map(v => ({
    cls: v.className.slice(0, 60),
    pointerEvents: getComputedStyle(v).pointerEvents
  })));
});
console.log("viewport:", r);
// the submit button at the bottom must be clickable (no cover)
await page.goto("http://localhost:3000/submitticket");
const cover = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Submit Ticket');
  if (!btn) return 'no-btn';
  const r = btn.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  return JSON.stringify({ covered: el !== btn && !btn.contains(el), hit: el.tagName + '.' + (el.className||'').toString().slice(0,40) });
});
console.log("submit-cover:", cover);
await b.close();
