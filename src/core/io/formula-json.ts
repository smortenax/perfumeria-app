import { Ratio } from "../arith/ratio";
import { compose } from "../compose";
import { formatPercent } from "../display";
import type { Change, Formula, FormulaHeader } from "../model/formula";
import type { Material, MaterialKind } from "../model/material";
import { vectorId, type VectorComponent } from "../model/vector";

/**
 * One JSON file per formula (decisions §6): the header, the history with one
 * change per line so Git sees each change, and the current composition so the
 * file can be read without the app. Saving keeps everything; the composition
 * is only a courtesy copy, and reading rebuilds it from the history.
 */
export const FORMULA_FORMAT = "perfumeria/formula/1";

interface MaterialDoc {
  kind: MaterialKind;
  name: string;
  solvent?: true;
  /** For kind "formula": [component key, exact proportion]. */
  vector?: Array<[string, string]>;
}

type ChangeDoc =
  | { kind: "add"; id: string; material: string; massUg: string; fraction: string; diluent: string | null }
  | { kind: "set-mass"; id: string; target: string; massUg: string }
  | { kind: "remove"; id: string; target: string }
  | { kind: "reweigh"; id: string; grossUg: string }
  | { kind: "note"; id: string; text: string };

export function formulaToJson(formula: Formula): string {
  const materials: Record<string, MaterialDoc> = {};
  const register = (material: Material): string => {
    if (!materials[material.key]) {
      const doc: MaterialDoc = { kind: material.kind, name: material.name };
      if (material.solvent) {
        doc.solvent = true;
      }
      if (material.vector) {
        doc.vector = material.vector.components.map((c) => [register(c.material), c.proportion.toString()]);
      }
      materials[material.key] = doc;
    }
    return material.key;
  };

  const history: ChangeDoc[] = formula.history.map((change) => {
    switch (change.kind) {
      case "add":
        return {
          kind: "add",
          id: change.id,
          material: register(change.material),
          massUg: change.massUg.toString(),
          fraction: change.fraction.toString(),
          diluent: change.diluent ? register(change.diluent) : null,
        };
      case "set-mass":
        return { kind: "set-mass", id: change.id, target: change.target, massUg: change.massUg.toString() };
      case "reweigh":
        return { kind: "reweigh", id: change.id, grossUg: change.grossUg.toString() };
      default:
        return { ...change };
    }
  });

  const current = compose(formula);
  const composition = current.parts.map((part) => ({
    material: part.material.name,
    key: part.material.key,
    massUg: part.massUg.toString(),
    ofBottle: formatPercent(part.massUg.div(current.totalUg)),
  }));

  const h = formula.header;
  const header = {
    name: h.name,
    intention: h.intention,
    container: h.container
      ? {
          capacityMl: h.container.capacityMl?.toString() ?? null,
          tareUg: h.container.tareUg?.toString() ?? null,
        }
      : null,
    workBatchUg: h.workBatchUg?.toString() ?? null,
    finalBatchUg: h.finalBatchUg?.toString() ?? null,
  };

  return [
    "{",
    `  "format": ${JSON.stringify(FORMULA_FORMAT)},`,
    `  "header": ${indent(JSON.stringify(header, null, 2))},`,
    `  "materials": ${oneEntryPerLine(materials)},`,
    `  "history": ${oneItemPerLine(history)},`,
    `  "composition": ${oneItemPerLine(composition)}`,
    "}",
    "",
  ].join("\n");
}

export function formulaFromJson(text: string): Formula {
  const doc = JSON.parse(text);
  if (doc.format !== FORMULA_FORMAT) {
    throw new Error(`Unknown formula format: ${String(doc.format)}`);
  }
  const docs: Record<string, MaterialDoc> = doc.materials ?? {};
  const built = new Map<string, Material>();
  const material = (key: string): Material => {
    const cached = built.get(key);
    if (cached) {
      return cached;
    }
    const entry = docs[key];
    if (!entry) {
      throw new Error(`The file uses a material it does not define: ${key}`);
    }
    let result: Material = { key, kind: entry.kind, name: entry.name, ...(entry.solvent ? { solvent: true } : {}) };
    if (entry.kind === "formula") {
      const components: VectorComponent[] = (entry.vector ?? []).map(([k, p]) => ({
        material: material(k),
        proportion: Ratio.parse(p),
      }));
      const id = vectorId(components);
      if (id !== key) {
        // The ID is the vector: a mismatch means the file was altered by hand or damaged.
        throw new Error(`"${entry.name}" does not match its vector ID`);
      }
      if (!Ratio.sum(components.map((c) => c.proportion)).eq(Ratio.ONE)) {
        throw new Error(`"${entry.name}": the proportions of its vector do not add up to 1`);
      }
      result = { ...result, vector: { id, components } };
    }
    built.set(key, result);
    return result;
  };

  const history: Change[] = (doc.history as ChangeDoc[]).map((c) => {
    switch (c.kind) {
      case "add":
        return {
          kind: "add",
          id: c.id,
          material: material(c.material),
          massUg: BigInt(c.massUg),
          fraction: Ratio.parse(c.fraction),
          diluent: c.diluent === null ? null : material(c.diluent),
        };
      case "set-mass":
        return { kind: "set-mass", id: c.id, target: c.target, massUg: BigInt(c.massUg) };
      case "reweigh":
        return { kind: "reweigh", id: c.id, grossUg: BigInt(c.grossUg) };
      case "remove":
        return { kind: "remove", id: c.id, target: c.target };
      case "note":
        return { kind: "note", id: c.id, text: c.text };
      default:
        throw new Error(`Unknown change: ${JSON.stringify(c)}`);
    }
  });

  const h = doc.header;
  const header: FormulaHeader = {
    name: h.name,
    intention: h.intention ?? "",
    container: h.container
      ? {
          capacityMl: h.container.capacityMl === null ? null : Ratio.parse(h.container.capacityMl),
          tareUg: h.container.tareUg === null ? null : BigInt(h.container.tareUg),
        }
      : null,
    workBatchUg: h.workBatchUg === null ? null : BigInt(h.workBatchUg),
    finalBatchUg: h.finalBatchUg === null ? null : BigInt(h.finalBatchUg),
  };
  return { header, history };
}

function indent(json: string): string {
  return json.replace(/\n/g, "\n  ");
}

function oneEntryPerLine(record: Record<string, unknown>): string {
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return "{}";
  }
  return `{\n${entries.map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n")}\n  }`;
}

function oneItemPerLine(items: readonly unknown[]): string {
  if (items.length === 0) {
    return "[]";
  }
  return `[\n${items.map((item) => `    ${JSON.stringify(item)}`).join(",\n")}\n  ]`;
}
