import { Ratio } from "../core/arith/ratio";
import type { Composition } from "../core/compose";
import { formatPercent } from "../core/display";
import { marginOf, type IfraBase, type IfraData, type IfraReport } from "../core/ifra";
import type { Formula } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { texts } from "../i18n/es";
import { dilutionText, massText } from "./format";

const t = texts.composition;

/**
 * What one line of the composition carries of its IFRA ceiling (P57), in one base (P58).
 *
 * - none: nothing regulated is poured by this material, or it is a diluent with nothing to check.
 *   Nothing is shown: an absence of ceilings is not a figure;
 * - unchecked: no IFRA data (provisional, not in the glossary, unchecked). No figure, never zero
 *   and never green (§1.2): the line already carries its «sin comprobar»;
 * - reading: the closest ceiling and how much more of the material fits.
 */
export type LineIfra =
  | { readonly kind: "none" }
  | { readonly kind: "unchecked" }
  | {
      readonly kind: "reading";
      readonly base: IfraBase;
      /**
       * Of the regulated substances the material adds to, the one closest to its ceiling in this
       * base: the whole substance in the worst case (`worstUg`, wherever it comes from, §5.3) over
       * the base and over its ceiling. `used` is null for a substance with a ceiling of zero that is
       * present: prohibited, past any ceiling. Null when the material adds to none in the data.
       */
      readonly nearest: { readonly key: string; readonly name: string; readonly limit: Ratio; readonly used: Ratio | null } | null;
      /** What the material poured pure can still take, in this base and in the worst case. */
      readonly margin:
        | { readonly kind: "unbounded" }
        | { readonly kind: "bounded"; readonly pouredUg: Ratio; readonly limitedBy: string; readonly limitedByName: string };
      /** The figures could be optimistic: something in the bottle or in this material cannot be checked (§1.2). */
      readonly partial: boolean;
    };

/**
 * How a material takes part in the check, as `lookup` in the core decides it (§5.2): a diluent of
 * the app without a standard is left out; no data is unchecked; the rest is checked.
 */
function stateOf(material: Material, data: IfraData): "skip" | "unchecked" | "checked" {
  if (material.solvent && material.kind === "base" && !data.materials.has(material.key)) {
    return "skip";
  }
  const info = material.kind === "provisional" ? undefined : data.materials.get(material.key);
  return !info || info.status === "unchecked" ? "unchecked" : "checked";
}

/**
 * The IFRA line of every material in the bottle, for one base (P57): by the key of the material.
 * Pure and exact: the report is worked out once and read here, and the margin is the one of the
 * material poured pure, without diluent (`fraction` 1). The composition and the report must be the
 * ones of the same frame as `upTo`.
 *
 * `base` is one of the report's readings (P58); any other falls back to the base of the report.
 */
export function ifraOfLines(
  formula: Formula,
  data: IfraData,
  report: IfraReport,
  composition: Composition,
  base?: IfraBase,
  upTo?: number,
): ReadonlyMap<string, LineIfra> {
  const reading = report.readings.find((r) => r.base === base) ?? report.readings.find((r) => r.base === report.base) ?? report.readings[report.readings.length - 1];
  const out = new Map<string, LineIfra>();
  for (const { material } of composition.parts) {
    const state = stateOf(material, data);
    if (state === "skip") {
      out.set(material.key, { kind: "none" });
      continue;
    }
    if (state === "unchecked") {
      out.set(material.key, { kind: "unchecked" });
      continue;
    }

    let nearest: Extract<LineIfra, { kind: "reading" }>["nearest"] = null;
    for (const check of report.checks) {
      const source = check.sources.find((s) => s.material.key === material.key);
      // A material that adds nothing of a substance is not on it (a declared zero, for instance).
      if (!source || source.worstUg.isZero()) {
        continue;
      }
      const { substance } = check;
      // What the substance adds up to in the bottle, wherever it comes from, over the base and the ceiling.
      const used =
        substance.limit.isZero() || reading.finalUg.isZero() ? null : check.worstUg.div(reading.finalUg).div(substance.limit);
      const closer =
        nearest === null ||
        (nearest.used !== null && (used === null || used.gt(nearest.used)));
      if (closer) {
        nearest = { key: substance.key, name: substance.name, limit: substance.limit, used };
      }
    }

    const margin = marginOf(formula, data, { material, fraction: Ratio.ONE, diluent: null }, reading.base, upTo);
    if (margin.kind === "unknown") {
      out.set(material.key, { kind: "unchecked" });
      continue;
    }
    if (margin.kind === "unbounded" && nearest === null) {
      out.set(material.key, { kind: "none" });
      continue;
    }
    out.set(material.key, {
      kind: "reading",
      base: reading.base,
      nearest,
      margin:
        margin.kind === "unbounded"
          ? { kind: "unbounded" }
          : {
              kind: "bounded",
              pouredUg: margin.pouredUg,
              limitedBy: margin.limitedBy,
              limitedByName: data.substances.get(margin.limitedBy)?.name ?? margin.limitedBy,
            },
      partial: margin.partial || report.partial,
    });
  }
  return out;
}

