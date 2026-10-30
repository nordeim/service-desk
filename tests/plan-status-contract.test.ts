import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Session 55 — the plan-status pins (P1: the PLAN-STATUS class — the s95
// shortlist's successor audit, CONFIRMED ACTIVE DRIFT)
//
// Contract under test: the remediation plans' "Execution status" sections are
// STATUS CLAIMS — assertions that recorded work happened — and the s55 audit
// found two of them contradicting their own text or the verified history:
//
//   Shape A — the self-contradiction (s38 line 136): an UNCHECKED box whose
//     own TEXT asserts completion ("— complete, recorded in worklog task
//     100-gap-s38"). Born at the remediation commit 221141a (the section was
//     assembled with the text already asserting completion — the box was
//     never flipped) and survived the closeout 7fa3c8f, which checked only
//     the push box three lines below. 17 sessions of drift. The contradiction
//     is WITHIN the line — no history needed to catch it.
//
//   Shape B — the closeout omission (s54 line 115): the "Commit + push + CI
//     verification" box honestly unchecked at the remediation commit
//     (the push of that very commit had not happened — the chicken-and-egg),
//     then the closeout bd05e5d updated only worklog.md, so the box still
//     contradicted the verified history (the pushes landed, CI green on
//     both). The s52 convention (closeout checks the box with the record)
//     and the s53 convention (the deferral form at the remediation commit)
//     were both missed.
//
// The class survived because the STATUS shape matches no pin family's form:
// the s48 corpus pins watch COUNTS, the s52 docdate pins watch DATES, the
// s53 keyfiles pins watch SIZES, the s54 coverage pins map SOURCE-to-TESTS —
// nothing anywhere asks whether a status checkbox agrees with the state it
// asserts.
//
// Ground truth: the checkbox lines of docs/remediation-plan-session*.md —
// the plan corpus ONLY. The PAD §7.4 Pre-PR/Pre-Deploy Checklist and the
// SKILL's manual-verification checklist carry unchecked boxes BY DESIGN
// (per-run templates, not status records) and are outside the glob's reach.
//
// The three-sided design (the s53/s54 precedent):
//   pin 1 — the closed-plans completeness: every plan numbered below
//           CURRENT_SESSION carries ZERO unchecked boxes. Catches both
//           shapes at the next session boundary (the constant's bump pulls
//           the prior session's plan into the sweep). The chicken-and-egg
//           allowance — the CURRENT session's plan may be mid-flight — is
//           the honest one-session lag, documented here.
//   pin 2 — the self-contradiction guard: NO plan, ANY session number
//           (including the current), may carry an unchecked box whose own
//           text asserts completion. The immediate-catch half: shape A is
//           caught the moment it is written, mid-flight or not.
//   pin 3 — the enumeration honesty: the walk is GLOB-driven (never a
//           hardcoded list), the corpus floor is 53 (a deleted plan fails
//           loudly), and the CURRENT session's plan must exist (a new plan
//           file joins pins 1+2's sweep automatically).
// ---------------------------------------------------------------------------

// The current session's number — bumped each session (the corpus-pin
// pattern). Plans numbered BELOW this are CLOSED: their execution-status
// sections must be fully checked. The current session's own plan may be
// mid-flight (the final box's push chicken-and-egg) — the next session's
// bump pulls it into the sweep.
const CURRENT_SESSION = 96;

// The plan corpus floor: the fs carried 54 plan files at session 55
// (session 2 … session 55 — not every session wrote a plan; the floor is
// the count of files that exist, not the session span), and session 56's
// own plan raised it to 55. The floor counts the corpus WITH the current
// session's plan — a single-file deletion fails loudly (observed live at
// s55 mutation D: the pre-s55 calibration let one deletion through; the
// floor must be re-calibrated each session alongside CURRENT_SESSION).
const PLAN_CORPUS_FLOOR = 95;

const DOCS_DIR = "docs";

interface PlanFile {
  file: string;
  session: number;
  content: string;
  unchecked: { line: number; text: string }[];
}

function planFiles(): PlanFile[] {
  if (!existsSync(DOCS_DIR)) throw new Error("docs/ directory not found");
  const files = readdirSync(DOCS_DIR).filter((f) =>
    /^remediation-plan-session(\d+)\.md$/.test(f),
  );
  return files.map((f) => {
    const session = Number(/^remediation-plan-session(\d+)\.md$/.exec(f)![1]);
    const content = readFileSync(`${DOCS_DIR}/${f}`, "utf8");
    const unchecked: { line: number; text: string }[] = [];
    content.split("\n").forEach((line, i) => {
      if (/^- \[ \]/.test(line)) {
        unchecked.push({ line: i + 1, text: line.slice(6).trim() });
      }
    });
    return { file: f, session, content, unchecked };
  });
}

// The completion-assertion grammar: a past-tense clause asserting the work
// is done. Tight by design — a future-tense task ("complete the migration")
// must NOT match (the `—` clause forms + the explicit participle forms are
// the observed shape-A vocabulary). Case-INSENSITIVE: the s54 record form
// asserts completion via "CI green on both (… both COMPLETED/SUCCESS)" —
// the uppercase CI-status form is a completion assertion too (observed at
// mutation B: the case-sensitive form missed it; pin 1 caught shape B, pin 2
// now catches the reintroduced-record variant immediately).
const COMPLETION_ASSERTION =
  /— complete\b|complete, recorded|\bcompleted\b|\bdone —/i;

describe("session 55: the plan-status pins (the execution-status honesty contract)", () => {
  it("pin 1: every prior session's plan is fully checked (the closed-plans completeness — a forgotten closeout box fails the next session's sweep)", () => {
    const closed = planFiles().filter((p) => p.session < CURRENT_SESSION);
    expect(closed.length).toBeGreaterThan(0);
    const offenders = closed.filter((p) => p.unchecked.length > 0);
    if (offenders.length > 0) {
      const detail = offenders
        .map(
          (p) =>
            `${p.file}: ${p.unchecked.map((u) => `line ${u.line}`).join(", ")}`,
        )
        .join("; ");
      throw new Error(
        `plans from closed sessions carry unchecked execution-status boxes (the closeout omission — shape B): ${detail}. ` +
          `Every plan numbered below session ${CURRENT_SESSION} must land fully checked: the remediation commit uses the deferral form for its final box, and the closeout commit verifies it.`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 2: no unchecked box asserts its own completion (the self-contradiction guard — caught the moment it is written, mid-flight or not)", () => {
    const all = planFiles();
    expect(all.length).toBeGreaterThan(0);
    const offenders = all.flatMap((p) =>
      p.unchecked
        .filter((u) => COMPLETION_ASSERTION.test(u.text))
        .map((u) => `${p.file} line ${u.line}: "${u.text.slice(0, 80)}…"`),
    );
    if (offenders.length > 0) {
      throw new Error(
        `unchecked boxes whose own text asserts completion (the self-contradiction — shape A): ${offenders.join("; ")}. ` +
          `The text and the checkbox disagree WITHIN the line: either the work is complete (check the box) or it is not (rewrite the text).`,
      );
    }
    expect(offenders.length).toBe(0);
  });

  it("pin 3: the enumeration honesty (the glob-driven walk + the corpus floor + the current session's plan present)", () => {
    const all = planFiles();
    // The floor: the corpus shrank if a plan file left the fs.
    expect(
      all.length,
      `the plan corpus floor: expected >= ${PLAN_CORPUS_FLOOR} plan files on the fs, found ${all.length} — a plan file may have been deleted or renamed off the corpus`,
    ).toBeGreaterThanOrEqual(PLAN_CORPUS_FLOOR);
    // The current session's plan joins the corpus the moment this pin runs.
    expect(
      all.some((p) => p.session === CURRENT_SESSION),
      `the current session's plan (remediation-plan-session${CURRENT_SESSION}.md) must exist on the fs — the walk is glob-driven, and the current plan joins pins 1+2's sweep automatically`,
    ).toBe(true);
  });
});
