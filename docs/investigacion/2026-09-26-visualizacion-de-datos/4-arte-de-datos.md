---
pieza: 4 · Arte de datos y cimática
fecha: 2026-09-26
herramienta: subagente Sonnet con web
confianza: media
---

# Arte de datos y cimática, aplicados a la pieza de firma de la app

## Resumen — lo que cambia para la app

1. **Kosara da, en fuente primaria, los tres criterios que el encargo anticipaba** —basada en
   datos, produce una imagen, legible y reconocible— más uno no anticipado y muy útil: **lo
   sublime**, un espectro donde cuanto más artística es una pieza, menos tiene que ser legible.
2. **La cimática literal (Chladni/Bessel) es matemáticamente incompatible con el presupuesto de
   canales de `06`**: el número de nodos es un entero, y el patrón cambia a saltos con la
   frecuencia. Dos fórmulas parecidas pueden dar patrones idénticos o muy distintos según en qué
   lado de un salto de modo caigan — el mismo defecto que la inestabilidad de UMAP/t-SNE (pieza
   3), pero aquí no se arregla con una semilla: es la física, no el motor.
3. **Anadol e Ikeda son los dos polos de una misma decisión, no referentes intercambiables**:
   Anadol dispersa el dato en un espacio latente ilegible punto a punto (con críticas serias por
   ello); Ikeda mantiene el dato legible hasta el píxel. **La imagen 3 y el historial con *play*
   piden Ikeda.**
4. **Piesse (1857) y Crisinel-Spence (2012) apuntan, por vías independientes, al mismo eje —la
   volatilidad— como único candidato con algún respaldo para una «frecuencia» olfativa.** Es,
   además, el dato que la app ya tiene una sola vez (posición = duración = presión de vapor).
   Cualquier otro eje enviado a una frecuencia sería convención pura.
5. **La silueta de rayos de P34, tal como está en las imágenes 9-10 (cien-doscientos rayos),
   cae del lado artístico de Kosara, no del pragmático.** Colapsada a un rayo por unidad real,
   con anillos de referencia, cruza al lado legible sin perder la metáfora.
6. **La pieza de firma no tiene que elegir un bando de una vez**: intención y fidelidad son ejes
   independientes (Kosara; Viégas-Wattenberg; el propio Anadol tiene un extremo literal). Se dan
   tres opciones al final, no una decisión.

---

## Hallazgos

### 1 · Refik Anadol — proceso, fidelidad y críticas

**Proceso** (confianza media, converge en entrevistas; la web actual del estudio es sobre todo
cartelera de eventos, no un manifiesto técnico). Desde 2016, redes generativas (DCGAN, PGAN,
StyleGAN2 ADA) entrenadas sobre corpus masivos. *Unsupervised* (MoMA, 2022) entrena sobre
~178-200 mil imágenes del archivo, con *embeddings* de 1024 dimensiones; la instalación
recorre e interpola el **espacio latente** aprendido — no reproduce datos, «sueña» sobre ellos.
*Quantum Memories* parte de +200 millones de fotografías públicas de paisaje. Cita propia:
«Data is still the pigment — But now, the brush can think» (13 palabras, NFT Now, 2022).

**Qué es fiel y qué no** (síntesis propia, confianza alta en los hechos). La escultura
generativa es fiel en que la estructura estadística agregada del corpus es real, pero **ningún
fotograma corresponde a un dato concreto**: no es invertible por diseño. El propio catálogo de
Anadol tiene un extremo literal —*Winds of Boston* (2017), viento real codificado de forma
bastante directa— que prueba que su firma cubre todo el espectro, del dato trazable al dato
disuelto.

**Críticas** (confianza media-alta, tres fuentes independientes convergentes). ArtCritic: con
300 millones de fotos el resultado es «visual soup»; las colaboraciones con Microsoft/NVIDIA/
Google son «tech demo disguised as art»; resumen citable: «Art that doesn't hurt, doesn't
question, content to be pretty and impressive» (14 palabras). Cybernetic Forests, sobre
*Unsupervised* en el MoMA: la capa de líneas tipo telaraña que aparenta representar datos es
«essentially uninformative»; la tesis es que el asombro («awe») mistifica la IA como
incomprensible en vez de explicarla — «it asserts a story about AI that makes us passive to
it» (13 palabras).

