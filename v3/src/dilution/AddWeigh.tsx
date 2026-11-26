import { useEffect, useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import type { Dilution } from "../db/catalog";
import { createBottle, createUnweighedBottle } from "../db/dilutions";
import { dilutionLabel, linesOf } from "../labels/content";
import { saveJob, type PrintLine } from "../labels/jobs";
import type { LocalDatabase } from "../db/local/database";
import { coloursOf } from "../families/palette";
import { drawn, fixedRatio, percent } from "../format/numbers";
import { orbLookOf, orbScalesOf, seedOf } from "../ui/orb/fromCatalog";
import { MaterialOrb } from "../ui/orb/MaterialOrb";
import type { GlossaryData } from "../db/useGlossary";
import { texts } from "../i18n/en";
import { MaterialPicker } from "../ui/MaterialPicker";
import { inMyBench, pickOptionsOf } from "../db/material-search";
import { Button } from "../Button";
import type { SourceBottle } from "./calc";
import { nominalPercent, shortName } from "./grid";
import { factoryBottleOf } from "../db/factory";
import { bottleCheck, describeRow, groupsOf, labelOf, rowState, shareText, stillToPour, tally, type RowState, type WeighDiluent, type WeighRow } from "./weigh";
import { ImportDilutions } from "./ImportDilutions";
import { percentToFraction } from "../format/percent";
import { massText, mgToUg } from "../format/mass";
import type { MassUnit } from "../core/arith/units";
import { MassInput, useMassUnit } from "../ui/MassInput";

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
  // A material that came made (its factory bottle, batch 66) starts from that bottle, never from pure:
  // weighed as pure it would save ten times the material and lose the factory diluent. The diluent to
  // add is that of the last bottle you made, not the factory one.
  const factory = like ? undefined : factoryBottleOf(data.catalog, materialId);
  const bottles = [...(data.catalog.dilutions.get(materialId) ?? [])]
    .filter((d) => d.diluents.length > 0 && d.id !== factory?.id)
    .sort((a, b) => (b.madeOn ?? "").localeCompare(a.madeOn ?? ""));
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
    sourceId: factory?.id ?? null,
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
  /** How many bottles were saved, and whether their print text was kept too (labels/jobs.ts). */
  onSaved: (count: number, job: boolean) => void;
}) {
  const scales = useMemo(() => orbScalesOf(data.catalog), [data]);
  const diluents = useMemo(
    () => [...data.catalog.materials.values()].filter((m) => m.solvent).sort((a, b) => (a.ownerId ? 1 : 0) - (b.ownerId ? 1 : 0) || a.name.localeCompare(b.name, "es")),
    [data],
  );
  // The same list and search as «My library» in the add bar (2026-11-26): your versions and what you marked «I have it».
  const materials = useMemo(() => pickOptionsOf(data.catalog, inMyBench(data.catalog)), [data]);
  const bottleById = useMemo(() => new Map([...data.catalog.dilutions.values()].flat().map((d) => [d.id, d])), [data]);
  const [menu, setMenu] = useState<string | null>(null);
  // The draft keeps its weights in mg (weigh.v2); the boxes show them in the app's unit (ui/MassInput.tsx).
  const [unit, setUnit] = useMassUnit();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map());
  const [importing, setImporting] = useState(false);
  // The groups by bottle size, only when some row has a size (an imported plan).
  const groups = rows.some((r) => r.bottleMl) ? groupsOf(rows) : [];
  const groupStart = new Map(groups.map((g) => [g.keys[0], g]));

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
    const lines: PrintLine[] = [];
    for (const { row, state } of saveable) {
      const common = { materialId: row.materialId, label: labelOf(row.target), madeOn, description: describeRow(row, madeOn), sourceDilutionId: row.sourceId };
      try {
        if (state.status === "weighed") {
          await createBottle(local.db, local.userId, {
            ...common,
            materialUg: mgToUg(row.weighed)!,
            diluents: row.diluents.map((d) => ({ diluentId: d.diluentId, massUg: mgToUg(d.weighed)! })),
          });
        } else {
          await createUnweighedBottle(local.db, local.userId, { ...common, target: percentToFraction(row.target)!, diluents: state.planned! });
        }
        saved.push(row.key);
        // Its label, from what was just saved (the same figures the bottle keeps).
        const shares = state.real ?? state.aimed;
        if (shares) {
          const d = { id: "", fraction: shares.fraction, solvent: null, madeOn, description: null, label: common.label, materialMassUg: null, sourceDilutionId: null, archivedAt: null, diluents: shares.diluents.map((x) => ({ id: "", diluentId: x.diluentId, massUg: x.massUg, fraction: x.fraction })) };
          // With the full weight (and tare) weighed, the label carries them to reweigh the bottle (labels/content.ts).
          const { grossUg, tareUg } = bottleCheck(row);
          lines.push(linesOf(dilutionLabel((id) => data.catalog.materials.get(id), row.materialId, d, grossUg !== null ? { fullUg: grossUg, tareUg } : null)));
        }
      } catch (e) {
        failed.set(row.key, texts.dilutions.failed(e instanceof Error ? e.message : String(e)));
      }
    }
    setRows((list) => list.filter((r) => !saved.includes(r.key)));
    setErrors(failed);
    setSaving(false);
    if (saved.length > 0) onSaved(saved.length, lines.length > 0 && saveJob({ id: crypto.randomUUID(), savedAt: new Date().toISOString(), day: madeOn || null, lines }));
  };

  return (
    <section className="weigh" aria-label={t.title}>
      <div className="weigh-intro">
        <h3 className="weigh-title">{t.title}</h3>
        <label className="weigh-date">
          {t.madeOn}
          <input type="date" value={madeOn} onChange={(e) => setMadeOn(e.target.value)} />
        </label>
        {!importing && (
          <button type="button" className="link" onClick={() => setImporting(true)}>
            {t.importButton}
          </button>
        )}
      </div>
      <p className="weigh-hint">{t.hint}</p>
      {importing && (
        <ImportDilutions
          data={data}
          userId={local.userId}
          newKey={newKey}
          onAdd={(added) => {
            setRows((list) => [...list, ...added]);
            setImporting(false);
          }}
          onCancel={() => setImporting(false)}
        />
      )}
      <div className="weigh-sheet">
        <div className="weigh-head" aria-hidden="true">
          <span>{t.head.material}</span>
          <span>
            {t.head.want}
            <small>{t.head.wantSub(unit)}</small>
          </span>
          <span className="r">
            {t.head.scale(unit)}
            <small>{t.head.scaleSub}</small>
          </span>
          <span className="r">
            {t.head.result}
            <small>{t.head.resultSub}</small>
          </span>
        </div>
        <ol className="weigh-rows">
          {states.map(({ row, state }) => [
            groupStart.has(row.key) && (
              <li key={`g-${row.key}`} className="weigh-group">
                {t.group(groupStart.get(row.key)!.ml, groupStart.get(row.key)!.keys.length)}
              </li>
            ),
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
              unit={unit}
              onUnit={setUnit}
            />,
          ])}
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
                  {short(id)} <strong className="fig">{massText(ug, unit)} {unit}</strong>
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
  unit,
  onUnit,
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
  unit: MassUnit;
  onUnit: (unit: MassUnit) => void;
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
  const g = (ug: bigint | null) => (ug === null ? null : massText(ug, "mg"));
  const goalMaterial = g(state.goal.materialUg);
  const totalUg = mgToUg(row.total);

  // A weight on the scale: written in mg or g, kept in mg (ui/MassInput.tsx); the figure to put, grey until you write.
  const scaleBox = (value: string, goal: string | null, aria: string, onChange: (v: string) => void, who: string) => (
    <span className="weigh-scale">
      <MassInput
        className={`weigh-cell n${value.trim() ? "" : " to-put"}`}
        value={value}
        base="mg"
        unit={unit}
        onUnit={onUnit}
        goal={goal}
        placeholder={goal ?? undefined}
        aria-label={aria}
        title={who}
        onChange={onChange}
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
          <MassInput
            className="weigh-cell n"
            value={row.total}
            base="mg"
            unit={unit}
            onUnit={onUnit}
            placeholder={t.optional}
            aria-label={t.aria.total(name)}
            onChange={(v) => change((r) => ({ ...r, total: v }))}
          />
        </div>
        {scaleBox(row.weighed, goalMaterial, t.aria.materialWeighed(name), (v) => change((r) => ({ ...r, weighed: v })), showFrom ? t.fromTheBottle : t.head.material)}
        <div className="weigh-result r" title={state.diff ? t.diff(percent(state.diff, 2)) : (why ?? undefined)}>
          {state.real ? <strong className="fig">{fixedRatio(state.real.fraction.mul(Ratio.of(100n)), 2)} %</strong> : <span className={`weigh-state ${state.status}`}>{words}</span>}
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
              {row.tare === undefined && (
                <button type="button" role="menuitem" onClick={act(() => change((r) => ({ ...r, tare: "", gross: "" })))}>
                  {t.menuBottle}
                </button>
              )}
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
                  <strong className="fig">{massText(state.real.totalUg, unit)} {unit}</strong>
                ) : state.status === "asIs" && totalUg ? (
                  <span className="fig muted">{massText(totalUg, unit)} {unit}</span>
                ) : why ? (
                  <span className="weigh-why">{why}</span>
                ) : (
                  <span className="muted">—</span>
                ))}
            </div>
          </div>
        ))}
        {row.tare !== undefined && <BottleWeights row={row} name={name} change={change} unit={unit} onUnit={onUnit} />}
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
          style={{ flexGrow: drawn(s.share, 6), ...(s.part === "material" && colour ? { ["--seg" as string]: colour } : {}) }}
        />
      ))}
    </div>
  );
}

