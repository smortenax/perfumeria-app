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

## Patrones que buscar

- Declaraciones de un proveedor colgadas de la molécula general en vez de su producto, sobre
  todo en los lotes C-003 y C-004.
- Una lista de alérgenos o un certificado cuyo producto no coincide con el material.
- Filas del glosario que el anexo cruza por CAS con varias variantes («cuenta la peor»), o con la composición de otra forma (una tintura con la del absoluto).
- Familias por el nombre (089, 184, 188) con una regex más ancha que la lista del estándar.
- Documentos de otro material: ninguno de los 7 del lote 3c lo era, pero dos de los cuatro que se descartaron en los lotes 3a y 3b sí (arriba). Se mira el nombre del producto en el propio documento, no su nombre de archivo.
