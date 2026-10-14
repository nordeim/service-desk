// s50: plan validation — every anchor the remediation plan names must exist in the codebase
import { readFileSync } from "node:fs";
import path from "node:path";
import { readdirSync } from "node:fs";

const repoRoot = "/home/z/my-project/service-desk";
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");

const checks = [];
const ok = (name, cond, detail = "") => checks.push({ name, pass: !!cond, detail });

// 1. README L120 quickstart line
const readme = read("README.md");
const qs = /(\d+) files \/ (\d+) tests passed/.exec(readme);
ok("README quickstart line exists", qs, qs ? `"${qs[0]}"` : "NOT FOUND");
ok("README quickstart figures are the stale 4/55", qs && qs[1] === "4" && qs[2] === "55");

// 2. The 9 family sites each carry 254
const shapes = [
  ["README badge", /tests-(\d{2,4})%20unit/g, read("README.md")],
  ["README verification", /(\d{2,4}) Vitest unit tests/g, readme],
  ["README pyramid", /(\d{2,4}) unit \+ \d{2,4} E2E tests/g, readme],
  ["README commands", /Vitest unit: (\d{2,4}) tests/g, readme],
  ["AGENTS commands", /unit suite \((\d{2,4}) tests/g, read("AGENTS.md")],
  ["CLAUDE commands", /(\d{2,4}) unit \/ \d{2,4} E2E \(needs/g, read("CLAUDE.md")],
  ["PAD §7.4 checklist", /`bun run test` — (\d{2,4})\//g, read("Project_Architecture_Document.md")],
  ["SKILL project_state", /project_state: (\d{2,4}) unit/g, read("service-desk_SKILL.md")],
  ["SKILL Appendix A", /Vitest — (\d{2,4}) unit tests/g, read("service-desk_SKILL.md")],
];
for (const [label, re, text] of shapes) {
  const found = [...text.matchAll(re)].map((m) => m[1]);
  ok(`family site: ${label}`, found.length >= 1 && found.every((v) => v === "254"), `sites=${found.length} values=${found.join(",")}`);
}

// 3. PAD §7.1 corpus row claims 4
const pad = read("Project_Architecture_Document.md");
const s71 = pad.slice(pad.indexOf("### 7.1 Test Distribution"));
const corpusRow = /corpus-count consistency pins[^\n]*\| 1 \| (\d+) \| `tests\/corpus-count-contract\.test\.ts`/.exec(s71);
ok("PAD §7.1 corpus row exists and claims 4", corpusRow, corpusRow ? `claims ${corpusRow[1]}` : "ROW NOT FOUND");

// 4. Pin 1's toBe literal
const pinFile = read("tests/corpus-count-contract.test.ts");
ok("pin 1 toBe(254) literal present", /expect\(Number\(n\)\)\.toBe\(254\)/.test(pinFile));
ok("pin file carries exactly 4 it() blocks", (pinFile.match(/\n  it\(/g) || []).length === 4, `count=${(pinFile.match(/\n  it\(/g) || []).length}`);

// 5. fs listing = 25 test files
const list = [];
const walk = (dir) => {
  for (const e of readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${dir}/${e.name}`);
    else if (e.name.endsWith(".test.ts")) list.push(`${dir}/${e.name}`);
  }
};
walk("src"); walk("tests");
ok("fs listing of vitest include patterns = 25", list.length === 25, `count=${list.length}`);

// 6. §7.1 Vitest rows sum = 254 (current truth)
let sum = 0, vrows = 0;
for (const line of s71.split("\n")) {
  if (!line.startsWith("| ")) continue;
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length < 7) continue;
  if (cells[5] === "Vitest") { const n = /(\d+)/.exec(cells[3] || ""); if (n) { sum += Number(n[1]); vrows++; } }
}
ok("§7.1 Vitest rows sum = 254 (21+ rows)", sum === 254 && vrows >= 21, `sum=${sum} rows=${vrows}`);

// 7. AGENTS Session-49 section + reference list anchor
const agents = read("AGENTS.md");
ok("AGENTS Session-49 section exists (s50 section goes after)", agents.includes("## Session-49 contracts"));
ok("AGENTS screenshots lineage anchor present (capture-screenshots-s49.sh, the s48 lineage)", agents.includes("capture-screenshots-s49.sh` (the s48 lineage verbatim"));

// 8. SKILL version + worklog
ok("SKILL version is 2.47.0 (moves to 2.48.0)", /version: 2\.47\.0/.test(read("service-desk_SKILL.md")));
ok("worklog last task is 151 (s50 = tasks 152+)", /Task ID: 151-push-s49/.test(read("worklog.md")));

// 9. session_89.md must NOT exist yet
try { read("docs/session_89.md"); ok("docs/session_89.md free", false, "ALREADY EXISTS"); } catch { ok("docs/session_89.md free", true); }

// 10. .env.example tracked + .env exists
ok(".env.example content carries the canonical DATABASE_URL", read(".env.example").includes('DATABASE_URL="file:../db/custom.db"'));

// report
let fails = 0;
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  if (!c.pass) fails++;
}
console.log(`\n${checks.length - fails}/${checks.length} plan anchors verified${fails ? ` — ${fails} FAILURES` : " — plan validated"}`);
process.exit(fails ? 1 : 0);
