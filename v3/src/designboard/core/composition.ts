// Copied from designboard 3f221ae (src/core/composition.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { validCombo } from "./keys";
import { checkCondition, checkSet, checkVariables, MAX_BRANCHES, type Condition, type SetVariable, type Variable } from "./variables";
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
/** Where children sit along the main axis; the three `space-*` share the room left as CSS does. */
export type Justify = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
export const JUSTIFIES: readonly Justify[] = ["start", "center", "end", "space-between", "space-around", "space-evenly"];

export type Side = "top" | "right" | "bottom" | "left";
export const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];
/** Space tokens for single sides of a container's padding; a side left out uses `padding`. */
export type PaddingSides = Partial<Record<Side, string>>;

/**
 * One column or row of a grid: a share of the room left (`fr`), a fixed size (`px`), as big as its
 * content (`auto`), or a share that never shrinks below a size (`minmax`: `min` px, `max` fr, as
 * CSS's `minmax(200px, 1fr)`).
 */
export type GridTrack = { unit: "fr" | "px"; value: number } | { unit: "auto" } | { unit: "minmax"; min: number; max: number };

/** Where flex children sit across: the grid's three, or along the first line of text (`baseline`, as Figma's text baseline). */
export type FlexAlign = Align | "baseline";

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
  paddingSides?: PaddingSides;
  /** Where children sit across their cell (horizontally). Filling the cell is a child's `fill` sizing. */
  justifyItems: Align;
  /** Where children sit down their cell (vertically). */
  alignItems: Align;
  /** How children without a cell of their own fill the grid: along rows (then down) or along columns (then across). */
  flow: "row" | "column";
  /** Fill earlier holes with later children, as CSS's `dense`, instead of always moving on. */
  dense?: boolean;
  /**
   * Named areas, as CSS's `grid-template-areas`: one list of names per row, one name per column,
   * "." for a cell in no area. Each name covers a rectangle. A child takes one with `cell.area`.
   */
  areas?: string[][];
  /** The first child is drawn on top of the ones after it (Figma's "first on top"); by default the last one is. */
  firstOnTop?: boolean;
}

export type Layout =
  | { mode: "free" }
  /**
   * Children follow one another, laid out by the browser's flexbox. Gap and padding are space
   * tokens; `paddingSides` sets single sides. `reverse` runs the flow from the end (right to left,
   * or bottom to top), as CSS's row-reverse and column-reverse.
   */
  | {
      mode: "flex";
      direction: "row" | "column";
      gap: string;
      padding: string;
      paddingSides?: PaddingSides;
      align: FlexAlign;
      justify: Justify;
      wrap: boolean;
      reverse?: boolean;
      /** The first child is drawn on top of the ones after it (Figma's "first on top"); by default the last one is. */
      firstOnTop?: boolean;
    }
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
  /** A named area of the grid (`GridLayout.areas`); it wins over the numbers while the grid has that area. */
  area?: string;
}

/**
 * The cells of each named area: the rectangle its name covers, as 1-based lines and spans. Null
 * when the areas are not a valid template (rows of different lengths, a name that is not one
 * rectangle), which CSS would throw away whole.
 */
/** What an area may be called: a letter or _ first, then letters, digits, _ or -; "." is a cell in no area. */
export const AREA_NAME = /^[\p{L}_][\p{L}\p{N}_-]*$/u;

const areaCache = new WeakMap<readonly (readonly string[])[], Map<string, Required<Omit<GridCell, "area">>> | null>();

export function namedAreas(areas: readonly (readonly string[])[] | undefined): Map<string, Required<Omit<GridCell, "area">>> | null {
  if (!areas?.length) return new Map();
  // Layouts are replaced, never changed in place, so one map per template is enough.
  const known = areaCache.get(areas);
  if (known !== undefined) return known;
  const out = readAreas(areas);
  areaCache.set(areas, out);
  return out;
}

function readAreas(areas: readonly (readonly string[])[]): Map<string, Required<Omit<GridCell, "area">>> | null {
  const width = areas[0].length;
  if (!width || areas.some((r) => r.length !== width)) return null;
  const boxes = new Map<string, { c0: number; c1: number; r0: number; r1: number; count: number }>();
  areas.forEach((row, r) =>
    row.forEach((name, c) => {
      if (name === ".") return;
      const b = boxes.get(name);
      if (!b) boxes.set(name, { c0: c, c1: c, r0: r, r1: r, count: 1 });
      else boxes.set(name, { c0: Math.min(b.c0, c), c1: Math.max(b.c1, c), r0: Math.min(b.r0, r), r1: Math.max(b.r1, r), count: b.count + 1 });
    }),
  );
  const out = new Map<string, Required<Omit<GridCell, "area">>>();
  for (const [name, b] of boxes) {
    if (b.count !== (b.c1 - b.c0 + 1) * (b.r1 - b.r0 + 1)) return null;
    out.set(name, { column: b.c0 + 1, row: b.r0 + 1, columnSpan: b.c1 - b.c0 + 1, rowSpan: b.r1 - b.r0 + 1 });
  }
  return out;
}

/** A grid child's cell with its named area turned into lines; the numbers it has when the grid has no such area. */
export function cellIn(node: LayerNode, layout: GridLayout): GridCell | undefined {
  const cell = node.cell;
  if (!cell?.area) return cell;
  const area = namedAreas(layout.areas)?.get(cell.area);
  if (!area) {
    const { area: _gone, ...rest } = cell;
    return Object.keys(rest).length ? rest : undefined;
  }
  return area;
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
  /** The screen a click on this layer leads to (see `connections.ts`). */
  connection?: Connection;
  /** In a parent that scrolls (`scroll`): stays in place while the rest scrolls, as Figma's "Fix position when scrolling". */
  fixed?: boolean;
  /**
   * Shown in a played prototype only while this condition on a prototype variable holds (a tab's
   * content, a panel that opens). The board's canvas always shows the layer.
   */
  showWhen?: Condition;
}

