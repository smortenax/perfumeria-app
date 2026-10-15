import { defineConfig } from "vitest/config";

/** `npm test`: the unit tests, which need nothing running. The database's are `npm run test:db`. */
export default defineConfig({
  // The one-click sign-in of `npm run dev` (vite.config.ts): none in the tests.
  define: { __DEV_LOGINS__: "[]" },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
