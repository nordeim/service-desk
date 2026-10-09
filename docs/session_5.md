# Session 5 Retrospective

**Date:** 2026-10-09 · **Scope:** session-5 parity audit + remediation · **Repo state at start:** `9c3f446` (session-4 code + retrospective) · **At end:** all 8 findings fixed, 90/90 E2E, pushed to `main`.

## What this session delivered

- **The icon-button padding fix (HIGH).** The vendored Button base's `has-[>svg]:px-3` size-variant class — `:has(> svg)` carries element specificity, so it beat the plain `px-4` — had shrunk every icon-bearing button to 12px horizontal padding while the reference renders 16px. Back buttons measured 189px vs the reference's 197px. Stripped from all three size variants; the paired final measurement is **197px = 197px** (submit buttons 160px = 160px).
- **The v3→v4 shadow-scale naming trap (MED, app-wide).** Tailwind v4 renamed `shadow-sm`→`shadow-xs`; the reference (v3 scale) writes `shadow-sm` for the light `0 1px 2px/0.05` step. Eleven controls had copied the class NAME onto a v4 build, rendering one step HEAVIER. All flipped to `shadow-xs` — my own intermediate "fix" in the opposite direction (outline→shadow-sm) was caught by a computed re-measure and reverted. Parity is the computed value, never the class name.
- **The font was never probed (HIGH).** Four sessions pinned typography at every level except the family. The reference loads NO webfont (`document.fonts` empty, zero @font-face rules) — its body computes `ui-sans-serif, system-ui, sans-serif, …`. Our next/font Inter was a session-1 assumption causing ~10% text-width deltas everywhere. Inter removed; `--font-sans` pinned in `@theme inline` to the reference's exact stack (Tailwind 4.3's default is a different, older vendor list); `antialiased` dropped (the reference leaves smoothing at `auto`).
- **Micro-contracts:** `mr-2` on the back arrows ×2 + the Add Comment svg (16px icon-to-text spacing); the View All CTA arrow's hover slide `translate-x-1` (4px, was 2px); quick-stat badges gained the reference's `hover:bg-primary/80` (noted in session 4, never assigned); the 404 Go Home control gained the reference focus ring (`focus:ring-2 focus:ring-offset-2 focus:ring-slate-500` + `duration-200`).
- **Two false gaps caught by the verification protocol** (computed re-measure before shipping): the outline-shadow "fix" (above) and the submit-icon change — a probe had matched the sidebar NAV item "Submit Ticket" (circle-plus w-5) instead of the form button (Send w-4 h-4 mr-2). Both reverted with evidence; the session-3 pin restored.

## Audit & verification

- Baseline at `9c3f446`: lint ✓ typecheck ✓ 53 unit ✓ build ✓ 73/73 E2E ✓ smoke 11/11 ✓; session-4 commit `c0a5a39` audited clean.
- Mobile navigation verified on BOTH sites: the reference's trigger is still partially blocked by its own toast viewport (`elementFromPoint` at the trigger center returns the `fixed top-0 z-[100]` container) — a reference defect we deliberately do not copy; our trigger hit-tests to the BUTTON, the sheet opens with 20px icons / 12px gap / 600-weight labels, closes via overlay (real pointer events) and Escape, and nav-tap navigates + auto-closes. Zero console errors on every page.
- 11 VLM composite claims checked against computed styles — 8 refuted (stat-tile "backgrounds", form "indentation", dropzone "missing icon", login spacing/inputs/links, footer icons, page background); the final post-fix dashboard composite reads **IDENTICAL**.
- Full gate after all fixes: lint ✓ typecheck ✓ 53 unit ✓ build ✓ **90/90 E2E** ✓ smoke 11/11 ✓ (visual-parity grew 45→61 tests).

## Process lessons (in `docs/remediation-plan-session5.md` §F)

1. Never derive a dump target origin from `location.origin` — the session-5 dump helper did, silently testing the reference as "the clone" (the clone was never broken; the reference's base44 API answered `Security verification is required`).
2. `var top` in page context collides with the unforgeable `window.top`.
3. Class NAMES are not parity — computed values are (the shadow trap).
4. Disambiguate by scope before measuring buttons (nav items share text with page controls).
5. Probe the font family, not just sizes/weights.

## Artifacts

- `docs/remediation-plan-session5.md` — the full inventory, ledgers, and validation.
- `tests/e2e/visual-parity.spec.ts` — +17 session-5 parity tests (61 total).
- `docs/screenshots/` — 7 refreshed dev-server captures; `compare-s5/` composites.
- README / AGENTS (session-5 contracts) / CLAUDE (font rule) / PAD (known-issues row) / `service-desk_SKILL.md` v2.3.0 (lessons 16–18) — all updated.
