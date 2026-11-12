// Copied from designboard c0e1d34 (src/runtime/layers.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { MIN_SIZE, type Align, type AxisSizing, type Frame, type GridLayout, type GridTrack, type LayerNode, type Layout } from "../core/composition";
import { normaliseParams, type Library } from "../core/manifest";
import { resolveSlots } from "../core/links";
import { tokenVar } from "../core/tokens";
import { useLinks } from "./links";
import { usePreview } from "./preview";

/**
 * The layer tree drawn with the browser's own CSS: a flex container is a real flexbox, a grid
 * container a real CSS grid, and a free container places its children absolutely. The board and the app draw screens with this same
 * code, so what the board shows is what the app shows.
 *
 * `estimate` holds frames worked out without a browser (`layoutTree`). They size what CSS cannot
 * size on its own (a group, or a free container that hugs its children) and give components a
 * first size before the browser has measured them.
 */

const ALIGN: Record<Align, CSSProperties["alignItems"]> = { start: "flex-start", center: "center", end: "flex-end" };
const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between" } as const;

/** Self-alignment in a grid cell. */
const PLACE: Record<Align, "start" | "center" | "end"> = { start: "start", center: "center", end: "end" };

/** A track as CSS writes it. A fr track is `minmax(0, Nfr)`: it never grows because of what is inside it. */
export function trackCss(t: GridTrack): string {
  if (t.unit === "auto") return "auto";
  if (t.unit === "px") return `${t.value}px`;
  return `minmax(0, ${t.value}fr)`;
}

function gridStyle(layout: GridLayout): CSSProperties {
  return {
    position: "relative",
    display: "grid",
    gridTemplateColumns: layout.columns.length ? layout.columns.map(trackCss).join(" ") : "none",
    gridTemplateRows: layout.rows.length ? layout.rows.map(trackCss).join(" ") : "none",
    gridAutoColumns: "auto",
    gridAutoRows: "auto",
    gridAutoFlow: layout.flow,
    // Tracks sit at the start: auto tracks would otherwise stretch to share the room left.
    justifyContent: "start",
    alignContent: "start",
    justifyItems: PLACE[layout.justifyItems],
    alignItems: PLACE[layout.alignItems],
    columnGap: tokenVar(layout.columnGap, "0px"),
    rowGap: tokenVar(layout.rowGap, "0px"),
    padding: tokenVar(layout.padding, "0px"),
    boxSizing: "border-box",
  };
}

/** CSS for a box that lays out its children: the screen itself or a container. */
export function layoutStyle(layout: Layout): CSSProperties {
  if (layout.mode === "free") return { position: "relative" };
  if (layout.mode === "grid") return gridStyle(layout);
  return {
    position: "relative",
    display: "flex",
    flexDirection: layout.direction,
    flexWrap: layout.wrap ? "wrap" : "nowrap",
    alignItems: ALIGN[layout.align],
    // Lines of a wrapping container sit at the start, each as tall as its tallest child.
    alignContent: "flex-start",
    justifyContent: JUSTIFY[layout.justify],
    gap: tokenVar(layout.gap, "0px"),
    padding: tokenVar(layout.padding, "0px"),
    boxSizing: "border-box",
  };
}

function limits(s: AxisSizing, axis: "w" | "h", fill: boolean): CSSProperties {
  const min = axis === "w" ? "minWidth" : "minHeight";
  const max = axis === "w" ? "maxWidth" : "maxHeight";
  const out: CSSProperties = {};
  if (s.min !== undefined || fill) out[min] = s.min ?? MIN_SIZE;
  if (s.max !== undefined) out[max] = s.max;
  return out;
}

/**
 * CSS for one layer's own box inside a parent with `parent` layout.
 * Components keep their own size when they hug: the board cannot ask a component how big its
 * content is.
 */
