import { expect, test } from "@playwright/test";

// Visual-parity contracts measured from the LIVE reference app during session 2
// (docs/remediation-plan-session2.md). Every assertion here mirrors a
// computed-style or class-structure fact extracted from the reference DOM —
// they go red until the remediation lands, then stay green as regression pins.

test.describe("sidebar parity", () => {
  test("quick stats rows use the reference gradient rows with shadowed badges", async ({ page }) => {
    await page.goto("/dashboard");

    // Scope to the Quick Stats sidebar group, then resolve each row as the
    // label span's parent div (the row markup: label + value badge).
    const qs = page.locator("[data-sidebar=group]", { hasText: "Quick Stats" });
    const openRow = qs.getByText("Open", { exact: true }).locator("xpath=..");
    const totalRow = qs.getByText("Total", { exact: true }).locator("xpath=..");

    await expect(openRow).toHaveClass(/bg-gradient-to-r/);
    await expect(openRow).toHaveClass(/from-amber-50/);
    await expect(openRow).toHaveClass(/to-orange-50/);
    await expect(openRow).toHaveClass(/border-amber-200\/50/);
    await expect(qs.getByText("Open", { exact: true })).toHaveClass(/text-slate-700/);

    const openBadge = openRow.locator("span").last();
    await expect(openBadge).toHaveText(/^\d+$/);
    await expect(openBadge).toHaveClass(/shadow-md/);
    await expect(openBadge).not.toHaveClass(/tabular-nums/);

    // Total row: slate-50→gray-50 gradient + slate-600 badge.
    await expect(totalRow).toHaveClass(/bg-gradient-to-r/);
    await expect(totalRow).toHaveClass(/from-slate-50/);
    await expect(totalRow).toHaveClass(/to-gray-50/);
    await expect(totalRow).toHaveClass(/border-slate-200\/50/);
    await expect(totalRow.locator("span").last()).toHaveClass(/bg-slate-600/);
  });

  test("sidebar footer carries the reference border and icon size", async ({ page }) => {
    await page.goto("/dashboard");
    const footer = page.locator("[data-sidebar=footer]");
    await expect(footer).toHaveClass(/border-t/);
    await expect(footer).toHaveClass(/border-slate-200\/60/);
    // Sign-out icon is w-4 h-4 in the reference (not w-5).
    await expect(footer.locator("svg.lucide-log-out")).toHaveClass(/w-4/);
  });
});

test.describe("layout chrome parity", () => {
  test("mobile header is not sticky and shows the plain ServiceDesk h1", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/sticky/);
    // Reference brand: a plain text-xl h1 — no logo tile.
    await expect(header.locator("h1")).toHaveClass(/text-xl/);
    await expect(header.locator("h1")).toHaveText("ServiceDesk");
    await expect(header.locator("div.bg-gradient-to-br")).toHaveCount(0);
  });

  test("authenticated pages carry the reference outer gradient wrapper", async ({ page }) => {
    await page.goto("/dashboard");
    const wrapper = page.locator("div.bg-gradient-to-br.from-slate-50");
    // The outer wrapper paints behind the whole app (sidebar + content).
    await expect(wrapper.first()).toHaveClass(/via-white/);
    await expect(wrapper.first()).toHaveClass(/to-slate-100/);
  });

  test("page headings are text-4xl with text-lg subtitles (reference scale)", async ({ page }) => {
    await page.goto("/dashboard");
    const h1 = page.getByRole("heading", { name: /Welcome back/ });
    await expect(h1).toHaveClass(/text-4xl/);
    const sub = page.getByText("Track your support requests");
    await expect(sub).toHaveClass(/text-lg/);
    await expect(sub).toHaveClass(/text-slate-600/);

    await page.goto("/mytickets");
    await expect(page.getByRole("heading", { name: "My Tickets" })).toHaveClass(/text-4xl/);

    await page.goto("/submitticket");
    await expect(page.getByRole("heading", { name: "Submit a Ticket" })).toHaveClass(/text-4xl/);
  });
});

