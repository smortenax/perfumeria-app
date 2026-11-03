import { useMemo, useState } from "react";
import { createBottle, createUnweighedBottle } from "../db/dilutions";
import type { LocalDatabase } from "../db/local/database";
import { percent } from "../glossary/format";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { gramsText, gramsToUg, percentToFraction, saveKind, weighedFromPlan, windowState, type WindowMode, type WindowRow } from "./window";
import "./dilutions.css";
import { Button } from "../Button";
import { DiluentPicker } from "./DiluentPicker";
import { MaterialPicker } from "../MaterialPicker";

const t = texts.dilutions;
const w = t.window;
const grams = gramsText;

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
  // A bottle you have is the usual case (audit F-03): it comes first.
  const [mode, setMode] = useState<WindowMode>("have");
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
  const saving = saveKind(mode, state);

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
      {/* The title on the left, «Cancel» a button to press (audit F-12). */}
      <div className="title-bar">
        <h2 className="page-title">{t.newBottle}</h2>
        <span className="buttons">
          <Button variant="secondary" onClick={onCancel}>
            {t.cancel}
          </Button>
        </span>
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
          <MaterialPicker label={t.material} placeholder={t.pickMaterial} options={materials} onPick={setMaterialId} />
        </div>
      )}

      {materialId && (
        <>
          <div className="field nd-mode" role="group" aria-label={w.modeLabel}>
            <span className="pills">
              {(["have", "calculate"] as const).map((m) => (
                <button key={m} type="button" className="pill" aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {w.modes[m]}
                </button>
              ))}
            </span>
          </div>
          {mode === "have" && <p className="hint">{w.haveHint}</p>}
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
            {mode === "have" ? w.haveTarget : t.target}
            <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>

          {rows.map((r, i) => (
            <div key={i} className="diluent-row">
              <div className="field diluent-field">
                <span className="field-label">{t.diluent}</span>
                <DiluentPicker label={t.diluent} diluents={diluents} value={r.diluentId} onChange={(id) => setRow(i, { diluentId: id })} />
              </div>
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

          {mode === "calculate" && state.examples.length > 0 && (
            <ul className="nd-examples" aria-label={w.examples}>
              {state.examples.map((e) => (
                <li key={e.totalUg.toString()}>{w.example(grams(e.totalUg), grams(e.plan.materialUg), diluentList(e.plan.diluents))}</li>
              ))}
            </ul>
          )}

          {mode === "calculate" && (
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
          )}
          {mode === "calculate" && state.plan && (
            <div className="nd-plan-row">
              <p className="nd-plan" role="status">
                {drive === "material" ? w.add(diluentList(state.plan.diluents)) : w.weigh(`${grams(state.plan.materialUg)} g ${sourceName ?? name(materialId)} + ${diluentList(state.plan.diluents)}`)}
              </p>
              <Button
                variant="secondary"
                title={w.fillWeighedHint}
                onClick={() => {
                  const filled = weighedFromPlan(state.plan!, rows);
                  setWeighedMaterial(filled.material);
                  setRows(filled.rows);
                }}
              >
                {w.fillWeighed}
              </Button>
            </div>
          )}

          {/* A bottle you have: its weights folded, optional; one to calculate: in view. */}
          <details className="weighed" open={mode === "calculate" || undefined}>
            <summary>{mode === "have" ? w.refine : w.weighedReally}</summary>
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
          </details>

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
            {mode === "calculate" && (
              <Button variant="secondary" disabled={!state.aimed} onClick={saveUnweighed}>
                {w.saveUnweighed}
              </Button>
            )}
            <Button variant="primary" disabled={saving === null} onClick={saving === "weighed" ? saveWeighed : saveUnweighed}>
              {mode === "have" ? w.save : w.saveWeighed}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