**Aplicado (propuesta).** El riesgo señalado —una capa que aparenta representar datos sin
relación verificable— es justo lo que `06 §2` ya prohíbe. Si la app usa alguna textura
generativa de biblioteca (atmósfera/marca), ningún elemento suyo puede aparentar ligarse a un
material concreto sin estarlo de forma invertible. Y *Winds of Boston* prueba que belleza y
trazabilidad no son mutuamente excluyentes.

### 2 · Ryoji Ikeda — el dato como materia prima, la estética de la precisión

**Filosofía** (confianza media-alta, converge en varias fuentes que citan al artista). Ikeda
trabaja «the invisible multi-substance of data» y resume su estética: «beauty is crystal:
rationality, precision, simplicity, elegance, delicacy» (9 palabras) — el polo opuesto de
Anadol en el mismo vocabulario de Kosara: sublime por exactitud, no por inmersión ambigua.

**Los proyectos** (confianza alta, fuentes del propio estudio y coproductores). *datamatics*
(2006-): concierto audiovisual desde datos y código reales. *data.tron* (2007-09): «cada píxel
se calcula estrictamente por un principio matemático», mapas del universo, ADN, hipercubos.
*test pattern* (2008-): convierte cualquier dato —texto, sonido, foto, vídeo— en código de
barras y binario, sonificado en tiempo real: se puede *oír* lo que se ve.

**Aportación a la imagen 3 y al historial con *play*** (síntesis propia). La imagen 3 —anillos
concéntricos blanco sobre negro, textura radial densa— es el vocabulario de Ikeda, no el de
Anadol, y a diferencia de Anadol es compatible con el rigor sin ajuste: un código de barras es,
por construcción, recuento de unidades, la misma familia Isotype que `06` ya adoptó para
`power`. Puede tomarse prestado como carga, no solo envoltura, si cada línea es una unidad real.
Para el *play*: dibujar cada adición como marca tipo código de barras (grosor/posición = una
unidad), reservando color y curva para el sello en reposo — la misma regla que la pieza 1 ya
daba para apagar rótulos en movimiento, llevada también al propio dibujo.

### 3 · La cimática — física, generación por ordenador, pseudociencia, continuidad

**Física** (confianza alta). Chladni publicó el fenómeno en 1787. Placa **cuadrada**:
desplazamiento ∝ `sin(mπx/L)·sin(nπy/L)`; ecuación de nodos usada para generarla,
`cos(nπx/L)cos(mπy/L) − cos(mπx/L)cos(nπy/L) = 0`. Placa **circular**: perfil radial `J_m(kr)`
(función de Bessel) por término angular `cos(mθ)`; las líneas nodales circulares son los ceros
de `J_m`, y `m` da el número de diámetros nodales. La frecuencia sigue la **ley de Chladni**:
`f = C·(m+2n)^p`, `p≈2` en una placa plana típica. Hans Jenny acuñó «cimática» en su libro de
1967, extendiendo el fenómeno a arena y líquidos con un tonoscopio propio.

**Cómo se genera por ordenador** (confianza alta, dos vías). La rigurosa (ChladniSonify, 2026,
arXiv, leído directo): resuelve numéricamente la ecuación biarmónica de Kirchhoff-Love — cara,
exacta. La barata, la que usa casi todo el arte generativo (thelig.ht, proyectos en Processing/
JS): dibuja directamente la ecuación de nodos de arriba, coloreando donde el valor cae cerca de
cero. Es probablemente el método detrás de la imagen 6: variaciones de parámetros de una misma
fórmula, no doce simulaciones físicas.

