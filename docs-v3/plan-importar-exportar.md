# Plan: importar y exportar (V3-80)

## Contexto

V3-80 cierra las funciones de PerfuMate que faltaban.

- **F19, importar:** una hoja de cálculo cuyas filas quedan en una lista para revisar, con lo que
  la app encuentra en el glosario. Tú confirmas lo que pasa a tus materiales.
- **F23, exportar:**
  - tus materiales, de dos maneras: un PDF del glosario como se ve en la app y una tabla solo
    con los datos;
  - tus fórmulas, legibles.
- **F22, el asistente:** fuera.

El orden: lo más sencillo primero (la tabla de datos) y lo que depende de lo visual al final,
cuando el usuario lo defina.

Lo que ya existe y se reutiliza (todo en `v3/`):
- **Buscar en el glosario:** `src/db/search.ts`, con `indexCatalog`, `search`, `fold` y
  `casForm` (por nombre, otros nombres, abreviatura, todos los CAS, especie e INCI).
- **Tus materiales:**
  - `src/db/materials.ts`, con `createVersion`, `updateMaterial` y `setHave`;
  - tus diluciones, en `catalog.dilutions`, con `chipText` (`src/dilution/Dilutions.tsx`).
- **Tus fórmulas:** `src/bench/use-formula.ts`, con `recipe` (la receta al miligramo), y
  `src/core/io/formula-json.ts`.
- **El CSV:**
  - `src/data/csv.ts` lee CSV con comillas;
  - escribirlo se hace como en `shoppingCsv` (`src/db/shopping.ts`);
  - las descargas, como la paleta (`Glossary.tsx`).
- **Los PDF, sin dependencias nuevas** (propuesta de la sesión): una vista de impresión con
  `@media print` y el «Guardar como PDF» del navegador. Una librería de PDF sería una decisión
  nueva.

Se trabaja en `claude/gracious-bell-day7am`. Cada paso lleva su commit, su push y su marca en
`docs-v3/estado.md`.

## Pasos

**1. La tabla «solo datos» de tus materiales.**
- `src/export/tables.ts`, puro, con dos tablas:
  - `materials.csv`: una fila por material tuyo, con id, nombre, abreviatura, tipo, material
    común en que se basa, CAS, especie, parte, proceso, fabricante, tienda, producto, página,
    lote, fecha de compra, procedencia, región, pureza, estado, «lo tengo», familia y tenacidad
    (horas);
  - `dilutions.csv`: una fila por dilución, con el material, la cifra exacta, cada diluyente
    con su parte, lo pesado, la fecha, el nombre y si está archivada.
- Un hueco es un campo vacío, nunca un 0. Las cifras van con punto decimal y su base en la
  cabecera (`purity_pct`, `fraction_pct`, `tenacity_h`).
- En el glosario (pestaña «Own»), «Export data» descarga los dos `.csv`.

*Hecho cuando* las pruebas con un catálogo pequeño comprueban:
- las cabeceras;
- una fila por material y por dilución;
- las comillas;
- que lo desconocido queda vacío;
- que un material con dos diluciones da dos filas en `dilutions.csv`.

En el navegador, los dos archivos se abren en una hoja de cálculo.

**2. Tus fórmulas, legibles.**
- `src/export/formula.ts`, puro: una fórmula en CSV, con una fila por línea (material, gramos,
  % de la materia aromática, dilución con sus diluyentes y frasco de origen) y una cabecera
  con su nombre, banco, versión y fecha.
- En el menú del banco:
  - «Export as CSV»;
  - «Print or save as PDF»: la composición y, si hay lote final, la receta de «Use the formula»
    como hoja de pesada (V3-55).

*Hecho cuando* la F-001 (`db-tests/f001-bench.test.ts`) exportada da sus mismas cifras en el
CSV, y la hoja de pesada se imprime en una página A4 sin cortes (lo compruebo con capturas de
la vista de impresión).

**3. Importar una hoja: la lista para revisar.**
- `src/import/read.ts`, puro:
  - lee lo pegado (con tabuladores, como sale de Excel o Sheets) o un `.csv`;
  - reconoce las columnas por su cabecera (nombre, CAS, tienda o proveedor, producto,
    dilución, nota, en inglés o en español) y deja cambiarlas a mano si no las adivina.
- `src/import/match.ts`, puro: cada fila contra el glosario.
  - **encontrado**: CAS válido que es de un solo material, o nombre exacto (o uno de sus otros
    nombres);
  - **dudoso**: varios candidatos, o un nombre parecido (con `search`), con los tres mejores;
  - **no está**: ninguno.
  - Lo que ya es tuyo se marca «ya lo tienes».
- La pantalla «Import» (`#importar`, desde la pestaña «Own» del glosario) muestra la lista.
  Cada fila tiene lo leído, lo encontrado y la opción de elegir otro candidato o saltarla.
  «Confirm» hace tuyo cada material elegido (`createVersion` con la tienda y el producto) con
  «lo tengo». Nada entra sin confirmar.
- Lo que no está en el glosario no se da de alta (V3-70). Se puede apuntar en la lista de la
  compra o dejar fuera (propuesta de la sesión).

*Hecho cuando* las pruebas cubren:
- leer pegado y `.csv`;
- reconocer cabeceras;
- los tres resultados, con un CAS de otro material, un nombre con tilde y otro en otro idioma;
- que nada se escribe hasta confirmar.

En el navegador, una hoja de prueba de unas 15 filas termina como tus materiales con «lo
tengo».

**4. El PDF del glosario.**
- Una vista de impresión de tus materiales, como la rejilla de la app: el orbe, el nombre, la
  abreviatura, la familia y la fuerza, el fabricante y la tienda, y las diluciones como
  pastillas.
- Saltos de página sin partir una tarjeta, y en la cabecera la fecha y cuántos son.
- «Print or save as PDF», en la pestaña «Own».
- El aspecto final espera a lo que decida el usuario sobre lo visual. Este paso deja el
  mecanismo y una primera maqueta.

*Hecho cuando* tus materiales de prueba salen en A4 sin cortes, con el orbe en color al
imprimir, comprobado con capturas en modo impresión.

**Al cerrar:**
- `npm test`, `npm run test:db` y `npm run build`;
- `docs-v3/estado.md` y `funciones-perfumate.md` al día;
- la PR a `main`, cuando el usuario la pida.

## Verificación

- Núcleo: `npm test`, con las pruebas de `src/export/` y `src/import/`.
- Navegador: `npm run dev` con la cuenta de prueba A y Playwright:
  - las descargas, leídas de vuelta;
  - las vistas de impresión, con `page.emulateMedia({ media: "print" })` y `page.pdf()` para
    ver el PDF que saldría.
