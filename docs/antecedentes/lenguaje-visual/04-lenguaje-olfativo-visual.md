# 04 — Lenguaje olfativo visual: el sello

Este es el corazón del producto. Todo lo demás es infraestructura para que esto exista.

---

## 1. La tesis

Un adjetivo olfativo es un puntero a una experiencia que el lector puede tener o no. "Ambarino cálido y sensual" no le dice nada a quien no ha olido nunca labdanum, y le dice tres cosas distintas a tres perfumistas que sí lo han olido.

Un sello olfativo es un **glifo compuesto** donde cada canal visual codifica exactamente un eje perceptual medido con anclas comunes. Para quien no conoce el lenguaje es una mancha bonita. Para quien lo conoce es una lectura densa e inmediata: familia, luz, textura, potencia, proyección, curva temporal, efecto psicológico, limpieza y codificación de género, todo de un vistazo y todo comparable entre materiales.

**Regla constitucional del proyecto**: un eje, un canal. Un canal que codifique dos ejes destruye la legibilidad; un canal decorativo que no codifique nada la diluye. Cada vez que se añada algo al sello hay que decir qué eje codifica y qué anclas lo calibran.

---

## 2. Las dos familias de ejes

El sistema mezcla dos tradiciones que normalmente no se cruzan:

**Descripción sinestésica.** No es una licencia poética. Existe un cuerpo de investigación experimental sobre correspondencias intermodales: más de veinte estudios revisados por pares documentan que las asociaciones olor–color no son aleatorias ni exclusivas de sinestésicos, sino consistentes en población general y en buena medida compartidas entre culturas, y hay literatura equivalente sobre olor–forma (los olores intensos y desagradables tienden a asociarse a formas angulosas; la vainilla y la frambuesa, a formas redondeadas). Trabajamos sobre un terreno con base empírica, no sobre una metáfora.

**Terminología de experto.** El diagrama de efectos odorantes de Paul Jellinek (1951) organiza el olor por sus efectos y no por sus familias: dos ejes cruzados, erógeno frente a anti-erógeno (refrescante) y narcótico frente a estimulante, con cuatro efectos compuestos en las diagonales — calmante, fresco, exaltante y sensual. Su hijo Joseph Stephan lo revisó en 1994 sustituyendo los términos por rico, fresco, suave y activo. El valor del esquema es que separa **olor** de **efecto**: Jellinek señala que citral, vainillina y vetiver comparten efecto estimulante siendo olores completamente distintos, y que geraniol, fenilacetaldehído y acetato de para-cresilo son los tres florales con efectos opuestos.

El sistema toma la potencia, la limpieza, la tenacidad y la difusión del vocabulario técnico del perfumista, y el color, la textura, el grano y la forma de la vía sinestésica.

---

## 3. Los ejes

Todos los ejes se guardan como enteros de 0 a 1000 salvo indicación. Nunca como texto.

### Bloque A — Identidad cromática

| Eje | Rango | Extremos |
|---|---|---|
| `hue` | 0–3600 (décimas de grado) | Posición en la rueda cromática olfativa |
| `chroma` | 0–1000 | Difuso, mestizo, indefinible ↔ nítido, monocorde, inconfundible |
| `luminance` | 0–1000 | Oscuro, denso, sombrío ↔ luminoso, brillante, abierto |

Los tres colapsan en **un solo color** en espacio OKLCH: `oklch(L C H)`, con `L = 0,25 + luminance/1000 · 0,55` y `C = chroma/1000 · 0,18`. Que la identidad completa quepa en un color es lo que hace que el sistema funcione visualmente.

**La rueda cromática olfativa** es un mapeo fijo, no una preferencia. Propuesta de doce sectores de 30°, ordenados para que la vecindad cromática refleje vecindad olfativa:

| Grado | Familia | Grado | Familia |
|---|---|---|---|
| 0° | Cítrico | 180° | Marino / ozónico |
| 30° | Frutal | 210° | Aldehídico / jabonoso |
| 60° | Floral blanco | 240° | Almizclado |
| 90° | Verde / hoja | 270° | Ambarino / balsámico |
| 120° | Herbáceo / aromático | 300° | Animálico / cuero |
| 150° | Terroso / raíz | 330° | Especiado / madera |

Un material puede tener hasta tres facetas con peso (`hue` + `share`), y entonces el núcleo del sello se dibuja en sectores. Un material monofacético se dibuja en color plano. Guardar la faceta secundaria es importante: es lo que distingue un vetiver de un patchouli en la lectura rápida.

### Bloque B — Materia

