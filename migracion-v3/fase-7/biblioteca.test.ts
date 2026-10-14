import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseCsvRecords } from "../../src/data/csv.ts";
import { uuidFor } from "../lib/ids.ts";
import { Ratio } from "../../v3/src/core/arith/ratio";
import { compose } from "../../v3/src/core/compose";
import { formulaFromJson } from "../../v3/src/core/io/formula-json";
import { loadFormula, loadFormulas } from "../../v3/src/db/formulas";
import { AppSchema, tables } from "../../v3/src/db/local/schema";
import { loadCatalog } from "../../v3/src/db/materials";
// The v3's own packages, from its folder (this one has no dependencies of its own).
import { PowerSyncDatabase } from "../../v3/node_modules/@powersync/node/lib/index.js";
import { wrapPowerSyncWithDrizzle } from "../../v3/node_modules/@powersync/drizzle-driver/lib/src/index.js";

/**
 * Plan v3, step 7.5, done when: for each formula, compose() from the data gives the composition its
 * file keeps. The data are those a new browser of yours would have: the common materials
 * (v3/datos/), your versions (batch 8) and your formulas (batch 10), in a copy of the v3 made from
 * their CSV files; the formula is read by the v3's own `loadFormula`, frozen accords included (V3-49).
 *
 *   npx vitest run --config migracion-v3/fase-7/vitest.config.ts
 */

const ROOT = join(import.meta.dirname, "..", "..");
const ME = "00000000-0000-4000-8000-00000000f7f7";
type Rec = Record<string, string>;
const csv = (path: string): Rec[] => parseCsvRecords(readFileSync(join(ROOT, path), "utf8")) as Rec[];
const LISTS = new Set(["aliases", "other_cas", "disputed_fields", "markers", "synonyms", "natural_other_cas"]);

let copy: PowerSyncDatabase;
let folder: string;

async function load(table: string, path: string, owned: boolean, ownerColumn = "owner_id") {
  const rows = csv(path);
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  await copy.writeTransaction(async (tx) => {
    for (const row of rows) {
      const values = columns.map((c) => {
        if (c === ownerColumn && owned) return ME;
        const v = row[c];
        if (v === "") return LISTS.has(c) ? "[]" : null;
        if (v === "true" || v === "false") return v === "true" ? 1 : 0;
        return v;
      });
      await tx.execute(`insert into ${table} (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")})`, values);
    }
  });
}

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-biblioteca-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "biblioteca.sqlite", dbLocation: folder } });
  await load("materials", "v3/datos/materials.csv", false);
  await load("materials", "migracion-v3/tandas/8-tu-version/materials.csv", true);
  await load("material_components", "v3/datos/material_components.csv", false);
  await load("material_components", "migracion-v3/tandas/8-tu-version/material_components.csv", true);
  await load("workbenches", "migracion-v3/tandas/10-formulas/workbenches.csv", true);
  await load("formulas", "migracion-v3/tandas/10-formulas/formulas.csv", true);
  await load("formula_events", "migracion-v3/tandas/10-formulas/formula_events.csv", true);
  await load("materials", "migracion-v3/tandas/10-formulas/materials.csv", true);
}, 120_000);

afterAll(async () => {
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
});

const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

describe("your library, from the v3's data (7.5)", () => {
  it("each formula composes to what its file keeps, material by material", async () => {
    const db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
    const catalog = await loadCatalog(db, ME);
    const records = await loadFormulas(db, ME);
    const keyToId = new Map(csv("migracion-v3/tandas/10-formulas/claves.csv").map((r) => [r.id, r.material_id]));
    const library = join(ROOT, "migracion-v3/biblioteca/archivos");
    const files = walk(library);
    expect(files).toHaveLength(30);
    const differences: string[] = [];
    for (const path of files) {
      const file = path.slice(library.length + 1).split("\\").join("/");
      const json = JSON.parse(readFileSync(path, "utf8"));
      const record = records.find((r) => r.id === uuidFor(`formula:${file}`));
      expect(record, file).toBeDefined();
      // What the file keeps, by the v3 material each key became (several keys may be one material).
      const expected = new Map<string, Ratio>();
      for (const part of json.composition as Array<{ key: string; massUg: string }>) {
        const id = keyToId.get(part.key);
        expect(id, `${file}: ${part.key}`).toBeDefined();
        expected.set(id!, (expected.get(id!) ?? Ratio.ZERO).add(Ratio.parse(part.massUg)));
      }
      const got = new Map<string, Ratio>();
      for (const part of compose(await loadFormula(db, catalog, ME, record!.id)).parts) got.set(part.material.key, (got.get(part.material.key) ?? Ratio.ZERO).add(part.massUg));
      for (const id of new Set([...expected.keys(), ...got.keys()])) {
        const [a, b] = [expected.get(id) ?? Ratio.ZERO, got.get(id) ?? Ratio.ZERO];
        if (!a.eq(b)) differences.push(`${file}: ${catalog.materials.get(id)?.name ?? id}: el archivo ${a} µg, la v3 ${b} µg`);
      }
      // The engine reads the file the same way: the same history, the same length.
      expect((await loadFormula(db, catalog, ME, record!.id)).history.length, file).toBe(formulaFromJson(readFileSync(path, "utf8")).history.length);
    }
    expect(differences).toEqual([]);
  });
});
