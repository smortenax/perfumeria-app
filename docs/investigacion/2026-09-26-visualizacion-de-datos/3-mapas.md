---
pieza: 3 · Mapas de muchas dimensiones
fecha: 2026-09-26
herramienta: subagente Sonnet con web
confianza: media
---

# Mapas de muchas dimensiones, aplicados al mapa de olores de la app

## Resumen — lo que cambia para la app

1. **Ninguno de los tres métodos (PCA, t-SNE, UMAP) deja leer tamaño de grupo, hueco entre
   grupos ni distancia entre grupos como si fueran datos.** Solo PCA deja leer distancia
   *dentro* de los ejes que conserva como una distancia real, a costa de conservar muy poca
   varianza. Esto no es un matiz: es la restricción de fondo que condiciona todo lo demás.
2. **La estabilidad que pide el usuario (añadir un material sin reordenar los demás) tiene
   solución distinta en cada método**, y no es la misma decisión que «qué tan bonito queda
   el mapa»: PCA la tiene gratis, UMAP la tiene con matrícula (`transform`, con una condición),
   t-SNE no la tiene de fábrica y necesita una pieza añadida (openTSNE o t-SNE paramétrico).
3. **La imagen 4 queda confirmada como infografía de prensa**: es una versión modificada, con
   permiso, de un gráfico del propio artículo del POM, publicada por *Scientific American* en
   diciembre de 2023. Hace casi todo bien —varianza en el título, no solo en el eje; puntos
   grises de fondo bajo las regiones con nombre— salvo una cosa: la región tintada, una vez
   dibujada, no repite su propio límite de confianza.
4. **La imagen 7 (la nube de Osmo) es marca, no dato, y lo dice la propia Osmo**: la llaman
   ellos mismos «abstract rendering», sin varianza, sin ejes, sin leyenda — exactamente la
   categoría «atmósfera/marca» de las piezas 1-2, confirmada ahora por la fuente misma.
5. **El propio artículo del POM admite, en su discusión, que no sabe decir cómo huele una
   mezcla** — el problema exacto de dibujar una fórmula como un punto. Un centroide dibujado
   como un material real miente por partida doble: finge una posición y finge que ahí huele.
6. **Los naturales no tienen sitio en el POM, y no hace falta inventarles uno falso**: hay
   precedente (aplicabilidad de modelo en quimioinformática, la regla de `06`/Lupi sobre el
   hueco) para marcarlos con un signo abiertamente distinto, nunca un punto igual a los demás.
7. **La densidad de puntos de la concepción del usuario (imagen 8) es una convención legítima
   solo mientras no haga falta contar** — en cuanto haya que leer «cuántos» en vez de «cómo de
   lleno», hace falta otro canal, y ya existe la receta (`06`, Isotype).

---

## Hallazgos

### 1 · Qué se puede leer y qué no, método a método

**t-SNE** (Wattenberg, Viégas y Johnson, *Distill*, 2016; primaria, leída directamente,
confianza alta). Cinco lecciones: la perplejidad cambia la forma de los grupos y debe ser
menor que el número de puntos, con iteraciones suficientes para converger —parado antes de
tiempo, el resultado sale «pellizcado»—; el tamaño de los grupos **no significa nada** (t-SNE
expande los densos y contrae los dispersos por diseño propio: «you cannot see relative sizes
of clusters in a t-SNE plot»); la distancia entre grupos bien separados puede no significar
nada; con perplejidad baja, ruido puramente aleatorio puede mostrar grumos que no son nada; y
hace falta más de un dibujo —varias perplejidades— para fiarse de la topología.

**UMAP** («Understanding UMAP», Coenen y Pearce, Google PAIR, 2019; primaria, leída
directamente, confianza alta). Su sección «How to (mis)read UMAP» repite, palabra por
palabra, las cinco lecciones de Distill —cita literal de su propio resumen: «Cluster sizes in
a UMAP plot mean nothing»— y añade tres cosas propias. Conserva mejor la estructura global que
t-SNE, porque su construcción obliga a conectar cada punto al menos a su vecino más cercano.
Ningún eje o distancia de UMAP, ni de t-SNE, es interpretable en el sentido de técnicas como
PCA (parafraseado) — la frase clave de la pieza: un eje de PCA sigue siendo una combinación
lineal de las dimensiones reales; uno de UMAP o t-SNE no se parece a eso. Y tiene un fallo
documentado y concreto: un grupo denso y estrecho *dentro* de otro amplio y disperso no se
separa bien, sobre todo en alta dimensión — la geometría exacta de una familia estrecha
(muguet) anidada en una amplia (floral), aviso directo para el mapa de la app. Sus dos
parámetros: `n_neighbors` (pocos = detalle local, panorama global perdido; muchos, al revés) y
`min_dist` (bajo = grumos apretados; alto = topología amplia, detalle fino perdido).

