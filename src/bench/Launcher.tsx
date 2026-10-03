import { useEffect, useState } from "react";
import { catalog } from "../data/provisional";
import { texts } from "../i18n/es";
import type { Opened } from "./Bench";
import { openFormula } from "./open";
import { inTauri, pickAndRead, readFile } from "./io";
import { modelVersion, setModelVersion } from "./prefs";
import { libraryDir, readLibrary } from "./library";
import { groupLibrary, type LibraryEntry, type LibraryGroup } from "./library-groups";

const t = texts.launcher;

const when = (date: Date) =>
  date.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * What comes before the bench (§0 leaves it undesigned): for now, a way into it, and
 * the formulas of the library, the one changed last first, with the versions of each
 * together (P44). The gallery with its filters comes later (P45).
 */
export function Launcher(props: { onNew: () => void; onOpen: (opened: Opened) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<LibraryGroup[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [folder, setFolder] = useState<string | null>(null);
  const [model, setModel] = useState(modelVersion());
  const choose = (next: "v1" | "v2") => {
    setModelVersion(next);
    setModel(next);
  };

  useEffect(() => {
    if (!inTauri()) {
      return;
    }
    libraryDir().then(setFolder).catch(() => undefined);
    readLibrary()
      .then((entries) => setGroups(groupLibrary(entries)))
      .catch((e) => setError(`${t.libraryError}: ${e instanceof Error ? e.message : String(e)}`));
  }, []);

  const openText = (text: string, path: string | null) => {
    try {
      props.onOpen(openFormula(text, path, modelVersion()));
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

  const openFromLibrary = async (file: LibraryEntry) => {
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
      {groups !== null && (
        <section className="library">
          <h2>{t.library}</h2>
          {groups.length === 0 ? (
            <p className="muted">{t.libraryEmpty}</p>
          ) : (
            <ul className="library-list">
              {groups.map((g) => {
                const [head, ...older] = g.versions;
                const open = expanded === g.key;
                return (
                  <li key={g.key}>
                    <div className="library-row">
                      <button type="button" className="library-open" onClick={() => void openFromLibrary(head)}>
                        <span className="library-name">{head.title}</span>
                        <span className="num muted">{when(head.modified)}</span>
                      </button>
                      {older.length > 0 && (
                        <button
                          type="button"
                          className="library-versions"
                          aria-expanded={open}
                          title={t.versionsHelp}
                          onClick={() => setExpanded(open ? null : g.key)}
                        >
                          {t.versions(g.versions.length)}
                        </button>
                      )}
                    </div>
                    {open && (
                      <ul className="library-older">
                        {older.map((v) => (
                          <li key={v.path}>
                            <button type="button" className="library-open" onClick={() => void openFromLibrary(v)}>
                              <span className="library-name">{v.title}</span>
                              <span className="num muted">
                                {v.version ? `v${v.version.number} · ` : ""}
                                {when(v.modified)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {folder && <p className="tiny muted">{t.libraryAt(folder)}</p>}
        </section>
      )}
      <div className="launcher-notes">
        <p>
          {t.model}{" "}
          <button type="button" className="link" aria-pressed={model === "v1"} onClick={() => choose("v1")}>
            {model === "v1" ? <strong>{t.modelV1}</strong> : t.modelV1}
          </button>
          {" · "}
          <button type="button" className="link" aria-pressed={model === "v2"} onClick={() => choose("v2")}>
            {model === "v2" ? <strong>{t.modelV2}</strong> : t.modelV2}
          </button>
        </p>
        <p>{t.base(catalog.counts.fig, catalog.counts.ifraOnly)}</p>
        <p>{t.families(catalog.counts.withFamily)}</p>
        <p>{t.source(catalog.source.amendment, catalog.source.generated)}</p>
        <p>{t.provisional}</p>
        <p className="tiny">{t.figCredit}</p>
      </div>
    </main>
  );
}
