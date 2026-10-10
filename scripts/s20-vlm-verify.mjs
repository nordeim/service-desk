// Session-20 VLM verification: the two most relevant shots for this
// session's fixes — 02-dashboard (the standing full-page layout post-build)
// and 05-ticket-detail (the detail grid + comment box + info panel) —
// checking the layout renders intact post-fix. The s20 pin is
// auth-flow-internal (the from_url deep-link contract): the captured
// surfaces are unchanged; the login flow lands on /dashboard exactly as the
// shots require. The evidence for the deep-link behavior lives in the E2E
// pins + scripts/s20-live-verify.mjs.
import ZAI from "z-ai-web-dev-sdk";
import fs from "node:fs";

const FILES = ["02-dashboard", "05-ticket-detail"];

async function main() {
  const zai = await ZAI.create();
  for (const f of FILES) {
    const b64 = fs.readFileSync(`docs/screenshots/${f}.png`).toString("base64");
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
              text: "This is a screenshot of an IT support portal page. Check: (1) does the page layout render correctly (sidebar with navigation + quick stats, page heading, stat cards / ticket detail grid with comments + info panel)? (2) are all elements fully visible (no half-faded or clipped cards — the entrance animations must have completed)? (3) any rendering artifacts? Answer briefly: LAYOUT-OK or LAYOUT-BROKEN with the specific problem.",
            },
          ],
        },
      ],
    });
    const answer = res.choices[0]?.message?.content ?? "no answer";
    console.log(`[${f}] ${String(answer).trim().slice(0, 200)}`);
  }
}

main().catch((e) => {
  console.error("VLM verification failed:", e.message);
  process.exit(1);
});
