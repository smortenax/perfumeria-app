import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Phase 5 check (plan v3, step 5.1): the root config only picks up `src/**`, so this one picks up
 * this folder. Run it from the repository root:
 *   npx vitest run --config migracion-v3/fase-5/vitest.config.ts
 */
export default defineConfig({
  root: fileURLToPath(new URL("../..", import.meta.url)),
  test: {
    include: ["migracion-v3/fase-5/**/*.test.ts"],
    environment: "node",
    // Building the v2's IFRA for 4,000+ materials is lazy, but the dataset itself takes a few seconds.
    testTimeout: 300_000,
  },
});
