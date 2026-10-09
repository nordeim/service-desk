// Independent gradient-rendering probe: logs in through the real UI, then
// screenshots the sidebar's nav button + footer avatar + logo tile via
// Playwright's own pipeline, reporting average region colors.
import { chromium } from "@playwright/test";

const URL = process.env.PROBE_URL ?? "http://localhost:3000/dashboard";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1328, height: 885 } });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("demo@servicedesk.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await page.waitForTimeout(1500);

  const navBox = await page.locator('[data-sidebar="menu-button"]').first().boundingBox();
  const avatarBox = await page
    .locator('[data-sidebar="footer"] .w-10')
    .first()
    .boundingBox();
  const logoBox = await page.locator('[data-sidebar="header"] .w-10').first().boundingBox();

  await page.screenshot({ path: "/tmp/probe-full.png" });
  if (navBox) await page.screenshot({ path: "/tmp/probe-nav.png", clip: navBox });
  if (avatarBox) await page.screenshot({ path: "/tmp/probe-avatar.png", clip: avatarBox });
  if (logoBox) await page.screenshot({ path: "/tmp/probe-logo.png", clip: logoBox });

  console.log(
    JSON.stringify({ navBox, avatarBox, logoBox, saved: ["/tmp/probe-nav.png", "/tmp/probe-avatar.png", "/tmp/probe-logo.png"] }),
  );

  await ctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
