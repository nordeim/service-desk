import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 89 — the a11y-gate contract pins (P1: the §13 axe-core two-gate
// axis — "axe-core runs in the e2e suite; a11y regressions are gate
// failures, not review comments", the family skill §13 line this repo had
// never carried a gate for; the neo-crm session-171 precedent — the
// declared-devDep doctrine (F-171e) + the two-gate form)
//
// Contract under test: an a11y gate is durable ONLY when its load-bearing
// surfaces are held. Three grammars of gate erosion, each with a pin:
//
//   D1 — the declared-engine grammar: the gate must ride a DECLARED
//     devDependency, never an undeclared transitive (the eslint-plugin-
//     jsx-a11y edge carried axe-core as a transitive since the beginning —
//     an eslint-config bump could drop it and the gate would ENOENT at
//     runtime, silently outside every unit-level check). Pins 1+2.
//
//   D2 — the spec-existence + engine-form grammar: the e2e spec must exist
//     and inject the engine from the DECLARED devDep's on-disk path
//     (never a CDN fetch — supply-chain drift), run the four WCAG tag
//     families (the strict subset, no best-practice noise), carry the
//     structural gate (the named-control proof: button-name + link-name +
//     label), and carry the sanctioned register with citations (every
//     sanctioned rule entry names why — a sanctioned register without
//     citations is a suppression list). Pins 3–7.
//
//   D3 — the registration-census grammar: the explicit registrations are
//     the coverage — one test() per surface × width; a battery that
//     loses surface cells fails the floor loudly instead of silently
//     shrinking. Pin 8.
//
// Ground truth: package.json + the resident node_modules copy + the spec's
// own source. The LIVE two-gate run (the 13 registrations against the
// standalone build) is the e2e layer's own law — this unit battery holds
// the gate's SHAPE; the e2e run holds its OUTCOME.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const SPEC_PATH = path.join(repoRoot, "tests", "e2e", "a11y.spec.ts");

function readPkgs(): { devDeps: Record<string, string>; residentVersion: string | null } {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    devDependencies: Record<string, string>;
  };
  let residentVersion: string | null = null;
  try {
    const resident = JSON.parse(
      readFileSync(path.join(repoRoot, "node_modules", "axe-core", "package.json"), "utf8"),
    ) as { version: string };
    residentVersion = resident.version;
  } catch {
    residentVersion = null;
  }
  return { devDeps: pkg.devDependencies ?? {}, residentVersion };
}

describe("session 89: the a11y-gate contract (the §13 axe-core two-gate axis — the declared engine + the spec's gate shape)", () => {
  it("pin 1: axe-core is a DECLARED devDependency (the gate must not ride an undeclared transitive — an eslint-config bump could drop it)", () => {
    const { devDeps } = readPkgs();
    expect(
      devDeps["axe-core"],
      "package.json devDependencies must carry axe-core — the two-gate engine must be a direct dependency (the F-171e doctrine: the gate must not stand on an undeclared transitive)",
    ).toBeDefined();
    expect(devDeps["axe-core"]).toMatch(/^\^?4\./);
  });

  it("pin 2: the declared version matches the resident node_modules copy (no lockfile churn beyond the direct edge — the devDep names the version the lockfile already carries)", () => {
    const { devDeps, residentVersion } = readPkgs();
    expect(devDeps["axe-core"]).toBeDefined();
    expect(residentVersion).not.toBeNull();
    const declared = devDeps["axe-core"] as string;
    const residentMajor = (residentVersion as string).split(".")[0];
    expect(
      declared.replace(/^\^/, "").split(".")[0],
      `the declared axe-core major (${declared}) must match the resident copy's major (${residentVersion}) — a mismatch means the gate and the installed engine have drifted`,
    ).toBe(residentMajor);
  });

  it("pin 3: the e2e a11y spec exists at tests/e2e/a11y.spec.ts", () => {
    expect(existsSync(SPEC_PATH), "tests/e2e/a11y.spec.ts must exist — the a11y two-gate is the §13 contract's e2e surface").toBe(true);
  });

  it("pin 4: the spec injects the DECLARED engine from disk (node_modules/axe-core/axe.min.js — never a CDN fetch)", () => {
    const spec = readFileSync(SPEC_PATH, "utf8");
    expect(
      spec,
      "the spec must inject the engine via the declared devDep's on-disk path (page.addScriptTag({ path: \"node_modules/axe-core/axe.min.js\" })) — a CDN fetch is supply-chain drift and an undeclared engine",
    ).toContain("node_modules/axe-core/axe.min.js");
  });

  it("pin 5: the spec runs the four WCAG tag families (the strict subset — no best-practice noise)", () => {
    const spec = readFileSync(SPEC_PATH, "utf8");
    for (const tag of ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]) {
      expect(spec, `the spec's runOnly must carry the "${tag}" tag — the strict WCAG subset is the gate's rule surface`).toContain(tag);
    }
  });

  it("pin 6: the spec carries the structural gate (the named-control proof: button-name + link-name + label)", () => {
    const spec = readFileSync(SPEC_PATH, "utf8");
    for (const structural of ["button-name", "link-name", "label"]) {
      expect(
        spec,
        `the spec's structural gate must name the "${structural}" rule family — the named-control proof is the structural half of the two-gate`,
      ).toContain(structural);
    }
  });

  it("pin 7: the spec's sanctioned register carries citations (every sanctioned entry names why — a register without citations is a suppression list)", () => {
    const spec = readFileSync(SPEC_PATH, "utf8");
    expect(spec, "the spec must carry a sanctioned register keyed by rule id (color-contrast is the reference-palette family)").toContain("color-contrast");
    expect(spec, "every sanctioned register entry must carry a cite field naming the reference's own design").toContain("cite");
  });

  it("pin 8: the explicit registration census — the spec carries >= 13 test() registrations (the surface × width cells; a battery that loses cells fails loudly)", () => {
    const spec = readFileSync(SPEC_PATH, "utf8");
    const count = (spec.match(/\btest\(/g) ?? []).length;
    expect(
      count,
      `expected >= 13 explicit test() registrations (the surface×width census: the public trio + login@375 + the four authed routes at 1280 + the three at 375 + the sheet-open + the select-open cells), found ${count} — the battery must not silently shrink`,
    ).toBeGreaterThanOrEqual(13);
  });
});
