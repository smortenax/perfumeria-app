/**
 * Batch 10, second part (plan v3, step 7.5; V3-19, V3-48, V3-49): your formulas as the v3 keeps them,
 * once you answered conflictos/materiales-formulas.csv and conflictos/bancos.csv. Called by
 * tanda-10-formulas.ts with what it resolved. Ids are stable: running again gives the same bytes;
 * each event gets a UUID v7 in the order of its history.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Ratio } from "../v3/src/core/arith/ratio";
import { compose } from "../v3/src/core/compose";
import { formulaFromJson } from "../v3/src/core/io/formula-json";
import { numericFromRatio } from "../v3/src/db/exact";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor, uuidv7For } from "./lib/ids.ts";

export interface LibraryFormula {
  readonly file: string;
  readonly folder: string;
  readonly json: {
    header: {
      name: string;
      intention?: string;
      container?: { capacityMl: string | null; tareUg: string | null } | null;
      workBatchUg?: string | null;
      finalBatchUg?: string | null;
      version?: { family: string; number: number; from: number | null };
    };
    materials: Record<string, { kind: string; name: string; cas?: string; solvent?: boolean; vector?: [string, string][] }>;
  };
}

export interface Resolved {
  readonly library: string;
  readonly formulas: readonly LibraryFormula[];
  /** Key → lab id, for the keys that resolved by themselves. */
  readonly resolved: ReadonlyArray<readonly [string, string]>;
  /** The rows of conflictos/materiales-formulas.csv. */
  readonly conflicts: ReadonlyArray<Readonly<Record<string, Cell>>>;
  readonly materialAnswer: ReadonlyMap<string, string>;
  readonly benchAnswer: ReadonlyMap<string, string>;
  readonly modified: ReadonlyMap<string, number>;
  /** The material a formula points at for one of your lab materials (V3-48). */
  readonly targetOf: (lab: string) => string;
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

