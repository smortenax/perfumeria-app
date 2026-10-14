import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkIfra as checkIfraV2, type IfraReport as ReportV2 } from "../../src/core/ifra";
import { formulaFromJson } from "../../src/core/io/formula-json";
import { repositoryFor } from "../../src/data/repositories";
import { v2Dataset } from "../../src/v2/data";
import { migrateFormula } from "../../src/v2/migrate";
import { checkIfra, type IfraReport } from "../../v3/src/core/ifra";
import { loadFormula } from "../../v3/src/db/formulas";
import { toIfra } from "../../v3/src/db/to-ifra";
import { uuidFor } from "../lib/ids.ts";
import { loadV3 } from "../fase-5/cargar";
import { canonicalKey, type Side } from "../fase-5/comparar";
import { REASONS } from "../fase-5/explicar";
import { type Copy, csv, ME, openCopy, ROOT } from "./copia";

/**
 * Plan v3, step 7.6 (V3-34 to V3-49): the IFRA report of each formula of your library with the v3's
 * data (the formula as batch 10 imported it, read by `loadFormula`, against `toIfra` of the v3)
 * and with the v2's (the file migrated as the v2 opens it, against its repository), line by line:
 * each standard's verdict and reading 2, and the manufacturers' ceilings. Every difference is
 * explained by what changed in the materials the formula uses (phase 5's reasons, by the lab
 * material each one is), by your answers of V3-48, or by a material without IFRA data; or it is
 * listed «sin explicar». It writes `informe-ifra.md`. It never fixes a difference.
 *
 *   npx vitest run --config migracion-v3/fase-7/vitest.config.ts
 */

const FOLDER = import.meta.dirname;
const LIBRARY = join(ROOT, "migracion-v3/biblioteca/archivos");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const pct = (r: { toString(): string }) => {
  const [n, d] = r.toString().split("/");
  const v = (Number(n) / Number(d ?? "1")) * 100;
  return `${v.toFixed(v < 0.01 ? 6 : 4).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",")} %`;
};

let copy: Copy;
beforeAll(async () => {
  copy = await openCopy();
}, 180_000);
afterAll(async () => {
  await copy?.close();
});

interface Line {
  readonly verdict: string;
  readonly maxUse: string;
  /** The lab materials that bring it (by their lab id), and the keys of the formula's own materials. */
  readonly labs: Set<string>;
  readonly keys: Set<string>;
}
type Lines = Map<string, Line>;

