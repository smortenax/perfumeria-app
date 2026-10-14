# Fase 7.6 · El IFRA de tu biblioteca, v3 frente a v2

*Generado por `migracion-v3/fase-7/ifra-biblioteca.test.ts`. Cada fórmula, con los datos de la v3 (la tanda 10, leída por `loadFormula`, contra `toIfra` de la v3) y con los de la v2 (el archivo migrado como lo abre la v2, contra su repositorio). Se compara cada estándar: su veredicto en la base del informe y la lectura 2 (uso máximo), y los techos del fabricante. Ninguna diferencia se arregla aquí.*

## Resultado

- **30 fórmulas:** 1 dan lo mismo línea a línea; 29 tienen diferencias.
- **297 líneas distintas**, **0 sin explicar**.

| Motivo | Líneas |
|---|---|
| V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo | 279 |
| V3-48: un provisional nuevo, sin datos de IFRA | 105 |
| cifras de otro proveedor | 23 |
| anexo prestado, literatura | 12 |
| 5-MOP como componente | 5 |

Ninguna diferencia queda sin explicar.

## Lo que cambia en la lectura de cada fórmula

Lo primero que mirar: si una fórmula sale **menos prudente** que en la v2 (de «no» o «unknown» a «yes», o un uso máximo mayor). Un uso máximo «parcial» vale solo para lo que se sabe: algún material no tiene datos de IFRA (un provisional nuevo, V3-48) o la v3 ya no usa las cifras de otro proveedor (V3-34, V3-39), y la app nunca lo da por «dentro» (§1.2).

| Fórmula | v2 | v3 | Dirección |
|---|---|---|---|
| CuirESmarron | no, 6,3754 %, parcial | no, 25,7231 %, parcial | uso máximo mayor, parcial |
| Corazon+salida | no, 18,1395 %, parcial | no, 25,5319 %, parcial | uso máximo mayor, parcial |
| Corazon | no, 8,9186 %, parcial | no, 53,6665 %, parcial | uso máximo mayor, parcial |
| Sillon fondo | unknown, 100 %, parcial | no, 39,49 %, parcial | más prudente (lectura 1) |
| sillon+cuero | no, 94,5595 %, parcial | no, 58,4129 %, parcial | más prudente (uso máximo menor) |
| GERACUIR | no, 46,0819 %, parcial | no, 0,2711 %, parcial | más prudente (uso máximo menor) |
| Sillon fondo | unknown, 100 %, parcial | no, 39,49 %, parcial | más prudente (lectura 1) |
| ZaraTobacoCollection | unknown, 100 %, parcial | unknown, 0,2836 %, parcial | más prudente (uso máximo menor) |
| v2 Zara tabacco collection | unknown, 100 %, parcial | unknown, 1,4093 %, parcial | más prudente (uso máximo menor) |
| olor a pie | no, 41,7667 %, parcial | no, 41,8 %, parcial | uso máximo mayor, parcial |
| salida geranio | no, 3,5324 %, parcial | no, 0,0132 %, parcial | más prudente (uso máximo menor) |
| v2 Zara tabacco collection | unknown, 100 %, parcial | unknown, 1,597 %, parcial | más prudente (uso máximo menor) |

## Fórmula a fórmula

Las lecturas: `yes`/`no`/`unknown` es la lectura 1 (se puede usar tal cual); el uso máximo es la lectura 2.

### Ac Manzana Verde (`Ac Manzana Verde.json`)

no, uso máx. 45,6838 %, parcial → no, uso máx. 45,6838 %, parcial

Línea a línea, igual.

### CuirESmarron (`CuirESmarron.json`)

no, uso máx. 6,3754 %, parcial → no, uso máx. 25,7231 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 271,1547 % | within, uso máx. 405,764 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 680,2152 % | within, uso máx. 770486,8524 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 4846,9654 % | within, uso máx. 37207,8339 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 38391,0891 % | within, uso máx. 457415,5995 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 194,966 % | within, uso máx. 2020,862 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | exceeds, uso máx. 6,3754 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_192 | within, uso máx. 5307936,5079 % | within, uso máx. 12510,4441 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | within, uso máx. 73044,9978 % | within, uso máx. 186,8713 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 1307,7826 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### Corazon+salida (`CuirJuan/Corazon+salida.json`)

