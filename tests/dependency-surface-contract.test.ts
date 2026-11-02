import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 96 — the dependency-surface contract pins (P1: the
// unused-dependency class — package.json's dependency list is the repo's
// own claim of what the app needs, unpinned through 96 sessions)
//
// Contract under test, BOTH directions:
//   1. (no-unused) every `dependencies` entry is referenced by the app's
//      real consumption surface — an import/require in src/, tests/ or
//      scripts/, OR a bare-name reference in a config file, OR a CSS
//      @import in globals.css, OR a command in package.json's own scripts
//      block (the CLI form), OR on the documented runtime-required
//      allowlist. A declared-but-referenced-nowhere entry is a FALSE CLAIM:
//      a reader assumes a store exists because `zustand` is listed; a
//      future `bun update` pulls breaking majors through entries nothing
//      exercises.
//   2. (no-phantom) every external package imported by src/** is DECLARED
//      in dependencies or devDependencies — the transitive-reliance class:
//      an import that resolves only through another package's own
//      dependency tree works today and breaks at any cleanup (exactly the
//      risk the s96 removal itself demonstrates).
//
// The measured find (this pin's birth): SIX dependencies entries were
// referenced NOWHERE — four shadcn-init radix leftovers
// (@radix-ui/react-alert-dialog, -dropdown-menu, -popover, -radio-group —
// the corresponding ui/ component files were never created),
// tailwindcss-animate (the v3 plugin superseded by tw-animate-css, the
// v4 form globals.css actually imports), and zustand (the template's
// store, never imported once since the initial upload commit 9a1c7ae).
// Standing 96 sessions because the version-contract pins the seven
// DOCUMENTED packages only ("pin the claims, not the universe") — the
// dependency block's own inverse claim (every entry is needed) was held
// by nobody.
//
// The drift scenario: a future template cargo, a scaffold tool appending
// its starter set, or a removed feature's dependency left behind — each
// lands silently green through every standing gate (typecheck/build pass
// because nothing imports the entry; the docs never named it).
//
// Allowlist doctrine (the s47 form): every allowlist entry carries its
// reason in place and is PROVABLY necessary — removing it from the list
// fails the pin (observed live at the s96 mutation battery: P2). The
// runtime-required class is NOT the unused class: react-dom has no direct
// import anywhere (Next.js's renderer consumes it as react/next's peer at
// runtime) yet removing the package breaks the app — the OPPOSITE false
// positive the allowlist exists to prevent.
//
// Deliberate scope at s96: the `dependencies` block (where the six false
// claims lived). The devDependencies surface (types packages implicitly
// consumed by the type system, toolchain CLIs) is a weaker-signal census —
// noted for a future shortlist, not pinned here. — CLOSED AT S97 by pin 3
// below: the shortlist taken, the weaker-signal concern resolved through
// the named-surface + allowlist design (the s96 session's own passed-
// forward candidate, taken the very next session).
// ---------------------------------------------------------------------------
//
// Session 97 — pin 3 (the devDependencies surface, the same genus extended
// to the second block). The s96 census's one honest miss: `bun-types` stood
// in devDependencies through 97 sessions while `tsc --noEmit
// --traceResolution` resolved ZERO files from it — the prereq-contract
// narrative that seemed to justify it mentions Bun in COMMENTS only, never
// a `Bun.` global in typed code. Removed at s97 (`bun remove` —
// devDependencies 13→12, the lockfile by the package manager) and the
// block's honesty pinned here.
//
// The devDependencies reference surfaces (each measured live, each
// load-bearing):
//   1. import/require in src/tests/scripts — the app's import surface
//      (@playwright/test across the spec files, vitest across the test
//      files).
//   2. import OR quoted bare-name in the CONFIG_FILES — the config files
//      are themselves modules: eslint.config.mjs IMPORTS
//      eslint-config-next/core-web-vitals; postcss.config.mjs quotes
//      "@tailwindcss/postcss" in its plugins array; components.json
//      carries "tsx": true; playwright.config.ts imports @playwright/test.
//   3. a CSS @import/quoted reference in globals.css (tailwindcss,
//      tw-animate-css — the live Tailwind v4 layer).
//   4. a command word in package.json's own scripts block, WITH the
//      documented BIN_ALIASES (typescript → tsc: the `typecheck` script's
//      own `tsc --noEmit` — the package name and the binary name differ;
//      eslint's name matches its own command).
//   5. a quoted bare-name reference in src/tests/scripts — the
//      runtime-read surface: axe-core is READ at runtime, not imported
//      (the e2e a11y gate injects node_modules/axe-core/axe.min.js —
//      tests/e2e/a11y.spec.ts's AXE_PATH — and the a11y-gate contract
//      reads its installed package.json; remove the package and BOTH gates
//      fail), and typescript carries the version-contract's documented
//      row. Load-bearing by construction, not prose.
//   6. the TYPES_AUTO_INCLUDE allowlist (below) — the tsc auto-include
//      class: node_modules/@types/* is included by tsc WITHOUT any
//      explicit reference (@types/react at 374 traceResolution hits,
//      @types/react-dom at 152 — measured live; removing either breaks the
//      typecheck gate, the OPPOSITE of the unused class).
//
// The same drift scenario as pin 1, one block down: a scaffold tool
// appending its starter set, a types package that reads plausible while
// resolving nothing (the bun-types form), a removed toolchain step's CLI
// left behind — each lands silently green through every standing gate
// (typecheck/build pass because nothing imports the entry). The
// SELF-EXCLUSION doctrine is inherited: this file's own comments and
// allowlist keys name packages as DOCUMENTATION, and counting them would
// let a re-added dependency hide behind the pin's own text (the s96
// mutation-battery observation).
//
// ---------------------------------------------------------------------------
// Session 99 — pin 4 (the security-floor surface, the third genus: a
// DECLARED-AND-USED dependency sitting inside a known-advisory version
// range). The measured find (bun audit at the s99 open): next 16.4.0 sat
// inside the advisory range >=16.0.0 <=16.4.0 for all three advisories of
// the October 14, 2026 out-of-band security release — GHSA-673q-mjm6-r5xr
// (CRITICAL, CVSS 9.5: unauthenticated RCE in `use cache` functions
// returning typed arrays; Vercel's guidance: upgrade immediately even if
// the app has no such functions), GHSA-2464-fhr4-w9xw / CVE-2026-96889
// (CRITICAL, CVSS 9.5: unauthenticated RCE in the Image Optimization API
// when SVG files are used — a librsvg use-after-free through sharp's
// prebuilt binaries on glibc-based Linux; a public PoC exists), and
// GHSA-p3m5-59mp-jv5r (HIGH: DoS in App Router using Server Actions). All
// three patched in 16.4.1 (the Active LTS out-of-band release).
//
// The exposure census measured honestly on THIS codebase: no `use cache`
// functions, no cacheComponents, no Server Actions (mutations are route
// handlers), no next/image usage, and sharp already resolves 0.35.5 (the
// advisory's own documented workaround) — practical exploitability LOW,
// the version-floor defect REAL: the s96/s97 censuses watch UNUSED
// entries; nothing anywhere watched VULNERABLE ones. The drift scenario:
// a future `bun update` pin, a lockfile regeneration, or a rollback —
// each can land the tree back inside an advisory range through every
// standing gate (the corpus pins watch test counts; the version-contract
// pins the seven DOCUMENTED packages' exact figures only — a next bump
// inside the ^16 range moves silently).
//
// The pin: the runtime-read floor (the s97 pin-3 precedent's form — read
// the INSTALLED package.json, not the declaration): installed next must
// be >= NEXT_SECURITY_FLOOR (16.4.1, raised deliberately whenever a new
// advisory lands — the floor is a security contract, not a style
// preference), and the DECLARED spec must admit the floor (an exact pin
// below the floor or a tilde-narrowed range fails closed). The floor was
// observed RED at birth against the 16.4.0 tree (the TDD form) before
// the bump closed it.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Session 101 — pin 5 (the transitive security floor, the fourth genus: an
// IN-RANGE-CLOSABLE transitive advisory — the s99 floor form extended past
// the direct runtime surface). The measured find (bun audit + the declared
// ranges at the s101 open): the dev-toolchain transitive trio the s99
// closure left documented-only carried zod <4.6.6 (GHSA-mrhx-c7xc-m3w5,
// high — "Zod can exhaust memory while validating oversized constrained
// collections") via eslint-config-next › eslint-plugin-react-hooks, whose
// declared range is ^3.25.0 || ^4.0.0 — which ADMITS the patched 4.6.6+.
// The advisory was never major-locked; the lockfile edge had merely gone
// stale at 4.6.5. The PAD §10 row's status clause ("the fixes ride the
// eslint-family/prisma-7 majors") was one-third false: a when-it-closes
// claim is a claim like any other, and this one named the wrong mechanism
// for one of its three legs two sessions after it was written.
//
// The closure (measured live, every path probed): `bun update zod` ADDS a
// direct dependency (the s96 unused-dependency class regression — zod is
// imported nowhere in src/tests/scripts; caught at the diff and reverted);
// `bun update eslint-config-next` re-installs the same version and does
// NOT re-resolve the stale edge. The surgical closure is the RESOLUTIONS
// mechanism: the declared constraint field {"zod": "4.6.7"} in
// package.json + `bun install` — the package manager alone moves the
// lockfile edge 4.6.5→4.6.7 and the audit census 3→2 (minimatch's
// ^3.1.5/^10.2.2 ranges and deepmerge-ts's exact 7.1.5 @prisma/config pin
// remain genuinely major-locked — those two legs the row's claim is TRUE
// for). The pin was observed RED at birth against the reverted pre-fix
// tree (zod 4.6.5 installed, no resolutions field, the stale row) before
// the fix was restored — the TDD form.
//
// The three surfaces held: (a) the runtime-read floor (the installed zod
// read LIVE from node_modules — the s97 pin-3 / s99 pin-4 precedent);
// (b) the declared surface (the resolutions field must carry a zod entry
// admitting the floor — dropping the field fails the pin even before the
// lockfile regresses); (c) the doc coherence (the PAD §10 dev-transitive
// row must name the advisory floor figure AND the resolutions mechanism —
// the stale "the fixes ride the eslint-family/prisma-7 majors" clause can
// never return, the s100 two-sided prose form).
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const dependencies: Record<string, string> = pkg.dependencies ?? {};
const allDeclared = new Set([...Object.keys(dependencies), ...Object.keys(pkg.devDependencies ?? {})]);

/**
 * The security floor for the `next` runtime dependency (session 99, pin 4).
 * 16.4.1 = the October 14, 2026 out-of-band patched release covering
 * GHSA-673q-mjm6-r5xr (critical, use-cache RCE), GHSA-2464-fhr4-w9xw /
 * CVE-2026-96889 (critical, Image-Optimization SVG RCE), and
 * GHSA-p3m5-59mp-jv5r (high, Server Actions DoS). Raise the floor
 * DELIBERATELY when a new advisory lands — never lower it to pass.
 */
const NEXT_SECURITY_FLOOR = "16.4.1";

/**
 * The security floor for the TRANSITIVE zod dependency (session 101,
 * pin 5 — the in-range-closable class). 4.6.6 = the patched release
 * covering GHSA-mrhx-c7xc-m3w5 (high: "Zod can exhaust memory while
 * validating oversized constrained collections"), arriving via
 * eslint-config-next › eslint-plugin-react-hooks (declared range
 * ^3.25.0 || ^4.0.0 — the fix is in-range, held by the resolutions
 * field). Raise the floor DELIBERATELY when a new advisory lands —
 * never lower it to pass.
 */
const ZOD_SECURITY_FLOOR = "4.6.6";

/** Parse "16.4.3" into [16, 4, 3] for numeric comparison. */
function versionParts(v: string): [number, number, number] {
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function cmpVersion(a: [number, number, number], b: [number, number, number]): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/**
 * Does the DECLARED spec admit versions >= the floor? Handles the plain
 * shapes a solo-operator package.json plausibly carries (exact, caret,
 * tilde, >=); anything exotic FAILS CLOSED so a human looks at it.
 */
function specAdmitsFloor(spec: string, floor: [number, number, number]): boolean {
  const m = spec.trim().match(/^(>=|[~^]?)v?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return false;
  const anchor: [number, number, number] = [Number(m[2]), Number(m[3]), Number(m[4])];
  if (m[1] === ">=") return cmpVersion(anchor, floor) >= 0;
  if (m[1] === "^") return anchor[0] === floor[0]; // caret admits the whole major
  if (m[1] === "~") {
    // tilde admits [anchor.major.anchor.minor.x] — the floor fits only if
    // the anchor is at or below the floor within the same minor band.
    return anchor[0] === floor[0] && anchor[1] === floor[1] && anchor[2] <= floor[2];
  }
  return cmpVersion(anchor, floor) >= 0; // exact pin: must itself be >= the floor
}

/**
 * Packages with NO direct import anywhere yet REQUIRED at runtime by the
 * framework. Each entry's reason, in place:
 *   - react-dom: Next.js's renderer consumes it at runtime (react's peer);
 *     no Next app imports it directly — removal breaks the app.
 */
const RUNTIME_REQUIRED: Record<string, string> = {
  "react-dom": "Next.js renderer runtime peer (react/next) — never directly imported in a Next app",
};

/**
 * devDependencies entries consumed by tsc's AUTO-INCLUDE of
 * node_modules/@types/* — never imported, never quoted, yet load-bearing
 * (removal breaks the typecheck gate). Each entry carries its reason and
 * its live traceResolution count (measured at s97; the s47 allowlist
 * doctrine: every entry provably necessary — removing it from this list
 * fails pin 3, the s96 P2 precedent).
 */
const TYPES_AUTO_INCLUDE: Record<string, string> = {
  "@types/react": "tsc auto-include — 374 traceResolution hits at s97; removal breaks the typecheck gate",
  "@types/react-dom": "tsc auto-include — 152 traceResolution hits at s97; removal breaks the typecheck gate",
};

/**
 * Packages whose CONSUMED BINARY name differs from the package name (the
 * command surface's honest bridge). Each entry's reason, in place:
 *   - typescript: the `typecheck` script runs `tsc --noEmit` — the
 *     compiler binary IS the package's consumption; the names differ.
 */
const BIN_ALIASES: Record<string, string[]> = {
  typescript: ["tsc"],
};

/** Config files whose quoted/bare strings count as package references. */
const CONFIG_FILES = [
  "postcss.config.mjs",
  "components.json",
  "eslint.config.mjs",
  "tsconfig.json",
  "next.config.ts",
  "playwright.config.ts",
  "vitest.config.ts",
];

/** Source trees whose import grammar counts (ts/tsx/mjs/js/cjs). */
const SOURCE_DIRS = ["src", "tests", "scripts"];

/** The CSS layer (Tailwind v4 resolves @import "pkg" to node_modules). */
const GLOBALS_CSS = path.join(repoRoot, "src", "app", "globals.css");

/** Collect every file under a dir with one of the extensions. */
function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  const p = path.join(repoRoot, dir);
  const stack = [p];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const name of readdirSync(cur)) {
      const full = path.join(cur, name);
      if (statSync(full).isDirectory()) {
        stack.push(full);
        continue;
      }
      if (exts.some((e) => name.endsWith(e))) out.push(full);
    }
  }
  return out;
}

