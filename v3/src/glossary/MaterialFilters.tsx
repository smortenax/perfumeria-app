import { useId, useState, type ReactNode } from "react";
import { FAMILIES, IMPACT_TOP, type Family } from "../db/catalog";
import { PALETTE } from "../families/palette";
import { texts } from "../i18n/en";
import { Pills } from "../Pills";
import { DURATION_BANDS, pressStep, SORTS, type Sort, type StepRange, type TraitFilters } from "./traits";

const b = texts.glossary.browse;
type Panel = "family" | "strength" | "duration" | "more";

/** A range of steps to press (V3-94): each step a pill, those in the range pressed; «Any» clears it. */
function Steps(props: { label: string; steps: readonly string[]; range: StepRange | null; noData: boolean; onRange: (r: StepRange | null) => void; onNoData: (v: boolean) => void }) {
  const { range } = props;
  return (
    <div className="filter-steps" role="group" aria-label={props.label}>
      <span className="pills">
        <button type="button" className="pill" aria-pressed={range === null} onClick={() => props.onRange(null)}>
          {b.any}
        </button>
        {props.steps.map((s, i) => (
          <button key={s} type="button" className="pill" aria-pressed={range !== null && i >= range.from && i <= range.to} onClick={() => props.onRange(pressStep(range, i))}>
            {s}
          </button>
        ))}
      </span>
      {range !== null && (
        <label className="check">
          <input type="checkbox" checked={props.noData} onChange={(e) => props.onNoData(e.target.checked)} />
          {b.noData}
        </label>
      )}
      <p className="hint">{b.rangeHelp}</p>
    </div>
  );
}

/**
 * The bar of Materials (V3-94): Family, Strength and Duration always in view, the order beside them
 * and «Only what I have»; the kind, IFRA and «Running low» under «More filters». What is on shows as
 * chips under the bar, each one removable. One panel open at a time, in the page, under the bar.
 */
export function MaterialFilters(props: {
  filters: TraitFilters;
  onFilters: (f: TraitFilters) => void;
  sort: Sort;
  onSort: (s: Sort) => void;
  haveOnly: boolean;
  onHaveOnly: (v: boolean) => void;
  /** How many more the facets bring, with families chosen. */
  byFacet: number;
  /** How many of the filters under «More» are on. */
  moreOn: number;
  more: ReactNode;
  /** The chips of the filters under «More», to remove them from here too. */
  moreChips: ReadonlyArray<{ readonly label: string; readonly onRemove: () => void }>;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState<Panel | null>(null);
  const id = useId();
  const f = props.filters;
  const set = (change: Partial<TraitFilters>) => props.onFilters({ ...f, ...change });
  // The strength is the impact, 1 to 10 (V3-97): what has only the four-level strength is «no data» here.
  const strengths = Array.from({ length: IMPACT_TOP }, (_, i) => String(i + 1));
  const bands = DURATION_BANDS.map((d) => b.bands[d.key]);
  const familyName = (x: Family) => texts.sheet.families[x];
  const toggle = (p: Panel) => setOpen(open === p ? null : p);
  const button = (p: Panel, label: string, on: number) => (
    <button type="button" className={on ? "filter-button on" : "filter-button"} aria-expanded={open === p} aria-controls={`${id}-${p}`} onClick={() => toggle(p)}>
      {label}
      {on > 0 && <span className="filter-count">{on}</span>}
      <span aria-hidden="true"> ▾</span>
    </button>
  );
  const rangeChip = (what: string, names: readonly string[], range: StepRange | null, noData: boolean, clear: () => void) =>
    range === null ? [] : [{ label: `${b.chipRange(what, names[range.from], names[range.to])}${noData ? ` ${b.withNoData}` : ""}`, onRemove: clear }];
  const chips = [
    ...f.families.map((x) => ({ label: familyName(x), onRemove: () => set({ families: f.families.filter((y) => y !== x) }) })),
    ...(f.facets && f.families.length ? [{ label: b.facets, onRemove: () => set({ facets: false }) }] : []),
    ...rangeChip(b.strength, strengths, f.strength, f.strengthNoData, () => set({ strength: null, strengthNoData: false })),
    ...rangeChip(b.duration, DURATION_BANDS.map((d) => b.bandShort[d.key]), f.duration, f.durationNoData, () => set({ duration: null, durationNoData: false })),
    ...(props.haveOnly ? [{ label: texts.glossary.haveOnly, onRemove: () => props.onHaveOnly(false) }] : []),
    ...props.moreChips,
  ];
  return (
    <div className="filter-bar" role="group" aria-label={b.label}>
      <div className="filter-row">
        {button("family", b.family, f.families.length)}
        {button("strength", b.strength, f.strength ? 1 : 0)}
        {button("duration", b.duration, f.duration ? 1 : 0)}
        <Pills label={b.sort} value={props.sort} options={SORTS.map((s) => ({ value: s, label: b.sorts[s] }))} onChange={(s) => props.onSort(s ?? "name")} />
        <span className="pills">
          <button type="button" className="pill" aria-pressed={props.haveOnly} onClick={() => props.onHaveOnly(!props.haveOnly)}>
            {texts.glossary.haveOnly}
          </button>
        </span>
        {button("more", b.more, props.moreOn)}
      </div>
      {open === "family" && (
        <div className="filter-panel" id={`${id}-family`}>
          <span className="pills" role="group" aria-label={b.family}>
            {FAMILIES.map((x) => (
              <button
                key={x}
                type="button"
                className="pill family-pill"
                aria-pressed={f.families.includes(x)}
                style={{ ["--fam" as string]: PALETTE.get(x)?.light ?? "var(--muted)" }}
                onClick={() => set({ families: f.families.includes(x) ? f.families.filter((y) => y !== x) : [...f.families, x] })}
              >
                <i aria-hidden="true" />
                {familyName(x)}
              </button>
            ))}
          </span>
          <label className="check">
            <input type="checkbox" checked={f.facets} onChange={(e) => set({ facets: e.target.checked })} />
            {b.facets}
            {f.facets && f.families.length > 0 && <span className="muted"> · {b.byFacet(props.byFacet)}</span>}
          </label>
          <p className="hint">{b.facetsHelp}</p>
        </div>
      )}
      {open === "strength" && (
        <div className="filter-panel" id={`${id}-strength`}>
          <Steps label={b.strength} steps={strengths} range={f.strength} noData={f.strengthNoData} onRange={(r) => set({ strength: r, ...(r ? {} : { strengthNoData: false }) })} onNoData={(v) => set({ strengthNoData: v })} />
        </div>
      )}
      {open === "duration" && (
        <div className="filter-panel" id={`${id}-duration`}>
          <Steps label={b.duration} steps={bands} range={f.duration} noData={f.durationNoData} onRange={(r) => set({ duration: r, ...(r ? {} : { durationNoData: false }) })} onNoData={(v) => set({ durationNoData: v })} />
        </div>
      )}
      {open === "more" && (
        <div className="filter-panel" id={`${id}-more`}>
          {props.more}
        </div>
      )}
      {chips.length > 0 && (
        <div className="filter-chips">
          {chips.map((c) => (
            <button key={c.label} type="button" className="chip filter-chip" aria-label={b.remove(c.label)} onClick={c.onRemove}>
              {c.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="link" onClick={props.onClearAll}>
            {b.clearAll}
          </button>
        </div>
      )}
    </div>
  );
}