no, uso máx. 18,1395 %, parcial → no, uso máx. 25,5319 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 717,1178 % | within, uso máx. 1036,8377 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 119825,8531 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_009 | bounded, uso máx. 2968,3403 % | within, uso máx. 61276,5957 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 1937,0725 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_035 | within, uso máx. 5674,367 % | within, uso máx. 8836,6978 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 109,0524 % | within, uso máx. 109,1522 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 836,0516 % | within, uso máx. 42127,6596 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 613,9535 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_102 | within, uso máx. 437,69 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_154 | exceeds, uso máx. 18,1395 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 784,7012 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 8570,4223 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_243 | within, uso máx. 3720,9302 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### Corazon (`CuirJuan/Corazon.json`)

no, uso máx. 8,9186 %, parcial → no, uso máx. 53,6665 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 381,137 % | within, uso máx. 571,7054 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 59693,2375 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_009 | bounded, uso máx. 1533,7304 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 952,394 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 6860,4651 % | within, uso máx. 57170,5426 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | exceeds, uso máx. 53,6174 % | exceeds, uso máx. 53,6665 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 419,3816 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 301,8605 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | exceeds, uso máx. 8,9186 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_190 | bounded, uso máx. 385,8114 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_191 | bounded, uso máx. 4213,7909 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 1829,4574 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### Fondo sillon (`CuirJuan/Fondo sillon.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_192 | — | within, uso máx. 23924,8826 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | — | within, uso máx. 357,4435 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### Sillon fondo (`CuirJuan/Sillon fondo.json`)

unknown, uso máx. 100 %, parcial → no, uso máx. 39,49 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_192 | — | within, uso máx. 2643,2 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | — | exceeds, uso máx. 39,49 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### V2-cuir (`CuirJuan/V1-fresh cuir.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 4055,3341 % | within, uso máx. 5757,4703 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 303722,4287 % | within, uso máx. 382817,4965 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 9813,0924 % | within, uso máx. 13197,1639 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 11097,1313 % | within, uso máx. 3140759,1201 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_017 | within, uso máx. 120211,052 % | within, uso máx. 45211,322 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_018 | within, uso máx. 309,8684 % | within, uso máx. 309,6868 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 1461,4842 % | within, uso máx. 1485,2968 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 1336,3192 % | within, uso máx. 1338,9293 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 9266,3085 % | within, uso máx. 80944,1443 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 2404,725 % | within, uso máx. 7545,0298 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_102 | within, uso máx. 5368,8888 % | within, uso máx. 45816961,3098 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 104,2865 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 9626,6026 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 105140,7159 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_192 | within, uso máx. 54544001,5593 % | within, uso máx. 8114,9399 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | within, uso máx. 750605,526 % | within, uso máx. 121,2376 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 21392,1073 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### sillon+cuero (`CuirJuan/sillon+cuero.json`)

no, uso máx. 94,5595 %, parcial → no, uso máx. 58,4129 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 3624,7704 % | within, uso máx. 5067,915 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 10030,8237 % | within, uso máx. 1513233,2879 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_017 | within, uso máx. 97769,777 % | within, uso máx. 25726,9928 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_018 | within, uso máx. 13944,6141 % | within, uso máx. 13220,4725 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 719,2507 % | within, uso máx. 725,5643 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 566773,5728 % | within, uso máx. 6427979,8545 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 1702,0145 % | within, uso máx. 3635,2327 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | exceeds, uso máx. 94,5595 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_192 | within, uso máx. 26279569,8925 % | within, uso máx. 3909,8182 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | within, uso máx. 361645,4572 % | exceeds, uso máx. 58,4129 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 19396,8254 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### GERACUIR (`GERACUIR.json`)

