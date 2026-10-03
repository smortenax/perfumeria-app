# Errores de la v1 encontrados

La v1 está congelada (etiqueta `glosario-v1`): estos errores no se corrigen en ella. Se apuntan
aquí para que la Fase 6 busque otros del mismo tipo. Una línea por error: id, qué tiene y de dónde
viene.

- `fig:84` (Pyroprunat): tiene 13 constituyentes «de proveedor», entre ellos benzoato de bencilo
  34,16 % y cinamato de bencilo 17,03 %, que son de la lista de alérgenos del bálsamo de Perú
  (Perfumiarz, W16295_ALG_09-23), no de esta molécula. Viene del lote C-003.
- `fig:2220` (linalol): tiene metileugenol 0,4972 %, safrol, β-damascona, citral, geraniol y
  limoneno, del certificado de conformidad de PerfumersWorld de aceite esencial de hoja de
  champaca (7LN08199). Viene del lote C-004. Se vio en la comparación de la fase 2.
- `fig:1906` (geraniol): tiene citral 0,09 %, citronelol 0,5 % y linalol de una lista de
  alérgenos de Perfumiarz (H07112_ALG_03-24) de otro producto, colgados de la molécula general.
  Viene del lote C-003.
- `fig:2179` (Lavender): una fila sin forma que mezcla las tres variantes del anexo (aceite,
  absoluto y concreto) y cuenta la peor. Así trae la 7-metoxicumarina del concreto a un aceite.
  Viene de cruzar el anexo por CAS (8000-28-0) y no por nombre.
- `fig:607` (Polysantol): tiene la lista de alérgenos de Firmenich W16070 (Perfumiarz), que es la del
  **fenilhexanol 973080**, no la del Polysantol. Viene del lote C-003. Se vio al reabrir el lote 3b con la D9.
- `fig:487` (Sandalmysore Core / Hindinol): tiene la lista de alérgenos de IFF H19102, que es la del
  **Santaliff Toco**. Viene del lote C-003. Se vio al reabrir el lote 3b con la D9.
- `ncs:olibanum-sacra-oil` (aceite de olíbano de Boswellia sacra): tiene la lista de alérgenos de Firmenich
  W15028 (Perfumiarz), que es la del **resinoide** de olíbano 939912: otra forma, con otra composición.
  Viene del lote C-003. Se vio al preparar el lote 3d.
- `fig:2992` (Tonka bean tincture): tiene la composición del anexo de IFRA para el **absoluto** de haba tonka
  (cumarina 56,77 %, dihidrocumarina 1,85 %), como si la tintura fuera el absoluto puro. Viene de cruzar el
  anexo por CAS sin mirar la forma (P54). Se vio al cerrar la fase 3.
- Familia STD 089 por el nombre (`scripts/generar_glosario.py`, la regex de cítricos): da la condición «aceites
  cítricos: furocumarinas» a 99 filas, entre ellas la naranja dulce y la mandarina, que IFRA no lista en el
  089 (solo ocho aceites, y tres con nivel típico). Se vio en el lote 3c.
- Constituyentes de un certificado recortados: en el lote 3c, el de litsea (PerfumersWorld 7CC00280) trae 9
  restringidas, con el citral al 66,7 %, y la v1 recogió 3; el de mandarina (7CA00285) trae el
  N-metilantranilato de metilo, de un estándar de fototoxicidad (STD 094), y la v1 no lo recogió.
- `fig:2721` (Piperonal): tiene alcohol bencílico 1,80 %, benzoato de bencilo 9,01 %, cumarina 4,32 %, aldehído anísico
  3,60 % y otros, del certificado de PerfumersWorld de «heliotrope base - heliotropin replacement» (6VN21659): una base que
  sustituye a la heliotropina, no la molécula. Viene del lote C-004. Se vio al preparar el lote 4b. (La SDS de Robertet
  de «Benzoin Siam Resin» y el certificado de «BRAN ABS LMR» del Calone solo los enlaza la tienda: la v1 no los usó
  para el benjuí ni para el Calone.)

### Filas de la v1 que la biblioteca usa para un producto de la v2 de otra forma o de otro CAS (D13, 2026-10-03)

