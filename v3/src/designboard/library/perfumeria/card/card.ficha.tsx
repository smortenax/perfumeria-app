// Copied from designboard 3f221ae (src/library/perfumeria/card/card.ficha.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { CSSProperties } from "react";
import type { ComponentDef } from "../../../core/manifest";
import { tokenVar } from "../../../core/tokens";
import { BenchRoot } from "../bench/BenchRoot";

/**
 * A card of Perfumería's bench: the box that holds each of its panels (summary, evaporation, IFRA,
 * the formula's name, the charts). Its look is `.card` in v3/src/bench/bench.css (copied unchanged
 * from perfumeria-app v3 at ee38168, see ../bench/BenchRoot.tsx); the inside is the summary card's
 * (`.summary-card`, `.chart-title`, `p.muted.small`), the most plain of them.
 *
 * There is no Card component in the app to copy: each panel writes `className="card …"` in its own
 * JSX and SummaryCard.tsx reads the formula's figures. So this ficha writes the markup of
 * SummaryCard's empty state with the same classes; the words are sample text.
 *
 * Params reach it as inline style on the card, which beats bench.css. The vertical padding (12 px)
 * and the gap (6 px) are numbers: the token file has no small space tokens yet.
 */
export type CardParams = {
  title: string;
  text: string;
  background: string;
  border: string;
  radius: string;
  paddingX: string;
  paddingY: number;
  gap: number;
  titleSize: string;
  titleColor: string;
  textColor: string;
};

export function cardStyle(p: CardParams): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    background: tokenVar(p.background),
    borderColor: tokenVar(p.border),
    borderRadius: tokenVar(p.radius, "0"),
    padding: `${p.paddingY}px ${tokenVar(p.paddingX, "0")}`,
    gap: p.gap,
    overflow: "hidden",
  };
}

export function PerfumeriaCard({ params }: { params: CardParams }) {
  return (
    <BenchRoot>
      <section className="card summary-card" aria-label={params.title} style={cardStyle(params)}>
        <span className="chart-title" style={{ fontSize: tokenVar(params.titleSize), color: tokenVar(params.titleColor) }}>
          {params.title}
        </span>
        {params.text && (
          <p className="muted small" style={{ color: tokenVar(params.textColor) }}>
            {params.text}
          </p>
        )}
      </section>
    </BenchRoot>
  );
}

export const perfumeriaCard: ComponentDef<CardParams> = {
  type: "perfumeria-card",
  name: "Tarjeta del banco",
  source: "perfumeria-app",
  description: "La caja de cada panel del banco (resumen, evaporación, IFRA, nombre, gráficas): papel con borde fino y radio de panel. Dentro, un título y una línea, como el resumen vacío.",
  defaultSize: { w: 360, h: 96 },
  params: {
    title: { kind: "text", label: "Título", default: "Summary", help: "De muestra: en la app, el título llega de sus textos." },
    text: { kind: "text", label: "Texto", multiline: true, default: "Add materials to see the formula summed up.", help: "De muestra. Vacío: solo el título." },
    background: { kind: "token", label: "Fondo", groups: ["color.surface"], default: "color.surface.raised" },
    border: { kind: "token", label: "Borde", groups: ["color.border"], default: "color.border.subtle" },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.panel", none: "Sin radio" },
    paddingX: { kind: "token", label: "Relleno lateral", groups: ["space"], default: "space.inset" },
    paddingY: { kind: "number", label: "Relleno arriba y abajo", min: 0, max: 32, step: 1, default: 12, unit: "px", help: "Sin token aún." },
    gap: { kind: "number", label: "Separación", min: 0, max: 24, step: 1, default: 6, unit: "px", help: "Entre el título y las líneas. Sin token aún." },
    titleSize: { kind: "token", label: "Tamaño del título", groups: ["font.size"], default: "font.size.md" },
    titleColor: { kind: "token", label: "Color del título", groups: ["color.text"], default: "color.text.default" },
    textColor: { kind: "token", label: "Color del texto", groups: ["color.text"], default: "color.text.muted" },
  },
  render: ({ params }) => <PerfumeriaCard params={params} />,
};