export function layerStyle(node: LayerNode, parent: Layout, estimate: Frame | undefined): CSSProperties {
  const own = { w: estimate?.w ?? node.w, h: estimate?.h ?? node.h };
  // Sizes CSS can work out: a container's hug (flex or grid) and a child's fill (flex or grid parent).
  const cssHugs = (axis: "w" | "h") => node.sizing[axis].mode === "hug" && node.kind === "container" && node.layout.mode !== "free";
  const fixedSize = (axis: "w" | "h") => (node.kind === "group" ? own[axis] : node[axis]);
  const sizeOf = (axis: "w" | "h", hug: "fit-content" | "auto") =>
    cssHugs(axis) ? hug : node.sizing[axis].mode === "hug" ? own[axis] : fixedSize(axis);

  if (parent.mode === "free" || node.absolute) {
    const size = (axis: "w" | "h") => (cssHugs(axis) ? "fit-content" : node.sizing[axis].mode === "hug" ? own[axis] : fixedSize(axis));
    return {
      position: "absolute",
      left: node.x,
      top: node.y,
      width: size("w"),
      height: size("h"),
      ...limits(node.sizing.w, "w", false),
      ...limits(node.sizing.h, "h", false),
      boxSizing: "border-box",
    };
  }

  if (parent.mode === "grid") {
    const cell = node.cell ?? {};
    const line = (start: number | undefined, span: number | undefined) => `${start ?? "auto"} / span ${Math.max(1, span ?? 1)}`;
    const style: CSSProperties = {
      position: "relative",
      boxSizing: "border-box",
      gridColumn: line(cell.column, cell.columnSpan),
      gridRow: line(cell.row, cell.rowSpan),
    };
    const fills = (axis: "w" | "h") => node.kind !== "group" && node.sizing[axis].mode === "fill";
    for (const axis of ["w", "h"] as const) {
      const self = axis === "w" ? "justifySelf" : "alignSelf";
      const own = axis === "w" ? node.justifySelf : node.alignSelf;
      if (fills(axis)) style[self] = "stretch";
      else {
        style[axis === "w" ? "width" : "height"] = sizeOf(axis, "fit-content");
        if (own) style[self] = PLACE[own];
      }
      Object.assign(style, limits(node.sizing[axis], axis, fills(axis)));
    }
    // A component that fills its cell asks nothing of the track but its minimum, as `layoutTree` assumes.
    if (node.kind === "component" && (fills("w") || fills("h"))) style.contain = "size";
    return style;
  }

  const column = parent.direction === "column";
  const mainAxis = column ? "h" : "w";
  const crossAxis = column ? "w" : "h";
  const mainProp = column ? "height" : "width";
  const crossProp = column ? "width" : "height";
  const style: CSSProperties = { position: "relative", boxSizing: "border-box" };

  const main = node.sizing[mainAxis];
  if (main.mode === "fill") style.flex = "1 1 0px";
  else {
    style.flex = "0 0 auto";
    style[mainProp] = cssHugs(mainAxis) ? "auto" : main.mode === "hug" ? own[mainAxis] : fixedSize(mainAxis);
  }
  Object.assign(style, limits(main, mainAxis, main.mode === "fill"));

  const cross = node.sizing[crossAxis];
  if (cross.mode === "fill") style.alignSelf = "stretch";
  else {
    style[crossProp] = cssHugs(crossAxis) ? "fit-content" : cross.mode === "hug" ? own[crossAxis] : fixedSize(crossAxis);
    if (node.alignSelf) style.alignSelf = ALIGN[node.alignSelf];
  }
  Object.assign(style, limits(cross, crossAxis, false));
  return style;
}

/**
 * The whole CSS box of one layer as the app draws it: its place and size in its parent, and for a
 * container or group its layout, ground, radius and clipping. `extra` is merged last (the board's
 * handlers' styles). Used by the boxes themselves and by Copy as CSS, so both agree.
 */
