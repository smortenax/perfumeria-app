import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../../src/data/csv.ts";
import { loadDataset } from "../../src/v2/load.ts";
import type { Dataset } from "../../src/v2/model.ts";
import { validate } from "../../src/v2/validate.ts";

/**
 * What the migration reads (V3-21): the v2 (datos/v2/, through its own loader and validator),
 * the v1's glossary (datos/glosario/, frozen: read, never touched) and IFRA's files
 * (datos/ifra/51/). If the v2 has an error, nothing is migrated (plan, phase 4).
 */

export type Row = Readonly<Record<string, string>>;

const read = (path: string): string => readFileSync(path, "utf8");
const records = (path: string): Row[] => parseCsvRecords(read(path));

export interface Sources {
  readonly v2: Dataset;
  readonly v1: ReadonlyMap<string, Row>;
  readonly ifraNaturals: readonly Row[];
  readonly ifraStandards: ReadonlyMap<string, Row>;
  readonly ifraStandardCas: readonly Row[];
  /** The commit the data come from, to cite in every batch. */
  readonly commit: string;
}

export function readSources(root = "."): Sources {
  const v2Dir = join(root, "datos/v2");
  const { dataset, issues } = loadDataset((file) => {
    const path = join(v2Dir, file);
    return existsSync(path) ? read(path) : null;
  });
  const v1Rows = records(join(root, "datos/glosario/materiales.csv"));
  const standards = records(join(root, "datos/ifra/51/estandares.csv"));
  const errors = [
    ...issues,
    ...validate(dataset, {
      ifraStandards: new Set(standards.map((s) => s.estandar)),
      v1Ids: new Set(v1Rows.map((r) => r.id)),
    }),
  ].filter((i) => i.severity === "error");
  if (errors.length > 0) {
    throw new Error(`validar:v2 da ${errors.length} errores: no se migra nada (${errors[0].rule}: ${errors[0].message})`);
  }
  const commit = execSync("git log -1 --format=%h -- datos/v2 datos/glosario datos/ifra", { cwd: root, encoding: "utf8" }).trim();
  return {
    v2: dataset,
    v1: new Map(v1Rows.map((r) => [r.id, r])),
    ifraNaturals: records(join(root, "datos/ifra/51/naturales.csv")),
    ifraStandards: new Map(standards.map((s) => [s.estandar, s])),
    ifraStandardCas: records(join(root, "datos/ifra/51/estandar-cas.csv")),
    commit,
  };
}

/** A multi-valued cell of the v1's glossary: «a | b | c». */
export const many = (text: string | undefined): string[] =>
  (text ?? "")
    .split(" | ")
    .map((s) => s.trim())
    .filter((s) => s !== "");

/** A value of the v2 that means «not known»: nothing, never a value (§1.2). */
export const known = (text: string | undefined): string | null => {
  const t = (text ?? "").trim();
  return t === "" || t === "no lo dice" || t === "desconocido" ? null : t;
};
