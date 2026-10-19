import { useEffect, useState } from "react";
import type { LocalDatabase } from "../db/local/database";
import { loadTastings, TASTING_TABLES, type Tastings } from "../db/tastings";

/** Your tastings, read from this browser's copy, again on every change of their tables. */
export function useTastings(local: LocalDatabase): Tastings | null {
  const [tastings, setTastings] = useState<Tastings | null>(null);
  useEffect(() => {
    let live = true;
    let reading = Promise.resolve();
    const refresh = () => {
      reading = reading
        .then(() => loadTastings(local.db, local.userId))
        .then((value) => {
          if (live) setTastings(value);
        })
        .catch((error: unknown) => console.error("tastings", error));
    };
    refresh();
    const stop = local.powerSync.onChangeWithCallback({ onChange: refresh }, { tables: TASTING_TABLES, throttleMs: 150 });
    return () => {
      live = false;
      stop();
    };
  }, [local]);
  return tastings;
}

/** The clock of the timers: now, every second while something is waiting. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}
