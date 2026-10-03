import { describe, expect, it } from "vitest";
import { backUp, needsBackup, saveFormula, type SaveIo } from "./save-with-backup";

const LIBRARY = "C:/Docs/Perfumería/Fórmulas";
const BACKUP = `${LIBRARY}/copias-v1`;
// A file as the v1 wrote it: accents, CRLF, a BOM and a trailing newline: the copy has to keep every byte.
const ORIGINAL = '\uFEFF{\r\n  "format": "perfumeria/formula/1",\r\n  "header": { "name": " Ac Manzana Verde — ñandú" }\r\n}\r\n';
const EDITED = '{\n  "format": "perfumeria/formula/1",\n  "materials": { "v2:P00001": {} }\n}\n';

/** A disk in memory: the files by path, and the order in which they were written. */
function fakeDisk(files: Record<string, string> = {}, corrupt = false) {
  const fs = new Map(Object.entries(files));
  const writes: string[] = [];
  const io: SaveIo = {
    list: async (folder) =>
      [...fs.keys()]
        .filter((p) => p.startsWith(`${folder}/`) && !p.slice(folder.length + 1).includes("/"))
        .map((p) => p.split("/").pop()!),
    read: async (path) => fs.get(path)!,
    write: async (path, text) => {
      writes.push(path);
      fs.set(path, corrupt && path.startsWith(BACKUP) ? text.trimEnd() : text);
    },
    join: async (folder, name) => `${folder}/${name}`,
  };
  return { fs, writes, io };
}
const bytes = (text: string) => [...new TextEncoder().encode(text)];

describe("saving a formula that was migrated when it was opened (D13)", () => {
  const path = `${LIBRARY}/Ac Manzana Verde.json`;
  const copy = `${BACKUP}/Ac Manzana Verde.json`;
  const args = (place: (c: string | null) => Promise<string> = async (c) => c!) => ({
    backupFolder: BACKUP,
    original: { path, text: ORIGINAL },
    currentPath: path,
    edited: EDITED,
    place,
  });

  it("copies the original byte for byte to copias-v1, and saves the edited one in the path it always had", async () => {
    const disk = fakeDisk({ [path]: ORIGINAL });
    const saved = await saveFormula(disk.io, args());
    expect(saved).toBe(path);
    // copias-v1 holds the original, identical byte by byte…
    expect(bytes(disk.fs.get(copy)!)).toEqual(bytes(ORIGINAL));
    // …and Fórmulas holds the edited one.
    expect(disk.fs.get(path)).toBe(EDITED);
    // The copy goes first, so a failure never leaves the original lost.
    expect(disk.writes).toEqual([copy, path]);
  });

  it("never leaves the two swapped: the edited text is not in copias-v1, nor the original in Fórmulas", async () => {
    const disk = fakeDisk({ [path]: ORIGINAL });
    await saveFormula(disk.io, args());
    expect(disk.fs.get(copy)).not.toBe(EDITED);
    expect(disk.fs.get(path)).not.toBe(ORIGINAL);
  });

  it("a copy that is not identical aborts the save: nothing is written over the original", async () => {
    const disk = fakeDisk({ [path]: ORIGINAL }, true);
    await expect(saveFormula(disk.io, args())).rejects.toThrow("no es idéntica");
    expect(disk.fs.get(path)).toBe(ORIGINAL);
  });

  it("a copy already there is never overwritten, and the edited one is saved all the same", async () => {
    const disk = fakeDisk({ [path]: ORIGINAL, [copy]: "la copia de siempre" });
    await saveFormula(disk.io, args());
    expect(disk.fs.get(copy)).toBe("la copia de siempre");
    expect(disk.fs.get(path)).toBe(EDITED);
  });

  it("a formula renamed by the edit is written under its new name, and the copy keeps the original's name", async () => {
    const disk = fakeDisk({ [path]: ORIGINAL });
    const moved = `${LIBRARY}/Manzana verde 2.json`;
    expect(await saveFormula(disk.io, args(async () => moved))).toBe(moved);
    expect(disk.fs.get(moved)).toBe(EDITED);
    expect(disk.fs.get(copy)).toBe(ORIGINAL);
  });

  it("a formula that was not migrated is written as it always was, with no copy", async () => {
    const disk = fakeDisk({ [path]: ORIGINAL });
    await saveFormula(disk.io, { ...args(), original: null });
    expect(disk.writes).toEqual([path]);
  });

  it("once the copy is made it is not due again, whatever its capitals", async () => {
    expect(needsBackup([], "x.json")).toBe(true);
    expect(needsBackup(["X.JSON"], "x.json")).toBe(false);
    const disk = fakeDisk({ [path]: ORIGINAL });
    expect(await backUp(disk.io, BACKUP, path, ORIGINAL)).toBe(true);
    expect(await backUp(disk.io, BACKUP, path, ORIGINAL)).toBe(false);
  });

  it("a copy that would land on the original itself is refused", async () => {
    const inside = `${BACKUP}/a.json`;
    const disk = fakeDisk({ [inside]: ORIGINAL });
    await expect(backUp({ ...disk.io, list: async () => [] }, BACKUP, inside, ORIGINAL)).rejects.toThrow("propio original");
  });
});
