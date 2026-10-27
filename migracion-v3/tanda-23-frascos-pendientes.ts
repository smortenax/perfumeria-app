/**
 * Batch 23 (2026-10-27): the bottles of your lab that the app still lacks, into YOUR ACCOUNT, in the
 * shape of V3-67 and V3-79. The user, 2026-10-27: «un tema pendiente de la app era también darme de
 * alta todas las diluciones que había pendientes, las de harrisonjoseph no estaban». Batch 19 brought
 * bottles 1 to 40; this one brings 41 to 69 of `operaciones/diluciones.md` (16 of the Maese Lab and
 * Olfatorium orders and 13 of the Harrison Joseph one), and the factory bottles of Harrison Joseph
 * that you use as they come (`operaciones/compras/2026-10-16-altas-harrison-joseph.csv`).
 *
 * Each figure is read, not copied: a bottle's fraction is the lab's own «Concentración» expression
 * worked out exactly (its weights, as the lab wrote them), and its total the «Total» row. The
 * diluent of the heading takes the rest. What came with a factory dilution (its own solvent) is
 * f·(1−x)/x of the bottle, whichever bottles it went through: when that solvent is one material
 * of the app it is its own diluent; when it is a mix without its split («PG/etanol») or unknown,
 * it stays inside the heading's diluent and the report says so. Nothing is invented: what the lab
 * does not say is «no consta». Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --tanda=23-frascos-pendientes`.
 *
 *   node migracion-v3/tanda-23-frascos-pendientes.ts [path to the lab, default ../Perfumery]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const LAB = process.argv[2] ?? "../Perfumery";
const OUT = "migracion-v3/tandas/23-frascos-pendientes";
const FIRST = 41; // batch 19 ends at bottle 40
type Rec = Record<string, Cell>;

// ---------------------------------------------------------------- exact fractions

type Q = { n: bigint; d: bigint };
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const q = (n: bigint, d: bigint = 1n): Q => {
  if (d === 0n) throw new Error("división por cero");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
};
const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const div = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
const ONE = q(1n);
/** «0,0455» or «10,01» → exact. */
const dec = (text: string): Q => {
  const [w, f = ""] = text.replace(/\./g, "").split(",");
  return q(BigInt(w + f), 10n ** BigInt(f.length));
};
const SCALE = 1_000_000n;
/** Kept to six decimals, half up, as the app keeps a share (calc.ts, STORED_PLACES). */
const six = (x: Q) => (2n * x.n * SCALE + x.d) / (2n * x.d);
const decimal = (millionths: bigint) => (millionths / SCALE).toString() + "." + (millionths % SCALE).toString().padStart(6, "0");
const plain = (millionths: bigint) => decimal(millionths).replace(/\.?0+$/, "");
const pct = (x: Q) => {
  const hundredth = six(mul(x, q(100n)));
  return plain(hundredth).replace(".", ",") + " %";
};

/** The lab's «Concentración» expression, worked out exactly: numbers with a comma, ×, ÷, −, +, %, brackets. */
function evaluate(expr: string): Q {
  const tokens = expr.replace(/\s+/g, "").match(/\d+(?:,\d+)?|[()×÷−+%*/-]/g) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  const factor = (): Q => {
    const t = tokens[i++];
    let value: Q;
    if (t === "(") {
      value = sum();
      if (tokens[i++] !== ")") throw new Error(`falta «)» en ${expr}`);
    } else if (t !== undefined && /^\d/.test(t)) value = dec(t);
    else throw new Error(`no se lee «${t}» en ${expr}`);
    if (peek() === "%") {
      i++;
      value = div(value, q(100n));
    }
    return value;
  };
  const term = (): Q => {
    let value = factor();
    while (peek() === "×" || peek() === "÷" || peek() === "*" || peek() === "/") value = ["×", "*"].includes(tokens[i++]) ? mul(value, factor()) : div(value, factor());
    return value;
  };
  const sum = (): Q => {
    let value = term();
    while (peek() === "+" || peek() === "−" || peek() === "-") value = tokens[i++] === "+" ? add(value, term()) : sub(value, term());
    return value;
  };
  const result = sum();
  if (i !== tokens.length) throw new Error(`sobra algo en ${expr}`);
  return result;
}

// ---------------------------------------------------------------- the app's side

