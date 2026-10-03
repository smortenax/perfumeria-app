import { invoke } from "@tauri-apps/api/core";
import { documentDir, join } from "@tauri-apps/api/path";
import { provisionalKey, type Material } from "../core/model/material";
import { texts } from "../i18n/es";
import { inTauri, readFile } from "./io";
import type { LibraryEntry } from "./library-groups";
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
/** The folder of the copies of the formulas that were migrated to the v2, inside the library (not listed as a formula). */
export const BACKUP_FOLDER = "copias-v1";

/** Whether a copy of the original is due: only once, and never over a copy that is already there (D13). */
export const needsBackup = (existing: readonly string[], fileName: string): boolean =>
  !existing.some((name) => name.toLowerCase() === fileName.toLowerCase());

/**
 * Copies the file a formula was opened from, as it was, to `Fórmulas\copias-v1\`, before the first write over it. Returns whether it
 * copied: false if a copy of that file is already there, which is never overwritten.
 */
export async function backupOriginal(path: string, text: string): Promise<boolean> {
  const folder = await join(await libraryDir(), BACKUP_FOLDER);
  const name = fileNameOf(path);
  const existing = await invoke<Array<{ path: string; name: string; modified_ms: number }>>("list_formulas", { dir: folder });
  if (!needsBackup(existing.map((f) => fileNameOf(f.path)), name)) {
    return false;
  }
  await invoke("write_text_file", { path: await join(folder, name), contents: text });
  return true;
}

export async function listLibrary(): Promise<LibraryFile[]> {
  if (!inTauri()) {
    return [];
  }
  const files = await invoke<Array<{ path: string; name: string; modified_ms: number }>>("list_formulas", { dir: await libraryDir() });
  return files.map((f) => ({ path: f.path, name: f.name, modified: new Date(f.modified_ms) }));
}

/**
 * The library as the gallery sees it: each formula's name and version, read from inside
 * its file. A file that cannot be read still shows, by its file name, so nothing hides.
 */
export async function readLibrary(): Promise<LibraryEntry[]> {
  const files = await listLibrary();
  return Promise.all(
    files.map(async (f): Promise<LibraryEntry> => {
      try {
        const header = JSON.parse(await readFile(f.path)).header ?? {};
        const version = header.version;
        return {
          path: f.path,
          title: typeof header.name === "string" && header.name.trim() !== "" ? header.name : f.name,
          modified: f.modified,
          ...(version && typeof version.family === "string" && Number.isInteger(version.number)
            ? { version: { family: version.family, number: version.number, from: version.from ?? null } }
            : {}),
        };
      } catch {
        return { path: f.path, title: f.name, modified: f.modified };
      }
    }),
  );
}

/**
 * The provisional materials of the library (P44): each formula carries its own inside
 * its file, and the library remembers them by name. The spelling is the one of the
 * formula changed last. A file that cannot be read gives none.
 */
export async function rememberedProvisionals(): Promise<Material[]> {
  const found = new Map<string, Material>();
  for (const f of await listLibrary()) {
    try {
      const materials: Record<string, { kind?: string; name?: string }> = JSON.parse(await readFile(f.path)).materials ?? {};
      for (const doc of Object.values(materials)) {
        if (doc.kind === "provisional" && typeof doc.name === "string" && doc.name.trim() !== "") {
          const key = provisionalKey(doc.name);
          if (!found.has(key)) {
            found.set(key, { key, kind: "provisional", name: doc.name.trim() });
          }
        }
      }
    } catch {
      // A damaged file shows in the library by its name; it just teaches no materials.
    }
  }
  return [...found.values()];
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
