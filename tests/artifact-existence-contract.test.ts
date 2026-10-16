import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
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

// The shared bare-hex classifier (the s59 co-location fix): a MATCH-scoped
// exclusion — `continue` in the match loop, NEVER `return` in the line
// callback. The s56–s58 form used `return`, a LINE-level escape that
// silently dropped every token after the first excluded one on the same
// line (the s59 live event: an operator-transcript line carrying a pure-digit
// commit id BEFORE a fabricated token shielded the fabricated token from
// the sweep — 33 corpus tokens mis-classified, measured by
// scripts/s59-audit-colocation.py). Both pin 3 (reachability) and pin 4
// (the no-silent-skip parity) source their classification from this helper,
// so a regression here bites pin 4's raw-vs-classified count parity.
function classifyBareHexCorpus(): {
  claims: { file: string; line: number; h: string }[];
  excluded: { file: string; line: number; h: string }[];
  citedAll: Set<string>;
} {
  const claims: { file: string; line: number; h: string }[] = [];
  const excluded: { file: string; line: number; h: string }[] = [];
  const citedAll = new Set<string>();
  for (const file of DOC_FILES) {
    linesOf(file).forEach((line, i) => {
      for (const m of line.matchAll(BARE_HEX)) {
        const h = m[1];
        citedAll.add(h);
        if (isKnownNonCommit(h)) {
          excluded.push({ file, line: i + 1, h });
          continue; // the match-scoped skip — the s59 fix (never `return`)
        }
        claims.push({ file, line: i + 1, h });
      }
    });
  }
  return { claims, excluded, citedAll };
}

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
    // The s59 co-location fix: the classification sourced from the shared
    // helper (the match-scoped `continue` semantics) — a token co-located on
    // a line with an earlier excluded token is CLAIMED, not silently dropped
    // (the s56–s58 `return` form shielded it — the live line-13 event).
    const { claims, citedAll } = classifyBareHexCorpus();
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

  it("pin 4 (s59): the no-silent-skip invariant — every backticked bare-hex token in the corpus is either an excluded known-non-commit or a claimed citation (a token silently dropped by a line-level escape is a third state that fails, naming the token)", () => {
    // The s59 co-location closure: the s56-s58 pin 3 implemented its
    // MATCH-scoped exclusion (isKnownNonCommit) as a LINE-scoped escape
    // (`return` inside the forEach line callback), silently dropping every
    // token after the first excluded one on the same line. The live event:
    // the operator's transcript carried a pure-digit commit id BEFORE a
    // fabricated token on one line — the pin caught the token on its own
    // line but MISSED the co-located one (33 corpus tokens mis-classified,
    // measured; the one real dangling citation escaped the sweep).
    //
    // This pin re-derives the RAW token stream with its own matchAll (a
    // shape with no early exit possible) and asserts the parity against the
    // shared classifier: raw === claims + excluded. A `return` regression in
    // classifyBareHexCorpus() drops tokens from the classified sets while
    // the raw stream still sees them — the parity fails HERE naming the
    // dropped token's file + line + hash.
    const { claims, excluded } = classifyBareHexCorpus();

    // The raw stream: every backticked bare-hex token on every line, no
    // classification, no early exit.
    let rawCount = 0;
    const rawByFileLine = new Map<string, number>();
    for (const file of DOC_FILES) {
      linesOf(file).forEach((line, i) => {
        for (const _m of line.matchAll(BARE_HEX)) {
          rawCount += 1;
          const k = `${file}:${i + 1}`;
          rawByFileLine.set(k, (rawByFileLine.get(k) ?? 0) + 1);
        }
      });
    }

    // The parity: every raw token is accounted for (claimed or excluded),
    // and the classified counts match the raw count exactly.
    const classifiedByFileLine = new Map<string, number>();
    for (const c of [...claims, ...excluded]) {
      const k = `${c.file}:${c.line}`;
      classifiedByFileLine.set(k, (classifiedByFileLine.get(k) ?? 0) + 1);
    }
    const dropped: string[] = [];
    for (const [k, raw] of rawByFileLine) {
      const classified = classifiedByFileLine.get(k) ?? 0;
      if (classified < raw) {
        dropped.push(`${k}: ${raw - classified} token(s) silently dropped (raw ${raw}, classified ${classified})`);
      }
    }
    if (dropped.length > 0) {
      throw new Error(
        `the no-silent-skip parity failed: ${dropped.join("; ")}. ` +
          `A backticked bare-hex token must be either an excluded known-non-commit or a claimed citation — a third state (silently dropped by a line-level escape) means the classifier's match-scoped exclusion regressed to a line-level return (the s59 co-location bug — fix the classifier to the per-match continue).`,
      );
    }
    expect(claims.length + excluded.length).toBe(rawCount);

    // The class purity: isKnownNonCommit is a pure function of the token, so
    // no hash may appear in BOTH sets (a token classified both ways is a
    // classifier inconsistency, not a corpus property).
    const claimedHashes = new Set(claims.map((c) => c.h));
    for (const e of excluded) {
      if (claimedHashes.has(e.h)) {
        throw new Error(
          `the class purity failed: \`${e.h}\` appears in both the claims and the exclusions — the classifier is inconsistent (isKnownNonCommit is a pure function of the token).`,
        );
      }
    }

    // The shape floor: the corpus carries 29 lines with 2+ backticked hex
    // tokens where at least one is excluded (the co-location shape — the
    // live event's class, measured by scripts/s59-audit-colocation.py). A
    // grammar or corpus change that empties the shape fails loudly instead
    // of vacuous-passing (the s56 mapDeps lesson, the s58 pin-3 precedent).
    let shapeLines = 0;
    for (const file of DOC_FILES) {
      linesOf(file).forEach((line) => {
        const tokens = [...line.matchAll(BARE_HEX)].map((m) => m[1]);
        if (tokens.length >= 2 && tokens.some((h) => isKnownNonCommit(h))) {
          shapeLines += 1;
        }
      });
    }
    expect(
      shapeLines,
      `the co-location shape floor: expected >= 20 lines with 2+ hex tokens and >= 1 excluded (the s59 live-event class), found ${shapeLines} — the grammar or the corpus changed`,
    ).toBeGreaterThanOrEqual(20);
  });

  it("pin 5 (s62): the screenshots family integrity — every docs/screenshots/*.png is structurally valid (magic + IHDR + IEND + size floor), the ten-name lineage set is complete, and the desktop/mobile split matches the capture viewports", { timeout: 60000 }, () => {
    // The s62 closure: the parity-EVIDENCE surface. Every session plan's
    // verification section cites "the 10-shot set" as the visual-parity
    // evidence, yet the family carried NO standing check at any level:
    //   1. the s17/s18 asset-truth doctrine (an asset's declared format
    //      must be true — the favicon + og:image magic-byte pins) was never
    //      extended here: a corrupted/truncated/text-substituted PNG passed
    //      every standing gate;
    //   2. the family COUNTS drifted live (the s48 stale-'54'/'57' class on
    //      a new surface): the PAD §3.2 claimed "7 dev-server captures"
    //      (stale by three), the AGENTS reference list claimed "desktop x 7"
    //      (stale by one) — the fs carries 10 = 8 desktop + 2 mobile;
    //   3. no named-set enumeration — a renamed/deleted member failed only
    //      at the next session's shotdiff, if then.
    //
    // Ground truth: the bytes themselves, via the standing helper
    // scripts/check-screenshots.py (the --check/--json CLI contract, the
    // s60/s61 helper convention). The spawnSync + JSON-either-way form is
    // the s60 execFileSync-throw lesson (the helper exits 1 when offenders
    // exist — the pin must read the JSON either way and NAME the offenders
    // itself); the 60s timeout is the lesson-115 doctrine (every pin that
    // spawns subprocesses gets a timeout matching its own worst-case
    // envelope, never the runner's 5s default).
    const r = spawnSync(
      "python3",
      ["scripts/check-screenshots.py", "--check", "--json"],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, cwd: process.cwd() },
    );
    if (r.error) {
      throw new Error(`the screenshots checker could not run: ${r.error.message}`);
    }
    if (r.status !== 0 && r.status !== 1) {
      throw new Error(
        `the screenshots checker exited with an unexpected status ${r.status} (0 = clean, 1 = offenders found — anything else is a checker defect): ${r.stderr}`,
      );
    }
    let report: {
      ok: boolean;
      scanned: number;
      counts: { desktop: number; mobile: number; unknown: number };
      named_set_missing: string[];
      unexpected: string[];
      offenders: { name: string; errors: string[] }[];
    };
    try {
      report = JSON.parse(r.stdout);
    } catch {
      throw new Error(
        `the screenshots checker's --json output did not parse (the machine-readable contract): ${r.stdout.slice(0, 300)}`,
      );
    }

    // The vacuous-pass guard: an emptied docs/screenshots/ folder scans zero
    // files and reports zero per-file offenders — the floor fails loudly
    // instead (the s56 mapDeps lesson, the s61 pin-3 floors precedent).
    expect(
      report.scanned,
      `the screenshots family floor: expected >= 10 members, found ${report.scanned} — the capture lineage (the s10 base five + the s13 attachment pair + the s14 inline view + the mobile pair) is the parity-evidence surface`,
    ).toBeGreaterThanOrEqual(10);

    // The named-set completeness: the ten canonical names, each cited by the
    // capture script and the corpus' "10-shot" claims.
    if (report.named_set_missing.length > 0 || report.unexpected.length > 0) {
      throw new Error(
        `the screenshots named-set enumeration failed — missing: [${report.named_set_missing.join(", ")}]; unexpected: [${report.unexpected.join(", ")}]. ` +
          `The ten-name lineage (01-login … 10-attachment-inline-view) is the corpus' cited evidence set; a rename or deletion is a visible family change, never a silent drift.`,
      );
    }

    // The split agreement: 8 desktop (1280x800) + 2 mobile (375x812) — the
    // capture-script viewports. A dimension change is a lineage change.
    expect(report.counts.desktop).toBe(8);
    expect(report.counts.mobile).toBe(2);
    expect(report.counts.unknown).toBe(0);

    // The asset truth itself: name every offender (file + error).
    if (!report.ok && report.offenders.length > 0) {
      const lines = report.offenders.flatMap((o) => o.errors.map((e) => `${o.name}: ${e}`));
      throw new Error(
        `the screenshots asset-truth check failed: ${lines.join("; ")}. ` +
          `Every docs/screenshots/*.png must be structurally valid (the PNG magic, a parseable IHDR, the IEND trailer, the 4 KiB floor) at the recorded lineage dimensions — the s17/s18 doctrine extended to the parity-evidence surface.`,
      );
    }
    expect(report.ok).toBe(true);
  });
});
