> 📥 **Copiado del laboratorio** (`fuentes/investigaciones/2026-09-28-frente-6-color-y-duracion-para-app.md`, commit `776e932`) por `scripts/importar_datos.py`. **No se edita aquí**: se corrige en el laboratorio y se vuelve a importar.

---
frente: 6 — La base descriptiva; entrega para la app de los dos frentes visuales: familias con color y duración
fecha: 2026-09-28
herramienta: Claude Code (Opus), sobre el FIG, OPERA, Symrise, Givaudan, Perfumer's Apprentice y la calibración de la parte A
confianza: media   # las familias y la paleta son propuesta propia validada; la duración es un orden de magnitud
---

# Color y duración: lo que la app puede aplicar ya

**Para qué:** son los dos frentes visuales que la app tiene pendientes y que dependen del
laboratorio:

- **el color de cada material,** en la barra de búsqueda, las líneas de proyección y las porciones
  de cantidad;
- **la duración,** en el gráfico de proyección por horas.

Aquí están los archivos, cómo leerlos y qué falta.

| Archivo | Filas | Qué trae |
|---|---|---|
| [`pieza-11-paleta.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-11-paleta.csv) | 9 | Las 8 familias y el gris: orden, nombre del color, hex claro y oscuro, qué entra |
| [`pieza-11-familias-y-color.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-11-familias-y-color.csv) | 3119 | Por fila del FIG: familia, matiz, confianza, cómo se decidió y color |
| [`pieza-12-duracion-estimada.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-12-duracion-estimada.csv) | 2069 | Por CAS: presión de vapor (OPERA), posición de 0 a 1, horas estimadas con su rango y banda |
| [`pieza-12-curva-duracion.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-12-curva-duracion.csv) | 121 | La curva propia de presión de vapor a horas, para calcular cualquier material nuevo |

## 1. Las familias y su color

### La paleta (opción D, primer nivel)

| # | Familia | Qué entra | Color | Claro | Oscuro |
|---|---|---|---|---|---|
| 1 | Cítrico | cítricos | amarillo | `#c3b503` | `#a19500` |
| 2 | Verde | verde, herbal, aromático, alcanforado, mentolado | verde menta | `#43cd99` | `#4aa781` |
| 3 | **Ozónico** | ozónico, marino, acuoso, aldehídico, limpio, metálico | azul cielo | `#2db9f3` | `#237da9` |
| 4 | Floral | floral, miel, atalcado | rosa malva | `#c475aa` | `#975482` |
| 5 | Frutal | frutal, gourmand | **violeta** | `#896ffb` | `#915fd8` |
| 6 | Especiado | especiado, anisado, balsámico, ámbar | naranja | `#d86f0d` | `#bb704e` |
| 7 | Amaderado | maderas, terroso, ahumado, tabaco | marrón | `#923002` | `#944e00` |
| 8 | **Animal** | animal, almizcle, cuero | **rojo** | `#d22c50` | `#ca224a` |
| — | **Transformado** (Transf) | ácido, azufrado, alimentario (pirazinas, tiazoles…) | gris | `#8a8a8a` | `#8a8a8a` |

**Cambios del 2026-09-28**, por decisión del usuario, tras la
[evaluación de la familia acuática](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-28-frente-6-familia-aire-evaluacion.md):

- **«Acuático» pasa a «Ozónico».** Es la palabra que el público ya asocia al aire.
- **El frutal pasa a violeta:** hay frutas de todos los colores.
- **El animal tiene familia propia, en rojo:** son olores fuertes, y los olores intensos se asocian
  a colores más oscuros y saturados (Kemp & Gilbert).
- **El almizcle va con el animal.**
- **El amaderado se queda con las maderas.**
- **El cuero no es una familia ni una combinación especial.** Si se hacen combinaciones, serán
  para todas las familias por igual (el segundo nivel, en pausa). Ya salen de `familia` + `matiz`.
- **El grupo gris se conserva, con el nombre «Transformado» (Transf).**

**Nombre del grupo gris: «Transformado»**, con la etiqueta corta **«Transf»** (decisión del
usuario, 2026-09-28).
- **Por qué:** es una categoría marginal, así que se nombra por lo que tiene en común: son olores
  que salen de una transformación, sea por calor (pirazinas, tostados), por fermentación (ácidos) o
  por corte (azufrados).
- **Por qué gris:** encaja con un grupo que no se define por un objeto.
- **Nombres descartados:**
  - «Técnico» y «Culinario»;
  - «Volátiles», porque choca con el eje físico de volatilidad;
  - «Acre», que casi no se usa;
  - «Agrio», que no cubre los tostados.

**Cómo se ha elegido:**

- **Método:** una búsqueda sobre el espacio de color OKLCH.
  - Cada familia se limita a su tono intuitivo: cítrico en amarillo, verde en verde, floral en
    rosa claro, frutal en rojo, amaderado en marrón oscuro.
  - Dentro de esos límites, se maximiza la separación de los 8 entre sí, con visión normal y con
    daltonismo (protanopía y deuteranopía).
  - Lo ha comprobado el validador de paletas del laboratorio.
