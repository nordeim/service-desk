import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 65 — the gate-config pins (P1: the COMPILER-GUARANTEE SURFACE —
// the gate-config doc-truth closure)
//
// Contract under test: the five core docs promise compiler/linter guarantees
// the gate configuration itself silently disabled — for 64 sessions (the
// scaffold's first upload 9a1c7ae, standing through every session since):
//
//   1. CLAUDE.md:10 + :34 "TypeScript strict (enforced)", CLAUDE.md:36
//      "`strict: true`; no `any` in new code (use `unknown` + guards)",
//      PAD:43 "TypeScript (strict)", PAD:578 "`tsc --noEmit` strict" —
//      while tsconfig.json carried `"noImplicitAny": false` (the explicit
//      override silently disabling implicit-any checking, the largest
//      single hole in strict mode) and eslint.config.mjs carried
//      `"@typescript-eslint/no-explicit-any": "off"`. SKILL.md:68 even
//      documented the hole openly ("`noImplicitAny: false` by config, but
//      new code uses `unknown` + guards") — the invariant held by prose
//      alone. A future any-laden or implicit-any PR passed every gate
//      while the docs' "strict, enforced" claim was a lie the corpus
//      carried.
//
// The blast radius measured live at the s65 audit: ZERO — typecheck with
// `noImplicitAny: true` CLEAN, lint with `no-explicit-any: "error"` CLEAN
// (64 sessions of remediation had already cleaned the codebase; only the
// gate config still carried the scaffold's weakened posture). The fixes
// are born-green; these pins hold the closed state so the weakening can
// never return silently.
//
// Pin style: the parsed-config ground truth (JSON.parse on tsconfig; the
// eslint rule surface matched on its executable shape — a rule set to
// "off" is the weakened form, anything else is enforcement), the s43
// code-shaped doctrine (a doc comment satisfying a check is never enough).
//
// The three pins:
//   pin 1 — the tsconfig surface: strict: true; NO strictness-weakening
//           override (the six known weakenings each absent-or-true);
//           noEmit: true; the exclude carries "skills" (the operator's
//           standing exclusion, pinned at the tsconfig layer).
//   pin 2 — the eslint guarantee surface: no-explicit-any NOT "off" (the
//           CLAUDE.md:36 guarantee gets teeth); react-hooks/
//           set-state-in-effect NOT weakened to "off"/"warn" (the AGENTS
//           "is an ERROR under this ESLint config" claim — the scaffold's
//           off-list must not grow it).
//   pin 3 — the vitest config surface: the include patterns match
//           *.test.ts only (never *.spec.ts — the AGENTS "never run twice"
//           convention) and no globals flag (the AGENTS "explicit imports"
//           convention).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

const tsconfig = JSON.parse(
  readFileSync(path.join(repoRoot, "tsconfig.json"), "utf8"),
) as {
  compilerOptions: Record<string, unknown>;
  exclude?: string[];
};

const eslintConfig = readFileSync(
  path.join(repoRoot, "eslint.config.mjs"),
  "utf8",
);

const vitestConfig = readFileSync(
  path.join(repoRoot, "vitest.config.ts"),
  "utf8",
);

// Session 85 — pin 4: the BUILD-TYPE-GATE surface (the s84-era gap the
// s65 audit's own enumeration missed — the fourth gate-config surface).
//
// Contract under test: `next build` is itself a type gate. The scaffold's
// first upload carried `typescript: { ignoreBuildErrors: true }` and it
// stood through every session while the s65 pins held the tsconfig/eslint/
// vitest surfaces — the next.config.ts typescript block was the ONE
// gate-config file the s65 enumeration did not cover (the lesson-126
// shape: a closure is scoped to the surfaces it enumerates, one file
// further out). Under the flag, `next build` compiles the deployable
// standalone artifact WITHOUT type checking: a planted type error
// compiled GREEN into the artifact. The compensating control is real
// (the gate chain runs `typecheck` before `build`, locally and in CI's
// verify job) — so the defect is the ARTIFACT surface: any build-only
// pipeline ships a type-broken artifact with zero signal.
//
// The s85 live measurements (the TDD form):
//   - flip probe: the flag removed → `bun run build` GREEN (zero standing
//     errors — the flag was dead weight, not a guard; the s65 blast-radius
//     form exactly)
//   - gate-proof: a planted type error under the hardened config → the
//     build FAILED (error TS2322 observed live; the plant reverted)
//
// The posture is the family skill's §15 contract (skills/web-application/
// SKILL.md: "the build IS the type gate — no ignoreBuildErrors") — the
// sibling repo adopted it at its own session-174 within hours of the
// skill's publication (the zero-balance graft named in its provenance).
// Pin style: the config's own text, matched on its executable shape
// (the s65 pin-2 form — absent-or-false is enforcement, `true` is the
// weakening).

const nextConfig = readFileSync(
  path.join(repoRoot, "next.config.ts"),
  "utf8",
);

describe("the gate-config contract (session 65)", () => {
  it("pin 1: the tsconfig strictness surface — strict on, no weakening override, noEmit, the skills exclusion", () => {
    const co = tsconfig.compilerOptions;
    // The headline guarantee: strict mode on, exactly as every doc claims.
    expect(co.strict, "tsconfig must carry strict: true (CLAUDE/PAD claim 'strict, enforced')").toBe(true);
    // The s65 closure: NO strictness-weakening override may return. Each of
    // these, set to false, silently disables a guarantee `strict: true`
    // otherwise implies — the exact class this pin exists to catch (a
    // weakened gate passing every gate while the docs claim the guarantee).
    const weakenings: Array<[string, unknown]> = [
      ["noImplicitAny", co.noImplicitAny],
      ["strictNullChecks", co.strictNullChecks],
      ["noImplicitThis", co.noImplicitThis],
      ["alwaysStrict", co.alwaysStrict],
      ["useUnknownInCatchVariables", co.useUnknownInCatchVariables],
      ["strictBindCallApply", co.strictBindCallApply],
    ];
    for (const [flag, value] of weakenings) {
      expect(
        value === undefined || value === true,
        `tsconfig must not weaken strict mode: "${flag}" must be absent (inherited true) or true — found ${JSON.stringify(value)} (the s65 class: the scaffold's noImplicitAny override stood for 64 sessions while the docs claimed "strict, enforced")`,
      ).toBe(true);
    }
    // The typecheck gate shape: tsc --noEmit (the PAD:578 claim).
    expect(co.noEmit, "tsconfig must carry noEmit: true (the `tsc --noEmit` gate)").toBe(true);
    // The operator's standing exclusion: skills/ is excluded from code
    // checking, testing, and compilation — pinned at the tsconfig layer.
    expect(
      tsconfig.exclude?.includes("skills"),
      'tsconfig exclude must carry "skills" (the operator\'s standing exclusion of the skills/ folder from compilation)',
    ).toBe(true);
  });

  it("pin 2: the eslint guarantee surface — no-explicit-any enforced, set-state-in-effect not weakened", () => {
    // The CLAUDE.md:36 guarantee: "no `any` in new code (use `unknown` +
    // guards)". The executable shape: the rule is NOT "off" — anything
    // else (error/warn) is enforcement. A bare substring would be
    // satisfiable forever by a comment (the s43 mutation-C doctrine).
    const anyMatch = eslintConfig.match(
      /["']@typescript-eslint\/no-explicit-any["']\s*:\s*["'](\w+)["']/,
    );
    expect(
      anyMatch,
      "eslint.config.mjs must declare @typescript-eslint/no-explicit-any with an explicit severity (the s65 fix: error)",
    ).not.toBeNull();
    expect(
      anyMatch?.[1],
      'no-explicit-any must not be "off" — the CLAUDE.md guarantee "no `any` in new code" requires enforcement (the s65 class: the scaffold carried "off" for 64 sessions while the docs claimed the guarantee)',
    ).not.toBe("off");
    expect(
      anyMatch?.[1],
      "no-explicit-any must be an enforcing severity (error or warn), matching the s65 fix",
    ).toMatch(/^(error|warn)$/);

    // The AGENTS.md claim: "react-hooks/set-state-in-effect is an ERROR
    // under this ESLint config". The rule ships error via
    // eslint-config-next; the scaffold's off-list must not grow it. The
    // executable shape: if the config mentions the rule at all, its
    // severity must not be a weakening.
    const setStateMatch = eslintConfig.match(
      /["']react-hooks\/set-state-in-effect["']\s*:\s*["'](\w+)["']/,
    );
    if (setStateMatch) {
      expect(
        setStateMatch[1],
        'set-state-in-effect must not be weakened to "off"/"warn" — the AGENTS.md claim "is an ERROR under this ESLint config" must hold',
      ).not.toMatch(/^(off|warn)$/);
    }
    // And the rule must not be silently absent from enforcement: the
    // preset must still be spread in (the config imports it via
    // eslint-config-next — the two spreads are the delivery path).
    expect(
      eslintConfig.includes("eslint-config-next"),
      "the config must keep the eslint-config-next presets (the set-state-in-effect error ships via them)",
    ).toBe(true);
  });

  it("pin 3: the vitest config surface — *.test.ts only, never *.spec.ts, no globals", () => {
    // The AGENTS.md convention: "Vitest imports describe/it/expect
    // explicitly (no globals config) and matches *.test.ts only —
    // Playwright's *.spec.ts never run twice."
    const includeMatch = vitestConfig.match(/include:\s*\[([^\]]+)\]/);
    expect(
      includeMatch,
      "vitest.config.ts must declare its include patterns (the AGENTS convention is a contract, not a comment)",
    ).not.toBeNull();
    const includeSrc = includeMatch?.[1] ?? "";
    expect(
      includeSrc.includes("*.test.ts"),
      "the vitest include must match *.test.ts (the unit layer's file grammar)",
    ).toBe(true);
    expect(
      includeSrc.includes(".spec.ts") || includeSrc.includes(".setup.ts"),
      "the vitest include must NEVER match *.spec.ts or *.setup.ts — the Playwright files would run twice (the AGENTS convention; the include is src/**/test.ts + tests/**/test.ts only)",
    ).toBe(false);
    expect(
      /globals\s*:\s*true/.test(vitestConfig),
      "vitest.config.ts must not enable globals — the AGENTS convention is explicit imports of describe/it/expect",
    ).toBe(false);
  });

  it("pin 4: the next.config.ts build-type-gate surface — the production build IS a type gate (ignoreBuildErrors must never return)", () => {
    // The executable shape: `ignoreBuildErrors` may be absent (the
    // default-checked posture) or explicitly `false` — anything else is
    // the scaffold's weakening. A bare substring would be satisfiable
    // forever by the config's own comments (the s43 mutation-C doctrine);
    // the match reads the flag's VALUE.
    const m = nextConfig.match(/ignoreBuildErrors\s*:\s*(\w+)/);
    expect(
      m === null || m[1] === "false",
      "next.config.ts must not carry ignoreBuildErrors: true — the build IS the type gate (the s85 class: the scaffold flag stood for 84 sessions while the gate chain's manual typecheck step was the only type gate; under it a planted type error compiled GREEN into the deployable artifact — measured live: the flip probe GREEN with the flag removed, the planted-error build FAILED with error TS2322; a build-only pipeline ships a type-broken artifact silently)",
    ).toBe(true);
  });
});
