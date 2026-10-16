#!/usr/bin/env python3
"""S64: check CI via the actions page HTML — parse the rendered run rows
(the anonymous fallback when both the API and embeddedData fail)."""
import re
import sys
import urllib.request

URL = "https://github.com/nordeim/service-desk/actions?query=branch%3Amain"
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")

# Strategy 1: embeddedData blobs (all of them)
blobs = re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html, re.S)
print(f"json blobs: {len(blobs)}")
for b in blobs:
    if "workflowRun" in b or "headSha" in b or "conclusion" in b:
        # print a compact view of the run entries
        for pat in re.findall(r'\{[^{}]*"conclusion"[^{}]*\}', b):
            sha = re.search(r'"headSha":"([0-9a-f]{8})', pat)
            con = re.search(r'"conclusion":"([^"]*)"', pat)
            num = re.search(r'"runNumber":(\d+)', pat)
            stat = re.search(r'"status":"([^"]*)"', pat)
            title = re.search(r'"displayTitle":"([^"]*)"', pat)
            if con:
                print(f"  run#{num.group(1) if num else '?'} sha={sha.group(1) if sha else '?'} status={stat.group(1) if stat else '?'} conclusion={con.group(1)} title={(title.group(1)[:60] if title else '?')}")

# Strategy 2: the rendered HTML rows (commit links + status icons)
rows = re.findall(r'href="/nordeim/service-desk/commit/([0-9a-f]{8,40})"[^>]*>([^<]*)</a>', html)
print(f"commit links: {len(rows)}")
for sha, title in rows[:10]:
    print(f"  {sha[:8]}: {title.strip()[:70]}")

# Strategy 3: run-page links
runlinks = re.findall(r'/nordeim/service-desk/actions/runs/(\d+)', html)
print(f"run ids: {sorted(set(runlinks), reverse=True)[:8]}")
