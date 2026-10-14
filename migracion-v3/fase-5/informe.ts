import type { Analysis } from "./analizar.ts";
import { VERSIONS, type Version } from "./analizar.ts";
import type { Canon } from "./comparar.ts";
import { cmp, type Explained, REASON_ORDER, REASONS } from "./explicar.ts";
import { cell, load, md, percent } from "./formato.ts";

/** The report and the CSV of the check, written from the analysis and nothing else: no figure is typed here. */

const codeOf = (what: string): string | null => /IFRA_STD_(\d+)/.exec(what)?.[1] ?? null;
const sortedIds = (ids: Iterable<string>) => [...new Set(ids)].sort(cmp);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const noDot = (text: string) => text.replace(/[.\s]+$/, "");

/** The token of a note, in words. */
function wordsOf(what: string): string {
  const std = codeOf(what);
  const n = std ? `STD ${std}` : "";
  const table: ReadonlyArray<readonly [RegExp, string]> = [
    [/^sin-datos$/, "pendiente «sin datos de sus constituyentes»"],
    [/^cobertura:parcial$/, "pendiente «composición parcial»"],
    [/^cobertura:solo-alergenos$/, "pendiente «solo cubre los alérgenos»"],
    [/^impurezas:/, "pendiente «impurezas sin declarar»"],
    [/^espec:/, `pendiente «especificación ${n} sin acreditar»`],
    [/^limite-constituyente:/, `pendiente «límite de un constituyente ${n}»`],
    [/^variante:/, `pendiente «no es la variante prohibida ${n}»`],
    [/^prohibido-sin-techo:/, `pendiente «prohibido como tal, sin techo ${n}»`],
    [/^prohibido-fuera-de-natural:/, `pendiente «prohibido como tal fuera de un natural ${n}»`],
    [/^nota-variante:/, `nota «una variante está prohibida ${n}»`],
    [/^cond-probada:/, `condición acreditada ${n}`],
    [/^cond-supuesta:/, `condición supuesta ${n}`],
    [/^tope$/, "tope del fabricante"],
    [/^tope:/, "tope del fabricante de un componente"],
    [/^prohibido:/, `prohibido como tal ${n}`],
  ];
  return table.find(([re]) => re.test(what))?.[1] ?? what;
}

const shortLoad = (text: string) => (/^(≤ )?\d+(\/\d+)?$/.test(text) ? `${text.startsWith("≤") ? "≤ " : ""}${percent(text.replace("≤ ", ""))}` : text);

/** One difference in a line for the tables: «STD 023 Coumarin: ≤ 0,1561 % → —» or «pendiente «composición parcial» (solo v2)». */
function line(d: Explained, names: ReadonlyMap<string, string>): string {
  if (d.where === "sustancia" || d.where === "límite") {
    const std = codeOf(d.what);
    const name = std ? names.get(`IFRA_STD_${std}`) : null;
    const label = d.what === "tope" || d.what.startsWith("tope:") ? wordsOf(d.what) : `${std ? `STD ${std}` : d.what}${name ? ` ${name}` : ""}`;
    return `${label}${d.where === "límite" ? " (techo)" : ""}: ${shortLoad(d.v2)} → ${shortLoad(d.v3)}`;
  }
  if (d.where === "estado" || d.where === "ficha") return `${d.where === "ficha" ? "ficha" : "estado"}: ${d.v2} → ${d.v3}`;
  return `${wordsOf(d.what)} (solo ${d.v2 === "sí" ? "v2" : "v3"})`;
}

const canonWords = (c: Canon): string => {
  const parts = [c.status === "checked" ? "comprobado" : "sin comprobar"];
  parts.push(c.entries.size === 0 ? "sin sustancias con techo" : plural(c.entries.size, "sustancia con techo", "sustancias con techo"));
  for (const token of [...c.pending].sort(cmp)) parts.push(wordsOf(token));
  for (const token of [...c.conditions].sort(cmp)) parts.push(wordsOf(token));
  for (const token of [...c.assumed].sort(cmp)) parts.push(wordsOf(token));
  return parts.join("; ");
};

// ------------------------------------------------------------------ the counts

type Status = "igual" | "esperada" | "sin-explicar";

function statusOf(items: readonly Explained[]): Status {
  return items.length === 0 ? "igual" : items.some((i) => i.reason === "sin-explicar") ? "sin-explicar" : "esperada";
}

