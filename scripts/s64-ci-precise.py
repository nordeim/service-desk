#!/usr/bin/env python3
"""S64: precise conclusion read — the run page's own status summary,
ignoring the feature-flag false positives (copilot_fix_failed_workflows)."""
import re
import urllib.request

RUNS = {
    "#176 (03250de)": "38871348062",
    "#175 (ade1b69)": "38871211824",
    "#174 (faa16e6, known-GREEN control)": "38860844223",
    "#173 (44b7878, known-GREEN control)": "38860202409",
}

for name, rid in RUNS.items():
    url = f"https://github.com/nordeim/service-desk/actions/runs/{rid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"{name}: FETCH FAILED {e}")
        continue
    # The precise markers (run page body text):
    #   - "completed successfully" (success)
    #   - "cancelled" (workflow cancelled)
    #   - "failed" as a standalone status word near the title
    # Control runs (#173/#174) calibrate the patterns.
    findings = {
        "completed_successfully": len(re.findall(r'completed successfully', html)),
        "was_cancelled": len(re.findall(r'[Cc]ancelled', html)),
        "failure_word": len(re.findall(r'\bfailure\b', html, re.I)),
        "X_icon": len(re.findall(r'multipart/alternative', html)),
    }
    # the og:description / twitter meta sometimes carries status
    og = re.search(r'<meta name="og:description" content="([^"]*)"', html)
    tw = re.search(r'<meta name="twitter:description" content="([^"]*)"', html)
    print(f"{name}:")
    print(f"  findings: {findings}")
    if og: print(f"  og:description: {og.group(1)[:140]}")
    if tw: print(f"  twitter:desc:   {tw.group(1)[:140]}")
    print()
