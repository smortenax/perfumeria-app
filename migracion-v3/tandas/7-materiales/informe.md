# Tanda 7 · Los materiales del laboratorio, en lo común

*Generada por `migracion-v3/tanda-7-materiales.ts` desde `../Perfumery/biblioteca/materiales.sqlite` (commit `c0e81e3` del laboratorio, sin cambios locales; abierto solo para leer), tus respuestas a `conflictos/laboratorio.csv` (`respuestas/laboratorio.csv`: la pareja de cada material en la v2) y la v2, la v1 y los archivos de IFRA del commit `d4c1e55`. `validar:v2`: sin errores. No va a `v3/datos/` hasta que la apruebes.*

**Qué es.** Tus 111 materiales del laboratorio (`materials` de `materiales.sqlite`: 111 filas, todas con `owner_id` vacío allí) pasan a ser los materiales **comunes** de la v3 (V3-34, V3-36), con su información general y sin lo personal. No son versiones (sin `based_on_id`) y todos llevan su identidad (CAS, especie, parte, proceso…). Los ids son `uuidFor("comun:<id del laboratorio>")`: volver a ejecutar da los mismos bytes.

## Qué entra

| Archivo | Filas | De dónde |
|---|---|---|
| `materials.csv` | 111 | `materials` (111), `material_synonyms` (1049), `material_physical` (108), `conflicts` pendientes (222), `ifra_entries` (107) y la pareja de cada material en la v2/v1 |
| `material_descriptors.csv` | 1035 | `material_descriptors` (1173 filas; 55 idénticas se fusionan) |
| `material_relations.csv` | 1081 | `material_relations` (1156 filas): 209 enlazan con otro material de la tanda y 872 llevan solo el nombre |
| `material_references.csv` | 91 | `material_references` (91 filas) |
| `material_doses.csv` | 420 | `material_dosages` (483 filas; 62 sin ninguna cifra no entran; 0 idénticas se fusionan): 156 en disputa |

Tipos: molecule 74, natural 30, composition 7 (el del laboratorio). Cada columna lleva el nombre del esquema (`v3/db/schema/materials.ts`), sin `created_at` ni `updated_at`.

## De dónde sale cada campo

| Campo | Origen | Cuántos lo llevan |
|---|---|---|
| `id` | `uuidFor("comun:<id del laboratorio>")`, el mismo siempre | 111 |
| `name`, `kind`, `form`, `house`, `code`, `odor_target`, `synthesis`, `isomers`, `species`, `part`, `process`, `chemotype`, `inci`, `origin` | `materials` del laboratorio (`origin` es su «procedencia»; el tipo, el del laboratorio) | `name` 111, `kind` 111, `cas` 103, `inci` 44, `species` 29, `origin` 28 |
| `solvent` | función «disolvente» del laboratorio (entonces `role` queda vacío) | 3 |
| `aliases` | `material_synonyms` del laboratorio, más el nombre del material de la v2 y los nombres de las filas de la v1 de la pareja (comercial, sigla, IFRA, sinónimos, PubChem, transparencia, tiendas; no el código); sin repetir el nombre ni mayúsculas distintas | 111 materiales; 922 nombres vienen de la pareja |
| `cas`, `other_cas` | el primer CAS que encuentra `\b\d{2,7}-\d{2}-\d\b` en el texto de CAS del laboratorio; el resto, en orden y sin repetir; después (V3-16), los de la entrada propia de un natural en el anexo de IFRA (la de su nombre, como la elige el adaptador, V3-23) y los `otros_cas` de las filas de la v1 de su pareja; el CAS de una fila de la v1 que no es ninguno de ellos, solo si respondes «otro CAS» en `respuestas/cas-de-la-v1.csv` | `cas` 103, `other_cas` 26; 14 CAS del anexo, 0 de la v1 y 5 de tus respuestas |
| `abbreviation`, `abbreviation_origin` | `codigo` y `codigo_origen` de la pareja del material en la v1 (V3-37): `usuario` → `user`, `generado` → `generated`; única en la tanda | 97 del usuario, 5 generadas |
| `family` | `familia` de la pareja en la v1, en la lista cerrada de P48 (V3-18, V3-38) | 97 de 111 |
| `color` | vacío: sale de la paleta de la familia (V3-38) | 0 |
| `family_detail`, `facets` | `family` y `facets` del laboratorio, en texto libre | `family_detail` 108, `facets` 107 |
| `tier`, `strength`, `role`, `confidence` | `materials` del laboratorio, traducidos a la escala en inglés de la v3 (`top-heart` → `top_heart`, `muy alto` → `very_high`, `estructura` → `structure`, `alta` → `high`…) | `tier` 108, `strength` 105, `role` 102, `confidence` 111 |
| `tenacity_hours`, `tenacity_source` | `tenacity_h` del laboratorio, número exacto en horas; la fuente es una frase fija que cita el comentario de `esquema.sql` («horas en tira, material puro (escala TGSC)») (V3-42) | 94 |
| `evolution_*` (cinco) | vacías: `evolution` del laboratorio no tiene ningún dato (V3-42) | 0 |
| `threshold`, `diffusion`, `blend_effect`, `recommended_dilution`, `cost`, `handling`, `notes` | `materials` del laboratorio, tal cual | `threshold` 25, `diffusion` 44, `blend_effect` 96, `recommended_dilution` 71, `cost` 1, `handling` 103, `notes` 108 |
| `physical_state`, `appearance`, `stains`, `solubility`, `density`, `melting_point_c`, `formula`, `molecular_weight`, `vapor_pressure`, `stability`, `incompatibilities`, `physical_sources` | `material_physical` del laboratorio (`state`, `color`, `stains`, `solubility`, `density`, `melting_point_c`, `formula`, `molecular_weight`, `vapor_pressure`, `stability`, `incompatibilities`, `sources`); los números, como decimales exactos | `physical_state` 107, `density` 80, `melting_point_c` 25, `molecular_weight` 71 |
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

### Lo tuyo, a tu versión (V3-43) (1)

- Pasan a tu versión, y no entran aquí: 424 frases de los textos generales, 83 descriptores, 75 relaciones, 0 perfumes de referencia y 1 dosis. La lista entera, al final del informe.

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

### CAS de la v1 que no son de tu material en la v3 (7)

No se juntan en silencio: van a `conflictos/cas-de-la-v1.csv` con una recomendación, y los decides tú en `respuestas/cas-de-la-v1.csv` («otro CAS» o «fuera»). Sin respuesta, no entran.

- MAT-aldambre: **947-05-7** (fila tl:947-05-7 de la v1, «Oxacyclotridecan-2-one»; la v3 tiene 1725-03-7) → recomendado «fuera»; tu respuesta: «fuera»
- MAT-ambar-gris-tintura: **8038-65-1** (fila fig:1069 de la v1, «Ambergris tincture»; la v3 tiene 84836-94-2) → recomendado «otro CAS»; tu respuesta: «otro CAS»
- MAT-ambrettolide: **123-69-3** (fila fig:183 de la v1, «Ambrettolide»; la v3 tiene 63286-42-0) → recomendado «otro CAS»; tu respuesta: «otro CAS»
- MAT-dihydromyrcenol: **53219-21-9** (fila fig:946 de la v1, «Dihydromyrcenol»; la v3 tiene 18479-58-8) → recomendado «otro CAS»; tu respuesta: «otro CAS»
- MAT-haba-tonka-tintura: **8024-04-2** (fila fig:2990 fig:2992 de la v1, «Tonka bean extract | Tonka bean tincture»; la v3 tiene 90028-06-1) → recomendado «otro CAS»; tu respuesta: «otro CAS»
- MAT-musgo-de-roble-absoluto: **9000-50-4** (fila fig:2480 de la v1, «Oakmoss absolute»; la v3 tiene 90028-68-5) → recomendado «otro CAS»; tu respuesta: «otro CAS»
- MAT-olibano-boswellia-sacra-aceite-esencial: **8016-36-2** (fila fig:2521 de la v1, «Olibanum oil»; la v3 tiene 89957-98-2) → recomendado «fuera»; tu respuesta: «fuera»

### Resumen de abreviaturas y familias

- **Sin pareja en la v2 («material nuevo»):** 3 (MAT-dewfruit-tec, MAT-miel-esencia-aromatica, MAT-suederal). Sin abreviatura ni familia.
- **Con pareja, pero sin fila en la v1:** 6 (MAT-auranone → P00081 (material M00081); MAT-balsamo-de-tolu-resinoide → P00079 (material M00079); MAT-black-agar-296985 → P00061 (material M00061); MAT-cacao-absoluto → P00060 (material M00060); MAT-cassis-base-345-b → P00067 (material M00067); MAT-esencia-de-trufa → P00056 (material M00056)).
- **Sin abreviatura en total:** 9 de 111. **Con abreviatura tuya:** 97. **Generada, provisional:** 5.
- **Sin familia:** 14 de 111 (MAT-aldambre, MAT-auranone, MAT-balsamo-de-tolu-resinoide, MAT-black-agar-296985, MAT-cacao-absoluto, MAT-cassis-base-345-b, MAT-castoreo-sintetico, MAT-dewfruit-tec, MAT-dpg, MAT-esencia-de-trufa, MAT-etanol, MAT-ipm, MAT-miel-esencia-aromatica, MAT-suederal).

## Lo que va a tu versión (V3-43)

Una frase es tuya si nombra la tienda de tu frasco de ese material (`user_materials`: solo se lee su tienda) o habla de tu compra o de tu frasco («el kit», «se compró», «la compra», «la etiqueta», «el usuario»…); una fila (descriptor, dosis, relación, perfume), si además su fuente es la ficha de tu tienda. Se separa frase a frase y, dentro de una frase, por sus partes separadas por «;». Lo de aquí no entra en lo común: entra en tu versión, en el mismo campo, en la tanda de tu cuenta.

### Frases de los textos generales (424)

