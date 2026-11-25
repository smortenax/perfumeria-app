import { defineConfig } from "vitest/config";

/** Las reglas duras de la migración (V3-111): `npx vitest run --config migracion-v3/vitest.config.ts`. */
export default defineConfig({
  test: { include: ["migracion-v3/reglas.test.ts"], environment: "node" },
});
