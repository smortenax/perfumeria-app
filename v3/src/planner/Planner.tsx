import { useEffect, useId, useMemo, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import { formatDecimal } from "../core/display";
import type { LocalDatabase } from "../db/local/database";
import { loadPlan, type PlanRow, removePlanLine, setPlanParts, setPlanShape } from "../db/plans";
import { PALETTE } from "../families/palette";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { MaterialPicker } from "../MaterialPicker";
import { Button } from "../Button";
import type { Catalog } from "../db/catalog";
import { planToJson } from "./plan-json";
import { planLinesOf, type ShownLine } from "./lines";
import { partsText } from "./parts-text";
import { indexAt, level, MOMENTS, PERCEIVED_EXPONENT, PLATEAU_SLOW, profileAt, SHAPE_IDS, type ShapeId } from "./profile";
import "./planner.css";

const t = texts.planner;

/** The plan as a perfumeria/plan/1 file (V3-100): each line with its id, its CAS and the shape you picked. */
export function planFile(catalog: Catalog, name: string, rows: readonly PlanRow[]): string {
  const casOf = (id: string) => {
    let m = catalog.materials.get(id);
    for (let i = 0; m && i < 10; i++) {
      if (m.cas) return m.cas;
      m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
    }
    return null;
  };
  return planToJson({
    name,
    created: new Date().toISOString().slice(0, 10),
    lines: rows.map((r) => ({ material: catalog.materials.get(r.materialId)?.name ?? "—", materialId: r.materialId, cas: casOf(r.materialId), parts: r.parts, shape: r.shape, group: r.groupName })),
  });
}

function downloadPlan(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
  const slug = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plan";
  const a = Object.assign(document.createElement("a"), { href: url, download: `${slug}.plan.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The plan of a formula, live from the copy. */
export function usePlan(local: LocalDatabase, formulaId: string): readonly PlanRow[] {
  const [rows, setRows] = useState<PlanRow[]>([]);
  useEffect(() => {
    const abort = new AbortController();
    local.powerSync.watch(
      "SELECT count(*) AS n, max(updated_at) AS at FROM formula_plan_lines WHERE formula_id = ?",
      [formulaId],
      { onResult: () => void loadPlan(local.db, local.userId, formulaId).then(setRows) },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, [local, formulaId]);
  return rows;
}

/** The moments the slider stops at, in hours: from just applied to 600 h, the TGSC top. */
const STOPS = [0, 0.25, 0.5, 1, 2, 4, 8, 12, 24, 48, 72, 120, 168, 300, 600];
/** The stretches of the tastings (V3-42), as bands behind the charts. */
const PHASES = [0, 0.25, 2, 8, 24, 600];
/** Time is drawn in log(t + 0.05 h), so the first minutes are not crushed. */
const C = 0.05;
const X = (h: number) => (Math.log(h + C) - Math.log(C)) / (Math.log(600 + C) - Math.log(C));
const atX = (x: number) => Math.exp(x * (Math.log(600 + C) - Math.log(C)) + Math.log(C)) - C;
const colour = (l: ShownLine) => (l.family ? (PALETTE.get(l.family)?.light ?? "var(--family-none)") : "var(--family-none)");
const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)} %`;
const when = (h: number) => (h === 0 ? t.justApplied : h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${h} h` : `${Math.round(h / 24)} days`);
const hoursOf = (l: ShownLine) => (l.hours ? Number(l.hours.num) / Number(l.hours.den) : null);
const shortName = (name: string) => name.split(",")[0];

/**
 * The aromatic profile planner (V3-98), the formula's template: the materials it will carry in parts,
 * how they share the space by parts × impact, how each fades on a blotter, and how many compete at
 * each moment. Nothing here weighs: the bench compares what is weighed with it.
 */
export function Planner(props: { data: GlossaryData; local: LocalDatabase; formulaId: string; onBack: () => void; onImport?: () => void }) {
  const { data, local, formulaId } = props;
  const rows = usePlan(local, formulaId);
  const lines = useMemo(() => planLinesOf(data.catalog, rows), [data.catalog, rows]);
  const [error, setError] = useState<string | null>(null);
  const name = data.formulas.find((f) => f.id === formulaId)?.name ?? "";
  const options = useMemo(() => {
    const planned = new Set(rows.map((r) => r.materialId));
    return [...data.catalog.materials.values()]
      .filter((m) => !m.solvent && !planned.has(m.id) && (m.ownerId === null || m.ownerId === local.userId))
      .map((m) => ({ id: m.id, name: m.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [data.catalog, rows, local.userId]);
  const write = (work: () => Promise<unknown>) => {
    setError(null);
    work().catch((e: unknown) => setError(`${t.writeError}: ${e instanceof Error ? e.message : String(e)}`));
  };
  return (
    <PlannerView
      name={name}
      lines={lines}
      options={options}
      error={error}
      onBack={props.onBack}
      onImport={props.onImport}
      onExport={rows.length > 0 ? () => downloadPlan(name, planFile(data.catalog, name, rows)) : undefined}
      onAdd={(id) => write(() => setPlanParts(local.db, local.userId, formulaId, id, Ratio.ONE))}
      onParts={(l, parts) => write(() => setPlanParts(local.db, local.userId, formulaId, l.key, parts))}
      onShape={(l, shape) => write(() => setPlanShape(local.db, local.userId, l.rowId, shape))}
      onRemove={(l) => write(() => removePlanLine(local.db, local.userId, l.rowId))}
    />
  );
}

/** The planner's screen, from its lines: what it draws, apart from where the plan is kept. */
export function PlannerView(props: {
  name: string;
  lines: readonly ShownLine[];
  options: readonly { readonly id: string; readonly name: string }[];
  error: string | null;
  onBack: () => void;
  /** «Import plan» and «Export plan» (V3-100); without them, the head shows neither. */
  onImport?: () => void;
  onExport?: () => void;
  onAdd: (materialId: string) => void;
  onParts: (line: ShownLine, parts: Ratio) => void;
  onShape: (line: ShownLine, shape: ShapeId | null) => void;
  onRemove: (line: ShownLine) => void;
}) {
  const { lines, name, error } = props;
  const [perceived, setPerceived] = useState(false);
  const [exponent, setExponent] = useState(PERCEIVED_EXPONENT);
  const [slow, setSlow] = useState(PLATEAU_SLOW);
  const [stop, setStop] = useState(5);
  const [relative, setRelative] = useState(false);
  const slowId = useId();
  const momentId = useId();
  const setParts = (l: ShownLine, parts: Ratio) => props.onParts(l, parts);
  const step = (l: ShownLine, by: number) => {
    const now = l.parts;
    const next = by < 0 ? (now.gt(Ratio.ONE) ? now.sub(Ratio.ONE) : Ratio.ZERO) : now.lt(Ratio.ONE) ? Ratio.ONE : now.add(Ratio.ONE);
    setParts(l, next);
  };

  const options$ = { perceived: perceived ? exponent : null, slow };
  const view = (x: number) => (perceived ? Math.pow(Math.max(x, 0), exponent) : x);
  const at = STOPS[stop];
  const now = profileAt(lines, at, options$);
  const counted = lines.filter((l) => l.parts.sign() > 0 && l.impact !== null && l.hours !== null && l.shape !== null);

  return (
    <div className="planner">
      <header className="planner-head">
        <button type="button" className="planner-back" aria-label={t.back} title={t.back} onClick={props.onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <h1>{t.of(name)}</h1>
        <span className="planner-tag">{t.onBlotter}</span>
        {(props.onImport || props.onExport) && (
          <span className="planner-io">
            {props.onImport && (
              <Button variant="secondary" onClick={props.onImport}>
                {texts.importPlan.button}
              </Button>
            )}
            {props.onExport && (
              <Button variant="secondary" onClick={props.onExport}>
                {texts.importPlan.export}
              </Button>
            )}
          </span>
        )}
      </header>
      <p className="planner-intro">{t.intro}</p>
      {error && (
        <p className="planner-error" role="alert">
          {error}
        </p>
      )}

      <div className="planner-bench">
        <section className="planner-plan" aria-label={t.title}>
          <MaterialPicker label={t.add} placeholder={t.addPlaceholder} options={props.options} quietWhenEmpty onPick={props.onAdd} />
          {lines.length === 0 ? (
            <p className="planner-muted">{t.empty}</p>
          ) : (
            <ul className="planner-rows">
              {lines.map((l) => (
                <PlanLineRow key={l.rowId} line={l} onParts={(p) => setParts(l, p)} onStep={(by) => step(l, by)} onShape={(s) => props.onShape(l, s)} onRemove={() => props.onRemove(l)} />
              ))}
            </ul>
          )}
        </section>

        <div className="planner-charts">
          <section className="planner-block" aria-label={t.space}>
            <div className="planner-block-head">
              <h2>{t.space}</h2>
              <div className="planner-seg" role="group" aria-label={t.viewLabel}>
                <button type="button" aria-pressed={!perceived} onClick={() => setPerceived(false)}>
                  {t.index}
                </button>
                <button type="button" aria-pressed={perceived} onClick={() => setPerceived(true)}>
                  {t.perceived}
                </button>
              </div>
            </div>
            <p className="planner-muted">
              {perceived ? t.perceivedHelp(exponent.toFixed(2)) : t.indexHelp}
              {perceived && (
                <label className="planner-exponent">
                  {t.exponent}{" "}
                  <input type="number" min={0.05} max={1} step={0.05} value={exponent} onChange={(e) => setExponent(Math.min(1, Math.max(0.05, Number(e.target.value) || PERCEIVED_EXPONENT)))} />
                </label>
              )}
            </p>
            <ShareBar label={t.byParts} items={counted.map((l) => ({ line: l, value: view(Number(l.parts.num) / Number(l.parts.den)) }))} />
            <ShareBar label={perceived ? t.byPerceived : t.byIndex} items={counted.map((l) => ({ line: l, value: view(indexAt(l, 0, slow) ?? 0) }))} />
          </section>

          <section className="planner-block" aria-label={t.timeline}>
            <div className="planner-block-head">
              <h2>{t.timeline}</h2>
              <span className="planner-muted">{t.timelineHelp}</span>
            </div>
            <Timeline lines={lines.filter((l) => l.parts.sign() > 0)} view={view} slow={slow} at={at} competing={MOMENTS.map((m) => profileAt(lines, m, options$))} />
          </section>

          <section className="planner-block" aria-label={t.stack}>
            <div className="planner-block-head">
              <h2>{t.stack}</h2>
              <div className="planner-seg" role="group" aria-label={t.scaleLabel}>
                <button type="button" aria-pressed={!relative} onClick={() => setRelative(false)}>
                  {t.absolute}
                </button>
                <button type="button" aria-pressed={relative} onClick={() => setRelative(true)}>
                  {t.relative}
                </button>
              </div>
            </div>
            <Stack lines={counted} view={view} slow={slow} at={at} relative={relative} />
          </section>

          <section className="planner-block" aria-label={t.moment}>
            <label className="planner-moment" htmlFor={momentId}>
              <span className="planner-muted">{t.moment}</span>
              <input id={momentId} type="range" min={0} max={STOPS.length - 1} step={1} value={stop} aria-valuetext={when(at)} onChange={(e) => setStop(Number(e.target.value))} />
              <strong>{when(at)}</strong>
            </label>
            <div className="planner-now" aria-live="polite">
              <div className={now.tooMany ? "planner-big warn" : "planner-big"}>
                {now.competing}
                <small>{t.competeAt(when(at))}</small>
              </div>
              <div className="planner-big">
                {now.effective.toFixed(1)}
                <small>{t.effective}</small>
              </div>
              <div className="planner-big">
                {now.ofOpening === null ? "—" : pct(now.ofOpening)}
                <small>{t.left}</small>
              </div>
            </div>
            <ul className="planner-shares">
              {now.shares.slice(0, 8).map((s) => (
                <li key={s.key} className={s.competes ? "competes" : undefined}>
                  <span>{s.name}</span>
                  <span className="planner-share-bar">
                    <i style={{ width: `${s.share * 100}%`, background: s.family ? PALETTE.get(s.family)?.light : undefined }} />
                  </span>
                  <span className="planner-fig">{pct(s.share)}</span>
                </li>
              ))}
            </ul>
            {now.tooMany && <p className="planner-warn">{t.tooMany(now.competing)}</p>}
            {now.apart.length > 0 && (
              <p className="planner-warn">
                <strong>{t.apart}</strong> {now.apart.map((a) => `${a.name} (${a.missing.map((m) => t.missing[m]).join(", ")})`).join(", ")}
              </p>
            )}
          </section>

          <section className="planner-block" aria-label={t.shapes.plateau}>
            <label className="planner-moment" htmlFor={slowId}>
              <span className="planner-muted">{t.slow}</span>
              <input id={slowId} type="range" min={0.1} max={0.6} step={0.01} value={slow} onChange={(e) => setSlow(Number(e.target.value))} />
              <span className="planner-fig">{t.slowValue(slow.toFixed(2), pct(level("plateau", 400, 1, slow)), pct(level("plateau", 400, 10, slow)))}</span>
            </label>
            <Gallery slow={slow} />
          </section>
          <p className="planner-muted">{t.note}</p>
        </div>
      </div>
    </div>
  );
}

function PlanLineRow(props: { line: ShownLine; onParts: (parts: Ratio) => void; onStep: (by: number) => void; onShape: (shape: ShapeId | null) => void; onRemove: () => void }) {
  const l = props.line;
  const [typed, setTyped] = useState<string | null>(null);
  const hours = hoursOf(l);
  const commit = () => {
    if (typed === null) return;
    try {
      const parts = Ratio.fromDecimal(typed);
      if (parts.sign() >= 0) props.onParts(parts);
    } catch {
      // Not a number: what was there stays.
    }
    setTyped(null);
  };
  return (
    <li className="planner-row">
      <span className="planner-dot" style={{ background: colour(l) }} aria-hidden="true" />
      <span className="planner-name">
        {l.name}
        {l.group && <small className="planner-group">{l.group}</small>}
        <small>
          {l.impact !== null ? t.impact(l.impact) : <span className="planner-unknown">{t.noImpact}</span>} ·{" "}
          {hours !== null ? t.hours(formatDecimal(l.hours!, l.hours!.isInteger() ? 0 : 1)) : <span className="planner-unknown">{t.noHours}</span>} ·{" "}
          <select aria-label={t.shapeOf(l.name)} value={l.picked ?? ""} onChange={(e) => props.onShape(e.target.value === "" ? null : (e.target.value as ShapeId))}>
            <option value="">{l.fallback ? t.byDefault(t.shapes[l.fallback]) : t.noShape}</option>
            {SHAPE_IDS.map((s) => (
              <option key={s} value={s}>
                {t.shapes[s]}
              </option>
            ))}
          </select>
        </small>
      </span>
      <span className="planner-step">
        <button type="button" aria-label={t.less(l.name)} onClick={() => props.onStep(-1)}>
          −
        </button>
        <input
          inputMode="decimal"
          aria-label={t.partsOf(l.name)}
          value={typed ?? partsText(l.parts)}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <button type="button" aria-label={t.more(l.name)} onClick={() => props.onStep(1)}>
          +
        </button>
        <button type="button" className="planner-remove" aria-label={t.remove(l.name)} title={t.remove(l.name)} onClick={props.onRemove}>
          ×
        </button>
      </span>
    </li>
  );
}

function ShareBar(props: { label: string; items: readonly { line: ShownLine; value: number }[] }) {
  const total = props.items.reduce((s, i) => s + i.value, 0);
  const shown = props.items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  if (total === 0) return null;
  const words = shown.map((i) => `${i.line.name} ${pct(i.value / total)}`).join(", ");
  return (
    <div className="planner-sharebar">
      <span className="planner-muted">{props.label}</span>
      <span className="planner-bar" role="img" aria-label={`${props.label}: ${words}`}>
        {shown.map((i) => {
          const s = i.value / total;
          return (
            <i key={i.line.key} title={`${i.line.name}: ${pct(s)}`} style={{ flexGrow: s, background: colour(i.line) }}>
              {s > 0.09 ? `${shortName(i.line.name)} ${pct(s)}` : ""}
            </i>
          );
        })}
      </span>
    </div>
  );
}

const PHASE_LABELS = t.phases;

function Bands(props: { left: number; width: number; top: number; height: number; labels?: boolean }) {
  return (
    <>
      {PHASES.slice(0, -1).map((a, i) => {
        const b = PHASES[i + 1];
        const x = props.left + X(a) * props.width;
        const w = (X(b) - X(a)) * props.width;
        return (
          <g key={a}>
            <rect x={x} y={props.top} width={w} height={props.height} className={i % 2 ? "band" : "band odd"} />
            {props.labels && (
              <text x={x + w / 2} y={props.top - 8} textAnchor="middle" className="axis">
                {PHASE_LABELS[i]}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

function Axis(props: { left: number; width: number; y: number }) {
  const ticks: [number, string][] = [
    [0, "0"],
    [0.25, "15 min"],
    [2, "2 h"],
    [8, "8 h"],
    [24, "24 h"],
    [168, "7 d"],
    [600, "600 h"],
  ];
  return (
    <>
      {ticks.map(([h, label]) => (
        <g key={h}>
          <line x1={props.left + X(h) * props.width} x2={props.left + X(h) * props.width} y1={props.y} y2={props.y + 4} className="tick" />
          <text x={props.left + X(h) * props.width} y={props.y + 15} textAnchor={h === 0 ? "start" : h === 600 ? "end" : "middle"} className="axis">
            {label}
          </text>
        </g>
      ))}
    </>
  );
}

function Timeline(props: { lines: readonly ShownLine[]; view: (x: number) => number; slow: number; at: number; competing: readonly ReturnType<typeof profileAt>[] }) {
  const L = 150;
  const W = 560;
  const rowH = 26;
  const top = 22;
  const ms = [...props.lines].sort((a, b) => (hoursOf(a) ?? 1e9) - (hoursOf(b) ?? 1e9) || a.name.localeCompare(b.name, "es"));
  const weight = (l: ShownLine) => props.view(indexAt(l, 0, props.slow) ?? 0);
  const max = Math.max(...ms.map(weight), 1e-9);
  const H = ms.length * rowH;
  const yC = top + H + 32;
  if (ms.length === 0) return null;
  return (
    <div className="planner-scroll">
      <svg viewBox={`0 0 ${L + W + 10} ${yC + 26}`} role="img" aria-label={texts.planner.timeline} className="planner-svg">
        <defs>
          <pattern id="planner-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="hatch-bg" />
            <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
          </pattern>
        </defs>
        <Bands left={L} width={W} top={top} height={H} labels />
        {ms.map((l, k) => {
          const mid = top + k * rowH + rowH / 2;
          const hours = hoursOf(l);
          const known = l.impact !== null && hours !== null && l.shape !== null;
          if (!known) {
            const missing = [l.impact === null && t.missing.impact, hours === null && t.missing.hours, l.shape === null && t.missing.shape].filter(Boolean).join(", ");
            return (
              <g key={l.key}>
                <text x={L - 8} y={mid + 4} textAnchor="end" className="name unknown">
                  {shortName(l.name)}
                </text>
                <rect x={L} y={mid - 3} width={W} height={6} fill="url(#planner-hatch)" />
                <text x={L + 6} y={mid - 6} className="axis unknown">
                  {missing}
                </text>
              </g>
            );
          }
          const amp = Math.max(1.5, (weight(l) / max) * (rowH / 2 - 2));
          const up: string[] = [];
          const down: string[] = [];
          for (let j = 0; j <= 60; j++) {
            const x = (X(hours) * j) / 60;
            const a = (props.view(indexAt(l, atX(x), props.slow) ?? 0) / props.view(indexAt(l, 0, props.slow) ?? 1)) * amp;
            up.push(`${L + x * W},${mid - a}`);
            down.unshift(`${L + x * W},${mid + a}`);
          }
          return (
            <g key={l.key}>
              <text x={L - 8} y={mid + 4} textAnchor="end" className="name">
                {shortName(l.name)}
              </text>
              <path d={`M${up.join("L")}L${down.join("L")}Z`} fill={colour(l)} />
              <line x1={L + X(hours) * W} x2={L + X(hours) * W} y1={mid - 4} y2={mid + 4} className="tick" />
            </g>
          );
        })}
        <Axis left={L} width={W} y={top + H} />
        <line x1={L + X(props.at) * W} x2={L + X(props.at) * W} y1={top} y2={top + H} className="cursor" />
        <text x={L - 8} y={yC + 4} textAnchor="end" className="name strong">
          {t.competing}
        </text>
        {props.competing.map((c, i) => {
          const x = L + ((X(PHASES[i]) + X(PHASES[i + 1])) / 2) * W;
          return (
            <g key={i}>
              <text x={x} y={yC + 5} textAnchor="middle" className={c.tooMany ? "count warn" : "count"}>
                {c.competing}
              </text>
              <text x={x} y={yC + 19} textAnchor="middle" className="axis">
                ≈ {c.effective.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Stack(props: { lines: readonly ShownLine[]; view: (x: number) => number; slow: number; at: number; relative: boolean }) {
  const L = 150;
  const W = 560;
  const H = 170;
  const top = 8;
  const ms = [...props.lines].sort((a, b) => (hoursOf(b) ?? 0) - (hoursOf(a) ?? 0));
  if (ms.length === 0) return null;
  const xs = Array.from({ length: 141 }, (_, j) => j / 140);
  const ts = xs.map(atX);
  const value = (l: ShownLine, h: number) => props.view(indexAt(l, Math.max(0, h), props.slow) ?? 0);
  const opening = ms.reduce((s, l) => s + value(l, 0), 0) || 1;
  const sums = ts.map((h) => ms.reduce((s, l) => s + value(l, h), 0) || 1);
  let base = xs.map(() => 0);
  const paths = ms.map((l) => {
    const v = ts.map((h, j) => value(l, h) / (props.relative ? sums[j] : opening));
    const up = xs.map((x, j) => `${L + x * W},${top + H - (base[j] + v[j]) * H}`);
    const down = xs.map((x, j) => `${L + x * W},${top + H - base[j] * H}`).reverse();
    base = base.map((b, j) => b + v[j]);
    return (
      <path key={l.key} d={`M${up.join("L")}L${down.join("L")}Z`} fill={colour(l)} className="layer">
        <title>{l.name}</title>
      </path>
    );
  });
  return (
    <div className="planner-scroll">
      <svg viewBox={`0 0 ${L + W + 10} ${top + H + 22}`} role="img" aria-label={t.stack} className="planner-svg">
        <Bands left={L} width={W} top={top} height={H} />
        {paths}
        {[0, 0.5, 1].map((g) => (
          <text key={g} x={L - 8} y={top + H - g * H + 3} textAnchor="end" className="axis">
            {g * 100} %
          </text>
        ))}
        <text x={L - 8} y={top + H / 4 + 4} textAnchor="end" className="name muted">
          {props.relative ? t.ofLeft : t.ofOpening}
        </text>
        <line x1={L + X(props.at) * W} x2={L + X(props.at) * W} y1={top} y2={top + H} className="cursor" />
        <Axis left={L} width={W} y={top + H} />
      </svg>
    </div>
  );
}

function Gallery(props: { slow: number }) {
  const W = 170;
  const H = 70;
  return (
    <div className="planner-gallery">
      {SHAPE_IDS.map((s) => {
        const pts = Array.from({ length: 81 }, (_, j) => {
          const x = j / 80;
          return `${x * W},${H - level(s, 400, atX(x), props.slow) * (H - 4)}`;
        });
        return (
          <figure key={s}>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.shapes[s]}>
              {[1, 10, 100].map((h) => (
                <g key={h}>
                  <line x1={X(h) * W} x2={X(h) * W} y1={0} y2={H} className="grid" />
                  <text x={X(h) * W + 2} y={10} className="axis">
                    {h} h
                  </text>
                </g>
              ))}
              <path d={`M0,${H}L${pts.join("L")}L${W},${H}Z`} className="area" />
              <path d={`M${pts.join("L")}`} className="curve" />
            </svg>
            <figcaption>
              <b>{t.shapes[s]}</b> {t.shapeHelp[s]}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
