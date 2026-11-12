// Copied from designboard c0e1d34 (src/core/composition.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { clampStoredParams, type Library, type Params } from "./manifest";
import { migrateV1, type CompositionV1 } from "./migrate";
import { RUNTIME_VERSION } from "./runtimeVersion";

/**
 * The composition file: which component sits on which screen, inside which container, where,
 * and with which params. This is the only thing the board writes. An app reads it at start-up
 * (see `runtime/`), so moving a box or changing an icon never rewrites the component's own code.
 *
 * Version 2 is a layer tree, like Figma's and Penpot's: a screen holds layers, and containers
 * and groups hold layers of their own. Every layer's x/y is relative to its parent's top-left.
 */

export type HAnchor = "left" | "center" | "right" | "stretch" | "scale";
export type VAnchor = "top" | "center" | "bottom" | "stretch" | "scale";

/** How a layer gets its size on one axis, as in Figma's auto layout. */
export type SizeMode =
  /** Its own w or h. */
  | "fixed"
  /** As small as its content: a container's children plus padding. A component keeps its own size. */
  | "hug"
  /** Takes the room its flex parent has left on the main axis, or the parent's whole cross axis. */
  | "fill";

export interface AxisSizing {
  mode: SizeMode;
  min?: number;
  max?: number;
}

/** Where children sit on the cross axis of a flex container. Stretching is a child's `fill` sizing. */
export type Align = "start" | "center" | "end";
export type Justify = "start" | "center" | "end" | "space-between";

/** One column or row of a grid: a share of the room left (`fr`), a fixed size (`px`), or as big as its content (`auto`). */
export type GridTrack = { unit: "fr" | "px"; value: number } | { unit: "auto" };

/**
 * Children sit in the cells of a grid, laid out by the browser's CSS Grid. Gaps and padding are
 * space tokens. A `fr` track never grows past its share because of what is inside it (it is
 * `minmax(0, Nfr)` in CSS), so a child larger than its cell overflows instead of pushing the others.
 */
export interface GridLayout {
  mode: "grid";
  columns: GridTrack[];
  /** Rows given ahead. Children that do not fit get new rows sized to their content; with none, every row is made that way. */
  rows: GridTrack[];
  columnGap: string;
  rowGap: string;
  padding: string;
  /** Where children sit across their cell (horizontally). Filling the cell is a child's `fill` sizing. */
  justifyItems: Align;
  /** Where children sit down their cell (vertically). */
  alignItems: Align;
  /** How children without a cell of their own fill the grid: along rows (then down) or along columns (then across). */
  flow: "row" | "column";
}

export type Layout =
  | { mode: "free" }
  /** Children follow one another, laid out by the browser's flexbox. Gap and padding are space tokens. */
  | { mode: "flex"; direction: "row" | "column"; gap: string; padding: string; align: Align; justify: Justify; wrap: boolean }
  | GridLayout;

export type LayoutMode = Layout["mode"];

/**
 * Where a child of a grid sits. `column` and `row` are 1-based start lines, as in CSS; leaving
 * one out lets the grid place it. Spans default to 1.
 */
export interface GridCell {
  column?: number;
  row?: number;
  columnSpan?: number;
  rowSpan?: number;
}

interface LayerBase {
  id: string;
  /** Name shown in the layers panel; also the name an Illustrator layer matches. */
  name: string;
  /** Position relative to the parent's top-left. Used by free parents and by absolute children. */
  x: number;
  y: number;
  /** Own size; the size used when sizing is `fixed`. */
  w: number;
  h: number;
  /** What the layer keeps when its parent changes size, like Figma's constraints. */
  anchor: { h: HAnchor; v: VAnchor };
  sizing: { w: AxisSizing; h: AxisSizing };
  /** In a flex parent: placed at x/y like in a free parent, out of the flow. */
  absolute?: boolean;
  /** In a flex parent: overrides the parent's `align` on the cross axis. In a grid parent: where it sits down its cell. */
  alignSelf?: Align;
  /** In a grid parent: where it sits across its cell, overriding the grid's `justifyItems`. */
  justifySelf?: Align;
  /** In a grid parent: its cell and how many columns and rows it spans. None means placed by the grid, one cell. */
  cell?: GridCell;
  hidden?: boolean;
  locked?: boolean;
}

/** A component from the library, drawn by its own code with these params. */
export interface ComponentNode extends LayerBase {
  kind: "component";
  /** Component type in the library. */
  type: string;
  params: Params;
}

/** A box with its own layout, like a Figma frame or a Penpot board. */
export interface ContainerNode extends LayerBase {
  kind: "container";
  layout: Layout;
  children: LayerNode[];
  /** Colour token path for its ground; none means transparent. */
  background?: string;
  /** Radius token path. */
  radius?: string;
  /** Cut off children that leave the box. */
  clip: boolean;
}

/** Layers kept together. A group has no layout: its children sit where they are, and its size is their bounds. */
export interface GroupNode extends LayerBase {
  kind: "group";
  children: LayerNode[];
}

export type LayerNode = ComponentNode | ContainerNode | GroupNode;
export type ParentNode = ContainerNode | GroupNode;

/** Guide lines a person pulled out of the rulers, in the screen's own pixels: `x` are vertical lines, `y` horizontal ones. Layers snap to them; apps ignore them. */
export interface ArtboardGuides {
  x: number[];
  y: number[];
}

export interface Artboard {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Position on the board, so artboards can sit side by side. */
  x: number;
  y: number;
  /** Colour token path for the screen's ground. */
  background: string;
  /** The app route this screen stands for, when it came from the screen map (e.g. "#material/:id"). */
  route?: string;
  /** Token mode the screen draws in (e.g. "dark"). Absent means the base mode, light. */
  mode?: string;
  layout: Layout;
  children: LayerNode[];
  /** Ruler guides; absent when there are none. */
  guides?: ArtboardGuides;
  /**
   * False lets what the screen holds show past its edges, as a bar whose chips grow above it or
   * whose tooltip rises over the page. Absent means clipped, as before.
   */
  clip?: boolean;
  /**
   * The narrowest app width this screen is drawn at, for an app that keeps one screen per size
   * (`pickArtboard`). Absent means the screen's own width.
   */
  minWidth?: number;
}

