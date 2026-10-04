import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { parseMass } from "../core/arith/units";
import type { Change, Formula } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { makeVector } from "../core/model/vector";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "./data";
import { migrateFormula, v2MaterialOf } from "./migrate";

const data = v2Dataset();
const productId = (name: string) => data.products.find((p) => p.name === name)!.id;

const base = (key: string, name: string, cas?: string): Material => ({ key, kind: "base", name, ...(cas ? { cas } : {}) });
function formulaOf(...materials: Material[]): Formula {
  return {
    header: { name: "t", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
    history: materials.map(
      (material, i): Change => ({
        kind: "add",
        id: `a${i}`,
        material,
        massUg: parseMass("0,100", "g"),
        fraction: Ratio.ONE,
        diluent: null,
      }),
    ),
  };
}
const keysOf = (f: Formula) => f.history.flatMap((c) => (c.kind === "add" ? [c.material.key] : []));

describe("migrating a formula of the v1 to the v2 (D13)", () => {
  it("a line goes to the product the user has, with the same CAS", () => {
    const m = migrateFormula(formulaOf(base("fig:2622", "Pepper, black, absolute", "8006-82-4")), data);
    expect(keysOf(m.formula)).toEqual([`v2:${productId("Black Pepper Absolute")}`]);
    expect(m.notes).toEqual([{ kind: "migrated", from: "fig:2622", to: `v2:${productId("Black Pepper Absolute")}`, name: "Black Pepper Absolute" }]);
    expect(m.changed).toBe(true);
  });

  // The repository is built once, outside the test: with thousands of materials its IFRA takes seconds and would eat the test's 5 s.
  const repository = repositoryFor("v2");
  it("the material the bench builds for a product is the one the v2 repository lists", () => {
    for (const p of data.products) {
      expect(v2MaterialOf(data, p.id)).toEqual(repository.get(`v2:${p.id}`)!.material);
    }
  });

  it("a different CAS without the user's confirmation is not migrated: warning, line as it was", () => {
    const m = migrateFormula(formulaOf(base("fig:1012", "Allyl amyl glycolate", "1-1-1")), data);
    expect(keysOf(m.formula)).toEqual(["fig:1012"]);
    expect(m.notes).toEqual([{ kind: "cas", from: "fig:1012", name: "Allyl amyl glycolate", formulaCas: "1-1-1", v2Cas: "67634-00-8" }]);
    expect(m.changed).toBe(false);
  });

  it("a different CAS that the user confirmed (the tinctures, decided in lot 3d) migrates, and says so", () => {
    const m = migrateFormula(formulaOf(base("fig:1069", "Ambergris tincture", "8038-65-1")), data);
    expect(keysOf(m.formula)).toEqual([`v2:${productId("Ámbar gris, tintura comercial (purificado)")}`]);
    expect(m.notes[0]).toMatchObject({ kind: "migrated", confirmedOn: "2026-10-03" });
  });

  it("a material with two products goes to the one in use; with no choice recorded, the user is asked", () => {
    const m = migrateFormula(formulaOf(base("fig:1165", "Benjui 50% DPG", "9000-72-0")), data);
    expect(keysOf(m.formula)).toEqual([`v2:${productId("Resinoide de benjuí")}`]);
    // The same link without the product the user chose: two products, no choice.
    const open = { ...data, v1Links: data.v1Links.map((l) => (l.v1Id === "fig:1165" ? { ...l, productId: "" } : l)) };
    const ask = migrateFormula(formulaOf(base("fig:1165", "Benjui 50% DPG", "9000-72-0")), open);
    expect(keysOf(ask.formula)).toEqual(["fig:1165"]);
    expect(ask.notes).toEqual([{ kind: "ambiguous", from: "fig:1165", name: "Benjui 50% DPG", products: ["Resinoide de benjuí", "Benzoin Siam Resinoid (IFF)"] }]);
  });

  it("a provisional material migrates only by the user's confirmation, since it has no CAS to check", () => {
    const m = migrateFormula(formulaOf({ key: "prov:trufa abs", kind: "provisional", name: "trufa abs" }), data);
    expect(keysOf(m.formula)).toEqual([`v2:${productId("Esencia de trufa")}`]);
    expect(m.notes[0]).toMatchObject({ kind: "migrated", provisional: true, confirmedOn: "2026-10-03" });
    const none = migrateFormula(formulaOf({ key: "prov:cualquier cosa", kind: "provisional", name: "cualquier cosa" }), data);
    expect(none.notes).toEqual([{ kind: "v1-only", from: "prov:cualquier cosa", name: "cualquier cosa" }]);
  });

  it("what the v2 does not have stays in the v1, as it was: never another material", () => {
    const m = migrateFormula(formulaOf(base("fig:1197", "Bergamot oil", "8007-75-8"), base("fig:1286", "Cade oil", "8013-10-3")), data);
    expect(keysOf(m.formula)).toEqual(["fig:1197", "fig:1286"]);
    expect(m.notes.map((n) => n.kind)).toEqual(["v1-only", "v1-only"]);
    expect(m.changed).toBe(false);
  });

  it("the diluents and the lines already of the v2 are left alone", () => {
    const f = formulaOf(DILUENTS.dpg, v2MaterialOf(data, productId("Hedione")));
    const m = migrateFormula(f, data);
    expect(m.formula).toBe(f);
    expect(m.notes).toEqual([]);
  });

  it("a formula used as a material is migrated inside, and its key follows its content", () => {
    const inner = makeVector([
      { material: base("fig:2622", "Pepper", "8006-82-4"), amount: Ratio.of(1) },
      { material: DILUENTS.dpg, amount: Ratio.of(1) },
    ]);
    const vec: Material = { key: inner.id, kind: "formula", name: "mi mezcla", vector: inner };
    const m = migrateFormula(formulaOf(vec), data);
    const moved = m.formula.history[0].kind === "add" ? m.formula.history[0].material : null;
    expect(moved?.key).not.toBe(inner.id);
    expect(moved?.vector?.components.map((c) => c.material.key).sort()).toEqual([`v2:${productId("Black Pepper Absolute")}`, "solv:dpg"].sort());
    expect(moved?.vector?.components.every((c) => c.proportion.eq(Ratio.of(1).div(Ratio.of(2))))).toBe(true);
  });
});
