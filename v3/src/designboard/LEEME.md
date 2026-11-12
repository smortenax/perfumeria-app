# Copia del runtime de Designboard

Copia de [smortenax/designboard](https://github.com/smortenax/designboard), `main` en `0c340a5`
(2026-11-12, PR #36), porque la v3 no importa nada de fuera de su carpeta (V3-21). Es lo mismo que
se hace con los tokens del vault.

| Aquí | En Designboard |
| --- | --- |
| `core/` | `src/core/` (composition, migrate, manifest, tokens, links, screenMap) |
| `runtime/` | `src/runtime/` (ComposedScreen, layers, links, preview) |
| `adapter/config.ts` | `src/adapter/config.ts`, solo para que `v3/designboard.config.ts` tenga tipos |
| `library/basic.tsx` | `src/library/basic.tsx` (el panel, fondo de la barra) |
| `library/history/` | `src/library/perfumeria/history/` |
| `tokenNames.ts` | `src/apps/perfumeria/tokenNames.ts` |
| `perfumeria.tokens.json` | `src/tokens/perfumeria.json` (la copia del vault que usa el tablero; solo la lee `v3/designboard.config.ts`, la app sigue con `src/theme/tokens.css`) |

Propio de la app, no copiado: `naming.ts`, que llama a `setTokenNaming(perfumeriaCssVar)` antes de que cargue ninguna pieza.

Cambios respecto al original: solo las rutas de importación (una carpeta menos) y, en
`library/history/sample.tsx`, el orbe, que es el de la app (`src/glossary/orb/`).

No se edita a mano: se vuelve a copiar de Designboard. La composición que dibuja está en
`v3/designboard.composition.json`, que escribe el tablero.