**PCA** (documentación oficial de scikit-learn, confianza alta, leída directamente).
`explained_variance_ratio_` es, literalmente, el «Percentage of variance explained by each of
the selected components» — el número que debe llevar el eje siempre (ya lo hacen las imágenes
2 y 4). Una varianza baja no invalida el mapa por sí sola (fuentes secundarias convergentes,
confianza media: indica que los datos se reparten en más de dos dimensiones reales, y aun así
pueden separar grupos con limpieza) — pero exige, siempre, escribir el número.

**Densidad y huecos**: ningún método distingue «aquí no hay materiales» de «aquí no se ha
mirado» (`§1.2`/Lupi, pieza 2) — eso se dibuja aparte, con otra capa (hallazgo 4).

**Aplicado a la app.** La tarea `derive` que la pieza 1 ya asignaba a la proyección se puede
precisar: no es invertible por igual en sus tres lecturas. Distancia y agrupación aparente son
`derive` de baja fiabilidad en los tres métodos; posición relativa gruesa es `derive` de
fiabilidad media, mejor en UMAP que en t-SNE, mejor en PCA que en ninguno de los dos **solo si
la varianza retenida es alta** — casi nunca, con 256 dimensiones reales.

### 2 · Estabilidad y materiales nuevos

**PCA proyecta puntos nuevos gratis, por construcción** (scikit-learn, confianza alta, leída
directamente): `transform(X)` aplica la misma proyección lineal ya calculada a datos nuevos —
se proyecta sobre las componentes principales extraídas previamente del conjunto de
entrenamiento (parafraseado). No hay azar ni reoptimización: los puntos viejos no se mueven
porque la operación entera es multiplicar por una matriz fija.

**UMAP tiene `transform`, con una condición escrita en su propia documentación** (umap-learn,
confianza alta, documentación oficial). El modelo entrenado se reutiliza para insertar puntos
nuevos sin recalcular los antiguos, pero la propia documentación avisa de que esto **asume que
la distribución de los datos nuevos es parecida a la de entrenamiento** (parafraseado) — si un
material la rompe (una familia química nunca vista), UMAP remite a **Parametric UMAP** como
alternativa más robusta. Aparte, su guía de reproducibilidad avisa de que UMAP es estocástico
—cita literal: «different runs of UMAP can produce different results»— y que fijar
`random_state` es obligatorio para repetir un mapa exactamente, al coste de la paralelización.

**t-SNE, de fábrica, no admite puntos nuevos** (síntesis secundaria sobre Van der Maaten,
confianza media: no se leyó el original de 2009 directamente): el mapa es un resultado, no una
función, y no hay matriz ni red que aplicar a un punto que no estaba. Dos vías añadidas,
ninguna de fábrica (ambas confianza media, vía resumen, sin lectura directa del documento):
**openTSNE**, la única biblioteca citada con `transform()` para insertar puntos en un mapa
t-SNE ya existente, buscando vecinos y reoptimizando solo el punto nuevo; y **t-SNE
paramétrico** (Van der Maaten, *AISTATS* 2009), que entrena una red para *aproximar* la función
de t-SNE, de modo que un punto nuevo se empuja por la red ya entrenada, sin tocar los viejos.

**Precedente exacto, en el mismo dominio.** MolCompass (*J. Cheminformatics*, 2024, confianza
media-alta, vía resumen) usa un t-SNE paramétrico ya entrenado para que un químico suelte una
molécula nueva en un mapa de espacio químico estable, sin recalcular el mapa entero — casi
literalmente el problema de esta app, ya resuelto en quimioinformática.

**El asiento aleatorio no resuelve la estabilidad, solo la repetición.** Fijar una semilla
hace que la misma tanda de datos, con los mismos hiperparámetros, produzca siempre el mismo
mapa (UMAP, arriba) — pero eso no coloca un punto nuevo, solo evita que el mapa entero cambie
por azar entre ejecuciones. Son dos problemas distintos, con piezas distintas: semilla fija
para uno, `transform`/paramétrico para el otro, y hacen falta las dos.

