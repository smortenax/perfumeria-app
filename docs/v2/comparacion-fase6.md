# La biblioteca de fórmulas con la v2 de la Fase 6, frente a la de la Fase 5

Generado con `BIBLIOTECA_DIR=… BIBLIOTECA_FASE5=… BIBLIOTECA_ESCRIBIR=fase6 npx vitest run src/bench/biblioteca.tool.test.ts`. Las mismas 16 fórmulas, la copia de la biblioteca tal como estaba al cerrar la Fase 5 (la de hoy tiene una más y una ya migrada), comprobadas con la v2 de hoy y con la v2 de la Fase 5 (commit `b791d5c`, medida con esta misma herramienta). Cambian de veredicto en algún campo **4**; la lectura 1 (¿pasa?) la cambian **1**.

## Los cambios de la lectura 1, por dirección

| Dirección | Fórmulas |
|---|---|
| **Más prudente:** sí → sin comprobar o no | **1** (sí → sin comprobar: 1; sí → no: 0) |
| **Menos prudente:** no o sin comprobar → sí | **0** (no → sí: 0; sin comprobar → sí: 0) |
| Otros: sin comprobar → no | 0 |
| Otros: no → sin comprobar | 0 |
| La lectura 1 no cambia | 15 |

### Los que van a menos prudente, uno por uno

Ninguna fórmula pasa a menos prudente en la lectura 1.


### También van a menos prudente sin cambiar la lectura 1 (más % máximo, menos pendientes o sin comprobar, o ya no se pasa de algo), uno por uno

Ninguna.


## Todas las fórmulas

## church accord olibanum heavy · CAMBIA

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 10 pendientes, 0 sin comprobar.

## NaturalCuir · CAMBIA

- **Fase 5:** ¿pasa? no; hasta 19,75 % (según lo conocido); 4 pendientes, 0 sin comprobar; se pasa: Styrax.
- **Fase 6:** ¿pasa? no; hasta 19,75 % (según lo conocido); 5 pendientes, 0 sin comprobar; se pasa: Styrax.
  - Cade oil: antes fig:1286 (comprobado), ahora v2:M03941 (comprobado); antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Cade oil: IFRA prohíbe el crudo y solo permite el rectificado, y no está acreditado que este material lo sea (STD 119). / Sin datos de sus constituyentes: puede llevar sustancias con techo.

## Sin nombre · CAMBIA

- **Fase 5:** ¿pasa? no; hasta 91,91 % (según lo conocido); 1 pendientes, 0 sin comprobar; se pasa: Citral.
- **Fase 6:** ¿pasa? no; hasta 91,91 % (según lo conocido); 2 pendientes, 0 sin comprobar; se pasa: Citral.
  - 8-Undecenal: antes fig:955 (comprobado), ahora v2:M04257 (comprobado)
  - Irone: antes fig:2046 (comprobado), ahora v2:M04263 (comprobado); ahora pendiente: Methyl ionone, mixed isomers: su especificación no está acreditada (STD 063).
  - Isobutyl salicylate: antes fig:2080 (comprobado), ahora v2:M04264 (comprobado)
  - 6-Isopropyl-2(1H)-octahydronaphthalenone: antes fig:930 (comprobado), ahora v2:M04256 (comprobado)
  - Neral: antes fig:2432 (comprobado), ahora v2:M04265 (comprobado)
  - Ethyl 2-ethylhexanoate: antes fig:1740 (comprobado), ahora v2:M04262 (comprobado)

## Sin nombre · CAMBIA

- **Fase 5:** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.
  - 8-Undecenal: antes fig:955 (comprobado), ahora v2:M04257 (comprobado)
  - Propionic acid: antes fig:2755 (comprobado), ahora v2:M04266 (comprobado)
  - Irone: antes fig:2046 (comprobado), ahora v2:M04263 (comprobado); ahora pendiente: Methyl ionone, mixed isomers: su especificación no está acreditada (STD 063).
  - 6,10,14-Trimethyl-2-pentadecanone: antes fig:918 (comprobado), ahora v2:M04255 (comprobado)
  - Anisole: antes fig:1094 (comprobado), ahora v2:M04260 (comprobado)
  - Isobutyl salicylate: antes fig:2080 (comprobado), ahora v2:M04264 (comprobado)

## Ac Manzana Verde · igual

- **Fase 5:** ¿pasa? no; hasta 45,68 % (según lo conocido); 3 pendientes, 0 sin comprobar; se pasa: Citral.
- **Fase 6:** ¿pasa? no; hasta 45,68 % (según lo conocido); 3 pendientes, 0 sin comprobar; se pasa: Citral.

## Juancuir rect · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.

## juancuir turbulent · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.

## Sin nombre · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.

## Sin nombre · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 12 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 12 pendientes, 0 sin comprobar.

## Sin nombre · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.

## Sin nombre · igual

- **Fase 5:** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.

## v2 Zara tabacco collection · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 13 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 13 pendientes, 0 sin comprobar.

## Zara tabaco v2 · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 0 sin comprobar.

## Zara tabaco v3 · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 6 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 6 pendientes, 0 sin comprobar.

## Zara tabaco v3 · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 0 sin comprobar.

## ZaraTobacoCollection · igual

- **Fase 5:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 12 pendientes, 0 sin comprobar.
- **Fase 6:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 12 pendientes, 0 sin comprobar.
