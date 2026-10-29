import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { texts } from "../i18n/en";
import { SheetHero } from "./SheetHero";
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
  onCopySpec,
  onHave,
  links,
}: {
  data: GlossaryData;
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onOpen: (id: string) => void;
  onMakeVersion: () => void;
  /** «Make another from this» (V3-79), on a specification of yours. */
  onCopySpec?: () => void;
  /** Little by little (step 6.5): this one, marked or not. */
  onHave: (have: boolean) => void;
  /** Its tastings and its bottles, as links to «Catas» and «Diluciones» (V3-64, V3-67): they live there, not in the sheet. */
  links?: ReactNode;
}) {
  const sheet = useMemo(() => (data.catalog.materials.has(id) ? sheetOf(data.catalog, data.layer, data.ifra, id) : null), [data, id]);
  // Your versions of a common material (V3-5): it shows them, and makes one more.
  const versions = useMemo(() => [...data.catalog.materials.values()].filter((m) => m.basedOnId === id && m.ownerId !== null), [data, id]);
  const t = texts.sheet;
  const material = data.catalog.materials.get(id);
  const base = material?.basedOnId ? data.catalog.materials.get(material.basedOnId) : undefined;
  const abbreviation = material?.abbreviation ?? base?.abbreviation ?? null;
  // The sources, folded at the end (V3-86): a figure's mark opens them at its line.
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sourcesRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => setSourcesOpen(false), [id]);
  const show = (mark: number) => {
    setSourcesOpen(true);
    requestAnimationFrame(() => {
      const line = sourcesRef.current?.querySelector<HTMLElement>(`[data-mark="${mark}"]`);
      line?.scrollIntoView({ block: "center" });
      line?.focus();
    });
  };
  const markOf = (mark: number) => <Mark key={mark} mark={mark} onShow={show} />;
  return (
    <article className="sheet">
      <nav className="crumb" aria-label={t.crumb}>
        <button type="button" className="link" onClick={onBack}>
          {texts.nav.materials}
        </button>
        <span aria-hidden="true">/</span>
        <span>{sheet?.name ?? texts.glossary.missing}</span>
      </nav>
      {!sheet ? (
        <p>{texts.glossary.missing}</p>
      ) : (
        <>
          <SheetHero
            catalog={data.catalog}
            material={material!}
            name={sheet.name}
            marks={sheet.figures}
            markOf={markOf}
            chips={
              <>
                <span className="chip">{texts.kinds[material!.kind]}</span>
                {abbreviation && <span className="chip">{abbreviation}</span>}
                {(material!.solvent || base?.solvent) && <span className="chip">{t.fields.solvent}</span>}
                <span className={`ifra ifra-${sheet.ifra.state}`} title={texts.ifraStateHelp[sheet.ifra.state]}>
                  {texts.ifraState[sheet.ifra.state]}
                </span>
              </>
            }
            actions={
              <>
                {sheet.own ? (
                  <>
                    <button type="button" onClick={onEdit}>
                      {texts.editor.edit}
                    </button>
                    {onCopySpec && material!.kind !== "frozen" && (
                      <button type="button" className="secondary" title={texts.editor.copySpecHint} onClick={onCopySpec}>
                        {texts.editor.copySpec}
                      </button>
                    )}
                  </>
                ) : (
                  <button type="button" onClick={onMakeVersion}>
                    {texts.editor.makeVersion}
                  </button>
                )}
                <button type="button" className="pill" aria-pressed={data.catalog.have.has(id)} onClick={() => onHave(!data.catalog.have.has(id))}>
                  {texts.glossary.haveToggle}
                </button>
              </>
            }
          />
          {/* Without hover (step 6.6): what the button does is said, not left to a tooltip. */}
          {!sheet.own && <p className="hint">{texts.editor.makeVersionHint}</p>}
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
          {links && <div className="sheet-links">{links}</div>}
          <div className="sheet-sections reading">
          {sheet.sections.map((section) => (
            <section key={section.key} className={`sheet-section${section.tables.some((x) => x.rows.length > 0) || section.key === "yourNotes" ? " wide" : ""}`}>
              <h3>
                {section.title}
                {section.mark && markOf(section.mark)}
              </h3>
              {section.rows.some((row) => row.value.text !== null) && (
                <dl>
                  {section.rows
                    .filter((row) => row.value.text !== null)
                    .map((row) => (
                      <div key={row.label} className="field">
                        <dt>{row.label}</dt>
                        <dd>
                          <Value value={row.value} />
                        </dd>
                      </div>
                    ))}
                </dl>
              )}
              {/* What nobody says, folded under one line (V3-73): still there, not a wall of «not stated». */}
              {section.rows.some((row) => row.value.text === null) && (
                <details className="unstated">
                  <summary>{texts.glossary.hero.hidden(section.rows.filter((row) => row.value.text === null).length)}</summary>
                  <dl>
                    {section.rows
                      .filter((row) => row.value.text === null)
                      .map((row) => (
                        <div key={row.label} className="field">
                          <dt>{row.label}</dt>
                          <dd>
                            <Value value={row.value} />
                          </dd>
                        </div>
                      ))}
                  </dl>
                </details>
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
                              <td key={c} data-label={table.columns[c]}>
                                {cell}
                                {c === table.markAt && table.marks?.[r] !== undefined && markOf(table.marks[r])}
                              </td>
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
          </div>
          {sheet.sources.length > 0 && (
            <details ref={sourcesRef} className="sheet-sources reading" open={sourcesOpen} onToggle={(e) => setSourcesOpen(e.currentTarget.open)}>
              <summary>{t.sources(sheet.sources.length)}</summary>
              <ol>
                {sheet.sources.map((s) => (
                  <li key={s.mark} value={s.mark} data-mark={s.mark} tabIndex={-1}>
                    <span className="source-what">{t.sourceOf(s.what)}</span> {s.text ?? <span className="unknown">{t.unknown}</span>}
                    {s.authority && <span className="source-meta"> · {s.authority}</span>}
                    {s.yours && <span className="source-meta"> · {t.yours}</span>}
                    {s.disputed && <span className="source-meta"> · {t.disputedLong}</span>}
                    {s.note && <span className="source-note"> {s.note}</span>}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </>
      )}
    </article>
  );
}

/** A figure's mark: a small number that opens «Sources» at its line (V3-86). */
function Mark({ mark, onShow }: { mark: number; onShow: (mark: number) => void }) {
  const label = texts.sheet.sourceMark(mark);
  return (
    <button type="button" className="src-mark" aria-label={label} title={label} onClick={() => onShow(mark)}>
      {mark}
    </button>
  );
}

/** A value, and what goes with it; whether the sources disagree on it is said in «Sources» (V3-86). */
function Value({ value }: { value: SheetValue }) {
  const t = texts.sheet;
  if (value.text === null) return <span className="unknown">{t.unknown}</span>;
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
    </>
  );
}
