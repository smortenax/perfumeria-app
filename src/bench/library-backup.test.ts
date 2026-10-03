import { describe, expect, it } from "vitest";
import { BACKUP_FOLDER, needsBackup } from "./library";

describe("the copy of a formula before it is overwritten by its migration (D13)", () => {
  it("is due once: not when a copy of that file is already there, whatever its capitals", () => {
    expect(needsBackup([], "Zara tabaco v3.json")).toBe(true);
    expect(needsBackup(["Otra.json"], "Zara tabaco v3.json")).toBe(true);
    expect(needsBackup(["zara TABACO v3.json"], "Zara tabaco v3.json")).toBe(false);
  });
  it("goes in a folder of the library that is not listed as a formula", () => {
    expect(BACKUP_FOLDER).toBe("copias-v1");
  });
});
