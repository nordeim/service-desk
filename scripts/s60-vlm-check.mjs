// S60: the paired desktop VLM parity check (the s45–s59 lineage — both dashboards in ONE prompt)
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');

async function main() {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Two dashboard screenshots from an IT support portal. Image 1 = the original reference, Image 2 = the clone (ours). Compare ONLY the layout structure: sidebar position/width, header position, main content card arrangement, stats cards, recent tickets list, spacing rhythm, typography scale. Answer with exactly one word on the first line: LAYOUT-OK if the layout structure matches, or LAYOUT-DIFF if the layouts differ structurally. Then one short sentence describing any structural difference.'
          },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64('/tmp/s60-results/ref-dashboard.png')}` } },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64('/tmp/s60-results/s60-ourside/our-dashboard.png')}` } }
        ]
      }
    ]
  });
  console.log(completion.choices[0]?.message?.content || 'NO RESPONSE');
}

main().catch(e => { console.error('VLM check failed:', e.message); process.exit(1); });
