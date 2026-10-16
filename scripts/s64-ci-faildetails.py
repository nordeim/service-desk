#!/usr/bin/env python3
"""S64: dig into WHY runs #175/#176 failed — find the failed job + step from
the run page HTML (the job summary boxes + the annotation text)."""
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
    print(f"=== {name} run {rid} ===")
    # job names in the page
    jobs = re.findall(r'href="/nordeim/service-desk/actions/runs/\d+/job/(\d+)"[^>]*>.*?<span[^>]*>([^<]+)</span>', html)
    if not jobs:
        # fallback: job links with any inner text
        jobs = re.findall(r'/nordeim/service-desk/actions/runs/\d+/job/(\d+)', html)
        jobs = [(j, "?") for j in set(jobs)]
    for jid, jname in jobs[:8]:
        print(f"  job {jid}: {jname.strip()[:80]}")
    # any visible failure text fragments
    for pat in ["failed", "error", "Error:", "timed out", "Test timed out"]:
        frags = re.findall(rf'([^<>{{}}]{{0,120}}{re.escape(pat)}[^<>{{}}]{{0,120}})', html)
        for f in frags[:4]:
            f2 = f.strip()
            if f2 and "GitHub" not in f2:
                print(f"  [{pat}] {f2[:200]}")
    print()
