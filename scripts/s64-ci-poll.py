#!/usr/bin/env python3
"""S64: poll my push's CI run (38875997857 on 5a6f80b) — the CALIBRATED read
(the known-green controls #173/#174 signatures vs the cancelled #175)."""
import re
import sys
import time
import urllib.request

RID = "38875997857"
URL = f"https://github.com/nordeim/service-desk/actions/runs/{RID}"

for attempt in range(40):
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"attempt {attempt}: fetch failed {e}")
        time.sleep(30)
        continue
    cs = len(re.findall(r"completed successfully", html))
    canc = len(re.findall(r"[Cc]ancelled", html))
    inprog = len(re.findall(r"In progress", html))
    # the calibrated signature: SUCCESS = 5x completed-successfully (matches #173/#174)
    print(f"attempt {attempt}: completed_successfully={cs} cancelled={canc} in_progress={inprog}")
    if cs >= 5:
        print("VERDICT: COMPLETED SUCCESSFULLY (the calibrated green signature)")
        sys.exit(0)
    if canc >= 5:
        print("VERDICT: CANCELLED")
        sys.exit(1)
    if inprog > 0 or cs == 0:
        time.sleep(30)
        continue
    # completed but not success — dig
    print("VERDICT: completed with a non-success conclusion — investigate")
    sys.exit(2)
print("TIMEOUT waiting for the run")
sys.exit(3)
