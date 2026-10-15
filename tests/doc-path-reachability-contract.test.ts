import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Session 58 — the doc-path-reachability pins (P1: the DOC-PATH REACHABILITY
// class — the s56 existence-claim closure, extended from the scripts/ grammar
// to the whole-path class)
//
// Contract under test: a backticked path-shaped reference in a core doc is
// an EXISTENCE CLAIM about the fs. The s56 pins closed the persistence
// grammar (`persisted \`scripts/…\``) — one shape of the broader class; the
// s58 audit measured the whole-path form across the five core docs and
// found it CLEAN (born-green — the s56 pin-3 / s57 precedents):
//
//   529 total path-shaped matches, 13 excluded by the four-entry measured
//   set, 516 checked, ALL resolving (per-doc: AGENTS 252, PAD 169, SKILL 51,
//   CLAUDE 29, README 15).
//
// The four-entry exclusion set — each entry a measured narrative/transient
// form, NOT an existence claim (the same classification discipline the s56
// grammars apply), each genuinely cited (the needed-ness precondition):
//
//   db/custom.db    — the RUNTIME TARGET: the file is gitignored (the db/
//                      folder ships .gitkeep only); every reference names
//                      where the scripts point, never that the file ships.
//   db/e2e.db       — the E2E TRANSIENT: created + destroyed by the global
//                      setup per run (gitignored).
//   db/smoke.db     — the SMOKE TRANSIENT: the trap removes it at the end
//                      of every run ("every run starts clean").
//   public/robots.txt — the REPLACED-STATIC narrative: src/app/robots.ts
//                      serves the route ("replaces the static file"); the
//                      static form was replaced by design.
//
// Ground truth: the fs (existsSync), the reference grammar the backtick +
// (src|tests|docs|prisma|scripts|db|public|skills)/ prefix.
//
// The class boundary: the FIVE CORE DOCS only (the standing reference
// corpus — AGENTS, CLAUDE, README, PAD, SKILL); the docs/ session archive
// and worklog are covered for their grammars by the s55/s56/s57 pins, and
// the skills/ folder is excluded by the repo convention. The count is
// DOC-DETERMINED (a pure function of the corpus content) — never
// fs-dependent — so the pin 3 floor is stable across environments.
// ---------------------------------------------------------------------------

const CORE_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "Project_Architecture_Document.md",
  "service-desk_SKILL.md",
] as const;

// The path-shaped reference grammar: a backticked token whose first segment
// is one of the repo's top-level source directories. The trailing-punctuation
// strip keeps sentence-adjacent forms ("… at `src/lib/db.ts`." ) out of the
// fs lookup without weakening the grammar.
const PATH_RE = /`((?:src|tests|docs|prisma|scripts|db|public|skills)\/[A-Za-z0-9_./-]+)`/g;

// The measured exclusion set — each entry with its documented reason. The
// needed-ness direction (pin 2) holds this list honest: an entry whose
// citation class disappears from the corpus must be removed here, and an
// entry added to hide a dangling reference is a visible pin edit that pin 2
// cannot legitimize (it must still be cited AND reachable review).
const EXCLUSIONS: ReadonlyMap<string, string> = new Map([
  ["db/custom.db", "the RUNTIME TARGET — gitignored; the db/ folder ships .gitkeep only"],
  ["db/e2e.db", "the E2E TRANSIENT — created + destroyed by the global setup per run"],
  ["db/smoke.db", "the SMOKE TRANSIENT — the trap removes it at the end of every run"],
  ["public/robots.txt", "the REPLACED-STATIC narrative — src/app/robots.ts serves the route"],
]);

interface PathRef {
  doc: string;
  line: number;
  path: string;
}

function stripTrailingPunctuation(p: string): string {
  return p.replace(/[.,;:)]+$/, "").replace(/\.+$/, "");
}

function collectRefs(doc: string): { checked: PathRef[]; excluded: PathRef[] } {
  const checked: PathRef[] = [];
  const excluded: PathRef[] = [];
  const text = readFileSync(doc, "utf8");
  const lines = text.split("\n");
  for (const m of text.matchAll(PATH_RE)) {
    const p = stripTrailingPunctuation(m[1]);
    const line = text.slice(0, m.index).split("\n").length;
    if (EXCLUSIONS.has(p)) {
      excluded.push({ doc, line, path: p });
    } else {
      checked.push({ doc, line, path: p });
    }
  }
  void lines;
  return { checked, excluded };
}

describe("session 58: the doc-path-reachability pins (the whole-path existence-claim contract)", () => {
  it("pin 1: every backticked path-shaped reference in the five core docs resolves on the fs (the four-entry exclusion set)", () => {
    const offenders: string[] = [];
    for (const doc of CORE_DOCS) {
      const { checked } = collectRefs(doc);
      for (const ref of checked) {
        if (!existsSync(ref.path)) {
          offenders.push(`${ref.doc} line ${ref.line}: \`${ref.path}\``);
        }
      }
    }
    if (offenders.length > 0) {
      throw new Error(
        `doc-path references that do not resolve on the fs: ${offenders.join("; ")}. ` +
          `A core doc citing a path is an existence claim — fix the reference (the file moved/was renamed), or ` +
          `(if it is a measured narrative/transient form) extend the documented EXCLUSIONS map with its reason.`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 2: every exclusion entry remains genuinely cited in the core docs (the exclusion cannot outlive its reason)", () => {
    const allText = CORE_DOCS.map((d) => readFileSync(d, "utf8")).join("\n");
    for (const [entry, reason] of EXCLUSIONS) {
      const cited = allText.includes(`\`${entry}\``);
      expect(
        cited,
        `the exclusion entry ${entry} (${reason}) is no longer backticked-cited in the core docs — ` +
          `remove it from the EXCLUSIONS map (the exclusion cannot outlive its reason)`,
      ).toBe(true);
    }
  });

  it("pin 3: the checked-reference floor (the vacuous-pass guard — the sweep may never silently empty)", () => {
    // Measured 516 at s58 (529 total - 13 excluded). The count is
    // doc-determined — a pure function of the corpus content — so the floor
    // guards exactly one failure mode: the grammar or the corpus changed
    // enough to empty the sweep (the s56 mapDeps lesson — a silent vacuous
    // pass reads as green while checking nothing).
    let checkedCount = 0;
    for (const doc of CORE_DOCS) {
      checkedCount += collectRefs(doc).checked.length;
    }
    expect(
      checkedCount,
      `the doc-path reference floor: expected >= 500 checked references across the five core docs, found ${checkedCount} — ` +
        `the grammar or the corpus changed; re-measure and recalibrate (a vacuous pass is a silent green)`,
    ).toBeGreaterThanOrEqual(500);
  });
});
