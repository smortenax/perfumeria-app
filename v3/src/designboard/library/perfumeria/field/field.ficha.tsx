// Copied from designboard 3f221ae (src/library/perfumeria/field/field.ficha.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { useId, type CSSProperties } from "react";
import type { ComponentDef } from "../../../core/manifest";
import { tokenVar } from "../../../core/tokens";
import { BenchRoot } from "../bench/BenchRoot";

/**
 * The bench's amount field, where every weighing is typed (the add bar's «Amount (g)»): a label over
 * a field with the figure on the right and the unit as a button. Its look is `.field-label`, `.field`,
 * `.quantity-field`, `.quantity-field input` and `.unit` in v3/src/bench/bench.css (copied unchanged
 * from perfumeria-app v3 at ee38168, see ../bench/BenchRoot.tsx).
 *
 * The field is JSX inside AddBar.tsx (lines 1009 to 1036 at ee38168), which reads the whole add bar's
 * state, so it cannot be copied as a component: this ficha writes the same markup with the same
 * classes. The input is read-only on the board; the words and the figure are sample text.
 *
 * Params reach it as inline style on its elements, which beats bench.css. The side paddings
 * (10 px and 4 px), the label's gap (6 px) and the unit button (36 px) are numbers: the token file
 * has no control padding, small gap or inner target size yet.
 */
export type FieldParams = {
  label: string;
  value: string;
  unit: string;
  height: string;
  background: string;
  border: string;
  radius: string;
  fontSize: string;
  textColor: string;
  labelSize: string;
  labelColor: string;
  unitBackground: string;
  paddingStart: number;
  paddingEnd: number;
  labelGap: number;
  unitSize: number;
};

export function fieldStyle(p: FieldParams): CSSProperties {
  return {
    minHeight: tokenVar(p.height),
    background: tokenVar(p.background),
    borderColor: tokenVar(p.border),
    borderRadius: tokenVar(p.radius, "0"),
    padding: `0 ${p.paddingEnd}px 0 ${p.paddingStart}px`,
  };
}

export function PerfumeriaField({ params: p }: { params: FieldParams }) {
  const id = useId();
  return (
    <BenchRoot>
      <div className="quantity" style={{ width: "100%", height: "100%", gap: p.labelGap }}>
        <label className="field-label" htmlFor={id} style={{ fontSize: tokenVar(p.labelSize), color: tokenVar(p.labelColor) }}>
          {p.label}
        </label>
        <div className="field quantity-field" style={fieldStyle(p)}>
          <input id={id} className="num" value={p.value} placeholder="0" readOnly style={{ fontSize: tokenVar(p.fontSize), color: tokenVar(p.textColor) }} />
          <button
            type="button"
            className="unit num"
            tabIndex={-1}
            style={{ minWidth: p.unitSize, minHeight: p.unitSize, borderRadius: tokenVar(p.radius, "0"), background: tokenVar(p.unitBackground) }}
          >
            {p.unit}
          </button>
        </div>
      </div>
    </BenchRoot>
  );
}

export const perfumeriaField: ComponentDef<FieldParams> = {
  type: "perfumeria-field",
  name: "Campo de cantidad",
  source: "perfumeria-app",
  description: "El campo donde se teclea cada pesada en el banco: etiqueta encima, cifra a la derecha y la unidad como botón.",
  defaultSize: { w: 120, h: 70 },
  params: {
    label: { kind: "text", label: "Etiqueta", default: "Amount (g)", help: "De muestra: en la app llega de sus textos." },
    value: { kind: "text", label: "Cifra", default: "", help: "De muestra. Vacío: se ve el 0 de ayuda." },
    unit: {
      kind: "select",
      label: "Unidad",
      options: [
        { value: "g", label: "g" },
        { value: "mg", label: "mg" },
      ],
      default: "g",
    },
    height: { kind: "token", label: "Alto mínimo", groups: ["size.target"], default: "size.target", help: "El objetivo táctil de la app, 44 px." },
    background: { kind: "token", label: "Fondo", groups: ["color.surface"], default: "color.surface.raised" },
    border: { kind: "token", label: "Borde", groups: ["color.border", "color.accent"], default: "color.border.control", help: "El borde de un campo pide 3:1 de contraste." },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.control", none: "Sin radio" },
    fontSize: { kind: "token", label: "Tamaño de la cifra", groups: ["font.size"], default: "font.size.md" },
    textColor: { kind: "token", label: "Color de la cifra", groups: ["color.text"], default: "color.text.default" },
    labelSize: { kind: "token", label: "Tamaño de la etiqueta", groups: ["font.size"], default: "font.size.sm" },
    labelColor: { kind: "token", label: "Color de la etiqueta", groups: ["color.text"], default: "color.text.default" },
    unitBackground: { kind: "token", label: "Fondo de la unidad", groups: ["color.surface"], default: "color.surface.sunken" },
    paddingStart: { kind: "number", label: "Relleno izquierdo", min: 0, max: 24, step: 1, default: 10, unit: "px", help: "Sin token aún." },
    paddingEnd: { kind: "number", label: "Relleno derecho", min: 0, max: 24, step: 1, default: 4, unit: "px", help: "Sin token aún." },
    labelGap: { kind: "number", label: "Separación de la etiqueta", min: 0, max: 16, step: 1, default: 6, unit: "px", help: "Sin token aún." },
    unitSize: { kind: "number", label: "Tamaño de la unidad", min: 24, max: 44, step: 1, default: 36, unit: "px", help: "Sin token aún. 24 px es el mínimo de WCAG 2.5.8." },
  },
  render: ({ params }) => <PerfumeriaField params={params} />,
};
