#!/usr/bin/env python3
"""S66: robust basename-vs-hash comparison of the s65 vs s66 entry chunk refs."""


def refs(path):
    out = set()
    pairs = {}
    for line in open(path):
        line = line.strip().strip('"')
        if not line:
            continue
        import re
        m = re.match(r'^(.*)-([A-Za-z0-9_-]{8})\.(js|css|woff2?)$', line)
        if m:
            base, h = m.group(1), m.group(2)
            out.add(base)
            pairs.setdefault(base, set()).add(h)
    return out, pairs


cur_b, cur_p = refs('/tmp/s66-results/cur-chunkrefs.txt')
s65_b, s65_p = refs('/tmp/s66-results/s65-baseline-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} s65={len(s65_b)}")
added = cur_b - s65_b
removed = s65_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & s65_b
rehashed = [b for b in common if cur_p[b] != s65_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == s65_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
