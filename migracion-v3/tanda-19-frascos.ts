/**
 * Batch 19 (2026-10-19): your 51 bottles of batch 8 in the shape of V3-67, into YOUR ACCOUNT. Each
 * gets its diluents as materials (lab_dilution_diluents) instead of words, and a rough name
 * («al 10 %»); the figure that counts stays the exact one. Where its note gives what was weighed
 * («5,000 g + 5,060 g de DPG + 2,440 g de alcohol = 12,500 g»), the bottle is worked out from the
 * weights, as the app does (V3-67: lo pesado es la verdad), and its material mass is kept; else its
 * fraction stays as the lab wrote it and the one diluent takes the rest. The user, 2026-10-19: «los
 * 51 luego se pasan cuando este todo planeado». Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --tanda=19-frascos`.
 *
 *   node migracion-v3/tanda-19-frascos.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/19-frascos";
type Rec = Record<string, Cell>;

const common = (parseCsvRecords(readFileSync("v3/datos/materials.csv", "utf8")) as Rec[]).filter((m) => !m.owner_id && String(m.solvent) === "true");
const diluentNamed = (re: RegExp) => {
  const found = common.filter((m) => re.test(String(m.name)));
  if (found.length !== 1) throw new Error(`${re}: ${found.length} diluyentes comunes`);
  return String(found[0].id);
};
const DPG = diluentNamed(/^DPG/);
const ETHANOL = diluentNamed(/^Etanol/);
const WORDS: Readonly<Record<string, string>> = { DPG: DPG, "alcohol 96º": ETHANOL };

const bottles = parseCsvRecords(readFileSync("migracion-v3/tandas/8-tu-version/lab_dilutions.csv", "utf8")) as Rec[];
const names = new Map((parseCsvRecords(readFileSync("migracion-v3/tandas/8-tu-version/materials.csv", "utf8")) as Rec[]).map((m) => [m.id, String(m.name)]));

// Exact fractions, as the app keeps them: numerator and denominator in bigint; kept to six decimals, half up.
const SCALE = 1_000_000n;
const six = (num: bigint, den: bigint) => (2n * num * SCALE + den) / (2n * den);
const decimal = (millionths: bigint) => {
  const text = (millionths / SCALE).toString() + "." + (millionths % SCALE).toString().padStart(6, "0");
  return text.replace(/\.?0+$/, "");
};
const decimalToMillionths = (text: string) => {
  const [whole, frac = ""] = text.split(".");
  return BigInt(whole) * SCALE + BigInt((frac + "000000").slice(0, 6));
};
const grams = (text: string) => BigInt(text.replace(",", "").replace(".", "")) * 1000n; // «5,060» g → µg

/** The usual strength a weighed bottle was made for (as the queue groups them): within 15 %. */
const NOMINAL = [0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 100];
const labelOf = (fraction: number) => {
  const pct = fraction * 100;
  const near = NOMINAL.find((p) => Math.abs(pct - p) <= p * 0.15);
  return `al ${String(near ?? Number(pct.toFixed(2))).replace(".", ",")} %`;
};

