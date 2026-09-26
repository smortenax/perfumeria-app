---
pieza: 1 · Fundamentos
fecha: 2026-09-26
herramienta: subagente Sonnet con web
confianza: media
---

# Fundamentos: Munzner, Ware y Tufte, aplicados a la app

## Resumen — lo que cambia para la app

1. **El presupuesto de 4-5 canales de `06` se confirma por una vía distinta y más dura.** Ware
   calcula que incluso un glifo de ocho dimensiones «bien elegidas» solo rinde del orden de 32
   combinaciones distinguibles de un vistazo — no los miles que sugiere multiplicar niveles por
   eje. El sello de doce canales de `04` está muy por encima de cualquier estimación razonable.
2. **El radio del núcleo para `power` tiene un defecto añadido, medible con la fórmula de
   Tufte:** si el radio escala linealmente con el dato, el área (lo que se percibe) escala con
   el cuadrado, así que el factor de mentira crece con la propia proporción que se quiere mostrar.
3. **La curvatura del contorno (angularidad) probablemente distinga menos niveles de los que
   `06` estimaba** — 2-3, no 3-5, según el propio ordenamiento de canales de Munzner. Puede
   conservarse por su validez crossmodal, pero hay que bajar la expectativa de resolución.
4. **El conflicto «lista o mapa» de `06` tiene ya una regla de Munzner que lo resuelve caso a
   caso**: espacializar solo donde la posición sea la propia tarea.
5. **El resaltado cruzado (`§10.3`) y los números al pasar (`§10.2`) son exactamente lo que
   Munzner receta** («los ojos ganan a la memoria»; el mantra de Shneiderman). Confirmados.
6. **El *play* del historial cae, por construcción, en el terreno donde la animación sí ayuda**
   (Heer y Robertson), no en el que Tversky et al. ven fallar — con tres condiciones concretas.
7. **Tufte, a rajatabla, chocaría con la envoltura que quiere el usuario**; pero la separación
   carga/envoltura que ya decidió `06` satisface su integridad sin sacrificar la estética,
   siempre que la envoltura se marque visualmente como tal.

---

## Hallazgos

### 1 · Munzner — qué, por qué, cómo

**El marco** (confianza alta, estructura confirmada por la web del libro y varios resúmenes de
curso que citan capítulo a capítulo): tres preguntas con respuesta independiente — **qué** datos
hay (abstracción de datos, cap. 2), **por qué** se mira (abstracción de tareas, cap. 3) y
**cómo** se dibuja (marcas, canales e idiomas, caps. 5-14).

**Qué.** Un dataset se compone de cinco tipos de dato (ítems, atributos, enlaces, posiciones,
rejillas) en cuatro tipos de conjunto (tablas, redes, campos, geometría), más colecciones sueltas
(clústeres, conjuntos, listas). Un atributo es **categórico** u **ordenado** (ordinal o
cuantitativo); su dirección puede ser secuencial, divergente o cíclica. Confianza alta.