/** Which way a screen or container scrolls when what it holds is bigger than it, as Figma's overflow scrolling. */
export type ScrollAxis = "vertical" | "horizontal" | "both";
export const SCROLL_AXES: readonly ScrollAxis[] = ["vertical", "horizontal", "both"];

/**
 * What starts a connection, as Figma's prototype triggers: a click, the pointer over the layer, a
 * press (the pointer held down on it), the pointer going down on it or coming up over it (mouse
 * down, mouse up), a drag that starts on it, a key, or a time after the screen shows. A hover and
 * a press end too: an overlay they open closes when the pointer leaves or lets go. Mouse down,
 * mouse up and drag do not end: what they open stays.
 */
export type Trigger = "click" | "hover" | "press" | "down" | "up" | "drag" | "key" | "delay";
export const TRIGGERS: readonly Trigger[] = ["click", "hover", "press", "down", "up", "drag", "key", "delay"];
/** How far the pointer moves, in pixels, before a press becomes a drag (the browsers' own threshold for a native drag is about this). */
export const DRAG_START = 4;
/** The key of a new key trigger. */
export const DEFAULT_KEY = "Enter";

/**
 * What a connection does: open another screen, show one on top (an overlay: a dialog, a menu),
 * swap the overlay it is in for another screen, go back to the screen before, close the overlay it
 * is in, scroll its screen to a layer, open a web address, change a component to another of its
 * variants (Figma's "change to"), or set a prototype variable.
 */
export type ConnectionAction = "navigate" | "overlay" | "swap" | "back" | "close" | "scroll" | "link" | "variant" | "set";
export const CONNECTION_ACTIONS: readonly ConnectionAction[] = ["navigate", "overlay", "swap", "back", "close", "scroll", "link", "variant", "set"];

/** Where an overlay sits on the screen under it: Figma's seven positions, or manual (beside the layer that opens it). */
export type OverlayPosition = "center" | "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "manual";
export const OVERLAY_POSITIONS: readonly OverlayPosition[] = ["center", "top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right", "manual"];

export interface OverlaySettings {
  position: OverlayPosition;
  /** Manual only: the overlay's top-left corner from the opening layer's top-left, in pixels. */
  x?: number;
  y?: number;
  /** A click outside the overlay closes it. */
  closeOutside: boolean;
  /** The screen under it darkens. */
  dim: boolean;
}

export const DEFAULT_OVERLAY: OverlaySettings = { position: "center", closeOutside: true, dim: true };
/** The wait of a new delay trigger, in milliseconds (Figma's default is 800). */
export const DEFAULT_DELAY = 800;
export const MAX_DELAY = 10000;

/**
 * A prototype connection on a layer, like Figma's: what starts it (`trigger`, a click when left
 * out), what it does (`action`, navigate when left out) and the screen it leads to or shows on
 * top (`to`, which back and close do not have). A file written before triggers and actions is
 * `{ to }`, a click that navigates, and still reads the same.
 */
export interface Connection {
  /** Id of the artboard it opens (navigate), shows on top (overlay) or swaps in (swap). */
  to?: string;
  trigger?: Trigger;
  /** For the delay trigger: milliseconds after the screen shows. */
  delay?: number;
  /** For the key trigger: the key, as `KeyboardEvent.key` names it, after its modifiers ("Enter", "k", "Ctrl+Shift+k"; `core/keys.ts`). */
  key?: string;
  /**
   * For scroll: the id of the layer on the same screen to scroll to. For variant: the id of the
   * component on the same screen that changes; left out, the layer itself.
   */
  layer?: string;
  /**
   * For variant: the variant properties to set and their values (`{ state: "hover" }`), as the
   * component's ficha names them. Properties left out keep the value the layer has.
   */
  variant?: Record<string, string>;
  /** For link: the web address it opens (http, https or mailto). */
  url?: string;
  /** For set: the prototype variable to change and how (`core/variables.ts`). */
  set?: SetVariable;
  /**
   * A condition on a prototype variable: the connection runs only while it holds (Figma's
   * conditional). Without one it always runs.
   */
  when?: Condition;
  /**
   * What runs instead when `when` does not hold: another action, with a condition and an `else`
   * of its own for an else-if. It has no trigger: the one of the connection it hangs from starts it.
   */
  else?: Connection;
  action?: ConnectionAction;
  /** For an overlay: where it sits and how it closes. */
  overlay?: OverlaySettings;
  /**
   * For navigate, overlay, swap and back: every component goes back to the file's variants when it
   * runs (Figma's "Reset component state"). Without it a changed variant is kept from screen to screen.
   */
  resetVariants?: boolean;
  /**
   * More actions the same trigger runs (D-0017), each with its own condition and `else` and no
   * trigger of its own. Only on the connection itself, not on its `else` branches or inside these.
   * They run with the first: the ones that change the screen in place first, then the ones that
   * leave it (`LEAVING`), each group in list order.
   */
  then?: Connection[];
}

export const actionOf = (c: Connection): ConnectionAction => c.action ?? "navigate";
/** Navigate, overlay and swap lead to a screen and need one; the others take none. */
export const actionNeedsScreen = (a: ConnectionAction): boolean => a === "navigate" || a === "overlay" || a === "swap";
/** Overlay and swap show a screen on top of another. */
export const showsOnTop = (a: ConnectionAction): boolean => a === "overlay" || a === "swap";
/**
 * The triggers an action can take. A link opens a tab, which browsers allow only on a person's own
 * click, press (mouse down or up too) or key, not on a move; a swap has nothing to undo when a
 * hover or press ends.
 */
