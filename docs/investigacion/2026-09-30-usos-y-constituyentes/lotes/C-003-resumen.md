# Lote C-003: resumen (listas de alérgenos de Perfumiarz)

**Fecha:** 2026-10-01. **Recopila, no decide:** la auditoría la hace otro modelo. Todo sale de las
344 listas de alérgenos de `datos/glosario/.cache/proveedores/perfumiarz/documentos/` (las que
`C-002-diagnostico.json` clasifica como `alergenos`), con
[`../scripts/c003_extraer.py`](../scripts/c003_extraer.py), que reutiliza `c002_lib.py`. Hace
falta PyMuPDF (`pip install pymupdf`, o `C003_LIB` apuntando a una carpeta que lo tenga).
El detalle por documento está en [`C-003-diagnostico.json`](C-003-diagnostico.json).

| Archivo | Qué es | Filas |
|---|---|---|
| [`C-003.csv`](C-003.csv) | alérgenos con estándar IFRA de productos **con fila en el glosario** | 460 (293 con cifra, 167 `sin-cifra`), de 246 productos; 83 con cifras |
| [`C-003-sin-glosario.csv`](C-003-sin-glosario.csv) | lo mismo, de productos **sin fila o con forma ambigua** | 641 (629 con cifra, 12 `sin-cifra`), de 94 productos; 82 con cifras |

## 1. Cuántas listas y cuántas legibles

- **344 listas, las 344 legibles** (con texto). Otras tres listas de alérgenos son imagen sin
  texto y **no están entre las 344** porque C-002 las contó como ilegibles: `W16120_ALG_07-25`,
  `W23720_ALG_08-24` y `W26040_ALG_08-25` (necesitan OCR).
- **181 tienen al menos una cifra** (de cualquier alérgeno); **163 no declaran ninguno** o solo
  declaran cifras sin estándar IFRA, y dan filas `sin-cifra`.
- Las 344 están colgadas de alguna página de producto. Una lista puede colgar de varios
  productos: hay una fila por producto.

## 2. Los formatos

Las tablas salen desordenadas con `pdftotext -layout` (el nombre va centrado en celdas altas, los
CAS de un grupo ocupan varias líneas y la columna del % se corre una fila), así que **el texto se
lee con su posición** y cada cifra se empareja con su alérgeno por la fila en la que está. La
columna que se toma es siempre **la del producto tal cual**, y va dicha en `notas`.

| Formato | Listas | Columna tomada (y qué es) |
|---|---|---|
| Firmenich («Presence of EU Fragrance Allergens», «Etiquetage des allergènes», `Lista_alergenow_*`, `W…_ALG`) | 106 | **«Total»** de cuatro columnas (directa, indirecta por naturales, indirecta por síntesis, total): es calculada, % del producto |
| IFF «EU Extended Fragrance allergens» (`H…_ALG`) | 78 | «Total Quantity (% w/w)» |
| Givaudan «Fragrance ingredients restricted…» | 48 | «Maximum % in the substance determined by GCMS analysis»: es el máximo medido en la sustancia |
| Givaudan «Compound Total» | 12 | «Total % in Perfume Compound determined by calculation»: calculado, no medido |
| PCW (`*_COSM2`) | 30 | «%», solo lo presente; ver problemas |
| Ventós («EU Fragrance Allergens») | 21 | «Total content (w/w)» |
| Bedoukian (`V…_ALG`) | 14 | «Quantity Detected»: casi todo es «<20 mg/kg» (límite de cuantificación) |
| Declaración «80+ List» (`I…_ALG`) | 8 | **«% Total»** de tres columnas (% natural, % sintético, % total) |
| Lista extendida en francés/inglés (`81ALL_…`) | 5 | «%» |
| Declaración con «N°Ordre» (`B…`, `F…`, `G…_ALG`) | 5 | «%» |
| IFF «Presence of Potential Fragrance Allergens» | 3 | «Content (% w/w) in IFF product» |
| Tabla «Special Ingredients» | 3 | «Concentration total (%)» |
| Declaraciones sueltas (Moellhausen, Takasago, Oleolio, DSM, ECSA, Synarome, una ficha de gamma-octalactona y cartas de Bedoukian sin tabla) | 11 | cada una, en `notas`; las cartas sin tabla dan una fila o `sin-cifra` |