export function writeBatch(r: Resolved, out: string): string {
  for (const row of r.conflicts) if (!r.materialAnswer.has(String(row.id))) throw new Error(`Falta tu respuesta para ${row.id}`);
  for (const f of r.formulas) if (!r.benchAnswer.get(f.file)) throw new Error(`Falta el banco de ${f.file}`);
  const library = r.formulas.map((f) => ({ ...f, engine: formulaFromJson(readFileSync(join(r.library, "archivos", f.file), "utf8")) }));
  const formulaId = (file: string) => uuidFor(`formula:${file}`);

  /** Each event's v7 id: the file's time, one second apart and in its order (plan 7.2). */
  const eventIds = new Map<string, Map<string, string>>();
  const eventIdOf = (file: string, oldId: string, index: number, count: number) => {
    const ids = eventIds.get(file) ?? new Map<string, string>();
    eventIds.set(file, ids);
    if (!ids.has(oldId)) ids.set(oldId, uuidv7For(r.modified.get(file)! - (count - index) * 1000, `evento:${file}:${index}:${oldId}`));
    return ids.get(oldId)!;
  };
  // Every event's id first, so a set_mass or a remove can point at its pour.
  for (const f of library) f.engine.history.forEach((c, i) => eventIdOf(f.file, c.id, i, f.engine.history.length));

  // ---------------------------------------------------------- materials: yours, new provisionals
  const materialRows: Array<Record<string, Cell>> = [];
  const idOfKey = new Map<string, string>(r.resolved.map(([key, lab]) => [key, r.targetOf(lab)]));
  for (const row of r.conflicts) {
    const key = String(row.id);
    const answer = r.materialAnswer.get(key)!;
    if (answer.startsWith("tuyo:")) idOfKey.set(key, r.targetOf(answer.slice("tuyo:".length)));
    else if (answer === "provisional") {
      const id = uuidFor(`provisional-formulas:${key}`);
      idOfKey.set(key, id);
      materialRows.push({
        id, owner_id: null, name: String(row.nombre).trim(), kind: "provisional", cas: row.cas ?? null, solvent: false, aliases: [], other_cas: [],
        disputed_fields: [], sources: `tus fórmulas (${key})`, notes: `Provisional de tus fórmulas: ${row.formulas}. No es ninguno de tus 111 (V3-48).`,
        source_formula_id: null, source_event_id: null,
      });
    } else throw new Error(`${key}: respuesta «${answer}» no es «tuyo:<id>» ni «provisional»`);
  }
  const material = (key: string, file: string): string => {
    const id = idOfKey.get(key);
    if (!id) throw new Error(`${file}: la clave ${key} no tiene material`);
    return id;
  };
  const event = (id: string, formula: string, fields: Record<string, Cell>): Record<string, Cell> => ({
    id, formula_id: formula, owner_id: null, kind: null, material_id: null, mass_ug: null, fraction: null, diluent_id: null, second_diluent_id: null,
    second_fraction: null, target: null, gross_ug: null, tare_ug: null, text: null, ...fields,
  });

  // ---------------------------------------------------------- workbenches
  const benchRows = new Map<string, Record<string, Cell>>();
  const benchId = (name: string) => {
    const id = uuidFor(`banco:${name}`);
    if (!benchRows.has(id)) benchRows.set(id, { id, owner_id: null, name, notes: "De tu biblioteca de la v2 (tanda 10)." });
    return id;
  };

  // ---------------------------------------------------------- frozen accords (V3-49): their formula up to an event, or a snapshot
  const formulaRows: Array<Record<string, Cell>> = [];
  const eventRows: Array<Record<string, Cell>> = [];
  const frozenRows: Array<Record<string, Cell>> = [];
  const accordSources = new Set<string>();
  const snapshots: string[] = [];
  const vecUsers = new Map<string, string>();
  for (const f of library) for (const key of Object.keys(f.json.materials)) if (key.startsWith("vec:") && !vecUsers.has(key)) vecUsers.set(key, f.file);
  for (const [key, userFile] of [...vecUsers].sort(([a], [b]) => a.localeCompare(b))) {
    const entry = library.find((f) => f.json.materials[key])!.json.materials[key];
    const vector = new Map((entry.vector ?? []).map(([k, p]) => [k, Ratio.parse(p).toString()]));
    const source = library.find((f) => f.json.header.name.trim().toLowerCase() === entry.name.trim().toLowerCase());
    let upTo = 0;
    if (source) {
      for (let n = source.engine.history.length; n >= 1 && upTo === 0; n--) {
        const c = compose(source.engine, n);
        const v = new Map(c.parts.map((p) => [p.material.key, p.massUg.div(c.totalUg).toString()]));
        if (v.size === vector.size && [...vector].every(([k, p]) => v.get(k) === p)) upTo = n;
      }
    }
    let sourceFormula: string;
    let sourceEvent: string;
    if (source && upTo > 0) {
      sourceFormula = formulaId(source.file);
      sourceEvent = eventIdOf(source.file, source.engine.history[upTo - 1].id, upTo - 1, source.engine.history.length);
      accordSources.add(source.file);
    } else {
      // A snapshot (V3-49): one pure pour per component, integer masses in proportion, in the bench of who uses it.
      const file = `instantánea:${key}`;
      sourceFormula = uuidFor(`formula:${file}`);
      const lcm = [...vector.values()].map((p) => Ratio.parse(p).den).reduce((a, b) => (a * b) / gcd(a, b), 1n);
      const scale = lcm < 1_000_000n ? (1_000_000n / lcm + 1n) * lcm : lcm;
      formulaRows.push({
        id: sourceFormula, owner_id: null, workbench_id: benchId(r.benchAnswer.get(userFile)!), parent_id: null, name: `${entry.name.trim()} (congelado)`,
        intention: "Instantánea de un acorde congelado de la v2 que no es ningún punto del historial de su fórmula (V3-49).",
        container_capacity_ml: null, container_tare_ug: null, work_batch_ug: null, final_batch_ug: null, markers: ["accord"], role: "congelado de la v2",
      });
      [...vector].sort(([a], [b]) => a.localeCompare(b)).forEach(([k, p], i) => {
        const q = Ratio.parse(p);
        eventRows.push(event(uuidv7For(1_700_000_000_000 + i * 1000, `${file}:${i}`), sourceFormula, { kind: "add", material_id: material(k, file), mass_ug: ((q.num * scale) / q.den).toString(), fraction: "1" }));
      });
      sourceEvent = String(eventRows[eventRows.length - 1].id);
      snapshots.push(`«${entry.name.trim()}» (${key.slice(0, 14)}…), en el banco «${r.benchAnswer.get(userFile)}»`);
    }
    const id = uuidFor(`congelado:${key}`);
    idOfKey.set(key, id);
    frozenRows.push({
      id, owner_id: null, name: entry.name.trim(), kind: "frozen", cas: null, solvent: false, aliases: [], other_cas: [], disputed_fields: [],
      sources: `tus fórmulas (${key})`, notes: null, source_formula_id: sourceFormula, source_event_id: sourceEvent,
    });
  }

  // ---------------------------------------------------------- your formulas and their histories
  for (const f of library) {
    const h = f.json.header;
    const parent = h.version?.from ? library.find((x) => x.json.header.version?.family === h.version!.family && x.json.header.version?.number === h.version!.from) : undefined;
    formulaRows.push({
      id: formulaId(f.file), owner_id: null, workbench_id: benchId(r.benchAnswer.get(f.file)!), parent_id: parent ? formulaId(parent.file) : null,
      name: h.name.trim() || f.file.replace(/\.json$/, ""), intention: h.intention ?? "",
      container_capacity_ml: h.container?.capacityMl ? numericFromRatio(Ratio.parse(h.container.capacityMl)) : null,
      container_tare_ug: h.container?.tareUg ?? null, work_batch_ug: h.workBatchUg ?? null, final_batch_ug: h.finalBatchUg ?? null,
      markers: accordSources.has(f.file) ? ["accord"] : [], role: null,
    });
    const count = f.engine.history.length;
    const fid = formulaId(f.file);
    f.engine.history.forEach((c, i) => {
      const id = eventIdOf(f.file, c.id, i, count);
      if (c.kind === "add") {
        eventRows.push(event(id, fid, {
          kind: "add", material_id: material(c.material.key, f.file), mass_ug: c.massUg.toString(), fraction: numericFromRatio(c.fraction),
          diluent_id: c.diluent ? material(c.diluent.key, f.file) : null,
          second_diluent_id: c.secondDiluent ? material(c.secondDiluent.material.key, f.file) : null,
          second_fraction: c.secondDiluent ? numericFromRatio(c.secondDiluent.fraction) : null,
        }));
      } else if (c.kind === "set-mass") {
        eventRows.push(event(id, fid, { kind: "set_mass", target: eventIdOf(f.file, c.target, -1, count), mass_ug: c.massUg.toString() }));
      } else if (c.kind === "remove") {
        eventRows.push(event(id, fid, { kind: "remove", target: eventIdOf(f.file, c.target, -1, count) }));
      } else if (c.kind === "reweigh") {
        eventRows.push(event(id, fid, { kind: "reweigh", gross_ug: c.grossUg.toString(), tare_ug: c.tareUg.toString() }));
      } else {
        eventRows.push(event(id, fid, { kind: "note", text: c.text }));
      }
    });
  }

  // Which v3 material each key of your files became: to audit, and for the check of step 7.6.
  writeTable(join(out, "claves.csv"), ["id", "material_id"], [...idOfKey].map(([id, material_id]) => ({ id, material_id })));
  writeTable(join(out, "workbenches.csv"), ["id", "owner_id", "name", "notes"], [...benchRows.values()]);
  writeTable(join(out, "formulas.csv"), ["id", "owner_id", "workbench_id", "parent_id", "name", "intention", "container_capacity_ml", "container_tare_ug", "work_batch_ug", "final_batch_ug", "markers", "role"], formulaRows);
  writeTable(join(out, "formula_events.csv"), ["id", "formula_id", "owner_id", "kind", "material_id", "mass_ug", "fraction", "diluent_id", "second_diluent_id", "second_fraction", "target", "gross_ug", "tare_ug", "text"], eventRows);
  writeTable(join(out, "materials.csv"), ["id", "owner_id", "name", "kind", "cas", "solvent", "aliases", "other_cas", "disputed_fields", "sources", "notes", "source_formula_id", "source_event_id"], [...materialRows, ...frozenRows]);

  const kinds = ["add", "set_mass", "remove", "reweigh", "note"].map((k) => `${k} ${eventRows.filter((e) => e.kind === k).length}`).join(", ");
  writeFileSync(join(out, "informe.md"), `# Tanda 10 · Tus fórmulas, en tu cuenta

*Generada por \`migracion-v3/tanda-10-formulas.ts\` con tus respuestas (\`respuestas/materiales-formulas.csv\`, \`respuestas/bancos.csv\`). Va a tu cuenta, no a lo común (V3-15). Los ids no cambian al volver a ejecutarla; cada evento lleva un UUID v7 en el orden de su historial.*

| Archivo | Filas |
|---|---|
| \`workbenches.csv\` | ${benchRows.size} bancos (V3-19): ${[...benchRows.values()].map((b) => b.name).join(", ")} |
| \`formulas.csv\` | ${formulaRows.length}: las ${library.length} de tu biblioteca y ${snapshots.length} instantáneas (V3-49); ${formulaRows.filter((x) => x.parent_id).length} versiones unidas a su madre |
| \`formula_events.csv\` | ${eventRows.length} eventos (${kinds}) |
| \`materials.csv\` | ${materialRows.length} provisionales tuyos nuevos (V3-48) y ${frozenRows.length} acordes congelados (V3-49) |

**Los acordes congelados** salen de su fórmula hasta el evento en que se congelaron: ${frozenRows.length - snapshots.length} de una fórmula de tu biblioteca, que se marca «acorde» para que se use desde cualquier banco (V3-19; propuesta de la sesión); ${snapshots.length} de una instantánea:

${snapshots.map((s) => `- ${s}`).join("\n")}

**La fase 7.6 comprueba** que cada fórmula, compuesta desde estas filas, dé la composición que guarda su archivo.
`, "utf8");
  return `Tanda 10 escrita: ${benchRows.size} bancos, ${formulaRows.length} fórmulas, ${eventRows.length} eventos, ${materialRows.length + frozenRows.length} materiales. ${out}/informe.md`;
}