/**
 * The bottle itself on the scale (the user's inbox, 2026-11-25): the empty bottle and the full one,
 * closed, kept with the bottle to reweigh it later; and how far the full weight is from tare + weights.
 */
function BottleWeights({
  row,
  name,
  change,
  unit,
  onUnit,
}: {
  row: WeighRow;
  name: string;
  change: (update: (row: WeighRow) => WeighRow) => void;
  unit: MassUnit;
  onUnit: (unit: MassUnit) => void;
}) {
  const { offUg } = bottleCheck(row);
  return (
    <div className="weigh-bottle">
      <span className="weigh-bottle-label">{t.bottleLine}</span>
      <span className="weigh-bottle-field">
        <span className="weigh-bottle-what" aria-hidden="true">
          {t.tare}
        </span>
        <MassInput className="weigh-cell n" value={row.tare ?? ""} base="mg" unit={unit} onUnit={onUnit} aria-label={t.bottleAria.tare(name)} onChange={(v) => change((r) => ({ ...r, tare: v }))} />
      </span>
      <span className="weigh-bottle-field">
        <span className="weigh-bottle-what" aria-hidden="true">
          {t.gross}
        </span>
        <MassInput className="weigh-cell n" value={row.gross ?? ""} base="mg" unit={unit} onUnit={onUnit} aria-label={t.bottleAria.gross(name)} onChange={(v) => change((r) => ({ ...r, gross: v }))} />
      </span>
      {offUg !== null && offUg !== 0n && <span className="weigh-why">{t.off(massText(offUg, unit), unit)}</span>}
      {row.plan && (row.plan.materialG || row.plan.diluentG) && <span className="muted">{t.planSays(row.plan.materialG || "—", row.plan.diluentG || "—")}</span>}
    </div>
  );
}
