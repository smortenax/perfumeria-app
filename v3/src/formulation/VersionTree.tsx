import { type CSSProperties, type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import type { FormulaRecord } from "../db/formulas";
import { texts } from "../i18n/en";
import { lineage, nodeAfterKey, versionForest } from "./versionTree";

/** The geometry, in rem: a node, and the slot and level it takes with the space around it. */
const NODE_W = 10.5;
const NODE_H = 3.5;
const COL = NODE_W + 0.75;
const ROW = NODE_H + 1.75;
/** .version-scroll's padding on each side, in px: the room the focus ring needs. */
const RING = 6;

const dayOf = (iso: string | null) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
};

/**
 * The version tree of the open workbench (V3-77): each formula a node, and each version hanging from
 * the formula it was saved from, so the bench shows how its formulas came one from another. Pointing
 * at a node, or at its row in the list beside it (`active`), lights up the formulas it comes from.
 * A node opens its formula, as its row does. The keys are those of ARIA's tree view (versionTree.ts).
 */
export function VersionTree({
  formulas,
  bench,
  active,
  onActive,
  onOpen,
}: {
  formulas: readonly FormulaRecord[];
  bench: string;
  active: string | null;
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const t = texts.library;
  // How many slots fit across the panel, measured, so that the trees fill rows as wide as it is.
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(Number.POSITIVE_INFINITY);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setRoom((Math.max(el.clientWidth - 2 * RING, 0) / rem + (COL - NODE_W)) / COL);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const forest = versionForest(formulas, room);
  const byId = new Map(formulas.map((f) => [f.id, f]));
  const path = lineage(forest.nodes, active);
  const [focus, setFocus] = useState(0);
  const at = Math.min(focus, forest.nodes.length - 1);
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(forest.nodes[index].id);
      return;
    }
    const next = nodeAfterKey(e.key, index, forest.nodes);
    if (next === null) return;
    e.preventDefault();
    setFocus(next);
    refs.current[next]?.focus();
  };
  const width = Math.max(forest.width * COL - (COL - NODE_W), NODE_W);
  const height = Math.max((forest.height - 1) * ROW + NODE_H, NODE_H);
  const centre = (x: number) => x * COL + NODE_W / 2;
  return (
    <div className="version-scroll" ref={box}>
      <div
        className="version-tree"
        role="tree"
        aria-label={t.versionTree(bench)}
        style={{ width: `${width}rem`, height: `${height}rem` }}
        onMouseLeave={() => onActive(null)}
      >
        <svg className="version-lines" viewBox={`0 0 ${width} ${height}`} width={`${width}rem`} height={`${height}rem`} aria-hidden="true">
          {forest.nodes
            .filter((n) => n.parentId)
            .map((n) => {
              const parent = forest.nodes.find((p) => p.id === n.parentId)!;
              const [x1, y1, x2, y2] = [centre(parent.x), parent.y * ROW + NODE_H, centre(n.x), n.y * ROW];
              const bend = (y2 - y1) / 2;
              return (
                <path
                  key={n.id}
                  className={path.has(n.id) ? "on-path" : undefined}
                  d={`M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
        </svg>
        {forest.nodes.map((n, i) => {
          const f = byId.get(n.id)!;
          const detail = [dayOf(f.createdAt), ...f.markers.map((m) => texts.glossary.markers[m])].filter((x) => x).join(" · ");
          const style = { left: `${n.x * COL}rem`, top: `${n.y * ROW}rem`, width: `${NODE_W}rem`, height: `${NODE_H}rem` } as CSSProperties;
          return (
            <div
              key={n.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="treeitem"
              aria-level={n.level}
              aria-posinset={n.posInSet}
              aria-setsize={n.setSize}
              tabIndex={i === at ? 0 : -1}
              className={`tree-node${path.has(n.id) ? " on-path" : ""}${active === n.id ? " active" : ""}`}
              style={style}
              title={f.name}
              onClick={() => onOpen(n.id)}
              onKeyDown={(e) => onKey(e, i)}
              onFocus={() => {
                setFocus(i);
                onActive(n.id);
              }}
              onBlur={() => onActive(null)}
              onMouseEnter={() => onActive(n.id)}
            >
              <span className="tree-node-name">{f.name}</span>
              {detail && <span className="tree-node-detail">{detail}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