export interface Counts {
  readonly total: number;
  readonly paired: number;
  readonly fromProduct: number;
  readonly fromMaterial: number;
  readonly unpaired: number;
  readonly status: Readonly<Record<Version, Readonly<Record<Status, number>>>>;
  readonly cards: Readonly<Record<Version, { readonly equal: number; readonly byReason: ReadonlyMap<string, number> }>>;
  /** Per reason and version: the materials and the differences (the card's included). */
  readonly reasons: ReadonlyMap<string, Readonly<Record<Version, { readonly materials: string[]; readonly items: number }>>>;
  readonly annexOwn: number;
  readonly annexBorrowed: number;
  readonly annexRows: number;
}

export function countsOf(a: Analysis): Counts {
  const paired = a.results.filter((r) => r.context);
  const status = Object.fromEntries(VERSIONS.map((v) => [v, { igual: 0, esperada: 0, "sin-explicar": 0 } as Record<Status, number>])) as Record<Version, Record<Status, number>>;
  const cards = Object.fromEntries(VERSIONS.map((v) => [v, { equal: 0, byReason: new Map<string, number>() }])) as unknown as Record<Version, { equal: number; byReason: Map<string, number> }>;
  const reasons = new Map(REASON_ORDER.map((k) => [k, { común: { materials: [] as string[], items: 0 }, tuya: { materials: [] as string[], items: 0 } }]));
  for (const r of paired) {
    for (const v of VERSIONS) {
      const items = r.diffs[v]!;
      status[v][statusOf(items)]++;
      for (const i of [...items, ...(r.cardDiffs[v] ? [r.cardDiffs[v]!] : [])]) {
        const slot = reasons.get(i.reason)![v];
        slot.items++;
        if (!slot.materials.includes(r.pair.labId)) slot.materials.push(r.pair.labId);
      }
      const card = r.cardDiffs[v];
      if (card) cards[v].byReason.set(card.reason, (cards[v].byReason.get(card.reason) ?? 0) + 1);
      else cards[v].equal++;
    }
  }
  const notes = paired.map((r) => [...new Set(r.context!.v2Annex.map((x) => x.note))]);
  return {
    total: a.results.length,
    paired: paired.length,
    fromProduct: paired.filter((r) => r.pair.v2Id!.startsWith("P")).length,
    fromMaterial: paired.filter((r) => r.pair.v2Id!.startsWith("M")).length,
    unpaired: a.results.length - paired.length,
    status,
    cards,
    reasons,
    annexOwn: notes.filter((n) => n.length > 0 && !n.some((x) => x.startsWith("el máximo de las"))).length,
    annexBorrowed: notes.filter((n) => n.some((x) => x.startsWith("el máximo de las"))).length,
    annexRows: notes.filter((n) => n.length > 0).length,
  };
}

// ------------------------------------------------------------------ the CSV

export function csvOf(a: Analysis, names: ReadonlyMap<string, string>): string {
  const header = ["material", "nombre", "pareja", "version", "donde", "que", "estandar", "v2", "v3", "efecto", "motivo", "decision", "evidencia"];
  const rows: string[][] = [];
  for (const r of a.results) {
    for (const v of VERSIONS) {
      const items = [...(r.diffs[v] ?? []), ...(r.cardDiffs[v] ? [r.cardDiffs[v]!] : [])];
      for (const d of items) {
        const code = codeOf(d.what);
        const figure = d.where === "sustancia" || d.where === "límite";
        rows.push([
          r.pair.labId, r.pair.name, r.pair.v2Id ?? "sin pareja", v, d.where, d.what, code ? (names.get(`IFRA_STD_${code}`) ?? "") : "",
          figure ? load(d.v2) : d.v2, figure ? load(d.v3) : d.v3, d.effect, d.reason, REASONS[d.reason].decisions, d.evidence,
        ]);
      }
    }
  }
  rows.sort((x, y) => cmp(x[0], y[0]) || cmp(x[3], y[3]) || cmp(x[4], y[4]) || cmp(x[5], y[5]));
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\n") + "\n";
}

// ------------------------------------------------------------------ the report