test.describe("dashboard parity", () => {
  test("stat cards use the reference shadow scale and no tabular-nums", async ({ page }) => {
    await page.goto("/dashboard");
    const firstCard = page.locator("main .grid > div", { hasText: "Total Tickets" }).first();
    await expect(firstCard).toHaveClass(/shadow-lg/);
    await expect(firstCard).toHaveClass(/hover:shadow-xl/);
    await expect(firstCard).toHaveClass(/bg-card/);
    await expect(firstCard.getByText(/^\d+$/)).not.toHaveClass(/tabular-nums/);
  });

  test("recent tickets render as flat divide-y rows, not per-row cards", async ({ page }) => {
    await page.goto("/dashboard");
    // The list container is the reference divide-y list.
    const list = page.locator("div.divide-y");
    await expect(list).toHaveCount(1);
    await expect(list).toHaveClass(/divide-slate-100/);

    // Rows: block anchors with the hover gradient, w-12 h-12 tiles, no arrow.
    const row = list.locator("a").first();
    await expect(row).toHaveClass(/block/);
    await expect(row).toHaveClass(/hover:bg-gradient-to-r/);
    await expect(row).toHaveClass(/p-6/);
    await expect(row.locator("div.w-12")).toHaveCount(1);
    await expect(row.locator("svg.lucide-arrow-right")).toHaveCount(0);
    // Titles: font-semibold + truncate (not text-lg font-bold).
    await expect(row.getByRole("heading").first()).toHaveClass(/truncate/);
    await expect(row.getByRole("heading").first()).not.toHaveClass(/text-lg/);
  });

  test("recent tickets card header has the reference bottom border", async ({ page }) => {
    await page.goto("/dashboard");
    // The Recent Tickets header is the only p-6 border-b header on the page.
    const recentHeader = page.locator("main div.p-6.border-b");
    await expect(recentHeader).toHaveCount(1);
    await expect(recentHeader).toHaveClass(/border-b/);
    await expect(recentHeader).toHaveClass(/border-slate-100/);
    await expect(recentHeader).not.toHaveClass(/pb-3/);
  });

  test("View All Tickets CTA matches the reference outline style", async ({ page }) => {
    await page.goto("/dashboard");
    const cta = page.getByRole("link", { name: /View All Tickets/ });
    await expect(cta).toHaveClass(/border-slate-300/);
    await expect(cta).toHaveClass(/hover:border-cyan-500/);
    await expect(cta).toHaveClass(/hover:bg-cyan-50/);
  });
});

test.describe("my tickets parity", () => {
  test("container is max-w-7xl with the reference filter grid", async ({ page }) => {
    await page.goto("/mytickets");
    const container = page.locator("div.max-w-7xl");
    await expect(container).toHaveCount(1);

    const filters = page.locator("div.grid", { has: page.getByLabel("Search tickets") }).first();
    await expect(filters).toHaveClass(/md:grid-cols-3/);
    // Search input has the leading icon inside the field (pl-10).
    const search = page.getByLabel("Search tickets");
    await expect(search).toHaveClass(/pl-10/);
  });

  test("ticket rows keep the reference card style (w-14 tile, arrow, text-lg)", async ({ page }) => {
    await page.goto("/mytickets");
    const row = page.locator('a[href*="/ticketdetails"]').first();
    // TicketCard renders the card div INSIDE the anchor.
    const card = row.locator("div").first();
    await expect(card).toHaveClass(/rounded-xl/);
    await expect(card).toHaveClass(/shadow-lg/);
    await expect(card).toHaveClass(/bg-white/);
    await expect(card.locator("div.w-14")).toHaveCount(1);
    await expect(card.locator("svg.lucide-arrow-right")).toHaveCount(1);
    await expect(card.getByRole("heading").first()).toHaveClass(/text-lg/);
    await expect(card.getByRole("heading").first()).toHaveClass(/font-bold/);
  });
});

