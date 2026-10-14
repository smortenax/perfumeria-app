import type { IfraData } from "../core/ifra";
import type { Amount, Catalog, CatalogMaterial, Component } from "../db/catalog";
import type { IfraLayer } from "../db/ifra-layer";
import { effective, ifraCard, type IfraCardState } from "../db/to-ifra";
import { texts } from "../i18n/es";
import { decimal, percent } from "./format";

/**
 * A material's sheet (plan v3, step 6.2; V3-47): for now a plain data sheet, sections of «field:
 * value» and tables, built from the lists of fields below. The designed card (V3-47, the AOM)
 * will replace the view, not this: every value comes from the record as it is (V3-41), with its
 * source and its base next to it, and what is not known says so (§1.2), never empty or zero.
 *
 * A version (V3-5) shows the common material's record with its own over it: each value comes from
 * the nearest of the chain that has it, and the version's own are marked as yours.
 */

/** A value of the sheet: its text, or null when nobody says it; and what goes with it. */
export interface SheetValue {
  readonly text: string | null;
  /** Its source, its base, its origin: shown next to it. */
  readonly notes: readonly string[];
  /** It comes from your version, not from the common material. */
  readonly yours: boolean;
  /** V3-17: the datum is in dispute between sources. */
  readonly disputed: boolean;
  /** A web address, shown as a link. */
  readonly link?: string;
}

export interface SheetRow {
  readonly label: string;
  readonly value: SheetValue;
}

export interface SheetTable {
  readonly caption?: string;
  readonly columns: readonly string[];
  readonly rows: ReadonlyArray<readonly string[]>;
  /** What it says when it has no rows. */
  readonly empty: string;
}

export interface SheetSection {
  readonly key: keyof typeof texts.sheet.sections;
  readonly title: string;
  /** The whole section is in dispute (the lab's «identity» or «components», V3-17). */
  readonly disputed: boolean;
  readonly rows: readonly SheetRow[];
  readonly tables: readonly SheetTable[];
}

export interface Sheet {
  readonly id: string;
  readonly name: string;
  readonly own: boolean;
  readonly ifra: IfraCardState;
  readonly sections: readonly SheetSection[];
}

const t = texts.sheet;
type Getter = (m: CatalogMaterial) => string | null;
/** A field of the record: its label, how it reads from one material, the column that may be in dispute, and its notes. */
interface Field {
  readonly label: string;
  readonly get: Getter;
  readonly column?: string;
  readonly notes?: (m: CatalogMaterial) => readonly (string | null)[];
}

const known = (text: string | null | undefined): string | null => (text === null || text === undefined || text.trim() === "" ? null : text);
const list = (items: readonly string[]): string | null => (items.length ? items.join(" · ") : null);
const amountText = (a: Amount): string => {
  switch (a.kind) {
    case "exact":
      return t.amount.exact(percent(a.value));
    case "max":
      return t.amount.max(percent(a.value));
    case "range":
      return t.amount.range(percent(a.min), percent(a.max));
    case "unknown":
      return t.amount.unknown;
  }
};

