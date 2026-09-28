import { useState } from "react";
import type { Composition } from "../core/compose";
import { formatPercent } from "../core/display";
import type { Material } from "../core/model/material";
import type { MaterialFamily } from "../data/catalog";
import { texts } from "../i18n/es";
import { diluentMaterial, prefsOf } from "./prefs";

const c = texts.charts;

/** The perfume's visualizer, the app's signature (P23): its place, big, until it is designed (P33). */
export function VisualizerPlaceholder() {
  return (
    <div className="visualizer">
      <svg width="190" height="190" viewBox="0 0 200 200" fill="none" stroke="#BDBAB0" strokeWidth="1.5" aria-hidden="true">
        <circle cx="100" cy="100" r="28" />
        <circle cx="100" cy="100" r="52" strokeDasharray="4 6" />
        <circle cx="100" cy="100" r="76" />
        <circle cx="100" cy="100" r="96" strokeDasharray="2 8" />
      </svg>
      <span className="vis-title">{c.visualizer}</span>
      <span className="muted">{c.visualizerNote}</span>
    </div>
  );
}

const FLOOR_PATHS = [
  "M12 1.00 L13.71 3.80 L10.29 3.80 Z",
  "M9.80 4.60 L14.20 4.60 L15.91 7.40 L8.09 7.40 Z",
  "M7.60 8.20 L16.40 8.20 L18.11 11.00 L5.89 11.00 Z",
  "M5.40 11.80 L18.60 11.80 L20.31 14.60 L3.69 14.60 Z",
  "M3.20 15.40 L20.80 15.40 L23.00 19.00 L1.00 19.00 Z",
];

/** The pyramid by floor (§10.2): its five icons, with no bars until each material has its position (frente 6). */
export function PyramidCard() {
  return (
    <div className="card chart-card pyramid">
      <div className="chart-head">
        <span className="chart-title">{c.pyramid}</span>
        <span className="pill">{c.noData}</span>
      </div>
      <div className="pyramid-rows">
        {c.floors.map((floor, i) => (
          <div key={floor} className="pyramid-row" title={floor}>
            <svg width="24" height="20" viewBox="0 0 24 20" aria-hidden="true">
              {FLOOR_PATHS.map((d, j) => (
                <path key={j} d={d} fill={j === i ? "#3F3E39" : "#E6E4DD"} />
              ))}
            </svg>
            <span className="pyramid-bar" />
          </div>
        ))}
      </div>
    </div>
  );
}

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A material without a family: light and plain, never the grey of «Transformado» (P48). */
const NO_FAMILY = "#D9D7CF";
/** The white between two slices, so two of one family still read as two materials. */
const GAP = 1.2;

/**
 * The share of the matter (§10.2): no legend, only colour. Each material is a slice,
 * in the colour of its family (P48); its name, its part and its family on hover.
 */
