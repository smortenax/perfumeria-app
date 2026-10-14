# Tanda 7 · Los materiales del laboratorio, en lo común

*Generada por `migracion-v3/tanda-7-materiales.ts` desde `../Perfumery/biblioteca/materiales.sqlite` (commit `c0e81e3` del laboratorio, sin cambios locales; abierto solo para leer), tus respuestas a `conflictos/laboratorio.csv` (`respuestas/laboratorio.csv`: la pareja de cada material en la v2) y la v2, la v1 y los archivos de IFRA del commit `d4c1e55`. `validar:v2`: sin errores. No va a `v3/datos/` hasta que la apruebes.*

**Qué es.** Tus 111 materiales del laboratorio (`materials` de `materiales.sqlite`: 111 filas, todas con `owner_id` vacío allí) pasan a ser los materiales **comunes** de la v3 (V3-34, V3-36), con su información general y sin lo personal. No son versiones (sin `based_on_id`) y todos llevan su identidad (CAS, especie, parte, proceso…). Los ids son `uuidFor("comun:<id del laboratorio>")`: volver a ejecutar da los mismos bytes.

## Qué entra

| Archivo | Filas | De dónde |
|---|---|---|
| `materials.csv` | 111 | `materials` (111), `material_synonyms` (1049), `material_physical` (108), `conflicts` pendientes (222), `ifra_entries` (107) y la pareja de cada material en la v2/v1 |
| `material_descriptors.csv` | 1118 | `material_descriptors` (1173 filas; 55 idénticas se fusionan) |
| `material_relations.csv` | 1156 | `material_relations` (1156 filas): 214 enlazan con otro material de la tanda y 942 llevan solo el nombre |
| `material_references.csv` | 91 | `material_references` (91 filas) |
| `material_doses.csv` | 421 | `material_dosages` (483 filas; 62 sin ninguna cifra no entran; 0 idénticas se fusionan): 156 en disputa |

Tipos: molecule 74, natural 30, composition 7 (el del laboratorio). Cada columna lleva el nombre del esquema (`v3/db/schema/materials.ts`), sin `created_at` ni `updated_at`.

## De dónde sale cada campo