export function reportOf(a: Analysis, names: ReadonlyMap<string, string>): string {
  const c = countsOf(a);
  const s = c.status;
  const out: string[] = [];
  const group = (items: readonly Explained[]) => {
    const by = new Map<string, Explained[]>();
    for (const i of items) by.set(i.reason, [...(by.get(i.reason) ?? []), i]);
    return REASON_ORDER.filter((k) => by.has(k)).map((k) => [k, by.get(k)!] as const);
  };
  const why = (key: string) => `${REASONS[key].decisions === "—" ? "" : `${REASONS[key].decisions}: `}${REASONS[key].short}`;

  out.push("# Fase 5.1 · El IFRA de la v3 frente al de la v2, material a material", "");
  out.push(
    `*Generado por \`migracion-v3/fase-5/equivalencia.test.ts\`: no se edita a mano. Lee la v2 de \`datos/v2/\` (commit \`${a.v2Commit}\`) y la v3 de \`v3/datos/\` y de tu tanda 8 (commit \`${a.v3Commit}\`), desde los CSV y sin base de datos, con la capa de IFRA de ${a.layerStandards} estándares y ${a.layerAnnex} filas del anexo. Compara el \`IfraMaterial\` del motor de cada material tuyo (el común y tu versión) con el de su pareja en la v2 (\`migracion-v3/respuestas/laboratorio.csv\`). El detalle, diferencia a diferencia, está en \`diferencias.csv\`.*`,
    "",
  );

  out.push("## Resultado", "");
  out.push(`- **${c.total} materiales tuyos:** ${c.paired} con pareja en la v2 (${c.fromProduct} productos y ${c.fromMaterial} materiales) y ${c.unpaired} nuevos, sin pareja.`);
  out.push(`- **Tu versión** frente a su pareja: **${s.tuya.igual} iguales**, ${s.tuya.esperada} distintas por motivos esperados y **${s.tuya["sin-explicar"]} con diferencias sin explicar**.`);
  out.push(`- **Lo común** frente a su pareja: ${s.común.igual} iguales, ${s.común.esperada} distintas por motivos esperados y ${s.común["sin-explicar"]} con diferencias sin explicar.`);
  out.push("- «Igual» es el mismo estado, las mismas sustancias con techo con la misma cifra exacta (o la misma cota), y las mismas condiciones, supuestas y pendientes. «Esperada» es que los datos prueban el motivo: quitando de la v2 lo que la v3 no trae, o por lo que es el material. Si no, «sin explicar».");
  out.push(
    c.annexBorrowed === 0
      ? `- **V3-23 y V3-28:** de las ${c.annexRows} parejas con filas del anexo en la v2, ${c.annexOwn} las tomaban de su propia entrada y ${c.annexBorrowed} del máximo de las entradas de su CAS: ninguno de tus materiales cambia por V3-23 ni por V3-28.`
      : `- **V3-23 y V3-28:** de las ${c.annexRows} parejas con filas del anexo en la v2, ${c.annexOwn} las tomaban de su propia entrada y ${c.annexBorrowed} del máximo de las entradas de su CAS.`,
  );
  const equal = a.results.filter((r) => r.context && r.diffs.tuya!.length === 0);
  const sum = (f: (c: Canon) => number) => equal.reduce((n, r) => n + f(r.canon.tuya), 0);
  out.push(
    `- Las igualdades no son vacías: en los ${equal.length} iguales de tu versión coinciden exactamente ${sum((c) => c.entries.size)} líneas de sustancia con techo, una por material y estándar (${sum((x) => [...x.entries.keys()].filter((k) => k.startsWith("tope")).length)} de ellas, topes del fabricante), ${sum((x) => x.conditions.size + x.assumed.size)} condiciones y ${sum((x) => x.pending.size)} avisos pendientes.`,
  );
  const withCert = a.results.filter((r) => r.context && (r.certificate.composition || r.certificate.ceiling || r.certificate.claim));
  out.push(
    `- **Certificados de tu producto** (V3-39; sus cifras pasan tal cual, como el producto se compra, D12): ${a.results.filter((r) => r.certificate.composition).length} materiales llevan en tu versión la composición de su certificado, ${a.results.filter((r) => r.certificate.ceiling).length} un tope del fabricante y ${a.results.filter((r) => r.certificate.claim).length} una afirmación de especificación; de los ${withCert.length} que llevan algo de eso, ${withCert.filter((r) => r.diffs.tuya!.length === 0).length} dan en tu versión lo mismo que en la v2, y ${withCert.filter((r) => r.diffs.común!.some((i) => i.reason === "V3-39")).length} difieren en lo común por no llevarlo.`,
  );
  out.push(
    `- **Ficha** (el estado de IFRA que enseña, V3-25): coincide en ${c.cards.tuya.equal} de ${c.paired} en tu versión y en ${c.cards.común.equal} en lo común; el resto, en \`diferencias.csv\` (filas «ficha»). Sin explicar: ${c.cards.tuya.byReason.get("sin-explicar") ?? 0} en tu versión y ${c.cards.común.byReason.get("sin-explicar") ?? 0} en lo común.`,
    "",
  );

  out.push("## Motivos", "", "| Motivo | Decisión | Materiales (tu versión) | Materiales (común) | Diferencias (tu versión / común) |", "|---|---|---:|---:|---:|");
  for (const key of REASON_ORDER) {
    const slot = c.reasons.get(key)!;
    if (slot.tuya.items === 0 && slot.común.items === 0) continue;
    out.push(`| ${md(REASONS[key].label)} | ${REASONS[key].decisions} | ${slot.tuya.materials.length} | ${slot.común.materials.length} | ${slot.tuya.items} / ${slot.común.items} |`);
  }
  const absent = REASON_ORDER.filter((k) => k !== "sin-explicar" && c.reasons.get(k)!.tuya.items === 0 && c.reasons.get(k)!.común.items === 0);
  out.push("", "Las filas «ficha» (V3-25 y la consecuencia de lo anterior) cuentan solo el estado que enseña la ficha, no el `IfraMaterial`.");
  if (absent.length > 0) out.push("", `Motivos que no aparecen en ninguno de tus ${c.total} materiales: ${absent.map((k) => `${REASONS[k].decisions} (${REASONS[k].short})`).join("; ")}.`);
  out.push("");

  // ---- what is left unexplained
  const unexplained = a.results.flatMap((r) =>
    VERSIONS.flatMap((v) => [...(r.diffs[v] ?? []), ...(r.cardDiffs[v] ? [r.cardDiffs[v]!] : [])].filter((i) => i.reason === "sin-explicar").map((i) => ({ r, v, i }))),
  );
  out.push("## Sin explicar", "");
  if (unexplained.length === 0) {
    out.push("Ninguna diferencia queda sin explicar.", "");
  } else {
    out.push("No cuadran con ninguna decisión: hay que mirarlas antes de dar la fase por buena.", "");
    for (const id of sortedIds(unexplained.map((x) => x.r.pair.labId))) {
      const mine = unexplained.filter((x) => x.r.pair.labId === id);
      const r = mine[0].r;
      const tuya = mine.filter((x) => x.v === "tuya");
      const comun = mine.filter((x) => x.v === "común");
      const evidence = noDot([...new Set((tuya.length ? tuya : comun).map((x) => x.i.evidence))].join(" · "));
      out.push(
        `- **${id}** (${r.pair.name}; pareja ${r.pair.v2Id}): ${tuya.length} en tu versión y ${comun.length} en lo común. ${evidence}. En tu versión: ${tuya.map((x) => line(x.i, names)).join("; ")}.`,
      );
    }
    out.push("");
  }

  // ---- the user's version
  const differing = a.results.filter((r) => r.context && r.diffs.tuya!.length > 0);
  out.push(`## Tu versión: los ${differing.length} materiales que difieren de su pareja`, "");
  out.push("| Material | Nombre | Pareja | Qué cambia | Motivo |", "|---|---|---|---|---|");
  for (const r of differing) {
    const parts = group(r.diffs.tuya!);
    const what = parts.map(([, items]) => items.slice(0, 5).map((i) => line(i, names)).join("; ") + (items.length > 5 ? `; +${items.length - 5} más` : "")).join(" — ");
    out.push(`| ${r.pair.labId} | ${md(r.pair.name)} | ${r.pair.v2Id} | ${md(what)} | ${md(parts.map(([k]) => why(k)).join(" / "))} |`);
  }
  out.push("");

  // ---- the common one
  const commonDiffs = a.results.filter((r) => r.context && r.diffs.común!.length > 0);
  out.push(`## Lo común: los ${commonDiffs.length} materiales que difieren de su pareja`, "");
  out.push("Lo común no trae el certificado, el tope ni las afirmaciones de tu producto (V3-39): por eso difiere más que tu versión. Aquí, cuántas diferencias tiene cada uno y por qué; lo que comparte con tu versión es lo de la tabla anterior.", "");
  out.push("| Material | Pareja | Diferencias | Motivos |", "|---|---|---|---|");
  for (const r of commonDiffs) {
    const items = r.diffs.común!;
    const kinds = ["sustancia", "límite", "condición", "supuesta", "pendiente", "estado"].map((w) => [w, items.filter((i) => i.where === w).length] as const).filter(([, n]) => n > 0);
    out.push(`| ${r.pair.labId} | ${r.pair.v2Id} | ${kinds.map(([w, n]) => `${n} ${w}`).join(", ")} | ${group(items).map(([k, list]) => `${REASONS[k].short} (${list.length})`).join(", ")} |`);
  }
  out.push("");

  // ---- to watch
  out.push("## A vigilar", "");
  out.push("Diferencias con motivo, pero en las que la v3 deja de pedir en tu versión algo que la v2 pedía:", "");
  let watched = 0;
  for (const key of REASON_ORDER) {
    if (key === "sin-explicar" || key === "consecuencia" || key === "V3-25") continue;
    const lost = a.results.flatMap((r) => (r.diffs.tuya ?? []).filter((i) => i.reason === key && i.effect === "v3 pierde").map(() => r.pair.labId));
    if (lost.length === 0) continue;
    watched++;
    out.push(`- **${REASONS[key].decisions}** · ${REASONS[key].label}: ${plural(sortedIds(lost).length, "material", "materiales")} (${sortedIds(lost).join(", ")}).`);
  }
  if (watched === 0) out.push("- Ninguna.");
  const classes = a.classStandards.filter((x) => x.v2Members > 0);
  if (classes.length > 0) {
    const classCodes = new Set(classes.map((x) => x.code));
    const hit = sortedIds(a.results.filter((r) => (r.diffs.tuya ?? []).some((i) => i.reason === "por-cas" && classCodes.has(`IFRA_STD_${codeOf(i.what)}`))).map((r) => r.pair.labId));
    out.push(
      "",
      `Y algo de fondo que viene de lo mismo: ${plural(classes.length, "estándar de IFRA no lista", "estándares de IFRA no listan")} ningún CAS en los archivos de IFRA, así que la capa, que lee por CAS, no llega con ellos a ningún material (${classes.map((x) => `${x.code.replace("IFRA_", "")} «${x.name}», con ${plural(x.v2Members, "miembro", "miembros")} en la v2`).join("; ")}). Entre tus materiales deja de aplicarse a ${hit.length > 0 ? `${hit.length} (${hit.join(", ")})` : "ninguno"}.`,
    );
  }
  const makerCards = a.results.filter((r) => r.cardDiffs.tuya?.reason === "V3-25" && r.cardDiffs.tuya.v3 === "con-techo").length;
  if (makerCards > 0) {
    out.push("", `La ficha de tu versión dice «con techo» en ${plural(makerCards, "material", "materiales")} por el tope del fabricante de tu producto (V3-25, V3-39), no por un estándar de IFRA; la v2 decía otra cosa. Conviene decidir si ese «techo» se enseña distinto.`);
  }
  out.push("");

  // ---- the ones without a pair
  const unpaired = a.results.filter((r) => !r.context);
  out.push(`## Materiales nuevos, sin pareja en la v2 (${unpaired.length})`, "");
  out.push("No hay con qué comparar. Esto es lo que dice la v3 de cada uno, para ver que ninguno sale en verde sin datos.", "");
  out.push("| Material | Nombre | Tipo | Lo común | Tu versión |", "|---|---|---|---|---|");
  for (const r of unpaired) out.push(`| ${r.pair.labId} | ${md(r.pair.name)} | ${r.v3Kind} | ${md(canonWords(r.canon.común))} | ${md(canonWords(r.canon.tuya))} |`);
  out.push("");

  out.push("## Cómo repetirlo", "");
  out.push('Desde la raíz del repositorio (en Git Bash, antes: `export PATH="/c/Program Files/nodejs:$PATH"`):', "");
  out.push("```", "npx vitest run --config migracion-v3/fase-5/vitest.config.ts", "```", "");
  out.push("Reescribe este informe y `diferencias.csv` con los mismos bytes si los datos no cambian. No toca la base de datos, `v3/datos/`, `datos/` ni el laboratorio.");
  return out.join("\n") + "\n";
}
