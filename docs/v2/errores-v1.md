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

## Patrones que buscar

- Declaraciones de un proveedor colgadas de la molécula general en vez de su producto, sobre
  todo en los lotes C-003 y C-004.
- Una lista de alérgenos o un certificado cuyo producto no coincide con el material.
- Filas del glosario que el anexo cruza por CAS con varias variantes («cuenta la peor»).
