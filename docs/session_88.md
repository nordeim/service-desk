The workspace has been reset. I need to clone the repository fresh. Let me set up the task plan first.
仓库克隆成功，且已包含 `vitest.config.ts`、`playwright.config.ts`、`db/` 文件夹和 `.env.example` —— 之前的会话已经完成了大量工作。让我阅读一下核心文档。
文档是行数较少的长行文件。`.env.example` 已经有了正确的 `DATABASE_URL="file:../db/custom.db"` 配置。让我阅读一下核心文档。
This is Session 49 continuing the remediation lineage. Let me read the remaining core docs.
Now let me read the full AGENTS.md content from the persisted output to understand the commands and conventions.
The repo is well understood. This is Session 49. Since the workspace was reset (fresh clone), I need to set up the environment first. Let me check tooling and install dependencies.
Canonical seed state (4/11/3) achieved. Now let me install Playwright browsers and start the baseline gates.
Playwright browsers already cached. Running baseline gates now — lint, typecheck, unit tests:
E2E exited with code 1 — let me see the full failure details.
All tests fail at 1ms — this is an infrastructure error, not test failures. Let me diagnose:
Version mismatch — installed Playwright 1.64.0 needs chromium-1248, cache has 1200. Installing browsers:
**基线全部通过**：lint ✓ typecheck ✓ 251/251 unit ✓ build ✓ 198/198 E2E ✓ 冒烟测试 121 ✓ — 在一次环境修复（Playwright 浏览器安装）后，完全复现了 s48 收尾状态。

阶段 1 已完成。正在进入阶段 2（审计）— 首先检查 `skills` 目录和 `s48` 验证脚本：
Let me check the s48 verification script patterns and run the F1 bundle sweep (checking for a 19th /login wave):
F2 login-side ledger exact (viewport-fit=cover + PWA trio). Entry chunk still `index-CneaUv24.js` — no 19th wave so far. Verifying byte sizes and contract strings:
**F1 已关闭 —— 第 31 次扫描未出现第 19 次 /login 波动**：所有分块与 s48 记录字节完全一致（104739/58761/900665），`logoutReturnPath` HTTP 200，合约字符串一致。现在让我登录到参考站点进行实时测量。正在检查 `agent-browser` 的可用性：
Logged into the reference. Now measuring F2 dashboard chrome, F3 desktop overflow at 1280×800:
F2 dashboard exact (plain viewport, no PWA trio). F3: their 1328-vs-1280 overflow persists (31st). Now F4 mobile matrix:
Their mobile overflow (468 vs 375) and s4 toast-viewport blocking persist. Attempting their mobile toggle real click:
The toggle is the button at [24,16]. Attempting the real click (the toast div at z-[100] covers it):
**F4 已确认 (第 31 次)**：toast div 覆盖了他们的切换开关 —— 真实点击被拒绝，未出现对话框。他们的缺陷，未被克隆。正在捕获 F5 的参考仪表板：
Reference captured. Now let me examine the s48 our-side verification battery pattern:
Let me check the probe cleanup convention, then write the s49 our-side verification battery:
Writing the s49 our-side verification battery script (repo convention):
Mobile matrix all green (375=375, real click opens 0,0,288,667, Escape, nav-tap). But the round-trip probe failed — the s48 lesson: the title input's placeholder is "Brief summary of the problem", not "Title". Let me fix and re-run just the round-trip:
Round-trip green. Now Prisma-verify the probe, cleanup, and confirm canonical seed:
Probe verified (open/hardware), cleaned, canonical 4/11/3. Now the F5 paired VLM check:
**F5: LAYOUT-OK first attempt** — the 31st sweep is ALL NON-GAP. Now the own-side audit. The session_85 next-probe shortlist leads with per-file test-count claims in PAD §7.1:
Let me examine PAD §7.1 Test Distribution in full — this is the leading audit candidate:
PAD §7.1 lists per-file test counts. Let me measure the actual per-file counts to check for drift — this is the leading own-side audit candidate:
Key findings emerging. Comparing PAD §7.1 claims vs actual:
- `domain.test.ts`: claimed **61**, actual **75** (14 stale)
- `headers-config.test.ts`: claimed **4**, actual **9** (5 stale)
- **3 files missing from the table entirely**: `api-catchall.test.ts` (19), `proxy-fromurl.test.ts` (8), `body-size.test.ts` (11)

