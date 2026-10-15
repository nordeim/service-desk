import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Session 57 — the doc-enumeration pins (P1: the OPERATOR-SIDE TRANSCRIPT
// class + the ENUMERATION-COMPLETENESS closure)
//
// Contract under test: the doc corpus' NUMBERED FAMILIES are indexed
// sequences, and every prior guard is a COUNT (the plan-status floor, the
// corpus-count floors). A count floor catches MASS deletion but not the
// single-file HOLE: with 56 plans on the fs and floor 55, deleting one
// middle plan leaves 55 >= 55 — the floor passes, the corpus has a gap no
// reader can follow. Nothing anywhere asked whether the NUMBERING is
// complete.
//
// The trigger event (measured live at the s57 baseline gate): the
// operator's transcript commit dfc1f7d (docs/session_102.md) reintroduced
// the s56 fabricated-token quotes in the backticked grammar-matching form —
// the s56 artifact-existence pin 3 caught it in CI (run #153 FAILED in 39s,
// the first red main-branch run ever) and the red state sat between
// sessions until the baseline gate. The transcript class itself needs no
// new pin — the s56 pins already sweep every docs/*.md file, the operator's
// verbatim quotes included (the catch fired exactly as designed); this
// file closes the STRUCTURAL slack the event exposed: the numbered
// families' enumeration.
//
// Ground truth (measured this session, all CLEAN — these pins are
// BORN-GREEN, the s56 pin-3 precedent; their bites are demonstrated by the
// mutation battery):
//   - the plan corpus: {2..56} exact — 55 files, no gaps, no dupes, no
//     extras (session 1 predates the plan convention, per the s56 plan's
//     class boundary).
//   - the session-log corpus: {1..102} contiguous — the odd/even
//     convention (the agent's session-N log at doc 2N-11, the operator's
//     transcript at doc 2N-10).
//   - the agent-log correspondence: for every N = 12..56, doc
//     session_(2N-11).md exists AND its head identifies session-N (the
//     "# The session-N agent's log" header; N = 12 is the transitional
//     form, N <= 11 the pre-convention free-form era).
//
// The three-sided design (the s53–s56 precedent):
//   pin 1 — the plan enumeration: the session-number set == exactly
//           {2..CURRENT_SESSION}. Completeness (no missing plan), contiguity
//           (no interior gap), and no extras (no renumbered/stray file).
//           The current session's plan joins at plan-write time (the
//           plan-status pin-3 convention: the plan lands before the
//           battery runs).
//   pin 2 — the session-log enumeration: the doc-number set == exactly
//           {1..max} for its own max (contiguous from 1 — a gap ANYWHERE in
//           the log line fails), AND max >= 2·(CURRENT_SESSION−1)−11 (the
//           previous session's agent log landed). The one-session lag is
//           the plan-status precedent's honest cost of the closeout
//           chicken-and-egg: a forgotten session log fails the VERY NEXT
//           session's baseline gate naming the exact missing doc.
//   pin 3 — the agent-log correspondence: for every N in
//           [12..CURRENT_SESSION−1], doc session_(2N−11).md exists AND its
//           first 300 chars identify session-N, AND doc session_(2N−10).md
//           exists (the operator-transcript pairing — existence only: the
//           transcripts are raw conversation dumps with no header
//           convention to check). A renumbered or mislabeled log, a
//           shifted mapping, or a missing transcript fails naming the
//           session + the expected doc number.
// ---------------------------------------------------------------------------

// The current session's number — bumped each session alongside the
// plan-status file's own constant (the paired bump is a visible edit; a
// mismatch between the two files fails this suite's expectations on the
// next boundary).
const CURRENT_SESSION = 57;

// The agent-log correspondence boundary: the 2N-11 formula + the header
// identification hold for every session N >= 12 (measured: the s12 doc
// carries the transitional "Session 13 briefing — the session-12 agent's
// log" form; the s6–s11 docs are the pre-convention free-form era —
// session_7.md references session-5, the numbering had not crystallized).
const PAIRING_BOUNDARY = 12;

const DOCS_DIR = "docs";

function docNumbers(pattern: RegExp): number[] {
  if (!existsSync(DOCS_DIR)) throw new Error("docs/ directory not found");
  return readdirSync(DOCS_DIR)
    .map((f) => pattern.exec(f)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
}

const PLAN_PATTERN = /^remediation-plan-session(\d+)\.md$/;
const LOG_PATTERN = /^session_(\d+)\.md$/;

describe("session 57: the doc-enumeration pins (the numbered families held to their index sequences)", () => {
  it("pin 1: the plan corpus enumerates exactly {2..CURRENT_SESSION} — complete, contiguous, no extras", () => {
    const plans = docNumbers(PLAN_PATTERN);
    const expected = Array.from(
      { length: CURRENT_SESSION - 1 },
      (_, i) => i + 2,
    ); // {2, 3, …, CURRENT_SESSION}

    const missing = expected.filter((n) => !plans.includes(n));
    const extras = plans.filter((n) => !expected.includes(n));
    const dupes = plans.filter((n, i) => plans.indexOf(n) !== i);

    if (missing.length > 0 || extras.length > 0 || dupes.length > 0) {
      throw new Error(
        `the plan corpus enumeration is not exact: expected {2..${CURRENT_SESSION}} (session 1 predates the plan convention), ` +
          `found ${plans.length} files ${plans.length > 0 ? `spanning ${plans[0]}..${plans[plans.length - 1]}` : ""} — ` +
          `missing sessions [${missing.join(", ")}], extras [${extras.join(", ")}], dupes [${dupes.join(", ")}]. ` +
          `A count floor passes with a hole in the middle (56 plans, floor 55, one deletion: 55 >= 55) — the exact set does not.`,
      );
    }
    expect(plans).toEqual(expected);
  });

  it("pin 2: the session-log corpus is contiguous from 1, and the previous session's agent log landed (doc 2·(N−1)−11)", () => {
    const logs = docNumbers(LOG_PATTERN);
    if (logs.length === 0) throw new Error("the session-log corpus is empty");

    const max = logs[logs.length - 1];
    // Contiguity: the doc numbers are exactly {1..max} — a gap anywhere in
    // the line (a deleted or skipped doc) fails naming the hole.
    const holes: number[] = [];
    for (let n = 1; n <= max; n++) {
      if (!logs.includes(n)) holes.push(n);
    }
    const dupes = logs.filter((n, i) => logs.indexOf(n) !== i);
    if (holes.length > 0 || dupes.length > 0) {
      throw new Error(
        `the session-log corpus is not contiguous: docs {1..${max}} carry holes at [${holes.join(", ")}]` +
          `${dupes.length > 0 ? ` and dupes at [${dupes.join(", ")}]` : ""} — ` +
          `a reader following the log line cannot skip a number.`,
      );
    }

    // The one-session-lag floor: the PREVIOUS session's agent log (doc
    // 2·(CURRENT−1)−11) must have landed. The CURRENT session's own log
    // joins this sweep when the constant bumps next session — the
    // plan-status precedent's honest chicken-and-egg cost.
    const floorDoc = 2 * (CURRENT_SESSION - 1) - 11;
    if (max < floorDoc) {
      throw new Error(
        `the previous session's agent log is missing: the corpus max is doc ${max}, but session ${CURRENT_SESSION - 1}'s ` +
          `agent log should be at doc session_${floorDoc}.md (the 2N−11 convention). A forgotten closeout log fails ` +
          `here the moment the constant bumps.`,
      );
    }
    expect(max).toBeGreaterThanOrEqual(floorDoc);
  });

  it("pin 3: every paired session N (>= 12, below CURRENT) has its agent log at doc 2N−11 (identified) + its transcript at doc 2N−10", () => {
    const offenders: string[] = [];
    for (let n = PAIRING_BOUNDARY; n <= CURRENT_SESSION - 1; n++) {
      const agentDoc = `${DOCS_DIR}/session_${2 * n - 11}.md`;
      const transcriptDoc = `${DOCS_DIR}/session_${2 * n - 10}.md`;
      if (!existsSync(agentDoc)) {
        offenders.push(
          `session ${n}: the agent log doc session_${2 * n - 11}.md is MISSING (the 2N−11 convention)`,
        );
        continue;
      }
      const head = readFileSync(agentDoc, "utf8").slice(0, 300);
      if (!new RegExp(`session-?\\s*${n}\\b`, "i").test(head)) {
        offenders.push(
          `session ${n}: doc session_${2 * n - 11}.md exists but its head does not identify session-${n} (the header convention — a renumbered or mislabeled log)`,
        );
      }
      if (!existsSync(transcriptDoc)) {
        offenders.push(
          `session ${n}: the operator-transcript doc session_${2 * n - 10}.md is MISSING (the 2N−10 pairing)`,
        );
      }
    }
    if (offenders.length > 0) {
      throw new Error(
        `the agent-log correspondence is broken: ${offenders.join("; ")}. ` +
          `The boundary N >= ${PAIRING_BOUNDARY} is the measured convention origin (the s6–s11 free-form era predates it).`,
      );
    }
    // The sweep ran over CURRENT_SESSION − PAIRING_BOUNDARY sessions.
    expect(CURRENT_SESSION - PAIRING_BOUNDARY).toBeGreaterThan(0);
  });
});