**Cómo versionar un mapa (propuesta, sin cobertura en las fuentes).** Tratar el mapa como un
artefacto con versión propia: el corpus de entrenamiento (qué materiales, de qué commit de
`datos/fuente/`, con la disciplina que ya impone `scripts/importar_datos.py`), el método e
hiperparámetros, y la semilla, como tres números que cambian por separado. Añadir un material
con `transform` es versión menor (nada viejo se mueve); reentrenar el modelo entero es versión
mayor, y el mapa anterior debería quedar consultable.

### 3 · Cómo enseñan el mapa el artículo del POM y sus imágenes

**Imagen 4 — origen confirmado.** Es una infografía de prensa, no una figura académica ni
anónima: *Scientific American*, diciembre de 2023, «Machine Learning Creates a Massive Map of
Smelly Molecules» de Simon Makin, con un crédito impreso en la propia revista (leído
directamente, confianza alta) que la atribuye, palabra por palabra, a una «Modified version of
a chart... [Reproduced with permission]» del artículo original de Lee et al. en *Science*,
volumen 381 — un rediseño con permiso de una figura del propio artículo, no una invención de
la revista. **Bien**: escribe el 28 % en el cuerpo del texto, no
solo en el eje; separa dos gramáticas para dos niveles de jerarquía —área tintada para la
categoría amplia (floral), contorno para la subcategoría (jazmín)—; conserva el punto gris de
cada molécula bajo las regiones, así que estas se leen como resumen, no como sustituto del
dato. **Mal**: la región tintada, una vez dibujada, es un área cerrada que se lee como un país
en un mapa; nada en su propia forma recuerda, al mirarla, que solo representa un 28 % de la
estructura real — el aviso vive en el texto de arriba, no en el dibujo.

**Imagen 2 — origen y lectura.** Su propio título recortado («…lor Islands in PCA space for
multiple representations») y su vocabulario de etiquetas (floral, muguet, lavanda, jazmín)
coinciden con el del artículo del POM — confianza alta en el origen; media en el número exacto
de figura suplementaria (no se leyó el pie original; una búsqueda apunta a una «Figura S3» de
huellas moleculares, sin verificar). El panel «Fingerprints» declara PC1 (0,77 %) y PC2
(0,60 %) — menos del 1,4 % combinado, un residuo casi sin estructura, por lo que sus contornos
por etiqueta se solapan casi por completo. El otro panel declara PC2 (12 %), un orden de
magnitud mejor, sin verificar aquí qué representación exacta es. No es una figura suelta: el
propio artículo cuantifica la misma diferencia con otra métrica —correlación con la distancia
perceptiva real de R=0,73 para el POM frente a R=−0,12 para las huellas (bioRxiv, texto
completo, confianza alta)—; la imagen 2 es la versión dibujada de ese contraste, con las dos
representaciones lado a lado, mismo estilo, varianza en cada eje sin excepción —incluida la
vergonzosa (0,77 %).

**Imagen 7 — marca, dicha por la propia marca.** El pie original de Osmo, leído directamente
en su blog (vía copia archivada, confianza alta): «Abstract rendering of Osmo's odor map
showing olfactory relationships among molecules». La misma imagen, mismo crédito a «Osmo
Labs», aparece reutilizada por *IEEE Spectrum* (segunda fuente independiente, confianza alta)
— ninguna de las dos la trata como figura científica. No lleva ejes, varianza, leyenda ni
puntos grises: solo cuatro esquinas con una molécula de ejemplo (afrutado, almizcle,
cárnico/tostado, floral) y una nube de degradado entre ellas. Es «atmósfera/marca» (piezas
1-2), confirmada ahora por la fuente misma: la propia Osmo la llama «abstracta», nunca «mapa».

**Imagen 8 — el grano de la imagen 7, de cerca.** Confirma una textura densa de puntos de
color con degradado suave, sin marcas de molécula individual a ese zoom — coherente con
«abstract rendering». Propuesta, no verificable desde la imagen sola: tratarla como textura
generada, no como trazado punto a punto, y no leer densidad real en su grano.

