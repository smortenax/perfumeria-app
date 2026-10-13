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
