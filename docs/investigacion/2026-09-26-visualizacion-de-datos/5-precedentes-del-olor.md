---
pieza: 5 · El olor ya dibujado
fecha: 2026-09-26
herramienta: subagente Sonnet con web
confianza: media
---

# El olor ya dibujado: precedentes aplicados a la app

## Resumen — lo que cambia para la app

1. **Las tres familias de ruedas (vino, café, perfume) comparten una misma arquitectura**: anillos
   concéntricos, general en el centro, específico en el borde, construidas por *free sorting* +
   análisis multivariante con un panel de expertos. Ninguna documenta con rigor de dónde salen sus
   colores; la única con una fuente que lo explica (café, 2016) confirma que son una elección de
   diseño gráfico —«rosa para dulce, pastel para medicinal»— no un dato medido ni un color natural.
   Esto **no** rescata inventar el color de P35 sin criterio: al contrario, obliga a declarar la
   convención y a preferir un anclaje con algo de respaldo (Spence, ya en los antecedentes) sobre
   inventar desde cero.
2. **El radar del QDA tiene el mismo defecto que ya midió Tufte para el radio de potencia (pieza
   1), ahora confirmado también para el área de un polígono**: crece con el cuadrado del valor, y
   además su forma cambia con el orden arbitrario de los ejes. La propia ciencia sensorial ya usa
   alternativas —tablas, barras, pequeños múltiplos, coordenadas paralelas— para el mismo dato.
3. **La imagen 1 es, confirmado, la Figura 1 de Sagar, Shanahan, Zelano, Gottfried y Kahnt (2023),
   *Nature Neuroscience*.** Su panel de barras mide **correlación de patrón** (una medida
   multivariante de si el patrón espacial de actividad distingue un olor de otro), no cuánto se
   activa una región. Son dos preguntas distintas y confundirlas es el error exacto que esta pieza
   debe evitar en cualquier gráfico futuro de la app.
4. **La pirámide olfativa no es un horario: todo se evapora desde el segundo cero.** Su origen
   documentado es la escala de Poucher, un corte administrativo (1-14 / 15-60 / 61-100) sobre una
   escala continua de volatilidad — exactamente el dato que la app ya calcula de forma continua.
   Las barras de acordes de Fragrantica son votos acumulados de usuarios, no medida química.
5. **Nada de lo encontrado hace lo que quiere hacer la app** (un glifo por material más un mapa
   navegable de una biblioteca entera, con la incertidumbre declarada). Lo más cercano se reparte
   en tres precedentes distintos que no se combinan entre sí: un sensor comercial que ya dibuja un
   radar de «huella olfativa» por muestra (Aryballe), un proyecto europeo que estructura el olor
   como dato a escala de patrimonio (Odeuropa) y el propio POM (piezas 3-4). Esa combinación sigue
   siendo el hueco real de la app.
6. **No sale una categoría de infografía nueva.** Las ocho de las piezas 2-4 se mantienen; esta
   pieza afina reglas de operación dentro de las categorías 2 (pirámide), 3 (sello/color) y 6 (red
   de relaciones/conjunto cerrado nombrado).

---

## Hallazgos

### 1 · Ruedas de aromas y sabores

**Construcción — las tres comparten arquitectura** (confianza alta en la estructura, converge en
múltiples fuentes independientes por rueda).

| Rueda | Autor / año | Anillos | Método de construcción |
|---|---|---|---|
| Vino | Ann Noble, UC Davis, 1984 | 3: general (centro) → específico (borde); 12 categorías de primer nivel, 20 de segundo | Recopilación de listas publicadas + términos de estudios de análisis descriptivo y de su propio curso de sensorial; **sin** *free sorting* documentado en el origen |
| Café | SCAA original (Ted Lingle, 1995) → rediseño SCA/World Coffee Research, 2016 | 3: general → específico | *Free sorting* de 72 expertos + análisis multivariante jerárquico (ya en antecedentes); léxico de 110 atributos con referencia física reproducible, desarrollado en Kansas State (Chambers) y validado en Texas A&M (Miller) |
| Perfume | Michael Edwards, 1983 (revisada 1992, 1998, 2021) | 1: 4 familias + 14 subfamilias, dispuestas como una rueda de color donde las vecinas combinan | Clasificación editorial de un solo autor sobre perfumes terminados, sin panel documentado ni *free sorting* — la más subjetiva de las tres |

Fuente: Wine Enthusiast, IntoWine, Wikipedia (Ann C. Noble); Daily Coffee News (2016), Chambers et
al. (2016), *J. Sensory Studies*; Wikipedia (*Fragrance wheel*), Fragrances of the World. Confianza
alta en fechas y autoría; media en el detalle metodológico de Edwards (no se encontró fuente
primaria suya sobre el proceso, solo reseñas convergentes).

