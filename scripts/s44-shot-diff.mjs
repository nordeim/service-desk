// S44: VLM-diff the changed shots vs the s43 git baseline
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');
const [newPath, basePath, label] = [process.argv[2], process.argv[3], process.argv[4]];

async function main() {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Two screenshots of the same page from an IT support portal, captured one session apart. Image 1 = the NEW capture, Image 2 = the BASELINE from the previous session. Ignore tiny relative-timestamp differences (e.g. "2 days ago" vs "3 days ago") and any text that references a session fixture number (S43 vs S44). Answer with exactly one word on the first line: BENIGN if the only differences are timestamps/fixture-numbers/rendering noise, or REGRESSION if there is any structural/layout/styling difference. Then one short sentence describing what differs.`
          },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(newPath)}` } },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(basePath)}` } }
        ]
      }
    ]
  });
  console.log(`[${label}] ` + (completion.choices[0]?.message?.content || 'NO RESPONSE'));
}
main().catch(e => { console.error('VLM diff failed:', e.message); process.exit(1); });
