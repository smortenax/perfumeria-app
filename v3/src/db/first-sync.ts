import { useEffect, useState } from "react";
import type { LocalDatabase } from "./local/database";

export interface FirstSync {
  /** Whether this browser's copy has synced once, ever (null while the copy opens). */
  readonly synced: boolean | null;
  /** Why the download fails, while the copy has never synced; null when it does not. */
  readonly error: string | null;
}

/**
 * Whether the copy has ever synced (V3-75, D4): until then it holds nothing of yours, and the screens
 * wait for it instead of showing an empty glossary (the web and the phone, 2026-10-27: empty, or
 * stuck opening, while PowerSync refused the session). A copy that synced once opens at once, with
 * or without network: PowerSync keeps that in the copy.
 */
export function useFirstSync(local: LocalDatabase): FirstSync {
  const [state, setState] = useState<FirstSync>({ synced: null, error: null });
  useEffect(() => {
    let live = true;
    const { powerSync } = local;
    const read = () => {
      const s = powerSync.currentStatus;
      const synced = s.hasSynced === true;
      const failure = s.dataFlowStatus.downloadError;
      // The server's words, without the dangling «: » some of them end with.
      const error = synced || !failure ? null : (failure.message || String(failure)).replace(/[\s:.]+$/, "");
      if (live) setState((old) => (old.synced === synced && old.error === error ? old : { synced, error }));
    };
    const stop = powerSync.registerListener({ statusChanged: read });
    void powerSync.waitForReady().then(read);
    return () => {
      live = false;
      stop();
    };
  }, [local]);
  return state;
}
