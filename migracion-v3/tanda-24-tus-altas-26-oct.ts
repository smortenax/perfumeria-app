/**
 * Batch 24 (2026-10-27): into YOUR ACCOUNT, never into the common data. Your version of each of the
 * 20 materials of batch 23, with its shop and «lo tengo» (as batch 17), and the 23 bottles you made
 * on 2026-10-26, from what you weighed (V3-67: lo pesado es la verdad), as batch 19 left the rest.
 * The user, 2026-10-27: «si adelante puedes pasarlo a la repo de la app con la info necesaria»; the
 * weights, from their sheet (migracion-v3/respuestas/diluciones-26-oct.xlsx, read by
 * frascos-2026-10-26.py into frascos-2026-10-26.csv). The shop: Perfumiarz or Maese Lab, as the
 * lab's list says; the three it left «por confirmar» are Maese Lab's, by the user («los 10 nuevos de
 * maese y los 12 nuevos de perfumiarz»). Five bottles are of materials you already had (Sandalmysore
 * Core, Dartanol, Polysantol, Auranone, wormwood): new bottles of your version of each.
 *
 * A bottle weighed from a product that comes diluted (Filbertone at 1 % in TEC, para-cresol at 10 %
 * in IPM, Luminide at 25 % and Ambrarome at 50 % in DPG) counts the product's own solvent as one more
 * diluent: the material is only what the product has of it. The name of a bottle is its usual
 * strength («al 3 %», as the user asked for the ones made stronger on purpose: «apuntalas al
 * porcentaje redondo mas cercano»); the figure that counts is the exact one, to six decimals.
 * Approved with `aprobar.ts --cuenta`, loaded with `cargar-laboratorio.ts <your email> --tanda=24-tus-altas-26-oct`,
 * after batch 23 (the versions are based on its materials).
 *
 *   node migracion-v3/tanda-24-tus-altas-26-oct.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/24-tus-altas-26-oct";
const SAID = "el usuario, 2026-10-27: «si adelante puedes pasarlo a la repo de la app con la info necesaria»";
const MADE_ON = "2026-10-26";
type Rec = Record<string, Cell>;

const batch23 = (parseCsvRecords(readFileSync("migracion-v3/tandas/23-altas-26-oct/materials.csv", "utf8")) as Rec[]);
const header = readFileSync("migracion-v3/tandas/23-altas-26-oct/materials.csv", "utf8").split("\n")[0].split(",");
const common = batch23.filter((m) => !m.owner_id);
const list = parseCsvRecords(readFileSync("migracion-v3/web/altas-2026-10-26/lista.csv", "utf8"));
const weighed = parseCsvRecords(readFileSync("migracion-v3/respuestas/frascos-2026-10-26.csv", "utf8"));

const commonOf = (name: string) => {
  const hits = common.filter((m) => m.name === name && String(m.notes ?? "").includes("tanda 23"));
  if (hits.length !== 1) throw new Error(`«${name}»: ${hits.length} materiales de la tanda 23`);
  return hits[0];
};
const solventNamed = (re: RegExp) => {
  const hits = common.filter((m) => String(m.solvent) === "true" && re.test(String(m.name)));
  if (hits.length !== 1) throw new Error(`${re}: ${hits.length} diluyentes comunes`);
  return { id: String(hits[0].id), name: String(hits[0].name).replace(/ \(.*\)$/, "") };
};
const ETHANOL = solventNamed(/^Etanol/);
const DPG = solventNamed(/^DPG/);
const IPM = solventNamed(/^IPM/);
const TEC = solventNamed(/^TEC/);
const DILUENT: Readonly<Record<string, typeof ETHANOL>> = { "Alcohol 96º": ETHANOL, DPG };

// Your versions: one per material of batch 23, based on it.
const versions: Rec[] = list.map((item) => {
  const base = commonOf(item.nombre);
  return {
    ...Object.fromEntries(header.map((c) => [c, null])),
    id: uuidFor(`tuya:tanda24:${base.id}`),
    owner_id: null,
    name: base.name,
    kind: base.kind,
    solvent: false,
    aliases: [],
    other_cas: [],
    disputed_fields: [],
    based_on_id: base.id,
    category_id: base.category_id,
    supplier: item.proveedor === "por confirmar" ? "Maese Lab" : item.proveedor,
    product: item.producto_tienda,
    sources: SAID,
  };
});
const have: Rec[] = versions.map((m) => ({ id: uuidFor(`tengo:tanda24:${m.id}`), user_id: null, material_id: m.id }));

// The sheet's names: a new material by its name in the lab's list; one you had, by your version of batch 8.
const versionOf = (name: string) => String(versions.find((v) => v.name === name)!.id);
const MATERIAL: Readonly<Record<string, string>> = {
  "Sandalmysore Core": "9509f40b-2d5f-5287-8357-5fd691bec2b2",
  Dartanol: "aeebc7ac-f0f1-5141-9eb0-61ebd9d346a6",
  Auranone: "a924f079-2a85-5628-b005-810d4822442a",
  Polysantol: "1e48a934-bee3-5924-bd64-c486e20733bd",
  "Ajenjo AE": "2de07355-4e44-52f7-bae6-19d21c951042",
  "Exaltolide Total": versionOf("Exaltolide Total"),
  Isobutavan: versionOf("Isobutavan"),
  Operanide: versionOf("Operanide"),
  Veramoss: versionOf("Veramoss"),
  "Etil vainillina": versionOf("Etil vainillina"),
  Indol: versionOf("Indol"),
  Filbertone: versionOf("Filbertone"),
  "Para-cresol": versionOf("Para-cresol"),
  "Gálbano AE": versionOf("Gálbano, aceite esencial"),
  Luminide: versionOf("Luminide"),
  Ambrarome: versionOf("Ambrarome"),
  Prunella: versionOf("Prunella"),
  Shangralide: versionOf("Shangralide"),
  "Orris Givco": versionOf("Orris Givco"),
  "Opopónax AE": versionOf("Opopónax, aceite esencial"),
  "Mirra AE": versionOf("Mirra, aceite esencial"),
  Clearwood: versionOf("Clearwood"),
  "Tintura de cardamomo verde (prueba)": versionOf("Cardamomo verde, tintura"),
};
// What a product that comes diluted carries besides the material (the lab's list: «viene al 1 % en TEC»…).
const OWN_SOLVENT: Readonly<Record<string, typeof ETHANOL>> = { Filbertone: TEC, "Para-cresol": IPM, Luminide: DPG, Ambrarome: DPG };

// Exact fractions as the app keeps them (batch 19): bigint, six decimals, half up; µg from the typed grams.
const SCALE = 1_000_000n;
const six = (num: bigint, den: bigint) => (2n * num * SCALE + den) / (2n * den);
const decimal = (millionths: bigint) => ((millionths / SCALE).toString() + "." + (millionths % SCALE).toString().padStart(6, "0")).replace(/\.?0+$/, "");
const microgram = (grams: string) => {
  if (!/^\d+\.\d{3}$/.test(grams)) throw new Error(`«${grams}» no es un peso con tres decimales`);
  return BigInt(grams.replace(".", "")) * 1000n;
};
/** A share like «0.25» as a ratio, so that the material in a diluted product is exact. */
const ratio = (text: string): [bigint, bigint] => {
  const [whole, frac = ""] = text.split(".");
  const den = 10n ** BigInt(frac.length);
  return [BigInt(whole) * den + BigInt(frac || "0"), den];
};
const NOMINAL = [0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 100];
const labelOf = (fraction: number) => {
  const pct = fraction * 100;
  const near = NOMINAL.find((p) => Math.abs(pct - p) <= p * 0.15);
  return `al ${String(near ?? Number(pct.toFixed(2))).replace(".", ",")} %`;
};
const g = (ug: bigint) => (Number(ug) / 1e6).toFixed(3).replace(".", ",");

