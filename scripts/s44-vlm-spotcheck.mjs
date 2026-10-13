// S44: VLM spot-check the convention shots (02 dashboard + 05 ticket detail)
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');
const [path, label] = [process.argv[2], process.argv[3]];

async function main() {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'This is a screenshot of an IT support portal page. Check for visual defects: broken layout, overlapping elements, unstyled components, missing sidebar/header, garbled text. Answer with exactly one word on the first line: LAYOUT-OK if the page renders correctly, or LAYOUT-DEFECT if anything is broken. Then one short sentence.'
          },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(path)}` } }
        ]
      }
    ]
  });
  console.log(`[${label}] ` + (completion.choices[0]?.message?.content || 'NO RESPONSE'));
}
main().catch(e => { console.error('VLM spot-check failed:', e.message); process.exit(1); });
