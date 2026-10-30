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
// Deliberate scope: the `dependencies` block (where the six false claims
// lived). The devDependencies surface (types packages implicitly consumed
// by the type system, toolchain CLIs) is a weaker-signal census — noted
// for a future shortlist, not pinned here.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const dependencies: Record<string, string> = pkg.dependencies ?? {};
const allDeclared = new Set([...Object.keys(dependencies), ...Object.keys(pkg.devDependencies ?? {})]);

/**
 * Packages with NO direct import anywhere yet REQUIRED at runtime by the
 * framework. Each entry's reason, in place:
 *   - react-dom: Next.js's renderer consumes it at runtime (react's peer);
 *     no Next app imports it directly — removal breaks the app.
 */
const RUNTIME_REQUIRED: Record<string, string> = {
  "react-dom": "Next.js renderer runtime peer (react/next) — never directly imported in a Next app",
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

/** Does the scripts block invoke the package as a command word? */
function hasCommandReference(name: string): boolean {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[\\s;|&])${esc}(\\s|$)`).test(scriptsText);
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

describe("session 96: the dependency-surface pins (the package.json honesty contract)", () => {
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
});