const bottles: Rec[] = [];
const diluents: Rec[] = [];
const report: string[] = [];
for (const w of weighed) {
  const materialId = MATERIAL[w.material];
  const added = DILUENT[w.diluyente];
  if (!materialId || !added) throw new Error(`Fila ${w.fila}: «${w.material}» o «${w.diluyente}» sin correspondencia`);
  const productUg = microgram(w.producto_g);
  const addedUg = microgram(w.diluyente_g);
  const [num, den] = ratio(w.viene_al);
  if ((productUg * num) % den !== 0n) throw new Error(`Fila ${w.fila}: la masa de material no es exacta en µg`);
  const materialUg = (productUg * num) / den;
  const own = OWN_SOLVENT[w.material];
  if ((num !== den) !== Boolean(own)) throw new Error(`Fila ${w.fila}: «viene al» ${w.viene_al} sin su disolvente, o al revés`);
  const parts = new Map<string, { name: string; massUg: bigint }>();
  const add = (d: typeof ETHANOL, massUg: bigint) => parts.set(d.id, { name: d.name, massUg: (parts.get(d.id)?.massUg ?? 0n) + massUg });
  if (own) add(own, productUg - materialUg);
  add(added, addedUg);
  const total = productUg + addedUg;
  const fraction = six(materialUg, total);
  const rows = [...parts].map(([id, p]) => ({ id, ...p, share: six(p.massUg, total) }));
  // Every share to six decimals adding up to 1: what rounding moves goes to the largest diluent (as the app does).
  const largest = rows.reduce((at, r, i) => (r.share > rows[at].share ? i : at), 0);
  rows[largest].share += SCALE - fraction - rows.reduce((s, r) => s + r.share, 0n);
  const id = uuidFor(`frasco:tanda24:${w.fila}`);
  const label = labelOf(Number(decimal(fraction)));
  const weighedText = `${g(productUg)} g${own ? ` del producto al ${String(Number(w.viene_al) * 100).replace(".", ",")} % en ${own.name}` : ""} + ${g(addedUg)} g de ${added.name} = ${g(total)} g`;
  bottles.push({
    id,
    user_id: null,
    material_id: materialId,
    fraction: decimal(fraction),
    solvent: null,
    made_on: MADE_ON,
    description: `Pesado el ${MADE_ON} (${weighedText}), frasco de ${w.frasco}; tu hoja diluciones-26-oct.xlsx, fila ${w.fila}.${w.nota ? ` ${w.nota}.` : ""}`.replace(/\.\./g, "."),
    label,
    material_mass_ug: materialUg.toString(),
    source_dilution_id: null,
    archived_at: null,
  });
  rows.forEach((r, position) =>
    diluents.push({ id: uuidFor(`frasco:${id}:${r.id}`), dilution_id: id, user_id: null, diluent_id: r.id, mass_ug: r.massUg.toString(), fraction: decimal(r.share), position }),
  );
  const target = Number(w.objetivo);
  const off = Number(decimal(fraction)) / target - 1;
  report.push(
    `| ${w.material} | ${w.frasco} | ${String(target * 100).replace(".", ",")} % | ${weighedText} | **${(Number(decimal(fraction)) * 100).toFixed(4).replace(".", ",")} %** | ${label} | ${rows.map((r) => `${r.name} ${(Number(decimal(r.share)) * 100).toFixed(2).replace(".", ",")} %`).join(" + ")} | ${Math.abs(off) > 0.02 ? `**${off > 0 ? "+" : ""}${(off * 100).toFixed(1).replace(".", ",")} %**` : ""} |`,
  );
}

