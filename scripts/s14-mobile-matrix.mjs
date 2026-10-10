// Session-14 live mobile-nav matrix on OUR clone (production standalone :3000),
// paired with the agent-browser matrix run on the reference this session.
// Mirrors scripts/s13-mobile-matrix.mjs (with its shell-mangled selectors fixed).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@servicedesk.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/dashboard");

// [mobile-at-rest]
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
  // NB: our mobile sidebar content carries data-slot="sidebar" (the s8 probe lesson)
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

// nav-tap auto-close (our E2E-pinned superset)
await page.locator('[data-state=open] [href="/mytickets"]').click();
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

// [s14] the attachment download UX probe — create a fixture ticket with one
// attachment, open the detail page, and inspect the download route's response
// headers (the reference serves CDN files INLINE — no Content-Disposition).
const payload = {
  title: "S14 download-UX probe",
  description: "Probe ticket to compare the attachment download route headers. Safe to close.",
  category: "other",
  priority: "medium",
  attachments: [
    {
      fileName: "s14-probe.txt",
      mimeType: "text/plain",
      sizeBytes: 12,
      data: Buffer.from("s14 probe data").toString("base64"),
    },
  ],
};
const created = await page.request.post(`${BASE}/api/tickets`, { data: payload });
const createdBody = await created.json();
const tid = createdBody.ticket.id;
await page.goto(`${BASE}/ticketdetails?id=${tid}`);
await page.waitForTimeout(1200);

// find the attachment anchor and fetch its href to inspect headers
const attInfo = await page.evaluate(async () => {
  const a = [...document.querySelectorAll("main a")].find((el) =>
    (el.textContent || "").includes("Attachment 1")
  );
  if (!a) return { found: false };
  const res = await fetch(a.getAttribute("href"));
  return {
    found: true,
    status: res.status,
    contentType: res.headers.get("content-type"),
    contentDisposition: res.headers.get("content-disposition"),
    len: (await res.text()).length,
  };
});
console.log("[s14-download-ux]", JSON.stringify(attInfo));

// [s14] the same probe against the reference's live CDN PDF (inline, no disposition)
const refProbe = await page.evaluate(async () => {
  const res = await fetch(
    "https://base44.app/api/apps/690d8ec0e8f00c84332a5ae4/files/mp/public/690d8ec0e8f00c84332a5ae4/0fdf8b94a_s13-second.pdf"
  );
  return {
    status: res.status,
    contentType: res.headers.get("content-type"),
    contentDisposition: res.headers.get("content-disposition"),
  };
});
console.log("[s14-reference-cdn]", JSON.stringify(refProbe));

// clean up the probe ticket — our API has no DELETE (the reference has no
// delete affordance either); scripts/cleanup-s14-tickets.mjs handles it via
// Prisma after this script exits.
console.log("[s14-cleanup]", "run scripts/cleanup-s14-tickets.mjs (no DELETE route)");

await browser.close();
