// S53: the remediation-plan validator — every named anchor in
// docs/remediation-plan-session53.md checked against the codebase (the s50-s52
// pattern: the plan is validated BEFORE execution; a plan that names a
// non-existent anchor is a plan that cannot execute).
import { readFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

const repo = "/home/z/my-project/service-desk";
const read = (p) => readFileSync(`${repo}/${p}`, "utf8");
const README = read("README.md");
const AGENTS = read("AGENTS.md");
const CLAUDE = read("CLAUDE.md");
const PAD = read("Project_Architecture_Document.md");
const SKILL = read("service-desk_SKILL.md");
const CORPUS = read("tests/corpus-count-contract.test.ts");
const PLAN = read("docs/remediation-plan-session53.md");

let pass = 0, fail = 0;
const check = (label, cond) => {
  if (cond) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}`); }
};

const lc = (p) => read(p).split("\n").length - (read(p).endsWith("\n") ? 1 : 0);

// ---- P1 anchors: the 17 stale §11 figures + the SKILL compound claim ----
const keyFilesRows = [
  ["src/lib/auth.ts", "~170", 232],
  ["src/lib/db-path.ts", "~107", 107],
  ["src/lib/constants.ts", "~95", 250],
  ["src/lib/validation.ts", "~120", 437],
  ["src/components/ui/sidebar.tsx", "~700", 696],
  ["src/components/app-sidebar.tsx", "~200", 231],
  ["src/components/app-sidebar-chrome.tsx", "~50", 51],
  ["src/components/ticket-bits.tsx", "~140", 198],
  ["src/app/(app)/layout.tsx", "~22", 36],
  ["src/app/(app)/dashboard/page.tsx", "~230", 277],
  ["src/app/api/tickets/route.ts", "~120", 254],
  ["src/app/globals.css", "~130", 336],
  ["prisma/schema.prisma", "~75", 73],
  ["prisma/seed.ts", "~180", 83],
  ["tests/e2e/mobile-navigation.spec.ts", "~135", 132],
  ["playwright.config.ts", "~55", 68],
  ["next.config.ts", "~40", 82],
];
for (const [f, claimed, actual] of keyFilesRows) {
  check(`PAD claims ${claimed} for ${f} (the stale row exists)`,
    PAD.includes(`| \`${f}\` | ${claimed} |`));
  check(`${f} exists on the fs`, existsSync(`${repo}/${f}`));
  check(`${f} measures ${actual} lines (the plan's exact figure == fs)`, lc(f) === actual);
}
check("PAD does NOT yet list prisma/seed-data.ts in the key-files table (the missing row)",
  !PAD.includes("| `prisma/seed-data.ts` |"));
check("prisma/seed-data.ts exists + measures 174 (the NEW row's figure)",
  existsSync(`${repo}/prisma/seed-data.ts`) && lc("prisma/seed-data.ts") === 174);
check("SKILL L56 carries the stale compound claim (~170 auditable lines, 11 unit tests)",
  /src\/lib\/auth\.ts` \(~170 auditable lines, 11 unit tests\)/.test(SKILL));
check("SKILL §7.2 header carries the true db-path claim (107 lines — the pin-3 form)",
  /`src\/lib\/db-path\.ts`, 107 lines — 15-test-pinned/.test(SKILL));
check("PAD §7.1 auth row carries 20 (the runtime-pinned figure the SKILL contradicts)",
  /auth\.test\.ts`\s*\| Vitest \|/.test(PAD) && /Unit — auth /.test(PAD));

// ---- the §7.1 runtime ground truth for the auth row ----
try {
  execSync(`cd ${repo} && bun vitest run src/lib/__tests__/auth.test.ts --reporter=json 2>/dev/null`, { timeout: 120000 });
  const j = JSON.parse(readFileSync(`${repo}/.vitest/json/output.json`, "utf8"));
  check("auth.test.ts runtime count is 20 (the §7.1 row + the SKILL fix figure)", j.numTotalTests === 20);
} catch { check("auth.test.ts runtime count is 20 (the nested json run)", false); }

// ---- the corpus-move anchors (the 9 family sites + quickstart + pins) ----
check("README badge carries tests-260", /tests-260%20unit/.test(README));
check("README verification carries 260 Vitest unit tests", /260 Vitest unit tests/.test(README));
check("README pyramid carries 260 unit + 198 E2E tests", /260 unit \+ 198 E2E tests/.test(README));
check("README commands carries Vitest unit: 260 tests", /Vitest unit: 260 tests/.test(README));
check("AGENTS commands carries unit suite (260 tests", /unit suite \(260 tests/.test(AGENTS));
check("CLAUDE commands carries 260 unit / 198 E2E (needs", /260 unit \/ 198 E2E \(needs/.test(CLAUDE));
check("PAD §7.4 checklist carries 260/257", /`bun run test` — 260\/257/.test(PAD));
check("SKILL project_state carries 260 unit", /project_state: 260 unit/.test(SKILL));
check("SKILL Appendix A carries Vitest — 260 unit tests", /Vitest — 260 unit tests/.test(SKILL));
check("README quickstart carries 27 files / 260 tests passed", /27 files \/ 260 tests passed/.test(README));
check("corpus pin carries toBe(260)", /expect\(Number\(n\)\)\.toBe\(260\);/.test(CORPUS));
check("BRIDGE ternary carries 27 ? src 4 + tests 23", /listing\.length === 27 \? "src 4 \+ tests 23"/.test(CORPUS));

// ---- the §7.1 insertion point (after the s52 docdate row) ----
check("PAD carries the s52 docdate row (the insertion neighbor)",
  PAD.includes("tests/docdate-contract.test.ts` | Vitest |") && PAD.includes("the s52 doc-freshness-contract pins"));

// ---- the dated-docs interplay (the s52 docdate pins must survive this session's edits) ----
check("CLAUDE.md claims last_updated 2026-10-15 (the date stays true through the s53 edits)",
  /^last_updated: 2026-10-15$/m.test(CLAUDE));
check("PAD claims Last Updated 2026-10-15", /^\*\*Last Updated:\*\* 2026-10-15$/m.test(PAD));
check("AGENTS.md claims Verified on 2026-10-15", /Verified against the toolchain on 2026-10-15\./.test(AGENTS));
check("SKILL frontmatter last_updated 2026-10-15 + version 2.50.0 (pre-s53)",
  /^last_updated: 2026-10-15$/m.test(SKILL) && /^version: 2\.50\.0$/m.test(SKILL));
check("SKILL description names session-52 (must bump to 53 with lesson 107 — the s52 in-flight lesson)",
  /Distilled through the session-52 remediation \(2026-10-15\)\./.test(SKILL));
check("SKILL last lesson is 106 (Session 52) — lesson 107 will bump the ledger",
  /^\*\* \(Session 52\.\)/m.test(SKILL) === false && /\(Session 52\.\)/.test(SKILL));

// ---- the fs listing (the quickstart BRIDGE ground truth) ----
const listing = execSync(`cd ${repo} && ls src/lib/__tests__/*.test.ts tests/*.test.ts`, { encoding: "utf8" })
  .trim().split("\n");
check("the vitest include listing carries 27 files today (src 4 + tests 23)",
  listing.length === 27 && listing.filter(l => l.includes("src/")).length === 4);

// ---- the vitest include patterns (the new file joins them) ----
check("vitest include patterns match src/**/*.test.ts + tests/**/*.test.ts",
  /include: \["src\/\*\*\/\*\.test\.ts", "tests\/\*\*\/\*\.test\.ts"\]/.test(read("vitest.config.ts")));

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (fail > 0) process.exit(1);
