import { fileNameOf } from "./library-names";

/** What the save needs of the disk, so that the order of the writes can be tested without one. */
export interface SaveIo {
  /** The file names of a folder (an empty list if it does not exist yet). */
  list(folder: string): Promise<string[]>;
  read(path: string): Promise<string>;
  write(path: string, text: string): Promise<void>;
  join(folder: string, name: string): Promise<string>;
}

/** Whether a copy of the original is due: only once, and never over a copy that is already there (D13). */
export const needsBackup = (existing: readonly string[], fileName: string): boolean =>
  !existing.some((name) => name.toLowerCase() === fileName.toLowerCase());

/**
 * Copies the original of a migrated formula, as the file was, into `backupFolder`, and reads the copy back: if it is not the same text,
 * it throws, and nothing is written over the original (D13). Returns whether it copied: false if a copy of that file is already there,
 * which is never overwritten.
 */
export async function backUp(io: SaveIo, backupFolder: string, originalPath: string, originalText: string): Promise<boolean> {
  const name = fileNameOf(originalPath);
  if (!needsBackup(await io.list(backupFolder), name)) {
    return false;
  }
  const copy = await io.join(backupFolder, name);
  if (copy === originalPath) {
    throw new Error(`${originalPath}: la copia caería sobre el propio original`);
  }
  await io.write(copy, originalText);
  if ((await io.read(copy)) !== originalText) {
    throw new Error(`${copy}: la copia no es idéntica al original; no se guarda encima`);
  }
  return true;
}

/**
 * The write of a formula that was migrated when it was opened, in its order: first the original goes, untouched, to `copias-v1`
 * (and is checked), and only then the edited formula is written to the path it always had in the library, which `place` may
 * rename if the formula changed name. Returns the path the edited formula was written to.
 */
export async function saveFormula(
  io: SaveIo,
  args: {
    readonly backupFolder: string;
    readonly original: { readonly path: string; readonly text: string } | null;
    readonly currentPath: string | null;
    readonly edited: string;
    readonly place: (current: string | null) => Promise<string>;
  },
): Promise<string> {
  const { original } = args;
  if (original !== null && original.path === args.currentPath) {
    await backUp(io, args.backupFolder, original.path, original.text);
  }
  const path = await args.place(args.currentPath);
  await io.write(path, args.edited);
  return path;
}
