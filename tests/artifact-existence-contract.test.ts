import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Session 56 — the artifact-existence pins (P1: the EXISTENCE-CLAIM class —
// the s95 shortlist's successor audit, CONFIRMED ACTIVE DRIFT)
//
// Contract under test: the docs name durable artifacts as evidence — scripts
// that ran, commits that landed — and the s56 audit found three grammars of
// existence claims with NO pin family holding them to their ground truth
// (the s48 corpus pins watch COUNTS, the s52 docdate pins watch DATES, the
// s53 keyfiles pins watch SIZES, the s54 coverage pins map SOURCE-to-TESTS,
// the s55 plan-status pins watch CHECKBOXES — nothing asks whether a NAMED
// artifact is real):
//
//   G1 — the persistence claims (the word "persisted" immediately followed
//     by a backticked scripts/ path): 6 corpus-wide, 3 DANGLING at s56 —
//     the s40 stub-applier claim (session_69.md:21), the s41
//     single-source-applier claim (session_71.md:20), the s41 standing-rerun
//     claim (session_71.md:24). TRUE-THEN-FALSE-NOW: the s40/s41 sessions
//     ran them from the workspace, but the script-COMMIT convention begins
//     at s42 (the s42/s43/s44 standing-rerun scripts each carry exactly one
//     commit; the s40/s41 trio carries ZERO ever) and the workspace resets
//     destroyed the only copies. 15+ sessions of drift.
//
//   G2 — the push-range citations (backticked `A..B` hex pairs): 36
//     corpus-wide, 1 DANGLING at s56 — the how-to doc's 2026-09-16
//     field-test note citing `0ab29dc..f932360`, the PRE-IMPORT history
//     (the repo's git begins at the GitHub web-upload commits, so every
//     commit pushed before the import is unreachable in the current
//     repository). The fix ANNOTATES the line (the "pre-import" token), and
//     the pin accepts exactly that escape: an unreachable range MUST name
//     why on its own line.
//
//   G3 — the bare commit citations (backticked 7–40 hex): 616 corpus-wide,
//     0 dangling at s56 after the exact known-non-commit exclusion set — a
//     born-green guard grammar (the s55 pin-3 precedent: the enumeration
//     honesty held the corpus while the two claim pins bit the drift).
//
// Ground truth: the fs (scripts/) + git object reachability
// (`git cat-file --batch-check`, one batched call per pin).
//
// The class boundary (the weaker shapes, OUTSIDE the pinned grammars):
// pre-convention helper mentions without the persistence word
// (scripts/diff-pages.py, scripts/s6-dump.sh), the s11 manifest.ts
// mid-cycle-correction narrative, the s47-fake mutation narrative
// (intentionally nonexistent), and the operator's verbatim prompt archive
// (docs/prompt-to-review-2.md) — narrative references are history, not
// claims; the three pinned grammars are the EXISTENCE/EVIDENCE claim forms.
// ---------------------------------------------------------------------------

// The doc corpus: glob-driven (never a hardcoded list) — every docs/*.md
// plus the root docs + the repo worklog. skills/ is excluded (the repo
// convention: the skills/ folder is outside code checking and testing).
const DOC_FILES: string[] = [
  ...readdirSync("docs")
    .filter((f) => f.endsWith(".md"))
    .map((f) => `docs/${f}`),
  "worklog.md",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "service-desk_SKILL.md",
  "Project_Architecture_Document.md",
].filter((f) => existsSync(f));

interface Claim {
  file: string;
  line: number;
  text: string;
}

function linesOf(file: string): string[] {
  return readFileSync(file, "utf8").split("\n");
}

// One batched reachability call: `git cat-file --batch-check` answers every
// hash on stdin with exactly one output line, in input order — a FOUND
// short hash comes back EXPANDED to its full 40-char form ("<full> commit
// <size>", measured live: input `0ec1832` → output
// `0ec18323b6807ee5e79b4abba7d61a2f9536dc1a commit 873`), a MISSING one
// echoes the input as given ("<hash> missing"). The map is therefore keyed
// by the REQUESTED hash via order-zipping (the first run of this pin keyed
// by the OUTPUT's first token — every short-hash lookup missed and the
// honest RED bit wrong; the in-flight fix observed before the runner).
function gitReachable(hashes: string[]): Map<string, boolean> {
  const out = new Map<string, boolean>();
  if (hashes.length === 0) return out;
  const uniq = [...new Set(hashes)];
  const stdout = execFileSync("git", ["cat-file", "--batch-check"], {
    input: `${uniq.join("\n")}\n`,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const outLines = stdout.split("\n").filter((l) => l.trim().length > 0);
  uniq.forEach((hash, i) => {
    const line = outLines[i] ?? "";
    const kind = line.split(" ")[1] ?? "";
    out.set(hash, /^(commit|blob|tree|tag)$/.test(kind));
  });
  return out;
}

// G1: the persistence grammar — the word "persisted" immediately followed by
// a backticked scripts/ path. Case-sensitive by design: "Persisted" at a
// sentence start is not the observed claim form.
const PERSISTED_SCRIPT = /persisted `scripts\/([a-z0-9._-]+)`/g;

// G2: the push-range grammar — a backticked A..B pair, both sides 7–40 hex.
const HASH_RANGE = /`([0-9a-f]{7,40})\.\.([0-9a-f]{7,40})`/g;

// G3: the bare-citation grammar — a backticked 7–40-hex string.
const BARE_HEX = /`([0-9a-f]{7,40})`/g;

// The pre-import annotation: an unreachable range citation MUST carry the
// "pre-import" token on its own line (case-insensitive — the observed forms
// span "(pre-import history — …)" and "the PRE-IMPORT history:"). The escape
// is narrow and self-documenting: it forces the writer to NAME why the
// citation's endpoints are unreachable in the current repository.
const PRE_IMPORT = /pre-import/i;

// The exact known-non-commit exclusion set (G3), each member documented with
// its citation class. This predicate is part of the contract: a literal
// added to hide a dangling citation is a visible pin edit, and the
// needed-ness guard below fails a literal whose citation class disappears.
const isKnownNonCommit = (h: string) =>
  h === "ed25519" || // the SSH algorithm name (hex-shaped, never a commit)
  h === "89504e470d0a1a0a" || // the PNG magic signature (the s18 asset-truth pins)
  h === "ffd8ffe000104a46" || // the JPEG magic signature (the s18 asset-truth pins)
  /^\d+$/.test(h); // pure digits — backticked numbers are ids/counts, never hashes

describe("session 56: the artifact-existence pins (the durable-artifact existence-claim contract)", () => {
  it("pin 1: every persistence claim names a script on the fs (persisted + a backticked scripts/ path)", () => {
    const claims: Claim[] = [];
    const offenders: string[] = [];
    for (const file of DOC_FILES) {
      linesOf(file).forEach((line, i) => {
        for (const m of line.matchAll(PERSISTED_SCRIPT)) {
          claims.push({ file, line: i + 1, text: m[0] });
          if (!existsSync(`scripts/${m[1]}`)) {
            offenders.push(`${file} line ${i + 1}: "${m[0]}" — the named script is NOT on the fs`);
          }
        }
      });
    }
    // The grammar floor: the corpus carried 6 claims at s56 (3 valid — the
    // s42/s43/s44 standing-rerun claims). A grammar regression (0 matches)
    // fails loudly instead of false-greening.
    expect(
      claims.length,
      `the persistence-grammar floor: expected >= 3 claims, found ${claims.length} — the grammar or the corpus changed`,
    ).toBeGreaterThanOrEqual(3);
    if (offenders.length > 0) {
      throw new Error(
        `persistence claims naming scripts that are not on the fs (the durability lie — the script was workspace-only or lost): ${offenders.join("; ")}. ` +
          `Either commit the script (the s42+ convention) or drop the claim word from the line (the honest pre-convention annotation form).`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 2: every backticked push-range citation names two git-reachable commits, unless the line carries the pre-import annotation", () => {
    const offenders: string[] = [];
    const toCheck: string[] = [];
    const pending: { file: string; line: number; a: string; b: string }[] = [];
    let total = 0;
    for (const file of DOC_FILES) {
      linesOf(file).forEach((line, i) => {
        for (const m of line.matchAll(HASH_RANGE)) {
          total += 1;
          if (PRE_IMPORT.test(line)) return; // the annotated escape
          pending.push({ file, line: i + 1, a: m[1], b: m[2] });
          toCheck.push(m[1], m[2]);
        }
      });
    }
    // The grammar floor: the corpus carried 41 range citations at s56.
    expect(
      total,
      `the range-grammar floor: expected >= 30 citations, found ${total} — the grammar or the corpus changed`,
    ).toBeGreaterThanOrEqual(30);
    const reachable = gitReachable(toCheck);
    for (const c of pending) {
      const bad = !reachable.get(c.a) ? c.a : !reachable.get(c.b) ? c.b : null;
      if (bad) {
        offenders.push(`${c.file} line ${c.line}: \`${c.a}..${c.b}\` — ${bad} is unreachable in this repository`);
      }
    }
    if (offenders.length > 0) {
      throw new Error(
        `push-range citations naming unreachable commits: ${offenders.join("; ")}. ` +
          `Either the citation is a typo (fix the hash) or it names the pre-import history (annotate the line with the "pre-import" token — the repo's git begins at the GitHub web-upload commits).`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 3: every backticked bare-hex commit citation resolves in git (the exact known-non-commit exclusions, each still cited)", () => {
    const offenders: string[] = [];
    const citedAll = new Set<string>();
    const claims: { file: string; line: number; h: string }[] = [];
    for (const file of DOC_FILES) {
      linesOf(file).forEach((line, i) => {
        for (const m of line.matchAll(BARE_HEX)) {
          const h = m[1];
          citedAll.add(h);
          if (isKnownNonCommit(h)) return;
          claims.push({ file, line: i + 1, h });
        }
      });
    }
    // The grammar floor: the corpus carried ~630 non-excluded bare-hex
    // citations at s56. A grammar regression fails loudly.
    expect(
      claims.length,
      `the bare-citation grammar floor: expected >= 550 citations, found ${claims.length} — the grammar or the corpus changed`,
    ).toBeGreaterThanOrEqual(550);
    // The exclusion honesty (needed-ness): every named exclusion literal
    // must remain genuinely cited in the corpus — a literal whose citation
    // class disappears must be removed from the predicate, and a literal
    // added to hide a dangling citation is a visible pin edit that this
    // direction cannot legitimize (it must still be cited AND the predicate
    // diff is review-visible).
    for (const lit of ["ed25519", "89504e470d0a1a0a", "ffd8ffe000104a46"]) {
      expect(
        citedAll.has(lit),
        `the exclusion literal ${lit} is no longer cited in the corpus — remove it from the isKnownNonCommit predicate (the exclusion cannot outlive its reason)`,
      ).toBe(true);
    }
    const reachable = gitReachable(claims.map((c) => c.h));
    for (const c of claims) {
      if (!reachable.get(c.h)) {
        offenders.push(`${c.file} line ${c.line}: \`${c.h}\` — unreachable in this repository`);
      }
    }
    if (offenders.length > 0) {
      throw new Error(
        `bare commit citations that do not resolve in git: ${offenders.join("; ")}. ` +
          `A cited hash must name a real commit — fix the typo, or (if it is a known non-commit token like a file-signature constant) extend the documented isKnownNonCommit predicate.`,
      );
    }
    expect(offenders.length).toBe(0);
  });
});
