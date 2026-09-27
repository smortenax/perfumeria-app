import { useEffect, useState } from "react";
import { formulaFromJson } from "../core/io/formula-json";
import { catalog } from "../data/provisional";
import { texts } from "../i18n/es";
import type { Opened } from "./Bench";
import { inTauri, pickAndRead, readFile } from "./io";
import { libraryDir, listLibrary, type LibraryFile } from "./library";

const t = texts.launcher;

const when = (date: Date) =>
  date.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * What comes before the bench (§0 leaves it undesigned): for now, a way into it, and
 * the formulas of the library, the most recent first (P44). The gallery with its
 * filters comes later (P45).
 */
export function Launcher(props: { onNew: () => void; onOpen: (opened: Opened) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<LibraryFile[] | null>(null);
  const [folder, setFolder] = useState<string | null>(null);

  useEffect(() => {
    if (!inTauri()) {
      return;
    }
    libraryDir().then(setFolder).catch(() => undefined);
    listLibrary()
      .then(setFiles)
      .catch((e) => setError(`${t.libraryError}: ${e instanceof Error ? e.message : String(e)}`));
  }, []);

  const openText = (text: string, path: string | null) => {
    try {
      props.onOpen({ formula: formulaFromJson(text), path });
    } catch (e) {
      setError(`${t.openError}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const openOther = async () => {
    const file = await pickAndRead(folder ?? undefined);
    if (file) {
      openText(file.text, file.path);
    }
  };

  const openFromLibrary = async (file: LibraryFile) => {
    try {
      openText(await readFile(file.path), file.path);
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
        <button type="button" className="big" onClick={() => void openOther()}>
          {inTauri() ? t.openOther : t.open}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {files !== null && (
        <section className="library">
          <h2>{t.library}</h2>
          {files.length === 0 ? (
            <p className="muted">{t.libraryEmpty}</p>
          ) : (
            <ul className="library-list">
              {files.map((f) => (
                <li key={f.path}>
                  <button type="button" onClick={() => void openFromLibrary(f)}>
                    <span className="library-name">{f.name}</span>
                    <span className="num muted">{when(f.modified)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {folder && <p className="tiny muted">{t.libraryAt(folder)}</p>}
        </section>
      )}
      <div className="launcher-notes">
        <p>{t.base(catalog.counts.fig, catalog.counts.ifraOnly)}</p>
        <p>{t.source(catalog.source.amendment, catalog.source.generated)}</p>
        <p>{t.provisional}</p>
        <p className="tiny">{t.figCredit}</p>
      </div>
    </main>
  );
}
