import { defineConfig } from "vitest/config";

/** `npm test`: the unit tests, which need nothing running. The database's are `npm run test:db`. */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
