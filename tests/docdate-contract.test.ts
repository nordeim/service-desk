import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 52 — the doc-freshness date-claim pins (P1: the four stale date
// sites — a claim shape no pin family sweeps)
//
// Contract under test: four docs claim their own freshness — CLAUDE.md's
// frontmatter `last_updated`, the PAD's `**Last Updated:**` line, the SKILL's
// frontmatter `last_updated` + its description's "Distilled through the
// session-N remediation (DATE)." line, and AGENTS.md's "Verified against the
// toolchain on DATE." — and three of the four were STALE at the s52 audit:
// CLAUDE.md and the PAD claimed 2026-10-09 while f9de02b (2026-10-15 +0800)
// had just landed the s50/s51 counts + anti-patterns IN those files, and the
// SKILL's description named "session-50" while its own frontmatter said
// 2.49.0 / 2026-10-15 and its last lesson was tagged (Session 51.).
//
// Why it drifted silently: the DATE shape is swept by no pin family (the s48
// families are corpus-count forms; the s49 pads are §7.1 rows; the s50 BRIDGE
// is the quickstart OUTPUT line; the s51 pins are the prerequisites
// enumeration), and the session checklist bumps the SKILL's frontmatter alone
// — nothing held the OTHER docs' dates or the SKILL's description line, and
// nothing compared any date claim to the file's actual content history.
//
// Ground truth: the file's git last-commit date (`git log -1 --format=%cI`),
// read as an Asia/Singapore calendar date — the operator-timezone convention,
// measured against the s51 precedent (f9de02b landed 2026-10-14 23:34 UTC
// and the SKILL frontmatter correctly claimed 2026-10-15, the +0800 reading;
// a UTC clock would false-RED that legitimate claim during 2026-10-14-UTC
// hours).
//
// A measurement subtlety the design must survive (measured live at s52): in
// a depth-1 shallow clone — GitHub Actions' actions/checkout@v4 DEFAULT —
// `git log -1 --format=%cI -- <file>` answers HEAD's date for EVERY file,
// even files HEAD did not touch. The pin therefore FAILS LOUDLY on a shallow
// repository (the s18 doctrine: a pin that silently skips is a pin that does
// not exist) — the CI workflow's verify-job checkout carries fetch-depth: 0
// (the s45 shape pins are unaffected: they match executable YAML shapes, not
// line numbers).
//
// Pin style: three assertions in three tests —
//   1. the git-anchored staleness pin: claimed >= the file's git last-commit
//      date, per-file (one-sided BY DESIGN: a session lands a dated doc hours
//      before its commit's committer date is knowable — the enforcement point
//      is CI, post-commit, where the git date is final; the same
//      CI-is-the-gate-that-bites pattern as the s50 BRIDGE);
//   2. the SKILL-internal coherence pin: the description's session == the
//      LAST "(Session N.)" lesson tag (the newest distillation) and the
//      description's date == the frontmatter last_updated (two surfaces of
//      one claim, same file);
//   3. the no-future-dating pin: every claimed date <= today (Asia/
//      Singapore) — the one-sided staleness pin deliberately tolerates
//      claimed > git (the pre-commit working state), so the future-lie needs
//      its own guard.
//
// Deliberate scope: per-file staleness, NOT family equality — CLAUDE.md's
// last_updated is a claim about CLAUDE.md and the PAD's about the PAD; they
// may legitimately move on different sessions (a session that edits only the
// PAD). An all-dates-equal family would false-RED legitimate partial edits
// (the pin-the-claims-not-the-universe doctrine). No mtime ground truth:
// fresh clones reset every mtime to checkout time — git history is the only
// stable content-history measure.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

/** The operator-timezone convention for every date figure in this pin. */
const TZ = "Asia/Singapore";

type DatedDoc = {
  file: string;
  claimRe: RegExp;
  label: string;
};

/** The four docs that claim their own freshness, with their exact shapes. */
const DATED_DOCS: DatedDoc[] = [
  {
    file: "CLAUDE.md",
    claimRe: /^last_updated: (\d{4}-\d{2}-\d{2})$/m,
    label: "frontmatter last_updated",
  },
  {
    file: "Project_Architecture_Document.md",
    claimRe: /^\*\*Last Updated:\*\* (\d{4}-\d{2}-\d{2})$/m,
    label: "the Last Updated line",
  },
  {
    file: "service-desk_SKILL.md",
    claimRe: /^last_updated: (\d{4}-\d{2}-\d{2})$/m,
    label: "frontmatter last_updated",
  },
  {
    file: "AGENTS.md",
    claimRe: /Verified against the toolchain on (\d{4}-\d{2}-\d{2})\./,
    label: "the toolchain-verification date",
  },
];

/** An ISO timestamp → the Asia/Singapore calendar date (YYYY-MM-DD). */
function sgDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Today's Asia/Singapore calendar date (YYYY-MM-DD). */
function todaySG(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** The file's git last-commit timestamp (requires real history). */
function gitLastCommitIso(file: string): string {
  return execSync(`git log -1 --format=%cI -- ${file}`, {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

/** Extract a doc's claimed date by its exact shape. */
function claimedDate({ file, claimRe, label }: DatedDoc): string {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  const m = text.match(claimRe);
  expect(
    m,
    `${file} must carry its date claim (${label}) — a dropped date field silently un-claims the file's freshness (the s48 floor doctrine)`,
  ).toBeTruthy();
  return (m as RegExpExecArray)[1] as string;
}

describe("the doc-freshness date-claim contract (session 52)", () => {
  it("every dated doc's claimed date is at least its git last-commit date (the staleness pin — a last_updated older than the file's own content history is a stale freshness claim)", () => {
    // Fail LOUDLY on a shallow repository — never silently skip (the s18
    // doctrine). Measured: a depth-1 clone answers HEAD's date for EVERY
    // file, so a shallow run would measure nothing while looking green.
    const shallow = execSync("git rev-parse --is-shallow-repository", {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    if (shallow === "true") {
      throw new Error(
        "the docdate pin requires real git history: clone without --depth, or set fetch-depth: 0 on the CI checkout (a depth-1 clone answers HEAD's date for every file — the pin would measure nothing)",
      );
    }
    for (const doc of DATED_DOCS) {
      const claimed = claimedDate(doc);
      const gitDate = sgDate(gitLastCommitIso(doc.file));
      expect(
        claimed >= gitDate,
        `${doc.file}'s ${doc.label} claims ${claimed} but the file's git last-commit date is ${gitDate} (${TZ}) — a date older than the content history is a stale claim (bump the date with the edit; the enforcement lands at CI, where the commit date is final)`,
      ).toBe(true);
    }
  });

  it("the SKILL's description agrees with its own ledger — the distillation session == the LAST lesson's (Session N.) tag, and the description's date == the frontmatter last_updated (the exact inconsistency s51 shipped: v2.49.0 + lesson 105 '(Session 51.)' + a description still naming session-50)", () => {
    const skill = readFileSync(path.join(repoRoot, "service-desk_SKILL.md"), "utf8");
    const desc =
      /Distilled through the session-(\d+) remediation \((\d{4}-\d{2}-\d{2})\)\./.exec(
        skill,
      );
    expect(
      desc,
      "the SKILL description must carry the 'Distilled through the session-N remediation (DATE).' line (a dropped line silently un-claims the distillation)",
    ).toBeTruthy();
    const descSession = Number((desc as RegExpExecArray)[1]);
    const descDate = (desc as RegExpExecArray)[2] as string;
    const lessons = [...skill.matchAll(/\*\* \(Session (\d+)\.\)/g)].map((x) =>
      Number(x[1]),
    );
    expect(
      lessons.length,
      "the SKILL must carry at least one lesson-own '** (Session N.)' tag (the distillation ledger)",
    ).toBeGreaterThan(0);
    const lastLesson = lessons.at(-1) as number;
    expect(
      descSession,
      `the description names session-${descSession} but the file's LAST lesson is tagged (Session ${lastLesson}.) — the distillation line must name the newest session (the s52 finding: the version and the lessons moved, the description did not)`,
    ).toBe(lastLesson);
    const front = /^last_updated: (\d{4}-\d{2}-\d{2})$/m.exec(skill);
    expect(front, "the SKILL frontmatter must carry last_updated").toBeTruthy();
    expect(
      descDate,
      `the description's date ${descDate} must equal the frontmatter's last_updated ${(front as RegExpExecArray)[1]} (two surfaces of the same freshness claim, same file)`,
    ).toBe((front as RegExpExecArray)[1]);
  });

  it("no dated doc claims freshness from the future (every claimed date <= today, Asia/Singapore)", () => {
    const today = todaySG();
    for (const doc of DATED_DOCS) {
      const claimed = claimedDate(doc);
      expect(
        claimed <= today,
        `${doc.file}'s ${doc.label} claims ${claimed} — a date after today (${today}, ${TZ}) is a future-dated freshness claim (the staleness pin is one-sided by design; this is its complement)`,
      ).toBe(true);
    }
  });
});