test.describe("ticket detail parity", () => {
  test("page uses the reference grid layout with a col-span-2 main column", async ({ page }) => {
    const first = page.locator('a[href*="/ticketdetails"]').first();
    await page.goto("/mytickets");
    await first.click();
    await page.waitForURL(/\/ticketdetails\?id=/);

    const grid = page.locator("div.grid.lg\\:grid-cols-3");
    await expect(grid).toHaveCount(1);
    await expect(page.locator("div.lg\\:col-span-2")).toHaveCount(1);
  });

  test("main ticket card has the reference gradient header with inline badges", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);

    // The ticket card header is the only cyan→blue gradient div inside main.
    const header = page.locator("main div.bg-gradient-to-r");
    await expect(header).toHaveCount(1);
    await expect(header).toHaveClass(/from-cyan-50\/50/);
    await expect(header).toHaveClass(/to-blue-50\/50/);
    await expect(header).toHaveClass(/border-b/);
    await expect(header).toHaveClass(/border-slate-100/);

    // The priority badge includes the word "priority" (reference convention).
    await expect(page.locator("main").getByText(/priority$/).first()).toBeVisible();

    // Status badge is the larger reference treatment (text-sm font-bold).
    const status = page
      .locator("main span")
      .filter({ hasText: /^(open|in progress|resolved|closed)$/ })
      .first();
    await expect(status).toHaveClass(/text-sm/);
    await expect(status).toHaveClass(/font-bold/);
  });

  test("comments carry avatars and the ml-10 indent (reference)", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);

    const comment = page.getByLabel("Add a comment or update");
    await expect(comment).toHaveClass(/min-h-24/);
    // When comments exist, each entry renders the avatar circle and the
    // ml-10-indented body (reference treatment).
    const avatars = page.locator("main div.w-8.h-8");
    const count = await avatars.count();
    if (count > 0) {
      await expect(avatars.first()).toHaveClass(/bg-gradient-to-br/);
      const body = page.locator("main p.ml-10");
      expect(await body.count()).toBeGreaterThan(0);
    }
  });

  test("info panel uses the reference label/value typography", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);

    // The "Created By" value: a text-sm text-slate-900 font-medium email —
    // unique inside main (the sidebar footer email lives outside main).
    const infoValue = page.locator("main p.text-sm").filter({ hasText: /@/ }).first();
    await expect(infoValue).toHaveClass(/text-slate-900/);
    await expect(infoValue).toHaveClass(/font-medium/);
  });

  test("back control uses the reference button style, not a text link", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const back = page.getByRole("link", { name: /Back to Tickets/ });
    await expect(back).toHaveClass(/hover:bg-slate-100/);
    await expect(back).not.toHaveClass(/hover:text-cyan-600/);
  });
});

test.describe("submit ticket parity", () => {
  test("form card uses the reference gradient header treatment", async ({ page }) => {
    await page.goto("/submitticket");
    const cardHeader = page.locator("div.bg-gradient-to-r").filter({ hasText: "Ticket Details" });
    await expect(cardHeader).toHaveCount(1);
    await expect(cardHeader).toHaveClass(/from-cyan-50\/50/);
    await expect(cardHeader).toHaveClass(/border-b/);
    // No white icon tile (reference has a bare icon next to the title).
    await expect(page.locator("div.rounded-full.bg-white")).toHaveCount(0);
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    await expect(back).toHaveClass(/hover:bg-slate-100/);
  });
});

test.describe("login parity", () => {
  test("login card shell matches the reference", async ({ page }) => {
    await page.goto("/login");
    // Reference: max-w-md card, white/95 + backdrop blur, gradient top bar.
    const shell = page.locator("div.max-w-md");
    await expect(shell).toHaveCount(1);
    await expect(page.locator("div.backdrop-blur-sm")).toHaveCount(1);
    await expect(page.locator("div.h-1.bg-gradient-to-r")).toHaveCount(1);
    // Logo is an in-card circle (ring-4 span), not the overlapping dark badge.
    await expect(page.locator("span.ring-4")).toHaveCount(1);
    await expect(page.locator(".-top-10")).toHaveCount(0);
  });
});
