import { useMemo, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { createBottle, createUnweighedBottle } from "../db/dilutions";
import type { LocalDatabase } from "../db/local/database";
import { percent } from "../glossary/format";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { gramsToUg, percentToFraction, windowState, type WindowRow } from "./window";
import "./dilutions.css";

const t = texts.dilutions;
const w = t.window;
const UG_PER_G = 1_000_000n;
const grams = (ug: bigint) => Ratio.of(ug, UG_PER_G).toFixed(3);

/**
 * «New dilution» (V3-79): one window for the four ways — a bottle you already have (no weights), from
 * the material weighed, from another bottle and from the total. Docked on «Dilutions», a pop-up
 * elsewhere: it only takes the material to start with and says when it is done.
 */
export function NewDilution({
  data,
  local,
  materialId: initialMaterial,
  onDone,
  onCancel,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  materialId: string | null;
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const diluents = useMemo(
    () => [...data.catalog.materials.values()].filter((m) => m.solvent).sort((a, b) => (a.ownerId ? 1 : 0) - (b.ownerId ? 1 : 0) || a.name.localeCompare(b.name, "es")),
    [data],
  );
  const materials = useMemo(
    () => [...data.catalog.materials.values()].filter((m) => m.ownerId !== null && !m.solvent).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [data],
  );
  const firstDpg = diluents.find((d) => /dpg|dipropylene|dipropilen/i.test(d.name))?.id ?? diluents[0]?.id ?? "";

  const [materialId, setMaterialId] = useState<string | null>(initialMaterial);
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [target, setTarget] = useState("10");
  const [rows, setRows] = useState<WindowRow[]>([{ diluentId: firstDpg, share: "", weighed: "" }]);
  const [drive, setDrive] = useState<"material" | "total" | null>(null);
  const [materialGrams, setMaterialGrams] = useState("");
  const [totalGrams, setTotalGrams] = useState("");
  const [weighedMaterial, setWeighedMaterial] = useState("");
  const [label, setLabel] = useState("");
  const [madeOn, setMadeOn] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sources = materialId ? (data.catalog.dilutions.get(materialId) ?? []).filter((d) => !d.archivedAt && d.diluents.length > 0) : [];
  const source = sources.find((d) => d.id === sourceId);
  const sourceBottle = source ? { fraction: source.fraction, diluents: source.diluents.map((d) => ({ diluentId: d.diluentId, fraction: d.fraction })) } : undefined;
  const state = windowState({ target, source: sourceBottle, rows, drive, materialGrams, totalGrams, weighedMaterial });
  const sourceName = source ? percent(source.fraction, 2) : null;

  const setRow = (i: number, change: Partial<WindowRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...change } : r)));
  const diluentList = (list: readonly { diluentId: string; massUg: bigint }[]) => list.map((d) => w.diluentGrams(grams(d.massUg), name(d.diluentId))).join(" + ");

  const common = () => ({ materialId: materialId!, label: label.trim() || `at ${target.trim()} %`, madeOn, description: note, sourceDilutionId: sourceId });
  const finish = (saving: Promise<string>) => void saving.then(onDone, (e: unknown) => setError(t.failed(e instanceof Error ? e.message : String(e))));
  const saveUnweighed = () =>
    finish(
      createUnweighedBottle(local.db, local.userId, {
        ...common(),
        target: percentToFraction(target)!,
        diluents: rows.map((r) => ({ diluentId: r.diluentId, share: r.share.trim() ? percentToFraction(r.share) : null })),
      }),
    );
  const saveWeighed = () =>
    finish(
      createBottle(local.db, local.userId, {
        ...common(),
        materialUg: gramsToUg(weighedMaterial)!,
        diluents: rows.map((r) => ({ diluentId: r.diluentId, massUg: gramsToUg(r.weighed)! })),
      }),
    );

  return (
    <section className="dilutions new-dilution" aria-label={t.newBottle}>
      <div className="title-bar">
        <h2 className="page-title">{t.newBottle}</h2>
        <button type="button" className="link" onClick={onCancel}>
          {t.cancel}
        </button>
      </div>

      {materialId ? (
        <p className="nd-material">
          {t.material}: <strong>{name(materialId)}</strong>{" "}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMaterialId(null);
              setSourceId(null);
            }}
          >
            {t.change}
          </button>
        </p>
      ) : (
        <div className="field">
          <label className="field">
            {t.material}
            <input type="search" value={query} placeholder={t.pickMaterial} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="pick-list">
            {materials
              .filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
              .slice(0, 30)
              .map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setMaterialId(m.id)}>
                    {m.name}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {materialId && (
        <>
          <div className="field nd-from" role="group" aria-label={w.from}>
            <span className="nd-label">{w.from}</span>
            <span className="pills">
              <button type="button" className="pill" aria-pressed={!sourceId} onClick={() => setSourceId(null)}>
                {w.pure}
              </button>
              {sources.map((d) => (
                <button key={d.id} type="button" className="pill" aria-pressed={sourceId === d.id} title={d.label ?? undefined} onClick={() => setSourceId(d.id)}>
                  {percent(d.fraction, 2)}
                </button>
              ))}
            </span>
          </div>

          <label className="field nd-target">
            {t.target}
            <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>

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
              {rows.length > 1 && (
                <label className="field share">
                  {t.share}
                  <input inputMode="decimal" value={r.share} placeholder={t.rest} onChange={(e) => setRow(i, { share: e.target.value })} />
                </label>
              )}
              {rows.length > 1 && (
                <button type="button" className="link" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  {t.removeDiluent}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="secondary nd-add-diluent"
            onClick={() => setRows([...rows, { diluentId: diluents.find((d) => !rows.some((r) => r.diluentId === d.id))?.id ?? firstDpg, share: "", weighed: "" }])}
          >
            + {t.diluent}
          </button>

          {state.examples.length > 0 && (
            <ul className="nd-examples" aria-label={w.examples}>
              {state.examples.map((e) => (
                <li key={e.totalUg.toString()}>{w.example(grams(e.totalUg), grams(e.plan.materialUg), diluentList(e.plan.diluents))}</li>
              ))}
            </ul>
          )}

          <div className="nd-amounts">
            <label className="field">
              {sourceName ? w.sourceWeighed(sourceName) : w.materialWeighed}
              <input
                inputMode="decimal"
                value={drive === "total" && state.plan ? grams(state.plan.materialUg) : materialGrams}
                onChange={(e) => {
                  setDrive("material");
                  setMaterialGrams(e.target.value);
                }}
              />
            </label>
            <span className="nd-or">{w.orTotal}</span>
            <label className="field">
              {w.totalWanted}
              <input
                inputMode="decimal"
                value={drive === "material" && state.plan ? grams(state.plan.totalUg) : totalGrams}
                onChange={(e) => {
                  setDrive("total");
                  setTotalGrams(e.target.value);
                }}
              />
            </label>
          </div>
          {state.plan && (
            <p className="nd-plan" role="status">
              {drive === "material" ? w.add(diluentList(state.plan.diluents)) : w.weigh(`${grams(state.plan.materialUg)} g ${sourceName ?? name(materialId)} + ${diluentList(state.plan.diluents)}`)}
            </p>
          )}

          <fieldset className="weighed">
            <legend>{w.weighedReally}</legend>
            <p className="hint">{w.weighedReallyHint}</p>
            <div className="nd-weights">
              <label className="field">
                {sourceName ? w.sourceWeighed(sourceName) : t.materialGrams}
                <input inputMode="decimal" value={weighedMaterial} onChange={(e) => setWeighedMaterial(e.target.value)} />
              </label>
              {rows.map((r, i) => (
                <label key={i} className="field">
                  {t.diluentGrams(name(r.diluentId))}
                  <input inputMode="decimal" value={r.weighed} onChange={(e) => setRow(i, { weighed: e.target.value })} />
                </label>
              ))}
            </div>
            {state.weighed && (
              <p className="result" role="status">
                {w.exactNow(percent(state.weighed.fraction, 4), grams(state.weighed.totalUg))}
              </p>
            )}
          </fieldset>

          <label className="field">
            {t.label}
            <input value={label} placeholder={`at ${target.trim()} %`} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <div className="pair">
            <label className="field">
              {t.madeOn}
              <input type="date" value={madeOn} onChange={(e) => setMadeOn(e.target.value)} />
            </label>
            <label className="field">
              {t.note}
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>

          {state.problem && <p className="error">{w.problem[state.problem]}</p>}
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button type="button" className="secondary" disabled={!state.aimed} onClick={saveUnweighed}>
              {w.saveUnweighed}
            </button>
            <button type="button" disabled={!state.weighed} onClick={saveWeighed}>
              {w.saveWeighed}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
