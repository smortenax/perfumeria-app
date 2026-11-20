// Copied from designboard 3f221ae (src/core/connections.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { Artboard, Composition, Connection, ConnectionAction, Frame, LayerNode } from "./composition";
import { actionOf, actionsOf, checkConnection, findNode, leadOf, leadsTo, mapActions, newId, updateNode, walk } from "./composition";
import { mapPartConnections, ownPartConnections } from "./parts";

export { actionOf, checkConnection, leadsTo, triggerOf, type Connection } from "./composition";

/**
 * Connections between screens, like Figma's prototype connections: a layer (a button, a row of a
 * list) says which screen a click on it leads to. The link lives on the layer, as
 * `connection: { to: "<artboard id>" }`, so it travels with the layer when it is copied or moved,
 * and the composition file is the one place it is kept.
 *
 * The board draws an arrow from each connected layer to its screen. An app that wants the link
 * passes `onNavigate` to `ComposedScreen` and gets the target screen and its route on a click.
 */

/** One connection on the board, with where it starts. */
export interface ScreenLink {
  boardId: string;
  nodeId: string;
  to: string;
  /** Navigate or overlay: the board draws an overlay's arrow dashed. */
  action: ConnectionAction;
  /** False when the target screen no longer exists. */
  ok: boolean;
}

/** Every connection in the composition, at any depth, in board and layer order. */
export function screenLinks(c: Composition): ScreenLink[] {
  const ids = new Set(c.artboards.map((b) => b.id));
  const out: ScreenLink[] = [];
  for (const b of c.artboards) {
    walk(b.children, (n) => {
      // A list of actions draws one arrow, to the first screen it leads to (D-0017).
      const lead = leadOf(n.connection);
      if (lead) out.push({ boardId: b.id, nodeId: n.id, to: lead.to, action: actionOf(lead), ok: ids.has(lead.to) });
    });
  }
  return out;
}

/**
 * The screens the parts of components lead to, where the layer sets the part's connection itself
 * (`ComponentNode.parts`). Kept apart from `screenLinks`, whose arrows stand for the layer's own
 * connection. A ficha's default part connections never lead to a screen of the file.
 */
export function partLinks(c: Composition): (Omit<ScreenLink, "ok"> & { part: string })[] {
  const out: (Omit<ScreenLink, "ok"> & { part: string })[] = [];
  for (const b of c.artboards) {
    walk(b.children, (n) => {
      for (const [part, conn] of ownPartConnections(n)) {
        const lead = leadOf(conn);
        if (lead) out.push({ boardId: b.id, nodeId: n.id, part, to: lead.to, action: actionOf(lead) });
      }
    });
  }
  return out;
}

/** Sets or (with null) removes the screen a layer leads to. A layer cannot lead to the screen it is on. */
export function setConnection(c: Composition, boardId: string, nodeId: string, to: string | null): Composition {
  const board = c.artboards.find((b) => b.id === boardId);
  if (!board || !findNode(board, nodeId)) return c;
  if (to === boardId) return c;
  const kept = findNode(board, nodeId)!.node.connection;
  // A new target keeps the trigger and the overlay settings; back and close become a navigation.
  // The actions after the first stay (D-0017).
  const base = kept && leadsTo(kept) ? kept : { then: kept?.then };
  return updateNode(c, boardId, nodeId, { connection: to ? checkConnection({ ...base, to }) : undefined });
}

/**
 * Changes part of a layer's connection (its trigger, action, delay or overlay settings) and
 * cleans the result: an action that needs a screen and has none is dropped, so the inspector
 * asks for the screen in the same step it changes the action (see `setConnection`).
 */
export function patchConnection(c: Composition, boardId: string, nodeId: string, patch: Partial<Connection>): Composition {
  const board = c.artboards.find((b) => b.id === boardId);
  const found = board && findNode(board, nodeId);
  if (!found) return c;
  const next = checkConnection({ ...found.node.connection, ...patch });
  if (next?.to === boardId) return c;
  return updateNode(c, boardId, nodeId, { connection: next });
}

/** Makes a screen the start of a flow named `name`, or (with null) ends the flow that starts there. */
export function setFlow(c: Composition, boardId: string, name: string | null): Composition {
  if (!c.artboards.some((b) => b.id === boardId)) return c;
  const rest = (c.flows ?? []).filter((f) => f.start !== boardId);
  const kept = (c.flows ?? []).find((f) => f.start === boardId);
  const flow = { id: kept?.id ?? newId("f"), name: name?.trim() || kept?.name || "Flujo", start: boardId };
  // A renamed flow keeps its place in the list; a new one goes last.
  const flows = name === null ? rest : kept ? (c.flows ?? []).map((f) => (f === kept ? flow : f)) : [...rest, flow];
  const { flows: _old, ...rest2 } = c;
  return flows.length ? { ...rest2, flows } : rest2;
}

/** Whether any action of any layer's or part's connection on these screens leads to `id`. */
function anyLinkTo(boards: readonly Artboard[], id: string): boolean {
  let found = false;
  const leads = (conn: Connection | undefined) => actionsOf(conn).some((a) => leadsTo(a) && a.to === id);
  for (const b of boards) walk(b.children, (n) => (found ||= leads(n.connection) || ownPartConnections(n).some(([, conn]) => leads(conn))));
  return found;
}

/**
 * The composition without any action that leads to `boardId`, for when that screen is deleted: a
 * connection keeps its other actions (D-0017) and goes when none is left.
 */