| Campo | Origen | Cuántos lo llevan |
|---|---|---|
| `id` | `uuidFor("comun:<id del laboratorio>")`, el mismo siempre | 111 |
| `name`, `kind`, `form`, `house`, `code`, `odor_target`, `synthesis`, `isomers`, `species`, `part`, `process`, `chemotype`, `inci`, `origin` | `materials` del laboratorio (`origin` es su «procedencia»; el tipo, el del laboratorio) | `name` 111, `kind` 111, `cas` 103, `inci` 44, `species` 29, `origin` 29 |
| `solvent` | función «disolvente» del laboratorio (entonces `role` queda vacío) | 3 |
| `aliases` | `material_synonyms` del laboratorio, más el nombre del material de la v2 y los nombres de las filas de la v1 de la pareja (comercial, sigla, IFRA, sinónimos, PubChem, transparencia, tiendas; no el código); sin repetir el nombre ni mayúsculas distintas | 111 materiales; 922 nombres vienen de la pareja |
| `cas`, `other_cas` | el primer CAS que encuentra `\b\d{2,7}-\d{2}-\d\b` en el texto de CAS del laboratorio; el resto, en orden y sin repetir | `cas` 103, `other_cas` 11 |
| `abbreviation`, `abbreviation_origin` | `codigo` y `codigo_origen` de la pareja del material en la v1 (V3-37): `usuario` → `user`, `generado` → `generated`; única en la tanda | 97 del usuario, 5 generadas |
| `family` | `familia` de la pareja en la v1, en la lista cerrada de P48 (V3-18, V3-38) | 97 de 111 |
| `color` | vacío: sale de la paleta de la familia (V3-38) | 0 |
| `family_detail`, `facets` | `family` y `facets` del laboratorio, en texto libre | `family_detail` 108, `facets` 107 |
| `tier`, `strength`, `role`, `confidence` | `materials` del laboratorio, traducidos a la escala en inglés de la v3 (`top-heart` → `top_heart`, `muy alto` → `very_high`, `estructura` → `structure`, `alta` → `high`…) | `tier` 108, `strength` 105, `role` 102, `confidence` 111 |
| `tenacity_hours`, `tenacity_source` | `tenacity_h` del laboratorio, número exacto en horas; la fuente es una frase fija que cita el comentario de `esquema.sql` («horas en tira, material puro (escala TGSC)») (V3-42) | 94 |
| `evolution_*` (cinco) | vacías: `evolution` del laboratorio no tiene ningún dato (V3-42) | 0 |
| `threshold`, `diffusion`, `blend_effect`, `recommended_dilution`, `cost`, `handling`, `notes` | `materials` del laboratorio, tal cual | `threshold` 25, `diffusion` 46, `blend_effect` 106, `recommended_dilution` 78, `cost` 1, `handling` 107, `notes` 108 |
| `physical_state`, `appearance`, `stains`, `solubility`, `density`, `melting_point_c`, `formula`, `molecular_weight`, `vapor_pressure`, `stability`, `incompatibilities`, `physical_sources` | `material_physical` del laboratorio (`state`, `color`, `stains`, `solubility`, `density`, `melting_point_c`, `formula`, `molecular_weight`, `vapor_pressure`, `stability`, `incompatibilities`, `sources`); los números, como decimales exactos | `physical_state` 108, `density` 80, `melting_point_c` 25, `molecular_weight` 71 |
| `sources` | `lab: ` y las fuentes del laboratorio de ese material | 111 |
| `disputed_fields` | conflictos con estado «pendiente» de `conflicts` del laboratorio, con el nombre del campo en la v3 (`tenacity_h` → `tenacity_hours`, `family` → `family_detail`, `state` → `physical_state`; `dosage` marca la dosis, no el material) | 84 materiales |
| `ifra_unverified` | vacío en lo común (V3-32, V3-35): el texto de `ifra_entries` va a tu versión | 0 |
| `owner_id`, `category_id`, `based_on_id`, `grade`, `supplier`, `product`, `product_url`, `purity` | vacíos: lo común no tiene dueño ni tienda ni frasco; las categorías vienen en un paso posterior | 0 |

**Las dosis** (`material_doses.csv`): `min`, `typical` y `max` son el porcentaje del laboratorio pasado a fracción de 1 con `pctToFraction`, sin coma flotante. La `basis` sale de la base del laboratorio («% del concentrado» → `concentrate`, «% del producto terminado» → `finished_product`, «sin declarar…» → `undeclared`, con la frase original en `notes`). La `authority` sale del tipo del laboratorio (consensus → `consensus`, literature → `literature`, supplier → `product`). `notes` lleva el texto original de la fuente y la confianza del laboratorio.

## Lo que no entra y por qué

- **La composición** de `material_components` (239 filas): aplazada (V3-33).
- **Las voces** (los JSON de `2026-10-11-voces-materiales`): entran cuando el laboratorio las meta en su biblioteca (V3-40). Esta tanda no lee ningún JSON.
- **Tu parte personal** (V3-36), que irá a tu versión en una tanda posterior: `user_materials` (110), `user_bottles` (53), `user_evaluations` (107) y `user_material_axes` (132). Aquí no se lee ninguna.
- **La monografía** (`monograph`, 29 rutas al repo del laboratorio): no tiene columna en la v3.
- **El IFRA de segunda mano con cifras** (V3-32): solo pasa el texto sin cifras de `ifra_entries`; las cifras (`cat4_pct_finished`, 14 filas) y las condiciones con números se quedan en el laboratorio. Lo regulado de IFRA sale solo de sus archivos (V3-35).
- **Del laboratorio, sin destino en la v3:** `research_runs` (212), la tabla `sources` (12 etiquetas), `material_allergens` (0), los conflictos resueltos y los valores y fuentes de cada conflicto: solo viaja el nombre del campo en disputa (V3-17).
- **Categorías:** `category_id` vacío; las categorías llegan en un paso posterior.