**¿De dónde salen los colores de la rueda del café?** (confianza media, fuente única: la propia web
del estudio de diseño que la rediseñó, One Darnley Road). No derivan de un dato medido ni del color
natural del alimento: es una asociación deliberada de diseño gráfico entre familia de tono y
categoría de sabor — «pink tones... "sweet"... pastel shades... "medicinal"» (parafraseado; sin
cita textual verificable palabra por palabra en fuente primaria de SCA/WCR, que no publica la
lógica cromática). **No encontrado**: ninguna fuente primaria de SCA o WCR explica el porqué de
cada color; el testimonio viene solo del estudio de diseño contratado.

**¿Y las de vino y perfume?** **NO ENCONTRADO.** Ninguna fuente consultada explica la lógica
cromática del anillo de Ann Noble ni de la rueda de Edwards; lo que se observa (frutas en tonos
cálidos, floral en rosas/violetas) parece guiarse por el color habitual del referente —una manzana
roja, una flor rosa— sin que ninguna fuente lo declare como regla. Confianza baja, es lectura propia
de las imágenes públicas de ambas ruedas, no una cita.

**¿Funcionan?** (confianza media, converge en dos fuentes independientes sobre el vino).
Investigación citada por Wine Enthusiast/ResearchGate: los términos del vocabulario **no son
exclusivos del olfato** —son metáforas tomadas de otros dominios (fruta, madera, animal)— y un
novato puede no saber qué significan sin entrenamiento previo. Ninguna fuente encontrada mide si
usar la rueda mejora la *precisión* perceptiva de quien la usa frente a no usarla; lo que sí
documentan, convergente en varias fuentes, es que **estandariza la comunicación entre
profesionales** y sirve para entrenar principiantes. Es, en términos de la pieza 1, una tarea de
`identify`/`summarize` compartido entre personas, no una prueba de exactitud individual. El método
de construcción moderno (*free sorting* + multivariante) sigue siendo, en 2025, el estándar para
crear ruedas nuevas — un artículo reciente sobre vinos dulces italianos (De Santis et al., 2025,
*J. Sensory Studies*) y otro sobre aguardientes de orujo (RATA+CATA+UFP, *Beverages*, 2025) repiten
la misma receta, confirmando que no ha cambiado desde el café de 2016.

**Aplicado a la categorización propia del usuario (P35) y su color (propuesta, cruzando con Ware y
Spence ya establecidos en piezas 1 y en los antecedentes).**

- Adoptar la arquitectura de anillo general→específico —converge en las tres ruedas y ya la pide
  `06 §8` (conflicto 4) como capa de nombres sobre un espacio continuo—, construida por *free
  sorting* con perfumistas reales, no por decreto de un solo autor (evita el punto débil de
  Edwards).
- Un color por familia amplia (anillo central), nunca por subcategoría: gastar tono en el segundo
  anillo repetiría el mismo canal integral dos veces (`06`, pieza 1), y además ninguna de las tres
  ruedas estudiadas lo hace — todas colorean solo el anillo general.
- Techo de 8-12 colores categóricos (Ware, ya fijado en pieza 1); si P35 tiene más familias que eso,
  el sobrante va sin color propio, agrupado bajo un tono «otros».
- Anclar el color, cuando se pueda, en las correspondencias olor→color de Spence/Demattè que ya
  recoge el antecedente (fresa→rojo, limón→amarillo, almizcle→marrón) en vez de inventar una
  asociación nueva sin ningún dato detrás, como hizo el estudio de diseño del café. Si no hay
  correspondencia validada para una familia, declarar el color como convención pura en la leyenda
  — igual que ninguna de las tres ruedas estudiadas se molesta en declarar la suya, la app puede
  hacerlo mejor sin coste real.
- Disponer las familias adyacentes por afinidad perceptiva, como ya hace Edwards a propósito
  («combinan bien»): aprovecha la misma lectura de vecindad que después reutilizaría un mapa de
  posición, sin inventar una regla nueva.

---

### 2 · Los perfiles sensoriales: el radar del QDA

**El defecto, con la cifra que faltaba** (confianza alta, dos fuentes independientes convergentes:
Scott Logic, 2011, y el consenso recogido por Observable/data-to-viz). El área de un polígono radar
depende del **orden arbitrario de los ejes** —reordenar categorías cambia la impresión visual sin
cambiar el dato— y, además, **el área crece con el cuadrado del valor**, no linealmente: «a small
difference in values» se percibe como una diferencia mucho mayor (parafraseado). Es, con otra
figura, el mismo defecto de Tufte que la pieza 1 ya midió para el radio de `power` — no una
coincidencia: cualquier canal que convierte una magnitud lineal en una superficie hereda el mismo
sesgo cuadrático, sea un círculo o un polígono de muchos vértices.