/**
 * Does `text` reference the package `name` in IMPORT position? Matches:
 *   from '<name>' / from "<name>"          (re-exports, plain imports)
 *   require('<name>') / require("<name>")  (CJS)
 *   import('<name>') / import("<name>")    (dynamic)
 *   import '<name>'                        (side-effect)
 * The lookahead (?=['"`/]) keeps subpath imports of OTHER packages from
 * matching a shorter declared name (e.g. `from 'zustand/x'`).
 */
function hasImportReference(text: string, name: string): boolean {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:from\\s+|require\\(\\s*|import\\(\\s*|import\\s+)['"]${esc}(?=['"\`/])`,
  );
  return re.test(text);
}

/** Does `text` carry the package as a QUOTED bare name (config/CSS form)? */
function hasQuotedReference(text: string, name: string): boolean {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`['"\`]${esc}['"\`]`);
  return re.test(text);
}

/** The package.json scripts block, as text (the CLI-reference surface). */
const scriptsText: string = Object.values(pkg.scripts ?? {}).join("\n");

/** Does the scripts block invoke the package (or a documented bin alias) as a command word? */
function hasCommandReference(name: string): boolean {
  const names = [name, ...(BIN_ALIASES[name] ?? [])].map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return names.some((esc) => new RegExp(`(^|[\\s;|&])${esc}(\\s|$)`).test(scriptsText));
}