## Para revisar

### Valores fuera de escala (2)

- MAT-esencia-de-trufa: potencia «sin medir» no está en la escala de la v3; queda vacío.
- MAT-haba-tonka-tintura: potencia «bajo (es una tintura)» se lee como «low».

### Abreviaturas (32)

- MAT-aceite-de-cade-enebro: su pareja P00054 (material M00054) tiene 2 filas con código en la v1; se toma «CdO» (fig:1285) y no «CadO» (fig:1287).
- MAT-aldambre: la abreviatura «OxO» (tl:947-05-7) es generada, provisional.
- MAT-aldehido-c11-moa: su pareja P00005 (material M00005) tiene 2 filas con código en la v1; se toma «Met» (fig:507) y no «AlM» (prod:symrise-656012).
- MAT-ambermor: su pareja P00008 (material M00008) tiene 2 filas con código en la v1; se toma «NFD» (fig:2427) y no «NF» (fig:2426).
- MAT-ambrettolide: su pareja P00072 (material M00072) tiene 2 filas con código en la v1; se toma «HH» (fig:183) y no «Am2» (tienda:63286-42-0).
- MAT-auranone: su pareja P00081 (material M00081) no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.
- MAT-balsamo-de-tolu-resinoide: su pareja P00079 (material M00079) no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.
- MAT-black-agar-296985: su pareja P00061 (material M00061) no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.
- MAT-cacao-absoluto: su pareja P00060 (material M00060) no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.
- MAT-cassis-base-345-b: su pareja P00067 (material M00067) no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.
- MAT-castoreo-sintetico: la abreviatura «CaS» (prod:firmenich-184004) es generada, provisional.
- MAT-castoreum: su pareja P00004 (material M00004) tiene 2 filas con código en la v1; se toma «CtA» (fig:1343) y no «CsE» (fig:1345).
- MAT-cilantro: su pareja P00044 (material M00044) tiene 2 filas con código en la v1; se toma «COSO» (fig:1533) y no «COHO» (fig:1529).
- MAT-dewfruit-tec: sin pareja en la v2 («material nuevo»): sin abreviatura ni familia; no se inventa.
- MAT-dihydromyrcenol: su pareja P00028 (material M00028) tiene 2 filas con código en la v1; se toma «Di18» (fig:1672) y no «OOM» (fig:946).
- MAT-dpg: la abreviatura «Dipr» (tl:25265-71-8) es generada, provisional.
- MAT-esencia-de-trufa: su pareja P00056 (material M00056) no tiene ninguna fila en la v1 (datos/v2/v1-a-v2.csv): sin abreviatura ni familia.
- MAT-etanol: la abreviatura «EA8» (tl:64-17-5) es generada, provisional.
- MAT-haba-tonka-tintura: su pareja P00057 (material M00057) tiene 2 filas con código en la v1; se toma «TBT» (fig:2992) y no «TOBE» (fig:2990).
- MAT-ipm: la abreviatura «IsM» (tl:110-27-0) es generada, provisional.
- MAT-iso-e-super: su pareja P00034 (material M00034) tiene 2 filas con código en la v1; se toma «OT» (fig:92) y no «OE» (fig:94).
- MAT-laudano-de-jara: su pareja P00058 (material M00058) tiene 2 filas con código en la v1; se toma «LaA» (fig:2143) y no «LaO» (fig:2150).
- MAT-miel-esencia-aromatica: sin pareja en la v2 («material nuevo»): sin abreviatura ni familia; no se inventa.
- MAT-musgo-de-roble-absoluto: su pareja P00006 (material M00006) tiene 2 filas con código en la v1; se toma «OaA» (fig:2480) y no «OAI» (prod:iff-00133097).
- MAT-naranja-dulce: su pareja P00048 (material M00048) tiene 2 filas con código en la v1; se toma «ORSO» (fig:2551) y no «ORPO» (fig:2557).
- MAT-olibano-boswellia-sacra-aceite-esencial: su pareja P00059 (material M00059) tiene 2 filas con código en la v1; se toma «OlO» (fig:2521) y no «OlSO» (ncs:olibanum-sacra-oil).
- MAT-patchouli: su pareja P00049 (material M00049) tiene 2 filas con código en la v1; se toma «PtO» (fig:2599) y no «PcO» (fig:2600).
- MAT-resinoide-benjui: su pareja M00050 tiene 2 filas con código en la v1; se toma «BSR» (fig:1168) y no «BGS» (fig:1165).
- MAT-resinoide-estyrax-estoraque: su pareja P00051 (material M00051) tiene 2 filas con código en la v1; se toma «StR» (fig:2914) y no «SR» (fig:2913).
- MAT-salvia-officinalis: su pareja P00052 (material M00052) tiene 2 filas con código en la v1; se toma «SDO» (fig:2838) y no «SSO» (fig:2839).
- MAT-suederal: sin pareja en la v2 («material nuevo»): sin abreviatura ni familia; no se inventa.
- MAT-vetiver: su pareja P00053 (material M00053) tiene 2 filas con código en la v1; se toma «VeO» (fig:3083) y no «VtO» (fig:3087).

