#!/usr/bin/env python3
"""S60: robust basename-vs-hash comparison of the s59 vs s60 entry chunk refs."""
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


cur_b, cur_p = refs('/tmp/s60-results/cur-chunkrefs.txt')
s59_b, s59_p = refs('/tmp/s60-results/s59-baseline-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} s59={len(s59_b)}")
added = cur_b - s59_b
removed = s59_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & s59_b
rehashed = [b for b in common if cur_p[b] != s59_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == s59_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
