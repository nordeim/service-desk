import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 90 — the touch-floor contract pins (P1: the §13 44px touch-target
// floor two-gate axis — "44px touch floor on mobile bands (document
// exceptions where a reference demands parity)", the family skill §13 line
// this repo had never carried a gate for; the s89 two-gate precedent — the
// structural gate + the sanctioned register with citations)
//
// Contract under test: a touch-target gate is durable ONLY when its
// load-bearing surfaces are held. Three grammars of gate erosion, each
// with a pin:
//
//   D1 — the spec-existence + band grammar: the e2e spec must exist and
//     measure at the MOBILE band (375x667 — the width the F4 battery and
//     the mobile-navigation suite already exercise), with the floor
//     constant (44) named once at the top. Pins 1–3.
//
//   D2 — the two-gate grammar: the spec must carry BOTH gates — GATE 1
//     the structural form (every visible interactive control >= 44x44 OR
//     register-matched; a NEW under-44 control without a registration
//     REDs) and GATE 2 the register-integrity form (every sanctioned
//     entry carries its cite — a register without citations is a
//     suppression list, the s89 doctrine verbatim). Pins 4–5.
//
//   D3 — the registration-census + source-fix grammar: the explicit
//     registrations are the coverage (one test() per mobile surface, the
//     failing surface named directly), and the two s90 code fixes are
//     pinned at their sources — the login Google button's
//     padding-driven form (h-auto + py-3.5 — the h-9 default must never
//     ride this one button; the reference's own computed box is 279x54,
//     measured live on its DOM) and the signup/forgotpassword links'
//     inline-block form (the 20px touch box, the login family's own
//     form). Pins 6–8.
//
// Ground truth: the spec's own source + the three page sources. The LIVE
// two-gate run (the 8 registrations against the standalone build) is the
// e2e layer's own law — this unit battery holds the gate's SHAPE; the
// e2e run holds its OUTCOME.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const SPEC_PATH = path.join(repoRoot, "tests", "e2e", "touch-floor.spec.ts");
const LOGIN_PAGE = path.join(repoRoot, "src", "app", "login", "page.tsx");
const SIGNUP_PAGE = path.join(repoRoot, "src", "app", "signup", "page.tsx");
const FORGOT_PAGE = path.join(repoRoot, "src", "app", "forgotpassword", "page.tsx");

function read(p: string): string {
  return readFileSync(p, "utf8");
}

describe("session 90: the touch-floor contract (the §13 44px touch-target two-gate axis — the mobile band)", () => {
  it("pin 1: the touch-floor spec exists at tests/e2e/touch-floor.spec.ts (the §13 line unpinned through 89 sessions)", () => {
    expect(
      existsSync(SPEC_PATH),
      "tests/e2e/touch-floor.spec.ts must exist — the 44px touch floor on mobile bands is a gate, not a review comment",
    ).toBe(true);
  });

  it("pin 2: the spec measures at the MOBILE band — the 375x667 viewport (the width the F4 battery and the mobile-navigation suite already exercise)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      src.includes("375") && src.includes("667"),
      "the spec must set the 375x667 viewport — the mobile band is the measured surface (a 1280-only census is a desktop census)",
    ).toBe(true);
  });

  it("pin 3: the floor constant is 44, named at the spec's top (the family skill's own figure — not 24, not 36)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    const m = src.match(/const\s+FLOOR\s*=\s*(\d+)/);
    expect(
      m,
      "the spec must name its floor as a top-level const FLOOR — a magic number scattered through assertions is drift bait",
    ).not.toBeNull();
    expect(Number(m?.[1]), "the floor is 44 (the family skill §13 line; 24 is the AA minimum, 44 the skill's mobile-band floor)").toBe(44);
  });

  it("pin 4: the structural gate form — every control >= 44x44 OR register-matched (the register escape is the ONLY escape; a bare toBeLessThan sweep would fail every parity-locked control)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    expect(
      src.includes("SANCTIONED"),
      "the spec must carry a SANCTIONED register — the parity lock demands documented exceptions (the family skill's own parenthetical)",
    ).toBe(true);
    expect(
      src.includes("w") && src.includes("h") && src.includes("FLOOR"),
      "the census must measure BOTH dimensions against the FLOOR constant",
    ).toBe(true);
  });

  it("pin 5: the sanctioned-register citation form — every register entry carries its cite (a register without citations is a suppression list, the s89 doctrine verbatim)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    // Every register entry object must include a cite: string field.
    const entries = src.split(/\n/).filter((l) => /^\s*name: "/.test(l));
    expect(
      entries.length,
      "the register must carry named entries (the tag+name fingerprint form)",
    ).toBeGreaterThanOrEqual(8);
    for (const line of entries) {
      // Each entry block (name → ... → cite) must carry a non-empty cite.
      const idx = src.indexOf(line);
      const block = src.slice(idx, idx + 900);
      expect(
        /cite:\s*"[^"]{20,}/.test(block),
        `every register entry must carry a real citation — the entry starting "${line.trim().slice(0, 40)}" has no cite field (or a stub under 20 chars)`,
      ).toBe(true);
    }
  });

  it("pin 6: the explicit registration floor — the spec's test( count >= 8 (one per mobile surface: the public trio + the four authed routes + the nav-sheet-open form)", () => {
    expect(existsSync(SPEC_PATH), "the spec must exist (pin 1)").toBe(true);
    const src = read(SPEC_PATH);
    const count = (src.match(/\btest\(/g) ?? []).length;
    expect(
      count,
      "the registrations are the coverage — a battery that loses surface cells fails loudly instead of silently shrinking (found fewer than 8)",
    ).toBeGreaterThanOrEqual(8);
  });

  it("pin 7: the login Google button's PADDING-DRIVEN form — h-auto + py-3.5 (the h-9 default must never ride this one button: the reference's own computed box is 279x54, measured live on its DOM; a bare h-9 pins 36px and the py-3.5 becomes a costume)", () => {
    const src = read(LOGIN_PAGE);
    // The Google button is the page's ONLY py-3.5 className line (the
    // comment mentions aside) — anchor on the className line itself.
    const clsLine = src
      .split("\n")
      .find((l) => l.includes("py-3.5") && l.includes("className="));
    expect(
      clsLine,
      "the login page must carry the Google button's className with the reference's measured padding (py-3.5 — the 14px pair)",
    ).toBeDefined();
    expect(
      /\bh-auto\b/.test(clsLine ?? ""),
      "the Google button's className must carry h-auto — the explicit h-9 height class overrides the padding and pins the 36px touch box (the s90 census: ours 36 vs the reference's 54)",
    ).toBe(true);
  });

  it("pin 8: the signup + forgotpassword links' INLINE-BLOCK form — the 20px touch box (the login family's own form; a bare inline link measures the 16px font box, the s90 census's internal-inconsistency find)", () => {
    const signup = read(SIGNUP_PAGE);
    const signupBlock = signup.split("Already have an account?")[0].slice(-400);
    expect(
      /inline-block/.test(signupBlock),
      "the signup 'Already have an account? Sign in' link must carry inline-block — the login family's 20px touch-box form (a bare inline link measures 16px)",
    ).toBe(true);

    const forgot = read(FORGOT_PAGE);
    const blocks = forgot.split("Back to sign in");
    // The FORM-state link (the second occurrence; the first is the
    // success-state link which already carried the form).
    const formBlock = blocks.length >= 2 ? blocks[blocks.length - 2].slice(-400) : "";
    expect(
      /inline-block/.test(formBlock),
      "the forgotpassword form-state 'Back to sign in' link must carry inline-block — the same 20px touch-box form",
    ).toBe(true);
  });
});