export interface Composition {
  version: 2;
  name: string;
  /** Which token set the paths refer to, e.g. "perfumeria". */
  tokens: string;
  artboards: Artboard[];
  /**
   * The runtime version (`RUNTIME_VERSION`) of the board that wrote the file. An app compares it
   * with its own copy's (`runtimeMismatch`). Files from before it existed have none.
   */
  runtime?: string;
}

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MIN_SIZE = 8;
export const FIXED: { w: AxisSizing; h: AxisSizing } = { w: { mode: "fixed" }, h: { mode: "fixed" } };

export function snap(value: number, grid: number): number {
  return grid > 1 ? Math.round(value / grid) * grid : Math.round(value);
}

let counter = 0;
export function newId(prefix = "n"): string {
  counter = (counter + 1) % 1e6;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function hasChildren(n: LayerNode): n is ParentNode {
  return n.kind === "container" || n.kind === "group";
}

export function isComponent(n: LayerNode | null | undefined): n is ComponentNode {
  return !!n && n.kind === "component";
}

export function defaultFlex(direction: "row" | "column" = "column"): Extract<Layout, { mode: "flex" }> {
  return { mode: "flex", direction, gap: "space.gap", padding: "space.inset", align: "start", justify: "start", wrap: false };
}

export function defaultGrid(): GridLayout {
  return {
    mode: "grid",
    columns: [
      { unit: "fr", value: 1 },
      { unit: "fr", value: 1 },
    ],
    rows: [],
    columnGap: "space.gap",
    rowGap: "space.gap",
    padding: "space.inset",
    justifyItems: "start",
    alignItems: "start",
    flow: "row",
  };
}

/** A layout of another mode that keeps what the two share: the gap and the padding. */
export function changeLayoutMode(layout: Layout, mode: LayoutMode): Layout {
  if (layout.mode === mode) return layout;
  if (mode === "free") return { mode: "free" };
  const gap = layout.mode === "flex" ? layout.gap : layout.mode === "grid" ? layout.columnGap : undefined;
  const padding = layout.mode === "free" ? undefined : layout.padding;
  if (mode === "flex") {
    const d = defaultFlex();
    return { ...d, gap: gap ?? d.gap, padding: padding ?? d.padding };
  }
  const d = defaultGrid();
  return { ...d, columnGap: gap ?? d.columnGap, rowGap: gap ?? d.rowGap, padding: padding ?? d.padding };
}

// ---------------------------------------------------------------------------------------------
// Walking the tree

/** Calls `fn` on every layer, parents before children, with the chain of parent ids above it. */
export function walk(children: readonly LayerNode[], fn: (n: LayerNode, parents: string[]) => void, parents: string[] = []): void {
  for (const n of children) {
    fn(n, parents);
    if (hasChildren(n)) walk(n.children, fn, [...parents, n.id]);
  }
}

/** Every layer of a list, at every depth, parents first. */
export function allNodes(children: readonly LayerNode[]): LayerNode[] {
  const out: LayerNode[] = [];
  walk(children, (n) => out.push(n));
  return out;
}

export interface Found {
  node: LayerNode;
  /** The parent layer, or null when the layer sits on the screen itself. */
  parent: ParentNode | null;
  /** The list the layer is in. */
  siblings: LayerNode[];
  index: number;
}

export function findNode(board: Artboard, id: string): Found | null {
  const search = (list: LayerNode[], parent: ParentNode | null): Found | null => {
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (n.id === id) return { node: n, parent, siblings: list, index: i };
      if (hasChildren(n)) {
        const hit = search(n.children, n);
        if (hit) return hit;
      }
    }
    return null;
  };
  return search(board.children, null);
}

