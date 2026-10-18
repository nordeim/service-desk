// S75: VLM-diff the changed screenshot shots vs the s74 baselines (saved pre-capture as /tmp/s75-baselines) (the s49–s75
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's OBSERVED set (the byte-compare, MEASURED): SIX
// byte-identical + FOUR changed — the fresh-clone shape (the s73 precedent —
// the environment was RESET this session: the workspace re-cloned, the
// re-seed re-ran, so the seeded createdAt/updatedAt timestamps moved to the
// re-seed moment — 02/04/05's date/time labels changed with them (02 the
// date-only formatDate labels on the dashboard recent rows — the day-boundary
// form; 04/05 the full formatDateTime labels)) + 09 the S75 fixture title;
// the CHANGED array carries the measured observed set.
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

const CHANGED = [
  // The s75 OBSERVED set (the byte-compare, MEASURED): SIX byte-identical +
  // FOUR changed — the fresh-clone shape: 02/04/05 the re-seed labels (02
  // the date-only formatDate labels on the dashboard recent rows, the
  // day-boundary form; 04/05 the formatDateTime timestamps on the cards and
  // the detail page — rendered from the re-seeded createdAt/updatedAt
  // values, the s73 fresh-clone precedent) + 09 the per-session fixture
  // title. The pre-capture prediction said THREE (04/05/09); the measured
  // set added 02 (the day-boundary form) — the post-capture correction,
  // the honest-record form.
  { shot: '02-dashboard', why: 'the re-seed labels (the date-only formatDate labels on the dashboard recent rows rendered from the re-seeded createdAt values — the day-boundary form of the fresh-clone shape, only the date text differs)' },
  { shot: '04-my-tickets', why: 'the re-seed labels (the formatDateTime timestamps on the ticket cards rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '05-ticket-detail', why: 'the re-seed labels (the formatDateTime timestamps on the detail page rendered from the re-seeded createdAt/updatedAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '09-ticket-detail-attachments', why: 'the S75 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s75-baselines/${shot}.png`)}` } },
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