### Familias (5)

- MAT-aldambre: la v1 no da familia para su pareja P00083 (material M00083); queda vacía.
- MAT-castoreo-sintetico: la v1 no da familia para su pareja P00007 (material M00007); queda vacía.
- MAT-dpg: la v1 no da familia para su pareja M02952; queda vacía.
- MAT-etanol: la v1 no da familia para su pareja M03145; queda vacía.
- MAT-ipm: la v1 no da familia para su pareja M02733; queda vacía.

### CAS (3)

- MAT-balsamo-de-tolu-resinoide: el texto de CAS lleva más que los números (se pierde lo que no es CAS): «9000-64-0 (Scentspiracy, Fraterworks). Perfumiarz pone «mix» en su campo CAS. Scentspiracy lista además 8013-12-5 para «related extracts».»
- MAT-cacao-absoluto: el texto de CAS lleva más que los números (se pierde lo que no es CAS): «84649-99-0 (Maese Lab). ScenTree: 8002-31-1, con 84649-99-0 como EINECS.»
- MAT-patchouli: el texto de CAS lleva más que los números (se pierde lo que no es CAS): «8014-09-3 (Fraterworks y Perfumer's Apprentice); 84238-39-1 (PerfumersWorld)»

### Texto que parece del usuario o de su tienda (6)

- `notes`: 32 materiales (ver el CSV) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.
- `isomers`: 10 materiales (ver el CSV) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.
- `physical_state`: 2 materiales (MAT-esencia-de-trufa, MAT-litsea-cubeba) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.
- `handling`: 5 materiales (MAT-cilantro, MAT-lavanda, MAT-limon, MAT-litsea-cubeba, MAT-mandarina) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.
- `recommended_dilution`: 5 materiales (MAT-cilantro, MAT-lavanda, MAT-limon, MAT-litsea-cubeba, MAT-mandarina) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.
- `origin`: 5 materiales (MAT-cilantro, MAT-lavanda, MAT-limon, MAT-litsea-cubeba, MAT-mandarina) hablan de «Olfatorium», «el kit», «el usuario» o de cuándo se compró o se pesó. Entra tal cual, como pediste que entre lo del laboratorio.

### En disputa (3)

- `disputed_fields` lleva «components» en 9 materiales: no es una columna del material (es el nombre del campo del laboratorio, que no cambia).
- `disputed_fields` lleva «identity» en 32 materiales: no es una columna del material (es el nombre del campo del laboratorio, que no cambia).
- **Lo que cambia respecto a la tanda 5:** allí los conflictos de datos físicos (state 16, density 2, melting_point_c 1, solubility 1, molecular_weight 1; 21 en total, materiales distintos por campo) no viajaban porque esos datos no entraban. Aquí los datos físicos entran (V3-36), así que sus conflictos entran como «en disputa» (V3-17), con `state` → `physical_state`. Para quitarlos otra vez: `PHYSICAL_DISPUTES = false` en el script.

### IFRA sin verificar (2)

- **No entra en lo común** (V3-32: «Lo común no lo lleva»; V3-35: IFRA, fuera de la ficha). El texto de `ifra_entries` (107 materiales) irá a tu versión, en la tanda de tu cuenta, con su conflicto pendiente si lo tiene.
- 74 notas de condición llevan cifras o fechas (límites copiados de tiendas, fechas del banco): tampoco irán a tu versión, se quedan en el laboratorio.

### Duplicados fusionados y dosis (3)

- 92 sinónimos del laboratorio solo se diferenciaban en mayúsculas de otro del mismo material (por ejemplo «Popcorn pyrazine» y «popcorn pyrazine») y entran una vez.
- 55 descriptores idénticos (mismo material, fuente y texto) en `material_descriptors` del laboratorio entran una vez.
- 62 dosis del laboratorio no tienen ninguna cifra (solo texto, por ejemplo «cat. 4: 0,50–5,00 %») y no entran: el esquema pide al menos una.

### Otros (0)

- Nada.

### Resumen de abreviaturas y familias

- **Sin pareja en la v2 («material nuevo»):** 3 (MAT-dewfruit-tec, MAT-miel-esencia-aromatica, MAT-suederal). Sin abreviatura ni familia.
- **Con pareja, pero sin fila en la v1:** 6 (MAT-auranone → P00081 (material M00081); MAT-balsamo-de-tolu-resinoide → P00079 (material M00079); MAT-black-agar-296985 → P00061 (material M00061); MAT-cacao-absoluto → P00060 (material M00060); MAT-cassis-base-345-b → P00067 (material M00067); MAT-esencia-de-trufa → P00056 (material M00056)).
- **Sin abreviatura en total:** 9 de 111. **Con abreviatura tuya:** 97. **Generada, provisional:** 5.
- **Sin familia:** 14 de 111 (MAT-aldambre, MAT-auranone, MAT-balsamo-de-tolu-resinoide, MAT-black-agar-296985, MAT-cacao-absoluto, MAT-cassis-base-345-b, MAT-castoreo-sintetico, MAT-dewfruit-tec, MAT-dpg, MAT-esencia-de-trufa, MAT-etanol, MAT-ipm, MAT-miel-esencia-aromatica, MAT-suederal).

## Pareja, abreviatura y familia de cada material

La pareja es tu respuesta en `respuestas/laboratorio.csv`; la fila de la v1 sale de `datos/v2/v1-a-v2.csv` (el material de la pareja, o el de su producto); la abreviatura y la familia, de `datos/glosario/materiales.csv`.

| Laboratorio | Pareja en la v2 | Fila de la v1 | Abreviatura | Familia |
|---|---|---|---|---|
| MAT-2-acetilpirazina | P00025 (material M00025) | fig:994 | Ac5 (tuya) | fruity |
| MAT-2-hidroxibenzaldehido | P00089 (material M00088) | fig:2840 | Sl (tuya) | spicy |
| MAT-3-4-xilenol | P00082 (material M00082) | fig:616 | Xn (tuya) | woody |
| MAT-absoluto-de-tabaco | P00041 (material M00041) | fig:2982 | TOLA (tuya) | woody |
| MAT-aceite-de-cade-enebro | P00054 (material M00054) | fig:1285 | CdO (tuya) | woody |
| MAT-acetato-de-bencilo | P00009 (material M00009) | fig:1176 | BA8 (tuya) | floral |
| MAT-acetato-de-estiralilo | P00064 (material M00064) | fig:1056 | αMEA (tuya) | green |
| MAT-acetato-de-geranilo | P00065 (material M00065) | fig:1917 | GEA (tuya) | floral |
| MAT-acetato-de-guayilo-palo-santo-acetilado | M01496 | fig:1245 | BUS (tuya) | woody |
| MAT-acetato-de-linalilo | P00076 (material M00076) | fig:2223 | LIA (tuya) | citrus |
| MAT-acetato-de-terpinilo | P00080 (material M00080) | fig:2950 | TAI (tuya) | green |
| MAT-ajenjo-aceite-esencial | M03907 | fig:3101 | WoO (tuya) | green |
| MAT-alcohol-feniletilico | P00026 (material M00026) | fig:2657 | PA5 (tuya) | floral |
| MAT-aldambre | P00083 (material M00083) | tl:947-05-7 | OxO (generada) | — |
| MAT-aldehido-alfa-amil-cinamico | M00010 | fig:1039 | αAm (tuya) | floral |
| MAT-aldehido-alfa-hexil-cinamico | M04258 | fig:1049 | αHe (tuya) | floral |
| MAT-aldehido-benzoico-benzaldehido | M01414 | fig:1138 | Bz (tuya) | fruity |
| MAT-aldehido-c10-decanal | M01710 | fig:1627 | De9 (tuya) | ozonic |
| MAT-aldehido-c11-moa | P00005 (material M00005) | fig:507 | Met (tuya) | ozonic |
| MAT-aldehido-c12-mna | M00597 | fig:524 | Me7 (tuya) | ozonic |
| MAT-aldehido-c14-gamma-undecalactona | P00011 (material M00011) | fig:1896 | γUn (tuya) | fruity |
| MAT-aldehido-c18-gamma-nonalactona | P00012 (material M00012) | fig:1894 | γNo (tuya) | fruity |
| MAT-allyl-amyl-glycolate | P00027 (material M00027) | fig:1012 | ALM (tuya) | fruity |
| MAT-ambar-gris-tintura | P00055 (material M00055) | fig:1069 | AmT (tuya) | spicy |
| MAT-ambermor | P00008 (material M00008) | fig:2427 | NFD (tuya) | spicy |
| MAT-ambrettolide | P00072 (material M00072) | fig:183 | HH (tuya) | animal |
| MAT-ambrinol-s | P00068 (material M00068) | fig:135 | OTN (tuya) | spicy |
| MAT-antranilato-de-metilo | M02146 | fig:2337 | MA16 (tuya) | floral |
| MAT-artemisa-artemisia-vulgaris-aceite-esencial | M01023 | fig:1108 | ARVO (tuya) | green |
| MAT-auranone | P00081 (material M00081) | — | — | — |
| MAT-balsamo-de-tolu-resinoide | P00079 (material M00079) | — | — | — |
| MAT-bergamota-sin-bergaptenos | P00042 (material M00042) | fig:1200 | BFO (tuya) | citrus |
| MAT-black-agar-296985 | P00061 (material M00061) | — | — | — |
| MAT-cacao-absoluto | P00060 (material M00060) | — | — | — |
| MAT-calone | P00086 (material M00086) | fig:944 | MBD (tuya) | ozonic |
| MAT-canela-de-ceilan-aceite-esencial-de-corteza | M01155 | fig:1402 | CIBO (tuya) | spicy |
| MAT-cashmeran | P00013 (material M00013) | fig:924 | DPI (tuya) | spicy |
| MAT-cassis-base-345-b | P00067 (material M00067) | — | — | — |
| MAT-castoreo-sintetico | P00007 (material M00007) | prod:firmenich-184004 | CaS (generada) | — |
| MAT-castoreum | P00004 (material M00004) | fig:1343 | CtA (tuya) | animal |
| MAT-cedramber | P00066 (material M00066) | fig:1378 | CME (tuya) | woody |
| MAT-cedro-atlas | P00043 (material M00043) | fig:1357 | CATO (tuya) | woody |
| MAT-cedro-chino-aceite-esencial | M01127 | fig:1359 | CECO (tuya) | woody |
| MAT-cilantro | P00044 (material M00044) | fig:1533 | COSO (tuya) | spicy |
| MAT-cinamato-de-metilo | P00069 (material M00069) | fig:2343 | MCI (tuya) | spicy |
| MAT-cis-3-hexenol | P00074 (material M00074) | fig:1427 | He9 (tuya) | green |
| MAT-cumarina-natural | P00014 (material M00014) | fig:1534 | Cu (tuya) | floral |
| MAT-dartanol | P00015 (material M00015) | fig:412 | EY (tuya) | woody |
| MAT-datilat | M00267 | fig:187 | CB (tuya) | fruity |
| MAT-dewfruit-tec | material nuevo | — | — | — |
| MAT-dihydromyrcenol | P00028 (material M00028) | fig:1672 | Di18 (tuya) | citrus |
| MAT-diphenyl-oxide | P00016 (material M00016) | fig:1689 | DE13 (tuya) | floral |
| MAT-dpg | M02952 | tl:25265-71-8 | Dipr (generada) | — |
| MAT-ebanol | P00017 (material M00017) | fig:722 | MT3 (tuya) | woody |
| MAT-esencia-de-trufa | P00056 (material M00056) | — | — | — |
| MAT-etanol | M03145 | tl:64-17-5 | EA8 (generada) | — |
| MAT-ethyl-maltol | P00029 (material M00029) | fig:1787 | EMA (tuya) | fruity |
| MAT-ethylene-brassylate | P00030 (material M00030) | fig:1818 | EBR (tuya) | animal |
| MAT-etil-4-fenol | P00018 (material M00018) | fig:2642 | Et5 (tuya) | woody |
| MAT-eucaliptol | P00073 (material M00073) | fig:1820 | Eu (tuya) | green |
| MAT-eugenol-98 | P00019 (material M00019) | fig:1834 | Eg (tuya) | spicy |
| MAT-florosa | P00020 (material M00020) | fig:464 | IMP (tuya) | floral |
| MAT-fructone | M01810 | fig:1745 | EMD (tuya) | fruity |
| MAT-galaxolide | P00031 (material M00031) | fig:142 | γHH (tuya) | animal |
| MAT-geosmina | P00075 (material M00075) | fig:2490 | ODI (tuya) | woody |
| MAT-geraniol-98 | P00001 (material M00001) | fig:1906 | Ga (tuya) | floral |
| MAT-guaiacol | M01928 | fig:1960 | Gua (tuya) | spicy |
| MAT-haba-tonka-tintura | P00057 (material M00057) | fig:2992 | TBT (tuya) | floral |
| MAT-habanolide | P00077 (material M00077) | fig:2574 | OEN (tuya) | animal |
| MAT-hedione | P00032 (material M00032) | fig:2351 | MD8 (tuya) | floral |
| MAT-helional | P00087 (material M00087) | fig:1055 | αMB (tuya) | floral |
| MAT-heliotropina | P00084 (material M00084) | fig:2721 | Pi3 (tuya) | spicy |
| MAT-hidroxicitronelal-cyclosia | P00070 (material M00070) | fig:2021 | Ho (tuya) | floral |
| MAT-ionona-alpha | P00033 (material M00033) | fig:1051 | αIn (tuya) | floral |
| MAT-ionona-beta | P00071 (material M00071) | fig:54 | βIo (tuya) | floral |
| MAT-ipm | M02733 | tl:110-27-0 | IsM (generada) | — |
| MAT-iso-e-super | P00034 (material M00034) | fig:92 | OT (tuya) | woody |
| MAT-isobutil-quinoleina-ibq | P00021 (material M00021) | fig:938 | Bu4 (tuya) | green |
| MAT-kephalis | P00078 (material M00078) | fig:604 | TEE (tuya) | woody |
| MAT-laudano-de-jara | P00058 (material M00058) | fig:2143 | LaA (tuya) | spicy |
| MAT-lavanda | P00003 (material M00003) | fig:2183 | LnO (tuya) | green |
| MAT-limon | P00045 (material M00045) | fig:2193 | LmO (tuya) | citrus |
| MAT-linalol | P00002 (material M00002) | fig:2220 | Li (tuya) | floral |
| MAT-litsea-cubeba | P00046 (material M00046) | fig:2240 | LICO (tuya) | citrus |
| MAT-mandarina | P00047 (material M00047) | fig:2261 | MnO (tuya) | citrus |
| MAT-maritima | P00063 (material M00063) | fig:770 | DD2 (tuya) | ozonic |
| MAT-mayol | P00035 (material M00035) | fig:1447 | ISC (tuya) | floral |
| MAT-methyl-pamplemousse | P00036 (material M00036) | fig:922 | DTE (tuya) | citrus |
| MAT-metil-ionona-gamma | P00022 (material M00022) | fig:1054 | αISM (tuya) | floral |
| MAT-miel-esencia-aromatica | material nuevo | — | — | — |
| MAT-musgo-de-roble-absoluto | P00006 (material M00006) | fig:2480 | OaA (tuya) | woody |
| MAT-naranja-dulce | P00048 (material M00048) | fig:2551 | ORSO (tuya) | citrus |
| MAT-norlimbanol | M00181 | fig:96 | TRH (tuya) | woody |
| MAT-olibano-boswellia-sacra-aceite-esencial | P00059 (material M00059) | fig:2521 | OlO (tuya) | spicy |
| MAT-oxido-de-rosa | M02454 | fig:2959 | TME (tuya) | floral |
| MAT-paradisamide | M01497 | fig:1247 | BUE (tuya) | fruity |
| MAT-patchouli | P00049 (material M00049) | fig:2599 | PtO (tuya) | woody |
| MAT-pimienta-negra-absoluto | P00062 (material M00062) | fig:2622 | PBA (tuya) | spicy |
| MAT-polysantol | P00037 (material M00037) | fig:607 | DTR (tuya) | woody |
| MAT-prismantol | P00085 (material M00085) | fig:3029 | TDE (tuya) | spicy |
| MAT-resinoide-benjui | M00050 | fig:1168 | BSR (tuya) | spicy |
| MAT-resinoide-estyrax-estoraque | P00051 (material M00051) | fig:2914 | StR (tuya) | spicy |
| MAT-safraleine | P00023 (material M00023) | fig:295 | Te (tuya) | spicy |
| MAT-salvia-officinalis | P00052 (material M00052) | fig:2838 | SDO (tuya) | green |
| MAT-sandalmysore-core | P00038 (material M00038) | fig:487 | MTC (tuya) | woody |
| MAT-stemone | P00039 (material M00039) | fig:910 | MH4 (tuya) | green |
| MAT-suederal | material nuevo | — | — | — |
| MAT-vainillina | P00024 (material M00024) | fig:3074 | Vn (tuya) | fruity |
| MAT-vertenex-ptbcha | P00040 (material M00040) | fig:867 | BA4 (tuya) | woody |
| MAT-vetiver | P00053 (material M00053) | fig:3083 | VeO (tuya) | woody |
| MAT-whisky-lactona | M00899 | fig:830 | HL (tuya) | woody |
