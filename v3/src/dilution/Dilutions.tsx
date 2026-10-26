import { useMemo, useState } from "react";
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
import { cardsOf } from "./grid";
import { NewDilution } from "./NewDilution";
import "./dilutions.css";

const t = texts.dilutions;
const UG_PER_G = 1_000_000n;

/** Grams as the scale shows them: «1,030». */
export const gramsText = (ug: bigint) => Ratio.of(ug, UG_PER_G).toFixed(3).replace(".", ",");
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

/** How a bottle reads: «al 10 % · 9,97 % en DPG» or with several diluents «… en etanol 30 % y DPG». */
export function bottleText(data: GlossaryData, d: Dilution): string {
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const exact = percent(d.fraction, 4);
  const diluents =
    d.diluents.length === 0
      ? d.solvent
        ? t.inWords(d.solvent)
        : ""
      : `in ${d.diluents.map((x, i) => (d.diluents.length > 1 && i < d.diluents.length - 1 ? `${name(x.diluentId)} ${percent(x.fraction, 2)}` : name(x.diluentId))).join(" and ")}`;
  return [d.label, exact, diluents].filter((x) => x).join(" · ");
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
      <BottleList data={data} all={all} selected={bottleId} onOpen={onOpen} onNew={() => onNew()} />
      {editor && <div className="bottle-pane">{editor}</div>}
      <Toast message={archived?.text ?? null} onUndo={unarchive} onClose={() => setArchived(null)} />
      <FailureNote message={failure} onClose={() => setFailure(null)} floating />
    </div>
  );
}

function BottleList({
  data,
  all,
  selected,
  onOpen,
  onNew,
}: {
  data: GlossaryData;
  all: { materialId: string; d: Dilution }[];
  selected: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const scales = useMemo(() => orbScalesOf(data.catalog), [data]);
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const cards = cardsOf(all, { archived, query, nameOf: (id) => data.catalog.materials.get(id)?.name ?? "—" });
  return (
    <section className="dilutions">
      <div className="title-bar">
        <h2 className="page-title">{t.title}</h2>
        <span className="buttons">
          <button type="button" onClick={onNew}>
            {t.newBottle}
          </button>
        </span>
      </div>
      <div className="tools">
        <label className="search">
          {t.search}
          <input type="search" value={query} placeholder={t.searchHint} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <span className="pills">
          <button type="button" className="pill" aria-pressed={archived} onClick={() => setArchived((a) => !a)}>
            {t.showArchived}
          </button>
        </span>
      </div>
      {all.length === 0 && <p className="hint">{t.empty}</p>}
      <ul className="bottle-grid">
        {cards.map(({ materialId, name, bottles }) => {
          const material = data.catalog.materials.get(materialId);
          const colours = material ? coloursOf(data.catalog, material) : null;
          return (
            <li key={materialId} className="bottle-card">
              <div className="bottle-card-head">
                {material && <MaterialOrb look={orbLookOf(data.catalog, material, scales)} size={40} seed={seedOf(material.id)} expectColor={colours?.light} />}
                <span className="bottle-name">{name}</span>
              </div>
              <span className="bottle-chips">
                {bottles.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`pill bottle-chip${d.archivedAt ? " archived" : ""}`}
                    aria-current={d.id === selected ? "true" : undefined}
                    title={[d.label, d.madeOn, d.archivedAt ? t.archived : null].filter(Boolean).join(" · ")}
                    onClick={() => onOpen(d.id)}
                  >
                    {chipText(data, d)}
                  </button>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A chip of the grid: «10 % in DPG», «40 % in DPG + Ethanol» (no chip for pure, V3-79). */
export function chipText(data: GlossaryData, d: Dilution): string {
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const diluents = d.diluents.length > 0 ? d.diluents.map((x) => name(x.diluentId)).join(" + ") : d.solvent;
  return diluents ? t.chip(percent(d.fraction, 2), diluents) : percent(d.fraction, 2);
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
                <label className="field">
                  {t.diluent}
                  <select value={r.diluentId} onChange={(e) => setRow(i, { diluentId: e.target.value })}>
                    {diluents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
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
              <button
                type="button"
                className="secondary"
                onClick={() => setRows([...rows, { diluentId: diluents.find((d) => !rows.some((r) => r.diluentId === d.id))?.id ?? firstDpg, share: "", grams: "" }])}
              >
                {t.addDiluent}
              </button>
              <button type="button" onClick={calculate}>
                {t.calculate}
              </button>
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
            <button type="button" disabled={!weighed && !onlyWords} onClick={save}>
              {t.save}
            </button>
            <button type="button" className="secondary" onClick={onCancel}>
              {t.cancel}
            </button>
            {bottle && (
              <button
                type="button"
                className="secondary"
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
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/** A material's bottles, on its sheet: links only (V3-67, as V3-64 for the tastings). */
export function MaterialDilutions({ data, materialId, onOpen, onNew }: { data: GlossaryData; materialId: string; onOpen: (id: string) => void; onNew: () => void }) {
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
      <button type="button" onClick={onNew}>
        {t.newBottle}
      </button>
    </section>
  );
}