| Eje | Extremos |
|---|---|
| `grain` | Liso, cremoso, aterciopelado ↔ granulado, cristalino, áspero |
| `weight` | Aéreo, ingrávido ↔ denso, pesado, plomizo |
| `angularity` | Redondo, envolvente ↔ anguloso, cortante, punzante |
| `dryness` | Húmedo, jugoso, suculento ↔ seco, polvoriento, calcáreo |

### Bloque C — Comportamiento

| Eje | Rango | Significado |
|---|---|---|
| `power` | 0–1000 | Impacto a igualdad de concentración. Escala logarítmica sobre el umbral de detección |
| `diffusion` | 0–1000 | Proyección, cuánto sale del papel y ocupa el aire |
| `tenacityHours` | horas | Medida real sobre tira, no estimada |
| `evolution` | 0–1000 | Lineal, monolítico ↔ mutante, se transforma por fases |

`power` es el eje más difícil de valorar y el más valioso: es el que permite ponderar la pirámide y la lectura de género por contribución perceptual y no por masa. Se evalúa siempre a concentración normalizada (§5).

### Bloque D — Efecto

| Eje | Rango | Significado |
|---|---|---|
| `erogenous` | −1000 a +1000 | Anti-erógeno / refrescante ↔ erógeno. Eje horizontal de Jellinek |
| `narcotic` | −1000 a +1000 | Estimulante ↔ narcótico. Eje vertical de Jellinek |
| `cleanliness` | 0–1000 | Sucio, indólico, fecaloide, sudoroso ↔ limpio, jabonoso, aséptico |
| `edibility` | 0–1000 | Mineral, inorgánico ↔ comestible, gourmand |
| `abstraction` | 0–1000 | Figurativo, reconocible como su fuente ↔ abstracto, no remite a nada |

`erogenous` y `narcotic` forman el plano de Jellinek, y sus diagonales dan los cuatro efectos compuestos: calmante (narcótico + refrescante), fresco (refrescante + estimulante), exaltante (estimulante + erógeno) y sensual (erógeno + narcótico). El sello dibuja el vector resultante, así que un material se lee como una dirección y una magnitud dentro de ese plano.

`cleanliness` es eje propio y no una consecuencia del anterior: hay almizcles blancos limpísimos que son claramente erógenos, y verdes agrestes sucios que son anti-erógenos. Separarlos es lo que hace que el sistema describa perfumería contemporánea y no solo la de 1951.

### Bloque E — Subjetivo, deliberadamente aparte

| Campo | Descripción |
|---|---|
| `hedonic` | −1000 a +1000. Cuánto te gusta. **Nunca se dibuja en el sello.** |
| `interest` | 0–1000. Cuánto te interesa como material de trabajo, sea agradable o no |
| `confidence` | 0–1000. Cuánta seguridad tenías al valorar |

La separación estricta entre lo descriptivo y lo hedónico es lo que permite que dos perfumistas con gustos opuestos compartan valoraciones y se entiendan. Si se mezclan, el sistema se convierte en una lista de estrellas y no vale nada.

---

## 4. Anclas de calibración

Sin anclas, "textura 700" significa cosas distintas para cada persona y el sistema no compone. Cada eje tiene **material ancla en cada extremo y uno en el centro**, mostrados en la propia interfaz de valoración, con su sello ya dibujado al lado del deslizador.

Propuesta inicial, a validar con un panel real antes de fijar:

| Eje | 0 | 500 | 1000 |
|---|---|---|---|
| `grain` | Galaxolide | Vetiveril acetato | Pimienta negra CO₂ |
| `weight` | Hedione | Geranio | Labdanum absoluto |
| `angularity` | Vainillina | Rosa absoluto | Aldehído C-11 undecilénico |
| `dryness` | Nota de melón | Cedro Virginia | Ambroxan |
| `power` | Dipropilenglicol | Linalol | Aldehído C-14 |
| `diffusion` | Almizcle macrocíclico | Bergamota | Iso E Super |
| `cleanliness` | Índol | Ylang III | Almizcle blanco jabonoso |
| `edibility` | Petricor / mineral | Té negro | Etil maltol |

Las anclas son **datos configurables**, no constantes en el código: viven en `fixtures/anchors.json` y se pueden sustituir por regionales o por las de un formador que tenga su propio juego.

**Modo de calibración**: al empezar, la app propone valorar seis materiales ancla a ciegas. Compara los resultados con los valores de referencia y calcula un **offset por eje y por usuario**. A partir de ahí, las valoraciones se guardan crudas pero se muestran corregidas, y al compartir se transmiten normalizadas. Esto es lo que convierte un sistema personal en un lenguaje común.