const common = parseCsvRecords(readFileSync("v3/datos/materials.csv", "utf8")) as Rec[];
const diluentNamed = (re: RegExp) => {
  const found = common.filter((m) => !m.owner_id && String(m.solvent) === "true" && re.test(String(m.name)));
  if (found.length !== 1) throw new Error(`${re}: ${found.length} diluyentes comunes`);
  return { id: String(found[0].id), name: String(found[0].name) };
};
const DILUENTS: Readonly<Record<string, { id: string; name: string }>> = {
  DPG: diluentNamed(/^DPG/),
  IPM: diluentNamed(/^IPM/),
  TEC: diluentNamed(/^TEC$/),
  "alcohol 96º": diluentNamed(/^Etanol$/),
};

/** Your versions (batches 8 and 17), by name. */
const yours = new Map<string, string>();
for (const f of ["migracion-v3/tandas/8-tu-version/materials.csv", "migracion-v3/tandas/17-tus-nuevos/materials.csv"]) {
  for (const m of parseCsvRecords(readFileSync(f, "utf8")) as Rec[]) {
    if (m.owner_id && !yours.has(String(m.name))) yours.set(String(m.name), String(m.id));
    if (!m.owner_id && String(m.based_on_id ?? "") !== "") yours.set(String(m.name), String(m.id));
  }
}
/** The lab's name of a material and yours in the app, where they differ (the lab writes in Spanish). */
const NAME: Readonly<Record<string, string>> = {
  "Ambrinol S (Symrise)": "Ambrinol S",
  Cade: "Aceite de cade (enebro)",
  "Acetato de isobutilo": "Isobutyl acetate",
  "1-Octen-3-ona": "1-Octen-3-one Stabilised",
  "Feniletil mercaptano": "Phenylethyl Mercaptan",
  "Feniletil mercaptano (2-feniletanotiol)": "Phenylethyl Mercaptan",
  Cypriol: "Cypriol / Nagarmotha EO",
  "4-Propilfenol": "4-Propylphenol",
};
const materialOf = (labName: string) => {
  const name = NAME[labName] ?? labName;
  const id = yours.get(name);
  if (!id) throw new Error(`«${labName}» (${name}) no es un material tuyo de las tandas 8 o 17`);
  return { id, name };
};

/** Batch 19's bottle of Ambrinol S at 10,01 % (the lab's nº 28), the source of nº 41. */
const batch8 = parseCsvRecords(readFileSync("migracion-v3/tandas/8-tu-version/lab_dilutions.csv", "utf8")) as Rec[];
const ambrinol28 = batch8.find((b) => b.material_id === materialOf("Ambrinol S (Symrise)").id && String(b.fraction) === "0.1001");
if (!ambrinol28) throw new Error("no está el frasco nº 28 (Ambrinol S al 10,01 %) en la tanda 8");

// ---------------------------------------------------------------- the lab's side

