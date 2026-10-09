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

    // Rows: block anchors with the hover gradient, w-12 h-12 tiles.
    const row = list.locator("a").first();
    await expect(row).toHaveClass(/block/);
    await expect(row).toHaveClass(/hover:bg-gradient-to-r/);
    await expect(row).toHaveClass(/p-6/);
    await expect(row.locator("div.w-12")).toHaveCount(1);
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

  test("login card has no caption below it (reference shows none)", async ({ page }) => {
    await page.goto("/login");
    // The reference renders an empty sm:hidden nbsp div below the card —
    // no visible caption text (session 3).
    await expect(page.getByText("ServiceDesk — IT Support Portal")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Session-3 contracts (docs/remediation-plan-session3.md) — measured from the
// live reference on 2026-10-09: the dashboard recent-row structure (FileText
// tile + title/arrow wrapper + no category badge + date-only dates), lowercase
// badges, entrance animations (rise-in, honoring prefers-reduced-motion),
// submit-form details (circle-alert icon, blue priority value, upload dropzone,
// inline footer with Send icon), the mytickets search icon size, info-panel
// tracking, and the main-element classes.
// ---------------------------------------------------------------------------

test.describe("session 3: recent-row structure", () => {
  test("recent rows use the FileText tile, arrow, no category badge, date-only dates", async ({ page }) => {
    await page.goto("/dashboard");
    const row = page.locator("div.divide-y a").first();
    // FileText icon tile (w-6 h-6 cyan-600) — not the category emoji tile.
    const tile = row.locator("div.w-12");
    const fileIcon = tile.locator("svg.lucide-file-text");
    await expect(fileIcon).toHaveCount(1);
    await expect(fileIcon).toHaveClass(/w-6/);
    await expect(fileIcon).toHaveClass(/text-cyan-600/);
    await expect(tile).not.toHaveClass(/text-2xl/);
    // Title row wrapper with the arrow (reference: flex justify-between mb-2).
    const titleWrap = row.locator("div.flex.items-start.justify-between");
    await expect(titleWrap).toHaveClass(/mb-2/);
    await expect(row.locator("svg.lucide-arrow-right")).toHaveCount(1);
    // No category badge in recent rows (status + priority only).
    await expect(
      row.locator("span").filter({ hasText: /^(hardware|software|network|access|email|other)$/ })
    ).toHaveCount(0);
    // Date is date-only ("Oct 8, 2026") — no time component.
    const date = row.locator("span.text-xs").last();
    await expect(date).toHaveText(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  });
});

test.describe("session 3: badge case", () => {
  test("ticket badges render lowercase (reference convention)", async ({ page }) => {
    await page.goto("/mytickets");
    const card = page.locator('a[href*="/ticketdetails"]').first();
    await expect(
      card.locator("span").filter({ hasText: /^(open|in progress|resolved|closed)$/ }).first()
    ).toBeVisible();
    await expect(
      card.locator("span").filter({ hasText: /^(low|medium|high|urgent)$/ }).first()
    ).toBeVisible();
    await expect(
      card.locator("span").filter({ hasText: /^(hardware|software|network|access|email|other)$/ }).first()
    ).toBeVisible();
    // No capitalized variants anywhere in the card.
    await expect(
      card.locator("span").filter({ hasText: /^(Open|In Progress|Medium|High|Hardware|Software)$/ })
    ).toHaveCount(0);
  });
});

test.describe("session 3: entrance animations", () => {
  test("dashboard stat cards and recent rows carry the rise-in animation", async ({ page }) => {
    await page.goto("/dashboard");
    const firstCard = page.locator("main .grid > div", { hasText: "Total Tickets" }).first();
    await expect(firstCard).toHaveClass(/animate-rise-in/);
    await expect(firstCard).toHaveClass(/motion-reduce:animate-none/);
    await expect(firstCard).toHaveCSS("animation-name", "rise-in");
    // Recent rows animate too (they mount when the tickets arrive).
    const row = page.locator("div.divide-y a").first();
    await expect(row).toHaveClass(/animate-rise-in/);
  });

  test("mytickets cards, submit card, and detail wrapper animate in", async ({ page }) => {
    await page.goto("/mytickets");
    const card = page.locator('a[href*="/ticketdetails"] > div').first();
    await expect(card).toHaveClass(/animate-rise-in/);
    await expect(card).toHaveCSS("animation-name", "rise-in");

    await page.goto("/submitticket");
    await expect(page.locator("form").first()).toHaveClass(/animate-rise-in/);

    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    await expect(page.locator("main div.animate-rise-in").first()).toBeVisible();
  });

  test("entrance animations honor prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard");
    const firstCard = page.locator("main .grid > div", { hasText: "Total Tickets" }).first();
    await expect(firstCard).toHaveCSS("animation-name", "none");
    const row = page.locator("div.divide-y a").first();
    await expect(row).toHaveCSS("animation-name", "none");
  });
});

test.describe("session 3: submit form details", () => {
  test("submit form matches the reference details (icon, blue priority, footer row)", async ({ page }) => {
    await page.goto("/submitticket");
    // Header icon is circle-alert (not info) — reference measured.
    const header = page.locator("div.bg-gradient-to-r").filter({ hasText: "Ticket Details" });
    await expect(header.locator("svg.lucide-circle-alert")).toHaveCount(1);
    await expect(header.locator("svg.lucide-circle-alert")).toHaveClass(/text-cyan-500/);
    // Priority trigger value renders in blue (reference).
    await expect(page.locator("button#priority span.text-blue-600")).toBeVisible();
    // Upload icon is the plain upload arrow in the reference dropzone.
    await expect(page.locator("svg.lucide-upload")).toHaveCount(1);
    const dz = page.locator("div.border-dashed");
    await expect(dz).toHaveClass(/p-6/);
    await expect(dz).not.toHaveClass(/py-8/);
    await expect(dz.locator("label")).toHaveCount(1);
    await expect(page.getByText("Images, PDFs, or documents", { exact: true })).toBeVisible();
    // Footer: inline row with pt-4 inside the body — no border-t card footer.
    await expect(page.locator("div.flex.justify-end.gap-3.pt-4")).toHaveCount(1);
    await expect(page.locator("main .border-t")).toHaveCount(0);
    // Submit button carries the Send icon (mr-2) — session-5 re-CONFIRMED
    // against the actual form button (an earlier session-5 probe had
    // misidentified the sidebar NAV item, which also reads "Submit Ticket"
    // and carries circle-plus; nav items live outside main — scope probes).
    await expect(page.locator('button[type="submit"] svg.lucide-send')).toHaveCount(1);
    await expect(page.locator('button[type="submit"] svg.lucide-send')).toHaveClass(/mr-2/);
  });
});

test.describe("session 3: chrome details", () => {
  test("mytickets search icon is w-5 h-5 (reference size)", async ({ page }) => {
    await page.goto("/mytickets");
    const icon = page.locator("div.relative > svg.lucide-search");
    await expect(icon).toHaveClass(/w-5/);
    await expect(icon).toHaveClass(/h-5/);
  });

  test("info panel labels use tracking-wider (reference, re-measured session 4)", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const label = page.locator("main p.text-xs").filter({ hasText: /^Created By$/ });
    // Session 4 re-measure: the live reference renders tracking-wider on all
    // three info labels (session 3's tracking-wide reading is superseded).
    await expect(label).toHaveClass(/tracking-wider/);
    await expect(label).not.toHaveClass(/tracking-wide(?!r)/);
  });

  test("main element uses the reference classes (transparent, no bg-background)", async ({ page }) => {
    await page.goto("/dashboard");
    const main = page.locator("main");
    await expect(main).toHaveClass(/flex-1/);
    await expect(main).toHaveClass(/flex-col/);
    await expect(main).not.toHaveClass(/bg-background/);
    await expect(main).not.toHaveClass(/relative/);
  });
});

// ---------------------------------------------------------------------------
// Session-4 contracts (docs/remediation-plan-session4.md) — measured from the
// live reference on 2026-10-09: the sidebar nav item structure (inner
// flex wrapper → adjacent icon/label, 20px icons, semibold labels — the
// single biggest parity fix of the project, present since session 1), badge
// shadow + per-surface padding, submit-form labels (semibold slate-700,
// plain-text asterisk), the md:grid-cols-2 form grid, cyan-focus/shadow-sm
// form controls, ghost back buttons, the rounded-lg mobile trigger, the
// Google-logo wrapper, the tracking-wider revert, and the designed 404 page.
// ---------------------------------------------------------------------------

test.describe("session 4: sidebar nav structure", () => {
  test("nav items wrap icon+label in the reference flex row (adjacent, not pushed right)", async ({ page }) => {
    await page.goto("/dashboard");
    // Scope to the DESKTOP sidebar — the hidden mobile sheet renders its own copy.
    const nav = page.locator('[data-sidebar="sidebar"]:not([data-mobile]) [data-sidebar="menu"]');
    await expect(nav.locator("a")).toHaveCount(3);

    for (const link of await nav.locator("a").all()) {
      // The reference structure: anchor > ONE wrapper child > svg + span.
      const wrapper = link.locator("> div, > span").first();
      await expect(wrapper).toHaveClass(/flex/);
      await expect(wrapper).toHaveClass(/items-center/);
      await expect(wrapper).toHaveClass(/gap-3/);
      // The svg lives INSIDE the wrapper (shielded from the button base's
      // [&>svg]:size-4 direct-child selector → keeps its w-5 h-5 = 20px).
      const icon = wrapper.locator("svg").first();
      await expect(icon).toHaveClass(/w-5/);
      await expect(icon).toHaveClass(/h-5/);
      // Label span is semibold (reference: font-semibold).
      const label = wrapper.locator("span").first();
      await expect(label).toHaveClass(/font-semibold/);
    }

    // Live geometry: the label starts within 16px of the icon's right edge
    // (reference: 12px gap; the pre-fix bug pushed it ~132px to the edge).
    const first = nav.locator("a").first();
    const iconBox = await first.locator("svg").first().boundingBox();
    const labelBox = await first.locator("span").first().boundingBox();
    expect(iconBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    const gap = labelBox!.x - (iconBox!.x + iconBox!.width);
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThanOrEqual(16);
  });

  test("nav icons render at the reference 20px size", async ({ page }) => {
    await page.goto("/dashboard");
    const icon = page.locator('[data-sidebar="sidebar"]:not([data-mobile]) [data-sidebar="menu"] a svg').first();
    // w-5 h-5 = 20px once the wrapper shields it from [&>svg]:size-4.
    await expect(icon).toHaveCSS("width", "20px");
    await expect(icon).toHaveCSS("height", "20px");
  });

  test("active nav item carries the reference hover gradient", async ({ page }) => {
    await page.goto("/dashboard");
    const active = page.locator('[data-sidebar="sidebar"]:not([data-mobile]) [data-sidebar="menu"] a').first();
    await expect(active).toHaveClass(/bg-gradient-to-r/);
    await expect(active).toHaveClass(/from-cyan-500/);
    // Reference: the active item hovers to the light cyan-blue gradient.
    await expect(active).toHaveClass(/hover:bg-gradient-to-r/);
    await expect(active).toHaveClass(/hover:from-cyan-50/);
    await expect(active).toHaveClass(/hover:to-blue-50/);
  });

  test("mobile sheet nav uses the same wrapper structure", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
    await expect(sheet).toBeVisible();
    const link = sheet.locator("a").first();
    const wrapper = link.locator("> div, > span").first();
    await expect(wrapper).toHaveClass(/gap-3/);
    await expect(wrapper.locator("span").first()).toHaveClass(/font-semibold/);
  });
});

test.describe("session 4: badges", () => {
  test("status and priority badges carry the reference shadow", async ({ page }) => {
    await page.goto("/mytickets");
    const card = page.locator('a[href*="/ticketdetails"]').first();
    const status = card.locator("span").filter({ hasText: /^(open|in progress|resolved|closed)$/ }).first();
    await expect(status).toHaveClass(/shadow(?!-)/);
    await expect(status).toHaveClass(/hover:bg-primary\/80/);
    const priority = card.locator("span").filter({ hasText: /^(low|medium|high|urgent)$/ }).first();
    await expect(priority).toHaveClass(/shadow(?!-)/);
  });

  test("dashboard recent-row badges use the compact reference padding", async ({ page }) => {
    await page.goto("/dashboard");
    const row = page.locator("div.divide-y a").first();
    const status = row.locator("span").filter({ hasText: /^(open|in progress|resolved|closed)$/ }).first();
    await expect(status).toHaveClass(/px-2\.5/);
    await expect(status).not.toHaveClass(/px-3(?!\.)/);
    const priority = row.locator("span").filter({ hasText: /^(low|medium|high|urgent)$/ }).first();
    await expect(priority).toHaveClass(/py-0\.5/);
  });

  test("detail page: status badge large, priority badge compact (reference)", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const status = page
      .locator("main span")
      .filter({ hasText: /^(open|in progress|resolved|closed)$/ })
      .first();
    await expect(status).toHaveClass(/text-sm/);
    await expect(status).toHaveClass(/px-3/);
    const priority = page.locator("main span").filter({ hasText: / priority$/ }).first();
    await expect(priority).toHaveClass(/px-2\.5/);
    await expect(priority).not.toHaveClass(/px-3(?!\.)/);
  });
});

