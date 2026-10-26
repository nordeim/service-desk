import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 91 — the visible-focus contract pins (P1: the §13 visible-focus
// two-gate axis — "Visible focus (ring token)", the family skill §13 line's
// OTHER half, unpinned as a per-control census through 90 sessions; the
// s89/s90 two-gate precedent — the structural gate + the sanctioned
// register with citations)
//
// Contract under test: a visible-focus gate is durable ONLY when its
// load-bearing surfaces are held. Four grammars of gate erosion, each
// with a pin:
//
//   D1 — the spec-existence + band grammar: the e2e spec must exist and
//     measure at BOTH bands (375x667 AND 1280x720 — the §13 line scopes
//     focus to no band; the desktop sidebar controls never render at
//     375). Pins 1–2.
//
//   D2 — the measurement-law grammar (the s91 lesson, isolated live at
//     the census): the spec must drive REAL keyboard Tab presses (the
//     :focus-visible engagement — a click or bare focus() does not model
//     the keyboard user), SETTLE the transition before reading (the
//     auth-family buttons carry transition-all duration-200, the nav
//     links duration-300 — a mid-flight read shows the transparent START
//     state and false-positives NONE), parse box-shadow LAYERS for the
//     ring form (a colored spread layer — a bare !== 'none' counts the
//     resting shadow-xs as a ring, the false-positive), and count the
//     default outline as visible (outline-style !== 'none' — Chrome's
//     default ring computes 'auto'; the bare-link family relies on it).
//     Pins 3–6.
//
//   D3 — the registration-census grammar: the explicit registrations are
//     the coverage (one test() per surface, both bands — the s89 a11y
//     census form: the public trio at 1280 + login at 375 + the four
//     authed routes at 1280 + at 375 + the nav-sheet-open dialog form).
//     Pin 7.
//
//   D4 — the two-gate grammar: GATE 2's register-integrity form must
//     hold — the SANCTIONED register exists and every entry carries its
//     citation (a register without citations is a suppression list, the
//     s89 doctrine verbatim). The register is born EMPTY at s91 (the
//     two-systems census found no exceptions — 0 NO-INDICATION on every
//     walk, both systems, both bands); the FORM is what pin 8 holds for
//     every future entry. Pin 8.
//
// Ground truth: the spec's own source. The LIVE two-gate run (the 13
// registrations against the standalone build) is the e2e layer's own law
// — this unit battery holds the gate's SHAPE; the e2e run holds its
// OUTCOME.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const SPEC_PATH = path.join(repoRoot, "tests", "e2e", "visible-focus.spec.ts");

function read(p: string): string {
  return readFileSync(p, "utf8");
}

describe("session 91: the visible-focus contract (the §13 visible-focus two-gate axis — the keyboard-focus census)", () => {
  it("pin 1: the visible-focus spec exists at tests/e2e/visible-focus.spec.ts (the §13 line's other half, unpinned as a census through 90 sessions)", () => {
    expect(
      existsSync(SPEC_PATH),
      "tests/e2e/visible-focus.spec.ts must exist — visible focus is a gate, not a review comment (the family skill §13 line's other half)",
    ).toBe(true);
  });

  it("pin 2: the spec measures at BOTH bands — 375x667 AND 1280x720 (the §13 line scopes focus to no band; the desktop sidebar controls never render at 375, the toggle never at 1280)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      src.includes("375") && src.includes("667"),
      "the spec must set the 375x667 mobile band — the toggle + the nav-sheet live there",
    ).toBe(true);
    expect(
      src.includes("1280") && src.includes("720"),
      "the spec must set the 1280x720 desktop band — the sidebar nav links + the sign-out never render at 375",
    ).toBe(true);
  });

  it("pin 3: the tab-walk form — the spec drives REAL keyboard Tab presses (the :focus-visible engagement; a click-walk or a bare focus() loop does not model the keyboard user, the s6 precedent)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      /keyboard\.press\(\s*["']Tab["']/.test(src),
      "the spec must press real Tab keys — :focus-visible matches keyboard interaction, and the census measures what the keyboard user sees",
    ).toBe(true);
  });

  it("pin 4: the settle-poll form — the spec waits for two consecutive agreeing samples before recording (the transition-all false-NONE guard: the auth buttons fade the ring in over duration-200, the nav links over duration-300 — a mid-flight read shows the transparent START state)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    // The settledMeasure form: poll until two consecutive samples agree.
    expect(
      /settled|consecutive|stabiliz/i.test(src),
      "the spec must carry the settled-read form (a named settle/measure pair) — the transition-all duration-200/300 controls fade the focus ring IN, and a one-shot read false-positives NONE (measured live at the s91 census)",
    ).toBe(true);
    expect(
      /boxShadow/.test(src) && /why|visible/i.test(src),
      "the settled read must compare the computed state (boxShadow) across samples — the agreement IS the settle signal",
    ).toBe(true);
  });

  it("pin 5: the ring-layer parser form — the spec parses box-shadow LAYERS for the colored spread form (zero offsets, zero blur, spread > 0, non-transparent color — never a bare !== 'none', which counts the resting shadow-xs as a ring)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      /ringLayers/.test(src) && /spread/.test(src),
      "the census must parse box-shadow into ringLayers with a spread check — the v4 ring composition emits leading rgba(0,0,0,0) placeholder layers, and only a COLORED SPREAD layer is a real ring (the s91 false-positive, isolated live)",
    ).toBe(true);
    expect(
      /rgba\\\(0, 0, 0, 0\\\)|transparent/.test(src),
      "the parser must reject transparent placeholder layers explicitly — the resting shadow-xs and the composition placeholders are not rings",
    ).toBe(true);
  });

  it("pin 6: the outline-counts clause — outline-style !== 'none' counts as visible (the default outline IS a visible focus indication; the bare-link family relies on it — a ring-only gate would false-fail every bare anchor)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      /outlineStyle/.test(src) && /"none"|'none'/.test(src),
      "the census must read the computed outlineStyle and count !== 'none' as visible — Chrome's default focus ring computes 'auto' (the ticket-card links, the view-switch buttons)",
    ).toBe(true);
  });

  it("pin 7: the explicit registration census — the spec's test( count >= 13 (the public trio at 1280 + login at 375 + the four authed routes at both bands + the nav-sheet-open form, the s89 a11y census coverage form)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    // Count test( at LINE STARTS ONLY (indented declarations) — a bare
    // /\btest\(/g also counts regex .test( calls inside the census code
    // (the P2-mutation find, observed live: the parser's
    // /rgba(...)/.test(m[1]) inflated the count and masked a registration
    // loss). The honest census counts Playwright test() DECLARATIONS.
    const count = (src.match(/\n\s*test\(/g) ?? []).length;
    expect(
      count,
      "the registrations are the coverage — a battery that loses surface cells fails loudly instead of silently shrinking (found fewer than 13)",
    ).toBeGreaterThanOrEqual(13);
  });

  it("pin 8: the register-integrity form — the SANCTIONED register exists and every entry carries its cite (a register without citations is a suppression list, the s89 doctrine verbatim; born EMPTY at s91 — the two-systems census found no exceptions — the form held for every future entry)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      /SANCTIONED/.test(src),
      "the spec must carry the SANCTIONED register declaration — GATE 2's integrity form (empty at birth is the honest state; MISSING is not)",
    ).toBe(true);
    // GATE 2 held at runtime: every entry (if any) carries a real cite.
    const entryBlocks = src.split(/\n/).filter((l) => /^\s*name: "/.test(l));
    for (const line of entryBlocks) {
      const idx = src.indexOf(line);
      const block = src.slice(idx, idx + 900);
      expect(
        /cite:\s*"[^"]{20,}/.test(block),
        `every register entry must carry a real citation — the entry starting "${line.trim().slice(0, 40)}" has no cite field (or a stub under 20 chars)`,
      ).toBe(true);
    }
    // The runtime GATE 2 check rides the spec (the held-at-runtime form,
    // the s90 precedent: the register's citations asserted in the walk).
    expect(
      /cite\.length|entry\.cite/.test(src),
      "the spec must assert the register's citations at RUNTIME too — GATE 2 held in the walk, not only in the unit layer",
    ).toBe(true);
  });
});
