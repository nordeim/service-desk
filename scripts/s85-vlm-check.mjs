// S85: the paired VLM parity checks (the s45–s84 dashboard lineage + the S76
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
// route) + the S80 MOBILE-ROUTE-PAIR extension (the s80 P1 closure —
// the route+width INTERSECTION: the s77 mobile closure paired the LOGIN
// page only, the s78/s79 route closures measured at desktop 1280 only,
// so the route surfaces at the mobile width (mytickets + the
// click-through detail + submitticket at 375 — the very destinations
// the mobile nav-tap navigates to, the surfaces the SAME rotating app
// CSS styles at the mobile width) had NO paired capture; the three
// mobile-route pairs carry the standing prompt forms — the
// mytickets-mobile pair the SUPERSET-AWARE form (the documented
// sort/scope row named), the detail-mobile pair the SUPERSET-AWARE +
// churn-naming form (the Update Status superset card + ALL
// data-dependent sections named — the two-systems doctrine), the
// submitticket-mobile pair the plain form — and ANY first-pass
// LAYOUT-DIFF gets the live-DOM ground-truth verification before the
// record (the s78/s79/s80 doctrine: a data-dependent absence is the
// churn case, an adjacent-card merge reading is an interpretation
// artifact — the DOM enumeration carries the truth). The battery's
// coverage derives from the surfaces the rotation styles at every
// ROUTE the product serves x every WIDTH the product serves — the
// INTERSECTION, not the union of separately-closed axes))
// + the S81 CAPTURE-SETTLE duty (the s81 P1 closure — the capture side
// of the s78/s79/s80 LAYOUT-DIFF ground-truth doctrine): a paired capture
// on a hydrated SPA surface settles BEFORE the screenshot — a fixed sleep
// is a race, not a guarantee; the settle-verified form polls the DOM for
// the rendered state (the h1 present + the spinner count 0), and any
// first-pass LAYOUT-DIFF still gets the live-DOM ground-truth before the
// record (the doctrine now guards BOTH ends: the capture moment AND the
// verdict).
// + the S82 PAIRED-GRID COMPLETENESS duty (the s82 P1 closure): a paired
// grid is complete when every ROUTE x WIDTH cell the product serves carries
// a pair — INCLUDING the cell whose defect figures a standing battery already
// measures (the figures and the pair are different instruments: the F4
// numbers measure the defect, the pair verifies the structural parity of
// the visible frame). A cell with a known defect still gets the pair, with
// the defect-aware prompt naming the expected difference — so the pair reads
// the parity honestly and flips the day the defect heals.
// + the S83 PAIR-PROMPT-CLAMP duty (the s83 P1 closure): a pair prompt's
// data-dependent clause must name the absence case explicitly — the
// churn-naming form ('present only when X — a data-dependent section,
// its absence is NOT a structural difference'), never the bare enumeration
// form — and when two paired prompts carry different strengths of
// the same clause, the STRONGER form is the battery's standard and the
// weaker form is a gap (measured live at the 65th sweep: the mobile
// detail pair's explicit clause read LAYOUT-OK on the same
// data-dependence where the desktop pair's weak clause read a
// first-pass LAYOUT-DIFF — the ground-truth enumeration proved the
// read false, and the clamp closed the class on the prompt side the
// way the s81 settle form closed it on the capture side).
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

// S80 resilience addition: the vision endpoint intermittently 400s a burst's
// 4th call (the generic parse-error signature, isolated live this session:
// the same prompt+images read LAYOUT-OK in isolation seconds later) — the
// paired check retries with backoff before failing.
async function pairedCheck(zai, label, aPath, bPath, prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await pairedCheckOnce(zai, label, aPath, bPath, prompt);
    } catch (e) {
      if (attempt === 3) throw e;
      console.log(`(retry ${attempt + 1}/3 for ${label} after: ${String(e.message).slice(0, 60)})`);
      await new Promise((r) => setTimeout(r, 15000));
    }
  }
}