export function RepartoCard(props: { composition: Composition | null; familyOf?: (key: string) => MaterialFamily | undefined }) {
  const [hover, setHover] = useState<number | null>(null);
  const comp = props.composition;
  const aromatic = comp ? comp.parts.filter((p) => !p.material.solvent) : [];
  const total = comp && !comp.aromaticUg.isZero() ? comp.aromaticUg : null;
  const segments = total
    ? aromatic.map((p) => {
        const family = props.familyOf?.(p.material.key);
        return {
          name: p.material.name,
          share: Number(p.massUg.div(total).toFixed(6)),
          color: family?.family.colour ?? NO_FAMILY,
          family: family?.family.name ?? texts.family.none,
        };
      })
    : [];

  let start = 0;
  const arcs = segments.map((s) => {
    const length = s.share * CIRCUMFERENCE;
    const arc = { ...s, dash: segments.length > 1 ? Math.max(length - GAP, 0.6) : length, offset: -start * CIRCUMFERENCE };
    start += s.share;
    return arc;
  });
  const hovered = hover === null ? null : arcs[hover];
  const aromaticOfBottle = comp && !comp.totalUg.isZero() ? formatPercent(comp.aromaticUg.div(comp.totalUg), 1) : "";

  return (
    <div className="card chart-card reparto">
      <div className="chart-head">
        <span className="chart-title">{c.reparto}</span>
      </div>
      <div className="donut">
        <svg width="150" height="150" viewBox="0 0 160 160" role="img" aria-label={c.reparto} onPointerLeave={() => setHover(null)}>
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#EFEEE9" strokeWidth="22" />
          <g transform="rotate(-90 80 80)">
            {arcs.map((a, i) => (
              <circle
                key={a.name + i}
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke={a.color}
                strokeWidth={hover === i ? 28 : 22}
                strokeDasharray={`${a.dash} ${CIRCUMFERENCE}`}
                strokeDashoffset={a.offset}
                onPointerEnter={() => setHover(i)}
                style={{ cursor: "pointer", transition: "stroke-width 120ms ease" }}
              />
            ))}
          </g>
          {hovered ? (
            <>
              <text x="80" y="73" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1D1D1B">
                {hovered.name.length > 18 ? `${hovered.name.slice(0, 17)}…` : hovered.name}
              </text>
              <text x="80" y="90" textAnchor="middle" fontSize="12" fill="#1D1D1B" className="num">
                {`${(hovered.share * 100).toFixed(1).replace(".", ",")} %`}
              </text>
              <text x="80" y="105" textAnchor="middle" fontSize="11" fill="#57564F">
                {c.ofAromatic}
              </text>
              <text x="80" y="119" textAnchor="middle" fontSize="10" fill="#57564F">
                {hovered.family}
              </text>
            </>
          ) : (
            <>
              <text x="80" y="73" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1D1D1B">
                {arcs.length ? c.aromatic : c.empty}
              </text>
              <text x="80" y="90" textAnchor="middle" fontSize="12" fill="#1D1D1B" className="num">
                {aromaticOfBottle}
              </text>
              <text x="80" y="105" textAnchor="middle" fontSize="11" fill="#57564F">
                {arcs.length ? c.ofBottle : ""}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

const HOURS: Array<[number, string]> = [
  [40, "0 h"],
  [100, "1 h"],
  [150, "2 h"],
  [225, "4 h"],
  [320, "8 h"],
  [400, "12 h"],
  [564, "24 h"],
];

/** The projection by hours (§10.2): one line per material, once each has its duration (frente 6). */
export function ProjectionCard() {
  return (
    <div className="card chart-card projection">
      <div className="chart-head">
        <span className="chart-title">{c.projection}</span>
        <span className="pill">{c.noData}</span>
      </div>
      <svg className="projection-axes" viewBox="0 0 576 156" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <line x1="40" y1="128" x2="564" y2="128" stroke="#D9D7CF" strokeWidth="1" />
        <line x1="40" y1="10" x2="40" y2="128" stroke="#D9D7CF" strokeWidth="1" />
        <text x="48" y="16" fontSize="11" fill="#57564F">
          {c.intensity}
        </text>
        {HOURS.map(([x, label]) => (
          <text key={label} x={x} y="146" fontSize="11" fill="#57564F" textAnchor={x === 564 ? "end" : "middle"}>
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/** What was used last, side to side, with its last dilution (§10.1, P7). */
export function Recents(props: { materials: readonly Material[]; onPick: (material: Material) => void }) {
  const t = texts.addBar;
  return (
    <div className="recents">
      <span className="label recents-label">{t.recent}</span>
      {props.materials.slice(0, 5).map((m) => {
        const last = prefsOf(m.key).last;
        const dilution = !last ? "" : last.percent.replace(",", ".") === "100" ? t.pure : t.diluted(last.percent, diluentMaterial(last.diluent)?.name ?? "?");
        return (
          <button type="button" key={m.key} className="recent-chip" tabIndex={-1} title={m.name} onClick={() => props.onPick(m)}>
            <span className="recent-name">{m.name}</span>
            <span className="num recent-dil">{dilution}</span>
          </button>
        );
      })}
    </div>
  );
}
