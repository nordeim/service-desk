import { expect, test } from "@playwright/test";

// Dashboard (contexts arrive AUTHENTICATED via the setup-project
// storageState): sidebar chrome, quick stats, stat cards, performance
// metrics, and the recent tickets feed.
//
// Superset parity note: the reference highlights the active nav item with a
// cyan→blue gradient only on /dashboard (computed-style verified); the
// reference's own root-path capture showed it flat — we pin the /dashboard
// behavior.

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("renders the sidebar chrome", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "ServiceDesk" })).toBeVisible();
    await expect(page.getByText("IT Support Portal")).toBeVisible();
    await expect(page.getByText("NAVIGATION")).toBeVisible();
    for (const item of ["Dashboard", "Submit Ticket", "My Tickets"]) {
      await expect(
        page.locator('[data-sidebar="menu-button"]', { hasText: item }),
      ).toBeVisible();
    }
  });

  test("renders QUICK STATS with three cards", async ({ page }) => {
    await expect(page.getByText("QUICK STATS")).toBeVisible();
    const stats = page.locator('[data-sidebar="group"]').nth(1);
    await expect(stats.getByText("Open", { exact: true })).toBeVisible();
    await expect(stats.getByText("In Progress", { exact: true })).toBeVisible();
    await expect(stats.getByText("Total", { exact: true })).toBeVisible();
    // The badges (last span of each tinted card) resolve from "…" to digits.
    for (const card of [".bg-amber-50", ".bg-blue-50", ".bg-slate-100"]) {
      const badge = stats.locator(card).locator("span").last();
      await expect(badge).toHaveText(/^\d+$/);
    }
  });

  test("renders the user footer with name, email, and sign out", async ({ page }) => {
    const footer = page.locator('[data-sidebar="footer"]');
    await expect(footer.getByText("Demo User")).toBeVisible();
    await expect(footer.getByText("demo@servicedesk.app")).toBeVisible();
    await expect(footer.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("renders the four stat cards with gradient icon tiles", async ({ page }) => {
    for (const label of ["Total Tickets", "Open", "In Progress", "Resolved"]) {
      await expect(page.locator("p", { hasText: new RegExp(`^${label}$`) })).toBeVisible();
    }
    // Icon tiles exist and carry a gradient background-image.
    const tile = page
      .locator("main .grid > div")
      .first()
      .locator(".rounded-2xl")
      .first();
    await expect(tile).toBeVisible();
    const bg = await tile.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("linear-gradient");
  });

  test("renders Performance Metrics and Recent Tickets stacked full-width", async ({ page }) => {
    await expect(page.getByText("Performance Metrics")).toBeVisible();
    await expect(page.getByText("Recent Tickets")).toBeVisible();
    // Direct children of the max-w-7xl container: [header, stat grid,
    // performance card, recent card, bottom CTA]. Cards 2 and 3 must be
    // full-width and stacked vertically (reference layout).
    const sections = page.locator("main .max-w-7xl > div");
    await expect(sections).toHaveCount(5);
    const perf = sections.nth(2);
    const recent = sections.nth(3);
    const pw = await perf.boundingBox();
    const rw = await recent.boundingBox();
    expect(pw).not.toBeNull();
    expect(rw).not.toBeNull();
    expect(Math.abs((pw?.width ?? 0) - (rw?.width ?? 0))).toBeLessThan(4);
    expect(rw?.y ?? 0).toBeGreaterThan(pw?.y ?? 0); // Recent below Performance
  });

  test("shows the centered View All Tickets CTA at the bottom", async ({ page }) => {
    const cta = page.getByRole("link", { name: /View All Tickets/ });
    await expect(cta).toBeVisible();
  });

  test("signs out via the footer button", async ({ page }) => {
    await page.locator('[data-sidebar="footer"]').getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
  });
});
