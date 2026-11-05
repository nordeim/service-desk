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

// ---------------------------------------------------------------------------
// Session 104 — the SKILL color-token coherence pin (pin D: the
// stale-verified-claim class — a doc's "verified against the file" claim
// whose verification outlived the file's own measured change)
//
// Contract under test: the service-desk_SKILL.md — the doc whose Purpose
// line claims "a single-source-of-truth reference for any coding agent
// working on this codebase" — carried TWELVE stale hex values across its
// two token-claim sites (§4.1's Token-architecture excerpt + §19's Color
// Reference table) while §19's own header said "verified against the
// file". The dating (git history): the stale slate-family values
// (#f8fafc/#0f172a/#f1f5f9/#e2e8f0/#64748b…) date from the session-2-era
// SKILL; the session-9 token diff (the "stock shadcn token block" commit)
// rewrote src/app/globals.css to the reference's measured stock-zinc
// family AND updated the doc surfaces where the flipped tokens render
// (CLAUDE's Tailwind section, README's Design System table, the PAD §5.2,
// and the SKILL's own --primary/--ring rows) — but the SKILL's excerpt
// and the render-nowhere rows (the file's own comment: "the remaining
// stock flips render nowhere today — kept in stock parity so a future
// component cannot silently reintroduce the divergence") kept the
// pre-s9 slate values. The drift stood 95 sessions (s9→s104) while every
// gate stayed green: no pin family reads doc-side color claims against
// the code-side tokens.
//
// The teeth: an agent theming a new component from the
// single-source-of-truth doc would reintroduce exactly the
// slate-vs-zinc divergence the s9 closure deliberately foreclosed.
//
// Pin style: bidirectional doc↔code coherence (the s100 two-sided form):
//   1. doc→code: every `--token: #hex` claim the SKILL makes (in §4.1's
//      fenced excerpt and §19's table) must equal the globals.css :root
//      light value for that token — either drift direction bites, forcing
//      same-commit lockstep;
//   2. the dropped-site floor: the load-bearing flipped rows (the s9
//      token-diff set the §19 table documents) must still exist in the
//      table — deleting the rows to dodge the coherence check fails
//      loudly (the dropped-site doctrine).
//
// Deliberate scope: the SKILL's table is SELECTIVE (it documents a subset
// of the file's tokens — popover/secondary-foreground/sidebar-accent etc.
// render nowhere and are not documented); the pin holds coherence for
// every claim the doc DOES make, never enumeration completeness of the
// file (the s48 lesson: pin the claims, not the universe). The dark
// block is out of scope by the table's own header ("light palette").
// ---------------------------------------------------------------------------

