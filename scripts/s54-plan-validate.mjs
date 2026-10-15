#!/usr/bin/env node
// S54: the plan validator — every anchor the remediation plan names, verified
// against the codebase BEFORE execution (the s52/s53 doctrine: a plan that
// has not been validated against the tree is a guess, not a plan).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO = "/home/z/my-project/service-desk";
let PASS = 0, FAIL = 0;
const ok = (m) => { PASS++; console.log(`PASS ${m}`); };
const bad = (m) => { FAIL++; console.log(`FAIL ${m}`); };
const check = (cond, m) => (cond ? ok(m) : bad(m));
const read = (p) => readFileSync(path.join(REPO, p), "utf8");

// ---------- 1. P1: the coverage-completeness claim ----------
const PAD = read("Project_Architecture_Document.md");
check(PAD.includes("every pure seam in `src/lib/` is unit-tested"),
  "P1: the PAD §7.3 universal claim text present (L501)");

const RH = read("src/lib/route-head.ts");
check(/export function routeHead\(/.test(RH) && /export const SITE_URL/.test(RH) && /export const OG_IMAGES/.test(RH),
  "P1: route-head.ts is a pure seam (the function + the exported constants)");
check(!/PrismaClient|new Date\(\)|fetch\(/.test(RH), "P1: route-head.ts carries no DB/IO side effects");

// no unit test imports it: enumerate every unit test file, resolve imports
const unitDirs = ["src/lib/__tests__", "tests"];
const unitFiles = [];
for (const d of unitDirs)
  for (const e of readdirSync(path.join(REPO, d), { withFileTypes: true }))
    if (e.isFile() && e.name.endsWith(".test.ts")) unitFiles.push(`${d}/${e.name}`);
let importedBy = [];
for (const tf of unitFiles) {
  const t = read(tf);
  for (const m of t.matchAll(/from\s+["']([^"']+)["']/g)) {
    const s = m[1];
    if (s.endsWith("route-head") || s.endsWith("/route-head") || s.includes("route-head"))
      importedBy.push(tf);
  }
}
check(importedBy.length === 0,
  `P1: NO unit test imports route-head (found importers: ${importedBy.join(", ") || "none"}) — the claim is FALSE today`);
check(read("tests/e2e/visual-parity.spec.ts").includes("routeHead") || read("tests/e2e/visual-parity.spec.ts").includes("route-head"),
  "P1: the only references are the E2E visual-parity mechanism pins (session 12)");

// ---------- 2. the git lineage (born true -> false at s12) ----------
const ls = execFileSync("git", ["ls-tree", "cf8e4f0", "--name-only", "src/lib/"], { cwd: REPO }).toString().trim().split("\n");
check(JSON.stringify(ls) === JSON.stringify(["src/lib/__tests__", "src/lib/auth.ts", "src/lib/constants.ts", "src/lib/db-path.ts", "src/lib/db.ts", "src/lib/utils.ts", "src/lib/validation.ts"]),
  `P1 lineage: cf8e4f0 src/lib = the 6 covered files (got: ${ls.join(",")})`);
const cfTests = execFileSync("git", ["ls-tree", "cf8e4f0", "--name-only", "src/lib/__tests__/", "tests/"], { cwd: REPO }).toString();
check(cfTests.includes("auth.test.ts") && cfTests.includes("domain.test.ts") && cfTests.includes("utils.test.ts") && cfTests.includes("db-path.test.ts"),
  "P1 lineage: at cf8e4f0 every pure seam had its unit test (auth/domain/utils/db-path) — the claim BORN TRUE");
const rhLog = execFileSync("git", ["log", "--follow", "--format=%h %cI", "--", "src/lib/route-head.ts"], { cwd: REPO }).toString().trim().split("\n");
check(rhLog[rhLog.length - 1].startsWith("dcfc542 2026-10-09T23:53:57Z"),
  `P1 lineage: route-head.ts landed at dcfc542 (session 12) — the claim went FALSE (got: ${rhLog[rhLog.length - 1]})`);

// ---------- 3. the MAP's honesty (pre-validation of the 7 existing entries) ----------
const MAP = [
  ["src/lib/api-methods.ts", "tests/api-methods.test.ts"],
  ["src/lib/auth.ts", "src/lib/__tests__/auth.test.ts"],
  ["src/lib/constants.ts", "src/lib/__tests__/domain.test.ts"],
  ["src/lib/db-path.ts", "tests/db-path.test.ts"],
  ["src/lib/redirect.ts", "src/lib/__tests__/redirect.test.ts"],
  ["src/lib/utils.ts", "src/lib/__tests__/utils.test.ts"],
  ["src/lib/validation.ts", "src/lib/__tests__/domain.test.ts"],
];
for (const [src, tf] of MAP) {
  const srcOk = existsSync(path.join(REPO, src));
  const tfOk = existsSync(path.join(REPO, tf));
  // import resolution: relative (against the test's dir) + the @/ alias
  let impOk = false;
  if (tfOk) {
    const t = read(tf);
    const tfDir = path.dirname(path.join(REPO, tf));
    for (const m of t.matchAll(/from\s+["']([^"']+)["']/g)) {
      const s = m[1];
      let abs = null;
      if (s.startsWith("@/")) abs = path.join(REPO, "src", s.slice(2));
      else if (s.startsWith(".")) abs = path.resolve(tfDir, s);
      if (abs && (abs === path.join(REPO, src) || abs + ".ts" === path.join(REPO, src) || abs === path.join(REPO, src).replace(/\.ts$/, "")))
        { impOk = true; break; }
    }
  }
  check(srcOk && tfOk && impOk, `MAP entry honest: ${src} -> ${tf} (exists + imports)`);
}
check(/PrismaClient/.test(read("src/lib/db.ts")), "EXCLUSION honest: db.ts is the side-effectful Prisma-client holder");

// ---------- 4. the corpus-move anchors (the 263 forms) ----------
const README = read("README.md");
check(README.includes("tests-263%20unit"), "anchor: README badge 263");
check(README.includes("263 Vitest unit tests"), "anchor: README verification 263");
check(README.includes("263 unit + 198 E2E tests"), "anchor: README pyramid 263");
check(README.includes("Vitest unit: 263 tests"), "anchor: README commands 263");
check(README.includes("28 files / 263 tests passed"), "anchor: README quickstart 28/263");
const AGENTS = read("AGENTS.md");
check(AGENTS.includes("unit suite (263 tests"), "anchor: AGENTS commands 263");
const CLAUDE = read("CLAUDE.md");
check(CLAUDE.includes("263 unit / 198 E2E (needs"), "anchor: CLAUDE commands 263");
check(CLAUDE.includes("## Anti-Patterns to Avoid"), "anchor: CLAUDE the anti-patterns heading (the s54 insertion point)");
check(CLAUDE.includes("pure seams only — auth sign/verify + scrypt + rate limiting, input validation (incl. the s23 attachment-MIME allowlist), constants vocabulary, db-path resolution, date/duration formatting"),
  "anchor: CLAUDE L95 the pure-seams enumeration (the route-head mention insertion point)");
check(PAD.includes("`bun run test` — 263/260"), "anchor: PAD §7.4 checklist 263/260");
check(PAD.includes("| Unit — the s53 size-claim pins ("), "anchor: PAD §7.1 the s53 keyfiles row (the insertion point for the 2 new rows)");

// ---------- 5. the docs-align anchors ----------
check(PAD.includes("| RESOLVED | Session-53 own-side audit (the s93 shortlist"),
  "anchor: PAD §10 the s53 RESOLVED row (the s54 row inserts BEFORE it, newest first)");
const SKILL = read("service-desk_SKILL.md");
check(SKILL.includes("version: 2.51.0"), "anchor: SKILL version 2.51.0");
check(SKILL.includes("Distilled through the session-53 remediation (2026-10-15)."), "anchor: SKILL description session-53");
check(SKILL.trimEnd().endsWith("and its pin needs only the file itself, the cheapest ground truth there is.**"),
  "anchor: SKILL ends with lesson 107 (lesson 108 appends after it)");
check(SKILL.includes("project_state: 263 unit"), "anchor: SKILL project_state 263");
check(SKILL.includes("Vitest — 263 unit tests"), "anchor: SKILL Appendix A 263");
check(AGENTS.includes("`docs/remediation-plan-session2.md` … `-session52.md`"), "anchor: AGENTS the reference-list range through s52 (bumps to s53)");
check(AGENTS.includes("refreshed by `scripts/capture-screenshots-s53.sh` (the s50–s52 lineage verbatim"),
  "anchor: AGENTS the screenshots lineage s53 (bumps to s54)");
check(AGENTS.includes("## Session-53 contracts (pinned by `tests/pad-keyfiles-contract.test.ts`"),
  "anchor: AGENTS the Session-53 section (the Session-54 section inserts after it, before ## Reference)");
check(AGENTS.includes("## Reference"), "anchor: AGENTS the ## Reference heading");

// ---------- 6. the corpus pin + BRIDGE anchors ----------
const CORPUS = read("tests/corpus-count-contract.test.ts");
check(CORPUS.includes("expect(Number(n)).toBe(263);"), "anchor: the corpus pin toBe(263)");
check(CORPUS.includes("the s53 keyfiles pins 3. A"), "anchor: the corpus lineage comment (+ s54 appends)");
check(CORPUS.includes('listing.length === 28 ? "src 4 + tests 24"'), "anchor: the BRIDGE ternary 28/24 (bumps to 30/25)");

// ---------- 7. the environment + the standing state ----------
check(read(".env").includes('DATABASE_URL="file:../db/custom.db"'), "env: .env carries the canonical DATABASE_URL");
check(existsSync(path.join(REPO, "db/custom.db")), "env: db/ at the repo root");
check(existsSync(path.join(REPO, "docs/ssh_git_wrapper_v3.py")), "push: the SSH wrapper present");
check(existsSync(path.join(REPO, "docs/how-to-git-push-using-ssh-wrapper_SKILL.md")), "push: the wrapper skill doc present");

// ---------- 8. the §7.3 second half (the E2E surfaces — the honest boundary) ----------
for (const f of ["tests/e2e/mobile-navigation.spec.ts", "tests/e2e/visual-parity.spec.ts", "tests/e2e/tickets.spec.ts"])
  check(existsSync(path.join(REPO, f)), `boundary: ${f} exists (the §7.3 E2E half holds)`);

// ---------- 9. the fs listing counts (the BRIDGE figures) ----------
const srcTests = readdirSync(path.join(REPO, "src/lib/__tests__")).filter((f) => f.endsWith(".test.ts"));
const testsOnly = unitFiles.length - srcTests.length;
check(srcTests.length === 4, `fs: src/lib/__tests__ carries 4 *.test.ts (got ${srcTests.length})`);
check(testsOnly === 24, `fs: tests/ carries 24 *.test.ts (got ${testsOnly})`);
check(unitFiles.length === 28, `fs: the listing = 28 files (src 4 + tests 24 — got ${unitFiles.length}) — the BRIDGE figures`);

console.log(`\n${PASS} PASS / ${FAIL} FAIL — ${FAIL === 0 ? "PLAN VALIDATED (all anchors)" : "PLAN HAS BROKEN ANCHORS"}`);
process.exit(FAIL === 0 ? 0 : 1);
