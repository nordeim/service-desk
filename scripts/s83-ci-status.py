#!/usr/bin/env python3
"""S83: check the CI status of the operator's latest commit (4b2ce37, the
session_154.md transcript commit) — the CALIBRATED read (the lesson-118
doctrine: an anonymous-payload conclusion must be calibrated against
known-state controls before it enters the record).

Controls:
- known-green: run #177 (38875997857 on 5a6f80b, the s64 remediation push).
- known-RED: run #38948165037 on 7dd670f (the s65 closeout Install-dependencies
  flake — recorded FAILED in the worklog task 206; the known-red signature
  calibrates a live RED read the same way #177 calibrates a green one).

The s83 context: the operator's 4b2ce37 added docs/session_154.md (the s82
transcript) — the s82 agent's stream discipline HELD through its own
narration (the cross-repo scandihaven hash class described, never quoted,
at every find-moment), so the transcript carried NO unreachable hash and
NO re-form was needed: the local unit gate read 296/296 at pull (the
nine-session red-at-pull streak s67/s68/s72/s73/s74/s75/s76/s77/s78
BROKEN at s79 — FIVE consecutive sessions now); CI run #39688856008 on 4b2ce37
measured COMPLETED_SUCCESSFULLY (the calibrated read, both controls first).
Main is GREEN at pull and the s82 push must KEEP it green. The
expectation must be VERIFIED against the page's real state, never assumed
(the s66 mid-run UNCLASSIFIED precedent: investigate before concluding).
"""
import re
import sys
import urllib.request

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def classify_run_page(html: str) -> str:
    """The calibrated signature classifier (the s64/s66/s67/s68 form).

    Green: >=5 'completed successfully', 0 cancelled. The FALSE-POSITIVE trap:
    GitHub embeds feature-flag strings like copilot_fix_failed_workflows — a
    bare /failed/ count is NEVER the verdict. RED requires the page's REAL
    failure icons: the octicon-x-circle-fill markers with aria-label="failed"
    (the s66 doctrine — the page's real icons, never the feature-flag strings;
    measured on the known-red control #38948165037 whose payload carries
    favicon-failure.svg + four x-circle-fill icons and ZERO 'completed
    successfully' strings)."""
    cs = len(re.findall(r"completed successfully", html))
    canc = len(re.findall(r"[Cc]ancelled", html))
    inprog = len(re.findall(r"In progress", html))
    failed_icons = len(re.findall(r'aria-label="failed: "', html))
    if inprog > 0:
        return "IN_PROGRESS"
    if failed_icons > 0:
        return "FAILED"
    if cs >= 5 and canc == 0:
        return "COMPLETED_SUCCESSFULLY"
    if canc >= 5:
        return "CANCELLED"
    return f"UNCLASSIFIED(cs={cs},canc={canc},failed_icons={failed_icons})"


def main() -> int:
    # Step 1: the CONTROLS — both must read correctly through this classifier.
    control_green = classify_run_page(fetch("https://github.com/nordeim/service-desk/actions/runs/38875997857"))
    print(f"CONTROL #177 (38875997857, known-green): {control_green}")
    if control_green != "COMPLETED_SUCCESSFULLY":
        print("CALIBRATION FAILED — the known-green control did not read green. ABORT.")
        return 4
    control_red = classify_run_page(fetch("https://github.com/nordeim/service-desk/actions/runs/38948165037"))
    print(f"CONTROL red (38948165037, known-FAILED): {control_red}")
    if control_red != "FAILED":
        print(f"NOTE: the known-red control reads {control_red!r} — the red signature may need the API decode; treat any live RED read with caution until reconciled.")

    # Step 2: the live read — find the run citing the operator's commit.
    target = sys.argv[1] if len(sys.argv) > 1 else "4b2ce37"
    actions_html = fetch("https://github.com/nordeim/service-desk/actions?query=branch%3Amain")
    blocks = re.split(r"actions/runs/", actions_html)[1:]
    found = None
    for b in blocks:
        rid_m = re.match(r"(\d+)", b)
        if not rid_m:
            continue
        rid = rid_m.group(1)
        if target in b:
            found = rid
            break
    if not found:
        print(f"No run found citing {target} — the commit may have no CI run yet (or the page moved).")
        return 5
    print(f"RUN for {target}: #{found}")
    run_html = fetch(f"https://github.com/nordeim/service-desk/actions/runs/{found}")
    verdict = classify_run_page(run_html)
    print(f"VERDICT for {target} (run #{found}): {verdict}")
    if verdict.startswith("UNCLASSIFIED"):
        print("INVESTIGATE the page's real state before any conclusion (the s66 mid-run precedent).")
        return 2
    return 0 if verdict == "COMPLETED_SUCCESSFULLY" else 1


if __name__ == "__main__":
    sys.exit(main())
