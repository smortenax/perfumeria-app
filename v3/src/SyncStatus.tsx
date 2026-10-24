import { useEffect, useState } from "react";
import { powerSyncEndpoint } from "./db/connector";
import type { LocalDatabase } from "./db/local/database";
import { texts } from "./i18n/en";

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
  // Connected only when nothing is failing: with the service down, the SDK may still say «connected»
  // for a while, but its download (or upload) reports the error (seen in step 6.7).
  const healthy = () => {
    const s = powerSync.currentStatus;
    return s.connected && !s.dataFlowStatus.downloadError && !s.dataFlowStatus.uploadError;
  };
  const [connected, setConnected] = useState(healthy);
  // And the service answers: through the development proxy the stream stays open with the service
  // down, and the SDK never hears of it. Only a failure counts (no answer, or a 5xx); a server that
  // does not expose the probe (404…) leaves it to the SDK.
  const [reachable, setReachable] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(powerSync.currentStatus.lastSyncedAt);
  const errorOf = () => {
    const e = powerSync.currentStatus.dataFlowStatus.downloadError ?? powerSync.currentStatus.dataFlowStatus.uploadError;
    return e ? e.message || String(e) : null;
  };
  const [syncError, setSyncError] = useState<string | null>(errorOf);
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
      setConnected(healthy());
      setLastSynced(powerSync.currentStatus.lastSyncedAt);
      setSyncError(errorOf());
      void powerSync.getUploadQueueStats().then((s) => setPending(s.count));
    };
    refresh();
    const stop = powerSync.registerListener({ statusChanged: refresh });
    const timer = setInterval(refresh, 2000);
    // Only through the app's own site (the development proxy): another origin may refuse the probe
    // (CORS) with the service up, and there the SDK sees the stream close by itself.
    const endpoint = powerSyncEndpoint();
    const sameSite = new URL(endpoint).origin === location.origin;
    const probe = () =>
      !sameSite
        ? Promise.resolve()
        : fetch(`${endpoint}/probes/liveness`, { cache: "no-store" })
        .then((r) => setReachable(r.status < 500))
        .catch(() => setReachable(false));
    void probe();
    const probing = setInterval(() => void probe(), 10_000);
    return () => {
      abort.abort();
      stop();
      clearInterval(timer);
      clearInterval(probing);
    };
  }, [powerSync]);

  return (
    <section className="status-panel">
      <p className={connected && reachable ? "status ok" : "status off"}>{connected && reachable ? t.connected : t.offline}</p>
      <p className="status">{lastSynced ? t.lastSynced(lastSynced.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })) : t.neverSynced}</p>
      <p className="status">{t.materials(counts.common, counts.own)}</p>
      <p className="status">{counts.dataCommit ? t.data(counts.dataCommit.slice(0, 7)) : t.noData}</p>
      <p className="status">{t.pending(pending)}</p>
      {rejected > 0 && <p className="status error">{t.rejected(rejected)}</p>}
      {/* What to read out when a device shows an empty copy (the iPhone, 2026-10-23). */}
      <p className="status">{t.storage(local.storage)}</p>
      {syncError && <p className="status error">{t.syncError(syncError)}</p>}
    </section>
  );
}
