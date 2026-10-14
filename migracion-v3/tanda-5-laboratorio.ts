/**
 * Batch 5 of the migration (plan v3, phase 4, step 4.9; V3-15): your lab's materials, into your
 * account, not into the common data. Reads ../Perfumery/biblioteca/materiales.sqlite, read-only:
 * nothing is written there.
 *
 * First step: which common material each of yours is a version of (V3-5). The candidates go, each
 * with the session's recommendation, to migracion-v3/conflictos/laboratorio.csv; you decide each
 * row, and your answers are written to migracion-v3/respuestas/laboratorio.csv. Until every row
 * has its answer, it writes nothing else.
 *
 *   node migracion-v3/tanda-5-laboratorio.ts
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { parseCsvRecords } from "../src/data/csv.ts";
import { writeTable } from "./lib/csv.ts";
import { readSources } from "./lib/fuentes.ts";
import { v2Id } from "./lib/ids.ts";

const LAB = "../Perfumery/biblioteca/materiales.sqlite";
const CONFLICTS = "migracion-v3/conflictos/laboratorio.csv";
const ANSWERS = "migracion-v3/respuestas/laboratorio.csv";
const lab = new DatabaseSync(LAB, { readOnly: true });
const labCommit = execSync("git -C ../Perfumery log -1 --format=%h -- biblioteca/materiales.sqlite", { encoding: "utf8" }).trim();
const src = readSources();
type LabRow = Record<string, string | number | null>;
const all = (sql: string) => lab.prepare(sql).all() as LabRow[];
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

// ------------------------------------------------------------ the common data, as the user approved it (v3/datos)
type Rec = Record<string, string>;
const common = parseCsvRecords(readFileSync("v3/datos/materials.csv", "utf8")) as Rec[];
const commonById = new Map(common.map((m) => [m.id, m]));
const v2Of = new Map<string, string>();
for (const m of src.v2.materials) v2Of.set(v2Id(m.id), m.id);
for (const p of src.v2.products) v2Of.set(v2Id(p.id), p.id);
for (const s of src.v2.substances) if (!v2Of.has(v2Id(s.id))) v2Of.set(v2Id(s.id), s.id);
const byV2 = new Map([...v2Of].map(([v3, v2]) => [v2, v3]));

/** Without accents, case or punctuation at the ends. */
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u200b/g, "").toLowerCase().trim();
const tokens = (s: string) => new Set(fold(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2));
const list = (r: Rec, column: string): string[] => JSON.parse(r[column] || "[]");

const byCas = new Map<string, Set<string>>();
const byName = new Map<string, Set<string>>();
const put = (map: Map<string, Set<string>>, key: string, id: string) => map.set(key, (map.get(key) ?? new Set()).add(id));
for (const m of common) {
  for (const cas of [m.cas, ...list(m, "other_cas")]) if (cas) put(byCas, cas, m.id);
  for (const name of [m.name, ...list(m, "aliases")]) put(byName, fold(name), m.id);
}
const CAS = /\b\d{2,7}-\d{2}-\d\b/g;

