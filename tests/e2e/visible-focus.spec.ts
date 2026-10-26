import { expect, test, type Page } from "@playwright/test";

// Session 91: THE VISIBLE-FOCUS TWO-GATE — the family skill §13 line's
// OTHER half ("Visible focus (ring token)"), unpinned as a per-control
// census through 90 sessions. The s6 focus matrix pins INDIVIDUAL
// controls and the s8 raw-button tails hold the sign-out + the
// attachment Remove — but no spec measured the PER-CONTROL population,
// so a future control shipping outline-none with no replacement ring
// would pass every existing gate. Landed in the s89/s90 two-gate form
// riding the standing harness (the storageState auth, the standalone
// server, the seeded db/e2e.db, the production-build law).
//
// THE GATE (two parts):
//   1. STRUCTURAL — every control the tab-walk reaches on every
//      registration surface must show a VISIBLE focus indication at
//      :focus-visible: a colored ring layer in box-shadow (zero
//      offsets, zero blur, spread > 0, non-transparent color) OR
//      outline-style !== 'none' (Chrome's default focus ring computes
//      'auto' — the default outline IS a visible indication; the
//      bare-link family relies on it). A control matching a
//      sanctioned-register entry escapes with its citation.
//   2. REGISTER INTEGRITY — every sanctioned entry carries its cite
//      (the measured reference figure or the documented superset
//      doctrine). A register without citations is a suppression list
//      (the s89 doctrine verbatim).
//
// THE TWO-SYSTEMS CENSUS (measured live on BOTH DOMs at BOTH bands
// before the register was written): OURS — 0 NO-INDICATION on every
// one of the 15 surface×band walks; THEIRS — 0 NO-INDICATION on every
// one of the 13 reference walks. The shared controls' focus colors
// are byte-identical on both systems: the nav links rgb(59, 130, 246)
// (--sidebar-ring), the Button/Input/Textarea family rgb(10, 10, 10)
// (--ring near-black), the SelectTrigger family cyan-500, the auth
// inputs the 2px white offset + slate ring (the s6 contract), the
// bare <a> family the default outline. THE REGISTER IS BORN EMPTY —
// the census found no exceptions to register; GATE 2 holds the
// citation form for every future entry.
//
// THE MEASUREMENT LAW (the s91 lesson — three traps, all isolated
// live before the census verdict was trusted):
//   (a) THE TRANSITION-ALL FALSE-NONE — the auth-family buttons carry
//       transition-all duration-200 and the nav links duration-300
//       (their own parity-measured classes): the ring's box-shadow
//       FADES IN over the duration, and a mid-flight read shows the
//       transparent START state. The first census pass false-positived
//       the Google button, the Sign-in button, the nav links, and the
//       Report/View-All links. THE FIX: the settled read — poll the
//       computed state until two consecutive samples agree (capped).
//   (b) THE RADIX SELECT TRAP — Tab on the ticketdetails status
//       trigger OPENS the listbox (focus hands to the selected
//       option), Escape returns to the trigger, the next Tab REOPENS
//       it, looping the walk. THE FIX: after two listbox escapes,
//       focus the next unvisited census member directly (the sticky
//       :focus-visible heuristic holds after real keyboard input —
//       verified live: programmatic focus reads :focus-visible true
//       in this Chrome), plus the coverage-completion pass (any
//       member the walk never reached gets measured by direct focus).
//   (c) THE SHADOW-XS FALSE-POSITIVE — a bare boxShadow !== 'none'
//       check counts the resting shadow-xs layer as a ring. THE FIX:
//       parse the box-shadow into LAYERS and accept only the colored
//       spread form (the v4 ring composition emits leading
//       rgba(0,0,0,0) placeholder layers that must not count).
//   The honest exclusion: a DISABLED control is not focusable (the
//   ticketdetails Add Comment button at the empty-textarea state) and
//   never enters the walk.
//
// The 13 registrations are EXPLICIT (one test() per surface, both
// bands — the s89 a11y census coverage form): the public trio at 1280
// + login at 375 + the four authed routes at 1280 + at 375 + the
// nav-sheet-OPEN dialog form.

type FocusStep = {
  tag: string;
  name: string;
  role: string;
  focusVisible: boolean;
  outlineStyle: string;
  ringLayers: Array<{ color: string; spread: number }>;
  visible: boolean;
  why: string;
};

// The SANCTIONED register — tag+name fingerprints, every entry carrying
// its citation. An no-indication control matching NONE of them REDs the
// gate. BORN EMPTY at s91: the two-systems census measured every
// focusable control on every surface at both bands showing a visible
// focus indication — no exceptions to register. The register keeps its
// shape (the s89 doctrine: the escape hatch stays documented and
// cited; an entry without a cite is a suppression entry, not a
// sanction).
const SANCTIONED: Array<{ tag: string; name: string; cite: string }> = [];

// The census population selector (the touch-floor form): the visible
// interactive controls, aria-hidden subtrees skipped (the s89 doctrine).
const SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='combobox']",
  "[role='tab']",
  "[role='switch']",
  "[role='checkbox']",
].join(", ");