**Pseudociencia a evitar** (confianza media-alta, converge en varias críticas independientes).
El fenómeno físico es real; no lo son: que 432 Hz sea «más natural» que 440 Hz, poderes
curativos del sonido sin evidencia publicada, o las afirmaciones del dispositivo CymaScope de
«insights» en astrofísica, biología o comunicación de delfines sin datos publicados — resumidas
en una reseña crítica: «All I see are pretty pictures, no scientific results» (10 palabras). El
propio Jenny tenía vínculos con la antroposofía, un marco que rebasa la física de placas.

**La pregunta clave — continuidad** (hechos de confianza alta; el argumento es síntesis propia
de esta pieza). `m` y `n` son enteros: el espectro de modos es discreto. Un estudio de barrido
documenta, en menos de 5 Hz (159 a 164), cuatro topologías distintas: segmentos paralelos, dos
tipos de arcos elípticos, y finalmente cuatro círculos. Dentro de una banda de resonancia el
patrón se deforma con cierta continuidad; **en el límite entre dos modos el número de líneas
nodales cambia en un entero**, sin paso intermedio. Dos frecuencias parecidas pueden caer en la
misma banda o a ambos lados de un salto, sin que la distancia entre los datos lo prediga —el
mismo defecto que la pieza 3 ya documentó para UMAP/t-SNE, y peor que el problema ya conocido
del *colormap* arcoíris (no monótono, con bandas falsas) porque ese se arregla cambiando de
paleta y este no se arregla sin dejar de ser cimática literal. **Respuesta directa**: no, dos
fórmulas parecidas no darían necesariamente patrones parecidos; es determinista pero no
continuo, y esas dos propiedades no son la misma cosa.

### 4 · Arte de datos frente a visualización — Kosara, Viégas y Wattenberg

**Kosara (2007), leído en primaria completa, alta confianza.** Tres criterios mínimos para
cualquier visualización: **basada en datos** no visuales, ajenos al programa; **produce una
imagen**, medio primario de comunicación; **resultado «readable and recognizable»** (6
palabras, cita literal) — legible aunque exija entrenamiento, y reconocible como visualización.
Añade un cuarto eje no binario: **lo sublime** (asombro, respuesta emocional profunda) frente
al «anti-sublime» (amigable, fácil). Cuanto más sublime, menos legible puede permitirse ser; su
propia figura clasifica un gráfico categórico (legible y reconocible, extremo pragmático) frente
a una visualización musical tipo MilkDrop (basada en datos, ni legible ni reconocible, extremo
artístico) — «most artistic visualizations» caen ahí, según sus propias palabras.

**Viégas y Wattenberg (2007)** (confianza media: el PDF primario en hint.fm dio error de
certificado y la versión Springer exige acceso institucional; se cita vía una revisión
académica de 2026 que sí lo lee). Definen la visualización artística como «visualizations of
data done by artists with the intent of making art» (12 palabras, cita vía secundaria) sobre un
«consenso básico» de que debe estar «grounded in real data» (parafraseado). Su eje distintivo es
la **intención** del autor, no una propiedad medible de la imagen. Su *Wind Map* (2012, primera
obra nativa de la web en la colección del MoMA) prueba, como *Winds of Boston*, que intención
artística y fidelidad total no son incompatibles.

**Cómo se mantiene honesta una pieza de firma** (síntesis sobre lo anterior y piezas 1-3):

| Criterio | Exige | Ya establecido en | Falla si… |
|---|---|---|---|
| Determinismo | Mismos datos → mismo dibujo siempre | `04 §6`, `renderSeal` puro | Muestreo generativo o semilla sin fijar (pieza 3) entra en la carga |
| Leyenda declarada | Visible por defecto | Piezas 1-2 | Es solo un tooltip opcional |
| Número exacto al pedirlo | Valor real recuperable | `04 §6` modo `compare`; Tufte micro/macro | El dato «se sugiere» por densidad sin respaldo (pieza 3, imagen 8) |
| Continuidad | Datos parecidos → dibujos parecidos | Expresividad (Munzner, pieza 1); estabilidad UMAP/t-SNE (pieza 3) | Mapeo a modo cimático discreto (§3) |
| Nada de falsa precisión | El canal no implica más exactitud de la real | Factor de mentira (Tufte, pieza 1); `§1.2` | Belleza exacta en apariencia sobre un dato de `confidence` bajo |

