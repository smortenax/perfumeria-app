import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { DILUENTS } from "../core/model/material";
import type { Catalog, CatalogMaterial, Dilution } from "../db/catalog";
import { bottlesFor, percentCell } from "./bottles";
import { pouredText } from "./format";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const mat = (id: string, name: string) => ({ id, name, ownerId: null, solvent: true }) as unknown as CatalogMaterial;
const bottle = (id: string, fraction: string, diluents: [string, string][], extra: Partial<Dilution> = {}): Dilution => ({
  id,
  fraction: pct(fraction),
  solvent: null,
  madeOn: null,
  description: null,
  label: null,
  materialMassUg: null,
  sourceDilutionId: null,
  archivedAt: null,
  diluents: diluents.map(([diluentId, share], i) => ({ id: `${id}-${i}`, diluentId, massUg: null, fraction: pct(share) })),
  ...extra,
});

describe("your bottles in the add bar (V3-67)", () => {
  const catalog = {
    materials: new Map([["dpg", mat("dpg", "DPG (dipropilenglicol)")], ["eth", mat("eth", "Etanol")], ["ipm", mat("ipm", "IPM (miristato de isopropilo)")], ["odd", mat("odd", "Aceite de jojoba")]]),
    dilutions: new Map([
      [
        "labdanum",
        [
          bottle("b50", "50", [["eth", "30"], ["dpg", "20"]], { label: "al 50 %" }),
          bottle("b10", "9.97", [["dpg", "90.03"]], { label: "al 10 %" }),
          bottle("three", "10", [["eth", "30"], ["ipm", "20"], ["dpg", "40"]]),
          bottle("old", "10", [["dpg", "90"]], { archivedAt: "2026-10-19" }),
          bottle("unknown", "5", [["odd", "95"]]),
          bottle("words", "10", [], { solvent: "DPG" }),
        ],
      ],
    ]),
  } as unknown as Catalog;

  it("offers your bottles, lowest first, with their exact figures; not the archived, not the ones the bar cannot pour", () => {
    const list = bottlesFor({ catalog }, "labdanum");
    expect(list.map((b) => b.label)).toEqual(["al 10 %", "10 %", "al 50 %"]);
    expect(list[0].diluents).toEqual([{ id: "dpg", share: pct("90.03") }]);
    expect(list[1].diluents.map((d) => d.id)).toEqual(["alcohol", "ipm", "dpg"]);
    expect(bottlesFor({ catalog }, "nothing")).toEqual([]);
  });

  it("writes a figure as a cell of the bar does", () => {
    expect(percentCell(pct("9.97"))).toBe("9.97");
    expect(percentCell(pct("10"))).toBe("10");
    expect(percentCell(pct("50.1744"))).toBe("50.1744");
  });

  it("says a pour in three diluents with each one's share", () => {
    const text = pouredText(Ratio.of(1_000_000n), pct("10"), "DPG", { material: DILUENTS.alcohol, fraction: pct("30") }, [{ material: DILUENTS.ipm, fraction: pct("20") }]);
    expect(text).toBe("1.000 g at 10 % in DPG 40 % + Alcohol 30 % + IPM 20 %");
  });
});
