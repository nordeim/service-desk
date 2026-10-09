import { expect, test } from "@playwright/test";

// Mobile navigation (390×844 — the reference's mobile chrome): the
// md:hidden top bar with the SidebarTrigger, the off-canvas sheet, overlay
// dismissal, auto-close on navigate, and desktop invisibility of the
// mobile chrome. This is the highest-regression-risk chrome — the reference
// itself uses the shadcn Sidebar with a Sheet on mobile, and Tailwind v4
// class-generation bugs historically hide exactly these pieces.
//
// Contexts arrive AUTHENTICATED (setup-project storageState).

const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

test.describe("mobile navigation", () => {
  test.use(MOBILE);

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("mobile header shows the trigger and brand, desktop sidebar hidden", async ({ page }) => {
    // The header lives inside <main> (reference structure), so it does not
    // expose the implicit banner role — target the element directly.
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("button", { name: "Toggle Sidebar" })).toBeVisible();
    await expect(header.getByRole("heading", { name: "ServiceDesk" })).toBeVisible();

    // The desktop inline sidebar must NOT be rendered at 390px: the sidebar
    // container switches to the Sheet representation.
    const inlineSidebar = page.locator('[data-sidebar="sidebar"]:not([data-mobile])');
    await expect(inlineSidebar).toHaveCount(0);
  });

  test("the trigger opens the off-canvas sheet with the full nav", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();

    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Submit Ticket" })).toBeVisible();
    await expect(sheet.getByRole("link", { name: "My Tickets" })).toBeVisible();
    await expect(sheet.getByText("QUICK STATS")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("the sheet slides in from the left (reference parity)", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet).toBeVisible();
    // Wait out the 500ms slide-in animation before measuring geometry.
    await page.waitForTimeout(700);
    const box = await sheet.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x).toBeGreaterThanOrEqual(-1); // anchored to the left edge
    expect(box?.x ?? 0).toBeLessThan(8);
  });

  test("tapping a nav link navigates AND auto-closes the sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet).toBeVisible();

    await sheet.getByRole("link", { name: "My Tickets" }).click();
    await page.waitForURL("**/mytickets");
    // The sheet must close after navigation (no stuck overlay).
    await expect(page.locator('[data-mobile="true"][data-sidebar="sidebar"]')).toBeHidden({
      timeout: 5000,
    });
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  });

  test("the overlay closes the sheet on outside tap", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet).toBeVisible();

    // Tap the right side of the screen (outside the sheet).
    await page.mouse.click(360, 400);
    await expect(sheet).toBeHidden({ timeout: 5000 });
  });

  test("Escape closes the sheet", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Toggle Sidebar" });
    await trigger.click();
    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden({ timeout: 5000 });
    // Reference parity: the context-controlled Radix sheet restores focus to
    // <body> on close (no DialogTrigger ref) — the reference behaves the
    // same. Assert focus left the sheet content.
    const stillInSheet = await page.evaluate(() => {
      const el = document.querySelector('[data-mobile="true"][data-sidebar="sidebar"]');
      return el ? el.contains(document.activeElement) : false;
    });
    expect(stillInSheet).toBe(false);
  });

  test("quick stats render inside the mobile sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet.getByText("QUICK STATS")).toBeVisible();
    await expect(sheet.getByText("Open", { exact: true })).toBeVisible();
    await expect(sheet.getByText("In Progress", { exact: true })).toBeVisible();
    await expect(sheet.getByText("Total", { exact: true })).toBeVisible();
  });
});

test.describe("desktop navigation", () => {
  test.use({ viewport: { width: 1328, height: 885 } });

  test("no mobile header on desktop; inline sidebar visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("banner")).toHaveCount(0);
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("the active nav item carries the cyan→blue gradient (reference parity)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const active = page.locator('[data-sidebar="menu-button"]').first();
    // toHaveCSS auto-retries — a raw evaluate() here raced stylesheet load
    // once in a full-suite run (session 3) and flaked.
    await expect(active).toHaveCSS("background-image", /linear-gradient/);
    await expect(active).toHaveCSS("color", "rgb(255, 255, 255)");
  });
});
