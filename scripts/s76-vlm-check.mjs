// S76: the paired VLM parity checks (the s45–s75 dashboard lineage + the S76
// login-pair extension — the P1 closure: the reference-side login page, the
// surface the rotating login CSS directly styles, had NO reference-side
// capture in the s45–s75 battery; the 37th-wave CSS rotation (the second in
// three waves after the 35th at s73) exposed the coverage gap, and the pair
// closed it — the battery's coverage derives from what the rotation touches)
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

  // Check 1 (the standing s45–s75 dashboard pair)
  const dash = await pairedCheck(zai, 'DASHBOARD PAIR',
    '/tmp/s76-results/ref-dashboard.png',
    '/tmp/s76-results/s76-ourside/our-dashboard.png',
    'Two dashboard screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: sidebar position/width, header position, main content card arrangement, stats cards, recent tickets list, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  // Check 2 (the S76 login pair — the P1 fix: the surface the login CSS styles)
  const login = await pairedCheck(zai, 'LOGIN PAIR',
    '/tmp/s76-results/ref-login.png',
    '/tmp/s76-results/s76-ourside/our-login.png',
    'Two login-page screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: card position/width, heading and form arrangement, input fields, button placement, footer/links, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.');

  const firstWord = (s) => (s || '').trim().split(/\s+/)[0];
  const dOk = firstWord(dash) === 'LAYOUT-OK';
  const lOk = firstWord(login) === 'LAYOUT-OK';
  console.log(`VERDICT: dashboard ${dOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}; login ${lOk ? 'LAYOUT-OK' : 'LAYOUT-DIFF'}`);
  if (!dOk || !lOk) process.exit(1);
}

main().catch(e => { console.error('VLM check failed:', e.message); process.exit(1); });