test.describe("session 4: submit form details", () => {
  test("form labels are semibold slate-700 with a plain-text asterisk", async ({ page }) => {
    await page.goto("/submitticket");
    const title = page.locator("label[for='title']");
    await expect(title).toHaveClass(/text-slate-700/);
    await expect(title).toHaveClass(/font-semibold/);
    // The asterisk is plain text (reference) — no red span inside any label.
    await expect(page.locator("form label span.text-red-500")).toHaveCount(0);
    await expect(title).toHaveText(/Issue Title \*$/);
  });

  test("category and priority sit in the reference md:grid-cols-2 gap-6 grid", async ({ page }) => {
    await page.goto("/submitticket");
    // The category/priority grid is the only div.grid inside the form.
    const grid = page.locator("form div.grid");
    await expect(grid).toHaveCount(1);
    await expect(grid).toHaveClass(/md:grid-cols-2/);
    await expect(grid).toHaveClass(/gap-6/);
  });

  test("form controls use the reference shadow-xs + select/textarea cyan border focus (session-6 supersede)", async ({ page }) => {
    await page.goto("/submitticket");
    const title = page.locator("input#title");
    await expect(title).toHaveClass(/border-slate-300/);
    // Session-6 computed supersede: the reference's cyan focus customs are
    // INERT on text inputs (its focused title input renders a 1px near-black
    // ring + unchanged slate-300 border) — pinned in the session-6 block.
    await expect(title).not.toHaveClass(/focus:border-cyan-500/);
    await expect(title).toHaveClass(/shadow-xs/);
    const category = page.locator("button#category");
    await expect(category).toHaveClass(/shadow-xs/);
    await expect(category).toHaveClass(/focus:border-cyan-500/);
  });

  test("back buttons are the reference ghost variant (borderless at rest)", async ({ page }) => {
    await page.goto("/submitticket");
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    await expect(back).toHaveClass(/hover:bg-slate-100/);
    // Ghost: no border, no background at rest (the outline variant had both).
    await expect(back).not.toHaveClass(/border(?!-)/);
    await expect(back).not.toHaveClass(/bg-background/);

    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const backDetail = page.getByRole("link", { name: /Back to Tickets/ });
    await expect(backDetail).not.toHaveClass(/border(?!-)/);
  });
});

test.describe("session 4: mytickets + comment controls", () => {
  test("search input and filters use shadow-xs + transparent bg (reference)", async ({ page }) => {
    await page.goto("/mytickets");
    const search = page.getByLabel("Search tickets");
    await expect(search).toHaveClass(/shadow-xs/);
    await expect(search).toHaveClass(/bg-transparent/);
    await expect(search).not.toHaveClass(/bg-white/);
    const filter = page.getByRole("combobox").first();
    await expect(filter).toHaveClass(/shadow-xs/);
  });

  test("comment textarea carries shadow-xs (reference)", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const textarea = page.getByLabel("Add a comment or update");
    await expect(textarea).toHaveClass(/shadow-xs/);
  });
});

test.describe("session 4: chrome details", () => {
  test("mobile sidebar trigger is rounded-lg with the slate hover (reference)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    const trigger = page.locator("header button[data-sidebar='trigger']");
    await expect(trigger).toHaveClass(/rounded-lg/);
    await expect(trigger).toHaveClass(/hover:bg-slate-100/);
    // The light-mode hover:bg-accent from the ghost base is overridden; the
    // dark-mode variant (dark:hover:bg-accent/50) is a different utility and
    // survives tw-merge — the lookbehind excludes it.
    await expect(trigger).not.toHaveClass(/(?<!dark:)hover:bg-accent(?!-)/);
  });

  test("login Google logo sits in the reference -ml-4 wrapper", async ({ page }) => {
    await page.goto("/login");
    const wrapper = page.locator("button").filter({ hasText: /Continue with Google/ }).locator("> div").first();
    await expect(wrapper).toHaveClass(/-ml-4/);
    await expect(wrapper).toHaveClass(/transition-transform/);
  });
});

test.describe("session 4: 404 page", () => {
  test("unmatched routes render the reference-designed 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
    await expect(page.getByText(/could not be found/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Go Home/ })).toBeVisible();
    // The reference typography: text-7xl font-light slate-300.
    await expect(page.getByRole("heading", { name: "404" })).toHaveClass(/text-7xl/);
    await expect(page.getByRole("heading", { name: "404" })).toHaveClass(/font-light/);
  });
});

test.describe("session 5: quick-stat badges", () => {
  test("quick-stat value badges carry the reference hover:bg-primary/80", async ({ page }) => {
    await page.goto("/dashboard");
    // The three sidebar quick-stat value badges (Open/In Progress/Total).
    for (const sel of ["bg-amber-500", "bg-blue-500", "bg-slate-600"]) {
      const badge = page.locator(`[data-sidebar="sidebar"] [class*="${sel}"]`);
      await expect(badge).toHaveClass(/hover:bg-primary\/80/);
    }
  });
});

test.describe("session 5: icon-button padding (reference px-4)", () => {
  // Session-5 headline: the vendored Button base's `has-[>svg]:px-3` shrank
  // every direct-svg button to 12px horizontal padding; the reference's old
  // shadcn base renders px-4 (16px) for icon+text buttons.
  test("submit-page back button renders 16px horizontal padding", async ({ page }) => {
    await page.goto("/submitticket");
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    await expect(back).toHaveCSS("padding-left", "16px");
    await expect(back).toHaveCSS("padding-right", "16px");
  });

  test("dashboard CTA (View All Tickets) renders 16px horizontal padding", async ({ page }) => {
    await page.goto("/dashboard");
    const cta = page.getByRole("link", { name: /View All Tickets/ });
    await expect(cta).toHaveCSS("padding-left", "16px");
  });

  test("dashboard Report New Issue renders 16px horizontal padding", async ({ page }) => {
    await page.goto("/dashboard");
    const cta = page.getByRole("link", { name: /Report New Issue/ });
    await expect(cta).toHaveCSS("padding-left", "16px");
  });

  test("detail-page Add Comment renders 16px horizontal padding", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const btn = page.getByRole("button", { name: /Add Comment/ });
    await expect(btn).toHaveCSS("padding-left", "16px");
  });

  test("submit-page Submit Ticket button renders 16px horizontal padding", async ({ page }) => {
    await page.goto("/submitticket");
    const btn = page.getByRole("button", { name: /Submit Ticket/, exact: true });
    await expect(btn).toHaveCSS("padding-left", "16px");
  });
});

test.describe("session 5: outline button shadow", () => {
  test("outline CTA computes the reference (v3-name) shadow value", async ({ page }) => {
    await page.goto("/dashboard");
    const cta = page.getByRole("link", { name: /View All Tickets/ });
    // Session-5 computed re-measure: the reference's outline `shadow-sm` is a
    // Tailwind v3 class name — it COMPUTES to the light 0 1px 2px 0px / 0.05
    // single layer (= `shadow-xs` on the v4 scale). Parity is the value.
    await expect(cta).toHaveCSS(
      "box-shadow",
      /rgba\(0, 0, 0, 0\.05\) 0px 1px 2px 0px/
    );
  });
});

test.describe("session 5: 404 focus contract", () => {
  test("Go Home carries the reference focus ring + 200ms transition", async ({ page }) => {
    await page.goto("/no-such-page-s5");
    const goHome = page.getByRole("link", { name: /Go Home/ });
    await expect(goHome).toHaveClass(/focus:ring-2/);
    await expect(goHome).toHaveClass(/focus:ring-offset-2/);
    await expect(goHome).toHaveClass(/focus:ring-slate-500/);
    await expect(goHome).toHaveClass(/duration-200/);
  });
});

