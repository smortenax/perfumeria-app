import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { AppSchema, tables } from "../db/local/schema";
import { loadCatalog, type LocalDb } from "../db/materials";
import { confirmImport } from "./confirm";

/** «Confirm» of an imported sheet, on the copy without network (V3-80). */

const ME = "11111111-1111-4111-8111-111111111111";
const COMMON = "33333333-3333-4333-8333-333333333333";
const MINE = "44444444-4444-4444-8444-444444444444";
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-import-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "import.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  const add = "insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, ?, ?, ?, 0, '[]', '[]', '[]')";
  await copy.execute(add, [COMMON, null, "Guaiacol", "molecule"]);
  await copy.execute(add, [MINE, ME, "My base", "composition"]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

it("a common one becomes your specification with the shop and «I have it»; yours is only marked", async () => {
  const result = await confirmImport(db, ME, [
    { materialId: COMMON, ownerId: null, shop: "Olfatorium", product: "Guaiacol 99%" },
    { materialId: MINE, ownerId: ME, shop: "", product: "" },
  ]);
  expect(result).toEqual({ created: 1, marked: 1 });
  const catalog = await loadCatalog(db, ME);
  const spec = [...catalog.materials.values()].find((m) => m.basedOnId === COMMON)!;
  expect([spec.ownerId, spec.supplier, spec.product, catalog.have.has(spec.id), catalog.have.has(MINE)]).toEqual([ME, "Olfatorium", "Guaiacol 99%", true, true]);
});
