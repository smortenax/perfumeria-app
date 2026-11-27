import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { getTableColumns, getTableName } from "drizzle-orm";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { checkIfra, type IfraReport } from "../src/core/ifra";
import { DILUENTS } from "../src/core/model/material";
import { parseCsvRecords } from "../src/lib/csv";
import { engineMaterial } from "../src/db/formulas";
import { loadIfraLayer } from "../src/db/ifra-layer";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog, type LocalDb } from "../src/db/materials";
import { ifraCard, toIfra } from "../src/db/to-ifra";

/**
 * The IFRA audit of every material (2026-11-27). The user: «probar que todos los materiales tengan ifra
 * en orden … que no haya el bug de la bergamota con 2000% por encima de ifra con una gota». Off by
 * default; it runs only when asked:
 *
 *   AUDITORIA=<carpeta de salida> [AUDITORIA_TANDAS=<carpeta de tandas>] [AUDITORIA_EXTRA=54-bergamota] npx vitest run scripts/auditoria-ifra.test.ts
 *
 * It loads datos/ (the common data) into a copy with no network, and, with AUDITORIA_TANDAS, the
 * approved batches of the user's account (the ones that are not in datos/tandas.csv) as the account's,
 * in their order; AUDITORIA_EXTRA adds common batches not approved yet, to see what they change. For each
 * material it pours one drop, 30 mg, in a 2 g bottle with alcohol (V3-103), and writes what the IFRA
 * panel would say: auditoria.json, and auditoria.csv with one row per material and standard.
 */

const OUT = process.env.AUDITORIA;
const BATCHES = process.env.AUDITORIA_TANDAS;
const EXTRA = (process.env.AUDITORIA_EXTRA ?? "").split(",").filter(Boolean);
const ME = "11111111-1111-4111-8111-111111111111";
const DATOS = join(__dirname, "../datos");
const TABLES = ["material_categories", "materials", "material_components", "regulations", "lab_materials", "ifra_standards", "ifra_limits", "ifra_substances", "ifra_annex", "ifra_variant_rules", "ifra_spec_exclusions"];

/** «1.715e-7» as Postgres would send it: a plain decimal (the cloud never sends an exponent). */
function plainDecimal(text: string): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?e-(\d+)$/i.exec(text);
  if (!m) return text;
  const digits = m[2] + (m[3] ?? "");
  return `${m[1]}0.${"0".repeat(Number(m[4]) - m[2].length)}${digits}`;
}

/**
 * The approved batches of the account, in their order: in aprobadas.csv, not in datos/tandas.csv, and the
 * user's («tu-», «tus-» in the name, or with lab_materials.csv: the old common ones 1-4 have neither).
 */
function accountBatches(folder: string): string[] {
  const common = new Set(parseCsvRecords(readFileSync(join(DATOS, "tandas.csv"), "utf8")).map((r) => r.tanda));
  const approved = new Set(parseCsvRecords(readFileSync(join(folder, "aprobadas.csv"), "utf8")).map((r) => r.tanda));
  return readdirSync(folder)
    .filter((b) => approved.has(b) && !common.has(b) && (/(^|-)tus?-/.test(b) || existsSync(join(folder, b, "lab_materials.csv"))))
    .sort((a, b) => parseInt(a) - parseInt(b));
}

const pct = (r: Ratio) => r.mul(Ratio.of(100n)).toFixed(6);

