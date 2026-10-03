# La biblioteca de fórmulas, con la v1 y con la v2 (Fase 5)

Generado con `BIBLIOTECA_DIR=… BIBLIOTECA_ESCRIBIR=1 npx vitest run src/bench/biblioteca.tool.test.ts`: 16 fórmulas de la biblioteca del usuario, cada una comprobada con la v1 (como hasta ahora) y con la v2 (migrada al abrirla, D13; lo que la v2 no tiene se queda como «v1, sin revisar»). Cambian de veredicto **14**.

## Los cambios de veredicto, por dirección

| Dirección | Fórmulas |
|---|---|
| **Más prudente:** sí → sin comprobar o no | **1** (sí → sin comprobar: 1; sí → no: 0) |
| **Menos prudente:** no o sin comprobar → sí | **1** (no → sí: 0; sin comprobar → sí: 1) |
| Otros: sin comprobar → no | 0 |
| Otros: no → sin comprobar | 1 |
| La lectura 1 no cambia (cambian otras cifras, o nada) | 13 |

*Qué cuenta cada cifra.* El «cambian 14 de 16» de arriba cuenta una fórmula si cambia **cualquiera** de seis campos: la lectura 1 (¿pasa?), la lectura 2 (hasta qué %), «según lo conocido», el número de pendientes, el de sin comprobar o las sustancias que se pasan. Esta tabla cuenta solo la **lectura 1**: 3 fórmulas la cambian (1 más prudente, 1 menos, 1 de «no» a «sin comprobar»); las otras 11 que cambian lo hacen en pendientes, sin comprobar, el % máximo o las sustancias que se pasan, sin tocar el «¿pasa?». El arreglo del grupo 089 (los citrinos solo-v1 suman por una vía) **no cambió el veredicto de ninguna fórmula**: comparado el informe anterior con este, ninguno de los seis campos cambia por él; la única diferencia (church accord: 10 → 9 pendientes) viene de confirmar el pachulí `fig:2599`. (Esta nota está escrita a mano: si se regenera el informe con la herramienta, hay que volver a ponerla.)

### Los que van a menos prudente, uno por uno

- **Sin nombre** (sin comprobar → sí): la v1 no tenía IFRA de Castoreum Synth 184004 (sin comprobar) y la v2 lo tiene.

Primero las que cambian por un material cuya fila de la v1 era de otra forma (cade, estírax, salvia, cilantro, láudano): ahí es donde la v1 se equivocaba más.