export function triggersFor(a: ConnectionAction): readonly Trigger[] {
  if (a === "link") return ["click", "press", "down", "up", "key"];
  if (a === "swap") return ["click", "down", "up", "drag", "key", "delay"];
  return TRIGGERS;
}
/** A saved `variant` value cleaned up: property → value, both text; none left means no variant change. */
function variantValues(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (k && typeof v === "string") out[k] = v;
  return Object.keys(out).length ? out : undefined;
}
/** Addresses a link may open: the web and e-mail, never script. */
export const isLinkUrl = (u: string): boolean => /^(https?:\/\/[^\s]+|mailto:[^\s]+)$/i.test(u.trim());
export const triggerOf = (c: Connection): Trigger => c.trigger ?? "click";
/** Does the connection lead to a screen (navigate, overlay, swap)? The others do not. */
export const leadsTo = (c: Connection): c is Connection & { to: string } => actionNeedsScreen(actionOf(c)) && !!c.to;

/**
 * A saved `connection` value cleaned up. Navigate, overlay and swap need a screen, scroll a layer,
 * link a web address, variant at least one property to set and set a variable; back and close
 * take none. A condition (`when`) and what runs otherwise (`else`) are kept when they are valid. Defaults are left out (a click, navigate), so
 * an old `{ to }` stays as it is.
 */
/**
 * A part's connection: a connection that runs on a click, so a trigger, wait or key it was given
 * is dropped. Null (the part turned off) stays null.
 */
export function checkPartConnection(raw: unknown): Connection | null | undefined {
  if (raw === null) return null;
  const c = checkConnection(raw);
  if (!c) return undefined;
  const { trigger: _t, delay: _d, key: _k, ...click } = c;
  return click;
}

/** The node with its part connections checked; ids must be plain words, a part that reads as nothing is left out. */
export function withParts(node: ComponentNode, raw: unknown): ComponentNode {
  const { parts: _old, ...rest } = node;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return rest;
  const parts: Record<string, Connection | null> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[\w-]+$/.test(id)) continue;
    const c = checkPartConnection(v);
    if (c !== undefined) parts[id] = c;
  }
  return Object.keys(parts).length ? { ...rest, parts } : rest;
}

export function checkConnection(raw: unknown, branch = 0): Connection | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  // An `else` is checked like any connection; a branch that is not valid is skipped for the one after it.
  const when = checkCondition(r.when);
  const other = when && branch < MAX_BRANCHES ? checkConnection(r.else, branch + 1) : undefined;
  const own = checkAction(r, branch > 0);
  if (!own) return branch > 0 ? other : undefined;
  if (when) own.when = when;
  if (other) own.else = other;
  // The list of more actions hangs on the connection itself only (D-0017).
  if (branch === 0 && Array.isArray(r.then)) {
    const then = r.then.slice(0, MAX_ACTIONS - 1).flatMap((t) => {
      const c = checkConnection(t, 1);
      return c ? [c] : [];
    });
    if (then.length) own.then = then;
  }
  return own;
}

/** The most actions one trigger runs (D-0017). */
export const MAX_ACTIONS = 8;

/** The actions that leave the screen: in a list, they run after the ones that change it in place (D-0017). */
export const LEAVING: readonly ConnectionAction[] = ["navigate", "swap", "back", "close"];

/** Every action of a connection, in list order: itself, then each of `then`. */
export function actionsOf(c: Connection | undefined): Connection[] {
  return c ? [c, ...(c.then ?? [])] : [];
}

/** Actions in the order they run (D-0017): the ones that change the screen in place, then the ones that leave it, each group in list order. */
export function runOrder<T extends Connection>(list: readonly T[]): T[] {
  const leaves = (c: T) => LEAVING.includes(actionOf(c));
  return [...list.filter((c) => !leaves(c)), ...list.filter(leaves)];
}

/** The first action of a connection that leads to a screen, if any: where its arrow on the board goes. */
export function leadOf(c: Connection | undefined): (Connection & { to: string }) | undefined {
  return actionsOf(c).find(leadsTo);
}

/**
 * The connection with each of its actions passed through `fn` (the first and each of `then`):
 * undefined leaves an action, null removes it. Removing the first makes the next one the first,
 * keeping the first's trigger; removing every action returns undefined.
 */
export function mapActions(c: Connection, fn: (a: Connection) => Connection | null | undefined): Connection | undefined {
  const list = actionsOf(c).map((a, i) => {
    const plain = i === 0 ? (({ then: _t, ...rest }) => rest)(a) : a;
    const next = fn(plain);
    return next === undefined ? plain : next;
  });
  const kept = list.filter((a): a is Connection => !!a);
  if (!kept.length) return undefined;
  const [first, ...rest] = kept;
  const trigger = { trigger: c.trigger, delay: c.delay, key: c.key };
  const head = checkConnection({ ...first, ...trigger, then: rest });
  return head;
}

