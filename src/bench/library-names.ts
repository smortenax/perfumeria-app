/**
 * The names of the files of the library (P44): a formula's file is called as the
 * formula, and a number tells two apart when they share a name: «Lejía (2).json».
 * Windows does not tell capitals apart in file names, so neither does this.
 */

/** The name a file can have: without the signs Windows forbids, and never empty. */
export function fileStem(name: string, fallback: string): string {
  const clean = name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return clean === "" ? fallback : clean;
}

/** Whether a file («Lejía (2)») already carries the name of its formula («Lejía»). */
export function carriesName(fileName: string, stem: string): boolean {
  const base = fileName.replace(/\.json$/i, "").toLowerCase();
  const wanted = stem.toLowerCase();
  return base === wanted || new RegExp(`^${escape(wanted)} \\(\\d+\\)$`).test(base);
}

/** The first free file name for a formula: «Lejía.json», then «Lejía (2).json»… */
export function freeFileName(stem: string, taken: Iterable<string>): string {
  const used = new Set([...taken].map((n) => n.toLowerCase()));
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? `${stem}.json` : `${stem} (${n}).json`;
    if (!used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

/** Whether a path is inside a folder, on Windows: either slash, and any capitals. */
export function isInside(path: string, dir: string): boolean {
  const norm = (p: string) => p.replace(/[\\/]+/g, "\\").replace(/\\$/, "").toLowerCase();
  const folder = norm(dir);
  const file = norm(path);
  return file.startsWith(`${folder}\\`) && !file.slice(folder.length + 1).includes("\\");
}

export const fileNameOf = (path: string): string => path.split(/[\\/]/).pop() ?? path;

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
