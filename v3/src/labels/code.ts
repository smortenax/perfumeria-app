/**
 * What a label's QR carries (V3-105): a short code, not a link, so that it fits legibly on 12 mm tape
 * (a version 2 QR, 25 modules). «PF1:D:<id>» is one bottle of yours (its material and its exact
 * dilution); «PF1:M:<id>» is a material. A UUID goes without its dashes and in capitals, so the whole
 * code is QR «alphanumeric» (the cheapest mode that holds letters).
 */
export type LabelKind = "dilution" | "material";

const PREFIX = "PF1";
const LETTER: Record<LabelKind, string> = { dilution: "D", material: "M" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPACT = /^[0-9A-F]{32}$/;

export function labelCode(kind: LabelKind, id: string): string {
  const body = UUID.test(id) ? id.replace(/-/g, "").toUpperCase() : id;
  return `${PREFIX}:${LETTER[kind]}:${body}`;
}

/** A scanned code back to what it names; null for anything that is not one of ours. */
export function parseLabelCode(text: string): { kind: LabelKind; id: string } | null {
  const m = /^PF1:([DM]):(.+)$/.exec(text.trim());
  if (!m) return null;
  const kind: LabelKind = m[1] === "D" ? "dilution" : "material";
  const body = m[2];
  const id = COMPACT.test(body)
    ? `${body.slice(0, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}-${body.slice(16, 20)}-${body.slice(20)}`.toLowerCase()
    : body;
  return { kind, id };
}
