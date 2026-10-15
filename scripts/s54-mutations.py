#!/usr/bin/env python3
"""S54: the mutation applier/reverter — each mutation is an exact-string
apply + reverse-replace revert (NEVER git checkout, the s48 doctrine).
Usage: s54-mutations.py apply|revert A|B|C|D|E|F|G"""
import sys

REPO = "/home/z/my-project/service-desk"

# (file, old, new, label) — old = the GREEN state (apply: old->new, revert: new->old)
MUTATIONS = {
    # A: the route-head MAP entry commented out — bites pin 1 (the fs boundary:
    # the seam falls out of MAP ∪ EXCLUSIONS; the forward-guard direction). The
    # comment-out form (never a deletion — the s49 empty-needle doctrine: the
    # revert side must be a non-empty unique string)
    "A": ("tests/pad-coverage-contract.test.ts",
          '  "src/lib/route-head.ts": "src/lib/__tests__/route-head.test.ts",',
          '  // "src/lib/route-head.ts": "src/lib/__tests__/route-head.test.ts", // mutation A'),
    # B: a MAP entry's test path mutated to a nonexistent file — bites pin 2's
    # EXISTENCE check (the mapped test does not exist)
    "B": ("tests/pad-coverage-contract.test.ts",
          '"src/lib/api-methods.ts": "tests/api-methods.test.ts",',
          '"src/lib/api-methods.ts": "tests/api-methods2.test.ts",'),
    # C: a MAP entry pointed at an EXISTING test that does not import the
    # source — bites pin 2's IMPORT-verification (the dishonest-map direction)
    "C": ("tests/pad-coverage-contract.test.ts",
          '"src/lib/auth.ts": "src/lib/__tests__/auth.test.ts",',
          '"src/lib/auth.ts": "tests/db-path.test.ts",'),
    # D: a phantom exclusion added (a file in neither fs nor MAP) — bites pin
    # 3's fs-existence check (the stale-exclusion direction)
    "D": ("tests/pad-coverage-contract.test.ts",
          'const EXCLUSIONS: Record<string, string> = {\n  "src/lib/db.ts":',
          'const EXCLUSIONS: Record<string, string> = {\n  "src/lib/legacy-util.ts": "the pre-s12 helper",\n  "src/lib/db.ts":'),
    # E: the §7.1 route-head row's figure 4 -> 2 — bites the s49 pad pin AND
    # the s50 BRIDGE (the §7.1 sum 270 -> 268)
    "E": ("Project_Architecture_Document.md",
          "the s8 DESCRIPTION freeze; the E2E mechanism pins stay in visual-parity.spec.ts) | 1 | 4 | `src/lib/__tests__/route-head.test.ts` | Vitest |",
          "the s8 DESCRIPTION freeze; the E2E mechanism pins stay in visual-parity.spec.ts) | 1 | 2 | `src/lib/__tests__/route-head.test.ts` | Vitest |"),
    # F: a family-site revert — bites the s48 family pin + the s50 BRIDGE
    "F": ("README.md",
          "tests-270%20unit",
          "tests-263%20unit"),
    # G: the url field dropped from route-head.ts's openGraph block (a SOURCE
    # mutation) — bites the seam test's trio agreement + og-set completeness
    "G": ("src/lib/route-head.ts",
          "      images: OG_IMAGES,\n      url: segment,\n    },",
          "      images: OG_IMAGES,\n    },"),
}

def main():
    mode, key = sys.argv[1], sys.argv[2]
    path, old, new = MUTATIONS[key]
    with open(f"{REPO}/{path}") as f:
        content = f.read()
    src, dst = (old, new) if mode == "apply" else (new, old)
    n = content.count(src)
    if n != 1:
        print(f"FATAL: mutation {key} {mode}: expected exactly 1 occurrence of the {mode}-side string, found {n}")
        sys.exit(1)
    with open(f"{REPO}/{path}", "w") as f:
        f.write(content.replace(src, dst))
    print(f"OK: mutation {key} {mode} on {path}")

if __name__ == "__main__":
    main()
