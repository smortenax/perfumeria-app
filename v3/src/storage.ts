/**
 * Everything the app keeps in this browser (localStorage), in one place (rule of 2026-11-25: nothing
 * else in the app touches localStorage). What lives here stays in this browser only: it does not
 * sync, and clearing the browser loses it. What must travel between devices goes to the database.
 *
 * The keys keep the names they had before this module, so that nothing already kept is lost.
 */
export const STORAGE_KEYS = {
  /** Supabase's session (db/client.ts). */
  session: "perfumeria.sesion",
  /** The formulas and materials opened lately, for Home (recent.ts). */
  recent: "perfumeria-v3.recent",
  /** Per material, the last and favourite dilutions, and the user's own diluents (bench/store.ts). */
  userData: "perfumeria.usuario.v1",
  /** The same data as the v2 kept it, read once to carry it over (bench/store.ts). */
  oldPrefs: "perfumeria.prefs.v1",
  oldRecent: "perfumeria.recent.v1",
  /** The rows of «Add & weigh» not saved yet (dilution/Dilutions.tsx), weights in mg (v1 had them in grams and is left behind). */
  dilutionDraft: "perfumeria.dilutions.weigh.v2",
  /** The print jobs of saved batches (labels/jobs.ts). */
  labelJobs: "perfumeria.labels.jobs.v1",
  /** The tape and the «turn upside down» choice of Labels, and the tape of the test page. */
  labelTape: "perfumeria.labels.tape.v1",
  labelFlip: "perfumeria.labels.flip.v1",
  labelTestTape: "perfumeria.labeltest.tape.v1",
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

/** The text kept under a key, or null when there is none or the browser keeps nothing. */
export function readStored(key: StorageKey): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS[key]);
  } catch {
    return null;
  }
}

/** Keeps a text under a key. False when the browser keeps nothing: it lasts as long as the screen. */
export function writeStored(key: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS[key], value);
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: StorageKey): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
  } catch {
    // Nothing was kept.
  }
}

/** The JSON kept under a key, or null when there is none or it does not parse. */
export function readStoredJson(key: StorageKey): unknown {
  const text = readStored(key);
  if (text === null) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
