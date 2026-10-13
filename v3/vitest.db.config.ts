import { defineConfig } from "vitest/config";

/**
 * `npm run test:db` (plan v3, step 2.8): against the local Supabase and PowerSync, with the two
 * local test users of .env.local. Needs `npm run db:start`, `npm run env:local`,
 * `npm run db:test-users` and `npm run sync:start` first.
 */
export default defineConfig({
  test: {
    include: ["db-tests/**/*.test.ts"],
    setupFiles: ["db-tests/env.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
