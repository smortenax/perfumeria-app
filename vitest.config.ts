import { defineConfig } from "vitest/config";

// Tests for the core: pure TypeScript, no window and no Tauri.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