**Reglas de lectura.**
- **`tipo_valor`:** `típico` si es una cifra, `máximo` si lleva «≤» o «<», `rango` si lleva «>»
  (cota inferior, en `min_pct`). Hay 14 + 5 filas `máximo`.
- **Un «<1 ppm» o «<20 mg/kg» que se repite por toda la tabla es un límite de cuantificación,
  no una cifra:** se omite (y se dice en las filas `sin-cifra`).
- **`ppm` y `mg/kg` se pasan a %** (dividiendo entre 10 000) y se dice en `notas`.
- **«Ningún alérgeno declarado»** es una fila `sin-cifra`, nunca 0 (§1.2). También lo son las
  declaraciones sin cifras («no contiene alérgenos», «no se espera ninguno»), con la frase en
  `notas`: son afirmaciones del proveedor, no mediciones.
- **Las moléculas puras también cuentan**: sus impurezas salen igual. **Se omite el propio
  producto** cuando la lista lo cuenta como alérgeno (34 casos, p. ej. linalol en una lista de
  linalol): no es un constituyente.
- Solo entran **alérgenos con estándar IFRA** (`datos/ifra/51/estandar-cas.csv`). Las listas
  traen además unas 30 sustancias sin estándar (pineno, terpineol, cariofileno, terpinoleno,
  alfa-terpineno, vainillina, alcanfor, acetato de geranilo…): no se escriben.
- **Un grupo con varios CAS** (limoneno, linalol…) sale con el CAS que trae la fila y el
  estándar de ese CAS.

## 3. Materiales con cifras

- **Con fila en el glosario: 83 materiales con al menos una cifra** (293 filas). Los más
  repetidos: limoneno (40), benzaldehído (29), alcohol bencílico (28), linalol (28), eugenol
  (21), geraniol (18), citronelol (16), benzoato de bencilo (14), citral (12), isoeugenol (12).
- **Sin fila o forma ambigua: 82 productos con cifras** (629 filas) y 12 `sin-cifra`. Por
  motivo: 417 filas son productos sin CAS en la tienda (bases y compuestos), **171 tienen una
  forma ambigua** (candidatas en `notas`, igual que en C-002) y 53 tienen un CAS que el
  glosario no tiene.
- **Tres materiales** salen de más de una lista; no se han fusionado: cada fila lleva su `fuente`.
- **Las cifras de Firmenich y las de Givaudan «Compound Total» son calculadas de la fórmula**,
  y las de IFF, Givaudan (GC-MS), PCW, Ventós, etc. son analíticas o del proveedor: se dice en
  `notas`, pero conviene no mezclarlas a la hora de fijar un perfil.

## 4. Comprobación de 10 filas al azar (semilla 11), contra la imagen del PDF

Cada fila se comprobó recortando la página del PDF alrededor de la fila y mirándola:
cifra y columna.

