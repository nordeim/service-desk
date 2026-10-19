// S78: VLM-diff the changed screenshot shots vs the s77 baselines (saved pre-capture as /tmp/s78-baselines) (the s49–s78
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's PREDICTED set (the pre-capture form — the
// honest-record doctrine: the prediction is stated BEFORE the capture and
// corrected post-capture if the byte-compare differs): SIX byte-identical
// + FOUR changed — the fresh-clone shape (the s73/s75/s76/s77 precedent —
// the environment was RESET again this session: the workspace re-cloned,
// the re-seed re-ran, so the seeded createdAt/updatedAt timestamps moved
// to the re-seed moment): 02/04/05 the formatDateTime labels (the
// clock-time form carried forward from the s77 correction — this session's
// re-seed-to-capture window spans ~1–2 hours, well past the s76 session's
// ~9-minute byte-identical window and past the s77 ~30-minute window, so
// the labels move on the clock-time digits even within the same UTC day)
// + 09 the S78 fixture title (the per-session fixture). The MEASURED set
// (the byte-compare) corrects the CHANGED array post-capture if it
// differs — the post-capture correction, the honest-record form held.
// THE S78 MEASURED SET: SEVEN byte-identical + THREE changed (04/05/09) —
// the predicted 02 measured byte-IDENTICAL (the dashboard's rendered
// recent-tickets labels did not move across this window's re-seed-to-
// capture gap), the predicted array VLM-checked anyway (02's comparison
// a no-op — both images identical), all changed shots BENIGN
// since s73.
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

const CHANGED = [
  // The s78 PREDICTED set (the pre-capture form): SIX byte-identical +
  // FOUR changed — the fresh-clone shape: 02/04/05 the re-seed labels (the
  // formatDateTime timestamps on the dashboard's recent list, the ticket
  // cards, and the detail page — rendered from the re-seeded
  // createdAt/updatedAt values, the s73 fresh-clone precedent) + 09 the
  // per-session fixture title (S77 -> S78). The clock-time form carried
  // forward from the s77 correction: the re-seed-to-capture window spans
  // ~1–2 hours this session, so the labels move on the clock-time digits
  // even within the same UTC day. The MEASURED byte-compare corrects this
  // array post-capture if it differs (the honest-record form).
  { shot: '02-dashboard', why: 'the re-seed labels (the formatDateTime timestamps on the recent-tickets list rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '04-my-tickets', why: 'the re-seed labels (the formatDateTime timestamps on the ticket cards rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '05-ticket-detail', why: 'the re-seed labels (the formatDateTime timestamps on the detail page rendered from the re-seeded createdAt/updatedAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '09-ticket-detail-attachments', why: 'the S78 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s78-baselines/${shot}.png`)}` } },
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
