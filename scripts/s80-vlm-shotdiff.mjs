// S80: VLM-diff the changed screenshot shots vs the s79 baselines (saved pre-capture as /tmp/s80-baselines) (the s49–s80
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's PREDICTED set (the pre-capture form — the
// honest-record doctrine: the prediction is stated BEFORE the capture and
// corrected post-capture if the byte-compare differs): SEVEN
// byte-identical + THREE changed — the fresh-clone shape (the
// s73/s75/s76/s77/s78 precedent — the environment was rebuilt at the
// continuation: the workspace re-cloned, the re-seed re-ran, so the
// seeded createdAt/updatedAt timestamps moved to the re-seed moment):
// 04/05 the formatDateTime labels (the clock-time form carried forward
// from the s77/s78 corrections — this session's re-seed-to-capture
// window spans the continuation windows, well past the s76 ~9-minute
// byte-identical window, so the labels move on the clock-time digits
// even within the same UTC day) + 09 the S80 fixture title (the
// per-session fixture). 02 the POSSIBLE addition the same clock-time
// form — the s78 window measured it byte-identical across a similar
// hours-long window; carried in the CHANGED array for the no-op check
// (both images identical if it measures identical). The MEASURED set
// (the byte-compare) corrects the CHANGED array post-capture if it
// differs — the post-capture correction, the honest-record form held.
// THE S80 MEASURED SET: SIX byte-identical + FOUR changed (02/04/05/09) —
// the predicted core {04, 05, 09} all benign + the possible 02 MEASURED
// CHANGED this time (the s78 window's form materialized: the
// re-seed-to-capture gap spanned the session's THREE-WAVE battery runs,
// well past the byte-identical window, so the dashboard's recent-tickets
// labels moved on the clock-time digits); all changed shots BENIGN (02/04/05
// the re-seed clock-time labels + 09 the S79->S80 fixture title + the
// timestamps). The no-op form carried the 02 honestly; no post-capture
// correction needed. (The PRIOR session's record: )
// THE S79 MEASURED SET: SEVEN byte-identical + THREE changed (04/05/09) —
// EXACTLY the predicted core; the possible 02 measured byte-IDENTICAL
// again (the s78 precedent repeated: the dashboard's rendered
// recent-tickets labels did not move across this window's
// re-seed-to-capture gap), the no-op comparison run anyway (both
// images identical), all changed shots BENIGN (04/05 the re-seed
// clock-time labels 8:27 AM -> 10:36 PM + 09 the S78->S79 fixture
// title). No post-capture correction needed — the measured set
// matched the predicted set exactly.
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

const CHANGED = [
  // The s80 PREDICTED set (the pre-capture form): SEVEN byte-identical +
  // THREE changed + the possible 02 — the fresh-clone shape: 02/04/05 the
  // re-seed labels (the formatDateTime timestamps on the dashboard's
  // recent list, the ticket cards, and the detail page — rendered from
  // the re-seeded createdAt/updatedAt values, the s73 fresh-clone
  // precedent) + 09 the per-session fixture title (S79 -> S80). The
  // clock-time form carried forward from the s77/s78 corrections: the
  // re-seed-to-capture window spans the continuation windows this
  // session, so the labels move on the clock-time digits even within
  // the same UTC day. The MEASURED byte-compare corrects this array
  // post-capture if it differs (the honest-record form).
  { shot: '02-dashboard', why: 'the re-seed labels (the formatDateTime timestamps on the recent-tickets list rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '04-my-tickets', why: 'the re-seed labels (the formatDateTime timestamps on the ticket cards rendered from the re-seeded createdAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '05-ticket-detail', why: 'the re-seed labels (the formatDateTime timestamps on the detail page rendered from the re-seeded createdAt/updatedAt values — the fresh-clone shape, only the time text differs)' },
  { shot: '09-ticket-detail-attachments', why: 'the S80 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
];

async function main() {
  const zai = await ZAI.create();
  let allBenign = true;
  for (const { shot, why } of CHANGED) {
    // S80 resilience addition: the vision endpoint intermittently 400s a
    // burst call (the generic parse-error signature; the same retry class as
    // the s80-vlm-check.mjs wrapper) — retry with backoff before failing.
    let completion;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Two screenshots of the same page from an IT support portal (Image 1 = the previous session's baseline, Image 2 = the new capture). The expected difference class is: ${why}. Answer with exactly one word on the first line: BENIGN if the only differences are within the expected class (timestamps, relative-time text, or the fixture ticket title), or REGRESSION if any structural/layout/styling difference exists. Then one short sentence naming what differs.`
            },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s80-baselines/${shot}.png`)}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64('/home/z/my-project/service-desk/docs/screenshots/' + shot + '.png')}` } }
          ]
        }
      ]
    });
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        console.log(`(shotdiff retry ${attempt + 1}/3 for ${shot} after: ${String(e.message).slice(0, 60)})`);
        await new Promise((r) => setTimeout(r, 15000));
      }
    }
    const content = completion.choices[0]?.message?.content || 'NO RESPONSE';
    const benign = /^BENIGN/.test(content);
    if (!benign) allBenign = false;
    console.log(`${shot}: ${content.split('\n')[0]} — ${content.split('\n').slice(1).join(' ').trim()}`);
  }
  if (!allBenign) { console.error('FATAL: a changed shot is NOT benign'); process.exit(1); }
  console.log('ALL CHANGED SHOTS BENIGN');
}

main().catch(e => { console.error('VLM shotdiff failed:', e.message); process.exit(1); });
