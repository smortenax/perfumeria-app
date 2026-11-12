import type { ComponentDef, ComponentPreview } from "../../core/manifest";
import { HistoryCount, HistoryPlay, HistoryTrack, type CountParams, type PlayParams, type TrackParams } from "./HistoryPieces";
import { APP_GEOMETRY } from "./history";
import { HistorySample, SAMPLES } from "./sample";

/**
 * The fichas of Perfumería's history dock: three pieces you can place apart (the plan's
 * «Fichas para Designboard»). Colours, radii and type sizes are token params from Perfumería's
 * file; the chip and magnifier are numbers with limits, since the file has no tokens for them yet.
 * The words are not params: they stay in the app's texts (V3-71).
 */

const preview: ComponentPreview = { samples: SAMPLES, Wrap: HistorySample };

const svgSlot = (label: string, help: string) => ({ kind: "slot", label, accept: "svg", default: "", help }) as const;

export const historyTrack: ComponentDef<TrackParams> = {
  type: "history-track",
  name: "Tira del historial",
  source: "perfumeria-app",
  description: "Los cambios del banco en una fila, con la lupa del Dock. Lee el historial de la app; en el tablero, el del ejemplo elegido arriba.",
  defaultSize: { w: 1200, h: 72 },
  preview,
  params: {
    chip: { kind: "number", label: "Tamaño del chip", min: 24, max: 40, step: 1, default: APP_GEOMETRY.chip, unit: "px", help: "24 px es el mínimo de WCAG 2.5.8." },
    slot: { kind: "number", label: "Ancho del hueco", min: 40, max: 72, step: 1, default: APP_GEOMETRY.slot, unit: "px", help: "Con letra de 16 px; crece con la letra (3,25 rem). Nunca menos que el chip." },
    gap: { kind: "number", label: "Separación", min: 0, max: 12, step: 1, default: APP_GEOMETRY.gap, unit: "px" },
    magnify: { kind: "number", label: "Aumento de la lupa", min: 1, max: 2.2, step: 0.05, default: APP_GEOMETRY.magnify, help: "1 = sin lupa." },
    reach: { kind: "number", label: "Alcance de la lupa", min: 40, max: 160, step: 1, default: APP_GEOMETRY.reach, unit: "px" },
    mark: {
      kind: "select",
      label: "Marca de una adición",
      options: [
        { value: "orb", label: "Orbe" },
        { value: "letters", label: "Letras" },
        { value: "family", label: "Letras con tinte de familia" },
      ],
      default: "orb",
      help: "Con orbe, un material sin orbe muestra sus letras con el tinte de su familia, como hoy.",
    },
    amounts: { kind: "boolean", label: "Mostrar cantidades", default: true },
    future: { kind: "number", label: "Opacidad de lo futuro", min: 0.25, max: 0.6, step: 0.05, default: 0.35, help: "Los chips tras el fotograma mirado. La cantidad no se atenúa." },
    radius: { kind: "token", label: "Radio del chip", groups: ["radius"], default: "radius.control" },
    chipBackground: { kind: "token", label: "Fondo del chip", groups: ["color.surface"], default: "color.surface.raised" },
    chipBorder: { kind: "token", label: "Borde del chip", groups: ["color.border"], default: "color.border.subtle" },
    line: { kind: "token", label: "Línea pendiente", groups: ["color.border"], default: "color.border.subtle" },
    lineDone: { kind: "token", label: "Línea recorrida y puntos", groups: ["color.text", "color.accent"], default: "color.text.default" },
    selected: { kind: "token", label: "Marca de elegido", groups: ["color.accent", "color.text"], default: "color.accent.default" },
    amountSize: { kind: "token", label: "Tamaño de la cantidad", groups: ["font.size"], default: "font.size.xs" },
    amountColor: { kind: "token", label: "Color de la cantidad", groups: ["color.text"], default: "color.text.muted" },
    tipBackground: { kind: "token", label: "Fondo del aviso", groups: ["color.text"], default: "color.text.default" },
    tipText: { kind: "token", label: "Texto del aviso", groups: ["color.text"], default: "color.text.on-accent" },
    shades: { kind: "boolean", label: "Sombras laterales", default: true, help: "Botones para ir al principio o al final cuando la tira no cabe." },
    noteIcon: svgSlot("Icono de nota", "Vacío: la bandera de hoy. Toma el color del chip."),
    reweighIcon: svgSlot("Icono de repesada", "Vacío: ⚖. Toma el color del chip."),
    removeIcon: svgSlot("Icono de quitar", "Vacío: ✕. Toma el color del chip."),
    setMassIcon: svgSlot("Icono de cambiar masa", "Vacío: ±. Toma el color del chip."),
  },
  render: ({ params }) => <HistoryTrack params={params} />,
};

export const historyPlay: ComponentDef<PlayParams> = {
  type: "history-play",
  name: "Reproducir historial",
  source: "perfumeria-app",
  description: "El botón que reproduce el historial cambio a cambio. El ritmo (450 ms) es de la app.",
  defaultSize: { w: 44, h: 44 },
  square: true,
  preview,
  params: {
    background: { kind: "token", label: "Fondo", groups: ["color.surface"], default: "color.surface.raised" },
    border: { kind: "token", label: "Borde", groups: ["color.border"], default: "color.border.control" },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.control" },
    iconColor: { kind: "token", label: "Color del icono", groups: ["color.text", "color.accent"], default: "color.text.default" },
    playIcon: svgSlot("Icono de reproducir", "Vacío: el triángulo de hoy."),
    pauseIcon: svgSlot("Icono de pausa", "Vacío: las dos barras de hoy."),
  },
  render: ({ params }) => <HistoryPlay params={params} />,
};

export const historyCount: ComponentDef<CountParams> = {
  type: "history-count",
  name: "Recuento del historial",
  source: "perfumeria-app",
  description: "«History» y «9 changes · as weighed», o «4 of 9 · at the end» mientras miras un fotograma.",
  defaultSize: { w: 176, h: 44 },
  preview,
  params: {
    background: { kind: "token", label: "Fondo", groups: ["color.surface"], default: "color.surface.sunken" },
    border: { kind: "token", label: "Borde", groups: ["color.border"], default: "color.border.subtle" },
    radius: { kind: "token", label: "Radio", groups: ["radius"], default: "radius.control" },
    titleSize: { kind: "token", label: "Tamaño del título", groups: ["font.size"], default: "font.size.xs" },
    numberSize: { kind: "token", label: "Tamaño del número", groups: ["font.size"], default: "font.size.md" },
    numberFamily: { kind: "token", label: "Letra del número", groups: ["font.family"], default: "font.family.body" },
    layout: {
      kind: "select",
      label: "Disposición",
      options: [
        { value: "stacked", label: "Apilado" },
        { value: "inline", label: "En línea" },
      ],
      default: "stacked",
    },
    asWeighed: { kind: "boolean", label: "Mostrar «as weighed»", default: true },
  },
  render: ({ params }) => <HistoryCount params={params} />,
};

export const HISTORY_FICHAS = [historyPlay, historyTrack, historyCount] as const;
