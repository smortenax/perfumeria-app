/**
 * Batch 41 (2026-10-31): into YOUR ACCOUNT, never into the common data. The 9 bottles you made on
 * 2026-10-31 for the Decision session, from what you weighed (V3-67: lo pesado es la verdad), as
 * batch 34 did with those of the 28th. The weights, from your sheet
 * (migracion-v3/respuestas/diluciones-31-oct.xlsx, read by frascos-2026-10-31.py into
 * frascos-2026-10-31.csv). Every material is already yours (batches 8, 39 and 40): no new versions.
 *
 * Javanol went into alcohol, not the DPG of the plan: the sheet says so, and it is what was weighed.
 * Approved with `aprobar.ts --cuenta`, loaded with `cargar-laboratorio.ts <your email> --tanda=41-frascos-31-oct`,
 * after batches 39 and 40 (Javanol, Boisambrene Forte and Timbersilk are their versions).
 *
 *   node migracion-v3/tanda-41-frascos-31-oct.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/41-frascos-31-oct";
const SAID = "tu hoja diluciones-31-oct.xlsx, rellena y enviada en el hilo el 2026-10-31";
const MADE_ON = "2026-10-31";
type Rec = Record<string, Cell>;

const weighed = parseCsvRecords(readFileSync("migracion-v3/respuestas/frascos-2026-10-31.csv", "utf8"));

// The common diluents, as batches 24, 25 and 34 use them.
const ETHANOL = { id: "8c6d2ffa-b0e9-562e-815c-a77973deb67e", name: "Etanol" };
const DPG = { id: "2027b1c9-0d48-5111-b189-2011b3fef123", name: "DPG" };
const DILUENT: Readonly<Record<string, typeof ETHANOL>> = { "Alcohol 96º": ETHANOL, DPG };

// The sheet's names: your version of each material.
const MATERIAL: Readonly<Record<string, string>> = {
  "Iso E Super": "6521a3d2-2f86-531c-808e-44ebfcc3d41c", // Olfatorium (batch 8)
  Timbersilk: "5fe6dae9-c384-5485-bae8-52f0f58af430", // Maese Lab (batch 40)
  Kephalis: "2b51f140-13b6-5715-9a5e-216ed7e59a21", // Perfumiarz (batch 8)
  "Vertenex (opcional)": "9ffe080b-19a9-5cd6-bfa1-08dd6e73c6a6", // Olfatorium (batch 8)
  Habanolide: "3c2e00ec-52c2-5578-bc4b-cdcee866a4a1", // Perfumiarz (batch 8)
  Cedramber: "51a36885-dfcf-5222-a41b-1c1972991bc7", // Perfumiarz (batch 8)
  Javanol: "787b0e3a-443f-58f8-bcd2-9cdf8dd6ae30", // Maese Lab (batch 39)
  "Boisambrene Forte": "72f0ecb2-97e0-54c9-9cca-fc734527d33a", // Maese Lab (batch 39)
  "Acetato de guayilo": "0d854d38-9888-59bc-9e49-b12657ecaab8", // Olfatorium (batch 8)
};
const OWN_SOLVENT: Readonly<Record<string, typeof ETHANOL>> = {}; // none comes diluted this time

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
  const id = uuidFor(`frasco:tanda41:${w.fila}`);
  const label = labelOf(Number(decimal(fraction)));
  const weighedText = `${g(productUg)} g${own ? ` del producto al ${String(Number(w.viene_al) * 100).replace(".", ",")} % en ${own.name}` : ""} + ${g(addedUg)} g de ${added.name} = ${g(total)} g`;
  bottles.push({
    id,
    user_id: null,
    material_id: materialId,
    fraction: decimal(fraction),
    solvent: null,
    made_on: MADE_ON,
    description: `Pesado el ${MADE_ON} (${weighedText}), frasco de ${w.frasco}; tu hoja diluciones-31-oct.xlsx, fila ${w.fila}.${w.nota ? ` ${w.nota}.` : ""}`.replace(/\.\./g, "."),
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
  `# Tanda 41 · Tus ${bottles.length} frascos del 2026-10-31, en tu cuenta

*Generada por \`migracion-v3/tanda-41-frascos-31-oct.ts\` (2026-10-31). De ${SAID}. Va a tu cuenta, no a lo común, y se carga después de las tandas 39 y 40. Sin aprobar.*

De tu hoja (\`migracion-v3/respuestas/diluciones-31-oct.xlsx\`, leída por \`frascos-2026-10-31.py\`). La cifra exacta es la de lo pesado, a seis decimales; el nombre, el % redondo más cercano. Todos los materiales ya son tuyos (tandas 8, 39 y 40): no hay versiones nuevas ni «lo tengo».

| Material | Frasco | Objetivo | Lo pesado | Exacto | Nombre | Diluyentes | Desvío |
|---|---|---|---|---|---|---|---|
${report.join("\n")}

- **Javanol, en alcohol:** el plan lo ponía en DPG; tu hoja dice alcohol y es lo que se pesó.
- **Iso E Super:** 12,575 g en el frasco de 20 ml, algo menos que los 15 g del plan; el % es el exacto.
- **Habanolide:** se enturbia en alcohol (Fraterworks); el frasco se agita antes de pesar.
- **Sin pesar, fuera de esta tanda:** vetiver, pachulí, tabaco, cacao y las tinturas de ámbar gris y ambreta. Sin sus pesos no hay masa que registrar.
`,
  "utf8",
);
console.log(`Tanda 41: ${bottles.length} frascos, ${diluents.length} diluyentes. ${OUT}/informe.md`);
