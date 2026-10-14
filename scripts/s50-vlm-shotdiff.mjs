// S50: VLM-diff the changed shots against the s49 baselines (git HEAD)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import ZAI from "z-ai-web-dev-sdk";

const toB64 = (p) => fs.readFileSync(p).toString("base64");
const shots = process.argv.slice(2);
if (shots.length === 0) {
  console.error("usage: node s50-vlm-shotdiff.mjs <shot-basename...>");
  process.exit(1);
}

// extract the s49 baselines from git HEAD to /tmp/s50-baselines/
fs.mkdirSync("/tmp/s50-baselines", { recursive: true });
for (const s of shots) {
  execFileSync("git", ["show", `HEAD:docs/screenshots/${s}.png`], {
    maxBuffer: 20 * 1024 * 1024,
  });
  fs.writeFileSync(`/tmp/s50-baselines/${s}.png`,
    execFileSync("git", ["show", `HEAD:docs/screenshots/${s}.png`], { maxBuffer: 20 * 1024 * 1024 }));
}

async function main() {
  const zai = await ZAI.create();
  let allBenign = true;
  for (const s of shots) {
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Two screenshots of the SAME page of an IT support portal, taken one day apart. Image 1 = the previous session's baseline; Image 2 = the new capture. The expected benign differences are: timestamps/relative-time text ("x days ago" moving with the day boundary) and the fixture ticket title text (a session-numbered title like "S50 screenshot fixture"). Answer with exactly one word on the first line: BENIGN if only those expected text differences exist, or DIFF plus the specific unexpected structural/visual difference.`
            },
            { type: "image_url", image_url: { url: `data:image/png;base64,${toB64(`/tmp/s50-baselines/${s}.png`)}` } },
            { type: "image_url", image_url: { url: `data:image/png;base64,${toB64(`docs/screenshots/${s}.png`)}` } }
          ]
        }
      ]
    });
    const verdict = completion.choices[0]?.message?.content || "NO RESPONSE";
    const first = verdict.split("\n")[0];
    const benign = /^BENIGN\b/.test(first);
    if (!benign) allBenign = false;
    console.log(`=== ${s}: ${first}`);
    console.log(verdict.split("\n").slice(1).join("\n").trim());
  }
  console.log(allBenign ? "ALL CHANGED SHOTS BENIGN" : "DIFF DETECTED — INVESTIGATE");
  process.exit(allBenign ? 0 : 1);
}
main().catch(e => { console.error("VLM shotdiff failed:", e.message); process.exit(1); });
