/**
 * Batch 34 (2026-10-28): into YOUR ACCOUNT, never into the common data. The 10 bottles you made on
 * 2026-10-28 for the Decision session, from what you weighed (V3-67: lo pesado es la verdad), as
 * batch 24 did with those of the 26th. The user, 2026-10-28: «de momento push de todo esto y sube las
 * altas de los materiales a la app tambien»; the weights, from their sheet
 * (migracion-v3/respuestas/diluciones-28-oct.xlsx, read by frascos-2026-10-28.py into
 * frascos-2026-10-28.csv). Every material is already yours (batches 8, 17 and 33): no new versions.
 *
 * The Moroccan labdanum comes at 50 % in TEC (the user: «el de marruecos esta al 50 en tec»): its TEC
 * counts as one more diluent and the material is only what the product has of it.
 * Approved with `aprobar.ts --cuenta`, loaded with `cargar-laboratorio.ts <your email> --tanda=34-frascos-28-oct`,
 * after batch 33 (pink pepper and juniper are its versions).
 *
 *   node migracion-v3/tanda-34-frascos-28-oct.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/34-frascos-28-oct";
const SAID = "el usuario, 2026-10-28: «de momento push de todo esto y sube las altas de los materiales a la app tambien»";
const MADE_ON = "2026-10-28";
type Rec = Record<string, Cell>;

const weighed = parseCsvRecords(readFileSync("migracion-v3/respuestas/frascos-2026-10-28.csv", "utf8"));

// The common diluents, as batches 24 and 25 use them.
const ETHANOL = { id: "8c6d2ffa-b0e9-562e-815c-a77973deb67e", name: "Etanol" };
const DPG = { id: "2027b1c9-0d48-5111-b189-2011b3fef123", name: "DPG" };
const TEC = { id: "baae0ff9-eb1b-59e5-9e4e-31f84686acdb", name: "TEC" };
const DILUENT: Readonly<Record<string, typeof ETHANOL>> = { "Alcohol 96º": ETHANOL, DPG };

// The sheet's names: your version of each material.
const MATERIAL: Readonly<Record<string, string>> = {
  "Láudano de jara (puro, bote entero)": "b444bde9-8e54-5a1f-a938-76a4a8567b15", // Maese Lab, absoluto (batch 8)
  "Láudano de Marruecos (50 % en TEC)": "e4a8bdb1-7271-55d2-9890-8097f156a769", // Harrison Joseph (batch 17)
  "Pimienta rosa AE (aguaribay)": "c92da9ec-ea16-5216-bb93-5150670f3427", // batch 33
  "Enebro bayas AE": "f087d4d9-689c-5d17-bebb-bf6bcbe97dbb", // batch 33
  Olíbano: "85c3b387-a515-5dcc-9292-b36e58be74a3",
  "Bergamota sin bergaptenos": "91130a46-824f-5fb7-bc50-51d5a4728367",
  "Cedro Atlas": "2136b42c-4199-548d-a92e-0c17be2ab146",
  "Cedro chino": "e4da053b-7e6c-59ed-9fef-656c3c270614",
  "Acetato de terpinilo": "c7175cf1-2549-509c-9e64-11ed2a350737",
  "Rose Crystals": "b1a11d94-16f3-54f3-93a5-a709e8f3f750", // Harrison Joseph (batch 17)
};
const OWN_SOLVENT: Readonly<Record<string, typeof ETHANOL>> = { "Láudano de Marruecos (50 % en TEC)": TEC };

// Exact fractions as the app keeps them (batch 19): bigint, six decimals, half up; µg from the typed grams.
const SCALE = 1_000_000n;
const six = (num: bigint, den: bigint) => (2n * num * SCALE + den) / (2n * den);
const decimal = (millionths: bigint) => ((millionths / SCALE).toString() + "." + (millionths % SCALE).toString().padStart(6, "0")).replace(/\.?0+$/, "");
const microgram = (grams: string) => {
  if (!/^\d+\.\d{3}$/.test(grams)) throw new Error(`«${grams}» no es un peso con tres decimales`);
  return BigInt(grams.replace(".", "")) * 1000n;
};
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
  const id = uuidFor(`frasco:tanda34:${w.fila}`);
  const label = labelOf(Number(decimal(fraction)));
  const weighedText = `${g(productUg)} g${own ? ` del producto al ${String(Number(w.viene_al) * 100).replace(".", ",")} % en ${own.name}` : ""} + ${g(addedUg)} g de ${added.name} = ${g(total)} g`;
  bottles.push({
    id,
    user_id: null,
    material_id: materialId,
    fraction: decimal(fraction),
    solvent: null,
    made_on: MADE_ON,
    description: `Pesado el ${MADE_ON} (${weighedText}), frasco de ${w.frasco}; tu hoja diluciones-28-oct.xlsx, fila ${w.fila}.${w.nota ? ` ${w.nota}.` : ""}`.replace(/\.\./g, "."),
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

writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], bottles);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], diluents);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 34 · Tus ${bottles.length} frascos del 2026-10-28, en tu cuenta

*Generada por \`migracion-v3/tanda-34-frascos-28-oct.ts\` (2026-10-28). ${SAID}. Va a tu cuenta, no a lo común, y se carga después de la tanda 33. Sin aprobar.*

De tu hoja (\`migracion-v3/respuestas/diluciones-28-oct.xlsx\`, leída por \`frascos-2026-10-28.py\`). La cifra exacta es la de lo pesado, a seis decimales; el nombre, el % redondo más cercano. Todos los materiales ya son tuyos (tandas 8, 17 y 33): no hay versiones nuevas ni «lo tengo».

| Material | Frasco | Objetivo | Lo pesado | Exacto | Nombre | Diluyentes | Desvío |
|---|---|---|---|---|---|---|---|
${report.join("\n")}

- **Los dos láudanos, pesados por diferencia:** el bote lleno menos el bote vacío y seco; el alcohol es la suma de los enjuagues y lo que completó. El de Marruecos viene al 50 % en TEC: su TEC va como segundo diluyente.
- **Pimienta rosa:** se enturbia en alcohol (lo avisa Eden Botanicals); en DPG se separa. El frasco se agita antes de usar; el perfume se filtra al final.
- **Olíbano, en frasco de 10 ml:** queda poco; el resto, puro.
`,
  "utf8",
);
console.log(`Tanda 34: ${bottles.length} frascos, ${diluents.length} diluyentes. ${OUT}/informe.md`);
