import { getTableColumns, getTableName } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as checks from "../../db/schema/checks";
import * as server from "../../db/schema/materials";
import { BOOLEAN_COLUMNS, LIST_COLUMNS, toServerRow } from "./server-row";

const tables = [...Object.values(server), ...Object.values(checks)] as PgTable[];

/** The columns of the server's schema of one column type, by table. */
function columnsOf(type: string): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const table of tables) {
    const names = Object.values(getTableColumns(table))
      .filter((c) => c.columnType === type)
      .map((c) => c.name)
      .sort();
    if (names.length > 0) found[getTableName(table)] = names;
  }
  return found;
}

const sorted = (map: Readonly<Record<string, readonly string[]>>) =>
  Object.fromEntries(Object.entries(map).map(([t, cols]) => [t, [...cols].sort()]));

describe("the columns whose browser form differs from Postgres'", () => {
  it("are every list and every boolean of the server's schema, and only those", () => {
    expect(sorted(LIST_COLUMNS)).toEqual(columnsOf("PgArray"));
    expect(sorted(BOOLEAN_COLUMNS)).toEqual(columnsOf("PgBoolean"));
  });
});

describe("toServerRow", () => {
  it("turns JSON lists into arrays and 1/0 into booleans; leaves the rest as it is", () => {
    expect(
      toServerRow("materials", { name: "Linalool", aliases: '["LIN","lina"]', other_cas: "[]", solvent: 1, purity: "0.98" }),
    ).toEqual({ name: "Linalool", aliases: ["LIN", "lina"], other_cas: [], solvent: true, purity: "0.98" });
    expect(toServerRow("material_doses", { disputed: 0, typical: "0.02" })).toEqual({ disputed: false, typical: "0.02" });
    expect(toServerRow("regulations", { max_value: "0.0013" })).toEqual({ max_value: "0.0013" });
  });

  it("does not touch a column the row does not carry (a PATCH sends only what changed)", () => {
    expect(toServerRow("materials", { name: "Hedione" })).toEqual({ name: "Hedione" });
  });
});
