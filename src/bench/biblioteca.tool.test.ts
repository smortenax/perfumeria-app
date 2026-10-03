import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatPercent } from "../core/display";
import type { Material } from "../core/model/material";
import { checkIfra, type IfraData, type IfraReport } from "../core/ifra";
import { formulaFromJson } from "../core/io/formula-json";
import { mergedRepository } from "../data/merged";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "../v2/data";
import { migrateFormula, type MigrationNote } from "../v2/migrate";
import { readingIn } from "./ifra-panel";

/**
 * A tool, not a unit test: it runs with the user's library of formulas (`BIBLIOTECA_DIR=…\Fórmulas`) and says, for each one, which
 * verdicts change when it is opened with the v2 (migrated, with the v1 «sin revisar» for what the v2 does not have) and why. With
 * `BIBLIOTECA_ESCRIBIR=1` it writes `docs/v2/comparacion-fase5.md`. It also checks that no material migrates to another one:
 * its CAS is the same or the user confirmed the link (D13).
 */
const dir = process.env.BIBLIOTECA_DIR;

/** The rows of the v1 that were of another form than the product that the formula uses (docs/v2/errores-v1.md): where the v1 erred most. */
const OTHER_FORM = new Map<string, string>([
  ["fig:1287", "cade"],
  ["fig:2913", "estírax"],
  ["fig:2839", "salvia"],
  ["fig:1529", "cilantro"],
  ["fig:1533", "cilantro"],
  ["fig:2143", "láudano"],
  ["fig:2150", "láudano"],
]);

interface Summary {
  readonly asIs: string;
  readonly maxUse: string;
  readonly partial: boolean;
  readonly pending: number;
  readonly unchecked: number;
  readonly exceeds: string[];
  readonly groups: string[];
}

const summary = (report: IfraReport): Summary => {
  const reading = readingIn(report);
  return {
    asIs: reading.asIs === "yes" ? "sí" : reading.asIs === "no" ? "no" : "sin comprobar",
    maxUse: `${formatPercent(report.maxUse, 2)}${report.partial ? " (según lo conocido)" : ""}`,
    partial: report.partial,
    pending: report.pending.length,
    unchecked: report.unchecked.length,
    exceeds: report.checks.filter((_c, i) => reading.checks[i]?.verdict === "exceeds").map((c) => c.substance.name),
    groups: reading.combined.filter((c) => c.verdict === "exceeds").map((c) => c.group),
  };
};

const sameSummary = (a: Summary, b: Summary) =>
  a.asIs === b.asIs && a.maxUse === b.maxUse && a.partial === b.partial && a.pending === b.pending && a.unchecked === b.unchecked && a.exceeds.join("|") === b.exceeds.join("|");

/** What a migrated material changes in its IFRA data: its substances, what it leaves pending, its conditions. */
function materialDiff(note: Extract<MigrationNote, { kind: "migrated" }>, before: IfraData, after: IfraData): string[] {
  const a = before.materials.get(note.from);
  const b = after.materials.get(note.to);
  const out: string[] = [];
  if (!a || !b) {
    return out;
  }
  const names = (data: IfraData, m: typeof a) => new Set(m.substances.map((s) => data.substances.get(s.key)?.name ?? s.key));
  const was = names(before, a);
  const now = names(after, b);
  const lost = [...was].filter((x) => !now.has(x));
  const gained = [...now].filter((x) => !was.has(x));
  if (lost.length > 0) out.push(`ya no lleva: ${lost.join(", ")}`);
  if (gained.length > 0) out.push(`ahora lleva: ${gained.join(", ")}`);
  const pa = new Set(a.pending ?? []);
  const pb = new Set(b.pending ?? []);
  const pendingNow = [...pb].filter((x) => !pa.has(x));
  const pendingGone = [...pa].filter((x) => !pb.has(x));
  if (pendingGone.length > 0) out.push(`antes pendiente, ya no: ${pendingGone.join(" / ")}`);
  if (pendingNow.length > 0) out.push(`ahora pendiente: ${pendingNow.join(" / ")}`);
  const ca = new Set(a.conditions);
  const cb = new Set(b.conditions);
  const condNow = [...cb].filter((x) => !ca.has(x));
  if (condNow.length > 0) out.push(`condiciones nuevas: ${condNow.join(" / ")}`);
  return out;
}

