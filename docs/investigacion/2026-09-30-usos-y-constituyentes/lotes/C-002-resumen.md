# Lote C-002: resumen (documentos de Perfumiarz, SDS y certificados IFRA)

**Fecha:** 2026-09-30. **Recopila, no decide:** la auditoría la hace otro modelo. Todo sale de
los 1220 PDF de `datos/glosario/.cache/proveedores/perfumiarz/documentos/`, con los scripts de
[`../scripts/`](../scripts/) (`c002_extraer_texto.py` saca el texto con `pdftotext`;
`c002_extraer.py` genera los CSV; `c002_estadisticas.py` da las cuentas de aquí). El detalle
por archivo (ilegibles, no alineables, formatos sin leer) está en
[`C-002-diagnostico.json`](C-002-diagnostico.json).

| Archivo | Qué es | Filas |
|---|---|---|
| [`C-002.csv`](C-002.csv) | constituyentes con estándar IFRA de naturales y mezclas que **sí tienen fila en el glosario** | 32, de 17 materiales |
| [`C-002-sin-glosario.csv`](C-002-sin-glosario.csv) | lo mismo, de productos **sin fila en el glosario** (aparte para que no se importe por error) | 140, de 52 productos |
| [`X-001.csv`](X-001.csv) | categoría 4 de cada certificado IFRA leído, contra el `estado` del glosario | 188 |

## 1. Cuántos PDF y de qué tipo

Clasificados **por el contenido** (los nombres de archivo mienten: hay SDS llamadas «IFRA» y
listas de alérgenos con nombres de SDS).

| Tipo | PDF |
|---|---|
| SDS (ficha de seguridad) | 482 |
| Certificado IFRA | 381 |
| Declaración de alérgenos | 344 |
| Otros (2 COA, 3 fichas sin cabecera reconocible) | 5 |
| **Imagen sin texto (ilegibles)** | **8** |
| **Total** | **1220** |

- **Legibles (con texto): 1212.** Los 8 ilegibles, que necesitarían OCR: `W15080_IFRA_07-25`,
  `W16120_IFRA_07-25`, `W16120_ALG_07-25`, `W23720_IFRA_08-24`, `W23720_ALG_08-24`,
  `W26040_IFRA_08-25`, `W26040_ALG_08-25` y `e_Robertet_FDS_UK_CYPRIOL_COEUR_HE_f0ff`.
- **Fichas técnicas:** no hay ninguna entre los 1220; los tres tipos que trae la tienda son SDS,
  certificados IFRA y listas de alérgenos. **Las 344 listas de alérgenos no se han leído**
  (no eran parte del encargo) y son probablemente la mejor fuente de constituyentes: hay que
  considerarlas para un lote C-003.
- Un PDF puede colgar de varios productos de la tienda; las cuentas de SDS de abajo son por
  par documento-producto.

## 2. C-002: constituyentes de las SDS

- **482 SDS.** Por par documento-producto: **321 son de moléculas puras** (el glosario las da
  como `molécula`): **se saltan** porque la sección 3 solo repite la propia molécula. **157 son
  de naturales o mezclas**; 4 SDS no tienen sección 3 localizable.
- De las 157: **95 se han podido alinear** (CAS con su %) y **62 no** (ver problemas).
  De las 95, **69 traen al menos una sustancia con estándar IFRA** (26, ninguna).
- **Naturales con constituyentes regulados: 17 con fila en el glosario** (las 32 filas de
  `C-002.csv`: sándalo, vetiver, bálsamo del Perú, osmanto, absoluto de violeta, absoluto de
  mate, resinoide de estoraque, extracto de sésamo, pimienta negra absoluta, vainilla de Tahití
  CO2, entre otros) **y 52 productos sin fila** (`C-002-sin-glosario.csv`): 29 son bases o
  compuestos sin CAS en la tienda, **15 son naturales cuya forma no se pudo fijar** (el CAS lo
  comparten varias filas del glosario: basil, ginger, lavanda de Bulgaria, menta, nuez moscada,
  olíbano, naranja prensada…; las candidatas van en `notas`) y 8 tienen un CAS que el glosario
  no tiene.
- **`tipo_valor`: todas las 172 filas son `rango`.** En las SDS de IFF-LMR, la sección 3 da
  bandas como «1-10» o «0.1-0.25», que son bandas de clasificación y no una medida; se dice en
  `notas`. Ninguna SDS de este lote daba un máximo «≤» ni un número típico. **Un «0-0.1» lleva
  el 0 en `min_pct` como borde de la banda, no como medida** (también dicho en `notas`).
- **Cómo se alinea.** La tabla de sección 3 no guarda el % en la línea del CAS, pero sí el
  orden: por cada página del PDF, el n-ésimo CAS se empareja con el n-ésimo % de la columna,
  **solo si la página tiene tantos CAS como %**, y si la línea del CAS trae su propio %, ese es el
  que tiene que salir. La `cita` de cada fila enseña la línea del CAS y la del %, separadas por
  «||» cuando no coinciden. **Todas las filas de este lote están emparejadas por orden** y llevan
  esa advertencia en `notas`: conviene que la auditoría compruebe una muestra contra el PDF.

## 3. X-001: certificados IFRA (categoría 4 = perfumería fina)

- **381 certificados. Leídos: 188. Sin leer: 193.** Solo se lee la categoría 4 donde el
  número de categoría y su límite salen juntos; en los demás formatos no se adivina.