no, uso máx. 46,0819 %, parcial → no, uso máx. 0,2711 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 1912,4311 % | within, uso máx. 2823,0124 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 258788,0905 % | within, uso máx. 408894,3402 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 8037,092 % | within, uso máx. 14146,5414 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 4915,5753 % | within, uso máx. 4488242,5534 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_017 | within, uso máx. 121908,0249 % | within, uso máx. 79473,1472 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_018 | within, uso máx. 1175,1171 % | within, uso máx. 1174,2882 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_021 | within, uso máx. 19500,1628 % | within, uso máx. 142567,8571 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 1850,0087 % | within, uso máx. 1939,0644 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 506,6598 % | within, uso máx. 507,63 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 4842,5195 % | within, uso máx. 100095,0005 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_087 | exceeds, uso máx. 72,2879 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_089 | — | unknown, uso máx. 0,2711 % | 5-MOP como componente; V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 1367,0985 % | within, uso máx. 11071,078 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | exceeds, uso máx. 46,0819 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_190 | bounded, uso máx. 4681,3725 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_191 | bounded, uso máx. 51129,4463 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_192 | within, uso máx. 42568413,4652 % | within, uso máx. 6290,9697 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | within, uso máx. 585803,855 % | exceeds, uso máx. 93,9874 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 9452,7008 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### GuiAaa con pirazinas (`GuiAaa con pirazinas.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| fabricante prov:93-92-5 | within, uso máx. 36878,6581 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| fabricante tope:Acetato de estiralilo | within, uso máx. 3663,1765 % | within, uso máx. 3332,1884 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_007 | within, uso máx. 9631,185 % | within, uso máx. 13687,5651 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 628280,5984 % | within, uso máx. 5442132,5671 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 17021,302 % | within, uso máx. 197565,1793 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_011 | within, uso máx. 8788,6869 % | within, uso máx. 831221297,8671 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 12076,3983 % | within, uso máx. 21803,4427 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 9815,6205 % | within, uso máx. 10270,5845 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 1504562,0565 % | within, uso máx. 15500537,9491 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 5072,3518 % | within, uso máx. 1246143,4316 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 7416,959 % | within, uso máx. 54729,4075 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 253,4906 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 4685,3979 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 51173,4111 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_243 | within, uso máx. 51998,0735 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### GuiAaa sin pirazinas (`GuiAaa sin pirazinas.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 5838,1425 % | within, uso máx. 8344,4306 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 451601,3772 % | within, uso máx. 46766917,2932 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 11734,2969 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_016 | within, uso máx. 7186,6647 % | within, uso máx. 12923,0347 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 6124,0373 % | within, uso máx. 6420,7345 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 900400,6803 % | within, uso máx. 9326723,0671 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 3205,2815 % | within, uso máx. 3086616,5414 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 4427,0463 % | within, uso máx. 32248,2325 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 151,6125 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 2951,7742 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 32238,96 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_243 | within, uso máx. 31100 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### GuiAaa (`GuiAaa.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 5838,1425 % | within, uso máx. 8344,4306 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 451601,3772 % | within, uso máx. 46766917,2932 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 11734,2969 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_016 | within, uso máx. 7186,6647 % | within, uso máx. 12923,0347 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 6124,0373 % | within, uso máx. 6420,7345 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 900400,6803 % | within, uso máx. 9326723,0671 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 3205,2815 % | within, uso máx. 3086616,5414 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 4427,0463 % | within, uso máx. 32248,2325 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 151,6125 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 2951,7742 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 32238,96 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_243 | within, uso máx. 31100 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### Juancuir rect (`Juancuir rect.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 1340896,3173 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_009 | bounded, uso máx. 37142,2949 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_021 | within, uso máx. 24537,3675 % | within, uso máx. 25435,5561 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 3527,2269 % | within, uso máx. 3527,4174 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 10156,149 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_087 | within, uso máx. 2223,5742 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 9343,1818 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 102045,2246 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### NaturalCuir (`NaturalCuir.json`)

no, uso máx. 19,751 %, parcial → no, uso máx. 19,751 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 137416,3341 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 3544,1206 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 969,1005 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_190 | bounded, uso máx. 891,5271 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_191 | bounded, uso máx. 9737,1632 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### Sillon fondo (`Sillon fondo.json`)