### 5 · Olor y sonido — Piesse, la metáfora de las notas, Crisinel y Spence

**El odófono de Piesse (1857)** (confianza media; el propio laboratorio avisa de que
probablemente *popularizó*, no acuñó, la metáfora nota/acorde; confirmado de forma
independiente en la web). Cita: «there is, as it were, an octave of odors like an octave in
music» (14 palabras). Su «Gamut of Odours» reparte ~50 aromas en un pentagrama: **lo pesado,
grave; lo volátil, agudo** (civet y ámbar gris en Fa grave, violeta en Re agudo). Es intuición
de oficio, no experimento — no hay panel ni estadística.

**Crisinel y Spence (2012), «A Fruity Note»**, *Chemical Senses* 37(2):151-158 (confianza alta,
converge en resumen y reseñas). Sujetos sin formación emparejan olores afrutados/cítricos
(manzana, limón, albaricoque) con **tonos agudos** y timbre de piano/viento-madera; olores
ahumados, almizclados, chocolate negro, con **tonos graves** y timbre de metal. Es percepción
medida en población general, no convención de oficio.

**Qué eje iría a una «frecuencia» con respaldo, y cuál sería convención pura** (síntesis
propia). Los dos resultados no miden lo mismo, pero apuntan al mismo lado: fresco/cítrico/
volátil → agudo; pesado/denso/persistente → grave. Ese eje es, casi literalmente, la
**volatilidad** — y es el mismo dato que ya generan posición y duración (presión de vapor,
README): el único candidato con respaldo doble e independiente. Cualquier otro eje (`hue`,
`power`, `angularity`) no tiene literatura que lo conecte con el tono: sería convención pura,
declarable como tal (misma regla que `06 §8` ya aplica a la textura). `power` iría mejor a
**amplitud** —analogía física directa, sin necesitar respaldo crossmodal— sin competir por el
mismo canal.

**Aviso de no doble codificación (obligatorio).** Si la frecuencia se deriva de la volatilidad,
es la misma variable que ya ocupan posición y duración, no una tercera dimensión: dibujarla como
independiente (por ejemplo, moverla aparte en el perfil objetivo) codificaría dos veces un solo
atributo — el error que Munzner ya prohíbe (pieza 1).

### 6 · La concepción del usuario (P34) — entre visualización y arte de datos

**Dónde cae, con los criterios de Kosara.** Basada en datos: sí, si cada rayo nace de un valor
real. Produce una imagen: sí. Legible y reconocible: **no**, tal como está en las imágenes 9-10
—del orden de cien a doscientos rayos, muy por encima del presupuesto de `06 §3` (4-5 canales a
tamaño de ficha)—; con ese recuento se lee como impresión, no como variable, el mismo veredicto
que Kosara da a MilkDrop. La imagen 11 (arco que adelgaza) es distinta: pocos trazos, ya es una
reinterpretación curva de la estela de `tenacityHours`/`evolution` (`04 §6`) — cae del lado
legible tal cual.

**Cómo generarla dentro del presupuesto, sin doble codificación** (propuesta):

| Elemento (P34) | Qué codifica | Regla reutilizada |
|---|---|---|
| Nº de haces de rayos | Recuento de materiales o zonas de pirámide activas, entero acotado (5-12) | Isotype (`06 §4`) |
| Densidad de puntos en un haz | `grain`, ya asignado | `04 §6`, no es variable nueva |
| Largo del rayo | El dato compartido posición=duración=volatilidad, una sola vez | Longitud (Munzner, pieza 1) |
| Anillos de referencia en el hueco central | Ancla para comparar largos sin depender del ojo | Truco de Bremer (pieza 2) |
| Grosor/opacidad del rayo | Refuerzo de `power`, ya recuento — no un canal nuevo salvo que se declare | Expresividad (Munzner) |
| Silueta cerrada (círculo) | — | Ningún dato de la app es cíclico (pieza 1); evitar salvo envoltura pura |
| Silueta abierta (semicírculo/arco) | Ninguna afirmación de ciclo | Esquiva el problema anterior sin perder la metáfora de emanación |

