import { expect, test } from "@playwright/test";

// Session 89: THE A11Y TWO-GATE — the family skill §13 line this repo never
// carried a gate for ("axe-core runs in the e2e suite; a11y regressions are
// gate failures, not review comments" — the coverage-group contract line,
// unpinned through 88 sessions), landed in the neo-crm session-171 form
// riding the standing harness (the storageState auth, the standalone
// server, the seeded db/e2e.db, the production-build law).
//
// THE GATE (two parts):
//   1. STRUCTURAL violations must be ZERO — every WCAG-tagged rule OUTSIDE
//      the sanctioned register (button-name, link-name, label, list,
//      heading-order, landmark, region — the named-control proof). This
//      repo's controls already measure clean (the s89 prescan census: zero
//      nameless buttons/links/inputs across every surface; the two naive
//      prescan flags were Radix's internal aria-hidden shadow selects,
//      which axe's label rule skips by its own hidden-element semantics).
//   2. SANCTIONED rules carry citations — every flagged node must match a
//      sanctioned matcher naming the REFERENCE's own palette (verified
//      live against the reference's DOM this session: it ships the
//      identical families; fixing them would break visual parity). A NEW
//      unsanctioned regression REDs the gate.
//
// The engine rides the DECLARED devDep (package.json: axe-core ^4.14.0 —
// the F-171e doctrine: the gate must not stand on an undeclared
// transitive; an eslint-config bump could drop the transitive edge and the
// gate would ENOENT at runtime). The scan runs the four WCAG tag families
// (the strict subset — no best-practice noise).
//
// The 13 registrations are EXPLICIT (one test() per surface × width — the
// failing surface named directly): the public trio logged-out at 1280 +
// login at 375 + the four authed routes at 1280 + the three authed routes
// at 375 + the mobile nav sheet OPEN at 375 + the status Select OPEN on
// ticketdetails at 1280 (the dialog-open and combobox-open forms — the
// surfaces the mobile-navigation and tickets suites already exercise).
//
// The settle form is the s81 doctrine: a paired scan on a hydrated SPA
// surface settles BEFORE the scan (the networkidle-tolerant poll), and the
// exit-animation doctrine (200–300ms post-close mounts) is respected by
// scanning surfaces in their OPEN state with their own settle waits.

const AXE_PATH = "node_modules/axe-core/axe.min.js";

type Violation = { id: string; targets: string[] };

// The SANCTIONED register — rule → matcher list, every matcher carrying
// its citation. A flagged node matching NONE of them REDs the gate. The
// match arms are plain SUBSTRING tests (the axe target strings carry
// escaped class selectors — includes() is unambiguous).
//
// THE HONEST FORM (this session's live census, measured through the real
// engine on every surface × width): the register holds EXACTLY ONE rule —
// the Radix Select modal artifact. Everything else the engine flagged was
// a REAL superset defect (the slate-400 comment-count chips + the
// Update-Status helper text — OUR additions, no reference surface to stay
// parity-locked to — FIXED to slate-500 this session, the 4.76:1 AA form)
// or CLEAN (the named-control half: zero button-name / link-name / label
// violations anywhere, the login-family placeholders measured WITHIN
// threshold — slate-400's 2.56:1 applies to TEXT, and the placeholder
// family never fired). The register is not a suppression list: every
// entry cites the reference's own identical rendering, measured live on
// the reference's DOM this session.
const SANCTIONED: Record<string, Array<{ any: string[]; cite: string }>> = {
  "aria-hidden-focus": [
    {
      // Radix Select's modal open state marks the page background
      // aria-hidden WITHOUT inert (the react-remove-scroll
      // data-aria-hidden artifact — no author-side aria seam: the marking
      // is applied by the library to OUR focusable sidebar + page
      // wrapper the moment the listbox opens).
      // Verified live on the REFERENCE's own DOM this session: opening
      // one of its own Radix Selects marks its containers
      // data-aria-hidden=true with focusable children inside — the
      // identical artifact (the two-systems doctrine: the reference
      // ships the same Radix rendering; "fixing" it means patching
      // library internals, the recharts precedent).
      any: ["group\\/sidebar", "to-blue-50\\/30"],
      cite: "Radix Select's modal open state marks the page background aria-hidden without inert — the reference's own Radix Selects render the identical artifact when open (measured live on its DOM)",
    },
  ],
  // S90 (the two-systems sanction, measured live this session): the QUICK
  // STATS open badge — white on amber-500, 2.13:1 — is the reference's OWN
  // identical rendering (measured live on its DOM: its open badge reads
  // "120" on rgb(245,158,11) with white text and the byte-identical class
  // list — the session-2 parity measurement). The flag is DATA-DEPENDENT
  // through axe's own semantics: the color-contrast rule skips
  // single-grapheme text units, so the canonical single-digit stats pass
  // while any 2+ character count fires — the register entry carries the
  // citation so the gate holds at every data state (the s90 e2e-reset fix
  // keeps the canonical digits; this entry keeps the gate honest if a
  // future data state renders multi-digit counts anyway).
  "color-contrast": [
    {
      any: ["bg-amber-500"],
      cite: "the QUICK STATS open badge is the reference's own identical rendering — its badge measures '120' on rgb(245,158,11) white (live on its DOM, the same class list), the parity lock demanding the identical palette",
    },
  ],
};

