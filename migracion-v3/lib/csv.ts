import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Writes the tables of a batch as CSV: one file per table, the columns of the v3's schema in
 * the header, the rows sorted by id, so that migrating again writes the same bytes. A list is
 * JSON text; a null is an empty cell, never a zero (§1.2).
 */
export type Cell = string | number | boolean | null | readonly string[];

const quote = (text: string) => (/[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

function cell(value: Cell): string {
  if (value === null) return "";
  if (Array.isArray(value)) return quote(JSON.stringify(value));
  return quote(String(value));
}

export function writeTable(path: string, columns: readonly string[], rows: ReadonlyArray<Readonly<Record<string, Cell>>>): void {
  const sorted = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const lines = [columns.join(","), ...sorted.map((row) => columns.map((c) => cell(row[c] ?? null)).join(","))];
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
}

/**
 * Rows read back from an approved CSV, with their lists (JSON text there) as lists again, so that
 * writing them gives the same bytes. Shared by every batch that rewrites a common table (V3-111: a
 * batch uses the helpers of lib/ and does not copy them).
 */
export function asCells(rows: ReadonlyArray<Readonly<Record<string, Cell>>>): Array<Record<string, Cell>> {
  return rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
}

/** A text for a cell of a report's Markdown table: no «|», on one line. */
export const mdCell = (text: string): string => text.replace(/\|/g, "/").replace(/\n/g, " ");

/** The same, keeping the line breaks, as the reports of some earlier batches wrote it. */
export const mdCellKeepLines = (text: string): string => text.replace(/\|/g, "/");

/** The same, escaping the «|» instead of changing it (the glossary improvements report). */
export const mdCellEscaped = (text: string): string => text.replace(/\|/g, "\\|");
