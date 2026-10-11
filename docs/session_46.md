工作区已存在，工作日志显示 session 27 已完成。现在我需要刷新工作区，并按照说明查看更新后的会话文档（session_43、remediation-plan-session27、session_44）。
The remote has one new commit (the session_44 log). Pulling now.
`session_44.md` 是拉取下来的 Session-27 叙述日志（提交 `5a4c334`）。现在让我审查一下其余的状态文档 —— `session_43`、`remediation-plan-session27` 的状态，以及仓库 `worklog` 的末尾部分。
The state is clear: Session 27 shipped (`0317db1`+), CI green, and the operator's `5a4c334` transcript commit is now local. **This run is Session 28** (agent log → `docs/session_45.md`, plan → `remediation-plan-session28.md`). The s44 closing shortlist: (1) standing ledger re-check, (2) the `/api/stats` param-surface question, (3) their mobile-app chunks. Let me verify the environment contract and core docs.
Environment contract standing (`.env` + `DATABASE_URL="file:../db/custom.db"` + `.env.example` + scripts pinning). Now the skills catalog and core-doc standing sections.
Skills catalog reviewed. Now let me check the core docs' standing-state sections and current test/config state.
Test infrastructure standing. Let me read the AGENTS.md conventions + session-27 contracts + environment sections, then start the baseline gates.
Onboarding understanding is solid. Now let me verify the clean environment and run the baseline gates (lint → typecheck → unit → build → E2E → smoke).
Seed canonical (4/11/3/0), ports down. Running baseline gates now — lint + typecheck + unit first.
Lint ✓ typecheck ✓ 94 unit ✓. Now the build, then E2E + smoke.
All baseline gates GREEN (lint ✓ typecheck ✓ 94 unit ✓ build ✓ 196/196 E2E ✓ smoke 41 ✓). Verifying seed integrity post-gate, then recording onboarding in the worklog.
Baseline gates all green and onboarding recorded. Now the gap analysis phase — booting our production server and starting the agent-browser session for paired probes against the reference.
Logged into the reference. Now **F1 — the bundle sweep (tenth)**: extract the current chunk pairs from both routes.
**F1 — bundle drift detected**: the `/login` pair ROTATED again (`index-CM-qL9yl.js`+`DWYJeyVS.css` → **`index-GvewFNv-.js` + `index-DGHUKY5V.css`**), while the app-route pair holds (`DhFaB31Z`/`DFdILd41`, ninth sweep). Also visible: the `native-mobile-app` + `useHideNativeBottomTabs` chunks (the s44 shortlist target). Let me decode the rotation and the mobile chunks.
Chunks live under `/static/`. Re-fetching with the right prefix.
The s44 mobile-chunk question is now decoded: `useHideNativeBottomTabs` + `native-mobile-app` are the **Wix native-shell bridge** (`window.wixMobileNativeBridge`) — all calls guarded by `isNativeMobile`, inert in the browser. Platform infrastructure, not app features (the s2 no-platform-chrome doctrine). Also: `from_url` survives the new graph (×1 per auth chunk), login UI strings present in the new `UserAppMain-BZ-6C68G.js`, and my live login already ran through the new bundles.

