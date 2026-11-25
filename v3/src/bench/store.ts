import type { ModelVersion } from "./data/repository";
import { readStored, readStoredJson, writeStored } from "../storage";

/**
 * What the app remembers of its user between sessions (§6): per material, the
 * last dilution and the favourites; the materials used lately (no longer shown,
 * P57, but kept as it was); and the user's own provisional diluents. In the v3 (a web app, V3-8) it
 * lives in this browser (storage.ts): it does not travel to other devices and is lost if the browser
 * is cleared. Moving it to the synced database is the user's decision (assessment 2026-11-25).
 */
export interface Dilution {
  /** As typed, with a decimal comma or point: "10", "0,5". */
  readonly percent: string;
  /** A diluent of the app ("dpg", "ipm"…) or one of the user's ("prov:…"). The first one, in a mixture. */
  readonly diluent: string;
  /**
   * A mixture of two diluents (2026-10-08): the % of the first one, as typed, and the second
   * one, which takes the rest. Absent with one diluent.
   */
  readonly mix?: { readonly percent: string; readonly diluent: string };
}

export interface MaterialPrefs {
  readonly favorites: readonly Dilution[];
  readonly last?: Dilution;
  /** The user's name for it: the one on the bottle, by which it was found (P56). */
  readonly name?: string;
}

export interface OwnDiluent {
  readonly id: string;
  readonly name: string;
}

export interface UserData {
  readonly version: 1;
  readonly materials: Readonly<Record<string, MaterialPrefs>>;
  /** The materials used lately. No longer shown or written (P57), but kept in the file as it was. */
  readonly recent: readonly string[];
  readonly diluents: readonly OwnDiluent[];
  /** The model of materials the bench reads (docs/v2/): the v2 when absent (Phase 5), the v1 only if the user chose it. */
  readonly model?: ModelVersion;
}

let data: UserData = { version: 1, materials: {}, recent: [], diluents: [] };
let timer: ReturnType<typeof setTimeout> | null = null;

function fromOldBrowserMemory(): UserData | null {
  const prefs = readStored("oldPrefs");
  const recent = readStored("oldRecent");
  if (prefs === null && recent === null) {
    return null;
  }
  try {
    return { version: 1, materials: JSON.parse(prefs ?? "{}"), recent: JSON.parse(recent ?? "[]"), diluents: [] };
  } catch {
    return null;
  }
}

function valid(value: unknown): UserData | null {
  const v = value as Partial<UserData> | null;
  if (!v || v.version !== 1 || typeof v.materials !== "object" || !Array.isArray(v.recent)) {
    return null;
  }
  return {
    version: 1,
    materials: v.materials ?? {},
    recent: v.recent,
    diluents: Array.isArray(v.diluents) ? v.diluents : [],
    ...(v.model === "v1" || v.model === "v2" ? { model: v.model } : {}),
  };
}

/** Reads the user's data once, before the first screen: what this browser kept, or what the v2 kept before. */
export async function loadUserData(): Promise<void> {
  data = valid(readStoredJson("userData")) ?? fromOldBrowserMemory() ?? data;
}

function save(): void {
  // Storage unavailable: it lasts until the app closes.
  writeStored("userData", `${JSON.stringify(data, null, 2)}\n`);
}

export const userData = (): UserData => data;

/** Changes the user's data and writes it a moment later, once, however many changes come together. */
export function updateUserData(change: (current: UserData) => UserData): UserData {
  data = change(data);
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    save();
  }, 300);
  return data;
}
