/**
 * Where the browser's copy keeps its SQLite file. PowerSync's default, IndexedDB
 * (IDBBatchAtomicVFS), does not work on Safari or iOS with several tabs, which the app has on by
 * default: on an iPhone the copy stayed empty, not even the common materials (2026-10-23).
 * PowerSync recommends OPFSCoopSyncVFS there. Every browser on iOS is WebKit, so Chrome or Firefox
 * on an iPhone take it too. Chromium and Firefox keep IndexedDB, and with it the copy they hold.
 * Without OPFS (a private window in Safari) the default stays: better than no copy.
 */
export type Storage = "opfs" | "indexeddb";

export function storageFor(userAgent: string, hasOpfs: boolean): Storage {
  const webkit = /AppleWebKit\//.test(userAgent) && !/(Chrome|Chromium|Edg|OPR)\//.test(userAgent);
  return webkit && hasOpfs ? "opfs" : "indexeddb";
}

/** The storage of this browser. */
export function browserStorage(): Storage {
  return storageFor(navigator.userAgent, typeof navigator.storage?.getDirectory === "function");
}
