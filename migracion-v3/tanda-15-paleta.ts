/**
 * Batch 15 (V3-38): the palette of the families, travelling with the app. Each closed family of
 * P48 (materials.family) with its colour for a light and a dark theme, its name, its short label
 * and what goes into it, from the lab's piece 11 as the v2 has it (datos/fuente/pieza-11-paleta.csv).
 * The app reads v3/datos/family_palette.csv when it is built: a material's colour is its family's,
 * unless someone fixed one (materials.color); a material without a family is neutral, never a
 * colour made up (V3-38). The user: «se le añade otra vez relaciones entre las familias y el color
 * de manera que, aunque futuramente se quiera editar las visuales exactas de las familias ya
 * vuelvan a existir visuales con color code».
 *
 *   node migracion-v3/tanda-15-paleta.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { writeTable } from "./lib/csv.ts";

const SOURCE = "datos/fuente/pieza-11-paleta.csv";
const OUT = "migracion-v3/tandas/15-paleta";
const commit = execSync(`git log -1 --format=%h -- ${SOURCE}`, { encoding: "utf8" }).trim();
const rows = parseCsvRecords(readFileSync(SOURCE, "utf8"));

// The closed families of the v3 (materials.family, P48), by their Spanish name in piece 11.
const KEY: Record<string, string> = {
  Cítrico: "citrus", Verde: "green", Ozónico: "ozonic", Floral: "floral", Frutal: "fruity",
  Especiado: "spicy", Amaderado: "woody", Animal: "animal", Transformado: "transformed",
};
const hex = (v: string) => {
  if (!/^#[0-9a-f]{6}$/.test(v)) throw new Error(`«${v}» no es un color #rrggbb`);
  return v;
};
const out = rows.map((r) => {
  const family = KEY[r.familia];
  if (!family) throw new Error(`Familia sin clave de la v3: «${r.familia}»`);
  // The short label piece 11 gives the grey family («etiqueta corta Transf»); the others fit whole.
  const short = /etiqueta corta (\S+)/.exec(r.que_entra)?.[1] ?? r.familia;
  return {
    family,
    order: Number(r.orden),
    name: r.familia,
    short,
    colour_name: r.nombre_color,
    light: hex(r.claro),
    dark: hex(r.oscuro),
    covers: r.que_entra.replace(/;\s*etiqueta corta \S+$/, ""),
    source: `laboratorio, pieza 11 (P48), en la v2: ${SOURCE} (commit ${commit})`,
  };
});
const missing = Object.values(KEY).filter((k) => !out.some((o) => o.family === k));
if (missing.length) throw new Error(`Faltan familias en la paleta: ${missing.join(", ")}`);
writeTable(join(OUT, "family_palette.csv"), Object.keys(out[0]), out);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 15 · La paleta de las familias

*Generada por \`migracion-v3/tanda-15-paleta.ts\` (V3-38) desde la pieza 11 del laboratorio, como la tiene la v2 (\`${SOURCE}\`, commit \`${commit}\`). Escribe \`v3/datos/family_palette.csv\`: la app la lee al construirse y viaja con ella.*

| Familia | Clave | Color | Claro | Oscuro | Qué entra |
|---|---|---|---|---|---|
${out.map((o) => `| ${o.name} | ${o.family} | ${o.colour_name} | \`${o.light}\` | \`${o.dark}\` | ${o.covers} |`).join("\n")}

El color de un material es el de su familia (tu versión hereda la del común), en claro u oscuro según el tema; si alguien fija \`color\`, manda ese. Sin familia, neutro: nunca un color inventado. Para cambiar un color de familia más adelante, se cambia esta tabla y cambian todos los que no fijaste.
`,
  "utf8",
);
console.log(`Tanda 15: ${out.length} familias. ${OUT}/informe.md`);
