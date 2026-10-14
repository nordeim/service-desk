// S48: VLM-diff the changed screenshot frame vs the s47 baseline + spot-checks (the s44–s47 lineage)
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

async function main() {
  const zai = await ZAI.create();
  const diff = async (name, prompt) => {
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`docs/screenshots/${name}.png`)}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s47-shots/${name}.png`)}` } }
          ]
        }
      ]
    });
    console.log(`${name}: ${(completion.choices[0]?.message?.content || 'NO RESPONSE').split('\n').slice(0, 2).join(' | ')}`);
  };

  // The changed shot (09): expected benign — the S48 fixture title
  await diff('09-ticket-detail-attachments',
    `Two screenshots of the SAME page from an IT support portal, captured at different times. Image 1 = the NEW capture (session 48), Image 2 = the previous baseline (session 47). The expected difference is benign: the temporary fixture ticket's title (a screenshot-only ticket, "S48 screenshot fixture (removed after capture)" vs the s47 form). Answer with exactly one word on the first line: BENIGN if the only differences are the expected benign class (fixture titles, timestamps, seed-data-dependent values), or REGRESSION if any LAYOUT or STRUCTURAL difference exists (missing/extra elements, changed alignment, changed styling). Then one short sentence naming the differences you see.`);

  // The convention spot-checks (02 + 05): layout-OK against the baseline
  for (const name of ['02-dashboard', '05-ticket-detail']) {
    await diff(name,
      `Two screenshots of the SAME page from an IT support portal, captured at different sessions. Image 1 = the NEW capture (session 48), Image 2 = the previous baseline (session 47). Answer with exactly one word on the first line: LAYOUT-OK if the layout structure is identical (no missing/extra elements, no alignment or styling changes), or LAYOUT-DIFF if anything structural differs. Then one short sentence.`);
  }
}
main().catch(e => { console.error('VLM check failed:', e.message); process.exit(1); });
