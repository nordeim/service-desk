// S49: VLM-diff the changed screenshot shots against the s48 baselines (02/04/05/09)
import fs from 'node:fs';
import ZAI from 'z-ai-web-dev-sdk';

const toB64 = (p) => fs.readFileSync(p).toString('base64');
const OUT = '/tmp/s49-results';
const pairs = [
  ['02-dashboard.png', 'the dashboard (stats + recent tickets)'],
  ['04-my-tickets.png', 'the my-tickets list'],
  ['05-ticket-detail.png', 'the ticket detail page'],
  ['09-ticket-detail-attachments.png', 'the ticket detail page with the two-attachment fixture (the S49 fixture title is the expected change)'],
];

async function main() {
  const zai = await ZAI.create();
  for (const [file, label] of pairs) {
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Two screenshots of ${label} from the same app, captured in different sessions. Image 1 = the NEW capture, Image 2 = the previous session's baseline. Ignore timestamp text, relative-time wording ("2 hours ago" vs "1 day ago"), and the fixture ticket title text. Compare the LAYOUT and CONTENT STRUCTURE. Answer with exactly one word on the first line: BENIGN if only time-relative text / fixture-title text differs, or REGRESSION if anything structural differs. Then one short sentence.`
            },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64('/home/z/my-project/service-desk/docs/screenshots/' + file)}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${toB64('/tmp/s49-baselines/' + file)}` } }
          ]
        }
      ]
    });
    console.log(`${file}: ${(completion.choices[0]?.message?.content || 'NO RESPONSE').split('\n').slice(0, 2).join(' | ')}`);
  }
}
main().catch(e => { console.error('VLM shotdiff failed:', e.message); process.exit(1); });
