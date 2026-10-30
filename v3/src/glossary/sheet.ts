import type { IfraData } from "../core/ifra";
import type { Amount, Catalog, CatalogMaterial, Component } from "../db/catalog";
import type { IfraLayer } from "../db/ifra-layer";
import { effective, ifraCard, type IfraCardState } from "../db/to-ifra";
import { texts } from "../i18n/en";
import { decimal, percent } from "./format";

/**
 * A material's sheet (plan v3, step 6.2; V3-47): for now a plain data sheet, sections of «field:
 * value» and tables, built from the lists of fields below. The designed card (V3-47, the AOM)
 * will replace the view, not this: every value comes from the record as it is (V3-41), with its
 * source and its base next to it, and what is not known says so (§1.2), never empty or zero.
 *
 * A version (V3-5) shows the common material's record with its own over it: each value comes from
 * the nearest of the chain that has it, and the version's own are marked as yours.
 *
 * The sheet shows what the material is and how it is used (the user, 2026-10-29: the colour and its
 * codes «debería estar entre los datos del material pero interno»). What the head already says
 * (name, type, abbreviation, family, strength, note, hours on a blotter) is not repeated below it, and
 * what is the app's own (the family's colour, the fixed colour, where the abbreviation came from, the
 * solvent mark, a category named as the material) stays in the record and in the editor.
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
  /** A list read in one line («chypre, lemon, fougère»), each with its source's mark. */
  readonly items?: readonly SheetLine[];
}

/** One line of a list (a dose, a descriptor, a perfume) or one item of a row, with its source's mark (V3-86). */
export interface SheetLine {
  readonly text: string;
  readonly mark?: number;
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
  /** Each row's mark in «Sources» (V3-86), shown after its cell in column `markAt`. */
  readonly marks?: readonly number[];
  readonly markAt?: number;
}

export interface SheetSection {
  readonly key: keyof typeof texts.sheet.sections;
  readonly title: string;
  /** The whole section is in dispute (the lab's «identity» or «components», V3-17). */
  readonly disputed: boolean;
  readonly rows: readonly SheetRow[];
  readonly tables: readonly SheetTable[];
  /** The mark of a source for the whole section (the physical data's), in «Sources». */
  readonly mark?: number;
  /** A list, one line each (the user, 2026-10-30: «en general más de una línea es ilegible»). */
  readonly lines?: readonly SheetLine[];
  /** What it says when it has nothing to show. */
  readonly empty?: string;
}

/**
 * Where a figure or a row comes from (V3-86): listed together at the end of the sheet, folded, each
 * with the mark that its figure carries. In the order the sheet reads.
 */
export interface SheetSource {
  readonly mark: number;
  /** What it backs: «Strength», «Composition · Coumarin». */
  readonly what: string;
  /** The source in its own words; null when nobody says it. */
  readonly text: string | null;
  /** Who stands behind the figure (lot, product, literature…). */
  readonly authority?: string;
  /** V3-17: the sources disagree on it. */
  readonly disputed?: boolean;
  readonly note?: string;
  /** It comes from your version. */
  readonly yours?: boolean;
}

export interface Sheet {
  readonly id: string;
  readonly name: string;
  readonly own: boolean;
  readonly ifra: IfraCardState;
  readonly sections: readonly SheetSection[];
  /** The marks of the head's figures, or null when the figure has no source (it says so there). */
  readonly figures: { readonly strength: number | null; readonly hours: number | null };
  readonly sources: readonly SheetSource[];
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
/** A long text cut to name its line in «Sources»: the table shows it whole. */
const clip = (text: string, max = 48): string => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);
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
function fieldsOf(catalog: Catalog): Readonly<Record<"identity" | "bottle" | "smell" | "physical", readonly Field[]>> {
  const f = t.fields;
  return {
    identity: [
      { label: f.aliases, get: (m) => list(m.aliases) },
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
    ],
    bottle: [
      { label: f.supplier, get: (m) => known(m.supplier) },
      { label: f.product, get: (m) => known(m.product) },
      { label: f.productUrl, get: (m) => known(m.productUrl) },
      { label: f.grade, get: (m) => known(m.grade) },
      { label: f.purity, get: (m) => (m.purity ? percent(m.purity) : null) },
      { label: f.lot, get: (m) => known(m.lot) },
      { label: f.purchasedOn, get: (m) => known(m.purchasedOn) },
      { label: f.originRegion, get: (m) => known(m.originRegion) },
      { label: f.status, get: (m) => (m.status ? t.statuses[m.status] : null) },
    ],
    smell: [
      { label: f.familyDetail, get: (m) => known(m.familyDetail), column: "family_detail" },
      { label: f.facets, get: (m) => known(m.facets) },
      { label: f.odorTarget, get: (m) => known(m.odorTarget) },
      {
        label: f.evolution,
        get: (m) => (m.evolution.some((e) => e !== null) ? m.evolution.map((e, i) => `${t.evolution[i]}: ${e ?? "?"}`).join(" · ") : null),
      },
      { label: f.threshold, get: (m) => known(m.threshold), column: "threshold" },
      { label: f.diffusion, get: (m) => known(m.diffusion) },
      { label: f.blendEffect, get: (m) => known(m.blendEffect) },
      { label: f.role, get: (m) => (known(m.role) ? (t.roles[m.role as keyof typeof t.roles] ?? m.role) : null) },
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
    ],
  };
}

