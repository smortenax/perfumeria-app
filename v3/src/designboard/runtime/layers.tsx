// Copied from designboard 3f221ae (src/runtime/layers.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { actionOf, actionsOf, cellIn, runOrder, DEFAULT_KEY, DRAG_START, MIN_SIZE, paddingTokens, triggerOf, type Align, type Connection, type ContainerBorder, type Side, type Trigger, type FlexAlign, type AxisSizing, type Frame, type GridLayout, type GridTrack, type LayerNode, type Layout, type ScrollAxis } from "../core/composition";
import { clampParam, normaliseParams, type Library } from "../core/manifest";
import { boundValue, branchOf, holds, valueOf } from "../core/variables";
import { useVariables } from "./variables";
import { keyMatches } from "../core/keys";
import { resolveSlots } from "../core/links";
import { hasPartConnections, partConnection } from "../core/parts";
import { tokenVar } from "../core/tokens";
import { useLinks } from "./links";
import { usePreview } from "./preview";
import { useAct } from "./navigate";
import { withVariant } from "../core/variants";
import { switchedVariant, useVariantSwitcher } from "./variantSwitch";

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
const FLEX_ALIGN: Record<FlexAlign, CSSProperties["alignItems"]> = { ...ALIGN, baseline: "baseline" };
const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
  "space-around": "space-around",
  "space-evenly": "space-evenly",
} as const;

/** A container's padding as CSS: one token, or four when single sides are set. */
function paddingCss(layout: Exclude<Layout, { mode: "free" }>): string {
  if (!layout.paddingSides) return tokenVar(layout.padding, "0px");
  const p = paddingTokens(layout);
  return [p.top, p.right, p.bottom, p.left].map((t) => tokenVar(t, "0px")).join(" ");
}

/** Self-alignment in a grid cell. */
const PLACE: Record<Align, "start" | "center" | "end"> = { start: "start", center: "center", end: "end" };

/** A track as CSS writes it. A fr track is `minmax(0, Nfr)`: it never grows because of what is inside it. */
export function trackCss(t: GridTrack): string {
  if (t.unit === "auto") return "auto";
  if (t.unit === "minmax") return `minmax(${t.min}px, ${t.max}fr)`;
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
    gridAutoFlow: layout.dense ? `${layout.flow} dense` : layout.flow,
    // Tracks sit at the start: auto tracks would otherwise stretch to share the room left.
    justifyContent: "start",
    alignContent: "start",
    justifyItems: PLACE[layout.justifyItems],
    alignItems: PLACE[layout.alignItems],
    // First on top numbers its children; isolation keeps those numbers inside the grid.
    ...(layout.firstOnTop ? { isolation: "isolate" as const } : {}),
    columnGap: tokenVar(layout.columnGap, "0px"),
    rowGap: tokenVar(layout.rowGap, "0px"),
    padding: paddingCss(layout),
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
    flexDirection: layout.reverse ? `${layout.direction}-reverse` : layout.direction,
    flexWrap: layout.wrap ? "wrap" : "nowrap",
    alignItems: FLEX_ALIGN[layout.align],
    // Lines of a wrapping container sit at the start, each as tall as its tallest child.
    alignContent: "flex-start",
    justifyContent: JUSTIFY[layout.justify],
    ...(layout.firstOnTop ? { isolation: "isolate" as const } : {}),
    gap: tokenVar(layout.gap, "0px"),
    padding: paddingCss(layout),
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
    // A named area is written as its lines, so the board and the app place it the same way.
    const cell = cellIn(node, parent) ?? {};
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
    if (node.shadow) style.boxShadow = tokenVar(node.shadow, "none");
    // The border is drawn by a box laid over the children (`BorderBox`): its own stacking context
    // keeps that box over them and under whatever is outside the container.
    if (node.border) {
      style.isolation = "isolate";
      if (!style.position || style.position === "static") style.position = "relative";
    }
    Object.assign(style, overflowStyle(node.clip, node.scroll));
  }
  return style;
}

/**
 * A container's border (D-0016), as Figma's inside stroke: a box over its children, taking no
 * room in its layout and following its radius, with a line of the width token on each chosen side.
 */