**Lo que ya usa la propia ciencia sensorial en su lugar** (confianza media-alta, converge con lo ya
citado en los antecedentes sobre TDS/T-I). La bibliografía de visualización general recomienda,
para el mismo dato: tablas (las más claras para pocos casos), barras, pequeños múltiplos (un
polígono por muestra, nunca superpuestos) y **coordenadas paralelas** —descritas literalmente como
«una versión desenrollada de un radar»—, que evitan el efecto de área a cambio de perder la
sensación de «forma cerrada» que sí tiene un radar.

**Un precedente comercial que sigue usando el radar, con la misma salvedad que ya fijó la pieza 2**
(confianza alta, fuente primaria del propio fabricante). Aryballe, un sensor de «nariz digital»
usado en control de calidad industrial, dibuja la huella olfativa de una muestra como un radar y lo
documenta así: «the radar chart represents the olfactive signatures of samples» y se usa para ver
si dos formas «se superponen» (más parecidas) o «divergen» (huelen distinto) — es decir, lo usan
para **juicio de similitud de forma entre dos muestras**, no para leer un área como cantidad total.
Es exactamente el uso que la pieza 2 ya autorizaba (un material, o dos por superposición con tabla
de deltas), confirmado ahora por un producto industrial real, no solo por la teoría.

**Aplicado al radar de la imagen 1.** Es un QDA con **21 escalas semánticas**, dos moléculas, tres
sujetos superpuestos por color — el caso exacto que la crítica señala como más arriesgado (varias
series por área, sin tabla de deltas al lado). Se salva de ser mala práctica por dos razones que
hay que copiar: **el orden de los ejes es fijo** entre las dos moléculas (no se reordena para
favorecer ninguna), y el radar **no es el instrumento estadístico del artículo** — la evidencia real
del paper vive en el panel de correlación de patrón (§3), el radar es solo ilustración cualitativa
de que dos moléculas huelen distinto y de que los sujetos varían entre sí. Aplicado al sello de la
app: un radar por material, nunca leído por área entre materiales; si se comparan dos, superposición
a baja opacidad más tabla de deltas (ya fijado en pieza 2), con el orden de ejes idéntico y
documentado siempre — cambiarlo de un material a otro sería la misma trampa que ya describe Scott
Logic.

---

### 3 · La figura de neurociencia de la imagen 1

**Origen, confirmado por lectura directa** (confianza alta). Es la **Figura 1** de Sagar, K.,
Shanahan, L. K., Zelano, C. M., Gottfried, J. A. y Kahnt, T. (2023), «High-precision mapping reveals
the structure of odor coding in the human brain», *Nature Neuroscience* 26, 1595-1602. El propio
texto titula la figura: «Neural activity patterns in olfactory brain areas represent odor stimuli»
(parafraseado del pie). El estudio completo usó **160 olores por sujeto** y **3 sujetos**, con
27-30 ensayos por olor y 18 horas de resonancia por persona — el radar de la imagen 1 (dos moléculas,
21 escalas) es una muestra ilustrativa de la tarea, no el conjunto entero de datos.

**Qué mide cada panel, y la distinción que pide la pregunta** (confianza alta, con cita textual del
propio artículo). El panel de barras (**d**) se titula «Pattern correlation same − different odors
(Δr)» y mide, según el propio texto, que los patrones de muchos vóxeles se parecen más entre
respuestas al mismo olor que entre respuestas a olores distintos: es una medida de **similitud
representacional** (RSA): si el patrón espacial de actividad entre muchos vóxeles de una región
permite distinguir un olor de otro de forma fiable entre sesiones. **No** es una medida de cuánto se
activa la región en promedio (amplitud/BOLD medio): una región podría mostrar mucha discriminación
de patrón con poca activación media, o al revés — son preguntas distintas, y el artículo las trata
como análisis separados (correlación de patrón frente a modelos de codificación por voxel). El
panel **c** es el atlas de regiones: **PirF** (piriforme frontal) y **PirT** (piriforme temporal,
la misma corteza piriforme dividida en dos zonas), **AMY** (amígdala), **OFC** (corteza
orbitofrontal), **A1** (corteza auditiva, como control de que el efecto es específico del olfato) y
**wm** (materia blanca, control de tejido sin señal esperada). El panel **a** es el diseño de la
tarea (fijación, «Sniff», «¿Olor?», valoración en escala de un descriptor como «¿Floral?»).

