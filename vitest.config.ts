import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit-test layer for the pure domain seams: auth HMAC/scrypt/rate-limiting
// (src/lib/auth.ts), input validation (src/lib/validation.ts), the ticket
// vocabulary (src/lib/constants.ts), db-path resolution (src/lib/db-path.ts),
// and the date/duration formatters (src/lib/utils.ts). Browser/E2E coverage
// lives in tests/e2e/*.spec.ts (Playwright — never picked up by this config,
// which matches *.test.ts only) plus scripts/smoke-test.sh.
//
// Coverage gate (session 98 — the §20 known-issues register's
// no-coverage-threshold row closed): `bun run test:coverage` runs this suite
// under the v8 provider and FAILS below the thresholds. The include surface
// is deliberately src/lib/** — the unit tier's own seam surface. Components
// and app routes are the E2E tier's surface (§14's three-tier law); a
// threshold over them would fail by design (the tier-mismatch trap).
// Thresholds are the measured-minus-headroom form: src/lib measured
// 92.01% stmts / 88.80% branches / 92.15% funcs / 95.81% lines at s98
// (346 tests); ~2 points of refactor headroom, any real seam regression
// drops far below. Pinned by tests/gate-config-contract.test.ts pin 5.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 93,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