const out: Rec[] = [];
const diluents: Rec[] = [];
const report: string[] = [];
for (const b of bottles) {
  const name = names.get(b.material_id) ?? String(b.material_id);
  const solvent = String(b.solvent ?? "").trim();
  const note = String(b.description ?? "");
  if (solvent === "") {
    // Pure is not a bottle (V3-67, 7): it stays as it was, archived, so that nothing offers it.
    out.push({ ...b, label: "puro", material_mass_ug: null, source_dilution_id: null, archived_at: "2026-10-19T00:00:00Z" });
    report.push(`| ${name} | ${b.fraction} | — | se archiva: «puro» no es un frasco (V3-67) |`);
    continue;
  }
  // «(5,000 g + 5,060 g de DPG + 2,440 g de alcohol = 12,500 g)» or «(0,304 g + 1,207 g de alcohol 96º = 1,511 g)».
  const weighed = /\((\d+,\d{3}) g \+ (\d+,\d{3}) g de (DPG|alcohol(?: 96º)?)(?: \+ (\d+,\d{3}) g de (DPG|alcohol(?: 96º)?))? = (\d+,\d{3}) g\)/.exec(note);
  let fraction: bigint;
  let rows: { id: string; massUg: bigint | null; share: bigint }[];
  let materialUg: bigint | null = null;
  if (weighed) {
    materialUg = grams(weighed[1]);
    const parts = [
      { id: /DPG/.test(weighed[3]) ? DPG : ETHANOL, massUg: grams(weighed[2]) },
      ...(weighed[4] ? [{ id: /DPG/.test(weighed[5]) ? DPG : ETHANOL, massUg: grams(weighed[4]) }] : []),
    ];
    const total = materialUg + parts.reduce((s, p) => s + p.massUg, 0n);
    if (total !== grams(weighed[6])) throw new Error(`${name}: los pesos no suman ${weighed[6]} g`);
    fraction = six(materialUg, total);
    rows = parts.map((p) => ({ id: p.id, massUg: p.massUg, share: six(p.massUg, total) }));
  } else {
    const id = WORDS[solvent];
    if (!id) throw new Error(`${name}: «${solvent}» sin pesos en la nota; no se adivina la proporción`);
    fraction = decimalToMillionths(String(b.fraction));
    rows = [{ id, massUg: null, share: SCALE - fraction }];
  }
  // Every share to six decimals adding up to 1: what rounding moves goes to the largest diluent (as the app does).
  const sum = fraction + rows.reduce((s, r) => s + r.share, 0n);
  const largest = rows.reduce((at, r, i) => (r.share > rows[at].share ? i : at), 0);
  rows[largest].share += SCALE - sum;
  const was = String(b.fraction);
  const now = decimal(fraction);
  out.push({ ...b, fraction: now, label: labelOf(Number(now)), material_mass_ug: materialUg === null ? null : materialUg.toString(), source_dilution_id: null, archived_at: null });
  rows.forEach((r, position) =>
    diluents.push({
      id: uuidFor(`frasco:${b.id}:${r.id}`),
      dilution_id: b.id,
      user_id: null,
      diluent_id: r.id,
      mass_ug: r.massUg === null ? null : r.massUg.toString(),
      fraction: decimal(r.share),
      position,
    }),
  );
  if (weighed || now !== was) {
    report.push(`| ${name} | ${was} → ${now} | ${rows.map((r) => `${r.id === DPG ? "DPG" : "Etanol"} ${decimal(r.share)}`).join(" + ")} | de los pesos de la nota |`);
  }
}

writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], out);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], diluents);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 19: tus frascos, con sus diluyentes (V3-67)

Los ${bottles.length} frascos de la tanda 8, a tu cuenta. Cada uno pasa a tener sus diluyentes como materiales (DPG,
Etanol) con su parte del frasco, y un nombre aproximado («al 10 %»); la cifra que cuenta sigue siendo la exacta.
Donde la nota dice lo pesado, el frasco sale de los pesos, como lo hace la app, y se guarda la masa del material.
Ninguno se borra; las fórmulas no cambian (cada pesada guardó su cifra).

- **${diluents.length} filas de diluyentes** para ${out.filter((r) => !r.archived_at).length} frascos.
- **${out.filter((r) => r.archived_at).length} se archiva** («puro» no es un frasco, V3-67).

| Frasco | Fracción | Diluyentes | Por qué |
|---|---|---|---|
${report.join("\n")}

Los demás: un diluyente (DPG o Etanol, por lo que decía su nota), que se lleva el resto; su fracción no cambia.
`,
  "utf8",
);
console.log(`${out.length} frascos, ${diluents.length} diluyentes, ${out.filter((r) => r.archived_at).length} archivado.`);