const labCommit = execFileSync("git", ["-C", LAB, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const FILE = "operaciones/diluciones.md";
const lines = readFileSync(join(LAB, FILE), "utf8").split("\n");

interface Section {
  readonly n: number;
  readonly line: number;
  readonly name: string;
  readonly solvent: string;
  readonly date: string;
  readonly body: readonly string[];
}
const sections: Section[] = [];
lines.forEach((l, i) => {
  const h = /^### (\d+) · (.+?)(?: \*\([^)]*\)\*)? · \*\*[^*]+\*\* · (.+?) · (\d{4}-\d{2}-\d{2})/.exec(l);
  if (!h || Number(h[1]) < FIRST) return;
  const end = lines.findIndex((x, j) => j > i && /^#{2,3} /.test(x));
  sections.push({ n: Number(h[1]), line: i + 1, name: h[2].trim(), solvent: h[3].trim(), date: h[4], body: lines.slice(i + 1, end < 0 ? undefined : end) });
});

const cellValue = (row: string) => /\*\*(\d+(?:,\d+)?) g\*\*/.exec(row)?.[1] ?? null;
/** A factory dilution in a row: «al 1 % en PG/etanol, de fábrica», «al 50 % de absoluto en IPM, de fábrica», «al 10 %, de fábrica». */
const factoryIn = (row: string) => {
  const f = /al (\d+(?:,\d+)?) %(?: de \w+)?(?: en ([^,|]+?))?, de fábrica/.exec(row);
  return f ? { x: div(dec(f[1]), q(100n)), solvent: f[2]?.trim() ?? null } : null;
};

interface Bottle {
  readonly n: number;
  readonly id: string;
  readonly material: { id: string; name: string };
  readonly fraction: Q;
  readonly totalUg: bigint | null;
  readonly materialUg: bigint | null;
  readonly diluents: { id: string; name: string; share: Q; massUg: bigint | null }[];
  readonly source: string | null;
  readonly sourceText: string | null;
  readonly made: string;
  readonly label: string;
  readonly cite: string;
  readonly notes: string[];
}

const ug = (grams: string) => (dec(grams).n * 1_000_000n) / dec(grams).d;
const labels = (x: Q) => {
  const p = Number(six(mul(x, q(100n)))) / 1e6;
  const nominal = [0.001, 0.01, 0.1, 1, 5, 10, 20, 25, 40, 50].find((v) => Math.abs(p - v) <= v * 0.05);
  return `al ${String(nominal ?? Number(p.toPrecision(3))).replace(".", ",")} %`;
};

const bottles = new Map<number, Bottle>();
/** Each bottle's factory dilution, its own or the one of the bottle it was made from. */
const factoryOf = new Map<number, { x: Q; solvent: string | null } | null>();

for (const s of sections) {
  const notes: string[] = [];
  // The table's rows, without its empty header and its rule.
  const rows = s.body.filter((l) => l.startsWith("|") && !/^\|\s*\|\s*\|\s*$/.test(l) && !/^\|-/.test(l));
  const concentration = rows.find((r) => /\*\*Concentración\*\*/.test(r));
  const totalRow = rows.find((r) => /\*\*Total\*\*/.test(r));
  if (!concentration || !totalRow) throw new Error(`nº ${s.n}: sin «Concentración» o «Total»`);
  const expr = /\*\*([^*]+?) = [^*]+\*\*\s*\|\s*$/.exec(concentration)?.[1];
  if (!expr) throw new Error(`nº ${s.n}: no se lee la concentración`);
  let fraction = evaluate(expr);
  // A correction written later in the entry («Corrección del … queda al **0,100 %**») is the lab's word for this bottle.
  const corrected = s.body.map((l) => /Corrección del (\d{4}-\d{2}-\d{2})[^]*?queda al \*\*(\d+(?:,\d+)?) %\*\*/.exec(l)).find(Boolean);
  if (corrected) {
    notes.push(`corregido por el laboratorio el ${corrected[1]}: de ${pct(fraction)} a ${corrected[2]} %`);
    fraction = div(dec(corrected[2]), q(100n));
  }
  const total = cellValue(totalRow);
  const material = materialOf(s.name);
  const main = DILUENTS[s.solvent];
  if (!main) throw new Error(`nº ${s.n}: diluyente «${s.solvent}» sin material en la app`);

  // Where the material came from: a factory dilution in this table, or another bottle of the lab.
  const from = /(?:nº|n\.º) (\d+)/.exec(rows[0] ?? "");
  const sourceN = from ? Number(from[1]) : null;
  const factory = rows.map(factoryIn).find(Boolean) ?? (sourceN !== null ? (factoryOf.get(sourceN) ?? null) : null);
  if (corrected && factory) {
    // The correction is the factory bottle's strength: the factory solvent's share follows from it.
  }
  const narcisseFactory = corrected ? { x: div(dec("1"), q(100n)), solvent: null } : null;
  factoryOf.set(s.n, factory ?? narcisseFactory);
  const carried = factory ?? narcisseFactory;

  const diluents: Bottle["diluents"] = [];
  let rest = sub(ONE, fraction);
  if (carried) {
    const share = div(mul(fraction, sub(ONE, carried.x)), carried.x);
    const own = carried.solvent ? DILUENTS[carried.solvent] : undefined;
    if (own && own.id !== main.id) {
      diluents.push({ ...own, share, massUg: null });
      rest = sub(rest, share);
    } else if (!own) {
      notes.push(`lleva ${pct(share)} del disolvente de fábrica (${carried.solvent ?? "no consta cuál"}), sin reparto: va dentro del ${main.name}`);
    }
  }
  if (rest.n <= 0n) throw new Error(`nº ${s.n}: los diluyentes no caben`);
  // A plain bottle, material and diluent weighed and nothing else, keeps what was weighed (V3-67).
  const plainWeighed = !carried && sourceN === null && rows.length === 4 && /^\s*\d+(?:,\d+)? ÷ \d+(?:,\d+)?\s*$/.test(expr);
  const materialUg = plainWeighed ? ug(cellValue(rows[0])!) : null;
  const diluentUg = plainWeighed ? ug(cellValue(rows[1])!) : null;
  diluents.unshift({ ...main, share: rest, massUg: diluentUg });
  if (/nominal/.test(s.body.join(" "))) notes.push("pesos nominales: el laboratorio no tiene aún los reales");
  if (/aproximado/.test(s.body.join(" ")) && sourceN !== null) notes.push("sacada antes de completar la fuerte: % aproximado, el laboratorio pide comprobarlo en tira");

  // The link to the bottle it came from is kept only when that one is already in the app (nº 28, batch 19): Supabase
  // checks it row by row within one insert and does not yet see a bottle of this same batch. The others say it in words.
  const sourceId = sourceN === 28 ? String(ambrinol28.id) : null;
  bottles.set(s.n, {
    n: s.n,
    id: uuidFor(`frasco-lab:${s.n}`),
    material,
    fraction,
    totalUg: total ? ug(total) : null,
    materialUg,
    diluents,
    source: sourceId,
    sourceText: sourceN !== null ? `nº ${sourceN}` : null,
    made: s.date,
    label: labels(fraction),
    cite: `${FILE}:${s.line}`,
    notes,
  });
}

// The factory bottles of Harrison Joseph you have (the lab works from them): «la fuerte es el de fábrica».
const ALTAS = "operaciones/compras/2026-10-16-altas-harrison-joseph.csv";
const altas = parseCsvRecords(readFileSync(join(LAB, ALTAS), "utf8")) as Rec[];
const factoryBottles: Bottle[] = [];
altas.forEach((a, i) => {
  const words = String(a.dilucion);
  const f = /^(\d+(?:,\d+)?) %(?: en ([^—]+?))? —/.exec(words);
  if (!f || f[1] === "100") return; // pure is not a bottle (V3-67)
  const material = materialOf(String(a.nombre));
  const x = div(dec(f[1]), q(100n));
  const solvent = f[2]?.trim() ?? null;
  const own = solvent ? DILUENTS[solvent] : undefined;
  factoryBottles.push({
    n: 0,
    id: uuidFor(`frasco-fabrica:${material.id}`),
    material,
    fraction: x,
    totalUg: null,
    materialUg: null,
    diluents: own ? [{ ...own, share: sub(ONE, x), massUg: null }] : [],
    source: null,
    sourceText: null,
    made: "2026-10-16",
    label: `de fábrica, al ${f[1]} %`,
    cite: `${ALTAS}:${i + 2}`,
    notes: own ? [] : [`disolvente «${solvent ?? "no consta"}»: sin reparto, queda escrito y sin diluyentes`],
  });
});
// Narcisse Oxyacetate: the lab corrected it on 2026-10-22 — the factory bottle is at 1 % (nº 67).
const narcisse = sections.find((s) => s.name === "Narcisse Oxyacetate");
if (narcisse) {
  const material = materialOf("Narcisse Oxyacetate");
  factoryBottles.push({
    n: 0,
    id: uuidFor(`frasco-fabrica:${material.id}`),
    material,
    fraction: div(ONE, q(100n)),
    totalUg: null,
    materialUg: null,
    diluents: [],
    source: null,
    sourceText: null,
    made: "2026-10-16",
    label: "de fábrica, al 1 %",
    cite: `${FILE}:${narcisse.line} (corrección del 2026-10-22)`,
    notes: ["disolvente de fábrica: no consta; queda sin diluyentes"],
  });
}

// ---------------------------------------------------------------- the tables

const all = [...factoryBottles, ...bottles.values()];
const outBottles: Rec[] = [];
const outDiluents: Rec[] = [];
for (const b of all) {
  // Every share to six decimals adding up to 1: what rounding moves goes to the largest diluent (as the app does).
  const fraction = six(b.fraction);
  const shares = b.diluents.map((d) => six(d.share));
  if (shares.length > 0) {
    const largest = shares.reduce((at, s, i) => (s > shares[at] ? i : at), 0);
    shares[largest] += SCALE - fraction - shares.reduce((s, x) => s + x, 0n);
  }
  outBottles.push({
    id: b.id,
    user_id: null,
    material_id: b.material.id,
    fraction: plain(fraction),
    solvent: b.diluents.length === 0 ? (b.notes[0]?.match(/«([^»]+)»/)?.[1] ?? null) : null,
    made_on: b.made,
    description: [`Laboratorio, ${b.cite} (commit ${labCommit})`, b.sourceText ? `desde el ${b.sourceText}` : null, b.totalUg ? `total ${plain((b.totalUg * SCALE) / 1_000_000n).replace(".", ",")} g` : null, ...b.notes]
      .filter(Boolean)
      .join(" · "),
    label: b.label,
    material_mass_ug: b.materialUg === null ? null : b.materialUg.toString(),
    source_dilution_id: b.source,
    archived_at: null,
  });
  b.diluents.forEach((d, position) =>
    outDiluents.push({
      id: uuidFor(`frasco:${b.id}:${d.id}`),
      dilution_id: b.id,
      user_id: null,
      diluent_id: d.id,
      mass_ug: d.massUg === null ? null : d.massUg.toString(),
      fraction: plain(shares[position]),
      position,
    }),
  );
}

mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], outBottles);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], outDiluents);

