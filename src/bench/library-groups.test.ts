import { describe, expect, it } from "vitest";
import { groupLibrary, nextVersionNumber, versionName, type LibraryEntry } from "./library-groups";

const entry = (title: string, day: number, version?: [string, number, number | null]): LibraryEntry => ({
  path: `C:\\lib\\${title}.json`,
  title,
  modified: new Date(2026, 8, day),
  ...(version ? { version: { family: version[0], number: version[1], from: version[2] } } : {}),
});

describe("the versions of the library (P44)", () => {
  it("names a version after its formula, with the new number", () => {
    expect(versionName("Lejía", 2)).toBe("Lejía v2");
    expect(versionName("Lejía v2", 3)).toBe("Lejía v3");
    expect(versionName("Acorde de higo V4 ", 5)).toBe("Acorde de higo v5");
  });

  it("gives the next number of the whole family, not of the version it comes from", () => {
    const library = [entry("Lejía", 1, ["f", 1, null]), entry("Lejía v2", 2, ["f", 2, 1]), entry("Otra", 3)];
    // From v1, with a v2 already made, comes the v3.
    expect(nextVersionNumber(library, "f", 1)).toBe(3);
    // A family the library does not have yet starts after the one in hand.
    expect(nextVersionNumber(library, "g", 1)).toBe(2);
  });

  it("puts the versions of a formula together, the last made first, and the formulas by their last change", () => {
    const groups = groupLibrary([
      entry("Lejía", 1, ["f", 1, null]),
      entry("Acorde", 2),
      entry("Lejía v3", 3, ["f", 3, 1]),
      entry("Lejía v2", 5, ["f", 2, 1]),
      entry("Cuero", 4),
    ]);
    expect(groups.map((g) => g.versions.map((v) => v.title))).toEqual([["Lejía v3", "Lejía v2", "Lejía"], ["Cuero"], ["Acorde"]]);
    expect(groups[0].modified).toEqual(new Date(2026, 8, 5));
  });
});