**Los límites del POM que debe recoger la leyenda de cualquier mapa derivado de él** (bioRxiv,
texto completo, confianza alta, ya adelantado por el antecedente FIG-POM y confirmado aquí con
la cita exacta de la discusión): «does not provide clear guidance about how stimuli can be
mixed» — el propio artículo admite que no sabe combinar. También: no predice intensidad por
encima del umbral, función de la concentración (parafraseado), y *musk* es la peor etiqueta
por agrupar al menos cinco clases estructurales. El blog de Osmo (primaria, vía copia
archivada) coincide en primera persona: solo predicen sobre moléculas sueltas, y queda
pendiente saber cómo olerán combinadas. *Scientific American*, sin que se le preguntara a la
vez, recoge la misma admisión, parafraseada, en boca de una de las autoras del estudio.

### 4 · Cómo se dibujan regiones con honestidad

**KDE (densidad por núcleos) frente a envolvente (casco convexo).** Ninguna gana en todo. El
casco garantiza que todo punto real quede dentro de la línea —nunca esconde un dato— pero un
solo material atípico estira el borde entero y exagera el territorio, y no dice nada de la
densidad interior: una región llena y una vacía con el mismo borde se leen igual (es lo que
dibuja la imagen 2: los contornos se cruzan y anidan porque cada uno es un casco, no una
densidad). El KDE puede extender la mancha más allá de los puntos observados y tapar huecos
internos reales —el mismo defecto que mide la literatura de rangos de hábitat en ecología,
aplicado aquí por analogía, confianza media—; su ancho de banda es tan decisivo como la
perplejidad de t-SNE: demasiado ancho, todo se funde; demasiado estrecho, cada punto es su
isla. La propia quimioinformática usa KDE, no cascos, para marcar dónde un modelo de estructura
química es fiable —el «dominio de aplicabilidad» de un modelo QSAR, MolCompass entre otros,
confianza media-alta— el mismo problema exacto que el AOM: dónde hay materiales reales cerca
para fiarse del vecindario.

**Incertidumbre, cómo se dibuja** (Padilla, Kay y Hullman, «Uncertainty Visualization», 2022,
revisión académica; confianza media, vía resumen). Parafraseado: difuminación y transparencia
se puntúan como los canales más intuitivos para «cuánto me fío de esto»; una codificación
continua de probabilidad (degradado, violín) se juzga mejor que una barra de error dura.
Aplicado: el borde de una región puede desvanecerse —opacidad en degradado, isolínea de KDE
cada vez más tenue— justo donde escasean los materiales, en vez de una línea sólida que no
distingue «bien medido» de «con tres puntos de apoyo».

**La receta que ya pedía `06 §8` (conflicto 4), con método concreto (propuesta).** Base
continua: todos los materiales reales, siempre, como marca individual. Encima, una capa de
densidad KDE calculada siempre, sirva o no para nombrar nada todavía —el «cuánto hay cerca» del
dominio de aplicabilidad, no decoración. Encima de esa, solo donde la prueba de nombrado de
`06 §10` ya esté superada (70 % de acuerdo entre perfumistas), un contorno con nombre —casco o
isolínea alta, tintado a baja opacidad, desvanecido hacia el borde, nunca cortado en seco.
Mientras la prueba no se pase, la base sigue sin nombre: la salida que `06` ya proponía, con la
técnica que le faltaba.

### 5 · Dónde van los naturales (solo el lado visual)

El POM no modela mezclas ni naturales —solo molécula suelta con estructura definible (ya
establecido en el antecedente FIG-POM y confirmado aquí por el propio artículo)—; un absoluto,
un resinoide o una tintura (tabaco, láudano, estoraque, cade, ámbar gris) no tiene coordenada
nativa. Dos precedentes y una recomendación, del lado del dibujo, no de la ciencia (frente 7):

- **Sin coordenada, en capa o lista aparte.** La misma salida que `06 §8` (conflicto 3) ya
  preveía para la biblioteca entera: si la posición no se puede defender, no se inventa, se
  saca del mapa. Riesgo cero de falsear posición; coste: no aparece al explorar vecindad.
- **Posición aproximada, con signo distinto** (lo que pide la propia pregunta). Propuesta: si
  el laboratorio (frente 7) da una composición aproximada en moléculas conocidas, esa posición
  se calcula como el centroide de una fórmula (hallazgo 6) y se dibuja con la misma familia
  visual de lo derivado: marca hueca en vez de rellena (forma, canal preatentivo distinto,
  pieza 1), contorno discontinuo, color desaturado frente a un punto medido. Es la familia que
  `04 §7` ya reserva para un sello agregado y que Lupi (pieza 2) pide para cualquier hueco: una
  marca positiva de ausencia, nunca un punto igual a los demás ni un espacio vacío.