**Cómo se dibujan las regiones del cerebro en figuras científicas — solo el lado del dibujo**
(confianza media-alta, convención observada de forma consistente en esta figura y generalizable por
práctica estándar del campo, sin una única fuente que la codifique como regla escrita). El patrón
habitual: una vista sagital con las regiones de interés (ROI) coloreadas como máscaras sobre una
resonancia estructural real (no esquemática), acompañada de varios cortes axiales «en sello de
correos» que confirman la misma ROI desde otro ángulo, con una leyenda de color fija por región. Es
el mismo principio de Tufte de «lectura micro y macro» (pieza 1): la vista sagital da el conjunto,
los cortes axiales el detalle exacto de qué vóxeles se incluyeron. No hay 3D real, ni siquiera aquí,
donde tres dimensiones estarían justificadas por Munzner (pieza 1, «percibir forma en datos
espaciales reales») — la ciencia dura sigue prefiriendo cortes 2D con color plano.

**Aplicado a la app (fuera del contenido neurocientífico, que investiga aparte el frente 7).** Si
algún día la app dibuja «qué activa un olor», la lección de dibujo es doble: primero, declarar
siempre explícitamente si el número que se muestra es una **magnitud** (cuánto) o una
**discriminabilidad de patrón** (si distingue A de B) — son ejes de Munzner distintos (`qué` tipo de
dato) y mezclarlos en una sola palabra («activación») sería el error exacto que aquí se evita mirando
el pie de figura completo. Segundo, la convención de «región coloreada + barra cuantitativa al lado»
es reutilizable sin dibujar ningún cerebro: es la misma estructura que ya usa la pirámide de la app
(posición categórica coloreada) junto a una lectura numérica al pasar el ratón (`§10.2`) — confirma
un patrón general de la ciencia, no algo que la app necesite inventar copiando un corte de resonancia.

---

### 4 · Cómo enseña la industria un perfume: la pirámide, Fragrantica, las notas

**El origen de la pirámide no es una metáfora vacía: es un corte administrativo sobre una escala
real, hoy simplificado en exceso** (confianza alta, converge en Wikipedia y una fuente secundaria
independiente). W. A. Poucher clasificó cerca de 330 materiales de perfumería en un **coeficiente de
evaporación de 1 a 100**, por evaluación subjetiva de la duración relativa; los cortes en **14** y en
**60** separan top (1-14), middle (15-60) y base (61-100). Son puntos de corte administrativos sobre
una escala continua, no tres categorías químicas naturales. El concepto de pirámide, como diagrama de
marketing, se popularizó a comienzos del siglo XX (con François Coty entre los primeros, confianza
media, una sola fuente).

**Todo se evapora desde el segundo cero** (confianza media-alta; la fuente principal es un blog de
2026, pero coincide palabra por palabra con lo que ya recoge Wikipedia en *Note (perfumery)* sobre
la ausencia de una variable temporal real en la ecuación de presión de vapor). Lo que se percibe como
«llegada» de una nota de fondo horas después no es una aparición: es que las notas más volátiles ya
se disiparon y dejaron de enmascararla. La pirámide es, en esta lectura, un **diagrama de agotamiento
continuo**, no un horario — y el propio uso original de Jean Carles en los años 40 era una
**disciplina de banco de trabajo** (fijar primero el material lento porque no se puede corregir
después, añadir el volátil barato al final porque es fácil de ajustar), no una descripción de cómo
huele la mezcla para quien la lleva puesta.

**Fragrantica: de dónde salen sus barras, y qué NO son** (confianza media, fuente secundaria
especializada —osmetheca.be, dos guías críticas dedicadas— no la propia Fragrantica, que no publica
su metodología). Las barras de color de notas y acordes son un **agregado de votos de usuarios
acumulados durante años**, mezclados sin distinguir siempre con la lista que publicó la marca en el
lanzamiento; no proceden de análisis cromatográfico ni de la fórmula real. El tamaño de muestra es
invisible: una nota votada por 12 personas se dibuja igual que una votada por 800. El gráfico de
«acordes principales» es una agregación algorítmica de votos en familias, no una medida química. La
estructura en tres niveles (salida/corazón/fondo) tampoco deriva de volatilidad medida: una nota como
el jazmín puede caer en un nivel u otro según la concentración, y algunas fichas no muestran capas en
absoluto si la marca nunca comunicó una.

**Qué aguanta y qué engaña, resumido.**

| Convención | Aguanta / engaña | Por qué |
|---|---|---|
| Que lo más volátil domine la primera impresión y lo pesado la última | **Aguanta** | Física real de presión de vapor — el mismo dato que la app ya usa para posición y duración |
| Que existan tres bloques discretos con frontera nítida | **Engaña** | Corte administrativo de Poucher sobre una escala continua, no una categoría natural |
| Que una nota «aparezca» con el tiempo | **Engaña** | No aparece nada: se desenmascara al disiparse lo volátil |
| La longitud de la barra de Fragrantica como presencia/cantidad de un ingrediente | **Engaña** | Es consenso de voto, no medida; tamaño de muestra invisible |
| Usar la pirámide para comunicar con el vocabulario del perfumista (salida/corazón/fondo) | **Aguanta como lenguaje**, no como frontera exacta | Es la misma recomendación que ya hace `06 §4` sobre Munsell: notación continua, nombres encima |

