import { useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import type { Dilution } from "../db/catalog";
import { archiveBottle, type BottleInput, createBottle, describeBottle, updateBottle } from "../db/dilutions";
import type { LocalDatabase } from "../db/local/database";
import { percent } from "../glossary/format";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { FailureNote } from "../FailureNote";
import { Toast } from "../Toast";
import { bottleOf, plan, storedBottle } from "./calc";
import { coloursOf } from "../families/palette";
import { orbLookOf, orbScalesOf, seedOf } from "../glossary/orb/fromCatalog";
import { MaterialOrb } from "../glossary/orb/MaterialOrb";
import { DilutionPopup } from "./DilutionPopup";
import { cardsOf, countOf, nominalPercent, shortName } from "./grid";
import { NewDilution } from "./NewDilution";
import "./dilutions.css";
import { EmptyState } from "../EmptyState";
import { Button } from "../Button";
import { DiluentPicker } from "./DiluentPicker";

const t = texts.dilutions;
const UG_PER_G = 1_000_000n;

/** Grams as the scale shows them: «1.030». */
export const gramsText = (ug: bigint) => Ratio.of(ug, UG_PER_G).toFixed(3);
/** «1,03» or «1.03» → micrograms, to the milligram; null while it is not a weight. */
export function gramsOf(text: string): bigint | null {
  const clean = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(clean)) return null;
  const ug = Ratio.fromDecimal(clean).mul(Ratio.of(UG_PER_G));
  return ug.num / ug.den;
}
/** «10» or «9,5» → a fraction; null while it is not a percent. */
export function percentOf(text: string): Ratio | null {
  const clean = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  return Ratio.fromDecimal(clean).div(Ratio.of(100n));
}

/** How a bottle reads: «10 % in DPG» (its strength as you know it; the exact figure, in its editor), a name before it when it has one, or with several diluents «… in ethanol 30 % and DPG». */
export function bottleText(data: GlossaryData, d: Dilution): string {
  const name = (id: string) => shortName(data.catalog.materials.get(id));
  const exact = nominalPercent(d.fraction, d.label);
  const diluents =
    d.diluents.length === 0
      ? d.solvent
        ? t.inWords(d.solvent)
        : ""
      : `in ${d.diluents.map((x, i) => (d.diluents.length > 1 && i < d.diluents.length - 1 ? `${name(x.diluentId)} ${percent(x.fraction, 2)}` : name(x.diluentId))).join(" and ")}`;
  // A label that is only its percentage («at 10 %») says less than the exact figure: not repeated (audit F-04).
  const label = d.label && !/^(at |al )?[\d.,]+\s*%$/i.test(d.label.trim()) ? d.label : "";
  return [label, `${exact}${diluents ? ` ${diluents}` : ""}`].filter((x) => x).join(" · ");
}

const diluentsOf = (data: GlossaryData) =>
  [...data.catalog.materials.values()].filter((m) => m.solvent).sort((a, b) => (a.ownerId ? 1 : 0) - (b.ownerId ? 1 : 0) || a.name.localeCompare(b.name, "es"));

/**
 * «Diluciones» (V3-65, V3-67): every bottle of yours, and each one's sheet, where it is made with the
 * calculator and what you weighed. A bottle belongs to its material; this is where they all are.
 */
