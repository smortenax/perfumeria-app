/**
 * The materials from Maese Lab's catalogue (2026-11-14), by what their data says: a common whose sources or
 * notes cite Maese Lab, or one of yours bought there; your version of such a common too.
 */
export function maeseKeys(
  materials: Iterable<{ readonly id: string; readonly basedOnId: string | null; readonly sources: string | null; readonly notes: string | null; readonly supplier: string | null }>,
): Set<string> {
  const list = [...materials];
  const says = (m: (typeof list)[number]) => /maese/i.test(`${m.sources ?? ""} ${m.notes ?? ""} ${m.supplier ?? ""}`);
  const direct = new Set(list.filter(says).map((m) => m.id));
  return new Set(list.filter((m) => direct.has(m.id) || (m.basedOnId !== null && direct.has(m.basedOnId))).map((m) => m.id));
}