describe("the SKILL color-token coherence contract (session 104)", () => {
  /** Parse the globals.css :root (light) block into a token→hex map. */
  function globalsRootLight(): Map<string, string> {
    const css = readFileSync(path.join(repoRoot, "src", "app", "globals.css"), "utf8");
    const start = css.indexOf(":root {");
    if (start < 0) throw new Error("globals.css must carry the :root block");
    const rest = css.slice(start + ":root {".length);
    const end = rest.indexOf("}");
    if (end < 0) throw new Error("the :root block must close");
    const block = rest.slice(0, end);
    const map = new Map<string, string>();
    for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      map.set(m[1], m[2].toLowerCase());
    }
    if (map.size < 20) {
      throw new Error(`the :root block must carry at least 20 literal-hex tokens — found ${map.size} (the literal-hex rule is load-bearing: no var() chains, no oklch)`);
    }
    return map;
  }

  /**
   * Extract the SKILL's token→hex claims as PER-SITE tuples (a site that
   * re-plants a stale value must bite even when the other site is
   * correct — a Map keyed by token would let §19's claim shadow §4.1's
   * and the shadowed stale value would pass silently, the exact
   * lenient-read trap the pin exists to close). Two site shapes:
   *   §4.1's fenced excerpt: `--token: #hex;` pairs;
   *   §19's table rows: | `--token` | `#hex` | … (compound rows carry a
   *   second `--token: #hex` inline in the value cell).
   */
  function skillTokenClaims(): { site: string; token: string; hex: string }[] {
    const skill = readFileSync(path.join(repoRoot, "service-desk_SKILL.md"), "utf8");
    const claims: { site: string; token: string; hex: string }[] = [];
    // §4.1: the Token-architecture fenced block (§4.1 through the end of
    // its first fence — the excerpt ends before §4.2).
    const s41Start = skill.indexOf("### 4.1 Token architecture");
    if (s41Start < 0) throw new Error("the SKILL must carry the §4.1 Token architecture heading (a dropped section fails loudly)");
    const s41End = skill.indexOf("### 4.2", s41Start);
    const s41 = skill.slice(s41Start, s41End > s41Start ? s41End : s41Start + 4000);
    for (const m of s41.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      claims.push({ site: "§4.1", token: m[1], hex: m[2].toLowerCase() });
    }
    // §19: the Color Reference table (the heading through the next ## —
    // S105: the LIGHT-TABLE span ends at the dark-palette marker instead:
    // the §19 extension adds a dark subsection whose rows are DARK-site
    // claims (read by pin E-dark, never here — a dark row checked against
    // the :root light map would RED forever, the site-shadowing trap the
    // per-SITE tuple form exists to prevent).
    const s19Start = skill.indexOf("## 19. Color Reference");
    if (s19Start < 0) throw new Error("the SKILL must carry the §19 Color Reference heading (a dropped section fails loudly)");
    const darkMarkerIdx = skill.indexOf("\n**The dark palette", s19Start);
    const s19NextHeading = skill.indexOf("\n## ", s19Start + 1);
    const s19End = darkMarkerIdx > s19Start ? darkMarkerIdx : s19NextHeading;
    const s19 = skill.slice(s19Start, s19End > s19Start ? s19End : s19Start + 6000);
    for (const line of s19.split("\n")) {
      if (!line.startsWith("| `--")) continue;
      // Compound rows: every `--name` is followed (before the next
      // `--name`) by the first #hex in between.
      const parts = line.split(/(?=`--)/);
      for (const part of parts) {
        const tok = /^`?--([a-z0-9-]+)/.exec(part.replace(/^\|\s*/, ""));
        if (!tok) continue;
        const hex = /#([0-9a-fA-F]{6})/.exec(part);
        if (hex) claims.push({ site: "§19", token: tok[1], hex: `#${hex[1].toLowerCase()}` });
      }
    }
    if (claims.length < 10) {
      throw new Error(`the SKILL's token-claim sites must carry at least 10 claims — found ${claims.length} (§4.1 + §19 are the single-source-of-truth doc's color surface)`);
    }
    return claims;
  }

  it("pin D: every SKILL color-token claim equals the globals.css :root value — the twelve stale slate-family values (the 95-session drift the §19 header's own 'verified against the file' claim laundered) can never return", () => {
    const file = globalsRootLight();
    const claims = skillTokenClaims();
    const offenders: string[] = [];
    for (const { site, token, hex } of claims) {
      const actual = file.get(token);
      if (actual === undefined) {
        offenders.push(`--${token} (${hex}, ${site}): no such token in globals.css :root`);
      } else if (actual !== hex) {
        offenders.push(`--${token} (${site}): SKILL claims ${hex}, globals.css ships ${actual}`);
      }
    }
    expect(
      offenders,
      "every color-token claim in the SKILL (§4.1's excerpt + §19's table) must equal the shipped globals.css :root value — the doc's 'verified against the file' header is a claim, and a claim that outlives the file's own change is the s9→s104 drift class (an agent theming from the single-source-of-truth doc would reintroduce the slate-vs-zinc divergence the s9 closure foreclosed)",
    ).toEqual([]);
  });

  it("pin D floor: the SKILL §19 table still documents the s9-flipped load-bearing rows — deleting the rows to dodge the coherence check fails loudly (the dropped-site doctrine)", () => {
    const claims = skillTokenClaims();
    // The s9 token-diff set the §19 table documents: the tokens whose
    // stock-zinc values the session-9 diff established (and whose stale
    // slate forms the s104 fix swept).
    const loadBearing = [
      "background",
      "foreground",
      "card-foreground",
      "sidebar-foreground",
      "primary-foreground",
      "secondary",
      "muted",
      "muted-foreground",
      "accent",
      "border",
    ];
    const s19Tokens = new Set(claims.filter((c) => c.site === "§19").map((c) => c.token));
    const missing = loadBearing.filter((t) => !s19Tokens.has(t));
    expect(
      missing,
      "the SKILL §19 Color Reference table must keep documenting the s9-flipped load-bearing tokens — a dropped row shrinks the doc's color surface silently (the dropped-site doctrine: the coherence pin guards the rows that EXIST, this floor guards that they exist)",
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Session 105 — the color-reference COMPLETENESS + dark-palette coherence
// pins (the P1: the unmeasured-surface class) + the muted render-claim pin
// (the P2: the stale inert-set claim)
//
// Contract under test — the P1: the SKILL §19 is titled "Color Reference
// (Complete)" while its light table documented 24 of the 35 :root custom
// properties (eleven undocumented + --radius absent) and the ENTIRE
// 27-token .dark palette was undocumented (the SKILL carried no dark mention
// at all). The .dark block itself is the session-1 custom navy/cyan family —
// the s9 token diff was :root-scoped BY DESIGN, and its one dark decision
// ("the .dark block stays ours — documented divergence, the reference has no
// dark mode") was recorded ONLY in the s9 plan file: the same divergence
// class the s9 diff swept from the light block stood in the dark block of
// the SAME FILE for 104 sessions with every gate green, while the reference's
// own CSS ships the stock-zinc shadcn dark block (measured live at s105:
// 31 HSL tokens incl. the chart family + the --sidebar-background naming).
// A completeness claim is a claim like any other (the lesson-158 form one
// level deeper): the coverage must be measured, and a set-equality pin holds
// it.
//
// The P2: globals.css's own comment claimed the inert stock set
// "(secondary/muted/sidebar-*) render nowhere today" — FALSE for the muted
// family: --muted-foreground renders as the stock form placeholders' color
// (placeholder:text-muted-foreground in the shared Input/Textarea since the
// initial commit — measured live rgb(115,115,115) on the mytickets/submitticket
// surfaces; the auth pages override with placeholder:text-slate-600). The
// s9 inert-set classification was wrong at birth for this family — the class
// list was never checked for a render surface. The pin holds the claim at
// BOTH surfaces: the doc names the placeholder, and the shared Input ships
// the class (the s100 two-surface form).
// ---------------------------------------------------------------------------

describe("the SKILL color-reference completeness + dark-palette contract (session 105)", () => {
  /** Parse the globals.css :root block into a token→raw-value map (EVERY custom property, any value form — --radius is a rem literal). */
  function globalsRootAll(): Map<string, string> {
    const css = readFileSync(path.join(repoRoot, "src", "app", "globals.css"), "utf8");
    const start = css.indexOf(":root {");
    if (start < 0) throw new Error("globals.css must carry the :root block");
    const rest = css.slice(start + ":root {".length);
    const end = rest.indexOf("}");
    if (end < 0) throw new Error("the :root block must close");
    const map = new Map<string, string>();
    for (const m of rest.slice(0, end).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
      map.set(m[1], m[2].trim());
    }
    if (map.size < 30) {
      throw new Error(`the :root block must carry at least 30 custom properties — found ${map.size} (the literal-hex palette + the --radius documentation token)`);
    }
    return map;
  }

  /** Parse the globals.css .dark block into a token→hex map. */
  function globalsDark(): Map<string, string> {
    const css = readFileSync(path.join(repoRoot, "src", "app", "globals.css"), "utf8");
    const start = css.indexOf("\n.dark {");
    if (start < 0) throw new Error("globals.css must carry the .dark block");
    const rest = css.slice(start + "\n.dark {".length);
    const end = rest.indexOf("}");
    if (end < 0) throw new Error("the .dark block must close");
    const map = new Map<string, string>();
    for (const m of rest.slice(0, end).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      map.set(m[1], m[2].toLowerCase());
    }
    if (map.size < 20) {
      throw new Error(`the .dark block must carry at least 20 literal-hex tokens — found ${map.size}`);
    }
    return map;
  }

  /**
   * The §19 section split at the dark-palette marker (the s105 extension
   * shape): the LIGHT span (the heading through the marker) and the DARK
   * span (the marker through the next ## heading).
   */
  function s19Spans(): { light: string; dark: string } {
    const skill = readFileSync(path.join(repoRoot, "service-desk_SKILL.md"), "utf8");
    const s19Start = skill.indexOf("## 19. Color Reference");
    if (s19Start < 0) throw new Error("the SKILL must carry the §19 Color Reference heading");
    const marker = "\n**The dark palette";
    const markerIdx = skill.indexOf(marker, s19Start);
    if (markerIdx < 0) {
      throw new Error("the SKILL §19 must carry the dark-palette subsection (the '**The dark palette' marker) — the s105 completeness closure requires the dark family documented (the dropped-site doctrine)");
    }
    const nextHeading = skill.indexOf("\n## ", markerIdx);
    return {
      light: skill.slice(s19Start, markerIdx),
      dark: skill.slice(markerIdx, nextHeading > markerIdx ? nextHeading : markerIdx + 6000),
    };
  }

  it("pin E: the §19 light table is COMPLETE — every :root custom property documented, no phantoms (the '(Complete)' title held to its word; the eleven-token gap + the missing --radius row can never return)", () => {
    const root = globalsRootAll();
    const rootTokens = new Set([...root.keys()]);
    // every backticked `--token` mention in the light span (the table rows'
    // name cells + the compound value cells like `--muted-foreground: #737373`)
    const documented = new Set<string>();
    for (const m of s19Spans().light.matchAll(/`(--[a-z0-9-]+)[^`]*`/g)) {
      documented.add(m[1].slice(2));
    }
    expect(
      documented.size,
      "the §19 light table must document a substantial token set (a shrunk table fails loudly before the set diff)",
    ).toBeGreaterThanOrEqual(20);
    const missing = [...rootTokens].filter((t) => !documented.has(t));
    const phantoms = [...documented].filter((t) => !rootTokens.has(t));
    expect(
      { missing, phantoms },
      "the §19 light table must document EVERY :root custom property and NO phantom tokens — the section's own title claims '(Complete)': a completeness claim is a claim like any other (the s105 finding: eleven tokens + --radius undocumented behind the title for 104 sessions; an agent theming from the doc cannot see the tokens the table omits)",
    ).toEqual({ missing: [], phantoms: [] });
  });

  it("pin E-dark: the §19 dark subsection documents every .dark token at the shipped literal — the s9-recorded divergence surfaced and pinned (a stale dark row bites even when the light table is correct — the per-SITE form)", () => {
    const dark = globalsDark();
    const span = s19Spans().dark;
    // the same row grammar as pin D's §19 parser (compound rows carry a
    // second `--token: #hex` inline in the value cell)
    const claims: { token: string; hex: string }[] = [];
    for (const line of span.split("\n")) {
      if (!line.startsWith("| `--")) continue;
      const parts = line.split(/(?=`--)/);
      for (const part of parts) {
        const tok = /^`?--([a-z0-9-]+)/.exec(part.replace(/^\|\s*/, ""));
        if (!tok) continue;
        const hex = /#([0-9a-fA-F]{6})/.exec(part);
        if (hex) claims.push({ token: tok[1], hex: `#${hex[1].toLowerCase()}` });
      }
    }
    expect(
      claims.length,
      "the §19 dark subsection must document the .dark family's values (a table without value claims is prose, not a reference)",
    ).toBeGreaterThanOrEqual(20);
    const offenders: string[] = [];
    const claimed = new Set(claims.map((c) => c.token));
    for (const [token, hex] of dark) {
      if (!claimed.has(token)) {
        offenders.push(`--${token}: documented NOWHERE in the dark subsection (ships ${hex})`);
      }
    }
    for (const { token, hex } of claims) {
      const actual = dark.get(token);
      if (actual === undefined) {
        offenders.push(`--${token} (${hex}): no such token in globals.css .dark`);
      } else if (actual !== hex) {
        offenders.push(`--${token}: SKILL claims ${hex}, globals.css .dark ships ${actual}`);
      }
    }
    expect(
      offenders,
      "every §19 dark-subsection claim must equal the shipped globals.css .dark literal, and every .dark token must be documented — the dark family is the s9-recorded divergence ('the .dark block stays ours'), and the s105 closure surfaces + pins it: a future dark-mode toggle activates THIS family (the reference's own CSS ships the stock-zinc dark block — measured live s105), so the doc and the file must move together",
    ).toEqual([]);
  });

  it("pin P2: the muted-foreground render claim is coherent at BOTH surfaces — the §19 row names the placeholder surface AND the shared Input ships the class (the stale 'renders nowhere' inert-set claim can never return)", () => {
    // Doc side: the §19 muted row must name the placeholder render surface.
    const row = s19Spans().light
      .split("\n")
      .find((l) => l.startsWith("| `--muted") || l.startsWith("| `--muted-foreground"));
    expect(
      row,
      "the §19 light table must carry the --muted/--muted-foreground row (the dropped-site doctrine)",
    ).toBeTruthy();
    expect(
      row as string,
      "the §19 muted row must NAME the placeholder render surface — --muted-foreground renders as the stock form placeholders' color (placeholder:text-muted-foreground, measured rgb(115,115,115) on the mytickets/submitticket surfaces; the auth pages override with slate-600): the s105 P2 closed the 'renders nowhere' claim that was wrong at birth (the class list was never checked for a render surface)",
    ).toMatch(/placeholder/i);
    // Code side: the shared Input must ship the class (the render mechanism
    // the row names — removing the class breaks the claim's other surface).
    const input = readFileSync(path.join(repoRoot, "src", "components", "ui", "input.tsx"), "utf8");
    expect(
      input.includes("placeholder:text-muted-foreground"),
      "src/components/ui/input.tsx must carry placeholder:text-muted-foreground — the §19 row's named render mechanism (a class removal silently invalidates the doc's render claim, the s100 two-surface form)",
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Session 106 — the sidebar-panel + PAD-inline-figure coherence pins
// (the wrong-at-birth class: the desktop sidebar's inner structure shipped
// mangled at the initial commit — the stock/reference panel classes
// (`flex h-full w-full flex-col bg-sidebar`) replaced by a bare
// `h-full flex flex-col` gap div — and stood 105 sessions with every gate
// green: the background face (the page gradient showing through the
// transparent panel where the reference renders its flat #fafafa), the
// geometry face (the content-sized 299.625px column overflowing the 256px
// container — the nav buttons crossing the border by 24px), and the
// interaction face (elementFromPoint beyond the border hitting sidebar
// group-content divs) were all invisible to every pin family: no gate read
// the panel background, the panel width, or the button bounds.
//
// Pin style: the s100 two-surface form (doc claim ↔ shipped code) for the
// panel; the inline-figure live-value form for the PAD §7.1 rows; the
// named-file floor form for the PAD §3.2 tree.
// ---------------------------------------------------------------------------

const sidebarSource = readFileSync(
  path.join(repoRoot, "src", "components", "ui", "sidebar.tsx"),
  "utf8",
);
const skillDoc = readFileSync(path.join(repoRoot, "service-desk_SKILL.md"), "utf8");

describe("the sidebar-panel + PAD coherence pins (session 106)", () => {
  it("pin F: the SKILL §4.3 sidebar-panel row is coherent at BOTH surfaces — the row names the #fafafa/255px panel AND the shipped gap div carries the panel classes (the wrong-at-birth mangled structure can never return)", () => {
    // Doc side: the §4.3 parity table must carry the sidebar panel row
    // naming the reference's measured panel (the flat #fafafa + the 255px
    // width) — and its Where-pinned cell must name a REAL standing pin,
    // never the session-era "computed-style probe" that read nothing.
    const row = skillDoc
      .split("\n")
      .find((l) => l.startsWith("| Sidebar panel background"));
    expect(
      row,
      "the SKILL §4.3 parity table must carry the 'Sidebar panel background' row (the dropped-site doctrine — the row is the doc surface of the s106 closure)",
    ).toBeTruthy();
    expect(
      row as string,
      "the §4.3 sidebar row must name the flat #fafafa panel + the 255px width (the reference's own live-measured panel: rgb(250,250,250) uniform, w-full of the 256px container minus the 1px border)",
    ).toMatch(/#fafafa/);
    expect(
      row as string,
      "the §4.3 sidebar row must name the 255px panel width (the reference's measured geometry)",
    ).toMatch(/255px/);
    expect(
      row as string,
      "the §4.3 sidebar row's Where-pinned cell must name the session-106 E2E pins (the visual-parity session-106 block) — the pre-fix 'computed-style probe' named a session-era probe that read nothing, the s104 false-verification class",
    ).toMatch(/session 106|s106/i);

    // Code side: the shipped gap div must carry the panel classes — the
    // stock/reference `w-full` (the width constraint: without it the flex
    // column sizes content-driven at its min-content and overflows the
    // 256px container — the measured 299.625px form) + `bg-sidebar` (the
    // flat #fafafa panel over the app-wide gradient wrapper).
    const gapLine = sidebarSource
      .split("\n")
      .find((l) => l.includes('data-sidebar="gap"'));
    expect(
      gapLine,
      "sidebar.tsx's desktop branch must carry the data-sidebar=\"gap\" div (the panel carrier after the s106 fix)",
    ).toBeTruthy();
    expect(
      (gapLine as string).includes("w-full"),
      "the gap div must carry w-full — the panel's width constraint (the pre-fix bare h-full flex flex-col let the column size content-driven at 299.625px, overflowing the 256px container and pushing the nav buttons 24px past the border)",
    ).toBe(true);
    expect(
      (gapLine as string).includes("bg-sidebar"),
      "the gap div must carry bg-sidebar — the flat #fafafa panel (the pre-fix transparent form let the app-wide page gradient show through where the reference renders its flat panel)",
    ).toBe(true);
  });

  it("pin G: the PAD §7.1's corpus-count + plan-status row descriptions carry the LIVE figures — the family floors (10/12/3/5) + the live plan corpus floor, the stale inline figures can never return", () => {
    // The live values the rows must name (read from the shipped constants,
    // never re-hardcoded here twice): the corpus-count family floors and
    // the plan-status corpus floor.
    const corpusCount = readFileSync(
      path.join(repoRoot, "tests", "corpus-count-contract.test.ts"),
      "utf8",
    );
    const planStatus = readFileSync(
      path.join(repoRoot, "tests", "plan-status-contract.test.ts"),
      "utf8",
    );
    const unitFloor = Number(
      corpusCount.match(/expectConsistent\("the unit count", values, (\d+)\)/)?.[1],
    );
    const e2eFloor = Number(
      corpusCount.match(/expectConsistent\("the E2E count", values, (\d+)\)/)?.[1],
    );
    const parityFloor = Number(
      corpusCount.match(/expectConsistent\("the parity count", values, (\d+)\)/)?.[1],
    );
    const smokeFloor = Number(
      corpusCount.match(/expectConsistent\("the smoke count", values, (\d+)\)/)?.[1],
    );
    const planFloor = Number(
      planStatus.match(/const PLAN_CORPUS_FLOOR = (\d+);/)?.[1],
    );
    expect(
      [unitFloor, e2eFloor, parityFloor, smokeFloor, planFloor].every((n) => n > 0),
      "the live floor constants must resolve (a renamed constant is a grammar failure, never a pass)",
    ).toBe(true);

    // Doc side: the PAD §7.1 corpus-count row's description must name the
    // live family floors — the s55/s92-era stale figures ("9 sites"/"10"/
    // "4", the row's own smoky sibling at row 502 saying "FIFTH live claim
    // site") were the unmeasured prose surface.
    const corpusRow = padLive
      .split("\n")
      .find((l) => l.includes("s48 corpus-count consistency pins"));
    expect(
      corpusRow,
      "the PAD §7.1 must carry the s48 corpus-count row (the dropped-site doctrine)",
    ).toBeTruthy();
    expect(
      corpusRow as string,
      `the corpus-count row's description must name the LIVE family floors: unit (${unitFloor} sites) / e2e (${e2eFloor}) / parity (${parityFloor}) / smoke-steps (${smokeFloor}) — the stale '9 sites'/'10'/'4' inline figures contradicted both the shipped constants and the PAD's own row 502`,
    ).toMatch(new RegExp(`unit \\(${unitFloor} sites\\) / e2e \\(${e2eFloor}\\) / parity \\(${parityFloor}\\) / smoke-steps \\(${smokeFloor}\\)`));

    // Doc side: the PAD §7.1 plan-status row's description must name the
    // live corpus floor — the s55-era "53" stood through 49 corpus moves.
    const planRow = padLive
      .split("\n")
      .find((l) => l.includes("s55 plan-status pins"));
    expect(
      planRow,
      "the PAD §7.1 must carry the s55 plan-status row (the dropped-site doctrine)",
    ).toBeTruthy();
    expect(
      planRow as string,
      `the plan-status row's description must name the LIVE corpus floor (${planFloor}) — the stale 'corpus floor 53' stood 49 corpus moves un-read`,
    ).toMatch(new RegExp(`corpus floor ${planFloor}`));
  });

  it("pin H: the PAD §3.2 directory tree names the load-bearing surfaces — the s33 catch-all route, the head-facing assets, the ticket-details-view, the three src/lib seams, and the e2e census specs (the stale session-1 snapshot can never return)", () => {
    // The §3.2 tree slice (the code block between the §3.2 heading and the
    // next ### heading).
    const treeStart = padLive.indexOf("### 3.2 Annotated Directory Structure");
    const treeEnd = padLive.indexOf("###", treeStart + 10);
    expect(treeStart, "the PAD must carry the §3.2 heading").toBeGreaterThanOrEqual(0);
    const tree = padLive.slice(treeStart, treeEnd);

    // The load-bearing entries the tree must name — each one pinned
    // elsewhere in the corpus (the §6.1/§7.1 rows lean on them), each one
    // missing from the session-1 snapshot.
    const mustName: { entry: string; why: string }[] = [
      { entry: "[[...path]]/route.ts", why: "the s33 catch-all 404 contract — the PAD's own §6.1/§7.1 rows lean on it" },
      { entry: "sitemap.ts", why: "the head-facing SEO asset (route-head pinned)" },
      { entry: "robots.ts", why: "the head-facing SEO asset" },
      { entry: "manifest.json/route.ts", why: "the PWA manifest surface (s11)" },
      { entry: "not-found.tsx", why: "the designed 404 page (s4)" },
      { entry: "ticket-details-view.tsx", why: "the detail surface's client view" },
      { entry: "api-methods.ts", why: "the src/lib seam (pinned by api-methods.test.ts)" },
      { entry: "redirect.ts", why: "the src/lib seam (the s100 pin B surface)" },
      { entry: "route-head.ts", why: "the src/lib seam (route-head.test.ts)" },
      { entry: "a11y.spec.ts", why: "the e2e census spec (s89)" },
      { entry: "touch-floor.spec.ts", why: "the e2e census spec (s90)" },
      { entry: "visible-focus.spec.ts", why: "the e2e census spec (s91)" },
      { entry: "visual-parity.spec.ts", why: "the e2e parity spec (165→167 tests)" },
    ];
    const missing = mustName.filter(({ entry }) => !tree.includes(entry)).map(({ entry, why }) => `${entry} (${why})`);
    expect(
      missing,
      "the PAD §3.2 tree must name every load-bearing surface — the session-1 snapshot missed the s33 catch-all route, the head-facing assets, the census specs, and the pinned src/lib seams while §7.1 correctly tabulated them (the SIZE/ENUMERATION shape swept by no pin — the s106 P2b closure)",
    ).toEqual([]);

    // The tree must also name the CURRENT structure shape, not the
    // session-1 4-file listing: the standing check-*.py helpers the PAD
    // itself cites elsewhere.
    expect(
      tree.includes("check-worklog.py") || /check-\*\.py|check-\{worklog/.test(tree),
      "the §3.2 scripts/ block must name the standing check-*.py helpers (the 881-file scripts/ surface — the session-1 snapshot named 4 files)",
    ).toBe(true);
  });
});

describe("the grammar-orphan coherence pins (session 107)", () => {
  it("pin I: the header-prose session figure is coherent — the SKILL Purpose line's 'N-session remediation ledger' names the LIVE closed-out session count read from the plan-status contract (the lesson-148 'likeliest grammar gap' class: a prose session figure no pin reads drifted at nobody's command)", () => {
    // S107 (the P1b find, the s94/s104 grammar-orphan genus): the SKILL's
    // line-17 Purpose line — "…parity contract, and lesson learned across
    // the N-session remediation ledger" — carried "104" through the s105
    // and s106 sessions: NO pin anywhere reads a prose session count (the
    // corpus-count families read test counts; the doc-enumeration pins
    // read file existence), so the figure drifted at nobody's command
    // while the SKILL's own frontmatter description said "session-106" —
    // two figures disagreeing inside ONE file. The ground truth is read
    // LIVE from the plan-status contract's CURRENT_SESSION (never
    // re-hardcoded here twice): the closed-out ledger count is
    // CURRENT_SESSION − 1 (the running session not yet in the ledger).
    const planStatus = readFileSync(
      path.join(repoRoot, "tests", "plan-status-contract.test.ts"),
      "utf8",
    );
    const liveSession = Number(
      planStatus.match(/const CURRENT_SESSION = (\d+);/)?.[1],
    );
    expect(
      liveSession > 0,
      "the live CURRENT_SESSION constant must resolve (a renamed constant is a grammar failure, never a pass)",
    ).toBe(true);
    const closedOut = liveSession - 1;

    // Doc side: the Purpose line must name the live count.
    const purposeLine = skillDoc
      .split("\n")
      .find((l) => l.includes("-session remediation ledger"));
    expect(
      purposeLine,
      "the SKILL must carry the Purpose line's remediation-ledger figure (the dropped-site doctrine — deleting the line to dodge the coherence check fails loudly)",
    ).toBeTruthy();
    const figure = /across the (\d{2,4})-session remediation ledger/.exec(
      purposeLine as string,
    )?.[1];
    expect(
      figure,
      "the Purpose line's session figure must be present in the 'across the N-session remediation ledger' form",
    ).toBeTruthy();
    expect(
      Number(figure),
      `the Purpose line's session figure must name the LIVE closed-out session count (${closedOut} — read from the plan-status CURRENT_SESSION, never re-hardcoded): the stale '104' stood through the s105 + s106 sessions at nobody's command`,
    ).toBe(closedOut);

    // The second surface: the frontmatter description's session claim —
    // a DIFFERENT-by-design figure from the Purpose line's ledger count:
    // the description names the RUNNING session (the distilling session —
    // "Distilled through the session-N remediation", bumped every
    // session's docs-alignment), the Purpose line names the closed-out
    // ledger (N−1). Both are held LIVE: the description == CURRENT_SESSION
    // at every CI-visible commit state (the paired bump and the
    // description bump land in the same session's commits).
    const descriptionSession = /Distilled through the session-(\d+) remediation/.exec(
      skillDoc,
    )?.[1];
    expect(
      descriptionSession,
      "the SKILL description must carry the 'Distilled through the session-N remediation' form",
    ).toBeTruthy();
    expect(
      Number(descriptionSession),
      `the SKILL description's session figure must name the RUNNING session (${liveSession}) while the Purpose line names the closed-out ledger (${closedOut}) — two LIVE-read figures, each held to its own convention; a description figure below the running session is a stale distillation claim`,
    ).toBe(liveSession);
  });

  it("pin I-b: the README E2E-notes line's scope label names the live spec scope — the 'session-2 through session-18' label over a spec that now carries the s103 + s106 blocks can never return (the same grammar-orphan genus, the scope-label face)", () => {
    // S107 (the P2a find): the same README line that carried the stale
    // (164 tests) figure — its scope label "pins the session-2 through
    // session-18 remediation contracts" names a spec that now carries the
    // s103 label-alignment block + the s106 sidebar-panel block (the spec
    // has grown twice since the label was written; the CLAUDE parallel
    // text names the s103 addition). The live scope is read from the
    // corpus-count family's own parity figure era: the spec's block set
    // spans sessions 2–106.
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
    const notesLine = readme
      .split("\n")
      .find((l) => l.includes("visual-parity.spec.ts` ("));
    expect(
      notesLine,
      "the README must carry the E2E-notes visual-parity line (the dropped-site doctrine)",
    ).toBeTruthy();
    expect(
      (notesLine as string).includes("session-2 through session-106"),
      "the E2E-notes scope label must name the live spec scope (session-2 through session-106 — the s103 + s106 blocks are pinned in the spec; a scope label older than the spec's own blocks is a stale claim)",
    ).toBe(true);

    // The PAD §7.1 visual-parity row's scope label (the P2b face).
    const padRow = padLive
      .split("\n")
      .find((l) => l.includes("visual-parity.spec.ts") && l.includes("| 1 | 167 |"));
    expect(
      padRow,
      "the PAD §7.1 must carry the visual-parity row (the dropped-site doctrine)",
    ).toBeTruthy();
    expect(
      (padRow as string).includes("session-2 through session-106"),
      "the PAD §7.1 visual-parity row's scope label must name the live spec scope (session-2 through session-106)",
    ).toBe(true);
  });
});
