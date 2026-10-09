import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit-test layer for the pure domain seams: auth HMAC/scrypt/rate-limiting
// (src/lib/auth.ts), input validation (src/lib/validation.ts), the ticket
// vocabulary (src/lib/constants.ts), db-path resolution (src/lib/db-path.ts),
// and the date/duration formatters (src/lib/utils.ts). Browser/E2E coverage
// lives in tests/e2e/*.spec.ts (Playwright — never picked up by this config,
// which matches *.test.ts only) plus scripts/smoke-test.sh.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
