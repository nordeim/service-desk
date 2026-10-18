// S74: VLM-diff the changed screenshot shots vs the s73 baselines (saved pre-capture as /tmp/s74-baselines) (the s49–s74
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's OBSERVED set (the byte-compare): NINE
// byte-identical + ONE changed — the survived-workspace shape (the s71
// precedent — the workspace was NOT reset this session: no re-seed, the
// seeded createdAt timestamps fixed, so 04/05's absolute formatDateTime
// labels byte-identical) + 09 the S74 fixture title; the CHANGED array
// carries the observed set.
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

const CHANGED = [
  // The s74 OBSERVED set (the byte-compare): NINE byte-identical + ONE
  // changed — the survived-workspace shape: 09 the per-session fixture
  // title (the workspace survived, no re-seed: 04/05's absolute
  // formatDateTime labels unchanged against the fixed seed timestamps,
  // the s71 precedent).
  { shot: '09-ticket-detail-attachments', why: 'the S74 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s74-baselines/${shot}.png`)}` } },
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
