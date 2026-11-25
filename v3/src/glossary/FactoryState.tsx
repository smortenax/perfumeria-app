import { type FormEvent, useState } from "react";
import type { CatalogMaterial } from "../db/catalog";
import { archiveBottle, createUnweighedBottle } from "../db/dilutions";
import { factoryBottleOf } from "../db/factory";
import type { LocalDatabase } from "../db/local/database";
import type { GlossaryData } from "../db/useGlossary";
import { percent } from "../format/numbers";
import { percentToFraction } from "../format/percent";
import { Ratio } from "../core/arith/ratio";
import { texts } from "../i18n/en";
import { Button } from "../Button";
import { FailureNote } from "../FailureNote";

const t = texts.editor.factory;

/**
 * «Comes diluted» (the user, 2026-11-25: «al dar de alta el material se de la pureza … y en algun sitio
 * concreto matizar que viene diluido y con que esta diluido»; «lo digo al dar de alta tu frasco»): the
 * state your bottle came in, said once on your version. It is kept as its factory bottle (db/factory.ts,
 * like batch 66), so every dilution and every pour of the material starts from it and keeps the
 * factory diluent. The material stays the pure one; its «Purity» is the grade's (a 98 %), not this.
 */
export function FactoryState({ material, data, local }: { material: CatalogMaterial; data: GlossaryData; local: LocalDatabase }) {
  const bottle = factoryBottleOf(data.catalog, material.id);
  const solvents = [...data.catalog.materials.values()].filter((m) => m.solvent).sort((a, b) => (a.ownerId ? 1 : 0) - (b.ownerId ? 1 : 0) || a.name.localeCompare(b.name, "es"));
  const [editing, setEditing] = useState(false);
  const [pct, setPct] = useState("");
  const [diluentId, setDiluentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const target = percentToFraction(pct.replace(",", "."));
    if (!target || target.sign() <= 0 || target.cmp(Ratio.ONE) >= 0) return setError(t.badPercent);
    if (!diluentId) return setError(t.noDiluent);
    const today = new Date().toISOString().slice(0, 10);
    const pctText = percent(target, 4);
    try {
      await createUnweighedBottle(local.db, local.userId, {
        materialId: material.id,
        target,
        diluents: [{ diluentId, share: null }],
        label: t.label(pctText),
        madeOn: today,
        description: t.description(pctText, name(diluentId), today),
      });
      // The state it came in is one: the one before stays among your bottles, archived.
      if (bottle) await archiveBottle(local.db, local.userId, bottle.id, true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="sheet-section">
      <h3>{t.title}</h3>
      <p className="hint">{t.hint}</p>
      {bottle && !editing && (
        <p>
          {t.state(percent(bottle.fraction, 4), bottle.diluents.map((d) => name(d.diluentId)).join(" + "))}{" "}
          <button type="button" className="link" onClick={() => setEditing(true)}>
            {t.change}
          </button>{" "}
          <button type="button" className="link" onClick={() => void archiveBottle(local.db, local.userId, bottle.id, true).catch((err: unknown) => setError(String(err)))}>
            {t.pure}
          </button>
        </p>
      )}
      {!bottle && !editing && (
        <p>
          {t.none}{" "}
          <button type="button" className="link" onClick={() => setEditing(true)}>
            {t.add}
          </button>
        </p>
      )}
      {editing && (
        <form className="add" onSubmit={(e) => void save(e)}>
          <label>
            {t.percent}
            <input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} />
          </label>
          <label>
            {t.diluent}
            <select value={diluentId} onChange={(e) => setDiluentId(e.target.value)}>
              <option value="">{t.pick}</option>
              {solvents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Button variant="primary" type="submit">
            {t.save}
          </Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            {t.cancel}
          </Button>
        </form>
      )}
      <FailureNote message={error} onClose={() => setError(null)} />
    </section>
  );
}
