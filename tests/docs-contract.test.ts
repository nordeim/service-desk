import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 47 — the DEPLOYMENT.md claims pins (P2: the docs surface that
// never had a drift watch)
//
// Contract under test: docs/DEPLOYMENT.md is the operator-facing deployment
// guide — its numeric claims about the codebase's shape were written once
// (session-3 era) and NEVER re-measured: the s47 audit found two stale
// figures ("the 16 API route handlers" — the actual surface is 12 route
// modules, the 11 known routes of the s41 cross-check + the s33 catch-all;
// "30 E2E checks" for the smoke script — the actual canonical number is
// 121 steps, claimed consistently in README/AGENTS/PAD/SKILL). The guide
// drifted silently for 41 sessions of smoke growth because nothing pins it.
//
// The pins close BOTH sides of each claim:
//   1. the route-module claim: the FILESYSTEM count of route.ts modules
//      under src/app/api (an executable find — the ground truth) is 12,
//      AND DEPLOYMENT.md carries the "12 API route modules" figure. When a
//      13th route module lands, the count assertion fails, forcing the doc
//      and the pin to move TOGETHER — the doc can never silently claim a
//      stale figure again.
//   2. the smoke-claim: DEPLOYMENT.md's verification section claims "121
//      steps" — the canonical corpus number (README/AGENTS/PAD/SKILL all
//      claim it; the smoke re-prints its PASS count every session's gate).
//      The stale "30 E2E checks" form fails the pin.
//
// Pin style: line-anchored claim matching on the doc side (the s45/s46
// doctrine — a claim that drifted into a comment or a different phrasing
// must FAIL, never satisfy via a partial match), executable fs counting on
// the code side (the s43 code-shaped doctrine). The 121 itself stays a
// runtime property of the server-driven smoke script (re-verified live
// every session in the standing gate); the pin closes the DOC side of the
// contract — that is the honest split between a static pin and a runtime
// measure.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const deployment = readFileSync(
  path.join(repoRoot, "docs", "DEPLOYMENT.md"),
  "utf8",
);

/** The ground-truth count of API route modules (executable, not a claim). */
function countRouteModules(): number {
  // route.ts modules under src/app/api/** — the 11 known routes + the s33
  // catch-all = 12. Counted on the FILESYSTEM (what `next build` actually
  // compiles — the doc's claim is about the build surface, and a new route
  // module counts the moment it lands on disk, not after the commit): the
  // recursive readdir walk of the env-contract pattern, never git state.
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (entry === "route.ts") files.push(full);
    }
  };
  walk(path.join(repoRoot, "src", "app", "api"));
  return files.length;
}

const routeModuleCount = countRouteModules();