---

## 5. Protocolo de cata

Los ejes solo valen si se capturan en condiciones comparables. La cata es un flujo guiado, no un formulario.

**Condiciones normalizadas**, precargadas y editables:
- Soporte: tira de papel secante, inmersión de 1 cm.
- Concentración de evaluación: 10 % en DPG salvo excepción declarada. Se guarda siempre en el registro.
- Ambiente: sin corrientes, sin comida, sin otras muestras abiertas.

**Momentos de lectura**: 0 min, 15 min, 1 h, 4 h, 24 h, y "hasta agotamiento" para cerrar la tenacidad. La app envía avisos y guarda cada lectura por separado. La tenacidad no se estima: se marca la lectura en que ya no se percibe.

**Dos modos**:
- **Rápido** (6 ejes, ~90 segundos): `hue`, `luminance`, `power`, `grain`, `cleanliness`, y el vector de Jellinek en un solo control de dos dimensiones. Suficiente para generar un sello legible.
- **Completo** (todos los ejes, multi-lectura). Se puede empezar en rápido y completar después; el sello marca visualmente qué ejes están sin datos en lugar de inventarlos.

**Ejes que no se rellenan nunca se rellenan solos.** Un eje sin dato se dibuja como hueco, no como cero. La honestidad del dato es lo que sostiene todo lo demás.

### Interfaz de captura

Deslizadores no. Los deslizadores numéricos producen respuestas ancladas al centro y sesgadas hacia los redondos. Usa en su lugar:

- Un **selector radial** para `hue`, con las doce familias dibujadas.
- Un **plano de dos dimensiones** para el vector de Jellinek: el usuario pone un punto dentro del rombo, con los cuatro efectos compuestos rotulados en las diagonales. Un solo gesto, dos ejes.
- **Pares de anclas** para el resto: dos sellos a los lados y un control continuo entre ellos, sin número visible mientras se arrastra. El número aparece al soltar.

---

## 6. El sello: especificación de dibujo

El paquete `packages/seal` exporta `renderSeal(seal, mode, size) → string` (SVG). Función pura, sin dependencias, determinista: los mismos datos producen siempre el mismo SVG byte a byte, porque el SVG se usa como identidad visual en exportaciones, PDF e informes.

### Canales

| Elemento | Eje que codifica | Regla |
|---|---|---|
| Color de relleno del núcleo | `hue`, `chroma`, `luminance` | `oklch()` según §3. Facetas → sectores |
| Contorno del núcleo | `angularity` | Interpolación entre círculo (0) y heptágono de vértices agudos (1000). Se genera con 7 puntos y curvas cuadráticas cuya tensión varía con el eje |
| Tamaño del núcleo | `power` | Radio = `r₀ · (0,55 + 0,45 · power/1000)` |
| Trama del relleno | `grain` | Patrón de puntos: separación de 14 px (liso) a 5 px (granulado); radio de punto de 0,6 a 1,8 px. Opacidad fija |
| Opacidad y saturación del relleno | `weight` | Ligero = relleno al 70 % con borde visible; pesado = relleno opaco sin borde |
| Calidad del borde | `dryness` | Húmedo = borde difuminado por doble trazo de baja opacidad; seco = borde de un solo trazo nítido y entrecortado |
| Halo concéntrico | `diffusion` | Anillos a `r · 1,3` y `r · 1,6`, con opacidad `0,05 + 0,3 · diffusion/1000` |
| Aguja desde el centro | `erogenous` + `narcotic` | Ángulo = `atan2(narcotic, erogenous)`; longitud = módulo del vector, hasta `0,8 r`. Con cruz de referencia tenue al 30 % |
| Muesca en el perímetro | `cleanliness` | Trazo continuo (limpio) ↔ trazo con cinco interrupciones irregulares (sucio) |
| Estela horizontal | `tenacityHours`, `evolution` | Barra bajo el núcleo, longitud logarítmica: `L = Lmax · log(1+h) / log(1+168)`. Se parte en los tramos de la pirámide con altura decreciente. `evolution` alto = escalones marcados; bajo = altura casi constante |
| Barra inferior | Género | Marca en `polarity`; banda translúcida de anchura proporcional a `ambiguity` |
| Anillo exterior punteado | `confidence` / dispersión de panel | Cuanto mayor la dispersión, más separados los puntos y más difuso el conjunto |

### Los tres modos

