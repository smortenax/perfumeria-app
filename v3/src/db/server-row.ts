/**
 * What goes up has to be what Postgres takes (V3-9). The copy keeps a list as JSON text and a
 * boolean as 1 or 0, the only types PowerSync has; Postgres' columns are text[] and boolean.
 * These are the columns that differ; a test checks them against the server's schema
 * (db/schema/), so a new list or boolean cannot be forgotten.
 */
export const LIST_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  materials: ["aliases", "other_cas", "disputed_fields"],
  material_categories: ["aliases"],
};

export const BOOLEAN_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  materials: ["solvent"],
  material_doses: ["disputed"],
  data_version: ["single"],
};

/** A row of the copy, as Postgres takes it: lists as arrays and booleans as booleans. */
export function toServerRow(table: string, row: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const column of LIST_COLUMNS[table] ?? []) {
    const value = out[column];
    if (typeof value === "string") {
      out[column] = JSON.parse(value);
    }
  }
  for (const column of BOOLEAN_COLUMNS[table] ?? []) {
    const value = out[column];
    if (value === 1 || value === 0 || value === "1" || value === "0") {
      out[column] = value === 1 || value === "1";
    }
  }
  return out;
}
