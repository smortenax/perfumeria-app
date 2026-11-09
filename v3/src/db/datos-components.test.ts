import { describe, expect, it } from "vitest";
import { parseCsvRecords } from "../bench/data/csv";

/**
 * The common composition as the server's checks take it (material_components_amount, _not_ifra,
 * _source): a row that breaks one stops the whole load in the cloud, as batch 52 did on 2026-11-09.
 */
const files = import.meta.glob("../../datos/material_components.csv", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const rows = parseCsvRecords(Object.values(files)[0] ?? "");
const num = (t: string) => (t === "" ? null : Number(t));

describe("datos/material_components.csv keeps the server's checks", () => {
  it("each amount fills the columns its kind asks for, within 0 and 1", () => {
    const bad = rows.filter((r) => {
      const [v, lo, hi] = [num(r.value), num(r.min), num(r.max)];
      switch (r.amount_kind) {
        case "exact":
          return v === null || lo !== null || hi !== null || v < 0 || v > 1;
        case "max":
          return v === null || lo !== null || hi !== null || v <= 0 || v > 1;
        case "range":
          return v !== null || lo === null || hi === null || lo < 0 || lo > hi || hi > 1;
        case "unknown":
          return v !== null || lo !== null || hi !== null;
        default:
          return true;
      }
    });
    expect(bad.map((r) => r.id)).toEqual([]);
  });

  it("no row is IFRA's, and every row says its source", () => {
    expect(rows.filter((r) => r.authority === "ifra" || r.source.trim() === "").map((r) => r.id)).toEqual([]);
  });
});
