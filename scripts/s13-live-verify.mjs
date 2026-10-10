// Session-13 live paired re-verification: our clone's attachment contracts
// on the production standalone (:3000) vs the reference measurements taken
// this session with agent-browser.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard");

// --- F1: the attached-file row on the submit form ---
await page.goto(`${BASE}/submitticket`);
await page.setInputFiles("#file-upload", {
  name: "live-check.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("session-13 live verification"),
});
const row = page.locator("main ul > li").first();
await row.waitFor();
const f1 = await page.evaluate(() => {
  const row = document.querySelector("main ul > li");
  const cs = getComputedStyle(row);
  const btn = row.querySelector("button");
  const bcs = getComputedStyle(btn);
  return {
    pad: cs.padding,
    radius: cs.borderRadius,
    rowText: row.textContent.trim(),
    btnW: Math.round(btn.getBoundingClientRect().width),
    btnH: Math.round(btn.getBoundingClientRect().height),
    btnCursor: bcs.cursor,
    btnBg: bcs.backgroundColor,
    icon: btn.querySelector("svg").getAttribute("class"),
    containerMT: getComputedStyle(document.querySelector("main ul.space-y-2")).marginTop,
  };
});
console.log("[F1-live]", JSON.stringify(f1, null, 1));

// --- F2: the detail page with 2 attachments (create via API) ---
const b64 = Buffer.from("live-verify").toString("base64");
const res = await page.request.post(`${BASE}/api/tickets`, {
  data: {
    title: "S13 live verification ticket",
    category: "other",
    priority: "medium",
    description: "Live re-verification fixture with two attachments.",
    attachments: [
      { fileName: "first.txt", mimeType: "text/plain", sizeBytes: 11, data: b64 },
      { fileName: "second.pdf", mimeType: "application/pdf", sizeBytes: 11, data: b64 },
    ],
  },
});
const { ticket } = await res.json();
await page.goto(`${BASE}/ticketdetails?id=${ticket.id}`);
await page.getByText("S13 live verification ticket").first().waitFor();
await page.waitForTimeout(600);
const f2 = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("main a")].filter((a) => a.getAttribute("href")?.includes("/attachments/"));
  const h3s = [...document.querySelectorAll("main h3")];
  const attachHeading = h3s.find((h) => h.textContent.trim() === "Attachments");
  const descHeading = h3s.find((h) => h.textContent.trim() === "Description");
  return {
    rowCount: rows.length,
    labels: rows.map((r) => r.textContent.trim()),
    rowCls: rows[0]?.className,
    target: rows[0]?.target,
    rel: rows[0]?.rel,
    titleAttr: rows[0]?.getAttribute("title"),
    headingIcon: attachHeading?.querySelector("svg")?.getAttribute("class"),
    headingMB: attachHeading ? getComputedStyle(attachHeading).marginBottom : null,
    descIconW: descHeading?.querySelector("svg") ? getComputedStyle(descHeading.querySelector("svg")).width : null,
  };
});
console.log("[F2-live]", JSON.stringify(f2, null, 1));

// --- F3: the no-comments paragraph ---
const f3 = await page.evaluate(() => {
  const p = [...document.querySelectorAll("p")].find((x) => x.textContent.trim() === "No comments yet");
  const cs = getComputedStyle(p);
  return { color: cs.color, pad: cs.padding };
});
console.log("[F3-live]", JSON.stringify(f3));

// cleanup probe ticket from the dev DB (keep the seed canonical)
await page.request.delete?.(`${BASE}/api/tickets/${ticket.id}`).catch(() => {});
await browser.close();
