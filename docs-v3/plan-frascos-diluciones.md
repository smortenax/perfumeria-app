# Plan: tu material y tus diluciones (V3-79)

## Contexto

V3-78 pone primero los frascos y las diluciones, y V3-79 los decide. Hay dos niveles: tu
**especificación** de un material y sus **diluciones**. Una dilución es información, no se acaba.
Además, una **lista de la compra** discreta, una **ventana «Nueva dilución»** con cuatro maneras de
calcular, y el **registro de diluciones en rejilla**, con la ventana anclada arriba a la derecha. Al
tocar la pastilla de una dilución se abre para ver y corregir sus pesos, apuntar lo pesado o
archivarla (confirmado el 2026-10-26).

Lo que ya existe y se reutiliza (todo en `v3/`):
- `src/dilution/calc.ts`: `plan()` (qué pesar para un total, con origen en otro frasco y varios
  diluyentes), `bottleOf()` (la cifra exacta de lo pesado), `stored()` y `SCALE_UG`.
- `src/dilution/Dilutions.tsx`: `Dilutions`, `BottleList`, `BottleEditor` y `MaterialDilutions`
  (la sección de la ficha). `src/db/dilutions.ts`: guardar, corregir y archivar.
  `lab_dilutions` ya admite frascos sin pesos (`material_mass_ug` nulo).
- `src/glossary/orb/` (`MaterialOrb`, `orbLookOf`, `orbScalesOf`) y la rejilla de Materiales, como
  modelo de tarjeta.
- **Tu especificación es hoy tu versión de un común** (`materials` con `owner_id` y
  `based_on_id`, de `createVersion`). Ya tiene `supplier`, `product`, `product_url`, `purity` y
  `origin`. «Lo tengo» va con `setHaveMany`.
- `src/bench/AddBar.tsx`: el «+» de dilución nueva (V3-73).
- Textos en `src/i18n/en.ts`, en inglés (V3-71).

Ramas: se trabaja en `claude/gracious-bell-day7am`. Cada paso lleva commit y push, y se marca en
`docs-v3/estado.md`.

## Pasos

**1. El cálculo (núcleo, solo TypeScript).** En `calc.ts`, `planFromMaterial(target, materialUg,
diluents, source?)` da el total y lo de cada diluyente a partir de lo pesado de material (al
revés que `plan()`). Más `examples(target, …)` para los pesos en gris de 1 g y 10 g, sobre
`plan()`.
*Hecho cuando* en `calc.test.ts`: al 10 % en DPG, 0,800 g de material → 7,200 g de DPG; un total
de 8 g → 0,800 + 7,200; desde un frasco al 10 % a un 1 %, lo que se toma del frasco y lo que se
añade; con dos diluyentes, «el resto» cuadra al miligramo. Las cifras, exactas.

**2. La ventana «Nueva dilución»** (`src/dilution/NewDilution.tsx`). Lleva: material (tus
especificaciones); desde (puro o tus diluciones de ese material); % objetivo; diluyentes con
«+ diluyente»; pesos de ejemplo en gris; «material pesado» ⇄ «total», donde escribir en uno
rellena el otro y los diluyentes; lo pesado de verdad, opcional, con la cifra exacta en vivo
(`bottleOf`); «Guardar sin pesos» y «Guardar con lo pesado». Guarda con las funciones de
`db/dilutions.ts`. Sustituye al modo «nuevo» de `BottleEditor`. El modo de corregir se queda.
*Hecho cuando* las pruebas de componente cubren los cuatro casos y los dos botones de guardar, y
en el navegador, con la cuenta de prueba A, cada caso deja un frasco correcto en Diluciones.

**3. La pantalla «Diluciones» en rejilla.** Una tarjeta por especificación: el orbe, el nombre y
una pastilla por dilución sin archivar («10 % in DPG», «40 % in DPG + Ethanol»), sin pastilla de
puro. El buscador y «mostrar archivadas» se quedan. La ventana va **anclada arriba a la
derecha** y por defecto es «Nueva dilución». Tocar una pastilla abre esa dilución en el mismo
sitio (corregir pesos, apuntar lo pesado, archivar con «Deshacer»). En el teléfono, la ventana
va encima de la rejilla, como hoy en una sola columna.
*Hecho cuando* tus 50 frascos (tanda 19) se ven agrupados sin perder ninguno (una prueba cuenta
tarjetas y pastillas), y en el navegador a 1280 px y a 375 px no hay desbordes.

**4. La ventana emergente en los demás paneles.** La misma `NewDilution`, como ventana emergente,
desde la ficha del material (`MaterialDilutions`, con el material elegido) y desde el «+» de la
barra de añadir del banco. Al guardar, la barra se queda con la dilución nueva puesta. Al cerrar,
sigues donde estabas.
*Hecho cuando*, en el navegador, desde el banco se crea una dilución y se añade a la fórmula sin
salir del banco. El foco vuelve al «+».

**5. La especificación.** Migración para tu versión: `lot`, `purchased_on`, `origin_region` y
`status` (`in_use`, `running_low`, `depleted`, `archived`; sin «no lo tengo»). En la ficha,
«Hacer otra a partir de esta», que copia tu especificación con sus diluciones vacías. El estado
se ve en la tarjeta (con «Se acaba» discreto) y se puede filtrar. Va en las tablas de hoy, sin
esperar al sistema nuevo de V3-70: los campos pasan tal cual a `mis_materiales` cuando se mude
(propuesta de la sesión).
*Hecho cuando* `npm run test:db` (con Supabase local en Docker) prueba RLS, la copia y los
estados, y en el navegador una copia sin red cambia el estado y lo sube al volver.

**6. La lista de la compra.** Una tabla `shopping_items`: material del glosario, producto o tienda,
nota, fórmula de la que sale y cuándo se resolvió. RLS por usuario, en el canal propio. Se abre
desde el menú de usuario como «Shopping list», en un sitio discreto. Desde ella se exporta
(copiar o descargar .csv) y «I have it now» crea tu especificación con lo apuntado, marca «lo
tengo» y la saca de la lista. Al usar una receta («Usar la fórmula», V3-59), lo que no tienes se
apunta solo, con la fórmula, y un aviso lo dice con «Deshacer» (propuesta de la sesión: dónde se
dispara).
*Hecho cuando* `test:db` y las pruebas de componente pasan, y en el navegador el ciclo
«falta → lista → ya lo tengo» deja el material en Propios con «lo tengo».

**Al cerrar:** `npm test`, `npm run test:db`, `npm run build`, y `docs-v3/estado.md` al día
(30 líneas como máximo). La PR a `main`, cuando lo pidas.

## Verificación

- `npm ci` en `v3/` (hoy no hay `node_modules`).
- Núcleo y componentes: `npm test`.
- Base de datos: `npm run db:start` y `npm run test:db`. Docker está en el contenedor; si
  Supabase local no arranca aquí, los pasos 5 y 6 se prueban en tu PC y lo digo.
- Navegador: `npm run dev` con la cuenta de prueba A, con Playwright a 1280 px y a 375 px.
  Capturas de la rejilla y de la ventana para que las veas.
