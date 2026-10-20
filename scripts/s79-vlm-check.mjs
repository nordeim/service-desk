// S79: the paired VLM parity checks (the s45–s78 dashboard lineage + the S76
// login-pair extension (the s76 P1 closure — the reference-side login page
// gained its first paired capture) + the S77 MOBILE-login-pair extension
// (the s77 P1 closure — the paired battery's coverage derives from what the
// rotation touches at EVERY width the product serves: the rotating login CSS
// styles the login page at 375 too, and the mobile surface had NO paired
// capture; a desktop-only pair measures half the styled surface) + the S78
// ROUTE-PAIR extension (the s78 P1 closure — the same battery's coverage
// derives from what the rotation touches at EVERY ROUTE the product serves:
// the reference-side capture set covered the login page + the dashboard
// only, so the other nav-served routes (mytickets + submitticket — the
// surfaces the SAME rotating app CSS styles) had NO paired capture; the
// mytickets pair carries the SUPERSET-AWARE prompt form (ours deliberately
// adds the documented sort/scope row below the parity filter grid, so the
// prompt names the expected row and judges the parity structure); a
// two-surface battery measures half the styled app) + the S79 DETAIL-PAIR
// extension (the s79 P1 closure — the click-through route, one level
// deeper: the ticket-detail surface the SAME rotating app CSS styles had
// NO paired capture (our 05 shot self-diffed our own baseline only); the
// detail pair carries the SUPERSET-AWARE form — ours deliberately adds
// the documented Update Status owner card in the right column, and the
// ticket CONTENT is data on two separate systems (their rows churn), so
// the prompt names the expected superset AND the data-dependent sections
// and judges the parity frame; a list+form battery measures the nav
// surface only — the click-through detail is the styled app's deepest
// route))
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

async function pairedCheck(zai, label, aPath, bPath, prompt) {
  const completion = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(aPath)}` } },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64(bPath)}` } }
        ]
      }
    ]
  });
  const out = completion.choices[0]?.message?.content || 'NO RESPONSE';
  console.log(`=== ${label} ===`);
  console.log(out);
  return out;
}

async function main() {
  const zai = await ZAI.create();

  // Check 1 (the standing s45–s78 dashboard pair)
  const dash = await pairedCheck(zai, 'DASHBOARD PAIR',
    '/tmp/s79-results/ref-dashboard.png',
    '/tmp/s79-results/s79-ourside/our-dashboard.png',
    'Two dashboard screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: sidebar position/width, header position, main content card arrangement, stats cards, recent tickets list, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 2 (the s76-lineage login pair — the surface the login CSS styles at desktop)
  const login = await pairedCheck(zai, 'LOGIN PAIR',
    '/tmp/s79-results/ref-login.png',
    '/tmp/s79-results/s79-ourside/our-login.png',
    'Two login-page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: card position/width, heading and form arrangement, input fields, button placement, footer/links, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 3 (the S77-lineage mobile login pair — the s77 P1 closure: the same surface at 375)
  const mlogin = await pairedCheck(zai, 'MOBILE LOGIN PAIR (375)',
    '/tmp/s79-results/ref-login-mobile.png',
    '/tmp/s79-results/s79-ourside/our-login-mobile.png',
    'Two mobile login-page screenshots (375px viewport) from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: card position/width, heading and form arrangement, input fields, button placement, footer/links, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 4 (the s78-lineage mytickets route pair — the SUPERSET-AWARE form —
  // ours deliberately carries the documented sort/scope superset row below the
  // parity 3-col filter grid, so the prompt names the expected row and judges
  // the parity structure)
  const mt = await pairedCheck(zai, 'MY TICKETS PAIR',
    '/tmp/s79-results/ref-mytickets.png',
    '/tmp/s79-results/s79-ourside/our-mytickets.png',
    'Two ticket-list page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). The clone deliberately ADDS a documented superset row (a sort dropdown + My Tickets/All Tickets toggle buttons) below the filter grid — EXPECT that row in Image 2 and do not count it as a difference. Ignore the actual ticket data/content. Compare ONLY the parity layout structure: sidebar position/width, page title arrangement, the 3-column filter grid (search input, status dropdown, priority dropdown), ticket card structure (bordered card, icon tile, title/arrow arrangement, badges), spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the parity layout structure matches, or LAYOUT-DIFF if the parity layouts differ structurally. Then one short sentence describing any structural difference BEYOND the expected superset row.');

  // Check 5 (the s78-lineage submitticket route pair — the plain form)
  const st = await pairedCheck(zai, 'SUBMIT TICKET PAIR',
    '/tmp/s79-results/ref-submitticket.png',
    '/tmp/s79-results/s79-ourside/our-submitticket.png',
    'Two submit-ticket form page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: sidebar position/width, header position, page title arrangement, form card (field arrangement, labels, category/priority controls, submit button placement), spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 6 (the S79 detail pair — the P1 fix: the SUPERSET-AWARE form —
  // ours deliberately carries the documented Update Status owner card in the
  // right column, and the ticket CONTENT is data on two separate systems
  // (their rows churn), so the prompt names the expected superset AND the
  // data-dependent sections and judges the parity frame)
  const dt = await pairedCheck(zai, 'DETAIL PAIR',
    '/tmp/s79-results/ref-ticketdetail.png',
    '/tmp/s79-results/s79-ourside/our-ticketdetail.png',
    'Two ticket-detail page screenshots from an IT support portal (1280px viewport). Image 1 = the original reference, Image 2 = the clone (ours). The clone deliberately ADDS a documented superset card in the right column titled "Update Status" (an owner status dropdown below the "Ticket Information" panel) — EXPECT that card in Image 2 and do not count it as a difference. The ticket CONTENT is data on two separate systems and differs by design: the title, description text, badges, any Attachments section, and the number/content of comment rows are all data-dependent — ignore them. Compare ONLY the parity layout frame: the Back to Tickets control at top-left, the max-width page container, the 2-column grid (left: ticket card with gradient header + description, then a Comments card; right column: the Ticket Information panel), the card styling rhythm, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the parity layout frame matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference BEYOND the expected superset card and the data-dependent content.');

  const firstWord = (s) => (s || '').trim().split(/\s+/)[0];
  const dOk = firstWord(dash) === 'LAYOUT-OK';
  const lOk = firstWord(login) === 'LAYOUT-OK';
  const mOk = firstWord(mlogin) === 'LAYOUT-OK';
  const mtOk = firstWord(mt) === 'LAYOUT-OK';
  const stOk = firstWord(st) === 'LAYOUT-OK';
  const dtOk = firstWord(dt) === 'LAYOUT-OK';
  console.log(`VERDICT: dashboard ${dOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; login ${lOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; mobile-login ${mOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; mytickets ${mtOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; submitticket ${stOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; detail ${dtOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}`);
  if (!dOk || !lOk || !mOk || !mtOk || !stOk || !dtOk) process.exit(1);
}

main().catch(e => { console.error('VLM check failed:', e.message); process.exit(1); });