async function pairedCheckOnce(zai, label, aPath, bPath, prompt) {
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

  // Check 1 (the standing s45–s84 dashboard pair)
  const dash = await pairedCheck(zai, 'DASHBOARD PAIR',
    '/tmp/s85-results/ref-dashboard.png',
    '/tmp/s85-results/s85-ourside/our-dashboard.png',
    'Two dashboard screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: sidebar position/width, header position, main content card arrangement, stats cards, recent tickets list, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 2 (the s76-lineage login pair — the surface the login CSS styles at desktop)
  const login = await pairedCheck(zai, 'LOGIN PAIR',
    '/tmp/s85-results/ref-login.png',
    '/tmp/s85-results/s85-ourside/our-login.png',
    'Two login-page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: card position/width, heading and form arrangement, input fields, button placement, footer/links, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 3 (the S77-lineage mobile login pair — the s77 P1 closure: the same surface at 375)
  const mlogin = await pairedCheck(zai, 'MOBILE LOGIN PAIR (375)',
    '/tmp/s85-results/ref-login-mobile.png',
    '/tmp/s85-results/s85-ourside/our-login-mobile.png',
    'Two mobile login-page screenshots (375px viewport) from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: card position/width, heading and form arrangement, input fields, button placement, footer/links, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 4 (the s78-lineage mytickets route pair — the SUPERSET-AWARE form —
  // ours deliberately carries the documented sort/scope superset row below the
  // parity 3-col filter grid, so the prompt names the expected row and judges
  // the parity structure)
  const mt = await pairedCheck(zai, 'MY TICKETS PAIR',
    '/tmp/s85-results/ref-mytickets.png',
    '/tmp/s85-results/s85-ourside/our-mytickets.png',
    'Two ticket-list page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). The clone deliberately ADDS a documented superset row (a sort dropdown + My Tickets/All Tickets toggle buttons) below the filter grid — EXPECT that row in Image 2 and do not count it as a difference. Ignore the actual ticket data/content. Compare ONLY the parity layout structure: sidebar position/width, page title arrangement, the 3-column filter grid (search input, status dropdown, priority dropdown), ticket card structure (bordered card, icon tile, title/arrow arrangement, badges), spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the parity layout structure matches, or LAYOUT-DIFF if the parity layouts differ structurally. Then one short sentence describing any structural difference BEYOND the expected superset row.');

  // Check 5 (the s78-lineage submitticket route pair — the plain form)
  const st = await pairedCheck(zai, 'SUBMIT TICKET PAIR',
    '/tmp/s85-results/ref-submitticket.png',
    '/tmp/s85-results/s85-ourside/our-submitticket.png',
    'Two submit-ticket form page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: sidebar position/width, header position, page title arrangement, form card (field arrangement, labels, category/priority controls, submit button placement), spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 6 (the s79-lineage detail pair — the P1 fix: the SUPERSET-AWARE form —
  // ours deliberately carries the documented Update Status owner card in the
  // right column, and the ticket CONTENT is data on two separate systems
  // (their rows churn), so the prompt names the expected superset AND the
  // data-dependent sections and judges the parity frame)
  const dt = await pairedCheck(zai, 'DETAIL PAIR',
    '/tmp/s85-results/ref-ticketdetail.png',
    '/tmp/s85-results/s85-ourside/our-ticketdetail.png',
    'Two ticket-detail page screenshots from an IT support portal (1280px viewport). Image 1 = the original reference, Image 2 = the clone (ours). The clone deliberately ADDS a documented superset card in the right column titled "Update Status" (an owner status dropdown below the "Ticket Information" panel) — EXPECT that card in Image 2 and do not count it as a difference. The ticket CONTENT is data on two separate systems and differs by design: the title, description text, badges, ANY Attachments section (present only when the ticket carries an attachment — a data-dependent section, its absence is NOT a structural difference), and the number/content of comment rows are all data-dependent — ignore them. Compare ONLY the parity layout frame: the Back to Tickets control at top-left, the max-width page container, the 2-column grid (left: ticket card with gradient header + description, then a Comments card; right column: the Ticket Information panel), the card styling rhythm, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the parity layout frame matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference BEYOND the expected superset card and the data-dependent content.');

  // Check 7 (the S80-lineage mytickets-mobile pair — the P1 fix: the SUPERSET-AWARE
  // form at the mobile width — the same s78-lineage prompt, the 375 stacking)
  const mtr = await pairedCheck(zai, 'MOBILE MY TICKETS PAIR (375)',
    '/tmp/s85-results/ref-mytickets-mobile.png',
    '/tmp/s85-results/s85-ourside/our-mytickets-mobile.png',
    'Two mobile ticket-list screenshots (375px viewport) from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). The clone deliberately ADDS a documented superset row (a sort dropdown + My Tickets/All Tickets toggle buttons) below the filter grid — EXPECT that row in Image 2 and do not count it as a difference. Ignore the actual ticket data/content. Compare ONLY the parity layout structure: the stacked header/title/subtitle arrangement, the search input, the filter dropdowns, the ticket card structure, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the parity layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference BEYOND the expected superset row.');

  // Check 8 (the S80-lineage detail-mobile pair — the P1 fix: the SUPERSET-AWARE +
  // churn-naming form at the mobile width — the data-dependent sections named)
  const mdt = await pairedCheck(zai, 'MOBILE DETAIL PAIR (375)',
    '/tmp/s85-results/ref-ticketdetail-mobile.png',
    '/tmp/s85-results/s85-ourside/our-ticketdetail-mobile.png',
    'Two mobile ticket-detail screenshots (375px viewport) from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). The clone deliberately ADDS a documented superset card (Update Status) — EXPECT that card in Image 2 and do not count it as a difference. The ticket CONTENT is data on two separate systems and differs by design: the title, description text, badges, ANY Attachments section (present only when the ticket carries an attachment — a data-dependent section, its absence is NOT a structural difference), and the comment rows are all data-dependent — ignore them. Compare ONLY the parity layout frame: the single-column stacking order (ticket card with gradient header, description, comments card, information panel), the card styling rhythm, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the parity layout frame matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference BEYOND the expected superset card and the data-dependent content.');

  // Check 9 (the S80-lineage submitticket-mobile pair — the P1 fix: the plain form at
  // the mobile width)
  const mst = await pairedCheck(zai, 'MOBILE SUBMIT TICKET PAIR (375)',
    '/tmp/s85-results/ref-submitticket-mobile.png',
    '/tmp/s85-results/s85-ourside/our-submitticket-mobile.png',
    'Two mobile submit-ticket form screenshots (375px viewport) from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: the stacked field arrangement, labels-above-inputs rhythm, the category/priority controls, the submit button placement, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 10 (the S82 mobile-dashboard pair — the P1 fix: the DEFECT-AWARE form,
  // the paired grid's last unpaired cell: the dashboard at 375, the primary
  // post-login surface whose overflow figures the F4 battery has measured
  // since s4 ' their side carries the KNOWN standing defect (the 468-vs-375
  // horizontal overflow), ours the known fit ' the prompt names the expected
  // defect and judges the structure WITHIN the visible frame, so the pair
  // reads the structural parity honestly and flips the day the defect heals)
  const dmob = await pairedCheck(zai, 'MOBILE DASHBOARD PAIR (375)',
    '/tmp/s85-results/ref-dashboard-mobile.png',
    '/tmp/s85-results/s85-ourside/our-dashboard-mobile.png',
    'Two mobile (375px-wide) dashboard screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). The reference is KNOWN to carry a horizontal-overflow defect at this width (its page content measures 468px wide on a 375px viewport — the right edge clips and the page horizontally scrolls); ours is KNOWN to fit (375px = 375px, no horizontal scroll). Compare ONLY the layout structure WITHIN the visible 375px frame: the mobile header stack, the stat cards row, the recent tickets card arrangement, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the visible-frame layout structure matches (ignoring the KNOWN right-edge clipping of the reference), or LAYOUT-DIFF if the layouts differ structurally beyond that known defect. Then one short sentence: name any structural difference beyond the known overflow.');

  const firstWord = (s) => (s || '').trim().split(/\s+/)[0];
  const dOk = firstWord(dash) === 'LAYOUT-OK';
  const lOk = firstWord(login) === 'LAYOUT-OK';
  const mOk = firstWord(mlogin) === 'LAYOUT-OK';
  const mtOk = firstWord(mt) === 'LAYOUT-OK';
  const stOk = firstWord(st) === 'LAYOUT-OK';
  const dtOk = firstWord(dt) === 'LAYOUT-OK';
  const mtrOk = firstWord(mtr) === 'LAYOUT-OK';
  const mdtOk = firstWord(mdt) === 'LAYOUT-OK';
  const mstOk = firstWord(mst) === 'LAYOUT-OK';
  const dmobOk = firstWord(dmob) === 'LAYOUT-OK';
  console.log(`VERDICT: dashboard ${dOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; login ${lOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; mobile-login ${mOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; mytickets ${mtOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; submitticket ${stOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; detail ${dtOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; mytickets-mobile ${mtrOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; detail-mobile ${mdtOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; submitticket-mobile ${mstOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; dashboard-mobile ${dmobOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}`);
  if (!dOk || !lOk || !mOk || !mtOk || !stOk || !dtOk || !mtrOk || !mdtOk || !mstOk || !dmobOk) process.exit(1);
}

main().catch(e => { console.error('VLM check failed:', e.message); process.exit(1); });
