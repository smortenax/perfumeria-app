import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, it } from "vitest";
import { SupabaseConnector } from "../src/db/connector";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog } from "../src/db/materials";
import { admin, signIn } from "./local";

/**
 * Plan v3, phase 4, «Hecho cuando»: a new browser downloads the whole catalog, with the same
 * counts as Supabase; how long the first download takes and how much it takes up are written
 * down. A new copy of PowerSync with the browser's core stands for the new browser.
 */

let folder = "";
afterAll(async () => {
  rmSync(folder, { recursive: true, force: true });
  await admin.end();
});

it("a new copy downloads the whole catalog, with Supabase's counts", async () => {
  const a = await signIn("A");
  const expected = Object.fromEntries(
    await Promise.all(
      ["materials", "material_components", "regulations", "material_doses", "material_categories"].map(async (table) => {
        const [row] = await admin.unsafe(
          `select count(*)::int as n from ${table} ${table === "material_categories" ? "" : "where owner_id is null or owner_id = $1"}`,
          table === "material_categories" ? [] : [a.id],
        );
        return [table, row.n as number];
      }),
    ),
  );
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-catalog-"));
  const copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "catalog.sqlite", dbLocation: folder } });
  const started = Date.now();
  await copy.connect(new SupabaseConnector(a.db, () => "http://127.0.0.1:8080"));
  await copy.waitForFirstSync();
  const seconds = (Date.now() - started) / 1000;
  const db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  const catalog = await loadCatalog(db, a.id);
  const got = {
    materials: catalog.materials.size,
    material_components: [...catalog.materials.values()].reduce((n, m) => n + m.components.length, 0),
    regulations: [...catalog.materials.values()].reduce((n, m) => n + m.regulations.length, 0),
    material_doses: [...catalog.materials.values()].reduce((n, m) => n + m.doses.length, 0),
    material_categories: catalog.categories.size,
  };
  await copy.disconnect();
  await copy.close();
  const bytes = readdirSync(folder).reduce((n, f) => n + statSync(join(folder, f)).size, 0);
  console.log(`Primera descarga: ${seconds.toFixed(1)} s; la copia ocupa ${(bytes / 1024 / 1024).toFixed(1)} MB; ${JSON.stringify(got)}.`);
  expect(got).toEqual(expected);
});
