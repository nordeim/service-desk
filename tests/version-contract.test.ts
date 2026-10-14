import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 48 — the stack-version contract pins (P2: the README badge row +
// the PAD §2 tech-stack table — the repo's face, unpinned through 48
// sessions)
//
// Contract under test: the docs claim the stack's versions — README's badge
// row (Next.js 16.4 / React 19.3 / TypeScript 5.9 / Tailwind CSS 4.3 /
// Prisma 6.19, major.minor figures) and PAD §2's tech table (16.4.0 /
// 19.3.0 / 5.9.3 / 4.3.3 / 6.19.3 / 5.0.3 / 1.64.0, full figures). The
// ground truth, measured both ways: the INSTALLED versions
// (node_modules/<pkg>/package.json — what the gate actually runs on) and
// the bun.lock RESOLVED entries (what CI installs under --frozen-lockfile).
// All agree today — the clean-contract case (the s31 doctrine: an unpinned
// clean contract is a future regression with no alarm).
//
// The drift scenario: any `bun update`, lockfile refresh, or fresh range
// resolution (package.json says ^16.1.1 — the range HEAD is already three
// minors ahead of the floor, so the drift mechanism is LIVE) moves the
// installed stack while the badges/table stay — the repo's face claims a
// stack it no longer runs. The s45 ci-contract precedent already pins ONE
// lockfile entry (the tsx one); these pins close the whole documented
// stack surface the same way.
//
// Pin style: bidirectional (the s47 doctrine — both sides of each figure):
//   1. the documented-figures pin: every claimed figure equals the
//      INSTALLED version (PAD full figures; README badge major.minor
//      figures), with ≥1-match floors per surface so a dropped badge line
//      or PAD row fails loudly rather than silently un-claiming;
//   2. the lockfile-agreement pin: bun.lock carries the exact resolved
//      entry "pkg@version" for each documented package AND it equals the
//      installed version — the CI artifact and the local runtime agree
//      (what --frozen-lockfile installs is what the gate ran on).
//
// Deliberate scope: only the seven packages the docs CLAIM (badges + tech
// table). The transitive dependency tree (radix, lucide, …) is
// lockfile-governed and undocumented — pin the claims, not the universe
// (the documented-claim-without-a-pin doctrine). CLAUDE.md's major-only
// prose ("Next.js 16 App Router", "React 19", "Tailwind CSS v4", "Prisma
// 6") is satisfied by any minor of the claimed major and is left to the
// next session's shortlist.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
const pad = readFileSync(
  path.join(repoRoot, "Project_Architecture_Document.md"),
  "utf8",
);
const bunLock = readFileSync(path.join(repoRoot, "bun.lock"), "utf8");

/** The documented stack: package name → the surfaces that claim it. */
type StackEntry = {
  pkg: string;
  /** The README badge's label fragment (major.minor figure). */
  badge?: string;
  /** The PAD §2 row's leading cell fragment (full figure). */
  padRow: string;
};

const STACK: StackEntry[] = [
  { pkg: "next", badge: "Next.js-", padRow: "| Web framework | Next.js (App Router, `output: standalone`) |" },
  { pkg: "react", badge: "React-", padRow: "| UI runtime | React |" },
  { pkg: "typescript", badge: "TypeScript-", padRow: "| Language | TypeScript (strict) |" },
  { pkg: "tailwindcss", badge: "Tailwind_CSS-", padRow: "| Styling | Tailwind CSS (CSS-first `@theme inline`) |" },
  { pkg: "prisma", badge: "Prisma-", padRow: "| ORM | Prisma |" },
  { pkg: "vitest", padRow: "| Unit tests | Vitest |" },
  { pkg: "@playwright/test", padRow: "| E2E tests | Playwright (Chromium) |" },
];

/** The installed version of a package (what the gate actually runs on). */
function installedVersion(pkg: string): string {
  return JSON.parse(
    readFileSync(path.join(repoRoot, "node_modules", pkg, "package.json"), "utf8"),
  ).version as string;
}

/** major.minor of a semver figure (what the README badges claim). */
function majorMinor(version: string): string {
  const parts = version.split(".");
  return `${parts[0]}.${parts[1]}`;
}

describe("the stack-version contract (session 48)", () => {
  it("the documented figures match the INSTALLED stack — every README badge's major.minor and every PAD §2 row's full figure (the repo's face claims the stack it runs on)", () => {
    for (const { pkg, badge, padRow } of STACK) {
      const installed = installedVersion(pkg);

      // PAD side: the row exists and its version cell is the installed figure.
      const padMatches =
        pad.match(
          new RegExp(
            `^${padRow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (\\d+\\.\\d+\\.\\d+) \\|`,
            "m",
          ),
        ) ?? [];
      expect(
        padMatches.length,
        `PAD §2 must carry the ${pkg} row (a dropped tech-table row silently un-claims the stack surface)`,
      ).toBeGreaterThanOrEqual(1);
      expect(
        padMatches[0]?.split("|").at(-2)?.trim(),
        `PAD's ${pkg} row must claim the installed ${installed} — the doc and the stack move together`,
      ).toBe(installed);

      // README side (the badge-bearing five): the badge figure is the
      // installed major.minor.
      if (badge) {
        const badgeMatches =
          readme.match(
            new RegExp(
              `badge/${badge.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+\\.\\d+)-`,
            ),
          ) ?? [];
        expect(
          badgeMatches.length,
          `README's badge row must carry the ${pkg} badge (a dropped badge line silently un-claims the stack surface)`,
        ).toBeGreaterThanOrEqual(1);
        expect(
          badgeMatches[0]?.match(/(\d+\.\d+)/)?.[1],
          `README's ${pkg} badge must claim the installed major.minor ${majorMinor(installed)} (the installed is ${installed})`,
        ).toBe(majorMinor(installed));
      }
    }
  });

  it("the lockfile agrees with the installed stack — bun.lock carries the exact resolved entry for every documented package (what CI installs --frozen is what the gate ran on)", () => {
    // The s45 tsx-entry doctrine generalized: the resolved entry
    // "pkg@version" must exist in bun.lock AND equal the installed
    // version. A drifted lockfile (an entry at a different version than
    // the installed tree — the half-updated `bun update` state) fails
    // here, before CI installs a different stack than the docs claim.
    for (const { pkg } of STACK) {
      const installed = installedVersion(pkg);
      const entry = `"${pkg}@${installed}"`;
      expect(
        bunLock.includes(entry),
        `bun.lock must carry the resolved entry ${entry} (the installed tree and the CI artifact must agree)`,
      ).toBe(true);
    }
  });
});
