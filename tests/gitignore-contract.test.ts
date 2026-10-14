import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 47 — the .gitignore hygiene pins (P1: the unpinned secret-guard
// surface)
//
// Contract under test (documented in the .gitignore's own "never commit
// secrets" comment block + the PAD §7.4 pre-deploy checklist line
// `git ls-files | grep -E '^\.env$|\.key$|ssh-key'` + the s46 session's
// closing words — "a dropped .env ignore line would let a future git add .
// commit the secret, currently guarded by convention + the operator's
// manual git ls-files habit" — but held by MANUAL habit alone before
// session 47 — zero tests referenced .gitignore or the tracked surface):
//
//   1. the secret-file pin: `.env` (the AUTH_SECRET carrier) is git-ignored
//      — the drift scenario: a dropped/reordered ignore line and `git add .`
//      stages the secret; the push leaks it with zero test failures.
//   2. the credential-pattern pin: `*.key` / `*.pem` / `ssh-key.txt` are
//      git-ignored — the SSH-wrapper push flow (the s28 lineage) materializes
//      operator key files; a dropped pattern line would let one land in the
//      index.
//   3. the DB-binary pin: `db/*.db` + `db/*.db-journal` are git-ignored —
//      the fresh-clone story (every clone recreates them via db:push +
//      db:seed; a tracked binary would leak user data and rot the clone).
//   4. the tracked-surface pin: `git ls-files` carries NO secret-shaped
//      path — the PAD §7.4 checklist automated. This is the guard
//      check-ignore CANNOT provide: tracked files ignore ignore-rules, so
//      an already-committed secret stays silent forever at the pattern
//      layer. It catches the leak the moment it is staged/committed, not
//      after the push.
//   5. the inverse pin (the quickstart source): `.env.example` IS tracked
//      AND not check-ignored — an over-broad `.env*` pattern plus an index
//      removal would break every future fresh clone's
//      `cp .env.example .env` silently (the s46 env-contract pins only
//      fire in CI, after the file is already gone from the checkout).
//
// Pin style: EXECUTABLE, not substring (the s43 mutation-C / s45
// line-anchoring doctrines generalized): `git check-ignore` answers the
// actual question ("would git ignore this path?") at the rule-engine level
// — a commented-out, reordered, or deleted rule fails it directly, so the
// false-green concern of substring pins on file content is inherent here.
// `git ls-files` answers the repo-state question. Both shell-outs run with
// cwd pinned to the repo root (the db-script-pins pattern). A no-git
// environment (an exported tree without .git) fails loudly and honestly: a
// checkout that cannot run git cannot verify the secret guard.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");

/** Run git in the repo root; returns stdout (throws on non-zero exit). */
function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });
}

/**
 * Assert a path IS git-ignored (git check-ignore exits 0 exactly then).
 * The path does not need to exist on disk — check-ignore evaluates the
 * pathname against the ignore rules, so hypothetical future accidents
 * (a key materialized by the push flow, a fresh clone's .env) are covered.
 */
function expectIgnored(relativePath: string): void {
  let exitCode = 0;
  try {
    git("check-ignore", relativePath);
  } catch (err) {
    exitCode = (err as { status?: number }).status ?? 1;
  }
  expect(exitCode, `${relativePath} must be git-ignored`).toBe(0);
}

/** The tracked (staged/committed) file list — the repo-state surface. */
const trackedFiles = git("ls-files").split("\n").filter(Boolean);

/** PAD §7.4's secret-shape patterns, as a single regex per checklist line. */
const SECRET_PATH_PATTERNS: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /^\.env$/, label: "the real .env" },
  { pattern: /\.key$/, label: "a private key" },
  { pattern: /\.pem$/, label: "a pem bundle" },
  { pattern: /ssh-key/, label: "an ssh-key file" },
  { pattern: /\.db$/, label: "a database binary" },
];

describe("the .gitignore hygiene contract (session 47)", () => {
  it("ignores .env — the AUTH_SECRET carrier never reaches the index (the s46 session's named candidate, enforced)", () => {
    // The executable form: check-ignore consults the actual rule engine.
    // A dropped, commented-out, or reordered `.env` line fails HERE — at
    // the layer where the fix is a one-line .gitignore edit — not in a
    // leaked secret on a public push months later.
    expectIgnored(".env");
  });

  it("ignores the credential patterns — *.key, *.pem, and ssh-key.txt (the SSH-wrapper push surfaces)", () => {
    // The s28 push flow materializes operator keys as files; the wrapper
    // shreds them, but a pattern-line drop would make one careless
    // `git add .` a permanent record. Hypothetical paths are enough —
    // check-ignore evaluates the rule, not the disk.
    expectIgnored("s47-probe.key");
    expectIgnored("s47-probe.pem");
    expectIgnored("ssh-key.txt");
  });

  it("ignores the database binaries — db/custom.db, db/e2e.db, and the journal (the fresh-clone story)", () => {
    // `db/*.db` is gitignored by design: every fresh clone recreates the
    // database via `bun run db:push && bun run db:seed` (README quickstart).
    // A tracked binary would leak the demo workspace's user data and put a
    // stale artifact in every future clone.
    expectIgnored("db/custom.db");
    expectIgnored("db/e2e.db");
    expectIgnored("db/custom.db-journal");
  });

  it("tracks no secret-shaped path — the PAD §7.4 pre-commit checklist, automated", () => {
    // The guard check-ignore cannot provide: tracked files ignore
    // ignore-rules, so an already-staged secret (a `git add -N` slip, a
    // historical commit) stays silent at the pattern layer. This pin
    // catches the leak in the SAME session it lands — the checklist line
    // the operator ran manually "before doc-heavy commits," now a test.
    const leaked = trackedFiles.filter((f) =>
      SECRET_PATH_PATTERNS.some(({ pattern }) => pattern.test(f)),
    );
    expect(leaked, `secret-shaped tracked paths: ${leaked.join(", ")}`).toEqual(
      [],
    );
  });

  it("tracks .env.example and does NOT ignore it — the quickstart's `cp .env.example .env` source stays in every fresh clone", () => {
    // The inverse closure: pin 1 keeps the real .env OUT; this pin keeps
    // the example IN. An over-broad `.env*` ignore (a "cleanup" that
    // broadens the pattern) plus an index removal would strip the file
    // from fresh clones — the s46 env-contract pins would only fire in
    // CI, AFTER the file is already gone from the checkout. This pin
    // fails at the commit site instead.
    const trackedExample = git("ls-files", "--", ".env.example").trim();
    expect(trackedExample).toBe(".env.example");

    let exitCode = 0;
    try {
      git("check-ignore", ".env.example");
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 1;
    }
    // Non-zero exit = NOT ignored = the example stays addable/trackable.
    expect(exitCode, ".env.example must not match any ignore rule").not.toBe(0);
  });
});
