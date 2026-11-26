import { describe, expect, it } from "vitest";
import { convertMassText, massText, massToUg } from "../format/mass";
import { massShown, otherUnit } from "./MassInput";

/**
 * The mass box of the whole app (2026-11-26; the user: «los boxes de poner numeros deberia ser un sistema … donde puedas
 * poner si lo escoges en g o mg (con selector)»): written in mg or g, kept exact in the caller's unit.
 */
describe("a mass in either unit, exact", () => {
  it("writes the mass with the decimals it needs, never rounded", () => {
    expect(massText(1_030_000n, "mg")).toBe("1030");
    expect(massText(1_030_000n, "g")).toBe("1.03");
    expect(massText(500n, "g")).toBe("0.0005");
    expect(massText(2_000_000n, "g")).toBe("2");
  });
  it("reads it back in its unit, with a comma or a point", () => {
    expect(massToUg("1030", "mg")).toBe(1_030_000n);
    expect(massToUg("1,03", "g")).toBe(1_030_000n);
    expect(massToUg("", "g")).toBeNull();
    expect(massToUg("abc", "mg")).toBeNull();
  });
  it("switching the unit is the same mass; what is not a mass yet stays as typed", () => {
    expect(convertMassText("1030", "mg", "g")).toBe("1.03");
    expect(convertMassText("1.03", "g", "mg")).toBe("1030");
    expect(convertMassText("1,", "g", "mg")).toBe("1,");
    expect(convertMassText("", "mg", "g")).toBe("");
    expect(otherUnit("mg")).toBe("g");
  });
});

describe("what the box shows", () => {
  it("the caller's text in the unit shown", () => {
    expect(massShown("1030", "mg", "g", null)).toBe("1.03");
    expect(massShown("1030", "mg", "mg", null)).toBe("1030");
  });
  it("what was typed, while it says the same mass: «1.0» g stays «1.0»", () => {
    expect(massShown("1000", "mg", "g", { text: "1.0", unit: "g" })).toBe("1.0");
    expect(massShown("1,", "mg", "g", { text: "1,", unit: "g" })).toBe("1,");
  });
  it("the caller's text when it changed under the box (a plan filled in, a row reset)", () => {
    expect(massShown("2500", "mg", "g", { text: "1.0", unit: "g" })).toBe("2.5");
    expect(massShown("", "mg", "g", { text: "1.0", unit: "g" })).toBe("");
  });
});