- **Modo claro: pasa todo, los 8 contra los 8.**
  - Separación mínima de 15,1 con visión normal (animal frente a especiado).
  - **10,6 con daltonismo** (especiado frente a cítrico), mejor que la paleta anterior (8,5).
  - Aviso: el amarillo, el verde y el azul cielo tienen poco contraste con el fondo blanco (menos
    de 3:1). En líneas y porciones funcionan; como texto no. Piden etiquetas o bordes.
- **Modo oscuro: provisional.** Con los tonos intuitivos, ninguna combinación de 8 pasa todos los
  pares.
  - La mejor deja amaderado frente a especiado en 12,4 (el mínimo es 15).
  - Con daltonismo, especiado frente a cítrico queda en 6,4, en la banda que exige una segunda
    pista.
  - **La sigla del material es esa segunda pista.** Hay que probarlo en pantalla.
- **La paleta es un punto de partida.** El usuario la evaluará en el entorno visual. Cambiar un
  color es cambiar una fila de `pieza-11-paleta.csv`: hay que volver a validar, no rehacer los
  datos.

### La asignación, fila a fila

Por orden:

1. **Interpretación del FIG.** Los tres descriptores de cada fila (27 primarios y ~190
   secundarios) puntúan por su familia: 3, 2 y 1 según la posición. La familia dura es la del
   primero. La segunda más puntuada es el **matiz**. Detalle en la
   [pieza 10](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-10-familias-por-fila.md).
2. **Las tres correcciones pedidas:**
   - **Lo atalcado pasa al floral:** Symrise y Givaudan lo ponen ahí (acetanisol, iononas).
   - **El «aromatic» de Symrise se reparte por sus notas:** cinámicos, anisados y balsámicos a
     especiado; Terranol a amaderado; mentas, hierbas y eucaliptol a verde.
   - **Los ésteres «frutales» que las casas llaman florales** (acetato y propionato de bencilo…)
     se resuelven con la regla de votos del punto 3.
3. **Votos de tres catálogos**, por CAS:
   - **Symrise:** 211 moléculas.
   - **Givaudan:** 157 moléculas; su buscador no da el CAS, y 94 se resolvieron con PubChem.
   - **Perfumer's Apprentice:** 1213 fichas, 379 con familia y un solo CAS. No cuentan los aceites
     de perfume ni las mezclas.

   **Regla:** un catálogo cambia la familia del FIG solo en tres casos:
   - si votan dos casas y coinciden;
   - si el FIG estaba empatado;
   - si el catálogo elige el matiz que el propio FIG ya daba.

   Una sola casa no cambia una fila clara del FIG, ni una suelta. Perfumer's Apprentice llama
   «frutales» al ácido butírico o al isovalérico, por su uso en sabores, y siguen en el gris.

**Resultado:**

| Cómo se decidió | Filas |
|---|---|
| Solo el FIG | 2518 |
| El FIG y los catálogos coinciden | 454 |
| Lo cambian los catálogos | 88 |
| Se queda el FIG, con un catálogo en contra | 59 |

| Confianza | Filas | Cuándo |
|---|---|---|
| alta | 1953 (63 %) | FIG claro, o FIG y catálogos de acuerdo, o dos catálogos |
| media | 831 (27 %) | FIG con matiz, o una sola casa que decide |
| baja | 335 (11 %) | Empates sin catálogo, sueltos, o una casa en contra |

| Familia | Filas | % |
|---|---|---|
| Verde | 658 | 21,1 |
| Floral | 652 | 20,9 |
| Frutal | 599 | 19,2 |
| Amaderado | 363 | 11,6 |
| Especiado | 359 | 11,5 |
| Cítrico | 214 | 6,9 |
| Transformado (gris) | 103 | 3,3 |
| Animal | 89 | 2,9 |
| Ozónico | 82 | 2,6 |

**Cambios típicos por los catálogos:**
- el olíbano y el elemi pasan de amaderado o cítrico a especiado, que es donde van los balsámicos;
- algunos verdes pasan a floral, y algunos frutales a floral.

**Columnas de `pieza-11-familias-y-color.csv`:**

| Columna | Qué es |
|---|---|
| `fila`, `cas`, `nombre`, `clase` | La clave. `fila` es la fila del FIG, porque el CAS no es único en los naturales |
| `familia`, `matiz` | La familia dura y la segunda, si la hay |
| `estado_fig`, `familia_fig` | Lo que dio la interpretación del FIG |
| `votos` | Qué dijo cada catálogo. Solo para trazabilidad: la familia es propia |
| `decision`, `confianza` | Cómo se decidió y con qué seguridad |
| `color_claro`, `color_oscuro` | El hex de la familia |

**Lo que la app puede hacer con el matiz:** un borde fino o un segundo tono pequeño en el icono de
la barra de búsqueda. Es opcional (decisión 4 de la parte B).

**Licencias:**
- la familia es una **categorización propia**: interpreta los descriptores del FIG y los contrasta
  con catálogos;
