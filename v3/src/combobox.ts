/**
 * A search with its list of results, as ARIA's combobox pattern asks (F-01, picked 2026-11-02; P-INTER-02, WCAG 4.1.2): the focus
 * stays in the field, the arrows move the highlight, and the field names the highlighted option with aria-activedescendant, so a
 * screen reader hears what Enter will choose. Every search of a material shares it (F-03): Enter or Tab picks the highlighted
 * result, which is the first until the arrows move it, so a single result is picked without touching the list.
 */
export type ComboAction = { readonly kind: "move"; readonly to: number } | { readonly kind: "choose"; readonly at: number } | { readonly kind: "close" };

/** What a key does in the field. `at` is the highlighted result; null when the key is the field's own. */
export function comboKey(key: string, at: number, count: number, shift = false): ComboAction | null {
  if (key === "Escape") return { kind: "close" };
  if (count === 0) return null;
  const from = Math.min(Math.max(at, 0), count - 1);
  switch (key) {
    case "ArrowDown":
      return { kind: "move", to: (from + 1) % count };
    case "ArrowUp":
      return { kind: "move", to: (from + count - 1) % count };
    case "Enter":
      return { kind: "choose", at: from };
    case "Tab":
      return shift ? null : { kind: "choose", at: from };
    default:
      return null;
  }
}

/** The id of the option at `i` in the list `listId`. */
export const optionId = (listId: string, i: number): string => `${listId}-option-${i}`;

/** The field's ARIA attributes, for a list that is shown when `open` and holds `count` results. */
export function comboFieldProps(listId: string, open: boolean, count: number, at: number) {
  const shown = open && count > 0;
  return {
    role: "combobox" as const,
    "aria-autocomplete": "list" as const,
    "aria-expanded": shown,
    "aria-controls": listId,
    "aria-activedescendant": shown ? optionId(listId, Math.min(Math.max(at, 0), count - 1)) : undefined,
  };
}
