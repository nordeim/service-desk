#!/usr/bin/env python3
"""S57: robust basename-vs-hash comparison of the s56 vs s57 entry chunk refs."""
import re


def refs(path):
    out = set()
    pairs = {}
    for line in open(path):
        line = line.strip().strip('"')
        if not line:
            continue
        m = re.match(r'^(.*)-([A-Za-z0-9_-]{8})\.js$', line)
        if m:
            base, h = m.group(1), m.group(2)
            out.add(base)
            pairs.setdefault(base, set()).add(h)
    return out, pairs


cur_b, cur_p = refs('/tmp/s57-results/cur-chunkrefs.txt')
s56_b, s56_p = refs('/tmp/s57-results/s56-chunkrefs.txt')
print(f"basenames: now={len(cur_b)} s56={len(s56_b)}")
added = cur_b - s56_b
removed = s56_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & s56_b
rehashed = [b for b in common if cur_p[b] != s56_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == s56_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