**Aplicado a la pirámide de la app (propuesta, cruzando con `§1.2` y con la pieza 3).**

- Mantener la posición continua 0-1 que la app ya calcula (README) — es más honesta que el corte de
  Poucher, no hay que retroceder a tres bloques fijos.
- Si se etiquetan zonas «salida/corazón/fondo» para hablar el idioma del perfumista, dibujar la
  frontera **desvanecida**, no una línea dura — la misma regla que la pieza 3 ya fija para el borde
  de una región de mapa con pocos puntos de apoyo, aplicada aquí a la propia arbitrariedad del corte
  administrativo, no a la falta de datos.
- No usar el verbo «aparece» ni implicar orden temporal de llegada en ningún texto de ayuda: la
  posición en la pirámide es volatilidad relativa, no una promesa de secuencia.
- Cualquier barra que agregue opiniones o usos (por ejemplo, el «nivel de uso habitual» que P34 ya
  ha añadido como campo) debe mostrar su tamaño de muestra o confianza junto a la barra, nunca solo
  la barra — la lección exacta del fallo de Fragrantica, y coherente con la regla ya vigente de que
  todo número lleva su base (`§1.1`).
- No adoptar ningún mecanismo de voto de comunidad: la app parte de mg reales, no necesita una capa
  de consenso agregado para decidir qué mostrar.

---

### 5 · El olor en el arte, los museos y la divulgación

**Más allá de Kate McLean, ya cubierta en `06`** (confianza alta salvo donde se indica).

| Precedente | Qué hace | Visualiza o evoca | Relevancia para la app |
|---|---|---|---|
| Victoria Henshaw, *Urban Smellscapes* (2013) y «Smelly Maps» (Quercia, McLean et al., 2015, arXiv) | Acuñó «smellscape» y el método del *smellwalk*; con McLean, estimó el paisaje de olor de varias ciudades **minando texto de redes sociales** a escala, no solo con paseos guiados | Mapa derivado de datos de texto, a escala algorítmica | Es el precedente más cercano a «derivar un mapa de olor de datos masivos» (`derive`, Munzner, pieza 1) en vez de solo dibujar percepción directa — pero de una ciudad, no de un material |
| Sissel Tolaas, NASALO y el archivo de 10.000 moléculas | Léxico propio (~4200 términos) construido desde química real, expuesto como experiencia olfativa directa (Astrup Fearnley Museet, 2021; ICA Philadelphia, 2022) | Evocación, casi nunca dibujo — el olor se huele, no se grafica | Confirma, desde el arte, la misma receta que `06` ya recomienda para P35: vocabulario derivado empíricamente, no inventado |
| Institute for Art and Olfaction (IAO), Los Ángeles | Educación y comunidad; Open Source Scent Initiative, una base de datos abierta de perfumería | Archivo, no visualización | Precedente de infraestructura abierta, no de lenguaje gráfico |
| Jorge Otero-Pailos, *An Olfactory Archive* (2013) y la reconstrucción de la Glass House (2008) | Reconstruye olores históricos de arquitectura con un perfumista (Rosendo Mateu) | Evocación pura — sin bottles, sin gráfico | Recuerda que existe una tradición seria que **rechaza** cualquier apoyo visual para el olor |
| *The Art of Scent 1889-2012*, Chandler Burr, Museum of Arts and Design (2012) | Doce perfumes expuestos sin frascos, sin marca, sin ningún dato visible — solo aire perfumado por nicho en la pared | Cero visualización, deliberadamente: «I'm opposed to the photon» (cita literal, 5 palabras) | El extremo opuesto exacto a lo que la app quiere construir — útil como aviso: parte del público experto puede desconfiar de cualquier diagrama que pretenda sustituir el propio olor |
| *Perfume: A Sensory Journey*, Somerset House (2017) | Diez perfumes en salas temáticas con referencias visuales, sonoras y táctiles, sin frascos | Ambientación multisensorial, no datos | No se encontró (**NO ENCONTRADO**) ningún componente de visualización de datos en esta exposición pese a la búsqueda dirigida |
| Odeuropa (proyecto europeo, 2021-2023) | IA que extrae menciones de olor de 43.000 imágenes y 167.000 libros históricos (1600-1920); construye un grafo de conocimiento con 2,5 millones de «experiencias de olor» y un buscador, el *Smell Explorer* | Base de datos estructurada y consultable, con herramientas para museos | El precedente más cercano a la ambición de fondo del AOM: tratar el olor como **dato estructurado a gran escala**, aunque a escala de patrimonio cultural, no de materia prima de perfumería |
| Aryballe (sensor comercial, ya en §2) | Traduce lecturas de un sensor químico en una «huella» por muestra, mostrada como radar | Visualización real de datos de instrumento, por muestra | El precedente comercial más cercano al «sello» de un material: dato real, un glifo por muestra, ya aceptado por usuarios no científicos |

