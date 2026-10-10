I'll continue this multi-phase task. Let me set up a task list and start by checking the workspace state.
The workspace has been reset — no service-desk repo exists. I'll clone it now.
Repo cloned successfully. Now let me read the core documentation files (Task 2).
The AGENTS.md is large. Let me read it directly in chunks.
Now let me read the session docs and worklog to understand the current status.
Now let me read the worklog, remediation plan session13, and check recent commits.
Now let me read the remediation-plan-session13 and skim README/PAD/SKILL docs.
Now let me skim README, PAD, and the SKILL doc headers to complete the doc review.
I now have a complete picture. This run is **Session 14** (sessions 1–13 complete; HEAD `a77d7e9` = operator's session_16.md transcript commit). Let me update my todos and set up the environment.
`.env` is missing (fresh clone). Let me set up the environment: create `.env` from `.env.example`, install deps, and push/seed the database.
Database seeded (4 users / 11 tickets / 3 comments). Now the baseline gates:
Lint ✓, typecheck ✓, 55 unit ✓. Now the production build:
**176/176 E2E green.** Now the API smoke test to complete the baseline:
**Full baseline gate GREEN** (lint ✓ typecheck ✓ 55 unit ✓ build ✓ 176/176 E2E ✓ smoke 11/11 ✓). Now let me audit the session-13 commit against its plan.
Session-13 commit audit **CLEAN** — F1/F2/F3 all match the documented plan. Now let me review the skills catalog for this session's audit.
Let me review the full session-13 diff and run the standing trap scan as part of the audit.
Trap scan clean. Now let me check the agent-browser skill and clone the scandihaven patterns repo.
Scandihaven patterns reviewed (same stack; its Tailwind v4 rules already internalized). Let me check the session_13 retrospective for the suggested fresh-probe shortlist.
The session-13 shortlist for this session: (1) reference's attachment download UX from the new tab, (2) mytickets card hover states on touch, (3) CDN file URL lifetime. Let me boot our production server and start the live gap analysis.
Logged in to the reference (s13 probe tickets still visible — no delete affordance, as documented). Let me run the standing drift pins.
Standing drift pins all stable. Now the mobile navigation matrix at 375×812 on the reference.
The viewport CLI command differs — let me check the s13 mobile-matrix script for the working approach.
Mobile viewport set — reference overflow defect confirmed (468 vs 375; ours is the documented superset). Now the mobile sheet matrix:
Reference mobile matrix: **stable** (288px sheet, #fafafa, 80% overlay, scroll lock, stays-open quirk, Escape→body). Now the fresh-probe shortlist — first the attachment download UX. Let me find a probe ticket with attachments.
The CDN URLs from s13 are still live. Let me check their headers and download behavior:
Notable: the `.txt` CDN URL now 404s (the s13 URL has expired — the lifetime suspicion confirmed). The `.pdf` is a 302. Let me follow it:
Key finding: the reference serves CDN files **inline** (no `Content-Disposition` header — browser displays the PDF in the new tab). Let me check what our download route does:
**Finding 1 (download UX)**: Ours forces `Content-Disposition: attachment` (download); the reference serves files **inline** (no Content-Disposition — the new tab displays the file). Let me verify the reference's mytickets card hover-on-touch behavior (shortlist item 2):
Synthetic events don't toggle CSS `:hover` — let me check the reference's actual stylesheet for media-query guarding instead:
The reference's hover styles are plain unguarded `:hover` (sticky-hover on touch — the documented divergence, now re-confirmed). Let me probe fresh functional surfaces: ticket-list pagination and comment-on-closed-ticket behavior.
All 5 reference tickets are `open` — meaning **zero resolved tickets**, a data state never probed (avg resolution time). Let me check the reference's dashboard stat cards:
The reference shows **"N/A"** for avg resolution with 0 resolved tickets — matches our `formatDuration` contract. Let me check the reference's console state and a commented ticket:
Reference platform warnings still present (documented, never mirror). Comment format matches our pinned contract. Now let me verify OUR clone's live mobile matrix with a Playwright probe script:
Mobile matrix **fully green** on our clone. The download probe's fixture didn't render — let me check the create response shape and find how s13 cleaned up tickets:
The inline eval needs the pinned DATABASE_URL. Let me write a proper cleanup script (repo convention) and check the create response:
The create returns `{ ticket }` — my probe read the wrong field. Let me fix the script:
**FINDING F1 CONFIRMED**: ours forces `Content-Disposition: attachment` (new tab = download); the reference serves inline (new tab = view the file). Let me verify the accepted mime types for the inline-safety analysis:
All accepted types are inline-safe (no HTML/SVG — the s10 XSS decision). Let me spot-check the reference's head metadata for drift, then survey remaining surfaces:
The reference's `og:url`/canonical on ticketdetails **includes the `?id=` query string**. Let me check what ours ships:
**FINDING F2**: ours omits the `?id=` query on ticketdetails canonical/og:url/twitter:url. Let me check whether the reference pushes filter states to the URL on mytickets (which would affect its canonical there too):
Reference mytickets filters don't push query params — F2 is scoped to ticketdetails only. Let me probe the comment form attributes on the reference:
评论表单一致性已确认。让我检查一下 F2 修复计划的 `route-head` 辅助函数：
F2 is feasible without helper changes (the segment param can carry the query). Let me check the current ticketdetails layout/page structure:
Now let me examine the existing E2E pins for the head surface and attachment download to plan the TDD tests:
Let me verify the reference's breadcrumb JSON-LD query behavior (to scope F2 correctly):
The reference's **breadcrumb JSON-LD item also carries the query URL** — F2 covers both the head URLs and the breadcrumb. Let me check the BreadcrumbJsonLd component:
Now I have the full findings picture. Let me check our security headers config (relevant to F1's inline-serving safety):
`nosniff` already ships on every response — inline serving is safe. The audit is complete with 3 findings. Now let me write the remediation plan (Task: create + validate).
Plan saved. Now let me validate it against the codebase — checking for any existing pins that drive ticketdetails with an id and assert head URLs:
The empty-`?id=` Alert case and the bare-route head pins won't conflict with F2. Let me verify the root layout's metadataBase and the ticketdetails page structure around line 42:
Plan validated against the codebase. Now the TDD execution — **RED phase**. Let me check the spec file's tail and the established fixture patterns:
Line 2236 has a shell-mangled locator (`aref*=` instead of `[href*=`) — yet test 173 passed. Let me investigate what this selector actually resolves to:
**Critical discovery**: the mangled selector at line 2236 **throws** in Playwright — yet the suite passed 176/176. Let me examine the actual test structure around it:
Paradox: the file contains an invalid selector, yet the test passed. Let me re-run that single test to verify:
The spec test passes while my probe throws on the same string — something's off. Let me read the raw bytes with node directly:
The spec run passes but the identical standalone flow fails. Let me check how the E2E script invokes Playwright:
Same Playwright version — yet different outcomes. Let me re-run the single test and check the exit code rigorously:
It passes in the runner but fails standalone with identical code. Let me hexdump the line — perhaps invisible characters:
**Mystery solved**: the hexdump shows the file actually contains `a[href*=` — **the file is correct**; the `[h` sequence was being mangled by my Bash *display* layer (the exact artifact the s13 agent documented). Let me verify my own new scripts weren't affected:
Display layer mangles `[h` on every read. Let me verify my script's bytes via hex output only:
**Verified**: my scripts are byte-correct — only the display layer mangles `[h` (a documented s13-environment artifact; the committed s13 spec is fine, no bug there). Now the TDD **RED phase** — first let me confirm the create-response attachment shape:
Now writing the session-14 RED tests:
Wait — I need to check the breadcrumb base URL handling in the existing s11 test (E2E server on :3100 vs SITE_URL default :3000):
The existing tests use suffix-regex matching (the canonical href is absolute — `http://localhost:3000/...`). Let me fix my new tests' URL assertions accordingly:
Inline nesting is error-prone. Let me write a proper patch script:
The patch may have broken the string escaping. Let me inspect the actual bytes around line 2443:
The line is genuinely truncated. Let me check the patch script's replacement string bytes precisely:
The patch script is byte-correct. Let me re-verify the spec file line via the hex-to-file method (display lies):
**Root cause found**: JavaScript's `String.replace` treats `$'` in the replacement as the "text after match" pattern — my replacement string contained `'$'));` which got expanded! Let me check the file end for the swallowed tail:
The `$'` expansion duplicated file content (2587 lines vs expected ~2490). Cleanest fix: restore the spec from git and re-append via a plain-concatenation script. First, save the corrected test block:
**RED verified**: 4 failures (F1 × 2, F2 × 2), 1 regression-guard green (bare route) + setup. Let me confirm each failure is for the right reason:
F1-1, F2-1, F2-2 are perfect RED. F1-2's fixture was rejected at upload — let me check the filename validation rules:
Validation rejects path separators — my hostile name needs to pass upload validation while still exercising the route sanitizer. Let me fix the test block:
**RED phase fully verified** — exactly the 4 substantive tests fail. Now the **GREEN phase**. F1 first — the disposition swap:
F1 done. Now F2 — copy the page to the view file and rewrite the wrapper:
The page must not export extra components (AGENTS.md invariant). Let me rewrite it properly with the breadcrumb rendered inline:
Now extend the BreadcrumbJsonLd component with the `query` prop and remove the breadcrumb from the layout:
Now remove the breadcrumb from the ticketdetails layout (it moved to the page):
Let me verify the view file's header and check for any references to the old page component:
Typecheck + lint green. Let me check if the smoke script pins the disposition, then run the full E2E:
Build green. Now the full E2E suite:
**181/181 E2E GREEN** — zero regressions. Now the smoke test + cleanup of dev-DB probe tickets:
Dev DB canonical (11 tickets). Now the live re-verification — restart the server with the new build:
**Live verification PASSED** — F1 inline disposition, F2 query-bearing URLs all equal, bare route clean. Let me do a live browser check on the detail page (hydration after the page split), then clean up the fixture:
Dev DB canonical. Now the screenshots — let me check the s13 capture script's structure:
The script's display shows the known `[h` mangling — let me verify the file bytes are correct, then run it:
The script bytes are correct. Let me see the rest of the s13 script before creating the s14 version:
Now let me create the s14 capture script (standing 9 + a new 10th shot documenting F1's inline rendering):
All 10 shots captured (including the new inline-view shot). Let me verify the DB is canonical and VLM-check the new shot + one regression spot-check:
**VLM confirmed**: shot 10 renders the text file inline. Let me spot-check the dashboard shot for visual regressions after the page split:
Dashboard intact — no visual regression (the VLM's color note reflects the actual reference design: light `#fafafa` sidebar). Now the documentation updates. First, the README:
Now AGENTS.md — the session-14 contracts section:
Now update the remediation plan's execution status:
Now the session_17.md narrative log (following the session_15.md convention):
Now update the worklog.md with the session-14 entries:
Now clean up debug intermediates and run the **final pre-commit gate**:
**FINAL GATE GREEN** (lint ✓ typecheck ✓ 55 unit ✓ build ✓ 181/181 E2E ✓ smoke 11/11). Now the commit + push. Let me read the SSH wrapper instructions:
Now let me prepare the commit. First check git status and the secrets-scan habit:
Committed `cd18869`. No ssh binary — deploying the paramiko shim per Appendix A:
`/usr/bin/python3.13` has paramiko 5.0.0. Now deploy the shim with that shebang:
Shim deployed. Now materialize the operator key to a 0600 temp file and verify it parses:
Key parses as valid ed25519. Let me decode the comment to cross-check against the expected `petepop-os`, then dry-run:
The key's internal checksums validated (paramiko's parse verifies checkints + padding — a single wrong byte would fail). Now the wrapper dry-run with the explicit remote:
Dry-run green — auth verified, remote at `a77d7e9` (fast-forward to `cd18869`). Now the real push:
**Pushed and verified** — `main @ cd18869 == local HEAD`. Now shred the operator key per the runbook:
**Session 14 complete** — everything pushed to `main @ cd18869` ✅

**What shipped** (TDD: 4 red → **181/181 E2E** + 55 unit + smoke 11/11, live-verified on both sites):

- **F1 (MED-HIGH)**: probed past the DOM to the HTTP response layer — the reference's CDN serves attachments with *no* Content-Disposition (the new tab displays the file), while our route force-downloaded since session 8. Fixed to `inline; filename="<sanitized>"`.
- **F2 (MED-LOW)**: the reference canonicalizes the *full* current URL — canonical + og:url + twitter:url + breadcrumb JSON-LD all carry `?id=` on the detail route. Fixed via a server-page wrapper (client island byte-unchanged).
- **Documentation findings**: their CDN URLs expire (our SQLite storage = retention superset); mobile-nav matrix green on both sites; Tailwind v4 trap scans clean.

All docs aligned (SKILL v2.12.0, session_17.md, worklog), 10-shot screenshot set captured, `.env.example` verified.

**Suggested next**: watch the CI run on GitHub, then review `docs/remediation-plan-session14.md` §5 — especially *"the response layer is a parity surface too."* The next audit's fresh-probe shortlist is in `docs/session_17.md`.