/** The fields of each section, in order: the list the designed card will read too. */
function fieldsOf(catalog: Catalog): Readonly<Record<"identity" | "bottle" | "smell" | "physical" | "notes", readonly Field[]>> {
  const f = t.fields;
  return {
    identity: [
      { label: f.aliases, get: (m) => list(m.aliases) },
      {
        label: f.abbreviation,
        get: (m) => known(m.abbreviation),
        notes: (m) => [m.abbreviationOrigin ? t.abbreviationOrigin[m.abbreviationOrigin] : null],
      },
      { label: f.cas, get: (m) => known(m.cas), column: "cas" },
      { label: f.otherCas, get: (m) => list(m.otherCas), column: "other_cas" },
      { label: f.species, get: (m) => known(m.species), column: "species" },
      { label: f.part, get: (m) => known(m.part) },
      { label: f.process, get: (m) => known(m.process) },
      { label: f.chemotype, get: (m) => known(m.chemotype) },
      { label: f.inci, get: (m) => known(m.inci) },
      { label: f.form, get: (m) => known(m.form) },
      { label: f.origin, get: (m) => known(m.origin) },
      { label: f.house, get: (m) => known(m.house), column: "house" },
      { label: f.code, get: (m) => known(m.code) },
      { label: f.synthesis, get: (m) => (m.synthesis ? t.synthesis[m.synthesis] : null) },
      { label: f.isomers, get: (m) => known(m.isomers), column: "isomers" },
      { label: f.category, get: (m) => (m.categoryId ? (catalog.categories.get(m.categoryId)?.name ?? null) : null) },
      { label: f.solvent, get: (m) => (m.solvent ? t.yes : null) },
    ],
    bottle: [
      { label: f.supplier, get: (m) => known(m.supplier) },
      { label: f.product, get: (m) => known(m.product) },
      { label: f.productUrl, get: (m) => known(m.productUrl) },
      { label: f.grade, get: (m) => known(m.grade) },
      { label: f.purity, get: (m) => (m.purity ? percent(m.purity) : null) },
    ],
    smell: [
      { label: f.family, get: (m) => (m.family ? t.families[m.family] : null), column: "family" },
      { label: f.color, get: (m) => known(m.color) },
      { label: f.familyDetail, get: (m) => known(m.familyDetail), column: "family_detail" },
      { label: f.facets, get: (m) => known(m.facets) },
      { label: f.odorTarget, get: (m) => known(m.odorTarget) },
      { label: f.tier, get: (m) => (m.tier ? t.tiers[m.tier] : null), column: "tier" },
      {
        label: f.tenacity,
        get: (m) => (m.tenacityHours ? t.hours(decimal(m.tenacityHours, 1)) : null),
        column: "tenacity_hours",
        notes: (m) => [m.tenacitySource ? t.from(m.tenacitySource) : null],
      },
      {
        label: f.evolution,
        get: (m) => (m.evolution.some((e) => e !== null) ? m.evolution.map((e, i) => `${t.evolution[i]}: ${e ?? "?"}`).join(" · ") : null),
      },
      { label: f.strength, get: (m) => (m.strength ? t.strengths[m.strength] : null), column: "strength" },
      { label: f.threshold, get: (m) => known(m.threshold), column: "threshold" },
      { label: f.diffusion, get: (m) => known(m.diffusion) },
      { label: f.blendEffect, get: (m) => known(m.blendEffect) },
      { label: f.role, get: (m) => known(m.role) },
      { label: f.recommendedDilution, get: (m) => known(m.recommendedDilution) },
      { label: f.cost, get: (m) => known(m.cost) },
      { label: f.handling, get: (m) => known(m.handling) },
    ],
    physical: [
      { label: f.state, get: (m) => known(m.physical.state), column: "physical_state" },
      { label: f.appearance, get: (m) => known(m.physical.appearance) },
      { label: f.stains, get: (m) => known(m.physical.stains) },
      { label: f.solubility, get: (m) => known(m.physical.solubility), column: "solubility" },
      { label: f.density, get: (m) => (m.physical.density ? t.density(decimal(m.physical.density)) : null), column: "density" },
      { label: f.meltingPoint, get: (m) => (m.physical.meltingPointC ? t.celsius(decimal(m.physical.meltingPointC, 1)) : null), column: "melting_point_c" },
      { label: f.formula, get: (m) => known(m.physical.formula) },
      { label: f.molecularWeight, get: (m) => (m.physical.molecularWeight ? t.molar(decimal(m.physical.molecularWeight, 2)) : null), column: "molecular_weight" },
      { label: f.vaporPressure, get: (m) => known(m.physical.vaporPressure) },
      { label: f.stability, get: (m) => known(m.physical.stability) },
      { label: f.incompatibilities, get: (m) => known(m.physical.incompatibilities) },
      { label: f.physicalSources, get: (m) => known(m.physical.sources) },
    ],
    notes: [
      { label: f.notes, get: (m) => known(m.notes) },
      { label: f.sources, get: (m) => known(m.sources) },
      { label: f.confidence, get: (m) => (m.confidence ? t.confidences[m.confidence] : null) },
    ],
  };
}

/** The standards behind an engine's substance key («std:IFRA_STD_023», «std:furocumarinas@…»): «STD 023 Citral». */
function standardLabel(layer: IfraLayer, key: string): string {
  const group = key.replace(/^std:/, "").replace(/@.*$/, "");
  const named = [...layer.standards.values()].filter((s) => s.groupKey === group || s.code === group);
  return named.length ? named.map((s) => `STD ${s.code.split("_").pop()} ${s.name}`).join(" / ") : group;
}

