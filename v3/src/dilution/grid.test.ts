import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Dilution } from "../db/catalog";
import { cardsOf } from "./grid";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));
const bottle = (id: string, p: string, extra: Partial<Dilution> = {}): Dilution => ({
  id,
  fraction: pct(p),
  solvent: null,
  madeOn: null,
  description: null,
  label: `at ${p} %`,
  materialMassUg: null,
  sourceDilutionId: null,
  archivedAt: null,
  diluents: [],
  ...extra,
});
const names: Record<string, string> = { lab: "Labdanum", amb: "Ambermor", lin: "Linalol" };
const nameOf = (id: string) => names[id];
const all = [
  { materialId: "lin", d: bottle("l1", "1") },
  { materialId: "amb", d: bottle("a1", "5", { madeOn: "2026-09-23" }) },
  { materialId: "amb", d: bottle("a2", "5", { madeOn: "2026-10-01" }) },
  { materialId: "lab", d: bottle("b1", "10") },
  { materialId: "lab", d: bottle("b2", "50") },
  { materialId: "lab", d: bottle("b3", "1", { archivedAt: "2026-10-20" }) },
];

describe("«Dilutions» as a grid (V3-79)", () => {
  it("one card per material, a chip per dilution, none lost: 3 cards and 5 chips", () => {
    const cards = cardsOf(all, { archived: false, query: "", nameOf });
    expect(cards.map((c) => [c.name, c.bottles.map((b) => b.id)])).toEqual([
      ["Ambermor", ["a2", "a1"]],
      ["Labdanum", ["b2", "b1"]],
      ["Linalol", ["l1"]],
    ]);
    expect(cards.reduce((n, c) => n + c.bottles.length, 0)).toBe(5);
  });

  it("the archived ones only when asked, and every bottle is then there", () => {
    const cards = cardsOf(all, { archived: true, query: "", nameOf });
    expect(cards.reduce((n, c) => n + c.bottles.length, 0)).toBe(all.length);
  });

  it("the search finds by material or by the bottle's name", () => {
    expect(cardsOf(all, { archived: false, query: "labd", nameOf }).map((c) => c.name)).toEqual(["Labdanum"]);
    expect(cardsOf(all, { archived: false, query: "at 50", nameOf }).map((c) => [c.name, c.bottles.length])).toEqual([["Labdanum", 1]]);
  });
});
