import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { AppSchema, tables } from "./local/schema";
import { loadCatalog, type LocalDb } from "./materials";
import { addToShopping, haveItNow, listShopping, missingOf, removeFromShopping, shoppingCsv } from "./shopping";

/** Your shopping list on the copy, without network (V3-79). The sync and the RLS: db-tests/shopping.test.ts. */

const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE = "22222222-2222-4222-8222-222222222222";
const CACAO = "33333333-3333-4333-8333-333333333333";
const PYRAZINE = "44444444-4444-4444-8444-444444444444";
const DPG = "55555555-5555-4555-8555-555555555555";
const THEIRS = "66666666-6666-4666-8666-666666666666";

let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-shopping-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "shopping.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  const add = "insert into materials (id, owner_id, name, kind, solvent, aliases, other_cas, disputed_fields) values (?, ?, ?, ?, ?, '[]', '[]', '[]')";
  await copy.execute(add, [CACAO, null, "Theobroma cacao extract", "natural", 0]);
  await copy.execute(add, [PYRAZINE, null, "2-Acetylpyrazine", "molecule", 0]);
  await copy.execute(add, [DPG, null, "DPG", "molecule", 1]);
  await copy.execute(add, [THEIRS, SOMEONE, "Their base", "composition", 0]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

it("writes a material of the glossary down once, and gains the formula it was missing for", async () => {
  const first = await addToShopping(db, ME, { materialId: CACAO, shop: "Maese Lab", note: "the 10 %" });
  const again = await addToShopping(db, ME, { materialId: CACAO, formulaId: "f-1" });
  expect([first.added, again.added, again.id]).toEqual([true, false, first.id]);
  const [item] = await listShopping(db, ME);
  expect([item.materialId, item.shop, item.note, item.formulaId]).toEqual([CACAO, "Maese Lab", "the 10 %", "f-1"]);
  await expect(addToShopping(db, ME, { materialId: THEIRS })).rejects.toThrow(/glossary or yours/);
});

it("«I have it now» makes it your specification, with the shop, and «I have it»; it leaves the list", async () => {
  const [item] = await listShopping(db, ME);
  const spec = await haveItNow(db, ME, item.id);
  const catalog = await loadCatalog(db, ME);
  const m = catalog.materials.get(spec)!;
  expect([m.ownerId, m.basedOnId, m.supplier]).toEqual([ME, CACAO, "Maese Lab"]);
  expect(catalog.have.has(spec)).toBe(true);
  expect(await listShopping(db, ME)).toEqual([]);
  await expect(haveItNow(db, ME, item.id)).rejects.toThrow(/already off/);
});

it("what a recipe is missing: not what you have, nor through a specification of yours, nor a diluent", async () => {
  const catalog = await loadCatalog(db, ME);
  expect(missingOf([CACAO, PYRAZINE, DPG, PYRAZINE], catalog)).toEqual([PYRAZINE]);
});

it("a line comes off without buying, and someone else cannot touch yours", async () => {
  const { id } = await addToShopping(db, ME, { materialId: PYRAZINE });
  await expect(removeFromShopping(db, SOMEONE, id)).rejects.toThrow(/not on your/);
  await removeFromShopping(db, ME, id);
  expect(await listShopping(db, ME)).toEqual([]);
});

it("the list as a CSV for the shop, quoting what needs it", () => {
  const csv = shoppingCsv(
    [{ id: "1", materialId: CACAO, product: "Cacao abs., 10 %", shop: "Maese Lab", note: null, formulaId: "f", createdAt: null }],
    () => "Theobroma cacao extract",
    () => "Lejía v2",
  );
  expect(csv).toBe('material,product,shop,note,formula\nTheobroma cacao extract,"Cacao abs., 10 %",Maese Lab,,Lejía v2\n');
});
