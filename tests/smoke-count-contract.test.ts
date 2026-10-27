import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 92 — the smoke-count contract pins (P1: the §15 smoke-leg
// executed-count two-gate axis — "A smoke leg must count what it executed,
// not only what it passed. project-management's conditional-skip guard
// silently drops downstream checks when an upstream step fails — a failing
// leg shrank the gate to 12 passed / 15 failed / 3 skipped (27 executed),
// and the RESULT line could never reach 30. Failure must be loud and
// complete.", the family skill §15 line this repo had never carried a
// mechanism for)
//
// Contract under test: the smoke layer's executed-count honesty. The
// measured truth at the s92 audit: the green run prints 121 PASS lines
// (the corpus figure, verified live by counting the script's own stdout)
// yet carries only 111 static `step "PASS"` call sites — the runtime
// expansion rides the loop legs (the s33 catch-all's path loop, the
// s38/s39 rate-limiter warm-ups, the s40 routes table's while-read leg) —
// and NOTHING bound the runtime figure to the docs' "121 steps" claim
// family: the verification was manual PASS-line counting every session,
// and a dropped step (a refactor wrapping one in a dead conditional, a
// re-shaped loop leg) would shrink the gate with NO failure anywhere.
// The neo-crm sibling carries only the weaker precedent — a hardcoded
// `SMOKE: 14/14 PASS` literal with no counter and no self-assertion — so
// the axis is closed here from the family skill's own line, properly.
//
// The mechanism (the §15 line implemented literally):
//   (a) step() increments SMOKE_EXECUTED on EVERY call — a step is a
//       step whether it prints PASS or FAIL;
//   (b) fail() prints the partial RESULT before the exit ("executed N,
//       FAILED early — the gate is incomplete") — a failing leg is loud
//       AND complete;
//   (c) the script ends with the self-verifying RESULT line —
//       "SMOKE RESULT: N executed, N passed, 0 failed" — where N is the
//       LIVE counter, asserted equal to the SMOKE_EXPECTED literal: a
//       dropped step (or an added one riding without the lockstep bump)
//       exits non-zero with the honest figures;
//   (d) the SMOKE_EXPECTED literal moves in lockstep with the doc
//       family (the count-lockstep doctrine) and the corpus-count
//       contract's smoke family gains the script literal as a fifth
//       claim site (pin 6 here pins THAT bridge's existence).
//
// Three grammars of gate erosion, each with a pin:
//
//   D1 — the counting grammar: the counter exists (pin 1) and the
//     fail-loud form carries it (pin 2) — the loud-and-complete failure.
//
//   D2 — the RESULT grammar: the final RESULT line exists (pin 3) and
//     the self-assertion binds the executed figure to the expected
//     literal with a non-zero exit (pin 4) — the dropped-step guard.
//
//   D3 — the lockstep grammar: the expected literal names the corpus
//     figure 121 (pin 5) and the corpus-count-contract's smoke family
//     carries the script-literal site — the fifth claim site (pin 6,
//     the s50-bridge form: a whole-family drift now fails loudly).
//
// Ground truth: the script's own source + the corpus-count contract's
// family definition. The LIVE smoke run (boots the standalone server,
// prints its own RESULT line, self-asserts 121) is the smoke layer's
// own law — this unit battery holds the mechanism's SHAPE; the live
// run holds its OUTCOME.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const SMOKE_PATH = path.join(repoRoot, "scripts", "smoke-test.sh");
const CORPUS_PATH = path.join(repoRoot, "tests", "corpus-count-contract.test.ts");

function read(p: string): string {
  return readFileSync(p, "utf8");
}

describe("session 92: the smoke-count contract (the §15 smoke-leg executed-count two-gate axis)", () => {
  it("pin 1: the counter exists — the step() function increments SMOKE_EXECUTED on every call (a step is a step, PASS or FAIL)", () => {
    expect(existsSync(SMOKE_PATH), "scripts/smoke-test.sh must exist").toBe(true);
    const src = read(SMOKE_PATH);
    expect(
      /SMOKE_EXECUTED=0/.test(src),
      "the script must initialize SMOKE_EXECUTED=0 — the executed counter is the §15 line's own mechanism (the count of what ran, not only what passed)",
    ).toBe(true);
    expect(
      /step\(\)\s*\{[^}]*SMOKE_EXECUTED=\$\(\(SMOKE_EXECUTED\s*\+\s*1\)\)/.test(src.replace(/\n/g, " ")) || /SMOKE_EXECUTED=\$\(\(SMOKE_EXECUTED \+ 1\)\)/.test(src),
      "the step() function must carry the SMOKE_EXECUTED increment — a counter that only some steps ride is the conditional-skip guard's own shape (the project-management incident class)",
    ).toBe(true);
  });

  it("pin 2: the fail-loud form — fail() prints the partial RESULT (the executed count + the incomplete-gate naming) before the exit", () => {
    expect(existsSync(SMOKE_PATH), "the script must exist (pin 1)").toBe(true);
    const src = read(SMOKE_PATH);
    const failBody = /fail\(\)\s*\{[^}]*\}/.exec(src.replace(/\n/g, " "))?.[0] ?? "";
    expect(
      failBody.length > 0,
      "the fail() function must exist in its one-line form (the standing shape — the s40-era loud-failure form this pin extends, never weakens)",
    ).toBe(true);
    expect(
      failBody.includes("SMOKE_EXECUTED"),
      "fail() must print the SMOKE_EXECUTED figure — a failing leg is loud AND complete (the operator sees how far the gate reached; the 12-passed/27-executed blindness is the incident class)",
    ).toBe(true);
    expect(
      /gate is incomplete/i.test(failBody) || /incomplete/i.test(failBody),
      "fail() must name the gate incomplete — the partial-run state is itself information the §15 line demands be surfaced",
    ).toBe(true);
  });

  it("pin 3: the RESULT line exists — the script ends with the SMOKE RESULT print naming executed + passed", () => {
    expect(existsSync(SMOKE_PATH), "the script must exist (pin 1)").toBe(true);
    const src = read(SMOKE_PATH);
    expect(
      src.includes("SMOKE RESULT:"),
      "the script must print a final 'SMOKE RESULT:' line — the executed/passed figures the docs' '121 steps' claim family names; a smoke leg that never states its own count cannot count what it executed",
    ).toBe(true);
    expect(
      /SMOKE RESULT:[^"]*executed[^"]*passed/.test(src),
      "the RESULT line must name BOTH figures — executed and passed (a passed-only line is the half-truth the §15 line closes)",
    ).toBe(true);
  });

  it("pin 4: the self-assertion — the executed figure is compared to SMOKE_EXPECTED with a non-zero exit on drift (the dropped-step guard)", () => {
    expect(existsSync(SMOKE_PATH), "the script must exist (pin 1)").toBe(true);
    const src = read(SMOKE_PATH);
    expect(
      src.includes("SMOKE_EXPECTED"),
      "the script must name its expected executed count (SMOKE_EXPECTED) — the corpus figure the run self-asserts",
    ).toBe(true);
    expect(
      /\[ "\$SMOKE_EXECUTED" -ne "\$SMOKE_EXPECTED" \]/.test(src),
      "the self-assertion must use the -ne form — executed != expected is the drift condition (a dropped step, or an added step riding without the lockstep bump)",
    ).toBe(true);
    // the drift branch must exit non-zero (the loud form) — the lines after the -ne test
    const neIdx = src.indexOf('[ "$SMOKE_EXECUTED" -ne "$SMOKE_EXPECTED" ]');
    expect(neIdx, "the -ne form must exist (checked above)").toBeGreaterThanOrEqual(0);
    const tail = src.slice(neIdx, neIdx + 400);
    expect(
      /exit 1/.test(tail),
      "the drift branch must exit 1 — a shrunk gate that exits 0 is the silent conditional-skip regression class exactly",
    ).toBe(true);
  });

  it("pin 5: the expected literal names the corpus figure — SMOKE_EXPECTED=121 (the count-lockstep doctrine at the smoke layer)", () => {
    expect(existsSync(SMOKE_PATH), "the script must exist (pin 1)").toBe(true);
    const src = read(SMOKE_PATH);
    const m = /SMOKE_EXPECTED=(\d+)/.exec(src);
    expect(
      m,
      "SMOKE_EXPECTED must be a plain integer literal — a computed form would drift with the very bug it guards",
    ).not.toBeNull();
    expect(
      Number(m?.[1]),
      "the expected figure is 121 — the canonical smoke corpus number (the same figure the README/AGENTS/PAD/DEPLOYMENT/SKILL claim family names; the lockstep bump is the same-commit rule)",
    ).toBe(121);
  });

  it("pin 6: the bridge — the corpus-count-contract's smoke family carries the script-literal site (the fifth claim site, the s50-bridge form)", () => {
    expect(existsSync(CORPUS_PATH), "tests/corpus-count-contract.test.ts must exist (the s48 family)").toBe(true);
    const corpus = read(CORPUS_PATH);
    // the family's collectFamily call for the smoke count must include the
    // script-source site — the SMOKE_EXPECTED literal as a live claim site
    const smokePinBlock = /the smoke-steps count[^"]*"/.test(corpus)
      ? corpus.slice(corpus.indexOf("the smoke-steps count"), corpus.indexOf("the smoke-steps count") + 2400)
      : "";
    expect(
      smokePinBlock.length > 0,
      "the corpus-count-contract's smoke-steps pin must exist (the s48 family — this pin extends it, never replaces it)",
    ).toBe(true);
    expect(
      smokePinBlock.includes("SMOKE_EXPECTED") || smokePinBlock.includes("smoke-test.sh"),
      "the smoke family must carry the script-literal site — the script's own SMOKE_EXPECTED=121 joins the doc sites as a live claim (the whole-family-drift blind spot closed at the smoke layer, the s50 quickstart-bridge form)",
    ).toBe(true);
    expect(
      smokePinBlock.includes("5"),
      "the family's site-count floor must name the extended census (4 doc sites + the script literal = 5 — a site-count floor that stays at 4 would let the bridge be silently dropped)",
    ).toBe(true);
  });
});
