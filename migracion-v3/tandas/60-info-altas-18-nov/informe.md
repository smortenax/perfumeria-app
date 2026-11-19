# Tanda 60 · La línea de información de las altas del 18-nov

*Generada por `migracion-v3/tanda-60-info-altas-18-nov.ts` sobre lo común de `5725fa3` (con la tanda 57 ya aprobada), desde `migracion-v3/web/info-18-nov/`. Escribe `v3/datos/materials.csv`, `material_doses.csv`, `material_descriptors.csv` y `material_components.csv` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «Apruebo 57, 58 y 59, empieza la línea de información» y «empieza el thread separado de la info». Los 44 comunes de la tanda 57 entraron a medias (sin familia, duración, dosis, composición, descriptores ni impacto).

**Cómo:**

- **La ficha:** para cada material se leyeron hasta tres páginas de referencia (TGSC primero y una independiente: la casa, Fraterworks, Perfumer's Apprentice…; `migracion-v3/web/info-18-nov/web-60-*.csv`, con la frase literal) y PerfuMate en local. `consolidar.py` elige con las reglas de las tandas 46 y 47: orden de referencias y, si no coinciden, va la primera y el campo queda disputado. Una página de otro CAS, otra especie u otro proceso no cuenta. **El impacto**, solo de PerfuMate y cuando es el mismo material (V3-97): una molécula por su CAS; un natural o una base, por nombre y casa. La descripción de olor de Perfumiarz («Zapach: …», en polaco) entra como descriptor, citada.
- **La composición:** `bajar.py` baja los documentos del fabricante que enlaza cada página de Perfumiarz (SDS, IFRA, alérgenos, CoA; no se guardan en Git) y `extraer.py` lee sus cifras por script, con la página y la línea literal (`migracion-v3/web/info-18-nov/documentos.csv`). Entran como literatura (documento del fabricante, no del frasco comprado, como en las tandas 29 y 51): la app dirá «acotado», nunca «dentro». Si un alérgeno sale en la declaración y en la SDS, va la cifra de la declaración.

**Resultado:** 93 campos llenos; 0 usos habituales; 75 descriptores; 60 constituyentes en 7 materiales; 7 campos disputados.

**Para mirar antes de aprobar:**

- **Documentos equivocados en Perfumiarz:** el script compara el producto que nombra cada documento con el de la página. Los que no coinciden no se usan (lista abajo y en las notas de cada material).
- **Diluidos de fábrica** (2-metilpirazina 5 %, Ultravanil 80 %, Cinnamalva 50 %…): sus documentos son de la dilución, y lo común es el material puro: no se usan sus cifras.
- **Topes del fabricante (categoría 4 del certificado IFRA):** son del producto, así que van a tu versión cuando tengas el frasco (V3-39); aquí solo se apuntan en las notas. IFRA no se escribe: la app lo lee por el CAS de la capa de IFRA (V3-35).
- **La familia** sale de la palabra de la referencia («Odor Type: woody» → woody, por `family_palette.csv`): es una lectura de la sesión.

| n | Material | Lo que se llena | Constituyentes | Sigue vacío |
|---|---|---|---|---|
| 54 | Jasmin Floraline 99 (Robertet) | — | 11 | family, tenacity_hours, strength, impact |
| 46 | Levistamel | family = green; tenacity_hours = 408; impact = 6 | — | strength |
| 12 | Muscenone | family = animal; tenacity_hours = 336; strength = very_high; impact = 7 | — | — |
| 32 | Pear Bold Base (Moellhausen) | — | — | family, tenacity_hours, strength, impact |
| 4 | Fig Base (PCW) | — | — | family, tenacity_hours, strength, impact |
| 48 | Oak wood (chips), CO2 extract | — | 3 | family, tenacity_hours, strength, impact |
| 37 | Furfuryl mercaptan | impact = 10 | — | family, tenacity_hours, strength |
| 21 | Delta-decalactone | family = fruity; tenacity_hours = 100; strength = very_high; impact = 6 | — | — |
| 51 | Trisamber | family = woody; impact = 8 | — | tenacity_hours, strength, cas |
| 28 | Velvione | family = animal; tenacity_hours = 720 (disputado); impact = 5 | — | strength |
| 45 | Ambrocenide | family = animal; impact = 10 | — | tenacity_hours, strength |
| 34 | Frankincense (Boswellia carterii), essential oil | family = spicy | — | tenacity_hours, strength, impact |
| 3 | Frangipani Bold Base (Moellhausen) | — | 16 | family, tenacity_hours, strength, impact |
| 1 | 2-Methylpyrazine | family = transformed; strength = high; impact = 6 | — | tenacity_hours |
| 36 | Gamma-valerolactone | family = gourmand; impact = 4 | — | tenacity_hours, strength |
| 40 | Hydroxyambran | family = animal; impact = 4 | — | tenacity_hours, strength |
| 31 | Thujopsene | family = woody; tenacity_hours = 24; impact = 3 | 8 | strength |
| 44 | Isolongifolene | — | — | family, tenacity_hours, strength, impact, house |
| 27 | Veraspice | family = spicy; tenacity_hours = 48; impact = 7 | — | strength |
| 2 | Wool, absolute | family = animal; tenacity_hours = 400; impact = 6 | — | strength |
| 24 | Hercolyn DW (methyl hydrogenated rosinate) | family = gourmand; tenacity_hours = 400; impact = 2 | — | strength |
| 15 | Jasmal | family = floral; tenacity_hours = 350 (disputado); strength = medium; impact = 5 | — | — |
| 29 | Ultravanil | family = gourmand; impact = 8 | — | tenacity_hours, strength |
| 18 | Ambrostar | family = animal (disputado); strength = very_high; physical_state = Liquid; impact = 9; house = Symrise; cas = 1357064-95-9 | — | tenacity_hours |
| 35 | meta-Cresol | family = transformed | — | tenacity_hours, strength, impact |
| 6 | Yuzu peel, distilled essential oil | family = citrus | — | tenacity_hours, strength, impact |
| 53 | Coffee, absolute | impact = 7 | 1 | family, tenacity_hours, strength |
| 19 | Edenolide | family = animal; tenacity_hours = 148; impact = 3 | — | strength |
| maese-461 | Ceylon cinnamon (bark), tincture | family = spicy; tenacity_hours = 24; physical_state = Dark red liquid | — | strength, impact, house |
| 5 | Matcha Ketone | family = spicy (disputado); strength = medium; impact = 9 | — | tenacity_hours |
| 55 | Muscone | family = animal; tenacity_hours = 336; impact = 6 | — | strength |
| 26 | Ylanganate | family = floral; tenacity_hours = 24; impact = 8 | — | strength |
| 25 | Cuir 17500 (Synarome) | — | 20 | family, tenacity_hours, strength, impact |
| 7 | Bornyl acetate | family = green (disputado); tenacity_hours = 8; impact = 5 | — | strength |
| 14 | Hot Milk Bold Base (Moellhausen) | — | — | family, tenacity_hours, strength, impact |
| 23 | Oxyoctaline formate | family = woody; tenacity_hours = 360; impact = 6 | — | strength |
| 39 | Ethyl linalool | family = green; tenacity_hours = 12; impact = 5 | 1 | strength |
| 20 | Scentolide | family = animal; tenacity_hours = 240; strength = high; impact = 5 (disputado) | — | — |
| 41 | Cinnamalva (cinnamyl nitrile) | — | — | family, tenacity_hours, strength, impact |
| 42 | Ethyl pelargonate | family = fruity; tenacity_hours = 12; impact = 4 | — | strength |
| 50 | Ysamber K | family = animal; impact = 7 | — | tenacity_hours, strength |
| 38 | Fructalate | family = fruity; impact = 5 | — | tenacity_hours, strength |
| 43 | Orionide | family = animal; impact = 7 | — | tenacity_hours, strength, house, cas |
| 49 | Cocoa thiazole (trimethylthiazole) | family = green; impact = 8 | — | tenacity_hours, strength |

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
| Velvione | tenacity_hours | 720 | PerfumersWorld: 200; PerfuMate: 199 |
| Hercolyn DW (methyl hydrogenated rosinate) | house | Ventos (se queda) | Fraterworks, https://fraterworks.com/products/hercolyn-dw: «Firmenich» (la tanda 57 puso «Ventos», de Perfumiarz) |
| Jasmal | tenacity_hours | 350 | PerfuMate: 30 |
| Ambrostar | family | animal | PerfuMate: woody |
| Matcha Ketone | family | spicy | scent.vn: fruity |
| Bornyl acetate | family | green | Parchem: gourmand |
| Scentolide | impact | 5 | PerfuMate Sublimolide: 6 |

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