test.describe("session 5: v3/v4 shadow-scale trap", () => {
  // The reference's `shadow-sm` (Tailwind v3 name) computes to the light
  // 0 1px 2px/0.05 step — which is `shadow-xs` on the Tailwind v4 scale.
  // These tests pin the COMPUTED values so the naming trap never regresses.
  test("mobile header computes the reference light shadow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    const header = page.locator("header").first();
    await expect(header).toHaveCSS(
      "box-shadow",
      /rgba\(0, 0, 0, 0\.05\) 0px 1px 2px 0px/
    );
  });

  test("login sign-in button computes the reference light shadow", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByRole("button", { name: /^Sign in$/, exact: true });
    await expect(btn).toHaveCSS(
      "box-shadow",
      /rgba\(0, 0, 0, 0\.05\) 0px 1px 2px 0px/
    );
  });

  test("login Google button hovers to the light shadow (v3-name trap)", async ({ page }) => {
    await page.goto("/login");
    const google = page.getByRole("button", { name: /Continue with Google/ });
    await expect(google).toHaveClass(/hover:shadow-xs/);
    await expect(google).not.toHaveClass(/(?<!hover:shadow-x)hover:shadow-sm(?!-)/);
  });
});

test.describe("session 5: typography (font family)", () => {
  // Session-5 computed finding: the reference loads NO webfont — its body
  // computes Tailwind's default system stack. The next/font Inter was an
  // unmeasured session-1 assumption and a real family-level divergence
  // (~10% text-width deltas on button labels).
  test("body renders the reference system font stack (no Inter webfont)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toHaveCSS(
      "font-family",
      /^ui-sans-serif, system-ui, sans-serif/
    );
    await expect(page.locator("body")).not.toHaveCSS("font-family", /Inter/);
  });

  test("body text smoothing matches the reference (auto, not antialiased)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toHaveCSS("-webkit-font-smoothing", "auto");
  });
});

test.describe("session 5: icon contracts", () => {
  // Reference icon inventory (live-measured this session):
  //   back buttons + Add Comment carry `mr-2` on the svg; the View All CTA
  //   arrow slides translate-x-1; the submit button's icon is CirclePlus w-5
  //   (session 3 misattributed the comment button's Send icon to it).
  test("back-button arrows carry the reference mr-2", async ({ page }) => {
    await page.goto("/submitticket");
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    await expect(back.locator("svg")).toHaveClass(/mr-2/);
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const back2 = page.getByRole("link", { name: /Back to Tickets/ });
    await expect(back2.locator("svg")).toHaveClass(/mr-2/);
  });

  test("Add Comment svg carries the reference mr-2", async ({ page }) => {
    await page.goto("/mytickets");
    await page.locator('a[href*="/ticketdetails"]').first().click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    const btn = page.getByRole("button", { name: /Add Comment/ });
    await expect(btn.locator("svg")).toHaveClass(/mr-2/);
  });

  test("View All CTA arrow slides translate-x-1 (reference)", async ({ page }) => {
    await page.goto("/dashboard");
    const cta = page.getByRole("link", { name: /View All Tickets/ });
    await expect(cta.locator("svg")).toHaveClass(/group-hover:translate-x-1(?!-)/);
    await expect(cta.locator("svg")).not.toHaveClass(/translate-x-0\.5/);
  });

  test("submit button icon is the reference Send w-4 mr-2 (form button, not the nav item)", async ({ page }) => {
    await page.goto("/submitticket");
    // Scope to the FORM button — the sidebar nav link also reads "Submit
    // Ticket" (circle-plus w-5) and lives outside main. Parity target: the
    // form's submit control: Send w-4 h-4 mr-2.
    const btn = page.locator("form button[type='submit']");
    await expect(btn.locator("svg")).toHaveClass(/lucide-send/);
    await expect(btn.locator("svg")).toHaveClass(/w-4/);
    await expect(btn.locator("svg")).toHaveClass(/mr-2/);
    await expect(btn.locator("svg")).not.toHaveClass(/lucide-circle-plus/);
  });
});

// ---------------------------------------------------------------------------
// Session 6 (docs/remediation-plan-session6.md)
// New probe surfaces: the radius SCALE (never probed in sessions 1-5 — the
// shadcn v4 calc chain rendered every rounded control +2px vs the reference's
// Tailwind v3 defaults), focus-visible interaction states (computed), select
// dropdown open states, and the login signup-line structure.
// ---------------------------------------------------------------------------

test.describe("session 6: radius scale (reference v3 defaults)", () => {
  // Reference computed: rounded-sm=2px, rounded-md=6px, rounded-lg=8px,
  // rounded-xl=12px. Our shadcn v4 calc chain (--radius: 0.625rem) rendered
  // 6/8/10/14px — +2px on every rounded control (class names identical).
  test("stat cards render rounded-xl at the reference 12px", async ({ page }) => {
    await page.goto("/dashboard");
    const card = page.locator("main div.rounded-xl").first();
    await expect(card).toHaveCSS("border-radius", "12px");
  });

  test("buttons and badges render rounded-md at the reference 6px", async ({ page }) => {
    await page.goto("/submitticket");
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    await expect(back).toHaveCSS("border-radius", "6px");
    await page.goto("/dashboard");
    // The first badge inside the recent-tickets card body (status badge).
    const badge = page.locator("main span.rounded-md").first();
    await expect(badge).toHaveCSS("border-radius", "6px");
  });

  test("the mobile SidebarTrigger renders rounded-lg at the reference 8px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    const trigger = page.locator("header button").first();
    await expect(trigger).toHaveCSS("border-radius", "8px");
  });

  // Session-7 supersede: the reference's rounded-sm now computes 4px (their
  // build drifted; re-measured live — only rounded-sm differs between the
  // v3 and v4 scales: v3 rounded (4px) became v4 rounded-sm). See the
  // session-7 radius note in AGENTS.md and remediation-plan-session7.md §1.B.
  test("select options render rounded-sm at the reference 4px (session-7 re-measure)", async ({ page }) => {
    await page.goto("/submitticket");
    await page.locator("button#category").click();
    const option = page.getByRole("option").first();
    await expect(option).toHaveCSS("border-radius", "4px");
  });
});

test.describe("session 6: login footer + Google button", () => {
  // Reference: the whole "Need an account? Sign up" line is ONE control —
  // `text-sm text-slate-500 hover:text-slate-700 transition-colors` with an
  // inner `font-medium text-slate-700` span. Ours split it across a <p> and
  // an inner link (hover darkened only "Sign up", to slate-900).
  // Session 10 supersede: the reference's control is a BUTTON that swaps
  // the card to the in-card signup view (measured live) — ours became a
  // button too (same classes); the standalone /signup page remains as the
  // URL superset.
  test("the signup line is one control with the reference whole-line hover", async ({ page }) => {
    await page.goto("/login");
    const line = page.getByRole("button", { name: /Need an account\?\s*Sign up/ });
    await expect(line).toHaveCount(1);
    await expect(line).toHaveText(/Need an account\?\s*Sign up/);
    await expect(line).toHaveClass(/text-sm/);
    await expect(line).toHaveClass(/text-slate-500/);
    await expect(line).toHaveClass(/hover:text-slate-700/);
    await expect(line).toHaveClass(/transition-colors/);
    const span = line.locator("span");
    await expect(span).toHaveText("Sign up");
    await expect(span).toHaveClass(/font-medium/);
    await expect(span).toHaveClass(/text-slate-700/);
  });

  // Reference: the Google button is a raw custom button — NO at-rest shadow
  // (computed none). Ours inherited `shadow-xs` from the outline variant base.
  test("Google button renders no at-rest shadow (reference: none)", async ({ page }) => {
    await page.goto("/login");
    const google = page.getByRole("button", { name: /Continue with Google/ });
    const shadow = await google.evaluate((el) => getComputedStyle(el).boxShadow);
    // No visible layer: the pre-fix value carried rgba(0, 0, 0, 0.05) 0 1px 2px.
    expect(shadow).not.toContain("rgba(0, 0, 0, 0.05)");
    expect(shadow).not.toMatch(/rgba\(0, 0, 0, 0\.0[1-9]\)/);
  });
});

test.describe("session 6: select dropdown structure + colors", () => {
  // Reference option content: <span class="flex items-center gap-2">
  //   <span>🖥️</span>Hardware Issue</span> — the emoji isolated in its own
  // span with an 8px gap; ours was a single "emoji space label" text node.
  test("category options wrap the emoji in the reference flex gap-2 span", async ({ page }) => {
    await page.goto("/submitticket");
    await page.locator("button#category").click();
    const option = page.getByRole("option").first();
    const wrapper = option.locator("span.flex.items-center.gap-2");
    await expect(wrapper).toHaveCount(1);
    await expect(wrapper.locator("span").first()).toHaveText("🖥️");
    await expect(option).toHaveText(/🖥️Hardware Issue/);
    await expect(option).not.toHaveText(/🖥️\s*🖥️/);
  });

  // Session-6 bug: selecting a category rendered "🖥️🖥️ Hardware Issue" —
  // CATEGORY_EMOJI + a label that already contained the emoji.
  test("category trigger renders exactly one emoji after selection", async ({ page }) => {
    await page.goto("/submitticket");
    await page.locator("button#category").click();
    await page.getByRole("option").first().click();
    const trigger = page.locator("button#category");
    await expect(trigger).toHaveText(/🖥️Hardware Issue/);
    await expect(trigger).not.toHaveText(/🖥️\s*🖥️/);
  });

  // Reference priority options are color-coded (measured):
  // low=slate-600, medium=blue-600, high=orange-600, urgent=red-600.
  test("priority options carry the reference per-priority colors", async ({ page }) => {
    await page.goto("/submitticket");
    await page.locator("button#priority").click();
    const expected: Record<string, string> = {
      "Low - Can wait": "text-slate-600",
      "Medium - Normal": "text-blue-600",
      "High - Important": "text-orange-600",
      "Urgent - Critical": "text-red-600",
    };
    for (const [label, cls] of Object.entries(expected)) {
      const option = page.getByRole("option", { name: label, exact: true });
      // The first span is the check-icon indicator container — the label
      // span is the one carrying the text-* color class.
      await expect(option.locator("span[class*='text-']").first()).toHaveClass(new RegExp(cls));
    }
  });

  // Session-6: the reference trigger renders the SELECTED priority's color
  // (select High → text-orange-600). Session-3's blue pin was measured at the
  // Medium default — correct at rest, incomplete for other values.
  test("priority trigger renders the selected priority's color", async ({ page }) => {
    await page.goto("/submitticket");
    await page.locator("button#priority").click();
    await page.getByRole("option", { name: "High - Important", exact: true }).click();
    const value = page.locator("button#priority span span");
    await expect(value.first()).toHaveClass(/text-orange-600/);
    await page.locator("button#priority").click();
    await page.getByRole("option", { name: "Urgent - Critical", exact: true }).click();
    await expect(page.locator("button#priority span span").first()).toHaveClass(/text-red-600/);
  });
});

