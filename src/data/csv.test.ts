import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvRecords } from "./csv";

describe("CSV", () => {
  it("reads quoted fields with commas, doubled quotes and line breaks", () => {
    const text = 'id,nombre,nota\nA,"Haba tonka (semillas), tintura","dice ""hola""\ny sigue"\r\nB,Hedione,\n';
    expect(parseCsv(text)).toEqual([
      ["id", "nombre", "nota"],
      ["A", "Haba tonka (semillas), tintura", 'dice "hola"\ny sigue'],
      ["B", "Hedione", ""],
    ]);
  });

  it("keys each row by the header and skips blank rows", () => {
    expect(parseCsvRecords("﻿a,b\n1,2\n\n3\n")).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "" },
    ]);
  });
});