/** The standards behind an engine's substance key («std:IFRA_STD_023», «std:furocumarinas@…»): «STD 023 Citral». */
function standardLabel(layer: IfraLayer, key: string): string {
  const group = key.replace(/^std:/, "").replace(/@.*$/, "");
  const named = [...layer.standards.values()].filter((s) => s.groupKey === group || s.code === group);
  return named.length ? named.map((s) => `STD ${s.code.split("_").pop()} ${s.name}`).join(" / ") : group;
}

/**
 * The source of each figure of the sheet's head (V3-81, V3-86): the strength's and the hours on a
 * blotter's, each from the nearest of the chain that has the figure (your version, else its common
 * material). A figure without a source still shows; only its source reads «not stated».
 */
export function figureSources(material: CatalogMaterial, base: CatalogMaterial | undefined): { strength: string | null; hours: string | null } {
  const strengthFrom = material.strength ? material : base?.strength ? base : undefined;
  const hoursFrom = material.tenacityHours ? material : base?.tenacityHours ? base : undefined;
  return { strength: strengthFrom?.strengthSource ?? null, hours: hoursFrom?.tenacitySource ?? null };
}

export function sheetOf(catalog: Catalog, layer: IfraLayer, ifra: IfraData, id: string): Sheet {
  const { material, chain, components } = effective(catalog, id);
  const own = material.ownerId !== null;
  const version = own && material.basedOnId !== null;
  const yours = (m: CatalogMaterial) => version && m === material;
  const disputedIn = (m: CatalogMaterial, column: string | undefined) => column !== undefined && m.disputedFields.includes(column);
  const anyDisputed = (key: string) => chain.some((m) => m.disputedFields.includes(key));

  // The sources, numbered as the sheet reads (V3-86): each figure carries its mark.
  const sources: SheetSource[] = [];
  const cite = (source: Omit<SheetSource, "mark">): number => {
    sources.push({ ...source, mark: sources.length + 1 });
    return sources.length;
  };

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
  /**
   * A list along the chain as a table: each row, the version's marked as yours in its last column,
   * and its source in «Sources» with the row's mark after column `markAt`.
   */
  const listTable = <T>(
    get: (m: CatalogMaterial) => readonly T[],
    columns: readonly string[],
    row: (item: T) => string[],
    source: (item: T) => Omit<SheetSource, "mark" | "yours">,
    markAt: number,
    empty: string,
    caption?: string,
  ): SheetTable => {
    const rows: string[][] = [];
    const marks: number[] = [];
    for (const m of chain) {
      for (const item of get(m)) {
        const cells = row(item);
        rows.push(yours(m) ? [...cells.slice(0, -1), `${cells[cells.length - 1]} (${t.yours})`] : cells);
        marks.push(cite({ ...source(item), yours: yours(m) }));
      }
    }
    return { caption, columns, rows, marks, markAt, empty };
  };
  const fields = fieldsOf(catalog);
  const c = t.columns;
  const section = (key: SheetSection["key"], rows: SheetRow[], tables: SheetTable[] = [], disputed = false, mark?: number): SheetSection => ({
    key,
    title: t.sections[key],
    disputed,
    rows,
    tables,
    ...(mark ? { mark } : {}),
  });

  // ------------------------------------------------------------ the head's figures
  const base = material.basedOnId ? catalog.materials.get(material.basedOnId) : undefined;
  const h = texts.glossary.hero;
  const figureText = figureSources(material, base);
  const figures = {
    strength: figureText.strength ? cite({ what: h.strength, text: figureText.strength, disputed: anyDisputed("strength") }) : null,
    hours: figureText.hours ? cite({ what: h.strip, text: figureText.hours, disputed: anyDisputed("tenacity_hours") }) : null,
  };

  // ------------------------------------------------------------ identity, your bottle, odour and use
  const identity = section(
    "identity",
    [
      // Whose it is, only on yours: a common material is the rule.
      ...(own ? [{ label: t.fields.whose, value: { text: version && base ? texts.glossary.versionOf(base.name) : t.whose.own, notes: [], yours: false, disputed: false } }] : []),
      // The category only when it says more than the name: most are named as their material.
      ...rowsOf(fields.identity).filter((r) => !(r.label === t.fields.category && r.value.text?.trim().toLowerCase() === material.name.trim().toLowerCase())),
    ],
    [],
    anyDisputed("identity"),
  );
  const bottle = own
    ? [section("bottle", rowsOf(fields.bottle).map((r) => (r.label === t.fields.productUrl && r.value.text ? { ...r, value: { ...r.value, link: r.value.text } } : r)))]
    : [];
  const smell = section("smell", rowsOf(fields.smell));

  // ------------------------------------------------------------ physical: one source for the section
  const physicalSource = valueOf({ label: t.fields.physicalSources, get: (m) => known(m.physical.sources) });
  const physical = section(
    "physical",
    rowsOf(fields.physical),
    [],
    false,
    physicalSource.text ? cite({ what: t.sections.physical, text: physicalSource.text, yours: physicalSource.yours }) : undefined,
  );

  // ------------------------------------------------------------ composition and IFRA
  const componentName = (x: Component) =>
    x.componentId ? (catalog.materials.get(x.componentId)?.name ?? x.componentId) : [x.componentName, x.componentCas].filter((s) => s).join(" · ");
  const composition = section(
    "composition",
    [],
    [
      {
        columns: [c.component, c.amount],
        rows: components.map((x) => [componentName(x), amountText(x.amount)]),
        marks: components.map((x) => cite({ what: `${t.sections.composition} · ${componentName(x)}`, text: x.source, authority: t.authority[x.authority] })),
        markAt: 1,
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
  const ifraSection = section(
    "ifra",
    [
      { label: t.fields.ifraState, value: { text: stateText, notes: [texts.ifraStateHelp[card.state]], yours: false, disputed: false } },
      ...(engine?.conditions.length ? [{ label: t.conditions, value: { text: engine.conditions.join(" · "), notes: [], yours: false, disputed: false } }] : []),
      ...(engine?.assumed?.length ? [{ label: t.assumed, value: { text: engine.assumed.join(" · "), notes: [], yours: false, disputed: false } }] : []),
      ...(engine?.pending?.length ? [{ label: t.pending, value: { text: engine.pending.join(" · "), notes: [], yours: false, disputed: false } }] : []),
      // Only when someone says it: empty in every common material.
      ...rowsOf([{ label: t.fields.ifraUnverified, get: (m) => known(m.ifraUnverified), column: "ifra_unverified" }]).filter((r) => r.value.text !== null),
    ],
    [
      { columns: [c.standard, c.inMaterial, c.limit], rows: substanceRows, empty: texts.ifraStateHelp[card.state] },
      listTable(
        (m) => m.regulations,
        [c.regime, c.category, c.rule],
        (r) => [
          r.regime === "ifra" ? "IFRA" : t.manufacturer,
          r.category ?? t.allCategories,
          r.kind === "max" && r.maxValue ? t.regulationKind.max(percent(r.maxValue)) : r.kind === "prohibited" ? t.regulationKind.prohibited : t.regulationKind.requirement(r.requirement ?? ""),
        ],
        (r) => ({ what: `${t.manufacturer} · ${r.category ?? t.allCategories}`, text: r.source, authority: t.authority[r.authority] }),
        2,
        t.noRows,
        t.manufacturer,
      ),
    ],
  );

  // ------------------------------------------------------------ the lists
  // ------------------------------------------------------------ the lists, one line each (the user, 2026-10-30)
  /** A list along the chain, one line per item, the version's marked as yours, each with its source's mark. */
  const linesOf = <T>(get: (m: CatalogMaterial) => readonly T[], text: (item: T) => string, source: (item: T) => Omit<SheetSource, "mark" | "yours">): SheetLine[] =>
    chain.flatMap((m) => get(m).map((item) => ({ text: yours(m) ? `${text(item)} (${t.yours})` : text(item), mark: cite({ ...source(item), yours: yours(m) }) })));
  const listSection = (key: SheetSection["key"], rows: SheetRow[], lines: SheetLine[]): SheetSection => ({ ...section(key, rows), lines, empty: t.noRows });

  // A dose as it reads: «0,5 % – 10 % of the concentrate, typically 5 %».
  const doseText = (d: CatalogMaterial["doses"][number]) => {
    const range = d.min && d.max ? t.amount.range(percent(d.min), percent(d.max)) : d.max ? t.amount.max(percent(d.max)) : d.min ? t.atLeast(percent(d.min)) : null;
    const typical = d.typical ? (range ? t.typically(percent(d.typical)) : percent(d.typical)) : null;
    return [[range, typical].filter((x) => x).join(", "), t.doseBasis[d.basis]].filter((x) => x).join(" ");
  };
  const doses = listSection("doses", [], linesOf((m) => m.doses, doseText, (d) => ({
    what: `${t.sections.doses} · ${doseText(d)}`,
    text: d.source,
    authority: t.authority[d.authority],
    disputed: d.disputed,
    ...(d.notes ? { note: d.notes } : {}),
  })));
  const descriptors = listSection("descriptors", [], linesOf((m) => m.descriptors, (d) => d.text, (d) => ({ what: clip(d.text), text: d.source })));
  // What it goes with, one row per kind: «Blends with: chypre, lemon, fougère» (the user, 2026-10-30); a note goes with its source.
  const otherOf = (r: CatalogMaterial["relations"][number]) => (r.otherId ? (catalog.materials.get(r.otherId)?.name ?? r.otherText ?? "") : (r.otherText ?? ""));
  const relationItems = new Map<CatalogMaterial["relations"][number]["kind"], SheetLine[]>();
  for (const m of chain) {
    for (const r of m.relations) {
      const item = { text: yours(m) ? `${otherOf(r)} (${t.yours})` : otherOf(r), mark: cite({ what: `${t.relationKind[r.kind]} ${otherOf(r)}`, text: r.sources ?? null, yours: yours(m), ...(r.note ? { note: r.note } : {}) }) };
      relationItems.set(r.kind, [...(relationItems.get(r.kind) ?? []), item]);
    }
  }
  const relations = listSection(
    "relations",
    [...relationItems].map(([kind, items]) => ({ label: t.relationRows[kind], value: { text: items.map((x) => x.text).join(", "), items, notes: [], yours: false, disputed: false } })),
    [],
  );
  const references = listSection("references", [], linesOf((m) => m.references, (r) => [r.perfume, r.house].filter((x) => x).join(" · ") + (r.note ? ` — ${r.note}` : ""), (r) => ({ what: r.perfume, text: r.sources ?? null })));

  // ------------------------------------------------------------ yours: the lab
  const lab: SheetSection[] = [];
  if (own) {
    const evaluation = catalog.evaluations.get(id);
    const plain = (label: string, text: string | null | undefined): SheetRow => ({ label, value: { text: known(text), notes: [], yours: true, disputed: false } });
    lab.push(
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

  // ------------------------------------------------------------ the record's own: your notes stay; the rest, to «Sources»
  const notes = valueOf({ label: t.fields.notes, get: (m) => known(m.notes) });
  const notesFrom = chain.find((m) => known(m.notes) !== null);
  const yourNotes = notesFrom !== undefined && notesFrom.ownerId !== null;
  const recordSources = valueOf({ label: t.fields.sources, get: (m) => known(m.sources) });
  if (recordSources.text) cite({ what: t.fields.sources, text: recordSources.text, yours: recordSources.yours });
  const confidence = valueOf({ label: t.fields.confidence, get: (m) => (m.confidence ? t.confidences[m.confidence] : null) });
  if (confidence.text) cite({ what: t.fields.confidence, text: confidence.text, yours: confidence.yours });
  // A common material's notes are its research diary: where each datum was looked for.
  if (notes.text && !yourNotes) cite({ what: t.researchNotes, text: notes.text });

  const sections = [identity, ...bottle, smell, physical, composition, ifraSection, doses, descriptors, relations, references, ...lab];
  // What the sources disagree on (V3-17), said once, with the sources: the head's figures, the rows and whole sections.
  const head: Array<[string, string]> = [["family", h.family], ["strength", h.strength], ["tenacity_hours", h.strip], ["tier", h.note]];
  const disputed = [
    ...head.filter(([column]) => anyDisputed(column)).map(([, label]) => label),
    ...sections.flatMap((x) => [...(x.disputed ? [x.title] : []), ...x.rows.filter((r) => r.value.disputed).map((r) => r.label)]),
  ];
  if (disputed.length) cite({ what: t.inDispute, text: disputed.join(" · ") });

  return {
    id,
    name: material.name,
    own,
    ifra: card,
    sections: [...sections, ...(yourNotes ? [section("yourNotes", [{ label: t.fields.notes, value: notes }])] : [])],
    figures,
    sources,
  };
}
