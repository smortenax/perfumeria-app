import { parseCsv } from "../bench/data/csv";

/**
 * Importing a sheet (V3-80, F19): what you paste from Excel or Sheets (tabs) or a .csv, read into
 * rows, with its columns recognised by their header, in English or in Spanish. Pure: nothing is
 * written until you confirm (match.ts and the screen).
 */

export const FIELDS = ["name", "cas", "shop", "product", "note"] as const;
export type Field = (typeof FIELDS)[number];
export type Columns = Readonly<Record<Field, number | null>>;

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
/** Header words that name each field. The first column that fits is taken. */
const HEADERS: Readonly<Record<Field, readonly RegExp[]>> = {
  name: [/^(name|nombre|material|materia prima|ingredient(e)?)$/, /nombre|name|material/],
  cas: [/^(cas|cas no\.?|cas number|n\.?º? cas|numero cas)$/, /\bcas\b/],
  shop: [/^(shop|store|tienda|proveedor|supplier|vendor)$/, /tienda|proveedor|supplier|shop/],
  product: [/^(product|producto|producto tienda|producto_tienda|nombre comercial|trade name)$/, /producto|product/],
  note: [/^(note|notes|nota|notas|comment|comentario)s?$/, /nota|note|coment/],
};

export interface Sheet {
  readonly header: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/** Tabs (pasted from a spreadsheet), semicolons (a Spanish Excel's .csv) or commas. */
export function readSheet(text: string): Sheet {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  if (!clean) return { header: [], rows: [] };
  const first = clean.split("\n")[0];
  const separator = first.includes("\t") ? "\t" : (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const table =
    separator === ","
      ? parseCsv(clean)
      : separator === ";"
        ? parseCsv(clean.split("\n").map((l) => l.split(";").map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n"))
        : clean.split("\n").map((l) => l.split("\t"));
  const [header = [], ...rows] = table.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
  return { header, rows };
}

/** Which column holds each field, by its header; a field with no column is null. */
export function guessColumns(header: readonly string[]): Columns {
  const folded = header.map(fold);
  const taken = new Set<number>();
  const pick = (field: Field): number | null => {
    for (const re of HEADERS[field]) {
      const i = folded.findIndex((h, j) => !taken.has(j) && re.test(h));
      if (i >= 0) {
        taken.add(i);
        return i;
      }
    }
    return null;
  };
  // Product before name: «producto_tienda» must not be taken as the name.
  const product = pick("product");
  const cas = pick("cas");
  const name = pick("name");
  return { name, cas, shop: pick("shop"), product, note: pick("note") };
}

export interface ImportRow {
  /** Its line in the sheet, counting the header as 1. */
  readonly line: number;
  readonly name: string;
  readonly cas: string;
  readonly shop: string;
  readonly product: string;
  readonly note: string;
}

export function rowsOf(sheet: Sheet, columns: Columns): ImportRow[] {
  const at = (r: readonly string[], i: number | null) => (i === null ? "" : (r[i] ?? "").trim());
  return sheet.rows
    .map((r, i) => ({ line: i + 2, name: at(r, columns.name), cas: at(r, columns.cas), shop: at(r, columns.shop), product: at(r, columns.product), note: at(r, columns.note) }))
    .filter((r) => r.name || r.cas || r.product);
}
