// S104: VLM-diff the changed screenshot shots vs the s103 baselines (saved pre-capture as /tmp/s104-baselines) (the s49–s104
// pattern — each changed shot must be BENIGN: only the expected class of
// difference). This session's PREDICTED set (the pre-capture form — the
// honest-record doctrine: the prediction is stated BEFORE the capture and
// corrected post-capture if the byte-compare differs): the
// FRESH-RE-SEED branch (the s103 form adapted to the doc-side-only
// remediation: the mid-session recycle took the persisted db — the
// recovery's fresh re-seed landed Nov 4 ~13:55 +0800, a DIFFERENT +0800
// calendar day than the s103 baselines' seed (Nov 3 ~23:08 +0800) → the
// DATE-ONLY labels (02-dashboard recent rows) advance, the TIME-BEARING
// formatDateTime labels (04/05) carry the time-of-day advance, 09 the
// S103->S104 fixture title + the session-103->session-104 fixture
// description (the per-session fixture — the certain change); the
// remediation itself touches NO src/ file so 01/03/08 stay byte-identical
// (the s103 label-fix faces absent); 06 the mobile dashboard carries no
// date-bearing rows; 07/10 no seed-dependent content): FOUR changed
// (02/04/05/09) + SIX byte-identical (01/03/06/07/08/10). The MEASURED
// byte-compare (the post-capture honest-record form): recorded honestly
// below after the capture (any deviation from the predicted set
// corrected in this header, the s98/s100/s103 correction precedents).

//
// THE S100 MEASURED SET (the post-capture honest-record form): FOUR
// byte-identical (01/03/08/10) + SIX changed (02/04/05/06/07/09) — the
// predicted fresh-clone set UNDER-called the set by two (SIX identical +
// FOUR changed predicted; 06/07 the mobile surfaces carried the same
// day-advanced labels, the sub-visual byte-delta class — byte-changed
// but VLM-read IDENTICAL; recorded honestly, the s98 correction
// precedent).

//
// THE S95 MEASURED SET (the post-capture honest-record form): SEVEN
// byte-identical + THREE changed (04/05/09) — the predicted fresh-clone
// set (02/04/05/09) CORRECTED by the measured byte-compare: the
// 02-dashboard label-coincidence branch FIRED (the s88 caveat — the
// fresh-clone re-seed landed on the SAME +0800 calendar day as the s94
// re-seed, so the dashboard's date-only recent-row labels coincided
// byte-identically; the 04/05 time-bearing labels carried the
// time-of-day advance) + 09 the S94->S95 fixture title; all three
// changed shots VLM-diffed BENIGN; the seed re-verified canonical after
// the capture (4/11/3, zero fixtures).
//
// THE S93 MEASURED SET (the post-capture honest-record form): NINE
// byte-identical + ONE changed (09) — the predicted PERSISTED-WORKSPACE
// set measured EXACTLY (the workspace was NOT reset at the s93 open — a
// `git pull` on the standing tree, the seed's ticket leg `if (existing)
// continue` never touching the stored stamps, so the 02/04/05 labels read
// byte-identical) + 09 the S92->S93 fixture title (the certain change);
// the one changed shot VLM-diffed BENIGN (the verdict naming the fixture
// title); the seed re-verified canonical after the capture (4/11/3, zero
// fixtures — Prisma-verified).
//
// THE S92 MEASURED SET (the post-capture honest-record form): SIX
// byte-identical + FOUR changed (02/04/05/09) — the predicted fresh-clone
// set measured EXACTLY (the s84/s85 form): the canonical db re-seeded at
// the s92 open (the workspace-reset form), so the 02/04/05 formatDateTime
// labels read CHANGED (the new seed's stamps vs the s91 baselines'
// prior-seed stamps — the 02 shot CHANGED that window, the s88
// label-coincidence branch NOT firing) and 09 carried the S91->S92
// fixture title. The six-identical form measured honestly (01/03 the
// static surfaces + 06/07/08/10 the below-the-fold/no-label surfaces —
// the byte-compare the ground truth). No post-capture correction needed
// — the measured set matched the predicted set exactly. All four changed
// shots VLM-diffed BENIGN (the shotdiff verdict naming the advance + the
// fixture title).
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
  // The s104 MEASURED set (the post-capture honest-record form — the
  // predicted set CORRECTED at the measured deviations, the s98/s100
  // precedent): the plan predicted SIX changed (01/02/04/05/06/09) +
  // FOUR identical (03/07/08/10); the measured byte-compare read SEVEN
  // changed (01/02/03/04/05/08/09) + THREE identical (06/07/10). The
  // REMEDIATION-CHANGES-THE-UI branch (the s104 label fix is the first
  // src/ parity change in the lineage's shot-diff window): 01 the label
  // fix's own face (the login labels center — the fix); 02/04/05 the
  // fresh re-seed's date/time advances (the seed at Nov 3 ~23:08 +0800
  // vs the s102 baselines' Nov 2 ~22:53 +0800 seed — a different
  // +0800 calendar day, so both the date-only and time-bearing labels
  // advance); 09 the S102->S104 fixture title. THE TWO CORRECTIONS:
  // 03 + 08 changed against the prediction — the label fix's own face
  // on the submit surface (the prediction scoped the fix's visual
  // effect to the login card, but the shared Label primitive moves
  // EVERY form surface: the inline label's line box vs the flex label's
  // items-center box shifts the field rows by a pixel — 08's
  // attachment row sits under a Label of its own); 06 identical against
  // the prediction — the mobile dashboard carries no date-bearing rows
  // (the prediction over-modeled the date-only advance for a surface
  // whose stats cards + welcome text carry no dates).
  { shot: '01-login', why: 'the s104 label-alignment parity fix — the Email/Password labels now render centered over their inputs (the reference\'s inline-label form), where the baseline shows them left-aligned (the stock shadcn flex label)' },
  { shot: '02-dashboard', why: 'the fresh re-seed\'s stored stamps vs the s102 baselines\' prior-seed stamps — the recent-rows\' date-only labels carry the one-day advance (the seeds landed on different +0800 calendar days)' },
  { shot: '03-submit-ticket', why: 'the s104 label-alignment parity fix\'s line-box shift on the form fields — the inline label\'s line box vs the flex label\'s items-center box (a one-to-two-pixel row shift, no structural change)' },
  { shot: '04-my-tickets', why: 'the fresh re-seed\'s stored stamps vs the s102 baselines\' prior-seed stamps — the time-bearing formatDateTime labels on the ticket cards carry the advance' },
  { shot: '05-ticket-detail', why: 'the fresh re-seed\'s stored stamps vs the s102 baselines\' prior-seed stamps — the time-bearing formatDateTime labels on the detail page carry the advance' },
  { shot: '08-submit-attachment-row', why: 'the s104 label-alignment parity fix\'s line-box shift — the attachment row sits under a Label of its own (the shared primitive moved every form surface)' },
  { shot: '09-ticket-detail-attachments', why: 'the S102->S104 fixture title (the per-session fixture ticket) — the fixture title text on the detail page' },
];

async function main() {
  const zai = await ZAI.create();
  let allBenign = true;
  for (const { shot, why } of CHANGED) {
    // S80 resilience addition: the vision endpoint intermittently 400s a
    // burst call (the generic parse-error signature; the same retry class as
    // the s104-vlm-check.mjs wrapper) — retry with backoff before failing.
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(`/tmp/s104-baselines/${shot}.png`)}` } },
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
