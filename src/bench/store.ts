import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { inTauri } from "./io";

/**
 * What the app remembers of its user between sessions (§6): per material, the
 * last dilution and the favourites; the materials used lately; and the user's
 * own provisional diluents. It lives in a file of the app's data folder,
 * preferencias.json, never in the browser's memory, which is lost when it is
 * cleared (§6). In a plain browser, used only for development, it falls back to
 * that memory.
 */
export interface Dilution {
  /** As typed, with a decimal comma or point: "10", "0,5". */
  readonly percent: string;
  /** A diluent of the app ("dpg", "ipm"…) or one of the user's ("prov:…"). */
  readonly diluent: string;
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
  readonly recent: readonly string[];
  readonly diluents: readonly OwnDiluent[];
}

const FILE = "preferencias.json";
const OLD_PREFS = "perfumeria.prefs.v1";
const OLD_RECENT = "perfumeria.recent.v1";
const BROWSER_KEY = "perfumeria.usuario.v1";

let data: UserData = { version: 1, materials: {}, recent: [], diluents: [] };
let path: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function fromOldBrowserMemory(): UserData | null {
  try {
    const prefs = localStorage.getItem(OLD_PREFS);
    const recent = localStorage.getItem(OLD_RECENT);
    if (prefs === null && recent === null) {
      return null;
    }
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
  return { version: 1, materials: v.materials ?? {}, recent: v.recent, diluents: Array.isArray(v.diluents) ? v.diluents : [] };
}

/** Reads the user's data once, before the first screen. A missing file starts empty, or from what the browser kept before. */
export async function loadUserData(): Promise<void> {
  if (!inTauri()) {
    try {
      data = valid(JSON.parse(localStorage.getItem(BROWSER_KEY) ?? "null")) ?? fromOldBrowserMemory() ?? data;
    } catch {
      // Storage unavailable: start empty.
    }
    return;
  }
  path = await join(await appDataDir(), FILE);
  let text: string | null = null;
  try {
    text = await invoke<string>("read_text_file", { path });
  } catch {
    text = null; // no file yet
  }
  const read = text === null ? null : valid(JSON.parse(text));
  if (read) {
    data = read;
    return;
  }
  const old = fromOldBrowserMemory();
  if (old) {
    data = old;
    await save();
  }
}

async function save(): Promise<void> {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (path) {
    await invoke("write_text_file", { path, contents: text });
  } else {
    try {
      localStorage.setItem(BROWSER_KEY, text);
    } catch {
      // Storage unavailable: it lasts until the app closes.
    }
  }
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
    save().catch((e) => console.error("preferencias.json", e));
  }, 300);
  return data;
}

/** Where the file is, to say it in the interface; null in a browser. */
export const userDataPath = (): string | null => path;
