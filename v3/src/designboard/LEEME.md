# Copia del runtime de Designboard

Copia de [smortenax/designboard](https://github.com/smortenax/designboard) `main` en `c0e1d34`
(2026-11-12, PR #37 y #38), porque la v3 no importa nada de fuera de su carpeta (V3-21).

- **`core/` y `runtime/`** los escribe `npm run copy-runtime -- ../perfumeria-app/v3/src/designboard`
  desde designboard. Cada archivo lleva una cabecera con el commit y la versión del runtime. No se
  editan aquí: se cambia designboard y se vuelve a copiar. La app importa de `runtime/index`.
- **`core/screenMap.ts`** y **`adapter/config.ts`** están copiados a mano, solo para que
  `v3/designboard.config.ts` tenga tipos.
- **`library/`** (el panel y las piezas del historial), **`historyComposition.ts`** (el inicio del
  tablero y la reserva de la app), **`tokenNames.ts`** y **`perfumeria.tokens.json`** también
  están copiados a mano, de `src/library/`, `src/apps/perfumeria/` y `src/tokens/`. Respecto al
  original solo cambian las rutas de importación y el orbe de `library/history/sample.tsx`, que es
  el de la app (`src/glossary/orb/`).

La composición está en `v3/designboard.composition.json` y la escribe el tablero. Con
`npm run dev`, `HistoryDock` la vuelve a leer cada segundo, así que lo que se guarda en el tablero
se ve sin recargar.
