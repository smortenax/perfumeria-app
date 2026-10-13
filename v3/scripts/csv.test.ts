import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("reads quoted cells with commas, quotes and JSON lists", () => {
    expect(parseCsv('id,name,aliases\n1,"Lemon oil, expressed","[""a"",""b""]"\n2,Hedione,[]\n')).toEqual([
      ["id", "name", "aliases"],
      ["1", "Lemon oil, expressed", '["a","b"]'],
      ["2", "Hedione", "[]"],
    ]);
  });

  it("keeps an empty cell empty, and a line break inside quotes", () => {
    expect(parseCsv('a,b,c\n,"x\ny",\n')).toEqual([
      ["a", "b", "c"],
      ["", "x\ny", ""],
    ]);
  });
});
