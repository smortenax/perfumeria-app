import { defineConfig } from "vitest/config";

// Tests for the core: pure TypeScript, no window and no Tauri.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // The v2 grows with every lot of the glossary (thousands of materials): building its IFRA takes seconds, and the default 5 s is a flake, not a check.
    testTimeout: 30_000,
  },
});
