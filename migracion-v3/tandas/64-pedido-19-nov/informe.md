# Tanda 64 · El pedido de Perfumiarz del 19-nov, preparado antes de que llegue

*Generada por `migracion-v3/tanda-64-pedido-19-nov.ts` sobre lo común de `e3f546d`, desde `migracion-v3/web/info-64/`. Reescribe `materials.csv`, `material_doses.csv`, `material_descriptors.csv` y `material_components.csv` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-22: «Busca el último pedido de perfumiarz el que aún no está dado de alta que tiene entre los componentes whool absolute y resina de Oman. Puesto que ya llegará dentro de poco lo que quiero es que se prepare ya todos los datos para los materiales…». Es el pedido del 19-nov (laboratorio, rama `claude/perfumes-navidad`, `operaciones/compras/2026-11-19-pedido-perfumiarz.md`: 55 artículos, «Pendiente de llegar y de dar de alta»). Su «resina de Omán» es el **Olibanum Oil (Oman)** de Biolandes, el aceite esencial (el pedido no lleva resina ni resinoide). Lo común de los 55 ya entró en las tandas 57 y 60 a 63; esta tanda completa lo que faltaba. **Tus frascos (la cuenta) no entran aquí:** se dan de alta cuando lleguen, con su lote, y ahí van los topes de categoría 4 (V3-39).

**Cómo:**
- **IFRA, primero.** Qué certificado publica Perfumiarz en la página de cada producto (tanda 60, `fichas.csv`); para los que no, un lector Sonnet buscó el certificado IFRA, la declaración de alérgenos o la SDS **del mismo producto** en otra web (`ifra-fuera.csv`), y `documentos.py` los bajó y leyó por script con las reglas de la tanda 60. Sus constituyentes entran como literatura (documento público, no de tu frasco: la app dirá «acotado», nunca «dentro»); de una molécula no se toman (su IFRA sale de su CAS, V3-35). Un documento de la dilución de fábrica no da cifras.
- **TGSC vuelve a responder** (2026-11-22; daba 403 en las tandas 60 a 62). `tgsc.py` lee la ficha de cada molécula por script (el id, de Pyrfume por CAS exacto; la ficha tiene que dar ese CAS) y la de los naturales que el lector comprobó (especie y forma). Tipo de olor → familia, «Odor Strength» → fuerza, «Substantivity … at 100.00 %» → horas en tira, «usage levels up to … in the fragrance concentrate» → uso (V3-105), aspecto, densidad, solubilidad, peso molecular, fórmula, presión de vapor; y la descripción de olor. `consolidar.py` comprueba que cada frase está en la página guardada.
- **La intensidad (impacto, V3-97)** solo sale de PerfuMate (tanda 44 y 60): no hay más impactos que leer. Los que faltan siguen sin impacto.

**Resultado:** 209 campos llenos; 29 usos; 29 descriptores; 40 constituyentes; 15 campos disputados (TGSC dice otra cosa que la ficha); 3 lecturas no usadas.

## Para mirar antes de aprobar