- **Precedente cartográfico (propuesta, razonamiento propio, sin cita puntual)**: un mapa
  antiguo marca el territorio no explorado con trama o tono claro, nunca en blanco liso —el
  blanco se lee como «no hay nada», la trama como «no se sabe» — la misma distinción que ya
  impone `§1.2`: lo desconocido no vale cero ni se pinta en verde, y tampoco se pinta igual.

**Recomendación (propuesta).** Por defecto, capa aparte sin coordenada para un natural sin
descomposición útil; solo con composición real del laboratorio, posición aproximada con la
marca hueca de arriba — que no debería «madurar» nunca a punto relleno: a diferencia de un
sintético que el modelo aún no ha visto, la posición de un natural es estimación permanente.

### 6 · Una fórmula en el mapa: punto, constelación o envolvente

La pregunta pide solo el dibujo, no el peso de cada material (eso lo reflexiona el usuario en
P34); aquí se trata como si el peso ya existiera, sea cual sea.

- **Punto único (centroide).** Promediar vectores para representar un conjunto es técnica
  corriente en visualización de espacios de significado (varias fuentes de aprendizaje
  automático convergen en ello para documentos como promedio de palabras; confianza media, sin
  autor canónico único). El riesgo lo confirman **dos fuentes independientes, sin que se les
  preguntara por el dibujo**: el propio POM admite que no da guía sobre cómo se combinan los
  estímulos (cita ya dada en el hallazgo 3); la literatura de mezclas de olor (revisiones
  convergentes, confianza media, ninguna primaria única) documenta supresión, enmascaramiento,
  hiper/hipoaditividad y percepción configural frente a la simple suma. Un punto relleno en el
  centroide, dibujado como un material real, es la opción más bonita y más engañosa: dice, sin
  decirlo, «la mezcla huele aquí», y puede ser sencillamente falso.
- **Constelación.** Cada material real de la fórmula en su propia posición, con marca de
  pertenencia (línea, halo compartido), sin inventar ningún punto. Nunca colapsa una medida
  real en una invención; cuesta espacio — 40 a 60 materiales son mucho para un solo vistazo.
- **Envolvente** (casco o mancha KDE) alrededor de los materiales de la fórmula: se lee como
  «de aquí saca su carácter», sin fingir que un punto es «el olor»; hereda el mismo compromiso
  casco/KDE del hallazgo 4.

**Convención para decir «esto es una estimación» (propuesta, cruzando el hallazgo 4 con `04
§7` y Lupi, pieza 2).** Cualquiera de las tres opciones debe evitar el círculo relleno liso de
un material real: marca abierta de forma distinta (estrella o rombo, no círculo — preatentivo,
pieza 1), opacidad reducida, contorno discontinuo. Es la regla del contorno punteado que `04
§7` ya usa para un sello agregado, aplicada al mapa. **Recomendación**: constelación por
defecto —la más honesta—, envolvente como resumen opcional con demasiados materiales, y el
centroide, si se ofrece, siempre hueco y discontinuo, nunca con aspecto de material medido.

### 7 · La concepción del usuario, aplicada

La imagen 8 confirma, de cerca, una textura de puntos densa con degradado de color, sin marca
de molécula individual visible a ese zoom — coherente con la lectura de «impresión, no valor
exacto» que ya daba la pieza 2 para la práctica de Bremer con conjuntos muy grandes: por encima
de cierto número de puntos, se agrega antes de dibujar y se acepta la impresión, no el dato
exacto.

**Sobre el solapamiento (*overplotting*)**, sin autor único pero con consenso convergente en
varias fuentes de referencia (confianza media-alta): tres soluciones, en orden creciente de
cuánto abstraen el dato. Transparencia parcial —el solapamiento se vuelve más tinta en el mismo
sitio, y el tono de cada zona pasa a reflejar la densidad real (parafraseado)— es la más barata
y la que menos inventa, porque cada punto sigue siendo real. Si no basta, agregación en rejilla
(hexágonos, no cuadrados) cambia el punto por un recuento honesto por celda. Si tampoco basta,
KDE continua —la misma herramienta del hallazgo 4— sustituye el recuento por una superficie.

