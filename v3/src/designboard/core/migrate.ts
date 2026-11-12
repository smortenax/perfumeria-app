// Copied from designboard 4aa3488 (src/core/migrate.ts), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { Align, AxisSizing, Artboard, ComponentNode, Composition, Layout } from "./composition";
import type { Params } from "./manifest";

/**
 * Version 1 of the composition file: one flat list of elements per screen, in free or stack
 * layout. Kept here only to read old files; the board writes version 2.
 */
export interface NodeV1 {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  anchor?: { h: "left" | "center" | "right" | "stretch"; v: "top" | "center" | "bottom" | "stretch" };
  params?: Params;
  hidden?: boolean;
  locked?: boolean;
}

export type LayoutV1 = { mode: "free" } | { mode: "stack"; direction: "column" | "row"; gap: string; padding: string };

export interface ArtboardV1 {
  id: string;
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  background?: string;
  layout?: LayoutV1;
  nodes: NodeV1[];
}

export interface CompositionV1 {
  version: 1;
  name: string;
  tokens: string;
  artboards: ArtboardV1[];
}

/**
 * Turns a version 1 file into a layer tree without losing anything:
 * - every element becomes a component layer at the screen's top level, with the same id,
 *   frame, anchors and params;
 * - a stack screen becomes a flex screen with the same direction, gap and padding;
 * - in a stack, an element's anchor on the cross axis said how it sat across: stretch becomes
 *   `fill` sizing, centre and right/bottom become its own alignment.
 *
 * One difference remains: version 1 shrank a stacked element that was wider than the screen to
 * fit; a fixed-size layer in a flex container keeps its size, as it does in CSS.
 */
export function migrateV1(c: CompositionV1): Composition {
  if (!c || c.version !== 1 || !Array.isArray(c.artboards)) throw new Error("No es un archivo de composición de la versión 1.");
  return {
    version: 2,
    name: c.name ?? "Sin nombre",
    tokens: c.tokens ?? "",
    artboards: c.artboards.map(migrateBoard),
  };
}

function migrateBoard(b: ArtboardV1): Artboard {
  if (typeof b.width !== "number" || typeof b.height !== "number" || !Array.isArray(b.nodes)) {
    throw new Error(`La pantalla "${b.name ?? b.id}" no tiene tamaño o nodos.`);
  }
  const old = b.layout ?? { mode: "free" };
  const layout: Layout =
    old.mode === "stack"
      ? { mode: "flex", direction: old.direction, gap: old.gap, padding: old.padding, align: "start", justify: "start", wrap: false }
      : { mode: "free" };
  const column = old.mode === "stack" && old.direction === "column";
  return {
    id: b.id,
    name: b.name,
    width: b.width,
    height: b.height,
    x: b.x ?? 0,
    y: b.y ?? 0,
    background: b.background ?? "color.surface.base",
    layout,
    children: b.nodes.map((n) => migrateNode(n, old.mode === "stack" ? (column ? "column" : "row") : null)),
  };
}

function migrateNode(n: NodeV1, stack: "column" | "row" | null): ComponentNode {
  if (typeof n.type !== "string" || [n.x, n.y, n.w, n.h].some((v) => typeof v !== "number")) {
    throw new Error(`Un elemento («${n.name ?? n.id}») no tiene tipo o posición.`);
  }
  const anchor = n.anchor ?? { h: "left", v: "top" };
  const fixed: AxisSizing = { mode: "fixed" };
  const sizing = { w: { ...fixed }, h: { ...fixed } };
  let alignSelf: Align | undefined;
  if (stack) {
    const cross = stack === "column" ? anchor.h : anchor.v;
    if (cross === "stretch") sizing[stack === "column" ? "w" : "h"] = { mode: "fill" };
    else if (cross === "center") alignSelf = "center";
    else if (cross === "right" || cross === "bottom") alignSelf = "end";
  }
  const out: ComponentNode = {
    kind: "component",
    id: n.id,
    type: n.type,
    name: n.name ?? n.id,
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    anchor,
    sizing,
    params: n.params ?? {},
  };
  if (alignSelf) out.alignSelf = alignSelf;
  if (n.hidden) out.hidden = true;
  if (n.locked) out.locked = true;
  return out;
}