**Veredicto (propuesta de esta pieza).** Ningún precedente encontrado combina las tres piezas que la
app junta: **un glifo por material** (más cercano a Aryballe), **una biblioteca navegable con
posición honesta** (más cercano al POM/Osmo, piezas 3-4) y **un vocabulario cerrado derivado
empíricamente y nombrado** (más cercano a Tolaas/NASALO y a las ruedas de café/vino de §1). La
tradición del arte olfativo puro (Otero-Pailos, Burr, Somerset House) tira en la dirección contraria
—nada de datos, solo experiencia— y conviene tenerla presente como el extremo que la app **no**
persigue, pero que parte de su público puede esperar por costumbre.

---

## Aplicado a la app

### Reglas concretas

| Regla | Categoría afectada | Fuente | Confianza |
|---|---|---|---|
| Un color por familia amplia (anillo central de P35), nunca por subcategoría; techo de 8-12, ideal ~8 | 3 · Sello | Ware (pieza 1); las tres ruedas (ninguna colorea el segundo anillo) | Alta |
| Anclar el color en correspondencias con algún respaldo (Spence/Demattè) antes que inventar una asociación arbitraria; declarar como convención donde no la haya | 3 · Sello | Antecedente `sistemas-de-codificacion-del-olor.md`; contraste con el café (color de diseño puro) | Media |
| Construir el anillo/vocabulario de P35 por *free sorting* con perfumistas reales + clustering, no por decreto de un solo autor | 6 · Red de relaciones | Café 2016, vino/perfume como contraste; ya recomendado en `06 §8` | Alta |
| Un radar = un material; comparar varios solo por superposición a baja opacidad + tabla de deltas, con el orden de ejes fijo entre materiales | 3 · Sello | Scott Logic (2011); Aryballe (uso real); ya fijado en pieza 2 | Alta |
| Nunca leer el área de un radar o de un círculo como el dato: ambos crecen con el cuadrado del valor mostrado | 3 · Sello; 2 · Iconográfica | Scott Logic (2011); Tufte vía pieza 1 (mismo defecto, otra figura) | Alta |
| Mantener la posición de la pirámide continua 0-1; si se etiquetan zonas de perfumista, frontera desvanecida, no línea dura | 2 · Iconográfica | Poucher (vía Wikipedia + blog convergente); regla ya vigente en pieza 3 para bordes de mapa | Media-alta |
| Ningún texto de ayuda debe implicar que una nota «aparece» en el tiempo: todo se evapora desde el inicio, lo que cambia es qué se percibe por encima de qué | 2 · Iconográfica | *Note (perfumery)*, Wikipedia; blog convergente | Media-alta |
| Cualquier barra agregada (uso habitual, popularidad) lleva su tamaño de muestra o confianza visible, nunca solo la barra | 2 · Iconográfica; metadato | Crítica a Fragrantica (osmetheca.be) | Media |
| No adoptar voto de comunidad como sustituto de dato real: la app ya tiene mg medidos | Transversal | Contraste con Fragrantica | Alta en el principio; propuesta en la aplicación |
| Al dibujar «región + magnitud» (si algún día se visualiza actividad cerebral u otro dato regional), declarar explícitamente si el número es magnitud o discriminabilidad de patrón | Fuera de las 8, aviso general | Sagar et al. (2023), cita directa | Alta |

### Categorías de infografía: sin categoría nueva, tres afinadas

Como ya ocurrió en la pieza 3, **no sale una categoría nueva** de este material — las ocho de las
piezas 2-4 se mantienen intactas. Lo que se afina:

1. **Categoría 2 (iconográfica ligada a datos — pirámide):** el corte salida/corazón/fondo, si se
   dibuja, es una capa de nombres desvanecida sobre un dato continuo, nunca una partición dura; y
   cualquier agregado de opinión lleva su tamaño de muestra visible.
2. **Categoría 3 (sello):** el radar hereda formalmente el mismo defecto de área que ya corrigió
   `06`/pieza 1 para el radio de potencia — mismo principio, ahora con literatura propia del propio
   tipo de gráfico, no solo por analogía geométrica.
3. **Categoría 6 (red de relaciones / conjunto cerrado nombrado):** las tres ruedas estudiadas son,
   con otras palabras, la misma receta que `06 §8` (conflicto 4) ya pedía —base continua, capa de
   nombres encima, derivada por *free sorting*—, ahora confirmada por tres industrias adyacentes
   (vino, café, perfume) en vez de solo por la teoría de codificación visual.

---

