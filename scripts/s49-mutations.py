#!/usr/bin/env python3
"""S49: the mutation checks — each must bite EXACTLY its pin, observed failing,
then REVERSE-REPLACED (never `git checkout` — the s48 harness lesson: checkout
wipes uncommitted remediation), then re-verified green.
Run via the bash runner which captures vitest output per mutation."""
import sys

PAD = "Project_Architecture_Document.md"

def apply(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL {label}: expected 1, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"APPLIED {label}")

def revert(path: str, old: str, new: str, label: str) -> None:
    # reverse-replace: swap back the exact strings
    apply(path, new, old, f"REVERT {label}")

MUTATIONS = {
    # A: the §7.1 unit count revert — must bite the unit pin (direction 1)
    "A": (PAD, "| 1 | 75 | `src/lib/__tests__/domain.test.ts` | Vitest |",
             "| 1 | 61 | `src/lib/__tests__/domain.test.ts` | Vitest |"),
    # B: the dropped §7.1 row — must bite the unit pin's completeness direction
    # (apply: remove the row via its neighbor anchor; revert: re-insert — an
    # empty-string revert can never be count-verified, so both directions use
    # the same anchor pair)
    "B": (PAD, "| 1 | 8 | `tests/proxy-fromurl.test.ts` | Vitest |\n| Unit — the s35 request-size seam (the shared parseBodySize 10 MiB ceiling checked BEFORE the body is read — 413 + the message naming 10485760; the attachment size-honesty + canonical-base64 + boundary pins; the chunked pass-through) | 1 | 11 | `tests/body-size.test.ts` | Vitest |\n",
             "| 1 | 8 | `tests/proxy-fromurl.test.ts` | Vitest |\n"),
    # C: the §7.1 E2E count revert — must bite the E2E pin
    "C": (PAD, "| 1 | 11 | `tests/e2e/auth.spec.ts` | Playwright |",
             "| 1 | 9 | `tests/e2e/auth.spec.ts` | Playwright |"),
    # D: the smoke-row figure edit — must bite the smoke-agreement pin
    "D": (PAD, "| API smoke | 1 | 121 steps", "| API smoke | 1 | 111 steps"),
    # E: the corpus site revert — must bite the s48 corpus family pin
    "E": ("README.md", "tests-254%20unit", "tests-251%20unit"),
    # F: the pin file's own row count edit — must bite the unit pin
    "F": (PAD, "| 1 | 3 | `tests/pad-testcount-contract.test.ts` | Vitest |",
             "| 1 | 2 | `tests/pad-testcount-contract.test.ts` | Vitest |"),
}

if __name__ == "__main__":
    action, key = sys.argv[1], sys.argv[2]
    path, old, new = MUTATIONS[key]
    if action == "apply":
        apply(path, old, new, f"mutation {key}")
    elif action == "revert":
        revert(path, old, new, f"mutation {key}")
    else:
        print(f"FATAL: unknown action {action}")
        sys.exit(1)
