import { useMemo } from "react";
import { texts } from "../i18n/es";
import { type SheetValue, sheetOf } from "./sheet";
import type { GlossaryData } from "./useGlossary";

/**
 * A material's sheet as a plain data sheet (plan v3, step 6.2; V3-47): its sections, each with
 * «field: value» and its tables. What nobody says reads «no lo dice» (§1.2).
 */
export function MaterialSheet({
  data,
  id,
  onBack,
  onEdit,
  onOpen,
  onMakeVersion,
  onHave,
}: {
  data: GlossaryData;
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onOpen: (id: string) => void;
  onMakeVersion: () => void;
  /** Little by little (step 6.5): this one, marked or not. */
  onHave: (have: boolean) => void;
}) {
  const sheet = useMemo(() => (data.catalog.materials.has(id) ? sheetOf(data.catalog, data.layer, data.ifra, id) : null), [data, id]);
  // Your versions of a common material (V3-5): it shows them, and makes one more.
  const versions = useMemo(() => [...data.catalog.materials.values()].filter((m) => m.basedOnId === id && m.ownerId !== null), [data, id]);
  const t = texts.sheet;
  return (
    <article className="sheet">
      <button type="button" className="link" onClick={onBack}>
        ← {texts.glossary.back}
      </button>
      {!sheet ? (
        <p>{texts.glossary.missing}</p>
      ) : (
        <>
          <div className="title-bar">
            <h2>{sheet.name}</h2>
            {sheet.own ? (
              <button type="button" onClick={onEdit}>
                {texts.editor.edit}
              </button>
            ) : (
              <button type="button" title={texts.editor.makeVersionHint} onClick={onMakeVersion}>
                {texts.editor.makeVersion}
              </button>
            )}
          </div>
          {versions.length > 0 && (
            <p className="hint">
              {texts.editor.yourVersions}:{" "}
              {versions.map((v, i) => (
                <span key={v.id}>
                  {i > 0 && " · "}
                  <button type="button" className="link" onClick={() => onOpen(v.id)}>
                    {[v.name, v.supplier, v.product].filter((x) => x).join(" · ")}
                  </button>
                </span>
              ))}
            </p>
          )}
          <p className="hint">
            <label className="check have-toggle">
              <input type="checkbox" checked={data.catalog.have.has(id)} onChange={(e) => onHave(e.target.checked)} />
              {texts.glossary.haveToggle}
            </label>{" "}
            <span className={`ifra ifra-${sheet.ifra.state}`} title={texts.ifraStateHelp[sheet.ifra.state]}>
              {texts.ifraState[sheet.ifra.state]}
            </span>
          </p>
          {sheet.sections.map((section) => (
            <section key={section.key} className="sheet-section">
              <h3>
                {section.title}
                {section.disputed && <span className="disputed">{t.disputed}</span>}
              </h3>
              {section.rows.length > 0 && (
                <dl>
                  {section.rows.map((row) => (
                    <div key={row.label} className="field">
                      <dt>{row.label}</dt>
                      <dd>
                        <Value value={row.value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {section.tables.map((table, i) => (
                <div key={i} className="table-wrap">
                  {table.rows.length === 0 ? (
                    <p className="unknown">
                      {table.caption ? `${table.caption}: ` : ""}
                      {table.empty}
                    </p>
                  ) : (
                    <table>
                      {table.caption && <caption>{table.caption}</caption>}
                      <thead>
                        <tr>
                          {table.columns.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((cells, r) => (
                          <tr key={r}>
                            {cells.map((cell, c) => (
                              <td key={c}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </article>
  );
}

function Value({ value }: { value: SheetValue }) {
  const t = texts.sheet;
  if (value.text === null) {
    return (
      <span className="unknown">
        {t.unknown}
        {value.disputed && <span className="disputed">{t.disputed}</span>}
      </span>
    );
  }
  return (
    <>
      {value.link ? (
        <a href={value.link} target="_blank" rel="noreferrer">
          {value.text}
        </a>
      ) : (
        <span className="value">{value.text}</span>
      )}
      {value.notes.length > 0 && <span className="notes"> ({value.notes.join("; ")})</span>}
      {value.disputed && <span className="disputed">{t.disputed}</span>}
    </>
  );
}