**Veredicto** (propuesta): tal como está bocetada, es arte de datos/envoltura por exceso de
elementos; colapsada a un haz por unidad real, con anillos de referencia y sin canal duplicado,
cruza a visualización/carga. La elección entre ambas no la cierra esta pieza.

---

## Aplicado a la app

### Reglas concretas

| Regla | Fuente | Confianza |
|---|---|---|
| Toda vista tipo Anadol (espacio latente, textura entrenada) es envoltura; ningún elemento puede aparentar ligarse a un material sin serlo de forma invertible | Críticas a Anadol; `06 §2` (ya vigente) | Media-alta |
| Se puede ser fiel y bello a la vez — no elegir el extremo generativo de un referente por defecto | *Winds of Boston*; *Wind Map* | Media |
| La estética de precisión (blanco/negro, recuento en barras) es compatible con la carga si cada marca es una unidad real | Ikeda; Isotype (`06`, ya vigente) | Media-alta |
| En el *play*, preferir marcas tipo código de barras sobre textura continua | Ikeda; regla ya fijada en pieza 1 | Propuesta sobre hechos de confianza alta |
| Ningún patrón cimático literal codifica un dato cuantitativo continuo: el nº de nodos es entero y cambia a saltos | Física de placas y ley de Chladni | Alta en la física; propuesta en la aplicación |
| Si se usa cimática, solo como envoltura pura; nunca leer el modo (m,n) resultante como si fuera el dato | Consecuencia directa; `06 §9` ya rechazaba la cimática como codificación | Alta |
| Evitar frases de tipo «esta fórmula vibra a X Hz» o que «revela» algo oculto | Crítica a CymaScope y a claims de sanación | Media-alta |
| El único eje con respaldo (doble, independiente) para una «frecuencia» es la volatilidad — ya es posición y duración; no crear un tercer canal | Piesse; Crisinel-Spence; README | Media / alta / alta |
| Cualquier otro eje enviado a una frecuencia es convención pura y debe declararse | Ausencia de literatura crossmodal específica; regla ya usada en `06 §8` | Media |
| La silueta de rayos de P34 solo cruza a «visualización» colapsada a un rayo por unidad real, con anillo de referencia | Kosara; Bremer (pieza 2); Munzner (pieza 1) | Media-alta |
| Toda pieza de firma necesita determinismo, leyenda visible, número exacto al pedirlo, continuidad, nada de falsa precisión | Kosara; Viégas-Wattenberg; síntesis de piezas 1-3 | Alta por componente; propuesta en conjunto |

### La categoría «atmósfera/marca», afinada

Mismo nombre y función que en piezas 1-2 (envoltura declarada). Se añade un **eje interno de
sublimidad** (Kosara) con dos registros:

| Registro | Referente | Cuándo |
|---|---|---|
| Precisión (anti-sublime) | Ikeda: barras, alto contraste, recuento | La envoltura debe convivir con lectura exacta al lado (historial, fondo auditable) |
| Inmersión (sublime) | Anadol, cimática literal, malla 3D (imagen 5) | Se declara sin ambigüedad que no hay lectura posible ahí (bienvenida, fondo puramente decorativo) |

### La pieza de firma: tres opciones, no una decisión

**A — envoltura pura.** El visualizador es enteramente atmósfera; la lectura exacta vive donde
ya vive hoy (sello, pirámide, reparto, proyección). Libertad total, cero riesgo de falsa
precisión; coste: la pieza de firma no dice nada por sí sola.

**B — dos capas en un glifo.** Núcleo determinista (sello o variante, 4-5 canales de `06`)
rodeado de envoltura declarada (textura tipo cimática/Anadol), con frontera visible explícita —
el mismo contorno punteado de `04 §7`. Es la vía de Bremer (*Royal Constellations*) y Stefaner
(pétalos exactos, metáfora floral). Una sola pieza, ambos registros; coste: mantener la
frontera en cada rediseño.