const TENTH_MG = Ratio.of(100);

/** The share of a ceiling to read: whole percents from 10 %, one decimal below, and «< 0,1 %» for a trace. */
export function usedText(used: Ratio): string {
  if (used.isZero()) {
    return formatPercent(Ratio.ZERO, 0);
  }
  if (used.lt(Ratio.of(1, 1_000))) {
    return t.ifraTrace;
  }
  return formatPercent(used, used.lt(Ratio.of(1, 10)) ? 1 : 0);
}

/** What still fits, as a mass to read: «1,2 g», «340 mg», and «< 0,1 mg» for what is left but does not weigh. */
export function roomText(pouredUg: Ratio): string {
  if (pouredUg.sign() > 0 && pouredUg.lt(TENTH_MG)) {
    return t.ifraLessThanTenthMg;
  }
  return massText(pouredUg);
}

export type IfraTone = "neutral" | "amber" | "red";

/** One line of the composition's IFRA, ready to draw: `share` and `room` are null when there is nothing to say of them. */
export interface LineIfraView {
  readonly share: string | null;
  readonly room: string | null;
  readonly tone: IfraTone;
  readonly title: string;
}

/**
 * How a line says its IFRA (P57): the share of its closest ceiling and what still fits, and never
 * in green (§1.2). Red from the ceiling (100 % or more, or no margin left); amber from 80 %, or
 * whenever the figures could be optimistic, which are then bounds («≥», «≤»), not values.
 */
export function describeLineIfra(line: LineIfra | undefined): LineIfraView | null {
  if (!line || line.kind !== "reading") {
    return null;
  }
  const { nearest, margin, partial } = line;
  const over = nearest !== null && (nearest.used === null || !nearest.used.lt(Ratio.ONE));
  const exhausted = margin.kind === "bounded" && margin.pouredUg.isZero();
  const tone: IfraTone = over || exhausted ? "red" : partial || (nearest?.used?.cmp(Ratio.of(4, 5)) ?? -1) >= 0 ? "amber" : "neutral";

  const bound = (text: string, sign: string) => (partial ? `${sign} ${text}` : text);
  const share = nearest === null ? null : nearest.used === null ? t.ifraProhibitedShort : bound(usedText(nearest.used), "≥");
  const room =
    margin.kind === "unbounded" ? t.ifraNoCeiling : exhausted ? t.ifraNoRoom : t.ifraRoom(bound(roomText(margin.pouredUg), "≤"));

  const parts: string[] = [];
  if (nearest !== null) {
    parts.push(
      nearest.used === null
        ? t.ifraTitleProhibited(nearest.name, t.ifraBases[line.base])
        : t.ifraTitleShare(usedText(nearest.used), nearest.name, dilutionText(nearest.limit), t.ifraBases[line.base]),
    );
  }
  parts.push(
    margin.kind === "unbounded"
      ? t.ifraTitleUnbounded
      : exhausted
        ? t.ifraTitleNoRoom(margin.limitedByName)
        : t.ifraTitleRoom(roomText(margin.pouredUg), margin.limitedByName),
  );
  if (partial) {
    parts.push(t.ifraTitlePartial);
  }
  return { share, room, tone, title: parts.join(" ") };
}

/**
 * The lines the detail of a material adds to say its IFRA (P57): the substance closest to its
 * ceiling, and what still fits with the substance that runs out first. Empty when there is
 * nothing to say (nothing regulated, or not checked).
 */
export function detailOfLineIfra(line: LineIfra | undefined): Array<[string, string]> {
  if (!line || line.kind !== "reading") {
    return [];
  }
  const { nearest, margin } = line;
  const base = t.ifraBases[line.base];
  const out: Array<[string, string]> = [];
  if (nearest !== null) {
    out.push([
      t.ifraNearest,
      nearest.used === null ? t.ifraProhibited(nearest.name) : t.ifraNearestValue(nearest.name, usedText(nearest.used), dilutionText(nearest.limit)),
    ]);
  }
  out.push([
    t.ifraMargin,
    margin.kind === "unbounded"
      ? t.ifraMarginNoCeiling(base)
      : margin.pouredUg.isZero()
        ? t.ifraMarginNone(margin.limitedByName, base)
        : t.ifraMarginValue(roomText(margin.pouredUg), margin.limitedByName, base),
  ]);
  return out;
}
