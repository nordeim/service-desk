// Session-7 VLM composite sweep: reference (left) vs clone (right).
import ZAI from "z-ai-web-dev-sdk";
import fs from "node:fs";

const FILES = [
  "01-login", "02-dashboard", "03-submit-ticket", "04-my-tickets",
  "05-ticket-detail", "06-mobile-dashboard", "07-mobile-menu-open",
];

async function main() {
  const zai = await ZAI.create();
  for (const f of FILES) {
    const b64 = fs.readFileSync(`docs/compare-s7/${f}.png`).toString("base64");
    const res = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      thinking: { type: "disabled" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${b64}` },
            },
            {
              type: "text",
              text: `This is a side-by-side comparison of two web app screenshots. LEFT = the ORIGINAL reference site, RIGHT = a CLONE. Compare them for VISUAL differences: layout, spacing, colors, fonts, component styles, alignment. Ignore differences in DATA (ticket titles, counts, user names, dates) and the reference's known quirks. List every visual difference you can find as a numbered list with a confidence (HIGH/MED/LOW). If they look visually identical, say IDENTICAL. Be specific about which element differs.`,
            },
          ],
        },
      ],
    });
    const text = res.choices[0]?.message?.content ?? "NO RESPONSE";
    console.log(`\n===== ${f} =====\n${text}\n`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
