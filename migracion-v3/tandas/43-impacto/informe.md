# Tanda 43 · El impacto de 1 a 10

*Generada por `migracion-v3/tanda-43-impacto.ts` sobre lo común como está en `v3/datos/` (commit `9426d96`). La decisión es V3-97 (el usuario, 2026-11-06: «habría que devolverlo a los valores de 10 puntos»). Escribe `v3/datos/materials.csv` con dos columnas nuevas, `impact` e `impact_source`, junto a la fuerza; no cambia ningún otro valor. Lee `migracion-v3/perfumate/perfumate.sqlite3` (sha256 `7f60451a2f88b0841c52f7a71f167d499c3a3497f80c1dd76344ed66c67d9ff8`), el mismo que leyó la tanda 21.*

**Qué es.** Cada común gana el impacto que le da PerfuMate, tal cual (V3-82), con la página de donde sale. Lo enseña la ficha como su fuerza, de 1 a 10; los que no tienen impacto siguen enseñando su fuerza en palabras, sin convertirla.

| Cómo | Cuántos |
|---|---|
| Por CAS | 122 |
| Por nombre (ningún CAS coincide) | 14 |
| Varias entradas con impactos distintos (quedan sin impacto) | 6 |
| No está en PerfuMate | 11 |
| Disolventes (no llevan impacto) | 7 |

## El impacto frente a la fuerza de 4 niveles

| Fuerza | Con impacto | Mediana | Mínimo | Máximo |
|---|---|---|---|---|
| low | 2 | 4 | 4 | 7 |
| medium | 65 | 5 | 2 | 9 |
| high | 37 | 8 | 3 | 10 |
| very_high | 13 | 8 | 6 | 9 |
| sin fuerza | 19 | 7 | 2 | 9 |

## Por nombre (revísalos)

- Aldambre → Aldambre (6)
- Ambrarome → Ambrarome Absolue (8)
- Auranone → Auranone (3)
- Bergamot, bergapten-free → Bergamot FCF Essential Oil (6)
- Beta ionone → Beta-Ionone (7); Ionone (mixed isomers) (7)
- Black Agar 296985 → Black Agar Givco 215/2 (8)
- Cassis Base 345 B → Cassis Base 345B (8)
- Dewfruit TEC → Dewfruit ABQ2977 (5)
- Geosmin → Geosmin (10)
- Mugwort (Artemisia vulgaris), essential oil → Armoise Essential Oil (8)
- Prunella → Prunella (7)
- Suederal → Suederal LT (6)
- Synthetic castoreum → Castoreum Synthetic (7)
- Terpinyl acetate → Terpinyl Acetate (3)

## Con impactos distintos (quedan sin impacto)

- Cilantro: Coriander Leaf Essential Oil (8); Coriander Seed Essential Oil (6)
- Exaltolide Total: Exaltolide (3); Macrolide (5)
- Frankincense (Boswellia sacra), essential oil: Frankincense Essential Oil (6); Olibanum Coeur MD (5); Olibanum Essential Oil (6)
- Juniper (berries), essential oil: Juniper Berry Pure Jungle Essence (6); Juniper Wood Oil (5)
- Sandalmysore Core: Hindinol (6); Sandal Mysore Core (7)
- Shangralide: Shangralide (5); Shangralide Oliffac 0712 (8)

## Sin impacto

- 1-Octen-3-one Stabilised (fuerza high)
- 3,4-Xylenol (fuerza medium)
- 4-Propylphenol
- Cumin Nitrile (fuerza medium)
- Honey, aromatic essence
- Methyl linolenate
- Narcisse Oxyacetate
- Orris Givco
- Thialdine
- Truffle essence
- Villous cardamom, tincture

Tus versiones no cambian: heredan el impacto del común.
