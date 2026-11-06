# La fuerza de una tintura o una dilución: de dónde sale la regla

*Propuesta de la sesión (2026-11-06), sin decidir. La usa `consenso.py`.*

**La regla.** Impacto de la tintura o la dilución = impacto del material puro − 3 · log10(1 / fracción),
redondeado y nunca por debajo de 1. Al 10 % baja 3 puntos; al 20 %, 2; al 50 %, 1; al 1 %, 6. Si la web
no dice el porcentaje de una tintura, se toma el 10 % y se dice.

**Las anclas, de PerfuMate** (`migracion-v3/perfumate/perfumate.sqlite3`):

| Material puro | Impacto | Su tintura | Impacto | Diferencia |
|---|---|---|---|---|
| Vanilla absolute | 7 | Vanilla Tincture («Neat or 20%») | 4 | −3 |
| Orris Resinoid | 6 | Orris Root Tincture | 3 | −3 |
| Absolute Ambergris | 5 | Ambergris Tincture (3 %) | 4 | −1 |

Dos de tres bajan 3 puntos; la de ámbar gris baja menos (la tintura de ámbar gris se hace con el
material en bruto, no con un absoluto). En PerfuMate, las diluciones de fábrica de una molécula no
siguen ninguna regla (Galaxolide 3; Galaxolide 50 % IPM, 7): por eso la regla solo se aplica a tinturas
y a diluciones de naturales.

**Lo que dicen las fuentes de las tinturas.** Scentspiracy,
https://www.scentspiracy.com/blog/tinctures-in-perfumery-definition-and-overview:

- «The ratio of raw material to alcohol is typically between 3% and 20% by weight, depending on the
  aromatic potency of the ingredient (Arctander, 1960, p. 11)»; «10-15% by weight: Standard ratio for
  strongly aromatic botanicals or resins (Sell, 2006, p. 146)».
- «Tinctures are significantly less concentrated compared to essential oils or absolutes.»
- «A vanilla tincture at 10% concentration contains approximately 1-2% vanillin, whereas a vanilla
  absolute may contain 10-30%.» Es decir, una décima parte: la décima que la regla traduce en 3 puntos.

**Lo que no se sabe.** Cuánto material lleva cada tintura de Maese Lab: su ficha da la graduación del
alcohol y la «Cantidad de Cargas» (cuántas veces se ha cargado de planta), no el porcentaje. Más cargas
deberían dar una tintura más fuerte, pero ninguna fuente lo cuantifica.

**Para el planificador (V3-98).** Como el peso es cantidad × impacto, también se puede usar el impacto
del material puro y multiplicar la cantidad por la fracción aromática. Las dos columnas están en
`consenso.csv` (`impacto_material_puro` y, en particularidades, el porcentaje).
