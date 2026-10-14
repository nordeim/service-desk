// S46: the VLM layout spot-checks on the convention shots (the s44/s46 lineage)
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');
const frames = process.argv.slice(2);

async function main() {
  const zai = await ZAI.create();
  for (const name of frames) {
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'A screenshot from an IT support portal (the clone build). Check ONLY the layout structure: sidebar, header, cards, lists, alignment, spacing rhythm. Answer with exactly one word on the first line: LAYOUT-OK if the layout renders correctly and completely (no broken, overlapping, or missing structural elements), or LAYOUT-BAD if any structural defect is visible. Then one short sentence describing what you see.'
            },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`docs/screenshots/${name}.png`)}` } }
          ]
        }
      ]
    });
    console.log(`${name}: ${completion.choices[0]?.message?.content || 'NO RESPONSE'}`);
  }
}
main().catch(e => { console.error('VLM spot-check failed:', e.message); process.exit(1); });
