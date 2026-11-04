Workspace refreshed and clean. Now let me set up the task plan.
The core docs are massive (300KB–1.1MB each). I'll read the recent session docs myself first (they define current state), then extract key sections of the big docs.
Now let me check the worklog tail and key facts from the big docs.
I now understand the project state. This is session 103 (s103) of a long-running remediation project. The operator's transcript (session_194.md) was committed at the tip. Let me check for the known "red-at-pull" pattern and set up the environment.
Canonical seed 4/11/3 ✓. Now the critical **red-at-pull check** — running the unit gate on the pulled tree:
**RED-AT-PULL CONFIRMED — the era's twenty-fifth.** 352/353: pin 3 caught `` `efe14 e7` `` in session_194.md line 9 (the operator's transcript carrying the cross-repo neo-crm token — the standing s84+ class). Applying the standing de-grammar edit (byte-spaced form):
**353/353 GREEN** — red window closed locally. Now the calibrated CI read on the tip (fa686d7):
**MAIN IS RED AT PULL — run #41736208034 on fa686d7 FAILED (both controls correct).** Let me verify the failure is the known operator-transcript class, not something new:
The e2e job was skipped (`needs: verify`) — the verify job failed at Unit tests, the known operator-transcript class. **The s103 push must RETURN main to green (the era's twenty-fifth red-at-pull).**

Now the baseline gate on the de-grammared tree. First check the Playwright browser (fresh clone):
Browser installed. Now the baseline gate — lint, typecheck, build:
Build ✓. Kicking off E2E suite in background while I review the core docs:
Excellent. Now let me get the README/PAD/SKILL essentials with another subagent while E2E runs:
Codebase validated against docs — all confirmed. Checking E2E progress:
The background E2E died with the shell. Re-running in foreground:
While E2E runs, let me check the standing reference figures and prepare the s103 script lineage. First, look at the s102 ref-sweep script to understand the wave check:
Background processes are killed between tool calls. Running E2E in the foreground (takes ~4.1 min):
**232/232 E2E GREEN (4.4m)** ✓. Now the smoke test:
Smoke 121/121 ✓. Now the standing helpers:
All baseline helpers green. Updating progress, then deriving the s103 scripts:
**The s103 P1 axis is confirmed**: SKILL §11 line 322 still claims `232 E2E (needs the prior build)` — the fifth claim site of the fresh-clone E2E-browser prerequisite class that the s102 closure (four sites) missed. Let me verify how the corpus-count contract holds this site:
The corpus-count regex pins line 322 (`232 E2E (needs`) and line 652 (ends `# 232 E2E`). Let me read the current prereq-contract pins to plan the extension:
Now I have the full picture for the s103 axis. First, derive the s103 script lineage (Phase 1 — the mechanical OWN bump):
Phase 1 complete: 109 substitutions. Now running the 85th parity sweep — F1 first:
**A WAVE LANDED — the SIXTY-NINTH /login WAVE**: entry rotated r0DWh4vL → `6xnUqbWf` (chunkrefs 815→832). Running the wave analysis:
Wave measured: 761→777, 27 added / 11 removed (all platform-infrastructure), 452 re-hashed / 298 hash-stable. Now the critical login-CSS watch (the login-pair trigger):
**Login CSS rotated: xihcXjhm → `BVWWKVEJ` 200/917016 (+847 bytes) — the era's TWENTY-THIRD CSS rotation. The login-pair trigger FIRED** (both entry and CSS rotated — all TEN paired VLM checks must be re-verified for real). Let me complete the F1 figures:
F1 complete: entry `6xnUqbWf` 200/100538 (+813), CSS `BVWWKVEJ` (+847, 23rd rotation), old chunks still served, logoutReturnPath 200/288 hash-stable (86th streak). Now F2–F4 reference surface probes:
All standing reference-side defects persist (85th reading): F3 desktop 1328-vs-1280, F4 mobile 468-vs-375, toast-viewport blocking, REAL-click refusal at e12. Now the our-side verification battery:
The ourside script failed to log in (stuck at /login). Let me inspect the login portion:
Users exist. Let me debug the login manually — boot the standalone server and test:
Login fails manually too, but E2E auth passed. Let me check what happens on submit — snapshot for errors:
An error toast appeared. Let me read it and test the API directly:
**Login API returns 500** against custom.db (E2E passed on its own e2e.db). Checking the server log:
**Root cause — my infra error, not a code bug**: the s87 AUTH_SECRET fail-hard doctrine correctly throws in production mode (my .env ships `AUTH_SECRET=""`). The script must boot with AUTH_SECRET set. Checking how the s102 script boots:
The scripts rely on a real AUTH_SECRET in the ambient env — my fresh `.env` (copied from .env.example) ships it empty. The documented practice is `openssl rand -hex 32`. Let me check how E2E handles it, then fix:
**Our-side superset HOLDS byte-identical (85th): 1280=1280, 375=375, REAL click opens the sheet at 0,0,288,667, Escape closes, nav-tap navigates — no Tailwind v4 bug on our side.** Now the UI round-trip + backend axis:
UI round-trip SINGLE-PASS CLEAN (probe created via real UI, Prisma-verified open+hardware, deleted, canonical 11 restored). Now the backend-axis re-verification (done inline since s101):
Wrong-password **400 + exact FastAPI envelope** holds byte-identical. Now the reset-password-request probe:
Backend axis fully re-verified HOLDING. Since the login-pair trigger FIRED, the TEN paired VLM checks are load-bearing — running now:
**NEW FINDING**: the login pair reports LAYOUT-DIFF — "Email and Password labels centered in the reference but left-aligned in the clone." This is load-bearing since the CSS rotated. Let me verify with computed styles (ground truth, not screenshots):
Both compute `text-align: center`, but display differs (inline vs flex). Let me measure the actual visual geometry — label box vs input box:
**The delta is REAL and measured**: reference centers label text over the input (label box ≈ text width, centered at x≈640); ours renders the label as a full-width flex box with text at flex-start (left-aligned). Let me check our login form markup and its history:
Our Label is a shadcn flex container (text at flex-start); the reference's is inline-centered by its container. Let me inspect the reference's DOM to find the centering source:
Both sides' containers are `text-center` — the entire difference is the label element itself: reference renders a plain **inline** label (centered by the container), ours renders shadcn's **flex** label (text packed at flex-start). Let me check the CSS rotation diff and our label history:
The reference's label is a plain inline element; ours is shadcn's flex label. To date the divergence, let me check whether the 69th-wave JS changed the reference's login markup — find the login-form chunk in old vs new entries:
**Conclusive dating**: the reference's label chunk was IDENTICAL before and after the 69th wave (`text-sm font-medium leading-none peer-disabled:...` — plain inline, no flex). The gap is OURS since the initial commit — a real, pre-existing parity defect the fresh VLM read caught (s102's was lenient). Let me check all our Label usages before fixing:
No test pins our Label display classes, and all our usages are text-only. Let me confirm the reference's label behavior on its submit-ticket surface:
Confirmed: the reference's labels are `inline` on every surface (left where containers are left, centered where centered) — our flex label is the sole divergence. This is the **s103 P1: a real, measured visual-parity defect on the login surface**. Let me now map the claim sites for the corpus moves:
The parity-pins family (164, 3 sites) also moves. Let me verify current spec counts:
Now I have the complete picture. Let me enumerate every count claim site across the five docs before writing the plan:
The contract tests will enumerate the sites as I go. Now let me check the screenshot set (the label fix may change captured shots):
Now let me check the artifact-existence pin's exact catching rule (to keep the plan de-grammared from the start):
The pin rules are clear (real commits safe; hex-shaped non-commits must stay byte-spaced). Now writing the s103 remediation plan (de-grammared from the start):
Now applying the paired bumps (they land together with the plan):
Now the TDD RED at birth. First, the E2E label-alignment pin — let me study the visual-parity spec's conventions:
Writing the TDD RED pins. First the E2E label-alignment pin (appending the session-103 block):
The pin is registered (parity count 164→165). Now observing the TDD RED at birth against the pre-fix build:
**E2E TDD RED observed at birth** — the email label fails `display: inline` (currently flex). Now the unit pin C:
Now observing the pin C RED at birth against the pre-fix SKILL:
**Pin C RED observed at birth** — both pins biting exactly as designed. Now the fixes. First the label primitive:
Now the SKILL doc fixes (§11 + Appendix B + Purpose line):
Now the README claim sites:
Now the AGENTS commands row:
Now CLAUDE.md:
Now the PAD sites (§7.1 rows, §7.4, §10 register, Last Updated):
Now run the corpus-count contract to catch any remaining stale sites:
All sites consistent — the contract's canonical expectations need the standard bump (353→354, 232→233, 164→165):
Corpus-count 5/5. Now the full unit suite:
**354/354 GREEN.** Now rebuild with the label fix and verify the E2E pin goes green:
**Label pin GREEN.** Live re-verification of the measured geometry on the fixed build:
The old pre-fix server process is still bound to :3000. Killing and re-verifying:
**Label fix verified live — byte-identical to the reference's measured geometry** (Email x=621 w=39, Password x=607 w=65, both centered at 640). Now re-run the paired VLM checks to confirm the login pair resolves:
The VLM reads saved captures — our side needs re-capturing on the fixed build. Re-running ourside-verify then the VLM battery:
**ALL TEN paired VLM checks LAYOUT-OK** — the login pair flipped after the fix. Now the mutation battery. **H: the paired bump 103→104:**
**H bit EXACTLY its 5 designed pins.** Reverting and applying **P1 (the label-fix revert)**:
**P1 bit EXACTLY the new E2E pin.** Restoring the fix and applying **P2 (SKILL clause removal)**:
**P2 bit EXACTLY pin C.** Reverting P2 and re-greening:
Mutation battery complete. Now the §5 full gate — rebuild with the fix and run everything:
§5 gate GREEN (lint ✓ typecheck ✓ 354/354 ✓ build ✓ 233/233 E2E ✓ smoke 121 ✓ coverage 92.01/88.80/92.15/95.81). Security-floor re-read:
Census holds at 2 (the documented duo). Now the evidence refresh — the 10-shot capture with the stated prediction (SIX changed: 01/02/04/05/06/09; FOUR identical: 03/07/08/10):
**Measured set deviates from prediction: SEVEN changed (01/02/03/04/05/08/09) + THREE identical (06/07/10)** — corrections needed per the honest-record doctrine. Let me VLM-diff the changed shots:
Updating the shotdiff with the measured set + honest corrections, then running:
**ALL SEVEN changed shots BENIGN.** Verifying the canonical seed after capture:
Seed canonical. Now the docs alignment. First, the AGENTS Session-103 contracts section:
Writing the AGENTS Session-103 section + reference-list + screenshots lineage + date:
Now the CLAUDE anti-pattern entry (newest-LAST) + date:
Now the SKILL updates (version, lesson 157, description, project_state clause):
Now the PAD Session-103 RESOLVED row + Last Updated:
Dated docs all at 2026-11-04. Now the scripts Phase-2 hand-audit — the key context updates in the derived scripts:
Floors hold (sh=350 mjs=212 ts=60, offenders=0). Re-running the full unit suite after all doc edits:
354/354 GREEN. Now writing the session log (session_195.md, the 2N−11 convention):
Now the worklog task 314 (following the established format):
Docdate passes. Now ticking the plan's completed boxes (§3–§5) before the commit (§6 stays deferred until the push):
Committed: **5da6027** (34 files). Now the SSH push setup — reading the wrapper instructions:
The workspace paramiko shim survived. Setting up the key and verifying the fingerprint:
Key parses (ed25519, SHA256:IFhAk23tGxNH0Lp+OJPwBkCBMUMBB3J+bnHk4bKmEI8). Dry-run first:
**Dry-run GREEN** (fa686d7..5da6027 negotiated, remote untouched). Real push:
**PUSHED — remote verified @ 5da6027 == local HEAD; both keys shredded.** Now polling CI for the RETURN-GREEN verification:
**THE PUSH RETURNED MAIN TO GREEN — run #41745610881 on 5da6027 COMPLETED_SUCCESSFULLY.** Verifying the calibration controls for the record:
**Fully calibrated — the red window is CLOSED.** Now the closeout: §6 tick + worklog 315:
Worklog 315 in. The §6 tick assertion failed — checking the exact line format:
§6 fully ticked. Final verification sweep, then the closeout commit:
**Closeout run #41746571408 also COMPLETED_SUCCESSFULLY — both commits on main green.** Final verification sweep:
**Session 103 complete — main is GREEN at the pushed commit.** ✅

