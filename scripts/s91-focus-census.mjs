// S91 census: the §13 visible-focus audit ("Visible focus (ring token)" —
// the family skill §13 line's OTHER half, unpinned as a per-control census
// through 90 sessions; the s6 focus matrix pins individual controls, never
// the structural whole-surface population).
// Method: the REAL keyboard tab-walk (page.keyboard Tab presses — real
// keyboard interaction is what engages :focus-visible, the s6 precedent).
// The HONEST verdict per focused control, distinguishing the focus ring
// from the resting shadow-xs (the s91 lesson: a bare boxShadow!=='none'
// check false-positives every shadow-carrying control):
//   - ring layer: a box-shadow LAYER of the Tailwind ring shape — zero
//     offsets, zero blur, spread > 0 — with a NON-TRANSPARENT color (the
//     v4 ring composition emits leading rgba(0,0,0,0) placeholder layers;
//     only a colored spread layer is a real ring);
//   - outline: outline-style !== 'none' (Chrome's default focus ring
//     computes outline-style 'auto' — the default outline IS a visible
//     focus indication, and its color is recorded for the parity read);
//   - NONE: neither — the offender class.
// Radix Select handling: Tab on a focused SelectTrigger OPENS the listbox
// and hands focus to the selected option (measured live this session); the
// options are the widget's TRANSIENT focus states, not stable tab-order
// members — the walk presses Escape out of the open listbox and continues
// (the real keyboard user's path: arrows inside, Escape/Enter back to the
// trigger). The sheet (focus-trapped dialog) terminates the walk by cycle
// detection: 10 consecutive steps producing no new fingerprints.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.S91_BASE ?? "http://127.0.0.1:3901";
const OUT = "/tmp/s91-results/focus-census";
mkdirSync(OUT, { recursive: true });

const SURFACES_AUTHED_DESKTOP = [
  { name: "dashboard", url: "/dashboard" },
  { name: "mytickets", url: "/mytickets" },
  { name: "submitticket", url: "/submitticket" },
  { name: "ticketdetails", url: null }, // first seeded ticket id
];

const SURFACES_AUTHED_MOBILE = [
  { name: "dashboard", url: "/dashboard" },
  { name: "mytickets", url: "/mytickets" },
  { name: "submitticket", url: "/submitticket" },
  { name: "ticketdetails", url: null }, // first seeded ticket id
  { name: "dashboard-navsheet", url: "/dashboard", openNav: true },
];

const SURFACES_PUBLIC = [
  { name: "login", url: "/login" },
  { name: "signup", url: "/signup" },
  { name: "forgotpassword", url: "/forgotpassword" },
];

const BANDS = [
  { label: "m375", width: 375, height: 667 },
  { label: "d1280", width: 1280, height: 720 },
];

// In-page measurement of the currently focused element.
const MEASURE = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const tag = el.tagName.toLowerCase();
  const cs = getComputedStyle(el);
  const name =
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : "") ||
    (el.textContent || "").trim().slice(0, 60);
  // Parse the box-shadow layers for the ring shape (0 0 0 spread, colored).
  const ringLayers = [];
  const shadow = cs.boxShadow;
  if (shadow && shadow !== "none") {
    // Chrome serializes one layer per "x y b s color" group, comma-joined;
    // colors may contain commas (rgb()/lab()) — match from the END.
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
  const outlineStyle = cs.outlineStyle;
  const hasOutline = outlineStyle !== "none" && outlineStyle !== "";
  return {
    tag,
    name: (name || "(unnamed)").slice(0, 70),
    role: el.getAttribute("role") || "",
    focusVisible: el.matches(":focus-visible"),
    outlineStyle,
    outlineWidth: cs.outlineWidth,
    outlineColor: cs.outlineColor,
    boxShadow: shadow.slice(0, 220),
    ringLayers,
    outline: hasOutline,
    visible: ringLayers.length > 0 || hasOutline,
    why: ringLayers.length > 0 ? "ring" : hasOutline ? "outline" : "NONE",
  };
};

// THE S91 MEASUREMENT LAW: a transition-all control fades its focus ring in
// over the duration (duration-200 on the auth-family buttons, duration-300
// on the nav links — measured live this session); a mid-flight read shows
// the transparent START state, a false NONE. Poll the computed state until
// two consecutive samples agree, capped at 600ms.
async function settledMeasure(page) {
  let prev = await page.evaluate(MEASURE);
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(60);
    const next = await page.evaluate(MEASURE);
    if (prev && next && prev.why === next.why && prev.boxShadow === next.boxShadow) return next;
    prev = next;
  }
  return prev;
}

// Pre-collect the census population in DOM order (the touch-floor selector
// form) and tag each member with a data index — the fallback path focuses
// them directly when the Radix select trap eats the Tab walk.
const TAG_POPULATION = (sel) => {
  const els = Array.from(document.querySelectorAll(sel));
  const pop = [];
  els.forEach((el, i) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    if (el.closest("[aria-hidden='true']")) return;
    el.setAttribute("data-s91", String(i));
    pop.push(i);
  });
  return pop;
};

const FOCUS_NEXT = (idx) => {
  const el = document.querySelector(`[data-s91="${idx}"]`);
  if (!el) return false;
  el.focus();
  return true;
};

