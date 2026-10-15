// S52: the remediation-plan validator — every named anchor in
// docs/remediation-plan-session52.md checked against the codebase (the s50/s51
// pattern: the plan is validated BEFORE execution; a plan that names a
// non-existent anchor is a plan that cannot execute).
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const repo = "/home/z/my-project/service-desk";
const read = (p) => readFileSync(`${repo}/${p}`, "utf8");
const README = read("README.md");
const AGENTS = read("AGENTS.md");
const CLAUDE = read("CLAUDE.md");
const PAD = read("Project_Architecture_Document.md");
const SKILL = read("service-desk_SKILL.md");
const CORPUS = read("tests/corpus-count-contract.test.ts");
const CI = read(".github/workflows/ci.yml");
const PLAN = read("docs/remediation-plan-session52.md");

let pass = 0, fail = 0;
const check = (label, cond) => {
  if (cond) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}`); }
};

// ---- P1 anchors: the four stale date sites + their content history ----
check("CLAUDE.md L5 carries the stale last_updated (2026-10-09)",
  /^last_updated: 2026-10-09$/m.test(CLAUDE));
check("PAD L6 carries the stale Last Updated (2026-10-09)",
  /^\*\*Last Updated:\*\* 2026-10-09$/m.test(PAD));
check("AGENTS.md L3 carries the stale verification date (2026-10-09)",
  /Verified against the toolchain on 2026-10-09\./.test(AGENTS));
check("SKILL description names session-50 (the internally inconsistent line)",
  /Distilled through the session-50 remediation \(2026-10-14\)\./.test(SKILL));
check("SKILL frontmatter last_updated is the properly-bumped 2026-10-15 (the one good date)",
  /^last_updated: 2026-10-15$/m.test(SKILL));
check("SKILL version is 2.49.0 (pre-s52)",
  /^version: 2\.49\.0$/m.test(SKILL));

// the content-history ground truth (git last-commit dates, +0800 reading)
const sgDate = (file) => {
  try {
    const iso = execSync(`git -C ${repo} log -1 --format=%cI -- ${file}`, { encoding: "utf8" }).trim();
    return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
  } catch { return "(unavailable)"; }
};
const claudeGit = sgDate("CLAUDE.md"), padGit = sgDate("Project_Architecture_Document.md"),
      agentsGit = sgDate("AGENTS.md"), skillGit = sgDate("service-desk_SKILL.md");
console.log(`  measured git dates (+0800): CLAUDE=${claudeGit} PAD=${padGit} AGENTS=${agentsGit} SKILL=${skillGit}`);
check("CLAUDE.md's git last-commit date is NEWER than its claimed 2026-10-09 (the live drift)",
  claudeGit > "2026-10-09");
check("PAD's git last-commit date is NEWER than its claimed 2026-10-09 (the live drift)",
  padGit > "2026-10-09");
check("AGENTS.md's git last-commit date is NEWER than its claimed 2026-10-09 (the live drift)",
  agentsGit > "2026-10-09");
check("SKILL's git last-commit date is NOT newer than its claimed 2026-10-15 (the one good date holds)",
  skillGit <= "2026-10-15");

// the SKILL's internal ledger: the last lesson says Session 51
const lessonSessions = [...SKILL.matchAll(/\(Session (\d+)\.\)/g)].map(m => Number(m[1]));
check("the SKILL's last lesson tag is (Session 51.) — the description's session-50 disagrees",
  lessonSessions.length > 0 && lessonSessions.at(-1) === 51);
check("the SKILL carries lesson 105 (the newest, s51's)",
  /^105\. /m.test(SKILL));

// ---- the plan's named fix targets exist ----
check("the plan names the CLAUDE.md date fix target wording",
  PLAN.includes("`last_updated: 2026-10-09` → `last_updated: 2026-10-15`"));
check("the plan names the PAD date fix target wording",
  PLAN.includes("`**Last Updated:** 2026-10-09` → `**Last Updated:** 2026-10-15`"));
check("the plan names the AGENTS date fix target wording",
  PLAN.includes("`Verified against the toolchain on 2026-10-09.` → `Verified against the toolchain on 2026-10-15.`"));
check("the plan names the SKILL description fix target wording",
  PLAN.includes("`Distilled through the session-50 remediation (2026-10-14).` → `Distilled through the session-51 remediation (2026-10-15).`"));

// ---- the corpus family sites (the 257 → 260 move targets) ----
check("README badge site: tests-257%20unit", /tests-257%20unit/.test(README));
check("README verification site: 257 Vitest unit tests", /257 Vitest unit tests/.test(README));
check("README pyramid site: 257 unit + 198 E2E tests", /257 unit \+ 198 E2E tests/.test(README));
check("README commands site: Vitest unit: 257 tests", /Vitest unit: 257 tests/.test(README));
check("AGENTS commands site: unit suite (257 tests", /unit suite \(257 tests/.test(AGENTS));
check("CLAUDE commands site: 257 unit / 198 E2E (needs", /257 unit \/ 198 E2E \(needs/.test(CLAUDE));
check("PAD §7.4 checklist site: `bun run test` — 257/", /`bun run test` — 257\//.test(PAD));
check("SKILL project_state site: project_state: 257 unit", /project_state: 257 unit/.test(SKILL));
check("SKILL Appendix A site: Vitest — 257 unit tests", /Vitest — 257 unit tests/.test(SKILL));
check("README quickstart output site: 26 files / 257 tests passed", /26 files \/ 257 tests passed/.test(README));

// the corpus pin internals (the literal + lineage comment + BRIDGE ternary)
check("corpus pin literal: toBe(257)", /expect\(Number\(n\)\)\.toBe\(257\);/.test(CORPUS));
check("corpus pin lineage comment: 257", /runtime-verified every session's gate\): 257/.test(CORPUS));
check("BRIDGE ternary: listing.length === 26 (src 4 + tests 22)", /listing\.length === 26 \? "src 4 \+ tests 22"/.test(CORPUS));

// ---- the §7.1 row placement (after the s51 prereq row) + the BRIDGE's pad sum ----
check("PAD §7.1 carries the s51 prereq row (the placement anchor)",
  /\| 1 \| 2 \| `tests\/prereq-contract\.test\.ts` \| Vitest \|/.test(PAD));
check("the s49 pad pin exists (tests/pad-testcount-contract.test.ts)",
  existsSync(`${repo}/tests/pad-testcount-contract.test.ts`));

// ---- the CI workflow anchors (the fetch-depth change target + the s45 shapes) ----
check("ci.yml verify job carries the bare actions/checkout@v4 (the change target)",
  (CI.match(/uses: actions\/checkout@v4/g) || []).length === 2);
check("ci.yml carries the s45 frozen-lockfile shape ×2 (survives the change)",
  (CI.match(/^\s*run: bun install --frozen-lockfile$/gm) || []).length === 2);
check("ci.yml carries the s45 include-hidden-files shape ×1 (survives the change)",
  (CI.match(/^\s*include-hidden-files: true$/gm) || []).length === 1);
check("ci.yml carries the s45 branches:[main] shape ×2 (survives the change)",
  (CI.match(/^\s*branches: \[main\]$/gm) || []).length === 2);
check("ci.yml has NO fetch-depth today (the addition is new)",
  !/fetch-depth/.test(CI));

// ---- the s91 shortlist re-measurements the plan claims ----
check("the plan claims the CLAUDE majors clean (16.4.0 measured)",
  PLAN.includes("16.4.0 / 19.3.0 / 4.3.3 / 6.19.3"));
check("the plan claims the DEPLOYMENT rate-limit constants match",
  PLAN.includes("`BUCKETS_SWEEP_THRESHOLD = 1_000` + `BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000`"));

// ---- the 34th-sweep records the plan claims (F1 figures) ----
check("the plan records the entry figure 105055 (byte-identical to s50/s51)",
  PLAN.includes("`index-C-ulo5ek.js` 200/105055"));
check("the plan records the CSS figure 904487 (byte-identical to s50/s51)",
  PLAN.includes("`index-BIWjBcok.css` 200/904487"));
check("the plan records the old-CSS 200 state (the s51 edge-cache persists)",
  PLAN.includes("`index-D0Q6-tUz.css` still 200 (900665)"));
check("the plan records the 35th-consecutive-session logoutReturnPath",
  PLAN.includes("the 35th consecutive session"));

// ---- the screenshots + session-log lineage anchors ----
check("AGENTS carries the s51 screenshots lineage (the s51→s52 update target)",
  /refreshed by `scripts\/capture-screenshots-s51\.sh`/.test(AGENTS));
check("AGENTS carries the Session-51 contracts section (the s52 section's placement anchor)",
  /^## Session-51 contracts /m.test(AGENTS));
check("the s51 capture script exists (the s52 lineage source)",
  existsSync(`${repo}/scripts/capture-screenshots-s51.sh`));

console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
