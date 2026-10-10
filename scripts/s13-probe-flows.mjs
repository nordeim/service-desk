// Session-13 live probe: our clone's submit form + navigation flows on the
// production standalone server (:3000). Mirrors the agent-browser probes run
// against the reference so the two sides are directly comparable.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// --- sign in (rate-limited API: one real login per run) ---
await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard");
console.log("[login] ok");

// --- submit form structure ---
await page.goto(`${BASE}/submitticket`);
await page.getByRole("button", { name: /Submit Ticket/ }).waitFor();
const form = await page.evaluate(() => {
  const main = document.querySelector("main");
  return {
    buttons: [...main.querySelectorAll("button")].map((b) => b.textContent.trim()).slice(0, 12),
    inputs: [...main.querySelectorAll("input")].map((i) => ({ ph: i.placeholder, type: i.type, accept: i.accept || null })),
    textareas: [...main.querySelectorAll("textarea")].map((t) => t.placeholder),
    comboboxes: [...main.querySelectorAll("button[role=combobox]")].map((c) => c.textContent.trim()),
    fileLabel: main.querySelector("label[for]")?.textContent.trim() ?? null,
  };
});
console.log("[submit-form]", JSON.stringify(form, null, 1));

// --- submit flow: where does it navigate? ---
await page.getByPlaceholder("Brief summary of the problem").fill("S13 navigation probe ticket");
await page.getByPlaceholder(/Describe the issue/).fill("Probe ticket to verify the post-submit navigation target. Safe to close.");
await page.getByRole("combobox").first().click();
await page.getByRole("option", { name: /Hardware/ }).click();
await page.getByRole("button", { name: /Submit Ticket/ }).click();
await page.waitForURL(/dashboard|mytickets|ticketdetails/, { timeout: 15000 });
console.log("[submit-nav]", page.url());

// --- sign-out flow ---
await page.goto(`${BASE}/dashboard`);
await page.waitForSelector("main");
const signOut = page
  .locator("button", { hasText: "" })
  .filter({ has: page.locator("svg.lucide-log-out") });
if ((await signOut.count()) === 0) {
  // fallback: the footer button next to the user email
  const footer = page.locator("[data-slot=sidebar-footer] button").last();
  await footer.click();
} else {
  await signOut.first().click();
}
await page.waitForURL("**/login", { timeout: 15000 });
console.log("[signout-nav]", page.url());

await browser.close();