**C — un dato, dos lentes conmutables.** Los mismos datos, «modo dato» (Ikeda: preciso, con
leyenda) y «modo atmósfera» (Anadol/cimática: inmersivo), que el usuario cambia con un control —
la solución que el propio Kosara describe para *We Feel Fine*: la interacción, no el dibujo
fijo, deja elegir qué lado de la sublimidad ver. Sirve a la vez a la tarea analítica y a la
contemplativa; coste: mantener dos renderizados del mismo sello.

Las tres son compatibles con las reglas de esta pieza; difieren en cuánta belleza vive dentro
del glifo de datos frente a alrededor de él. La decisión se toma en el interrogatorio.

---

## Discrepancias

- **Ninguna discrepancia real entre Kosara y Viégas-Wattenberg**: ambos exigen datos reales y
  difieren solo en si el criterio decisivo es una propiedad de la imagen o de la intención.
- **Piesse y Crisinel-Spence no se contradicen, pero no son la misma evidencia**: uno es
  convención de oficio del XIX (confianza media, con aviso propio del laboratorio), el otro un
  experimento de 2012 (confianza alta). Que apunten al mismo eje es convergencia, no doble
  confirmación del mismo tipo de hecho.
- **Matiz sobre la cimática y el arte generativo**: casi todo el arte generativo usa la fórmula
  cerrada aproximada, no la simulación física completa (ChladniSonify). El argumento de
  discontinuidad (§3) aplica a las dos por igual, pero no conviene presentar la versión barata
  como si fuera una medición física real.

## No encontrado

- El PDF primario de Viégas-Wattenberg (2007): error de certificado en hint.fm, Springer exige
  acceso institucional; se citó vía revisión secundaria de 2026 con cita directa.
- Declaración de proceso técnico completa en la web actual de Anadol (hoy es cartelera de
  eventos); reconstruido vía entrevistas y páginas de proyecto.
- Documentación técnica de *Winds of Boston* con el mapeo canal a canal exacto.
- Fuente primaria sobre qué inspiró a Piesse más allá de la analogía verbal ya existente entre
  nota musical y nota olfativa.
- Un estudio que nombre «continuidad perceptiva» como criterio explícito en Kosara o
  Viégas-Wattenberg para cimática: el argumento de continuidad de esta pieza es síntesis propia
  sobre Munzner (pieza 1) y la inestabilidad de UMAP/t-SNE (pieza 3).

## Preguntas nuevas

- Si se elige la opción C, ¿comparten ambos modos el resaltado cruzado ya identificado entre
  pirámide, reparto y proyección (piezas 1-3)?
- ¿El usuario quiere alguna vez leer «esta fórmula suena/vibra a X» como frase de marca, aunque
  sea sin pretensión científica? Cambia cuánto blindar la interfaz contra la lectura
  pseudocientífica.
- Si la volatilidad ya ocupa posición y duración, ¿compensa gastar además una «frecuencia» en el
  mismo dato, o reservar cualquier eje de sonido para un dato que hoy no se dibuja (`evolution`,
  `04 §3`)?
- Cuando exista panel real, ¿los perfumistas de `06 §10` leen volatilidad-agudo/grave como los
  sujetos legos de Crisinel-Spence, o usan vocabulario propio («nota de salida») que no se
  traduce igual?
- La opción B exige un límite visual declarado entre carga y envoltura: ¿el mismo contorno
  punteado de `04 §7`, o un lenguaje propio para no confundir «envoltura decorativa» con
  «estimación derivada»?

## Fuentes

- Kosara, R. (2007). «Visualization Criticism – The Missing Link Between Information
  Visualization and Art». *Proc. 11th IV*, pp. 631-636. PDF primario leído completo:
  https://media.eagereyes.org/papers/2007/Kosara-IV-2007.pdf
- Viégas, F. y Wattenberg, M. (2007). «Artistic Data Visualization: Beyond Visual Analytics».
  *OCSC 2007, LNCS 4564*. No leído en primaria; citado vía Xu et al. (2026), «More Than
  Beautiful»: https://arxiv.org/html/2502.04940 · *Wind Map*: https://www.interaliamag.org/articles/martin-wattenberg-the-color-of-data/
