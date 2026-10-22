import type { Catalog, CatalogMaterial } from "../db/catalog";

/**
 * «Exportar paleta» (docs/a-futuro.md; the user, 2026-10-15): your inventory in one click. Every
 * material of yours (the «Propios» tab: your versions, your own and your provisional ones; a frozen
 * formula is a formula, not a material you have), each by the name that identifies it without doubt,
 * the one it was registered with, and nothing more. Two of yours with the same name say their shop
 * or product, so that neither is lost; one that still repeats says its kind.
 */
export function paletteOf(catalog: Catalog): string[] {
  const mine = [...catalog.materials.values()].filter((m) => m.ownerId !== null && m.kind !== "frozen");
  const count = (key: (m: CatalogMaterial) => string) => {
    const n = new Map<string, number>();
    for (const m of mine) n.set(key(m), (n.get(key(m)) ?? 0) + 1);
    return n;
  };
  const byName = count((m) => m.name.trim().toLowerCase());
  const named = (m: CatalogMaterial) => {
    const name = m.name.trim();
    if ((byName.get(name.toLowerCase()) ?? 0) < 2) return name;
    const which = [m.supplier, m.product].filter((x) => x).join(", ");
    return which ? `${name} (${which})` : name;
  };
  const once = count((m) => named(m).toLowerCase());
  return mine
    .map((m) => ((once.get(named(m).toLowerCase()) ?? 0) < 2 ? named(m) : `${named(m)} [${m.kind}]`))
    .sort((a, b) => a.localeCompare(b, "es"));
}

/** The palette as Markdown: a title, how many and when, and one line per material. */
export function paletteMarkdown(names: readonly string[], date: Date): string {
  const day = date.toISOString().slice(0, 10);
  return `# My palette\n\n${names.length === 1 ? "1 material" : `${names.length} materials`} · ${day}\n\n${names.map((n) => `- ${n}`).join("\n")}\n`;
}