**Por qué.** Jerarquía de acciones: **analizar** (consumir: descubrir/presentar/disfrutar — o
producir: anotar/registrar/**derivar**) sobre un objetivo mediante **búsqueda**
(`lookup`: posición y objetivo conocidos; `locate`: solo objetivo conocido; `browse`: solo
posición conocida; `explore`: ninguno) o **consulta** (`identify` un objetivo; `compare` varios;
`summarize` el conjunto). Confianza alta: la tabla aparece igual en dos fuentes independientes
que citan el libro directamente.

**Aplicado, gráfico a gráfico:**

| Elemento de la app | Qué (tipo de dato) | Por qué (tarea dominante) |
|---|---|---|
| Frasco | Un ítem, un atributo cuantitativo (fracción de masa llena) | `identify` puntual; casi «disfrutar», no analítico |
| Visualizador (sello) | Un ítem (2-3 en `compare`): fila de tabla con atributos mixtos — categórico (`hue`), ordinales (`grain`…`dryness`), cuantitativos (`power`, `diffusion`…) — un **glifo** | `identify` y `summarize` de golpe; `compare` en el comparador |
| Composición | Tabla: materiales × atributos (nombre categórico, % cuantitativo, base) | `lookup` exacto + orden/`compare` por % |
| IFRA | Dos cuantitativos (uso, techo) + un ordinal de estado + un intervalo | `lookup` contra un umbral; `compare` punto vs. peor caso |
| Pirámide | Tabla: materiales × atributo ordenado (posición 0-1, en 5 bins) × cuantitativo (mg) | `summarize` la forma global; `locate` dónde cae un material |
| Reparto de la materia | Tabla: materiales × cuantitativo (parte de la masa) | `summarize` proporciones; `compare` tamaños |
| Proyección por horas | Serie temporal: «horas» (ordenado-secuencial) × intensidad por material, una línea = un ítem | `compare` trayectorias; `locate` cuándo se apaga cada una |
| Historial + `play` | Lista ordenada de eventos, reproducible como estados sucesivos | Tarea «history» del mantra de Shneiderman; ojos-vs-memoria al comparar estados |
| Mapa de olores (AOM) | Tabla de muchas dimensiones (256, POM) **derivada** a 2 cuantitativos (PC1/PC2) + color categórico | `explore` (nada conocido); `locate`/`browse` ya dentro |

**Propuesta:** una proyección PCA/t-SNE es, en el vocabulario de Munzner, la tarea **`derive`**
(producir atributos nuevos a partir de los existentes), no una lectura directa. Vale la pena
decirlo así en la interfaz cuando llegue el mapa: es un dato derivado, con su propia
incertidumbre (pieza 3).

---

### 2 · Munzner — marcas y canales

Munzner separa los canales por el tipo de atributo. Confianza alta: orden citado literalmente
por una fuente que dice leer directamente el capítulo 5, y confirmado en líneas generales por
dos fuentes docentes independientes.

| Magnitud (atributos ordenados/cuantitativos), de más a menos preciso | Identidad (atributos categóricos), de más a menos preciso |
|---|---|
| 1. Posición alineada sobre escala común | 1. Región espacial |
| 2. Posición no alineada | 2. Tono de color (hue) |
| 3. Longitud | 3. Movimiento |
| 4. Ángulo / pendiente | 4. Forma |
| 5. Área | |
| 6. Profundidad (posición 3D) | |
| 7. Luminancia = saturación | |
| 8. Curvatura = volumen | |

**Dos principios, con nombre** (confianza alta, definición consistente en varias fuentes
docentes): **expresividad** — el canal debe expresar toda la información del atributo y solo
esa, sin implicar orden donde no lo hay; **eficacia** — el atributo más importante para la tarea
debe llevar el canal más arriba en el ranking.

**Separabilidad.** El libro dedica una sección propia (`§5.5.3`) al mismo continuo
posición-totalmente-separable ↔ tono-saturación-luminancia-totalmente-integral que ya citan `06`
y `07` vía Ware y Garner-Felfoldy. Esto **confirma, no añade**: misma conclusión, misma vía
perceptual. Confianza alta.

**Cuántos valores distingue cada canal — la cifra que falta en `06`.** De Ware (capítulo de
glifos, primaria, confianza alta): en un glifo de ocho dimensiones bien elegidas, los pasos de
tamaño distinguibles no pasan de **cuatro**, los de orientación son unos **cuatro**, y exigiendo
lectura preatentiva el conjunto entero rinde del orden de **32 combinaciones** — muy lejos de
las 64 000 de multiplicar niveles por eje si fuesen independientes.

**Aplicado al sello de `04`, cruzando con el ranking de Munzner:**

| Eje de `04` | Canal usado | Posición en Munzner | Veredicto |
|---|---|---|---|
| Posición en el mapa de olores (futuro) | Posición 2D | #1 en **ambos** rankings a la vez | Único canal en las dos listas — la elección más fuerte posible, coincide con `06` |
| `hue` (familia) | Tono de color | #2 de identidad | Confirmado |
| Tenacidad, en ficha | Longitud | #3 de magnitud | Confirmado, solo en ficha, como ya limita `06` |
| Vector de Jellinek (retirado por `06 §7`) | Habría sido ángulo + longitud | #4, y compuesto | Refuerza la corrección de `06`: una posición 2D evita la conversión mental polar→cartesiana |
| `power` como radio del núcleo | Área (vía radio) | #5 | Confirma el rechazo de `06`, y añade un defecto propio (ver abajo) |
| `angularity` (contorno) | Análogo a curvatura | #8 (peor grupo) | Ver discrepancia con `06` |
| `chroma`/`luminance` (fundidos en el color) | Saturación / luminancia | #7 | Libres, seguirían siendo canales medios — pero superiores al área mal implementada |

**El defecto añadido del radio de potencia** (aritmética de confianza alta; recomendación,
propuesta). `04 §6` fija `radio = r₀ · (0,55 + 0,45 · power/1000)`: el **radio** escala
linealmente, pero el ojo integra **área**, que crece con el cuadrado. Con dos materiales en
razón de potencia 2:1, el radio sale ~1,7:1 pero el área ~2,9:1 — y esa área es el «tamaño del
efecto mostrado» de la fórmula de Tufte (§5). El factor de mentira no es constante: crece con la
propia proporción que se quiere representar, justo donde más importa distinguir bien. Es un
defecto añadido al ya conocido «el área es mal canal» (`06`): aquí ni siquiera se codifica área
proporcional, sino radio proporcional, lo que dobla el sesgo.

---

### 3 · Munzner — reglas prácticas

Capítulo 6, «Rules of Thumb», confirmado con detalle por una fuente docente que desarrolla cada
regla con su justificación. Confianza alta en las reglas troncales; media en si «Get it right in
black and white» es rótulo propio de Munzner o remisión al trabajo de Maureen Stone (no
confirmado con certeza).

| Regla | En una frase | Aplicado a la app |
|---|---|---|
| No 3D sin justificar | Solo si el objetivo es percibir forma en datos espaciales reales, con navegación acotada; si no, oclusión y perspectiva distorsionan el canal de tamaño | La cabeza de malla 3D (imagen 5) y cualquier «escultura» del mapa de olores son **envoltura** (`06 §2`), nunca carga |
| No 2D sin justificar | Espacializar solo si la posición importa para la tarea; si no, una lista tiene más densidad y se busca mejor | Resuelve caso a caso el conflicto 3 de `06` («lista o mapa»): mapa donde la tarea sea explorar vecindad, lista donde sea localizar por nombre |
| Los ojos ganan a la memoria | Comparar mirando dos vistas a la vez gana a comparar con lo recordado | Justifica el resaltado cruzado (`§10.3`); sugiere una tira estática de sellos, no solo el *play* |
| Resolución antes que inmersión | Para datos abstractos, más píxeles rinde más que más presencia | A favor de un visualizador grande (P24 ya lo pide) y en 2D, antes que un modo inmersivo |
| Visión de conjunto, filtrar, detalle al pedirlo (Shneiderman, 1996) | Resumen, filtrar, detalle solo si se pide | Ya fijado en `§10.2` (iconos sin número, número al hover). Falta el paso «filtrar» para cuando el mapa tenga cientos de materiales |
| La respuesta tiene que ser rápida | <0,1 s al pasar el ratón, ~1 s tras clic, límites para lo pesado | Aplica al hover de `§10.2` y al recálculo por material de `§10.3` |
| Función antes que forma | No empezar por la estética; añadirla después es barato, quitarla es caro | Los siete referentes visuales son para *después* de fijar qué codifica cada canal — coincide con el orden de `06 §11` |

**Radial frente a rectilíneo** (confianza media-alta): lo rectilíneo escala mejor con el número
de ejes (2 bien, 3 empieza a costar, 4+ inviable); lo radial se justifica **solo si el dato es
cíclico** (hora del día, rumbo), porque el ángulo tiene menos precisión que la longitud.

| | Rectilíneo | Radial |
|---|---|---|
| Cuándo lo justifica Munzner | Por defecto | Solo si el dato es cíclico |
| Dato de la app | Pirámide, proyección por horas (el tiempo desde la aplicación no es «hora de reloj», es un conteo desde el evento) | Ninguno de los datos actuales de la app es cíclico |
| Aviso concreto | — | Si «reparto de la materia» fuese un quesito o dona (ángulo), esta regla predice peor lectura que una barra apilada. `§10.2` no fija si es angular o rectilíneo: dejarlo explícito antes de dibujarlo |

**Múltiplos pequeños, vistas enlazadas y resaltado cruzado** (confianza alta). Munzner lo llama
«facetar en varias vistas» (cap. 12): **compartir codificación** (misma o distinta), **compartir
datos** (todo/subconjunto/nada), **compartir navegación**. El resaltado cruzado de `§10.3` es, en
este vocabulario, **codificación distinta** (cada gráfico es su propio idioma) que **comparte un
subconjunto de datos** (el material señalado) — el patrón exacto de «vistas coordinadas»; solo
nombrarlo ayuda a no romperlo al añadir un gráfico nuevo.

---

### 4 · Ware — preatención, color, textura, movimiento

**Preatención** (primaria, confianza alta): menos de 10 ms/ítem es preatentivo; 40 ms/ítem o más
exige barrido serial (Treisman y Gormican, 1988, vía Ware).

| Forma | Color | Movimiento | Posición espacial |
|---|---|---|---|
| Orientación, longitud, anchura, colinealidad, tamaño, curvatura, agrupación, marcas añadidas, numerosidad | Tono, intensidad (luminancia) | Parpadeo, dirección | Posición 2D, profundidad estereoscópica, convexo/cóncavo por sombreado |

**Color** (primaria, confianza alta). Ware, en la conclusión del libro: solo se pueden usar de
forma fiable **entre seis y doce** códigos de color categóricos. En un experimento que cita
Ware (Post y Greene, 1986, **a verificar**), de 210 colores nombrados por sujetos solo **ocho**
obtuvieron nombre consistente por encima del 75 %. Bajo lectura preatentiva rápida, el propio Ware baja el techo a **ocho**. La luminancia
domina la percepción de forma/espacio/movimiento; los canales cromáticos tienen menor resolución
espacial. El daltonismo afecta a **~10 % de los hombres y ~1 % de las mujeres**.

**Propuesta:** `04` funde `hue`+`chroma`+`luminance` en un color OKLCH — correcto (son
integrales, `06`). Pero `luminance` es uno de los canales de magnitud más precisos disponibles
(#7 en Munzner, por encima de área/curvatura/volumen) y queda atrapado dentro de la identidad,
sin poder codificar un eje cuantitativo por sí sola. Si el presupuesto de `06` deja hueco,
liberarla como canal aparte aprovecharía un canal medio-alto hoy desperdiciado — exigiría
rehacer la mezcla de `04 §3` para no perder la identidad de familia.

**Textura** (primaria, confianza alta). El modelo de Gabor de Ware reduce la textura a tres
dimensiones: **orientación**, **escala** (1/frecuencia espacial) y **contraste** — hasta un mapa
trivariante, cuatro variables si se añade tono. `grain` en `04 §6` usa **escala** (separación de
puntos): uno de los tres ejes legítimos, bien elegido. Queda margen en orientación o contraste
si hiciera falta un canal más de textura.

**Movimiento.** Solo **parpadeo** y **dirección** son preatentivos; el resto exige atención
serial. Aviso de seguridad, no de diseño: ~20 Hz de parpadeo es lo que más induce crisis en
personas fotosensibles.

**¿Ayuda la animación?** Cuatro fuentes que no dicen lo mismo en el mismo nivel (todas
confianza alta, primarias):

- **Ware, citando a Wickens (1992)**: cuatro principios para transiciones de vista —
  representaciones consistentes, transiciones suaves, anclas visuales resaltadas, mapa de
  conjunto siempre visible.
- **Heer y Robertson (2007)**: transiciones **etapificadas** (`staging`) y con **seguimiento de
  objeto** (`tracking`, identidad visual constante) mejoran medible­mente la lectura frente a un
  corte instantáneo entre dos estados.
- **Tversky, Morrison y Bétrancourt (2002)**: en sistemas complejos con muchos cambios
  simultáneos y sin control del usuario, la animación no supera a un diagrama estático —
  la información pasa más rápido de lo que la memoria de trabajo codifica, y lo que desaparece
  no se puede revisar sin repetir. Principios de **congruencia** y **aprehensión**.

No hay contradicción real entre Heer/Robertson y Tversky et al.: los primeros prueban
transiciones entre **dos estados discretos conocidos** con control de diseño total; los segundos,
sistemas continuos y sin pausa. Son escenarios distintos.

**Aplicado al *play* del historial** (síntesis propia sobre las cuatro fuentes). Cada paso ya es,
por construcción, una transición entre dos estados discretos conocidos (antes/después de una
adición) — el terreno de Heer y Robertson, no el de Tversky et al. Tres condiciones:

1. **Identidad constante por material** entre fotogramas (mismo color, misma posición relativa)
   — la «representación consistente» de Wickens.
2. **El usuario conserva el control** (pausa, paso a paso, scrubbing) — ya implícito en el dock
   (`§10.1`); responde directamente a la advertencia de Tversky et al.
3. **Sin rótulos, o muy tenues, durante el *play*** (`§10.1`, «está por probar»): mejor
   justificado ahora — leer texto no es preatentivo, un rótulo en movimiento compite por atención
   serial justo cuando no hay tiempo. Color y tamaño sí se leen preatentivamente en movimiento;
   texto no.

---

### 5 · Tufte — integridad, tinta, múltiplos, capas

**Factor de mentira** (primaria, confianza alta): `LF = efecto mostrado / efecto real`; fiel
cerca de 1, rango aceptable ~0,95-1,05. Ejemplo propio de Tufte: LF de 14,8 (783 % mostrado
frente a 53 % real). Ya aplicado en Q2 al radio de potencia.

**Tinta de datos frente a adorno** (confianza alta, muy convergente). La razón tinta-de-datos es
la proporción de tinta que no se puede borrar sin perder información; «chartjunk» es la que no
cuenta nada nuevo. Dos reglas: «borra la tinta que no es de datos» y «borra la de datos
redundante», ambas «dentro de lo razonable».

**Propuesta:** la separación carga/envoltura de `06 §2` es **más estricta** de lo que exige
Tufte — no solo minimiza el adorno, lo **declara** para que nadie lo lea como dato. Satisface la
preocupación de fondo de Tufte (no engañar) sin renunciar a la belleza, con una condición: la
envoltura debe ser visualmente distinguible de la carga (como ya hace `04 §7` con el contorno
punteado de un sello agregado), no solo distinguible en la documentación interna.

**Múltiplos pequeños** (parafraseado, confianza media): series que repiten la misma combinación
de variables indexadas por otra, «como los fotogramas de una película». Converge con Munzner
(ojos-vs-memoria) y con Heer/Robertson/Tversky (comparar estados discretos con calma gana a
animación sin pausa) — tres fuentes independientes en la misma dirección. **Propuesta:** además
del *play*, ofrecer una tira estática de sellos en puntos fijos del historial.

**Sparklines** (confianza alta, definición convergente): «intensos en datos, simples de diseño,
del tamaño de una palabra». El modo `compact` de 24 px del sello (`04 §6`) ya sigue esta
filosofía. **Propuesta:** aplicar la misma idea a una versión mínima de la proyección por horas
dentro de cada fila de la composición.

**Lectura micro y macro** (confianza media): el propio término de Tufte para lo que `04` ya
describe sin nombrarlo — mancha bonita para quien no conoce el lenguaje (macro), lectura densa
para quien sí (micro). Vale también para el mapa de olores: macro es la forma de las nubes (con
su leyenda de varianza, como la imagen 4), micro es la ficha de un material al pasar el ratón.

**Capas y separación** (confianza media): estratificar visualmente por importancia. El reparto
imágenes-izquierda/datos-derecha de `§10.1`, y el núcleo/halo/anillo-exterior del sello (`04
§6`) ya siguen este patrón — nombrarlo ayuda a aplicarlo con disciplina al añadir capas.

**Contrapunto — Tufte no tiene la última palabra** (confianza alta, artículo revisado por
pares). Bateman et al. (CHI 2010): gráficos con adorno visual frente a versiones planas — la
precisión de lectura no empeoró, y el recuerdo a las 2-3 semanas fue significativamente mejor
con adorno. Es una discrepancia real con el minimalismo de Tufte (ver abajo) y respalda que
buscar belleza no es, por sí solo, un pecado contra el rigor — mientras la carga siga siendo
invertible y la envoltura esté declarada.

---

## Aplicado a la app

### Reglas concretas, con su fuente

| Regla | Fuente | Confianza |
|---|---|---|
| El área y el radio no codifican magnitud con precisión; usar posición, longitud o recuento de unidades antes que tamaño de forma | Cleveland-McGill vía Munzner (confirmado aquí); Ware | Alta |
| Si se mantiene un tamaño de forma para una magnitud, que escale el **área**, no el radio — o mejor, recuento de unidades (Isotype, ya en `06`) | Tufte (factor de mentira) + geometría | Alta en la aritmética; propuesta en la recomendación |
| Un color (tono+croma+luminancia) cuenta como un solo canal de identidad, nunca tres | Garner-Felfoldy, Ware; confirmado en Munzner `§5.5.3` | Alta |
| No más de 6-12 códigos de color categóricos; con lectura preatentiva rápida, más cerca de 8 | Ware | Alta |
| La posición 2D es el único canal que es a la vez el mejor de magnitud y de identidad | Munzner, cap. 5 | Alta |
| Espacializar (mapa) solo si la posición es la propia tarea; si no, lista | Munzner, cap. 6 | Alta |
| Lo radial solo se justifica con datos cíclicos; ninguno de los actuales lo es | Munzner, cap. 6 | Media-alta |
| 3D solo para percibir forma en datos espaciales reales, con navegación controlada | Munzner, cap. 6 | Alta |
| Mantener el resaltado cruzado; añadir una alternativa estática al *play* | Munzner cap. 6; Tufte (múltiplos) | Alta |
| Las transiciones animadas ayudan etapificadas y con identidad de objeto constante; fallan continuas, complejas y sin control | Heer y Robertson (2007); Tversky et al. (2002) | Alta |
| Los rótulos de texto no son preatentivos: apagarlos en movimiento rápido no cuesta lectura preatentiva | Treisman (ya en `06`/`07`); Ware | Alta |
| El adorno declarado como tal (envoltura) no viola la integridad gráfica aunque no sea tinta de datos | Tufte, matizado por `06 §2` | Media |
| El adorno bien elegido puede mejorar el recuerdo sin empeorar la precisión | Bateman et al. (2010), en tensión con Tufte | Alta |

### Categorías de infografía que sugieren estos tres autores (propuesta)

Cruzando tarea (Munzner/Shneiderman) con grado de fidelidad (Tufte), para que las piezas 2-5 lo
afinen:

| Categoría | Tarea dominante | Fidelidad | Gráficos de hoy |
|---|---|---|---|
| Exacta / tabular | `lookup` de un valor preciso | Máxima: posición y longitud sobre escala común, texto | Composición, IFRA |
| Iconográfica ligada a datos | `summarize` + `locate`, detalle al pedirlo | Alta: cada marca ligada a un canal del presupuesto de `06` | Pirámide, reparto, proyección |
| Glifo de firma | `identify` + `compare` de un ítem complejo | Media: 4-5 canales de carga, resto envoltura declarada | Visualizador (sello) |
| Mapa exploratorio | `explore` + `browse`, leyenda honesta (como imagen 4) | Media: posición fiable, pero dato derivado, nunca medida directa | Mapa de olores (AOM) |
| Proceso / secuencia | Tarea «history» del mantra de Shneiderman | Alta por fotograma; múltiplos estáticos + animación etapificada como dos modos | Historial + *play* |
| Atmósfera / marca | Ninguna analítica — «disfrutar»/«presentar» | Mínima a propósito, siempre marcada como envoltura | Cimática, malla 3D, iridiscencia |

---

## Discrepancias

- **Tufte (minimizar tinta que no es de datos) frente a Bateman et al. (2010)**: el adorno bien
  elegido no empeoró la precisión y mejoró el recuerdo a 2-3 semanas. No arbitro: ambas están
  bien fundadas en su terreno. `06 §2` (carga/envoltura) ya evita tener que elegir bando.
- **Curvatura/angularidad del contorno**: `06 §6` la estima en 3-5 niveles con alta
  separabilidad; el ranking de Munzner/Cleveland-McGill la coloca en el grupo peor valorado
  (empatada con volumen), con otras fuentes hablando de solo 2-3 niveles. No es necesariamente
  la misma curva (`06` mide un contorno poligonal completo, no una línea sola), así que no lo
  presento como error de `06`, sino como aviso: bajar la expectativa hasta el test que ya
  propone `06 §10`.
- **Orden exacto de la cola del ranking de magnitud**: una fuente que cita el capítulo 5
  literalmente da «luminancia = saturación > curvatura = volumen»; otra síntesis no verificada
  pone el volumen por encima del color sin mencionar curvatura. Bajo impacto: ninguno de los dos
  extremos se usa hoy como canal principal.

## No encontrado

- No pude leer directamente los PDF de las diapositivas de curso de la propia Munzner (fallaron
  al extraerse como texto) ni el texto íntegro de su libro — esta pieza se apoya en varias
  fuentes secundarias que coinciden entre sí y citan capítulo y contenido con precisión, no en
  lectura directa del original. Marcado en cada hallazgo.
- No pude confirmar con fuente primaria si «Get it right in black and white» es rótulo propio
  del capítulo 6 o remisión al trabajo de Maureen Stone sobre color funcional.
- No hay, en Munzner ni en Ware, una cifra aislada de «cuántas formas se distinguen» (sí hay
  cifras para tamaño, orientación y color dentro de un glifo compuesto, vía Ware).
- Nada específico sobre mapas de olor en ninguno de los tres autores — esperable: queda para las
  piezas 3 y 5.
- No verifiqué contra el texto original de Tufte (solo fuentes secundarias convergentes) las
  citas sobre «múltiplos... fotogramas de una película» ni la de los números aburridos; van
  parafraseadas y con confianza media.

## Preguntas nuevas

- ¿Cuántos sellos caben en una vista de biblioteca antes de que el color categórico se sature
  (más allá de los 6-12 de Ware)? Necesitaría un test con materiales reales, como el de `06 §10`.
- Si se libera `luminance` como canal cuantitativo aparte, ¿qué eje se le asigna, y cómo queda
  la mezcla OKLCH de `04 §3` sin depender de ella para la identidad?
- ¿Compensa medir el factor de mentira real del radio de potencia antes de decidir entre
  área-proporcional o recuento de unidades (Isotype, ya preferido por `06`)?
- Para el *play*: ¿cuánto tiempo de permanencia mínimo por paso necesita un usuario real para
  registrar el cambio? Solo sale de probarlo, no de la bibliografía.
- ¿Vale la pena comprobar el sello en blanco y negro y con daltonismo rojo-verde antes de fijar
  la rueda cromática olfativa de doce sectores (`04 §3`)?

## Fuentes

- Munzner, T. — *Visualization Analysis and Design*, CRC Press, 2014. https://www.cs.ubc.ca/~tmm/vadbook
- Zhou, K. — resúmenes por capítulo del libro de Munzner: cap. 2 https://kaijiezhou.wordpress.com/2016/02/04/response-to-the-chapter-2/ ·
  cap. 3 https://kaijiezhou.wordpress.com/2016/02/09/report-for-chapter-3/ ·
  cap. 5 https://kaijiezhou.wordpress.com/2016/03/08/response-for-chapter-5/ ·
  cap. 7 https://kaijiezhou.wordpress.com/2016/02/16/response-for-chapter-7/
- Guerra, J. — notas de clase sobre el capítulo 6 de Munzner: https://johnguerra.co/lectures/information_visualization_spring2021/05_Rules_of_thumb/
- Smity, B. — notas de clase sobre marcas y canales: https://bsmity13.github.io/BCB5200/lectures/08_marks_channels.html
- CUNY, *Data Visualization S23* — abstracción de tareas: https://www.math.csi.cuny.edu/~mvj/GC-DataViz-S23/lectures/L3.html
- Shneiderman, B. (1996). «The Eyes Have It: A Task by Data Type Taxonomy for Information
  Visualizations». *Proc. IEEE Symposium on Visual Languages*, p. 336. https://www.cs.umd.edu/~ben//papers/Shneiderman1996eyes.pdf
- Ware, C. — *Information Visualization: Perception for Design*, Morgan Kaufmann (edición sin
  comprobar). Se cita el libro: la copia en línea que se leyó no consta como autorizada.
- Ware, C. — *Visual Thinking for Design*, Morgan Kaufmann, 2008 (referencia bibliográfica, sin
  texto íntegro consultado): https://www.oreilly.com/library/view/visual-thinking-for/9780123708960/
- Tufte, E. — «Computing Lie Factor by Dividing Percentages»: https://www.edwardtufte.com/notebook/computing-lie-factor-by-dividing-percentages/
- Tufte, E. — *The Visual Display of Quantitative Information*, Graphics Press, 1983 (data-ink
  ratio y chartjunk vía fuentes secundarias convergentes): https://en.wikipedia.org/wiki/Chartjunk ·
  https://www.holistics.io/blog/data-ink-ratio/
- Sparklines (Tufte): https://en.wikipedia.org/wiki/Sparkline
- Lectura micro/macro (Tufte, *Envisioning Information*), vía reseña de curso: https://medium.com/@shurisk96/micro-macro-readings-cd987ce6bc63
- Heer, J. y Robertson, G. (2007). «Animated Transitions in Statistical Data Graphics». *IEEE
  TVCG*. https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf
- Tversky, B., Morrison, J. B. y Bétrancourt, M. (2002). «Animation: can it facilitate?».
  *International Journal of Human-Computer Studies*. https://hci.stanford.edu/courses/cs448b/papers/Tversky_AnimationFacilitate_IJHCS02.pdf
- Bateman, S., Mandryk, R. L., Gutwin, C., Genest, A., McDine, D. y Brooks, C. (2010). «Useful
  Junk? The Effects of Visual Embellishment on Comprehension and Memorability of Charts». *Proc.
  CHI 2010*, ACM, pp. 2573-2582. DOI: https://doi.org/10.1145/1753326.1753716
- Wickens, C. (1992), citado en Ware — los cuatro principios de transición de vista (misma
  fuente que Ware, arriba).
- Documentos internos ya citados y no repetidos: `docs/antecedentes/lenguaje-visual/04-lenguaje-olfativo-visual.md`,
  `docs/antecedentes/lenguaje-visual/06-criba-lenguaje-pictorico.md`,
  `docs/antecedentes/lenguaje-visual/07-referencias-nuevas.md`, `docs/decisiones.md` §10.

## Revisión (2026-09-26)

- **El experimento de los 210 colores** se atribuía a Ware. Parece de Post y Greene (1986),
  citado por Ware: corregido y marcado a verificar.
- **Se quita el enlace a una copia del libro de Ware** en Internet Archive, porque no consta
  que sea una copia autorizada. Se cita el libro.
- **P24 pide un visualizador grande**; lo de 2D es recomendación de esta pieza, no una
  decisión. Corregido.