// ------------------------------------------------------------ your lab
const materials = all("select * from materials order by id");
const synonyms = new Map<string, string[]>();
for (const s of all("select material_id, name from material_synonyms order by name")) {
  synonyms.set(text(s.material_id), [...(synonyms.get(text(s.material_id)) ?? []), text(s.name)]);
}
const bottles = new Map(all("select * from user_materials").map((u) => [text(u.material_id), u]));
const productName = (bottle: LabRow) => text(bottle.product).replace(/\s*—\s*\[.*$/, "").trim();

const show = (id: string) => {
  const m = commonById.get(id)!;
  return `${v2Of.get(id) ?? id} «${m.name.replace(/\u200b/g, "")}»${m.supplier ? ` (${m.supplier})` : ""}${m.kind ? ` [${m.kind}]` : ""}`;
};

interface Row {
  readonly id: string;
  readonly kind: string;
  readonly candidates: readonly string[];
  readonly recommendation: string;
  readonly reason: string;
}
const rows: Row[] = materials.map((m) => {
  const id = text(m.id);
  const bottle = bottles.get(id);
  // Your names, your synonyms and the name of the product you have (without the lab's link to its research).
  const names = [text(m.name), ...(synonyms.get(id) ?? []), ...(bottle?.product ? [productName(bottle)] : [])];
  const byCasHits = new Set((text(m.cas).match(CAS) ?? []).flatMap((c) => [...(byCas.get(c) ?? [])]));
  const byNameHits = new Set(names.flatMap((n) => [...(byName.get(fold(n)) ?? [])]));
  const candidates = [...new Set([...byCasHits, ...byNameHits])].sort((a, b) => (v2Of.get(a) ?? a).localeCompare(v2Of.get(b) ?? b));
  const supplier = fold(text(bottle?.supplier));
  const kindNote = (target: string) => {
    const k = commonById.get(target)!.kind;
    return k !== text(m.kind) ? `; el laboratorio dice ${text(m.kind)} y el común ${k}: tu versión toma el del común` : "";
  };
  const pick = (target: string, why: string) => ({ id, kind: text(m.kind), candidates, recommendation: `versión de ${v2Of.get(target) ?? target}`, reason: why + kindNote(target) });

  // Your bottle is a product of the common data (the v2's products came from your notebook).
  const mine = candidates.filter((c) => {
    const s = fold(commonById.get(c)!.supplier ?? "");
    return s && supplier && (supplier.includes(s) || s.includes(supplier));
  });
  if (mine.length === 1) return pick(mine[0], `es tu producto de ${commonById.get(mine[0])!.supplier}`);
  const general = (hits: Set<string>) => [...hits].filter((c) => !commonById.get(c)!.supplier);
  for (const [hits, how] of [[byCasHits, "por CAS"], [byNameHits, "por nombre"]] as const) {
    const g = general(hits);
    if (g.length === 1) return pick(g[0], `el único material general que casa ${how}`);
  }
  const g = general(new Set(candidates));
  if (g.length > 1) {
    const mineTokens = new Set(names.concat(text(bottle?.product)).flatMap((n) => [...tokens(n)]));
    const score = (c: string) => {
      const r = commonById.get(c)!;
      return Math.max(...[r.name, ...list(r, "aliases")].map((n) => [...tokens(n)].filter((t) => mineTokens.has(t)).length));
    };
    const ranked = g.map((c) => [c, score(c)] as const).sort((a, b) => b[1] - a[1]);
    const tie = ranked.length > 1 && ranked[0][1] === ranked[1][1];
    return pick(ranked[0][0], `de ${g.length} materiales generales que casan, el que más palabras comparte con tus nombres${tie ? " (empata con otro: míralo)" : ""}`);
  }
  return { id, kind: text(m.kind), candidates, recommendation: "material nuevo", reason: candidates.length ? "solo casa con productos de otras tiendas" : "no casa con ningún común, ni por CAS ni por nombre" };
});

writeTable(CONFLICTS, ["id", "nombre", "tipo", "cas_del_laboratorio", "tu_producto", "candidatos", "recomendacion", "motivo"], rows.map((r) => {
  const m = materials.find((x) => text(x.id) === r.id)!;
  const bottle = bottles.get(r.id);
  return {
    id: r.id, nombre: text(m.name), tipo: r.kind, cas_del_laboratorio: text(m.cas),
    tu_producto: bottle ? `${text(bottle.supplier)}: ${productName(bottle)}` : "",
    candidatos: r.candidates.map(show).join(" | "), recomendacion: r.recommendation, motivo: r.reason,
  };
}));

const answers = new Map(existsSync(ANSWERS) ? parseCsvRecords(readFileSync(ANSWERS, "utf8")).map((r) => [r.id, r.respuesta.trim()]) : []);
const invalid = rows.filter((r) => {
  const a = answers.get(r.id);
  return a !== undefined && a !== "material nuevo" && !(a.startsWith("versión de ") && byV2.has(a.slice("versión de ".length)) && commonById.has(byV2.get(a.slice("versión de ".length))!));
});
const pending = rows.filter((r) => !answers.has(r.id));
const count = (f: (r: Row) => boolean) => rows.filter(f).length;
console.log(`Tanda 5: ${rows.length} materiales del laboratorio (commit ${labCommit}) en ${CONFLICTS}.`);
console.log(`Recomendación: ${count((r) => r.reason.startsWith("es tu producto"))} tu producto, ${count((r) => r.reason.startsWith("el único"))} el único general, ${count((r) => r.reason.startsWith("de "))} entre varios, ${count((r) => r.recommendation === "material nuevo")} nuevos.`);
if (invalid.length) throw new Error(`Respuestas que no valen: ${invalid.map((r) => `${r.id}: «${answers.get(r.id)}»`).join("; ")}`);
if (pending.length) {
  console.log(`Faltan ${pending.length} respuestas en ${ANSWERS}: no se escribe la tanda.`);
  process.exit(0);
}
console.log("Todas contestadas.");
