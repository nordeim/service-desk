#!/usr/bin/env python3
"""S61: robust basename-vs-hash comparison of the s60 vs s61 entry chunk refs."""
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


cur_b, cur_p = refs('/tmp/s61-results/cur-chunkrefs.txt')
s60_b, s60_p = refs('/tmp/s61-results/s60-baseline-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} s60={len(s60_b)}")
added = cur_b - s60_b
removed = s60_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & s60_b
rehashed = [b for b in common if cur_p[b] != s60_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == s60_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