// Color-representation note: Tailwind v4 emits palette colors as lab()
// functions (slate-400 renders `lab(65.5349 -2.25151 -14.5072)`, not
// rgb(148,163,184)) — the same visible color in a different representation
// (tokens authored as literal hex, like --ring #0a0a0a, stay rgb). The
// session-6 pins accept either representation; both are deterministic.
const ACCEPT: Record<string, string[]> = {
  slate300: ["#cbd5e1", "rgb(203, 213, 225)", "lab(84.7652 -1.94535 -7.93337)"],
  slate400: ["#94a3b8", "rgb(148, 163, 184)", "lab(65.5349 -2.25151 -14.5072)"],
  cyan500: ["#06b6d4", "rgb(6, 182, 212)", "lab(67.805 -35.3952 -30.2018)"],
  white: ["#ffffff", "rgb(255, 255, 255)"],
};
const colorIs = (actual: string, key: keyof typeof ACCEPT) =>
  ACCEPT[key].includes(actual);
// Anchored regex for auto-retrying toHaveCSS (colors transition over 150 ms —
// a one-shot evaluate can catch the interpolation mid-flight).
const colorRegex = (key: keyof typeof ACCEPT) =>
  new RegExp(`^(${ACCEPT[key].map((c) => c.replace(/[()]/g, "\\$&")).join("|")})$`);

test.describe("session 6: focus states (reference computed)", () => {
  // Reference ground truth (live-measured, both sites):
  //   app text inputs  -> 1px near-black ring (rgb(10,10,10)), border UNCHANGED
  //     (their `focus:border-cyan-500 focus:ring-cyan-500` customs are inert)
  //   textarea         -> 1px near-black ring + CYAN border (border custom active)
  //   select trigger   -> 1px CYAN ring + cyan border (customs active)
  //   buttons          -> 1px near-black ring, border unchanged
  //   auth inputs      -> 2px slate-400 ring + 2px white offset + slate-400
  //     border + NO at-rest shadow (their older input generation has none)
  test("app inputs focus to the reference 1px near-black ring, border unchanged", async ({ page }) => {
    await page.goto("/submitticket");
    const title = page.locator("input#title");
    const before = await title.evaluate((el) => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillStyle = getComputedStyle(el).borderColor;
      return ctx.fillStyle as string;
    });
    await title.click();
    await expect(title).toHaveCSS("box-shadow", /0px 0px 0px 1px/);
    const ringColor = await title.evaluate((el) => {
      const raw = getComputedStyle(el).boxShadow;
      const m = raw.match(/(lab|oklch|rgb|rgba|hsl)\([^)]+\) 0px 0px 0px 1px/);
      if (!m) return "NO RING LAYER: " + raw;
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillStyle = m[0].split(" 0px")[0];
      return ctx.fillStyle as string;
    });
    expect(ringColor).toBe("#0a0a0a"); // near-black --ring (session 6)
    // Border UNCHANGED on focus — expect.poll rides out the 150 ms
    // transition-colors fade (a one-shot evaluate catches it mid-flight).
    await expect
      .poll(() => title.evaluate((el) => getComputedStyle(el).borderColor))
      .toBe(before);
    await expect(title).toHaveCSS("border-color", colorRegex("slate300"));
  });

  test("app inputs drop the inert cyan focus customs (session-4 supersede)", async ({ page }) => {
    await page.goto("/submitticket");
    const title = page.locator("input#title");
    await expect(title).not.toHaveClass(/focus:border-cyan-500/);
    await expect(title).not.toHaveClass(/focus:ring-cyan-500/);
    // The selects + textarea customs ARE active on the reference — kept.
    const category = page.locator("button#category");
    await expect(category).toHaveClass(/focus:border-cyan-500/);
    await expect(category).toHaveClass(/focus:ring-cyan-500/);
    const description = page.locator("textarea#description");
    await expect(description).toHaveClass(/focus:border-cyan-500/);
    await expect(description).not.toHaveClass(/focus:ring-cyan-500/);
  });

  test("the description textarea focuses to a near-black ring with the cyan border", async ({ page }) => {
    await page.goto("/submitticket");
    const description = page.locator("textarea#description");
    await description.click();
    await expect(description).toHaveCSS("box-shadow", /0px 0px 0px 1px/);
    await expect(description).toHaveCSS("border-color", colorRegex("cyan500")); // cyan border (custom active on ref)
  });

  test("select triggers focus to the reference cyan ring", async ({ page }) => {
    await page.goto("/submitticket");
    const category = page.locator("button#category");
    // .focus() not .click(): our Radix generation moves focus INTO the open
    // dropdown, so a click-assertion races the focus hand-off. The base
    // `focus:ring-1` is plain-focus scoped (reference parity) — applies to
    // programmatic focus too.
    await category.focus();
    await expect(category).toHaveCSS("box-shadow", /0px 0px 0px 1px/);
    await expect(category).toHaveCSS("border-color", colorRegex("cyan500"));
  });

  test("buttons keyboard-focus to the reference 1px near-black ring", async ({ page }) => {
    await page.goto("/submitticket");
    // Real keyboard events so :focus-visible matches (buttons need keyboard
    // interaction). NB: check activeElement ITSELF — the BODY's textContent
    // contains the whole page (including "Back to Dashboard").
    for (let i = 0; i < 20; i++) {
      const hit = await page.evaluate(() => {
        const a = document.activeElement;
        return (
          a instanceof HTMLAnchorElement &&
          !!a.textContent?.includes("Back to Dashboard")
        );
      });
      if (hit) break;
      await page.keyboard.press("Tab");
    }
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    const shadow = await back.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("0px 0px 0px 1px");
    const focused = await back.evaluate((el) => el.matches(":focus-visible"));
    expect(focused).toBe(true);
    const ringColor = await back.evaluate((el) => {
      const raw = getComputedStyle(el).boxShadow;
      const m = raw.match(/(lab|oklch|rgb|rgba|hsl)\([^)]+\) 0px 0px 0px 1px/);
      if (!m) return "NO RING LAYER: " + raw;
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillStyle = m[0].split(" 0px")[0];
      return ctx.fillStyle as string;
    });
    expect(ringColor).toBe("#0a0a0a");
    // The ghost back button's border stays borderless (no border change).
    await expect(back).toHaveCSS("border-top-width", "0px");
  });

  test("auth inputs render no at-rest shadow (reference auth generation)", async ({ page }) => {
    await page.goto("/login");
    const email = page.locator('input[type="email"]');
    const shadow = await email.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toContain("rgba(0, 0, 0, 0.05)");
  });

  test("auth inputs focus to the reference 2px slate-400 ring + white offset", async ({ page }) => {
    await page.goto("/login");
    const email = page.locator('input[type="email"]');
    await email.click();
    // 2px white offset + 2px slate-400 ring (offset+ring => spread 4px).
    await expect(email).toHaveCSS("box-shadow", /0px 0px 0px 2px.*0px 0px 0px 4px/);
    const layers = await email.evaluate((el) =>
      (getComputedStyle(el).boxShadow.match(/(lab|oklch|rgb|rgba|hsl)\([^)]+\)/g) ?? [])
    );
    // The offset layer is white; the ring layer is slate-400.
    expect(layers.some((c) => colorIs(c, "white"))).toBe(true);
    expect(layers.some((c) => colorIs(c, "slate400"))).toBe(true);
    await expect(email).toHaveCSS("border-color", colorRegex("slate400")); // custom active
  });
});

// ---------------------------------------------------------------------------
// Session 7 — accent tokens, empty states, resilience, favicon, titles.
// Inventory + evidence: docs/remediation-plan-session7.md.
// ---------------------------------------------------------------------------

// Literal-hex tokens render as rgb() (the lab() pipeline applies to palette
// utilities, not to :root literal hex) — the reference's accent pair measures
// rgb(245,245,245) bg + rgb(23,23,23) text on the highlighted option.
const ACCEPT7: Record<string, string[]> = {
  accentGray: ["#f5f5f5", "rgb(245, 245, 245)"],
  accentFg: ["#171717", "rgb(23, 23, 23)"],
};
const colorRegex7 = (key: keyof typeof ACCEPT7) =>
  new RegExp(`^(${ACCEPT7[key].map((c) => c.replace(/[()]/g, "\\$&")).join("|")})$`);

test.describe("session 7: accent tokens (reference computed)", () => {
  // Reference: --accent hsl(0 0% 96.1%) = #f5f5f5, --accent-foreground
  // hsl(0 0% 9%) = #171717 (the stock shadcn light pair — live-measured on
  // their :root). Ours carried cyan-50/cyan-700 (a session-1 theme choice
  // never measured): every dropdown highlight, ghost/outline hover text, and
  // the Skeleton rendered cyan-tinted.
  test("select options highlight to the reference gray + near-black", async ({ page }) => {
    await page.goto("/submitticket");
    await page.locator("button#category").click();
    // The first option is keyboard-highlighted when the dropdown opens
    // (Radix highlights it automatically — verified live on both sites).
    const option = page.getByRole("option").first();
    await expect(option).toHaveCSS("background-color", colorRegex7("accentGray"));
    await expect(option).toHaveCSS("color", colorRegex7("accentFg"));
  });

  // Hover pins run under Playwright's Desktop Chrome (hover:hover — a real
  // mouse context). Under hover:none (agent-browser's browser, touch devices)
  // every Tailwind v4 hover: rule is inert — see AGENTS.md session-7 note.
  test("CTA hover renders the reference near-black text (accent-foreground)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("main a:has-text('View All Tickets')");
    // Wait for the recent list to settle before hovering: the async fetch
    // replaces skeletons with taller rows, shifting the CTA down — a hover
    // issued mid-load can leave the mouse off-element (found in the batch
    // run; isolated runs passed). Also wait out the 300ms rise-in animation.
    await page.waitForSelector("main .divide-y > a, main p:text-is('No tickets yet')");
    await page.waitForTimeout(400);
    const cta = page.locator("main a", { hasText: "View All Tickets" });
    await cta.hover();
    // transition-all duration-300 — toHaveCSS auto-retries past the fade.
    await expect(cta).toHaveCSS("color", colorRegex7("accentFg"));
  });

  test("back-button hover renders the reference near-black text", async ({ page }) => {
    await page.goto("/submitticket");
    const back = page.getByRole("link", { name: /Back to Dashboard/ });
    await back.hover();
    await expect(back).toHaveCSS("color", colorRegex7("accentFg"));
  });
});

