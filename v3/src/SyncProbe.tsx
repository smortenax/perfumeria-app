import { useEffect, useState, type FormEvent } from "react";
import type { SignedInUser } from "./db/client";
import type { LocalDatabase } from "./db/local/database";
import { syncProbe } from "./db/local/schema";
import { texts } from "./i18n/es";

interface ProbeRow {
  readonly id: string;
  readonly note: string;
  readonly created_at: string;
}

/**
 * The check of plan step 1.5: a note written without network stays in this browser after
 * reloading, and reaches Supabase when the network is back. It goes away with the probe table.
 */
export function SyncProbe({ local, user }: { local: LocalDatabase; user: SignedInUser }) {
  const t = texts.probe;
  const { powerSync, db } = local;
  const [rows, setRows] = useState<ProbeRow[]>([]);
  const [note, setNote] = useState("");
  const [connected, setConnected] = useState(powerSync.currentStatus.connected);
  const [pending, setPending] = useState(0);
  const [rejected, setRejected] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    powerSync.watch(
      "SELECT id, note, created_at FROM sync_probe ORDER BY created_at DESC",
      [],
      { onResult: (r) => setRows((r.rows?._array ?? []) as ProbeRow[]) },
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

  async function add(e: FormEvent) {
    e.preventDefault();
    const text = note.trim();
    if (text === "") {
      return;
    }
    await db.insert(syncProbe).values({ id: crypto.randomUUID(), ownerId: user.id, note: text, createdAt: new Date().toISOString() });
    setNote("");
    setPending((await powerSync.getUploadQueueStats()).count);
  }

  return (
    <section className="probe">
      <h3>{t.title}</h3>
      <p>{t.lead}</p>
      <p className={connected ? "status ok" : "status off"}>{connected ? t.connected : t.offline}</p>
      <p className="status">{t.pending(pending)}</p>
      {rejected > 0 && <p className="status error">{t.rejected(rejected)}</p>}
      <form onSubmit={add}>
        <label>
          {t.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit">{t.add}</button>
      </form>
      {rows.length === 0 ? (
        <p className="hint">{t.empty}</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id}>
              {r.note} <span className="hint">{new Date(r.created_at).toLocaleString("es-ES")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