export function Dilutions({
  data,
  local,
  bottleId,
  newFor,
  onOpen,
  onNew,
  onBack,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  /** One bottle open, from the address. */
  bottleId: string | null;
  /** A new bottle, of this material if one is given («» for none yet). */
  newFor: string | null;
  onOpen: (id: string) => void;
  onNew: (materialId?: string) => void;
  onBack: () => void;
}) {
  const all = useMemo(
    () => [...data.catalog.dilutions.entries()].flatMap(([materialId, list]) => list.map((d) => ({ materialId, d }))),
    [data],
  );
  const found = bottleId ? all.find((x) => x.d.id === bottleId) : undefined;
  // Archiving says so, with Undo (vault pass 2026-10-24, F-03); it stays until closed or undone.
  const [archived, setArchived] = useState<{ id: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const onArchived = (d: Dilution) =>
    setArchived({ id: d.id, text: t.archivedToast(`${data.catalog.materials.get(all.find((x) => x.d.id === d.id)?.materialId ?? "")?.name ?? "—"} (${bottleText(data, d)})`) });
  const unarchive = () => {
    if (!archived) return;
    setArchived(null);
    void archiveBottle(local.db, local.userId, archived.id, false).catch((e: unknown) => setFailure(t.failed(String(e))));
  };
  const editor =
    newFor !== null ? (
      <NewDilution key={`new:${newFor}`} data={data} local={local} materialId={newFor || null} onDone={onOpen} onCancel={onBack} />
    ) : bottleId ? (
      found ? (
        <BottleEditor key={bottleId} data={data} local={local} materialId={found.materialId} bottle={found.d} onDone={() => onBack()} onCancel={onBack} onArchived={onArchived} />
      ) : (
        <p>{texts.glossary.missing}</p>
      )
    ) : (
      <NewDilution key="new:docked" data={data} local={local} materialId={null} onDone={onOpen} onCancel={onBack} />
    );
  // The bottles as a grid, the window docked beside it on a wide screen (V3-79): «New dilution» unless a
  // chip opened a bottle. On a narrow one, the grid; the window when asked for, or a bottle when picked.
  const docked = newFor === null && !bottleId;
  return (
    <div className={`dilutions-page with-editor${docked ? " docked-new" : ""}`}>
      <BottleList
        data={data}
        local={local}
        all={all}
        selected={bottleId}
        onOpen={onOpen}
        onNew={() => onNew()}
        onAnother={(materialId) => onNew(materialId)}
        onArchived={onArchived}
        onFailure={(message) => setFailure(message)}
      />
      {editor && <div className="bottle-pane">{editor}</div>}
      <Toast message={archived?.text ?? null} onUndo={unarchive} onClose={() => setArchived(null)} />
      <FailureNote message={failure} onClose={() => setFailure(null)} floating />
    </div>
  );
}

function BottleList({
  data,
  local,
  all,
  selected,
  onOpen,
  onNew,
  onAnother,
  onArchived,
  onFailure,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  all: { materialId: string; d: Dilution }[];
  selected: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** «Make another like this»: a new bottle of the material, the same diluents and %. */
  onAnother: (materialId: string, bottle: Dilution) => void;
  onArchived: (bottle: Dilution) => void;
  onFailure: (message: string) => void;
}) {
  const scales = useMemo(() => orbScalesOf(data.catalog), [data]);
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const cards = cardsOf(all, { archived, query, nameOf: (id) => data.catalog.materials.get(id)?.name ?? "—", wordsOf: (d) => searchWords(data, d) });
  const count = countOf(cards);
  return (
    <section className="dilutions">
      <div className="title-bar">
        <h2 className="page-title">{t.title}</h2>
        <span className="buttons">
          <Button variant="primary" onClick={onNew}>
            {t.newBottle}
          </Button>
        </span>
      </div>
      {/* The search as a low grey bar, like the glossary's (V3-96, BL-001): the label as its accessible name. */}
      <div className="dil-search">
        <label className="dil-search-field">
          <span className="sr-only">{t.search}</span>
          <svg className="dil-search-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input type="search" value={query} placeholder={t.searchHint} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="dil-search-archived">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          {t.showArchived}
        </label>
        <span className="dil-search-count" role="status">
          {t.count(count.bottles, count.materials)}
        </span>
      </div>
      {all.length === 0 && <EmptyState title={t.empty} text={t.emptyText} />}
      {cards.length > 0 && (
        <BottleTable data={data} local={local} cards={cards} scales={scales} selected={selected} onOpen={onOpen} onAnother={onAnother} onArchived={onArchived} onFailure={onFailure} />
      )}
      {all.length > 0 && cards.length === 0 && <p className="hint">{t.noMatch(query)}</p>}
    </section>
  );
}

const madeText = (day: string | null): string => {
  if (!day) return "—";
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-GB", sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
};

/** A bottle that came made (batch 42, «de fábrica»): said by its name or its note. */
const fromFactory = (d: Dilution) => /f[aá]brica|factory/i.test(`${d.label ?? ""} ${d.description ?? ""}`);

/**
 * «Bottles» as a table (V3-96, BL-002): one row per bottle, grouped by material (its orb and name only
 * on the first). At 640 px of container or less, Material, Strength and Diluent; the row opens below
 * with the rest and what can be done with it (P-LAYOUT-02: less room hides detail, never removes it).
 */
function BottleTable({
  data,
  local,
  cards,
  scales,
  selected,
  onOpen,
  onAnother,
  onArchived,
  onFailure,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  cards: ReturnType<typeof cardsOf>;
  scales: ReturnType<typeof orbScalesOf>;
  selected: string | null;
  onOpen: (id: string) => void;
  onAnother: (materialId: string, bottle: Dilution) => void;
  onArchived: (bottle: Dilution) => void;
  onFailure: (message: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(selected);
  const short = (id: string) => shortName(data.catalog.materials.get(id));
  const full = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const diluentsText = (d: Dilution) => (d.diluents.length > 0 ? d.diluents.map((x) => short(x.diluentId)).join(" + ") : (d.solvent ?? null));
  const diluentsTitle = (d: Dilution) => (d.diluents.length > 0 ? d.diluents.map((x) => full(x.diluentId)).join(" + ") : (d.solvent ?? undefined));
  const archive = (d: Dilution) =>
    void archiveBottle(local.db, local.userId, d.id, !d.archivedAt).then(
      () => {
        if (!d.archivedAt) onArchived(d);
        setOpen(null);
      },
      (e: unknown) => onFailure(t.failed(String(e))),
    );
  return (
    <div className="bottle-table-wrap">
      <table className="bottle-table">
        <thead>
          <tr>
            <th scope="col">{t.table.material}</th>
            <th scope="col">{t.table.strength}</th>
            <th scope="col">{t.table.diluent}</th>
            <th scope="col" className="num wide">
              {t.table.exact}
            </th>
            <th scope="col" className="num wide">
              {t.table.materialWeighed}
            </th>
            <th scope="col" className="wide">
              {t.table.made}
            </th>
            <th scope="col" className="wide">
              <span className="sr-only">{t.table.tags}</span>
            </th>
            <th scope="col">
              <span className="sr-only">{t.table.details}</span>
            </th>
          </tr>
        </thead>
        {cards.map(({ materialId, name, bottles }) => {
          const material = data.catalog.materials.get(materialId);
          const colours = material ? coloursOf(data.catalog, material) : null;
          return (
            <tbody key={materialId} className="bottle-group">
              {bottles.map((d, i) => {
                const expanded = open === d.id;
                const strength = nominalPercent(d.fraction, d.label);
                const diluents = diluentsText(d);
                const tags: string[] = [fromFactory(d) ? t.table.factory : d.materialMassUg === null ? t.table.noWeights : null, d.archivedAt ? t.archived : null].filter((x) => x !== null);
                const toggle = () => setOpen(expanded ? null : d.id);
                return [
                  <tr key={d.id} className={`bottle-row-t${i === 0 ? " first" : ""}${d.archivedAt ? " archived" : ""}`} aria-current={d.id === selected ? "true" : undefined} onClick={toggle}>
                    <td className="mat">
                      {i === 0 ? (
                        <span className="mat-in">
                          {material && <MaterialOrb look={orbLookOf(data.catalog, material, scales)} size={24} seed={seedOf(material.id)} expectColor={colours?.light} />}
                          <span className="bottle-name">{name}</span>
                        </span>
                      ) : (
                        <span className="sr-only">{name}</span>
                      )}
                    </td>
                    <td className="num strength" title={t.chip(percent(d.fraction, 4), diluentsTitle(d) ?? "—")}>
                      {strength}
                    </td>
                    <td title={diluentsTitle(d)}>{diluents ?? <span className="muted">—</span>}</td>
                    <td className="num wide">{percent(d.fraction, 2)}</td>
                    <td className="num wide">{d.materialMassUg !== null ? gramsText(d.materialMassUg) : <span className="muted">—</span>}</td>
                    <td className="wide muted">{madeText(d.madeOn)}</td>
                    <td className="wide">
                      {tags.map((x) => (
                        <span key={x} className="tag">
                          {x}
                        </span>
                      ))}
                    </td>
                    <td className="chev">
                      <button
                        type="button"
                        className="row-toggle"
                        aria-expanded={expanded}
                        aria-label={t.table.toggle(name, strength, diluents ?? "—")}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle();
                        }}
                      >
                        <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
                      </button>
                    </td>
                  </tr>,
                  expanded && (
                    <tr key={`${d.id}:detail`} className="bottle-detail-row">
                      <td colSpan={8}>
                        <dl className="bottle-facts">
                          <div>
                            <dt>{t.table.exact}</dt>
                            <dd className="num">{percent(d.fraction, 4)}</dd>
                          </div>
                          <div>
                            <dt>{t.table.materialWeighed}</dt>
                            <dd className="num">{d.materialMassUg !== null ? `${gramsText(d.materialMassUg)} g` : t.table.notRecorded}</dd>
                          </div>
                          {d.diluents.map((x) => (
                            <div key={x.id}>
                              <dt>{t.table.diluentWeighed(short(x.diluentId))}</dt>
                              <dd className="num">{x.massUg !== null ? `${gramsText(x.massUg)} g` : t.table.notRecorded}</dd>
                            </div>
                          ))}
                          <div>
                            <dt>{t.table.made}</dt>
                            <dd>{madeText(d.madeOn)}</dd>
                          </div>
                          {tags.length > 0 && (
                            <div>
                              <dt>{t.table.tags}</dt>
                              <dd>{tags.join(" · ")}</dd>
                            </div>
                          )}
                          {d.description && (
                            <div className="wide-fact">
                              <dt>{t.note}</dt>
                              <dd>{d.description}</dd>
                            </div>
                          )}
                        </dl>
                        <div className="row-actions">
                          <Button variant="secondary" onClick={() => onOpen(d.id)}>
                            {t.table.correct}
                          </Button>
                          <Button variant="secondary" onClick={() => onAnother(materialId, d)}>
                            {t.table.another}
                          </Button>
                          <Button variant="secondary" onClick={() => archive(d)}>
                            {d.archivedAt ? t.unarchive : t.archive}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

/** What a bottle is found by besides its material (V3-96, BL-001): its diluents, short and whole, and its %. */
export function searchWords(data: GlossaryData, d: Dilution): string {
  const diluents = d.diluents.flatMap((x) => {
    const m = data.catalog.materials.get(x.diluentId);
    return [shortName(m), m?.name ?? ""];
  });
  return [...diluents, d.solvent ?? "", nominalPercent(d.fraction, d.label), percent(d.fraction, 2)].join(" ");
}

/** A chip of the grid: «10 % in DPG», «40 % in DPG + Ethanol» (no chip for pure, V3-79): its strength as you know it, the diluents by their short name. */
export function chipText(data: GlossaryData, d: Dilution): string {
  const name = (id: string) => shortName(data.catalog.materials.get(id));
  const diluents = d.diluents.length > 0 ? d.diluents.map((x) => name(x.diluentId)).join(" + ") : d.solvent;
  const pct = nominalPercent(d.fraction, d.label);
  return diluents ? t.chip(pct, diluents) : pct;
}

/** What a chip says on hover: the exact figure and the diluents' full names. */
export function chipTitle(data: GlossaryData, d: Dilution): string {
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const diluents = d.diluents.length > 0 ? d.diluents.map((x) => name(x.diluentId)).join(" + ") : d.solvent;
  return [t.chip(percent(d.fraction, 4), diluents ?? "—"), d.label, d.madeOn].filter(Boolean).join(" · ");
}

interface Row {
  readonly diluentId: string;
  /** Its share of the bottle in the calculator («30»), or «» for the rest. */
  readonly share: string;
  /** What was weighed («9,033»). */
  readonly grams: string;
}

/** A bottle of yours to correct (V3-67): its weights, its name, date and note, or the archive. A new one is NewDilution (V3-79). */
function BottleEditor({
  data,
  local,
  materialId,
  bottle,
  onDone,
  onCancel,
  onArchived,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  materialId: string;
  bottle: Dilution;
  onDone: (id: string) => void;
  onCancel: () => void;
  /** Said after archiving, with Undo (not after taking a bottle out of the archive). */
  onArchived?: (bottle: Dilution) => void;
}) {
  const diluents = useMemo(() => diluentsOf(data), [data]);
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const [label, setLabel] = useState(bottle?.label ?? "");
  const [sourceId, setSourceId] = useState<string | null>(bottle?.sourceDilutionId ?? null);
  const [target, setTarget] = useState("10");
  const [total, setTotal] = useState("10");
  const [materialGrams, setMaterialGrams] = useState(bottle?.materialMassUg ? gramsText(bottle.materialMassUg) : "");
  const firstDpg = diluents.find((d) => /dpg|dipropilen/i.test(d.name))?.id ?? diluents[0]?.id ?? "";
  const [rows, setRows] = useState<Row[]>(
    bottle && bottle.diluents.length > 0
      ? // Made from another bottle, only what was added is weighed here; a bottle without weights (batch 19) shows its diluents, to weigh again.
        bottle.diluents
          .filter((x) => !bottle.sourceDilutionId || x.massUg !== null)
          .map((x, i, list) => ({
            diluentId: x.diluentId,
            share: i === list.length - 1 ? "" : percent(x.fraction, 2).replace(" %", ""),
            grams: x.massUg !== null ? gramsText(x.massUg) : "",
          }))
      : [{ diluentId: firstDpg, share: "", grams: "" }],
  );
  const [madeOn, setMadeOn] = useState(bottle?.madeOn ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(bottle?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const sources = materialId ? (data.catalog.dilutions.get(materialId) ?? []).filter((d) => d.id !== bottle?.id && d.diluents.length > 0) : [];
  const source = sources.find((d) => d.id === sourceId);
  const sourceBottle = source ? { fraction: source.fraction, diluents: source.diluents.map((d) => ({ diluentId: d.diluentId, fraction: d.fraction })) } : undefined;

  const setRow = (i: number, change: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...change } : r)));
  const calculate = () => {
    setError(null);
    try {
      const want = percentOf(target);
      const amount = gramsOf(total);
      if (!want || !amount) throw new Error(t.resultUnknown);
      const p = plan(
        want,
        amount,
        rows.map((r) => ({ diluentId: r.diluentId, share: r.share.trim() ? percentOf(r.share) : null })),
        sourceBottle,
      );
      setMaterialGrams(gramsText(p.materialUg));
      setRows(rows.map((r) => ({ ...r, grams: gramsText(p.diluents.find((d) => d.diluentId === r.diluentId)?.massUg ?? 0n) })));
      if (!label.trim()) setLabel(`at ${target.trim()} %`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const weighed = (() => {
    const m = gramsOf(materialGrams);
    const ds = rows.map((r) => ({ diluentId: r.diluentId, massUg: gramsOf(r.grams) }));
    if (!m || m <= 0n || ds.some((d) => !d.massUg || d.massUg <= 0n)) return null;
    try {
      return { input: { materialUg: m, diluents: ds as { diluentId: string; massUg: bigint }[] }, bottle: storedBottle(bottleOf({ materialUg: m, diluents: ds as { diluentId: string; massUg: bigint }[], source: sourceBottle })) };
    } catch {
      return null;
    }
  })();

  // Nothing weighed written on a bottle that has its figure: only its name, date and note change.
  const onlyWords = !!bottle && !weighed && !materialGrams.trim() && rows.every((r) => !r.grams.trim());
  const save = () => {
    if (bottle && onlyWords) {
      void describeBottle(local.db, local.userId, bottle.id, { label, madeOn, description: note }).then(
        () => onDone(bottle.id),
        (e: unknown) => setError(t.failed(e instanceof Error ? e.message : String(e))),
      );
      return;
    }
    if (!materialId || !weighed) return;
    const input: BottleInput = { materialId, label, madeOn, description: note, materialUg: weighed.input.materialUg, sourceDilutionId: sourceId, diluents: weighed.input.diluents };
    const done = bottle ? updateBottle(local.db, local.userId, bottle.id, input).then(() => bottle.id) : createBottle(local.db, local.userId, input);
    void done.then(onDone, (e: unknown) => setError(t.failed(e instanceof Error ? e.message : String(e))));
  };

  return (
    <section className="dilutions bottle-editor">
      <div className="title-bar">
        <button type="button" className="link" onClick={onCancel}>
          ← {t.back}
        </button>
        <h2 className="page-title">{bottle ? `${name(materialId ?? "")} · ${bottle.label ?? percent(bottle.fraction, 2)}` : t.newBottle}</h2>
      </div>

      <p>
        {t.material}: <strong>{name(materialId)}</strong>
      </p>

      {materialId && (
        <>
          {bottle && <p className="hint">{t.correctHint}</p>}
          {sources.length > 0 && (
            <label className="field">
              {t.fromBottle}
              <select value={sourceId ?? ""} onChange={(e) => setSourceId(e.target.value || null)}>
                <option value="">{t.fromNothing}</option>
                {sources.map((d) => (
                  <option key={d.id} value={d.id}>
                    {bottleText(data, d)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <fieldset className="calculator">
            <legend>{t.calculator}</legend>
            <p className="hint">{t.calculatorHint}</p>
            <div className="pair">
              <label className="field">
                {t.target}
                <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
              </label>
              <label className="field">
                {t.total}
                <input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
              </label>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="diluent-row">
                <div className="field diluent-field">
                  <span className="field-label">{t.diluent}</span>
                  <DiluentPicker label={t.diluent} diluents={diluents} value={r.diluentId} onChange={(id) => setRow(i, { diluentId: id })} />
                </div>
                <label className="field share">
                  {t.share}
                  <input inputMode="decimal" value={r.share} placeholder={t.rest} onChange={(e) => setRow(i, { share: e.target.value })} />
                </label>
                {rows.length > 1 && (
                  <button type="button" className="link" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                    {t.removeDiluent}
                  </button>
                )}
              </div>
            ))}
            <div className="actions">
              <Button
                variant="secondary"
                onClick={() => setRows([...rows, { diluentId: diluents.find((d) => !rows.some((r) => r.diluentId === d.id))?.id ?? firstDpg, share: "", grams: "" }])}
              >
                {t.addDiluent}
              </Button>
              <Button variant="primary" onClick={calculate}>
                {t.calculate}
              </Button>
            </div>
          </fieldset>

          <fieldset className="weighed">
            <legend>{t.weighed}</legend>
            <p className="hint">{t.weighedHint}</p>
            <label className="field">
              {source ? t.sourceGrams(source.label ?? percent(source.fraction, 2)) : t.materialGrams}
              <input inputMode="decimal" value={materialGrams} onChange={(e) => setMaterialGrams(e.target.value)} />
            </label>
            {rows.map((r, i) => (
              <label key={i} className="field">
                {t.diluentGrams(name(r.diluentId))}
                <input inputMode="decimal" value={r.grams} onChange={(e) => setRow(i, { grams: e.target.value })} />
              </label>
            ))}
            <p className="result" role="status">
              {weighed
                ? t.result(percent(weighed.bottle.fraction, 4), gramsText(weighed.bottle.totalUg))
                : bottle
                  ? t.resultNow(percent(bottle.fraction, 4))
                  : t.resultUnknown}
            </p>
          </fieldset>

          <label className="field">
            {t.label}
            <input value={label} onChange={(e) => setLabel(e.target.value)} />
            <small className="hint">{t.labelHint}</small>
          </label>
          <label className="field">
            {t.madeOn}
            <input type="date" value={madeOn} onChange={(e) => setMadeOn(e.target.value)} />
          </label>
          <label className="field">
            {t.note}
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <Button variant="primary" disabled={!weighed && !onlyWords} onClick={save}>
              {t.save}
            </Button>
            <button type="button" className="secondary" onClick={onCancel}>
              {t.cancel}
            </button>
            {bottle && (
              <Button
                variant="secondary"
                onClick={() =>
                  void archiveBottle(local.db, local.userId, bottle.id, !bottle.archivedAt).then(
                    () => {
                      if (!bottle.archivedAt) onArchived?.(bottle);
                      onCancel();
                    },
                    (e: unknown) => setError(t.failed(String(e))),
                  )
                }
              >
                {bottle.archivedAt ? t.unarchive : t.archive}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/** A material's bottles, on its sheet: links only (V3-67, as V3-64 for the tastings); a new one in a pop-up (V3-79). */
export function MaterialDilutions({ data, local, materialId, onOpen }: { data: GlossaryData; local: LocalDatabase; materialId: string; onOpen: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const newButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    setAdding(false);
    newButton.current?.focus();
  };
  const list = [...(data.catalog.dilutions.get(materialId) ?? [])].sort((a, b) => (a.archivedAt ? 1 : 0) - (b.archivedAt ? 1 : 0) || (b.madeOn ?? "").localeCompare(a.madeOn ?? ""));
  return (
    <section className="sheet-section material-dilutions">
      <h3>{t.sheetTitle}</h3>
      {list.length === 0 && <p className="unknown">{t.sheetNone}</p>}
      {list.length > 0 && (
        <ul>
          {list.map((d) => (
            <li key={d.id}>
              <button type="button" className="link" onClick={() => onOpen(d.id)}>
                {bottleText(data, d)}
              </button>
              {d.archivedAt && <span className="hint"> · {t.archived}</span>}
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" ref={newButton} onClick={() => setAdding(true)}>
        {t.newBottle}
      </Button>
      {adding && <DilutionPopup data={data} local={local} materialId={materialId} onDone={close} onClose={close} />}
    </section>
  );
}