- Refik Anadol Studio: https://refikanadol.com/ · *Unsupervised*: https://refikanadol.com/works/unsupervised/
  · *Quantum Memories*: https://refikanadol.com/works/quantummemories/ · cita «pigment/brush»,
  NFT Now: https://nftnow.com/art/refik-anadol-on-how-ai-imagination-elevates-memory-with-nfts/
- «Refik Anadol: The Illusionist of Empty Data», ArtCritic:
  https://www.artcritic.com/en/refik-anadol-the-illusionist-of-empty-data/ · «To Refik Anadol,
  Criticism Is Just More Data», Ocula: https://ocula.com/magazine/art-news/to-refik-anadol-criticism-is-just-more-data/
  · Salvaggio, E., «Ideologies of Awe & AI Art at the MoMA», Cybernetic Forests:
  https://mail.cyberneticforests.com/ideologies-of-awe-and-ai-art-at-the/
- Ryoji Ikeda: https://www.ryojiikeda.com/archive/works/ · *datamatics*:
  https://www.ryojiikeda.com/project/datamatics/ · *data.tron*, Forma:
  https://forma.org.uk/projects/datamatics/data-tron · «Data as spectacle», The Vinyl Factory:
  https://www.thevinylfactory.com/features/data-as-spectacle-a-ryoji-ikeda-overview
- Chladni, E. (1787), fenómeno original vía Physics LibreTexts:
  https://phys.libretexts.org/Bookshelves/Waves_and_Acoustics/The_Physics_of_Waves_(Goergi)/11:_Two_and_Three_Dimensions/11.03:_Chladni_Plates
  · Jenny, H. (1967), *Cymatics*, vía Wikipedia: https://en.wikipedia.org/wiki/Hans_Jenny_(cymatics)
  · «Chladni's law»: https://en.wikipedia.org/wiki/Chladni%27s_law · modos de membrana circular
  (Bessel): https://www.acs.psu.edu/drussell/demos/membranecircle/circle.html
- Barrido de frecuencia 159-164 Hz (cuatro topologías): European Journal of Engineering and
  Technology Research, vía eu-opensci.org · ChladniSonify (2026), arXiv, leído en PDF:
  https://arxiv.org/pdf/2605.09846 · generación barata: https://thelig.ht/chladni/ ·
  https://github.com/luciopaiva/chladni
- Crítica a CymaScope y pseudociencia: Language Log,
  https://languagelog.ldc.upenn.edu/nll/?p=24834
- Piesse, G. W. S. (1857). *The Art of Perfumery* — cita y «Gamut of Odours» vía
  fleur-de-male.blogspot.com y ResearchGate (figura del gamut):
  https://www.researchgate.net/figure/Scale-of-correspondences-between-sound-and-odours-reproduced-from-Piesse-1857_fig1_346665435
- Crisinel, A.-S. y Spence, C. (2012). «A Fruity Note». *Chemical Senses*, 37(2):151-158.
  https://academic.oup.com/chemse/article/37/2/151/272870
- Problema del *colormap* arcoíris (analogía §3): Google Research Blog, «Turbo»:
  https://research.google/blog/turbo-an-improved-rainbow-colormap-for-visualization/
- Documentos internos ya citados y no repetidos:
  `docs/investigacion/2026-09-26-visualizacion-de-datos/README.md`, `1-fundamentos.md`,
  `2-rigor-y-estetica.md`, `3-mapas.md`; `docs/antecedentes/lenguaje-visual/04-lenguaje-olfativo-visual.md`,
  `06-criba-lenguaje-pictorico.md`; `../Perfumery/conocimiento/lenguaje/autores/historicos-y-teoricos.md`
  (solo lectura, sobre Piesse).

## Revisión (2026-09-26)

- Revisadas las citas y los enlaces: como mucho una cita breve por fuente, y ningún enlace a copias no autorizadas.
