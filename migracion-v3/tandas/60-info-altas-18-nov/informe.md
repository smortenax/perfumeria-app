# Tanda 60 · La línea de información de las altas del 18-nov

*Generada por `migracion-v3/tanda-60-info-altas-18-nov.ts` sobre lo común de `602a480` (con la tanda 57 ya aprobada), desde `migracion-v3/web/info-18-nov/`. Escribe `v3/datos/materials.csv`, `material_doses.csv`, `material_descriptors.csv`, `material_components.csv` y `material_categories.csv` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «Apruebo 57, 58 y 59, empieza la línea de información» y «empieza el thread separado de la info». Los 44 comunes de la tanda 57 entraron a medias (sin familia, duración, dosis, composición, descriptores ni impacto).

**Cómo:**

- **La ficha:** para cada material se leyeron hasta tres páginas de referencia (TGSC no: devuelve 403 a las lecturas automáticas; dos independientes: la casa, Fraterworks, Perfumer's Apprentice, Ventos, Parchem…; un subagente Sonnet por lote de 9; `migracion-v3/web/info-18-nov/web-60-*.csv`, con la frase literal) y PerfuMate en local. `consolidar.py` elige con las reglas de las tandas 46 y 47: orden de referencias y, si no coinciden, va la primera y el campo queda disputado. Una página de otro CAS, otra especie u otro proceso no cuenta. **El impacto**, solo de PerfuMate y cuando es el mismo material (V3-97): una molécula por su CAS; un natural o una base, por nombre y casa. La descripción de olor de Perfumiarz («Zapach: …», en polaco) entra como descriptor, citada.
- **La composición:** `bajar.py` baja los documentos del fabricante que enlaza cada página de Perfumiarz (SDS, IFRA, alérgenos, CoA; no se guardan en Git) y `extraer.py` lee sus cifras por script, con la página y la línea literal (`migracion-v3/web/info-18-nov/documentos.csv`). Entran como literatura (documento del fabricante, no del frasco comprado, como en las tandas 29 y 51): la app dirá «acotado», nunca «dentro». Si un alérgeno sale en la declaración y en la SDS, va la cifra de la declaración.

**Resultado:** 1 alta nueva (Tropicalia, que la tanda 57 dejó en espera); 107 campos llenos; 0 usos habituales; 101 descriptores; 60 constituyentes en 7 materiales; 18 campos disputados.

**Para mirar antes de aprobar:**

- **Documentos equivocados en Perfumiarz:** el script compara el producto que nombra cada documento con el de la página. Los que no coinciden no se usan (lista abajo y en las notas de cada material).
- **Diluidos de fábrica** (2-metilpirazina 5 %, Ultravanil 80 %, Cinnamalva 50 %…): sus documentos son de la dilución, y lo común es el material puro: no se usan sus cifras.
- **Topes del fabricante (categoría 4 del certificado IFRA):** son del producto, así que van a tu versión cuando tengas el frasco (V3-39); aquí solo se apuntan en las notas. IFRA no se escribe: la app lo lee por el CAS de la capa de IFRA (V3-35).
- **Sin usos habituales:** solo cuenta como uso la cifra «up to X % in the fragrance concentrate» con su base (regla de la tanda 46), y esa la da TGSC. Lo que dicen las otras páginas («use 0.1–2 %», la mediana de Fraterworks) queda en las notas de cada material.
- **No se usan:** las filas que el lector no pudo copiar literales (resúmenes, frases reconstruidas, campos leídos con WebFetch sin verificar) ni scent.vn (texto generado por IA). Quedan en las notas de cada material.
- **Fabricantes y CAS en disputa:** si otra referencia nombra otra casa (Hercolyn, Hydroxyambran, Ethyl linalool) o, en un natural, otro CAS (Oakwood, café), el valor de la tanda 57 se queda y el campo queda disputado: lo decides tú.
- **La familia** sale de la palabra de la referencia («Odor Type: woody» → woody, por `family_palette.csv`): es una lectura de la sesión.

| n | Material | Lo que se llena | Constituyentes | Sigue vacío |
|---|---|---|---|---|
| 54 | Jasmin Floraline 99 (Robertet) | — | 11 | family, tenacity_hours, strength, impact |
| 46 | Levistamel | family = gourmand (disputado); tenacity_hours = 408; impact = 6 | — | strength |
| 12 | Muscenone | family = animal; tenacity_hours = 336; strength = very_high; impact = 7 | — | — |
| 32 | Pear Bold Base (Moellhausen) | — | — | family, tenacity_hours, strength, impact |
| 4 | Fig Base (PCW) | — | — | family, tenacity_hours, strength, impact |
| 48 | Oak wood (chips), CO2 extract | — | 3 | family, tenacity_hours, strength, impact |
| 37 | Furfuryl mercaptan | impact = 10 | — | family, tenacity_hours, strength |
| 21 | Delta-decalactone | family = fruity; tenacity_hours = 100; strength = very_high; impact = 6 | — | — |
| 51 | Trisamber | family = animal (disputado); tenacity_hours = 108; impact = 8; cas = 338735-71-0 | — | strength |
| 28 | Velvione | family = animal; tenacity_hours = 720 (disputado); impact = 5 | — | strength |
| 45 | Ambrocenide | family = woody (disputado); tenacity_hours = 400; impact = 10 | — | strength |
| 34 | Frankincense (Boswellia carterii), essential oil | family = spicy | — | tenacity_hours, strength, impact |
| 3 | Frangipani Bold Base (Moellhausen) | — | 16 | family, tenacity_hours, strength, impact |
| 1 | 2-Methylpyrazine | family = transformed; impact = 6 | — | tenacity_hours, strength |
| 36 | Gamma-valerolactone | family = gourmand; impact = 4 | — | tenacity_hours, strength |
| 40 | Hydroxyambran | family = woody (disputado); tenacity_hours = 336; impact = 4 | — | strength |
| 31 | Thujopsene | family = woody; tenacity_hours = 24; impact = 3 | 8 | strength |
| 44 | Isolongifolene | — | — | family, tenacity_hours, strength, impact, house |
| 27 | Veraspice | family = spicy; tenacity_hours = 48; impact = 7 | — | strength |
| 2 | Wool, absolute | family = animal; tenacity_hours = 400; impact = 6 | — | strength |
| 24 | Hercolyn DW (methyl hydrogenated rosinate) | family = gourmand; tenacity_hours = 400; impact = 2 | — | strength |
| 15 | Jasmal | family = floral; tenacity_hours = 350 (disputado); strength = medium; impact = 5 | — | — |
| 29 | Ultravanil | family = gourmand; impact = 8 | — | tenacity_hours, strength |
| 18 | Ambrostar | family = animal (disputado); tier = base; strength = very_high; physical_state = Liquid; impact = 9; house = Symrise; cas = 1357064-95-9 | — | tenacity_hours |
| 35 | meta-Cresol | family = transformed | — | tenacity_hours, strength, impact |
| 6 | Yuzu peel, distilled essential oil | family = citrus | — | tenacity_hours, strength, impact |
| 53 | Coffee, absolute | family = gourmand; impact = 7 | 1 | tenacity_hours, strength |
| 19 | Edenolide | family = animal; tenacity_hours = 148; impact = 3 | — | strength |
| maese-461 | Ceylon cinnamon (bark), tincture | family = spicy; tier = heart; tenacity_hours = 24; physical_state = Dark red liquid | — | strength, impact, house |
| 5 | Matcha Ketone | family = spicy; impact = 9 | — | tenacity_hours, strength |
| 55 | Muscone | family = animal; tenacity_hours = 400; impact = 6 | — | strength |
| 26 | Ylanganate | family = floral; tenacity_hours = 24; impact = 8 | — | strength |
| 25 | Cuir 17500 (Synarome) | — | 20 | family, tenacity_hours, strength, impact |
| 7 | Bornyl acetate | family = green (disputado); tenacity_hours = 8; impact = 5 | — | strength |
| 14 | Hot Milk Bold Base (Moellhausen) | — | — | family, tenacity_hours, strength, impact |
| 23 | Oxyoctaline formate | family = woody; tenacity_hours = 360; impact = 6 | — | strength |
| 39 | Ethyl linalool | family = floral (disputado); tenacity_hours = 30 (disputado); impact = 5 | 1 | strength |
| 20 | Scentolide | family = animal; tenacity_hours = 240; impact = 5 (disputado) | — | strength |
| 41 | Cinnamalva (cinnamyl nitrile) | — | — | family, tenacity_hours, strength, impact |
| 42 | Ethyl pelargonate | family = fruity; tenacity_hours = 12; impact = 4 | — | strength |
| 50 | Ysamber K | family = woody (disputado); tenacity_hours = 392; impact = 7 | — | strength |
| 30 | Tropicalia | family = fruity; tier = top; tenacity_hours = 4; physical_state = Liquid (disputado); impact = 8; house = IFF; cas = 10138-32-6 | — | strength |
| 38 | Fructalate | family = fruity; impact = 5 | — | tenacity_hours, strength |
| 43 | Orionide | family = animal; physical_state = Clear mobile liquid; impact = 7; house = IFF | — | tenacity_hours, strength, cas |
| 49 | Cocoa thiazole (trimethylthiazole) | family = green; impact = 8 | — | tenacity_hours, strength |

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
| Levistamel | family | gourmand | PerfuMate: green |
| Oak wood (chips), CO2 extract | cas | 71011-28-4 (se queda) | 97676-30-7 (dsm-firmenich Studio (antes firmenich.com), https://studio.dsm-firmenich.com/product/oakwood-chip-sfe-pe-923036: «CAS# 0097676-30-7») |
| Trisamber | family | animal | PerfuMate: woody |
| Velvione | tenacity_hours | 720 | PerfumersWorld: 200; PerfuMate: 199 |
| Ambrocenide | family | woody | PerfuMate: animal |
| Hydroxyambran | family | woody | PerfuMate: animal |
| Hydroxyambran | house | Ventos (se queda) | Fraterworks, https://fraterworks.com/products/hydroxyambran: «Fraterworks® is strictly a reseller of this product and is neither an agent nor official distributor for Miltitz» (la tanda 57 puso «Ventos», de Perfumiarz) |
| Hercolyn DW (methyl hydrogenated rosinate) | house | Ventos (se queda) | Fraterworks, https://fraterworks.com/products/hercolyn-dw: «Firmenich» (la tanda 57 puso «Ventos», de Perfumiarz) |
| Jasmal | tenacity_hours | 350 | PerfuMate: 30 |
| Ambrostar | family | animal | PerfuMate: woody |
| Coffee, absolute | cas | 84650-00-0 (se queda) | 8001-67-0 (Robertet, https://matieres-premieres.robertet.com/coffee-absolute: «Coffee absolute Code 99050270 Botanical name Coffea arabica») |
| Bornyl acetate | family | green | Parchem: gourmand |
| Ethyl linalool | family | floral | PerfuMate: green |
| Ethyl linalool | tenacity_hours | 30 | PerfuMate: 12 |
| Ethyl linalool | house | Givaudan (se queda) | Ventos, https://www.ventos.com/index.php/en/producto/4972: «ETHYL LINALOOL BASF» (la tanda 57 puso «Givaudan», de Perfumiarz) |
| Scentolide | impact | 5 | PerfuMate Sublimolide: 6 |
| Ysamber K | family | woody | Scentspiracy: woody; PerfuMate: animal |
| Tropicalia | physical_state | Liquid | Ventos: Clear mobile liquied; Fraterworks: Colourless liquid |

## Documentos que no se usan

| n | Material | Qué |
|---|---|---|
| 41 | Cinnamalva (cinnamyl nitrile) | EU allergens declaration: the document is of the factory dilution («Cinnamalva 50% (DPG)»), not of the pure material; its figures are not used |
| 54 | Jasmin Floraline 99 (Robertet) | EU allergens declaration: the PDF has no text (scanned), not read |
| 54 | Jasmin Floraline 99 (Robertet) | IFRA certificate: the PDF has no text (scanned), not read |
| 53 | Coffee, absolute | SDS, section 3: producto del documento: «JASMIN FLORALINE 99»; producto de la tienda: «Coffee Absolute» — another product's document (or it does not say), not used |

## Topes de categoría 4 de los certificados (para tu versión, V3-39)

| n | Material | Tope |
|---|---|---|
| 3 | Frangipani Bold Base (Moellhausen) | 9.002 % |
| 12 | Muscenone | 4.2950 % |
| 15 | Jasmal | 40.0 % |
| 24 | Hercolyn DW (methyl hydrogenated rosinate) | sin restricción |
| 26 | Ylanganate | 40.0 % |
| 28 | Velvione | 4.300 % |
| 29 | Ultravanil | 0.12 % |
| 31 | Thujopsene | 7,5 % |
| 38 | Fructalate | sin restricción |
| 39 | Ethyl linalool | sin restricción |
| 40 | Hydroxyambran | sin restricción |
| 48 | Oak wood (chips), CO2 extract | 0.1250 % |
| 50 | Ysamber K | sin restricción |
| 53 | Coffee, absolute | 2,5000 % |
| 55 | Muscone | sin restricción |