unknown, uso máx. 100 %, parcial → no, uso máx. 39,49 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_192 | — | within, uso máx. 2643,2 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | — | exceeds, uso máx. 39,49 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### Sin nombre (`Sin nombre.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_063 | within, uso máx. 3626,087 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### V2-cuir (`V2-cuir.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 4055,3341 % | within, uso máx. 5757,4703 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 303722,4287 % | within, uso máx. 382817,4965 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 9813,0924 % | within, uso máx. 13197,1639 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 11097,1313 % | within, uso máx. 3140759,1201 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_017 | within, uso máx. 120211,052 % | within, uso máx. 45211,322 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_018 | within, uso máx. 309,8684 % | within, uso máx. 309,6868 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 1461,4842 % | within, uso máx. 1485,2968 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 1336,3192 % | within, uso máx. 1338,9293 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 9266,3085 % | within, uso máx. 80944,1443 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 2404,725 % | within, uso máx. 7545,0298 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_102 | within, uso máx. 5368,8888 % | within, uso máx. 45816961,3098 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 104,2865 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 9626,6026 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 105140,7159 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_192 | within, uso máx. 54544001,5593 % | within, uso máx. 8114,9399 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_197 | within, uso máx. 750605,526 % | within, uso máx. 121,2376 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 21392,1073 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### Zara tabaco v2 (`Zara tabaco v2.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 59484827930,0235 % | — | cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_011 | within, uso máx. 1171250,4851 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_021 | within, uso máx. 13484,863 % | within, uso máx. 123558,8703 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_022 | within, uso máx. 116801170,387 % | within, uso máx. 1136741606,6225 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_023 | within, uso máx. 271,1315 % | bounded, uso máx. 154,2362 % | anexo prestado, literatura |
| std:IFRA_STD_029 | — | bounded, uso máx. 1536,8961 % | anexo prestado, literatura |
| std:IFRA_STD_036 | within, uso máx. 6508848,2309 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_037 | within, uso máx. 317877,5035 % | within, uso máx. 350672,0352 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_093 | within, uso máx. 759,3656 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_158 | within, uso máx. 3874,3144 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_206 | within, uso máx. 38011,7788 % | within, uso máx. 6329583,946 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 130176,9646 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### Zara tabaco v3 (`Zara tabaco v3 (2).json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_021 | within, uso máx. 15131,5115 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_022 | within, uso máx. 130130998,8338 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_023 | within, uso máx. 271,1062 % | bounded, uso máx. 154,3065 % | anexo prestado, literatura |
| std:IFRA_STD_029 | — | bounded, uso máx. 1538,7111 % | anexo prestado, literatura |
| std:IFRA_STD_036 | within, uso máx. 6506549,9417 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_037 | within, uso máx. 798866,173 % | within, uso máx. 1044417,3303 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_093 | within, uso máx. 759,0975 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_158 | within, uso máx. 3872,9464 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_206 | within, uso máx. 38227,9313 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_243 | within, uso máx. 130130,9988 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### Zara tabaco v3 (`Zara tabaco v3.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 59484827930,0235 % | — | cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_011 | within, uso máx. 1171250,4851 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_021 | within, uso máx. 13484,863 % | within, uso máx. 123558,8703 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_022 | within, uso máx. 116801170,387 % | within, uso máx. 1136741606,6225 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_023 | within, uso máx. 271,1315 % | bounded, uso máx. 154,2362 % | anexo prestado, literatura |
| std:IFRA_STD_029 | — | bounded, uso máx. 1536,8961 % | anexo prestado, literatura |
| std:IFRA_STD_036 | within, uso máx. 6508848,2309 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_037 | within, uso máx. 317877,5035 % | within, uso máx. 350672,0352 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_093 | within, uso máx. 759,3656 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_158 | within, uso máx. 3874,3144 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_206 | within, uso máx. 38011,7788 % | within, uso máx. 6329583,946 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 130176,9646 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### ZaraTobacoCollection (`ZaraTobacoCollection.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 0,2836 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 2842937,7486 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_016 | within, uso máx. 192,5962 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_021 | bounded, uso máx. 178,927 % | within, uso máx. 181,4149 % | cifras de otro proveedor |
| std:IFRA_STD_023 | within, uso máx. 223,2567 % | bounded, uso máx. 136,7739 % | anexo prestado, literatura |
| std:IFRA_STD_029 | — | bounded, uso máx. 1516,886 % | anexo prestado, literatura |
| std:IFRA_STD_035 | within, uso máx. 6519,8853 % | within, uso máx. 6525,2006 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_036 | within, uso máx. 23051250 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_037 | within, uso máx. 1042,4103 % | within, uso máx. 1043,0644 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_039 | within, uso máx. 6310,92 % | within, uso máx. 26295,5 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_069 | within, uso máx. 45132,1586 % | within, uso máx. 49254,8077 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_089 | — | unknown, uso máx. 0,2837 % | 5-MOP como componente; V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_100 | within, uso máx. 4692,3664 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_197 | within, uso máx. 1078421,0526 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### church accord olibanum heavy (`church accord olibanum heavy.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 4443589,0046 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_009 | bounded, uso máx. 212553,1463 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_048 | bounded, uso máx. 58120,3026 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 53467,9588 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 583971,2821 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### v2 Zara tabacco collection (`copias-v1/v2 Zara tabacco collection.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 1,4093 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 1604804,4318 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_009 | bounded, uso máx. 47950,5942 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_016 | within, uso máx. 105,2225 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_021 | bounded, uso máx. 886,5441 % | within, uso máx. 898,8345 % | cifras de otro proveedor |
| std:IFRA_STD_023 | within, uso máx. 161,1191 % | bounded, uso máx. 147,5684 % | anexo prestado, literatura |
| std:IFRA_STD_029 | — | bounded, uso máx. 7537,9795 % | anexo prestado, literatura |
| std:IFRA_STD_035 | within, uso máx. 32399,7724 % | within, uso máx. 32426,1863 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_036 | within, uso máx. 114550367,1386 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_037 | within, uso máx. 5111,2252 % | within, uso máx. 5183,3809 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_039 | within, uso máx. 4384,3183 % | within, uso máx. 130672,2707 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 13111,5587 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_069 | within, uso máx. 133686,1637 % | within, uso máx. 244765,7417 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_089 | — | unknown, uso máx. 1,4099 % | 5-MOP como componente; V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_100 | within, uso máx. 23318,1409 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 12062,0205 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 131740,0871 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_197 | within, uso máx. 5359081,5036 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### guia (`guia.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| fabricante prov:93-92-5 | within, uso máx. 1596,9263 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| fabricante tope:Acetato de estiralilo | — | within, uso máx. 1596,9263 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_007 | within, uso máx. 10168,1664 % | within, uso máx. 12755,5414 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 142240,3021 % | within, uso máx. 252753,7881 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 4701,3165 % | within, uso máx. 8555,0031 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_011 | within, uso máx. 380,5693 % | within, uso máx. 35993694,8298 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 22564,3391 % | within, uso máx. 49097,0372 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 6225,1428 % | within, uso máx. 6340,6292 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 2274940,2605 % | within, uso máx. 19802496,1677 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 2742,7869 % | within, uso máx. 70508,1967 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 12309,6737 % | within, uso máx. 176270,4918 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 391 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 2625,3629 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 28673,9301 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_243 | within, uso máx. 80205,1282 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### idkGaidansing (`idkGaidansing.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 5341,8766 % | within, uso máx. 7391,5747 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 159733,2217 % | within, uso máx. 220686,3057 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 5021,4814 % | within, uso máx. 7530,4372 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 10351,9194 % | within, uso máx. 29173,2639 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 13309,5947 % | within, uso máx. 14810,3914 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 898734,7221 % | within, uso máx. 9977297,0946 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 3856,2815 % | within, uso máx. 59998,8546 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 3903,8314 % | within, uso máx. 16799,3329 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 150,2573 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_190 | bounded, uso máx. 3791,2734 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_191 | bounded, uso máx. 41407,8798 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 30822,0065 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### juancuir turbulent (`juancuir turbulent.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 552662,2091 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_009 | bounded, uso máx. 14739,8348 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_048 | bounded, uso máx. 4030,4445 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 3707,8203 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 40496,414 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### olor a pie (`olor a pie.json`)