async function walkSurface(page, label) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400); // the s81 settle form
  // Tag the population (DOM order) for the fallback.
  const population = await page.evaluate(
    (sel) => {
      const els = Array.from(document.querySelectorAll(sel));
      const pop = [];
      els.forEach((el, i) => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        if (el.closest("[aria-hidden='true']")) return;
        el.setAttribute("data-s91", String(i));
        pop.push(i);
      });
      return pop;
    },
    "button, a[href], input:not([type='hidden']), select, textarea, [role='button'], [role='combobox'], [role='tab'], [role='switch'], [role='checkbox']",
  );
  const seen = [];
  const seenKeys = new Set();
  const visitedIdx = new Set();
  let barren = 0;
  let trapEscapes = 0;
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    let step = await settledMeasure(page);
    if (step?.role === "option") {
      // The Radix listbox's transient state — Escape out (focus returns to
      // the trigger, already recorded); a REOPEN (trap) hops the fallback.
      await page.keyboard.press("Escape");
      trapEscapes += 1;
      barren += 1;
      if (trapEscapes >= 2) {
        // Trapped: Tab reopens the listbox. Focus the next unvisited census
        // member directly (the sticky :focus-visible heuristic holds after
        // real keyboard input — verified live: programmatic focus reads
        // :focus-visible true in this Chrome) and continue the walk.
        trapEscapes = 0;
        const nextIdx = population.find((p) => !visitedIdx.has(p));
        if (nextIdx === undefined) break;
        const ok = await page.evaluate((idx) => {
          const el = document.querySelector(`[data-s91="${idx}"]`);
          if (!el) return false;
          el.focus();
          return true;
        }, nextIdx);
        if (!ok) break;
        step = await settledMeasure(page);
      } else {
        continue;
      }
    }
    if (!step) break; // focus fell to body — the walk is done
    const idx = await page.evaluate(() => {
      const a = document.activeElement;
      return a ? a.getAttribute("data-s91") : null;
    });
    if (idx !== null && idx !== undefined) visitedIdx.add(Number(idx));
    const key = `${step.tag}|${step.name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      seen.push(step);
      barren = 0;
    } else {
      barren += 1;
      if (barren > 10) break; // cycle detection (the sheet trap)
    }
  }
  // Coverage completion: any census member the walk never reached (the
  // select-trap skipped members) gets measured by direct focus.
  for (const p of population) {
    if (visitedIdx.has(p)) continue;
    const ok = await page.evaluate((idx) => {
      const el = document.querySelector(`[data-s91="${idx}"]`);
      if (!el) return false;
      el.focus();
      return true;
    }, p);
    if (!ok) continue;
    const step = await settledMeasure(page);
    if (!step) continue;
    const key = `${step.tag}|${step.name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      seen.push(step);
    }
  }
  return { label, count: seen.length, controls: seen };
}

async function authed(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', "demo@servicedesk.app");
  await page.fill('input[type="password"]', "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/);
}

const browser = await chromium.launch();
const summaries = [];
for (const band of BANDS) {
  const ctx = await browser.newContext({
    viewport: { width: band.width, height: band.height },
  });
  const page = await ctx.newPage();
  await authed(page);

  const surfaces = band.label === "m375" ? SURFACES_AUTHED_MOBILE : SURFACES_AUTHED_DESKTOP;
  for (const s of surfaces) {
    if (!s.url) {
      await page.goto(`${BASE}/mytickets`);
      await page.waitForLoadState("networkidle").catch(() => {});
      const first = page.locator('a[href*="/ticketdetails"]').first();
      await first.click();
      await page.waitForURL(/\/ticketdetails\?id=/);
    } else {
      await page.goto(`${BASE}${s.url}`);
    }
    if (s.openNav) {
      const toggle = page.getByRole("button", { name: "Toggle Sidebar" });
      await toggle.click();
      await page.waitForTimeout(500); // the sheet entrance settle
    }
    const walk = await walkSurface(page, `${s.name}@${band.label}`);
    writeFileSync(
      `${OUT}/${s.name}-${band.label}.json`,
      JSON.stringify(walk, null, 2),
    );
    const noInd = walk.controls.filter((c) => !c.visible);
    summaries.push(
      `${s.name}@${band.label}: ${walk.count} controls, ${noInd.length} NO-INDICATION` +
        (noInd.length
          ? ` -> ${noInd.map((c) => `${c.tag}[${c.name}]`).join(", ")}`
          : ""),
    );
  }

  const pubCtx = await browser.newContext({
    viewport: { width: band.width, height: band.height },
  });
  const pub = await pubCtx.newPage();
  for (const s of SURFACES_PUBLIC) {
    await pub.goto(`${BASE}${s.url}`);
    const walk = await walkSurface(pub, `${s.name}@${band.label}-public`);
    writeFileSync(
      `${OUT}/${s.name}-${band.label}-public.json`,
      JSON.stringify(walk, null, 2),
    );
    const noInd = walk.controls.filter((c) => !c.visible);
    summaries.push(
      `${s.name}@${band.label}-public: ${walk.count} controls, ${noInd.length} NO-INDICATION` +
        (noInd.length
          ? ` -> ${noInd.map((c) => `${c.tag}[${c.name}]`).join(", ")}`
          : ""),
    );
  }
  await pubCtx.close();
  await ctx.close();
}
await browser.close();

console.log("=== S91 VISIBLE-FOCUS CENSUS (our side) ===");
for (const line of summaries) console.log(line);