## Discrepancias

- **Ninguna discrepancia real entre fuentes** en los hallazgos centrales de esta pieza: Scott Logic
  y el consenso de Observable/data-to-viz coinciden en el mismo defecto del radar; Wikipedia y el
  blog sobre Poucher convergen palabra por palabra en la misma cronología y las mismas cifras
  (14/60); las dos guías de osmetheca.be sobre Fragrantica se confirman entre sí.
- **Matiz, no discrepancia:** la fuente sobre el origen del concepto de pirámide (siglo XIX,
  popularizado por Coty) tiene solo un respaldo medio, sin verificación cruzada con una segunda
  fuente independiente que dé la misma fecha exacta.

## No encontrado

- La lógica cromática de la rueda del vino (Ann Noble) y de la rueda de Edwards: ninguna fuente
  primaria consultada la explica; solo se pudo observar el resultado, no el porqué.
- Una fuente primaria de SCA/World Coffee Research (frente a la del estudio de diseño contratado)
  que confirme la asociación color-sabor de la rueda del café de 2016.
- Un estudio que mida directamente si usar una rueda de aromas mejora la exactitud perceptiva de
  quien la usa, frente a solo mejorar la comunicación entre quienes ya la conocen.
- El texto íntegro de *Note (perfumery)* de Wikipedia y del blog de Première Peau no se contrastaron
  contra una fuente académica primaria sobre cinética de evaporación de mezclas de perfumería; se
  citan por convergencia entre dos fuentes secundarias, no por lectura de un artículo de físico-química.
- No se pudo leer completa la columna de Fragrantica «Olfactory Pyramid or Perfumer's Nightmare»
  (bloqueada, error 403 al intentar el acceso directo): se cita solo por el resumen que devolvió la
  búsqueda, con confianza más baja que el resto de esta sección.
- Ningún componente de visualización de datos en la exposición de Somerset House (2017) pese a
  búsqueda dirigida — puede no haberlo, o no estar documentado en las fuentes en inglés consultadas.
- Documentación técnica completa de Aryballe sobre los ejes exactos de su radar (qué sensores, qué
  escala): solo se confirmó que usan un radar y para qué lo usan, no el detalle de construcción.

## Preguntas nuevas

- Si P35 deriva su vocabulario por *free sorting* con perfumistas reales (como recomienda `06 §11` y
  confirma esta pieza), ¿quién sería el panel — el propio usuario en solitario, o hace falta reclutar
  a otros perfumistas para que el conjunto de nombres no sea idiosincrásico de una sola persona?
- ¿Vale la pena, antes de fijar el color de las familias de P35, hacer la prueba de lectura inversa
  que ya propone `06 §10` pero solo para el canal de color — enseñar el color solo, sin el resto del
  sello, y ver si un perfumista adivina la familia?
- ¿La app quiere en algún momento un modo «lenguaje de perfumista» explícito, con las tres zonas de
  la pirámide nombradas, o prefiere quedarse siempre en la posición continua sin traducir a
  salida/corazón/fondo?
- Odeuropa estructura el olor como grafo de conocimiento a partir de texto e imágenes históricas:
  ¿tiene sentido, más adelante, cruzar su base abierta con las fichas de materiales del laboratorio
  para el nombre histórico o literario de una familia, o es una distracción fuera del alcance actual?
- ¿Compensa evaluar Aryballe u otro sensor de olfato digital como fuente futura de datos reales de
  material (frente 6/7), ahora que se confirma que ya producen un vector medido por muestra?

## Fuentes

