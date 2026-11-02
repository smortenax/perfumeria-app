import { describe, expect, it } from "vitest";
import { chipName } from "./diluentName";

describe("a diluent's chip (audit F-09 L2)", () => {
  it("drops what the name explains in brackets, and keeps a name that is only that", () => {
    expect(chipName("DPG (dipropylene glycol)")).toBe("DPG");
    expect(chipName("IPM (isopropyl myristate)")).toBe("IPM");
    expect(chipName("Benzyl benzoate")).toBe("Benzyl benzoate");
    expect(chipName("(unstated solvent)")).toBe("(unstated solvent)");
  });
});
