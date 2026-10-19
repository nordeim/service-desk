#!/usr/bin/env python3
"""S78: robust basename-vs-hash comparison of the 40th-wave entry (EM0yvqO9,
the second-to-last recorded rotation of the triple-wave s78 window) vs the
current entry chunk refs — the honest-record form (the per-wave records:
the 39th vs Bt_cFPps 6/1/435/269; the 40th vs B2q8HDZS 0/1/420/289; the
41st vs EM0yvqO9 5 added / 2 removed, 409 re-hashed / 298 hash-stable —
all platform-infrastructure, user-facing non-gap)."""


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


cur_b, cur_p = refs('/tmp/s78-results/cur-chunkrefs.txt')
found_b, found_p = refs('/tmp/s78-results/s78-found-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} 40th-wave={len(found_b)}")
added = cur_b - found_b
removed = found_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & found_b
rehashed = [b for b in common if cur_p[b] != found_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == found_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
