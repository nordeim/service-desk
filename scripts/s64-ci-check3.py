#!/usr/bin/env python3
"""S64: parse the actions-page embeddedData JSON properly (nested objects)."""
import json
import re
import sys
import urllib.request

URL = "https://github.com/nordeim/service-desk/actions?query=branch%3Amain"
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")

blobs = re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html, re.S)

def walk(obj, out):
    """collect every dict that looks like a workflow run"""
    if isinstance(obj, dict):
        keys = set(obj.keys())
        if {"headSha", "runNumber"} & keys or "conclusion" in keys and "headSha" in keys:
            out.append(obj)
        for v in obj.values():
            walk(v, out)
    elif isinstance(obj, list):
        for v in obj:
            walk(v, out)

runs = []
for b in blobs:
    try:
        walk(json.loads(b), runs)
    except Exception:
        pass

# dedupe by runNumber+sha
seen = set()
print(f"candidate run objects: {len(runs)}")
for r in runs[:20]:
    num = r.get("runNumber") or r.get("number")
    sha = (r.get("headSha") or "")[:8]
    key = (num, sha)
    if key in seen:
        continue
    seen.add(key)
    con = (r.get("conclusion") or "").replace("WORKFLOW_RUN_CONCLUSION_", "")
    stat = (r.get("status") or "").replace("WORKFLOW_RUN_STATUS_", "")
    title = r.get("displayTitle") or r.get("title") or ""
    created = r.get("createdAt", "")
    print(f"run#{num} sha={sha} status={stat} conclusion={con} created={created} title={str(title)[:60]}")