**Aplicado a la app (propuesta).** El corpus de la app —biblioteca de cientos de materiales,
fórmula de 5 a 60— está muy por debajo de la escala (miles a cientos de miles) donde el POM u
Osmo necesitan agregar antes de dibujar. Puntos reales con transparencia sola debería bastar
para el mapa de biblioteca; hexbin o KDE solo harían falta con un atlas de fondo de miles de
moléculas posibles. Esa densidad de fondo, si se dibuja, es dato calculable (materiales reales
cerca) y debe tratarse como carga con las reglas del hallazgo 4 — no como textura decorativa
libre, que sí puede ser, sin conflicto, el punteado del propio glifo de un material (envoltura,
pieza 2).

---

## Aplicado a la app

### Reglas concretas, con su fuente

| Regla | Fuente | Confianza |
|---|---|---|
| Ningún eje del mapa se dibuja sin su número: % de varianza si es PCA; `n_neighbors`/`min_dist` o perplejidad, y un aviso de que no es varianza, si es UMAP/t-SNE | Distill 2016; Understanding UMAP 2019; scikit-learn docs | Alta |
| Tamaño de grupo y distancia entre grupos no se leen como dato en ningún método; solo la distancia dentro de los ejes retenidos de PCA es una distancia real | Distill 2016; Understanding UMAP 2019 | Alta |
| Motor por defecto: UMAP, por tener `transform` documentado y mejor estructura global que t-SNE; PCA como vista «cuánto se ve de verdad» permanente al lado, nunca sustituida | umap-learn docs; Understanding UMAP 2019 | Alta en los hechos; propuesta en la elección |
| Evitar t-SNE salvo necesidad concreta de estructura local que UMAP no resuelva; si hace falta, usar openTSNE o t-SNE paramétrico, nunca t-SNE de recálculo total | openTSNE docs (vía resumen); Van der Maaten 2009 (vía resumen) | Media |
| Fijar `random_state` en cada entrenamiento del mapa; versionar corpus + hiperparámetros + semilla como tres números independientes | umap-learn docs (reproducibilidad) | Alta en el hecho; propuesta en el esquema de versión |
| Probar el caso «familia estrecha anidada en familia amplia» (p. ej. muguet dentro de floral) antes de confiar el mapa de producción a UMAP | Understanding UMAP 2019, fallo documentado de contención | Alta |
| Todo mapa lleva, siempre, los puntos reales de fondo bajo cualquier región con nombre — nunca la región sustituye al dato | Imagen 4 (*Scientific American*, confirmada); `06 §8` | Alta |
| Región con nombre = casco o KDE de banda ancha honesta, desvanecida hacia el borde donde escasean los materiales; nunca un borde sólido en una zona con pocos puntos de apoyo | KDE vs. casco (dominio de aplicabilidad, quimioinformática); Padilla/Kay/Hullman 2022 | Media-alta |
| Nombre de región solo tras pasar la prueba de `06 §10` (70 % de acuerdo entre dos perfumistas); mientras tanto, base continua sin nombre | `06 §8` conflicto 4, ya vigente; aplicación con KDE, propuesta de esta pieza | Media |
| Un natural sin descomposición no recibe coordenada: capa o lista aparte, nunca un punto igual a los demás | Límite del POM (artículo, confirmado); `06 §8` conflicto 3, ya vigente | Alta en el límite; propuesta en la regla visual |
| Un natural con descomposición aproximada recibe una marca hueca, de forma distinta y contorno discontinuo — nunca «madura» a punto relleno | `04 §7` (ya vigente para el sello agregado); propuesta de esta pieza | Media |
| Una fórmula en el mapa nunca es un punto relleno igual a un material real; constelación por defecto, envolvente como resumen, centroide (si se ofrece) siempre hueco y discontinuo | Discusión del propio artículo del POM; revisión de percepción de mezclas; `04 §7` | Alta en el porqué; propuesta en el cómo |
| La densidad de fondo del mapa, si se dibuja, es carga (calculable, honesta); la textura de puntos de un solo glifo (imagen 8) es envoltura y puede ser libre | Hallazgo 7; pieza 2 (envoltura del visualizador) | Media |
| Con el corpus actual (cientos de materiales, fórmulas de 5-60), transparencia sola basta; hexbin/KDE de solapamiento solo si se añade un atlas de fondo con miles de moléculas | Consenso de práctica en *overplotting*; práctica de Bremer (pieza 2) | Media |

### Categorías de infografía: afinado, no una nueva

No sale una categoría nueva de esta pieza — las ocho de la pieza 2 se mantienen. Lo que se
afina son dos reglas transversales, ambas ancladas ya en la categoría 5 (**mapa posicional**):

