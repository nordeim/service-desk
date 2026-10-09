// Reproduce the avatar dark-blob: test the exact computed gradient string
// (with 0%/100% positions + oklab + lab colors) vs variants.
import { chromium } from "@playwright/test";

const HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 20px; background: #f8fafc; display: grid; grid-template-columns: repeat(2, 120px); gap: 12px; }
  .box { width: 120px; height: 80px; border-radius: 999px; }
  /* exact computed value from the app */
  .a { background-image: linear-gradient(to bottom right in oklab, lab(76.6045 -40.9406 -29.6231) 0%, lab(54.1736 13.3369 -74.6839) 100%); }
  /* same but srgb interpolation */
  .b { background-image: linear-gradient(to bottom right in srgb, lab(76.6045 -40.9406 -29.6231) 0%, lab(54.1736 13.3369 -74.6839) 100%); }
  /* no color space */
  .c { background-image: linear-gradient(to bottom right, lab(76.6045 -40.9406 -29.6231) 0%, lab(54.1736 13.3369 -74.6839) 100%); }
  /* with var indirection like tailwind */
  .d {
    --color-cyan-400: #00d2ef;
    --color-blue-500: #3080ff;
    --tw-gradient-position: to bottom right in oklab;
    --tw-gradient-from: var(--color-cyan-400);
    --tw-gradient-to: var(--color-blue-500);
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
    background-image: linear-gradient(var(--tw-gradient-stops));
  }
</style>
</head>
<body>
  <div class="box a"></div>
  <div class="box b"></div>
  <div class="box c"></div>
  <div class="box d"></div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 300, height: 220 } });
  await page.setContent(HTML);
  await page.waitForTimeout(200);
  await page.screenshot({ path: "/tmp/gradient-test2.png" });
  await browser.close();
  console.log("saved /tmp/gradient-test2.png");
}

main();
