// S47: VLM-diff the three changed screenshot frames vs the s45 baselines (the s44/s45 lineage)
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
              text: `Two screenshots of the SAME page from an IT support portal, captured at different times. Image 1 = the NEW capture (session 47), Image 2 = the previous baseline (session 46). The expected differences are benign: relative timestamps of freshly re-seeded data (e.g. "x minutes ago"), or a temporary fixture title in a screenshot-only ticket. Answer with exactly one word on the first line: BENIGN if the only differences are the expected benign class (timestamps, fixture titles, seed-data-dependent values), or REGRESSION if any LAYOUT or STRUCTURAL difference exists (missing/extra elements, changed alignment, changed styling). Then one short sentence naming the differences you see.`
            },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`docs/screenshots/${name}.png`)}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s47/baselines/${name}.png`)}` } }
          ]
        }
      ]
    });
    console.log(`${name}: ${completion.choices[0]?.message?.content || 'NO RESPONSE'}`);
  }
}
main().catch(e => { console.error('VLM diff failed:', e.message); process.exit(1); });