1. **Leyenda de cobertura obligatoria**, con contenido fijo, no libre: varianza retenida si es
   PCA; hiperparámetros y aviso expreso de «esto no es varianza» si es UMAP o t-SNE. No basta
   con que exista una leyenda (ya lo pedía la pieza 2 para todo glifo nuevo); aquí su contenido
   mínimo queda fijado, calcado del que ya pone en su sitio la imagen 4.
2. **Dialecto visual de «estimado/derivado»**, reutilizable dentro y fuera de la categoría 5:
   marca hueca, forma distinta, contorno discontinuo, opacidad reducida — igual para un natural
   aproximado (hallazgo 5) y una fórmula en el mapa (hallazgo 6). Ya existía en germen en `04
   §7` y en Lupi (pieza 2); esta pieza le da especificación concreta y lo extiende al mapa.

**Frontera con la categoría 6 (red de relaciones), por descarte**: nada de lo encontrado aquí
—KDE, varianza, `transform`— se aplica a un diagrama de nodos y enlaces; esa categoría sigue
gobernada por Lima (pieza 2: árbol radial, *edge bundling*). Si mapa posicional y red llegan a
ser vistas conmutables (`06 §8`, pieza 2), solo la primera necesita leyenda de varianza; la
segunda necesita la suya propia (qué relación dibuja cada enlace), fuera del alcance de esta pieza.

---

## Discrepancias

- No se encontró una discrepancia real entre fuentes en los hallazgos centrales: Distill y
  Understanding UMAP convergen palabra por palabra en las mismas cinco lecciones; el POM y
  Osmo se confirman mutuamente sobre el límite de las mezclas sin que se les preguntara a la vez.
- **Matiz, no discrepancia**: una fuente secundaria dice que una varianza baja en las dos
  primeras componentes «no es motivo de alarma» por sí sola, mientras el resto de la evidencia
  (Distill, la honestidad de las imágenes 2 y 4) trata ese número como algo que advertir
  siempre. No se contradicen —puede seguir siendo útil y aun así hay que escribir el número—
  pero no leer la primera como permiso para omitir la segunda.

## No encontrado

- El número exacto de figura suplementaria del POM del que sale la imagen 2 (se infiere el
  origen por su título recortado y su vocabulario, no por lectura directa del pie original).
- Qué representación exacta da el 12 % de PC2 en el panel derecho de la imagen 2 (¿espacio POM?
  ¿etiquetas de entrenamiento?) — no se pudo confirmar contra el pie de figura original.
- Un único artículo primario, leído directamente, sobre la no linealidad de la percepción de
  mezclas de olor (se usó convergencia de revisiones secundarias, ninguna primaria única).
- El texto completo de Van der Maaten (2009) y de la documentación de openTSNE sobre su
  `transform()`: ambos se citan aquí solo por resumen de búsqueda, no por lectura directa.
- Si Osmo publicó el método o los parámetros exactos detrás de la imagen 7 — al llamarla ellos
  mismos «abstracta», es probable que nunca hubiera un método que publicar, pero no se encontró
  nota al respecto.

## Preguntas nuevas

- ¿Cuántos materiales tiene hoy la biblioteca real de la app? Si son pocas decenas, PCA solo
  —más simple, estable y honesto de rotular— podría bastar hasta que el corpus crezca lo
  suficiente para que la no linealidad de UMAP compense su coste de ingeniería.
- Cuando el frente 6/7 dé coordenadas reales para la paleta propia del usuario (no las 5 000
  moléculas del paper), ¿cuánta varianza capturan de verdad PC1+PC2 en *ese* corpus? Es una
  medida pendiente, no algo que se pueda asumir del artículo ajeno.
- ¿Vale la pena probar ya el caso «familia estrecha anidada en amplia» (muguet en floral) con
  datos sintéticos antes de comprometer el mapa de producción a UMAP?
- Si se adopta la constelación (hallazgo 6), ¿comparte el resaltado cruzado que la pieza 1 ya
  confirmó entre pirámide, reparto y proyección? Parece natural, pero es decisión de producto.
- ¿A partir de cuántos materiales reales deja de bastar la transparencia sola y hace falta
  hexbin o KDE? Ninguna fuente da un número universal; solo se resuelve probando con datos
  reales de la app.

## Fuentes