- MAT-2-acetilpirazina · `notes`: «Web: Maese Lab no da tenacidad, intensidad, dosis, dilución ni datos físicos.»
- MAT-2-acetilpirazina · `handling`: «Maese Lab: no ingerir ni aplicar directamente sobre la piel, evitar ojos y mucosas, no usar en embarazo ni lactancia, evitar en asma, hipertensión, enfermedad renal o epilepsia; conservar en lugar fresco, al abrigo de la luz y bien cerrado.»
- MAT-2-hidroxibenzaldehido · `notes`: «Web: Perfumiarz clasifica la nota como salida y ScenTree como salida/corazón: se anota top-heart sin considerarlo discrepancia.»
- MAT-2-hidroxibenzaldehido · `notes`: «Web: Presente de forma natural en el alforfón tostado, la cerveza y el extracto de castóreo (Perfumiarz, FooDB) y en pequeña cantidad en el aceite esencial de canela de Ceilán (ScenTree).»
- MAT-2-hidroxibenzaldehido · `notes`: «Web: La ficha de Perfumiarz es la del producto diluido al 10 % en IPM.»
- MAT-2-hidroxibenzaldehido · `handling`: «Perfumiarz: trabajar en zona ventilada y evitar contacto con ojos y piel con materiales concentrados. Un dato sobre ficha técnica indica irritación moderada en piel de conejo.»
- MAT-2-hidroxibenzaldehido · `recommended_dilution`: «Perfumiarz lo vende al 10 % en IPM.»
- MAT-2-hidroxibenzaldehido · `blend_effect`: «Perfumiarz: «Recommended for unique gourmand accords!».»
- MAT-2-hidroxibenzaldehido · `house`: «Warhem (según Perfumiarz)»
- MAT-3-4-xilenol · `notes`: «Web: La ficha de Perfumiarz es la del producto diluido al 10 % en IPM, que describe como líquido amarillo pálido (nota corazón/fondo, familia «cuero y animálico»)»
- MAT-3-4-xilenol · `notes`: «Web: El tier heart-base es el de Perfumiarz.»
- MAT-3-4-xilenol · `recommended_dilution`: «Perfumiarz lo vende al 10 % en IPM.»
- MAT-3-4-xilenol · `blend_effect`: «Perfumiarz: útil para crear composiciones robustas de madera, cuero y ámbar; «imprescindible» para construir un acorde de oud desde cero.»
- MAT-3-4-xilenol · `house`: «Sigma Aldrich (fabricante según Perfumiarz)»
- MAT-absoluto-de-tabaco · `notes`: «Web: La lista dice que se compró en el kit de Olfatorium y que Olfatorium no declara casa; en la búsqueda salió una ficha de Olfatorium titulada «Absoluto de tabaco 10% DPG»»
- MAT-absoluto-de-tabaco · `notes`: «Web: (solo título, no abierta), así que conviene comprobar si el del kit viene diluido.»
- MAT-absoluto-de-tabaco · `notes`: «Datos de grado y fabricante: La ficha del kit de iniciación de Olfatorium lista «Absoluto de Tabaco» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar», sin indicar cuáles ni a qué %.»
- MAT-aceite-de-cade-enebro · `notes`: «Web: Duda de identidad: la ficha de Maese Lab dice «arrastre de vapor» y «madera», pero su INCI es «Juniperus oxycedrus wood tar» y su CAS incluye el 8013-10-3 del aceite de alquitrán.»
- MAT-aceite-de-cade-enebro · `notes`: «Web: Maese Lab no da dosis, densidad, IFRA ni composición porcentual.»
- MAT-aceite-de-cade-enebro · `notes`: «TGSC: (de Maese Lab).»
- MAT-aceite-de-cade-enebro · `notes`: «Proveedores en la página: Maese Lab no aparece.»
- MAT-aceite-de-cade-enebro · `isomers`: «Grado: Maese Lab no dice si está rectificado.»
- MAT-aceite-de-cade-enebro · `handling`: «Fraterworks: Maese Lab (texto de aromaterapia): diluir antes del uso tópico, no ingerir, no usar en embarazo ni lactancia, evitar en asma, hipertensión, afección renal o neurológica, y en menores de 3 años.»
- MAT-aceite-de-cade-enebro · `origin`: «España (Maese Lab y Fraterworks)»
- MAT-aceite-de-cade-enebro · `stability`: «Maese Lab: guardar en envases bien cerrados, en ambientes frescos y sin luz directa.»
- MAT-acetato-de-bencilo · `notes`: «Web: Maese Lab escribe el CAS como «0140-11-4»»
- MAT-acetato-de-bencilo · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, evitar en embarazo, lactancia, asma, hipertensión, enfermedad renal o epilepsia; conservar en lugar fresco, al abrigo de la luz y bien cerrado.»
- MAT-acetato-de-estiralilo · `notes`: «Web: Perfumiarz lo vende puro (100 %, inferido de su guía de la tienda, no de la ficha), líquido incoloro, nota de salida, y no da tenacidad ni dilución.»
- MAT-acetato-de-estiralilo · `handling`: «Perfumiarz: sin aviso propio del producto; trabajar en zona ventilada y evitar contacto con ojos y piel con materiales concentrados.»
- MAT-acetato-de-estiralilo · `blend_effect`: «Perfumiarz: especialmente eficaz en la nota de salida, donde aporta una apertura vibrante y refrescante. Se dice que «mellow-in» (se redondea) la composición de forma muy perceptible a las 24 horas, y más en varios días.»
- MAT-acetato-de-estiralilo · `house`: «Symrise (fabricante según Perfumiarz)»
- MAT-acetato-de-geranilo · `notes`: «Web: Perfumiarz lo da como nota de salida/corazón, sin dilución (puro por la guía de la tienda, no por la ficha) y sin tenacidad ni dosis.»
- MAT-acetato-de-geranilo · `handling`: «Perfumiarz: sin aviso propio; remite a la SDS.»
- MAT-acetato-de-geranilo · `blend_effect`: «Perfumiarz: «It beautifully brightens the top and heart while helping to smoothly connect citrus, aromatic, and floral accords.»»
- MAT-acetato-de-geranilo · `house`: «IFF (fabricante según Perfumiarz)»
- MAT-acetato-de-linalilo · `notes`: «Web: Perfumiarz lo da como nota de salida, sin dilución (puro por la guía de la tienda, no por la ficha), sin tenacidad y sin dosis.»
- MAT-acetato-de-linalilo · `handling`: «Perfumiarz: enlaza SDS, IFRA y alérgenos de la UE sin dar su contenido.»
- MAT-acetato-de-linalilo · `blend_effect`: «Perfumiarz: «It effectively brightens the composition without significantly altering its character.»»
- MAT-acetato-de-linalilo · `house`: «BASF (fabricante según Perfumiarz)»
- MAT-acetato-de-terpinilo · `notes`: «Web: La ficha de Perfumiarz (CAS 8007-35-0, INCI A-Terpinyl Acetate) no da tenacidad, dosis ni dilución.»
- MAT-acetato-de-terpinilo · `handling`: «Perfumiarz: sin aviso propio; remite a la SDS.»
- MAT-acetato-de-terpinilo · `blend_effect`: «Perfumiarz: recuerda al acetato de linalilo pero más dulce y más contenido.»
- MAT-acetato-de-terpinilo · `house`: «Firmenich (fabricante según Perfumiarz)»
- MAT-ajenjo-aceite-esencial · `notes`: «Web: La especie queda confirmada: Perfumiarz da «Artemisia absinthium» e INCI ARTEMISIA ABSINTHIUM OIL, CAS 8008-93-3.»
- MAT-ajenjo-aceite-esencial · `notes`: «Web: Perfumiarz no dice parte, método, origen, composición ni dosis.»
- MAT-ajenjo-aceite-esencial · `notes`: «Web: Todos los tamaños de la ficha de Perfumiarz figuraban agotados.»
- MAT-ajenjo-aceite-esencial · `notes`: «TGSC: El origen del aceite de PCW/Perfumiarz de la lista no se conoce, y ni PCW ni Perfumiarz aparecen como proveedores en esta ficha (sí The Perfumers Apprentice, «Wormwood (USA)»).»
- MAT-ajenjo-aceite-esencial · `handling`: «Perfumiarz: sin avisos propios del producto.»
- MAT-ajenjo-aceite-esencial · `recommended_dilution`: «Perfumiarz no lo indica (el producto se vende puro.»
- MAT-ajenjo-aceite-esencial · `origin`: «Perfumiarz no lo dice.»
- MAT-ajenjo-aceite-esencial · `blend_effect`: «Perfumiarz: el amargor herbáceo se mezcla con tonos dulces de licor.»
- MAT-alcohol-feniletilico · `notes`: «Web: No hay ficha de tienda para este material en la lista (kit de iniciación de Olfatorium).»
- MAT-aldambre · `notes`: «Web: Identidad confirmada: el CAS 1725-03-7 coincide con Aldambre en Fraterworks, Perfumer's Apprentice y Perfumiarz (lactona de 12 miembros, C11H20O2, PM 184.»
- MAT-aldambre · `notes`: «Web: Perfumiarz lo da como nota de corazón, líquido incoloro, y compara su volatilidad con Hababanolide y Sclareno.»
- MAT-aldambre · `handling`: «Perfumiarz: sin aviso propio; remite a la SDS.»
- MAT-aldehido-alfa-amil-cinamico · `notes`: «Web: IDENTIDAD DUDOSA: la etiqueta dice alfa-amil cinámico (CAS 122-40-7), pero la ficha de Maese Lab que se compró (https://maeselab.com/aldehido-alfa-hexil-cinamico/) es de otro producto: «ALDEHIDO ALFA HEXIL CINAMICO», INCI «aldehido alfa-hexilcinamico», con CAS 165184-98-5 (la consigna esperaba otro CAS para el hexil, 101-86-0, que esa página no usa).»
- MAT-aldehido-alfa-amil-cinamico · `notes`: «2026-10-11: el frasco del usuario es el α-hexil (confirmado por el usuario) y pasó a su propio estándar, MAT-aldehido-alfa-hexil-cinamico, con su frasco, su cata, su eje, su IFRA 040 y sus sinónimos.»
- MAT-aldehido-alfa-hexil-cinamico · `notes`: «Separado el 2026-10-11 de MAT-aldehido-alfa-amil-cinamico: el usuario confirma que su frasco es el α-hexil de Maese Lab, aunque la etiqueta diga α-amil.»
- MAT-aldehido-alfa-hexil-cinamico · `notes`: «Maese Lab declara 165184-98-5, que sigue sin explicar (vacío 51 del repo). family y tier vienen de la ficha del repo (etiqueta del alta).»
- MAT-aldehido-c11-moa · `notes`: «Perfumiarz: sintético, nota de salida, líquido incoloro, familia «aldehídico, marino y ozono», sin dilución indicada ni dosis ni tenacidad. ScenTree marca «sin alérgenos» y a la vez lista H317 (puede provocar reacción alérgica cutánea). Fraterworks y Tilley solo en fragmentos del buscador.»
- MAT-aldehido-c11-moa · `handling`: «Perfumiarz: sin aviso propio; remite a la SDS.»
- MAT-aldehido-c11-moa · `diffusion`: «Perfumiarz: olor muy intenso y difusivo»
- MAT-aldehido-c14-gamma-undecalactona · `notes`: «Web: La ficha de Maese Lab (líquido, pureza 100 %, origen UE) no da tenacidad, intensidad, dosis ni dilución, y solo la describe como fijador.»
- MAT-aldehido-c14-gamma-undecalactona · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, evitar en embarazo, lactancia, asma, hipertensión, enfermedad renal o epilepsia; conservar en lugar fresco, al abrigo de la luz y bien cerrado.»
- MAT-aldehido-c18-gamma-nonalactona · `notes`: «Web: La ficha de Maese Lab (líquido, pureza 100 %, origen UE) no da tenacidad, intensidad, dosis ni dilución, aunque anuncia «excelente fijación» y que se use en «pequeñas proporciones».»
- MAT-aldehido-c18-gamma-nonalactona · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, evitar en embarazo, lactancia, asma, hipertensión, enfermedad renal o epilepsia; conservar en lugar fresco, al abrigo de la luz y bien cerrado.»
- MAT-ambar-gris-tintura · `notes`: «Web: Se abrieron la ficha de Maese Lab (la de la compra: «Ambar Gris - Tintura al 10%»), Fraterworks y el glosario de Premiere Peau.»
- MAT-ambar-gris-tintura · `notes`: «Web: La lista da el CAS 84836-94-2 y Maese Lab lo da junto al del etanol.»
- MAT-ambar-gris-tintura · `notes`: «Web: Maese Lab no dice si el origen es ámbar gris de playa ni la especie, ni da nota, tenacidad, densidad o dosis.»
- MAT-ambar-gris-tintura · `notes`: «Web: En la web de Maese Lab hay también una tintura «no purificada»»
- MAT-ambar-gris-tintura · `notes`: «TGSC: No hay ficha de la tintura comercial «purificada» de Maese Lab, que no aparece en ninguna de las dos fichas.»
- MAT-ambar-gris-tintura · `isomers`: «Maese Lab: «Ámbar Gris Dilución (purificado)», 10 % en bioetanol de 96º, con la nota «AMBREINA - pureza 80% - Purificado Diluido 10% en Bioetanol 96º» (la ficha no aclara qué mide el 80 %). INCI «Alcohol, Ambergris extract». La web de Maese Lab vende por separado una «Tintura de Ámbar Gris (no purificada)» (vía buscador). Fraterworks vende una tintura al 2 % y Premiere Peau habla de tinturas por maceración de varias semanas, sin porcentaje: la fuerza de la tintura varía mucho entre vendedores.»
- MAT-ambar-gris-tintura · `handling`: «Maese Lab: no apto para uso interno ni alimento; no aplicar en la zona de los ojos ni mucosas; no usar sobre pieles sensibles; no usar en embarazo o lactancia; no exponerse al sol inmediatamente tras aplicarlo; fuera del alcance de los niños; «Apto para Cosmética: No», «Apto para Perfumería: Sí».»
- MAT-ambar-gris-tintura · `recommended_dilution`: «Maese Lab ya lo entrega al 10 % en bioetanol de 96º.»
- MAT-ambar-gris-tintura · `origin`: «Bahamas (Maese Lab)»
- MAT-ambar-gris-tintura · `house`: «Maese Lab»
- MAT-ambermor · `notes`: «Web: La ficha de Maese Lab (la de la compra) casi no trae cifras.»
- MAT-ambermor · `notes`: «Punto de fusión: La ficha de Maese Lab dice «líquido», lo que no concuerda con el cristal/escamas de las demás (el usuario lo tiene en polvo).»
- MAT-ambermor · `handling`: «Maese Lab: no aplicar directamente sobre la piel, evitar contacto con ojos y mucosas, conservar en lugar fresco, sin luz directa y bien cerrado.»
- MAT-ambermor · `diffusion`: «Scentspiracy: Maese Lab: «Potencia la persistencia de las fragancias en la piel y los tejidos».»
- MAT-ambrettolide · `notes`: «Web: La ficha de Perfumiarz (la de la compra) da casa IFF, CAS 63286-42-0, olor, intensidad 5/10, nota de base y la mezcla con Exaltolide/Brasilato.»
- MAT-ambrettolide · `handling`: «Perfumiarz enlaza SDS, IFRA y alérgenos UE pero no resume su contenido.»
- MAT-ambrettolide · `blend_effect`: «Fijador muy eficaz incluso en trazas (Perfumiarz)»
- MAT-ambrinol-s · `notes`: «Web: Se abrieron Perfumiarz (la de la compra) y ScenTree.»
- MAT-ambrinol-s · `notes`: «Web: Perfumiarz «Heart Note / Base Note»: no es discrepancia.»
- MAT-ambrinol-s · `notes`: «Web: Con la intensidad 9/10 de Perfumiarz y el «trace amounts» la fuente subraya dosis mínimas.»
- MAT-ambrinol-s · `handling`: «Perfumiarz enlaza SDS, IFRA y alérgenos UE pero no resume su contenido.»
- MAT-ambrinol-s · `recommended_dilution`: «Perfumiarz: «We recommend diluting well for easier dosing» (sin porcentaje ni disolvente). · TGSC: Oler en solución al 10,00 % o menos (TGSC no dice el disolvente; la evaluación de olor de Luebke es al 10,00 % en DPG). Pell Wall Perfumes (ficha alpha-ambrinol) lo describe «10% in ethanol»»
- MAT-ambrinol-s · `diffusion`: «Perfumiarz: «strong, piercing scent».»
- MAT-auranone · `notes`: «Web: Se abrieron Perfumiarz (la de la compra.»
- MAT-auranone · `notes`: «TGSC: Perfumiarz no aparece como proveedor.»
- MAT-auranone · `isomers`: «Perfumiarz la vende como base de almizcles lista para usar, incolora y sin porcentaje de dilución declarado.»
- MAT-auranone · `handling`: «Perfumiarz y Perfumer's Apprentice solo enlazan SDS, IFRA y alérgenos sin resumir su contenido.»
- MAT-auranone · `blend_effect`: «Perfumiarz: suaviza las transiciones entre corazón y fondo y realza las notas florales; da un efecto cálido de piel con matices polvorientos y de cuero-ámbar. Una reseña de perfumista (Basenotes, vía buscador): sus aspectos florales complementan los absolutos de flor naturales sin taparlos.»
- MAT-balsamo-de-tolu-resinoide · `notes`: «Web: Identidad: Perfumiarz (la compra) vende el resinoide de Firmenich, CAS «mix», sin diluyente.»
- MAT-balsamo-de-tolu-resinoide · `notes`: «Web: Perfumiarz no da método, origen, dosis ni composición.»
- MAT-balsamo-de-tolu-resinoide · `notes`: «TGSC: (y versión para sabor «220951FL»), pero Perfumiarz no aparece como proveedor; no se puede afirmar que la ficha describa exactamente el producto de Perfumiarz/Firmenich de la lista.»
- MAT-balsamo-de-tolu-resinoide · `isomers`: «Grados: resinoide puro (Perfumiarz: sólido marrón en trozos duros.»
- MAT-balsamo-de-tolu-resinoide · `isomers`: «Grados: El resinoide de Perfumiarz se anuncia como sólido, sin diluyente.»
- MAT-balsamo-de-tolu-resinoide · `handling`: «Perfumiarz: sin avisos propios (enlaza SDS, IFRA y alérgenos UE).»
- MAT-balsamo-de-tolu-resinoide · `recommended_dilution`: «Perfumiarz: «Dissolving it requires skill and determination!» (sin porcentaje ni disolvente).»
- MAT-balsamo-de-tolu-resinoide · `origin`: «Perfumiarz y Fraterworks no lo dicen.»
- MAT-balsamo-de-tolu-resinoide · `blend_effect`: «Perfumiarz: queda entre el benjuí de Sumatra y el bálsamo del Perú; da un halo dulce-resinoso y color ámbar.»
- MAT-balsamo-de-tolu-resinoide · `stability`: «Perfumiarz: «dense and hard chunks» en forma pura.»
- MAT-bergamota-sin-bergaptenos · `notes`: «Web: La lista dice CAS 68648-33-9 (Olfatorium, kit de iniciación) y no da ficha de tienda ni casa.»
- MAT-bergamota-sin-bergaptenos · `notes`: «Web: El de Olfatorium podría ser de otra casa.»
- MAT-bergamota-sin-bergaptenos · `notes`: «Web: La ficha del kit de iniciación de Olfatorium solo lista «Bergamota sin bergaptenos» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar», sin indicar cuáles ni a qué %; no se encontró ficha individual de Olfatorium para este producto.»
- MAT-bergamota-sin-bergaptenos · `notes`: «Flavor Type: Olfatorium no aparece.»
- MAT-black-agar-296985 · `notes`: «Web: Se abrieron Perfumiarz (la de la compra; Perfumiarz y Scentfriends hablan de matices animálicos en el olor, lo que no se considera contradicción (una cosa es el olor, otra la composición).»
- MAT-black-agar-296985 · `notes`: «Odor Type de la ficha: Perfumiarz no aparece como proveedor.»
- MAT-black-agar-296985 · `isomers`: «Perfumiarz pone en CAS «mix».»
- MAT-black-agar-296985 · `isomers`: «Perfumiarz no declara dilución y sus guías dicen que la mayoría de materias se vende pura.»
- MAT-black-agar-296985 · `handling`: «Perfumiarz: SDS enlazado sin resumen; sus guías aconsejan ventilación y evitar el contacto con ojos y piel en materiales concentrados.»
- MAT-black-agar-296985 · `blend_effect`: «Perfumiarz: parte de un olor parecido a la base Black Agar de Givco y se vuelve más oscuro y pesado, con cuero alquitranado duradero y fuerte carácter de agar. dsm-firmenich: la nota de cuero da la firma al perfume; encaja bien con muchos ingredientes cautivos.»
- MAT-cacao-absoluto · `notes`: «Web: Se localizó la ficha de Maese Lab «Absoluto de Cacao (de Ghana)» por búsqueda (se asume que es el comprado.»
- MAT-cacao-absoluto · `notes`: «Web: Maese Lab no da dosis, IFRA, densidad ni composición.»
- MAT-cacao-absoluto · `notes`: «TGSC: Maese Lab no aparece como proveedor en la ficha, así que no se puede afirmar que describa exactamente el producto de Maese Lab.»
- MAT-cacao-absoluto · `isomers`: «Maese Lab vende «Absoluto de Cacao (de Ghana)» al 100 % y una versión «Dilución al 10 %» como producto aparte (la ficha de la lista no dice cuál se compró).»
- MAT-cacao-absoluto · `handling`: «Maese Lab: no ingerir; no aplicar directamente sobre la piel (puede irritar); evitar ojos y mucosas; no usar en embarazo ni lactancia; evitar en asma, hipertensión, afección renal o epilepsia; no aplicar a menores de 3 años.»
- MAT-cacao-absoluto · `recommended_dilution`: «Maese Lab: no se indica para este producto.»
- MAT-cacao-absoluto · `origin`: «Ghana (Maese Lab)»
- MAT-calone · `notes`: «Web: La ficha de Perfumiarz (la de la compra) es del polvo y trae casa, olor, intensidad 9/10, nota corazón/fondo y el aviso de dilución.»
- MAT-calone · `handling`: «Perfumiarz: muy potente, debe diluirse mucho. Sigma-Aldrich (vía buscador): almacenar a 2–8 °C. Perfumiarz enlaza SDS e IFRA sin resumir su contenido.»
- MAT-calone · `recommended_dilution`: «Perfumiarz: «Calone is a very potent substance and should be heavily diluted!». Un proveedor (vía buscador): evaluar al 10 % o más diluido. · TGSC: Oler en solución al 10,00 % o menos (TGSC no dice el disolvente; la evaluación de olor de Luebke es al 10,00 % en DPG)»
- MAT-cashmeran · `notes`: «Web: La ficha de Maese Lab (la de la compra) es del Cashmeran al 50 %, no puro: sin casa ni dosis.»
- MAT-cashmeran · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar contacto con ojos y mucosas, guardar en lugar fresco sin luz directa. Scentspiracy lista las frases H315, H319, H317 y H411.»
- MAT-cashmeran · `recommended_dilution`: «Maese Lab lo vende ya al 50 % («CASHMERAN 50%», «PUREZA 50%»).»
- MAT-cassis-base-345-b · `notes`: «Web: Se abrieron Perfumiarz (la de la compra.»
- MAT-cassis-base-345-b · `notes`: «Web: La propia ficha de Perfumiarz se contradice (campo IFF, texto «created by Firmenich») y las otras dos tiendas, y la mayoría de resultados del buscador, dicen Firmenich (ahora dsm-firmenich).»
- MAT-cassis-base-345-b · `notes`: «Web: El código W03040 de Perfumiarz se deduce de los nombres de sus documentos enlazados.»
- MAT-cassis-base-345-b · `notes`: «Odor Type de la ficha: Perfumiarz no aparece como proveedor.»
- MAT-cassis-base-345-b · `isomers`: «Perfumiarz pone «mix» en el CAS.»
- MAT-cassis-base-345-b · `handling`: «Fraterworks: Perfumiarz y Perfumer Supply House enlazan SDS y alérgenos UE sin resumir.»
- MAT-cassis-base-345-b · `diffusion`: «Perfumiarz: su influencia se nota ya desde la apertura aunque sea nota de corazón.»
- MAT-cassis-base-345-b · `blend_effect`: «Perfumiarz: reaviva otras notas afrutadas incluso en cantidades mínimas; «gold standard» de la grosella negra.»
- MAT-castoreo-sintetico · `notes`: «Web: Se abrieron Perfumiarz (la de la compra.»
- MAT-castoreo-sintetico · `notes`: «Web: La identidad con Castoreum Synth 184004 D es probable pero no confirmada: Perfumiarz usa la referencia W03063 en sus documentos y no nombra 184004 D.»
- MAT-castoreo-sintetico · `notes`: «Odor Type de la ficha: Perfumiarz no aparece como proveedor.»
- MAT-castoreo-sintetico · `isomers`: «Perfumiarz y Perfumer's Apprentice ponen «mix»/«Mixture» en el CAS.»
- MAT-castoreo-sintetico · `isomers`: «(«no animals were harmed in its production», Perfumiarz).»
- MAT-castoreo-sintetico · `isomers`: «No se puede asegurar que el «Castoreum Synthetic» de Perfumiarz (documentos W03063) sea exactamente el «Castoreum Synth 184004 D» de dsm-firmenich y Fraterworks, aunque Perfumer's Apprentice llama «Castoreum Synthetic (Firmenich)» al segundo.»
- MAT-castoreo-sintetico · `handling`: «Fraterworks: Perfumiarz enlaza SDS, IFRA y alérgenos UE (referencia W03063) sin resumir su contenido.»
- MAT-castoreo-sintetico · `recommended_dilution`: «Fraterworks: Perfumiarz aconseja probar el producto final bien diluido en una zona pequeña.»
- MAT-castoreo-sintetico · `blend_effect`: «Perfumiarz: se funde bien con notas amaderadas y de cuero.»
- MAT-castoreum · `notes`: «Web: La ficha de Maese Lab es de un producto diluido al 20 % en bioetanol de 96° (80 % de etanol), con INCI «Alcohol, Castoreum oil»»
- MAT-castoreum · `notes`: «Web: Maese Lab no da dosis, densidad, IFRA, almacenamiento ni alérgenos.»
- MAT-castoreum · `notes`: «TGSC: Maese Lab no aparece como proveedor; la ficha no declara dilución, mientras que el producto de la lista (Maese Lab) es el «absoluto de castoreum 20»»
- MAT-castoreum · `isomers`: «Grado comercial de la compra: «Castoreum Absoluto diluido al 20%», «Pureza 20% - Diluido 80% en Bioetanol 96º» (Maese Lab). No es el material puro.»
- MAT-castoreum · `handling`: «Maese Lab: no ingerir; no aplicar directamente sobre la piel (puede irritar); evitar ojos y mucosas; no usar en embarazo ni lactancia; evitar en asma, hipertensión, afección renal y epilepsia; no aplicar a menores de 3 años. ScenTree (material puro): palabra «Danger», H315 (irrita la piel), H318 (daño ocular grave), H372 (daño a órganos).»
- MAT-castoreum · `recommended_dilution`: «Maese Lab: ya viene al 20 % en bioetanol de 96°; no indica dosis ni dilución de trabajo.»
- MAT-castoreum · `origin`: «Canadá (Maese Lab)»
- MAT-castoreum · `blend_effect`: «Maese Lab: perfumes con notas animales, cálidas y ambaradas; orientales, de cuero y chipre.»
- MAT-cedramber · `notes`: «Web: La ficha de Perfumiarz (la de la compra) da casa IFF, CAS 19870-74-7, olor, intensidad 6/10 y nota de base, sin dosis ni física.»
- MAT-cedramber · `handling`: «Scentspiracy: Perfumiarz y Perfumer's Apprentice enlazan SDS/IFRA sin reproducir su contenido.»
- MAT-cedramber · `blend_effect`: «Perfumiarz: «adds elegance and richness to the composition».»
- MAT-cedro-atlas · `notes`: «Web: No se encontró la ficha individual de Olfatorium; la del kit de iniciación solo lista «Cedro Atlas» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar», sin indicar cuáles ni a qué %.»
- MAT-cedro-atlas · `notes`: «TGSC: Olfatorium no aparece como proveedor.»
- MAT-cilantro · `notes`: «Web: Identidad confirmada: la ficha de Olfatorium se titula «Cilantro (semillas)», con Coriandrum sativum, CAS 84775-50-8, destilación al vapor de semillas y origen España, así que es el aceite de semilla (no el de hoja.»
- MAT-cilantro · `notes`: «Web: La ficha del kit de iniciación de Olfatorium solo lista «Cilantro» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar», sin indicar cuáles ni a qué %.»
- MAT-cilantro · `notes`: «Web: Olfatorium no da dosis, fuerza, tenacidad, composición ni IFRA.»
- MAT-cilantro · `notes`: «TGSC: El CAS coincide con la lista, pero la ficha es del aceite de la HIERBA (hoja) de origen Egipto, y la lista solo dice «Cilantro / Coriandrum sativum», sin parte ni origen y de Olfatorium (que no aparece como proveedor en la ficha).»
- MAT-cilantro · `handling`: «Olfatorium: enlaza SDS (REV-4-2023) sin resumir.»
- MAT-cilantro · `recommended_dilution`: «Olfatorium: se vende puro.»
- MAT-cilantro · `origin`: «España (etiqueta de Olfatorium).»
- MAT-cinamato-de-metilo · `notes`: «Web: La ficha de Perfumiarz (la de la compra) es del cinamato de metilo al 50 %: casa Symrise, olor, intensidad 7/10, nota de base y el aviso de que potencia florales, afrutados y gourmand.»
- MAT-cinamato-de-metilo · `handling`: «Perfumer's Apprentice y Perfumiarz enlazan SDS sin reproducir su contenido.»
- MAT-cinamato-de-metilo · `handling`: «Perfumiarz lo ofrece al 50 %, por eso sale como líquido.»
- MAT-cinamato-de-metilo · `recommended_dilution`: «Perfumiarz lo vende ya al 50 % (disolvente sin indicar).»
- MAT-cinamato-de-metilo · `blend_effect`: «Perfumiarz: «an excellent enhancer for floral, fruity, and gourmand accords». PerfumersWorld (vía buscador): aplicaciones en oriental, clavel, narciso, lavanda y ámbar.»
- MAT-cinamato-de-metilo · `house`: «Symrise (según Perfumiarz)»
- MAT-cis-3-hexenol · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), Scentspiracy y Perfumer's Apprentice.»
- MAT-cis-3-hexenol · `notes`: «Web: Perfumiarz no dice dilución en el nombre del producto: se supone sin diluir.»
- MAT-cis-3-hexenol · `isomers`: «Perfumiarz lo vende sin dilución declarada (el nombre del producto no lleva % ni disolvente.»
- MAT-cis-3-hexenol · `handling`: «Perfumiarz: «Very intense aroma, dilute well before use!».»
- MAT-cis-3-hexenol · `recommended_dilution`: «Perfumiarz: «dilute well before use!» (sin % ni disolvente). Un listado del buscador (versión natural, Perfumer's Apprentice): «in a 10% solution or less». · TGSC: Smelling in a 10.00 % solution or less (la descripción de Luebke es «at 10% in dipropylene glycol»)»
- MAT-cumarina-natural · `notes`: «Web: La ficha de Maese Lab (la de la compra) es de cumarina natural cristalizada de haba tonka, pureza 100 %, sólida, sin dosis ni física.»
- MAT-cumarina-natural · `notes`: «TGSC: AVISO: FICHA GENÉRICA DE COUMARIN, no de la «cumarina natural cristalizada (fracción)» de Maese Lab.»
- MAT-cumarina-natural · `notes`: «TGSC: No da ninguna descripción propia del grado natural y no menciona a Maese Lab (house null).»
- MAT-cumarina-natural · `handling`: «Maese Lab: no aplicar directamente sobre la piel; conservar en lugar fresco sin luz directa.»
- MAT-cumarina-natural · `blend_effect`: «Maese Lab: fijador.»
- MAT-dartanol · `notes`: «Web: La ficha de Maese Lab (la de la compra) da olor, nada de casa, dosis ni física.»
- MAT-dartanol · `handling`: «Maese Lab: no aplicar directamente sobre la piel, evitar contacto con ojos y mucosas, guardar en lugar fresco sin luz directa.»
- MAT-dartanol · `blend_effect`: «Maese Lab: «Realza y complementa las notas florales, especialmente la rosa»; «Proporciona una base duradera que mejora la estabilidad de las fórmulas perfumísticas». dsm-firmenich: se combina con Polysantol y Firsantol para un efecto natural cremoso y cosmético.»
- MAT-datilat · `notes`: «Web: La ficha de Perfumiarz (la de la compra, muestra) da casa Symrise, olor, intensidad 6/10, nota corazón/fondo y la faceta ahumada-licorosa.»
- MAT-datilat · `handling`: «Hekserij: Perfumiarz enlaza SDS e IFRA sin resumirlos.»
- MAT-datilat · `blend_effect`: «Perfumiarz: molécula dulce con una faceta ahumada y licorosa; la propone como alternativa a la dulzura tipo vainillina-maltol.»
- MAT-dewfruit-tec · `notes`: «Web: Se abrieron Perfumiarz (la de la muestra), Hekserij y Fraterworks (Dewfruit, no la TEC específicamente.»
- MAT-dewfruit-tec · `notes`: «Web: La ficha de Perfumiarz dice que no lista la concentración.»
- MAT-dewfruit-tec · `notes`: «Web: La casa de la lista (Givaudan, origen Quest) coincide con Perfumiarz y Fraterworks.»
- MAT-dewfruit-tec · `notes`: «Odor Type de la ficha: Perfumiarz no aparece como proveedor.»
- MAT-dewfruit-tec · `isomers`: «Perfumiarz pone «mix» en el CAS.»
- MAT-dewfruit-tec · `isomers`: ««TEC» en el nombre sugiere una dilución en citrato de trietilo, pero ninguna fuente la define ni da el porcentaje (Perfumiarz y Hekserij lo dicen explícitamente).»
- MAT-dewfruit-tec · `isomers`: «Hay otras versiones comerciales: Los documentos de Perfumiarz se llaman «2927R2», que puede ser una revisión.»
- MAT-dewfruit-tec · `handling`: «Fraterworks: Perfumiarz enlaza SDS, certificado IFRA 51 (2024-09-20) y lista ampliada de alérgenos UE sin resumirlos.»
- MAT-dewfruit-tec · `recommended_dilution`: «Perfumiarz no da dilución ni la concentración en TEC.»
- MAT-dihydromyrcenol · `notes`: «Web: Material de la lista sin ficha de tienda (kit de Olfatorium), así que se leyeron Perfumer Supply House, Privi (fabricante) y Anthea.»
- MAT-diphenyl-oxide · `notes`: «Web: La ficha de Maese Lab (la de la compra) da el olor (geranio, hoja verde, palo de rosa, fenólico, metálico, alcanforado), líquido, pureza 100 %, origen UE y avisos de manejo.»
- MAT-diphenyl-oxide · `notes`: «Web: Punto de fusión 26.8 °C (también 27 °C como punto de congelación en otro listado): queda cerca de la temperatura ambiente, y PerfumersWorld lo recoge entre sus sinónimos como «Geranium crystals» mientras que Maese Lab y Fraterworks lo dan como líquido.»
- MAT-diphenyl-oxide · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar contacto con ojos y mucosas, uso solo profesional.»
- MAT-ebanol · `notes`: «Web: La ficha de Maese Lab (la de la compra) da CAS, INCI, olor («amaderado, dulce, intenso, profundo, cítrico acaramelado»), familia maderas, líquido y pureza 100 %.»
- MAT-ebanol · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar contacto con ojos y mucosas, guardar en lugar fresco sin luz directa.»
- MAT-esencia-de-trufa · `notes`: «Web: Se abrió la ficha de Maese Lab (la de la compra) y se hicieron dos búsquedas (la segunda confirmó la ficha.»
- MAT-esencia-de-trufa · `notes`: «Categoría en la web: Nada de esto dice qué lleva la esencia de Maese Lab.»
- MAT-esencia-de-trufa · `isomers`: «Maese Lab la presenta como «Parfum Pureza 100%, concentrado», sin dilución declarada.»
- MAT-esencia-de-trufa · `handling`: «Maese Lab: no apta para uso interno ni alimento; no aplicar en ojos ni mucosas; solo uso profesional de cosmética y perfumería; no usar en embarazo o lactancia; evitar en asma, hipertensión, afección renal, trastornos neurológicos o coronarios; no usar en menores de 3 años ni en personas mayores con debilidad física; fuera del alcance de los niños; el consumidor es responsable de cualquier mal uso.»
- MAT-esencia-de-trufa · `recommended_dilution`: «Maese Lab no da dosis ni dilución.»
- MAT-esencia-de-trufa · `blend_effect`: «Maese Lab: se combina «excelentemente» con flores blancas, pinos o cipreses, musgos y hongos. Una reseña dice que resulta más atractiva combinada con otras notas.»
- MAT-esencia-de-trufa · `stability`: «Maese Lab: conservar en lugar fresco, lejos de la luz directa y con el envase bien cerrado para evitar la evaporación.»
- MAT-ethyl-maltol · `notes`: «Web: Ni el kit de Olfatorium ni su ficha estaban accesibles.»
- MAT-ethylene-brassylate · `notes`: «Web: Material del kit de Olfatorium.»
- MAT-etil-4-fenol · `notes`: «Web: Sigma 40–42 lit.), así que a temperatura ambiente es sólido y lo que vende Maese Lab como «líquido» puede ser material fundido o un error de la ficha (la ficha de Maese Lab también escribe el CAS como «0123-07-09»). scent.vn muestra una etiqueta propia de generación automática (texto de aplicaciones «gpt-5-nano», tabla de solubilidad «Scent AI») y una lista de porcentajes de descriptores sin explicar su base.»
- MAT-etil-4-fenol · `notes`: «Números: La lista menciona el producto «Etil-4-Fenol Aroma Chemicals» de Maese Lab, que no se ha consultado.»
- MAT-etil-4-fenol · `handling`: «La ficha de Maese Lab dice: no ingerir, no aplicar directamente sobre la piel, evitar el contacto con ojos y mucosas, conservar en lugar fresco y sin luz directa; uso profesional.»
- MAT-eucaliptol · `notes`: «Web: Perfumiarz y Perfumer's Apprentice venden la versión «Natural»»
- MAT-eucaliptol · `notes`: «Web: El nombre del producto de Perfumiarz no lleva concentración y su guía dice que sin concentración en el nombre se suministra puro (100 %).»
- MAT-eucaliptol · `notes`: «TGSC: La lista habla de «Eucalyptol Natural» de Perfumiarz (casa Ventos), que no se ha consultado.»
- MAT-eucaliptol · `handling`: «Perfumiarz: trabajar en zona ventilada y evitar el contacto de ojos y piel con los materiales concentrados.»
- MAT-eucaliptol · `diffusion`: «Perfumiarz: «Skillfully used, it can enliven the opening of even heavy, oriental compositions!»»
- MAT-eucaliptol · `blend_effect`: «Perfumiarz: abre y aviva la salida de composiciones, incluso las orientales pesadas.»
- MAT-eucaliptol · `house`: «Ventos (según Perfumiarz)»
- MAT-eugenol-98 · `notes`: «Web: El «98 %» es la pureza del producto de Maese Lab, que no da más datos que el perfil, la advertencia de seguridad y que es líquido.»
- MAT-eugenol-98 · `notes`: «Otros sinónimos de la página: La lista pide «Eugenol 98 %» de Maese Lab.»
- MAT-eugenol-98 · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, no usar en embarazo o lactancia, ni en asma, hipertensión, enfermedad renal o epilepsia, lejos de menores de 3 años, guardar en lugar fresco, sin luz directa y bien cerrado.»
- MAT-eugenol-98 · `blend_effect`: «Resumen del buscador: Maese Lab lo llama «Fijador aromático» sin dar datos.»
- MAT-florosa · `notes`: «Web: La ficha de Maese Lab da el INCI truncado («TETRAHYDRO-METHYL-METHYLPROPYL)-PYRAN-4-OL»), pureza 100 %, origen Comunidad Europea.»
- MAT-florosa · `notes`: «Web: Maese Lab describe el perfil como «dulce, floral, cremoso, mimosa», más cremoso y dulce que muguet.»
- MAT-florosa · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, no usar en embarazo o lactancia, ni en asma, hipertensión, enfermedad renal o epilepsia, lejos de menores de 3 años, guardar en lugar fresco y sin luz directa.»
- MAT-florosa · `diffusion`: «Reseña de cliente en Maese Lab: «Potente y duradero. Difusivo.»»
- MAT-galaxolide · `notes`: «Web: La lista dice que se compró en Olfatorium (kit de iniciación)»
- MAT-galaxolide · `notes`: «Appearance: La lista da la compra en Olfatorium (kit de iniciación) sin ficha de tienda.»
- MAT-geosmina · `notes`: «Web: La ficha de Perfumiarz es la del producto comprado (1 % en DPG o puro, fabricante IFF, 1 g a 50 g.»
- MAT-geosmina · `notes`: «FEMA GRAS: La lista cita IFF como casa y la compra en Perfumiarz como «Geosmin 1% DPG».»
- MAT-geosmina · `isomers`: «Umbrales: Perfumiarz lo vende al 1 % en DPG y puro (100 %)»
- MAT-geosmina · `handling`: «Perfumiarz: trabajar en zona ventilada y evitar el contacto de ojos y piel con los materiales concentrados.»
- MAT-geosmina · `recommended_dilution`: «Scentfriends: Perfumiarz lo ofrece al 1 % en DPG. · TGSC: Smelling in a 1.00 % solution or less (la descripción de Luebke es «at 1.00 % in dipropylene glycol»).»
- MAT-geosmina · `threshold`: «Perfumiarz: 0,006 µg/L de agua.»
- MAT-geosmina · `blend_effect`: «Perfumiarz: usable en acordes amaderados y de pachulí y en prácticamente cualquier composición.»
- MAT-geraniol-98 · `notes`: «Web: La ficha de Maese Lab (Geraniol 98 % Nat) es de producto natural, origen Comunidad Europea, sin más datos que el perfil, la advertencia de seguridad y que es líquido.»
- MAT-geraniol-98 · `notes`: «TGSC: La lista pide «Geraniol 98 % (nat.)» de Maese Lab, que no se ha consultado.»
- MAT-geraniol-98 · `isomers`: «Maese Lab lo vende como «Geraniol 98 % Nat»»
- MAT-geraniol-98 · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, no usar en embarazo o lactancia, ni en asma, hipertensión, afección renal o epilepsia, lejos de menores de 3 años, guardar en lugar fresco y sin luz directa.»
- MAT-haba-tonka-tintura · `notes`: «Web: Tintura comercial sin ficha técnica propia: lo anotado es lo que dice la tienda (Maese Lab).»
- MAT-haba-tonka-tintura · `notes`: «Web: Maese Lab no da proporción, aspecto, densidad, composición (cumarina), IFRA ni dosis.»
- MAT-haba-tonka-tintura · `notes`: «Web: El buscador señala que el absoluto de Maese Lab figura con un CAS mal escrito («90028-06-02») frente al 90028-06-1 de la tintura.»
- MAT-haba-tonka-tintura · `notes`: «TGSC: AVISO DE IDENTIDAD: la tintura comercial de Maese Lab no tiene ficha propia en TGSC.»
- MAT-haba-tonka-tintura · `notes`: «TGSC: (ex1061081) que NO lleva CAS ni proveedores (Maese Lab no aparece) y solo da: Odor Type «coumarinic», Odor Description «at 100.00 %. tonka coumarinic»»
- MAT-haba-tonka-tintura · `isomers`: «Maese Lab vende aparte un «ABS.»
- MAT-haba-tonka-tintura · `handling`: «Maese Lab: no apto para uso interno ni alimentación; no aplicar en ojos ni mucosas; no exponerse al sol justo después de aplicar tinturas por vía tópica; no usar sobre pieles sensibles; no usar en embarazo ni lactancia; evitar en asma, hipertensión, afección renal, alteraciones neurológicas o coronarias; no aplicar en menores de 3 años ni en personas mayores con debilidad física. La ficha marca «Apto para cosmética: No» y «Apto para perfumería: Sí».»
- MAT-haba-tonka-tintura · `recommended_dilution`: «Maese Lab no indica dosis ni dilución de trabajo.»
- MAT-haba-tonka-tintura · `stability`: «Maese Lab: conservar en lugar fresco, sin luz directa y con el envase bien cerrado para evitar la evaporación. Aspecto no indicado (líquido por ser tintura).»
- MAT-habanolide · `notes`: «Web: Perfumiarz lo vende como Habanolide® de Firmenich (agotado en todos los formatos al leer la página.»
- MAT-helional · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), ScenTree y Scentspiracy.»
- MAT-helional · `notes`: «Web: Perfumiarz y Scentspiracy dan IFF como casa.»
- MAT-helional · `notes`: «Tier: Perfumiarz «Heart Note», ScenTree «Heart/Base», Scentspiracy describe el fondo como «melon-dew top» pero no fija nota: no se anota discrepancia.»
- MAT-helional · `notes`: «FDA: La lista da el producto de Perfumiarz y a IFF como casa.»
- MAT-helional · `handling`: «Perfumiarz: sin aviso propio, solo enlaza SDS y alérgenos UE; consejo general de trabajar con ventilación y evitar contacto con piel y ojos con materiales concentrados.»
- MAT-helional · `diffusion`: «Perfumiarz: «ideal for adding a breezy, open-air feel».»
- MAT-heliotropina · `notes`: «Web: OJO: la ficha de Perfumiarz es de «Heliotropine 25% DPG», una dilución, no el material puro.»
- MAT-heliotropina · `notes`: «Web: Se abrieron Perfumiarz, ScenTree y Fraterworks.»
- MAT-heliotropina · `notes`: «CAS borrado: La lista pide el producto «Heliotropine 25% DPG» de Perfumiarz (casa PCW), no consultado.»
- MAT-heliotropina · `recommended_dilution`: «Fraterworks: Perfumiarz vende al 25 % en DPG.»
- MAT-heliotropina · `diffusion`: «Perfumiarz: la nota «lingers in the nose and throat for several seconds».»
- MAT-heliotropina · `blend_effect`: «Perfumiarz: aporta cremosidad y suavidad a las composiciones. Darren Alan Perfumes (vía buscador): suaviza materiales de alto impacto como acetatos y aldehídos.»
- MAT-hidroxicitronelal-cyclosia · `notes`: «Web: Para Cyclosia, ninguna fuente abierta dice que sea una base o composición distinta del hidroxicitronelal: todas la tratan como el grado de marca de Firmenich del mismo CAS 107-75-5 (Perfumiarz con INCI «Hydroxycitronellal», color «colourless liquid» y sin concentración ni disolvente declarados, probablemente puro).»
- MAT-hidroxicitronelal-cyclosia · `notes`: «Web: Se abrieron Perfumiarz, Fraterworks, Scentspiracy y ScenTree (cuatro páginas por hacer falta la ficha de Cyclosia y los datos físicos.»
- MAT-hidroxicitronelal-cyclosia · `notes`: «Usos cosméticos: La lista da la compra en Perfumiarz y a Firmenich como casa.»
- MAT-hidroxicitronelal-cyclosia · `isomers`: «Todas las fuentes tratan Cyclosia como un grado de marca (Firmenich) del mismo hidroxicitronelal, CAS 107-75-5, no como una composición distinta: Perfumiarz lo rotula «Cyclosia® (Hydroxycitronellal)»»
- MAT-hidroxicitronelal-cyclosia · `handling`: «Perfumiarz: enlaza SDS, IFRA (10-23) y alérgenos UE (01-24) sin resumirlos.»
- MAT-hidroxicitronelal-cyclosia · `blend_effect`: «Perfumiarz: «a classic molecule indispensable in creating many floral accords»; Fraterworks: «Iconic floralizer», «Classic muguet». Se usa para reconstruir flores sin extracto utilizable (lirio, lila, ciclamen, guisante de olor, tilo) según una página de glosario (vía buscador).»
- MAT-ionona-alpha · `notes`: «Web: No hay ficha de tienda de compra (kit de Olfatorium)»
- MAT-ionona-beta · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), ScenTree y Perfumers Apprentice.»
- MAT-ionona-beta · `notes`: «Nota: Perfumiarz «Base Note», ScenTree «Heart/Base», Fragrance Foundry «Mid/Base»: no se anota discrepancia.»
- MAT-ionona-beta · `handling`: «ScenTree: Perfumiarz y Perfumers Apprentice enlazan SDS e IFRA 51 sin resumirlos; Perfumiarz solo da la guía general de la tienda (ventilación, evitar contacto con piel y ojos en materiales concentrados).»
- MAT-ionona-beta · `blend_effect`: «Perfumiarz: añade calidez y dulzor con su faceta de frambuesa.»
- MAT-iso-e-super · `notes`: «Web: Material del kit de Olfatorium.»
- MAT-isobutil-quinoleina-ibq · `notes`: «Web: Comprado en Maese Lab (no se dio URL de ficha), así que se leyeron Perfumiarz, ScenTree y PerfumersWorld.»
- MAT-isobutil-quinoleina-ibq · `notes`: «Proveedores: La lista da la compra en Maese Lab, sin ficha de tienda.»
- MAT-kephalis · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), Givaudan y Fraterworks.»
- MAT-kephalis · `notes`: «Web: Givaudan y Perfumiarz clasifican la familia como amaderada; Perfumiarz pone «Heart Note / Base Note», Fraterworks «Base note», Givaudan «heart and base notes»: no es discrepancia.»
- MAT-kephalis · `isomers`: «Perfumiarz lo vende sin dilución (el nombre del producto no lleva % ni disolvente.»
- MAT-kephalis · `blend_effect`: «Givaudan: Sinergia citada por Givaudan y Perfumiarz: 80 % Kephalis + 20 % Dupical da «a beautiful fresh and spicy blooming note with some cardamom facets, bringing nervosity and naturality to white petals».»
- MAT-laudano-de-jara · `notes`: «Web: Maese Lab vende el absoluto 100 % puro y sólido (ficha de la tienda de la compra)»
- MAT-laudano-de-jara · `notes`: «TGSC: Maese Lab no aparece como proveedor.»
- MAT-laudano-de-jara · `isomers`: «Grado de la compra: «PUREZA 100%», sólido, vendido en bote a medio llenar para que el cliente lo diluya; Maese Lab vende aparte versiones diluidas al 10 % y al 50 % en alcohol. ScenTree y Scentspiracy distinguen resinoide de gum y absoluto de planta fresca; Scentspiracy: 50 % en DPG es una dilución comercial habitual. Biolandes (vía buscador) tiene un «by-absolute» de hojas y ramas agotadas, con perfil distinto.»
- MAT-laudano-de-jara · `handling`: «Maese Lab: no ingerir; no aplicar directamente sobre la piel (puede irritar); evitar ojos y mucosas; no usar en embarazo ni lactancia; evitar en asma, hipertensión, afección renal o epilepsia; no aplicar a menores de 3 años.»
- MAT-laudano-de-jara · `recommended_dilution`: «Maese Lab: se vende puro en un bote a medio llenar «para que el cliente lo diluya» sin ratio; una reseña recomienda calentar el bote al baño maría antes de disolverlo.»
- MAT-laudano-de-jara · `origin`: «España (Maese Lab.»
- MAT-lavanda · `notes`: «Web: Especie, parte y método confirmados por Olfatorium, ScenTree y Augustus Oils.»
- MAT-lavanda · `notes`: «Web: La ficha individual de Olfatorium (lavanda) dice Lavandula angustifolia, España, 8000-28-0 / 90063-37-9, pero la ficha del kit de iniciación solo lista «Lavanda» sin botánica ni dilución, y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar» sin indicar cuáles ni a qué %: no se puede saber si la del kit viene diluida.»
- MAT-lavanda · `notes`: «TGSC: Olfatorium no aparece como proveedor.»
- MAT-lavanda · `handling`: «ScenTree: Olfatorium enlaza ficha técnica y de seguridad sin resumirlas.»
- MAT-lavanda · `recommended_dilution`: «Olfatorium: se vende puro (campo «Dilución: Puro» en la ficha individual).»
- MAT-lavanda · `origin`: «España (Olfatorium)»
- MAT-limon · `notes`: «Web: Especie, parte y método (expresión en frío de la cáscara) confirmados por Olfatorium y Eden Botanicals.»
- MAT-limon · `notes`: «Web: La ficha del kit de Olfatorium solo lista «Limón» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar» sin indicar cuáles ni a qué %: no se sabe si el limón del kit va diluido (la ficha individual lo da como Puro).»
- MAT-limon · `notes`: «TGSC: Olfatorium no aparece como proveedor.»
- MAT-limon · `isomers`: «Olfatorium lo vende «Puro».»
- MAT-limon · `isomers`: «La ficha del kit dice que la mayoría de las 30 materias vienen ya diluidas pero no indica cuáles (véase notes).»
- MAT-limon · `handling`: «Olfatorium: no menciona fototoxicidad en el texto; enlaza ficha de seguridad.»
- MAT-limon · `recommended_dilution`: «Olfatorium: se vende puro.»
- MAT-limon · `origin`: «España (Olfatorium)»
- MAT-linalol · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-litsea-cubeba · `notes`: «Web: Olfatorium no da dosis, composición ni IFRA.»
- MAT-litsea-cubeba · `notes`: «Web: La ficha del kit de Olfatorium solo lista «Litsea Cubeba» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar» sin indicar cuáles ni a qué %: no se sabe si la del kit va diluida (la ficha individual la da como «Puro»).»
- MAT-litsea-cubeba · `notes`: «TGSC: Olfatorium no aparece como proveedor.»
- MAT-litsea-cubeba · `isomers`: «Olfatorium lo vende «Puro».»
- MAT-litsea-cubeba · `isomers`: «Ver notes sobre la ficha del kit.»
- MAT-litsea-cubeba · `handling`: «Olfatorium y PerfumersWorld: sin avisos de seguridad en el texto (fichas de seguridad enlazadas o a petición). Resumen del buscador (PerfumersWorld, vía buscador): cita el citralva, antiguo sustituto del citral, como prohibido por IFRA desde 2008.»
- MAT-litsea-cubeba · `recommended_dilution`: «Olfatorium: se vende puro.»
- MAT-litsea-cubeba · `origin`: «China (Olfatorium)»
- MAT-litsea-cubeba · `physical_state`: «Líquido: aceite esencial, destilación al vapor de los frutos —el único cítrico del kit que no se obtiene por expresión, según la monografía»
- MAT-mandarina · `notes`: «Web: Especie, parte y método (Citrus reticulata, cáscara, expresión en frío) confirmados por Olfatorium.»
- MAT-mandarina · `notes`: «Web: Olfatorium no da dosis, tenacidad, composición ni IFRA.»
- MAT-mandarina · `notes`: «Web: La ficha del kit solo lista «Mandarina» y dice de las 30 materias que están «la mayoría ya diluidas y listas para usar» sin indicar cuáles ni a qué %: no se sabe si la del kit va diluida (la ficha individual la da como «Puro»).»
- MAT-mandarina · `notes`: «TGSC: La lista no dice cuál compró el usuario.»
- MAT-mandarina · `notes`: «TGSC: Olfatorium no aparece como proveedor.»
- MAT-mandarina · `isomers`: «Olfatorium lo vende «Puro».»
- MAT-mandarina · `isomers`: «Ver notes sobre la ficha del kit.»
- MAT-mandarina · `handling`: «Olfatorium: la fototoxicidad no figura en el texto; enlaza ficha de seguridad.»
- MAT-mandarina · `recommended_dilution`: «Olfatorium: se vende puro; no indica dilución de trabajo.»
- MAT-mandarina · `origin`: «España (Olfatorium)»
- MAT-maritima · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), Fraterworks y Perfumer's Apprentice.»
- MAT-maritima · `notes`: «Tenacidad: Perfumiarz y Fraterworks difieren en la nota (heart/base frente a base): no es discrepancia.»
- MAT-maritima · `notes`: «Tenacidad: Perfumiarz añade «nuances of wet fur scent» a la descripción.»
- MAT-maritima · `isomers`: «Perfumiarz lo vende sin dilución (el nombre del producto no lleva % ni disolvente.»
- MAT-maritima · `handling`: «Perfumiarz: dilúyase antes de usar. Un usuario de Basenotes (vía buscador) comparó la primera impresión a concentración plena con tela húmeda.»
- MAT-maritima · `recommended_dilution`: «Perfumiarz: «Dilute before use, preferably to a minimum of 1%» (sin disolvente indicado). · TGSC: Smelling in a 10.00 % solution or less (la descripción de Luebke es «10% in dipropylene glycol»)»
- MAT-maritima · `diffusion`: «Perfumer's Apprentice: Perfumiarz lo describe como «an exceptional molecule from the water-ozonic family».»
- MAT-mayol · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-methyl-pamplemousse · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-metil-ionona-gamma · `notes`: «Web: Se abrieron Maese Lab (la de la compra), Fraterworks (grado Coeur de IFF, que es otro grado) y PerfumersWorld (alpha isomethyl ionone).»
- MAT-metil-ionona-gamma · `notes`: «Web: La ficha de Maese Lab no da casa ni dosis ni IFRA.»
- MAT-metil-ionona-gamma · `notes`: «Web: Maese Lab lo vende con pureza 100 % (no viene diluido.»
- MAT-metil-ionona-gamma · `notes`: «Duda de identidad: La proporción real de isómeros del producto de Maese Lab no se declara.»
- MAT-metil-ionona-gamma · `notes`: «Duda de identidad: Maese Lab no clasifica por familia ni nota.»
- MAT-metil-ionona-gamma · `notes`: «TGSC: No se sabe a qué grado corresponde el frasco de Maese Lab.»
- MAT-metil-ionona-gamma · `isomers`: «Maese Lab: INCI «METHYLIONONE GAMMA ISO-ALPHA-METHYL IONONE», nombre químico con la etiqueta «(isomers)», pureza «100%», origen «COMUNIDAD EUROPEA»; no nombra fabricante ni composición isomérica. Fraterworks (grado Coeur, IFF, que no es el comprado): «contains the highest amount of the weaker Alpha Isomethyl Ionone (CAS 127-51-5)»; frente al Methyl Ionone Alpha Extra, que lleva más del isómero más fuerte Alpha Methyl Ionone (CAS 7779-30-8).»
- MAT-metil-ionona-gamma · `handling`: «Maese Lab: «No aplicar directamente sobre la piel», «No ingerir», uso limitado a cosmética profesional y perfumería, evitar ojos y mucosas, no usar en embarazo o lactancia, asma, hipertensión, enfermedad renal o epilepsia, ni en menores de 3 años.»
- MAT-miel-esencia-aromatica · `handling`: «Maese Lab: no apto para uso interno ni alimento; no utilizar directamente sobre la piel; no aplicar en zona de ojos ni mucosas; destinado solo a uso profesional por su concentración y complejidad; no usar durante embarazo o lactancia; evitar en asma, hipertensión, afección renal, alteraciones neurológicas o coronarias; no aplicar a menores de 3 años ni a personas mayores con debilidad física; fuera del alcance de los niños.»
- MAT-miel-esencia-aromatica · `blend_effect`: «Maese Lab: tiene «gran capacidad de fijación» en formulaciones.»
- MAT-miel-esencia-aromatica · `house`: «Maese Lab (España)»
- MAT-miel-esencia-aromatica · `stability`: «Conservar en lugar fresco, lejos de la luz directa y con el envase bien cerrado (Maese Lab).»
- MAT-musgo-de-roble-absoluto · `notes`: «Web: Grado comprado: la ficha de Perfumiarz es de un «Oakmoss Absolute 50% (IPM)» de IFF, no del absoluto puro.»
- MAT-musgo-de-roble-absoluto · `notes`: «Web: Perfumiarz no dice parte, método, origen ni composición, ni si es bajo en atranol, y su página figuraba agotada en todos los tamaños.»
- MAT-musgo-de-roble-absoluto · `notes`: «TGSC: Perfumiarz no aparece como proveedor, así que no se puede afirmar que la ficha describa exactamente el absoluto de IFF vendido por Perfumiarz (versión IFRA / baja en atranol o no).»
- MAT-musgo-de-roble-absoluto · `isomers`: «Grado de la compra (Perfumiarz): «Oakmoss Absolute 50% (IPM)», dilución al 50 % con «(IPM)» como disolvente en el nombre, sin que la página desarrolle la sigla.»
- MAT-musgo-de-roble-absoluto · `isomers`: «Perfumiarz no dice si es un grado bajo en atranol.»
- MAT-musgo-de-roble-absoluto · `handling`: «Perfumiarz: sin avisos propios (enlaza SDS, IFRA y alérgenos UE).»
- MAT-musgo-de-roble-absoluto · `recommended_dilution`: «Perfumiarz lo vende ya al 50 % («IPM»).»
- MAT-musgo-de-roble-absoluto · `origin`: «Perfumiarz: no lo dice.»
- MAT-musgo-de-roble-absoluto · `blend_effect`: «Perfumiarz: «even a small amount will give the composition flair and class».»
- MAT-naranja-dulce · `notes`: «Web: Se abrieron ScenTree, Fraterworks y la página del kit de Olfatorium.»
- MAT-naranja-dulce · `notes`: «Web: El kit lista «Naranja dulce» como aceite esencial sin porcentaje, disolvente ni cantidad.»
- MAT-naranja-dulce · `notes`: «Specific Gravity: Olfatorium no aparece como proveedor.»
- MAT-naranja-dulce · `isomers`: «Las fuentes distinguen grados: Olfatorium solo dice del kit que «la mayoría» de los frascos vienen ya diluidos y no indica si el naranja dulce lo está ni a qué porcentaje.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `notes`: «Web: Se abrieron la ficha de Maese Lab (la de la compra), Fraterworks y ScenTree.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `notes`: «Duda de identidad: Maese Lab no escribe la especie, solo el INCI de B. sacra, y su origen es Yemen.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `notes`: «Duda de identidad: Maese Lab no da densidad, ni %, ni nota.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `notes`: «Datos de esa ficha genérica: Maese Lab no aparece como proveedor en la ficha exacta.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `isomers`: «Maese Lab lo vende como «100% puro, quimiotipado y no desnaturalizado», sin dilución.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `isomers`: «Los CAS difieren: el 89957-98-2 es el que Maese Lab asocia al INCI «Boswellia Sacra Gum Oil»»
- MAT-olibano-boswellia-sacra-aceite-esencial · `isomers`: «Los CAS difieren: Maese Lab ofrece aparte un aceite de B. carterii, no el comprado.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `handling`: «Maese Lab: no aplicar directamente sobre la piel; no ingerir; no usar en embarazo o lactancia (la ficha ampliada dice «no utilizar durante el embarazo sin la supervisión de un especialista»); no aplicar a menores de 3 años; evitar en asma, hipertensión y afección renal.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `recommended_dilution`: «Maese Lab: «Siempre diluir en un medio según tratamiento»; sin porcentaje ni disolvente.»
- MAT-olibano-boswellia-sacra-aceite-esencial · `origin`: «Yemen (Maese Lab)»
- MAT-paradisamide · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), ScenTree y Perfumer's Apprentice.»
- MAT-paradisamide · `notes`: «Web: ScenTree pone volatilidad «Base», Perfumiarz «Heart Note»: diferencia de nota, anotada como heart-base.»
- MAT-paradisamide · `isomers`: «Perfumiarz lo vende sin dilución (el nombre del producto no lleva % ni disolvente.»
- MAT-paradisamide · `isomers`: «La lista dice que lo comprado es una muestra de Perfumiarz.»
- MAT-paradisamide · `blend_effect`: «Perfumiarz: sirve tanto en microdosis como en cantidades grandes.»
- MAT-patchouli · `notes`: «Web: Olfatorium lista «Patchouli» entre los aceites esenciales del kit sin decir grado, dilución ni cantidad.»
- MAT-patchouli · `notes`: «Otras fichas de TGSC no leídas: Olfatorium no aparece como proveedor.»
- MAT-patchouli · `isomers`: «Las fuentes distinguen grados: La lista no dice el grado y Olfatorium solo lista «Patchouli» sin dilución ni cantidad.»
- MAT-pimienta-negra-absoluto · `notes`: «Web: Solo se encontró una ficha del absoluto: la de Perfumiarz (la de la compra), que no da origen, proceso, densidad, tenacidad ni dosis.»
- MAT-pimienta-negra-absoluto · `notes`: «Web: La nota la da Perfumiarz como «Heart Note»»
- MAT-pimienta-negra-absoluto · `notes`: «Sabor: Perfumiarz no aparece como proveedor.»
- MAT-pimienta-negra-absoluto · `isomers`: «Perfumiarz lo vende puro: «brown paste» que «dilutes without any issues», sin dilución de fábrica declarada. El CAS 8006-82-4 es el que otras fuentes (vía buscador) asocian al aceite esencial de pimienta negra, no solo al absoluto.»
- MAT-pimienta-negra-absoluto · `handling`: «Perfumiarz solo enlaza SDS, IFRA y alérgenos UE sin resumir su contenido.»
- MAT-pimienta-negra-absoluto · `recommended_dilution`: «Perfumiarz: «dilutes without any issues» (sin porcentaje ni disolvente).»
- MAT-pimienta-negra-absoluto · `blend_effect`: «Perfumiarz: más oscuro, profundo y mate que el aceite esencial; conserva la frescura de la pimienta pero tira a un perfil ahumado y de cuero.»
- MAT-pimienta-negra-absoluto · `appearance`: «marrón (Perfumiarz: «brown paste»)»
- MAT-pimienta-negra-absoluto · `stability`: «Perfumiarz: Firmenich garantiza «quality, stability and, above all, batch-to-batch consistency».»
- MAT-polysantol · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-prismantol · `notes`: «Web: Se abrieron Perfumiarz (la de la compra), Perfumer's Apprentice y Olfactorian.»
- MAT-prismantol · `notes`: «Web: Perfumer's Apprentice da apariencia «Solid white» del material puro y Perfumiarz «colourless liquid» del diluido: no es discrepancia.»
- MAT-prismantol · `isomers`: «GRADO COMERCIAL: Perfumiarz lo vende diluido, «Prismantol 50% (DPG)», es decir, al 50 % en dipropilenglicol (el título del producto lo dice.»
- MAT-prismantol · `handling`: «Perfumiarz: no ofrece SDS ni documento IFRA para esta presentación (las especificaciones se dan a petición).»
- MAT-resinoide-benjui · `notes`: «Web: La ficha de Perfumiarz (recompra, pura) no se pudo abrir (404 tanto con la dirección del buscador como sin ella), así que lo que se dice de Perfumiarz viene de fragmentos del buscador, y no consta que el comprado sea el de Siam.»
- MAT-resinoide-benjui · `notes`: «La lista da dos compras: el kit de Olfatorium (que no dice especie ni dilución) y Perfumiarz «puro»»
- MAT-resinoide-benjui · `notes`: «Proveedores en la página: Perfumiarz y Olfatorium no aparecen como proveedores.»
- MAT-resinoide-benjui · `isomers`: «Perfumiarz ofrece los dos y la lista no dice cuál es el comprado ni el kit de Olfatorium («Resinoide Benjuí», sin especie ni dilución): hay que confirmarlo.»
- MAT-resinoide-benjui · `isomers`: «Perfumiarz ofrece 100 % puro y 50 % (en TEC o DPG, vía buscador).»
- MAT-resinoide-benjui · `recommended_dilution`: «Vía buscador: Perfumiarz avisa de que el benjuí puro es denso y viene en trozos duros y disolverlo exige paciencia.»
- MAT-resinoide-estyrax-estoraque · `notes`: «Identidad: El kit de Olfatorium lista «Resinoide Estyrax» sin especie, grado ni dilución, así que no se sabe si es el americano (styraciflua) o el oriental, ni si es el extracto normal o un pirogenado tipo Vulcain (más cuero y ahumado, intensidad 7/10).»
- MAT-resinoide-estyrax-estoraque · `notes`: «Odor Type: Olfatorium no aparece como proveedor.»
- MAT-resinoide-estyrax-estoraque · `isomers`: «Hay que distinguir tres cosas: Olfatorium lista «Resinoide Estyrax» sin especie, proveedor ni dilución.»
- MAT-safraleine · `notes`: «Web: DUDA DE IDENTIDAD Y CASA: la lista pide confirmar que el Safraleine de Maese Lab es el original de Givaudan y no una reconstrucción de otro proveedor.»
- MAT-safraleine · `notes`: «Web: Esa confirmación no se puede dar: la ficha de Maese Lab no nombra fabricante (sólo origen «Comunidad Europea» y pureza 100 %)»
- MAT-safraleine · `notes`: «Web: El nombre químico de Maese Lab (INCI 2,3,3-trimethyl-2H-inden-1-one) coincide con el de Scentspiracy y el CAS 54440-17-4 es el mismo en las tres fuentes abiertas.»
- MAT-safraleine · `notes`: «Web: Se abrieron Maese Lab (la de la compra), Perfumiarz y Scentspiracy.»
- MAT-safraleine · `notes`: «Web: Maese Lab no clasifica por familia ni nota.»
- MAT-safraleine · `isomers`: «Maese Lab lo vende con pureza 100 % (no diluido).»
- MAT-safraleine · `handling`: «Maese Lab (avisos generales de «fracciones»): no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas, no usar en embarazo o lactancia, no aplicar en menores de 3 años.»
- MAT-salvia-officinalis · `notes`: «Web: Olfatorium lista «Salvia Officinalis» entre los aceites del kit sin dilución ni cantidad: solo dice que «la mayoría» de los frascos vienen diluidos, así que habría que preguntar.»
- MAT-salvia-officinalis · `notes`: «Sabor: Olfatorium no aparece como proveedor.»
- MAT-salvia-officinalis · `isomers`: «Olfatorium lista «Salvia Officinalis» entre los aceites esenciales del kit sin decir origen ni dilución.»
- MAT-sandalmysore-core · `notes`: «Web: Se abrieron la página de Kao (la casa), PerfumersWorld y Maese Lab (otra tienda, no la de la compra).»
- MAT-sandalmysore-core · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-stemone · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-vainillina · `notes`: «Web: Se abrieron Maese Lab (la de la compra), Scentspiracy y ScenTree.»
- MAT-vainillina · `notes`: «Web: En la lista, «Casa según el proveedor: Maese Lab» es el vendedor, no el fabricante: la ficha no nombra casa.»
- MAT-vainillina · `notes`: «Web: Maese Lab clasifica el olor como vainilla de repostería y no da familia ni nota.»
- MAT-vainillina · `notes`: «CAS borrado: La página no nombra a Maese Lab.»
- MAT-vainillina · `isomers`: «Maese Lab lo vende como sólido con pureza 99 % (no diluido), origen «COMUNIDAD EUROPEA», INCI «Vanillin»; la ficha no nombra fabricante (Maese Lab es el vendedor).»
- MAT-vainillina · `isomers`: «La ficha de Maese Lab no dice cuál es.»
- MAT-vainillina · `handling`: «Maese Lab: no ingerir, no aplicar directamente sobre la piel, evitar ojos y mucosas.»
- MAT-vainillina · `blend_effect`: «Maese Lab: mejora la durabilidad de composiciones especiadas y con fondos dulces.»
- MAT-vertenex-ptbcha · `notes`: «Web: No hay ficha de la tienda donde se compró (Olfatorium, kit de iniciación).»
- MAT-vertenex-ptbcha · `notes`: «Duda de identidad: Las fuentes dan el mismo CAS (32210-23-4) y la misma molécula, pero ninguna dice si ese kit trae IFF o genérico.»
- MAT-vetiver · `notes`: «Web: La lista no da ficha de tienda ni origen (Olfatorium: «Vetiver» sin más).»
- MAT-vetiver · `notes`: «Web: No se ha podido comprobar si el frasco es de Haití, Java o Bourbon, ni si viene diluido: Olfatorium solo dice que «la mayoría» de los frascos del kit están diluidos.»
- MAT-vetiver · `notes`: «Uso en sabor: Olfatorium no aparece como proveedor.»
- MAT-vetiver · `isomers`: «La lista y Olfatorium no dicen el origen del frasco.»
- MAT-whisky-lactona · `notes`: «Web: Maese Lab también lo vende (https://maeselab.com/en/whisky-lactona-metil-octalactona/) pero no se leyó.»

### Descriptores (83)

- MAT-2-acetilpirazina · web: «Maese Lab: Palomitas de maíz, nueces, avellanas, café, chocolate, pan...»
- MAT-2-acetilpirazina · web: «Maese Lab: intenso y cálido aroma a nuez, tostado y ligeramente ahumado»
- MAT-2-hidroxibenzaldehido · web: «Perfumiarz: Almond-like but darker and more roasted than benzaldehyde»
- MAT-2-hidroxibenzaldehido · web: «Perfumiarz: sweet-spicy, almond-buckwheat, roasted»
- MAT-3-4-xilenol · web: «Perfumiarz: medicinal, leathery, phenolic, tar, castoreum, oud»
- MAT-aceite-de-cade-enebro · web: «Maese Lab: aroma profundo, amaderado y ahumado, con toques terrosos»
- MAT-acetato-de-bencilo · web: «Maese Lab: dulce, floral y ligeramente frutal; a menudo percibido como jazmín o pera suave»
- MAT-acetato-de-estiralilo · web: «Perfumiarz: fruity-green, rhubarb, gardenia, with tropical nuances»
- MAT-acetato-de-geranilo · web: «Perfumiarz: floral-green-fruity, rose, waxy, fresh»
- MAT-acetato-de-linalilo · web: «Perfumiarz: citrusy-herbal (bergamot-lavender), fresh, bright, woody undertones»
- MAT-acetato-de-terpinilo · web: «Perfumiarz: herbal-citrus, bergamot, lavender, sweet»
- MAT-ajenjo-aceite-esencial · web: «Perfumiarz: absinthe, wormwood, sweet-herbal, bitter»
- MAT-aldambre · web: «Perfumiarz: woody-metallic, hot iron, musky nuances»
- MAT-aldehido-c11-moa · web: «Perfumiarz: It has a very intense and diffusive odor that leans towards an aquatic-citrus direction.»
- MAT-aldehido-c11-moa · web: «Perfumiarz: aldehydic, fresh (aquatic), waxy, citrus and floral nuances»
- MAT-aldehido-c14-gamma-undecalactona · web: «Maese Lab: Dulce, afrutado, melocotón»
- MAT-aldehido-c14-gamma-undecalactona · web: «Maese Lab: aroma afrutado y cremoso con notas de melocotón y albaricoque»
- MAT-aldehido-c18-gamma-nonalactona · web: «Maese Lab: Coco, cumarina, lactona, juvenil, moderno»
- MAT-ambar-gris-tintura · web: «Maese Lab, reseñas de clientes: empolvado fresco maritino; terrosos, amaderados, marinos, dulces»
- MAT-ambar-gris-tintura · web: «Maese Lab: Aroma amaderado, ambarado.»
- MAT-ambermor · web: «Maese Lab: Ámbar, amaderado, dulce, almizclado»
- MAT-ambrettolide · web: «Perfumiarz: musky, ambrette seed, soapy, red fruit accents»
- MAT-ambrinol-s · web: «Perfumiarz: Ambrinol has a strong, piercing scent reminiscent of the odor of natural grey amber.»
- MAT-ambrinol-s · web: «Perfumiarz: animalic-amber (grey amber), damp, mineral, musky nuances»
- MAT-auranone · web: «Perfumiarz: Musky, soft, warm, skin-like, slightly powdery, animalic nuances.»
- MAT-balsamo-de-tolu-resinoide · web: «Perfumiarz: sweet-spicy, resinous, with vanilla and phenolic nuances»
- MAT-black-agar-296985 · web: «Perfumiarz: woody-leathery, oud, animalic nuances»
- MAT-cacao-absoluto · web: «Maese Lab: aroma «intenso y dulce» a cacao, con una fragancia «profunda y cálida»»
- MAT-calone · web: «Perfumiarz: marine, ozonic, fresh, greenish, nuances of seaweed scent, fruity undertones (melon)»
- MAT-cashmeran · web: «Maese Lab: Aldeidico herbal picante. Recuerda al estigma del maíz (mazorca verde).»
- MAT-cassis-base-345-b · web: «Perfumiarz: fruity, juicy, fresh, tangy, green»
- MAT-castoreo-sintetico · web: «Perfumiarz: A very realistic, synthetic alternative to natural castoreum.»
- MAT-castoreo-sintetico · web: «Perfumiarz: castoreum, fur, leather, musk»
- MAT-castoreum · web: «Maese Lab: aroma cálido, animalístico y ligeramente ahumado, con matices de cuero, resinas y un fondo balsámico»
- MAT-cedramber · web: «Perfumiarz: amber-woody, cedarwood, dry, hints of leather and musk»
- MAT-cilantro · web: «Olfatorium: Fresco, picante, amaderado, aromático, dulce y especiado.»
- MAT-cinamato-de-metilo · web: «Perfumiarz: sweet-fruity, strawberry, cherry, cinnamon»
- MAT-cis-3-hexenol · web: «Perfumiarz: green, grassy, herbal»
- MAT-cumarina-natural · web: «Maese Lab: Dulce e intenso, con notas confitadas.»
- MAT-cumarina-natural · web: «Maese Lab: Vainilla, almendra amarga»
- MAT-dartanol · web: «Maese Lab: Sándalo, cedro, cremoso»
- MAT-datilat · web: «Perfumiarz: sweet-fruity, dried fruits (dates, raisins, plums), brandy»
- MAT-dewfruit-tec · web: «Perfumiarz: fruity-floral, exotic, lychee, blackcurrant, raspberry, green nuances»
- MAT-diphenyl-oxide · web: «Maese Lab: Aroma a geranio, hoja verde, palo de rosa floral, fenólico ligeramente áspero, aldehídico- metálico, alcanforado.»
- MAT-ebanol · web: «Maese Lab: Amaderado, dulce, intenso, profundo, cítrico acaramelado.»
- MAT-esencia-de-trufa · web: «Maese Lab, reseñas de clientes: mezcla de notas lácteas, de setas y madera húmeda»
- MAT-esencia-de-trufa · web: «Maese Lab: De aroma dulce, intenso y que recuerda al fruto de trufa, profundo.»
- MAT-etil-4-fenol · web: «Maese Lab: Cuero, pegamento, intenso (nota principal: «Cuero crudo intenso»)»
- MAT-etil-4-fenol · web: «Maese Lab: Dulce y fenólico, con reminiscencias a zapaterías y pegamentos especializados»
- MAT-eucaliptol · web: «Perfumiarz: fresh, cooling, herbal, green»
- MAT-eugenol-98 · web: «Maese Lab: Fresco, dulce, especiado, clavo, canela (nota secundaria: «Especiado con un toque picoso suave»)»
- MAT-florosa · web: «Maese Lab: Dulce, floral, cremoso, mimosa»
- MAT-geosmina · web: «Perfumiarz: earthy, damp, fresh, natural (olor «photorealistic» a tierra húmeda y fresca)»
- MAT-geraniol-98 · web: «Maese Lab: Geranio, rosa silvestre, hierba segada»
- MAT-haba-tonka-tintura · web: «Maese Lab (notas de la ficha): Vainilla, almendra y un toque amaderado»
- MAT-haba-tonka-tintura · web: «Maese Lab: perfil aromático dulce, cálido y especiado»
- MAT-haba-tonka-tintura · web: «Reseñas de clientes en Maese Lab: clavo, almendro amargo, combinaciones con sándalo, tabaco y vainilla»
- MAT-habanolide · web: «Perfumiarz: musky, sweet, powdery, fresh laundry»
- MAT-helional · web: «Perfumiarz: a refreshing and clean scent with distinct melon notes»
- MAT-helional · web: «Perfumiarz: fresh, ozonic, floral, melon, marine»
- MAT-heliotropina · web: «Perfumiarz: sweet, powdery, soft, nutty, with balsamic nuances»
- MAT-hidroxicitronelal-cyclosia · web: «Perfumiarz: floral, bright, lily, lily of the valley, with green, citrus, and melon aspects»
- MAT-ionona-beta · web: «Perfumiarz: floral, violet, freesia, sweet, warm, with fruity accents (raspberry)»
- MAT-kephalis · web: «Perfumiarz: woody-tobacco, rich, bright, fresh, with agarwood nuances»
- MAT-laudano-de-jara · web: «Maese Lab: aroma cálido y terroso, con notas ligeramente amaderadas y balsámicas»
- MAT-laudano-de-jara · web: «Reseñas de clientes en Maese Lab: resinoso, herbal seco, ambarado, dulce, sotobosque»
- MAT-lavanda · web: «Olfatorium: Fresco, agrestre, floral, herbal, dulce y ligeramente amaderado.»
- MAT-limon · web: «Olfatorium: cítrico, fresco, intenso, aldehidico, ligeramente picante»
- MAT-litsea-cubeba · web: «Olfatorium: Intenso, fresco, afrutado, cítrico, con toques amaderados y florales.»
- MAT-mandarina · web: «Olfatorium: suave, dulce, cítrico, cálido, con notas verdes, ligeramente ácido»
- MAT-maritima · web: «Perfumiarz: watery, cold, metallic, nuances of wet fur scent»
- MAT-metil-ionona-gamma · web: «Maese Lab: Polvo seco, raíz de orris, violeta atalcada, tierra yerma»
- MAT-miel-esencia-aromatica · web: «Maese Lab: Aroma cálido, suave y reconfortante.»
- MAT-miel-esencia-aromatica · web: «Maese Lab: Dulce, untuosa y persistente, que reproduce el néctar de abejas.»
- MAT-musgo-de-roble-absoluto · web: «Perfumiarz: mossy, forest, damp, earthy, with nuances of algae and mushrooms»
- MAT-olibano-boswellia-sacra-aceite-esencial · web: «Maese Lab: resinoso, terroso y cálido, con toques dulces y balsámicos»
- MAT-paradisamide · web: «Perfumiarz: tropical fruits, guava, grapefruit, rhubarb, currant»
- MAT-pimienta-negra-absoluto · web: «Perfumiarz (vía buscador): darker and more matte than the essential oil, it keeps the fresh pepperiness while moving toward leathery-smoky notes»
- MAT-pimienta-negra-absoluto · web: «Perfumiarz: spicy-woody, matte, dry, lightly smoky, with leathery nuances»
- MAT-prismantol · web: «Perfumiarz: spicy-woody, fresh, effervescent, ginger, cardamom, fir»
- MAT-resinoide-benjui · web: «Perfumiarz (vía buscador): sweet, spicy, vanilla, resinous base note; the sweetest and softest of resins»
- MAT-safraleine · web: «Maese Lab: Posee un potente olor a cuero, es especiado, amaderado, picante y cálido....»
- MAT-vainillina · web: «Maese Lab: Aroma a vainilla cremosa dulce de repostería»

### Relaciones (75)

- MAT-2-hidroxibenzaldehido · combines acordes gourmand: «Perfumiarz: recomendado para acordes gourmand singulares»
- MAT-2-hidroxibenzaldehido · substitute Benzaldehído: «Perfumiarz: olor de tipo almendra, pero más oscuro, más tostado y menos dulce que el benzaldehído»
- MAT-3-4-xilenol · combines acordes de madera: «Perfumiarz: especialmente útil en ellos»
- MAT-3-4-xilenol · combines cuero: «Perfumiarz: especialmente útil en ellos»
- MAT-3-4-xilenol · combines oud: «Perfumiarz: «a must» para construir un acorde de oud desde cero»
- MAT-3-4-xilenol · combines ámbar: «Perfumiarz: especialmente útil en ellos»
- MAT-acetato-de-geranilo · combines Almizcles ligeros: «Perfumiarz»
- MAT-acetato-de-geranilo · combines Bergamota: «Perfumiarz y Scentspiracy: en cítricos, con neroli y petitgrain»
- MAT-acetato-de-geranilo · combines Citronelol: «Perfumiarz y Scentspiracy»
- MAT-acetato-de-geranilo · combines Petitgrain: «Perfumiarz»
- MAT-acetato-de-geranilo · combines MAT-acetato-de-linalilo: «Perfumiarz y Scentspiracy»
- MAT-acetato-de-geranilo · combines MAT-geraniol-98: «Perfumiarz y Scentspiracy»
- MAT-acetato-de-terpinilo · substitute MAT-acetato-de-linalilo: «Perfumiarz: parecido pero el de terpinilo es más dulce y contenido; Pell Wall (Arctander): el de terpinilo es menos potente y algo más duradero»
- MAT-aldambre · substitute Habanolide / Sclareno: «Perfumiarz: se parece a ellos, con nota de hierro caliente; menos herbal y más amaderado que el sclareno, con un tono ligeramente industrial»
- MAT-ambermor · combines amaderadas: «Maese Lab: se integra armoniosamente»
- MAT-ambermor · combines especiadas: «Maese Lab: se integra armoniosamente»
- MAT-ambermor · combines notas florales: «Maese Lab: se integra armoniosamente»
- MAT-ambrettolide · combines Exaltolide: «Perfumiarz: «It blends excellently with Exaltolide and Ethylene Brassylate»»
- MAT-ambrettolide · combines MAT-ethylene-brassylate: «Perfumiarz: mezcla excelente»
- MAT-balsamo-de-tolu-resinoide · substitute Benjuí de Sumatra: «Perfumiarz»
- MAT-balsamo-de-tolu-resinoide · substitute Bálsamo del Perú (Myroxylon pereirae): «Perfumiarz lo cita como el vecino olfativo (el tolú queda entre el benjuí de Sumatra y el bálsamo del Perú); Scentspiracy lo contrasta con el tolú.»
- MAT-cassis-base-345-b · combines chypre: «Perfumiarz»
- MAT-cassis-base-345-b · combines florales: «Perfumiarz»
- MAT-cassis-base-345-b · combines notas afrutadas modernas: «Perfumiarz»
- MAT-cassis-base-345-b · combines rosa: «Perfumiarz»
- MAT-castoreo-sintetico · combines de cuero: «Perfumiarz»
- MAT-castoreo-sintetico · combines notas amaderadas: «Perfumiarz»
- MAT-castoreo-sintetico · substitute Castóreo natural: «Perfumiarz: alternativa sintética muy realista»
- MAT-dartanol · combines rosa: «Maese Lab: soporte floral, especialmente en mezclas con rosa»
- MAT-datilat · substitute vainillina-maltol (dulzura): «Perfumiarz lo propone como alternativa a ese tipo de dulzura»
- MAT-dewfruit-tec · combines frangipani: «Perfumiarz»
- MAT-dewfruit-tec · combines peonía: «Perfumiarz»
- MAT-dewfruit-tec · combines rosa: «Perfumiarz»
- MAT-dewfruit-tec · combines violeta: «Perfumiarz»
- MAT-esencia-de-trufa · combines flores blancas: «Maese Lab»
- MAT-esencia-de-trufa · combines hongos: «Maese Lab»
- MAT-esencia-de-trufa · combines musgos: «Maese Lab»
- MAT-esencia-de-trufa · combines pinos o cipreses: «Maese Lab»
- MAT-etil-4-fenol · combines acordes de cuero: «Maese Lab»
- MAT-etil-4-fenol · combines maderas: «Maese Lab: combinaciones con maderas, notas especiadas y acordes de cuero»
- MAT-etil-4-fenol · combines notas especiadas: «Maese Lab»
- MAT-eucaliptol · combines composiciones orientales pesadas: «Perfumiarz: puede avivar su salida»
- MAT-geosmina · combines acordes amaderados: «Perfumiarz»
- MAT-geosmina · combines de pachulí: «Perfumiarz»
- MAT-geraniol-98 · combines acordes de rosa: «ScenTree; reseñas de clientes en Maese Lab»
- MAT-geraniol-98 · combines geranio: «ScenTree; reseñas de clientes en Maese Lab»
- MAT-geraniol-98 · combines notas afrutadas: «ScenTree; reseñas de clientes en Maese Lab»
- MAT-geraniol-98 · combines toque cítrico: «ScenTree; reseñas de clientes en Maese Lab»
- MAT-haba-tonka-tintura · combines sándalo: «reseñas de clientes en Maese Lab»
- MAT-haba-tonka-tintura · combines tabaco: «reseñas de clientes en Maese Lab»
- MAT-haba-tonka-tintura · combines vainilla: «reseñas de clientes en Maese Lab»
- MAT-hidroxicitronelal-cyclosia · combines Acordes de muguet: «Reseña de cliente en Fraterworks; Perfumiarz: acordes de muguet, lirio, peonía, flor de tilo (lime blossom) y narciso»
- MAT-hidroxicitronelal-cyclosia · combines lila: «Reseña de cliente en Fraterworks; Perfumiarz: acordes de muguet, lirio, peonía, flor de tilo (lime blossom) y narciso»
- MAT-hidroxicitronelal-cyclosia · combines tilo: «Reseña de cliente en Fraterworks; Perfumiarz: acordes de muguet, lirio, peonía, flor de tilo (lime blossom) y narciso»
- MAT-kephalis · combines Dupical: «Givaudan y Perfumiarz: 80/20 da nota fresca, especiada, con faceta cardamomo»
- MAT-kephalis · combines acordes ámbar: «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines amaderado-aldehídicos: «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines florales (jazmín: «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines lavanda): «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines masculinos: «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines rosa: «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines tabaco: «Givaudan, Fraterworks y Perfumiarz»
- MAT-kephalis · combines violeta: «Givaudan, Fraterworks y Perfumiarz»
- MAT-maritima · combines Adoxal: «Perfumiarz»
- MAT-maritima · combines Floralozone: «Perfumiarz y Fraterworks»
- MAT-maritima · combines MAT-calone: «Perfumiarz y Fraterworks»
- MAT-pimienta-negra-absoluto · substitute Aceite esencial de pimienta negra: «Perfumiarz: el absoluto es más oscuro, profundo y mate que el aceite»
- MAT-resinoide-benjui · substitute Benjuí de Sumatra: «ScenTree: más especiado y menos avainillado; Perfumiarz (vía buscador) lo describe más dulce, menos canelado, más amaderado y animálico; BMV Fragrances (vía buscador) dice que no son intercambiables»
- MAT-vainillina · combines especiadas: «Maese Lab»
- MAT-vainillina · combines especias: «Maese Lab»
- MAT-vainillina · combines florales: «Maese Lab»
- MAT-vainillina · combines herbales suaves: «Maese Lab»
- MAT-vainillina · combines maderas: «Maese Lab»
- MAT-vainillina · combines notas florales: «Maese Lab»
- MAT-vainillina · combines ámbares: «Maese Lab»

### Perfumes de referencia (0)

- Ninguna.

### Dosis (1)

- MAT-paradisamide · web: «Perfumiarz: can be used in both microdoses and in larger amounts (up to 20% of the composition)»

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