describe("the DEPLOYMENT.md claims contract (session 47)", () => {
  it("claims the real API route-module count — 12 modules on disk, 12 in the doc (the stale '16' can never return)", () => {
    // Code side: the executable ground truth. Doc side: the line-anchored
    // claim. Both must agree — a new route module forces the pair to move
    // together; a doc-only regression fails the second assertion.
    expect(routeModuleCount).toBe(12);

    const claims =
      deployment.match(/^.*the 12 API route modules.*$/gm) ?? [];
    expect(
      claims.length,
      "DEPLOYMENT.md must claim 'the 12 API route modules' (the s47 fix of the session-3-era '16' figure)",
    ).toBeGreaterThanOrEqual(1);

    // The stale figure, in its exact line shape, must be gone — a
    // regression back to "16 API route handlers" fails loudly.
    const stale =
      deployment.match(/^.*16 API route.*$/gm) ?? [];
    expect(stale).toEqual([]);
  });

  it("claims the canonical smoke step count — '121 steps', not the stale '30 E2E checks'", () => {
    // The corpus number: README ("API smoke script (121 steps)"), AGENTS,
    // PAD, and the SKILL project_state all claim 121; the smoke script
    // re-prints its PASS count in every session's gate run. The doc must
    // carry the same figure in its verification section.
    const smokeClaims = deployment.match(/^.*smoke-test\.sh.*121 steps.*$/gm) ?? [];
    expect(
      smokeClaims.length,
      "DEPLOYMENT.md's smoke-test.sh line must claim 121 steps (the canonical corpus number)",
    ).toBeGreaterThanOrEqual(1);

    // The stale session-3-era figure, in its exact shape, must be gone.
    const stale = deployment.match(/^.*30 E2E checks.*$/gm) ?? [];
    expect(stale).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Session 100 — the PAD §6.4 threat-model coherence pins (the
// security-claim prose contract: the threat-model rows held to the surfaces
// that ship them)
//
// Contract under test: the PAD's §6.4 Threat Model table makes SECURITY
// claims about shipped surfaces. Two of its rows were written at the
// session-1 docs generation and contradicted by later remediations — the
// code changed, the threat model was never re-read (the family skill §16
// line: "Threat model written in the PAD and re-read when the surface
// changes" — the surface changed at s14 and s19, the re-read never ran):
//
//   1. Malicious uploads: the row claimed "Content-Disposition: attachment
//      (never inline)" — but the attachment download route has shipped
//      INLINE since session 14 (the reference's CDN serves its files with
//      NO Content-Disposition, curl-verified; the disposition became inline
//      deliberately, E2E-pinned by the visual-parity download-disposition
//      test, with the closed accepted-MIME list (no text/html, no svg) +
//      the global nosniff as the safety case). The row also contradicted
//      AGENTS.md's own correct Session-14 record — an internal
//      doc-vs-doc disagreement, 86 sessions of drift.
//   2. Open redirect / CSRF surface: the row claimed "No redirect params
//      exist" — the pre-s19 state. Since session 19 the app implements the
//      reference's deep-link contract (/login?from_url=…) HARDENED with
//      the same-origin/open-redirect guard in src/lib/redirect.ts
//      (safeRedirectTarget), pinned at three layers (redirect.test.ts +
//      proxy-fromurl.test.ts + the auth E2E deep-link tests). 81 sessions
//      of drift.
//
// The pins close BOTH sides of each claim (the s47 two-sided form):
//   - the DOC side: each row, matched by its row label (a re-labeled or
//     deleted row fails the grammar floor loudly), must name the SHIPPED
//     property and must NOT carry the stale pre-remediation form;
//   - the CODE side: the surface the row describes must still ship the
//     property — so a future code change (a disposition flip, a guard
//     removal) bites the pin and forces the doc to move in lockstep.
// Either drift direction fails naming the row and the direction — the
// doc can never again silently claim a security property the code does
// not ship, and the code cannot silently drop one the doc promises.
// ---------------------------------------------------------------------------

const pad = readFileSync(
  path.join(repoRoot, "Project_Architecture_Document.md"),
  "utf8",
);

// The PAD's LIVE sections: everything before the §10 Known-Issues history
// (the s48 immutable-history doctrine — the corpus-count contract's own
// PAD_HISTORY_BOUNDARY form). Stale-claim sweeps run over THIS slice: a
// historical RESOLVED row may quote a pre-remediation value as the finding
// it records, but no live section may claim a property the code does not
// ship.
const PAD_HISTORY_BOUNDARY = "## 10. Known Issues";
const padHistoryIdx = pad.indexOf(PAD_HISTORY_BOUNDARY);
if (padHistoryIdx < 0) {
  throw new Error("the PAD must carry the §10 Known-Issues heading (the history boundary the live-doc slice depends on)");
}
const padLive = pad.slice(0, padHistoryIdx);

const attachmentRoute = readFileSync(
  path.join(
    repoRoot,
    "src",
    "app",
    "api",
    "tickets",
    "[id]",
    "attachments",
    "[attachmentId]",
    "route.ts",
  ),
  "utf8",
);

const redirectSeam = readFileSync(
  path.join(repoRoot, "src", "lib", "redirect.ts"),
  "utf8",
);

/** Extract a §6.4 threat-model row by its leading cell label. */
function threatRow(label: string): string {
  const lines = pad.split("\n");
  const rows = lines.filter(
    (l) => l.startsWith(`| ${label} `) || l.startsWith(`| ${label} |`),
  );
  if (rows.length === 0) {
    throw new Error(
      `the PAD §6.4 threat model must carry a row labeled '${label}' — a re-labeled or deleted row is a grammar failure, never a pass`,
    );
  }
  return rows.join("\n");
}

describe("the PAD §6.4 threat-model coherence pins (session 100)", () => {
  it("pin A: the Malicious-uploads row names the SHIPPED inline disposition (both surfaces — the stale 'attachment (never inline)' claim can never return, and a disposition flip without the doc bites)", () => {
    // Doc side: the row must name the inline disposition with its safety
    // case (the closed accepted list + nosniff)…
    const row = threatRow("Malicious uploads");
    expect(
      /Content-Disposition: inline/.test(row),
      "the PAD §6.4 Malicious-uploads row must name the shipped 'Content-Disposition: inline' (the s14 parity decision, E2E-pinned — the code-wins rule applied to a security claim)",
    ).toBe(true);

    // …and must NOT carry the stale session-1 form — checked across the
    // PAD's LIVE sections (the s48 doctrine: the §10 Known-Issues history
    // rows are immutable records that legitimately quote pre-remediation
    // values; the Session-14 RESOLVED row's own "Content-Disposition:
    // attachment" citation is the historical finding text, not a live
    // claim). A live-section regression back to the stale claim fails.
    const staleNeverInline = padLive.match(/never inline/g) ?? [];
    expect(
      staleNeverInline,
      "the stale 'never inline' claim (born at the session-1 docs, false since s14) must be gone from the PAD's live sections",
    ).toEqual([]);
    const staleAttachmentDisposition =
      padLive.match(/Content-Disposition: attachment/g) ?? [];
    expect(
      staleAttachmentDisposition,
      "the PAD's live sections must not claim 'Content-Disposition: attachment' for the attachment route (the shipped value is inline, E2E-pinned by the visual-parity download-disposition test)",
    ).toEqual([]);

    // Code side: the route the row describes must still ship the inline
    // disposition — a future flip without the doc fails here, forcing
    // lockstep.
    expect(
      /`inline; filename="/.test(attachmentRoute),
      "the attachment download route must ship the inline disposition the PAD row names — a disposition change must move the doc in the same commit",
    ).toBe(true);
  });

  it("pin B: the Open-redirect row names the SHIPPED guarded from_url surface (both surfaces — the stale 'No redirect params exist' claim can never return, and removing the guard bites)", () => {
    // Doc side: the row must name the guarded from_url deep-link contract.
    const row = threatRow("Open redirect / CSRF surface");
    expect(
      /from_url/.test(row),
      "the PAD §6.4 Open-redirect row must name the s19 from_url deep-link contract (the reference's measured contract, implemented deliberately)",
    ).toBe(true);
    expect(
      /same-origin/.test(row) || /open-redirect guard/.test(row),
      "the PAD §6.4 Open-redirect row must name the same-origin/open-redirect guard (the s19 hardening in src/lib/redirect.ts)",
    ).toBe(true);

    // …and the stale pre-s19 form must be gone from the PAD's live
    // sections (the s48 history-slice doctrine above).
    const staleNoRedirectParams =
      padLive.match(/No redirect params exist/g) ?? [];
    expect(
      staleNoRedirectParams,
      "the stale 'No redirect params exist' claim (born at the session-1 docs, false since s19 — the guarded from_url param is the shipped surface) must be gone from the PAD",
    ).toEqual([]);

    // Code side: the guard seam the row names must still exist.
    expect(
      /export function safeRedirectTarget/.test(redirectSeam),
      "src/lib/redirect.ts must still export safeRedirectTarget (the open-redirect guard the PAD row names) — removing the guard must move the doc in the same commit",
    ).toBe(true);
  });
});
