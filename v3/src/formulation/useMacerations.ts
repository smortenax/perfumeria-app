import { useEffect, useState } from "react";
import type { LocalDatabase } from "../db/local/database";
import { listMacerations, type Maceration } from "../db/macerations";

/** What is macerating (V3-83), live from the copy. */
export function useMacerations(local: LocalDatabase): readonly Maceration[] {
  const [list, setList] = useState<Maceration[]>([]);
  useEffect(() => {
    const abort = new AbortController();
    local.powerSync.watch(
      "SELECT count(*) AS n, max(updated_at) AS at FROM macerations",
      [],
      { onResult: () => void listMacerations(local.db, local.userId).then(setList) },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, [local]);
  return list;
}
