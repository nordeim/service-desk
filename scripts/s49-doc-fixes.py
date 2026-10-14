#!/usr/bin/env python3
"""S49: the PAD §7.1 distribution fixes — every replacement count-verified exactly-once
(the s46 display-artifact doctrine: bracket-free anchors only; never copy a
bracket-prefixed string from tool output — the anchors below are hex-safe)."""
import sys

PAD = "Project_Architecture_Document.md"

def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n}")
        sys.exit(1)
    print(f"OK: {label} (1 site)")
    return text.replace(old, new, 1)

with open(PAD, encoding="utf-8") as f:
    pad = f.read()

# 1. the domain row: 61 → 75 (the s35 validateAttachments + validation-seam growth)
pad = replace_once(
    pad,
    "| 1 | 61 | `src/lib/__tests__/domain.test.ts` | Vitest |",
    "| 1 | 75 | `src/lib/__tests__/domain.test.ts` | Vitest |",
    "domain row count 61→75",
)

# 2. the headers-config row: 4 → 9 + the s34 cache-contract description
pad = replace_once(
    pad,
    "| Unit — next-config headers contract (the s30 HSTS + poweredByHeader pins) | 1 | 4 | `tests/headers-config.test.ts` | Vitest |",
    "| Unit — next-config headers contract (the s30 HSTS + poweredByHeader pins + the s34 cache-behavior contract: the universal rule, the API blanket no-store, the s15 attachment exception with its exact immutable-private window, the load-bearing order, the /api scoping) | 1 | 9 | `tests/headers-config.test.ts` | Vitest |",
    "headers-config row count 4→9 + description",
)

# 3. the auth.spec E2E row: 9 → 11 + the signup-pair description
pad = replace_once(
    pad,
    "| E2E — auth surface (logged-out incl. the s19 deep-link contract + the s20 reset-detour pin) | 1 | 9 | `tests/e2e/auth.spec.ts` | Playwright |",
    "| E2E — auth surface (logged-out incl. the s19 deep-link contract + the s20 reset-detour pin + the signup-page pair: the in-card/account creation + the weak-password rejection) | 1 | 11 | `tests/e2e/auth.spec.ts` | Playwright |",
    "auth.spec row count 9→11 + description",
)

# 4. the three missing rows (inserted after the db-path row, the table's last unit row
#    before the E2E block — alphabetical-free, keeps the session-numbered narrative order)
pad = replace_once(
    pad,
    "| Unit — db-path URL contract | 1 | 15 | `tests/db-path.test.ts` | Vitest |",
    "| Unit — db-path URL contract | 1 | 15 | `tests/db-path.test.ts` | Vitest |\n"
    "| Unit — the s33 API catch-all 404 contract (unknown /api/** paths answer 404 + JSON on every method incl. the bare segment; HEAD empty-body; OPTIONS 404-not-204; the known routes unshadowed; the set-cookie attribute set on the login/signup/logout trio; 5+5 parallel mutations all-2xx with the coherent final count) | 1 | 19 | `tests/api-catchall.test.ts` | Vitest |\n"
    "| Unit — the s36 proxy-contract pins (the from_url construction + the matcher boundary; the spoofed-Host guard, the X-Forwarded-Proto flip, the X-Forwarded-Host ignore, the login-page reflection surface, the unmatched sub-path 404, the deep-link query survival) | 1 | 8 | `tests/proxy-fromurl.test.ts` | Vitest |\n"
    "| Unit — the s35 request-size seam (the shared parseBodySize 10 MiB ceiling checked BEFORE the body is read — 413 + the message naming 10485760; the attachment size-honesty + canonical-base64 + boundary pins; the chunked pass-through) | 1 | 11 | `tests/body-size.test.ts` | Vitest |\n"
    "| Unit — the s49 PAD §7.1 test-distribution pins (the per-file runtime pins: the nested vitest JSON run + the playwright --list, bidirectional — every row names its file's runtime count, every runtime file has a row; + the smoke-row agreement with the s48 corpus family) | 1 | 3 | `tests/pad-testcount-contract.test.ts` | Vitest |",
    "the three missing rows + the s49 pin row",
)

with open(PAD, "w", encoding="utf-8") as f:
    f.write(pad)

print("PAD §7.1 distribution fixes complete")
