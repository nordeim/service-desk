// Session-16 VLM verification: the two most relevant at-rest shots
// (02-dashboard: the animated stat cards + recent rows; 04-my-tickets: the
// staggered card grid) — checking the layout renders intact post-fix.
import ZAI from "z-ai-web-dev-sdk";
import fs from "node:fs";

const FILES = ["02-dashboard", "04-my-tickets"];

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
              text: "This is a screenshot of an IT support portal page. Check: (1) does the page layout render correctly (sidebar with navigation + quick stats, page heading, stat cards / ticket cards)? (2) are all elements fully visible (no half-faded or clipped cards — the entrance animations must have completed)? (3) any rendering artifacts? Answer briefly: LAYOUT-OK or LAYOUT-BROKEN with the specific problem.",
            },
          ],
        },
      ],
    });
    console.log(f, "→", (res.choices[0]?.message?.content || "").trim().slice(0, 300));
  }
}

main().catch((e) => {
  console.error("VLM sweep failed:", e.message);
  process.exit(1);
});
