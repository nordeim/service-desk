// Targeted probe: is the focus ring REAL on the shadcn Button family?
// Compares the ghost back button (pinned by the s6 matrix) against the
// login page's Google/Sign-in buttons + the sheet nav links, dumping the
// FULL computed box-shadow + the ring vars at :focus-visible.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3901";

async function probe(page, label, locator, via = "tab") {
  const el = page.locator(locator);
  if (via === "focus") {
    await el.focus();
  } else {
    // tab to it: press Tab until activeElement is it (max 20)
    for (let i = 0; i < 20; i++) {
      const hit = await page.evaluate(
        (sel) => {
          const a = document.activeElement;
          if (!a) return false;
          const norm = (s) => s.replace(/\s+/g, " ").trim();
          const cls = Array.from(a.classList);
          const id = a.id;
          const aria = a.getAttribute("aria-label");
          if (id && norm(sel).includes(id)) return true;
          if (aria && norm(sel).includes(aria)) return true;
          return cls.some((c) => norm(sel).includes(c)) && norm(sel).split(" ").length === 1;
        },
        locator,
      );
      if (hit) break;
      await page.keyboard.press("Tab");
    }
  }
  const data = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      name:
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        (el.textContent || "").trim().slice(0, 40),
      cls: el.className.slice(0, 300),
      fv: el.matches(":focus-visible"),
      boxShadow: cs.boxShadow,
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
      vars: {
        ring: cs.getPropertyValue("--ring").trim(),
        ringColor: cs.getPropertyValue("--tw-ring-color").trim(),
        ringShadow: cs.getPropertyValue("--tw-ring-shadow").trim(),
        ringOffsetShadow: cs.getPropertyValue("--tw-ring-offset-shadow").trim(),
        sidebarRing: cs.getPropertyValue("--sidebar-ring").trim(),
      },
    };
  });
  console.log(`=== ${label} ===`);
  console.log(JSON.stringify(data, null, 1));
}

const browser = await chromium.launch();

// Login page: the Google + Sign-in buttons.
const p1 = await browser.newPage({ viewport: { width: 375, height: 667 } });
await p1.goto(`${BASE}/login`);
await probe(p1, "login Google button", 'button:has-text("Continue with Google")', "focus");
await probe(p1, "login Sign-in button", 'button:has-text("Sign in")', "focus");
await probe(p1, "login email input (auth family)", 'input[type="email"]', "focus");
await p1.close();

// Submitticket: the ghost back button (the s6-pinned control).
const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await p2.goto(`${BASE}/login`);
await p2.fill('input[type="email"]', "demo@servicedesk.app");
await p2.fill('input[type="password"]', "Demo1234!");
await p2.click('button[type="submit"]');
await p2.waitForURL(/dashboard/);
await p2.goto(`${BASE}/submitticket`);
await probe(p2, "submitticket ghost back button", 'a:has-text("Back to Dashboard")', "focus");
await probe(p2, "submitticket submit button", 'button:has-text("Submit Ticket")', "focus");
await p2.close();

// Dashboard: the Report New Issue link + the desktop sidebar nav link.
const p3 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await p3.goto(`${BASE}/login`);
await p3.fill('input[type="email"]', "demo@servicedesk.app");
await p3.fill('input[type="password"]', "Demo1234!");
await p3.click('button[type="submit"]');
await p3.waitForURL(/dashboard/);
await probe(p3, "dashboard Report New Issue", 'a:has-text("Report New Issue")', "focus");
await probe(p3, "desktop sidebar Dashboard nav link", 'a:has-text("Dashboard")', "focus");
await p3.close();

await browser.close();
