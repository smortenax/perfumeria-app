import { type FormEvent, useMemo, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { type Amount, type Authority, type CatalogMaterial, DOSE_BASES, type DoseBasis, type RegulationKind } from "../db/catalog";
import type { LocalDatabase } from "../db/local/database";
import {
  addComponent,
  addDose,
  addRegulation,
  deleteMaterial,
  removeComponent,
  removeDose,
  removeRegulation,
  updateMaterial,
} from "../db/materials";
import { search } from "../db/search";
import { texts } from "../i18n/es";
import { changesOf, EDIT_SECTIONS, type Form, formOf, FormError, numberOf } from "./edit";
import { percent } from "./format";
import type { GlossaryData } from "./useGlossary";

/** The authorities a user writes with: IFRA's word lives in its layer (V3-35). */
const AUTHORITIES_OF_YOURS: readonly Exclude<Authority, "ifra">[] = ["lot", "product", "literature", "consensus"];
const t = texts.editor;

/** What a failed write says, in Spanish: a form's own message, or the repository's next to a general one. */
const messageOf = (error: unknown) => (error instanceof FormError ? error.message : t.failed(error instanceof Error ? error.message : String(error)));
const pctOf = (text: string) => {
  const n = numberOf(text);
  return n === null ? null : n.div(Ratio.of(100));
};

/**
 * The editor of one of your materials (plan v3, step 6.3): its record, its composition, its limits
 * and its doses, written to this browser's copy and synced when there is network (V3-9). The same
 * fields as its sheet (V3-47); every figure with its source.
 */
export function MaterialEditor({ data, local, id, onDone, onDeleted }: { data: GlossaryData; local: LocalDatabase; id: string; onDone: () => void; onDeleted: () => void }) {
  const material = data.catalog.materials.get(id);
  if (!material || material.ownerId === null) return <p>{texts.glossary.missing}</p>;
  return (
    <article className="sheet editor">
      <button type="button" className="link" onClick={onDone}>
        ← {t.toSheet}
      </button>
      <h2>{t.editTitle(material.name)}</h2>
      {material.basedOnId && <p className="hint">{t.versionHint}</p>}
      <RecordForm key={material.id} material={material} local={local} />
      <Composition material={material} data={data} local={local} />
      <Regulations material={material} data={data} local={local} />
      <Doses material={material} local={local} />
      <section className="sheet-section danger">
        <button
          type="button"
          onClick={() => {
            if (!window.confirm(t.confirmDelete(material.name))) return;
            void deleteMaterial(local.db, local.userId, material.id).then(onDeleted, (e: unknown) => window.alert(messageOf(e)));
          }}
        >
          {t.delete}
        </button>
      </section>
    </article>
  );
}

/** The record's fields, in the sheet's sections; saved together. */
function RecordForm({ material, local }: { material: CatalogMaterial; local: LocalDatabase }) {
  const [form, setForm] = useState<Form>(() => formOf(material));
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string }>({ kind: "idle" });
  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setState({ kind: "idle" });
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setState({ kind: "saving" });
    try {
      await updateMaterial(local.db, local.userId, material.id, changesOf(form, material));
      setState({ kind: "saved" });
    } catch (error) {
      setState({ kind: "error", message: messageOf(error) });
    }
  };
  return (
    <form onSubmit={(e) => void save(e)}>
      {EDIT_SECTIONS.map((section) => (
        <fieldset key={section.title} className="sheet-section">
          <legend>{section.title}</legend>
          {section.fields.map((x) => (
            <div key={x.key} className="field">
              <label htmlFor={`f-${x.key}`}>{x.unit ? `${x.label} (${x.unit})` : x.label}</label>
              {x.input === "choice" ? (
                <select id={`f-${x.key}`} value={form[x.key]} onChange={(e) => set(x.key, e.target.value)}>
                  {x.key !== "kind" && <option value="">{texts.sheet.unknown}</option>}
                  {x.options!.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : x.input === "bool" ? (
                <input id={`f-${x.key}`} type="checkbox" checked={form[x.key] === "true"} onChange={(e) => set(x.key, e.target.checked ? "true" : "")} />
              ) : x.input === "evolution" ? (
                <span className="evolution" id={`f-${x.key}`}>
                  {texts.sheet.evolution.map((stretch, i) => (
                    <label key={stretch}>
                      {stretch}
                      <select value={form[`evolution.${i}`]} onChange={(e) => set(`evolution.${i}`, e.target.value)}>
                        <option value="">—</option>
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={String(n)}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </span>
              ) : x.input === "list" || x.input === "long" ? (
                <textarea id={`f-${x.key}`} rows={3} value={form[x.key]} placeholder={x.input === "list" ? t.listHint : ""} onChange={(e) => set(x.key, e.target.value)} />
              ) : (
                <input id={`f-${x.key}`} type="text" inputMode={x.input === "number" || x.input === "percent" ? "decimal" : undefined} value={form[x.key]} onChange={(e) => set(x.key, e.target.value)} />
              )}
            </div>
          ))}
        </fieldset>
      ))}
      <div className="actions">
        <button type="submit" disabled={state.kind === "saving"}>
          {state.kind === "saving" ? t.saving : t.save}
        </button>
        {state.kind === "saved" && <span className="hint">{t.saved}</span>}
        {state.kind === "error" && <span className="error">{state.message}</span>}
      </div>
    </form>
  );
}

/** Who says it and where: the two fields every figure carries. */
function SourceFields({ authority, source, onAuthority, onSource }: { authority: Authority; source: string; onAuthority: (a: Authority) => void; onSource: (s: string) => void }) {
  return (
    <>
      <label>
        {t.authority}
        <select value={authority} onChange={(e) => onAuthority(e.target.value as Authority)}>
          {AUTHORITIES_OF_YOURS.map((a) => (
            <option key={a} value={a}>
              {texts.sheet.authority[a]}
            </option>
          ))}
        </select>
      </label>
      <label className="wide">
        {t.source}
        <input type="text" value={source} placeholder={t.sourceHint} onChange={(e) => onSource(e.target.value)} />
      </label>
    </>
  );
}

const needSource = (source: string) => {
  if (source.trim() === "") throw new FormError(t.sourceRequired);
};

function Composition({ material, data, local }: { material: CatalogMaterial; data: GlossaryData; local: LocalDatabase }) {
  const c = t.composition;
  const [what, setWhat] = useState<"material" | "substance">("substance");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<CatalogMaterial | null>(null);
  const [cas, setCas] = useState("");
  const [name, setName] = useState("");
  const [amountKind, setAmountKind] = useState<Amount["kind"]>("exact");
  const [value, setValue] = useState("");
  const [min, setMin] = useState("");
  const [authority, setAuthority] = useState<Authority>("product");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const found = useMemo(
    () => (query.trim() ? search(data.index, query, 6).flatMap((r) => r.members.map((m) => m.material)).filter((m) => m.id !== material.id).slice(0, 8) : []),
    [data.index, query, material.id],
  );
  const nameOf = (componentId: string | null, componentName: string | null, componentCas: string | null) =>
    componentId ? (data.catalog.materials.get(componentId)?.name ?? componentId) : [componentName, componentCas].filter((x) => x).join(" · ");
  const amountText = (a: Amount) =>
    a.kind === "exact" ? percent(a.value) : a.kind === "max" ? `≤ ${percent(a.value)}` : a.kind === "range" ? `${percent(a.min)} – ${percent(a.max)}` : c.kinds.unknown;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      needSource(source);
      // An empty amount is not zero (§1.2): without a figure, it is «la lleva, sin cifra».
      const needed = (r: Ratio | null) => {
        if (r === null) throw new FormError(t.amountRequired);
        return r;
      };
      const amount: Amount =
        amountKind === "unknown"
          ? { kind: "unknown" }
          : amountKind === "range"
            ? { kind: "range", min: needed(pctOf(min)), max: needed(pctOf(value)) }
            : { kind: amountKind, value: needed(pctOf(value)) };
      if (what === "material" && !picked) throw new FormError(t.pickComponent);
      if (what === "substance" && cas.trim() && !/^\d{2,7}-\d{2}-\d$/.test(cas.trim())) throw new FormError(t.notACas(cas.trim()));
      await addComponent(local.db, local.userId, material.id, what === "material" ? picked!.id : { cas: cas.trim() || null, name }, amount, authority, source);
      setCas("");
      setName("");
      setValue("");
      setMin("");
      setPicked(null);
      setQuery("");
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    }
  };

  return (
    <section className="sheet-section">
      <h3>{c.title}</h3>
      <ul className="editable-rows">
        {material.components.map((x) => (
          <li key={x.id}>
            <span>
              {nameOf(x.componentId, x.componentName, x.componentCas)} · {amountText(x.amount)} · {texts.sheet.authority[x.authority]} · {x.source}
            </span>
            <button type="button" className="link" onClick={() => void removeComponent(local.db, local.userId, x.id).catch((e: unknown) => setError(messageOf(e)))}>
              {t.remove}
            </button>
          </li>
        ))}
      </ul>
      <form className="add" onSubmit={(e) => void add(e)}>
        <label>
          {c.what}
          <select value={what} onChange={(e) => setWhat(e.target.value as "material" | "substance")}>
            <option value="substance">{c.substance}</option>
            <option value="material">{c.material}</option>
          </select>
        </label>
        {what === "substance" ? (
          <>
            <label>
              {c.cas}
              <input type="text" value={cas} onChange={(e) => setCas(e.target.value)} />
            </label>
            <label className="wide">
              {c.name}
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          </>
        ) : (
          <label className="wide">
            {c.find}
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
            {picked && <span className="hint">{c.chosen(picked.name)}</span>}
            <span className="picker">
              {found.map((m) => (
                <button key={m.id} type="button" className="link" onClick={() => setPicked(m)}>
                  {m.name}
                  {m.ownerId !== null ? ` (${texts.glossary.own.toLowerCase()})` : ""}
                </button>
              ))}
            </span>
          </label>
        )}
        <label>
          {c.amount}
          <select value={amountKind} onChange={(e) => setAmountKind(e.target.value as Amount["kind"])}>
            {(["exact", "max", "range", "unknown"] as const).map((k) => (
              <option key={k} value={k}>
                {c.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        {amountKind === "range" && (
          <label>
            {c.min}
            <input type="text" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
          </label>
        )}
        {amountKind !== "unknown" && (
          <label>
            {amountKind === "range" ? c.max : c.value}
            <input type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
        )}
        <SourceFields authority={authority} source={source} onAuthority={setAuthority} onSource={setSource} />
        <button type="submit">{t.add}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}

function Regulations({ material, data, local }: { material: CatalogMaterial; data: GlossaryData; local: LocalDatabase }) {
  const r = t.regulations;
  const [regime, setRegime] = useState<"manufacturer" | "ifra">("manufacturer");
  const [kind, setKind] = useState<RegulationKind>("max");
  const [category, setCategory] = useState("4");
  const [max, setMax] = useState("");
  const [standard, setStandard] = useState("");
  const [requirement, setRequirement] = useState("");
  const [authority, setAuthority] = useState<Authority>("product");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const standards = useMemo(() => [...data.layer.standards.values()].sort((a, b) => a.code.localeCompare(b.code)), [data.layer]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      needSource(source);
      await addRegulation(local.db, local.userId, material.id, {
        regime,
        category: category.trim() || null,
        kind,
        maxValue: kind === "max" ? pctOf(max) : null,
        groupKey: standard.trim() || null,
        requirement: kind === "requirement" ? requirement : null,
        authority,
        source,
      });
      setMax("");
      setRequirement("");
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    }
  };

  return (
    <section className="sheet-section">
      <h3>{r.title}</h3>
      <p className="hint">{r.ifraNote}</p>
      <ul className="editable-rows">
        {material.regulations.map((x) => (
          <li key={x.id}>
            <span>
              {r.regimes[x.regime]} · {x.category ?? texts.sheet.allCategories} ·{" "}
              {x.kind === "max" && x.maxValue ? `${r.kinds.max} ${percent(x.maxValue)}` : x.kind === "requirement" ? (x.requirement ?? "") : r.kinds[x.kind]}
              {x.groupKey ? ` · ${x.groupKey}` : ""} · {texts.sheet.authority[x.authority]} · {x.source}
            </span>
            <button type="button" className="link" onClick={() => void removeRegulation(local.db, local.userId, x.id).catch((e: unknown) => setError(messageOf(e)))}>
              {t.remove}
            </button>
          </li>
        ))}
      </ul>
      <form className="add" onSubmit={(e) => void add(e)}>
        <label className="wide">
          {r.regime}
          <select
            value={regime}
            onChange={(e) => {
              const next = e.target.value as "manufacturer" | "ifra";
              setRegime(next);
              if (next === "ifra") setKind("requirement");
            }}
          >
            <option value="manufacturer">{r.regimes.manufacturer}</option>
            <option value="ifra">{r.regimes.ifra}</option>
          </select>
        </label>
        <label>
          {r.kind}
          <select value={kind} onChange={(e) => setKind(e.target.value as RegulationKind)}>
            {(["max", "prohibited", "requirement"] as const).map((k) => (
              <option key={k} value={k}>
                {r.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {r.category}
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        {kind === "max" && (
          <label>
            {r.max}
            <input type="text" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
        )}
        <label className="wide">
          {r.standard}
          <input type="text" list="ifra-standards" value={standard} onChange={(e) => setStandard(e.target.value)} />
          <datalist id="ifra-standards">
            {standards.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </datalist>
        </label>
        {kind === "requirement" && (
          <label className="wide">
            {r.requirement}
            <input type="text" value={requirement} onChange={(e) => setRequirement(e.target.value)} />
          </label>
        )}
        <SourceFields authority={authority} source={source} onAuthority={setAuthority} onSource={setSource} />
        <button type="submit">{t.add}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}

function Doses({ material, local }: { material: CatalogMaterial; local: LocalDatabase }) {
  const d = t.doses;
  const [min, setMin] = useState("");
  const [typical, setTypical] = useState("");
  const [max, setMax] = useState("");
  const [basis, setBasis] = useState<DoseBasis>("concentrate");
  const [notes, setNotes] = useState("");
  const [authority, setAuthority] = useState<Authority>("literature");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      needSource(source);
      const [a, b, c] = [pctOf(min), pctOf(typical), pctOf(max)];
      if (!a && !b && !c) throw new FormError(d.oneFigure);
      await addDose(local.db, local.userId, material.id, { min: a, typical: b, max: c, basis, authority, source, notes: notes.trim() || null });
      setMin("");
      setTypical("");
      setMax("");
      setNotes("");
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    }
  };
  const show = (r: Ratio | null) => (r ? percent(r) : "—");

  return (
    <section className="sheet-section">
      <h3>{d.title}</h3>
      <ul className="editable-rows">
        {material.doses.map((x) => (
          <li key={x.id}>
            <span>
              {show(x.min)} · {show(x.typical)} · {show(x.max)} · {texts.sheet.basis[x.basis]} · {texts.sheet.authority[x.authority]} · {x.source}
            </span>
            <button type="button" className="link" onClick={() => void removeDose(local.db, local.userId, x.id).catch((e: unknown) => setError(messageOf(e)))}>
              {t.remove}
            </button>
          </li>
        ))}
      </ul>
      <form className="add" onSubmit={(e) => void add(e)}>
        <label>
          {d.min}
          <input type="text" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
        <label>
          {d.typical}
          <input type="text" inputMode="decimal" value={typical} onChange={(e) => setTypical(e.target.value)} />
        </label>
        <label>
          {d.max}
          <input type="text" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
        <label>
          {d.basis}
          <select value={basis} onChange={(e) => setBasis(e.target.value as DoseBasis)}>
            {DOSE_BASES.map((b) => (
              <option key={b} value={b}>
                {texts.sheet.basis[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          {d.notes}
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <SourceFields authority={authority} source={source} onAuthority={setAuthority} onSource={setSource} />
        <button type="submit">{t.add}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}
