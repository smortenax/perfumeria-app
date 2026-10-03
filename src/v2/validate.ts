import { Ratio } from "../core/arith/ratio.ts";
import { AUTHORITIES, ID_PREFIX, ORIGINS } from "./model.ts";
import type { Dataset, Entity, Issue, Material, Severity } from "./model.ts";

/**
 * The checks of `npm run validar:v2` (datos/v2/LEEME.md, «Reglas»). Errors stop a data
 * commit; warnings are shown and left to the user.
 */

export interface References {
  /** Standard ids of datos/ifra/51/estandares.csv (IFRA_STD_001…). */
  readonly ifraStandards: ReadonlySet<string>;
  /** Ids of datos/glosario/materiales.csv, read only. */
  readonly v1Ids: ReadonlySet<string>;
}

const FILE = {
  ids: "registro-ids.csv",
  substances: "sustancias.csv",
  casAliases: "sustancia-cas.csv",
  groups: "grupos.csv",
  groupMembers: "grupo-miembros.csv",
  materials: "materiales.csv",
  composition: "composicion.csv",
  coverages: "coberturas.csv",
  products: "productos.csv",
  ceilings: "topes.csv",
  lots: "lotes.csv",
  documents: "documentos.csv",
  usages: "usos.csv",
  knownImpurities: "impurezas-conocidas.csv",
  conditions: "condiciones.csv",
  exclusions: "exclusiones.csv",
  v1Links: "v1-a-v2.csv",
} as const;

const ENTITIES = Object.keys(ID_PREFIX) as Entity[];
const MATERIAL_TYPES = ["sustancia", "natural", "base", "formula"];
const CAS_RELATIONS = ["principal", "isomero", "mezcla", "obsoleto"];
const GROUP_TYPES = ["estandar-ifra", "alergeno-ue"];
const VALUE_TYPES = ["tipico", "maximo", "rango"];
const COVERAGES = ["reguladas-completa", "solo-alergenos", "parcial", "desconocida"];
const DOCUMENT_TYPES = ["coa", "sds", "certificado-ifra", "ficha", "anexo-ifra", "articulo", "consenso", "otro"];
const REVIEW_STATUSES = ["pendiente", "revisado"];
const ID_STATUSES = ["activo", "retirado"];
const EXCEPTIONS = ["suma", "naturales"];
const MAGNITUDES = ["uso-habitual", "duracion"];

const HUNDRED = Ratio.of(100n);
/** Composition may add up to 100 % plus this, for the rounding of the sources. */
const SUM_TOLERANCE = Ratio.fromDecimal("0.5");

/** CAS format and check digit: the digits, right to left, weighted 1, 2, 3… modulo 10. */
export function isValidCas(cas: string): boolean {
  const match = /^(\d{2,7})-(\d{2})-(\d)$/.exec(cas);
  if (!match) {
    return false;
  }
  const digits = match[1] + match[2];
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[digits.length - 1 - i]) * (i + 1);
  }
  return sum % 10 === Number(match[3]);
}

const prefixOf = (id: string): string => id.charAt(0);

