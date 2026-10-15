// S59: VLM-diff the changed screenshot shots vs the s58 baselines (the s49–s58
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session: FOUR changed shots (02/04/05 the relative-time
// drift; 09 the S59 fixture title).
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

const CHANGED = [
  { shot: '02-dashboard', why: 'relative-time text and clock-dependent content on the recent tickets (timestamps move with the wall clock between captures)' },
  { shot: '04-my-tickets', why: 'relative-time text and clock-dependent content on the ticket rows (timestamps move with the wall clock between captures)' },
  { shot: '05-ticket-detail', why: 'relative-time text and clock-dependent content on the detail page (timestamps move with the wall clock between captures)' },
  { shot: '09-ticket-detail-attachments', why: 'the S59 fixture title (the per-session fixture ticket) plus relative-time text' },
];

async function main() {
  const zai = await ZAI.create();
  let allBenign = true;
  for (const { shot, why } of CHANGED) {
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Two screenshots of the same page from an IT support portal (Image 1 = the previous session's baseline, Image 2 = the new capture). The expected difference class is: ${why}. Answer with exactly one word on the first line: BENIGN if the only differences are within the expected class (timestamps, relative-time text, or the fixture ticket title), or REGRESSION if any structural/layout/styling difference exists. Then one short sentence naming what differs.`
            },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s59-baselines/${shot}.png`)}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64('/home/z/my-project/service-desk/docs/screenshots/' + shot + '.png')}` } }
          ]
        }
      ]
    });
    const content = completion.choices[0]?.message?.content || 'NO RESPONSE';
    const benign = /^BENIGN/.test(content);
    if (!benign) allBenign = false;
    console.log(`${shot}: ${content.split('\n')[0]} — ${content.split('\n').slice(1).join(' ').trim()}`);
  }
  if (!allBenign) { console.error('FATAL: a changed shot is NOT benign'); process.exit(1); }
  console.log('ALL CHANGED SHOTS BENIGN');
}

main().catch(e => { console.error('VLM shotdiff failed:', e.message); process.exit(1); });