/** Ids from the screen down to the layer, the layer last. Empty when it is not on the screen. */
export function pathTo(board: Artboard, id: string): string[] {
  let out: string[] = [];
  walk(board.children, (n, parents) => {
    if (n.id === id) out = [...parents, n.id];
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Changing the tree. Every function returns a new composition and leaves the old one alone.

export type NodePatch = Partial<Omit<ComponentNode, "kind" | "id">> &
  Partial<Omit<ContainerNode, "kind" | "id" | "children">> & { children?: LayerNode[] };

function mapTree(list: LayerNode[], fn: (n: LayerNode) => LayerNode): LayerNode[] {
  return list.map((n) => {
    const m = fn(n);
    return hasChildren(m) ? { ...m, children: mapTree(m.children, fn) } : m;
  });
}

export function updateBoard(c: Composition, boardId: string, patch: Partial<Artboard>): Composition {
  return { ...c, artboards: c.artboards.map((b) => (b.id === boardId ? { ...b, ...patch } : b)) };
}

function mapBoard(c: Composition, boardId: string, fn: (b: Artboard) => Artboard): Composition {
  return { ...c, artboards: c.artboards.map((b) => (b.id === boardId ? fn(b) : b)) };
}

/** Changes one layer at any depth. `kind` and `id` cannot be patched. */
export function updateNode(c: Composition, boardId: string, nodeId: string, patch: NodePatch): Composition {
  return mapBoard(c, boardId, (b) => ({
    ...b,
    children: mapTree(b.children, (n) => (n.id === nodeId ? ({ ...n, ...patch, kind: n.kind, id: n.id } as LayerNode) : n)),
  }));
}

/** Replaces the children of a layer, or of the screen when `parentId` is null. */
export function setChildren(c: Composition, boardId: string, parentId: string | null, children: LayerNode[]): Composition {
  if (parentId === null) return mapBoard(c, boardId, (b) => ({ ...b, children }));
  return mapBoard(c, boardId, (b) => ({
    ...b,
    children: mapTree(b.children, (n) => (n.id === parentId && hasChildren(n) ? { ...n, children } : n)),
  }));
}

export function childrenOf(board: Artboard, parentId: string | null): LayerNode[] {
  if (parentId === null) return board.children;
  const f = findNode(board, parentId);
  return f && hasChildren(f.node) ? f.node.children : [];
}

/** Puts a layer into a parent (null = the screen) at `index`, or on top when no index is given. */
export function insertNode(c: Composition, boardId: string, parentId: string | null, node: LayerNode, index?: number): Composition {
  const board = c.artboards.find((b) => b.id === boardId);
  if (!board) return c;
  const list = childrenOf(board, parentId);
  const i = index === undefined ? list.length : Math.max(0, Math.min(list.length, index));
  return setChildren(c, boardId, parentId, [...list.slice(0, i), node, ...list.slice(i)]);
}

export function removeNode(c: Composition, boardId: string, nodeId: string): Composition {
  const strip = (list: LayerNode[]): LayerNode[] =>
    list.filter((n) => n.id !== nodeId).map((n) => (hasChildren(n) ? { ...n, children: strip(n.children) } : n));
  return mapBoard(c, boardId, (b) => ({ ...b, children: strip(b.children) }));
}

/**
 * Moves a layer to another parent (null = the screen) at `index`. With the screen's current
 * `frames` (from `layoutTree`), the layer keeps its place on screen when it lands in a free parent.
 * A layer cannot move into itself or into one of its own children.
 */
export function moveNode(
  c: Composition,
  boardId: string,
  nodeId: string,
  parentId: string | null,
  index?: number,
  frames?: ReadonlyMap<string, Frame>,
): Composition {
  const board = c.artboards.find((b) => b.id === boardId);
  const found = board && findNode(board, nodeId);
  if (!board || !found) return c;
  if (parentId !== null && pathTo(board, parentId).includes(nodeId)) return c;
  let node = found.node;
  const target = parentId === null ? null : findNode(board, parentId)?.node;
  if (parentId !== null && (!target || !hasChildren(target))) return c;
  const own = frames?.get(nodeId);
  const origin = parentId === null ? { x: 0, y: 0 } : frames?.get(parentId);
  if (own && origin) node = { ...node, x: Math.round(own.x - origin.x), y: Math.round(own.y - origin.y) };
  // Removing first shifts the index when the layer moves later within the same list.
  const sameList = (found.parent?.id ?? null) === parentId;
  // A cell belongs to the grid it was set in; in another parent the layer starts without one.
  if (!sameList && node.cell) {
    const { cell: _cell, ...rest } = node;
    node = rest as LayerNode;
  }
  const at = index !== undefined && sameList && found.index < index ? index - 1 : index;
  return insertNode(removeNode(c, boardId, nodeId), boardId, parentId, node, at);
}

/** In a flex parent, dropping a layer at a point moves it to the slot that point falls in. */
export function reorderTo<T extends { id: string }>(nodes: readonly T[], id: string, frames: ReadonlyMap<string, Frame>, point: number, column: boolean): T[] {
  const moving = nodes.find((n) => n.id === id);
  if (!moving) return [...nodes];
  const rest = nodes.filter((n) => n.id !== id);
  let index = rest.length;
  for (let i = 0; i < rest.length; i++) {
    const f = frames.get(rest[i].id);
    if (!f) continue;
    const mid = column ? f.y + f.h / 2 : f.x + f.w / 2;
    if (point < mid) {
      index = i;
      break;
    }
  }
  return [...rest.slice(0, index), moving, ...rest.slice(index)];
}

/** A deep copy of a layer with fresh ids for it and everything inside it. */
export function cloneNode(n: LayerNode): LayerNode {
  if (n.kind === "component") return { ...n, id: newId(), params: { ...n.params } };
  return { ...n, id: newId(), children: n.children.map(cloneNode) } as LayerNode;
}

// ---------------------------------------------------------------------------------------------
// Anchors

/**
 * Where a layer lands when its parent goes from `from` to `to`, following its anchors.
 * - left/top: keeps the distance to the left/top edge
 * - right/bottom: keeps the distance to the right/bottom edge
 * - center: keeps its offset from the middle
 * - stretch: keeps both margins, so its size changes
 * - scale: keeps its position and size as a share of the parent
 */
export function reflow(frame: Frame, anchor: LayerBase["anchor"], from: { w: number; h: number }, to: { w: number; h: number }): Frame {
  const axis = (pos: number, size: number, a: "start" | "center" | "end" | "stretch" | "scale", fromLen: number, toLen: number) => {
    switch (a) {
      case "start":
        return { pos, size };
      case "end":
        return { pos: toLen - (fromLen - pos - size) - size, size };
      case "center":
        return { pos: toLen / 2 + (pos + size / 2 - fromLen / 2) - size / 2, size };
      case "stretch": {
        const right = fromLen - pos - size;
        return { pos, size: Math.max(MIN_SIZE, toLen - pos - right) };
      }
      case "scale": {
        const k = fromLen > 0 ? toLen / fromLen : 1;
        return { pos: pos * k, size: Math.max(MIN_SIZE, size * k) };
      }
    }
  };
  const h = { left: "start", center: "center", right: "end", stretch: "stretch", scale: "scale" } as const;
  const v = { top: "start", center: "center", bottom: "end", stretch: "stretch", scale: "scale" } as const;
  const X = axis(frame.x, frame.w, h[anchor.h], from.w, to.w);
  const Y = axis(frame.y, frame.h, v[anchor.v], from.h, to.h);
  return { x: Math.round(X.pos), y: Math.round(Y.pos), w: Math.round(X.size), h: Math.round(Y.size) };
}

/** Moves every layer of a list by its anchors when its parent's box goes from `from` to `to`, at every depth. */
export function reflowChildren(list: readonly LayerNode[], from: { w: number; h: number }, to: { w: number; h: number }, freshIds = false): LayerNode[] {
  return list.map((m) => {
    // A group's size is its children's bounds, whatever its stored w and h say.
    const n = m.kind === "group" ? { ...m, ...storedBounds(m.children) } : m;
    const f = from.w === to.w && from.h === to.h ? { x: n.x, y: n.y, w: n.w, h: n.h } : reflow(n, n.anchor, from, to);
    const id = freshIds ? newId() : n.id;
    if (n.kind === "component") return { ...n, ...f, id, params: { ...n.params } };
    return { ...n, ...f, id, children: reflowChildren(n.children, { w: n.w, h: n.h }, { w: f.w, h: f.h }, freshIds) } as LayerNode;
  });
}

function storedBounds(children: readonly LayerNode[]): { w: number; h: number } {
  let w = MIN_SIZE;
  let h = MIN_SIZE;
  for (const c of children) {
    if (c.hidden) continue;
    const s = c.kind === "group" ? storedBounds(c.children) : c;
    w = Math.max(w, c.x + s.w);
    h = Math.max(h, c.y + s.h);
  }
  return { w, h };
}

/** A copy of an artboard at another size, every layer moved by its anchors and given a new id. */
export function adaptArtboard(board: Artboard, size: { width: number; height: number }, name: string, at: { x: number; y: number }): Artboard {
  return {
    ...board,
    id: newId("a"),
    name,
    width: size.width,
    height: size.height,
    x: at.x,
    y: at.y,
    guides: undefined, // guides belong to the size they were drawn for
    minWidth: undefined, // and so does the width it is picked from
    children: reflowChildren(board.children, { w: board.width, h: board.height }, { w: size.width, h: size.height }, true),
  };
}

// ---------------------------------------------------------------------------------------------
// Layout

type Px = (tokenPath: string) => number;
type FlexLayout = Extract<Layout, { mode: "flex" }>;

const clamp = (v: number, s: AxisSizing) => Math.max(s.min ?? MIN_SIZE, Math.min(s.max ?? Infinity, v));

/** A layer's natural size: its own for fixed, its content's for hug. Fill is decided by the parent. */
function naturalSize(n: LayerNode, px: Px): { w: number; h: number } {
  const content = n.kind === "group" ? groupBounds(n.children, px) : n.kind === "container" ? contentSize(n.layout, n.children, px) : null;
  const pick = (axis: "w" | "h") => {
    const s = n.sizing[axis];
    if (n.kind === "group") return content![axis];
    if (s.mode === "hug" && content) return clamp(content[axis], s);
    return clamp(n[axis], s);
  };
  return { w: pick("w"), h: pick("h") };
}

/** Bounds of a group's children, measured from the group's own origin. */
function groupBounds(children: readonly LayerNode[], px: Px): { w: number; h: number } {
  let w = 0;
  let h = 0;
  for (const c of children) {
    if (c.hidden) continue;
    const s = naturalSize(c, px);
    w = Math.max(w, c.x + s.w);
    h = Math.max(h, c.y + s.h);
  }
  return { w: Math.max(w, MIN_SIZE), h: Math.max(h, MIN_SIZE) };
}

/** The size a container needs to hug its children. */
function contentSize(layout: Layout, children: readonly LayerNode[], px: Px): { w: number; h: number } {
  if (layout.mode === "free") return groupBounds(children, px);
  if (layout.mode === "grid") {
    const pad = px(layout.padding);
    const g = gridGeometry(layout, children, { w: null, h: null }, px);
    const span = (tracks: readonly TrackLine[]) => (tracks.length ? tracks[tracks.length - 1].start + tracks[tracks.length - 1].size : 0);
    return { w: span(g.columns) + pad * 2, h: span(g.rows) + pad * 2 };
  }
  const pad = px(layout.padding);
  const gap = px(layout.gap);
  const column = layout.direction === "column";
  const flow = children.filter((c) => !c.hidden && !c.absolute);
  let main = 0;
  let cross = 0;
  for (const c of flow) {
    const s = naturalSize(c, px);
    const m = column ? s.h : s.w;
    const mainSizing = column ? c.sizing.h : c.sizing.w;
    main += mainSizing.mode === "fill" ? (mainSizing.min ?? 0) : m;
    cross = Math.max(cross, column ? s.w : s.h);
  }
  main += gap * Math.max(0, flow.length - 1) + pad * 2;
  cross += pad * 2;
  return column ? { w: cross, h: main } : { w: main, h: cross };
}

function layoutFlex(layout: FlexLayout, children: readonly LayerNode[], box: Frame, px: Px, out: Map<string, Frame>) {
  const pad = px(layout.padding);
  const gap = px(layout.gap);
  const column = layout.direction === "column";
  const innerMain = (column ? box.h : box.w) - pad * 2;
  const innerCross = (column ? box.w : box.h) - pad * 2;
  const visible = children.filter((c) => !c.hidden);

  for (const c of visible.filter((c) => c.absolute)) {
    const s = naturalSize(c, px);
    place(c, { x: box.x + c.x, y: box.y + c.y, w: s.w, h: s.h }, px, out);
  }

  const items = visible
    .filter((c) => !c.absolute)
    .map((c) => {
      const s = naturalSize(c, px);
      const mainS = column ? c.sizing.h : c.sizing.w;
      const crossS = column ? c.sizing.w : c.sizing.h;
      return {
        node: c,
        mainS,
        main: mainS.mode === "fill" ? clamp(0, mainS) : column ? s.h : s.w,
        cross: crossS.mode === "fill" ? clamp(innerCross, crossS) : column ? s.w : s.h,
      };
    });

  // Lines: one unless the container wraps and the children do not fit.
  const lines: (typeof items)[] = [];
  let line: typeof items = [];
  let used = 0;
  for (const it of items) {
    const need = (line.length ? gap : 0) + it.main;
    if (layout.wrap && line.length && used + need > innerMain) {
      lines.push(line);
      line = [];
      used = 0;
    }
    used += (line.length ? gap : 0) + it.main;
    line.push(it);
  }
  if (line.length) lines.push(line);

  let crossCursor = pad;
  for (const ln of lines) {
    // Fill children share the room the others leave, as CSS flex-grow does from a zero basis:
    // one whose min or max cuts its share is frozen there and the rest is shared again.
    const gaps = gap * Math.max(0, ln.length - 1);
    let room = innerMain - gaps - ln.filter((it) => it.mainS.mode !== "fill").reduce((s, it) => s + it.main, 0);
    let open = ln.filter((it) => it.mainS.mode === "fill");
    while (open.length) {
      const share = room / open.length;
      const cut = open.filter((it) => clamp(share, it.mainS) !== share);
      if (!cut.length) {
        for (const it of open) it.main = share;
        break;
      }
      for (const it of cut) {
        it.main = clamp(share, it.mainS);
        room -= it.main;
      }
      open = open.filter((it) => !cut.includes(it));
    }
    const free = Math.max(0, innerMain - gaps - ln.reduce((s, it) => s + it.main, 0));
    let cursor = pad;
    let step = gap;
    if (layout.justify === "center") cursor += free / 2;
    else if (layout.justify === "end") cursor += free;
    else if (layout.justify === "space-between" && ln.length > 1) step = gap + free / (ln.length - 1);

    // A wrapping container is multi-line in CSS even with one line: each line is as tall as its tallest child.
    const lineCross = layout.wrap ? Math.max(...ln.map((it) => it.cross)) : innerCross;
    for (const it of ln) {
      const align = it.node.alignSelf ?? layout.align;
      const room = lineCross - it.cross;
      const offset = align === "center" ? room / 2 : align === "end" ? room : 0;
      const along = cursor;
      const across = crossCursor + offset;
      place(
        it.node,
        column
          ? { x: box.x + across, y: box.y + along, w: it.cross, h: it.main }
          : { x: box.x + along, y: box.y + across, w: it.main, h: it.cross },
        px,
        out,
      );
      cursor += it.main + step;
    }
    crossCursor += lineCross + gap;
  }
}

// ---------------------------------------------------------------------------------------------
// Grid layout: the same placement and track sizing as CSS Grid, for the cases a composition can hold.

/** A grid child's area: 1-based start lines and spans, as CSS writes them. */
export interface GridArea {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
}

/** One column or row as laid out: where it starts, measured from the inside of the padding, and its size. */
export interface TrackLine {
  start: number;
  size: number;
}

const whole = (v: number | undefined, min: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : undefined);

/**
 * Where every child of a grid sits, following CSS Grid's auto-placement (sparse, not dense):
 * children with both lines first, then those with only the line of the flow's own axis, then the
 * rest in order behind a cursor. Columns (or rows, in a column flow) are added when a child needs
 * more than the grid has, as CSS adds implicit tracks.
 */
export function gridAreas(layout: GridLayout, children: readonly LayerNode[]): { areas: Map<string, GridArea>; columns: number; rows: number } {
  const byRow = layout.flow === "row";
  // "Minor" is the axis the flow runs along (columns in a row flow); "major" is the one it adds to.
  const items = children
    .filter((c) => !c.hidden && !c.absolute)
    .map((c) => {
      const cell = c.cell ?? {};
      const col = whole(cell.column, 1);
      const row = whole(cell.row, 1);
      const cs = whole(cell.columnSpan, 1) ?? 1;
      const rs = whole(cell.rowSpan, 1) ?? 1;
      return {
        id: c.id,
        minor: (byRow ? col : row) === undefined ? undefined : (byRow ? col! : row!) - 1,
        major: (byRow ? row : col) === undefined ? undefined : (byRow ? row! : col!) - 1,
        minorSpan: byRow ? cs : rs,
        majorSpan: byRow ? rs : cs,
      };
    });
  let minorCount = Math.max((byRow ? layout.columns : layout.rows).length, ...items.map((it) => (it.minor ?? 0) + it.minorSpan));
  const taken = new Set<string>();
  const fits = (major: number, minor: number, it: (typeof items)[number]) => {
    for (let a = major; a < major + it.majorSpan; a++) for (let b = minor; b < minor + it.minorSpan; b++) if (taken.has(`${a},${b}`)) return false;
    return true;
  };
  const placed = new Map<string, { major: number; minor: number }>();
  const put = (it: (typeof items)[number], major: number, minor: number) => {
    placed.set(it.id, { major, minor });
    for (let a = major; a < major + it.majorSpan; a++) for (let b = minor; b < minor + it.minorSpan; b++) taken.add(`${a},${b}`);
  };

  for (const it of items) if (it.major !== undefined && it.minor !== undefined) put(it, it.major, it.minor);

  const lineCursor = new Map<number, number>();
  for (const it of items) {
    if (it.major === undefined || it.minor !== undefined) continue;
    let minor = lineCursor.get(it.major) ?? 0;
    while (minor + it.minorSpan <= minorCount && !fits(it.major, minor, it)) minor++;
    if (minor + it.minorSpan > minorCount) minorCount = minor + it.minorSpan;
    put(it, it.major, minor);
    lineCursor.set(it.major, minor + it.minorSpan);
  }

  let cMajor = 0;
  let cMinor = 0;
  for (const it of items) {
    if (it.major !== undefined) continue;
    if (it.minor !== undefined) {
      if (it.minor < cMinor) cMajor++;
      cMinor = it.minor;
      while (!fits(cMajor, cMinor, it)) cMajor++;
    } else {
      for (;;) {
        while (cMinor + it.minorSpan <= minorCount && !fits(cMajor, cMinor, it)) cMinor++;
        if (cMinor + it.minorSpan <= minorCount) break;
        cMajor++;
        cMinor = 0;
      }
    }
    put(it, cMajor, cMinor);
  }

  const majorCount = Math.max(
    (byRow ? layout.rows : layout.columns).length,
    ...items.map((it) => placed.get(it.id)!.major + it.majorSpan),
  );
  const areas = new Map<string, GridArea>();
  for (const it of items) {
    const p = placed.get(it.id)!;
    const columnSpan = byRow ? it.minorSpan : it.majorSpan;
    const rowSpan = byRow ? it.majorSpan : it.minorSpan;
    areas.set(it.id, byRow ? { column: p.minor + 1, row: p.major + 1, columnSpan, rowSpan } : { column: p.major + 1, row: p.minor + 1, columnSpan, rowSpan });
  }
  return { areas, columns: byRow ? minorCount : majorCount, rows: byRow ? majorCount : minorCount };
}

/**
 * How much room a grid child asks of its tracks on one axis: its own size, or for a child that
 * fills its cell, its content's (a flex or grid container) or its minimum. The browser agrees
 * because `layers.tsx` gives filling components `contain: size`.
 */
function contribution(n: LayerNode, axis: "w" | "h", px: Px): number {
  const s = n.sizing[axis];
  if (n.kind === "group" || s.mode !== "fill") return naturalSize(n, px)[axis];
  if (n.kind === "container" && n.layout.mode !== "free") return clamp(contentSize(n.layout, n.children, px)[axis], s);
  return clamp(0, s);
}

/**
 * Sizes the tracks of one axis as CSS Grid does for `px`, `auto` and `minmax(0, Nfr)` tracks:
 * fixed tracks keep their size, auto tracks grow to the children in them (children spanning
 * several share what is missing among the auto ones), and fr tracks share what is left. With no
 * room given (a grid that hugs its content) one fr is as big as the child that needs most per fr.
 */
function sizeTracks(defs: readonly GridTrack[], count: number, items: readonly { start: number; span: number; size: number }[], room: number | null, gap: number): number[] {
  const kind = (i: number): GridTrack => defs[i] ?? { unit: "auto" };
  const sizes = Array.from({ length: count }, (_, i) => {
    const t = kind(i);
    return t.unit === "px" ? Math.max(0, t.value) : 0;
  });
  const isFr = (i: number) => kind(i).unit === "fr";
  const range = (it: { start: number; span: number }) => Array.from({ length: it.span }, (_, k) => it.start + k);

  for (const it of items) if (it.span === 1 && kind(it.start).unit === "auto") sizes[it.start] = Math.max(sizes[it.start], it.size);
  for (const it of [...items].filter((i) => i.span > 1).sort((a, b) => a.span - b.span)) {
    const spanned = range(it);
    if (spanned.some(isFr)) continue;
    const autos = spanned.filter((i) => kind(i).unit === "auto");
    const missing = it.size - spanned.reduce((s, i) => s + sizes[i], 0) - gap * (it.span - 1);
    if (missing > 0 && autos.length) for (const i of autos) sizes[i] += missing / autos.length;
  }

  const frs = sizes.map((_, i) => i).filter(isFr);
  if (!frs.length) return sizes;
  const factor = (i: number) => Math.max(0, (kind(i) as { value: number }).value);
  let fr: number;
  if (room !== null) {
    const left = room - sizes.reduce((s, v, i) => s + (isFr(i) ? 0 : v), 0) - gap * Math.max(0, count - 1);
    fr = Math.max(0, left) / Math.max(1, frs.reduce((s, i) => s + factor(i), 0));
  } else {
    fr = 0;
    for (const it of items) {
      const spanned = range(it);
      if (!spanned.some(isFr)) continue;
      const left = it.size - spanned.reduce((s, i) => s + (isFr(i) ? 0 : sizes[i]), 0) - gap * (it.span - 1);
      fr = Math.max(fr, left / Math.max(1, spanned.filter(isFr).reduce((s, i) => s + factor(i), 0)));
    }
  }
  for (const i of frs) sizes[i] = fr * factor(i);
  return sizes;
}

function lines(sizes: readonly number[], gap: number): TrackLine[] {
  let at = 0;
  return sizes.map((size) => {
    const line = { start: at, size };
    at += size + gap;
    return line;
  });
}

/**
 * The tracks of a grid and its children's areas. `inner` is the room inside the padding on each
 * axis, or null where the grid hugs its content. Track starts are measured from the padding.
 */
function gridGeometry(layout: GridLayout, children: readonly LayerNode[], inner: { w: number | null; h: number | null }, px: Px) {
  const { areas, columns, rows } = gridAreas(layout, children);
  const colGap = px(layout.columnGap);
  const rowGap = px(layout.rowGap);
  const flow = children.filter((c) => areas.has(c.id));
  const along = (axis: "w" | "h") =>
    flow.map((c) => {
      const a = areas.get(c.id)!;
      return axis === "w" ? { start: a.column - 1, span: a.columnSpan, size: contribution(c, "w", px) } : { start: a.row - 1, span: a.rowSpan, size: contribution(c, "h", px) };
    });
  return {
    areas,
    columns: lines(sizeTracks(layout.columns, columns, along("w"), inner.w, colGap), colGap),
    rows: lines(sizeTracks(layout.rows, rows, along("h"), inner.h, rowGap), rowGap),
  };
}

/**
 * The columns and rows of a grid laid out in `box` (its frame, padding included), in the same
 * coordinates as `box`. The board uses them to find the cell under the pointer and to draw the tracks.
 */
export function gridTracks(layout: GridLayout, children: readonly LayerNode[], box: Frame, px: Px): { columns: TrackLine[]; rows: TrackLine[]; areas: Map<string, GridArea> } {
  const pad = px(layout.padding);
  const g = gridGeometry(layout, children, { w: box.w - pad * 2, h: box.h - pad * 2 }, px);
  return {
    areas: g.areas,
    columns: g.columns.map((t) => ({ start: box.x + pad + t.start, size: t.size })),
    rows: g.rows.map((t) => ({ start: box.y + pad + t.start, size: t.size })),
  };
}

/** Where an area that starts at 1-based line `from` and spans `span` tracks begins, and how long it is, gaps inside included. */
export function spanOf(tracks: readonly TrackLine[], from: number, span: number): { at: number; size: number } {
  const first = tracks[from - 1];
  const last = tracks[from + span - 2];
  return first && last ? { at: first.start, size: last.start + last.size - first.start } : { at: 0, size: 0 };
}

const SHIFT: Record<Align, number> = { start: 0, center: 0.5, end: 1 };

function layoutGrid(layout: GridLayout, children: readonly LayerNode[], box: Frame, px: Px, out: Map<string, Frame>) {
  const visible = children.filter((c) => !c.hidden);
  for (const c of visible.filter((c) => c.absolute)) {
    const s = naturalSize(c, px);
    place(c, { x: box.x + c.x, y: box.y + c.y, w: s.w, h: s.h }, px, out);
  }
  const { columns, rows, areas } = gridTracks(layout, visible, box, px);
  for (const c of visible) {
    const a = areas.get(c.id);
    if (!a) continue;
    const X = spanOf(columns, a.column, a.columnSpan);
    const Y = spanOf(rows, a.row, a.rowSpan);
    const s = naturalSize(c, px);
    const fit = (axis: "w" | "h", cell: number) => (c.sizing[axis].mode === "fill" && c.kind !== "group" ? clamp(cell, c.sizing[axis]) : s[axis]);
    const w = fit("w", X.size);
    const h = fit("h", Y.size);
    const jx = c.sizing.w.mode === "fill" ? 0 : SHIFT[c.justifySelf ?? layout.justifyItems];
    const jy = c.sizing.h.mode === "fill" ? 0 : SHIFT[c.alignSelf ?? layout.alignItems];
    place(c, { x: X.at + (X.size - w) * jx, y: Y.at + (Y.size - h) * jy, w, h }, px, out);
  }
}

function layoutChildren(layout: Layout, children: readonly LayerNode[], box: Frame, px: Px, out: Map<string, Frame>) {
  if (layout.mode === "flex") return layoutFlex(layout, children, box, px, out);
  if (layout.mode === "grid") return layoutGrid(layout, children, box, px, out);
  for (const c of children) {
    if (c.hidden) continue;
    const s = naturalSize(c, px);
    place(c, { x: box.x + c.x, y: box.y + c.y, w: s.w, h: s.h }, px, out);
  }
}

function place(n: LayerNode, frame: Frame, px: Px, out: Map<string, Frame>) {
  out.set(n.id, frame);
  if (n.kind === "container") layoutChildren(n.layout, n.children, frame, px, out);
  else if (n.kind === "group") layoutChildren({ mode: "free" }, n.children, frame, px, out);
}

/**
 * Frames for every visible layer of an artboard at every depth, in the artboard's coordinates.
 * The board and the runtime draw flex containers with the browser's own flexbox; this is the
 * same layout worked out without a browser, for tests, the SVG template and headless use.
 * `px` turns a space token path into pixels.
 */
export function layoutTree(board: Artboard, px: Px): Map<string, Frame> {
  const out = new Map<string, Frame>();
  layoutChildren(board.layout, board.children, { x: 0, y: 0, w: board.width, h: board.height }, px, out);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Reading files

const H_ANCHORS = ["left", "center", "right", "stretch", "scale"];
const V_ANCHORS = ["top", "center", "bottom", "stretch", "scale"];
const SIZE_MODES = ["fixed", "hug", "fill"];

const ALIGNS: readonly Align[] = ["start", "center", "end"];
const pickAlign = (v: unknown): Align => ALIGNS.find((a) => a === v) ?? "start";

function checkTracks(list: unknown): GridTrack[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((t): GridTrack[] => {
    const track = t as { unit?: unknown; value?: unknown } | null;
    if (track?.unit === "auto") return [{ unit: "auto" }];
    if ((track?.unit === "fr" || track?.unit === "px") && typeof track.value === "number" && Number.isFinite(track.value) && track.value >= 0) {
      return [{ unit: track.unit, value: track.value }];
    }
    return [];
  });
}

function checkGrid(layout: Partial<GridLayout>): GridLayout {
  const d = defaultGrid();
  const columns = checkTracks(layout.columns);
  const token = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
  return {
    mode: "grid",
    columns: columns.length ? columns : d.columns,
    rows: checkTracks(layout.rows),
    columnGap: token(layout.columnGap, d.columnGap),
    rowGap: token(layout.rowGap, d.rowGap),
    padding: token(layout.padding, d.padding),
    justifyItems: pickAlign(layout.justifyItems),
    alignItems: pickAlign(layout.alignItems),
    flow: layout.flow === "column" ? "column" : "row",
  };
}

function checkCell(raw: unknown): GridCell | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const cell: GridCell = {};
  for (const k of ["column", "row", "columnSpan", "rowSpan"] as const) {
    const v = whole(typeof c[k] === "number" ? (c[k] as number) : undefined, 1);
    if (v !== undefined) cell[k] = v;
  }
  return Object.keys(cell).length ? cell : undefined;
}

function checkLayout(l: unknown, where: string): Layout {
  const layout = l as (Partial<Omit<FlexLayout, "mode">> & { mode?: string }) | undefined;
  if (!layout || layout.mode === "free") return { mode: "free" };
  if (layout.mode === "grid") return checkGrid(layout as Partial<GridLayout>);
  if (layout.mode !== "flex") throw new Error(`${where}: maquetación desconocida «${String(layout.mode)}».`);
  const d = defaultFlex();
  return {
    mode: "flex",
    direction: layout.direction === "row" ? "row" : "column",
    gap: typeof layout.gap === "string" ? layout.gap : d.gap,
    padding: typeof layout.padding === "string" ? layout.padding : d.padding,
    align: layout.align === "center" || layout.align === "end" ? layout.align : "start",
    justify: (["center", "end", "space-between"] as const).find((j) => j === layout.justify) ?? "start",
    wrap: layout.wrap === true,
  };
}

function checkNode(raw: unknown, where: string): LayerNode {
  const n = raw as Partial<LayerNode> & Record<string, unknown>;
  if (!n || typeof n !== "object") throw new Error(`${where}: hay un elemento vacío.`);
  const label = `${where} › ${String(n.name ?? n.id ?? "?")}`;
  if ([n.x, n.y, n.w, n.h].some((v) => typeof v !== "number")) throw new Error(`${label}: falta la posición o el tamaño.`);
  const anchor = (n.anchor ?? {}) as Partial<LayerBase["anchor"]>;
  const sizing = (n.sizing ?? {}) as Partial<LayerBase["sizing"]>;
  const axis = (s: Partial<AxisSizing> | undefined): AxisSizing => ({
    mode: SIZE_MODES.includes(s?.mode as string) ? (s!.mode as SizeMode) : "fixed",
    ...(typeof s?.min === "number" ? { min: s.min } : {}),
    ...(typeof s?.max === "number" ? { max: s.max } : {}),
  });
  const base = {
    ...n,
    id: typeof n.id === "string" ? n.id : newId(),
    name: typeof n.name === "string" ? n.name : String(n.id ?? "capa"),
    anchor: {
      h: H_ANCHORS.includes(anchor.h as string) ? (anchor.h as HAnchor) : "left",
      v: V_ANCHORS.includes(anchor.v as string) ? (anchor.v as VAnchor) : "top",
    },
    sizing: { w: axis(sizing.w), h: axis(sizing.h) },
    alignSelf: ALIGNS.find((a) => a === n.alignSelf),
    justifySelf: ALIGNS.find((a) => a === n.justifySelf),
    cell: checkCell(n.cell),
  };
  for (const k of ["alignSelf", "justifySelf", "cell"] as const) if (base[k] === undefined) delete base[k];
  switch (n.kind) {
    case "component":
      if (typeof n.type !== "string") throw new Error(`${label}: falta el tipo de componente.`);
      return { ...base, kind: "component", type: n.type, params: (n.params as Params) ?? {} } as ComponentNode;
    case "container":
      return {
        ...base,
        kind: "container",
        layout: checkLayout(n.layout, label),
        clip: n.clip !== false,
        children: checkChildren(n.children, label),
      } as ContainerNode;
    case "group":
      return { ...base, kind: "group", children: checkChildren(n.children, label) } as GroupNode;
    default:
      throw new Error(`${label}: tipo de capa desconocido «${String(n.kind)}».`);
  }
}

function checkChildren(list: unknown, where: string): LayerNode[] {
  if (!Array.isArray(list)) throw new Error(`${where}: faltan las capas.`);
  return list.map((n) => checkNode(n, where));
}

/**
 * Checks a file someone loads and fills what may be missing. Version 1 files (one flat list of
 * elements per screen) are migrated to the layer tree. Throws a readable message instead of
 * drawing garbage.
 */
/** Keeps the finite numbers of a saved guides object; nothing to keep means no guides. */
function cleanGuides(g: unknown): ArtboardGuides | undefined {
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => typeof n === "number" && Number.isFinite(n)) : []);
  const raw = g as { x?: unknown; y?: unknown } | null | undefined;
  const out = { x: list(raw?.x), y: list(raw?.y) };
  return out.x.length || out.y.length ? out : undefined;
}

export function parseComposition(input: unknown): Composition {
  let data: unknown = input;
  // Text from a file or a fetch; an object from a JSON module (`import c from "./x.composition.json"`).
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      throw new Error("El archivo no es JSON válido.");
    }
  }
  const raw = data as { version?: unknown; artboards?: unknown } | null;
  if (!raw || !Array.isArray(raw.artboards) || (raw.version !== 1 && raw.version !== 2)) {
    throw new Error("No es un archivo de composición de Designboard (falta version o artboards).");
  }
  if (raw.version === 1) return migrateV1(raw as unknown as CompositionV1);
  const c = raw as unknown as Composition;
  const out: Composition = {
    ...c,
    artboards: c.artboards.map((b) => {
      if (typeof b.width !== "number" || typeof b.height !== "number") throw new Error(`La pantalla "${b.name ?? b.id}" no tiene tamaño.`);
      const out: Artboard = { ...b, background: typeof b.background === "string" ? b.background : "", layout: checkLayout(b.layout, b.name), children: checkChildren(b.children, b.name ?? b.id), guides: cleanGuides(b.guides) };
      if (typeof b.clip !== "boolean" || b.clip) delete out.clip;
      if (typeof b.minWidth !== "number" || !Number.isFinite(b.minWidth) || b.minWidth < 0) delete out.minWidth;
      return out;
    }),
  };
  if (typeof out.runtime !== "string") delete out.runtime;
  return out;
}

