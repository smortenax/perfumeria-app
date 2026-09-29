import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { compose, vectorOf } from "../core/compose";
import { checkIfra } from "../core/ifra";
import { formulaFromJson, formulaToJson } from "../core/io/formula-json";
import type { Change, Formula, FormulaHeader } from "../core/model/formula";
import { DILUENTS, type Material } from "../core/model/material";
import { searchCatalog } from "./catalog";
import { catalog } from "./provisional";

const MG = 1_000n;
const header = (name: string): FormulaHeader => ({ name, intention: "", container: null, workBatchUg: null, finalBatchUg: null });
const material = (query: string) => searchCatalog(catalog.entries, query)[0].material;
const add = (id: string, m: Material, mg: bigint, fraction = Ratio.ONE, diluent: Material | null = null): Change => ({
  kind: "add",
  id,
  material: m,
  massUg: mg * MG,
  fraction,
  diluent,
});
/** Through its file and back, as the bench saves and reopens it. */
const reopened = (f: Formula) => formulaFromJson(formulaToJson(f, { ifraAmendment: catalog.source.amendment }));

describe("an accord made first and used inside the perfume (§3.6)", () => {
  // An apple accord with a material that IFRA gives a ceiling, beta-damascone, diluted in DPG.
  const hexyl = material("hexyl acetate");
  const damascone = material("beta damascone");
  const accord: Formula = {
    header: header("Acorde manzana"),
    history: [add("a1", hexyl, 800n), add("a2", damascone, 400n, Ratio.parse("1/10"), DILUENTS.dpg)],
  };

  it("keeps the accord whole through its file, and in the perfume through the perfume's file", () => {
    const saved = reopened(accord);
    const vector = vectorOf(saved);
    const apple: Material = { key: vector.id, kind: "formula", name: saved.header.name, vector };
    const perfume: Formula = { header: header("Perfume"), history: [add("p1", material("hedione"), 2000n), add("p2", apple, 600n)] };
    const again = reopened(perfume);
    // The perfume reopens with the accord as it was added: its vector, exact.
    const inner = again.history[1];
    expect(inner.kind === "add" && inner.material.kind === "formula" && inner.material.vector?.id).toBe(vector.id);
    // 600 mg of the accord hold its parts in proportion: 400 of 1200 mg is the damascone in DPG.
    const parts = new Map(compose(again).parts.map((p) => [p.material.key, p.massUg]));
    expect(parts.get(damascone.key)?.eq(Ratio.of(20n * MG))).toBe(true);
    expect(parts.get(DILUENTS.dpg.key)?.eq(Ratio.of(180n * MG))).toBe(true);
    expect(parts.get(hexyl.key)?.eq(Ratio.of(400n * MG))).toBe(true);
  });

  it("gives the same IFRA as pouring its materials straight into the perfume", () => {
    const vector = vectorOf(reopened(accord));
    const apple: Material = { key: vector.id, kind: "formula", name: "Acorde manzana", vector };
    const viaAccord = checkIfra(reopened({ header: header("P"), history: [add("p1", material("hedione"), 2000n), add("p2", apple, 600n)] }), catalog.ifra);
    const straight = checkIfra(
      {
        header: header("P"),
        history: [add("p1", material("hedione"), 2000n), add("s1", hexyl, 400n), add("s2", damascone, 200n, Ratio.parse("1/10"), DILUENTS.dpg)],
      },
      catalog.ifra,
    );
    expect(damascone.cas).toBe("23726-91-2");
    expect(viaAccord.checks.some((c) => c.maxUse.lt(Ratio.ONE))).toBe(true);
    expect(viaAccord.asIs).toBe(straight.asIs);
    expect(viaAccord.maxUse.eq(straight.maxUse)).toBe(true);
  });
});
