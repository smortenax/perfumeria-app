// Copied from designboard 4aa3488 (src/library/basic.tsx), runtime 1.0.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import type { CSSProperties } from "react";
import type { ComponentDef } from "../core/manifest";
import { tokenVar } from "../core/tokens";

/**
 * A handful of plain building blocks. Every visual value is a token path; slots take the
 * person's own images and vectors instead of generated ones.
 */

export function SlotView({ src, label, fit = "contain", radius }: { src: string; label: string; fit?: string; radius?: string }) {
  const style: CSSProperties = { width: "100%", height: "100%", borderRadius: tokenVar(radius, "0") };
  if (src) {
    return <img src={src} alt="" draggable={false} style={{ ...style, objectFit: fit as CSSProperties["objectFit"], display: "block" }} />;
  }
  return (
    <div className="slot-empty" style={style} title="Suelta aquí una imagen o un SVG">
      <span>{label}</span>
    </div>
  );
}

type PanelP = {
  background: string;
  radius: string;
  border: boolean;
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  borderColor: string;
  image: string;
};

/** The inset shadows that draw a 1 px border on the chosen sides (an inset shadow takes no room, as the old all-round one did). */
export function panelBorder(p: Pick<PanelP, "border" | "borderTop" | "borderRight" | "borderBottom" | "borderLeft">, color: string): string | undefined {
  if (!p.border) return undefined;
  const sides: [boolean, string][] = [
    [p.borderTop, "0 1px"],
    [p.borderRight, "-1px 0"],
    [p.borderBottom, "0 -1px"],
    [p.borderLeft, "1px 0"],
  ];
  const on = sides.filter(([shown]) => shown);
  if (!on.length) return undefined;
  if (on.length === 4) return `inset 0 0 0 1px ${color}`;
  return on.map(([, offset]) => `inset ${offset} 0 0 ${color}`).join(", ");
}

