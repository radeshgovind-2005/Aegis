import { defineConfig } from "vitest/config";

// Unit test config: runs in standard Node environment.
// Used for src/domain/, src/application/, and src/ports/ tests.
// No @cloudflare/vitest-pool-workers — these tests have zero Workers dependencies.
//
// Coverage is only activated when this config is run with --coverage
// (i.e., via `npm run test:coverage`). scripts/check-coverage.mjs then
// reads coverage/coverage-summary.json and enforces per-path thresholds.
export default defineConfig({
  test: {
    include: [
      "test/domain/**/*.spec.ts",
      "test/application/**/*.spec.ts",
      "test/ports/**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      // json-summary is read by scripts/check-coverage.mjs for threshold gates.
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage",
      include: [
        "src/domain/**/*.ts",
        "src/application/**/*.ts",
        "src/ports/**/*.ts",
      ],
    },
  },
});
