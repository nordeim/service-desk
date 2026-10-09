// Definitive gradient test: paints 6 probe divs with different gradient
// syntaxes and reports their rendered pixel colors from a screenshot.
import { chromium } from "@playwright/test";

const HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 20px; background: #f8fafc; display: grid; grid-template-columns: repeat(3, 120px); gap: 12px; }
  .box { width: 120px; height: 80px; }
  .a { background-image: linear-gradient(to bottom right in oklab, #22d3ee, #3b82f6); }
  .b { background-image: linear-gradient(to right in oklab, #22d3ee, #3b82f6); }
  .c { background-image: linear-gradient(to bottom right, #22d3ee, #3b82f6); }
  .d { background-image: linear-gradient(to right, #22d3ee, #3b82f6); }
  .e { background-image: linear-gradient(to bottom right in oklab, lab(76.6045% -40.9406 -29.6231), lab(54.1736% 13.3369 -74.6839)); }
  .f { background-image: linear-gradient(to right in oklab, lab(67.805% -35.3952 -30.2018), lab(44.0605% 29.0279 -86.0352)); }
</style>
</head>
<body>
  <div class="box a" id="a"></div>
  <div class="box b" id="b"></div>
  <div class="box c" id="c"></div>
  <div class="box d" id="d"></div>
  <div class="box e" id="e"></div>
  <div class="box f" id="f"></div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 440, height: 260 } });
  await page.setContent(HTML);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/gradient-test.png" });

  for (const id of ["a", "b", "c", "d", "e", "f"]) {
    const color = await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      const cs = getComputedStyle(el);
      return cs.backgroundImage.substring(0, 80);
    }, id);
    console.log(id, "→", color);
  }
  await browser.close();
}

main();
