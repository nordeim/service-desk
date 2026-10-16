#!/usr/bin/env python3
"""S65: check the CI status of the operator's latest commit (3d8a835) — the
CALIBRATED read (the lesson-118 doctrine: an anonymous-payload conclusion must
be calibrated against a known-state control before it enters the record).

The known-green control: run #177 (38875997857 on 5a6f80b) — recorded green in
the worklog task 203-push-s64. Its signature through this same parser
calibrates the live reads. The known-cancelled control: #175 (38871211824).

Method: fetch the anonymous actions page, locate the run row citing the target
commit sha, then fetch that run's page and classify by signature.
"""
import re
import sys
import urllib.request

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def classify_run_page(html: str) -> str:
    """The calibrated signature classifier (the s64 form)."""
    cs = len(re.findall(r"completed successfully", html))
    canc = len(re.findall(r"[Cc]ancelled", html))
    inprog = len(re.findall(r"In progress", html))
    failed = len(re.findall(rf"\bfailed\b", html, re.I))
    # The known-green signature: >=5 completed-successly, 0 cancelled
    # (byte-identical to the #173/#174 controls per the worklog record).
    # The FALSE-POSITIVE trap: GitHub embeds feature-flag strings like
    # copilot_fix_failed_workflows — a bare /failed/ count is NEVER the verdict.
    if inprog > 0:
        return "IN_PROGRESS"
    if cs >= 5 and canc == 0:
        return "COMPLETED_SUCCESSFULLY"
    if canc >= 5:
        return "CANCELLED"
    return f"UNCALASSIFIED(cs={cs},canc={canc},failed_str={failed})"


def main() -> int:
    # Step 1: the CONTROL — run #177 must read green through this classifier.
    control_html = fetch("https://github.com/nordeim/service-desk/actions/runs/38875997857")
    control_verdict = classify_run_page(control_html)
    print(f"CONTROL #177 (38875997857, known-green): {control_verdict}")
    if control_verdict != "COMPLETED_SUCCESSFULLY":
        print("CALIBRATION FAILED — the control did not read green; the classifier is broken. ABORT.")
        return 4

    # Step 2: the live read — find the run citing the operator's commit.
    target = sys.argv[1] if len(sys.argv) > 1 else "3d8a835"
    actions_html = fetch("https://github.com/nordeim/service-desk/actions?query=branch%3Amain")
    # The page payload carries each run's block in BOTH an href form and a JSON
    # form (workflowFileUrl + linkText). Split on the bare actions/runs/ prefix
    # so BOTH forms produce blocks; each block starts with the run id.
    blocks = re.split(r"actions/runs/", actions_html)[1:]
    found = None
    for b in blocks:
        rid_m = re.match(r"(\d+)", b)
        if not rid_m:
            continue
        rid = rid_m.group(1)
        # The commit sha appears as linkText in the run's own payload — search
        # the whole block (the JSON form places it several KB after the id).
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
    return 0 if verdict == "COMPLETED_SUCCESSFULLY" else 1


if __name__ == "__main__":
    sys.exit(main())