export function borderBoxStyle(border: ContainerBorder): CSSProperties {
  // Inset shadows, not CSS borders: browsers round a border's width down to whole pixels (a
  // 1.5 px token would draw at 1 px), while a shadow keeps the token's width.
  const w = tokenVar(border.width, "0px");
  const c = tokenVar(border.color, "transparent");
  const offsets: Record<Side, string> = { top: `0 ${w}`, right: `calc(-1 * ${w}) 0`, bottom: `0 calc(-1 * ${w})`, left: `${w} 0` };
  const sides = border.sides ?? (["top", "right", "bottom", "left"] as Side[]);
  return {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    zIndex: 2147483000,
    boxShadow: sides.map((side) => `inset ${offsets[side]} 0 0 ${c}`).join(", "),
  };
}

/**
 * The overflow of a screen or container: what does not fit scrolls on the `scroll` axis, and is
 * cut off on the other (a scrolling box always clips), or shown past the edges when not clipped.
 */
export function overflowStyle(clip: boolean, scroll?: ScrollAxis): CSSProperties {
  if (!scroll) return { overflow: clip ? "hidden" : "visible" };
  return { overflowX: scroll === "vertical" ? "hidden" : "auto", overflowY: scroll === "horizontal" ? "hidden" : "auto" };
}

/**
 * On the board's canvas a scrolling box does not scroll: it shows clipped, as Figma's canvas does,
 * so the wheel still pans and layers keep their measured places. The board provides `true`.
 */
const StillContext = createContext(false);
export const StillProvider = StillContext.Provider;

/**
 * The layers of a scrolling box that stay put (`fixed`): only those placed by X/Y, in a free
 * box or marked absolute, as a layer in a stack or grid has no place of its own to keep.
 */
export function pinnedIn(layout: Layout, layers: readonly LayerNode[]): LayerNode[] {
  return layers.filter((n) => n.fixed && !n.hidden && (layout.mode === "free" || n.absolute));
}

/**
 * The inside of a scrolling box that has fixed layers: what scrolls goes in a viewport filling the
 * box, and the fixed layers sit beside it, above it, in the box itself, so the browser keeps them
 * still while it scrolls (no script follows the scroll, so nothing lags). The box only clips.
 */