## What was done

**Opening:** Fresh clone (second consecutive workspace reset), canonical seed 4/11/3, browser re-landed. **Red-at-pull — the era's 25th**: 352/353 locally + CI run #41736208034 on the operator's `fa686d7` FAILED (both controls calibrated). De-grammar edit re-greened; baseline gate fully green.

**The 85th parity sweep — THE 69TH /login WAVE** (entry → `6xnUqbWf` +813, login CSS → `BVWWKVEJ` +847 — the era's 23rd rotation, **login-pair trigger FIRED**). The mandatory fresh-eyes VLM re-verification caught a real defect the s102 lenient pass had laundered as LAYOUT-OK:

- **P1 — the login label-alignment parity defect**: the reference's shared Label renders `inline` (centered over inputs — measured x=621/w=39); ours rendered shadcn's `flex` form (left-aligned). Dating conclusive: the divergence was ours since the initial commit. **Fixed** (`ui/label.tsx` → the reference's exact class form), TDD-pinned in the E2E spec, live-verified byte-identical, **all TEN VLM pairs LAYOUT-OK after**. Mobile menu re-verified working (REAL click → sheet `0,0,288,667`; no Tailwind v4 bug).
- **P2**: the SKILL §11 checklist — the fifth doc site of the s102 E2E-prerequisite class — closed + pinned (pin C).

**Corpus**: unit 353→**354**, E2E 232→**233**, parity 164→165, full claim-site lockstep; mutation battery bit exactly; full gate green (coverage 92.01/88.80/92.15/95.81, census 2); screenshots refreshed (honest predicted-set correction, all changed shots VLM-BENIGN).

**Push**: commits `5da6027` + `a888cc5` to **main** via the SSH wrapper — CI runs #41745610881 and #41746571408 both **COMPLETED_SUCCESSFULLY** — **main returned to green in one step** (no date-bump fix needed; the doctrine applied at the fix held). Keys shredded, remote verified. Docs (AGENTS/CLAUDE/README/PAD/SKILL v3.1.0 + lesson 157), `docs/session_195.md`, `docs/remediation-plan-session103.md`, and `worklog.md` (tasks 314/315) all updated and committed.