// Pre-read the whole consumption surface once (small repo; the census is
// cheap and the file set is the same for every dep entry). The contract
// file ITSELF is excluded from the census surface: this file's own
// comments name packages as DOCUMENTATION (the regex examples, the
// allowlist reasons) — a contract doc's prose is not a consumption
// reference, and counting it would let a re-added dependency hide behind
// the pin's own example text (observed live at the s96 mutation battery:
// the P1 zustand re-add passed until the self-exclusion landed).
const SELF = path.join(repoRoot, "tests", "dependency-surface-contract.test.ts");
const sourceTexts: { label: string; text: string }[] = [];
for (const dir of SOURCE_DIRS) {
  for (const f of walk(dir, [".ts", ".tsx", ".mjs", ".js", ".cjs"])) {
    // skills/ is vendored and excluded from the app tree by convention;
    // nothing under src/tests/scripts points into it.
    if (path.resolve(f) === SELF) continue;
    sourceTexts.push({ label: path.relative(repoRoot, f), text: readFileSync(f, "utf8") });
  }
}
const configTexts = CONFIG_FILES.map((f) => {
  const full = path.join(repoRoot, f);
  return { label: f, text: readFileSync(full, "utf8") };
});
const cssText = readFileSync(GLOBALS_CSS, "utf8");

