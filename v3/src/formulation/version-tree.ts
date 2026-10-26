import type { FormulaRecord } from "../db/formulas";

/** One formula placed in the tree: `column` and `depth` are grid units, not pixels. */
export interface TreeNode {
  readonly formula: FormulaRecord;
  /** Its mother in the tree; null for a formula made from nothing (or whose mother is not in the list). */
  readonly parentId: string | null;
  readonly column: number;
  readonly depth: number;
}

export interface VersionTree {
  readonly nodes: readonly TreeNode[];
  readonly columns: number;
  readonly depths: number;
}

/** Oldest first: the history reads left to right. Without a date, by id (UUID v7 keeps the time). */
function byAge(a: FormulaRecord, b: FormulaRecord): number {
  const ta = a.createdAt ?? "";
  const tb = b.createdAt ?? "";
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * The formulas of a bench as a tree of versions (V3-77): every formula made from nothing is a root,
 * every version hangs below the one it was made from (`parentId`, P44). A leaf takes the next free
 * column; a mother sits centred over her versions. A version whose mother is not in the list (deleted,
 * or in another bench) starts a tree of its own, so nothing is hidden.
 */
export function layoutVersionTree(list: readonly FormulaRecord[]): VersionTree {
  const ids = new Set(list.map((f) => f.id));
  const children = new Map<string, FormulaRecord[]>();
  for (const f of list) if (f.parentId && ids.has(f.parentId)) children.set(f.parentId, [...(children.get(f.parentId) ?? []), f]);
  const nodes: TreeNode[] = [];
  let next = 0;
  let depths = 0;
  const seen = new Set<string>();
  const place = (f: FormulaRecord, depth: number): number => {
    seen.add(f.id);
    depths = Math.max(depths, depth + 1);
    // A cycle cannot be written (the database forbids only the formula being its own mother), but a
    // copy out of sync could hold one for a moment: a formula already placed is not placed again.
    const kids = [...(children.get(f.id) ?? [])].filter((c) => !seen.has(c.id)).sort(byAge);
    const at = nodes.length;
    nodes.push({ formula: f, parentId: f.parentId && ids.has(f.parentId) ? f.parentId : null, column: 0, depth });
    let column: number;
    if (kids.length === 0) column = next++;
    else {
      const cols = kids.map((c) => place(c, depth + 1));
      column = (cols[0] + cols[cols.length - 1]) / 2;
    }
    nodes[at] = { ...nodes[at], column };
    return column;
  };
  for (const root of list.filter((f) => !f.parentId || !ids.has(f.parentId)).sort(byAge)) place(root, 0);
  // What is left is only a cycle: shown from its oldest, so it does not vanish.
  for (const f of [...list].sort(byAge)) if (!seen.has(f.id)) place(f, 0);
  return { nodes, columns: next, depths };
}

/** The formula and every mother above it, up to its root: what lights up when one is pointed at. */
export function lineage(tree: VersionTree, id: string | null): Set<string> {
  const out = new Set<string>();
  const byId = new Map(tree.nodes.map((n) => [n.formula.id, n]));
  for (let n = id ? byId.get(id) : undefined; n && !out.has(n.formula.id); n = n.parentId ? byId.get(n.parentId) : undefined) out.add(n.formula.id);
  return out;
}
