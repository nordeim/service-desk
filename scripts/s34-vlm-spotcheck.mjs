// Session-34 VLM spot-check: the two standing convention shots
// (02-dashboard + 05-ticket-detail) — the layout renders intact on the
// s34 build. The s34 change is API-layer (the no-store Cache-Control
// contract — no captured surface changed); this check guards against
// collateral damage.
import fs from "node:fs";
import { execSync } from "node:child_process";

const FILES = ["02-dashboard", "05-ticket-detail"];

for (const f of FILES) {
  const out = `/tmp/s34-vlm-${f}.json`;
  execSync(
    `z-ai vision -p "This is a screenshot of an IT support portal page. Check: (1) does the page layout render correctly (sidebar with navigation + quick stats, page heading, stat cards / ticket detail grid with comments + info panel)? (2) are all elements fully visible (no half-faded or clipped cards — the entrance animations must have completed)? (3) any rendering artifacts? Answer briefly: LAYOUT-OK or LAYOUT-BROKEN with the specific problem." -i docs/screenshots/${f}.png -o ${out}`,
    { stdio: "ignore" },
  );
  const d = JSON.parse(fs.readFileSync(out, "utf8"));
  console.log(`[${f}] ${String(d.choices[0]?.message?.content ?? "").trim().slice(0, 200)}`);
}