test.describe("session 7: empty states (reference markup)", () => {
  // Reference search-no-match state (live-measured): card
  // `rounded-xl border bg-card text-card-foreground p-12 text-center
  //  border-none shadow-xl`, icon circle `w-20 h-20 bg-gradient-to-br
  // from-slate-100 to-slate-200`, FileText `w-10 h-10 text-slate-400`,
  // h3 `text-xl font-semibold text-slate-900 mb-2`, p `text-slate-500` (16px).
  // Our distinct filtered/empty message pair is a kept superset (the reference
  // confusingly shows "You haven't submitted any tickets yet." for a no-match
  // search too).
  test("mytickets search-empty renders the reference empty-state markup", async ({ page }) => {
    await page.goto("/mytickets");
    await page.getByPlaceholder("Search tickets...").fill("zzzz-no-such-ticket-qqqq");
    const heading = page.getByRole("heading", { name: "No tickets match your filters" });
    await expect(heading).toBeVisible();
    const card = heading.locator("xpath=ancestor::div[contains(@class,'p-12')]");
    await expect(card).toHaveClass(/rounded-xl/);
    await expect(card).toHaveClass(/border-none/);
    await expect(card).toHaveClass(/shadow-xl/);
    const circle = card.locator("div.w-20");
    await expect(circle).toHaveClass(/h-20/);
    await expect(circle).toHaveClass(/from-slate-100/);
    await expect(circle).toHaveClass(/to-slate-200/);
    const icon = circle.locator("svg");
    await expect(icon).toHaveClass(/w-10/);
    await expect(icon).toHaveClass(/h-10/);
    await expect(icon).toHaveClass(/text-slate-400/);
    await expect(heading).toHaveClass(/text-xl/);
    await expect(heading).toHaveClass(/text-slate-900/);
    await expect(heading).toHaveClass(/mb-2/);
    const sub = card.locator("p.text-slate-500");
    await expect(sub).toHaveCount(1);
    await expect(sub).not.toHaveClass(/text-sm/);
  });

  // Reference dashboard recent-empty (live-measured with their data API
  // blocked): wrapper `p-12 text-center`, circle `w-16 h-16 bg-slate-100
  // rounded-full ... mb-4`, FileText `w-8 h-8 text-slate-400`,
  // p `text-slate-500 font-medium` + `text-sm text-slate-400 mt-1`.
  // Route-mocked empty list (deterministic — no fresh signup needed).
  test("dashboard recent-empty renders the reference colors + padding", async ({ page }) => {
    await page.route("**/api/tickets", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tickets: [] }) }),
    );
    await page.goto("/dashboard");
    const empty = page.getByText("No tickets yet", { exact: true });
    await expect(empty).toBeVisible();
    const wrap = empty.locator("xpath=ancestor::div[contains(@class,'text-center')][1]");
    await expect(wrap).toHaveClass(/p-12/);
    const circle = wrap.locator("div.w-16");
    await expect(circle).toHaveClass(/bg-slate-100/);
    const icon = circle.locator("svg");
    await expect(icon).toHaveClass(/w-8/);
    await expect(icon).toHaveClass(/text-slate-400/);
    await expect(empty).toHaveClass(/text-slate-500/);
    await expect(empty).toHaveClass(/font-medium/);
  });
});

test.describe("session 7: fetch-failure resilience (superset)", () => {
  // The reference renders zeros forever on a failing fetch (their own silent
  // failure — verified live by blocking their entities API). A production-
  // ready superset surfaces the failure and offers a retry: one transient 401
  // during session-7 live probing left our dashboard skeletoned FOREVER
  // (non-ok mapped to null, state never settled) — the exact bug this fixes.
  test("dashboard shows an error panel + Retry when the APIs fail, then recovers", async ({ page }) => {
    await page.route("**/api/stats", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );
    await page.route("**/api/tickets", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/dashboard");
    const retry = page.getByRole("button", { name: /Try again/i });
    await expect(retry).toBeVisible();
    await expect(page.getByText(/could not load/i)).toBeVisible();
    // No skeleton limbo: the error panel replaced the stat values.
    await expect(page.locator("main span.animate-pulse")).toHaveCount(0);
    await page.unroute("**/api/stats");
    await page.unroute("**/api/tickets");
    await retry.click();
    // Recovery: the stat cards render real numbers (not the "…" placeholder).
    await expect(page.getByText("Total Tickets")).toBeVisible();
    const value = page.locator("main p.text-4xl").first();
    await expect(value).not.toHaveText(/…/);
  });

  // Pre-fix behavior: a failed fetch silently rendered "No tickets found" —
  // misleading (the user HAS tickets; the fetch failed).
  test("mytickets shows an error panel + Retry (not the empty state) when the API fails", async ({ page }) => {
    await page.route("**/api/tickets**", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/mytickets");
    const retry = page.getByRole("button", { name: /Try again/i });
    await expect(retry).toBeVisible();
    await expect(page.getByText(/could not load/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /No tickets/ })).toHaveCount(0);
    await page.unroute("**/api/tickets**");
    await retry.click();
    await expect(page.getByRole("heading", { name: /No tickets/ })).toHaveCount(0);
    // Recovery: ticket cards render (seeded corpus).
    await expect(page.locator("main a[href*='ticketdetails']").first()).toBeVisible();
  });
});

test.describe("session 7: favicon + per-page titles", () => {
  // The reference serves a favicon (their logo on supabase CDN); we served
  // none (404). src/app/icon.png is the Next.js App Router convention.
  test("the app serves a favicon", async ({ page }) => {
    await page.goto("/dashboard");
    const iconLink = page.locator('link[rel="icon"]');
    await expect(iconLink).toHaveCount(1);
    const res = await page.request.get("/icon.png");
    expect(res.status()).toBe(200);
  });

  // Reference (live-measured): per-route titles — "/mytickets" →
  // "Mytickets | ServiceDesk", "/submitticket" → "Submitticket | ServiceDesk",
  // "/ticketdetails" → "Ticketdetails | ServiceDesk", "/dashboard" →
  // "ServiceDesk". Superset: proper-cased page names.
  test("document titles are per-route (reference pattern, superset casing)", async ({ page }) => {
    await page.goto("/dashboard");
    expect(await page.title()).toBe("Dashboard | ServiceDesk");
    await page.goto("/submitticket");
    expect(await page.title()).toBe("Submit Ticket | ServiceDesk");
    await page.goto("/mytickets");
    expect(await page.title()).toBe("My Tickets | ServiceDesk");
    await page.goto("/ticketdetails");
    expect(await page.title()).toBe("Ticket Details | ServiceDesk");
  });
});

test.describe("session 8: auth error alerts (reference computed)", () => {
  // Reference (live-measured, wrong-password flow): a shadcn Alert between
  // the password field and the submit button — p-4 (16px), rounded-xl (12px),
  // bg-red-50/70 (translucent rgba(254,242,242,0.7)), border-red-200, inner
  // text-red-700 (rgb(185,28,28)). Ours rendered px-3 py-2 / rounded-lg /
  // opaque red-50 / red-600. The p[role=alert] stays (a11y superset; the
  // auth.spec pin keys on it).
  test("the login error alert renders the reference Alert contract", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("DefinitelyWrong1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toContainText(/invalid email or password/i);
    await expect(alert).toHaveClass(/bg-red-50\/70/);
    await expect(alert).toHaveClass(/text-red-700/);
    await expect(alert).toHaveClass(/rounded-xl/);
    await expect(alert).toHaveClass(/p-4/);
    // Representation-stable computed values (v4 may emit lab()/color-mix()).
    await expect(alert).toHaveCSS("border-radius", "12px");
    await expect(alert).toHaveCSS("padding", "16px");
  });

  test("the signup error alert carries the same contract", async ({ page }) => {
    // Duplicate email → the API returns an error rendered in the same alert P.
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Dup User");
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("SomePassword1!");
    await page.getByRole("button", { name: /create account|sign up/i }).click();
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/bg-red-50\/70/);
    await expect(alert).toHaveClass(/rounded-xl/);
    await expect(alert).toHaveClass(/p-4/);
    await expect(alert).toHaveCSS("border-radius", "12px");
  });
});

test.describe("session 8: mobile sheet overlay + overflow (reference computed)", () => {
  // Reference (live-measured on their open sheet): the backdrop dims at 80%
  // black. Ours was bg-black/50 — visibly lighter on every mobile menu open.
  test("the mobile sheet overlay dims to the reference 80% black", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await page.locator("header button").click();
    const overlay = page.locator("[data-slot=sheet-overlay][data-state=open]");
    await expect(overlay).toBeVisible();
    const bg = await overlay.evaluate((el) => getComputedStyle(el).backgroundColor);
    // v3 emits rgba(0,0,0,0.8); v4 may emit oklab(0 0 0 / 0.8) or a
    // color-mix equivalent — accept any 0.8-alpha black representation.
    expect(bg).toMatch(/0\.8\)|\/ 0\.8|80%/);
  });

  // The reference shares the mobile horizontal-overflow defect (their
  // scrollWidth 451 at 375 = our single-row measurement with the same ticket
  // title — structurally identical, data-dependent). min-w-0 on <main> is a
  // deliberate superset fix: the document stops overflowing AND the
  // recent-row titles actually truncate.
  test("no horizontal overflow at 375px on any app page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/dashboard", "/submitticket", "/mytickets", "/ticketdetails?id="]) {
      await page.goto(path === "/ticketdetails?id=" ? "/mytickets" : path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(600);
      const widths = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(widths.scrollW, `${path} overflowed`).toBeLessThanOrEqual(widths.clientW);
    }
  });

  test("the dashboard recent-row title truncates at 375px (ellipsis active)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const firstRow = page.locator("main .divide-y > a").first();
    await expect(firstRow).toBeVisible();
    const h3 = firstRow.locator("h3");
    const truncated = await h3.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(truncated).toBe(true);
  });
});

test.describe("session 8: head metadata (reference set)", () => {
  // Reference (live-measured per route): description "An IT ticketing system
  // to log, track, prioritize, and resolve technical issues efficiently.",
  // og:title/description/url/type/site_name/image, twitter:card
  // summary_large_image, canonical, apple-mobile-web-app-*.
  test("the root metadata matches the reference social/PWA set", async ({ page }) => {
    await page.goto("/dashboard");
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute(
      "content",
      "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently."
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "ServiceDesk");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "ServiceDesk");
  });

  test("app routes carry canonical URLs", async ({ page }) => {
    for (const [path, slug] of [
      ["/dashboard", "/dashboard"],
      ["/submitticket", "/submitticket"],
      ["/mytickets", "/mytickets"],
    ] as const) {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute("href", new RegExp(`${slug}/?$`));
    }
  });
});

