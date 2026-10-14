// S48 scratch: dump the exact claim-line contexts across the 5 docs
import fs from 'node:fs';

const DOCS = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'Project_Architecture_Document.md', 'service-desk_SKILL.md'];

for (const f of DOCS) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  console.log(`\n### ${f}`);
  lines.forEach((l, i) => {
    if (/\d{2,4}[ \t]*(?:unit|E2E|Vitest)|E2E[ \t]*\(|project_state|test:e2e/.test(l) && /\d/.test(l)) {
      const s = l.trim().slice(0, 130);
      if (/unit|E2E|project_state/.test(s)) console.log(`  L${i + 1}: ${s}`);
    }
  });
}