- Wattenberg, M., Viégas, F. y Johnson, I. (2016). «How to Use t-SNE Effectively». *Distill*. https://distill.pub/2016/misread-tsne/
- Coenen, A. y Pearce, A. (2019). «Understanding UMAP». Google PAIR. https://pair-code.github.io/understanding-umap/ y suplemento: https://pair-code.github.io/understanding-umap/supplement.html
- McInnes, L., Healy, J. y Melville, J. (2018). UMAP, documentación oficial: https://umap-learn.readthedocs.io/en/latest/transform.html y https://umap-learn.readthedocs.io/en/latest/reproducibility.html
- Sainburg, T., McInnes, L. y Gentner, T. (2020). «Parametric UMAP Embeddings…». https://arxiv.org/pdf/2009.12981 (mencionada por la propia documentación de UMAP; no leída entera)
- Van der Maaten, L. (2009). «Learning a Parametric Embedding by Preserving Local Structure». *AISTATS*. https://lvdmaaten.github.io/publications/papers/AISTATS_2009.pdf (vía resumen)
- openTSNE, documentación oficial: https://opentsne.readthedocs.io/ (vía resumen)
- scikit-learn — documentación de `PCA`: https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
- Lee, B. K., Mayhew, E. J. et al. (2023). «A Principal Odor Map Unifies Diverse Tasks in Olfactory Perception». *Science* 381(6661):999-1006. https://www.science.org/doi/10.1126/science.ade4401 · texto completo vía bioRxiv: https://www.biorxiv.org/content/10.1101/2022.09.01.504602v4.full
- Wiltschko, A. (2023). «Science Paper Shows Osmo AI Passes the Sniff Test». Osmo (blog) — leída vía copia archivada, la URL original ya no resuelve: https://web.archive.org/web/20250120080732/https://www.osmo.ai/blog/science-paper-shows-osmo-ai-passes-the-sniff-test
- Makin, S. (2023). «Machine Learning Creates a Massive Map of Smelly Molecules». *Scientific American*, dic. 2023. https://www.scientificamerican.com/article/machine-learning-creates-a-massive-map-of-smelly-molecules/
- «This Neural Net Maps Molecules to Aromas». *IEEE Spectrum*. https://spectrum.ieee.org/digital-smell (confirma el crédito de la imagen 7 a Osmo Labs)
- Kutepov, I. et al. (2024). «MolCompass…». *Journal of Cheminformatics*. https://jcheminf.biomedcentral.com/articles/10.1186/s13321-024-00888-z (vía resumen)
- Padilla, L., Kay, M. y Hullman, J. (2022). «Uncertainty Visualization» (vía resumen): http://space.ucmerced.edu/Downloads/publications/Uncertainty_Visualization_Padilla_Kay_Hullman_2022.pdf
- Percepción no lineal de mezclas de olor (revisiones convergentes, confianza media): «Developmental Switch From Elemental to Configural Processing…», PMC, https://pmc.ncbi.nlm.nih.gov/articles/PMC13439156/ ; «Biological constraints on configural odour mixture perception», *J. Exp. Biol.*, https://journals.biologists.com/jeb/article/225/6/jeb242274
- Wilke, C. — *Fundamentals of Data Visualization*, cap. «Overlapping points» (vía resumen): https://clauswilke.com/dataviz/overlapping-points.html
- Documentos internos ya citados y no repetidos: `docs/investigacion/2026-09-26-visualizacion-de-datos/1-fundamentos.md`, `2-rigor-y-estetica.md`; `docs/antecedentes/lenguaje-visual/2026-09-24-comparativa-ifra-fig-vs-pom.md`, `06-criba-lenguaje-pictorico.md`, `04-lenguaje-olfativo-visual.md`.

## Revisión (2026-09-26)

- **El tamaño del corpus cambió el mismo día.** Con P35, la base de la app es universal: el
  universo del FIG, 2588 CAS. Según la parte A del frente 6 del laboratorio, **2140 son
  moléculas sueltas con estructura**, las que el POM puede colocar, y 341 son naturales o
  mezclas, que ocupan 801 filas del FIG. El mapa trabajará con **miles de puntos**, no con
  cientos. Así que la transparencia sola probablemente no baste: el hexbin o el KDE del
  hallazgo 7 pasan a ser necesarios. Responde a la primera de las preguntas nuevas.
- **La capa aparte de los naturales** (hallazgo 5) no es un caso raro: es el 13 % de los CAS y
  el 26 % de las filas del FIG.
- Las citas cumplen la regla: una breve por fuente como mucho.