export const panel: ComponentDef<PanelP> = {
  type: "panel",
  name: "Panel",
  source: "designboard",
  description: "Una caja con fondo, radio y borde de los tokens. El fondo puede ser una imagen tuya.",
  defaultSize: { w: 320, h: 200 },
  params: {
    background: { kind: "token", label: "Fondo", groups: ["color.surface", "color.orb"], default: "color.surface.raised" },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.panel", none: "Sin radio (esquinas rectas)" },
    border: { kind: "boolean", label: "Borde", default: true },
    borderTop: { kind: "boolean", label: "Borde arriba", default: true },
    borderRight: { kind: "boolean", label: "Borde a la derecha", default: true },
    borderBottom: { kind: "boolean", label: "Borde abajo", default: true },
    borderLeft: { kind: "boolean", label: "Borde a la izquierda", default: true },
    borderColor: { kind: "token", label: "Color del borde", groups: ["color.border"], default: "color.border.subtle" },
    image: { kind: "slot", label: "Imagen de fondo", accept: "image", default: "", help: "Vacío = solo color. Suelta una imagen para usarla de fondo." },
  },
  render: ({ params }) => (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: tokenVar(params.background, "#fff"),
        backgroundImage: params.image ? `url("${params.image}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: tokenVar(params.radius, "0"),
        boxShadow: panelBorder(params, tokenVar(params.borderColor, "#ccc")),
      }}
    />
  ),
};

type TextP = { text: string; size: string; color: string; family: string; weight: string; align: string };
export const text: ComponentDef<TextP> = {
  type: "text",
  name: "Texto",
  source: "designboard",
  defaultSize: { w: 240, h: 32 },
  params: {
    text: { kind: "text", label: "Texto", default: "Título", multiline: true },
    size: { kind: "token", label: "Tamaño", groups: ["font.size"], default: "font.size.lg" },
    color: { kind: "token", label: "Color", groups: ["color.text", "color.accent"], default: "color.text.default" },
    family: { kind: "token", label: "Familia", groups: ["font.family"], default: "font.family.body" },
    weight: { kind: "select", label: "Peso", options: [{ value: "400", label: "Normal" }, { value: "600", label: "Semi" }, { value: "700", label: "Negrita" }], default: "400" },
    align: { kind: "select", label: "Alineación", options: [{ value: "left", label: "Izquierda" }, { value: "center", label: "Centro" }, { value: "right", label: "Derecha" }], default: "left" },
  },
  render: ({ params }) => (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: tokenVar(params.size, "16px"),
        color: tokenVar(params.color, "#111"),
        fontFamily: tokenVar(params.family, "system-ui"),
        fontWeight: Number(params.weight),
        textAlign: params.align as CSSProperties["textAlign"],
        lineHeight: 1.3,
        whiteSpace: "pre-wrap",
        overflow: "hidden",
      }}
    >
      {params.text}
    </div>
  ),
};

type ButtonP = { label: string; variant: string; radius: string; icon: string };
export const button: ComponentDef<ButtonP> = {
  type: "button",
  name: "Botón",
  source: "designboard",
  swapWith: ["glass-button"],
  defaultSize: { w: 160, h: 44 },
  params: {
    label: { kind: "text", label: "Texto", default: "Añadir" },
    variant: { kind: "select", label: "Estilo", variant: true, options: [{ value: "accent", label: "Acento" }, { value: "quiet", label: "Discreto" }], default: "accent" },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.control" },
    icon: { kind: "slot", label: "Icono", accept: "any", default: "", help: "Tu icono (SVG o imagen). Vacío = sin icono." },
  },
  render: ({ params }) => {
    const accent = params.variant === "accent";
    return (
      <button
        type="button"
        tabIndex={-1}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: "none",
          borderRadius: tokenVar(params.radius, "8px"),
          background: accent ? tokenVar("color.accent.default", "#111418") : tokenVar("color.surface.chip", "#e2e8ee"),
          color: accent ? tokenVar("color.text.on-accent", "#fff") : tokenVar("color.text.default", "#111"),
          fontFamily: tokenVar("font.family.body", "system-ui"),
          fontSize: tokenVar("font.size.md", "14px"),
          fontWeight: 600,
          pointerEvents: "none",
        }}
      >
        {params.icon && <img src={params.icon} alt="" style={{ width: 18, height: 18 }} />}
        {params.label}
      </button>
    );
  },
};

type ImageP = { image: string; fit: string; radius: string };
export const image: ComponentDef<ImageP> = {
  type: "image",
  name: "Imagen / icono",
  source: "designboard",
  description: "Un hueco con nombre para una imagen o un vector tuyo. El nombre de la capa es el que busca el importador de Illustrator.",
  defaultSize: { w: 96, h: 96 },
  params: {
    image: { kind: "slot", label: "Archivo", accept: "any", default: "" },
    fit: { kind: "select", label: "Ajuste", options: [{ value: "contain", label: "Contener" }, { value: "cover", label: "Cubrir" }, { value: "fill", label: "Estirar" }], default: "contain" },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.panel" },
  },
  render: ({ params, name }) => <SlotView src={params.image} label={name ?? "Imagen"} fit={params.fit} radius={params.radius} />,
};

type ChartP = { values: string; color: string; gap: number; baseline: boolean };
export const bars: ComponentDef<ChartP> = {
  type: "bars",
  name: "Gráfico de barras",
  source: "designboard",
  description: "Barras de una serie. Los valores se escriben separados por comas; en la app vendrían de los datos.",
  defaultSize: { w: 240, h: 120 },
  params: {
    values: { kind: "text", label: "Valores", default: "12, 30, 22, 41, 18, 27" },
    color: { kind: "token", label: "Color", groups: ["color.accent", "color.text"], default: "color.accent.default" },
    gap: { kind: "number", label: "Separación", min: 0, max: 0.8, step: 0.05, default: 0.3 },
    baseline: { kind: "boolean", label: "Línea base", default: true },
  },
  render: ({ params, width, height }) => {
    const vals = params.values.split(/[,;\s]+/).map(Number).filter(Number.isFinite);
    const max = Math.max(1, ...vals);
    const slot = width / Math.max(1, vals.length);
    const bw = slot * (1 - params.gap);
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {vals.map((v, i) => {
          const h = Math.max(1, (v / max) * (height - 2));
          return <rect key={i} x={i * slot + (slot - bw) / 2} y={height - h} width={bw} height={h} rx={2} fill={tokenVar(params.color, "#111418")} />;
        })}
        {params.baseline && <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={tokenVar("color.border.control", "#7b8591")} />}
      </svg>
    );
  },
};