export function sheetOf(catalog: Catalog, layer: IfraLayer, ifra: IfraData, id: string): Sheet {
  const { material, chain, components } = effective(catalog, id);
  const own = material.ownerId !== null;
  const version = own && material.basedOnId !== null;
  const yours = (m: CatalogMaterial) => version && m === material;
  const disputedIn = (m: CatalogMaterial, column: string | undefined) => column !== undefined && m.disputedFields.includes(column);

  const valueOf = (field: Field): SheetValue => {
    const values = chain.map((m) => field.get(m));
    const at = values.findIndex((v) => v !== null);
    if (at < 0) return { text: null, notes: [], yours: false, disputed: chain.some((m) => disputedIn(m, field.column)) };
    const m = chain[at];
    // Yours only when your version says something its common material does not: the same value is inherited.
    const mine = yours(m) && values.slice(at + 1).find((v) => v !== null) !== values[at];
    const notes = (field.notes?.(m) ?? []).filter((n): n is string => n !== null);
    return { text: values[at], notes: mine ? [...notes, t.yours] : notes, yours: mine, disputed: disputedIn(m, field.column) };
  };
  const rowsOf = (fields: readonly Field[]): SheetRow[] => fields.map((field) => ({ label: field.label, value: valueOf(field) }));
  /** The rows of a list along the chain, the version's marked as yours in their last column. */
  const alongChain = <T>(get: (m: CatalogMaterial) => readonly T[], row: (item: T) => string[]): string[][] =>
    chain.flatMap((m) => get(m).map((item) => {
      const cells = row(item);
      return yours(m) ? [...cells.slice(0, -1), `${cells[cells.length - 1]} (${t.yours})`] : cells;
    }));
  const anyDisputed = (key: string) => chain.some((m) => m.disputedFields.includes(key));
  const fields = fieldsOf(catalog);
  const c = t.columns;
  const section = (key: SheetSection["key"], rows: SheetRow[], tables: SheetTable[] = [], disputed = false): SheetSection => ({
    key,
    title: t.sections[key],
    disputed,
    rows,
    tables,
  });

  // ------------------------------------------------------------ identity
  const base = version ? catalog.materials.get(material.basedOnId!) : undefined;
  const identity = section(
    "identity",
    [
      { label: t.fields.name, value: { text: material.name, notes: [], yours: false, disputed: false } },
      { label: t.fields.kind, value: { text: texts.kinds[material.kind], notes: [], yours: false, disputed: false } },
      {
        label: t.fields.whose,
        value: { text: own ? (base ? texts.glossary.versionOf(base.name) : t.whose.own) : t.whose.common, notes: [], yours: false, disputed: false },
      },
      ...rowsOf(fields.identity),
    ],
    [],
    anyDisputed("identity"),
  );

  // ------------------------------------------------------------ composition and IFRA
  const componentName = (x: Component) =>
    x.componentId ? (catalog.materials.get(x.componentId)?.name ?? x.componentId) : [x.componentName, x.componentCas].filter((s) => s).join(" · ");
  const composition = section(
    "composition",
    [],
    [
      {
        columns: [c.component, c.amount, c.authority, c.source],
        rows: components.map((x) => [componentName(x), amountText(x.amount), t.authority[x.authority], x.source]),
        empty: t.noComponents,
      },
    ],
    anyDisputed("components"),
  );

  const card = ifraCard(catalog, layer, id);
  const engine = ifra.materials.get(id);
  const stateText = card.state === "requirement" || (card.state === "ceiling" && card.requirement)
    ? `${texts.ifraState[card.state]} · ${card.what ? `${card.what}: ` : ""}${texts.requirementState[card.requirement!]}`
    : texts.ifraState[card.state];
  const substanceRows = (engine?.substances ?? []).map((s) => {
    const substance = ifra.substances.get(s.key);
    const inside = s.fraction ? percent(s.fraction) : s.upper ? t.upTo(percent(s.upper)) : t.whole;
    const limit = !substance
      ? t.unknown
      : substance.supplier
        ? t.supplierLimit(percent(substance.limit), substance.supplier)
        : substance.limit.isZero()
          ? t.regulationKind.prohibited
          : t.limit(percent(substance.limit), substance.amendment);
    // A standard by its code and name; a maker's ceiling or a «prohibited as such», by the name the adapter gives it.
    const label = s.key.startsWith("std:") ? standardLabel(layer, s.key) : (substance?.name ?? s.key);
    return [label, inside, substance?.combined ? `${limit}; ${t.combined}` : limit];
  });
  const manufacturer = alongChain(
    (m) => m.regulations,
    (r) => [
      r.regime === "ifra" ? "IFRA" : t.manufacturer,
      r.category ?? t.allCategories,
      r.kind === "max" && r.maxValue ? t.regulationKind.max(percent(r.maxValue)) : r.kind === "prohibited" ? t.regulationKind.prohibited : t.regulationKind.requirement(r.requirement ?? ""),
      t.authority[r.authority],
      r.source,
    ],
  );
  const ifraSection = section(
    "ifra",
    [
      { label: t.fields.ifraState, value: { text: stateText, notes: [texts.ifraStateHelp[card.state]], yours: false, disputed: false } },
      ...(engine?.conditions.length ? [{ label: t.conditions, value: { text: engine.conditions.join(" · "), notes: [], yours: false, disputed: false } }] : []),
      ...(engine?.assumed?.length ? [{ label: t.assumed, value: { text: engine.assumed.join(" · "), notes: [], yours: false, disputed: false } }] : []),
      ...(engine?.pending?.length ? [{ label: t.pending, value: { text: engine.pending.join(" · "), notes: [], yours: false, disputed: false } }] : []),
      ...rowsOf([{ label: t.fields.ifraUnverified, get: (m) => known(m.ifraUnverified), column: "ifra_unverified" }]),
    ],
    [
      { columns: [c.standard, c.inMaterial, c.limit], rows: substanceRows, empty: texts.ifraStateHelp[card.state] },
      { caption: t.manufacturer, columns: [c.regime, c.category, c.rule, c.authority, c.source], rows: manufacturer, empty: t.noRows },
    ],
  );

  // ------------------------------------------------------------ the lists
  const doses = section("doses", [], [
    {
      columns: [c.min, c.typical, c.max, c.basis, c.authority, c.disputed, c.notes, c.source],
      rows: alongChain(
        (m) => m.doses,
        (d) => [
          d.min ? percent(d.min) : "—",
          d.typical ? percent(d.typical) : "—",
          d.max ? percent(d.max) : "—",
          t.basis[d.basis],
          t.authority[d.authority],
          d.disputed ? t.disputed : "",
          d.notes ?? "",
          d.source,
        ],
      ),
      empty: t.noRows,
    },
  ]);
  const descriptors = section("descriptors", [], [
    { columns: [c.text, c.source], rows: alongChain((m) => m.descriptors, (d) => [d.text, d.source]), empty: t.noRows },
  ]);
  const relations = section("relations", [], [
    {
      columns: [c.kind, c.other, c.note, c.source],
      rows: alongChain(
        (m) => m.relations,
        (r) => [t.relationKind[r.kind], r.otherId ? (catalog.materials.get(r.otherId)?.name ?? r.otherText ?? "") : (r.otherText ?? ""), r.note ?? "", r.sources ?? ""],
      ),
      empty: t.noRows,
    },
  ]);
  const references = section("references", [], [
    { columns: [c.perfume, c.house, c.note, c.source], rows: alongChain((m) => m.references, (r) => [r.perfume, r.house ?? "", r.note ?? "", r.sources ?? ""]), empty: t.noRows },
  ]);

  // ------------------------------------------------------------ yours: the bottle and the lab
  const mine: SheetSection[] = [];
  if (own) {
    mine.push(section("bottle", rowsOf(fields.bottle).map((r) => (r.label === t.fields.productUrl && r.value.text ? { ...r, value: { ...r.value, link: r.value.text } } : r))));
    const evaluation = catalog.evaluations.get(id);
    const plain = (label: string, text: string | null | undefined): SheetRow => ({ label, value: { text: known(text), notes: [], yours: true, disputed: false } });
    mine.push(
      section(
        "lab",
        [
          plain(t.fields.evaluationStatus, evaluation?.status),
          plain(t.fields.smellingTip, evaluation?.smellingTip),
          plain(t.fields.reading, evaluation?.reading),
          plain(t.fields.sheet, evaluation?.sheet),
          plain(t.fields.axes, list(catalog.axes.get(id) ?? [])),
        ],
        [
          {
            caption: t.dilutions,
            columns: [c.fraction, c.solvent, c.madeOn, c.description],
            rows: (catalog.dilutions.get(id) ?? []).map((d) => [percent(d.fraction), d.solvent ?? "", d.madeOn ?? "", d.description ?? ""]),
            empty: t.noRows,
          },
        ],
      ),
    );
  }

  return {
    id,
    name: material.name,
    own,
    ifra: card,
    sections: [
      identity,
      ...mine.filter((s) => s.key === "bottle"),
      section("smell", rowsOf(fields.smell)),
      section("physical", rowsOf(fields.physical)),
      composition,
      ifraSection,
      doses,
      descriptors,
      relations,
      references,
      ...mine.filter((s) => s.key === "lab"),
      section("notes", rowsOf(fields.notes)),
    ],
  };
}