// The gate's rule families (named for the s89 unit battery — pin 6):
// button-name, link-name, label — the structural half's named-control
// proof — plus color-contrast, the family this session's two REAL fixes
// closed (the slate-500 bumps). The wcag2a/wcag2aa/wcag21a/wcag21aa tags
// are the runOnly surface.

async function scanTwoGate(page: import("@playwright/test").Page, label: string) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  await page.addScriptTag({ path: AXE_PATH });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as {
      axe: { run: (o: object) => Promise<{ violations: Array<{ id: string; nodes: Array<{ target: string[] }> }> }> };
    }).axe;
    const r = await axe.run({
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return r.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target.join(" ")),
    }));
  });

  // GATE 1 — structural: every rule OUTSIDE the sanctioned register must
  // be ZERO (button-name is the named-control proof).
  const structural = violations.filter((v: Violation) => !SANCTIONED[v.id]);
  expect(
    structural.map((v: Violation) => `${v.id}: ${v.targets.slice(0, 3).join(" || ")}`),
    `[${label}] STRUCTURAL violations must be zero`,
  ).toEqual([]);

  // GATE 2 — the sanctioned rules: every flagged node must match a
  // sanctioned matcher (a NEW unsanctioned contrast regression REDs here).
  for (const v of violations) {
    const matchers = SANCTIONED[v.id];
    for (const target of v.targets) {
      const sanctioned = matchers.some((m) => m.any.some((a) => target.includes(a)));
      expect(
        sanctioned,
        `[${label}] ${v.id} node "${target}" cites no sanctioned matcher`,
      ).toBe(true);
    }
  }
}

// ---------------------------------------------------------------------------
// The public trio — logged-out (the empty storageState opt-out, the
// auth.spec.ts precedent): every login-family surface at desktop.
// ---------------------------------------------------------------------------
test.describe("the a11y two-gate: the public trio logged-out at desktop", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("desktop /login — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await scanTwoGate(page, "desktop /login");
  });

  test("desktop /signup — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/signup");
    await scanTwoGate(page, "desktop /signup");
  });

  test("desktop /forgotpassword — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/forgotpassword");
    await scanTwoGate(page, "desktop /forgotpassword");
  });

  test("mobile /login at 375 — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await scanTwoGate(page, "mobile /login @375");
  });
});

// ---------------------------------------------------------------------------
// The four authed routes at desktop (1280×800) — the storageState surfaces.
// ---------------------------------------------------------------------------
test.describe("the a11y two-gate: the authed routes at desktop", () => {
  test("desktop /dashboard — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await scanTwoGate(page, "desktop /dashboard");
  });

  test("desktop /mytickets — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/mytickets");
    await scanTwoGate(page, "desktop /mytickets");
  });

  test("desktop /submitticket — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/submitticket");
    await scanTwoGate(page, "desktop /submitticket");
  });

  test("desktop /ticketdetails (first seeded card) — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/mytickets");
    const firstCard = page.locator('a[href*="/ticketdetails"]').first();
    await firstCard.click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    await scanTwoGate(page, "desktop /ticketdetails");
  });
});

// ---------------------------------------------------------------------------
// The three authed routes at mobile (375) — the very destinations the
// mobile nav-tap navigates to (the s80 route+width intersection).
// ---------------------------------------------------------------------------
test.describe("the a11y two-gate: the authed routes at mobile", () => {
  test("mobile /dashboard at 375 — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await scanTwoGate(page, "mobile /dashboard @375");
  });

  test("mobile /mytickets at 375 — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/mytickets");
    await scanTwoGate(page, "mobile /mytickets @375");
  });

  test("mobile /submitticket at 375 — structural zero + sanctioned citations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/submitticket");
    await scanTwoGate(page, "mobile /submitticket @375");
  });

  test("mobile /dashboard with the nav sheet OPEN at 375 — the dialog-open form", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.waitForTimeout(600); // the exit-animation doctrine: the sheet settles open
    await scanTwoGate(page, "mobile /dashboard (nav sheet OPEN) @375");
  });

  test("desktop /ticketdetails with the status Select OPEN — the combobox-open form", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/mytickets");
    const firstCard = page.locator('a[href*="/ticketdetails"]').first();
    await firstCard.click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    await page.getByRole("combobox", { name: "Ticket status" }).click();
    await page.waitForTimeout(600); // the select listbox settles open
    await scanTwoGate(page, "desktop /ticketdetails (status Select OPEN)");
  });
});
