import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 53 — the size-claim pins (P1: the PAD §11 Key Files Reference's 17
// stale ~LINE-COUNT figures + the SKILL's compound auth claim — a claim shape
// no pin family sweeps)
//
// Contract under test: the PAD §11 "Key Files Reference" table names the
// load-bearing files with a size figure per row, and the SKILL's §1 prose
// carries a compound size+test claim for src/lib/auth.ts. At the s53 audit
// the figures were 44 sessions stale: validation.ts claimed ~120 against 437
// actual lines (3.6x), constants.ts ~95 vs 250, globals.css ~130 vs 336,
// next.config.ts ~40 vs 82, api/tickets/route.ts ~120 vs 254, and seed.ts
// ~180 vs 83 (the s43 extraction moved the corpus data to prisma/seed-data.ts
// — a file §11 did not list at all); the SKILL claimed "~170 auditable
// lines, 11 unit tests" against 232 lines and the §7.1-runtime-pinned 20
// tests. Verified in git: at cf8e4f0 (the session-1 docs) every figure was
// TRUE — born right, drifted stale because the session checklist bumps the
// SKILL's frontmatter + the corpus counts, never §11's size figures.
//
// Why it drifted silently: the SIZE shape is swept by no pin family (the s48
// families are corpus-count forms; the s49 pads are §7.1 test rows; the s50
// BRIDGE is the quickstart OUTPUT line; the s51 pins are the requirements
// enumeration; the s52 pins are DATE claims) — nothing compared a size claim
// to the file it names. The `~` hedge is what let the drift feel tolerable:
// a "~120" next to a 437-line file inverts the size signal the table exists
// to give, and no reasonable reading of "approximately" spans 3.6x.
//
// Ground truth: the fs line count — newline-character counting (wc -l
// semantics), deterministic across machines, no git history needed (no s52
// shallow-clone trap), no mtimes (no s49 reset trap).
//
// Design decisions (both measured, the plan's §2):
//   1. EXACT figures, not a tolerance band: the `~` hedge is DROPPED and the
//      pin holds exact equality. A +/-20% band would have passed auth.ts's
//      +36% drift today; the corpus-family discipline (9 sites bumped every
//      session the suite grows) proves the exact-figure maintenance pattern.
//   2. The grammar enforces the form: the Lines cell must be a BARE integer
//      — a `~N` cell is a MALFORMED row that fails loudly with the row named
//      (the s18 fail-loudly doctrine; the same grammar-level form guard as
//      the s51 no-Python-token enumeration). Exact figures only: the hedge
//      is the mask, the closure removes it.
//
// Pin style: three assertions in three tests —
//   1. the exact-count pin: every §11 row's figure == its file's fs line
//      count (and the file exists) — the staleness closure;
//   2. the row-floor + key-coverage pin: the table carries >= 18 rows (the
//      17 legacy + the s53 prisma/seed-data.ts addition — a deleted row
//      silently shrinks pin 1's surface) AND names prisma/seed-data.ts (the
//      load-bearing corpus home the s43 pins import; a rename/move must
//      fail here loudly, the s41 doctrine);
//   3. the SKILL size-figure family pin: every backticked-path size claim in
//      the SKILL held to the fs, plus the auth compound claim's test figure
//      == the §7.1 runtime-pinned auth row (the s50 BRIDGE chaining pattern:
//      §7.1 is runtime-held by the s49 pads, so chaining to the row chains
//      to the runtime).
//
// Deliberate scope (the pin-the-claims-not-the-universe doctrine): the table
// is a CURATED list — the pin holds every ROW's claim true, never that every
// repo file has a row. The prose-recap "Prisma schema (73 lines):" forms
// (no backticked path) are TRUE today and left to a future session's audit.
// ---------------------------------------------------------------------------

const repo = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(`${repo}/${p}`, "utf8");
const PAD = read("Project_Architecture_Document.md");
const SKILL = read("service-desk_SKILL.md");

/** wc -l semantics: count newline characters (every repo file ends in \n). */
const fsLineCount = (p: string) => (read(p).match(/\n/g) ?? []).length;

/** The §11 Key Files Reference table rows: [path, claimedCell, purpose]. */
function keyFilesRows(): Array<{ path: string; cell: string; line: number }> {
  const lines = PAD.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## 11. Key Files Reference"));
  const rows: Array<{ path: string; cell: string; line: number }> = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("## ")) break; // the next section ends the table
    const m = l.match(/^\| `([^`]+)` \| (.+?) \|/);
    if (m) rows.push({ path: m[1], cell: m[2].trim(), line: i + 1 });
  }
  return rows;
}

/** The §7.1 Vitest test count for a given test file's row (runtime-pinned by
 *  the s49 pads — chaining to the row chains to the runtime, the s50 BRIDGE
 *  pattern). */
function pad71RowCount(testFile: string): number {
  const row = PAD.split("\n").find(
    (l) => l.startsWith("| Unit ") && l.includes(`\`${testFile}\``),
  );
  const m = row?.match(/^\| (?:Unit|E2E)[^|]*\| \d+ \| (\d+) \|/);
  if (!m) throw new Error(`the PAD §7.1 row for ${testFile} not found`);
  return Number(m[1]);
}

