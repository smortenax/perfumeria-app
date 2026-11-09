/**
 * Batch 54 (V3-103): the furocoumarin-free bergamot gets a published composition, so that its 5-MOP
 * stops counting as the whole oil. The user, 2026-11-09: «La bergamota simplemente da números muy fuera
 * de lo esperado de la orden de 5000% por encima de lo normal con una gota de Ae sobre 2g de mezcla».
 *
 * Why: the bergamot FCF is a member of IFRA's STD 089, whose limit is of 5-MOP (V3-27), and with no figure
 * its 5-MOP counted, at worst, as the whole oil: a drop of it was read as a drop of pure bergapten. What
 * goes in is what a supplier certifies for its own FCF bergamot (Opella, IFRA 49 statement, product E1004,
 * the same two CAS as the common material): literature, not the user's bottle, so it counts its maximum
 * and never gives «within». A certificate of the user's own bottle rules over it (V3-39).
 *
 *   node migracion-v3/tanda-54-bergamota.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/54-bergamota";
const FCF = "798f4933-21c6-5840-a52b-8f4d4bf10c64";
const SAID = "V3-103 (the user, 2026-11-09: «da números muy fuera de lo esperado de la orden de 5000% por encima de lo normal con una gota de Ae sobre 2g de mezcla»)";
const URL = "https://opella.se/dokument/IFRA%20-%20Bergamot%20(FCF),%20essential%20oil,%20organic-%20E1004.pdf";
const DOC = `Opella AB, IFRA Statement, «Bergamot (FCF) - essential oil, organic», product E1004, CAS 8007-75-8; 68648-33-9, IFRA 49 (${URL}), «% level in product»`;
type Rec = Record<string, Cell>;

/** As the statement gives them, «≤» each: a percentage, written here as a fraction. */
const LINES: ReadonlyArray<readonly [string, string, string, string]> = [
  ["Limonene", "5989-27-5", "≤47.0", "0.47"],
  ["Linalool", "78-70-6", "≤15.0", "0.15"],
  ["Citral", "5392-40-5", "≤0.7", "0.007"],
  ["Citronellol", "106-22-9", "≤0.03", "0.0003"],
  ["Citronellal", "106-23-0", "≤0.01", "0.0001"],
  ["Geraniol", "106-24-1", "≤0.01", "0.0001"],
  ["Bergaptene (5-MOP)", "484-20-8", "≤0.0005", "0.000005"],
];

const text = readFileSync("v3/datos/material_components.csv", "utf8");
const header = text.slice(0, text.indexOf("\n")).split(",");
const rows = parseCsvRecords(text) as Rec[];
if (rows.some((r) => r.material_id === FCF)) throw new Error("la bergamota sin bergaptenos ya tiene composición: ¿se corrió la tanda dos veces?");
const added: Rec[] = LINES.map(([name, cas, said, max]) => ({
  id: uuidFor(`comp:tanda54:${FCF}:${cas}`),
  material_id: FCF,
  owner_id: null,
  component_id: null,
  component_cas: cas,
  component_name: name,
  amount_kind: "max",
  value: max,
  min: null,
  max: null,
  authority: "literature",
  source: `${DOC}: ${name} ${cas} «${said}». ${SAID}. Another supplier's product, not the user's bottle.`,
}));
writeTable(join(OUT, "material_components.csv"), header, [...rows, ...added]);

writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 54 · La bergamota sin bergaptenos, con una composición publicada (V3-103)

*Generada por \`migracion-v3/tanda-54-bergamota.ts\` sobre \`v3/datos/\`. Común: se aprueba con \`aprobar.ts 54-bergamota\` y entra en la nube al fusionar en \`main\`. Va con el cambio de código de V3-103.*

${SAID}.

## Por qué salía tan alto

La bergamota sin bergaptenos es miembro del estándar 089 de IFRA, cuyo límite es de 5-MOP (bergapteno): 0,0015 % en la categoría 4. Como no tenía ninguna cifra de 5-MOP, la app lo contaba en el peor caso, como si **todo el aceite** fuera 5-MOP (V3-27). Una gota se leía como una gota de bergapteno puro.

## Lo que entra

Lo que certifica [Opella](${URL}) para su bergamota sin bergaptenos (IFRA 49, producto E1004, con los mismos dos CAS que el material común). Es **literatura**, de otro proveedor y no de tu frasco: cuenta su máximo y nunca da «dentro». Si un día tienes el certificado de tu frasco, ese manda (V3-39).

| Constituyente | CAS | El documento («% level in product») |
|---|---|---|
${LINES.map(([n, c, s]) => `| ${n} | ${c} | ${s} % |`).join("\n")}

**Cuánto cambia** con una gota (unos 30 mg) en 2 g de mezcla, un 1,5 % de bergamota:
- **5-MOP:** antes, hasta un 1,5 % de la mezcla; ahora, hasta un 0,0000075 %.
- **Citral:** hasta un 0,0105 % de la mezcla.

## El cambio de código (V3-103)

El 5-MOP «de cantidad desconocida» de V3-27 era de autoridad IFRA, así que habría mandado sobre cualquier cifra de literatura. Ahora espera una cifra: cualquier cifra del constituyente, de la autoridad que sea, ocupa su lugar.
`,
  "utf8",
);
console.log(`Tanda 54: ${added.length} constituyentes de la bergamota sin bergaptenos (Opella, IFRA 49). ${OUT}/informe.md`);