/** One branch of a connection: its action and, unless it is an `else`, its trigger. */
function checkAction(r: Record<string, unknown>, isElse: boolean): Connection | undefined {
  const action = CONNECTION_ACTIONS.find((a) => a === r.action) ?? "navigate";
  const to = typeof r.to === "string" && r.to ? r.to : undefined;
  if (actionNeedsScreen(action) && !to) return undefined;
  const layer = typeof r.layer === "string" && r.layer ? r.layer : undefined;
  if (action === "scroll" && !layer) return undefined;
  const url = typeof r.url === "string" && isLinkUrl(r.url) ? r.url.trim() : undefined;
  if (action === "link" && !url) return undefined;
  const variant = action === "variant" ? variantValues(r.variant) : undefined;
  if (action === "variant" && !variant) return undefined;
  const set = action === "set" ? checkSet(r.set) : undefined;
  if (action === "set" && !set) return undefined;
  const out: Connection = {};
  if (set) out.set = set;
  if (to && actionNeedsScreen(action)) out.to = to;
  if (action === "scroll") out.layer = layer;
  if (variant) {
    if (layer) out.layer = layer;
    out.variant = variant;
  }
  if (action === "link") out.url = url;
  if (r.resetVariants === true && (actionNeedsScreen(action) || action === "back")) out.resetVariants = true;
  const trigger = isElse ? undefined : triggersFor(action).find((t) => t === r.trigger);
  if (trigger && trigger !== "click") out.trigger = trigger;
  if (trigger === "delay") out.delay = typeof r.delay === "number" && Number.isFinite(r.delay) ? Math.min(MAX_DELAY, Math.max(0, Math.round(r.delay))) : DEFAULT_DELAY;
  // Esc belongs to closing overlays and leaving the player.
  // A key with its modifiers ("Ctrl+k", `core/keys.ts`); Esc belongs to closing overlays and leaving the player.
  if (trigger === "key") out.key = validCombo(r.key) ? r.key : DEFAULT_KEY;
  if (action !== "navigate") out.action = action;
  if (showsOnTop(action)) {
    const o = (r.overlay && typeof r.overlay === "object" ? r.overlay : {}) as Record<string, unknown>;
    const position = OVERLAY_POSITIONS.find((p) => p === o.position) ?? DEFAULT_OVERLAY.position;
    const px = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0);
    out.overlay = {
      position,
      ...(position === "manual" ? { x: px(o.x), y: px(o.y) } : {}),
      closeOutside: typeof o.closeOutside === "boolean" ? o.closeOutside : DEFAULT_OVERLAY.closeOutside,
      dim: typeof o.dim === "boolean" ? o.dim : DEFAULT_OVERLAY.dim,
    };
  }
  return out;
}

/** A component from the library, drawn by its own code with these params. */
export interface ComponentNode extends LayerBase {
  kind: "component";
  /** Component type in the library. */
  type: string;
  params: Params;
  /**
   * Params that take a prototype variable's value while the prototype is played: param key →
   * variable id. The layer's own value shows on the canvas and whenever the variable's does not fit.
   */
  bind?: Record<string, string>;
  /**
   * What a click on each part of the component does (`ComponentDef.parts`), where the layer differs
   * from its ficha: part id → a connection, or null for none. A part left out does what the ficha says.
   */
  parts?: Record<string, Connection | null>;
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
  /** A line round its edge, from tokens (D-0016). Drawn over its children and taking no room, as Figma's inside stroke. */
  border?: ContainerBorder;
  /** Shadow token path (D-0016). */
  shadow?: string;
  /** Cut off children that leave the box. */
  clip: boolean;
  /** Scrolls what does not fit (and so clips it on that axis too). */
  scroll?: ScrollAxis;
  /**
   * The token mode it and everything inside it use (`dark`), as Figma's modes on a frame;
   * none follows the screen or the container around it.
   */
  mode?: string;
}

/** A container's border: a width token, a colour token, and the sides it is on (all when left out). */
export interface ContainerBorder {
  width: string;
  color: string;
  sides?: Side[];
}

/** A border as read from a file: both tokens named, sides known and not repeated; all four sides are left out. */
export function checkBorder(raw: unknown): ContainerBorder | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.width !== "string" || !r.width || typeof r.color !== "string" || !r.color) return undefined;
  const out: ContainerBorder = { width: r.width, color: r.color };
  if (Array.isArray(r.sides)) {
    const sides = SIDES.filter((x) => (r.sides as unknown[]).includes(x));
    if (!sides.length) return undefined;
    if (sides.length < 4) out.sides = sides;
  }
  return out;
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
  /** The board page it is on (`Composition.pages`); the first page when left out. Apps ignore it. */
  page?: string;
  /**
   * False lets what the screen holds show past its edges, as a bar whose chips grow above it or
   * whose tooltip rises over the page. Absent means clipped, as before.
   */
  clip?: boolean;
  /** Scrolls what does not fit inside the screen's height or width (and so clips it). */
  scroll?: ScrollAxis;
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
  /** Named starting points for walking the prototype, as Figma's flows: each starts on a screen. */
  flows?: Flow[];
  /** Prototype variables, as Figma's, with the value each starts with (`core/variables.ts`). */
  variables?: Variable[];
  /** Pages of the board, as Figma's: each shows its own screens. None means one page. Apps ignore them. */
  pages?: Page[];
  /** Named areas of the canvas that hold screens, as Figma's sections. Apps ignore them. */
  sections?: Section[];
}

/** A page of the board: a name; a screen says which page it is on (`Artboard.page`), the first one by default. */
export interface Page {
  id: string;
  name: string;
}

/** A section: a named box on the canvas, on one page. The screens inside it move with it. */
export interface Section {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The page it is on; the first one when left out. */
  page?: string;
}

/** A prototype flow: a name and the screen it starts on. */
export interface Flow {
  id: string;
  name: string;
  start: string;
}

