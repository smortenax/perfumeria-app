import { Ratio } from "../core/arith/ratio";
import type { Catalog, CatalogMaterial } from "../db/catalog";

/**
 * Your materials as plain data (V3-80, «solo datos»): two CSV tables, one row per material of yours
 * and one per dilution. A gap is an empty cell, never a 0; every figure has its unit in the header
 * and a decimal point. What your version leaves empty is read from the common material it is based
 * on, as the sheet shows it. Pure, so it is tested without a screen.
 */

const cell = (value: string | null | undefined): string => {
  const text = value ?? "";
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csv = (header: readonly string[], rows: readonly (readonly (string | null)[])[]) =>
  [header.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n") + "\n";

/** An exact figure as a decimal with a point and no trailing zeros: 0.1 → «10» for a percent. */
export function decimalOf(value: Ratio | null, places = 6): string | null {
  if (value === null) return null;
  return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
const percentOf = (fraction: Ratio | null) => decimalOf(fraction === null ? null : fraction.mul(Ratio.of(100n)));
const gramsOf = (ug: bigint | null) => decimalOf(ug === null ? null : Ratio.of(ug, 1_000_000n), 6);

export const MATERIAL_COLUMNS = [
  "id",
  "name",
  "abbreviation",
  "kind",
  "based_on",
  "cas",
  "species",
  "part",
  "process",
  "manufacturer",
  "shop",
  "product",
  "page",
  "lot",
  "purchased_on",
  "origin",
  "origin_region",
  "purity_pct",
  "status",
  "i_have_it",
  "family",
  "tenacity_h",
] as const;

export const DILUTION_COLUMNS = ["id", "material_id", "material", "name", "fraction_pct", "diluents", "material_weighed_g", "made_on", "made_from", "archived"] as const;

/** The materials that are yours: not the common ones, nor the frozen formulas (they are formulas). */
const own = (catalog: Catalog) =>
  [...catalog.materials.values()].filter((m) => m.ownerId !== null && m.kind !== "frozen").sort((a, b) => a.name.localeCompare(b.name, "es"));

export function materialsCsv(catalog: Catalog): string {
  const rows = own(catalog).map((m) => {
    const base: CatalogMaterial | undefined = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
    const pick = <K extends keyof CatalogMaterial>(key: K): CatalogMaterial[K] | null => m[key] ?? base?.[key] ?? null;
    return [
      m.id,
      m.name,
      pick("abbreviation"),
      m.kind,
      base?.name ?? null,
      pick("cas"),
      pick("species"),
      pick("part"),
      pick("process"),
      pick("house"),
      m.supplier,
      m.product,
      m.productUrl,
      m.lot,
      m.purchasedOn,
      pick("origin"),
      m.originRegion,
      percentOf(pick("purity")),
      m.status,
      catalog.have.has(m.id) ? "yes" : "no",
      pick("family"),
      decimalOf(pick("tenacityHours")),
    ];
  });
  return csv(MATERIAL_COLUMNS, rows);
}

export function dilutionsCsv(catalog: Catalog): string {
  const name = (id: string) => catalog.materials.get(id)?.name ?? "";
  const rows = own(catalog).flatMap((m) =>
    [...(catalog.dilutions.get(m.id) ?? [])]
      .sort((a, b) => b.fraction.cmp(a.fraction) || (a.madeOn ?? "").localeCompare(b.madeOn ?? ""))
      .map((d) => [
        d.id,
        m.id,
        m.name,
        d.label,
        percentOf(d.fraction),
        // Each diluent with its share of the bottle: «DPG 90; Ethanol 10» (an old bottle may only say it in words).
        d.diluents.length > 0 ? d.diluents.map((x) => `${name(x.diluentId)} ${percentOf(x.fraction)}`).join("; ") : d.solvent,
        gramsOf(d.materialMassUg),
        d.madeOn,
        d.sourceDilutionId,
        d.archivedAt ? "yes" : "no",
      ]),
  );
  return csv(DILUTION_COLUMNS, rows);
}
