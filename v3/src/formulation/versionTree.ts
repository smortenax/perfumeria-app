/**
 * The version tree of a workbench (V3-77): each formula a node, each version hanging from the formula
 * it was saved from (formulas.parent_id). Each tree grows downwards, from the first formula to its
 * latest versions, and the trees of a bench sit side by side, in rows as wide as the room they have,
 * so the space beside the list is used and a bench of many formulas does not become one long column.
 *
 * The layout is in slots and levels, not pixels: a node's x is its slot and its y its level; the
 * screen turns them into rem (VersionTree.tsx). A parent sits centred over its first and last version,
 * and the branches of a tree are set as close as their levels allow (a tidy tree): a branch may tuck
 * under its neighbour's where that one stops, so a long history does not widen the tree.
 */

export interface TreeFormula {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly createdAt: string | null;
}

export interface TreeNode {
  readonly id: string;
  /** The formula it was versioned from, when it is in this tree. */
  readonly parentId: string | null;
  readonly x: number;
  readonly y: number;
  /** For the tree's ARIA: 1 for a first formula; its place among its siblings, from 1. */
  readonly level: number;
  readonly posInSet: number;
  readonly setSize: number;
}

export interface Forest {
  /** In reading order: each tree from its first formula down, first child first (the order of the arrow keys). */
  readonly nodes: readonly TreeNode[];
  readonly width: number;
  readonly height: number;
}

/** The space between two trees of the bench: across, in slots; between two rows of trees, in levels. */
export const TREE_GAP_X = 0.2;
export const TREE_GAP_Y = 0.35;

/**
 * Roots in the order given (the library's, by name), so the tree and the list read alike; versions in
 * the order they were made, the oldest first, because the tree is the history of the formula. A
 * formula whose parent is not in the list (deleted, or out of the search) starts a tree of its own.
 * `room`, in slots: how wide a row of trees may be. A tree wider than that takes a row of its own.
 */
export function versionForest(formulas: readonly TreeFormula[], room = Number.POSITIVE_INFINITY): Forest {
  const ids = new Set(formulas.map((f) => f.id));
  const children = new Map<string, TreeFormula[]>();
  for (const f of formulas) if (f.parentId && ids.has(f.parentId)) children.set(f.parentId, [...(children.get(f.parentId) ?? []), f]);
  const made = (a: TreeFormula, b: TreeFormula) =>
    (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.name.localeCompare(b.name, "es") || (a.id < b.id ? -1 : 1);
  for (const list of children.values()) list.sort(made);
  // A loop of parents (which the database should never hold) has no first formula: its first one in the
  // list starts it, so that no formula is left out of the tree.
  const roots = formulas.filter((f) => !f.parentId || !ids.has(f.parentId));
  const placed = new Set<string>();

  const nodes: TreeNode[] = [];
  // The row of trees being filled: where the next tree starts across, its top, and its deepest tree.
  let left = 0;
  let top = 0;
  let rowDepth = 0;
  let width = 0;
  const grow = (root: TreeFormula, posInSet: number) => {
    const first = nodes.length;
    // Lays out a branch with its root at x 0 and returns its contour: the leftmost and rightmost x at
    // each level below the root (index 0, the root). Each version's branch goes as far left as the one
    // before lets it, level by level, one slot apart; the root, centred over the first and last.
    const place = (f: TreeFormula, parentId: string | null, level: number, pos: number, size: number) => {
      placed.add(f.id);
      nodes.push({ id: f.id, parentId, x: 0, y: level - 1, level, posInSet: pos, setSize: size });
      const kids = (children.get(f.id) ?? []).filter((c) => !placed.has(c.id));
      const branches: { start: number; end: number; offset: number }[] = [];
      let leftEdge: number[] = [];
      let rightEdge: number[] = [];
      kids.forEach((c, i) => {
        const start = nodes.length;
        const edge = place(c, f.id, level + 1, i + 1, kids.length);
        let offset = 0;
        if (i > 0) offset = Math.max(...edge.left.slice(0, rightEdge.length).map((l, d) => rightEdge[d] - l + 1));
        branches.push({ start, end: nodes.length, offset });
        edge.left.forEach((l, d) => {
          leftEdge[d] = d < leftEdge.length ? leftEdge[d] : l + offset;
          rightEdge[d] = edge.right[d] + offset;
        });
      });
      const mid = branches.length ? (branches[0].offset + branches[branches.length - 1].offset) / 2 : 0;
      for (const b of branches) for (let i = b.start; i < b.end; i++) nodes[i] = { ...nodes[i], x: nodes[i].x + b.offset - mid };
      leftEdge = leftEdge.map((l) => l - mid);
      rightEdge = rightEdge.map((r) => r - mid);
      return { left: [0, ...leftEdge], right: [0, ...rightEdge] };
    };
    const edge = place(root, null, 1, posInSet, 0);
    const from = Math.min(...edge.left);
    const slots = Math.max(...edge.right) - from + 1;
    if (left > 0 && left + slots > room) {
      top += rowDepth + TREE_GAP_Y;
      left = 0;
      rowDepth = 0;
    }
    for (let i = first; i < nodes.length; i++) nodes[i] = { ...nodes[i], x: nodes[i].x - from + left, y: nodes[i].y + top };
    width = Math.max(width, left + slots);
    left += slots + TREE_GAP_X;
    rowDepth = Math.max(rowDepth, edge.left.length);
  };
  let count = 0;
  for (const root of roots) grow(root, ++count);
  for (const f of formulas) if (!placed.has(f.id)) grow(f, ++count);
  const out = nodes.map((n) => (n.level === 1 ? { ...n, setSize: count } : n));
  return { nodes: out, width, height: out.length ? top + rowDepth : 0 };
}

/** The formula and those it comes from, up to the first: what lights up when one is pointed at. */
export function lineage(nodes: readonly TreeNode[], id: string | null): ReadonlySet<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = new Set<string>();
  for (let n = id ? byId.get(id) : undefined; n && !out.has(n.id); n = n.parentId ? byId.get(n.parentId) : undefined) out.add(n.id);
  return out;
}

/**
 * Where a key moves in the tree, as ARIA's tree view pattern asks for a tree whose nodes are all open:
 * down and up go to the next and previous node in reading order, right to the first version, left to
 * the formula it came from, Home and End to the ends. Null: the key moves nothing.
 */
export function nodeAfterKey(key: string, at: number, nodes: readonly TreeNode[]): number | null {
  if (nodes.length === 0) return null;
  const from = at < 0 || at >= nodes.length ? 0 : at;
  const here = nodes[from];
  switch (key) {
    case "ArrowDown":
      return Math.min(from + 1, nodes.length - 1);
    case "ArrowUp":
      return Math.max(from - 1, 0);
    case "ArrowRight": {
      const child = nodes.findIndex((n) => n.parentId === here.id);
      return child < 0 ? from : child;
    }
    case "ArrowLeft": {
      const parent = nodes.findIndex((n) => n.id === here.parentId);
      return parent < 0 ? from : parent;
    }
    case "Home":
      return 0;
    case "End":
      return nodes.length - 1;
    default:
      return null;
  }
}