| Formato | Certificados | Leídos |
|---|---|---|
| Firmenich (tabla «IFRA 51 Level of use») | 94 | 66 (en 28 la tabla sale desalineada: no se lee) |
| Givaudan | 60 | 60 (33 con tabla, 27 «sin límites») |
| IFF, «IFRA 51 Standards Conformity Certificate» | 26 | 26 |
| Takasago y PCW («CLASS 4 …») | 23 | 23 |
| Symrise/Saddle Brook, categorías combinadas | 36 | 0 (la celda de categoría abarca varias filas) |
| Robertet, Payan Bertrand y Symrise «CLASS 4 - limited to» | 13 | 13 |
| IFF, «IFRA 51 Ingredients» | 46 | 0 (solo lista los restringidos y su %, sin límites por categoría) |
| De la 50.ª enmienda o anteriores | 32 | 0 |
| Solo declaran cumplimiento | 11 | 0 |
| Formato no leído (Bedoukian, KAO, distribuidores…) | 40 | 0 |

- **Marcas:** `coincide` 96, **`discrepancia` 37**, `hueco` 3, `sin-glosario` 52 (producto sin fila
  o con forma ambigua; el certificado se anota igual).
- **Las 37 discrepancias son casi todas «el certificado limita en categoría 4 y el glosario dice
  `sin-estandar`»** (34) más 1 al revés (glosario `con-techo`, certificado «no restringido»).
  **29 de las 37 llevan una `nota`: el propio certificado dice que no lleva sustancias
  restringidas por IFRA o que el límite es una evaluación interna del proveedor (Givaudan,
  IFF). Esos límites no son estándares IFRA**: no son un hueco del glosario, y por P37 no entran.
  Las **8 sin nota** son las que merecen mirarse.
- **`hueco`:** 3 certificados limitan un material que el glosario da como `sin-dato`:
  Natural Hickory Smoke Flavor (1,4285 %), Mate absolute (7,6923 %) y Sichuan pepper CO2
  extract (42,7777 %).

### Las 10 más llamativas (las 8 sin nota, y las 2 internas más estrictas)
| # | Material | Cat. 4 del certificado | Glosario | Documento |
|---|---|---|---|---|
| 1 | fig:84 Pyroprunat | 0,41 % | sin-estandar | `W16295_IFRA_09-23_44bc…` **el certificado es de otro producto**, «PEROU BAUME RES» |
| 2 | fig:437 Cascalone | 0,5626 % | sin-estandar | `W03021_IFRA_09-23` |
| 3 | fig:1145 Salicynile | 1,2289 % | sin-estandar | `W19016_IFRA_09-23` |
| 4 | tl:1226911-69-8 Mimosal | 1,5249 % | sin-estandar | `W13088_IFRA_09-23` |
| 5 | fig:736 Muscenone | 4,295 % | sin-estandar | `W13110_IFRA_09-23` |
| 6 | fig:3017 trans-Anetol (natural) | 7,368421 % | sin-estandar | `ANETNAT1J_IFRA51` (PCW) |
| 7 | fig:866 PTBC/Patch hexanol | 30 % | sin-estandar | `PATCH1E_-_IFRA51_-_2025-08` (PCW) |
| 8 | fig:607 Polysantol | no restringido | con-techo | `W16070_IFRA_09-23_8d6b…` el certificado se titula «PHENYLHEXANOL 973080» |
| 9 | fig:860 Spirogalbanone | 0,010 % | sin-estandar | Givaudan: «bears no IFRA specification» (límite propio) |
| 10 | fig:869 Dupical | 0,024 % | sin-estandar | Givaudan (límite propio) |

**Esto no entra en la app**: por P37, las cifras IFRA salen solo de los archivos de IFRA.
Sirve para saber dónde mirar.

## 4. Problemas encontrados

1. **Dos certificados parecen de otro producto**: la página de Pyroprunat enlaza el certificado
   «PEROU BAUME RES 971716» y la de Polysantol uno titulado «PHENYLHEXANOL 973080». Sin
   comprobar, no hay que fiarse de esas dos filas (número 1 y 8 de arriba).
2. **Las tablas de los PDF no se dejan leer fiablemente.** 62 pares documento-producto de SDS
   naturales no se alinean (entre ellas varias de Givaudan, Payan Bertrand, Firmenich,
   PCW, IFF y Oleolio: el % no cae en la línea del CAS, o hay distinto número de CAS y de %),
   y **28 certificados Firmenich** salen con las filas desplazadas. Se han dejado sin leer antes
   que adivinar. Las listas de los no alineables y de los certificados sin leer están en
   `C-002-diagnostico.json`.
3. **Las SDS solo dan bandas.** No hay valores medidos: el dato útil para el perfil de un natural
   es de orden de magnitud. Las declaraciones de alérgenos (344 PDF, sin leer) dan cifras.
4. **Muchas SDS listan solo los componentes peligrosos.** Un constituyente con estándar IFRA
   que no sea peligroso (o que esté por debajo del corte) no aparece: que no salga no quiere
   decir que no esté. **Lo que no sale no vale cero** (§1.2).
5. **Formas ambiguas:** 15 naturales no se pudieron atar a una fila del glosario (el CAS lo
   comparten varias formas: aceite, absoluto, rectificado…). No se ha elegido una al azar.
6. **En moléculas puras** la SDS solo repite la molécula: se saltaron 321 pares, como pedía el
   encargo (se cuentan).
7. **Los límites de categoría de los certificados de Givaudan, IFF y Firmenich** incluyen
   evaluaciones propias (RIFM/QRA2) que no son estándares IFRA; si se usan para buscar huecos
   hay que separarlas (columna `nota`).
8. **Firmenich**: los números de categoría y los límites van en columnas que el texto extraído
   desplaza; solo se aceptan las tablas con la escalera completa 1 a 11B (66 de 94). Aun así,
   el valor de la categoría 4 depende de que el número y el límite estén bien emparejados en la
   línea: comprobar una muestra contra el PDF.
9. **Ningún PDF se ha copiado** ni se ha tocado `src/` ni `datos/`.
