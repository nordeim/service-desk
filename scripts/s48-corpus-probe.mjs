// S48 scratch: probe the corpus-count live-claim extraction across the 5 docs
// (validates the regex design before it goes into the pin file)
import fs from 'node:fs';

const DOCS = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'Project_Architecture_Document.md', 'service-desk_SKILL.md'];
const HIST_MARK = '## 10. Known Issues';

function liveSlice(doc) {
  const i = doc.indexOf(HIST_MARK);
  return i === -1 ? doc : doc.slice(0, i);
}

function unitClaims(doc) {
  const text = liveSlice(doc);
  const out = [];
  const push = (m) => { if (m) out.push(...m); };
  push([...text.matchAll(/tests-(\d{2,4})%20unit/g)].map(x => x[1]));
  push([...text.matchAll(/(\d{2,4})[ \t]+Vitest[ \t]+unit/g)].map(x => x[1]));
  push([...text.matchAll(/Vitest unit:[ \t]*(\d+)/g)].map(x => x[1]));
  push([...text.matchAll(/unit suite \((\d+)/g)].map(x => x[1]));
  push([...text.matchAll(/project_state:[ \t]*(\d+)/g)].map(x => x[1]));
  push([...text.matchAll(/`bun run test`[ \t]*—[ \t]*(\d+)\//g)].map(x => x[1]));
  return out;
}

function e2eClaims(doc) {
  const text = liveSlice(doc);
  const out = [];
  const push = (m) => { if (m) out.push(...m); };
  push([...text.matchAll(/(\d{2,4})%20E2E/g)].map(x => x[1]));
  push([...text.matchAll(/(\d{2,4})[ \t]+Playwright[ \t]+E2E/g)].map(x => x[1]));
  push([...text.matchAll(/`bun run test:e2e`[ \t]*(\d+)\//g)].map(x => x[1]));
  push([...text.matchAll(/(\d{2,4})[ \t]+E2E[ \t]+\(/g)].map(x => x[1]));
  return out;
}

for (const f of DOCS) {
  const doc = fs.readFileSync(f, 'utf8');
  const u = unitClaims(doc);
  const e = e2eClaims(doc);
  console.log(`${f}: unit=[${u.join(',')}] e2e=[${e.join(',')}]`);
}