/** The file the board saves: the composition stamped with the runtime version that wrote it, as indented JSON. */
export function serializeComposition(c: Composition): string {
  return JSON.stringify({ ...c, runtime: RUNTIME_VERSION }, null, 2);
}

/**
 * A warning when the file was written by a board whose runtime is not this copy's, or null when
 * they match or the file does not say. The app's copy may lag behind the board (copy it again
 * with `npm run copy-runtime`), or the file may come from an older board (save it again).
 */
export function runtimeMismatch(c: Pick<Composition, "runtime">, own: string = RUNTIME_VERSION): string | null {
  if (!c.runtime || c.runtime === own) return null;
  return `La composición se escribió con el runtime ${c.runtime} de Designboard y esta app lleva el ${own}. Copia el runtime otra vez (npm run copy-runtime) o vuelve a guardar desde el tablero.`;
}

/**
 * The screen an app draws at a given width, when it keeps one screen per size (a bar at 1440 and
 * at 390): the one with the largest `minWidth` (its own width when absent) that the width reaches;
 * below them all, the narrowest. `among` limits the choice, e.g. to the screens of one block.
 */
export function pickArtboard(c: Composition, width: number, among?: (b: Artboard) => boolean): Artboard | undefined {
  const list = c.artboards.filter(among ?? (() => true));
  if (!list.length) return undefined;
  const from = (b: Artboard) => b.minWidth ?? b.width;
  const fits = list.filter((b) => from(b) <= width);
  const pool = fits.length ? fits : list;
  return pool.reduce((best, b) => (fits.length ? from(b) > from(best) : from(b) < from(best)) ? b : best);
}

/**
 * Brings every component's stored params inside its ficha's limits (`clampStoredParams`), for a
 * file someone loads. Components the library lacks are left alone. Returns the same object when
 * nothing was out of bounds.
 */
export function clampComposition(c: Composition, library: Library): Composition {
  let changed = false;
  const fix = (list: readonly LayerNode[]): LayerNode[] =>
    list.map((n) => {
      if (n.kind === "component") {
        const def = library.get(n.type);
        const params = def ? clampStoredParams(def, n.params) : n.params;
        if (params === n.params) return n;
        changed = true;
        return { ...n, params };
      }
      const children = fix(n.children);
      return children.every((ch, i) => ch === n.children[i]) ? n : ({ ...n, children } as LayerNode);
    });
  const artboards = c.artboards.map((b) => {
    const children = fix(b.children);
    return children.every((ch, i) => ch === b.children[i]) ? b : { ...b, children };
  });
  return changed ? { ...c, artboards } : c;
}