test.describe("session 8: raw buttons carry the reference focus tail", () => {
  // The reference's sign-out button renders the shadcn base incl.
  // focus-visible:ring-1 ring-ring; ours is a raw <button> that had no
  // focus-visible styling (the session-6 matrix covered the Button/Input/
  // Textarea/SelectTrigger bases, not raw buttons).
  test("the sidebar sign-out button carries the focus-visible ring", async ({ page }) => {
    await page.goto("/dashboard");
    const signOut = page.locator('button[aria-label="Sign out"]');
    await expect(signOut).toHaveClass(/focus-visible:ring-1/);
    await expect(signOut).toHaveClass(/focus-visible:ring-ring/);
  });

  test("the attachment Remove button carries the focus-visible ring", async ({ page }) => {
    await page.goto("/submitticket");
    await page.setInputFiles("#file-upload", {
      name: "probe.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("session-8 focus-tail probe"),
    });
    const remove = page.getByRole("button", { name: "Remove", exact: true });
    await expect(remove).toBeVisible();
    await expect(remove).toHaveClass(/focus-visible:ring-1/);
  });
});

test.describe("session 9: the cursor preflight (Tailwind v4 regression)", () => {
  // Tailwind v3's preflight ships `button, [role="button"] { cursor: pointer }`;
  // v4 REMOVED it (buttons use the browser-default arrow). The reference (v3
  // build) renders the hand cursor on every true button — verified live on
  // their sign-out, triggers, and CTAs — while our v4 build rendered `default`.
  // G1 restores the v3 rule verbatim in @layer base (globals.css).
  test("a bare (classless) button computes cursor: pointer", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("main .text-4xl");
    // detached-element probe (session-9 lesson #6): append, read, remove —
    // immune to locator/traversal races.
    const cursor = await page.evaluate(() => {
      const probe = document.createElement("button");
      probe.id = "s9-cursor-probe";
      probe.textContent = "probe";
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).cursor;
      probe.remove();
      return c;
    });
    expect(cursor).toBe("pointer");
  });

  test("the sidebar sign-out button renders the hand cursor", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('button[aria-label="Sign out"]');
    const signOut = page.locator('button[aria-label="Sign out"]');
    await expect(signOut).toHaveCSS("cursor", "pointer");
  });
});

test.describe("session 9: the stock shadcn token block (:root parity)", () => {
  // Session-9 headline: the reference's :root is verbatim STOCK shadcn
  // (zinc neutrals, near-black primary, blue-500 sidebar ring); ours carried
  // session-1 custom slate/cyan values, never measured until the full token
  // diff. Tokens are resolved through a probe element (color: var(--x)) so
  // the assertion is representation-independent.
  const resolveToken = (page: import("@playwright/test").Page, token: string) =>
    page.evaluate((t) => {
      const probe = document.createElement("div");
      probe.id = "s9-token-probe";
      probe.style.color = `var(${t})`;
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    }, token);

  test("--primary resolves the reference's near-black (badge hovers go dark)", async ({ page }) => {
    await page.goto("/dashboard");
    // stock hsl(0 0% 9%) = rgb(23,23,23) — the reference's hover:bg-primary/80
    // computes rgba(23,23,23,0.8) live on their quick-stat pill.
    expect(await resolveToken(page, "--primary")).toBe("rgb(23, 23, 23)");
  });

  test("--border resolves neutral-200 and the dashboard cards render it", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("main .text-4xl");
    // stock hsl(0 0% 89.8%) = rgb(229,229,229); the reference's Card borders
    // compute exactly this (live-measured on their stat cards).
    expect(await resolveToken(page, "--border")).toBe("rgb(229, 229, 229)");
    const card = page.locator("main div.rounded-xl.border").first();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("border-top-color", "rgb(229, 229, 229)");
  });

  test("--foreground resolves near-black and the CategoryBadge renders it", async ({ page }) => {
    await page.goto("/mytickets");
    await page.waitForSelector("main a[href*=ticketdetails]");
    // stock hsl(0 0% 3.9%) = rgb(10,10,10); the reference's outline
    // CategoryBadge text computes exactly this (their badge base =
    // text-foreground), ours was slate-900 rgb(15,23,42).
    expect(await resolveToken(page, "--foreground")).toBe("rgb(10, 10, 10)");
    const badge = page
      .locator("main a[href*=ticketdetails] span")
      .filter({ hasText: /^(hardware|software|network|access|email|other)$/ })
      .first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS("color", "rgb(10, 10, 10)");
  });

  test("--sidebar-ring resolves the reference's blue-500 (nav keyboard focus)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("main .text-4xl");
    // stock hsl(217.2 91.2% 59.8%) = rgb(59,130,246) — resolved live on the
    // reference; drives focus-visible:ring-2 on nav items + the group label.
    expect(await resolveToken(page, "--sidebar-ring")).toBe("rgb(59, 130, 246)");
  });
});

test.describe("session 9: badge generation + hover behavior", () => {
  // Our Badge atom shipped the NEW shadcn base (transition-[color,box-shadow],
  // focus-visible:ring-[3px]) while the reference carries the OLD base
  // (transition-colors focus:outline-none focus:ring-2 focus:ring-ring
  // focus:ring-offset-2). Visible deltas: our badge background SNAPPED on
  // hover (no background-color in the transition list) and the quick-stat
  // pills (raw spans) had no transition at all.
  test("badges carry the old-gen transition + focus tail, not ring-[3px]", async ({ page }) => {
    await page.goto("/mytickets");
    const badge = page
      .locator("main a[href*=ticketdetails] span")
      .filter({ hasText: /^(open|in progress|resolved|closed|low|medium|high|urgent)$/ })
      .first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/transition-colors/);
    await expect(badge).toHaveClass(/focus:outline-none/);
    await expect(badge).toHaveClass(/focus:ring-2/);
    await expect(badge).toHaveClass(/focus:ring-ring/);
    await expect(badge).toHaveClass(/focus:ring-offset-2/);
    await expect(badge).not.toHaveClass(/ring-\[3px\]/);
    // the transition list must include background-color (the 150ms fade the
    // reference renders on badge hover — ours transitioned only color+shadow)
    const transition = await badge.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition).toContain("background-color");
  });

  test("the quick-stat pill hovers to near-black at 80% and fades its background", async ({ page }) => {
    await page.goto("/dashboard");
    // wait for the client-side stats fetch + settle (the sidebar shifts once
    // the numbers land — the session-7 hover-race lesson)
    const pill = page.locator("span.inline-flex.shadow-md").first();
    await expect(pill).toBeVisible();
    await page.waitForTimeout(700); // rise-in + stats settle
    await pill.hover();
    // the reference's pill hover computes rgba(23,23,23,0.8) (their --primary
    // is near-black); our v4 pipeline may emit oklab(0.2x … / 0.8) or
    // color-mix(...) — accept the known near-black/0.8 representations.
    // NOTE: read AFTER the 150ms transition-colors fade settles — an
    // immediate read catches the color mid-interpolation (oklab L≈0.54,
    // alpha≈0.91 on the first run) which is itself proof the fade works.
    await page.waitForTimeout(300);
    const hoverBg = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
    const near = /rgba\(23, ?23, ?23, ?0\.8\)/.test(hoverBg)
      || /oklab\(0\.[12]\d* [^)]*\/ 0\.8\)/.test(hoverBg)
      || /color-mix\([^)]*0\.8[^)]*\)/.test(hoverBg);
    expect(near, `pill hover bg was: ${hoverBg}`).toBe(true);
    // the pill carries the reference's transition-colors tail (raw-span fix)
    await expect(pill).toHaveClass(/transition-colors/);
    const transition = await pill.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition).toContain("background-color");
  });
});