- **`compact`** — 24 px. Solo núcleo con color, forma y trama. Va en las listas, junto a cada entrada de fórmula, en los resultados de búsqueda. Tiene que ser legible a ese tamaño: si un canal no se distingue a 24 px, no va en este modo.
- **`full`** — 320 px. Todos los canales. Ocupa la cabecera de la ficha de material y de acorde.
- **`compare`** — dos o más sellos superpuestos con relleno al 40 %, más una tabla de deltas por eje al lado. Es la vista que responde "¿en qué se diferencian exactamente estos dos ambarinos?".

### Restricciones de dibujo

- SVG puro sin filtros, sin gradientes, sin sombras. Se imprime, se exporta a PDF y se ve a 24 px.
- El color es **dato**, así que el sello no se invierte en modo oscuro. Lo que se adapta es el fondo de la tarjeta y los textos, nunca el color del núcleo.
- Accesibilidad: el sello lleva siempre `role="img"` con un `<title>` generado que verbaliza los ejes principales, y hay un modo "sello + etiquetas" que dibuja los valores numéricos alrededor para quien no distingue matices de color.

---

## 7. Agregación

### Sello de un acorde o una fórmula

No es la media de los sellos de sus componentes: sería una masa parda. Reglas por bloque:

- **Color**: mezcla en OKLCH ponderada por contribución perceptual `cᵢ = fracciónMasaᵢ · powerᵢ`, normalizada. Como el tono es circular, la media se hace en coordenadas cartesianas y se reconvierte a ángulo, y si la dispersión angular supera 90° el núcleo se dibuja en sectores en lugar de mezclado — una fórmula con dos polos cromáticos no debe leerse como un color intermedio.
- **Materia** (`grain`, `weight`, `angularity`, `dryness`): media ponderada por `cᵢ`.
- **Potencia**: no se promedia. Se toma un percentil 85 de los componentes, porque la potencia de una mezcla la manda lo más potente, no el promedio.
- **Tenacidad**: la del percentil 90 de la distribución ponderada, no la máxima — un solo material tenaz al 0,01 % no hace tenaz a la fórmula.
- **Efecto**: suma vectorial de las agujas ponderada por `cᵢ`. Que la suma vectorial se cancele es información valiosa: significa que la fórmula está equilibrada en efecto, y Jellinek insiste en que los contrastes que importan son de efecto, no de olor.

Un sello agregado se dibuja siempre con contorno punteado, para no confundirlo con uno medido directamente.

### Sello de panel

Cuando varios catadores valoran el mismo material:
- Valor mostrado = mediana por eje, no media, para resistir valores atípicos.
- Dispersión = rango intercuartílico, dibujado en el anillo exterior.
- **Un material controvertido es un material interesante.** La biblioteca debe poder ordenar por dispersión, y merece un distintivo propio.

---

## 8. Dónde aparece el sello

1. Ficha de material: modo `full` en la cabecera.
2. Biblioteca: modo `compact` en cada fila; opción de ordenar y filtrar por cualquier eje.
3. Entrada de fórmula: modo `compact` a la izquierda del nombre.
4. Estadísticas de fórmula: sello agregado, más el mapa de dispersión de los componentes en el plano de Jellinek — de un vistazo se ve si la fórmula está apelotonada en un solo cuadrante.
5. Comparador de versiones: los dos sellos en modo `compare`.
6. Perfil objetivo: el usuario dibuja el sello que quiere **antes** de formular, y la app muestra la distancia entre lo pretendido y lo conseguido, eje a eje, con los componentes que más contribuyen a cada desvío. Esta es probablemente la función más útil de todo el sistema y no la tiene nadie.
7. Exportación e intercambio: el sello viaja como datos, no como imagen, y se redibuja en destino.

---

## 9. Referencias

- Jellinek, P. (1951), *Odor Effects Diagram*; recogido y revisado en Jellinek, J. S. (ed.), *The Psychological Basis of Perfumery*, 4.ª ed., Chapman & Hall, 1997. Los cuatro polos y sus compuestos, y la distinción entre olor y efecto.
- Spence, C. (2020), "Olfactory-colour crossmodal correspondences in art, science, and design", *Cognitive Research: Principles and Implications*. Revisión de la evidencia sobre consistencia de las asociaciones olor–color en población no sinestésica.
- Hanson-Vaux, Crisinel y Spence (2013), "Smelling shapes: crossmodal correspondences between odors and shapes". Base para el eje `angularity`.
- Zarzo, M. y Stanton, D. — trabajos sobre dimensiones subyacentes del espacio de percepción del perfumista y comparación de mapas olfativos. Útil para validar si nuestros ejes son realmente independientes: cuando haya suficientes valoraciones, un análisis de componentes principales dirá qué ejes están colapsando y hay que fusionar o redefinir.
