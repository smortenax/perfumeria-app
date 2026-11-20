// Copied from designboard 3f221ae (src/core/parts.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { checkPartConnection, findNode, updateNode, type ComponentNode, type Composition, type Connection, type LayerNode } from "./composition";
import type { ComponentDef } from "./manifest";

/**
 * Parts of a component a person clicks on their own (each tab of a notebook, each row of a list),
 * declared by its ficha (`ComponentDef.parts`) and marked in its drawing with `data-part`. A
 * part's click runs its connection: the layer's own (`ComponentNode.parts`) where it has one,
 * else the ficha's. Null on the layer turns a part off.
 */

/** What a click on part `id` of the layer does now, or undefined for nothing. */
export function partConnection(def: ComponentDef | undefined, node: ComponentNode, id: string): Connection | undefined {
  const own = node.parts?.[id];
  if (own === null) return undefined;
  return own ?? def?.parts?.[id]?.connection;
}

export interface PartRow {
  id: string;
  label: string;
  connection?: Connection;
  /** The layer sets this part itself (a connection or none), rather than taking the ficha's. */
  own: boolean;
}

/** The ficha's parts in its order, each with what it does on this layer. */
export function partRows(def: ComponentDef | undefined, node: ComponentNode): PartRow[] {
  return Object.entries(def?.parts ?? {}).map(([id, p]) => ({ id, label: p.label, connection: partConnection(def, node, id), own: !!node.parts && id in node.parts }));
}

/** Whether any part of the layer does something on a click. */
export function hasPartConnections(def: ComponentDef | undefined, node: ComponentNode): boolean {
  return Object.keys(def?.parts ?? {}).some((id) => partConnection(def, node, id)) || Object.values(node.parts ?? {}).some(Boolean);
}

/**
 * Sets what part `part` of a layer does: a connection, null for nothing, or undefined to take the
 * ficha's again. A connection is checked as a part's (a click), and one that reads as nothing is
 * stored as null.
 */
export function setPartConnection(c: Composition, boardId: string, nodeId: string, part: string, conn: Connection | null | undefined): Composition {
  const board = c.artboards.find((b) => b.id === boardId);
  const node = board && findNode(board, nodeId)?.node;
  if (!node || node.kind !== "component") return c;
  const parts = { ...node.parts };
  if (conn === undefined) delete parts[part];
  else parts[part] = checkPartConnection(conn) ?? null;
  if (parts[part]?.to === boardId && conn) return c; // a layer never leads to its own screen
  return updateNode(c, boardId, nodeId, { parts: Object.keys(parts).length ? parts : undefined } as Partial<ComponentNode>);
}

/** Every connection a layer's parts hold, with the part id. */
export function ownPartConnections(n: LayerNode): [string, Connection][] {
  if (n.kind !== "component" || !n.parts) return [];
  return Object.entries(n.parts).filter((e): e is [string, Connection] => !!e[1]);
}

/** The layer with each of its own part connections passed through `fn` (undefined leaves it, null turns it off). */
export function mapPartConnections(n: LayerNode, fn: (c: Connection) => Connection | null | undefined): LayerNode {
  if (n.kind !== "component" || !n.parts) return n;
  let changed = false;
  const parts: Record<string, Connection | null> = {};
  for (const [id, c] of Object.entries(n.parts)) {
    const next = c ? fn(c) : undefined;
    parts[id] = next === undefined ? c : next;
    if (next !== undefined) changed = true;
  }
  return changed ? { ...n, parts } : n;
}
