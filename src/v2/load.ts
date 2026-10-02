import { parseCsv } from "../data/csv.ts";
import type { Dataset, Issue } from "./model.ts";

/**
 * Reads the CSV files of datos/v2/ into a Dataset. Each file must have exactly the
 * columns of SCHEMA, in that order; numbers stay as text for the validator.
 */

type Row = Readonly<Record<string, string>>;

interface TableSpec<K extends keyof Dataset> {
  readonly file: string;
  readonly columns: readonly string[];
  readonly map: (row: Row, line: number) => Dataset[K][number];
}

const list = (text: string): string[] =>
  text
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item !== "");

/** The schema of datos/v2/, documented in datos/v2/LEEME.md. */
export const SCHEMA: { readonly [K in keyof Dataset]: TableSpec<K> } = {
  ids: {
    file: "registro-ids.csv",
    columns: ["id", "entidad", "clave", "alta", "estado", "notas"],
    map: (r, line) => ({ line, id: r.id, entity: r.entidad, key: r.clave, added: r.alta, status: r.estado }),
  },
  substances: {
    file: "sustancias.csv",
    columns: ["id", "nombre", "notas"],
    map: (r, line) => ({ line, id: r.id, name: r.nombre }),
  },
  casAliases: {
    file: "sustancia-cas.csv",
    columns: ["id_sustancia", "cas", "relacion", "notas"],
    map: (r, line) => ({ line, substanceId: r.id_sustancia, cas: r.cas, relation: r.relacion }),
  },
  groups: {
    file: "grupos.csv",
    columns: ["id", "tipo", "referencia", "nombre", "notas"],
    map: (r, line) => ({ line, id: r.id, type: r.tipo, reference: r.referencia, name: r.nombre }),
  },
  groupMembers: {
    file: "grupo-miembros.csv",
    columns: ["id_grupo", "id_miembro", "subgrupo", "notas"],
    map: (r, line) => ({ line, groupId: r.id_grupo, memberId: r.id_miembro, subgroup: r.subgrupo }),
  },
  materials: {
    file: "materiales.csv",
    columns: [
      "id", "tipo", "nombre", "id_sustancia", "especie", "parte", "proceso", "quimiotipo",
      "cas", "inci", "excepciones", "motivo_excepcion", "notas",
    ],
    map: (r, line) => ({
      line,
      id: r.id,
      type: r.tipo,
      name: r.nombre,
      substanceId: r.id_sustancia,
      species: r.especie,
      part: r.parte,
      process: r.proceso,
      chemotype: r.quimiotipo,
      cas: r.cas,
      inci: r.inci,
      exceptions: list(r.excepciones),
      exceptionReason: r.motivo_excepcion,
    }),
  },
  composition: {
    file: "composicion.csv",
    columns: [
      "id_contenedor", "id_componente", "min", "tipico", "max", "tipo_valor", "autoridad",
      "id_documento", "notas",
    ],
    map: (r, line) => ({
      line,
      containerId: r.id_contenedor,
      componentId: r.id_componente,
      min: r.min,
      typical: r.tipico,
      max: r.max,
      valueType: r.tipo_valor,
      authority: r.autoridad,
      documentId: r.id_documento,
    }),
  },
  coverages: {
    file: "coberturas.csv",
    columns: ["id_contenedor", "id_documento", "cobertura", "notas"],
    map: (r, line) => ({ line, containerId: r.id_contenedor, documentId: r.id_documento, coverage: r.cobertura }),
  },
  products: {
    file: "productos.csv",
    columns: [
      "id", "id_material", "nombre", "fabricante", "codigo", "tienda", "url", "dilucion_pct",
      "id_diluyente", "notas",
    ],
    map: (r, line) => ({
      line,
      id: r.id,
      materialId: r.id_material,
      name: r.nombre,
      maker: r.fabricante,
      code: r.codigo,
      shop: r.tienda,
      url: r.url,
      dilutionPct: r.dilucion_pct,
      diluentId: r.id_diluyente,
    }),
  },
  ceilings: {
    file: "topes.csv",
    columns: ["id_producto", "categoria", "max_pct", "id_documento", "notas"],
    map: (r, line) => ({
      line,
      productId: r.id_producto,
      category: r.categoria,
      maxPct: r.max_pct,
      documentId: r.id_documento,
    }),
  },
  lots: {
    file: "lotes.csv",
    columns: ["id", "id_producto", "codigo_lote", "fecha", "notas"],
    map: (r, line) => ({ line, id: r.id, productId: r.id_producto, lotCode: r.codigo_lote, date: r.fecha }),
  },
  documents: {
    file: "documentos.csv",
    columns: ["id", "tipo", "titulo", "emisor", "fecha", "ruta", "estado_revision", "notas"],
    map: (r, line) => ({
      line,
      id: r.id,
      type: r.tipo,
      title: r.titulo,
      issuer: r.emisor,
      date: r.fecha,
      path: r.ruta,
      reviewStatus: r.estado_revision,
    }),
  },
  usages: {
    file: "usos.csv",
    columns: [
      "id_material", "magnitud", "min", "tipico", "max", "unidad", "base", "autoridad",
      "id_documento", "notas",
    ],
    map: (r, line) => ({
      line,
      materialId: r.id_material,
      magnitude: r.magnitud,
      min: r.min,
      typical: r.tipico,
      max: r.max,
      unit: r.unidad,
      base: r.base,
      authority: r.autoridad,
      documentId: r.id_documento,
    }),
  },
  v1Links: {
    file: "v1-a-v2.csv",
    columns: ["id_v2", "id_v1"],
    map: (r, line) => ({ line, v2Id: r.id_v2, v1Id: r.id_v1 }),
  },
};

export interface LoadResult {
  readonly dataset: Dataset;
  readonly issues: readonly Issue[];
}

/**
 * `read` returns a file's text, or null when it does not exist. With `missingIsEmpty`
 * (only for the test fixtures) a missing file counts as a table without rows.
 */
export function loadDataset(
  read: (file: string) => string | null,
  options: { readonly missingIsEmpty?: boolean } = {},
): LoadResult {
  const issues: Issue[] = [];
  const tables: Record<string, unknown[]> = {};
  for (const [key, spec] of Object.entries(SCHEMA) as Array<[keyof Dataset, TableSpec<keyof Dataset>]>) {
    tables[key] = [];
    const text = read(spec.file);
    if (text === null) {
      if (!options.missingIsEmpty) {
        issues.push(fileIssue(spec.file, "Falta el archivo."));
      }
      continue;
    }
    const [header = [], ...rows] = parseCsv(text.replace(/^﻿/, ""));
    if (header.join(",") !== spec.columns.join(",")) {
      issues.push(fileIssue(spec.file, `Cabecera «${header.join(",")}»; se espera «${spec.columns.join(",")}».`));
      continue;
    }
    rows.forEach((cells, i) => {
      if (cells.every((cell) => cell.trim() === "")) {
        return;
      }
      const line = i + 2;
      if (cells.length !== header.length) {
        issues.push({
          severity: "error",
          rule: "esquema",
          file: spec.file,
          line,
          message: `La fila tiene ${cells.length} columnas; la cabecera, ${header.length}.`,
        });
        return;
      }
      const record = Object.fromEntries(header.map((name, j) => [name, cells[j].trim()]));
      tables[key].push(spec.map(record, line));
    });
  }
  return { dataset: tables as unknown as Dataset, issues };
}

function fileIssue(file: string, message: string): Issue {
  return { severity: "error", rule: "esquema", file, line: 0, message };
}
