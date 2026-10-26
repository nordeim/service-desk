// S91: VLM-diff the changed screenshot shots vs the s90 baselines (saved pre-capture as /tmp/s91-baselines) (the s49–s91
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's PREDICTED set (the pre-capture form — the
// honest-record doctrine: the prediction is stated BEFORE the capture and
// corrected post-capture if the byte-compare differs): the
// FRESH-CLONE shape (the workspace was RESET at the s91 open — git
// clone + a fresh .env + db:push + the canonical re-seed, so the seeded
// rows carry NEW stored createdAt labels against the s89 baselines'
// PRIOR-seed labels — the 02/04/05 formatDateTime clock-time labels
// are expected CHANGED this window when the seed moments render
// different minute labels, or byte-identical when the labels coincide;
// both forms carried honestly) + 09 the S90->S91
// fixture title
// (the per-session fixture — the certain change). The 02/04/05
// POSSIBLE-CHANGE watch carried in the CHANGED array anyway (the
// honest no-op check: both images identical if they measure identical,
// and the byte-compare names any label that moved). The MEASURED set
// (the byte-compare) corrects the CHANGED array post-capture if it
// differs — the post-capture correction, the honest-record form held.

//
// THE S88 MEASURED SET (the post-capture honest-record form): SEVEN
// byte-identical + THREE changed (04/05/09) — the predicted fresh-clone
// set's 02 label-coincidence branch fired (the dashboard's date-only
// recent-row labels rendered the same UTC day for both seed moments; the
// byte-compare the ground truth — the shotdiff's 02 answer carried the
// VLM's identical-pair artifact, a named difference on byte-identical
// images, the s88 honest-record lesson); 04/05 the clock-label advance +
// 09 the S87->S88 fixture title, all changed shots VLM-diffed BENIGN.
//
// THE S85 MEASURED SET (the post-capture honest-record form): SIX
// byte-identical + FOUR changed (02/04/05/09) — the predicted fresh-clone
// set measured EXACTLY: the canonical db re-seeded at the s85 open (the
// workspace-reset form), so the 02/04/05 formatDateTime labels read
// CHANGED (the new seed's stamps vs the s84 baselines' prior-seed stamps)
// and 09 carried the S84->S85 fixture title + the session-85 description.
// The six-identical form measured honestly (01/03 the static surfaces +
// 06/07/08/10 the below-the-fold/no-label surfaces — the byte-compare the
// ground truth). No post-capture correction needed — the measured set
// matched the predicted set exactly. All four changed shots VLM-diffed
// BENIGN (the shotdiff verdict naming the advance + the fixture title).
//
// THE S84 MEASURED SET (the post-capture honest-record form): SIX
// byte-identical + FOUR changed (02/04/05/09) — the predicted fresh-clone
// set measured EXACTLY: the canonical db re-seeded at the s84 open (the
// workspace-reset form), so the 02/04/05 formatDateTime labels read
// CHANGED (the new seed's stamps vs the s83 baselines' prior-seed
// stamps — the 04 shot's VLM diff naming the advance: the timestamps
// advanced by one day and six minutes) and 09 carried the S83->S84
// fixture title + the same label advance. The six-identical form
// measured honestly (01/03 the static surfaces + 06/07/08/10 the
// below-the-fold/no-label surfaces — the byte-compare the ground
// truth). No post-capture correction needed — the measured set matched
// the predicted set exactly. All four changed shots VLM-diffed BENIGN.
//
// THE S83 MEASURED SET (the post-capture honest-record form): SIX
// byte-identical + FOUR changed (02/04/05/09) — the predicted fresh-clone
// set measured EXACTLY: the canonical db re-seeded at the s83 open (the
// workspace-reset form), so the 02/04/05 formatDateTime labels read
// CHANGED (the new seed's stamps vs the baselines' prior-seed stamps —
// the 05 shot naming the advance: Oct 20, 2026 at 10:30 PM -> Oct 21,
// 2026 at 10:49 PM) and 09 carried the S82->S83 fixture title + the same
// label advance. The six-identical form measured honestly (01/03 the
// static surfaces + 06/07/08/10 the below-the-fold/no-label surfaces —
// the byte-compare the ground truth). No post-capture correction needed —
// the measured set matched the predicted set exactly.
//
// THE S82 MEASURED SET (the post-capture honest-record form): NINE
// byte-identical + ONE changed (09) — EXACTLY the predicted survived-db
// set: the canonical db carried over from the s81 closeout (no re-seed
// at the s82 open), so the 02/04/05 formatDateTime labels read
// byte-IDENTICAL (the no-op watch verified: both images identical, the
// VLM confirming no difference) and 09 carried the S81->S82 per-session
// fixture title (the only change). No post-capture correction needed —
// the measured set matched the predicted set exactly.
// THE S81 MEASURED SET (the post-capture honest-record form): NINE
// byte-identical + ONE changed (09) — the predicted core
// {04, 05, 09} + the possible 02 CORRECTED POST-CAPTURE: the re-seed-to-capture
// gap this window was minutes (the fresh seed immediately before the derived
// battery), so the 04/05 clock-time labels held byte-identical within the
// ~9-minute window and 09 carried the S80->S81 per-session fixture title;
// 02/04/05 read identical (the no-op form).
//
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
  // The s91 PREDICTED set (the pre-capture form): the FRESH-CLONE
  // shape + 09 the certain per-session fixture title (the fresh-clone
  // re-seed at the s91 open, so the formatDateTime labels on the
  // dashboard's recent list, the ticket cards, and the detail page
  // render the NEW seed's stored createdAt values — expected CHANGED
  // when the minute labels differ from the s90 baselines' prior-seed
  // labels, byte-identical when they coincide; the 02/04/05 shots
  // carried in this array because they are predicted CHANGED this
  // window. The MEASURED byte-compare corrects this array
  // post-capture if it differs (the honest-record form).
  { shot: '02-dashboard', why: 'the fresh-clone clock-label advance (the re-seeded seed timestamps) — the dashboard recent-list date labels' },
  { shot: '04-my-tickets', why: 'the fresh-clone clock-label advance (the re-seeded seed timestamps) — the ticket-card formatDateTime labels' },
  { shot: '05-ticket-detail', why: 'the fresh-clone clock-label advance (the re-seeded seed timestamps) — the detail-page formatDateTime labels' },
  { shot: '09-ticket-detail-attachments', why: 'the S90->S91 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
];

async function main() {
  const zai = await ZAI.create();
  let allBenign = true;
  for (const { shot, why } of CHANGED) {
    // S80 resilience addition: the vision endpoint intermittently 400s a
    // burst call (the generic parse-error signature; the same retry class as
    // the s91-vlm-check.mjs wrapper) — retry with backoff before failing.
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s91-baselines/${shot}.png`)}` } },
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