test.describe("session 10: the login card's in-card view swaps", () => {
  // The reference's login card is a view state machine on /login — "Forgot
  // password?" and "Need an account? Sign up" are BUTTONS that swap the card
  // content in place (URL unchanged). First exercised live in session 10
  // (nine sessions read only the at-rest sign-in DOM). Contracts measured
  // from the live reference: docs/remediation-plan-session10.md §G1.

  test("Forgot password? swaps the card to the reset view without navigating", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    // The card swaps in place — the URL never changes and the sign-in
    // heading is replaced (logo + Google + OR divider all absent).
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome to ServiceDesk" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Continue with Google/ })).toHaveCount(0);
    await expect(page.locator("main img")).toHaveCount(0);
  });

  test("the reset view matches the reference structure", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();

    // Back button: whole-line classes + the session-12 computed-parity
    // margins (was -mb-2, the reference's v3 class — it computes an 8px
    // overlap on our v4 build; see the session-12 space-y block below) + h-4 arrow.
    const back = page.getByRole("button", { name: /Back to sign in/ });
    await expect(back).toHaveClass(/text-sm/);
    await expect(back).toHaveClass(/text-slate-500/);
    await expect(back).toHaveClass(/hover:text-slate-700/);
    await expect(back).toHaveClass(/font-medium/);
    await expect(back).toHaveClass(/transition-colors/);
    await expect(back).toHaveClass(/mb-2/);
    await expect(back).toHaveClass(/sm:mb-4/);
    await expect(back.locator("svg")).toHaveClass(/h-4/);

    // The h2 + subtext block.
    const h2 = page.getByRole("heading", { name: "Reset your password" });
    await expect(h2).toHaveClass(/text-xl/);
    await expect(h2).toHaveClass(/sm:text-2xl/);
    await expect(h2).toHaveClass(/font-bold/);
    await expect(h2).toHaveClass(/text-slate-900/);
    const sub = page.getByText("Enter your email and we'll send you a link to reset your password");
    await expect(sub).toHaveClass(/text-slate-600/);
    await expect(sub).toHaveClass(/text-sm/);

    // The form: the reference's space-y-4 sm:space-y-5 + the shorter
    // input generation (h-10 sm:h-11, placeholder slate-400).
    const form = page.locator("main form");
    await expect(form).toHaveClass(/space-y-4/);
    await expect(form).toHaveClass(/sm:space-y-5/);
    const email = page.getByLabel("Email");
    await expect(email).toHaveClass(/h-10/);
    await expect(email).toHaveClass(/sm:h-11/);
    await expect(email).toHaveClass(/placeholder:text-slate-400/);
    await expect(email).toHaveClass(/bg-slate-50\/50/);
    await expect(email).toHaveAttribute("placeholder", "you@example.com");

    // Submit: the shorter h-10 sm:h-11 generation; their v3 shadow-sm
    // computes to our shadow-xs (the session-5 naming trap).
    const submit = page.getByRole("button", { name: /Send reset link/ });
    await expect(submit).toHaveClass(/h-10/);
    await expect(submit).toHaveClass(/sm:h-11/);
    await expect(submit).toHaveClass(/bg-slate-900/);
    await expect(submit).toHaveClass(/shadow-xs/);
    await expect(submit).toHaveClass(/rounded-xl/);
  });

  test("submitting the reset form renders the Check-your-email success view", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await page.getByLabel("Email").fill("parity@s10.dev");
    await page.getByRole("button", { name: /Send reset link/ }).click();

    // The icon circle + h2 + email paragraph + the green alert.
    const circle = page.locator("div.mx-auto.bg-slate-100.rounded-full");
    await expect(circle).toHaveClass(/w-14/);
    await expect(circle).toHaveClass(/h-14/);
    await expect(circle).toHaveClass(/sm:w-16/);
    await expect(circle).toHaveClass(/sm:h-16/);
    await expect(circle.locator("svg")).toHaveClass(/h-7/);
    await expect(circle.locator("svg")).toHaveClass(/sm:h-8/);
    await expect(circle.locator("svg")).toHaveClass(/text-slate-700/);

    const h2 = page.getByRole("heading", { name: "Check your email" });
    await expect(h2).toHaveClass(/text-xl/);
    await expect(h2).toHaveClass(/sm:text-2xl/);
    await expect(page.getByText("parity@s10.dev")).toHaveClass(/font-medium/);
    await expect(page.getByText("parity@s10.dev")).toHaveClass(/text-slate-900/);

    // The green alert: the reference's bg-green-50/70 + border-green-200 +
    // rounded-xl + p-4 with the [&_p]:leading-relaxed text-green-700 inner.
    // (Scoped to main — Next's route announcer also carries role=alert.)
    const alert = page.locator('main div[role="alert"]');
    await expect(alert).toHaveClass(/bg-green-50\/70/);
    await expect(alert).toHaveClass(/border-green-200/);
    await expect(alert).toHaveClass(/rounded-xl/);
    await expect(alert).toHaveClass(/p-4/);
    await expect(alert.locator("div")).toHaveClass(/text-green-700/);
    await expect(alert.locator("div")).toHaveClass(/text-sm/);
    // v4 emits palette colors as lab() — accept both representations
    // (green-700 = rgb(21, 128, 61)).
    const green = await alert.locator("div").evaluate((el) => getComputedStyle(el).color);
    const greenOk = green === "rgb(21, 128, 61)" || /^lab\(/.test(green);
    expect(greenOk, `green-700 computed as: ${green}`).toBe(true);

    // The success back button is the full-width centered variant.
    const back = page.getByRole("button", { name: /Back to sign in/ });
    await expect(back).toHaveClass(/w-full/);
    await expect(back).toHaveClass(/justify-center/);
  });

  test("Need an account? Sign up swaps the card to the signup view", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Need an account\?\s*Sign up/ }).click();

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome to ServiceDesk" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Continue with Google/ })).toHaveCount(0);

    // Three fields with the reference placeholders; no name field
    // (base44 auth has no name concept — the client derives the account
    // name from the email local-part). Exact match — the Confirm Password
    // label also contains "Password".
    await expect(page.getByLabel("Email")).toHaveAttribute("placeholder", "you@example.com");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("placeholder", "Min. 8 characters");
    await expect(page.getByLabel("Confirm Password")).toHaveAttribute("placeholder", "Re-enter password");

    // The shorter input generation (h-10 sm:h-11 + slate-400 placeholders).
    const email = page.getByLabel("Email");
    await expect(email).toHaveClass(/h-10/);
    await expect(email).toHaveClass(/sm:h-11/);
    await expect(email).toHaveClass(/placeholder:text-slate-400/);

    // The form is the tighter space-y-3 sm:space-y-4 generation.
    const form = page.locator("main form");
    await expect(form).toHaveClass(/space-y-3/);
    await expect(form).toHaveClass(/sm:space-y-4/);

    // Submit: "Create account" with the shorter button generation.
    const submit = page.getByRole("button", { name: /Create account/ });
    await expect(submit).toHaveClass(/h-10/);
    await expect(submit).toHaveClass(/sm:h-11/);
    await expect(submit).toHaveClass(/bg-slate-900/);
    await expect(submit).toHaveClass(/shadow-xs/);
  });

  test("Back to sign in returns to the sign-in view from both swapped views", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await page.getByRole("button", { name: /Back to sign in/ }).click();
    await expect(page.getByRole("heading", { name: "Welcome to ServiceDesk" })).toBeVisible();

    await page.getByRole("button", { name: /Need an account\?\s*Sign up/ }).click();
    await page.getByRole("button", { name: /Back to sign in/ }).click();
    await expect(page.getByRole("heading", { name: "Welcome to ServiceDesk" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });
});

test.describe("session 10: the ticket-not-found state", () => {
  // The reference renders a shadcn destructive Alert inline in the
  // max-w-5xl page container (measured live on /ticketdetails?id=unknown):
  // rounded-lg (8px) + px-4 py-3 (12px 16px) + border-destructive/50 +
  // text-destructive. Ours was a centered text-2xl card.
  test("an unknown ticket id renders the reference destructive Alert", async ({ page }) => {
    await page.goto("/ticketdetails?id=nonexistent-s10");
    // Scoped to main — Next's route announcer also carries role=alert.
    const alert = page.locator('main div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Ticket not found");
    await expect(alert).toHaveClass(/border-destructive\/50/);
    await expect(alert).toHaveClass(/text-destructive/);
    await expect(alert).toHaveClass(/rounded-lg/);
    await expect(alert).toHaveClass(/px-4/);
    await expect(alert).toHaveClass(/py-3/);
    await expect(alert).toHaveClass(/text-sm/);
    await expect(alert.locator("div")).toHaveClass(/leading-relaxed/);

    // Computed contract: red-500 text + the 50%-alpha border + 8px radius
    // + 12px/16px padding (live-measured on the reference). The
    // destructive token is literal-hex (rgb); the border's 50% alpha may
    // serialize as rgba or color-mix on the v4 pipeline.
    const red = await alert.evaluate((el) => getComputedStyle(el).color);
    const redOk = red === "rgb(239, 68, 68)" || /^lab\(/.test(red);
    expect(redOk, `destructive text computed as: ${red}`).toBe(true);
    const border = await alert.evaluate((el) => getComputedStyle(el).borderTopColor);
    const borderOk = border === "rgba(239, 68, 68, 0.5)" || /color-mix|lab\(/.test(border);
    expect(borderOk, `destructive border computed as: ${border}`).toBe(true);
    await expect(alert).toHaveCSS("border-top-left-radius", "8px");
    await expect(alert).toHaveCSS("padding", "12px 16px");

    // The alert sits inside the standard max-w-5xl page wrapper.
    const wrapper = alert.locator("xpath=ancestor::div[contains(@class,'max-w-5xl')]");
    await expect(wrapper).toHaveCount(1);
  });

  test("the not-found state keeps the superset Back to Tickets control", async ({ page }) => {
    await page.goto("/ticketdetails?id=nonexistent-s10");
    // asChild Button → renders an anchor (role=link).
    const back = page.getByRole("link", { name: /Back to Tickets/ });
    await expect(back).toBeVisible();
  });
});

test.describe("session 10: attachment accept + the SEO surface", () => {
  // The reference's upload input accepts image/*,.pdf,.doc,.docx — ours
  // missed the Word families (a .docx they accept was hidden by our picker).
  test("the upload input accepts the reference's doc/docx families", async ({ page }) => {
    await page.goto("/submitticket");
    const input = page.locator('input[type="file"]');
    const accept = await input.getAttribute("accept");
    expect(accept, `accept was: ${accept}`).toContain(".doc");
    expect(accept, `accept was: ${accept}`).toContain(".docx");
    expect(accept).toContain(".pdf");
    expect(accept).toContain(".png");
  });

  // The reference ships robots.txt (with a Sitemap directive) + sitemap.xml.
  // Ours had robots.txt but no sitemap and no directive. We serve the four
  // PUBLIC routes only (their auto-generated sitemap lists dead scaffold
  // routes — deliberately not copied).
  test("/sitemap.xml serves the public-route set", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    // Parse the <loc> URLs and compare the PATHNAME set (the origin is the
    // build-time NEXT_PUBLIC_SITE_URL — don't hardcode it).
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(locs).toEqual(["/", "/login", "/signup", "/forgotpassword"]);
    // The authenticated routes stay OUT of the sitemap (login-walled).
    expect(locs).not.toContain("/dashboard");
    expect(locs).not.toContain("/mytickets");
  });

  test("/robots.txt carries the Sitemap directive + the disallow policy", async ({ page }) => {
    const res = await page.request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    // The robots protocol is case-insensitive; Next serializes "User-Agent".
    expect(body.toLowerCase()).toContain("user-agent: *");
    expect(body).toContain("Disallow: /dashboard");
    expect(body).toContain("Disallow: /api/");
    expect(body.toLowerCase()).toContain("sitemap:");
  });
});

test.describe("session 9: the desktop sidebar edge", () => {
  // The reference's sidebar wrapper carries an explicit border-slate-200/60
  // (resolved rgba(226,232,240,0.6) live); ours rendered border-r with the
  // default --border (solid). DOM-verified on their wrapper class list.
  test("the sidebar edge renders slate-200 at 60% alpha", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("main .text-4xl");
    const edge = await page.evaluate(() => {
      // the bordered desktop wrapper is `group/sidebar` — NOT the outer
      // `group/sidebar-wrapper` (a substring match grabbed the wrong div on
      // the first run). Match the token exactly.
      const sb = [...document.querySelectorAll("div")].find((d) =>
        /(^|\s)group\/sidebar(?![-\w])/.test((d.className || "").toString()),
      );
      if (!sb) return { found: false as const };
      return {
        found: true as const,
        cls: sb.className.toString(),
        borderColor: getComputedStyle(sb).borderRightColor,
      };
    });
    expect(edge.found).toBe(true);
    if (!edge.found) return;
    expect(edge.cls).toContain("border-slate-200/60");
    // v4 may serialize the 60% alpha as rgba(...,0.6) or oklab(… / 0.6)
    const translucent = /rgba\(226, ?232, ?240, ?0\.6\)/.test(edge.borderColor)
      || /\/ 0\.6\)/.test(edge.borderColor)
      || /color-mix\([^)]*0\.6[^)]*\)/.test(edge.borderColor);
    expect(translucent, `edge border color was: ${edge.borderColor}`).toBe(true);
  });
});