- **Wool Absolute:** el certificado IFRA de Biolandes (F2915, que enlaza Fraterworks) dice «RESTRICTED MATERIAL(S) … None / Aucune» y la categoría 4 al 100 %; su declaración de alérgenos, «NONE» (límite 0,001 %). La app no tiene cómo guardar «declara ninguna»: IFRA sigue diciendo «desconocido» (lo desconocido no vale cero). **Decisión tuya:** si quieres un modo de apuntarlo (propuesta de la sesión: una marca «el certificado no declara restringidas», que dé «acotado», nunca «dentro»).
- **Sin nada público de IFRA:** Fig Base (PCW), Hot Milk Bold Base y Pear Bold Base (Moellhausen): ni Perfumiarz ni otra web publican su certificado o su SDS. Su IFRA será el certificado que venga con tu frasco (pídelo a Perfumiarz). El de Jasmin Floraline 99 es un escaneo sin texto.
- **Naturales con el documento de otro productor** (literatura, la app dirá «acotado»): patchouli (dossier de Youwish), ylang extra (certificado de un ylang extra orgánico de Comores de Biolandes; el de Perfumiarz no dice productor) y petitgrain bigarade (alérgenos de Capua 1880). El olíbano de Omán sí es el mismo producto: la SDS de Biolandes F1253 («OLIBANUM OMAN Oil»).
- **Fichas de TGSC de naturales con otro CAS** (mismo nombre y forma, comprobado por el lector): petitgrain (8014-17-3), café (8001-67-0) y olíbano (*B. carterii*, 89957-98-2). De TGSC, en los naturales, solo entraron físicos y el uso del patchouli (sus horas y su fuerza ya estaban).
- **Familias leídas por la sesión:** «melon» → fruity (Melonal) y «coffee» → transformed (furfuril mercaptano), por los «covers» de `family_palette.csv`.
- **Los 15 disputados** (abajo): TGSC dice otra cosa que la ficha; no cambia nada, solo se marca. Lo más llamativo: delta-decalactona (100 h frente a 336 h de TGSC) y Velvione (720 h frente a 400 h).
- **Lo que sigue faltando** (ninguna fuente lo dice): impacto de las bases, del yuzu, del olíbano, del meta-cresol y del isolongifoleno; horas de las bases y de varios naturales; la fuerza de Wool, Veraspice, Orionide, Ambrostar y las bases.

## IFRA, producto por producto

«Base IFRA» es por dónde llega la app a IFRA: el CAS de la molécula (V3-35; «sin estándar» = IFRA no lo restringe), el anexo de IFRA para el natural (por su CAS) o sus constituyentes.