Let me verify the E2E per-file claims too:
PAD §7.1 drift confirmed on the E2E side too: `auth.spec.ts` claimed 9, actual **11**. Let me study the s48 corpus pin conventions before designing this session's pin:
Now let me verify the runtime ground-truth tooling for the per-file pins. Testing `vitest list`:
`vitest list` undercounts each-loop tests (226 vs 251 runtime) — the list is not the runtime truth. Let me check the vitest config and think about the ground-truth mechanism:
Let me check the playwright global-setup side effects and whether `--list` triggers them:
`playwright --list` is fast (0.9s) and side-effect-free. Now testing the nested vitest run JSON reporter:
JSON reporter gives exact runtime per-file counts. Checking `.vitest` gitignore status and total:
`.vitest/` needs a gitignore entry. Let me study the shell-out conventions in the existing s47 pins:
Let me check the other shortlist candidates (CLAUDE major-only prose, DEPLOYMENT rate-limit figures) for actual drift:
CLAUDE majors and DEPLOYMENT rate-limit figures are correct (unpinned but no drift). The P1 is the PAD §7.1 surface. Let me identify exactly what the uncounted tests are:
Drift identified precisely. Now let me check the TDD skill from the repo's skills folder (per the task instructions):
The audit is complete. Now let me examine the corpus-count claim sites I'll need to move when the test count grows (the s48 count-move doctrine):
Let me check the CI workflow to ensure the nested vitest run approach works in CI:
CI uses bun + `bun run test`. Let me verify the nested vitest run mechanics with bounded workers and explicit output file:
所有机制已验证。现在开始编写会话 49 的整改计划：
Now writing the TDD pin file. First let me confirm the playwright --list output format precisely:
Writing the session-49 pin file (TDD — the honest RED first):
Fixing a path bug in the E2E list parser before the RED run:
Let me verify no §7.1 rows contain escaped pipes that would break the parser:
Parser verified (21 Vitest + 6 Playwright + 1 smoke rows). Running the honest RED:
Honest RED landed on the domain row (exactly as designed). Two bugs to fix: `toHaveLength` on a number, and the E2E map keys. Debugging the E2E list output:
Found it — the regex captures only the filename stem, not the extension. Fixing the regex and the toHaveLength bug:
**The honest RED is exact** — both pins fail on precisely the audited drift, smoke pin green (clean contract). Now the GREEN step — the surgical PAD fixes. Reading the exact row lines:
All 3 pins GREEN. Now the corpus-count move (251 → 254) — first `.gitignore` + the corpus pins' literal:
Now the corpus-count move 251 → 254 across the 9 live sites:
**254/254 GREEN.** Now the mutation checks — the harness hardened per the s48 lesson (reverse-replace reverts, never checkout):
Mutation B's revert can't handle empty-string replacement. Fixing the mutation design and recovering the row:
All 6 mutations (A–F) bit exactly their pins and reverted green. Now the full gate in the clean environment:
**FULL GATE ALL GREEN**: lint ✓ typecheck ✓ 254/254 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓. Now live re-verification on the remediated build:
Live re-verification complete (mobile matrix green, round-trip verified, VLM LAYOUT-OK first attempt). Now the 10-shot screenshot set:
Creating the s49 screenshot capture script (s48 lineage + S49 fixture title):
Four shots changed (02/04/05/09). Verifying seed canonical and VLM-diffing the changed shots:
All four changed shots BENIGN. Now the docs alignment. Checking the SKILL version marker, AGENTS section boundaries, and PAD known-issues:
Now the docs alignment. Checking exact anchors in README/AGENTS/CLAUDE:
Writing the docs alignment scripts (part 1 — README/AGENTS/CLAUDE):
The first run partially applied (README done, AGENTS failed). Making the script idempotent:
Now part 2 — PAD known-issues row + SKILL v2.47.0:
Now updating the plan's execution status and writing the session_87.md agent log:
Now the worklog entries (tasks 148+) and the final drift-watch re-verification:
Now the final pre-commit gate — full re-run after all docs changes (the pins read the docs, so this catches any narrative-shape collision):
**FINAL GATE ALL GREEN**: lint ✓ typecheck ✓ 254/254 ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓. Now the push phase — setting up the SSH infrastructure:
The shim exists at docs/ssh.sh. Installing paramiko into the venv:
paramiko 5.0.0 installed, no system ssh — deploying the shim outside the repo (per rule 5):
Shim deployed. Now committing the session-49 remediation set:
Commit `f62a99e` on main. Now materializing the operator key and verifying the fingerprint BEFORE the push:
Fingerprint verified — byte-identical to the s30–s48 records. Dry-run with the explicit remote (the s28 lesson):
Dry-run green. Executing the real push:
**PUSH VERIFIED** — `f62a99e` on main, remote == HEAD, keys shredded, no residue. Now polling CI (the run needs ~10 min). Updating the workspace worklog while waiting:
Badge passing, but need to verify it's the NEW run (past the run duration). Checking the runs page:
API rate-limited (the documented fallback pattern). Using badge reads + the runs page via agent-browser:
**CI CONFIRMED**: run #129 for `f62a99e` — **Status: Success**, 3m 19s. Now the final status commit (the closeout pattern):
CI #130 for the final status commit is in progress. Waiting for completion:
**CI #130: Success.** All stages complete. Final verification of the repo state:
**会话 49 已完成 —— 所有七个阶段均已执行并验证。**

**结果总结：**
- **阶段 1–2**：工作区已重置 → 全新克隆 + 环境重建（一次修复：安装 Playwright chromium-1248）；基线测试全绿 (251/198/121)。审计发现 **PAD §7.1 Test Distribution 表格中存在已确认的活跃漂移**：3 个过期计数（domain 61→75，headers-config 4→9，auth.spec 9→11）+ 3 个缺失行（api-catchall/proxy-fromurl/body-size —— 38 个测试未记录，而总计值保持在 251）。
- **阶段 3 (第 31 次扫描，均无差距)**：没有第 19 次 /login 波动；它们的三个缺陷依然存在；我们的移动端矩阵测试全绿，VLM LAYOUT-OK 首次尝试，UI round-trip 已通过 Prisma 验证。
- **阶段 4–5 (TDD)**：3 个逐文件运行时 pin 限制（嵌套 vitest JSON 运行 + playwright `--list`，通过重入哨兵实现递归受限）→ RED → 6 处行修复 → 语料库移动 251→254 → 6 个变更全部通过；完整门禁 **254/198/121** 测试全绿。
- **阶段 6–7**：10 张截图（6 张相同 + 4 张无害），文档已对齐（SKILL v2.47.0，session_87.md，worklog），**`f62a99e` + `a9c5154` 已通过 SSH 包装器推送到 main**（指纹已验证，密钥已粉碎），**CI #129 + #130 均成功**。

**建议的下一步**：下一个会话的探测已预置于 `docs/session_87.md`（第 20 次 /login 波动检查，未固定的 CLAUDE 纯主版本描述，DEPLOYMENT 速率限制数据）。每个阶段的验证现在只需运行一条命令（`scripts/s49-*`）。
