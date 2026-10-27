import { describe, expect, it } from "vitest";
import { parseCsv } from "../bench/data/csv";
import { compose } from "../core/compose";
import { F001_LINES, f001 } from "../core/fixtures/f001";
import { FORMULA_COLUMNS, formulaCsv, formulaFileName } from "./formula";

/** «Export as CSV» (V3-80): the F-001 of the notebook comes out with its own figures. */

const csv = formulaCsv(compose(f001()));
const [header, ...rows] = parseCsv(csv).filter((r) => r.some((c) => c !== ""));
const total = rows[rows.length - 1];
const lines = rows.slice(0, -1);
const col = (name: (typeof FORMULA_COLUMNS)[number]) => header.indexOf(name);

describe("a formula as CSV (V3-80)", () => {
  it("one row per pour, in the order poured, and a row of totals", () => {
    expect(header).toEqual([...FORMULA_COLUMNS]);
    // The notebook's «Alcohol 96º» is the app's built-in «Alcohol».
    expect(lines.map((r) => r[col("material")])).toEqual(F001_LINES.map((l) => (l[1] === "alcohol" ? "Alcohol" : l[0])));
    expect(total.slice(1, 3)).toEqual(["total", "8.745"]);
  });

  it("the F-001's figures: 2,4519 g of aromatic matter, and each line's pure matter as the notebook says", () => {
    expect(total[col("pure_g")]).toBe("2.4519");
    F001_LINES.forEach(([name, , poured, pct, , pure], i) => {
      expect([lines[i][col("poured_g")], lines[i][col("dilution_pct")], lines[i][col("pure_g")]], name).toEqual([
        poured.replace(",", ".").replace(/0+$/, "").replace(/\.$/, ""),
        pct,
        pure.replace(",", ".").replace(/0+$/, "").replace(/\.$/, ""),
      ]);
    });
  });

  it("the diluents of a diluted pour, with their share; none for the alcohol line's aromatic share", () => {
    const cashmeran = lines.find((r) => r[col("material")] === "Cashmeran")!;
    expect(cashmeran[col("diluents")]).toMatch(/ 50$/);
    const alcohol = lines.find((r) => r[col("material")] === "Alcohol")!;
    expect(alcohol[col("pct_of_aromatic")]).toBe("");
    const hedione = lines.find((r) => r[col("material")] === "Hedione")!;
    expect(hedione[col("pct_of_aromatic")]).toBe("25.245728"); // 0,619 ÷ 2,4519
  });

  it("a file name without accents nor spaces", () => {
    expect(formulaFileName("Lejía v2", "2026-10-27", "csv")).toBe("Lejia-v2-2026-10-27.csv");
  });
});
