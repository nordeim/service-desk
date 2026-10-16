#!/usr/bin/env python3
"""S65: poll my push's CI run (on 19596b9) — the CALIBRATED read
(the lesson-118 doctrine at its third live use: the known-state control
runs through the same parser FIRST, then the live read)."""
import re
import sys
import time
import urllib.request

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def classify(html: str) -> str:
    cs = len(re.findall(r"completed successfully", html))
    canc = len(re.findall(r"[Cc]ancelled", html))
    inprog = len(re.findall(r"In progress", html))
    if inprog > 0:
        return "IN_PROGRESS"
    if cs >= 5 and canc == 0:
        return "COMPLETED_SUCCESSFULLY"
    if canc >= 5:
        return "CANCELLED"
    return f"UNCLASSIFIED(cs={cs},canc={canc})"


def main() -> int:
    # Step 1: the CONTROLS — both must read correctly through this classifier.
    # Known-green: #177 (38875997857, the s64 remediation push — worklog task 203).
    control_green = classify(fetch("https://github.com/nordeim/service-desk/actions/runs/38875997857"))
    print(f"CONTROL #177 (known-green): {control_green}")
    if control_green != "COMPLETED_SUCCESSFULLY":
        print("CALIBRATION FAILED — the known-green control did not read green. ABORT.")
        return 4

    # Step 2: find the run citing my push commit 19596b9.
    target = sys.argv[1] if len(sys.argv) > 1 else "19596b9"
    actions_html = fetch("https://github.com/nordeim/service-desk/actions?query=branch%3Amain")
    blocks = re.split(r"actions/runs/", actions_html)[1:]
    found = None
    for b in blocks:
        rid_m = re.match(r"(\d+)", b)
        if not rid_m:
            continue
        if target in b:
            found = rid_m.group(1)
            break
    if not found:
        print(f"No run found citing {target} yet — retrying.")
        return 5
    print(f"RUN for {target}: #{found}")
    for attempt in range(40):
        verdict = classify(fetch(f"https://github.com/nordeim/service-desk/actions/runs/{found}"))
        print(f"attempt {attempt}: {verdict}")
        if verdict == "COMPLETED_SUCCESSFULLY":
            print(f"VERDICT: run #{found} on {target} COMPLETED SUCCESSFULLY (the calibrated green signature) — THE PUSH KEPT MAIN GREEN")
            return 0
        if verdict == "CANCELLED":
            print(f"VERDICT: run #{found} CANCELLED")
            return 1
        if verdict.startswith("UNCLASSIFIED"):
            print("VERDICT: completed with a non-success conclusion — investigate")
            return 2
        time.sleep(30)
    print("TIMEOUT waiting for the run")
    return 3


if __name__ == "__main__":
    sys.exit(main())