- Wine Enthusiast — «How Ann Noble and the Wine Aroma Wheel Revolutionized the Industry»: https://www.wineenthusiast.com/culture/wine/wine-aroma-wheel/
- IntoWine — «Q&A with Ann Noble, Inventor of the Aroma Wheel»: https://www.intowine.com/qa-ann-noble-inventor-aroma-wheel
- Wikipedia — «Ann C. Noble»: https://en.wikipedia.org/wiki/Ann_C._Noble
- winearomawheel.com — «About» y «Ann Noble Wine Aroma Wheel»: https://www.winearomawheel.com/about.html · https://www.winearomawheel.com/ann-noble-wine-aroma-wheel.html
- ResearchGate — «How Robert Parker's 90+ and Ann Noble's Aroma Wheel Changed the Discourse of Wine Tasting Notes»: https://www.researchgate.net/publication/329649652
- Daily Coffee News (2016) — «SCAA Unveils a Whole New Coffee Taster's Flavor Wheel»: https://dailycoffeenews.com/2016/01/19/scaa-unveils-a-whole-new-coffee-tasters-flavor-wheel/
- One Darnley Road — «SCAA Flavor Wheel»: https://www.onedarnleyroad.com/work/scaa-flavor-wheel
- Chambers, E. et al. (2016). «Development of a "living" lexicon for descriptive sensory analysis of brewed coffee». *Journal of Sensory Studies*. https://onlinelibrary.wiley.com/doi/10.1111/joss.12237
- World Coffee Research — «Sensory Lexicon»: https://worldcoffeeresearch.org/resources/sensory-lexicon
- Wikipedia — «Fragrance wheel»: https://en.wikipedia.org/wiki/Fragrance_wheel
- Sagar, K., Shanahan, L. K., Zelano, C. M., Gottfried, J. A. y Kahnt, T. (2023). «High-precision mapping reveals the structure of odor coding in the human brain». *Nature Neuroscience* 26, 1595-1602. https://www.nature.com/articles/s41593-023-01414-4 · texto completo: https://pmc.ncbi.nlm.nih.gov/articles/PMC10726579/
- Scott Logic (2011) — «A Critique of Radar Charts»: https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts.html
- Observable — «Why you should avoid radar charts in data visualization»: https://old.observablehq.com/blog/avoid-radar-charts
- data-to-viz.com — «The Radar chart and its caveats»: https://www.data-to-viz.com/caveat/spider.html
- Aryballe — «Digital Olfaction for Odor Sensing»: https://aryballe.com/digital-olfaction-for-odor-sensing/ · Aryballe Suite (radar): https://aryballe.helpjuice.com/usermanual/aryballe-suite
- Wikipedia — «Note (perfumery)»: https://en.wikipedia.org/wiki/Note_(perfumery)
- Première Peau (Saunier, M., 2026) — «Scent Notes: What the Fragrance Pyramid Hides»: https://premierepeau.com/blogs/news/scent-notes-fragrance-pyramid-guide
- Fragrantica — «Olfactory Pyramid or Perfumer's Nightmare» (acceso bloqueado, citado vía resumen de búsqueda): https://www.fragrantica.com/news/Olfactory-Pyramid-or-Perfumer-s-Nightmare-8810.html
- Osmetheca — «How to read the notes list on Fragrantica?»: https://www.osmetheca.be/en/faq/olfactive-pyramid/how-to-read-the-notes-list-on-fragrantica · «How to read a Fragrantica entry, a critical reading in 9 points»: https://osmetheca.be/en/guides/how-to-read-a-fragrantica-entry
- Henshaw, V. (2013). *Urban Smellscapes*. Reseñado vía: https://www.tandfonline.com/doi/full/10.1080/2325548X.2014.919152
- Quercia, D., Aiello, L. M., Schifanella, R. y McLean, K. (2015). «Smelly Maps: The Digital Life of Urban Smellscapes». arXiv: https://arxiv.org/pdf/1505.06851
- Wikipedia — «Sissel Tolaas»: https://en.wikipedia.org/wiki/Sissel_Tolaas · Astrup Fearnley Museet, «RE________»: https://www.afmuseet.no/en/exhibitions/sissel-tolaas-re________/
- Wikipedia — «The Institute for Art and Olfaction»: https://en.wikipedia.org/wiki/The_Institute_for_Art_and_Olfaction
- Wikipedia — «Jorge Otero-Pailos»: https://en.wikipedia.org/wiki/Jorge_Otero-Pailos · Archpaper, «An Olfactory Archive»: https://www.archpaper.com/2013/10/on-view-an-olfactory-archive-something-smells-at-the-california-college-of-the-arts/
- Museum of Arts and Design — «The Art of Scent»: https://madmuseum.org/exhibition/art-scent · Smithsonian Magazine, «The First Major Museum Show to Focus on Smell»: https://www.smithsonianmag.com/arts-culture/the-first-major-museum-show-to-focus-on-smell-1787124/
- CNN — «Somerset House exhibition explores the science – and art – of perfume»: https://www.cnn.com/style/article/somerset-house-sensory-journey-perfume-exhibition/index.html
- Odeuropa — sitio del proyecto: https://odeuropa.eu/ · UCL, «Preserving Europe's forgotten smells»: https://www.ucl.ac.uk/bartlett/news/2025/jun/preserving-europes-forgotten-smells-odeuropa-co-led-ucl-ish-receives-europa-nostra-award
- Documentos internos ya citados y no repetidos: `docs/investigacion/2026-09-26-visualizacion-de-datos/README.md`, `1-fundamentos.md`, `2-rigor-y-estetica.md`, `3-mapas.md`, `4-arte-de-datos.md`; `docs/antecedentes/lenguaje-visual/sistemas-de-codificacion-del-olor.md`, `06-criba-lenguaje-pictorico.md`.

## Revisión (2026-09-26)

- Revisadas las citas y los enlaces: como mucho una cita breve por fuente, y ningún enlace a copias no autorizadas.
- Una cita larga del artículo de Sagar et al. (panel d) se parafrasea.