| n | Producto | Certificado en Perfumiarz | De fuera | Base IFRA |
|---|---|---|---|---|
| 1 | 2-Methyl Pyrazine 5% (IPM) | sí | — | CAS (sin estándar) |
| 2 | Wool Absolute | no | ifra de Biolandes; alergenos de Biolandes | nada |
| 3 | Frangipani Bold Base | sí | — | 16 constituyentes |
| 4 | Fig Base | no | no encontrado | nada |
| 5 | Matcha Ketone 5% (TEC) | no | no encontrado | CAS (sin estándar) |
| 6 | Yuzu Distilled | no | no encontrado | anexo IFRA |
| 7 | Bornyl Acetate | no | no encontrado | CAS (sin estándar) |
| 8 | Ginger Oil Fresh (Madagascar) | sí | — | anexo IFRA |
| 9 | Melonal | sí | — | CAS (sin estándar) |
| 10 | Ambrox DL | no | sds de dsm-firmenich; alergenos de dsm-firmenich | CAS (sin estándar) |
| 11 | Hedione® HC | sí | — | CAS (sin estándar) |
| 12 | Muscenone® | sí | — | CAS (sin estándar) |
| 13 | Amber Xtreme™ | sí | — | CAS (sin estándar) |
| 14 | Hot Milk Bold Base | no | no encontrado | nada |
| 15 | Jasmal | sí | — | CAS (sin estándar) |
| 16 | Patchouli Crude Organic (Madagascar) | no | ifra de Youwish | 14 constituyentes |
| 17 | Ylang Ylang Oil Extra | no | ifra de Biolandes S.A.S | anexo IFRA + CAS en IFRA + 19 constituyentes |
| 18 | Ambrostar® | no | no encontrado | CAS (sin estándar) |
| 19 | Edenolide | sí | — | CAS (sin estándar) |
| 20 | Scentolide | sí | — | CAS (sin estándar) |
| 21 | Delta Decalactone | no | no encontrado | CAS (sin estándar) |
| 22 | Petitgrain Bigarade | no | alergenos de Capua 1880 | anexo IFRA + CAS en IFRA + 14 constituyentes |
| 23 | Oxyoctaline Formate | sí | — | CAS (sin estándar) |
| 24 | Hercolyn DW | sí | — | CAS (sin estándar) |
| 25 | Cuir 17500 | no | sds de Synarome | 20 constituyentes |
| 26 | Ylanganate | sí | — | CAS (sin estándar) |
| 27 | Veraspice™ | sí | — | CAS (sin estándar) |
| 28 | Velvione™ | sí | — | CAS (sin estándar) |
| 29 | Ultravanil 80% (DPG) | sí | — | CAS en IFRA |
| 30 | Tropicalia™ | no | ifra de IFF | CAS (sin estándar) |
| 31 | Thujopsene natural | sí | — | constituyentes |
| 32 | Pear Bold Base | no | no encontrado | nada |
| 33 | Paradisamide | sí | — | CAS (sin estándar) |
| 34 | Olibanum Oil (Oman) | no | sds de Biolandes | anexo IFRA + 7 constituyentes |
| 35 | Meta Cresol 10 % (DPG) | no | no encontrado | CAS (sin estándar) |
| 36 | Gamma Valerolactone | no | no encontrado | CAS (sin estándar) |
| 37 | Furfuryl Mercaptan 1% (DPG) | no | no encontrado | CAS (sin estándar) |
| 38 | Fructalate | sí | — | CAS (sin estándar) |
| 39 | Ethyl Linalool | sí | — | constituyentes |
| 40 | Hydroxyambran 50% (IPM) | sí | — | CAS (sin estándar) |
| 41 | Cinnamalva 50% (DPG) | no | sds de IFF (Hangzhou) Co. Ltd. | CAS en IFRA |
| 42 | Ethyl Pelargonate | no | no encontrado | CAS (sin estándar) |
| 43 | Orionide™ Oliffac | no | no encontrado | CAS (sin estándar) |
| 44 | Isolongifolene | no | no encontrado | CAS (sin estándar) |
| 45 | Ambrocenide Crystals | sí | — | CAS (sin estándar) |
| 46 | Levistamel 25% (TEC) | no | ifra de Lluch Essence | CAS (sin estándar) |
| 47 | Ambroxan® (powder) | sí | — | CAS (sin estándar) |
| 48 | Oakwood Chip SFE | sí | — | 3 constituyentes |
| 49 | Cocoa Thiazole 10% (IPM) | no | no encontrado | CAS (sin estándar) |
| 50 | Ysamber® K | sí | — | CAS (sin estándar) |
| 51 | Trisamber® | sí | — | CAS en IFRA |
| 52 | Ambrox Super (powder) | sí | — | CAS (sin estándar) |
| 53 | Coffee Absolute | sí | — | 1 constituyentes |
| 54 | Jasmin Floraline 99 | sí | — | 11 constituyentes |
| 55 | Muscone | sí | — | CAS (sin estándar) |

## Topes de categoría 4 de los documentos de fuera (para tu versión, V3-39)

| n | Material | Tope | Emisor |
|---|---|---|---|
| 2 | Wool, absolute | 100 % | Biolandes |
| 16 | Patchouli | sin restricción | Youwish |
| 17 | Cananga odorata (flower, extra), essential oil | 0.73 % | Biolandes S.A.S |
| 30 | Tropicalia | sin restricción (no declara sustancias restringidas) | IFF |
| 46 | Levistamel | sin restricción | Lluch Essence |

## Disputados (TGSC frente a lo que ya había; el valor no cambia)

| Material | Campo | Se queda | Otra |
|---|---|---|---|
| Matcha Ketone | family | spicy | TGSC: fruity |
| Bornyl acetate | family | green | TGSC: gourmand |
| Muscenone | strength | very_high | TGSC: high |
| Patchouli | strength | high | TGSC: medium |
| Edenolide | family | animal | TGSC: floral |
| Delta-decalactone | family | fruity | TGSC: gourmand |
| Delta-decalactone | strength | very_high | TGSC: medium |
| Delta-decalactone | tenacity_hours | 100 | TGSC: 336 |
| Velvione | tenacity_hours | 720 | TGSC: 400 |
| Frankincense (Boswellia carterii), essential oil | family | spicy | TGSC: woody |
| Gamma-valerolactone | family | gourmand | TGSC: green |
| Ethyl linalool | tenacity_hours | 30 | TGSC: 12 |
| Cocoa thiazole (trimethylthiazole) | family | green | TGSC: gourmand |
| Ysamber K | family | woody | TGSC: animal |
| Coffee, absolute | family | gourmand | TGSC: transformed |

