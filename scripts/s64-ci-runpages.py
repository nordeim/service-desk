#!/usr/bin/env python3
"""S64: fetch run pages for the operator's two commits (#175, #176) and read
the conclusion (the failure favicon / completed-successfully convention)."""
import re
import sys
import urllib.request

RUNS = {
    "#176 (03250de)": "38871348062",
    "#175 (ade1b69)": "38871211824",
}

for name, rid in RUNS.items():
    url = f"https://github.com/nordeim/service-desk/actions/runs/{rid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"{name}: FETCH FAILED {e}")
        continue
    # the conclusion appears in multiple forms
    completed = re.search(r'This workflow run ([^<]{0,120}?) from', html)
    status_text = re.search(r'completed successfully|completed with failure|failed', html, re.I)
    # the title area carries the status
    m = re.search(r'<title>([^<]+)</title>', html)
    favicon = re.search(r'(failure|success|neutral)\.svg', html)
    concls = set(re.findall(r'WORKFLOW_RUN_CONCLUSION_(\w+)', html))
    print(f"{name} run {rid}:")
    print(f"  title: {m.group(1)[:100] if m else '?'}")
    print(f"  conclusions seen: {concls if concls else '?'}")
    print(f"  status text: {status_text.group(0) if status_text else '?'}")
    print()
