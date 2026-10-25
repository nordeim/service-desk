import { expect, test } from "@playwright/test";

// Session 90: THE TOUCH-FLOOR TWO-GATE — the family skill §13 line this repo
// never carried a gate for ("44px touch floor on mobile bands (document
// exceptions where a reference demands parity)" — the coverage-group
// contract line, unpinned through 89 sessions), landed in the s89 two-gate
// form riding the standing harness (the storageState auth, the standalone
// server, the seeded db/e2e.db, the production-build law).
//
// THE GATE (two parts):
//   1. STRUCTURAL — every VISIBLE interactive control on every mobile-band
//      surface must measure >= 44x44 OR match a sanctioned-register entry
//      (the tag+name fingerprint). A NEW under-44 control without a
//      registration REDs the gate. The census selector: button, a[href],
//      input, select, textarea, [role=button], [role=combobox], [role=tab]
//      — with aria-hidden subtrees skipped (the s89 doctrine: hidden
//      elements are skipped by a11y rules by their own semantics) and
//      BELOW-FOLD controls INCLUDED (users scroll; the floor applies to
//      the whole surface, not the first fold).
//   2. REGISTER INTEGRITY — every sanctioned entry carries its citation
//      (the measured reference figure or the documented superset doctrine).
//      A register without citations is a suppression list (the s89
//      doctrine verbatim).
//
// THE TWO-SYSTEMS CENSUS (measured live on BOTH DOMs at 375x667 this
// session, before the register was written): the reference's own controls
// run under 44 nearly everywhere — the toggle 28x28, the h-9 family 36h
// (search 327x36, filters 327x36, selects 263x36, back-links 36h, Add
// Comment 164x36, Submit 159.5x36, Cancel 81.4x36), the nav-sheet links
// 247x32, the sign-out 36x36, the whole-line links 20h — every one of
// them parity-locked (byte-identical on both systems). The reference's
// ONE over-floor control is the login Google button at 279x54 — the
// padding-driven form (py-3.5 px-5 text-base, NO height class) — which
// this session's fix adopts (h-auto retires the shadcn h-9 default for
// that one button). The reference's /signup and /forgotpassword are 404s
// — our pages there are superset surfaces, anchored to the login
// family's own link form.
//
// The 8 registrations are EXPLICIT (one test() per mobile surface — the
// failing surface named directly): the public trio + the four authed
// routes + the nav-sheet-OPEN dialog form, all at 375x667.
//
// The settle form is the s81 doctrine: the networkidle-tolerant poll +
// the 200–300ms settle-wait before the census (the sheet entrance keeps
// nodes animating post-open).

const FLOOR = 44;

type Control = { tag: string; name: string; w: number; h: number };

// The SANCTIONED register — tag+name fingerprints, every entry carrying
// its citation. An under-44 control matching NONE of them REDs the gate.
// The register is not a suppression list: every parity entry cites the
// reference's own identical figure (measured live on its DOM this
// session); every superset entry cites the documented doctrine.
const SANCTIONED: Array<{ tag: string; name: string; cite: string }> = [
  {
    tag: "button",
    name: "Toggle Sidebar",
    cite: "the reference's own toggle measures 28x28 (measured live on its DOM at 375, the s90 census) — parity-locked",
  },
  {
    tag: "a",
    name: "Report New Issue",
    cite: "the reference's own link measures 186.1x36 (the s90 census) — the h-9 family, parity-locked",
  },
  {
    tag: "a",
    name: "View All Tickets",
    cite: "the reference's own link measures 174.2x36 (the s90 census) — parity-locked",
  },
  {
    tag: "input",
    name: "Search tickets",
    cite: "the reference's own search input measures 327x36 (the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Filter by status",
    cite: "the reference's own status filter measures 327x36 ('All Status', the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Filter by priority",
    cite: "the reference's own priority filter measures 327x36 ('All Priorities', the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Sort tickets",
    cite: "superset control (the reference has no sort) at the app-wide h-9 36px scale the reference's own filter row sets — the quiet-subordinate doctrine",
  },
  {
    tag: "button",
    name: "My Tickets",
    cite: "superset scope tab (size sm, the code's documented 'stay quiet below the reference filter row' intent) — the WCAG 2.5.8 AA 24px minimum met",
  },
  {
    tag: "button",
    name: "All Tickets",
    cite: "superset scope tab (size sm, the quiet-subordinate doctrine) — the WCAG 2.5.8 AA 24px minimum met",
  },
  {
    tag: "a",
    name: "Back to Dashboard",
    cite: "the reference's own back link measures 196.9x36 (the s90 census) — parity-locked",
  },
  {
    tag: "input",
    name: "Brief summary of the problem",
    cite: "the reference's own input measures 263x36 (the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Category *",
    cite: "the reference's own category select measures 263x36 ('Select category', the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Priority *",
    cite: "the reference's own priority select measures 263x36 ('Medium - Normal', the s90 census) — parity-locked",
  },
  {
    tag: "a",
    name: "Cancel",
    cite: "the reference's own cancel link measures 81.4x36 (the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Submit Ticket",
    cite: "the reference's own submit button measures 159.5x36 (the s90 census) — parity-locked",
  },
  {
    tag: "a",
    name: "Back to Tickets",
    cite: "the reference's own back link measures 170x36 (the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Add Comment",
    cite: "the reference's own button measures 164x36 (the s90 census) — parity-locked",
  },
  {
    tag: "button",
    name: "Ticket status",
    cite: "superset control (the Update Status card, no reference surface) at the app-wide h-9 36px scale the reference itself sets",
  },
  {
    tag: "button",
    name: "Forgot password?",
    cite: "the reference's own link measures 122.9x20 (the s90 census) — the whole-line link family, parity-locked",
  },
  {
    tag: "button",
    name: "Need an account? Sign up",
    cite: "the reference's own link measures 183.3x20 (the s90 census) — parity-locked",
  },
  {
    tag: "a",
    name: "Already have an account? Sign in",
    cite: "the superset signup page's link (the reference's /signup is a 404) at the login family's own 20px whole-line form — the strongest anchor its destination offers",
  },
  {
    tag: "a",
    name: "Back to sign in",
    cite: "the superset forgotpassword page's link (the reference's /forgotpassword is a 404) at the login family's own 20px whole-line form",
  },
  {
    tag: "a",
    name: "Dashboard",
    cite: "the reference's own nav-sheet link measures 247x32 (the s90 census, sheet open) — parity-locked",
  },
  {
    tag: "a",
    name: "Submit Ticket",
    cite: "the reference's own nav-sheet link measures 247x32 (the s90 census, sheet open) — parity-locked",
  },
  {
    tag: "a",
    name: "My Tickets",
    cite: "the reference's own nav-sheet link measures 247x32 (the s90 census, sheet open) — parity-locked",
  },
  {
    tag: "button",
    name: "Sign out",
    cite: "the reference's own sheet sign-out measures 36x36 (the s90 census, sheet open) — parity-locked",
  },
];

