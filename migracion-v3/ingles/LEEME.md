# Los datos comunes, en inglés (tanda 36)

V3-71 hace del inglés el idioma de la app y de sus datos. El usuario, 2026-10-30, a «¿Preparo la
tanda que pasa al inglés los datos comunes, con los decimales en punto?»: «Sí, todo».

1. `node migracion-v3/ingles/extraer.ts` escribe cada texto distinto de las columnas de prosa de lo
   común (nombres, descripciones, notas, fuentes) en `textos/NN.txt`, por trozos de unos 40.000
   caracteres.
2. Un subagente traduce cada trozo a `traducido/NN.txt`, con las reglas de abajo.
3. `node migracion-v3/tanda-36-ingles.ts` comprueba la traducción (las citas y los números, intactos)
   y escribe las tablas de la tanda, con su informe.

Tu cuenta no se toca: tus nombres, tus notas y tus versiones son tuyos (V3-71).

## El formato

Cada trozo es una lista de bloques. Una línea `@@ <clave> · <tabla.columna, …>` y, debajo, el texto,
hasta el siguiente `@@ `. La traducción repite la línea `@@ <clave>` (sin las columnas) y debajo el
texto en inglés. Si el texto ya está en inglés o no tiene nada que traducir (un nombre propio, un
número, una URL), la línea es `@@ <clave> =` y no lleva texto. Todas las claves, en el mismo orden.

## Las reglas

1. **Las citas no se tocan.** Lo que va entre «…», "…" o “…” es una frase de un documento: se copia
   tal cual, comillas incluidas, en el idioma en que esté. Fuera de las comillas, todo en inglés.
2. **Ni se añade ni se quita información.** Ni resumir, ni explicar, ni corregir. La misma
   estructura y los mismos separadores (`·`, `;`, `:`, saltos de línea).
3. **Se quedan como están:** marcas, casas y tiendas (Fraterworks, TGSC, dsm-firmenich, Maese Lab,
   ScenTree, PerfumersWorld…), URL, rutas de archivo, commits, códigos de producto, CAS, nombres INCI,
   nombres latinos de especie, nombres químicos que ya están en inglés o en IUPAC, y los códigos de
   fuente (`lab:`, `web:`, `TG`, `repo`, `FIG`).
4. **Los decimales, con punto** (`0,5 %` → `0.5 %`), y los miles con coma (`1.000` → `1,000`). Los
   localizadores químicos no son decimales: `1,8-cineol` → `1,8-cineole`, `3,7-dimetil` → `3,7-dimethyl`.
5. **El vocabulario de perfumería en inglés:** nombres químicos al inglés (acetato de linalilo →
   linalyl acetate, cumarina → coumarin), descriptores al término de uso (amaderado → woody, afrutado
   → fruity, almizclado → musky, ambarado → ambery, especiado → spicy, polvoso → powdery, terroso →
   earthy, ahumado → smoky, cítrico → citrus, verde → green, cuero → leather, chipre → chypre,
   fougère → fougère), países y lugares en inglés (Omán → Oman, España → Spain).
6. **Ortografía británica** (colour, odour, flavour), como la interfaz.
7. **Las palabras de las fuentes, siempre igual:**

| Español | Inglés |
|---|---|
| aceite esencial | essential oil |
| absoluto | absolute |
| resinoide | resinoid |
| tintura | tincture |
| concreto | concrete |
| destilación (por arrastre) de vapor | steam distillation |
| hidrodestilación | hydrodistillation |
| expresión en frío | cold expression |
| extracción con disolvente | solvent extraction |
| rectificado | rectified |
| nota de salida / de corazón / de fondo | top / heart / base note |
| en tira | on a smelling strip |
| material puro | neat material |
| buscador (resumen del buscador) | search engine (search-engine summary) |
| fragmento | snippet |
| ficha | sheet (ficha de seguridad: safety data sheet) |
| tanda N | batch N |
| propuesta de la sesión | session proposal |
| el usuario | the user |
| confianza: alta / media / baja | confidence: high / medium / low |
| no lo dice / no consta | not stated |
| (est) / (est.) | (est) / (est.) |
| a 25 °C | at 25 °C |

8. **Los nombres de material** (`materials.name`, `material_categories.name`) van con el nombre que
   usaría un proveedor en inglés, con la primera letra en mayúscula: «Acetato de linalilo» →
   «Linalyl acetate», «Ajenjo, aceite esencial» → «Wormwood, essential oil». Las marcas
   (Iso E Super, Hedione) no cambian. El nombre en español pasa solo a los otros nombres del
   material, para que el buscador lo siga encontrando: eso lo hace el script, no el traductor.