it.skipIf(!OUT)("audit of IFRA, one drop of every material", async () => {
  const folder = mkdtempSync(join(tmpdir(), "auditoria-ifra-"));
  const copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "a.sqlite", dbLocation: folder } });
  const db = wrapPowerSyncWithDrizzle(copy, { schema: tables }) as unknown as LocalDb;
  const columns = new Map<string, Map<string, string>>();
  for (const t of Object.values(tables)) {
    const c = getTableColumns(t as never) as Record<string, { name: string; columnType: string }>;
    columns.set(getTableName(t as never), new Map(Object.values(c).map((x) => [x.name, x.columnType])));
  }
  const load = async (file: string, table: string, mine: boolean) => {
    const known = columns.get(table);
    if (!known || !existsSync(file)) return;
    for (const r of parseCsvRecords(readFileSync(file, "utf8"))) {
      const keys = Object.keys(r).filter((k) => known.has(k));
      const values = keys.map((k) => {
        let v: string | null = r[k] === "" ? null : plainDecimal(r[k]);
        if ((k === "owner_id" || k === "user_id") && mine) v = ME;
        if (v === "true") return 1;
        if (v === "false") return 0;
        return known.get(k) === "SQLiteInteger" && v !== null ? Number(v) : v;
      });
      await copy.execute(`insert or replace into ${table} (${keys.join(",")}) values (${keys.map(() => "?").join(",")})`, values);
    }
  };
  for (const t of TABLES) await load(join(DATOS, `${t}.csv`), t, false);
  const account = BATCHES ? accountBatches(BATCHES) : [];
  if (BATCHES) for (const b of EXTRA) for (const t of TABLES) await load(join(BATCHES, b, `${t}.csv`), t, false);
  for (const b of account) {
    for (const t of TABLES) await load(join(BATCHES!, b, `${t}.csv`), t, true);
    // Its cambiar.csv (table, id, column, before, after), as cargar-laboratorio.ts: only where the cell still says `before`.
    const changes = join(BATCHES!, b, "cambiar.csv");
    if (!existsSync(changes)) continue;
    for (const c of parseCsvRecords(readFileSync(changes, "utf8"))) {
      if (!columns.get(c.table)?.has(c.column)) continue;
      const where = c.id ? "id = ?" : "owner_id = ?";
      await copy.execute(`update ${c.table} set ${c.column} = ? where ${where} and ${c.column} = ?`, [c.after, c.id || ME, c.before]);
    }
  }

  const catalog = await loadCatalog(db, ME);
  const layer = await loadIfraLayer(db);
  const ifra = toIfra(catalog, layer);
  const out: unknown[] = [];
  const rows: string[][] = [["material", "whose", "have", "based_on", "kind", "card", "standard", "ceiling_pct", "known_pct", "worst_pct", "times_ceiling", "verdict", "as_is", "pending"]];
  for (const m of catalog.materials.values()) {
    if (m.kind === "frozen" || m.solvent) continue;
    const report: IfraReport = checkIfra(
      {
        header: { name: "drop", intention: "", container: null, workBatchUg: null, finalBatchUg: null },
        history: [
          { kind: "add", id: "1", material: DILUENTS.alcohol, massUg: 1_970_000n, fraction: Ratio.ONE, diluent: null },
          { kind: "add", id: "2", material: engineMaterial(m), massUg: 30_000n, fraction: Ratio.ONE, diluent: null },
        ],
      },
      ifra,
    );
    const info = ifra.materials.get(m.id);
    const card = ifraCard(catalog, layer, m.id).state;
    const base = m.basedOnId ? (catalog.materials.get(m.basedOnId)?.name ?? "") : "";
    const pending = [...(info?.pending ?? []), ...report.unchecked.map(() => "unchecked")].join(" | ");
    const head = [m.name, m.ownerId ? "mine" : "common", catalog.have.has(m.id) ? "yes" : "", base, m.kind, card];
    const checks = report.checks.map((c) => ({
      standard: c.substance.name,
      key: c.substance.key,
      source: c.substance.amendment,
      ceiling: pct(c.substance.limit),
      known: pct(c.knownUg.div(report.finalUg)),
      worst: pct(c.worstUg.div(report.finalUg)),
      times: c.substance.limit.isZero() ? "prohibited" : c.worstUg.div(report.finalUg).div(c.substance.limit).toFixed(4),
      verdict: c.verdict,
    }));
    for (const c of checks) rows.push([...head, `${c.source}`, c.ceiling, c.known, c.worst, c.times, c.verdict, report.asIs, pending]);
    for (const g of report.combinedChecks) rows.push([...head, `group ${g.group}`, "100 (sum of shares)", pct(g.knownShare), pct(g.worstShare), g.worstShare.toFixed(4), g.verdict, report.asIs, pending]);
    if (checks.length === 0) rows.push([...head, "", "", "", "", "", "", report.asIs, pending]);
    out.push({ id: m.id, name: m.name, whose: m.ownerId ? "mine" : "common", have: catalog.have.has(m.id), basedOn: base, kind: m.kind, card, asIs: report.asIs, pending, conditions: info?.conditions ?? [], checks, combined: report.combinedChecks.map((g) => ({ group: g.group, worst: g.worstShare.toFixed(6), verdict: g.verdict })) });
  }
  mkdirSync(OUT!, { recursive: true });
  writeFileSync(join(OUT!, "auditoria.json"), JSON.stringify({ batches: account, extra: EXTRA, materials: out }, null, 1));
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  writeFileSync(join(OUT!, "auditoria.csv"), rows.map((r) => r.map(cell).join(",")).join("\n") + "\n");
  await copy.close();
  rmSync(folder, { recursive: true, force: true });
}, 600_000);