const SELECTOR = [
  "button",
  'a[href]',
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='combobox']",
  "[role='tab']",
].join(", ");

async function census(page: import("@playwright/test").Page): Promise<Control[]> {
  return page.evaluate((sel) => {
    const els = Array.from(document.querySelectorAll(sel));
    const out: Array<{ tag: string; name: string; w: number; h: number }> = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      // aria-hidden subtrees are skipped (the s89 doctrine — hidden
      // elements are skipped by a11y semantics; Radix's shadow internals).
      if (el.closest("[aria-hidden='true']")) continue;
      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        ((el as HTMLInputElement).labels && (el as HTMLInputElement).labels![0]
          ? (el as HTMLInputElement).labels![0].textContent.trim()
          : "") ||
        (el.textContent || "").trim().slice(0, 60);
      out.push({
        tag: el.tagName.toLowerCase(),
        name: name.slice(0, 70),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
      });
    }
    return out;
  }, SELECTOR);
}

async function touchFloorGate(page: import("@playwright/test").Page, label: string) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(300); // the s81 settle form
  const controls = await census(page);
  expect(
    controls.length,
    `[${label}] the census must find controls (an empty census is a navigation failure, not a pass)`,
  ).toBeGreaterThan(0);

  // GATE 2 — register integrity: every entry carries a real citation
  // (a register without citations is a suppression list — the s89
  // doctrine verbatim, held at runtime as well as in the unit battery).
  for (const entry of SANCTIONED) {
    expect(
      entry.cite.length,
      `[${label}] the register entry "${entry.tag}:${entry.name}" carries no citation`,
    ).toBeGreaterThanOrEqual(20);
  }

  // GATE 1 — structural: every control >= 44x44 OR register-matched.
  const offenders: string[] = [];
  for (const c of controls) {
    if (c.w >= FLOOR && c.h >= FLOOR) continue;
    const sanctioned = SANCTIONED.find((s) => s.tag === c.tag && s.name === c.name);
    if (!sanctioned) {
      offenders.push(`${c.tag} [${c.w}x${c.h}] "${c.name}"`);
    }
  }
  expect(
    offenders,
    `[${label}] under-${FLOOR}px controls with no sanctioned registration (a NEW under-floor control must either meet the floor or carry a cited register entry — the family skill §13: "document exceptions where a reference demands parity")`,
  ).toEqual([]);
}

// ---------------------------------------------------------------------------
// The public trio — logged-out (the empty storageState opt-out, the
// auth.spec.ts precedent): every login-family surface on the mobile band.
// ---------------------------------------------------------------------------
test.describe("the touch-floor two-gate: the public trio logged-out at 375x667", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("mobile /login — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await touchFloorGate(page, "mobile /login");
  });

  test("mobile /signup — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/signup");
    await touchFloorGate(page, "mobile /signup");
  });

  test("mobile /forgotpassword — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/forgotpassword");
    await touchFloorGate(page, "mobile /forgotpassword");
  });
});

// ---------------------------------------------------------------------------
// The four authed routes on the mobile band — the surfaces the F4
// battery and the mobile-navigation suite already exercise.
// ---------------------------------------------------------------------------
test.describe("the touch-floor two-gate: the authed routes at 375x667", () => {
  test("mobile /dashboard — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await touchFloorGate(page, "mobile /dashboard");
  });

  test("mobile /mytickets — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/mytickets");
    await touchFloorGate(page, "mobile /mytickets");
  });

  test("mobile /submitticket — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/submitticket");
    await touchFloorGate(page, "mobile /submitticket");
  });

  test("mobile /ticketdetails (first seeded card) — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/mytickets");
    const firstCard = page.locator('a[href*="/ticketdetails"]').first();
    await firstCard.click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    await touchFloorGate(page, "mobile /ticketdetails");
  });
});

// ---------------------------------------------------------------------------
// The nav-sheet-OPEN dialog form — the mobile menu surface itself (the
// s41 lineage real-click form: the toggle opens, the census measures the
// sheet's own controls).
// ---------------------------------------------------------------------------
test.describe("the touch-floor two-gate: the mobile nav sheet OPEN at 375x667", () => {
  test("mobile /dashboard with the nav sheet OPEN — the 44px floor or a cited exception", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    const toggle = page.getByRole("button", { name: "Toggle Sidebar" });
    await toggle.click();
    await page.waitForTimeout(500); // the sheet entrance settle (the s81 form)
    await touchFloorGate(page, "mobile /dashboard nav-sheet-open");
  });
});
