#!/usr/bin/env python3
"""S64: check CI status of the operator's latest commits (ade1b69, 03250de)
via the anonymous GitHub actions-page embeddedData payload (the standing
convention — api.github.com is rate-limited per-session)."""
import json
import re
import sys
import urllib.request

REPO = "nordeim/service-desk"
URL = f"https://github.com/{REPO}/actions?query=branch%3Amain"

req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (s64-ci-check)"})
try:
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
except Exception as e:
    print(f"FATAL: actions page fetch failed: {e}")
    sys.exit(1)

# The embeddedData JSON payload carries the workflow runs list
m = re.search(r'<script type="application/json" data-target="react-app.embeddedData">(.*?)</script>', html, re.S)
if not m:
    # fallback: look for any json blob with workflowRun entries
    m = re.search(r'"workflowRuns":\s*\[', html)
    if m:
        # find the enclosing payload
        start = html.rfind('<script type="application/json"', 0, m.start())
        end = html.find('</script>', m.start())
        payload = html[html.find('>', start) + 1:end]
    else:
        print("FATAL: no embeddedData payload found")
        sys.exit(1)
else:
    payload = m.group(1)

try:
    data = json.loads(payload)
except Exception as e:
    print(f"FATAL: payload JSON parse failed: {e}")
    sys.exit(1)

runs = (
    data.get("payload", {}).get("workflowRuns", {})
    if isinstance(data.get("payload", {}).get("workflowRuns", {}), dict)
    else data.get("workflowRuns", [])
)
if isinstance(runs, dict):
    runs = runs.get("workflowRuns", runs.get("nodes", []))

print(f"runs found: {len(runs)}")
for r in runs[:12]:
    print(
        f"#{r.get('runNumber', '?')} "
        f"sha={ (r.get('headSha') or '')[:8] } "
        f"status={r.get('status')} "
        f"conclusion={r.get('conclusion')} "
        f"title={ (r.get('title') or r.get('displayTitle') or '')[:70] }"
    )