describe("session 96 + 97: the dependency-surface pins (the package.json honesty contract, BOTH blocks)", () => {
  it("pin 1: no unused dependencies — every dependencies entry is referenced by the consumption surface or documented-runtime-required (the initial-upload cargo class)", () => {
    const offenders: string[] = [];
    for (const name of Object.keys(dependencies)) {
      if (name in RUNTIME_REQUIRED) continue;
      const used =
        sourceTexts.some((s) => hasImportReference(s.text, name)) ||
        configTexts.some((c) => hasQuotedReference(c.text, name)) ||
        hasImportReference(cssText, name) ||
        hasQuotedReference(cssText, name) ||
        hasCommandReference(name);
      if (!used) offenders.push(name);
    }
    if (offenders.length > 0) {
      throw new Error(
        `unused dependencies (declared in package.json, referenced nowhere — the false-claim class): ${offenders.join(", ")}. ` +
          `Every dependencies entry must be imported by src/tests/scripts, referenced by a config file or globals.css, invoked by a package.json script, or listed in RUNTIME_REQUIRED with its reason.`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 2: no phantom dependencies — every external package imported by src/ is declared (the transitive-reliance class)", () => {
    // The import-source census: everything in import position that is not
    // a relative path, not a node: builtin, not the internal @/ alias.
    const sources = new Set<string>();
    const re = /(?:from\s+|require\(\s*|import\(\s*|import\s+)['"]([^'"]+)['"]/g;
    for (const { text } of sourceTexts.filter((s) => s.label.startsWith("src"))) {
      for (const m of text.matchAll(re)) sources.add(m[1]!);
    }
    const undeclared: string[] = [];
    for (const src of sources) {
      if (src.startsWith(".") || src.startsWith("node:") || src === "@/") continue;
      if (src.startsWith("@/")) continue; // the tsconfig internal alias
      // Normalize subpaths: @scope/pkg/sub -> @scope/pkg; pkg/sub -> pkg.
      const pkgName = src.startsWith("@")
        ? src.split("/").slice(0, 2).join("/")
        : src.split("/")[0]!;
      if (!allDeclared.has(pkgName) && !undeclared.includes(pkgName)) {
        undeclared.push(pkgName);
      }
    }
    if (undeclared.length > 0) {
      throw new Error(
        `phantom dependencies (imported by src/ but not declared in package.json): ${undeclared.join(", ")}. ` +
          `An import that resolves only through another package's transitive tree breaks at the next dependency cleanup — declare it or import through its owner.`,
      );
    }
    expect(undeclared.length).toBe(0);
  });

  it("pin 3: no unused devDependencies — every devDependencies entry is referenced by the consumption surface, the runtime-read surface, or the TYPES_AUTO_INCLUDE allowlist (the s96 census's own passed-forward shortlist, closed at s97: bun-types removed after 97 sessions of zero resolutions)", () => {
    const offenders: string[] = [];
    for (const name of Object.keys(pkg.devDependencies ?? {})) {
      if (name in TYPES_AUTO_INCLUDE) continue;
      const used =
        sourceTexts.some(
          (s) => hasImportReference(s.text, name) || hasQuotedReference(s.text, name),
        ) ||
        configTexts.some(
          (c) => hasImportReference(c.text, name) || hasQuotedReference(c.text, name),
        ) ||
        hasImportReference(cssText, name) ||
        hasQuotedReference(cssText, name) ||
        hasCommandReference(name);
      if (!used) offenders.push(name);
    }
    if (offenders.length > 0) {
      throw new Error(
        `unused devDependencies (declared in package.json, referenced nowhere — the false-claim class, the bun-types form): ${offenders.join(", ")}. ` +
          `Every devDependencies entry must be imported or quoted-read by src/tests/scripts, referenced by a config file or globals.css, invoked by a package.json script (bin aliases honored), or listed in TYPES_AUTO_INCLUDE with its reason.`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 4: the security floor — the installed next is at or above 16.4.1 (the October 14, 2026 out-of-band patched release: GHSA-673q-mjm6-r5xr + GHSA-2464-fhr4-w9xw + GHSA-p3m5-59mp-jv5r all patched) and the declared spec admits the floor (the vulnerable-direct-dependency class: the s96/s97 censuses watch UNUSED entries, nothing watched VULNERABLE ones)", () => {
    // The runtime-read form (the s97 pin-3 / axe-core precedent): the
    // INSTALLED package.json is the truth a server actually runs — the
    // declaration alone can drift from the lockfile and back.
    const installed = JSON.parse(
      readFileSync(path.join(repoRoot, "node_modules", "next", "package.json"), "utf8"),
    ) as { version?: string };
    const installedVersion = installed.version ?? "0.0.0";
    const floorParts = versionParts(NEXT_SECURITY_FLOOR);
    const installedParts = versionParts(installedVersion);
    if (cmpVersion(installedParts, floorParts) < 0) {
      throw new Error(
        `next ${installedVersion} is BELOW the security floor ${NEXT_SECURITY_FLOOR} — the tree sits inside a known-advisory range (the October 14, 2026 out-of-band release: GHSA-673q-mjm6-r5xr critical use-cache RCE, GHSA-2464-fhr4-w9xw critical Image-Optimization SVG RCE, GHSA-p3m5-59mp-jv5r high Server-Actions DoS). ` +
          `Raise the dependency past the floor via the package manager (bun update next) and re-run the audit — never lower the floor to pass.`,
      );
    }
    expect(cmpVersion(installedParts, floorParts)).toBeGreaterThanOrEqual(0);

    // The declaration must admit the floor too: an exact pin below the
    // floor or a tilde-narrowed range re-lands the tree inside the
    // advisory range at the next clean install, even with a stale
    // lockfile hiding it from the frozen-install gate.
    const declared = dependencies["next"];
    if (typeof declared !== "string" || !specAdmitsFloor(declared, floorParts)) {
      throw new Error(
        `the declared next spec (${String(declared)}) does not admit the security floor ${NEXT_SECURITY_FLOOR} — a narrowed declaration re-lands the tree inside the advisory range at the next clean install. ` +
          `Widen the spec (the caret form admits the whole patched major) via the package manager.`,
      );
    }
    expect(specAdmitsFloor(declared ?? "", floorParts)).toBe(true);

    // The floor's VALUE is held at a second surface (the s98 threshold-pin
    // form applied to the security genus): the AGENTS Session-99 contracts
    // section names the floor figure, and this coherence assertion holds
    // the doc figure == the constant — a weakened constant (or a drifted
    // doc) breaks the coherence and bites HERE, so the gate can never be
    // silently softened from either side.
    const agents = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
    const s99Match = agents.match(/## Session-99 contracts[\s\S]*?the security floor \*\*(\d+\.\d+\.\d+)\*\*/);
    const docFloor = s99Match?.[1];
    if (docFloor !== NEXT_SECURITY_FLOOR) {
      throw new Error(
        `the security floor's two surfaces disagree: the constant ${NEXT_SECURITY_FLOOR} vs the AGENTS Session-99 section's ${String(docFloor)} — a security floor softened on either surface (the constant weakened to pass, the doc drifted) is the gate-present-but-toothless class. ` +
          `Raise BOTH surfaces together, deliberately, when a new advisory lands.`,
      );
    }
    expect(docFloor).toBe(NEXT_SECURITY_FLOOR);
  });

  it("pin 5: the transitive security floor — the installed zod is at or above 4.6.6 (GHSA-mrhx-c7xc-m3w5: memory exhaustion validating oversized constrained collections — patched in 4.6.6) and the resolutions field declares it (the in-range-closable transitive class: the s99 floor pinned the DIRECT runtime surface; the transitive dev surface stayed documented-only, and the s101 audit measured its when-it-closes claim one-third false — the zod range admitted the fix all along, the lockfile edge was merely stale)", () => {
    // (a) The runtime-read form (the s97 pin-3 / s99 pin-4 precedent):
    // the INSTALLED package.json is the truth — the declaration and the
    // lockfile can each drift from what a tool actually loads.
    const installedZod = JSON.parse(
      readFileSync(path.join(repoRoot, "node_modules", "zod", "package.json"), "utf8"),
    ) as { version?: string };
    const zodVersion = installedZod.version ?? "0.0.0";
    const zodFloorParts = versionParts(ZOD_SECURITY_FLOOR);
    const zodParts = versionParts(zodVersion);
    if (cmpVersion(zodParts, zodFloorParts) < 0) {
      throw new Error(
        `zod ${zodVersion} is BELOW the transitive security floor ${ZOD_SECURITY_FLOOR} (GHSA-mrhx-c7xc-m3w5: memory exhaustion validating oversized constrained collections, patched in 4.6.6; the advisory arrives via eslint-config-next › eslint-plugin-react-hooks, whose ^3.25.0 || ^4.0.0 range ADMITS the fix — this is the in-range-closable class, never a wait-for-the-major class). ` +
          `Restore the resolutions field ("resolutions": {"zod": "^4.6.6 or later"}) and run bun install so the package manager moves the lockfile edge — never lower the floor to pass.`,
      );
    }
    expect(cmpVersion(zodParts, zodFloorParts)).toBeGreaterThanOrEqual(0);

    // (b) The declared surface: the resolutions field is the constraint
    // that holds the edge — dropping it (or narrowing it below the floor)
    // re-lands the stale 4.6.5 resolution at the next clean install, even
    // with the current lockfile hiding it from the frozen-install gate.
    const resolutions = (pkg as { resolutions?: Record<string, string> }).resolutions ?? {};
    const declaredZod = resolutions["zod"];
    if (typeof declaredZod !== "string" || !specAdmitsFloor(declaredZod, zodFloorParts)) {
      throw new Error(
        `the resolutions field must carry a zod entry admitting the transitive security floor ${ZOD_SECURITY_FLOOR} (found: ${String(declaredZod)}) — the resolutions mechanism is the surgical closure for an in-range-closable transitive advisory (a named bun update would ADD an unused direct dependency, the s96 class regression; a parent-chain update does not re-resolve the stale edge). ` +
          `Declare "resolutions": {"zod": "..."} at or above the floor and run bun install.`,
      );
    }
    expect(specAdmitsFloor(declaredZod ?? "", zodFloorParts)).toBe(true);

    // (c) The doc coherence (the s100 two-sided prose form): the PAD §10
    // dev-transitive row is the advisory register's live surface — it
    // must name the advisory floor figure AND the resolutions mechanism
    // (the shipped closure), and the stale when-it-closes clause can
    // never return.
    const padText = readFileSync(path.join(repoRoot, "Project_Architecture_Document.md"), "utf8");
    const rowMatch = padText.match(/^\| LOW \| Dev-toolchain transitive advisories.*$/m);
    if (!rowMatch) {
      throw new Error(
        "the PAD §10 dev-transitive advisories row is missing — the advisory register's live surface must exist for pin 5 to hold it to the shipped closure.",
      );
    }
    const row = rowMatch[0];
    const staleClause = "the fixes ride the eslint-family/prisma-7 majors";
    if (row.includes(staleClause)) {
      throw new Error(
        `the PAD §10 dev-transitive row still carries the stale when-it-closes clause — the zod leg's fix never rode a major (the declared range admitted 4.6.6+; the s101 closure is the resolutions mechanism). ` +
          `Rewrite the row to the shipped truth: the zod leg CLOSED at the resolutions mechanism, the minimatch/deepmerge-ts legs the genuinely major-locked duo.`,
      );
    }
    if (!row.includes(ZOD_SECURITY_FLOOR) || !row.includes("resolutions")) {
      throw new Error(
        `the PAD §10 dev-transitive row must name the zod advisory floor figure ${ZOD_SECURITY_FLOOR} AND the resolutions mechanism — the register's live surface held to the shipped closure (the s100 two-sided prose form: the doc names the shipped property, the code ships it).`,
      );
    }
    expect(row.includes(ZOD_SECURITY_FLOOR)).toBe(true);
    expect(row.includes("resolutions")).toBe(true);
  });
});
