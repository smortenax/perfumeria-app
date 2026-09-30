# Lote C-001: resumen del piloto (constituyentes regulados de los naturales)

**Fecha:** 2026-09-30. **Lote:** [`C-001.csv`](C-001.csv), 43 filas, UTF-8, LF. **Recopila, no decide:**
la auditoría la hace otro modelo. Cada número lleva `url` y `cita`; lo que no tiene cifra
lleva `tipo_valor` = `sin-cifra`.

## 1. Naturales que ya cubre el anexo de IFRA (no trabajados)

Criterio: el glosario los da `por-constituyentes` (o `con-techo`) y sin avisos pendientes
(en `material-constituyentes.csv` solo hay 5 avisos, todos del aceite de casia).

| Material del laboratorio | Fila del glosario | Estado | Filas del anexo |
|---|---|---|---|
| Lavanda, y lavanda de F-002 | fig:2183 Lavender oil | por-constituyentes | 3 |
| Limón, y lime oil de F-002 | fig:2193 Lemon oil; fig:2217 Lime oil, expressed | con-techo | 11; 6 |
| Mandarina | fig:2261 Mandarin oil | por-constituyentes | 1 |
| Naranja dulce | fig:2551 Orange oil, sweet | por-constituyentes | 1 |
| Cilantro | fig:1533 Coriander seed oil | por-constituyentes | 1 |
| Litsea cubeba | fig:2240 Litsea cubeba oil | por-constituyentes | 8 |
| Salvia officinalis | fig:2838 Sage Dalmatian oil | por-constituyentes | 2 |
| Cedro Atlas | fig:1357 Cedarwood oil, Atlas | por-constituyentes | 2 |
| Haba tonka (tintura), y tonka de F-002 | fig:2992 Tonka bean tincture | por-constituyentes | 2 |
| Láudano de jara, y labdanum oil de F-002 | fig:2150 Labdanum oil (y otras 10 formas) | por-constituyentes | 5 |
| Resinoide de benjuí | fig:1168 Benzoin resinoid, Siam | por-constituyentes | 5 |
| Resinoide de estoraque | fig:2914 Styrax resinoid | con-techo | 4 |
| Vetiver, y vetiver de F-002 | fig:3083 Vetiver oil; fig:3087 rectified | por-constituyentes | 2 |

**Ojo: «cubierto» no quiere decir «completo».** El anexo solo trae unas pocas filas por natural
y casi nunca limonene ni linalool (son estándares de especificación): la lavanda, que lleva
linalool en decenas por ciento, solo tiene 3 filas (1-octen-3-il acetato, 2-hexenal, geraniol).
Lo que no figura ahí no vale cero. Si se quiere, este frente puede ampliarse a esos cubiertos
con linalool y limonene, que son los que más pesan.

## 2. Naturales trabajados

