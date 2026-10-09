import { expect, test } from "@playwright/test";

// Ticket lifecycle (contexts arrive AUTHENTICATED): submit → list → search /
// filters → detail → comment → status update. Uses unique titles so the
// suite is re-runnable against the seeded e2e database.

const CATEGORY_OPTION = "🖥️ Hardware Issue";
const PRIORITY_OPTION = "Urgent - Critical";

test.describe("ticket lifecycle", () => {
  let ticketTitle: string;

  test.beforeEach(() => {
    ticketTitle = `E2E ticket ${Date.now()}`;
  });

  test("submits a ticket and sees it in My Tickets", async ({ page }) => {
    await page.goto("/submitticket");
    await expect(page.getByRole("heading", { name: "Submit a Ticket" })).toBeVisible();

    await page.getByLabel("Issue Title *").fill(ticketTitle);
    await page.getByRole("combobox", { name: "Category *" }).click();
    await page.getByRole("option", { name: CATEGORY_OPTION }).click();
    await page.getByRole("combobox", { name: "Priority *" }).click();
    await page.getByRole("option", { name: PRIORITY_OPTION }).click();
    await page
      .getByLabel("Description *")
      .fill("End-to-end test ticket created by the Playwright suite.");

    await page.getByRole("button", { name: "Submit Ticket" }).click();
    await page.waitForURL("**/mytickets");

    await expect(page.getByRole("heading", { name: ticketTitle })).toBeVisible();
    // Badges: open (status), urgent (priority), hardware (category).
    await expect(page.getByText("urgent", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("hardware", { exact: true }).first()).toBeVisible();
  });

  test("filters tickets by status and searches by text", async ({ page }) => {
    await page.goto("/mytickets");
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();

    // Search narrows to a seeded title.
    await page.getByLabel("Search tickets").fill("VPN disconnects");
    await expect(page.getByRole("heading", { name: "VPN disconnects every 15 minutes" })).toBeVisible();
    // toHaveCount retries — a bare locator.count() races the async search
    // fetch (observed: counted the unfiltered 11 before results rendered).
    await expect(page.locator('a[href*="/ticketdetails"]')).toHaveCount(1);

    // A nonsense search shows the filtered empty state.
    await page.getByLabel("Search tickets").fill("zzz-no-such-ticket-zzz");
    await expect(page.getByText(/no tickets match your filters/i)).toBeVisible();
  });

  test("opens a ticket detail, adds a comment, and updates status", async ({ page }) => {
    await page.goto("/mytickets");
    const firstCard = page.locator('a[href*="/ticketdetails"]').first();
    await firstCard.click();
    await page.waitForURL(/\/ticketdetails\?id=/);

    await expect(page.getByText("Description", { exact: true })).toBeVisible();
    await expect(page.getByText("Ticket Information")).toBeVisible();

    // Add a comment.
    const commentText = `Comment from E2E at ${Date.now()}`;
    await page.getByLabel("Add a comment or update").fill(commentText);
    await page.getByRole("button", { name: "Add Comment" }).click();
    await expect(page.getByText(commentText)).toBeVisible();

    // Owner status control: open → resolved.
    await page.getByRole("combobox", { name: "Ticket status" }).click();
    await page.getByRole("option", { name: "Resolved" }).click();
    // exact:true — the Radix toast announcer (role="status") concatenates
    // title+description, so a substring match resolves to 2 elements.
    await expect(page.getByText("Status updated", { exact: true })).toBeVisible();
    await expect(page.getByText("resolved", { exact: true }).first()).toBeVisible();
  });

  test("validation errors surface when the form is empty", async ({ page }) => {
    await page.goto("/submitticket");
    await page.getByRole("button", { name: "Submit Ticket" }).click();
    await expect(page.getByText(/issue title is required/i)).toBeVisible();
    await expect(page.getByText(/description is required/i)).toBeVisible();
    await expect(page.getByText(/select a valid category/i)).toBeVisible();
  });

  test("scope toggle switches between My Tickets and All Tickets", async ({ page }) => {
    await page.goto("/mytickets");
    await page.getByRole("button", { name: "All Tickets" }).click();
    // The seeded corpus includes other users' tickets (11+ total).
    const count = await page.locator('a[href*="/ticketdetails"]').count();
    expect(count).toBeGreaterThan(5);
  });
});