// In-page measurement of the currently focused element — the honest
// verdict (the ring-layer parse + the outline clause; NEVER a bare
// boxShadow !== 'none', the shadow-xs false-positive).
async function measure(page: Page): Promise<FocusStep | null> {
  return page.evaluate((): FocusStep | null => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;
    const tag = el.tagName.toLowerCase();
    if (tag === "body" || tag === "html") return null;
    const cs = getComputedStyle(el);
    const name =
      el.getAttribute("aria-label") ||
      el.getAttribute("placeholder") ||
      (el instanceof HTMLInputElement && el.labels && el.labels[0]
        ? el.labels[0].textContent.trim()
        : "") ||
      (el.textContent || "").trim().slice(0, 60);
    // THE RING-LAYER PARSE: a ring layer = zero offsets, zero blur,
    // spread > 0, NON-transparent color. The v4 composition's leading
    // rgba(0,0,0,0) placeholder layers and the resting shadow-xs
    // layers (offset-y > 0 or blur > 0) never count.
    const ringLayers: Array<{ color: string; spread: number }> = [];
    const shadow = cs.boxShadow;
    if (shadow && shadow !== "none") {
      const parts = shadow.split(/,\s*(?=[a-z(])/g);
      for (const layer of parts) {
        const m = layer.match(
          /^\s*((?:rgba?|lab|oklch|hsl)a?\([^)]*\)|#[0-9a-f]+|transparent)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/i,
        );
        if (!m) continue;
        const spread = Number(m[5]);
        if (spread > 0 && m[1] !== "transparent" && !/rgba\(0, 0, 0, 0\)/.test(m[1])) {
          ringLayers.push({ color: m[1], spread });
        }
      }
    }
    // THE OUTLINE CLAUSE: outline-style !== 'none' is visible — Chrome's
    // default focus ring computes 'auto' (the bare-link family).
    const outlineStyle = cs.outlineStyle;
    const hasOutline = outlineStyle !== "none" && outlineStyle !== "";
    const hasRing = ringLayers.length > 0;
    return {
      tag,
      name: (name || "(unnamed)").slice(0, 70),
      role: el.getAttribute("role") || "",
      focusVisible: el.matches(":focus-visible"),
      outlineStyle,
      ringLayers,
      visible: hasRing || hasOutline,
      why: hasRing ? "ring" : hasOutline ? "outline" : "NONE",
    };
  });
}

// THE SETTLED READ (the transition-all false-NONE guard): poll the
// computed state until two consecutive samples agree, capped — the
// auth-family buttons fade the ring in over duration-200, the nav
// links over duration-300; a one-shot read catches the transparent
// START state and false-positives NONE (measured live at the s91
// census).
async function settledMeasure(page: Page): Promise<FocusStep | null> {
  let prev = await measure(page);
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(60);
    const next = await measure(page);
    if (prev && next && prev.why === next.why && prev.visible === next.visible) {
      // Two consecutive agreeing samples — the state has settled.
      return next;
    }
    if (!prev && !next) return null; // focus left the element twice
    prev = next;
  }
  return prev;
}

// Tag the census population in DOM order (for the trap fallback + the
// coverage-completion pass).
async function tagPopulation(page: Page): Promise<number[]> {
  return page.evaluate((sel) => {
    const els = Array.from(document.querySelectorAll(sel));
    const pop: number[] = [];
    els.forEach((el, i) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      if (el.closest("[aria-hidden='true']")) return;
      // Disabled controls are not focusable — the honest exclusion.
      if ((el as HTMLButtonElement).disabled) return;
      el.setAttribute("data-s91-focus", String(i));
      pop.push(i);
    });
    return pop;
  }, SELECTOR);
}

async function focusTagged(page: Page, idx: number): Promise<boolean> {
  return page.evaluate((i) => {
    const el = document.querySelector(`[data-s91-focus="${i}"]`);
    if (!(el instanceof HTMLElement)) return false;
    el.focus();
    return true;
  }, idx);
}

