# Inventario de lo que debería ser un sistema (2026-11-26)

*Hecho por la sesión tras la PR #109. El usuario, 2026-11-26: «hay muchas cosas inconsistentes sin
estandares que serian mejor si fueran instancias con pequeñas variaciones de un diseño». Lo que
sigue es lectura del código (grep y lectura de archivos), no del uso: las cifras son recuentos
en `v3/src/` con fecha de hoy. Cada punto dice qué hay, por qué es un problema y qué pieza común lo
resolvería. El orden es la propuesta de la sesión: primero lo que puede dar un fallo, después lo
que solo es distinto.*

## Ya hecho (PR #109)

- **Buscador de materiales:** había tres motores. Ahora la barra del banco y `ui/MaterialPicker`
  usan `lib/search.ts` sobre los mismos campos (`db/material-search.ts`). El glosario sigue con el
  suyo (`db/search.ts`), que agrupa por categoría, pero lee `normalize`, `fold` y `casForm` del
  mismo sitio.
- **Caja de masa:** `ui/MassInput` con mg ↔ g, en la barra del banco y en las diluciones.

## A. Puede dar un fallo

1. **La fecha de «hoy» sale en UTC.** `new Date().toISOString().slice(0, 10)` en 9 sitios
   (`Dilutions.tsx` ×2, `NewDilution.tsx`, `FactoryState.tsx`, `Glossary.tsx`, `Planner.tsx`,
   `PrintFormula.tsx`, `PrintGlossary.tsx`, `palette-export.ts`). En Madrid, entre las 00:00 y la
   01:00 (las 02:00 en verano), un frasco pesado esa noche queda con la fecha del día anterior.
   **Pieza:** `format/dates.ts` → `today()` en hora local, y nadie más hace `toISOString` para un día.
2. **La lista de diluyentes se calcula seis veces**, casi igual
   (`AddWeigh`, `NewDilution`, `Dilutions`, `ImportDilutions`, `plan-import`, `FactoryState`).
   Si una cambia el criterio (los tuyos primero, sin archivados…), las demás no.
   **Pieza:** `diluentsOf(catalog)` en `db/`, como `pickOptionsOf`.
3. **El importador de diluciones casa con «tus versiones», no con «My library».** `plan-import.ts`
   y `ImportDilutions.tsx` filtran `ownerId !== null`; el buscador de diluciones ya incluye lo
   que marcaste «lo tengo». Un material común que tienes puede salir como «no encontrado» al importar
   y encontrarse a mano. **Pieza:** el mismo `inMyBench`.

## B. Piezas de interfaz que deberían ser una

4. **Cajas de %.** Tres formas: la barra del banco (`.percent-field` con «%» al lado), «Add & weigh»
   (`.weigh-unit` con el «%» pintado por CSS) y los formularios (caja suelta con «%» en la etiqueta).
   **Pieza:** `ui/PercentInput`, hermana de `MassInput` (mismo aspecto, sin botón de unidad).
5. **Elegir diluyente.** Tres formas: `<select>` con siglas en «Add & weigh», chips
   (`DiluentPicker`) en «New dilution» y la ficha del frasco, y el control propio de la barra del
   banco. **Pieza:** un `DiluentPicker` con dos aspectos (chips / desplegable compacto).
6. **Mensajes de error.** Tres formas: `role="alert"` a mano (7), `FailureNote` (en 9 archivos) y
   `className="error"` (13). **Pieza:** `FailureNote` para todos.
7. **Descargar un archivo.** El truco del `<a download>` está escrito 6 veces (`ShoppingList`,
   `Planner`, `Glossary` ×2, `bench/io.ts`, `Bench`). **Pieza:** `lib/download.ts`.
8. **Chips y pastillas.** `className="chip"` y `"pill"` en 13 archivos, con su CSS en cada pantalla;
   `Pills.tsx` existe pero casi nadie lo usa. **Pieza:** `ui/Chip` y `ui/Pills`.
9. **Botones.** 200 `<button>` a mano frente a 26 archivos con el `Button` común. No todos deben
   serlo (los de una lista o un menú), pero los de acción («Save», «Cancel», «Import») sí.

## C. Tokens y CSS

10. **Dos juegos de tokens.** `theme/tokens.css` (`--text-muted`, `--size-text-md`,
    `--surface-raised`) y los del banco en `bench.css` (`--muted`, `--text-md`, `--panel`, `--ink`,
    `--line`…), usados más de 400 veces. Un mismo gris o tamaño tiene dos nombres, y cambiar uno no
    cambia el otro. **Pieza:** que el banco lea los de `tokens.css` (alias primero, luego quitar).
11. **`:root` declarado cinco veces** (`App.css` ×2, `theme/layout.css` ×2, `theme/tokens.css`), y
    las reglas de `input` y `button` repetidas en `App.css` y `bench.css` (ya en la lista R2 de
    `rules.baseline.json`). **Pieza:** un solo `:root` en `tokens.css`; las bases, en `theme/`.
12. **Cuántos decimales lleva un %.** `percent(x, 2)` en 11 sitios, `percent(x, 4)` en 9 y `(x, 1)`
    en 1, sin regla de cuándo cada uno. **Pieza:** dos usos con nombre en `format/numbers.ts`
    («para leer» y «exacto»), como ya hay `labelPercent` para las etiquetas.

## Lo que propone la sesión hacer primero

A1 (fechas), A2 y A3 (diluyentes e importador) y B4 (caja de %): son pequeñas, tocan lo que usas
cada día en diluciones y siguen el patrón de la #109. C10 (tokens) es lo más grande y conviene
hacerlo con el assessment de diseño, porque decide los nombres.
