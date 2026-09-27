import { invoke } from "@tauri-apps/api/core";
import { documentDir, join } from "@tauri-apps/api/path";
import { texts } from "../i18n/es";
import { inTauri } from "./io";
import { carriesName, fileNameOf, fileStem, freeFileName, isInside } from "./library-names";

/**
 * The library (P44): the formulas live in a visible folder the app looks after,
 * Documentos\Perfumería\Fórmulas, one file per formula, called as the formula. A
 * formula is saved there from its first change, without choosing a folder.
 */
export interface LibraryFile {
  readonly path: string;
  /** The file's name without `.json`: the formula's, or with a number («Lejía (2)»). */
  readonly name: string;
  readonly modified: Date;
}

let dir: Promise<string> | null = null;

export function libraryDir(): Promise<string> {
  dir ??= documentDir().then((docs) => join(docs, "Perfumería", "Fórmulas"));
  return dir;
}

/** The formulas of the library, the most recent first; none outside the app. */
export async function listLibrary(): Promise<LibraryFile[]> {
  if (!inTauri()) {
    return [];
  }
  const files = await invoke<Array<{ path: string; name: string; modified_ms: number }>>("list_formulas", { dir: await libraryDir() });
  return files.map((f) => ({ path: f.path, name: f.name, modified: new Date(f.modified_ms) }));
}

/**
 * Where a formula is written: a new file in the library, or its own. A file of the
 * library that no longer carries the formula's name is renamed to it first; a file
 * opened from outside stays where it is.
 */
export async function placeFormula(name: string, current: string | null): Promise<string> {
  const folder = await libraryDir();
  const stem = fileStem(name, texts.bench.untitled);
  if (current !== null && (!isInside(current, folder) || carriesName(fileNameOf(current), stem))) {
    return current;
  }
  const own = current === null ? "" : fileNameOf(current).toLowerCase();
  const taken = (await listLibrary()).map((f) => fileNameOf(f.path)).filter((n) => n.toLowerCase() !== own);
  const target = await join(folder, freeFileName(stem, taken));
  if (current !== null) {
    await invoke("move_file", { from: current, to: target });
  }
  return target;
}