| # | Lista | Material | Alérgeno | Cifra | Resultado |
|---|---|---|---|---|---|
| 0 | H12032_ALG_01-24 (IFF) | Mastic absolute | Carvona | 0,015 | correcta |
| 1 | W20160_ALG_05-22 (Firmenich) | Buchu oil | Benzoato de bencilo | 0,0001 % | correcta (total; directa y naturales «-») |
| 2 | Lista_alergenow_Frangipani_Bold_Base | Frangipani bold base | Cumarina | 0,600 % | correcta |
| 3 | W20160_ALG_05-22 (Firmenich) | tubereuse-184108 | Benzoato de bencilo | 0,0001 % | correcta |
| 4 | W14045_ALG_09-23 (Firmenich) | Nutmeg oil SLC | Limoneno | 5,6040 % | correcta (total) |
| 5 | H15055_ALG_11-20 (IFF) | Olibanum oil | Linalol | 0,178 | correcta |
| 6 | H12032_ALG_01-24 (IFF) | Mastic absolute | Benzaldehído | 0,003 | correcta |
| 7 | H22143_ALG_01-24 (IFF) | Vetacetex | Limoneno | 0,020 | correcta |
| 8 | W20042_ALG_01-23 (Firmenich) | Lemon Tetrarome | Linalol | 0,5334 % | correcta (total) |
| 9 | W01070_ALG_06-22 (Firmenich) | Allogal base 38350 B | Salicilato de bencilo | 0,0010 % | correcta (la columna «Total» es la última) |

**10 de 10 bien.** Como la muestra al azar cayó sobre todo en Firmenich e IFF, se comprobaron
además **10 filas de otros formatos**, una por formato: PCW (benzaldehído 0,05 %), «80+ List»
(farnesol 0,0017: columna total), `81ALL` (alcohol bencílico 0,800), `G16700` (linalol 0,22),
Ventós (linalol «< 0,070 %», máximo), Givaudan «Ingredient» (salicilato de bencilo 0,045),
Givaudan «Compound Total» (linalol 15,172), tabla de Oleolio (citral «≤ 0,40») y las dos cartas
de Bedoukian (geraniol «hasta 60 ppm», 2-octinoato de metilo «máximo 0,25 %»).
**Todas correctas**; de ellas se miraron como imagen PDF las de PCW, «80+ List», `81ALL`,
Ventós, Givaudan (dos) y Oleolio, y las dos de texto libre contra el texto. En una primera
pasada la comprobación encontró dos errores que ya están corregidos: el nombre del alérgeno se
leía con las cifras de la fila pegadas (Firmenich, una cifra iba al grupo de otro) y un «>90 %»
salía como cifra típica.

## 5. Problemas y límites

1. **El emparejamiento es por posición, no por orden.** Se empareja por el CAS que hay en la
   fila de la cifra (737 cifras), por el nombre en la fila (790; en Firmenich el CAS va en la
   línea de debajo) y, en una sola, por el CAS más cercano. Nada se empareja «por orden de
   columna» como en C-002.
2. **PCW lista también sustancias fuera de la sección de alérgenos** (C.M.R., solventes). Se
   recogen las que tienen estándar IFRA: estragol (2 filas: **trans-anetol 0,19 %** y aceite de
   ajenjo 0,3 %; la primera encaja con la pista de X-001, que el límite del anetol natural
   viene del estragol) y tolueno (3 filas, IFRA STD 182, como impureza). `notas` lo dice.
3. **Una cifra de isómeros sale en filas aparte**: en PCW «isoeugenol» y «trans-isoeugenol» son
   dos líneas y dan dos filas del mismo constituyente con cifras distintas (un caso, con la nota).
4. **Las listas `I…` (80+ List) ponen «several» en vez del CAS** en los grupos de naturales
   (limoneno, pineno, alcanfor…): se emparejan por el nombre (33 cifras). Bien para los INCI
   exactos; conviene comprobar una muestra.
5. **Las listas sin tabla** (carta de Bedoukian de APRITONE, la de Methyl Octine Carbonate, DSM
   Ethyl linalool) dan cifras sacadas del texto, con la frase de origen; la de Methyl Octine
   Carbonate es un **límite de especificación** del proveedor (2-octinoato de metilo, máximo
   0,25 %), no una medida.
6. **Cobertura:** los 344 PDF tienen producto enlazado y texto; ninguno quedó sin leer.
7. **Las 3 listas en imagen** (arriba) siguen sin leer.
8. **No se ha cruzado con las SDS (C-002):** cuando un natural tiene las dos fuentes, las cifras
   de C-003 (por producto) son más finas que las bandas de C-002. Que no se contradigan es
   trabajo de la auditoría.
