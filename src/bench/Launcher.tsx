import { useState } from "react";
import { formulaFromJson } from "../core/io/formula-json";
import { catalog } from "../data/provisional";
import { texts } from "../i18n/es";
import type { Opened } from "./Bench";
import { pickAndRead } from "./io";

const t = texts.launcher;

/** What comes before the bench (§0 leaves it undesigned): for now, a way into it. */
export function Launcher(props: { onNew: () => void; onOpen: (opened: Opened) => void }) {
  const [error, setError] = useState<string | null>(null);
  const rows = catalog.entries.filter((e) => e.group === "base").length;

  const open = async () => {
    const file = await pickAndRead();
    if (!file) {
      return;
    }
    try {
      props.onOpen({ formula: formulaFromJson(file.text), path: file.path });
    } catch (e) {
      setError(`${t.openError}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <main className="launcher">
      <h1>{texts.appName}</h1>
      <p className="subtitle">{t.subtitle}</p>
      <div className="launcher-actions">
        <button type="button" className="add-btn big" autoFocus onClick={props.onNew}>
          {t.newBench}
        </button>
        <button type="button" className="big" onClick={() => void open()}>
          {t.open}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="launcher-notes">
        <p>{t.base(rows, catalog.checkedCas)}</p>
        <p>{t.source(catalog.source.commit, catalog.source.date)}</p>
        <p>{t.provisional}</p>
      </div>
    </main>
  );
}
