// S51: the remediation-plan validator — every named anchor in
// docs/remediation-plan-session51.md checked against the codebase (the s50
// pattern: the plan is validated BEFORE execution; a plan that names a
// non-existent anchor is a plan that cannot execute).
import { readFileSync, existsSync } from "node:fs";

const repo = "/home/z/my-project/service-desk";
const read = (p) => readFileSync(`${repo}/${p}`, "utf8");
const README = read("README.md");
const AGENTS = read("AGENTS.md");
const CLAUDE = read("CLAUDE.md");
const PAD = read("Project_Architecture_Document.md");
const SKILL = read("service-desk_SKILL.md");
const DEPLOY = read("docs/DEPLOYMENT.md");
const SEED = read("prisma/seed.ts");
const CORPUS = read("tests/corpus-count-contract.test.ts");
const AUTH = read("src/lib/auth.ts");
const ENVEX = read(".env.example");

let pass = 0, fail = 0;
const check = (label, cond) => {
  if (cond) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}`); }
};

// P1 anchors — the drift site + the ground truth
check("README L94 carries the false Python claim (the drift site)",
  /Requires \*\*Node\.js ≥ 20\*\* \(or Bun ≥ 1\.1\) and Python ≥ 3\.9 for the seed's crypto imports\./.test(README));
check("prisma/seed.ts imports crypto from node:crypto (the ground truth)",
  /import \{ randomUUID, scryptSync, randomBytes \} from "node:crypto";/.test(SEED));
check("the seed invokes no Python (no python token in the seed file)",
  !/python/i.test(SEED));
check("the Quick Start carries the python3 secret comment (the convenience, not a requirement)",
  /python3 -c "import secrets; print\(secrets\.token_hex\(32\)\)"/.test(README));
check(".env.example recommends openssl (the canonical generator, L30)",
  /generate with `openssl rand -hex 32`/.test(ENVEX));
check("DEPLOYMENT.md recommends openssl (the canonical generator, L107)",
  /Generate with `openssl rand -hex 32`/.test(DEPLOY));

// The corpus family sites (the 255 → 257 move targets)
check("README badge site: tests-255%20unit", /tests-255%20unit/.test(README));
check("README verification site: 255 Vitest unit tests", /255 Vitest unit tests/.test(README));
check("README pyramid site: 255 unit + 198 E2E tests", /255 unit \+ 198 E2E tests/.test(README));
check("README commands site: Vitest unit: 255 tests", /Vitest unit: 255 tests/.test(README));
check("AGENTS commands site: unit suite (255 tests", /unit suite \(255 tests/.test(AGENTS));
check("CLAUDE commands site: 255 unit / 198 E2E (needs", /255 unit \/ 198 E2E \(needs/.test(CLAUDE));
check("PAD §7.4 checklist site: `bun run test` — 255/", /`bun run test` — 255\//.test(PAD));
check("SKILL project_state site: project_state: 255 unit", /project_state: 255 unit/.test(SKILL));
check("SKILL Appendix A site: Vitest — 255 unit tests", /Vitest — 255 unit tests/.test(SKILL));

// The quickstart output line + the pin literals (the BRIDGE surfaces)
check("README quickstart output line: 25 files / 255 tests passed", /25 files \/ 255 tests passed/.test(README));
check("corpus pin 1's toBe(255) literal", /expect\(Number\(n\)\)\.toBe\(255\);/.test(CORPUS));
check("the BRIDGE ternary: listing.length === 25", /listing\.length === 25 \? "src 4 \+ tests 21"/.test(CORPUS));

// The §7.1 surfaces (the new row + the corpus-count row description)
check("PAD §7.1 carries the corpus-count row (tests/corpus-count-contract.test.ts, 5 tests)",
  /\| 1 \| 5 \| `tests\/corpus-count-contract\.test\.ts` \| Vitest \|/.test(PAD));
check("PAD §7.1 has NO prereq row yet (the RED target)", !/prereq-contract\.test\.ts/.test(PAD));

// The screenshots lineage (the s50→s51 move target)
check("AGENTS carries the s50 screenshots lineage",
  /capture-screenshots-s50\.sh` \(the s49 lineage verbatim/.test(AGENTS));
check("AGENTS reference list through session 50 (the -session50.md range end)",
  /-session50\.md/.test(AGENTS));

// The s89-shortlist clean candidates (verified, not remediated)
check("auth.ts: BUCKETS_SWEEP_THRESHOLD = 1_000", /BUCKETS_SWEEP_THRESHOLD = 1_000;/.test(AUTH));
check("auth.ts: rateLimit default limit = 10", /rateLimit\(key: string, limit = 10, windowMs = 15 \* 60 \* 1000\)/.test(AUTH));
check("forgot-password route: rateLimit(`forgot:${ip}`, 5)",
  read("src/app/api/auth/forgot-password/route.ts").includes("rateLimit(`forgot:${ip}`, 5)"));

// The session-docs convention anchors
check("docs/session_90.md exists (the operator transcript)", existsSync(`${repo}/docs/session_90.md`));
check("docs/session_91.md does NOT exist yet (this session's log target)", !existsSync(`${repo}/docs/session_91.md`));
check("SKILL carries version: 2.48.0 (the 2.49.0 bump target)", /^version: 2\.48\.0$/m.test(SKILL));

// The reference-side records (F1–F4, this session's measurements — the plan's
// claims about the s50 lineage it extends)
check("the s50 plan exists (the lineage this session follows)", existsSync(`${repo}/docs/remediation-plan-session50.md`));
check("tests/prereq-contract.test.ts does NOT exist yet (the pin target)", !existsSync(`${repo}/tests/prereq-contract.test.ts`));

console.log(`\n${pass}/${pass + fail} anchors verified${fail === 0 ? " — PLAN VALIDATED" : " — FIX THE PLAN"}`);
process.exit(fail === 0 ? 0 : 1);
