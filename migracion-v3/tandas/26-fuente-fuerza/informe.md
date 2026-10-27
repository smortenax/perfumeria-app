# Tanda 26 · La fuente de la fuerza

*Generada por `migracion-v3/tanda-26-fuente-fuerza.ts` sobre lo común como está en `v3/datos/` (commit `2d856d7`). La decisión es V3-81 (el usuario, 2026-10-27: «Faltaba la fuente»). Escribe `v3/datos/materials.csv` con la columna nueva `strength_source`, junto a `strength`; no cambia ningún otro valor.*

**Qué es.** Cada común con fuerza (111 de 127) gana la fuente de esa cifra: la tanda que la trajo y lo que esa tanda cita. La ficha la enseña bajo la fuerza; sin fuente, «no lo dice».

| De dónde | Cuántos |
|---|---|
| El laboratorio (tanda 7: `biblioteca/materiales.sqlite`, `materials.strength`, commit `c0e81e3`) | 105 |
| La web, por la tanda 12 (`respuestas/huecos-web.csv`, la parte «intensidad» de sus fuentes) | 1 |
| La web, por la tanda 14 (`web/fichas-13.csv`: la página de TGSC y su frase) | 5 |
| Sin encontrar (quedan sin fuente) | 0 |

## Los que vienen de la web

| Material | Fuerza | Fuente |
|---|---|---|
| 1-Octen-3-one Stabilised | high | web: TGSC, https://www.thegoodscentscompany.com/data/rw1027981.html: «high , recommend smelling in a 1.00 % solution or less», por la tanda 14 |
| Aldehído alfa-hexil cinámico | medium | web (V3-54, TGSC): https://www.thegoodscentscompany.com/data/rw1005971.html, por la tanda 12 |
| Cumin Nitrile | medium | web: TGSC, https://www.thegoodscentscompany.com/data/rw1016811.html: «medium , recommend smelling in a 1.00 % solution or less», por la tanda 14 |
| Ethyl decanoate | medium | web: TGSC, https://www.thegoodscentscompany.com/data/rw1015411.html: «medium», por la tanda 14 |
| Isobutyl acetate | medium | web: TGSC, https://www.thegoodscentscompany.com/data/rw1013631.html: «medium , recommend smelling in a 10.00 % solution or less», por la tanda 14 |
| Rose Crystals | medium | web: TGSC, https://www.thegoodscentscompany.com/data/rw1002671.html: «medium , recommend smelling in a 10.00 % solution or less», por la tanda 14 |

## Sin encontrar

Ninguno.

Tus versiones no cambian: heredan la fuente del común junto con su fuerza.