describe("session 53: the size-claim pins (the PAD §11 Key Files Reference + the SKILL compound claim)", () => {
  it("every §11 row's figure is an EXACT integer equal to the file's fs line count (the ~ hedge is a malformed row — the staleness closure)", () => {
    const rows = keyFilesRows();
    expect(rows.length, "the §11 table must carry rows (the parser found none — check the section heading)").toBeGreaterThan(0);
    for (const { path: p, cell, line } of rows) {
      expect(
        /^\d+$/.test(cell),
        `PAD L${line}: the Lines cell for \`${p}\` is "${cell}" — EXACT figures only (a bare integer); the "~" hedge is the mask that let the s53-class drift (a ~120 next to a 437-line validation.ts) survive 44 sessions. Fix: replace with the file's exact line count.`,
      ).toBe(true);
      const claimed = Number(cell);
      expect(
        existsSync(`${repo}/${p}`),
        `PAD L${line}: \`${p}\` does not exist on the fs — a Key Files Reference row must name a real file (fix the path or drop the row).`,
      ).toBe(true);
      const actual = fsLineCount(p);
      expect(
        claimed,
        `PAD L${line}: \`${p}\` claims ${claimed} lines but the file measures ${actual} — a size figure is a checkable claim whose ground truth is one wc -l (the s53 doctrine). Fix: bump the row to ${actual}.`,
      ).toBe(actual);
    }
  });

  it("the §11 table carries >= 18 rows AND names the load-bearing corpus home prisma/seed-data.ts (the deletion + key-coverage guard)", () => {
    const rows = keyFilesRows();
    expect(
      rows.length,
      `the §11 table carries ${rows.length} rows — the floor is 18 (the 17 legacy rows + the s53 prisma/seed-data.ts addition; a deleted row silently shrinks the exact-count pin's surface).`,
    ).toBeGreaterThanOrEqual(18);
    expect(
      rows.some((r) => r.path === "prisma/seed-data.ts"),
      "the §11 table must name prisma/seed-data.ts — the canonical seed-corpus data home (the side-effect-free extraction the s43 seed-corpus pins import; born s43 and absent from the table for 10 sessions). A rename/move of it must fail here loudly.",
    ).toBe(true);
  });

  it("every backticked-path size claim in the SKILL matches the fs, and the auth compound claim's test figure == the §7.1 runtime-pinned row (the prose-echo closure)", () => {
    // Form A: "(`path`, N lines" — the section-header claims (§7.1/§7.2).
    const formA = [...SKILL.matchAll(/`([^`\n]+)`, (\d+) lines/g)];
    for (const m of formA) {
      const [, p, n] = m;
      expect(
        existsSync(`${repo}/${p}`),
        `the SKILL claims a line figure for \`${p}\` which does not exist on the fs.`,
      ).toBe(true);
      expect(
        Number(n),
        `the SKILL claims \`${p}\` carries ${n} lines but the file measures ${fsLineCount(p)} — a prose size claim is a claim (the s53 doctrine).`,
      ).toBe(fsLineCount(p));
    }
    // Form B: the auth compound claim — "`src/lib/auth.ts` (N auditable
    // lines, M unit tests)". BOTH figures held: the lines to the fs, the
    // tests to the §7.1 runtime-pinned row (the s50 BRIDGE chaining).
    const formB = SKILL.match(/`src\/lib\/auth\.ts` \((\d+) auditable lines, (\d+) unit tests\)/);
    expect(
      formB,
      "the SKILL must carry the auth.ts compound claim in the exact form \"`src/lib/auth.ts` (N auditable lines, M unit tests)\" — the two-figure prose claim the s53 audit found 44 sessions stale.",
    ).toBeTruthy();
    if (formB) {
      expect(
        Number(formB[1]),
        `the SKILL claims src/lib/auth.ts carries ${formB[1]} auditable lines but the file measures ${fsLineCount("src/lib/auth.ts")} — the compound claim drifted with §11 (born ~170/174 at session 1).`,
      ).toBe(fsLineCount("src/lib/auth.ts"));
      const runtimeRow = pad71RowCount("src/lib/__tests__/auth.test.ts");
      expect(
        Number(formB[2]),
        `the SKILL claims ${formB[2]} unit tests for src/lib/auth.ts but the PAD §7.1 runtime-pinned row says ${runtimeRow} — a per-file test count outside §7.1 is a prose echo the s49 pads cannot reach; this pin chains it to the runtime-pinned row.`,
      ).toBe(runtimeRow);
    }
  });
});
