/**
 * V3-43: what a general text of the lab says of the user's own material (their shop, their
 * purchase, their bottle) goes to their version; the rest stays in the common glossary. Batch 7
 * keeps the general part and batch 8 takes the user's, with this same rule, so that nothing is
 * lost between the two and nothing is in both.
 *
 * The lab writes its notes in lines («Web: …», «TGSC: …»), and each line mixes sentences of
 * both kinds: the split is sentence by sentence, and each line keeps its heading on both sides.
 */

/** Words that speak of the user's purchase or bottle, whoever sold it. */
const MARKERS = /\b(kit|se compr[oó]|que se compr[oó]|la compra|de la compra|la etiqueta|el usuario|del usuario|al usuario|mi frasco|mi lote|se pes[oó])\b/i;

/** The shops of the user's bottle of a material, from user_materials.supplier («Olfatorium (kit de iniciación) · Perfumiarz (recompra, puro)»). */
export function shopsOf(supplier: string | null | undefined): string[] {
  return (supplier ?? "")
    .split("·")
    .map((part) => part.replace(/\(.*$/, "").trim())
    .filter((name) => name.length > 2);
}

const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Whether a piece of text speaks of the user's own material. */
export function isPersonal(text: string, shops: readonly string[]): boolean {
  if (MARKERS.test(text)) return true;
  const folded = fold(text);
  return shops.some((shop) => new RegExp(`\\b${fold(shop).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(folded));
}

/** A source's label at the start of a piece («Web: », «TGSC: », «Perfumiarz: »), kept with its sentences. */
const LABEL = /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’&. -]{0,30}):\s+/;
/** Where a new source's piece starts inside a line: after a sentence, a label like «ScenTree: ». */
const PIECE = /(?<=[.!?»)])\s+(?=[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’&. -]{0,30}:\s)/;
/** Sentences: after a full stop, a question or exclamation mark or a closing quote, before an upper-case start; then their clauses. */
const SENTENCE = /(?<=[.!?»)])\s+(?=[A-ZÁÉÍÓÚÑ«¿¡(])/;

export interface Split {
  readonly general: string | null;
  readonly personal: string | null;
  /** The sentences that went to the user's version, for the report. */
  readonly moved: readonly string[];
}

/**
 * A general text split into what stays common and what goes to the user's version (V3-43): line
 * by line; each line by its sources' pieces (a piece whose source is the user's shop is theirs
 * whole); each other piece by sentences and, within a sentence, by its clauses («;»).
 */
export function splitPersonal(text: string | null, shops: readonly string[]): Split {
  if (text === null || text.trim() === "") return { general: null, personal: null, moved: [] };
  const general: string[] = [];
  const personal: string[] = [];
  const moved: string[] = [];
  /** A group of a sentence's clauses: capitalised and closed only where the split cut it, so the source's words stay as they were. */
  const group = (clauses: readonly string[], all: readonly string[]) => {
    let piece = clauses.join("; ");
    if (clauses[0] !== all[0]) piece = piece.charAt(0).toUpperCase() + piece.slice(1);
    if (clauses[clauses.length - 1] !== all[all.length - 1] && !/[.!?»)]$/.test(piece)) piece = `${piece}.`;
    return piece;
  };
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    const lineGeneral: string[] = [];
    const linePersonal: string[] = [];
    for (const piece of line.split(PIECE).map((p) => p.trim()).filter((p) => p)) {
      const label = LABEL.exec(piece)?.[0] ?? "";
      if (label && isPersonal(label, shops)) {
        linePersonal.push(piece);
        moved.push(piece);
        continue;
      }
      const mine: string[] = [];
      const rest: string[] = [];
      for (const sentence of piece.slice(label.length).split(SENTENCE).map((x) => x.trim()).filter((x) => x)) {
        const clauses = sentence.split(/;\s+/);
        const ours = clauses.filter((c) => isPersonal(c, shops));
        const theirs = clauses.filter((c) => !isPersonal(c, shops));
        if (ours.length) mine.push(group(ours, clauses));
        if (theirs.length) rest.push(group(theirs, clauses));
      }
      if (rest.length) lineGeneral.push(label + rest.join(" "));
      if (mine.length) {
        linePersonal.push(label + mine.join(" "));
        moved.push(...mine.map((m) => label + m));
      }
    }
    if (lineGeneral.length) general.push(lineGeneral.join(" "));
    if (linePersonal.length) personal.push(linePersonal.join(" "));
  }
  return { general: general.length ? general.join("\n") : null, personal: personal.length ? personal.join("\n") : null, moved };
}

/** The lab's source tags of the user's shops («ML» for Maese Lab), from its `sources` table. */
export function tagsOf(shops: readonly string[], sources: ReadonlyArray<{ readonly id: string; readonly name: string }>): string[] {
  return sources.filter((s) => shops.some((shop) => fold(s.name).includes(fold(shop)))).map((s) => s.id);
}

/** Whether a row of the lab (a dose, a descriptor…) is the user's: its source is their shop's sheet, or its text speaks of their material. */
export function isPersonalRow(text: string, sourceTags: string, shops: readonly string[], shopTags: readonly string[]): boolean {
  const tags = sourceTags.split(/\s+/).filter((t) => t);
  // The doses of a shop's sheet name the shop in full («Maese Lab (ficha de producto)»), not by its tag.
  return tags.some((t) => shopTags.includes(t)) || isPersonal(`${text} ${sourceTags}`, shops);
}
