import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "../Button";
import { FailureNote } from "../FailureNote";
import { createFormula, updateFormula } from "../db/formulas";
import type { LocalDatabase } from "../db/local/database";
import { loadPlan, replacePlan } from "../db/plans";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { chosenLines, choiceOf, matchPlan } from "../import/plan-match";
import { planFromJson } from "./plan-json";
import { partsText } from "./parts-text";
import "../dilution/dilutions.css";
import "./planner.css";

const t = texts.importPlan;

/**
 * «Import a plan» (V3-100): a perfumeria/plan/1 file becomes the plan of one of your formulas. Each
 * line shows what the file says and the material it found (by id, CAS or name), and you choose where it
 * goes: a new formula with the plan's name, or one of yours, replacing its plan or adding to it. Only
 * «Import» writes, all at once.
 */
export function ImportPlan(props: {
  data: GlossaryData;
  local: LocalDatabase;
  /** Opened from a formula's planner: it is the proposed destination. */
  formulaId?: string;
  /** Opened from a bench in Formulation: a new formula goes there. */
  workbenchId?: string;
  onDone: (formulaId: string) => void;
  onCancel: () => void;
}) {
  const { data, local } = props;
  const [text, setText] = useState("");
  const read = useMemo(() => (text.trim() ? planFromJson(text) : null), [text]);
  const plan = read?.ok ? read.plan : null;
  const matches = useMemo(() => (plan ? matchPlan(plan.lines, data.catalog, data.index, local.userId) : []), [plan, data, local.userId]);
  const [chosen, setChosen] = useState<ReadonlyMap<number, string | null>>(new Map());
  const { lines, repeated } = chosenLines(matches, chosen);

  const here = props.formulaId ? data.formulas.find((f) => f.id === props.formulaId) : undefined;
  const [where, setWhere] = useState<"new" | "existing">(here ? "existing" : "new");
  const [target, setTarget] = useState<string>(here?.id ?? "");
  const [bench, setBench] = useState<string>(props.workbenchId ?? here?.workbenchId ?? data.workbenches[0]?.id ?? "");
  const [name, setName] = useState<string | null>(null);
  const [mode, setMode] = useState<"replace" | "add">("replace");
  const [planned, setPlanned] = useState(0);
  useEffect(() => {
    if (where !== "existing" || !target) return setPlanned(0);
    void loadPlan(local.db, local.userId, target).then((p) => setPlanned(p.length));
  }, [where, target, local]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const ids = { paste: useId(), file: useId(), name: useId(), bench: useId(), which: useId() };

  const load = (next: string) => {
    setText(next);
    setChosen(new Map());
    setName(null);
  };
  const newName = name ?? plan?.name ?? "";
  const ready = plan !== null && lines.length > 0 && !saving && (where === "new" ? newName.trim() !== "" && bench !== "" : target !== "");
  const confirm = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const note = t.note(plan.name ?? "—", plan.source, plan.created);
      let id = target;
      if (where === "new") {
        id = await createFormula(local.db, local.userId, { name: newName.trim(), workbenchId: bench, notes: note });
      } else {
        const notes = data.formulas.find((f) => f.id === target)?.notes.trim() ?? "";
        await updateFormula(local.db, local.userId, target, { notes: notes ? `${notes}\n${note}` : note });
      }
      await replacePlan(
        local.db,
        local.userId,
        id,
        lines.map(({ materialId, match }) => ({ materialId, parts: match.line.parts!, shape: match.line.shape, groupName: match.line.group })),
        where === "new" ? "replace" : planned > 0 ? mode : "replace",
      );
      props.onDone(id);
    } catch (e) {
      setFailure(t.failed(e instanceof Error ? e.message : String(e)));
      setSaving(false);
    }
  };
  const label = (id: string) => {
    const m = data.catalog.materials.get(id);
    return m ? `${m.name}${m.cas ? ` · ${m.cas}` : ""} · ${m.ownerId === null ? t.common : t.yours}` : "—";
  };
  const benchName = (id: string) => data.workbenches.find((w) => w.id === id)?.name ?? "";

  return (
    <section
      className="dilutions import-sheet import-plan"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void e.dataTransfer.files[0]?.text().then(load);
      }}
    >
      <div className="title-bar">
        <h2 className="page-title">{t.title}</h2>
        <span className="buttons">
          <Button variant="secondary" onClick={props.onCancel}>
            {t.cancel}
          </Button>
        </span>
      </div>
      <p className="hint">{t.hint}</p>
      <label className="field" htmlFor={ids.file}>
        {t.file} <span className="hint">{t.drop}</span>
      </label>
      <input id={ids.file} type="file" accept=".json,application/json" onChange={(e) => void e.target.files?.[0]?.text().then(load)} />
      <label className="field" htmlFor={ids.paste}>
        {t.paste}
      </label>
      <textarea id={ids.paste} rows={4} value={text} onChange={(e) => load(e.target.value)} spellCheck={false} />

      {read && !read.ok && (
        <p className="planner-error" role="alert">
          {read.problem === "unknown-format" ? t.unknownFormat(read.format ?? "") : t.refused[read.problem]}
        </p>
      )}

      {plan && (
        <>
          <p className="hint">
            {[plan.name ? t.fromFile(plan.name) : null, plan.created ? t.created(plan.created) : null, plan.source].filter((x) => x).join(" · ")}
          </p>
          <p className="hint" role="status">
            {t.count(plan.lines.length, lines.length)}
          </p>
          <div className="import-plan-table">
            <table className="import-list">
              <thead>
                <tr>
                  <th scope="col">{t.line}</th>
                  <th scope="col">{t.fileSays}</th>
                  <th scope="col" className="num">
                    {t.parts}
                  </th>
                  <th scope="col">{t.found}</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const value = choiceOf(m, chosen);
                  const off = value === null || repeated.includes(m.line.index);
                  return (
                    <tr key={m.line.index} className={off ? "import-off" : undefined}>
                      <td className="num">{m.line.index}</td>
                      <td>
                        <strong>{m.line.material || "—"}</strong>
                        <span className="hint">
                          {" "}
                          {[m.line.cas, m.line.group, m.line.shape ? `${t.shape}: ${texts.planner.shapes[m.line.shape]}` : null].filter((x) => x).join(" · ")}
                        </span>
                        {m.line.problem && <span className="hint import-problem"> · {t.problem[m.line.problem]}</span>}
                      </td>
                      <td className="num">{m.line.parts ? partsText(m.line.parts) : "—"}</td>
                      <td>
                        <span className={`status-chip import-${m.status === "invalid" ? "missing" : m.status}`}>{t.status[m.status]}</span>
                        {m.by && <span className="hint"> {t.by[m.by]}</span>}
                        {m.candidates.length > 0 && (
                          <select
                            aria-label={`${t.found}, ${t.line.toLowerCase()} ${m.line.index}`}
                            value={value ?? ""}
                            onChange={(e) => setChosen(new Map(chosen).set(m.line.index, e.target.value || null))}
                          >
                            <option value="">{t.skip}</option>
                            {m.candidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {label(c.id)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {repeated.length > 0 && <p className="hint import-problem">{t.repeated(repeated.join(", "))}</p>}
          {matches.some((m) => m.status === "missing") && <p className="hint">{t.missingNote}</p>}

          <fieldset className="import-plan-where">
            <legend>{t.destination}</legend>
            <label className="check">
              <input type="radio" name="plan-where" checked={where === "new"} onChange={() => setWhere("new")} /> {t.toNew}
            </label>
            {where === "new" && (
              <div className="pair">
                <label className="field" htmlFor={ids.name}>
                  {t.newName}
                  <input id={ids.name} value={newName} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="field" htmlFor={ids.bench}>
                  {t.inBench}
                  <select id={ids.bench} value={bench} onChange={(e) => setBench(e.target.value)}>
                    {data.workbenches.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label className="check">
              <input type="radio" name="plan-where" checked={where === "existing"} onChange={() => setWhere("existing")} /> {t.toExisting}
            </label>
            {where === "existing" && (
              <>
                <label className="field" htmlFor={ids.which}>
                  {t.which}
                  <select id={ids.which} value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="">—</option>
                    {[...data.formulas]
                      .sort((a, b) => benchName(a.workbenchId).localeCompare(benchName(b.workbenchId), "es") || a.name.localeCompare(b.name, "es"))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} · {benchName(f.workbenchId)}
                        </option>
                      ))}
                  </select>
                </label>
                {planned > 0 && (
                  <div className="import-plan-mode">
                    <p className="hint">{t.hasPlan(planned)}</p>
                    <label className="check">
                      <input type="radio" name="plan-mode" checked={mode === "replace"} onChange={() => setMode("replace")} /> {t.replace} <span className="hint">· {t.replaceHelp}</span>
                    </label>
                    <label className="check">
                      <input type="radio" name="plan-mode" checked={mode === "add"} onChange={() => setMode("add")} /> {t.add} <span className="hint">· {t.addHelp}</span>
                    </label>
                  </div>
                )}
              </>
            )}
          </fieldset>
          <div className="actions">
            <Button variant="primary" disabled={!ready} onClick={() => void confirm()}>
              {saving ? t.saving : t.confirm}
            </Button>
          </div>
        </>
      )}
      <FailureNote message={failure} onClose={() => setFailure(null)} floating />
    </section>
  );
}