- `fig:1165` (Benzoin gum, Siam, 9000-72-0): la biblioteca la usa para «Resinoide de benjuí» (Benzoin resinoid, 9000-72-0). La fila es de otra forma o de otro CAS: goma de benjuí; el producto es un resinoide. La fórmula migra al producto (D13).
- `fig:1287` (Cade oil, rectified, 8013-10-3): la biblioteca la usa para «Aceite de cade (enebro)» (Cade oil, 8013-10-3). La fila es de otra forma o de otro CAS: el cade rectificado de la v1 (tres filas: 1285, 1286 y 1287); el de la v2 es rectificado por una condición supuesta (D11). La fórmula migra al producto (D13).
- `fig:1345` (Castoreum extract, 8023-83-4): la biblioteca la usa para «Absoluto de Castoreum 20%» (Castoreum absolute, 8023-83-4). La fila es de otra forma o de otro CAS: extracto de castóreo; el producto es el absoluto. La fórmula migra al producto (D13).
- `fig:1533` (Coriander seed oil, 8008-52-4): la biblioteca la usa para «Cilantro» (Coriander seed oil, 84775-50-8). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:1529` (Coriander herb oil, 8008-52-4): la biblioteca la usa para «Cilantro» (Coriander seed oil, 84775-50-8). La fila es de otra forma o de otro CAS: aceite de la hierba del cilantro; el producto es el aceite de semilla. La fórmula migra al producto (D13).
- `fig:2557` (Orange peel, sweet oil, 8008-57-9): la biblioteca la usa para «Naranja dulce» (Orange, sweet, Valencia oil, 8008-57-9). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:2600` (Patchouli oil, 8014-09-3): la biblioteca la usa para «Patchouli» (Patchouli oil, sin CAS). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:2839` (Sage oil, Spanish, 8022-56-8): la biblioteca la usa para «Salvia Officinalis» (Sage Dalmatian oil, 8022-56-8). La fila es de otra forma o de otro CAS: salvia española (*S. lavandulifolia*); el producto es la salvia dálmata (*S. officinalis*). La fórmula migra al producto (D13).
- `fig:2913` (Styrax resin, 8046-19-3): la biblioteca la usa para «Resinoide de estírax (estoraque)» (Styrax resinoid, 8046-19-3). La fila es de otra forma o de otro CAS: «resina» de estírax; el producto es un resinoide (otro proceso, otra composición). La fórmula migra al producto (D13).
- `fig:3087` (Vetiver oil, rectified, 8016-96-4): la biblioteca la usa para «Vetiver» (Vetiver oil, 8016-96-4). La fila es de otra forma o de otro CAS: vetiver rectificado; el producto es el aceite sin rectificar. La fórmula migra al producto (D13).
- `fig:2143` (Labdanum absolute, 8016-26-0): la biblioteca la usa para «Láudano de jara» (Cistus absolute, 89997-74-0). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:2150` (Labdanum oil, 8016-26-0): la biblioteca la usa para «Láudano de jara» (Cistus absolute, 89997-74-0). La fila es de otra forma o de otro CAS: aceite de láudano (destilación); el producto es el absoluto de jara. La fórmula migra al producto (D13).
- `fig:2521` (Olibanum oil, 8016-36-2): la biblioteca la usa para «Olíbano» (Olibanum sacra oil, 89957-98-2). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:2990` (Tonka bean extract, 8024-04-2): la biblioteca la usa para «Haba tonka (semillas), tintura comercial» (Tonka bean tincture, 90028-06-1). La fila es de otra forma o de otro CAS: extracto de haba tonka; el producto es la tintura en alcohol. La fórmula migra al producto (D13).
- `fig:183` (16-Hydroxy-7-hexadecenoic acid lactone, 123-69-3): la biblioteca la usa para «Ambrettolide» (Ambrettolide, 63286-42-0). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:2427` (Naphtho[2,1-b]furan, dodecahydro-3a,6,6,9a-tetramethyl-, (3a, 6790-58-5): la biblioteca la usa para «Ambermor IFF» (Naphtho[2,1-b]furan, dodecahydro-3a,6,6,, 3738-00-9). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:946` (7-Octen-2-ol, 2-methyl-6-methylene-, dihydro deriv., 53219-21-9): la biblioteca la usa para «Dihydromyrcenol» (Dihydromyrcenol, 18479-58-8). La fila es de otra forma o de otro CAS: una fila cuyo nombre IUPAC es 7-octen-2-ol, 2-metil-6-metileno (otra molécula); el producto es el dihidromircenol de Olfatorium. La fórmula migra al producto (D13).
- `fig:94` (1-(1,2,3,5,6,7,8,8a-Octahydro-2,3,8,8-tetramethyl-2-naphthyl, 68155-66-8): la biblioteca la usa para «Iso E Super» (1-(1,2,3,4,5,6,7,8-Octahydro-2,3,8,8-tet, 54464-57-2). La fila es de otra forma o de otro CAS: otro CAS que el del material de la v2. La fórmula migra al producto (D13).
- `fig:1069`: la fila de la v1 lleva el CAS 8038-65-1 y el material de la v2 (tintura), 84836-94-2. La identidad la decidió el usuario en el lote 3d (D1: el CAS es atributo); la confirmación de D13 deja migrar las fórmulas.
- `fig:2992`: la fila de la v1 lleva el CAS 8024-04-2 (extracto) y el material de la v2 (tintura), 90028-06-1. La identidad la decidió el usuario en el lote 3d (D1: el CAS es atributo); la confirmación de D13 deja migrar las fórmulas.
- `fig:2599` (Patchouli oil, 8014-09-3): la biblioteca la usa para «Patchouli» (Olfatorium), que en la v2 no tiene CAS. La fila lleva un CAS que el producto no declara. La fórmula migra al producto (D13).
- `fig:2480` (Oakmoss absolute, 9000-50-4): la biblioteca la usa para el musgo de roble de IFF (Perfumiarz), cuyo CAS es 90028-68-5. La fórmula migra al producto (D13).

## Patrones que buscar

- Declaraciones de un proveedor colgadas de la molécula general en vez de su producto, sobre
  todo en los lotes C-003 y C-004.
- Una lista de alérgenos o un certificado cuyo producto no coincide con el material.
- Filas del glosario que el anexo cruza por CAS con varias variantes («cuenta la peor»), o con la composición de otra forma (una tintura con la del absoluto).
- Familias por el nombre (089, 184, 188) con una regex más ancha que la lista del estándar.
- Documentos de otro material: ninguno de los 7 del lote 3c lo era, pero dos de los cuatro que se descartaron en los lotes 3a y 3b sí (arriba). Se mira el nombre del producto en el propio documento, no su nombre de archivo.