| Natural | `material_id` | Fuentes con cifras | Fuentes sin cifra | Resultado |
|---|---|---|---|---|
| Bergamota sin bergaptenos | fig:1200 | 6 (SoapQueen, Madar, Opella, NHR, Freshskin, EO Calc) + TGSC | 0 | limonene, linalool, citral con 3 a 6 fuentes; carvona y geraniol con una |
| Pachulí | fig:2599 | 2 del mismo proveedor (Freshskin) + Ingredi | 3 (Madar, NHR, Avena Lab) | seis alérgenos de una sola fuente; las demás dicen «sin alérgenos» o «<1 ppm» |
| Absoluto de tabaco | fig:2982 y tl:tobacco-absolute-low-nicotine | 1 (TGSC: cumarina) + 1 sin IFRA (Berje) | 3 (ScenTree, Eden, Biolandes) | una sola cifra utilizable, y de TGSC |
| Castóreo | fig:1343, fig:1346 | 0 | 2 (Perfumer's Apprentice, ScenTree) | no encontrado |
| Ámbar gris (tintura) | fig:1069 | 0 | 0 | no encontrado |
| Trufa, Sandalmysore Core, cade | sin trabajar | | | ver problemas |

El pachulí tiene dos filas en el glosario (fig:2599 y fig:2600, mismo CAS): el lote usa la primera,
aplíquese a las dos. En bergamota: limonene 25.39 a 47 (rangos 20 a 50 por bandas CLP), linalool
10 a 17.49, citral 0.2 a 0.7 (TGSC 0.43, Freshskin banda 1 a 5, EO Calc 3); el acuerdo entre
proveedores es bueno en linalool y limonene y flojo en citral.

## 3. Qué fuentes rindieron

- **Declaraciones de alérgenos en PDF (SoapQueen, Madar, Freshskin, Ingredi):** las mejores, con
  nombre, CAS y cifra. Dan niveles «totales añadidos más naturales».
- **SDS (Opella, NHR, Freshskin):** dan cifras o bandas de sección 3; las bandas CLP son anchas.
- **TGSC:** da «Max. Found» de citral, geraniol y cumarina, pero son techos de referencia del
  anexo de IFRA de una enmienda anterior, no análisis (la página lo dice). Útiles para
  contrastar, **no para entrar como IFRA (P37)**.
- **ScenTree:** solo afirma «no contiene alérgenos» y «no restringido en la 51», sin cifras.
- **Sin rendimiento:** Olfatorium, Maese Lab y Perfumiarz (sin alérgenos en línea; Olfatorium
  dice que sus tinturas no llevan documentación), Robertet, Albert Vieille y Biolandes
  (Biolandes solo su absoluto de tabaco bajo en nicotina, sin componentes peligrosos).
  La literatura GC-MS que aparece es de la hoja de tabaco o del ámbar gris en bruto, no de la forma
  del glosario, y no da sustancias con estándar IFRA.

## 4. Problemas encontrados

1. **Lo que hay es poco para los tres materiales animales y el tabaco.** Ninguna fuente
   pública da el % de una sustancia con estándar IFRA en castóreo o ámbar gris. Para el tabaco,
   solo TGSC (cumarina <0.30, techo de referencia). Habrá que pedir las declaraciones a los
   proveedores concretos de las formas que el usuario compra.
2. **Pachulí: dos proveedores contradicen a otro.** Freshskin declara cumarina 0.1 %, eugenol 0.1 %
   y otros; Ingredi solo declara Lilial 0.0219 % y deja lo demás en «<1 ppm»; Madar dice
   «sin alérgenos». La cumarina al 0.1 % en pachulí es inusual. Y el Lilial está prohibido por
   IFRA (STD_015): pide auditoría, y la tabla de Ingredi sale desalineada en el PDF. La auditoría
   debería emparejar esas cifras con el PDF.
3. **Las SDS y declaraciones «sin alérgenos» no son un cero.** Son un «nada declarable» o
   «<1 ppm», y van como `sin-cifra`, nunca como 0 (§1.2).
4. **Extracción de PDF.** Muchos PDF salen desalineados al convertirlos; las cifras de SoapQueen,
   Freshskin e Ingredi se emparejaron por posición en la página. Conviene que la auditoría las
   mire en el original. En Opella, el texto extraído no muestra un signo ≤: la cifra va como
   `típico` y se anota.
5. **Forma equivocada, descartada.** La declaración de NHR de la bergamota «Non FCF» (la con
   furocumarinas) sale con valores imposibles (benzoato de bencilo 7 a 15 %, 2-octinoato de
   metilo 33 a 45 %); queda como fila `sin-cifra` explicando por qué no sirve. Las SDS de Eden y
   Biolandes del tabaco llevan el CAS 73138-76-8 (forma baja en nicotina), por eso van contra
   `tl:tobacco-absolute-low-nicotine` y no contra fig:2982.
6. **EO Calc** da cifras de entrada de una calculadora, pesadas al alza: no es un análisis y
   va marcada así.
7. **Sin fila o fuera de alcance.** **Absoluto de trufa** y **Sandalmysore Core** no tienen fila en el
   glosario (la trufa no figura ni en el FIG ni en la Transparency List bajo ese nombre;
   Sandalmysore es una molécula de Givaudan, no un natural): sin trabajar. **Cade** está en
   `condicion` (STD_119, prohibición con especificación), no es `sin-dato`.
8. **Herramienta.** WebFetch devolvió varios PDF ilegibles; se guardó la copia que la propia
   herramienta deja en su carpeta de resultados, y se extrajo con `pdftotext`/`pypdf` desde ahí.
   No se ha descargado nada a disco por iniciativa propia ni se ha tocado nada fuera de esta
   carpeta.
