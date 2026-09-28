> 📥 **Copiado del laboratorio** (`fuentes/investigaciones/2026-09-28-frente-6-duracion-naturales.md`, commit `776e932`) por `scripts/importar_datos.py`. **No se edita aquí**: se corrige en el laboratorio y se vuelve a importar.

---
frente: 6 — La base descriptiva; la duración y la posición de los naturales, con la tabla de Poucher (1955)
fecha: 2026-09-28
herramienta: Claude Code (Opus); tabla leída en las imágenes de la biblioteca de la SCC, cruzada con el FIG, OPERA, TGSC y el piloto de Arctander
confianza: media   # la tabla es de 1955 y se transcribió a mano; la conversión a horas es calibración propia
---

# La duración de los naturales: la tabla de Poucher

**El problema:** OPERA solo calcula la presión de vapor de moléculas con estructura, y la curva
propia de duración (pieza 12) no llega a los naturales. Hasta hoy solo tenían dato los 5 del piloto.

**La solución encontrada:** la tabla original del coeficiente de evaporación de Poucher, que
estaba localizada desde la parte A pero sin leer.

> Poucher, W. A. (1955). A Classification of Odours and its Uses. *Journal of the Society of
> Cosmetic Chemists* 6(2): 80-95. «Duration of Evaporation Table», pp. 90-93. Contenido libre en la
> [biblioteca de la SCC](https://library.scconline.org/v006n02/).

## Resumen

- **La tabla tiene 330 materiales, 149 de ellos naturales.** Se ha transcrito entera desde las
  imágenes del artículo; el OCR de la biblioteca mezcla las dos columnas y no sirve.
- **Coeficiente de 1 a 100 por duración en tira:**
  - 1 para lo que se evapora en menos de un día, 100 para lo más tenaz (pachulí, musgo de roble);
  - el propio Poucher reparte los pisos así: 1-14 salida, 15-60 corazón, 61-100 fondo.
- **Calibrado con las moléculas, ordena la duración como TGSC** (rho = 0,60, n = 120) y mejor que
  la presión de vapor (0,43). No son días literales: es una escala propia, que aquí se convierte a
  horas.
- **Cubre el 46 % de las filas de naturales del FIG:** 399 de 863, que son 185 de 353 CAS.
- **Coincide con el piloto de Arctander:** rosa y jazmín en corazón, unas 180 h; sándalo en fondo.
- **Hallazgo de paso:** 12 CAS de naturales (62 filas: lavanda, jengibre…) estaban clasificados
  como «sin estructura» en la pieza 1, y aquí se corrigen. **Los naturales son 353 CAS, no 341.**

## 1. El método de Poucher

Según el propio artículo, en la lectura del OCR:

- **Material:** lo más puro disponible, natural o sintético.
- **Cómo lo midió:** tiras de 6 pulgadas mojadas en 1 pulgada de material (80-100 mg), olidas cada
  hora al principio. Cuatro muestras al día, por el cansancio olfativo.
- **La escala:**
  - lo que se evaporaba en menos de un día recibió un 1;
  - los materiales de más duración, como el pachulí y el musgo de roble, recibieron el 100;
  - lo demás se repartió de forma progresiva entre ambos.

  El texto se corta en la frase que diría si el coeficiente equivale a días (confianza media).
- **Los pisos,** con sus nombres: salida (*Top Notes*, 1-14), corazón (*Middle Notes*, 15-60) y
  fondo (*Basic Notes or Fixers*, 61-100).
- **Límites que él mismo reconoce:**
  - las calidades de 1955 ya no son las de hoy;
  - no pesó cada tira;
  - los aceites y extractos «no respondieron satisfactoriamente» por su composición compleja.

## 2. La calibración con las moléculas

Se buscó el CAS de 171 de las 175 moléculas de la tabla en PubChem, pasando los nombres de 1955 a
los actuales (*Linalol* → linalool, *Octyl aldehyde* → octanal…).

| Comparación | n | rho |
|---|---|---|
| Poucher frente a las horas de TGSC | 120 | **0,60** |
| Poucher frente a la presión de vapor de OPERA | 148 | 0,43 |
| Poucher frente a las horas estimadas propias (pieza 12) | 148 | 0,43 |

- **Poucher mide persistencia de olor, no solo evaporación.** Los aldehídos C8-C12 le salen de
  fondo (octanal 87, decanal y undecanal 100), aunque son muy volátiles. Lo más probable es que
  oliera sus productos de oxidación, grasos y persistentes. Por eso casa mejor con TGSC, que también
  es de nariz, que con la física.
- **El coeficiente no son días literales:** multiplicado por 24, da unas 6 veces las horas de TGSC.

**Conversión propia a horas.** Es la mediana de las horas de TGSC por tramo de Poucher, forzada a
ser creciente. Resume, no copia.

| Coeficiente de Poucher | Moléculas | Horas |
|---|---|---|
| 1 | 6 | 4 |
| 2-3 | 16 | 16 |
| 4-6 | 13 | 40 |
| 7-10 | 24 | 44 |
| 11-29 | 30 | 123 |
| 30-59 | 12 | 180 |
| 60-99 | 9 | 208 |
| 100 | 10 | 380 o más (el tope de TGSC es 400; Poucher llega más allá) |

**Posición orientativa, de 0 a 1:**
- los tres pisos de Poucher se reparten en tercios, en escala logarítmica dentro de cada piso;
- no se calcula desde la presión de vapor, porque la relación es débil;
- sirve para colocar el natural en la pirámide, no para compararlo al decimal con una molécula.

## 3. Los naturales del FIG

**El emparejamiento, material a material y forma a forma:**
- La forma cuenta: en Poucher el aceite de mirra tiene 3 y la resina 21; el aceite de gálbano 11
  y la resina 90; el iris va de 13 (concreto) a 18 (absoluto) y 90 (oleorresina).
- Un «Lavender» de Poucher se aplica a los aceites de lavanda, no a su absoluto.
- Si Poucher no da forma, se aplica a todas las del material: los bálsamos, el pachulí, el vetiver.
- Solo hay un conflicto, el absoluto de *Narcissus jonquilla* (narciso 11, junquillo 24). Queda el
  más específico, anotado.

**Cobertura:**

| | Filas | CAS |
|---|---|---|
| Naturales del FIG (con la clase corregida) | 863 | 353 |
| Con dato de Poucher | **399 (46 %)** | **185 (52 %)** |
| Sin dato | 464 | 168 |

| Piso de Poucher | Filas |
|---|---|
| salida (1-14) | 198 |
| corazón (15-60) | 86 |
| fondo (61-100) | 115 |

**Por familia (filas con dato / total):**

| Familia | Con dato / total |
|---|---|
| especiado | 117 / 215 |
| verde | 83 / 196 |
| cítrico | 65 / 92 |
| amaderado | 64 / 130 |
| floral | 60 / 148 |
| animal | 9 / 14 |
| frutal | 1 / 56 |
| ozónico | 0 / 2 |
| transformado | 0 / 10 |

Los frutales sin dato son casi todos extractos de sabor (cacao, coco, frutas).

**Contraste con el piloto de Arctander** ([pieza 9](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-9-escala-arctander.md)):

| Natural | Arctander | Poucher |
|---|---|---|
| Rosa, absoluto | *excellent*, ~240 h | 43, corazón, ~180 h |
| Jazmín, absoluto | *long duration*, ~200 h | 43, corazón, ~180 h |
| Sándalo | *outstanding*, fondo | 100, fondo |
| Olíbano | *great*, ~240 h | 100, fondo (Poucher más alto) |
| Menta piperita | sin palabra | 7-9, salida, ~44 h |
| Lemongrás | sin palabra | 14, final de la salida, ~123 h |

**Algunos más:**

| Natural | Coeficiente | Piso | Horas |
|---|---|---|---|
| Lavanda | 4 | salida | 40 |
| Bergamota | 6 | salida | 40 |
| Rosa (aceite) | 8 | salida | 44 |
| Pachulí | 100 | fondo | 380+ |
| Vetiver | 100 | fondo | 380+ |

## 4. Los archivos

| Archivo | Qué trae |
|---|---|
| [`pieza-13-poucher-1955.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-13-poucher-1955.csv) | La tabla transcrita: coeficiente, nombre de 1955, tipo, CAS de la molécula y piso. Es el dato de estudio |
| [`pieza-13-duracion-naturales.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-13-duracion-naturales.csv) | Las 863 filas de naturales del FIG, cada una con su dato |

Columnas de `pieza-13-duracion-naturales.csv`:

| Columna | Qué es |
|---|---|
| `fila`, `cas`, `nombre`, `clase`, `familia` | La fila del FIG. La clase «(corregida)» marca los naturales que estaban como «sin estructura» |
| `material_poucher`, `coef_poucher`, `piso_poucher` | El dato de Poucher que se le aplica |
| `posicion_orientativa` | De 0 a 1, por los pisos de Poucher |
| `horas_estimadas`, `banda` | La conversión propia a horas; «380+» si el coeficiente es 100 |
| `nota` | Conflictos entre materiales de Poucher, si los hay |

**Para el producto:**
- las horas, la banda y la posición son una estimación propia, derivada de un coeficiente de 1955 y
  calibrada con datos asimilados;
- el coeficiente mismo es un dato de estudio;
- en la app conviene enseñar la **banda y el piso**, no las horas exactas.

## 5. Lo que falta

- **Las 464 filas (168 CAS) sin dato.** La vía siguiente es la palabra de tenacidad de Arctander
  (1960) en NotebookLM, de una en una. Conviene priorizar: sin los extractos de sabor, quedan unos
  120 CAS de perfumería.
- **Revisar la clase de la pieza 1:** los 12 CAS corregidos deben pasar a «natural» en los datos de
  la app. La columna `clase` de la pieza 13 ya lo hace.
- **Los aldehídos de Poucher** se quedan como curiosidad: para las moléculas manda OPERA.

## Fuentes

- [Poucher, W. A. (1955), *J. Soc. Cosmet. Chem.* 6(2): 80-95](https://library.scconline.org/v006n02/). Tabla en las pp. 90-93.
- Pyrfume `goodscents` (horas de TGSC), solo para calibrar.
- OPERA (EPA CompTox), [pieza 8](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-8-presion-de-vapor-estimada.md).
- PubChem, para los CAS de las moléculas de la tabla.