## church accord olibanum heavy · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? no; hasta 31,46 % (según lo conocido); 10 pendientes, 1 sin comprobar; se pasa: Isophorone.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.
- Migración: 25 materiales a la v2, 1 se quedan en la v1 «sin revisar», 0 avisos.
  - Láudano de jara (fig:2143 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvyl acetate, Isophorone, Carvone, Methyl eugenol.
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Cedro Atlas (fig:1357 → v2:P00043): ahora pendiente: Pinacea derivatives: su especificación no está acreditada (STD 184)..
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Vetiver (fig:3083 → v2:P00053): ya no lleva: Longifolene.
  - Olíbano (ncs:olibanum-sacra-oil → v2:P00059): ya no lleva: Benzaldehyde, Benzyl alcohol, Benzyl benzoate.
  - Aceite de cade (enebro) (fig:1287 → v2:P00054, fila de otra forma: cade): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo.; condiciones nuevas: una variante está prohibida (STD 119); la rectificada cumple la especificación (STD 119): supuesta, no acreditada (consenso).
  - Resinoide de benjuí (fig:1165 → v2:P00050): ahora lleva: Benzyl alcohol, Isoeugenol, Benzyl benzoate, 2-Methoxy-4-propylphenol, Propenylguaethol; antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo..
  - Absoluto de Castoreum 20% (fig:1343 → v2:P00004): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Patchouli (fig:2600 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Resinoide de estírax (estoraque) (fig:2913 → v2:P00051, fila de otra forma: estírax): ya no lleva: p-Cresol, Benzyl alcohol, Benzyl benzoate, Benzyl cinnamate, Isoeugenol; antes pendiente, ya no: Benzyl trans-cinnamate: el anexo lo da como regulado, pero no está en el índice de IFRA..
  - Resinoide de estírax (estoraque) (fig:2914 → v2:P00051): ya no lleva: Benzyl alcohol, Benzyl benzoate, Benzyl cinnamate, Benzyl salicylate, Coumarin, Eugenol, Isoeugenol; antes pendiente, ya no: Benzyl trans-cinnamate: el anexo lo da como regulado, pero no está en el índice de IFRA..
  - Eugenol 98% (fig:1834 → v2:P00019): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..

## Juancuir rect · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 1 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.
- Migración: 35 materiales a la v2, 2 se quedan en la v1 «sin revisar», 0 avisos.
  - Resinoide de benjuí (fig:1165 → v2:P00050): ahora lleva: Benzyl alcohol, Isoeugenol, Benzyl benzoate, 2-Methoxy-4-propylphenol, Propenylguaethol; antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo..
  - Aceite de cade (enebro) (fig:1285 → v2:P00054): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo.; condiciones nuevas: una variante está prohibida (STD 119); la rectificada cumple la especificación (STD 119): supuesta, no acreditada (consenso).
  - Absoluto de Castoreum 20% (fig:1343 → v2:P00004): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Cedro Atlas (fig:1357 → v2:P00043): ahora pendiente: Pinacea derivatives: su especificación no está acreditada (STD 184)..
  - Cilantro (fig:1529 → v2:P00044, fila de otra forma: cilantro): ya no lleva: 2-Hexenal.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Salvia Officinalis (fig:2839 → v2:P00052, fila de otra forma: salvia): ya no lleva: Geraniol.
  - Resinoide de estírax (estoraque) (fig:2913 → v2:P00051, fila de otra forma: estírax): ya no lleva: p-Cresol, Benzyl alcohol, Benzyl benzoate, Benzyl cinnamate, Isoeugenol; antes pendiente, ya no: Benzyl trans-cinnamate: el anexo lo da como regulado, pero no está en el índice de IFRA..
  - Vetiver (fig:3083 → v2:P00053): ya no lleva: Longifolene.
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Olíbano (ncs:olibanum-sacra-oil → v2:P00059): ya no lleva: Benzaldehyde, Benzyl alcohol, Benzyl benzoate.
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.

## juancuir turbulent · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 1 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 9 pendientes, 0 sin comprobar.
- Migración: 31 materiales a la v2, 0 se quedan en la v1 «sin revisar», 0 avisos.
  - Cedro Atlas (fig:1357 → v2:P00043): ahora pendiente: Pinacea derivatives: su especificación no está acreditada (STD 184)..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Aceite de cade (enebro) (fig:1285 → v2:P00054): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo.; condiciones nuevas: una variante está prohibida (STD 119); la rectificada cumple la especificación (STD 119): supuesta, no acreditada (consenso).
  - Absoluto de Castoreum 20% (fig:1343 → v2:P00004): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Resinoide de estírax (estoraque) (fig:2914 → v2:P00051): ya no lleva: Benzyl alcohol, Benzyl benzoate, Benzyl cinnamate, Benzyl salicylate, Coumarin, Eugenol, Isoeugenol; antes pendiente, ya no: Benzyl trans-cinnamate: el anexo lo da como regulado, pero no está en el índice de IFRA..
  - Vetiver (fig:3083 → v2:P00053): ya no lleva: Longifolene.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Resinoide de benjuí (fig:1165 → v2:P00050): ahora lleva: Benzyl alcohol, Isoeugenol, Benzyl benzoate, 2-Methoxy-4-propylphenol, Propenylguaethol; antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo..
  - Resinoide de estírax (estoraque) (fig:2913 → v2:P00051, fila de otra forma: estírax): ya no lleva: p-Cresol, Benzyl alcohol, Benzyl benzoate, Benzyl cinnamate, Isoeugenol; antes pendiente, ya no: Benzyl trans-cinnamate: el anexo lo da como regulado, pero no está en el índice de IFRA..
  - Olíbano (ncs:olibanum-sacra-oil → v2:P00059): ya no lleva: Benzaldehyde, Benzyl alcohol, Benzyl benzoate.
  - Salvia Officinalis (fig:2839 → v2:P00052, fila de otra forma: salvia): ya no lleva: Geraniol.
  - Cilantro (fig:1529 → v2:P00044, fila de otra forma: cilantro): ya no lleva: 2-Hexenal.
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..

## NaturalCuir · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? no; hasta 19,75 % (según lo conocido); 7 pendientes, 0 sin comprobar; se pasa: Styrax, p-Cresol.
- **Con la v2:** ¿pasa? no; hasta 19,75 % (según lo conocido); 4 pendientes, 0 sin comprobar; se pasa: Styrax.
- Migración: 10 materiales a la v2, 1 se quedan en la v1 «sin revisar», 0 avisos.
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Resinoide de estírax (estoraque) (fig:2913 → v2:P00051, fila de otra forma: estírax): ya no lleva: p-Cresol, Benzyl alcohol, Benzyl benzoate, Benzyl cinnamate, Isoeugenol; antes pendiente, ya no: Benzyl trans-cinnamate: el anexo lo da como regulado, pero no está en el índice de IFRA..
  - Resinoide de benjuí (fig:1165 → v2:P00050): ahora lleva: Benzyl alcohol, Isoeugenol, Benzyl benzoate, 2-Methoxy-4-propylphenol, Propenylguaethol; antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo..
  - Patchouli (fig:2600 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Absoluto de Castoreum 20% (fig:1343 → v2:P00004): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Vetiver (fig:3083 → v2:P00053): ya no lleva: Longifolene.
  - Olíbano (ncs:olibanum-sacra-oil → v2:P00059): ya no lleva: Benzaldehyde, Benzyl alcohol, Benzyl benzoate.

## Sin nombre · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 3 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 12 pendientes, 0 sin comprobar.
- Migración: 45 materiales a la v2, 9 se quedan en la v1 «sin revisar», 0 avisos.
  - Haba tonka (semillas), tintura comercial (fig:2990 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Allyl Amyl Glycolate (fig:1012 → v2:P00027): ahora pendiente: Allyl esters: su especificación no está acreditada (STD 188)..
  - Salvia Officinalis (fig:2839 → v2:P00052, fila de otra forma: salvia): ya no lleva: Geraniol.
  - Metil ionona gamma (fig:1054 → v2:P00022): ahora pendiente: Methyl ionone, mixed isomers: su especificación no está acreditada (STD 063)..
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Mandarina (fig:2261 → v2:P00047): ya no lleva: Carvone, Citral, Methyl N-formylanthranilate.
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.
  - Olíbano (fig:2521 → v2:P00059): ya no lleva: Benzyl benzoate.
  - Eugenol 98% (fig:1834 → v2:P00019): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Cilantro (fig:1529 → v2:P00044, fila de otra forma: cilantro): ya no lleva: 2-Hexenal.

## v2 Zara tabacco collection · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 4 pendientes, 0 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 13 pendientes, 0 sin comprobar.
- Migración: 46 materiales a la v2, 5 se quedan en la v1 «sin revisar», 0 avisos.
  - Allyl Amyl Glycolate (fig:1012 → v2:P00027): ahora pendiente: Allyl esters: su especificación no está acreditada (STD 188)..
  - Metil ionona gamma (fig:1054 → v2:P00022): ahora pendiente: Methyl ionone, mixed isomers: su especificación no está acreditada (STD 063)..
  - Ámbar gris, tintura comercial (purificado) (fig:1069 → v2:P00055): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Bergamota sin bergaptenos (fig:1200 → v2:P00042): ya no lleva: Carvone; antes pendiente, ya no: Fuera del anexo de IFRA: solo constan las sustancias que declara su proveedor, y puede llevar otras con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo. / Citrus oils and other furocoumarins containing essential oils: el límite es de 5-MOP en el producto y no se sabe cuánto lleva este material (STD 089)..
  - Cilantro (fig:1529 → v2:P00044, fila de otra forma: cilantro): ya no lleva: 2-Hexenal.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Ambrettolide (fig:183 → v2:P00072): ahora lleva: Ambrettolide (tope de IFF).
  - Eugenol 98% (fig:1834 → v2:P00019): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Mandarina (fig:2261 → v2:P00047): ya no lleva: Carvone, Citral, Methyl N-formylanthranilate.
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Salvia Officinalis (fig:2839 → v2:P00052, fila de otra forma: salvia): ya no lleva: Geraniol.
  - Haba tonka (semillas), tintura comercial (fig:2990 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Resinoide de benjuí (fig:1165 → v2:P00050): ahora lleva: Benzyl alcohol, Isoeugenol, Benzyl benzoate, 2-Methoxy-4-propylphenol, Propenylguaethol; antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo..

## Zara tabaco v2 · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 2 pendientes, 1 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 0 sin comprobar.
- Migración: 28 materiales a la v2, 3 se quedan en la v1 «sin revisar», 0 avisos.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Haba tonka (semillas), tintura comercial (fig:2990 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Ámbar gris, tintura comercial (purificado) (fig:1069 → v2:P00055): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Haba tonka (semillas), tintura comercial (fig:2992 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..

## Zara tabaco v3 · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 2 pendientes, 1 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 6 pendientes, 0 sin comprobar.
- Migración: 28 materiales a la v2, 3 se quedan en la v1 «sin revisar», 0 avisos.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Haba tonka (semillas), tintura comercial (fig:2990 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Ámbar gris, tintura comercial (purificado) (fig:1069 → v2:P00055): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Haba tonka (semillas), tintura comercial (fig:2992 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..

## Zara tabaco v3 · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 2 pendientes, 1 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 7 pendientes, 0 sin comprobar.
- Migración: 28 materiales a la v2, 3 se quedan en la v1 «sin revisar», 0 avisos.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Haba tonka (semillas), tintura comercial (fig:2990 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Ámbar gris, tintura comercial (purificado) (fig:1069 → v2:P00055): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Haba tonka (semillas), tintura comercial (fig:2992 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..

## ZaraTobacoCollection · CAMBIA, por una fila de otra forma

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 3 pendientes, 0 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 12 pendientes, 0 sin comprobar.
- Migración: 43 materiales a la v2, 5 se quedan en la v1 «sin revisar», 0 avisos.
  - Cumarina natural (fig:1534 → v2:P00014): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Allyl Amyl Glycolate (fig:1012 → v2:P00027): ahora pendiente: Allyl esters: su especificación no está acreditada (STD 188)..
  - Metil ionona gamma (fig:1054 → v2:P00022): ahora pendiente: Methyl ionone, mixed isomers: su especificación no está acreditada (STD 063)..
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Ámbar gris, tintura comercial (purificado) (fig:1069 → v2:P00055): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Haba tonka (semillas), tintura comercial (fig:2990 → v2:P00057): ya no lleva: Coumarin, Dihydrocoumarin; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Salvia Officinalis (fig:2839 → v2:P00052, fila de otra forma: salvia): ya no lleva: Geraniol.
  - Mandarina (fig:2261 → v2:P00047): ya no lleva: Carvone, Citral, Methyl N-formylanthranilate.
  - Cilantro (fig:1529 → v2:P00044, fila de otra forma: cilantro): ya no lleva: 2-Hexenal.
  - Sandalmysore Core (fig:487 → v2:P00038): ya no lleva: 1-(1,2,3,4,5,6,7,8 Octahydro-2,3,8,8-tetramethyl-2-naphthalenyl) ethanone (OTNE); ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Bergamota sin bergaptenos (fig:1200 → v2:P00042): ya no lleva: Carvone; antes pendiente, ya no: Fuera del anexo de IFRA: solo constan las sustancias que declara su proveedor, y puede llevar otras con techo.; ahora pendiente: Su composición es parcial: puede llevar otras sustancias con techo. / Citrus oils and other furocoumarins containing essential oils: el límite es de 5-MOP en el producto y no se sabe cuánto lleva este material (STD 089)..
  - Ambrettolide (fig:183 → v2:P00072): ahora lleva: Ambrettolide (tope de IFF).
  - Patchouli (fig:2599 → v2:P00049): antes pendiente, ya no: Sin datos de sus constituyentes en el anexo de IFRA: puede llevar sustancias con techo.; ahora pendiente: Sin datos de sus constituyentes: puede llevar sustancias con techo..
  - Eugenol 98% (fig:1834 → v2:P00019): ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..
  - Láudano de jara (fig:2150 → v2:P00058, fila de otra forma: láudano): ya no lleva: Carvone, Methyl eugenol; ahora lleva: Cinnamic alcohol.
  - Polysantol (fig:607 → v2:P00037): ya no lleva: Benzaldehyde.
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.
  - Geraniol 98% (fig:1906 → v2:P00001): ya no lleva: Citral, Citronellol; ahora pendiente: Impurezas sin declarar: es un aislado natural y su producto no tiene documentos..

## Ac Manzana Verde · CAMBIA

- **Hasta ahora (v1):** ¿pasa? no; hasta 45,68 %; 0 pendientes, 0 sin comprobar; se pasa: Citral.
- **Con la v2:** ¿pasa? no; hasta 45,68 % (según lo conocido); 3 pendientes, 0 sin comprobar; se pasa: Citral.
- Migración: 15 materiales a la v2, 1 se quedan en la v1 «sin revisar», 0 avisos.
  - Allyl Amyl Glycolate (fig:1012 → v2:P00027): ahora pendiente: Allyl esters: su especificación no está acreditada (STD 188)..
  - Litsea Cubeba (fig:2240 → v2:P00046): ya no lleva: Carvone.
  - Linalol (fig:2220 → v2:P00002): ya no lleva: Citral, Geraniol, Rose ketones, Methyl eugenol, Safrole, Isosafrole and Dihydrosafrole; ahora pendiente: Linalool: su especificación no está acreditada (STD 187)..
  - Metil ionona gamma (fig:1054 → v2:P00022): ahora pendiente: Methyl ionone, mixed isomers: su especificación no está acreditada (STD 063)..

## Sin nombre · CAMBIA

- **Hasta ahora (v1):** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.
- Migración: 1 materiales a la v2, 2 se quedan en la v1 «sin revisar», 0 avisos.
  - Allyl Amyl Glycolate (fig:1012 → v2:P00027): ahora pendiente: Allyl esters: su especificación no está acreditada (STD 188)..

## Sin nombre · CAMBIA

- **Hasta ahora (v1):** ¿pasa? no; hasta 91,91 %; 0 pendientes, 0 sin comprobar; se pasa: Citral.
- **Con la v2:** ¿pasa? no; hasta 91,91 % (según lo conocido); 1 pendientes, 0 sin comprobar; se pasa: Citral.
- Migración: 1 materiales a la v2, 6 se quedan en la v1 «sin revisar», 0 avisos.
  - Allyl Amyl Glycolate (fig:1012 → v2:P00027): ahora pendiente: Allyl esters: su especificación no está acreditada (STD 188)..

## Sin nombre · CAMBIA

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 0 pendientes, 1 sin comprobar.
- **Con la v2:** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.
- Migración: 2 materiales a la v2, 0 se quedan en la v1 «sin revisar», 0 avisos.
  - Lavanda (fig:2183 → v2:P00003): ya no lleva: Coumarin, alpha-Bisabolol.

## Sin nombre · igual

- **Hasta ahora (v1):** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.
- **Con la v2:** ¿pasa? sin comprobar; hasta 100,00 % (según lo conocido); 1 pendientes, 0 sin comprobar.
- Migración: 1 materiales a la v2, 0 se quedan en la v1 «sin revisar», 0 avisos.

## Sin nombre · igual

- **Hasta ahora (v1):** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.
- **Con la v2:** ¿pasa? sí; hasta 100,00 %; 0 pendientes, 0 sin comprobar.
- Migración: 0 materiales a la v2, 6 se quedan en la v1 «sin revisar», 0 avisos.
