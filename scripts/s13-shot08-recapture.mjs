// Re-capture 08-submit-attachment-row.png with Playwright's setInputFiles
// (the agent-browser DataTransfer dispatch doesn't reach React's onChange —
// the s13 lesson; the E2E suite's setInputFiles pattern is the proven path).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/08-submit-attachment-row.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard");

await page.goto(`${BASE}/submitticket`);
await page.getByRole("button", { name: /Submit Ticket/ }).waitFor();
await page.setInputFiles("#file-upload", {
  name: "s13-screenshot.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("session-13 screenshot probe"),
});
// Guard: the row must be present before shooting.
await page.getByText("s13-screenshot.txt", { exact: true }).waitFor();
// Scroll the attachment row into view (it sits below the 800px fold on
// this form — a viewport screenshot would crop it).
await page.getByText("s13-screenshot.txt", { exact: true }).scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: OUT });
console.log("captured:", OUT);

await browser.close();
