# U-004 parte 1 (órdenes 1 a 50): resumen

Segunda fuente frente a TGSC. Franjas en % del concentrado (trazas = mínimo, estándar = media, techo = máximo). Todas las cifras salen del resumen que devuelve WebSearch: no se leyó ninguna página (0 fetches). Por eso la `url` es la ficha que aparece en el resultado y la atribución de la fuente es inferida cuando se dice.

| Órdenes | Material (CAS) | Franjas propuestas (% concentrado) | Fuentes distintas | Búsquedas / fetches | Avisos |
|---|---|---|---|---|---|
| 1-3, 15 | Mandarina (8008-31-9) | 0.11 / 1.1 / 8.9 | 0 identificadas | 2 / 0 | Resumen confuso y con patrón TGSC: poca confianza. Forma ambigua |
| 4-7, 16 | Petitgrain (8014-17-3) | 0.09 / 0.9 / 7.3 | 1 (PerfumersWorld, inferida) | 2 / 0 | Forma ambigua |
| 8-14, 17 | Ylang ylang (8006-81-3) | 0.08 / 0.8 / 6.7; estándar 0.5-5 | 1 + 1 sin identificar | 2 / 0 | Cifras de Ylang Extra; fracciones sin distinguir |
| 18-21 | Labdanum / cistus (8016-26-0) | 0.05 / 0.8 / 3.0; techo 4 | 2 (PerfumersWorld inferida, Evocative Perfumes) | 2 / 0 | El 4% es de un producto al 50% en DPG |
| 22 | Cananga (68606-83-7) | 0.06 / 0.6 / 5.0 | 1 (inferida) | 1 / 0 | IFRA por categorías solo en notas |
| 23-24 | Cedro de Virginia (8000-27-9) | 0.13 / 1.3 / 10 | 1 (inferida) | 2 / 0 | «Hasta 20%» sin fuente, solo nota |
| 25-27, 48 | Geranio (8000-46-2) | 0.06 / 0.6 / 4.7 | 1 (inferida) | 2 / 0 | 48 (bajo óxido de rosa) sin distinguir |
| 28, 49 | Lavanda (8000-28-0) | 0.1 / 1.0 / 13 | 1 (inferida) | 2 / 0 | |
| 50 | Lavanda terpeneless | sin dato | 0 | 0 (usa la de 28) | Las cifras genéricas no aplican |
| 29-34, 46 | Limón (8008-56-8) | 0.1 / 1.0 / 8.0; en 33 estándar 1.5 | 1 inferida + Fraterworks (solo fila 33) | 2 / 0 | Destilados (32, 46): genéricas dudosas |
| 35-40 | Olíbano (8016-36-2) | 0.1 / 1.0 / 6.2 | 1 (inferida) | 2 / 0 | Forma ambigua |
| 41-43 | Pachulí (8014-09-3) | 0.1 / 1.0 / 8.0 | 1 (inferida) | 2 / 0 | |
| 44 | Pimienta negra (8006-82-4) | 0.07 / 0.7 / 5.3 | 1 (inferida) | 2 / 0 | IFRA solo en notas |
| 45 | Absoluto de rosa (90106-38-0) | sin dato en concentrado | 0 | 2 / 0 | Solo % cosméticos y dérmicos |
| 47 | Vetiver (8016-96-4) | 0.09 / 0.9 / 7.3; estándar 1-10 | 1 + 1 sin identificar | 2 / 0 | |

## Totales

- Búsquedas: 27 (14 con la premisa fija, 13 reformuladas con `blocked_domains` TGSC y perflavory). Fetches: 0.
- Materiales con cifras: 48 de 50. Sin dato en concentrado: 2 (orden 45 y orden 50).
- Contradicciones (>5×): ninguna en las franjas registradas.

## Lo raro

1. Con la exclusión de TGSC en la consulta, el buscador devolvió casi solo TGSC y perflavory.com, que es un espejo de los mismos datos. Hubo que reformular y bloquear ambos dominios.
2. WebSearch devuelve resúmenes, no el texto: las citas son frases del resumen y la atribución a PerfumersWorld de las cifras min/media/max está inferida por aparecer su ficha, no confirmada. Conviene verificar con un fetch antes de fiarse.
3. Las tres cifras 0.xx / media / máx de PerfumersWorld siguen el mismo patrón que las de TGSC («typical usage in perfume compounds»): posiblemente no son independientes.
4. El resumen de mandarina da «media 8.9% y máximo 1.1%» (invertido); se recoge en orden min/media/máx como TGSC, con aviso.
5. Las filas 15, 16 y 17 de la lista (formas de mandarina, petitgrain y ylang) caen dentro del rango 1-50 aunque están fuera de su grupo de CAS contiguo; se cubrieron con la búsqueda de su grupo. Ninguna página pidió acciones.