// THE WALK: real Tab presses through the tab order (the :focus-visible
// engagement — the keyboard user's actual experience), with the Radix
// select trap fallback and the sheet's focus-trap cycle detection; the
// coverage-completion pass measures any member the walk never reached.
async function walkFocusState(page: Page, label: string) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400); // the s81 settle form
  const population = await tagPopulation(page);
  const seen: FocusStep[] = [];
  const seenKeys = new Set<string>();
  const visited = new Set<number>();
  let barren = 0;
  let trapEscapes = 0;
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    let step = await settledMeasure(page);
    if (step?.role === "option") {
      // The Radix listbox's transient state — Escape out (focus returns
      // to the trigger, already recorded); a REOPEN (the trap) hops the
      // fallback: focus the next unvisited census member directly.
      await page.keyboard.press("Escape");
      trapEscapes += 1;
      barren += 1;
      if (trapEscapes >= 2) {
        trapEscapes = 0;
        const nextIdx = population.find((p) => !visited.has(p));
        if (nextIdx === undefined) break;
        if (!(await focusTagged(page, nextIdx))) break;
        step = await settledMeasure(page);
      } else {
        continue;
      }
    }
    if (!step) break; // focus fell to body — the walk is done
    const idx = await page.evaluate(() => {
      const a = document.activeElement;
      return a ? a.getAttribute("data-s91-focus") : null;
    });
    if (idx !== null) visited.add(Number(idx));
    const key = `${step.tag}|${step.name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      seen.push(step);
      barren = 0;
    } else {
      barren += 1;
      if (barren > 10) break; // cycle detection (the sheet's focus trap)
    }
  }
  // Coverage completion: any census member the walk never reached gets
  // measured by direct focus (the sticky :focus-visible heuristic).
  for (const p of population) {
    if (visited.has(p)) continue;
    if (!(await focusTagged(page, p))) continue;
    const step = await settledMeasure(page);
    if (!step) continue;
    const key = `${step.tag}|${step.name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      seen.push(step);
    }
  }
  expect(
    seen.length,
    `[${label}] the census must find focusable controls (an empty census is a navigation failure, not a pass)`,
  ).toBeGreaterThan(0);

  // GATE 2 — register integrity, held at RUNTIME: every register entry
  // carries a real citation (a register without citations is a
  // suppression list — the s89 doctrine verbatim).
  for (const entry of SANCTIONED) {
    expect(
      entry.cite.length,
      `[${label}] the register entry "${entry.tag}:${entry.name}" carries no citation`,
    ).toBeGreaterThanOrEqual(20);
  }

  // GATE 1 — structural: every walked control shows a visible focus
  // indication at :focus-visible OR matches a sanctioned entry.
  const offenders: string[] = [];
  for (const c of seen) {
    if (c.visible) continue;
    const sanctioned = SANCTIONED.find((s) => s.tag === c.tag && s.name === c.name);
    if (!sanctioned) {
      offenders.push(`${c.tag} "${c.name}" (${c.why})`);
    }
  }
  expect(
    offenders,
    `[${label}] controls showing NO visible focus indication at :focus-visible (a NEW control with outline-none and no replacement ring is a gate failure — the family skill §13: "Visible focus (ring token)")`,
  ).toEqual([]);
}

// ---------------------------------------------------------------------------
// The public trio at 1280 + login at 375 — logged-out (the empty
// storageState opt-out, the auth.spec.ts precedent).
// ---------------------------------------------------------------------------
test.describe("the visible-focus two-gate: the public surfaces", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("public login @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/login");
    await walkFocusState(page, "public login @1280");
  });

  test("public signup @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/signup");
    await walkFocusState(page, "public signup @1280");
  });

  test("public forgotpassword @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/forgotpassword");
    await walkFocusState(page, "public forgotpassword @1280");
  });

  test("public login @375x667 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await walkFocusState(page, "public login @375");
  });
});

// ---------------------------------------------------------------------------
// The four authed routes at 1280 — the desktop band (the sidebar nav
// links + the sign-out never render at 375).
// ---------------------------------------------------------------------------
test.describe("the visible-focus two-gate: the authed routes at 1280x720", () => {
  test("dashboard @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");
    await walkFocusState(page, "dashboard @1280");
  });

  test("mytickets @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/mytickets");
    await walkFocusState(page, "mytickets @1280");
  });

  test("submitticket @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/submitticket");
    await walkFocusState(page, "submitticket @1280");
  });

  test("ticketdetails (first seeded card) @1280x720 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/mytickets");
    const firstCard = page.locator('a[href*="/ticketdetails"]').first();
    await firstCard.click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    await walkFocusState(page, "ticketdetails @1280");
  });
});

// ---------------------------------------------------------------------------
// The four authed routes at 375 — the mobile band (the toggle + the
// sheet family).
// ---------------------------------------------------------------------------
test.describe("the visible-focus two-gate: the authed routes at 375x667", () => {
  test("dashboard @375x667 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await walkFocusState(page, "dashboard @375");
  });

  test("mytickets @375x667 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/mytickets");
    await walkFocusState(page, "mytickets @375");
  });

  test("submitticket @375x667 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/submitticket");
    await walkFocusState(page, "submitticket @375");
  });

  test("ticketdetails (first seeded card) @375x667 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/mytickets");
    const firstCard = page.locator('a[href*="/ticketdetails"]').first();
    await firstCard.click();
    await page.waitForURL(/\/ticketdetails\?id=/);
    await walkFocusState(page, "ticketdetails @375");
  });
});

// ---------------------------------------------------------------------------
// The nav-sheet-OPEN dialog form at 375 — the mobile menu surface itself
// (the s41 lineage real-click form: the toggle opens, the walk measures
// the sheet's own controls; the focus trap cycles — the walk ends by
// cycle detection).
// ---------------------------------------------------------------------------
test.describe("the visible-focus two-gate: the mobile nav sheet OPEN at 375x667", () => {
  test("dashboard with the nav sheet OPEN @375x667 — the visible-focus census", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    const toggle = page.getByRole("button", { name: "Toggle Sidebar" });
    await toggle.click();
    await page.waitForTimeout(500); // the sheet entrance settle (the s81 form)
    await walkFocusState(page, "dashboard nav-sheet-open @375");
  });
});
