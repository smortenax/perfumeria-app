/**
 * The print text of each batch of dilutions, kept apart from the app's data (the user, 2026-11-24:
 * «se tendria que registrar en texto a parte para no crear conflicto con los datos de guardado de la
 * app … y tenga una parte extra que guarde en el formato de impresora para que cuando le das al boton
 * de imprimir se pase ahi y se imprima»). Saving a batch in «Add & weigh» saves its bottles as always
 * and, besides, one job here: each label's two lines, as the P15 prints them. It lives in this
 * browser only (localStorage); it never touches the database or its sync.
 */

/** One label as the printer takes it: the big line and the small one. */
export interface PrintLine {
  readonly big: string;
  readonly small: string;
}

/** One batch's labels, ready to print. */
export interface PrintJob {
  readonly id: string;
  /** When the batch was saved (ISO). */
  readonly savedAt: string;
  /** The batch's «Made on» date. */
  readonly day: string | null;
  readonly lines: readonly PrintLine[];
}

const KEY = "perfumeria.labels.jobs.v1";
/** The last batches kept; older ones drop off. */
export const KEEP = 50;

/** Reads the stored text; anything that is not a job is left out. */
export function parseJobs(raw: string | null): PrintJob[] {
  try {
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (j): j is PrintJob =>
        !!j &&
        typeof j.id === "string" &&
        typeof j.savedAt === "string" &&
        Array.isArray(j.lines) &&
        j.lines.every((l: unknown) => !!l && typeof (l as PrintLine).big === "string" && typeof (l as PrintLine).small === "string"),
    );
  } catch {
    return [];
  }
}

/** The jobs with this one first, the newest kept. */
export function withJob(jobs: readonly PrintJob[], job: PrintJob): PrintJob[] {
  return [job, ...jobs.filter((j) => j.id !== job.id)].slice(0, KEEP);
}

/** A job as the label test page's text: one label a line, «big | small». */
export function jobText(job: PrintJob): string {
  return job.lines.map((l) => (l.small ? `${l.big} | ${l.small}` : l.big)).join("\n");
}

export function readJobs(): PrintJob[] {
  try {
    return parseJobs(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

function write(jobs: readonly PrintJob[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs));
    return true;
  } catch {
    return false;
  }
}

/** Keeps a batch's labels; false when this browser does not let the page store anything. */
export function saveJob(job: PrintJob): boolean {
  return write(withJob(readJobs(), job));
}

export function removeJob(id: string): PrintJob[] {
  const next = readJobs().filter((j) => j.id !== id);
  write(next);
  return next;
}
