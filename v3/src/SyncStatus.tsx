import { useEffect, useState } from "react";
import type { LocalDatabase } from "./db/local/database";
import { texts } from "./i18n/es";

interface Counts {
  readonly common: number;
  readonly own: number;
  readonly dataCommit: string | null;
}

/**
 * What this browser holds and whether it is in step with Supabase (V3-9): the connection, the
 * changes still waiting to go up, those Supabase refused, and how many materials there are.
 */
export function SyncStatus({ local }: { local: LocalDatabase }) {
  const t = texts.status;
  const { powerSync } = local;
  const [connected, setConnected] = useState(powerSync.currentStatus.connected);
  const [pending, setPending] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [counts, setCounts] = useState<Counts>({ common: 0, own: 0, dataCommit: null });

  useEffect(() => {
    const abort = new AbortController();
    powerSync.watch(
      `SELECT
         (SELECT count(*) FROM materials WHERE owner_id IS NULL) AS common,
         (SELECT count(*) FROM materials WHERE owner_id IS NOT NULL) AS own,
         (SELECT "commit" FROM data_version LIMIT 1) AS data_commit`,
      [],
      {
        onResult: (r) => {
          const row = r.rows?._array[0];
          setCounts({ common: Number(row?.common ?? 0), own: Number(row?.own ?? 0), dataCommit: row?.data_commit ?? null });
        },
      },
      { signal: abort.signal },
    );
    powerSync.watch(
      "SELECT count(*) AS n FROM upload_rejections",
      [],
      { onResult: (r) => setRejected(Number(r.rows?._array[0]?.n ?? 0)) },
      { signal: abort.signal },
    );
    const refresh = () => {
      setConnected(powerSync.currentStatus.connected);
      void powerSync.getUploadQueueStats().then((s) => setPending(s.count));
    };
    refresh();
    const stop = powerSync.registerListener({ statusChanged: refresh });
    const timer = setInterval(refresh, 2000);
    return () => {
      abort.abort();
      stop();
      clearInterval(timer);
    };
  }, [powerSync]);

  return (
    <section className="status-panel">
      <p className={connected ? "status ok" : "status off"}>{connected ? t.connected : t.offline}</p>
      <p className="status">{t.materials(counts.common, counts.own)}</p>
      <p className="status">{counts.dataCommit ? t.data(counts.dataCommit.slice(0, 7)) : t.noData}</p>
      <p className="status">{t.pending(pending)}</p>
      {rejected > 0 && <p className="status error">{t.rejected(rejected)}</p>}
    </section>
  );
}
