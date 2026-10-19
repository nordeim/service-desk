// S77: VLM-diff the changed screenshot shots vs the s76 baselines (saved pre-capture as /tmp/s77-baselines) (the s49–s77
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's OBSERVED set (the byte-compare, MEASURED):
// SIX byte-identical + FOUR changed — the fresh-clone shape (the s73/s75/s76
// precedent — the environment was RESET again this session: the workspace
// re-cloned, the re-seed re-ran, so the seeded createdAt/updatedAt timestamps
// moved to the re-seed moment — 02/04/05 the formatDateTime labels + 09
// the S77 fixture title). The pre-capture prediction said NINE identical +
// ONE changed (09 only — the re-seed landed on the same UTC day as the s76
// baseline capture, so the labels were predicted byte-identical, the s76
// no-day-boundary precedent carried forward); the MEASURED set added
// 02/04/05 (the re-seed moment this session sits ~30 minutes before the
// capture — the full formatDateTime labels move on the clock-time digits
// even within the same UTC day, the s73 clock-time form; the s76 session's
// re-seed-to-capture window was ~9 minutes, short enough that its 02 stayed
// byte-identical) — the post-capture correction, the honest-record form;
// the CHANGED array carries the measured observed set.
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

const CHANGED = [
  // The s77 OBSERVED set (the byte-compare, MEASURED): SIX byte-identical +
  // FOUR changed — the fresh-clone shape: 02/04/05 the re-seed labels (the
  // formatDateTime timestamps on the dashboard's recent list, the ticket
  // cards, and the detail page — rendered from the re-seeded
  // createdAt/updatedAt values, the s73 fresh-clone precedent) + 09 the
  // per-session fixture title. The pre-capture prediction said ONE (09 —
  // the same-UTC-day form carried forward from the s76 correction); the
  // measured set added 02/04/05 (the clock-time digits moved — the
  // re-seed-to-capture window this session spans ~30 minutes; the honest
  // post-capture correction form).
  { shot: '02-dashboard', why: 'the re-seed labels (the formatDateTime timestamps on the recent-tickets list rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '04-my-tickets', why: 'the re-seed labels (the formatDateTime timestamps on the ticket cards rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '05-ticket-detail', why: 'the re-seed labels (the formatDateTime timestamps on the detail page rendered from the re-seeded createdAt/updatedAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '09-ticket-detail-attachments', why: 'the S77 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s77-baselines/${shot}.png`)}` } },
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