export function ScrollingLayers({ layers, layout, scroll, library, estimate }: { layers: readonly LayerNode[]; layout: Layout; scroll: ScrollAxis; library: Library; estimate: ReadonlyMap<string, Frame> }) {
  const pinned = pinnedIn(layout, layers);
  const flowing = layers.filter((n) => !pinned.includes(n));
  // The wheel over a fixed layer still scrolls the content under it, as in Figma's player.
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const v = viewport.current;
    const box = v?.parentElement;
    if (!v || !box) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || v.contains(e.target as Node)) return;
      const before = [v.scrollLeft, v.scrollTop];
      v.scrollBy(e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX, e.shiftKey && !e.deltaX ? 0 : e.deltaY);
      if (v.scrollLeft !== before[0] || v.scrollTop !== before[1]) e.preventDefault();
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <>
      <div ref={viewport} className="db-scroll" style={{ ...layoutStyle(layout), position: "absolute", inset: 0, boxSizing: "border-box", ...overflowStyle(true, scroll) }}>
        <LayerTree layers={flowing} parent={layout} library={library} estimate={estimate} />
      </div>
      <LayerTree layers={pinned} parent={{ mode: "free" }} library={library} estimate={estimate} />
    </>
  );
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
  // "First on top": each child is drawn above the ones after it.
  const firstOnTop = parent.mode !== "free" && !!parent.firstOnTop;
  // In a played prototype a layer with a condition shows only while it holds; the canvas has no
  // variables and shows every layer.
  const store = useVariables();
  return (
    <>
      {layers.map((n, i) => {
        if (n.hidden || (store && !holds(store.vars, store.values, n.showWhen))) return null;
        const extra = topProps?.(n);
        const stacked = firstOnTop ? { ...extra, style: { zIndex: layers.length - i, ...extra?.style } } : extra;
        return <LayerBox key={n.id} node={n} parent={parent} library={library} estimate={estimate} extra={stacked} />;
      })}
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
  const act = useAct();
  const variants = useVariantSwitcher();
  const store = useVariables();
  const { ref, size } = useBoxSize({ w: guess?.w ?? node.w, h: guess?.h ?? node.h });
  const { style: extraStyle, ...extraProps } = extra ?? {};
  const still = useContext(StillContext);
  // On the canvas a scrolling container only clips; with fixed layers, its viewport scrolls instead of it.
  const scroll = node.kind === "container" && !still ? node.scroll : undefined;
  const base = boxStyle(node, parent, guess, extraStyle);
  const style = node.kind === "container" && node.scroll && (!scroll || pinnedIn(node.layout, node.children).length) ? { ...base, overflowX: undefined, overflowY: undefined, overflow: "hidden" } : base;
  let content: ReactNode;

  if (node.kind === "component") {
    const def = library.get(node.type);
    if (!def) content = <div className="missing-component">Falta el componente «{node.type}»</div>;
    else {
      const Render = def.render;
      // A prototype's "change to" shows another variant while the screen is on; the file keeps its own.
      const switched = variants && switchedVariant(variants.switches, node.id);
      // Params bound to a prototype variable take its value while it fits; a switched variant goes over them.
      let params = normaliseParams(def, node.params);
      if (store && node.bind) {
        for (const [key, id] of Object.entries(node.bind)) {
          const pd = def.params[key];
          const v = pd && boundValue(pd.kind, pd.kind === "select" ? pd.options.map((o) => o.value) : undefined, valueOf(store.vars, store.values, id));
          if (pd && v !== undefined) params = { ...params, [key]: clampParam(pd, v) };
        }
      }
      if (switched) params = withVariant(def, params, switched);
      content = <Render params={resolveSlots(def, params, links.resolve)} width={size.w} height={size.h} name={node.name} />;
      // On the board, a component that reads its data from the app gets its ficha's example data.
      if (preview && def.preview) {
        const Wrap = def.preview.Wrap;
        content = <Wrap sample={preview.sample}>{content}</Wrap>;
      }
    }
  } else {
    const layout: Layout = node.kind === "container" ? node.layout : { mode: "free" };
    // A scrolling container with fixed layers splits into a viewport and the fixed layers (`ScrollingLayers`).
    content =
      scroll && pinnedIn(layout, node.children).length ? (
        <ScrollingLayers layers={node.children} layout={layout} scroll={scroll} library={library} estimate={estimate} />
      ) : (
        <LayerTree layers={node.children} parent={layout} library={library} estimate={estimate} />
      );
    if (node.kind === "container" && node.border) {
      content = (
        <>
          {content}
          <div aria-hidden="true" data-border="" style={borderBoxStyle(node.border)} />
        </>
      );
    }
  }

  // A connected layer acts when the app handles connections. On a click the component's own
  // handlers run first; one that calls `preventDefault` keeps the click for itself, and the
  // innermost connected layer wins over one around it. A hover acts when the pointer comes in
  // and ends when it leaves, a press when the pointer goes down on it and ends when it lets go
  // or leaves, mouse down and mouse up when the pointer goes down on it or comes up over it, a
  // drag when the pointer moves with the button down on it, a key when that key is pressed
  // while the screen shows (not while typing in a field), and a delay acts that long after the layer shows. Scroll and link are done here,
  // as they need no state, a variant change is kept by the screen (`VariantProvider`) and a
  // variable by its store (`VariablesProvider`): the app's handler is still told, with the
  // branch of a conditional that ran.
  const connection = node.connection;
  const trigger = connection ? triggerOf(connection) : "click";
  const live = connection && act ? connection : null;
  const box = () => ref.current?.getBoundingClientRect() ?? null;
  // The latest connection and handler, read when a delay runs out or a key comes, so an app that
  // re-renders (a new `act`) or a file read again does not restart the wait or the listener.
  const latest = useRef({ live, act, variants, store });
  latest.current = { live, act, variants, store };
  /** Runs connection `c` (the branch of it that holds now), started by `as`; `at` is where it starts on the screen. */
  const run = (c: Connection, phase: "start" | "end", as: Trigger, at: DOMRect | null) => {
    const { act: a, store: vars } = latest.current;
    if (!a) return;
    // Each action of the list (D-0017) runs the branch of it whose condition holds now, or nothing:
    // every condition is read when the trigger fires, before any action changes a variable. Those
    // that change the screen in place run first, then those that leave it.
    const values = vars?.values ?? {};
    const chosen = actionsOf(c).flatMap((one) => {
      const l = branchOf(one, vars?.vars, values);
      if (!l) return [];
      const { then: _more, ...plain } = l;
      // Each action carries the list's trigger, so a hover or press ends what every one of them opened.
      return [(c.trigger ? { ...plain, trigger: c.trigger } : plain) as Connection];
    });
    for (const l of runOrder(chosen)) {
      if (phase === "start") runLocal(l, ref.current);
      if (phase === "start" && l.resetVariants) latest.current.variants?.reset();
      if (l.variant && actionOf(l) === "variant") latest.current.variants?.fire(node.id, l.layer ?? node.id, l.variant, phase, as === "hover" || as === "press");
      if (phase === "start" && l.set && actionOf(l) === "set") vars?.apply(l.set);
      a(l, phase, at, node.id);
    }
  };
  /** Runs the layer's connection now, if it still has the trigger `as`. */
  const fire = (phase: "start" | "end", as: Trigger) => {
    const { live } = latest.current;
    if (!live || triggerOf(live) !== as) return;
    run(live, phase, as, box());
  };
  // A click on a part of the component (`data-part`, declared in its ficha) runs that part's
  // connection, and the layer's own click then stands down, as an inner connected layer wins.
  const def = node.kind === "component" ? library.get(node.type) : undefined;
  const partsLive = !!act && node.kind === "component" && hasPartConnections(def, node);
  const partOf = (target: EventTarget | null): { conn: Connection; el: Element } | null => {
    if (node.kind !== "component" || !(target instanceof Element)) return null;
    const el = target.closest("[data-part]");
    if (!el || !ref.current?.contains(el)) return null;
    // A part inside another layer drawn in this one belongs to that layer.
    if (el.closest("[data-layer-id]") !== ref.current) return null;
    const conn = partConnection(def, node, el.getAttribute("data-part") ?? "");
    return conn ? { conn, el } : null;
  };
  // A hand over each part that does something.
  useEffect(() => {
    if (!partsLive || node.kind !== "component") return;
    ref.current?.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => {
      if (partConnection(def, node, el.getAttribute("data-part") ?? "")) el.style.cursor = "pointer";
    });
  });
  // The delay runs once from when the layer shows.
  const waits = live && trigger === "delay" ? (live.delay ?? 0) : null;
  useEffect(() => {
    if (waits === null) return;
    const t = setTimeout(() => fire("start", "delay"), waits);
    return () => clearTimeout(t);
  }, [waits, node.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const key = live && trigger === "key" ? (live.key ?? DEFAULT_KEY) : null;
  useEffect(() => {
    if (key === null) return;
    const onKey = (e: KeyboardEvent) => {
      // The key with exactly its modifiers (`keyMatches`); a field, button or link keeps its own
      // keys; a screen covered by an overlay (`data-covered`) leaves keys to the one on top.
      if (e.defaultPrevented || e.repeat || !keyMatches(e, key)) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, button, a[href], summary, [contenteditable=true], [role=button], [role=link], [role=menuitem]")) return;
      if (ref.current?.closest("[data-covered]")) return;
      e.preventDefault();
      fire("start", "key");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, node.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = !live
    ? {}
    : trigger === "click"
      ? {
          onClick: (e: RMouseEvent) => {
            if (e.defaultPrevented) return;
            e.preventDefault(); // a connected layer around this one leaves the click to it
            fire("start", "click");
          },
        }
      : trigger === "hover"
        ? { onMouseEnter: () => fire("start", "hover"), onMouseLeave: () => fire("end", "hover") }
        : trigger === "press"
          ? {
              onPointerDown: (e: RPointerEvent) => {
                if (e.button !== 0 || e.defaultPrevented) return;
                e.preventDefault();
                fire("start", "press");
                // The end comes when the pointer lets go anywhere, leaves the layer, or the browser
                // takes the gesture over (a scroll on a touch screen).
                const el = ref.current;
                const end = () => {
                  window.removeEventListener("pointerup", end);
                  window.removeEventListener("pointercancel", end);
                  el?.removeEventListener("pointerleave", end);
                  fire("end", "press");
                };
                window.addEventListener("pointerup", end);
                window.addEventListener("pointercancel", end);
                el?.addEventListener("pointerleave", end);
              },
            }
          : trigger === "down" || trigger === "up"
            ? {
                // Mouse down and mouse up: the pointer going down on the layer, or coming up over it
                // (wherever it went down). Nothing ends: what they open stays.
                [trigger === "down" ? "onPointerDown" : "onPointerUp"]: (e: RPointerEvent) => {
                  if (e.button !== 0 || e.defaultPrevented) return;
                  e.preventDefault();
                  fire("start", trigger);
                },
              }
            : trigger === "drag"
              ? {
                  onPointerDown: (e: RPointerEvent) => {
                    if (e.button !== 0 || e.defaultPrevented) return;
                    e.preventDefault(); // no text selection or native image drag while it is dragged
                    // A drag starts once the pointer has moved `DRAG_START` pixels with the button
                    // down; letting go before that is a click, which this trigger leaves alone.
                    const from = { x: e.clientX, y: e.clientY };
                    const stop = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", stop);
                      window.removeEventListener("pointercancel", stop);
                    };
                    const move = (ev: PointerEvent) => {
                      if (Math.hypot(ev.clientX - from.x, ev.clientY - from.y) < DRAG_START) return;
                      stop();
                      fire("start", "drag");
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", stop);
                    window.addEventListener("pointercancel", stop);
                  },
                }
              : {};
  const to = connection?.to;
  const own = go as { onClick?: (e: RMouseEvent) => void };
  const handlers = partsLive
    ? {
        ...go,
        onClick: (e: RMouseEvent) => {
          const part = e.defaultPrevented ? null : partOf(e.target);
          if (part) {
            e.preventDefault();
            run(part.conn, "start", "click", part.el.getBoundingClientRect());
            return;
          }
          own.onClick?.(e);
        },
      }
    : go;

  return (
    <div
      ref={ref}
      data-layer-id={node.id}
      data-layer-kind={node.kind}
      data-mode={(node.kind === "container" && node.mode) || undefined}
      data-connection={to}
      {...handlers}
      {...extraProps}
      style={live && POINTER_TRIGGERS.includes(trigger) ? { cursor: trigger === "drag" ? "grab" : "pointer", ...style } : style}
    >
      {content}
    </div>
  );
}

/** The triggers a person starts with the pointer on the layer: it shows a hand (a grabbing one for a drag). */
const POINTER_TRIGGERS: readonly Trigger[] = ["click", "press", "down", "up", "drag"];

/** Does a pressed key match a key trigger's? Letters match in either case. */
export function sameKey(pressed: string, wanted: string): boolean {
  return pressed === wanted || (pressed.length === 1 && wanted.length === 1 && pressed.toLowerCase() === wanted.toLowerCase());
}

/**
 * What a connection does on its own, with no state to keep: scroll scrolls the screen the layer is
 * on until the target layer shows, and link opens its address in a new tab.
 */
export function runLocal(c: Connection, from: HTMLElement | null): void {
  const action = actionOf(c);
  if (action === "scroll" && c.layer) {
    const screen = from?.closest(".composed-screen") ?? null;
    const target = (screen ?? document).querySelector<HTMLElement>(`[data-layer-id="${CSS.escape(c.layer)}"]`);
    if (target) scrollTo(target, screen);
  } else if (action === "link" && c.url) {
    window.open(c.url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Scrolls the nearest box around `target` that scrolls, inside `screen`, until the target's top-left
 * shows, on the axes that box scrolls only (the other is clipped on purpose). With none, the page
 * scrolls (an app whose screen is taller than the window).
 */
function scrollTo(target: HTMLElement, screen: Element | null): void {
  const scrolls = (v: string) => v === "auto" || v === "scroll";
  let el = target.parentElement;
  while (el && screen?.contains(el)) {
    const box: HTMLElement = el;
    const cs = getComputedStyle(box);
    const x = scrolls(cs.overflowX);
    const y = scrolls(cs.overflowY);
    if (x || y) {
      const t = target.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      box.scrollTo({ ...(x ? { left: box.scrollLeft + t.left - b.left } : {}), ...(y ? { top: box.scrollTop + t.top - b.top } : {}), behavior: "smooth" });
      return;
    }
    el = box.parentElement;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
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