const row = (b: Bottle) =>
  `| ${b.n || "fábrica"} | ${b.material.name} | ${pct(b.fraction)} | ${b.diluents.map((d) => `${d.name} ${pct(d.share)}`).join(" + ") || "—"} | ${b.sourceText ?? (b.n ? "puro" : "—")} | ${b.materialUg !== null ? "sí" : "no"} | ${b.notes.join("; ") || ""} |`;
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 23: los frascos que faltaban, con los de Harrison Joseph

*Generada por \`migracion-v3/tanda-23-frascos-pendientes.ts\` (2026-10-27) desde el laboratorio, commit \`${labCommit}\`. El usuario, 2026-10-27: «darme de alta todas las diluciones que había pendientes, las de harrisonjoseph no estaban». Va a tu cuenta, no a lo común.*

- **${bottles.size} frascos del laboratorio** (nº ${FIRST} a ${Math.max(...bottles.keys())} de \`${FILE}\`): los de la tanda 19 acababan en el nº 40.
- **${factoryBottles.length} frascos de fábrica** de Harrison Joseph que usas tal cual (\`${ALTAS}\`); los que vienen puros no son un frasco (V3-67).
- **${outDiluents.length} filas de diluyentes.** La cifra de cada frasco es la expresión «Concentración» del laboratorio, calculada exacta; el diluyente de la cabecera se lleva el resto. Lo que vino con una dilución de fábrica (su disolvente) es f·(1−x)/x del frasco: si es un material de la app, va aparte (el TEC de la Thialdine); si es una mezcla sin reparto o no consta, va dentro del diluyente principal y se dice.
- **Lo pesado** se guarda solo donde el frasco es material y diluyente sin más (la app calcula lo mismo); en el resto, la cifra del laboratorio.

| Nº | Material | Fracción | Diluyentes | Desde | Pesos | Nota |
|---|---|---|---|---|---|---|
${factoryBottles.map(row).join("\n")}
${[...bottles.values()].map(row).join("\n")}

**Para revisar antes de aprobar:**

- Los de fábrica con disolvente mixto o sin dato (Vinyl Sulfurol en DPG/IPM, 1-Octen-3-ona en PG/etanol, Cumin Nitrile, Narcisse Oxyacetate) quedan con su disolvente escrito y sin diluyentes: el banco los ofrece, pero no pueden ser origen de un frasco nuevo en la app hasta que se sepa su reparto.
- El nº 67 (Narcisse Oxyacetate) entra al 0,1 %, por la corrección del laboratorio del 2026-10-22, no al 10 % de su cabecera.
- **De qué frasco sale** cada uno queda en su descripción («desde el nº 50»). El enlace en la app solo se guarda para el nº 41, que sale del nº 28, ya cargado; en los demás, el origen es de esta misma tanda y Supabase no lo ve hasta cargarla. Su composición ya cuenta lo que trajo el origen.
- No entran los pendientes de hacer (Rose Crystals, linolenato, decanoato) ni el absoluto de cistus al 50 % en TEC, que no tiene entrada en el laboratorio.
`,
  "utf8",
);
console.log(`Tanda 23: ${bottles.size} frascos del laboratorio, ${factoryBottles.length} de fábrica, ${outDiluents.length} diluyentes. ${OUT}/informe.md`);