writeTable(join(OUT, "materials.csv"), header, versions);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], have);
writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], bottles);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], diluents);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 24 · Tus versiones de los materiales del 2026-10-26 y tus 23 frascos nuevos, en tu cuenta

*Generada por \`migracion-v3/tanda-24-tus-altas-26-oct.ts\` (2026-10-27). ${SAID}. Va a tu cuenta, no a lo común, y se carga después de la tanda 23.*

## Tus versiones (${versions.length}, con «lo tengo»)

| Tu versión | Tienda | Producto |
|---|---|---|
${versions.map((v) => `| ${v.name} | ${v.supplier} | ${v.product} |`).join("\n")}

Clearwood, Indol y Etil vainillina, que la lista del laboratorio dejaba «por confirmar», van como Maese Lab por tu mensaje («los 10 nuevos de maese»). Lo que digan los documentos de cada bote (certificado, alérgenos) lo añades en su editor (V3-39) o entra cuando se resuelva la tarea \`docs-v3/tareas/2026-10-27-info-altas.md\`.

## Tus frascos (${bottles.length}), de lo que pesaste

De tu hoja (\`migracion-v3/respuestas/diluciones-26-oct.xlsx\`, leída por \`frascos-2026-10-26.py\`). La cifra exacta es la de lo pesado, a seis decimales; el nombre, el % redondo más cercano. Donde el producto viene diluido, su disolvente cuenta como otro diluyente y el material es solo lo que lleva el producto.

| Material | Frasco | Objetivo | Lo pesado | Exacto | Nombre | Diluyentes | Desvío |
|---|---|---|---|---|---|---|---|
${report.join("\n")}

- **Gálbano al 3 % y tintura de cardamomo verde al 20 %:** más fuertes a propósito; tus palabras: «apuntalas al porcentaje redondo mas cercano».
- **Dartanol, 46,92 %:** cayeron 0,657 g de alcohol más de los que tocaban para el 50 %; se queda con su cifra exacta y el nombre «al 50 %». Si lo corriges, se cambia en Diluciones.
- **Para-cresol, 0,1101 %:** 44 mg pesados con una báscula de 1 mg; el nombre, «al 0,1 %».
- Las tinturas de ambreta y de cardamomo villoso se usan tal cual: no son frasco.
`,
  "utf8",
);
console.log(`Tanda 24: ${versions.length} versiones, ${have.length} «lo tengo», ${bottles.length} frascos, ${diluents.length} diluyentes. ${OUT}/informe.md`);