no, uso máx. 41,7667 %, parcial → no, uso máx. 41,8 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_023 | exceeds, uso máx. 41,7667 % | exceeds, uso máx. 41,8 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_024 | within, uso máx. 1637166,6667 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_040 | within, uso máx. 26784,466 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_158 | within, uso máx. 261,25 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### protoguidev3 (`protoguidev3.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 100 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_007 | within, uso máx. 7080,0921 % | within, uso máx. 9585,1309 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_008 | bounded, uso máx. 224459,6295 % | within, uso máx. 310353,7198 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor |
| std:IFRA_STD_009 | bounded, uso máx. 7058,15 % | within, uso máx. 10590,1415 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_016 | within, uso máx. 12766,9849 % | within, uso máx. 29402,4578 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_035 | within, uso máx. 7835,2876 % | within, uso máx. 8182,3787 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | within, uso máx. 1252569,8612 % | within, uso máx. 12750660,011 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 5415,3379 % | within, uso máx. 84377,0874 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_100 | within, uso máx. 5490,0035 % | within, uso máx. 23625,0974 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_154 | within, uso máx. 211,3086 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 5323,5221 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 58142,9347 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_221 | within, uso máx. 3107,8671 % | within, uso máx. 319,8144 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_243 | within, uso máx. 43345,3464 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |

### salida geranio (`salida geranio.json`)

no, uso máx. 3,5324 %, parcial → no, uso máx. 0,0132 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 4976190,4762 % | — | cifras de otro proveedor |
| std:IFRA_STD_021 | within, uso máx. 952,8875 % | within, uso máx. 6966,6667 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_037 | exceeds, uso máx. 49,0918 % | exceeds, uso máx. 49,115 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_087 | exceeds, uso máx. 3,5324 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_089 | — | unknown, uso máx. 0,0132 % | 5-MOP como componente; V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |

### v2 Zara tabacco collection (`v2 Zara tabacco collection.json`)

unknown, uso máx. 100 %, parcial → unknown, uso máx. 1,597 %, parcial

| Línea | v2 | v3 | Motivo |
|---|---|---|---|
| std:IFRA_STD_008 | bounded, uso máx. 1818537,3305 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; cifras de otro proveedor; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_009 | bounded, uso máx. 54336,8051 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_016 | within, uso máx. 119,2363 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_021 | bounded, uso máx. 1004,6168 % | within, uso máx. 1018,5441 % | cifras de otro proveedor |
| std:IFRA_STD_023 | within, uso máx. 182,5774 % | bounded, uso máx. 167,222 % | anexo prestado, literatura |
| std:IFRA_STD_029 | — | bounded, uso máx. 8541,9113 % | anexo prestado, literatura |
| std:IFRA_STD_035 | within, uso máx. 36714,8759 % | within, uso máx. 36744,8078 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_036 | within, uso máx. 129806545,1103 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_037 | within, uso máx. 5791,9542 % | within, uso máx. 5873,7199 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_039 | within, uso máx. 4968,2356 % | within, uso máx. 148075,6144 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_048 | bounded, uso máx. 14857,7973 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_069 | within, uso máx. 151490,9072 % | within, uso máx. 277364,4126 % | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo |
| std:IFRA_STD_089 | — | unknown, uso máx. 1,5976 % | 5-MOP como componente; V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_100 | within, uso máx. 26423,7242 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_190 | bounded, uso máx. 13668,4783 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_191 | bounded, uso máx. 149285,646 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
| std:IFRA_STD_197 | within, uso máx. 6072820,8239 % | — | V3-48: el material de tu fórmula es otro (tu respuesta) o un provisional nuevo; V3-48: un provisional nuevo, sin datos de IFRA |
