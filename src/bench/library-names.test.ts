import { describe, expect, it } from "vitest";
import { carriesName, fileStem, freeFileName, isInside } from "./library-names";

describe("the file names of the library (P44)", () => {
  it("names a file as its formula, without the signs Windows forbids, and never empty", () => {
    expect(fileStem("Lejía", "Sin nombre")).toBe("Lejía");
    expect(fileStem("  Acorde: higo / cuero? ", "Sin nombre")).toBe("Acorde- higo - cuero-");
    expect(fileStem("Fin.  ", "Sin nombre")).toBe("Fin");
    expect(fileStem("   ", "Sin nombre")).toBe("Sin nombre");
  });

  it("gives a shared name a number, and does not tell capitals apart, as Windows", () => {
    expect(freeFileName("Lejía", [])).toBe("Lejía.json");
    expect(freeFileName("Lejía", ["lejía.json"])).toBe("Lejía (2).json");
    expect(freeFileName("Lejía", ["Lejía.json", "Lejía (2).json", "Otra.json"])).toBe("Lejía (3).json");
  });

  it("does not rename a file that already carries its formula's name, numbered or not", () => {
    expect(carriesName("Lejía.json", "Lejía")).toBe(true);
    expect(carriesName("Lejía (2).json", "lejía")).toBe(true);
    expect(carriesName("Lejía (2).json", "Lejía v2")).toBe(false);
    expect(carriesName("Sin nombre.json", "Lejía")).toBe(false);
    // A name with signs of a pattern is taken as it is.
    expect(carriesName("F (1).json", "F (1)")).toBe(true);
  });

  it("tells a file of the library from one outside it", () => {
    const dir = "C:\\Users\\U\\Documents\\Perfumería\\Fórmulas";
    expect(isInside("C:\\Users\\U\\Documents\\Perfumería\\Fórmulas\\Lejía.json", dir)).toBe(true);
    expect(isInside("c:/users/u/documents/perfumería/fórmulas/Lejía.json", `${dir}\\`)).toBe(true);
    expect(isInside("C:\\Users\\U\\Desktop\\Lejía.json", dir)).toBe(false);
    expect(isInside("C:\\Users\\U\\Documents\\Perfumería\\Fórmulas\\viejas\\Lejía.json", dir)).toBe(false);
  });
});