export function dropConnectionsTo(c: Composition, boardId: string): Composition {
  const gone = (a: Connection) => (leadsTo(a) && a.to === boardId ? null : undefined);
  const strip = (list: readonly LayerNode[]): LayerNode[] =>
    list.map((n) => {
      let out = n;
      if (n.connection && actionsOf(n.connection).some((a) => gone(a) === null)) {
        out = { ...n };
        const kept = mapActions(n.connection, gone);
        if (kept) out.connection = kept;
        else delete out.connection;
      }
      // A part whose every action led there does nothing now, rather than fall back to the ficha's.
      out = mapPartConnections(out, (p) => (actionsOf(p).some((a) => gone(a) === null) ? (mapActions(p, gone) ?? null) : undefined));
      return out.kind === "component" ? out : ({ ...out, children: strip(out.children) } as LayerNode);
    });
  // A flow that started on the screen goes with it.
  const flows = c.flows?.filter((f) => f.start !== boardId);
  const { flows: _all, ...noFlows } = c;
  const withFlows: Composition = flows?.length === c.flows?.length ? c : flows?.length ? { ...noFlows, flows } : noFlows;
  if (!anyLinkTo(c.artboards, boardId)) return withFlows;
  return { ...withFlows, artboards: c.artboards.map((b) => ({ ...b, children: strip(b.children) })) };
}

/**
 * Every connection that leads to `from` leads to `to` instead, keeping its trigger, action and
 * overlay settings: Figma's reconnecting several connections at once. Layers on `to` itself are
 * left as they are, as a layer cannot lead to the screen it is on. Returns how many changed.
 */
export function redirectConnections(c: Composition, from: string, to: string): { comp: Composition; count: number } {
  if (from === to || !c.artboards.some((b) => b.id === to)) return { comp: c, count: 0 };
  let count = 0;
  const turn = (list: readonly LayerNode[]): LayerNode[] =>
    list.map((n) => {
      let out = n;
      // Each action of a list that led to `from` (D-0017), on the layer and on its parts.
      const turned = (conn: Connection) => {
        if (!actionsOf(conn).some((a) => leadsTo(a) && a.to === from)) return undefined;
        return mapActions(conn, (a) => {
          if (!leadsTo(a) || a.to !== from) return undefined;
          count++;
          return { ...a, to };
        });
      };
      const own = n.connection && turned(n.connection);
      if (own) out = { ...n, connection: own };
      out = mapPartConnections(out, turned);
      return out.kind === "component" ? out : ({ ...out, children: turn(out.children) } as LayerNode);
    });
  const artboards = c.artboards.map((b) => (b.id === to || !anyLinkTo([b], from) ? b : { ...b, children: turn(b.children) }));
  return count ? { comp: { ...c, artboards }, count } : { comp: c, count: 0 };
}

/** Where a link leads, for an app's `onNavigate`: the screen with that id and the route it stands for (when it came from the screen map). */
export function connectionTarget(c: Composition, to: string): { screen: Artboard; route?: string } | null {
  const screen = c.artboards.find((b) => b.id === to);
  return screen ? { screen, route: screen.route } : null;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * The arrow from a layer to a screen, both in board coordinates: it leaves the side of the layer
 * that faces the screen and lands on the facing side of the screen, at the height (or across
 * position) of the layer where the two overlap, else at the screen's middle. `c1` and `c2` are the
 * control points of a cubic curve.
 */
export function arrowPath(from: Frame, to: Frame): { start: Point; c1: Point; c2: Point; end: Point; side: "left" | "right" | "top" | "bottom" } {
  const fc = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
  const tc = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  // Horizontal when the screens are apart side by side, or the gap across is larger than down.
  const gapX = Math.max(to.x - (from.x + from.w), from.x - (to.x + to.w));
  const gapY = Math.max(to.y - (from.y + from.h), from.y - (to.y + to.h));
  const horizontal = gapX >= gapY;
  if (horizontal) {
    const right = tc.x >= fc.x;
    const start = { x: right ? from.x + from.w : from.x, y: fc.y };
    const end = { x: right ? to.x : to.x + to.w, y: clamp(fc.y, to.y + 24, to.y + to.h - 24) };
    if (to.h < 48) end.y = tc.y;
    const pull = Math.max(40, Math.abs(end.x - start.x) / 2);
    const d = right ? pull : -pull;
    return { start, c1: { x: start.x + d, y: start.y }, c2: { x: end.x - d, y: end.y }, end, side: right ? "left" : "right" };
  }
  const down = tc.y >= fc.y;
  const start = { x: fc.x, y: down ? from.y + from.h : from.y };
  const end = { x: clamp(fc.x, to.x + 24, to.x + to.w - 24), y: down ? to.y : to.y + to.h };
  if (to.w < 48) end.x = tc.x;
  const pull = Math.max(40, Math.abs(end.y - start.y) / 2);
  const d = down ? pull : -pull;
  return { start, c1: { x: start.x, y: start.y + d }, c2: { x: end.x, y: end.y - d }, end, side: down ? "top" : "bottom" };
}

/** The screen under a point in board coordinates, the top-most (last drawn) first. */
export function boardAt(c: Composition, p: Point): Artboard | undefined {
  for (let i = c.artboards.length - 1; i >= 0; i--) {
    const b = c.artboards[i];
    if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) return b;
  }
  return undefined;
}
