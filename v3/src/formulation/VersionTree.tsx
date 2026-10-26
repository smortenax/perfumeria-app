import type { KeyboardEvent } from "react";
import type { FormulaRecord } from "../db/formulas";
import { texts } from "../i18n/en";
import { layoutVersionTree, lineage } from "./version-tree";

const COLUMN = 112;
const ROW = 84;
const PAD = 20;
const RADIUS = 9;
/** What fits under a node in one column; the full name is in its tooltip and its label. */
const LABEL = 14;

const short = (name: string) => (name.length > LABEL ? `${name.slice(0, LABEL - 1)}…` : name);

/**
 * The open bench's formulas as a tree of versions (V3-77): each formula a node, each version hanging
 * from the one it was made from, so the history of the changes reads from the top down. Pointing at a
 * node, or at its row in the list, lights it up with its mothers; a node opens its formula.
 */
export function VersionTree({
  formulas,
  pointed,
  onPoint,
  onOpen,
}: {
  formulas: readonly FormulaRecord[];
  pointed: string | null;
  onPoint: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const t = texts.library.tree;
  const tree = layoutVersionTree(formulas);
  if (tree.nodes.length === 0) return null;
  const lit = lineage(tree, pointed);
  const x = (column: number) => PAD + column * COLUMN + COLUMN / 2;
  const y = (depth: number) => PAD + depth * ROW;
  const width = tree.columns * COLUMN + PAD * 2;
  const height = (tree.depths - 1) * ROW + PAD * 2 + 20;
  const byId = new Map(tree.nodes.map((n) => [n.formula.id, n]));
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onOpen(id);
  };
  return (
    <figure className="version-tree" aria-label={t.title}>
      <figcaption>
        <span className="version-tree-title">{t.title}</span>
        <span className="hint">{t.hint}</span>
      </figcaption>
      <div className="version-tree-scroll">
        {/* It shrinks to fit its panel, down to 80 %; past that, the panel scrolls sideways. */}
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: width, minWidth: width * 0.8 }} role="list">
          {tree.nodes.map((n) => {
            const mother = n.parentId ? byId.get(n.parentId) : undefined;
            if (!mother) return null;
            const x1 = x(mother.column);
            const y1 = y(mother.depth) + RADIUS;
            const x2 = x(n.column);
            const y2 = y(n.depth) - RADIUS;
            const mid = (y1 + y2) / 2;
            return (
              <path
                key={`e-${n.formula.id}`}
                className={`version-edge${lit.has(n.formula.id) ? " lit" : ""}`}
                d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
              />
            );
          })}
          {tree.nodes.map((n) => {
            const f = n.formula;
            const mother = n.parentId ? byId.get(n.parentId)?.formula : undefined;
            const label = mother ? t.nodeVersion(f.name, mother.name) : t.nodeRoot(f.name);
            return (
              <g
                key={f.id}
                role="listitem"
                tabIndex={0}
                aria-label={label}
                className={`version-node${n.parentId ? "" : " root"}${lit.has(f.id) ? " lit" : ""}${f.id === pointed ? " pointed" : ""}`}
                transform={`translate(${x(n.column)} ${y(n.depth)})`}
                onClick={() => onOpen(f.id)}
                onKeyDown={(e) => onKey(e, f.id)}
                onMouseEnter={() => onPoint(f.id)}
                onMouseLeave={() => onPoint(null)}
                onFocus={() => onPoint(f.id)}
                onBlur={() => onPoint(null)}
              >
                <title>{label}</title>
                {/* A wider target than the dot, for the pointer and the finger. */}
                <rect className="version-hit" x={-COLUMN / 2 + 4} y={-RADIUS - 8} width={COLUMN - 8} height={RADIUS * 2 + 34} rx={8} />
                <circle r={RADIUS} />
                <text y={RADIUS + 16} textAnchor="middle">
                  {short(f.name)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
