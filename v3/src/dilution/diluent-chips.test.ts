import { describe, expect, it } from "vitest";
import { oneChipEach } from "./DiluentPicker";

describe("one chip per diluent (F-07)", () => {
  const list = [
    { id: "common-dpg", name: "DPG (dipropylene glycol)" },
    { id: "own-dpg", name: "DPG" },
    { id: "ethanol", name: "Ethanol" },
  ];
  it("merges a namesake into the first one", () => {
    expect(oneChipEach(list, "ethanol").map((d) => d.id)).toEqual(["common-dpg", "ethanol"]);
  });
  it("keeps the one chosen", () => {
    expect(oneChipEach(list, "own-dpg").map((d) => d.id)).toEqual(["own-dpg", "ethanol"]);
  });
});
