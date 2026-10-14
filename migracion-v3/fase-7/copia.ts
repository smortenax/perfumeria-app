import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCsvRecords } from "../../src/data/csv.ts";
import type { Catalog } from "../../v3/src/db/catalog";
import { AppSchema, tables } from "../../v3/src/db/local/schema";
import { loadCatalog, type LocalDb } from "../../v3/src/db/materials";
// The v3's own packages, from its folder (this one has no dependencies of its own).
import { PowerSyncDatabase } from "../../v3/node_modules/@powersync/node/lib/index.js";
import { wrapPowerSyncWithDrizzle } from "../../v3/node_modules/@powersync/drizzle-driver/lib/src/index.js";

/**
 * Phase 7's copy of the v3 (plan v3, steps 7.5 and 7.6): what a new browser of yours would hold,
 * made from the CSV files: the common materials (v3/datos/), your versions (batch 8) and your
 * formulas (batch 10). Read by the v3's own `loadCatalog` and `loadFormula`.
 */

export const ROOT = join(import.meta.dirname, "..", "..");
/** A fixed owner for your rows: the CSV leaves it empty and the loader writes your account's id. */
export const ME = "00000000-0000-4000-8000-00000000f7f7";
export type Rec = Record<string, string>;
export const csv = (path: string): Rec[] => parseCsvRecords(readFileSync(join(ROOT, path), "utf8")) as Rec[];
const LISTS = new Set(["aliases", "other_cas", "disputed_fields", "markers", "synonyms", "natural_other_cas"]);

export interface Copy {
  readonly db: LocalDb;
  readonly catalog: Catalog;
  readonly close: () => Promise<void>;
}

export async function openCopy(): Promise<Copy> {
  const folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-fase7-"));
  const copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "fase7.sqlite", dbLocation: folder } });
  const load = async (table: string, path: string, owned: boolean) => {
    const rows = csv(path);
    if (rows.length === 0) return;
    const columns = Object.keys(rows[0]);
    await copy.writeTransaction(async (tx) => {
      for (const row of rows) {
        const values = columns.map((c) => {
          if (c === "owner_id" && owned) return ME;
          const v = row[c];
          if (v === "") return LISTS.has(c) ? "[]" : null;
          if (v === "true" || v === "false") return v === "true" ? 1 : 0;
          return v;
        });
        await tx.execute(`insert into ${table} (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")})`, values);
      }
    });
  };
  await load("materials", "v3/datos/materials.csv", false);
  await load("materials", "migracion-v3/tandas/8-tu-version/materials.csv", true);
  await load("material_components", "v3/datos/material_components.csv", false);
  await load("material_components", "migracion-v3/tandas/8-tu-version/material_components.csv", true);
  await load("regulations", "v3/datos/regulations.csv", false);
  await load("regulations", "migracion-v3/tandas/8-tu-version/regulations.csv", true);
  await load("workbenches", "migracion-v3/tandas/10-formulas/workbenches.csv", true);
  await load("formulas", "migracion-v3/tandas/10-formulas/formulas.csv", true);
  await load("formula_events", "migracion-v3/tandas/10-formulas/formula_events.csv", true);
  await load("materials", "migracion-v3/tandas/10-formulas/materials.csv", true);
  const db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  return {
    db,
    catalog: await loadCatalog(db, ME),
    close: async () => {
      await copy.close();
      rmSync(folder, { recursive: true, force: true });
    },
  };
}