/** Flows as read from a file: each with a name and a screen that exists; none at all reads as undefined. */
function checkFlows(raw: unknown, screens: ReadonlySet<string>): Flow[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw.flatMap((f): Flow[] => {
    const r = f as Record<string, unknown> | null;
    if (!r || typeof r.start !== "string" || !screens.has(r.start)) return [];
    return [{ id: typeof r.id === "string" && r.id ? r.id : newId(), name: typeof r.name === "string" && r.name.trim() ? r.name : "Flujo", start: r.start }];
  });
  return out.length ? out : undefined;
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

/** The space token of each side of a container's padding. */
export function paddingTokens(layout: Exclude<Layout, { mode: "free" }>): Record<Side, string> {
  const s = layout.paddingSides ?? {};
  return { top: s.top ?? layout.padding, right: s.right ?? layout.padding, bottom: s.bottom ?? layout.padding, left: s.left ?? layout.padding };
}

/** Each side of a container's padding in pixels; all zero for a free layout. */
export function paddingPx(layout: Layout, px: (token: string) => number): Record<Side, number> {
  if (layout.mode === "free") return { top: 0, right: 0, bottom: 0, left: 0 };
  const t = paddingTokens(layout);
  return { top: px(t.top), right: px(t.right), bottom: px(t.bottom), left: px(t.left) };
}

/** The padding along a stack's flow (both ends added) and across it. */
function axisPad(pad: Record<Side, number>, column: boolean): { main: number; cross: number } {
  const v = pad.top + pad.bottom;
  const h = pad.left + pad.right;
  return column ? { main: v, cross: h } : { main: h, cross: v };
}

/** A layout of another mode that keeps what the two share: the gap and the padding. */
export function changeLayoutMode(layout: Layout, mode: LayoutMode): Layout {
  if (layout.mode === mode) return layout;
  if (mode === "free") return { mode: "free" };
  const gap = layout.mode === "flex" ? layout.gap : layout.mode === "grid" ? layout.columnGap : undefined;
  const padding = layout.mode === "free" ? undefined : layout.padding;
  const sides = layout.mode === "free" || !layout.paddingSides ? {} : { paddingSides: layout.paddingSides };
  if (mode === "flex") {
    const d = defaultFlex();
    return { ...d, gap: gap ?? d.gap, padding: padding ?? d.padding, ...sides };
  }
  const d = defaultGrid();
  return { ...d, columnGap: gap ?? d.columnGap, rowGap: gap ?? d.rowGap, padding: padding ?? d.padding, ...sides };
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

/**
 * The token mode a layer is drawn in: the nearest container around it (or itself) that sets one,
 * else the screen's. Undefined is the base mode.
 */
export function modeAt(board: Artboard, nodeId: string): string | undefined {
  const find = (list: readonly LayerNode[], around: string | undefined): { mode: string | undefined } | null => {
    for (const n of list) {
      const own = n.kind === "container" && n.mode ? n.mode : around;
      if (n.id === nodeId) return { mode: own };
      if (hasChildren(n)) {
        const hit = find(n.children, own);
        if (hit) return hit;
      }
    }
    return null;
  };
  return find(board.children, board.mode)?.mode ?? board.mode;
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
export function reorderTo<T extends { id: string }>(nodes: readonly T[], id: string, frames: ReadonlyMap<string, Frame>, point: number, column: boolean, reverse = false): T[] {
  const moving = nodes.find((n) => n.id === id);
  if (!moving) return [...nodes];
  const rest = nodes.filter((n) => n.id !== id);
  let index = rest.length;
  for (let i = 0; i < rest.length; i++) {
    const f = frames.get(rest[i].id);
    if (!f) continue;
    const mid = column ? f.y + f.h / 2 : f.x + f.w / 2;
    // A reversed flow runs from the right (or bottom): a layer comes before the ones it is past.
    if (reverse ? point > mid : point < mid) {
      index = i;
      break;
    }
  }
  return [...rest.slice(0, index), moving, ...rest.slice(index)];
}

/**
 * A deep copy of a layer with fresh ids for it and everything inside it. A scroll connection to a
 * layer inside the copy follows the copy, so a copied section scrolls within itself.
 */
export function cloneNode(n: LayerNode): LayerNode {
  const ids = new Map<string, string>();
  const copy = (m: LayerNode): LayerNode => {
    const id = newId();
    ids.set(m.id, id);
    if (m.kind === "component") return { ...m, id, params: { ...m.params } };
    return { ...m, id, children: m.children.map(copy) } as LayerNode;
  };
  return retarget([copy(n)], ids)[0];
}

/** Scroll and variant connections pointed at the new ids of copied layers (`ids`: old id to new). */
export function retarget(list: readonly LayerNode[], ids: ReadonlyMap<string, string>): LayerNode[] {
  return list.map((n) => {
    const layer = n.connection?.layer;
    const m = layer && ids.has(layer) ? { ...n, connection: { ...n.connection!, layer: ids.get(layer)! } } : n;
    return hasChildren(m) ? ({ ...m, children: retarget(m.children, ids) } as LayerNode) : m;
  });
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

/**
 * Moves every layer of a list by its anchors when its parent's box goes from `from` to `to`, at
 * every depth. With `freshIds`, every layer gets a new id and scroll connections follow them.
 */
export function reflowChildren(list: readonly LayerNode[], from: { w: number; h: number }, to: { w: number; h: number }, freshIds = false, px?: (token: string) => number): LayerNode[] {
  if (!freshIds) return reflowList(list, from, to, null, px);
  const ids = new Map<string, string>();
  return retarget(reflowList(list, from, to, ids, px), ids);
}

/**
 * The narrowest a grid child can be: its stored width when fixed or hugging, its minimum when it
 * fills its cell (its stored width when it has none: the width it was designed at).
 */
function minWidthOf(n: LayerNode): number {
  if (n.kind !== "group" && n.sizing.w.mode === "fill") return n.sizing.w.min ?? n.w;
  return n.w;
}

/**
 * A grid laid out again for a new width (D-0018): it keeps as many of its columns as fit, where a
 * column fits when its children's widest minimum width (or a track's own px size) does, with the
 * gaps and padding. At least one column stays. Children placed in a column that went, or spanning
 * past the last one, are placed by the grid instead, spans cut to the columns left; named areas
 * that no longer fit go, and so do their children's area names. A grid that fills columns first
 * (`flow: "column"`) makes new columns of its own, so it is left as it is, as is a grid that
 * already fits. Returns the layout and children, unchanged when nothing changes.
 */
export function fitGridToWidth(layout: GridLayout, children: readonly LayerNode[], width: number, px: (token: string) => number): { layout: GridLayout; children: LayerNode[]; columns: number } {
  const unchanged = { layout, children: [...children], columns: layout.columns.length };
  if (layout.flow !== "row" || layout.columns.length <= 1) return unchanged;
  const pad = paddingPx(layout, px);
  const gap = px(layout.columnGap);
  const room = width - pad.left - pad.right;
  const flow = children.filter((c) => !c.hidden && !c.absolute);
  const childMin = Math.max(0, ...flow.map((c) => minWidthOf(c) / Math.max(1, c.cell?.columnSpan ?? 1)));
  const trackMin = (t: GridTrack) => (t.unit === "px" ? t.value : t.unit === "minmax" ? t.min : 0);
  let count = layout.columns.length;
  const fits = (n: number) => {
    const cols = layout.columns.slice(0, n);
    return cols.reduce((sum, t) => sum + Math.max(childMin, trackMin(t)), 0) + gap * (n - 1) <= room;
  };
  while (count > 1 && !fits(count)) count--;
  if (count === layout.columns.length) return unchanged;
  const columns = layout.columns.slice(0, count);
  const areasFit = layout.areas?.every((row) => row.length <= count);
  const next: GridLayout = { ...layout, columns };
  if (layout.areas && !areasFit) delete next.areas;
  const fixed = children.map((c) => {
    const cell = c.cell;
    if (!cell) return c;
    const out: GridCell = { ...cell };
    if (out.area && !areasFit) delete out.area;
    if (out.columnSpan && out.columnSpan > count) out.columnSpan = count;
    if (out.column && out.column + (out.columnSpan ?? 1) - 1 > count) {
      delete out.column;
      delete out.row;
    }
    if (out.columnSpan === 1) delete out.columnSpan;
    const { cell: _old, ...rest } = c;
    return (Object.keys(out).length ? { ...rest, cell: out } : rest) as LayerNode;
  });
  return { layout: next, children: fixed, columns: count };
}

/**
 * The grids whose columns an adapted copy changed, compared layer by layer with the screen it was
 * made from (same order, new ids): the screen's own first, then each container's, by name.
 */
export function gridChanges(before: Artboard, after: Artboard): { name: string; from: number; to: number }[] {
  const out: { name: string; from: number; to: number }[] = [];
  const cols = (l: Layout) => (l.mode === "grid" ? l.columns.length : 0);
  if (cols(before.layout) !== cols(after.layout)) out.push({ name: after.name, from: cols(before.layout), to: cols(after.layout) });
  const walk = (a: readonly LayerNode[], b: readonly LayerNode[]) =>
    a.forEach((n, i) => {
      const m = b[i];
      if (!m || n.kind === "component" || m.kind === "component") return;
      if (n.kind === "container" && m.kind === "container" && cols(n.layout) !== cols(m.layout)) out.push({ name: n.name, from: cols(n.layout), to: cols(m.layout) });
      walk(n.children, m.children);
    });
  walk(before.children, after.children);
  return out;
}

function reflowList(list: readonly LayerNode[], from: { w: number; h: number }, to: { w: number; h: number }, ids: Map<string, string> | null, px?: (token: string) => number): LayerNode[] {
  return list.map((m) => {
    // A group's size is its children's bounds, whatever its stored w and h say.
    const n = m.kind === "group" ? { ...m, ...storedBounds(m.children) } : m;
    const f = from.w === to.w && from.h === to.h ? { x: n.x, y: n.y, w: n.w, h: n.h } : reflow(n, n.anchor, from, to);
    const id = ids ? newId() : n.id;
    ids?.set(n.id, id);
    if (n.kind === "component") return { ...n, ...f, id, params: { ...n.params } };
    const children = reflowList(n.children, { w: n.w, h: n.h }, { w: f.w, h: f.h }, ids, px);
    // A grid narrower than before keeps the columns that fit (D-0018).
    if (px && n.kind === "container" && n.layout.mode === "grid" && f.w < n.w) {
      const fit = fitGridToWidth(n.layout, children, f.w, px);
      return { ...n, ...f, id, layout: fit.layout, children: fit.children } as LayerNode;
    }
    return { ...n, ...f, id, children } as LayerNode;
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

/**
 * A copy of an artboard at another size, every layer moved by its anchors and given a new id. With
 * `px` (token path → pixels), a grid on a narrower copy, the screen's own or a container's, keeps
 * only the columns that fit (D-0018, `fitGridToWidth`).
 */
export function adaptArtboard(board: Artboard, size: { width: number; height: number }, name: string, at: { x: number; y: number }, px?: (token: string) => number): Artboard {
  const children = reflowChildren(board.children, { w: board.width, h: board.height }, { w: size.width, h: size.height }, true, px);
  const fit = px && board.layout.mode === "grid" && size.width < board.width ? fitGridToWidth(board.layout, children, size.width, px) : null;
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
    layout: fit ? fit.layout : board.layout,
    children: fit ? fit.children : children,
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
  const pad = paddingPx(layout, px);
  if (layout.mode === "grid") {
    const g = gridGeometry(layout, children, { w: null, h: null }, px);
    const span = (tracks: readonly TrackLine[]) => (tracks.length ? tracks[tracks.length - 1].start + tracks[tracks.length - 1].size : 0);
    return { w: span(g.columns) + pad.left + pad.right, h: span(g.rows) + pad.top + pad.bottom };
  }
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
  const across = axisPad(pad, column);
  main += gap * Math.max(0, flow.length - 1) + across.main;
  cross += across.cross;
  return column ? { w: cross, h: main } : { w: main, h: cross };
}

function layoutFlex(layout: FlexLayout, children: readonly LayerNode[], box: Frame, px: Px, out: Map<string, Frame>) {
  const pad = paddingPx(layout, px);
  const gap = px(layout.gap);
  const column = layout.direction === "column";
  const mainSize = column ? box.h : box.w;
  const sum = axisPad(pad, column);
  // A reversed flow is laid out from its own start (the right or bottom edge) and turned round at the end.
  const mainStart = column ? (layout.reverse ? pad.bottom : pad.top) : layout.reverse ? pad.right : pad.left;
  const crossStart = column ? pad.left : pad.top;
  const innerMain = mainSize - sum.main;
  const innerCross = (column ? box.w : box.h) - sum.cross;
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

  let crossCursor = crossStart;
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
    let cursor = mainStart;
    let step = gap;
    const n = ln.length;
    if (layout.justify === "center") cursor += free / 2;
    else if (layout.justify === "end") cursor += free;
    else if (layout.justify === "space-between" && n > 1) step = gap + free / (n - 1);
    else if (layout.justify === "space-around") {
      cursor += free / (2 * n);
      step = gap + free / n;
    } else if (layout.justify === "space-evenly") {
      cursor += free / (n + 1);
      step = gap + free / (n + 1);
    }

    // A wrapping container is multi-line in CSS even with one line: each line is as tall as its tallest child.
    const lineCross = layout.wrap ? Math.max(...ln.map((it) => it.cross)) : innerCross;
    for (const it of ln) {
      const align = it.node.alignSelf ?? layout.align;
      const room = lineCross - it.cross;
      // Baseline needs the text's metrics, which only the browser has: here it is the start, and the
      // board replaces these frames with the ones the browser measures.
      const offset = align === "center" ? room / 2 : align === "end" ? room : 0;
      const along = layout.reverse ? mainSize - cursor - it.main : cursor;
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
      const cell = cellIn(c, layout) ?? {};
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
    // Dense packing takes the first free place in the line, not the one after the last placed.
    let minor = layout.dense ? 0 : (lineCursor.get(it.major) ?? 0);
    while (minor + it.minorSpan <= minorCount && !fits(it.major, minor, it)) minor++;
    if (minor + it.minorSpan > minorCount) minorCount = minor + it.minorSpan;
    put(it, it.major, minor);
    lineCursor.set(it.major, minor + it.minorSpan);
  }

  let cMajor = 0;
  let cMinor = 0;
  for (const it of items) {
    if (it.major !== undefined) continue;
    // Dense packing looks for the first hole from the start each time, as CSS does.
    if (layout.dense) {
      cMajor = 0;
      cMinor = 0;
    }
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
  const isFr = (i: number) => kind(i).unit === "fr" || kind(i).unit === "minmax";
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
  const factor = (i: number) => {
    const t = kind(i);
    return Math.max(0, t.unit === "minmax" ? t.max : (t as { value: number }).value);
  };
  const floor = (i: number) => {
    const t = kind(i);
    return t.unit === "minmax" ? Math.max(0, t.min) : 0;
  };
  let fr: number;
  if (room !== null) {
    // A minmax track whose share would fall below its minimum keeps its minimum, and the others share the rest.
    const fixed = new Set<number>();
    for (;;) {
      const left = room - sizes.reduce((s, v, i) => s + (isFr(i) && !fixed.has(i) ? 0 : isFr(i) ? floor(i) : v), 0) - gap * Math.max(0, count - 1);
      const flex = frs.filter((i) => !fixed.has(i));
      fr = Math.max(0, left) / Math.max(1, flex.reduce((s, i) => s + factor(i), 0));
      const under = flex.filter((i) => fr * factor(i) < floor(i));
      if (!under.length) break;
      for (const i of under) fixed.add(i);
    }
    for (const i of frs) sizes[i] = fixed.has(i) ? floor(i) : fr * factor(i);
    return sizes;
  } else {
    fr = 0;
    for (const it of items) {
      const spanned = range(it);
      if (!spanned.some(isFr)) continue;
      const left = it.size - spanned.reduce((s, i) => s + (isFr(i) ? 0 : sizes[i]), 0) - gap * (it.span - 1);
      fr = Math.max(fr, left / Math.max(1, spanned.filter(isFr).reduce((s, i) => s + factor(i), 0)));
    }
  }
  for (const i of frs) sizes[i] = Math.max(floor(i), fr * factor(i));
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
  const pad = paddingPx(layout, px);
  const g = gridGeometry(layout, children, { w: box.w - pad.left - pad.right, h: box.h - pad.top - pad.bottom }, px);
  return {
    areas: g.areas,
    columns: g.columns.map((t) => ({ start: box.x + pad.left + t.start, size: t.size })),
    rows: g.rows.map((t) => ({ start: box.y + pad.top + t.start, size: t.size })),
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
    const mm = t as { min?: unknown; max?: unknown };
    if (track?.unit === "minmax" && typeof mm.min === "number" && typeof mm.max === "number" && Number.isFinite(mm.min) && Number.isFinite(mm.max) && mm.min >= 0 && mm.max >= 0) {
      return [{ unit: "minmax", min: mm.min, max: mm.max }];
    }
    if ((track?.unit === "fr" || track?.unit === "px") && typeof track.value === "number" && Number.isFinite(track.value) && track.value >= 0) {
      return [{ unit: track.unit, value: track.value }];
    }
    return [];
  });
}

/** Single-side padding tokens as read from a file: only string tokens on known sides; none at all reads as undefined. */
function checkSides(raw: unknown): { paddingSides?: PaddingSides } {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const sides: PaddingSides = {};
  for (const k of SIDES) if (typeof r[k] === "string") sides[k] = r[k] as string;
  return Object.keys(sides).length ? { paddingSides: sides } : {};
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
    ...checkSides(layout.paddingSides),
    justifyItems: pickAlign(layout.justifyItems),
    alignItems: pickAlign(layout.alignItems),
    flow: layout.flow === "column" ? "column" : "row",
    ...(layout.dense === true ? { dense: true } : {}),
    ...checkAreas(layout.areas),
    ...(layout.firstOnTop === true ? { firstOnTop: true } : {}),
  };
}

/** Named areas as read from a file: kept only when they make a valid template. */
function checkAreas(raw: unknown): { areas?: string[][] } {
  if (!Array.isArray(raw) || !raw.length) return {};
  const rows = raw.map((r) => (Array.isArray(r) ? r.map((n) => (typeof n === "string" && (n === "." || AREA_NAME.test(n)) ? n : null)) : null));
  if (rows.some((r) => !r || r.some((n) => n === null))) return {};
  const areas = rows as string[][];
  return namedAreas(areas) ? { areas } : {};
}

function checkCell(raw: unknown): GridCell | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const cell: GridCell = {};
  for (const k of ["column", "row", "columnSpan", "rowSpan"] as const) {
    const v = whole(typeof c[k] === "number" ? (c[k] as number) : undefined, 1);
    if (v !== undefined) cell[k] = v;
  }
  if (typeof c.area === "string" && c.area && c.area !== ".") cell.area = c.area;
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
    ...checkSides(layout.paddingSides),
    align: layout.align === "center" || layout.align === "end" || layout.align === "baseline" ? layout.align : "start",
    justify: JUSTIFIES.find((j) => j === layout.justify) ?? "start",
    wrap: layout.wrap === true,
    ...(layout.reverse === true ? { reverse: true } : {}),
    ...(layout.firstOnTop === true ? { firstOnTop: true } : {}),
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
    connection: checkConnection(n.connection),
    fixed: n.fixed === true || undefined,
    showWhen: checkCondition(n.showWhen),
    scroll: n.kind === "container" ? SCROLL_AXES.find((a) => a === n.scroll) : undefined,
    mode: n.kind === "container" && typeof n.mode === "string" && n.mode ? n.mode : undefined,
  };
  for (const k of ["alignSelf", "justifySelf", "cell", "connection", "fixed", "showWhen", "scroll", "mode"] as const) if (base[k] === undefined) delete base[k];
  switch (n.kind) {
    case "component":
      if (typeof n.type !== "string") throw new Error(`${label}: falta el tipo de componente.`);
      return withParts(withBind({ ...base, kind: "component", type: n.type, params: (n.params as Params) ?? {} } as ComponentNode, n.bind), n.parts);
    case "container": {
      const out = {
        ...base,
        kind: "container",
        layout: checkLayout(n.layout, label),
        clip: n.clip !== false,
        children: checkChildren(n.children, label),
        border: checkBorder(n.border),
        shadow: typeof n.shadow === "string" && n.shadow ? n.shadow : undefined,
      } as ContainerNode;
      if (!out.border) delete out.border;
      if (!out.shadow) delete out.shadow;
      return out;
    }
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
      if (!SCROLL_AXES.includes(b.scroll as ScrollAxis)) delete out.scroll;
      if (typeof b.minWidth !== "number" || !Number.isFinite(b.minWidth) || b.minWidth < 0) delete out.minWidth;
      return out;
    }),
  };
  if (typeof out.runtime !== "string") delete out.runtime;
  const flows = checkFlows(c.flows, new Set(out.artboards.map((b) => b.id)));
  if (flows) out.flows = flows;
  else delete out.flows;
  const pages = checkPages(c.pages);
  if (pages) out.pages = pages;
  else delete out.pages;
  const pageIds = new Set((pages ?? []).map((p) => p.id));
  // A screen or section on a page that is gone goes to the first page.
  out.artboards = out.artboards.map((b) => (b.page !== undefined && !(typeof b.page === "string" && pageIds.has(b.page)) ? withoutPage(b) : b));
  const sections = checkSections(c.sections, pageIds);
  if (sections) out.sections = sections;
  else delete out.sections;
  const variables = checkVariables(c.variables);
  if (variables) out.variables = variables;
  else delete out.variables;
  return out;
}

/** A component with its saved `bind` cleaned up: param key → variable id, both text; none left means no binding. */
function withBind(node: ComponentNode, raw: unknown): ComponentNode {
  const { bind: _old, ...rest } = node;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return rest;
  const bind = Object.fromEntries(Object.entries(raw).filter(([k, v]) => k && typeof v === "string" && v));
  return Object.keys(bind).length ? { ...rest, bind: bind as Record<string, string> } : rest;
}

function withoutPage<T extends { page?: string }>(x: T): T {
  const { page: _p, ...rest } = x;
  return rest as T;
}

function checkPages(raw: unknown): Page[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const out = raw.flatMap((p): Page[] => {
    const r = p as Partial<Page> | null;
    if (!r || typeof r.id !== "string" || !r.id || seen.has(r.id)) return [];
    seen.add(r.id);
    return [{ id: r.id, name: typeof r.name === "string" && r.name.trim() ? r.name : "Página" }];
  });
  return out.length ? out : undefined;
}

function checkSections(raw: unknown, pages: ReadonlySet<string>): Section[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const out = raw.flatMap((x): Section[] => {
    const r = x as Partial<Section> | null;
    if (!r || typeof r.id !== "string" || !r.id || seen.has(r.id) || [r.x, r.y, r.w, r.h].some((v) => typeof v !== "number" || !Number.isFinite(v))) return [];
    seen.add(r.id);
    const s: Section = { id: r.id, name: typeof r.name === "string" ? r.name : "Sección", x: r.x!, y: r.y!, w: Math.max(1, r.w!), h: Math.max(1, r.h!) };
    if (typeof r.page === "string" && pages.has(r.page)) s.page = r.page;
    return [s];
  });
  return out.length ? out : undefined;
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
