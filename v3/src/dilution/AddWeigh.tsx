import { useEffect, useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import type { Dilution } from "../db/catalog";
import { createBottle, createUnweighedBottle } from "../db/dilutions";
import type { LocalDatabase } from "../db/local/database";
import { coloursOf } from "../families/palette";
import { percent } from "../glossary/format";
import { orbLookOf, orbScalesOf, seedOf } from "../glossary/orb/fromCatalog";
import { MaterialOrb } from "../glossary/orb/MaterialOrb";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { MaterialPicker } from "../MaterialPicker";
import { Button } from "../Button";
import type { SourceBottle } from "./calc";
import { nominalPercent, shortName } from "./grid";
import { gramsText, gramsToUg, percentToFraction } from "./window";
import { labelOf, rowState, shareText, stillToPour, tally, type RowState, type WeighDiluent, type WeighRow } from "./weigh";

const t = texts.dilutions.weigh;

let seq = 0;
export const newKey = () => `w${Date.now().toString(36)}${(seq++).toString(36)}`;

/** A bottle as calc.ts reads it when another is made from it. */
const sourceOf = (d: Dilution | undefined): SourceBottle | undefined =>
  d && d.diluents.length > 0 ? { fraction: d.fraction, diluents: d.diluents.map((x) => ({ diluentId: x.diluentId, fraction: x.fraction })) } : undefined;

/** The bottles a row can be made from: the material's own, not archived, that say their diluents. */
const sourcesOf = (data: GlossaryData, materialId: string) => (data.catalog.dilutions.get(materialId) ?? []).filter((d) => !d.archivedAt && d.diluents.length > 0);

/**
 * A new row for a material (V3-96): with the last diluent you used for it, if it has bottles. «Make
 * another like this» passes the bottle: its %, its diluents and their shares of what was added.
 */
export function rowFor(data: GlossaryData, materialId: string, like?: Dilution): WeighRow {
  const bottles = [...(data.catalog.dilutions.get(materialId) ?? [])].filter((d) => d.diluents.length > 0).sort((a, b) => (b.madeOn ?? "").localeCompare(a.madeOn ?? ""));
  const model = like ?? bottles[0];
  const added = model ? Ratio.ONE.sub(model.fraction) : Ratio.ONE;
  const diluents: WeighDiluent[] =
    model && model.diluents.length > 0
      ? (like ? model.diluents : model.diluents.slice(-1)).map((x, i, list) => ({
          diluentId: x.diluentId,
          share: list.length > 1 && i < list.length - 1 && added.sign() > 0 ? shareText(x.fraction.div(added)) : "",
          weighed: "",
        }))
      : [{ diluentId: "", share: "", weighed: "" }];
  return {
    key: newKey(),
    materialId,
    sourceId: null,
    target: like ? nominalPercent(like.fraction, like.label).replace(" %", "") : "",
    total: "",
    weighed: "",
    diluents,
    note: "",
  };
}

/**
 * «Add & weigh» (V3-96, BL-003): several bottles at once, on the Dilutions screen itself. Each row in the
 * user's layout D: name and «⋯»; the % and the grams wanted; a line per diluent (its % of what is added
 * on its left when there are two or more); the scale, with what to put in grey; the real result; a thin
 * bar of material against diluents. One save for every row that can be saved.
 */
export function AddWeigh({
  data,
  local,
  rows,
  setRows,
  madeOn,
  setMadeOn,
  onSaved,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  rows: readonly WeighRow[];
  setRows: (change: (rows: readonly WeighRow[]) => readonly WeighRow[]) => void;
  /** The date of the session's bottles: today, changeable above. */
  madeOn: string;
  setMadeOn: (day: string) => void;
  onSaved: (count: number) => void;
}) {
  const scales = useMemo(() => orbScalesOf(data.catalog), [data]);
  const diluents = useMemo(
    () => [...data.catalog.materials.values()].filter((m) => m.solvent).sort((a, b) => (a.ownerId ? 1 : 0) - (b.ownerId ? 1 : 0) || a.name.localeCompare(b.name, "es")),
    [data],
  );
  const materials = useMemo(() => [...data.catalog.materials.values()].filter((m) => m.ownerId !== null && !m.solvent).sort((a, b) => a.name.localeCompare(b.name, "es")), [data]);
  const bottleById = useMemo(() => new Map([...data.catalog.dilutions.values()].flat().map((d) => [d.id, d])), [data]);
  const [menu, setMenu] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map());

  const states = rows.map((row) => ({ row, state: rowState(row, sourceOf(row.sourceId ? bottleById.get(row.sourceId) : undefined)) }));
  const count = tally(states.map((s) => s.state));
  const saveable = states.filter((s) => s.state.status !== "waiting");
  const pour = stillToPour(states);
  const short = (id: string) => shortName(data.catalog.materials.get(id));
  const nameOf = (id: string) => data.catalog.materials.get(id)?.name ?? "—";

  const change = (key: string, update: (row: WeighRow) => WeighRow) => setRows((list) => list.map((r) => (r.key === key ? update(r) : r)));
  const setDiluent = (key: string, i: number, patch: Partial<WeighDiluent>) => change(key, (r) => ({ ...r, diluents: r.diluents.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));

  const save = async () => {
    setSaving(true);
    const failed = new Map<string, string>();
    const saved: string[] = [];
    for (const { row, state } of saveable) {
      const common = { materialId: row.materialId, label: labelOf(row.target), madeOn, description: row.note, sourceDilutionId: row.sourceId };
      try {
        if (state.status === "weighed") {
          await createBottle(local.db, local.userId, {
            ...common,
            materialUg: gramsToUg(row.weighed)!,
            diluents: row.diluents.map((d) => ({ diluentId: d.diluentId, massUg: gramsToUg(d.weighed)! })),
          });
        } else {
          await createUnweighedBottle(local.db, local.userId, { ...common, target: percentToFraction(row.target)!, diluents: state.planned! });
        }
        saved.push(row.key);
      } catch (e) {
        failed.set(row.key, texts.dilutions.failed(e instanceof Error ? e.message : String(e)));
      }
    }
    setRows((list) => list.filter((r) => !saved.includes(r.key)));
    setErrors(failed);
    setSaving(false);
    if (saved.length > 0) onSaved(saved.length);
  };

  return (
    <section className="weigh" aria-label={t.title}>
      <div className="weigh-intro">
        <h3 className="weigh-title">{t.title}</h3>
        <label className="weigh-date">
          {t.madeOn}
          <input type="date" value={madeOn} onChange={(e) => setMadeOn(e.target.value)} />
        </label>
      </div>
      <p className="weigh-hint">{t.hint}</p>
      <div className="weigh-sheet">
        <div className="weigh-head" aria-hidden="true">
          <span>{t.head.material}</span>
          <span>
            {t.head.want}
            <small>{t.head.wantSub}</small>
          </span>
          <span className="r">
            {t.head.scale}
            <small>{t.head.scaleSub}</small>
          </span>
          <span className="r">
            {t.head.result}
            <small>{t.head.resultSub}</small>
          </span>
        </div>
        <ol className="weigh-rows">
          {states.map(({ row, state }) => (
            <WeighLine
              key={row.key}
              data={data}
              row={row}
              state={state}
              scales={scales}
              diluents={diluents}
              sources={sourcesOf(data, row.materialId)}
              menuOpen={menu === row.key}
              onMenu={(open) => setMenu(open ? row.key : null)}
              noteOpen={noteFor === row.key || !!row.note}
              onNote={() => setNoteFor(row.key)}
              error={errors.get(row.key) ?? null}
              change={(update) => change(row.key, update)}
              setDiluent={(i, patch) => setDiluent(row.key, i, patch)}
              remove={() => setRows((list) => list.filter((r) => r.key !== row.key))}
              short={short}
              nameOf={nameOf}
            />
          ))}
          <li className="weigh-add">
            <span className="weigh-add-plus" aria-hidden="true">
              +
            </span>
            <MaterialPicker
              key={pickerKey}
              label={t.add}
              placeholder={t.add}
              options={materials}
              quietWhenEmpty
              hideLabel
              limit={8}
              onPick={(id) => {
                setRows((list) => [...list, rowFor(data, id)]);
                setPickerKey((k) => k + 1);
              }}
            />
          </li>
        </ol>
      </div>
      {rows.length > 0 && (
        <footer className="weigh-foot">
          {pour.size > 0 && (
            <p className="weigh-pour">
              {t.stillToPour}{" "}
              {[...pour].map(([id, ug], i) => (
                <span key={id}>
                  {i > 0 && " · "}
                  {short(id)} <strong className="fig">{gramsText(ug)} g</strong>
                </span>
              ))}
            </p>
          )}
          <ul className="weigh-legend" aria-label={t.legendLabel}>
            <li className="weighed">{t.legend.weighed}</li>
            <li className="asIs">{t.legend.asIs}</li>
            <li className="waiting">{t.legend.waiting}</li>
          </ul>
          <div className="weigh-actions">
            <p className="weigh-tally" role="status">
              {t.tally(count.rows, count.weighed, count.asIs, count.waiting)}
            </p>
            <button type="button" className="link" onClick={() => setRows(() => [])}>
              {t.clearAll}
            </button>
            <Button variant="primary" disabled={saving || saveable.length === 0} onClick={() => void save()}>
              {t.save(saveable.length)}
            </Button>
          </div>
          <p className="weigh-hint">{t.saveHint}</p>
        </footer>
      )}
    </section>
  );
}

function WeighLine({
  data,
  row,
  state,
  scales,
  diluents,
  sources,
  menuOpen,
  onMenu,
  noteOpen,
  onNote,
  error,
  change,
  setDiluent,
  remove,
  short,
  nameOf,
}: {
  data: GlossaryData;
  row: WeighRow;
  state: RowState;
  scales: ReturnType<typeof orbScalesOf>;
  diluents: readonly { readonly id: string; readonly name: string; readonly abbreviation: string | null }[];
  sources: readonly Dilution[];
  menuOpen: boolean;
  onMenu: (open: boolean) => void;
  noteOpen: boolean;
  onNote: () => void;
  error: string | null;
  change: (update: (row: WeighRow) => WeighRow) => void;
  setDiluent: (i: number, patch: Partial<WeighDiluent>) => void;
  remove: () => void;
  short: (id: string) => string;
  nameOf: (id: string) => string;
}) {
  const material = data.catalog.materials.get(row.materialId);
  const colours = material ? coloursOf(data.catalog, material) : null;
  const name = nameOf(row.materialId);
  const many = row.diluents.length > 1;
  const showFrom = row.sourceId !== null;
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    menuList.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const away = (e: MouseEvent) => {
      if (!menuList.current?.contains(e.target as Node) && e.target !== menuButton.current) onMenu(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [menuOpen, onMenu]);
  const closeMenu = () => {
    onMenu(false);
    menuButton.current?.focus();
  };
  const act = (what: () => void) => () => {
    what();
    closeMenu();
  };

  const words = state.status === "weighed" ? t.state.weighed : state.status === "asIs" ? t.state.asIs : t.state.waiting;
  const why = state.need ? t.need[state.need] : null;
  const g = (ug: bigint | null) => (ug === null ? null : gramsText(ug));
  const goalMaterial = g(state.goal.materialUg);
  const totalUg = gramsToUg(row.total);

  const scaleBox = (value: string, goal: string | null, aria: string, onChange: (v: string) => void, who: string) => (
    <span className="weigh-scale">
      {value.trim() && goal && (
        <span className="weigh-goal" aria-hidden="true">
          {goal}
        </span>
      )}
      <input
        className={`weigh-cell n${value.trim() ? "" : " to-put"}`}
        inputMode="decimal"
        value={value}
        placeholder={goal ?? "g"}
        aria-label={goal ? t.aria.scaleWithGoal(aria, goal) : aria}
        aria-describedby={undefined}
        title={who}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );

  return (
    <li className={`weigh-row ${state.status}`} aria-label={name}>
      <div className="weigh-grid">
        {/* Line 1: the name, the % and grams wanted, the material on the scale, the real %. */}
        <div className="weigh-mat">
          {material && <MaterialOrb look={orbLookOf(data.catalog, material, scales)} size={24} seed={seedOf(material.id)} expectColor={colours?.light} />}
          <span className="weigh-name">
            <span className="bottle-name">{name}</span>
            {showFrom && (
              <select className="weigh-from" aria-label={t.aria.from(name)} value={row.sourceId ?? ""} onChange={(e) => change((r) => ({ ...r, sourceId: e.target.value || null }))}>
                <option value="">{t.pure}</option>
                {sources.map((d) => (
                  <option key={d.id} value={d.id}>
                    {t.fromBottle(nominalPercent(d.fraction, d.label), d.diluents.map((x) => short(x.diluentId)).join(" + "))}
                  </option>
                ))}
              </select>
            )}
          </span>
        </div>
        <div className="weigh-want">
          <span className="weigh-unit" data-unit="%">
            <input className="weigh-cell n" inputMode="decimal" value={row.target} placeholder="%" aria-label={t.aria.target(name)} onChange={(e) => change((r) => ({ ...r, target: e.target.value }))} />
          </span>
          <span className="weigh-unit" data-unit="g">
            <input className="weigh-cell n" inputMode="decimal" value={row.total} placeholder={t.optional} aria-label={t.aria.total(name)} onChange={(e) => change((r) => ({ ...r, total: e.target.value }))} />
          </span>
        </div>
        {scaleBox(row.weighed, goalMaterial, t.aria.materialWeighed(name), (v) => change((r) => ({ ...r, weighed: v })), showFrom ? t.fromTheBottle : t.head.material)}
        <div className="weigh-result r" title={state.diff ? t.diff(percent(state.diff, 2)) : (why ?? undefined)}>
          {state.real ? <strong className="fig">{state.real.fraction.mul(Ratio.of(100n)).toFixed(2)} %</strong> : <span className={`weigh-state ${state.status}`}>{words}</span>}
        </div>

        {/* Line 2 on: «⋯», then one line per diluent, its share on its left when there are two or more. */}
        <div className="weigh-menu">
          <button
            ref={menuButton}
            type="button"
            className="weigh-more"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t.aria.more(name)}
            onClick={() => onMenu(!menuOpen)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              ref={menuList}
              className="weigh-menu-list"
              role="menu"
              aria-label={t.aria.more(name)}
              onKeyDown={(e) => {
                const items = [...(menuList.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
                const at = items.indexOf(document.activeElement as HTMLElement);
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeMenu();
                } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
                } else if (e.key === "Tab") onMenu(false);
              }}
            >
              {sources.length > 0 && (
                <button type="button" role="menuitem" onClick={act(() => change((r) => ({ ...r, sourceId: r.sourceId ? null : sources[0].id })))}>
                  {showFrom ? t.menu.fromPure : t.menu.fromBottle}
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={act(() =>
                  change((r) => ({ ...r, diluents: [...r.diluents, { diluentId: diluents.find((d) => !r.diluents.some((x) => x.diluentId === d.id))?.id ?? "", share: "", weighed: "" }] })),
                )}
              >
                {t.menu.addDiluent}
              </button>
              {many &&
                row.diluents.map((d, i) => (
                  <button key={i} type="button" role="menuitem" onClick={act(() => change((r) => ({ ...r, diluents: r.diluents.filter((_, j) => j !== i) })))}>
                    {t.menu.removeDiluent(d.diluentId ? short(d.diluentId) : t.diluent)}
                  </button>
                ))}
              {!noteOpen && (
                <button type="button" role="menuitem" onClick={act(onNote)}>
                  {t.menu.note}
                </button>
              )}
              <button type="button" role="menuitem" className="danger" onClick={act(remove)}>
                {t.menu.removeRow}
              </button>
            </div>
          )}
        </div>
        {row.diluents.map((d, i) => (
          <div key={i} className={`weigh-dil-line${i === 0 ? " first" : ""}`}>
            <div className="weigh-dil">
              {many && (
                <span className="weigh-unit share" data-unit="%">
                  <input
                    className="weigh-cell n"
                    inputMode="decimal"
                    value={d.share}
                    placeholder={state.shares[i] ? shareText(state.shares[i]) : ""}
                    aria-label={t.aria.share(d.diluentId ? short(d.diluentId) : t.diluent, name)}
                    onChange={(e) => setDiluent(i, { share: e.target.value })}
                  />
                </span>
              )}
              <select
                className={`weigh-cell weigh-diluent${d.diluentId ? "" : " missing"}`}
                value={d.diluentId}
                aria-label={t.aria.diluent(i + 1, name)}
                title={d.diluentId ? nameOf(d.diluentId) : undefined}
                onChange={(e) => setDiluent(i, { diluentId: e.target.value })}
              >
                {!d.diluentId && <option value="">{t.pickDiluent}</option>}
                {diluents.map((x) => (
                  <option key={x.id} value={x.id} disabled={x.id !== d.diluentId && row.diluents.some((y) => y.diluentId === x.id)}>
                    {shortName(x)}
                  </option>
                ))}
              </select>
            </div>
            {scaleBox(d.weighed, g(state.goal.diluents[i] ?? null), t.aria.diluentWeighed(d.diluentId ? short(d.diluentId) : t.diluent, name), (v) => setDiluent(i, { weighed: v }), d.diluentId ? short(d.diluentId) : t.diluent)}
            <div className="weigh-result r">
              {i === 0 &&
                (state.real ? (
                  <strong className="fig">{gramsText(state.real.totalUg)} g</strong>
                ) : state.status === "asIs" && totalUg ? (
                  <span className="fig muted">{row.total.trim()} g</span>
                ) : why ? (
                  <span className="weigh-why">{why}</span>
                ) : (
                  <span className="muted">—</span>
                ))}
            </div>
          </div>
        ))}
        {noteOpen && (
          <label className="weigh-note">
            <span className="sr-only">{t.aria.note(name)}</span>
            <input value={row.note} placeholder={t.notePlaceholder} onChange={(e) => change((r) => ({ ...r, note: e.target.value }))} />
          </label>
        )}
      </div>
      <Bar state={state} colour={colours?.light ?? null} name={name} diluentNames={row.diluents.map((d) => (d.diluentId ? short(d.diluentId) : t.diluent))} />
      {error && <p className="error">{error}</p>}
    </li>
  );
}

/** The thin bar of a row: the material in its family's colour, the diluents in greys; planned parts dashed. */
function Bar({ state, colour, name, diluentNames }: { state: RowState; colour: string | null; name: string; diluentNames: readonly string[] }) {
  if (state.bar.length === 0) return <div className="weigh-bar empty" aria-hidden="true" />;
  const label = state.bar.map((s) => `${s.part === "material" ? name : diluentNames[s.index]} ${percent(s.share, 1)}${s.weighed ? "" : ` ${t.planned}`}`).join(", ");
  return (
    <div className="weigh-bar" role="img" aria-label={label}>
      {state.bar.map((s, i) => (
        <span
          key={i}
          className={`seg ${s.part}${s.part === "diluent" ? ` d${s.index % 3}` : ""}${s.weighed ? " weighed" : " planned"}`}
          style={{ flexGrow: Number(s.share.toFixed(6)), ...(s.part === "material" && colour ? { ["--seg" as string]: colour } : {}) }}
        />
      ))}
    </div>
  );
}
