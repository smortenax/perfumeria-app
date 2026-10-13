# Tanda 2 · La composición

*Generada por `migracion-v3/tanda-2-composicion.ts`. Datos de la v2 y del anexo de IFRA del commit `d4c1e55`. `validar:v2`: sin errores. Todas las cifras de la v2 salen de documentos revisados (D6).*

**Qué entra** (`material_components.csv`, 3145 filas, de 3140 cifras de la v2): por autoridad, consensus 15, ifra 1670, literature 1398, product 62.

**Cómo se eligen las filas, como la v2:** por cada material o producto, sus fuentes de más a menos autoridad; la primera que da un componente lo decide, y una fuente que cubre todas las sustancias reguladas cierra el paso a las de menos autoridad. Un producto lleva primero lo de su certificado y luego lo de su material (V3-2).

**Lo que cambia respecto a la v2, por decisión:**

- **Su propia entrada del anexo (V3-23)**, en lugar del máximo de las de su CAS (9):
  - M01182 Clove bud absolute
  - M03493 Labdanum gum
  - M03495 Labdanum resinoid
  - M03506 Lavandin grosso absolute
  - M03642 Orange blossoms absolute
  - M03645 Orange flower oil, bitter (Neroli and Neroli bigarade)
  - M03648 Orange flower, bitter, CO2 extract
  - M03649 Orange flower, bitter, concrete
  - M03754 Rose concrete
- **Las prestadas, como literatura (V3-28):** 219 materiales y productos llevan cifras del anexo tomadas de otras formas con su CAS; su fuente dice de cuáles. Dan como mucho «acotado».
- **El 5-MOP del 089 (V3-27)**, de cantidad desconocida:
  - M00042 Bergamot oil, furocoumarin free
  - P00042 Bergamota sin bergaptenos
- **«Sin identificar» donde ninguna fuente cubre la lista entera** (§3.5):
  - M00010 alpha-Amylcinnamaldehyde: D00012 (solo-alergenos)
  - M00023 2,3,3-Trimethylindanone: D00013 (solo-alergenos)
  - M00041 Tobacco absolute: D00005 (parcial)
  - M00042 Bergamot oil, furocoumarin free: D00006 (parcial)
  - M00050 Benzoin resinoid: D00009 (parcial)
  - P00010 Aldehído alfa-amil cinámico: D00012 (solo-alergenos)
  - P00023 Safraleine: D00013 (solo-alergenos)
  - P00041 Absoluto de Tabaco: D00005 (parcial)
  - P00042 Bergamota sin bergaptenos: D00006 (parcial)
  - P00050 Resinoide de benjuí: D00009 (parcial)
  - P00088 Benzoin Siam Resinoid (IFF): D00009 (parcial)
- **«Sin identificar» en los aislados naturales sin documentos (V3-29):**
  - M00001 Geraniol
  - M00014 Coumarin
  - M00019 Eugenol
  - M00073 Eucalyptol
- **Los ceros del anexo se quedan** (10 filas): una cifra exacta puede valer 0 («no lo lleva»; propuesta de la sesión, commit d700e55).

**Cómo se traduce:** `tipico` → `exact`, `maximo` → `max` (la v2 no tiene rangos); el porcentaje, a fracción exacta; `anexo-ifra` → `ifra`, `producto` → `product`, `literatura` → `literature`. La fuente de cada fila: su documento con su título y la nota de la v2 (la entrada del anexo).

**Para revisar** (0):

- Nada.