export function boxStyle(node: LayerNode, parent: Layout, estimate: Frame | undefined, extra?: CSSProperties): CSSProperties {
  const style: CSSProperties = { ...layerStyle(node, parent, estimate), ...extra };
  if (node.kind === "component") return style;
  const layout: Layout = node.kind === "container" ? node.layout : { mode: "free" };
  Object.assign(style, layoutStyle(layout), { position: style.position });
  if (node.kind === "container") {
    if (node.background) style.background = tokenVar(node.background, "transparent");
    if (node.radius) style.borderRadius = tokenVar(node.radius, "0");
    style.overflow = node.clip ? "hidden" : "visible";
  }
  return style;
}

/** The size of an element as the browser lays it out, kept up to date. Starts from `initial`. */
function useBoxSize(initial: { w: number; h: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

export interface LayerTreeProps {
  layers: readonly LayerNode[];
  /** The layout of the box the layers sit in. */
  parent: Layout;
  library: Library;
  estimate: ReadonlyMap<string, Frame>;
  /** Extra attributes for the boxes of the top-level layers only: the board hangs its handlers here. */
  topProps?: (node: LayerNode) => HTMLAttributes<HTMLDivElement> & { style?: CSSProperties };
}

/** Draws a list of layers and everything inside them. Every box carries `data-layer-id`. */
export function LayerTree({ layers, parent, library, estimate, topProps }: LayerTreeProps) {
  return (
    <>
      {layers.map((n) =>
        n.hidden ? null : <LayerBox key={n.id} node={n} parent={parent} library={library} estimate={estimate} extra={topProps?.(n)} />,
      )}
    </>
  );
}

function LayerBox({
  node,
  parent,
  library,
  estimate,
  extra,
}: {
  node: LayerNode;
  parent: Layout;
  library: Library;
  estimate: ReadonlyMap<string, Frame>;
  extra?: HTMLAttributes<HTMLDivElement> & { style?: CSSProperties };
}) {
  const guess = estimate.get(node.id);
  const links = useLinks(); // linked images: re-renders when a linked file changes
  const preview = usePreview();
  const { ref, size } = useBoxSize({ w: guess?.w ?? node.w, h: guess?.h ?? node.h });
  const { style: extraStyle, ...extraProps } = extra ?? {};
  const style = boxStyle(node, parent, guess, extraStyle);
  let content: ReactNode;

  if (node.kind === "component") {
    const def = library.get(node.type);
    if (!def) content = <div className="missing-component">Falta el componente «{node.type}»</div>;
    else {
      const Render = def.render;
      content = <Render params={resolveSlots(def, normaliseParams(def, node.params), links.resolve)} width={size.w} height={size.h} name={node.name} />;
      // On the board, a component that reads its data from the app gets its ficha's example data.
      if (preview && def.preview) {
        const Wrap = def.preview.Wrap;
        content = <Wrap sample={preview.sample}>{content}</Wrap>;
      }
    }
  } else {
    const layout: Layout = node.kind === "container" ? node.layout : { mode: "free" };
    content = <LayerTree layers={node.children} parent={layout} library={library} estimate={estimate} />;
  }

  return (
    <div ref={ref} data-layer-id={node.id} data-layer-kind={node.kind} {...extraProps} style={style}>
      {content}
    </div>
  );
}

/**
 * Where every layer inside `root` was drawn, measured from the page, in `root`'s own units:
 * `scale` is how much the page shows it enlarged (the board's zoom).
 */
export function measureLayers(root: HTMLElement, scale = 1): Map<string, Frame> {
  const out = new Map<string, Frame>();
  const base = root.getBoundingClientRect();
  root.querySelectorAll<HTMLElement>("[data-layer-id]").forEach((el) => {
    const r = el.getBoundingClientRect();
    out.set(el.dataset.layerId!, {
      x: Math.round(((r.left - base.left) / scale) * 100) / 100,
      y: Math.round(((r.top - base.top) / scale) * 100) / 100,
      w: Math.round((r.width / scale) * 100) / 100,
      h: Math.round((r.height / scale) * 100) / 100,
    });
  });
  return out;
}
