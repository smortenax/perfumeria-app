/**
 * What you opened last (F21, V3-78): formulas and material sheets, newest first, kept in this
 * browser only (a convenience, not your data: another device has its own). If the browser keeps
 * nothing, there is simply no list.
 */
export interface Recent {
  readonly kind: "formula" | "material";
  readonly id: string;
  readonly at: number;
}

const KEY = "perfumeria-v3.recent";
const MAX = 12;

export function readRecent(read: () => string | null = () => localStorage.getItem(KEY)): Recent[] {
  try {
    const list = JSON.parse(read() ?? "[]") as unknown;
    return Array.isArray(list) ? list.filter((r): r is Recent => !!r && (r.kind === "formula" || r.kind === "material") && typeof r.id === "string" && typeof r.at === "number") : [];
  } catch {
    return [];
  }
}

/** One more opened: to the head of the list, once, and the list kept short. */
export function withRecent(list: readonly Recent[], next: Recent): Recent[] {
  return [next, ...list.filter((r) => !(r.kind === next.kind && r.id === next.id))].slice(0, MAX);
}

export function noteRecent(kind: Recent["kind"], id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(withRecent(readRecent(), { kind, id, at: Date.now() })));
  } catch {
    // A browser that keeps nothing: no list, nothing lost.
  }
}
