# Plan: lo que queda de PerfuMate (V3-78)

## Contexto

V3-79 (frascos y diluciones) y V3-80 (importar y exportar) están hechos. Quedan las funciones que
entraron tal cual en V3-78 y, la última, F4. Cada paso es solo funcionamiento: lo visual lo decide
el usuario después. Cada paso lleva su commit, su push y su marca en `docs-v3/estado.md`, en
`claude/gracious-bell-day7am`.

El orden lo propuso la sesión y el usuario lo aprobó (2026-10-27: «el primero esta bien»):
primero lo pequeño y útil al formular, después lo que necesita datos o matices.

## Pasos

1. **F12, la ficha: la fuente de cada cifra** (V3-81). La fuerza y las horas en tira, con su
   fuente en la cabecera; la fuerza gana `strength_source`, rellenada por la tanda 26.
2. **F18, «Usado en»:** en la ficha, las fórmulas que llevan el material (tu especificación cuenta
   como su común), con su banco y un enlace a cada una.
3. **F7, notas libres por fórmula:** `formulas.notes`, editable en la cabecera del banco y visible
   en la tarjeta de Formulación.
4. **F1, la lista de fórmulas:** ordenar (nombre, última modificación), favorito y candado (el
   candado impide añadir pasos) y una vista previa en la tarjeta (materiales, lote, fecha).
5. **F3, la composición por notas** (salida, corazón y fondo, por `tier`), con subtotales. Lo
   que no tiene nota va aparte, nunca repartido.
6. **F2, la barra por familias** en la tarjeta de la fórmula y en la cabecera del banco; lo sin
   familia, en neutro.
7. **F20, IFRA en Inicio** (las fórmulas «fuera» o «parcial») y la etiqueta en cada tarjeta. Lo
   desconocido nunca en verde.
8. **F21, Inicio:** recientes y estantería («lo tengo», «se acaba»). El diario de maceración y la
   libreta se matizan al llegar.
9. **Por matizar al llegar:**
   - F10: el árbol de versiones, en otra rama sin fusionar.
   - F5: el deslizador de evaporación, que necesita los datos de evolución, hoy vacíos.
   - F6: el resumen automático con su confianza.
   - F4, lo último: los orbes, más legibles.

## Verificación de cada paso

- `npx tsc --noEmit`, `npm test`, `npm run build` y, con migración, `npm run test:db`.
- En el navegador con una cuenta de prueba, con capturas a 1280 y 375 px.
- Las migraciones nuevas se aplican en el PC y en la nube con `npx supabase migration up` y
  `npm run sync:restart`; el estado lo dice.