Now **F4 — the chrome ledger (tenth re-verification)** on the reference dashboard.
F4 铬金属账本（第十次）—— 所有轴均保持一致。接下来是 **F5 — 移动端矩阵（第十次）**：375×812 下的参考溢出 + 工作表行为。
Their standing 468-vs-375 overflow persists (tenth). Now their mobile sheet behavior after a nav-tap.
The covering element IS the open mobile sheet — the menu is already open. Let me snapshot and test the nav-tap behavior.
Two empty fixed `z-[100]` divs (toast containers) cover the header. Checking whether they intercept pointer events — this could be a new reference-side defect.
**已确认新的参考端缺陷**：一个在空 Toast 视口 div 上坐标为 (38,30) 的真实点击——菜单未能打开。让我重新加载，以排除这是否是由瞬时登录 Toast 造成的残留。
Persistent after reload — a genuine new reference-side mobile defect (menu button blocked by their empty toast viewport). Now our mobile matrix on the same probes.
Our 375=375 holds. Now our menu-open + nav-tap auto-close test with a real click.
Our mobile matrix fully green (tenth): 375=375, menu opens, nav-tap auto-closes + navigates — and our button is clickable while theirs is blocked. Now the TW v4 guards code verification.
TW v4 guards standing. Now **F2 — the `/api/stats` param-surface question** (the s44 shortlist item) — the own-side audit continues.
`/api/stats` 不接收任何参数 —— 该空集从未被关闭。让我检查一下调用者，以及实时的参数会产生什么影响，然后再做决定。
**F2 已确认 — P1 可操作发现**：来自同级列表路由的真实参数名称（`?scope=mine`，`?status=open&limit=5`）被静默忽略，返回未经调整的完整聚合数据 —— 这是 s27 跨路由变体中 lesson-79 的类。调用方未发送任何参数，因此结束该空语法结构是零风险的。让我研究一下 s27 衔接点，以便设计修复方案。
The seam design is clear. Continuing the own-side audit — full API route inventory for any unaudited param surface.
One more route family to check — `tickets/[id]/comments` GET (the reference's Comment entity pages with limit+skip, measured s25).
Comments 路由仅限 POST（无参数）——已清理。现在进行配对桌面端视觉检查（恢复桌面端视口，双方）。
**VLM verdict: LAYOUT-OK** (all differences are data-content only). One final reference-side check — the logged-out gate + from_url contract through the new bundles.
The from_url gate holds through the new bundles. **Gap analysis complete.** Recording it in the worklog, then writing the session-28 remediation plan.
Plan saved. Validating the named seams against the codebase before executing.
All seams validated. Now the **TDD RED phase** — adding the `parseStatsQuery` pins to `domain.test.ts`.
Now add the import and confirm RED.
**RED confirmed** (5 failed: `parseStatsQuery is not a function`). Now the **GREEN phase** — the seam in `validation.ts`.
Wait — the duplicate-before-unknown ordering contradicts the s27 convention (unknown check precedes duplicate per name; on an empty grammar every name is unknown, so the duplicate branch is unreachable and the unknown message subsumes it — the caller must remove the param entirely, not dedupe it). Fixing to the s27-consistent shape.
Now update the duplicate test pin to match the s27-consistent semantics (the unknown message subsumes duplicates on an empty grammar).
**GREEN — 99 unit** (94+5). Now the route wiring.
Now the smoke pins — adding the s28 block after the s27 block.
Now the **full gate in the clean environment** — killing :3000 (running the old build), rebuilding, running everything.
**Full gate ALL GREEN**: lint ✓ typecheck ✓ 99 unit ✓ build ✓ 196/196 E2E ✓ smoke **44 PASS lines** (41+3). Verifying seed, then the live re-verification phase.
Seed canonical, new build live on :3000. Now writing the s28 live-verify script (the stats grammar matrix + the standing re-verification set).
s28 live-verify **12/12 GREEN**. Now the standing re-verification — s27, s26, s25, s24 scripts on the new build.
All standing scripts GREEN (s24 + s25 13 + s26 15 + s27 14 + s28 12). Now the UI round-trip — the real dashboard through the grammar gate.
Session invalidated by the server restart (the from_url gate fired correctly). Re-logging in.
Dashboard renders with the 5 seeded tickets. Let me check the stat cards + QUICK STATS with better selectors.
UI round-trip green — the dashboard, stat cards, QUICK STATS, and Performance Metrics all render through the grammar gate. Now the mobile matrix on the new build.
Mobile matrix green on the new build. Now the screenshot set — creating `capture-screenshots-s28.sh` from the s27 lineage.
All 10 shots captured with FATAL guards green. VLM spot-check on the standing convention shots (02 + 05).
VLM both LAYOUT-OK, seed canonical. Now the docs alignment — starting with the README.
Updating the README — badges, counts, test descriptions, and the session-28 E2E-notes sentence.
Now appending the session-28 sentence to the E2E-notes paragraph.
Now AGENTS.md — the commands table, the session-28 contracts section, and the reference findings list.
Now the session-28 contracts section in AGENTS.md (after the s27 section, before Environment).
Now appending the session-28 entry to the AGENTS.md reference-findings list.
Now CLAUDE.md — the counts and the anti-pattern line.
Now the PAD — §7.1 counts + the session-28 known-issues row.
Now the SKILL.md version bump + the new lesson.
Important discovery — Lesson 15 already documents this toast-viewport blocking from Session 4. My "first measurement" framing needs correcting — this is a **recurrence**. Let me verify against the s4 record.
Confirmed — s4 documented this defect as "partially blocked" (single 32px band); today's measurement shows it **recurred and worsened** (two stacked containers ~64px, the click fully swallowed). Correcting the framing in AGENTS.md, PAD, and the plan.
Now the SKILL.md version bump + lesson. Checking the last lesson number.
Now writing `docs/session_45.md` — the session-28 agent log.
Now updating the plan's execution status and the repo worklog.
Now the final pre-commit gate — re-running everything to verify the complete file set.
Final gate ALL GREEN. Now the commit — checking the file set and the pre-commit security checklist.
The 9 unchanged screenshots are byte-identical to the committed set (deterministic rendering); 09 differs (the fresh fixture ticket). Let me spot-verify, then commit.
Byte-identical confirmed — deterministic rendering. Now the commit.
Executing the push procedure — materializing the operator key (0600, /tmp, never inside the repo), then the dry-run.
The dry-run reports the remote has moved — the operator pushed something new. Fetching to see.
Remote is at `5a4c334` (an ancestor of my commit) — the push should fast-forward. The wrapper may be defaulting to the wrong remote URL. Checking.
The wrapper defaults to `task-management.git` — the wrong repo. Re-running with the explicit service-desk remote.
Dry-run green (clean fast-forward `5a4c334..752e333`). Now the real push.
Push verified (remote == local HEAD @ `752e333`, tracking synced, keys shredded, main only, tree clean). Now the CI verification — trying the REST API first, then the browser aria-label method.
API rate-limited (the standing condition). Using the browser aria-label method.
**Run 63 is running** on the session-28 push. Polling until completion.
**CI Run 63 completed SUCCESS** — the badge stays green. Recording the confirmation in the plan (the standing convention) and finalizing.
**Runs 63 + 64 both green.** Final cleanup — shutting down the server, closing the browser, and updating the project worklog.
**Session 28 complete** — all phases executed and verified:

- **Onboarding**: pulled to `5a4c334`; baseline gates all green (94 unit / 196 E2E / smoke 41)
- **Gap analysis**: the `/login` bundle rotated a second time (behavior unchanged); their mobile-app chunks decoded as the inert Wix native-shell bridge; the s4-documented toast-viewport defect **recurred and worsened** on their side (their menu button is now fully blocked at mobile — ours works); ledger/mobile/TW-guards hold (tenth)
- **P1 (TDD)**: `parseStatsQuery` RED→GREEN — the param-less `/api/stats` grammar closed (real sibling-route names like `?scope=mine` were silently ignored) → **99 unit**, smoke **44**, 196/196 E2E unchanged, live-verified 12+14+15+13+13 checks
- **Pushed to main**: `752e333` + `f61802c` via the SSH wrapper — **CI Runs 63–64 green**, keys shredded, tree clean

Note: the wrapper's default remote is `task-management.git` — the dry-run caught it; the explicit `--remote` flag was required.

**Next session**: re-check the rotation waves (the app-route pair is now the older survivor) and watch whether their toast-viewport defect recedes with their next rebuild.