export function validate(data: Dataset, refs: References): Issue[] {
  const issues: Issue[] = [];
  const report = (severity: Severity, rule: string, file: string, line: number, message: string) =>
    issues.push({ severity, rule, file, line, message });
  const error = (rule: string, file: string, line: number, message: string) =>
    report("error", rule, file, line, message);

  // --- ids: unique, well formed, registered -------------------------------------------
  const registry = new Map<string, { entity: string; status: string }>();
  for (const e of data.ids) {
    if (registry.has(e.id)) {
      error("ids", FILE.ids, e.line, `Id repetido en el registro: ${e.id}.`);
      continue;
    }
    registry.set(e.id, { entity: e.entity, status: e.status });
    if (!ENTITIES.includes(e.entity as Entity)) {
      error("ids", FILE.ids, e.line, `Entidad desconocida «${e.entity}».`);
    } else if (!new RegExp(`^${ID_PREFIX[e.entity as Entity]}\\d{5}$`).test(e.id)) {
      error("ids", FILE.ids, e.line, `El id ${e.id} no tiene la forma ${ID_PREFIX[e.entity as Entity]}00000 de un ${e.entity}.`);
    }
    if (!ID_STATUSES.includes(e.status)) {
      error("ids", FILE.ids, e.line, `Estado «${e.status}»; vale activo o retirado.`);
    }
    if (e.key === "") {
      error("ids", FILE.ids, e.line, `El id ${e.id} no tiene clave.`);
    }
  }

  const tables: Array<[Entity, string, ReadonlyArray<{ id: string; line: number }>]> = [
    ["sustancia", FILE.substances, data.substances],
    ["material", FILE.materials, data.materials],
    ["producto", FILE.products, data.products],
    ["lote", FILE.lots, data.lots],
    ["documento", FILE.documents, data.documents],
    ["grupo", FILE.groups, data.groups],
  ];
  /** Every id that exists in its own table, with its entity. */
  const known = new Map<string, Entity>();
  for (const [entity, file, rows] of tables) {
    for (const row of rows) {
      if (known.has(row.id)) {
        error("ids", file, row.line, `Id repetido: ${row.id}.`);
        continue;
      }
      known.set(row.id, entity);
      const entry = registry.get(row.id);
      if (!entry) {
        error("ids", file, row.line, `El id ${row.id} no está en el registro.`);
      } else if (entry.entity !== entity) {
        error("ids", file, row.line, `El id ${row.id} está registrado como ${entry.entity}, no como ${entity}.`);
      } else if (entry.status !== "activo") {
        error("ids", file, row.line, `El id ${row.id} está retirado y se sigue usando.`);
      }
    }
  }
  for (const e of data.ids) {
    if (e.status === "activo" && !known.has(e.id)) {
      error("ids", FILE.ids, e.line, `El id ${e.id} está activo y no existe en su tabla.`);
    }
  }

  // --- orphans --------------------------------------------------------------------------
  /** Checks that `id` exists and is one of `entities`; an empty id is allowed only if optional. */
  const ref = (file: string, line: number, column: string, id: string, entities: Entity[], optional = false) => {
    if (id === "") {
      if (!optional) {
        error("huerfanos", file, line, `Falta ${column}.`);
      }
      return;
    }
    const entity = known.get(id);
    if (!entity) {
      error("huerfanos", file, line, `${column} ${id} no existe.`);
    } else if (!entities.includes(entity)) {
      error("huerfanos", file, line, `${column} ${id} es un ${entity}; se espera ${entities.join(" o ")}.`);
    }
  };

  const materials = new Map(data.materials.map((m) => [m.id, m]));
  const groups = new Map(data.groups.map((g) => [g.id, g]));
  const documents = new Map(data.documents.map((d) => [d.id, d]));
  const productMaterial = new Map(data.products.map((p) => [p.id, p.materialId]));
  const lotProduct = new Map(data.lots.map((l) => [l.id, l.productId]));

  for (const a of data.casAliases) {
    ref(FILE.casAliases, a.line, "id_sustancia", a.substanceId, ["sustancia"]);
  }
  for (const gm of data.groupMembers) {
    ref(FILE.groupMembers, gm.line, "id_grupo", gm.groupId, ["grupo"]);
    const group = groups.get(gm.groupId);
    const allowed: Entity[] = group?.type === "estandar-ifra" ? ["sustancia", "material"] : ["sustancia"];
    ref(FILE.groupMembers, gm.line, "id_miembro", gm.memberId, allowed);
  }
  for (const m of data.materials) {
    ref(FILE.materials, m.line, "id_sustancia", m.substanceId, ["sustancia"], true);
  }
  for (const c of data.composition) {
    ref(FILE.composition, c.line, "id_contenedor", c.containerId, ["material", "producto", "lote"]);
    ref(FILE.composition, c.line, "id_componente", c.componentId, ["sustancia", "material"]);
    ref(FILE.composition, c.line, "id_documento", c.documentId, ["documento"], true);
  }
  for (const c of data.coverages) {
    ref(FILE.coverages, c.line, "id_contenedor", c.containerId, ["material", "producto", "lote"]);
    ref(FILE.coverages, c.line, "id_documento", c.documentId, ["documento"], true);
  }
  for (const p of data.products) {
    ref(FILE.products, p.line, "id_material", p.materialId, ["material"]);
  }
  for (const c of data.ceilings) {
    ref(FILE.ceilings, c.line, "id_producto", c.productId, ["producto"]);
    ref(FILE.ceilings, c.line, "id_documento", c.documentId, ["documento"], true);
  }
  for (const l of data.lots) {
    ref(FILE.lots, l.line, "id_producto", l.productId, ["producto"]);
  }
  for (const u of data.usages) {
    ref(FILE.usages, u.line, "id_material", u.materialId, ["material"]);
    ref(FILE.usages, u.line, "id_documento", u.documentId, ["documento"], true);
  }
  for (const k of data.knownImpurities) {
    ref(FILE.knownImpurities, k.line, "id_sustancia", k.substanceId, ["sustancia"]);
    ref(FILE.knownImpurities, k.line, "id_documento", k.documentId, ["documento"], true);
  }

  // --- cas ------------------------------------------------------------------------------
  for (const a of data.casAliases) {
    if (!isValidCas(a.cas)) {
      error("cas", FILE.casAliases, a.line, `CAS no válido: «${a.cas}».`);
    }
  }
  for (const m of data.materials) {
    if (m.cas !== "" && !isValidCas(m.cas)) {
      error("cas", FILE.materials, m.line, `CAS no válido: «${m.cas}».`);
    }
  }

  // --- values ---------------------------------------------------------------------------
  /** Reads a decimal; reports and returns null when it does not parse or is out of range. */
  const number = (file: string, line: number, column: string, text: string, upTo: Ratio | null): Ratio | null => {
    if (text === "") {
      return null;
    }
    let value: Ratio;
    try {
      value = Ratio.fromDecimal(text);
    } catch {
      error("valores", file, line, `${column} no es un número: «${text}».`);
      return null;
    }
    if (value.sign() < 0 || (upTo && value.gt(upTo))) {
      error("valores", file, line, `${column} fuera de rango: ${text}.`);
      return null;
    }
    return value;
  };

  /** Checks min ≤ typical ≤ max and that the value type has its figures; returns the lower bound. */
  const figures = (
    file: string,
    line: number,
    texts: { min: string; typical: string; max: string },
    valueType: string | null,
    upTo: Ratio | null,
  ): { lower: Ratio; key: string } | null => {
    const min = number(file, line, "min", texts.min, upTo);
    const typical = number(file, line, "tipico", texts.typical, upTo);
    const max = number(file, line, "max", texts.max, upTo);
    const present = [min, typical, max].filter((v): v is Ratio => v !== null);
    const ordered = present.every((v, i) => i === 0 || present[i - 1].cmp(v) <= 0);
    if (!ordered) {
      error("valores", file, line, "Las cifras no cumplen min ≤ tipico ≤ max.");
    }
    if (valueType !== null) {
      if (!VALUE_TYPES.includes(valueType)) {
        error("valores", file, line, `tipo_valor «${valueType}»; vale tipico, maximo o rango.`);
        return null;
      }
      const needs: Record<string, Array<[string, Ratio | null]>> = {
        tipico: [["tipico", typical]],
        maximo: [["max", max]],
        rango: [["min", min], ["max", max]],
      };
      for (const [column, value] of needs[valueType]) {
        if (value === null) {
          error("valores", file, line, `Un valor de tipo ${valueType} necesita ${column}.`);
          return null;
        }
      }
    } else if (present.length === 0) {
      error("valores", file, line, "La fila no tiene ninguna cifra.");
      return null;
    }
    const lower = valueType === "tipico" ? typical! : (min ?? Ratio.ZERO);
    return { lower, key: [min, typical, max].map((v) => v?.toString() ?? "").join("|") };
  };

  // --- provenance -----------------------------------------------------------------------
  const provenance = (file: string, line: number, documentId: string, authority: string | null) => {
    if (authority !== null && !(AUTHORITIES as readonly string[]).includes(authority)) {
      error("procedencia", file, line, `autoridad «${authority}»; vale ${AUTHORITIES.join(", ")}.`);
    }
    if (documentId === "") {
      error("procedencia", file, line, "La cifra no tiene documento de origen.");
      return;
    }
    const doc = documents.get(documentId);
    if (doc && doc.reviewStatus !== "revisado") {
      error("procedencia", file, line, `El documento ${documentId} no está revisado (D6).`);
    }
  };

  // --- composition: values, provenance, authority ↔ container, sums, duplicates --------
  const sums = new Map<string, { total: Ratio; line: number; containerId: string }>();
  const seen = new Map<string, { documentId: string; key: string; line: number }[]>();
  for (const c of data.composition) {
    const f = figures(FILE.composition, c.line, c, c.valueType, HUNDRED);
    provenance(FILE.composition, c.line, c.documentId, c.authority);
    const expected = c.authority === "lote" ? "L" : c.authority === "producto" ? "P" : "M";
    if ((AUTHORITIES as readonly string[]).includes(c.authority) && prefixOf(c.containerId) !== expected) {
      error(
        "coherencia",
        FILE.composition,
        c.line,
        `La autoridad ${c.authority} va en un contenedor ${expected}, no en ${c.containerId}.`,
      );
    }
    if (!f) {
      continue;
    }
    const sumKey = `${c.containerId}|${c.documentId}`;
    const sum = sums.get(sumKey) ?? { total: Ratio.ZERO, line: c.line, containerId: c.containerId };
    sums.set(sumKey, { ...sum, total: sum.total.add(f.lower) });

    const dupKey = `${c.containerId}|${c.componentId}|${c.authority}`;
    const previous = seen.get(dupKey) ?? [];
    for (const p of previous) {
      if (p.documentId !== c.documentId && p.key !== f.key) {
        report(
          "aviso",
          "duplicado",
          FILE.composition,
          c.line,
          `${c.componentId} en ${c.containerId} (${c.authority}) tiene cifras distintas en ${p.documentId} ` +
            `(línea ${p.line}) y ${c.documentId}.`,
        );
      }
    }
    seen.set(dupKey, [...previous, { documentId: c.documentId, key: f.key, line: c.line }]);
  }
  for (const [key, s] of sums) {
    if (s.total.gt(HUNDRED.add(SUM_TOLERANCE)) && !materials.get(s.containerId)?.exceptions.includes("suma")) {
      const [containerId, documentId] = key.split("|");
      error(
        "suma",
        FILE.composition,
        s.line,
        `${containerId} suma ${s.total.toFixed(3)} % en ${documentId || "(sin documento)"}; el máximo es 100,5 %.`,
      );
    }
  }

  // --- other figures --------------------------------------------------------------------
  for (const c of data.ceilings) {
    number(FILE.ceilings, c.line, "max_pct", c.maxPct, HUNDRED);
    if (c.maxPct === "") {
      error("valores", FILE.ceilings, c.line, "El tope no tiene cifra.");
    }
    if (c.category === "") {
      error("valores", FILE.ceilings, c.line, "El tope no tiene categoría.");
    }
    provenance(FILE.ceilings, c.line, c.documentId, null);
  }
  for (const u of data.usages) {
    if (!MAGNITUDES.includes(u.magnitude)) {
      error("valores", FILE.usages, u.line, `magnitud «${u.magnitude}»; vale ${MAGNITUDES.join(" o ")}.`);
    }
    figures(FILE.usages, u.line, u, null, null);
    if (u.unit === "" || u.base === "") {
      error("valores", FILE.usages, u.line, "Un uso lleva su unidad y su base.");
    }
    provenance(FILE.usages, u.line, u.documentId, u.authority);
  }

  // --- conditions: a claim that meets an IFRA specification ------------------------------------
  for (const c of data.conditions) {
    ref(FILE.conditions, c.line, "id_contenedor", c.containerId, ["material", "producto", "lote"]);
    ref(FILE.conditions, c.line, "id_documento", c.documentId, ["documento"], true);
    if (!refs.ifraStandards.has(c.standard)) {
      error("condiciones", FILE.conditions, c.line, `El estándar «${c.standard}» no está en datos/ifra/51/estandares.csv.`);
    }
    if (c.claim === "") {
      error("condiciones", FILE.conditions, c.line, "La condición no dice qué se afirma.");
    }
    if (!(AUTHORITIES as readonly string[]).includes(c.authority)) {
      error("condiciones", FILE.conditions, c.line, `autoridad «${c.authority}»; vale ${AUTHORITIES.join(", ")}.`);
      continue;
    }
    const proves = c.authority === "lote" || c.authority === "producto";
    const expected = c.authority === "lote" ? "L" : c.authority === "producto" ? "P" : "M";
    if (prefixOf(c.containerId) !== expected) {
      error("condiciones", FILE.conditions, c.line, `La autoridad ${c.authority} va en un contenedor ${expected}, no en ${c.containerId}.`);
    }
    // What proves a condition has its reviewed document; a consensus or the literature may go without (D6).
    if (proves && c.documentId === "") {
      error("condiciones", FILE.conditions, c.line, `Una condición de autoridad ${c.authority} necesita su documento.`);
    }
    const doc = documents.get(c.documentId);
    if (doc && doc.reviewStatus !== "revisado") {
      error("condiciones", FILE.conditions, c.line, `El documento ${c.documentId} no está revisado (D6).`);
    }
  }

  // --- exclusions: a specification that does not apply to some processes ---------------------------
  for (const x of data.exclusions) {
    if (!refs.ifraStandards.has(x.standard)) {
      error("exclusiones", FILE.exclusions, x.line, `El estándar «${x.standard}» no está en datos/ifra/51/estandares.csv.`);
    }
    if (x.processes.length === 0) {
      error("exclusiones", FILE.exclusions, x.line, "Una exclusión dice a qué procesos no aplica.");
    }
  }

  // A molecule known to carry regulated impurities says where that is known from (D6, D7).
  for (const k of data.knownImpurities) {
    provenance(FILE.knownImpurities, k.line, k.documentId, null);
  }

  // --- coverage -------------------------------------------------------------------------
  const coverageKeys = new Set<string>();
  for (const c of data.coverages) {
    const key = `${c.containerId}|${c.documentId}`;
    if (coverageKeys.has(key)) {
      error("cobertura", FILE.coverages, c.line, `Cobertura repetida para ${c.containerId} y ${c.documentId || "(sin documento)"}.`);
    }
    coverageKeys.add(key);
    if (!COVERAGES.includes(c.coverage)) {
      error("cobertura", FILE.coverages, c.line, `cobertura «${c.coverage}»; vale ${COVERAGES.join(", ")}.`);
    }
    if (c.documentId === "" && c.coverage !== "desconocida") {
      error("cobertura", FILE.coverages, c.line, "Solo una cobertura desconocida va sin documento.");
    }
    if (c.documentId !== "") {
      provenance(FILE.coverages, c.line, c.documentId, null);
    }
  }
  const containersWithRows = new Set<string>();
  const uncovered = new Set<string>();
  for (const c of data.composition) {
    containersWithRows.add(c.containerId);
    const key = `${c.containerId}|${c.documentId}`;
    if (!coverageKeys.has(key) && !uncovered.has(key)) {
      uncovered.add(key);
      error(
        "cobertura",
        FILE.composition,
        c.line,
        `${c.containerId} tiene composición de ${c.documentId || "(sin documento)"} sin cobertura declarada.`,
      );
    }
  }
  for (const m of data.materials) {
    // A substance without rows is itself at 100 %; a natural or a base without rows is unknown,
    // and has to say so.
    if ((m.type === "natural" || m.type === "base") && !containersWithRows.has(m.id) && !coverageKeys.has(`${m.id}|`)) {
      error("cobertura", FILE.materials, m.line, `${m.id} (${m.type}) no tiene composición ni una cobertura «desconocida».`);
    }
  }

  // --- materials ------------------------------------------------------------------------
  const certifiedMaterials = new Set<string>();
  for (const c of data.coverages) {
    if (c.coverage !== "reguladas-completa") continue;
    const productId = productMaterial.has(c.containerId) ? c.containerId : lotProduct.get(c.containerId);
    const materialId = productId ? productMaterial.get(productId) : undefined;
    if (materialId) certifiedMaterials.add(materialId);
  }
  for (const m of data.materials) {
    if (!MATERIAL_TYPES.includes(m.type)) {
      error("coherencia", FILE.materials, m.line, `tipo «${m.type}»; vale ${MATERIAL_TYPES.join(", ")}.`);
    }
    if (m.type === "sustancia" && m.substanceId === "") {
      error("coherencia", FILE.materials, m.line, "Un material de tipo sustancia necesita id_sustancia.");
    }
    // D7: a molecule says where it comes from; the rest of the materials do not use the field.
    if (m.type === "sustancia" && !(ORIGINS as readonly string[]).includes(m.origin)) {
      error("origen", FILE.materials, m.line, `Una sustancia necesita origen (${ORIGINS.join(", ")}); tiene «${m.origin}».`);
    } else if (m.type === "sustancia" && m.origin === "desconocido") {
      // A product of the material with a certificate that lists every restricted substance already says what the
      // impurities are, so its unknown origin is no longer a doubt worth a warning.
      if (!certifiedMaterials.has(m.id)) {
        report("aviso", "origen-desconocido", FILE.materials, m.line, `El origen de ${m.id} (${m.name}) es desconocido: se cuenta pura por convención (D7). ¿Se puede saber?`);
      }
    } else if (m.type !== "sustancia" && m.origin !== "") {
      error("origen", FILE.materials, m.line, `El origen es solo de las sustancias; ${m.id} es ${m.type}.`);
    }
    if (m.type === "natural" && m.species === "") {
      error("natural", FILE.materials, m.line, `El natural ${m.id} no tiene especie (D1).`);
    }
    for (const e of m.exceptions) {
      if (!EXCEPTIONS.includes(e)) {
        error("coherencia", FILE.materials, m.line, `Excepción «${e}»; vale ${EXCEPTIONS.join(" o ")}.`);
      }
    }
    if (m.exceptions.length > 0 && m.exceptionReason === "") {
      error("coherencia", FILE.materials, m.line, "Una excepción necesita su motivo.");
    }
  }

  // --- cycles and naturals inside substances ----------------------------------------------
  /** The material a container stands for: itself, its product's, or its lot's product's. */
  const materialOf = (id: string): string | undefined => {
    switch (prefixOf(id)) {
      case "M":
        return id;
      case "P":
        return productMaterial.get(id);
      case "L":
        return productMaterial.get(lotProduct.get(id) ?? "");
      default:
        return undefined;
    }
  };
  const edges = new Map<string, Array<{ to: string; line: number }>>();
  for (const c of data.composition) {
    const from = materialOf(c.containerId);
    if (from && materials.has(c.componentId)) {
      edges.set(from, [...(edges.get(from) ?? []), { to: c.componentId, line: c.line }]);
    }
  }
  const state = new Map<string, "open" | "done">();
  const visit = (id: string, path: string[]) => {
    state.set(id, "open");
    for (const edge of edges.get(id) ?? []) {
      const s = state.get(edge.to);
      if (s === "open") {
        const cycle = [...path.slice(path.indexOf(edge.to)), id, edge.to];
        error("ciclos", FILE.composition, edge.line, `Ciclo entre materiales: ${cycle.join(" → ")}.`);
      } else if (s === undefined) {
        visit(edge.to, [...path, id]);
      }
    }
    state.set(id, "done");
  };
  for (const id of edges.keys()) {
    if (!state.has(id)) {
      visit(id, []);
    }
  }

  /** The first natural reachable from a material, if any; cycles are already reported. */
  const naturalInside = (start: Material): string | undefined => {
    const stack = (edges.get(start.id) ?? []).map((e) => e.to);
    const done = new Set<string>([start.id]);
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (done.has(id)) {
        continue;
      }
      done.add(id);
      if (materials.get(id)?.type === "natural") {
        return id;
      }
      stack.push(...(edges.get(id) ?? []).map((e) => e.to));
    }
    return undefined;
  };
  for (const m of data.materials) {
    if (m.type === "sustancia" && !m.exceptions.includes("naturales")) {
      const natural = naturalInside(m);
      if (natural) {
        error("naturales", FILE.materials, m.line, `La sustancia ${m.id} contiene el natural ${natural}.`);
      }
    }
  }

  // --- substances, CAS aliases, groups, documents -----------------------------------------
  const principalOf = new Map<string, string>();
  const principalCount = new Map<string, number>();
  const pairs = new Set<string>();
  for (const a of data.casAliases) {
    if (!CAS_RELATIONS.includes(a.relation)) {
      error("coherencia", FILE.casAliases, a.line, `relacion «${a.relation}»; vale ${CAS_RELATIONS.join(", ")}.`);
    }
    const pair = `${a.substanceId}|${a.cas}`;
    if (pairs.has(pair)) {
      error("coherencia", FILE.casAliases, a.line, `${a.cas} está dos veces en ${a.substanceId}.`);
    }
    pairs.add(pair);
    if (a.relation === "principal") {
      const count = (principalCount.get(a.substanceId) ?? 0) + 1;
      principalCount.set(a.substanceId, count);
      if (count > 1) {
        error("coherencia", FILE.casAliases, a.line, `${a.substanceId} tiene más de un CAS principal.`);
      }
      const other = principalOf.get(a.cas);
      if (other && other !== a.substanceId) {
        error("coherencia", FILE.casAliases, a.line, `${a.cas} es el CAS principal de ${other} y de ${a.substanceId}.`);
      }
      principalOf.set(a.cas, a.substanceId);
    }
  }
  for (const g of data.groups) {
    if (!GROUP_TYPES.includes(g.type)) {
      error("coherencia", FILE.groups, g.line, `tipo «${g.type}»; vale ${GROUP_TYPES.join(" o ")}.`);
    }
    if (g.type === "estandar-ifra" && !refs.ifraStandards.has(g.reference)) {
      error("coherencia", FILE.groups, g.line, `El estándar «${g.reference}» no está en datos/ifra/51/estandares.csv.`);
    }
  }
  for (const d of data.documents) {
    if (!DOCUMENT_TYPES.includes(d.type)) {
      error("coherencia", FILE.documents, d.line, `tipo «${d.type}»; vale ${DOCUMENT_TYPES.join(", ")}.`);
    }
    if (!REVIEW_STATUSES.includes(d.reviewStatus)) {
      error("coherencia", FILE.documents, d.line, `estado_revision «${d.reviewStatus}»; vale pendiente o revisado.`);
    }
  }

  // --- v1 links ---------------------------------------------------------------------------
  const v1Owner = new Map<string, string>();
  for (const link of data.v1Links) {
    ref(FILE.v1Links, link.line, "id_v2", link.v2Id, ["material", "sustancia"]);
    if (!refs.v1Ids.has(link.v1Id)) {
      error("v1", FILE.v1Links, link.line, `${link.v1Id} no está en datos/glosario/materiales.csv.`);
    }
    const owner = v1Owner.get(link.v1Id);
    if (owner !== undefined && owner !== link.v2Id) {
      error("v1", FILE.v1Links, link.line, `${link.v1Id} apunta a ${owner} y a ${link.v2Id}.`);
    }
    v1Owner.set(link.v1Id, owner ?? link.v2Id);
  }

  return issues;
}