test.describe("session 11: the id-less ticket detail route", () => {
  // The reference renders the "Ticket not found" destructive Alert on the
  // BARE /ticketdetails route (no ?id) — the same measured contract as the
  // unknown-id case. Ours hung in the loading skeleton forever (the load
  // callback early-returns on a missing id, so the ticket state never
  // resolves). First probed in session 11: every prior session drove the
  // detail page WITH an id.
  test("the bare route renders the destructive Alert, not a skeleton", async ({ page }) => {
    await page.goto("/ticketdetails");
    // Scoped to main — Next's route announcer also carries role=alert.
    const alert = page.locator('main div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Ticket not found");
    await expect(alert).toHaveClass(/border-destructive\/50/);
    await expect(alert).toHaveClass(/text-destructive/);
    // The skeleton must NOT linger — the page resolves to a terminal state.
    await expect(page.locator('[aria-label="Loading ticket"]')).toHaveCount(0);
    // The superset Back to Tickets control stays (asChild → role=link).
    await expect(page.getByRole("link", { name: /Back to Tickets/ })).toBeVisible();
  });

  test("an empty id query (?id=) also resolves to the Alert", async ({ page }) => {
    await page.goto("/ticketdetails?id=");
    const alert = page.locator('main div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Ticket not found");
  });
});

test.describe("session 11: the PWA manifest surface", () => {
  // The reference ships /manifest.json (302 → their platform API) linked
  // from the head. Live-measured fields: name/short_name "ServiceDesk",
  // their description, icons at 192x192 + 512x512, start_url, display
  // "standalone", theme_color #000000, background_color #ffffff, scope.
  // Production-sane mirror: real size-correct PNG icons (their manifest
  // declares two sizes against one 480x480 JPEG) + NEXT_PUBLIC_SITE_URL
  // for the absolute URLs (the sitemap.ts precedent).
  test("/manifest.json serves the reference's measured contract", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    expect(res.status()).toBe(200);
    const manifest = (await res.json()) as Record<string, unknown>;
    expect(manifest.name).toBe("ServiceDesk");
    expect(manifest.short_name).toBe("ServiceDesk");
    expect(manifest.description).toBe(
      "An IT ticketing system to log, track, prioritize, and resolve technical issues efficiently."
    );
    expect(manifest.display).toBe("standalone");
    expect(String(manifest.theme_color).toLowerCase()).toBe("#000000");
    expect(String(manifest.background_color).toLowerCase()).toBe("#ffffff");
    // start_url/scope derive from the build origin — assert shape, not host.
    expect(String(manifest.start_url)).toMatch(/^https?:\/\//);
    expect(new URL(String(manifest.start_url)).pathname).toBe("/");
    expect(String(manifest.scope)).toMatch(/\/$/);
    const icons = manifest.icons as { src: string; sizes: string; type: string }[];
    expect(icons.map((i) => i.sizes).sort()).toEqual(["192x192", "512x512"]);
    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      const iconRes = await page.request.get(icon.src);
      expect(iconRes.status(), `icon ${icon.src} fetched`).toBe(200);
      expect(iconRes.headers()["content-type"]).toContain("image/png");
    }
  });

  test("the head links the manifest", async ({ page }) => {
    await page.goto("/login");
    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveCount(1);
    // Next may append a version query — assert the path.
    const href = await link.getAttribute("href");
    expect(href, `manifest href was: ${href}`).toMatch(/\/manifest\.json/);
  });
});

test.describe("session 11: theme-color + apple-touch-icon", () => {
  // The reference's head ships <meta name="theme-color" content="#000000">
  // and <link rel="apple-touch-icon" href="<their logo>"> — both missed by
  // the session-8 social/PWA sweep (it captured the apple-mobile-web-app-*
  // metas but not these two). Our apple icon is a real 180x180 PNG from the
  // same logo source; Next's apple-icon.png file convention emits the link.
  test("the head carries theme-color #000000", async ({ page }) => {
    await page.goto("/login");
    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveCount(1);
    await expect(meta).toHaveAttribute("content", "#000000");
  });

  test("the head carries the apple-touch-icon link", async ({ page }) => {
    await page.goto("/login");
    const link = page.locator('link[rel="apple-touch-icon"]');
    await expect(link).toHaveCount(1);
    const href = await link.getAttribute("href");
    expect(href, `apple-touch-icon href was: ${href}`).toMatch(/apple-icon\.png/);
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("session 11: BreadcrumbList JSON-LD structured data", () => {
  // The reference ships a BreadcrumbList JSON-LD in the head on every route
  // EXCEPT /dashboard (their builder special-cases its home route — the same
  // map that plain-titles it). Names are the lowercase path segment verbatim
  // ("login", "mytickets", …); position 1 is Home → the origin.
  const routes: [string, string][] = [
    ["/login", "login"],
    ["/mytickets", "mytickets"],
    ["/submitticket", "submitticket"],
    ["/ticketdetails", "ticketdetails"],
  ];

  for (const [path, segment] of routes) {
    test(`/${segment === "" ? "" : segment} carries the breadcrumb with name "${segment}"`, async ({ page }) => {
      await page.goto(path);
      const ld = await page.evaluate(() => {
        const el = document.querySelector('script[type="application/ld+json"]');
        return el ? el.textContent : null;
      });
      expect(ld, `no JSON-LD script on ${path}`).toBeTruthy();
      const parsed = JSON.parse(ld!) as {
        "@type": string;
        itemListElement: { position: number; name: string; item: string }[];
      };
      expect(parsed["@type"]).toBe("BreadcrumbList");
      const items = parsed.itemListElement;
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe("Home");
      expect(new URL(items[0].item).pathname).toBe("/");
      expect(items[1].name).toBe(segment);
      expect(new URL(items[1].item).pathname).toBe(`/${segment}`);
    });
  }

  test("/dashboard carries NO JSON-LD (the reference's home special case)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("main .text-4xl");
    const ld = await page.evaluate(
      () => document.querySelector('script[type="application/ld+json"]')?.textContent ?? null,
    );
    expect(ld).toBeNull();
  });
});

test.describe("session 12: the per-route social URL set (canonical + og:url + twitter:url)", () => {
  // The reference's platform emits <link rel=canonical> + <meta property="og:url">
  // + <meta name="twitter:url"> on EVERY route (live-measured on /login, /signup,
  // /forgotpassword, / — session 12). Our s8 sweep measured their og set, wrote
  // "og:url derives from the per-route canonical" as a comment, and never pinned
  // our side — the belief was false (Next emits og:url ONLY from openGraph.url;
  // the twitter metadata type has no url field at all). These pins go red until
  // the route-head helper ships the set on all 7 routes.
  const routes: [string, string][] = [
    ["/dashboard", "/dashboard"],
    ["/mytickets", "/mytickets"],
    ["/submitticket", "/submitticket"],
    ["/ticketdetails", "/ticketdetails"],
    ["/login", "/login"],
    ["/signup", "/signup"],
    ["/forgotpassword", "/forgotpassword"],
  ];

  for (const [path, slug] of routes) {
    test(`${slug} carries canonical + og:url + twitter:url (all three equal)`, async ({ page }) => {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical, `no canonical on ${path}`).toHaveCount(1);
      const href = await canonical.getAttribute("href");
      expect(href, `canonical href on ${path}`).toMatch(new RegExp(`${slug}/?$`));

      // og:url: emitted only from openGraph.url — nothing derives it from
      // the canonical (the s8-era false belief).
      const ogUrl = page.locator('meta[property="og:url"]');
      await expect(ogUrl, `no og:url on ${path}`).toHaveCount(1);
      await expect(ogUrl).toHaveAttribute("content", href!);

      // twitter:url: no twitter metadata field exists for it — it rides
      // metadata.other and must equal the canonical.
      const twUrl = page.locator('meta[name="twitter:url"]');
      await expect(twUrl, `no twitter:url on ${path}`).toHaveCount(1);
      await expect(twUrl).toHaveAttribute("content", href!);
    });
  }

  test("the per-route openGraph replace preserves the og set (site_name + image)", async ({ page }) => {
    // Next's metadata merge REPLACES a child's openGraph wholesale — a route
    // that adds openGraph.url would silently drop og:site_name/og:image if the
    // route-head helper ever misses a field. Pin the survival on one route.
    await page.goto("/login");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "ServiceDesk");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    const ogImage = page.locator('meta[property="og:image"]:not([property="og:image:width"])');
    await expect(ogImage).toHaveCount(1);
    const img = await ogImage.getAttribute("content");
    expect(img).toMatch(/\/icon\.png/);
  });
});

test.describe("session 12: the login view back buttons compute the reference's gaps (space-y trap-log #4)", () => {
  // The reference (v3) ships -mb-2 on the view back buttons as DIRECT children
  // of the space-y view containers — v3's space-y puts margin-top on later
  // siblings, so the -8px shrinks the following block's top margin to a
  // 8-16px gap. v4's space-y puts margin-bottom on earlier children — the
  // utility beats the :where()-wrapped rule and the next block gets NO
  // margin-top, so the same -mb-2 computed an 8px OVERLAP on our build for
  // two sessions. The fix ships the v4 classes that compute the reference's
  // measured gaps (mb-2 sm:mb-4 / mb-2 — the shadow-xs doctrine: parity is
  // the COMPUTED value, never the class name).

  test("the reset view's back button computes the reference's 16px gap at >=sm", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    const back = page.getByRole("button", { name: /Back to sign in/ });
    await expect(back).toBeVisible();

    // Computed margin-bottom: 16px (mb-4 at >=sm) — beats the :where()-wrapped
    // space-y rule, exactly as -mb-2 beat it before the fix.
    const mb = await back.evaluate((el) => getComputedStyle(el).marginBottom);
    expect(mb, "back button margin-bottom at >=sm").toBe("16px");

    // The measured contract: the next block's top sits 16px below the
    // button's bottom (the reference's collapsed gap) — never an overlap.
    const gap = await page.evaluate(() => {
      const back = [...document.querySelectorAll("button")].find((b) =>
        /Back to sign in/.test(b.textContent ?? ""),
      );
      const next = back!.nextElementSibling!;
      return Math.round(next.getBoundingClientRect().top - back!.getBoundingClientRect().bottom);
    });
    expect(gap, "back-bottom → next-top gap at >=sm").toBe(16);
  });

  test("the reset view's back button computes 8px below sm", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    const back = page.getByRole("button", { name: /Back to sign in/ });
    const mb = await back.evaluate((el) => getComputedStyle(el).marginBottom);
    expect(mb, "back button margin-bottom below sm").toBe("8px");
  });

  test("the signup view's back button computes the reference's 8px gap", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Need an account/ }).click();
    const back = page.getByRole("button", { name: /Back to sign in/ });
    await expect(back).toBeVisible();

    const mb = await back.evaluate((el) => getComputedStyle(el).marginBottom);
    expect(mb, "signup view back margin-bottom").toBe("8px");

    const gap = await page.evaluate(() => {
      const back = [...document.querySelectorAll("button")].find((b) =>
        /Back to sign in/.test(b.textContent ?? ""),
      );
      const next = back!.nextElementSibling!;
      return Math.round(next.getBoundingClientRect().top - back!.getBoundingClientRect().bottom);
    });
    expect(gap, "signup view back-bottom → next-top gap").toBe(8);
  });
});