describe.skipIf(!dir)("la biblioteca de fórmulas, con la v1 y con la v2", () => {
  const data = v2Dataset();
  const v1 = repositoryFor("v1");
  const merged = mergedRepository(v1, repositoryFor("v2"), data);
  const files = readdirSync(dir ?? ".").filter((f: string) => f.endsWith(".json")).sort();

  const rows = files.map((file) => {
    const formula = formulaFromJson(readFileSync(join(dir ?? ".", file), "utf-8"));
    const before = checkIfra(formula, v1.ifraData());
    const migration = migrateFormula(formula, data);
    const after = checkIfra(migration.formula, merged.ifraData());
    return { file, name: formula.header.name.trim() || file, formula, before, after, migration };
  });

  it("no material migrates to another one: its CAS is the same or the user confirmed the link", () => {
    for (const row of rows) {
      const bySource = new Map<string, { cas?: string; kind: string }>();
      // The lines and, inside a formula used as a material, its components.
      const collect = (m: Material): void => {
        bySource.set(m.key, { ...(m.cas ? { cas: m.cas } : {}), kind: m.kind });
        for (const c of m.vector?.components ?? []) collect(c.material);
      };
      for (const c of row.formula.history) {
        if (c.kind === "add") collect(c.material);
      }
      for (const note of row.migration.notes) {
        if (note.kind !== "migrated") continue;
        const source = bySource.get(note.from);
        const product = data.products.find((p) => `v2:${p.id}` === note.to);
        const material = data.materials.find((m) => m.id === (product ? product.materialId : note.to.slice(3)));
        const same = (source?.cas ?? "") === (material?.cas ?? "") && source?.kind !== "provisional";
        expect(same || note.confirmedOn !== undefined, `${row.file}: ${note.from} → ${note.to} (${source?.cas ?? "sin CAS"} → ${material?.cas ?? "sin CAS"})`).toBe(true);
      }
    }
  });

  it("writes which verdicts change and why", () => {
    const changed = rows.filter((r) => !sameSummary(summary(r.before), summary(r.after)));
    const priority = (r: (typeof rows)[number]) => r.migration.notes.some((n) => n.kind === "migrated" && OTHER_FORM.has(n.from));
    const ordered = [...rows].sort((a, b) => {
      const rank = (r: (typeof rows)[number]) => (changed.includes(r) ? (priority(r) ? 0 : 1) : 2);
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
    const lines: string[] = [];
    lines.push("# La biblioteca de fórmulas, con la v1 y con la v2 (Fase 5)", "");
    lines.push(
      `Generado con \`BIBLIOTECA_DIR=… BIBLIOTECA_ESCRIBIR=1 npx vitest run src/bench/biblioteca.tool.test.ts\`: ${rows.length} fórmulas de la biblioteca del usuario, cada una comprobada con la v1 (como hasta ahora) y con la v2 (migrada al abrirla, D13; lo que la v2 no tiene se queda como «v1, sin revisar»). Cambian de veredicto **${changed.length}**.`,
      "",
    );
    lines.push("Primero las que cambian por un material cuya fila de la v1 era de otra forma (cade, estírax, salvia, cilantro, láudano): ahí es donde la v1 se equivocaba más.", "");
    for (const r of ordered) {
      const a = summary(r.before);
      const b = summary(r.after);
      const flag = changed.includes(r) ? (priority(r) ? "CAMBIA, por una fila de otra forma" : "CAMBIA") : "igual";
      lines.push(`## ${r.name} · ${flag}`, "");
      lines.push(`- **Hasta ahora (v1):** ¿pasa? ${a.asIs}; hasta ${a.maxUse}; ${a.pending} pendientes, ${a.unchecked} sin comprobar${a.exceeds.length ? `; se pasa: ${a.exceeds.join(", ")}` : ""}.`);
      lines.push(`- **Con la v2:** ¿pasa? ${b.asIs}; hasta ${b.maxUse}; ${b.pending} pendientes, ${b.unchecked} sin comprobar${b.exceeds.length ? `; se pasa: ${b.exceeds.join(", ")}` : ""}${b.groups.length ? `; el grupo ${b.groups.join(", ")} pasa de 1` : ""}.`);
      const migrated = r.migration.notes.filter((n): n is Extract<MigrationNote, { kind: "migrated" }> => n.kind === "migrated");
      const moved = migrated.length;
      const warnings = r.migration.notes.filter((n) => n.kind === "cas" || n.kind === "ambiguous");
      const v1Only = r.migration.notes.filter((n) => n.kind === "v1-only").length;
      lines.push(`- Migración: ${moved} materiales a la v2, ${v1Only} se quedan en la v1 «sin revisar», ${warnings.length} avisos.`);
      for (const w of warnings) {
        lines.push(w.kind === "cas" ? `  - Aviso: ${w.name} (${w.from}) tiene CAS ${w.formulaCas || "ninguno"} y el material de la v2, ${w.v2Cas || "ninguno"}: no migra, sin confirmación.` : `  - Aviso: ${w.name} (${w.from}) tiene más de un producto (${(w as { products: readonly string[] }).products.join(", ")}): no migra, hay que elegir.`);
      }
      if (changed.includes(r)) {
        for (const n of migrated) {
          const diff = materialDiff(n, v1.ifraData(), merged.ifraData());
          if (diff.length > 0) {
            lines.push(`  - ${n.name} (${n.from} → ${n.to}${OTHER_FORM.has(n.from) ? `, fila de otra forma: ${OTHER_FORM.get(n.from)}` : ""}): ${diff.join("; ")}.`);
          }
        }
      }
      lines.push("");
    }
    if (process.env.BIBLIOTECA_ESCRIBIR) {
      writeFileSync("docs/v2/comparacion-fase5.md", lines.join("\n"), "utf-8");
    }
    // The tool only has to run; what it found is in the report.
    expect(rows.length).toBe(files.length);
  });
});