## Material por material

| n | Material | Faltaba | Lo que se llena |
|---|---|---|---|
| 1 | 2-Methylpyrazine | horas fuerza dosis fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, melting_point_c, solubility); uso hasta 0.1 % (concentrate); olor (TGSC) |
| 2 | Wool, absolute | fuerza dosis fisico | — |
| 3 | Frangipani Bold Base (Moellhausen) | familia horas fuerza impacto dosis olor fisico | — |
| 4 | Fig Base (PCW) | familia horas fuerza impacto dosis olor fisico | — |
| 5 | Matcha Ketone | horas fuerza dosis fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 2 % (concentrate); olor (TGSC) |
| 6 | Yuzu peel, distilled essential oil | horas fuerza impacto dosis olor fisico | — |
| 7 | Bornyl acetate | fuerza fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 9 % (concentrate); olor (TGSC) |
| 8 | Ginger root, essential oil | fisico | físicos (appearance, solubility) |
| 9 | Melon heptenal | familia fuerza dosis fisico | family = fruity; strength = high; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 2 % (concentrate) |
| 10 | Ambermor | — | uso hasta 1 % (concentrate) |
| 11 | Hedione | — | uso hasta 30 % (concentrate) |
| 12 | Muscenone | fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 5 % (concentrate); olor (TGSC) |
| 13 | Musk indenofuran | dosis fisico | físicos (appearance, density, molecular_weight, formula, solubility) |
| 14 | Hot Milk Bold Base (Moellhausen) | familia horas fuerza impacto dosis olor fisico | — |
| 15 | Jasmal | fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 5 % (concentrate); olor (TGSC) |
| 16 | Patchouli | — | uso hasta 10 % (concentrate) |
| 17 | Cananga odorata (flower, extra), essential oil | familia fuerza dosis olor fisico | 19 constituyentes |
| 18 | Ambrostar | horas fisico | — |
| 19 | Edenolide | fuerza fisico | strength = medium; físicos (molecular_weight, formula, solubility); uso hasta 30 % (concentrate); olor (TGSC) |
| 20 | Scentolide | fuerza fisico | strength = medium; físicos (appearance, density, molecular_weight, formula, solubility); uso hasta 2 % (concentrate); olor (TGSC) |
| 21 | Delta-decalactone | fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, melting_point_c, solubility); uso hasta 8 % (concentrate); olor (TGSC) |
| 22 | Petitgrain bigarade, essential oil | horas fuerza fisico | físicos (appearance, solubility); 14 constituyentes |
| 23 | Oxyoctaline formate | fuerza fisico | strength = medium; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 10 % (concentrate); olor (TGSC) |
| 24 | Hercolyn DW (methyl hydrogenated rosinate) | fuerza dosis fisico | strength = low; físicos (appearance, solubility); uso hasta 20 % (concentrate); olor (TGSC) |
| 25 | Cuir 17500 (Synarome) | familia horas fuerza impacto dosis olor fisico | — |
| 26 | Ylanganate | fuerza fisico | físicos (density, molecular_weight, formula, vapor_pressure, solubility); olor (TGSC) |
| 27 | Veraspice | fuerza fisico | — |
| 28 | Velvione | fuerza fisico | strength = medium; físicos (appearance, density, molecular_weight, formula, vapor_pressure, melting_point_c, solubility); uso hasta 4 % (concentrate); olor (TGSC) |
| 29 | Ultravanil | horas fuerza dosis fisico | strength = medium; tenacity_hours = 400; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); olor (TGSC) |
| 30 | Tropicalia | fuerza fisico | físicos (molecular_weight, formula, vapor_pressure, solubility); olor (TGSC) |
| 31 | Thujopsene | fuerza fisico | físicos (appearance, molecular_weight, formula, vapor_pressure, solubility) |
| 32 | Pear Bold Base (Moellhausen) | familia horas fuerza impacto dosis olor fisico | — |
| 33 | Paradisamide | — | uso hasta 15 % (concentrate) |
| 34 | Frankincense (Boswellia carterii), essential oil | horas fuerza impacto dosis fisico | 7 constituyentes |
| 35 | meta-Cresol | horas fuerza impacto dosis fisico | strength = high; tenacity_hours = 43; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 0.01 % (concentrate); olor (TGSC) |
| 36 | Gamma-valerolactone | horas fuerza dosis fisico | strength = medium; tenacity_hours = 2; físicos (appearance, density, molecular_weight, formula, vapor_pressure, melting_point_c, solubility); uso hasta 10 % (concentrate); olor (TGSC) |
| 37 | Furfuryl mercaptan | familia horas fuerza dosis fisico | family = transformed; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 0.05 % (concentrate); olor (TGSC) |
| 38 | Fructalate | horas fuerza dosis fisico | strength = medium; tenacity_hours = 48; físicos (appearance, molecular_weight, formula, vapor_pressure, solubility); uso hasta 10 % (concentrate); olor (TGSC) |
| 39 | Ethyl linalool | fuerza fisico | strength = medium; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 40 % (concentrate); olor (TGSC) |
| 40 | Hydroxyambran | fuerza dosis fisico | físicos (appearance, molecular_weight, formula, melting_point_c, solubility); uso hasta 5 % (concentrate); olor (TGSC) |
| 41 | Cinnamalva (cinnamyl nitrile) | familia horas fuerza impacto olor fisico | family = spicy; strength = medium; tenacity_hours = 84; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); olor (TGSC) |
| 42 | Ethyl pelargonate | fuerza fisico | físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 8 % (concentrate) |
| 43 | Orionide | horas fuerza olor fisico | — |
| 44 | Isolongifolene | familia horas fuerza impacto dosis fisico | family = woody; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 4 % (concentrate); olor (TGSC) |
| 45 | Ambrocenide | fuerza fisico | físicos (appearance, molecular_weight, formula, vapor_pressure, solubility); olor (TGSC) |
| 46 | Levistamel | fuerza dosis fisico | strength = medium; físicos (molecular_weight, formula, vapor_pressure, solubility); uso hasta 1 % (concentrate); olor (TGSC) |
| 47 | Ambermor | — | uso hasta 1 % (concentrate) |
| 48 | Oak wood (chips), CO2 extract | familia horas fuerza impacto dosis olor fisico | — |
| 49 | Cocoa thiazole (trimethylthiazole) | horas fuerza dosis fisico | strength = high; tenacity_hours = 16; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 0.5 % (concentrate); olor (TGSC) |
| 50 | Ysamber K | fuerza fisico | strength = medium; físicos (appearance, density, molecular_weight, formula, vapor_pressure, solubility); uso hasta 10 % (concentrate); olor (TGSC) |
| 51 | Trisamber | fuerza fisico | strength = high; físicos (appearance, molecular_weight, formula, solubility); uso hasta 2 % (concentrate); olor (TGSC) |
| 52 | Ambermor | — | uso hasta 1 % (concentrate) |
| 53 | Coffee, absolute | horas fuerza dosis fisico | físicos (solubility); olor (TGSC) |
| 54 | Jasmin Floraline 99 (Robertet) | familia horas fuerza impacto dosis olor fisico | — |
| 55 | Muscone | fuerza fisico | strength = high; físicos (appearance, density, molecular_weight, formula, vapor_pressure, melting_point_c, solubility); uso hasta 2 % (concentrate); olor (TGSC) |
