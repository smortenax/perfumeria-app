import { describe, expect, it } from "vitest";
import lot from "../../docs/investigacion/2026-09-30-usos-y-constituyentes/lotes/U-001.csv?raw";
import written from "../../datos/glosario/origen/usos-habituales.csv?raw";
import { Ratio } from "../core/arith/ratio";
import { bandOf } from "../bench/usage-bar";
import { parseCsvRecords } from "./csv";
import { catalog } from "./provisional";

const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const entryOf = (key: string) => catalog.entries.find((e) => e.material.key === key);

/** The median the script documents: the middle value, or the mean of the two in the middle. */
function median(values: Ratio[]): Ratio | undefined {
  const v = [...values].sort((a, b) => (a.lt(b) ? -1 : a.gt(b) ? 1 : 0));
  if (v.length === 0) {
    return undefined;
  }
  return v.length % 2 ? v[(v.length - 1) / 2] : v[v.length / 2 - 1].add(v[v.length / 2]).div(Ratio.of(2));
}

describe("the usual use, from the audited lot U-001 (E6, P59)", () => {
  it("has a band for every material the lot gives a figure, and reads it exactly from the glossary", () => {
    const withBand = catalog.entries.filter((e) => e.usage);
    expect(withBand).toHaveLength(53);
    expect(withBand.filter((e) => e.usage?.consensus === "consenso")).toHaveLength(49);
    expect(withBand.filter((e) => e.usage?.consensus === "recomendacion")).toHaveLength(4);
    // A material the lot does not cover has no band: a gap, never a zero (§1.2).
    expect(catalog.entries.filter((e) => e.group === "diluent").every((e) => e.usage === undefined)).toBe(true);
    expect(withBand.length).toBeLessThan(catalog.entries.length);
  });

  it("takes PerfumersWorld's minimum and average as a usual source, so three sources give a consensus (Safraleine)", () => {
    const usage = entryOf("fig:295")?.usage;
    expect(usage?.consensus).toBe("consenso");
    expect(usage?.sources).toBe("Laboratorio | PerfumersWorld | Scentspiracy");
    // The figures are shares of the concentrate, exact: 0.1 % is 1/1000.
    expect(usage?.min?.eq(Ratio.of(1, 1000))).toBe(true);
    expect(usage?.max.eq(Ratio.of(1, 100))).toBe(true);
    expect(usage?.ceiling?.eq(Ratio.of(3, 100))).toBe(true);
    expect(usage?.ceilingSource).toBe("TGSC");
  });

  it("is a recommendation only when one source gives the usual band (Etil-4-fenol)", () => {
    const usage = entryOf("fig:2642")?.usage;
    expect(usage?.consensus).toBe("recomendacion");
    expect(usage?.sources).toBe("Laboratorio");
    expect(bandOf(usage)?.recommendation).toBe(true);
  });

  it("uses PerfumersWorld's average as its usual maximum, and its Maximum only for the ceiling (Hedione)", () => {
    const usage = entryOf("fig:2351")?.usage;
    expect(usage?.consensus).toBe("consenso");
    expect(usage?.sources).toBe("Laboratorio | PerfumersWorld");
    // Minimums 5 % (lab) and 1 % (PW): median 3 %. Usual maximums 30 % (lab) and PW's average, 10 %: median 20 %.
    expect(usage?.min?.eq(Ratio.of(3, 100))).toBe(true);
    expect(usage?.max.eq(Ratio.of(20, 100))).toBe(true);
    // TGSC says «up to 30 %», but PerfumersWorld's maximum is 50 %: the highest wins, with its name.
    // The 50 % of the supplier range in the lab's note has no base, so it cannot be a ceiling.
    expect(usage?.ceiling?.eq(Ratio.of(50, 100))).toBe(true);
    expect(usage?.ceilingSource).toBe("PerfumersWorld");
  });

  it("can be redone from the audited lot with the rule of the script, for every material", () => {
    const rows = parseCsvRecords(lot).filter((r) => r.auditoria === "aceptada");
    const ids = [...new Set(rows.map((r) => r.material_id))];
    expect(parseCsvRecords(written)).toHaveLength(ids.length);
    for (const id of ids) {
      const mine = rows.filter((r) => r.material_id === id);
      // A usual row with its usual maximum: the maximum of a «habitual» row, the quote's average of a PerfumersWorld one.
      const usual = mine
        .filter((r) => r.base === "concentrado")
        .flatMap((r) => {
          if (r.papel === "habitual") {
            return [{ row: r, max: r.max_pct }];
          }
          const average = r.papel === "habitual y techo" ? /(\d+(?:\.\d+)?)\s*%?\s*Average/i.exec(r.cita)?.[1] : undefined;
          return average === undefined ? [] : [{ row: r, max: average }];
        });
      const min = median(usual.filter((u) => u.row.min_pct !== "").map((u) => pct(u.row.min_pct)));
      const max = median(usual.filter((u) => u.max !== "").map((u) => pct(u.max)));
      const ceilings = mine
        .filter((r) => (r.papel === "techo" || r.papel === "habitual y techo") && r.base === "concentrado" && r.max_pct !== "")
        .map((r) => pct(r.max_pct));
      const usage = entryOf(id)?.usage;
      expect(usage?.max.eq(max!), id).toBe(true);
      expect(usage?.min?.eq(min!) ?? min === undefined, id).toBe(true);
      const top = ceilings.reduce<Ratio | undefined>((a, b) => (a === undefined || b.gt(a) ? b : a), undefined);
      expect(usage?.ceiling?.eq(top!) ?? top === undefined, id).toBe(true);
      const sources = new Set(usual.map((u) => u.row.fuente));
      expect(usage?.consensus, id).toBe(sources.size === 1 ? "recomendacion" : "consenso");
    }
  });
});