describe("your library's IFRA, v3 against v2 (7.6)", () => {
  it("writes the report, line by line, every difference with its reason", async () => {
    const data = v2Dataset();
    const repo = repositoryFor("v2");
    const v2Ifra = repo.ifraData();
    const { layer } = await loadV3();
    const v3Ifra = toIfra(copy.catalog, layer);

    // Who each material is, as a lab material: from the v3's id, and from the v2's key.
    const answers = csv("migracion-v3/respuestas/laboratorio.csv");
    const labOfV3 = new Map<string, string>();
    for (const r of answers) for (const p of ["comun", "tuya"]) labOfV3.set(uuidFor(`${p}:${r.id}`), r.id);
    const labOfV2 = new Map<string, string>();
    for (const r of answers) {
      const answer = r.respuesta.trim();
      if (!answer.startsWith("versión de ")) continue;
      const target = answer.slice("versión de ".length);
      labOfV2.set(`v2:${target}`, r.id);
      const product = data.products.find((p) => p.id === target);
      if (product) labOfV2.set(`v2:${product.materialId}`, r.id);
    }
    const nameOfLab = new Map(csv("v3/datos/materials.csv").map((m) => [labOfV3.get(m.id) ?? m.id, m.name]));
    const side = (lab: (id: string) => string | undefined, name: (id: string) => string): Side =>
      ({ rootId: "", nameOfMember: (id: string) => nameOfLab.get(lab(id) ?? "") ?? name(id), layer }) as unknown as Side;
    const v3Side = side((id) => labOfV3.get(id), (id) => copy.catalog.materials.get(id)?.name ?? id);
    const v2Side = side((id) => labOfV2.get(id) ?? labOfV2.get(`v2:${id}`), (id) => id);

    // Phase 5's reasons, by lab material and line (your version, as your formulas use it).
    const phase5 = new Map<string, string[]>();
    for (const r of csv("migracion-v3/fase-5/diferencias.csv")) {
      if (r.version !== "tuya") continue;
      const key = `${r.material} ${r.que}`;
      phase5.set(key, [...new Set([...(phase5.get(key) ?? []), r.motivo])]);
    }
    const remapped = new Map(csv("migracion-v3/respuestas/materiales-formulas.csv").map((r) => [r.id, r.respuesta]));
    const keysOf = csv("migracion-v3/tandas/10-formulas/claves.csv");
    const keyOfV3 = new Map<string, string[]>();
    for (const k of keysOf) keyOfV3.set(k.material_id, [...(keyOfV3.get(k.material_id) ?? []), k.id]);

    const linesOf = (report: IfraReport | ReportV2, s: Side, labOf: (key: string) => string | undefined, keysFor: (key: string) => string[]): Lines => {
      const out: Lines = new Map();
      const add = (checks: typeof report.checks, prefix: string) => {
        for (const c of checks) {
          const name = canonicalKey(c.substance.key, s, c.substance as never);
          const labs = new Set(c.sources.map((x) => labOf(x.material.key)).filter((x): x is string => !!x));
          const keys = new Set(c.sources.flatMap((x) => keysFor(x.material.key)));
          out.set(`${prefix}${name}`, { verdict: c.verdict, maxUse: c.maxUse.toString(), labs, keys });
        }
      };
      add(report.checks, "");
      add(report.supplierChecks, "fabricante ");
      return out;
    };

    interface Row {
      readonly file: string;
      readonly name: string;
      readonly summary: string;
      /** The formula's own readings, v2 and v3: reading 1, reading 2 and whether it is partial. */
      readonly readings: { readonly v2: readonly [string, string, boolean]; readonly v3: readonly [string, string, boolean] };
      readonly lines: Array<{ readonly what: string; readonly v2: string; readonly v3: string; readonly reasons: string[] }>;
    }
    const rows: Row[] = [];
    const files = walk(LIBRARY);
    expect(files).toHaveLength(30);
    for (const path of files.sort()) {
      const file = path.slice(LIBRARY.length + 1).split("\\").join("/");
      const text = readFileSync(path, "utf8");
      const migration = migrateFormula(formulaFromJson(text), data);
      const formula2 = migration.formula;
      // The v2 migrates a key of the file to its own: the file's is the one your answers (V3-48) speak of.
      const fileKeysOf = new Map<string, string[]>();
      for (const n of migration.notes) if (n.kind === "migrated") fileKeysOf.set(n.to, [...(fileKeysOf.get(n.to) ?? []), n.from]);
      const report2 = checkIfraV2(formula2, v2Ifra);
      const report3 = checkIfra(await loadFormula(copy.db, copy.catalog, ME, uuidFor(`formula:${file}`)), v3Ifra);
      const lines2 = linesOf(report2, v2Side, (k) => labOfV2.get(k), (k) => [k, ...(fileKeysOf.get(k) ?? [])]);
      const lines3 = linesOf(report3, v3Side, (k) => labOfV3.get(k), (k) => keyOfV3.get(k) ?? []);
      // The materials of this formula the v3 has without IFRA data (your new provisionals, V3-48).
      const unchecked3 = new Set(report3.unchecked);
      const differences: Row["lines"] = [];
      for (const what of [...new Set([...lines2.keys(), ...lines3.keys()])].sort()) {
        const [a, b] = [lines2.get(what), lines3.get(what)];
        const say = (l: Line | undefined) => (l ? `${l.verdict}, uso máx. ${pct({ toString: () => l.maxUse })}` : "—");
        if (a && b && a.verdict === b.verdict && a.maxUse === b.maxUse) continue;
        const labs = new Set([...(a?.labs ?? []), ...(b?.labs ?? [])]);
        const line = what.replace(/^fabricante /, "");
        const reasons = new Set<string>();
        for (const lab of labs) for (const reason of phase5.get(`${lab} ${line}`) ?? []) reasons.add(reason);
        // A key of the file you answered (V3-48) brings it on one side.
        for (const key of [...(a?.keys ?? []), ...(b?.keys ?? [])]) if (remapped.has(key)) reasons.add("V3-48");
        if (unchecked3.size && b?.verdict !== a?.verdict && (b?.verdict === "unknown" || !b)) reasons.add("sin-datos");
        differences.push({ what, v2: say(a), v3: say(b), reasons: reasons.size ? [...reasons].sort() : ["sin-explicar"] });
      }
      const sum = (r: IfraReport | ReportV2) => `${r.asIs}, uso máx. ${pct(r.maxUse)}${r.partial ? ", parcial" : ""}`;
      rows.push({
        file,
        name: formulaFromJson(text).header.name.trim() || file,
        summary: `${sum(report2)} → ${sum(report3)}`,
        readings: { v2: [report2.asIs, report2.maxUse.toString(), report2.partial], v3: [report3.asIs, report3.maxUse.toString(), report3.partial] },
        lines: differences,
      });
    }

    // ---------------------------------------------------------------- the report
    const unexplained = rows.flatMap((r) => r.lines.filter((l) => l.reasons.includes("sin-explicar")).map((l) => ({ r, l })));
    const reasonLabel = (k: string) =>
      k === "V3-48" ? "V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo" : k === "sin-datos" ? "V3-48: un provisional nuevo, sin datos de IFRA" : (REASONS[k]?.short ?? k);
    const count = new Map<string, number>();
    for (const r of rows) for (const l of r.lines) for (const k of l.reasons) count.set(k, (count.get(k) ?? 0) + 1);
    const same = rows.filter((r) => r.lines.length === 0);
    const cell = (t: string) => t.replace(/\|/g, "\\|");
    const report = `# Fase 7.6 · El IFRA de tu biblioteca, v3 frente a v2

*Generado por \`migracion-v3/fase-7/ifra-biblioteca.test.ts\`. Cada fórmula, con los datos de la v3 (la tanda 10, leída por \`loadFormula\`, contra \`toIfra\` de la v3) y con los de la v2 (el archivo migrado como lo abre la v2, contra su repositorio). Se compara cada estándar: su veredicto en la base del informe y la lectura 2 (uso máximo), y los techos del fabricante. Ninguna diferencia se arregla aquí.*

## Resultado

- **${rows.length} fórmulas:** ${same.length} dan lo mismo línea a línea; ${rows.length - same.length} tienen diferencias.
- **${rows.reduce((n, r) => n + r.lines.length, 0)} líneas distintas**, **${unexplained.length} sin explicar**.

| Motivo | Líneas |
|---|---|
${[...count].sort(([, a], [, b]) => b - a).map(([k, n]) => `| ${reasonLabel(k)} | ${n} |`).join("\n")}

${unexplained.length ? `## Sin explicar\n\n| Fórmula | Línea | v2 | v3 |\n|---|---|---|---|\n${unexplained.map(({ r, l }) => `| ${cell(r.name)} | ${cell(l.what)} | ${l.v2} | ${l.v3} |`).join("\n")}\n` : "Ninguna diferencia queda sin explicar.\n"}
## Lo que cambia en la lectura de cada fórmula

Lo primero que mirar: si una fórmula sale **menos prudente** que en la v2 (de «no» o «unknown» a «yes», o un uso máximo mayor). Un uso máximo «parcial» vale solo para lo que se sabe: algún material no tiene datos de IFRA (un provisional nuevo, V3-48) o la v3 ya no usa las cifras de otro proveedor (V3-34, V3-39), y la app nunca lo da por «dentro» (§1.2).

| Fórmula | v2 | v3 | Dirección |
|---|---|---|---|
${rows
  .filter((r) => r.readings.v2.join() !== r.readings.v3.join())
  .map((r) => {
    const rank: Record<string, number> = { no: 0, unknown: 1, yes: 2 };
    const [a, b] = [r.readings.v2, r.readings.v3];
    const more = (x: string, y: string) => { const [n1, d1 = "1"] = x.split("/"); const [n2, d2 = "1"] = y.split("/"); return BigInt(n1) * BigInt(d2) > BigInt(n2) * BigInt(d1); };
    const direction = rank[b[0]] > rank[a[0]] ? "**menos prudente** (lectura 1)" : rank[b[0]] < rank[a[0]] ? "más prudente (lectura 1)" : more(b[1], a[1]) ? (b[2] ? "uso máximo mayor, parcial" : "**menos prudente** (uso máximo mayor)") : more(a[1], b[1]) ? "más prudente (uso máximo menor)" : "cambia si es parcial";
    const say = (x: readonly [string, string, boolean]) => `${x[0]}, ${pct({ toString: () => x[1] })}${x[2] ? ", parcial" : ""}`;
    return `| ${cell(r.name)} | ${say(a)} | ${say(b)} | ${direction} |`;
  })
  .join("\n")}

## Fórmula a fórmula

Las lecturas: \`yes\`/\`no\`/\`unknown\` es la lectura 1 (se puede usar tal cual); el uso máximo es la lectura 2.

${rows.map((r) => `### ${r.name} (\`${r.file}\`)\n\n${r.summary}\n\n${r.lines.length ? `| Línea | v2 | v3 | Motivo |\n|---|---|---|---|\n${r.lines.map((l) => `| ${cell(l.what)} | ${l.v2} | ${l.v3} | ${l.reasons.map(reasonLabel).join("; ")} |`).join("\n")}` : "Línea a línea, igual."}`).join("\n\n")}
`;
    writeFileSync(join(FOLDER, "informe-ifra.md"), report, "utf8");
    expect(rows).toHaveLength(30);
  });
});
