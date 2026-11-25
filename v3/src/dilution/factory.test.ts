import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Catalog, Dilution } from "../db/catalog";
import { factoryBottleOf, isFactoryBottle } from "../db/factory";
import type { GlossaryData } from "../db/useGlossary";
import { rowFor } from "./AddWeigh";

/** V3-112: a material that came made starts from its factory bottle, never from pure. */
const bottle = (id: string, pct: string, diluentId: string, extra: Partial<Dilution> = {}): Dilution => {
  const fraction = Ratio.fromDecimal(pct).div(Ratio.of(100n));
  return {
    id, fraction, solvent: null, madeOn: "2026-11-23", description: null, label: `at ${pct} %`, materialMassUg: null, sourceDilutionId: null, archivedAt: null,
    diluents: [{ id: `${id}-d`, diluentId, massUg: null, fraction: Ratio.ONE.sub(fraction) }],
    ...extra,
  };
};
const factory = bottle("cocoa-10", "10", "ipm", { label: "de fábrica, al 10 %" });
const mine = { ...bottle("cocoa-1", "1", "eth", { madeOn: "2026-11-24", sourceDilutionId: "cocoa-10", description: "From the factory bottle" }) };
const data = (bottles: Dilution[]) => ({ catalog: { materials: new Map(), dilutions: new Map([["cocoa", bottles]]) } as unknown as Catalog }) as GlossaryData;

describe("factory bottles", () => {
  it("are told by their name or note, and one made from another is not one", () => {
    expect([isFactoryBottle(factory), isFactoryBottle(bottle("x", "5", "dpg", { label: "factory, at 5 %" })), isFactoryBottle(bottle("y", "5", "dpg"))]).toEqual([true, true, false]);
    expect(factoryBottleOf(data([factory, mine]).catalog, "cocoa")?.id).toBe("cocoa-10");
    expect(factoryBottleOf(data([{ ...factory, archivedAt: "2026-11-25" }]).catalog, "cocoa")).toBeUndefined();
  });

  it("a new row starts from the factory bottle, with the diluent of the last bottle you made, not the factory one", () => {
    expect(rowFor(data([factory]), "cocoa")).toMatchObject({ sourceId: "cocoa-10", diluents: [{ diluentId: "" }] });
    expect(rowFor(data([factory, mine]), "cocoa")).toMatchObject({ sourceId: "cocoa-10", diluents: [{ diluentId: "eth" }] });
    expect(rowFor(data([mine]), "cocoa").sourceId).toBeNull();
  });
});
