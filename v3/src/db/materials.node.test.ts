import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { AppSchema, tables } from "./local/schema";
import {
  addComponent,
  addDose,
  addRegulation,
  createMaterial,
  deleteMaterial,
  loadCatalog,
  removeComponent,
  setHave,
  updateMaterial,
  type LocalDb,
} from "./materials";

/**
 * Plan v3, step 3.2, without network: the repository against a copy that is connected to
 * nothing, as the browser is offline. What it writes stays in the copy and waits in the
 * upload queue; the upload against Supabase is db-tests/repository.test.ts.
 */

const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE = "22222222-2222-4222-8222-222222222222";
const COMMON = "33333333-3333-4333-8333-333333333333";
const SOMEONE_S = "44444444-4444-4444-8444-444444444444";
const MY_FROZEN = "55555555-5555-4555-8555-555555555555";

let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

const queued = async () => (await copy.getUploadQueueStats()).count;
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-repo-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "repo.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  // What the sync would have brought: a common material, someone else's and a frozen formula of mine.
  await copy.execute("insert into materials (id, owner_id, name, kind) values (?, null, 'Linalool', 'molecule')", [COMMON]);
  await copy.execute("insert into materials (id, owner_id, name, kind) values (?, ?, 'Su base', 'composition')", [SOMEONE_S, SOMEONE]);
  await copy.execute("insert into materials (id, owner_id, name, kind) values (?, ?, 'Mi acorde', 'frozen')", [MY_FROZEN, ME]);
});

afterAll(async () => {
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
});