- no copia las categorías de nadie, y las familias de los catálogos no se publican como tales;
- la paleta es propia.

## 2. La duración

### Cómo está la investigación

| Pieza | Estado |
|---|---|
| **Dato de base** | La presión de vapor de OPERA (EPA, dominio público y MIT), para 2069 CAS del FIG (casi todas las moléculas). Es la misma que da la posición |
| **Estimación propia de horas** | **Hecha y exportada.** Curva monotónica de presión de vapor a horas: la mediana de las horas de TGSC de las moléculas con presión de vapor parecida, en 872 casos. Resume cientos de valores; no copia ninguno |
| **Precisión** | Un **orden de magnitud:** error típico de un factor 3,6 (la mitad de los casos, dentro de un factor 2,1). La escala hereda el tope de 400 h de TGSC |
| **Base** | Material puro, en tira. En piel y en fórmula dura otra cosa (Calkin & Jellinek: 15 min, 3-4 h y 5-8 h por piso de la pirámide) |
| **Corrección por potencia** | **Pendiente.** Los materiales muy potentes duran más de lo que dice su presión de vapor. Se ha comprobado con dos fuentes independientes: el poder de TGSC (*high*, ×1,7) y la fuerza de Arctander («muy potente», ×4,9, pero solo 7 casos). Faltan datos de potencia propios con cobertura: el umbral en aire solo está para 160 CAS |
| **Contraste con un proveedor** | La sustantividad en seco de Givaudan (85 moléculas) va en el mismo sentido (rho = 0,35), pero mide otra cosa: lo que queda en tejido tras lavar |
| **Naturales** | **Hecho en parte:** la tabla de Poucher (1955) da piso, posición orientativa y horas para 399 de 863 filas (185 de 353 CAS). Ver la [duración de los naturales](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-28-frente-6-duracion-naturales.md) y `pieza-13-duracion-naturales.csv`. Para el resto, la palabra de tenacidad de Arctander en NotebookLM |

### El archivo

`pieza-12-duracion-estimada.csv`, por CAS:

| Columna | Qué es |
|---|---|
| `cas` | El CAS |
| `pv_opera_mmhg`, `log10_pv` | La presión de vapor de OPERA y su logaritmo |
| `posicion` | 0 = salida, 1 = fondo, con los anclajes propuestos (percentiles 5 y 95 del FIG). Los anclajes son la decisión 1 de la app |
| `horas_estimadas` | Las horas de la curva |
| `horas_min`, `horas_max` | El rango de un error típico: entre la estimación ÷3,7 y ×3,7, con «400+» si pasa del tope |
| `banda` | Para enseñar sin prometer números |

Las bandas, con cuántas moléculas caen en cada una:

| Banda | Moléculas |
|---|---|
| menos de 6 h | 262 |
| 6-24 h | 545 |
| 1-3 días | 493 |
| 3-7 días | 239 |
| 1-2 semanas | 469 |
| más de 2 semanas (tope 400 h) | 61 |

`pieza-12-curva-duracion.csv` es la curva sola, en pasos de 0,1 en log10(PV). Con ella la app
calcula las horas de cualquier material del que tenga presión de vapor, sin depender de la tabla.

**Algunos puntos de la curva:**

| Presión de vapor (mmHg) | Horas |
|---|---|
| 10 | 4 |
| 1 | 8 |
| 0,1 | 24 |
| 0,01 | 108 |
| 0,001 a 0,0001 | 210 |
| 0,00001 | 292 |
| 0,000001 | 350 |

### Lo que se recomienda enseñar

- **En el gráfico de proyección, bandas o un intervalo** (horas mín.-máx.), no una línea que acaba
  en una hora exacta. El error es de un factor 3,6.
- **Para los naturales, la banda y el piso de Poucher** (pieza 13) cuando existan, y si no «sin
  dato». No se inventa una curva.
- **Declarar la base:** material puro en tira. En una fórmula real, lo que cambia la duración (la
  dilución, la fijación, la piel) no está en este dato.

## 3. Lo que falta, y quién lo hace

| Qué | Dónde |
|---|---|
| Probar la paleta en pantalla, sobre todo en modo oscuro, con la sigla como segunda pista | App |
| Los 344 casos de confianza baja: revisar a mano o con otro catálogo (IFF, dsm-firmenich en línea) | Laboratorio |
| El grupo «Transformado» (103 filas) se queda en gris | Decidido |
| La corrección de la duración por potencia: más umbrales en aire (tabla 20.1 y Devos 1990) | Laboratorio, con NotebookLM |
| Las palabras de tenacidad de Arctander para los 168 CAS de naturales sin dato de Poucher | Laboratorio, con NotebookLM |
| El segundo nivel de familias (subfamilias por combinación), en pausa | Usuario, cuando se vea el primero en pantalla |

**Scripts:** en el borrador de la sesión (`color/familias.py`, `color/final.py`, `color/optim.py`,
`color/duracion.py`, `cat/cruce.py`), no en el repositorio.