describe("the repository on the copy, without network", () => {
  it("creates a material of the user's, reads it back exact, and leaves it waiting to go up", async () => {
    const before = await queued();
    const id = await createMaterial(db, ME, {
      name: " Mi linalool ",
      kind: "molecule",
      aliases: ["LIN"],
      purity: pct("98"),
      family: "floral",
      basedOnId: COMMON,
      supplier: "Maese Lab",
    });
    expect(await queued()).toBe(before + 1);
    const m = (await loadCatalog(db, ME)).materials.get(id)!;
    expect(m).toMatchObject({ ownerId: ME, name: "Mi linalool", kind: "molecule", aliases: ["LIN"], family: "floral", basedOnId: COMMON, solvent: false });
    expect(m.purity!.eq(Ratio.of(49n, 50n))).toBe(true);
  });

  it("an unknown stays unknown: no purity is null, and no composition is none", async () => {
    const id = await createMaterial(db, ME, { name: "Absoluto sin ficha", kind: "natural" });
    const m = (await loadCatalog(db, ME)).materials.get(id)!;
    expect(m.purity).toBeNull();
    expect(m.family).toBeNull();
    expect(m.components).toEqual([]);
  });

  it("keeps the composition, the limits, the doses and «lo que tengo», each exact and with its source", async () => {
    const base = await createMaterial(db, ME, { name: "Mi base", kind: "composition" });
    await addComponent(db, ME, base, COMMON, { kind: "exact", value: pct("30") }, "product", "ficha del fabricante");
    await addComponent(db, ME, base, MY_FROZEN, { kind: "range", min: pct("1"), max: pct("2.5") }, "consensus", "cata");
    await addRegulation(db, ME, base, { regime: "manufacturer", kind: "max", maxValue: pct("0.0082"), authority: "product", source: "certificado" });
    await addDose(db, ME, base, { typical: pct("2"), basis: "concentrate", authority: "literature", source: "Fraterworks" });
    await setHave(db, ME, base, true);
    let catalog = await loadCatalog(db, ME);
    const m = catalog.materials.get(base)!;
    expect(m.components.map((c) => [c.componentId, c.amount.kind, c.authority, c.source])).toEqual(
      expect.arrayContaining([
        [COMMON, "exact", "product", "ficha del fabricante"],
        [MY_FROZEN, "range", "consensus", "cata"],
      ]),
    );
    const exact = m.components.find((c) => c.amount.kind === "exact")!.amount;
    expect(exact.kind === "exact" && exact.value.eq(Ratio.of(3n, 10n))).toBe(true);
    expect(m.regulations[0].maxValue!.eq(Ratio.of(82n, 1_000_000n))).toBe(true);
    expect(m.doses[0]).toMatchObject({ basis: "concentrate", authority: "literature", disputed: false });
    expect(catalog.have.has(base)).toBe(true);
    await setHave(db, ME, base, false);
    catalog = await loadCatalog(db, ME);
    expect(catalog.have.has(base)).toBe(false);
    await removeComponent(db, ME, m.components[0].id);
    expect((await loadCatalog(db, ME)).materials.get(base)!.components).toHaveLength(1);
  });

  it("changes and deletes the user's own materials; a provisional can be completed", async () => {
    const id = await createMaterial(db, ME, { name: "Cedro chino", kind: "provisional" });
    await updateMaterial(db, ME, id, { kind: "natural", species: "Cupressus funebris", otherCas: ["85085-29-6"] });
    expect((await loadCatalog(db, ME)).materials.get(id)).toMatchObject({ kind: "natural", species: "Cupressus funebris", otherCas: ["85085-29-6"] });
    await deleteMaterial(db, ME, id);
    expect((await loadCatalog(db, ME)).materials.has(id)).toBe(false);
  });

  it("refuses what Supabase would refuse, before it waits in the queue", async () => {
    const before = await queued();
    const base = await createMaterial(db, ME, { name: "Otra base", kind: "composition" });
    const after = await queued();
    await expect(createMaterial(db, ME, { name: "Acorde", kind: "frozen" })).rejects.toThrow();
    await expect(createMaterial(db, ME, { name: "x", kind: "molecule", purity: pct("150") })).rejects.toThrow();
    await expect(createMaterial(db, ME, { name: "x", kind: "molecule", family: "blue" as never })).rejects.toThrow();
    await expect(createMaterial(db, ME, { name: "x", kind: "natural", basedOnId: SOMEONE_S })).rejects.toThrow();
    await expect(updateMaterial(db, ME, COMMON, { name: "cambiado" })).rejects.toThrow();
    await expect(updateMaterial(db, ME, SOMEONE_S, { name: "cambiado" })).rejects.toThrow();
    await expect(updateMaterial(db, ME, MY_FROZEN, { kind: "composition" })).rejects.toThrow();
    await expect(addComponent(db, ME, base, base, { kind: "unknown" }, "consensus", "x")).rejects.toThrow();
    await expect(addComponent(db, ME, base, SOMEONE_S, { kind: "unknown" }, "consensus", "x")).rejects.toThrow();
    await expect(addComponent(db, ME, COMMON, base, { kind: "unknown" }, "consensus", "x")).rejects.toThrow();
    await expect(addComponent(db, ME, MY_FROZEN, COMMON, { kind: "unknown" }, "consensus", "x")).rejects.toThrow();
    await expect(addComponent(db, ME, base, COMMON, { kind: "range", min: pct("3"), max: pct("2") }, "consensus", "x")).rejects.toThrow();
    await expect(addComponent(db, ME, base, COMMON, { kind: "exact", value: Ratio.ZERO }, "consensus", "x")).rejects.toThrow();
    await expect(addComponent(db, ME, base, COMMON, { kind: "unknown" }, "consensus", "  ")).rejects.toThrow();
    await expect(addRegulation(db, ME, base, { regime: "ifra", kind: "max", authority: "ifra", source: "x" })).rejects.toThrow();
    await expect(addRegulation(db, ME, base, { regime: "ifra", kind: "requirement", authority: "ifra", source: "x" })).rejects.toThrow();
    await expect(addDose(db, ME, base, { basis: "concentrate", authority: "literature", source: "x" })).rejects.toThrow();
    expect(await queued()).toBe(after);
    expect(after).toBe(before + 1);
  });
});
