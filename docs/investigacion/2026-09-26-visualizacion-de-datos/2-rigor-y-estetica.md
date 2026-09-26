---
pieza: 2 · Rigor y estética
fecha: 2026-09-26
herramienta: subagente Sonnet con web
confianza: media
---

# Rigor y estética: Bremer, Stefaner, Lima y Lupi, aplicados a la app

## Resumen — lo que cambia para la app

1. **Bremer no contradice la regla de Munzner** («lo radial solo se justifica con datos
   cíclicos»): en su proyecto más documentado (*The Baby Spike*) la cumple al pie de la letra,
   y además confiesa en su propio blog el problema exacto que predice Munzner/Ware —comparar
   alturas es más difícil con una base circular— con una solución barata y concreta: anillos de
   referencia concéntricos. Donde usa lo radial **sin** dato cíclico (*Olympic Feathers*), no lo
   hace para leer magnitud exacta sino crecimiento y categoría, y lo apuntala con arco
   constante, color y marcas. Donde el dato real es cartesiano, lo disfraza de radial solo por
   fuera (*Royal Constellations*): la carga es X/Y, lo radial es envoltura. Los tres casos son
   el mismo principio que ya tiene `06` —carga y envoltura separadas—, ahora visto en una
   diseñadora premiada, no solo en la teoría.
2. **Stefaner aporta un patrón de interacción concreto**, con millones de usos reales detrás:
   pedir al usuario que pese las variables él mismo y que el glifo cambie en vivo. Aplica
   directamente al «perfil objetivo» que ya prevé `04 §8.6`.
3. **Lima separa con precisión dos cosas que la pieza 1 metía juntas** en «mapa exploratorio»:
   el mapa posicional (nube continua, su familia «Maps & Blueprints») y la red de nodos y
   enlaces (su familia «Nodes & Links»). El mapa de olores necesita decidir cuál de las dos —o
   si son dos vistas conmutables, como ya apunta `06 §8`— antes de dibujar nada.
4. **Lupi cierra un hueco que la propia `04` dejó abierto.** El bloque E (`hedonic`,
   `interest`, `confidence`) está excluido del sello «siempre» (`04 §3`), pero nada dice dónde
   vive entonces. Propuesta: una categoría nueva, la **bitácora personal**, con la estética
   deliberadamente imperfecta de *Dear Data* y su leyenda, para ese bloque y para las catas del
   usuario.
5. **Lo común a los cuatro no es una técnica, es una frontera.** La leyenda es carga, no
   decoración; la belleza vive en la envoltura (metáfora, textura, color) mientras la
   codificación se mantiene literal debajo. Es la misma frontera que `06 §2` ya trazó desde la
   teoría, confirmada aquí por cuatro prácticas profesionales premiadas, no solo por la
   perceptual science de la pieza 1.
6. **Las seis categorías de la pieza 1 se afinan, no se sustituyen** (detalle en «Aplicado a la
   app»): el «glifo de firma» se parte en dos (sello e identidad, frente a bitácora personal); el
   «mapa exploratorio» se parte en dos (mapa posicional frente a red); ninguna categoría sobra.

---

## Hallazgos

### 1 · Nadieh Bremer — lo radial sin perder lectura

**Quién es y con qué autoridad habla** (confianza alta, Wikipedia y su propia web,
[visualcinnamon.com/about](https://www.visualcinnamon.com/about/)): astrónoma reconvertida en
científica de datos y luego en diseñadora de visualización freelance; autora, con Shirley Wu,
de *Data Sketches* (2021) y en solitario de *CHART: Designing Creative Data Visualizations from
Charts to Art* (2024/2025, Routledge/AK Peters). Su filosofía declarada en su propia web: cada
proyecto se hace a medida, partiendo del dato real y de los objetivos, en vez de usar gráficos
genéricos (confianza alta).

**El caso documentado con más detalle: *The Baby Spike*** (2017, con Zan Armstrong, para
*Scientific American*). Fuente primaria, el blog de la propia Bremer
([visualcinnamon.com/2017/10/creating-baby-births-visual](https://www.visualcinnamon.com/2017/10/creating-baby-births-visual/)),
confianza alta:

- **Por qué lo radial**: «the data we were using was cyclical after all» —minuto del día, hora
  de la semana, semana del año—, de modo que diciembre queda junto a enero. Esto
  es exactamente la condición que Munzner exige (pieza 1) para justificar lo radial. Bremer no
  la contradice: la cumple y la nombra ella misma como la razón.
- **El problema, dicho por ella en los mismos términos que la literatura perceptual**: en un
  diseño radial cuesta más comparar alturas, porque la base es circular. Es el mismo defecto que Ware/Cleveland-McGill miden (pieza 1, §2): el ángulo tiene
  menos precisión que la longitud, y una base curva empeora aún más la comparación de alturas.
- **Su solución, barata y sin matemática nueva**: anillos de referencia concéntricos. Con ellos
  se cuenta cuántos anillos asoman en un punto y se compara con otro: convierte una comparación de altura (mal
  canal, curvo) en un conteo de anillos cruzados (mejor: es casi un recuento discreto, más cerca
  del Isotype que `06 §4` ya prefiere para potencia). No resuelve el canal, lo rodea con un
  segundo canal de apoyo.
- **Construcción técnica de las barras radiales**: para evitar que se solapen cerca del centro,
  las barras que apuntan hacia dentro se estrechan cuanto más se adentran, y las de fuera al
  revés: un ajuste geométrico deliberado y documentado, no una barra-donut ingenua.

**Un segundo caso, radial sin dato cíclico: *Olympic Feathers***
([olympicfeathers.visualcinnamon.com](https://olympicfeathers.visualcinnamon.com/), confianza
alta, extraído de la propia página del proyecto). Aquí el radio no es un dato cíclico: es el
año olímpico, de 1896 (centro) a 2016 (borde), creciendo hacia fuera — un uso de lo radial por
**crecimiento/metáfora de anillos de árbol**, no por ciclicidad. Bremer lo hace legible sin
apoyarse en la lectura de área: cada disciplina (sector angular) tiene el mismo ancho angular
que su máximo histórico de medallas, el arco de cada medalla es de longitud constante (así que
«más reciente» solo gana énfasis por el radio creciente del anillo, no por deformación), el
color codifica continente y puntos blancos marcan récords olímpicos — cuatro apoyos declarados
para un canal (radio) que por sí solo no bastaría.

**Un tercer caso, radial solo por fuera: *Royal Constellations***
([royalconstellations.visualcinnamon.com](https://royalconstellations.visualcinnamon.com/),
confianza alta). La codificación real es **cartesiana**: eje vertical = año de nacimiento, eje
horizontal = distancia al pariente real vivo más cercano. Lo único «radial» es la envoltura —el
fondo negro y el aspecto de estrellas— que viste una carga X/Y perfectamente convencional. Es la
separación carga/envoltura de `06 §2` hecha por una profesional premiada sin que ella la nombre
así.

**Su proceso, del dato al boceto y al código** (confianza media-alta; frases citadas
directamente donde se indica, de
[pixelpioneers.co](https://pixelpioneers.co/blog/designing-data-visualisations-an-interview-with-nadieh-bremer)
y del propio [datasketch.es](https://www.datasketch.es/)):

1. **Datos + objetivo**: habla primero con el cliente para fijar el objetivo —qué debe hacer,
   aprender o sentir quien mire— y después desmenuza los datos mirándolos desde varios lados.
2. **Boceto deliberadamente tosco**, a mano o en la app Tayasui Sketches: empieza con contornos
   muy toscos porque la visualización se sostiene o cae con los datos reales, que con sus
   valores atípicos rompen cualquier boceto demasiado cerrado.
3. **Código**: D3.js, SVG/Canvas/three.js según el proyecto, sin frameworks de UI («I don't want
   to create dependencies for the visuals I create», cita literal) para que el resultado sea
   portable.
4. **Data Sketches** (con Shirley Wu, confianza alta, de datasketch.es): doce meses, doce temas,
   veinticuatro proyectos, documentando «the whole process from data collection, to sketch and
   ideation, to code» (cita literal). El libro **CHART** (2024/25) organiza el propio catálogo
   de formas en cuatro secciones que van de los tipos de gráfico conocidos al arte de datos más
   abstracto (vía
   [datawrapper.de](https://www.datawrapper.de/blog/chart-nadieh-bremer-book-club)) — el mismo
   gradiente exacto, y con el mismo orden, que la fidelidad de la pieza 1 y el eje
   carga→envoltura de `06`.

**Aplicado al radar de descriptores (imagen 1).** El radar de la imagen 1 compara **entre
sujetos y moléculas**, el caso que `06 §9` ya avisa que tiene mala reputación merecida (el área
depende del orden de los ejes). La técnica de Bremer (anillos de referencia) no arregla ese
problema de fondo — está pensada para comparar una serie contra una **única** referencia fija,
no varias series entre sí por área. Lo que sí confirma, viniendo de la práctica y no solo de la
teoría: un perfil radial **de un solo material** (el modo `full` del sello, `04 §8.1`) es un uso
razonable; comparar varios por superposición de área no lo es, y el modo `compare` de `04`
—superposición al 40 % **más tabla de deltas**— ya evita depender del área, exactamente
siguiendo lo que la práctica de Bremer recomendaría si se le preguntara.

**Aplicado a un posible glifo radial de fórmula (propuesta).** Ninguno de los datos actuales de
la app es cíclico (confirmado en pieza 1), así que un glifo radial de fórmula no puede
justificarse como hace Bremer en *Baby Spike*. Sí podría justificarse como en *Olympic
Feathers*: un «anillo de crecimiento» del historial de adiciones, con cada anillo = una
adición, creciendo hacia fuera en el orden en que se añadió, sector angular = material o
familia. Si se intenta, debe llevar los mismos apoyos que ella usa —arco o ángulo constante por
unidad, color categórico, marcas discretas— y nunca depender de que el lector compare radios a
ojo. Es una alternativa radial al *play* del historial (pieza 1, categoría 5), no un sustituto
del `power`-como-radio ya rechazado.

---

### 2 · Moritz Stefaner — verdad y belleza, y pesar las variables uno mismo

**Definición propia.** Se presenta como «Truth and Beauty Operator» y resume su oficio como
ayudar a encontrar verdad y belleza en datos relevantes, haciendo que los datos complejos sean
legibles, sugerentes y útiles, y en el mejor caso bellos (de
[truth-and-beauty.net](https://truth-and-beauty.net/) y su página «About»,
[truth-and-beauty.net/about](https://truth-and-beauty.net/about), confianza alta). En una
entrevista resumida (confianza media, sin cita textual verificada línea a línea) describe el
reto como expresar cosas muy complejas en forma visual compacta, sin mentir sobre el dato, y
mostrando a la vez la historia detallada y el conjunto. Se le atribuye (confianza media, vía
resumen, no verificado contra transcripción primaria) usar el ejemplo de Buckminster Fuller —la
belleza como indicio de que algo funciona— para explicar por qué «verdad» y «belleza» no son
polos opuestos en su trabajo sino la misma cosa vista desde dos lados.

**El proyecto que más importa para esta pregunta: OECD Better Life Index** (2011-2012,
confianza alta, de la propia página del proyecto,
[truth-and-beauty.net/projects/oecd-better-life-index](https://truth-and-beauty.net/projects/oecd-better-life-index)).
Es un **glifo multivariante literal, no una metáfora**: «each country is represented by one
flower, one topic by one of its petals» — once pétalos, once dimensiones de bienestar (renta,
educación, salud, satisfacción vital…), y el largo de cada pétalo es la puntuación del país en
ese tema. La elección de la flor, según el propio proyecto, se
decidió tras probar anillos, sunbursts, espirales y barras apiladas, y ganó por tres razones a
la vez: estética (forma coherente y verosímil), metafórica (las plantas fuertes suben) y
de marca (amigable, orgánica) — las tres razones nombradas explícitamente, ninguna oculta tras
las otras.

**Cómo deja pesar al usuario las variables — el hallazgo más aplicable de esta pieza**
(confianza alta, misma fuente primaria): el usuario ajusta la importancia de cada tema con un
control propio, y en vivo el pétalo de ese tema se ensancha y se satura mientras los demás se
retraen un poco: no solo cambia un ranking en una tabla aparte, cambia
el propio glifo, en dos canales a la vez (anchura y saturación) para la variable que el usuario
acaba de decir que le importa. Los índices y rankings personales que resultan se
puede compartir. Es la misma filosofía que resume una fuente secundaria (confianza media, sin
cita textual) sobre su enfoque general: el resultado debe ser un mundo que el usuario explora,
no una historia que se le cuenta ya resuelta.

**Data Stories — episodios más cercanos a esta pieza** (confianza alta en número y enlace, cada
uno confirmado con la página propia del episodio; confianza media en la relevancia exacta del
contenido, por depender de resúmenes):

| Nº | Título | Invitado | Por qué importa aquí | Enlace |
|---|---|---|---|---|
| 032 | High Density Infographics and Data Drawing | Giorgia Lupi | Glifos dibujados a mano, diseño de alta densidad, cómo opera un estudio (Accurat) | [datastori.es/ds-32-giorgia-lupi](https://datastori.es/ds-32-giorgia-lupi/) |
| 036 | Data Art | Jer Thorp | «Visualization as a process, not just a final product»; dónde el arte de datos se separa del diseño | [datastori.es/data-art-w-jer-thorp](https://datastori.es/data-art-w-jer-thorp/) |
| 038 | Visual Complexity | Manuel Lima | Cómo archivar y clasificar visualizaciones de red; hacia dónde iba el campo en 2014 | [datastori.es/data-stories-38-visual-complexity-w-manuel-lima](https://datastori.es/data-stories-38-visual-complexity-w-manuel-lima/) |

No encontré (NO ENCONTRADO) un episodio dedicado en solitario a «datos abstractos» como tema
propio, distinto de los tres de arriba; los tres cubren entre ellos glifos, arte de datos y
ciencia de redes, pero ninguno es monográfico de «abstracción» per se.

**Aplicado al visualizador de firma y al sello (propuesta).** El README describe «el
visualizador» como la pieza de firma de la app, sin diseñar (P23), separada en el texto de los
tres gráficos con nombre propio (pirámide, reparto, proyección). Su relación exacta con «el
sello» de `04` no está fijada por decisión alguna — es una pregunta abierta, no una respuesta de
esta pieza. Lo que sí aporta Stefaner es un **patrón de interacción concreto, ya usado por
millones de personas**, directamente trasplantable al «perfil objetivo» que `04 §8.6` ya prevé
(el usuario dibuja el sello que quiere antes de formular): en vez de solo mostrar la distancia
conseguida-vs-pretendida al final, dejar que el usuario mueva un peso por eje **mientras
formula** y que el glifo (sello o visualizador) reaccione en el acto, igual que el pétalo de la
OECD se ensancha y satura. Encaja con una regla que ya está en pie en la app: los números salen
al pasar (`§10.2`); esto es lo mismo, pero con el propio dibujo como respuesta, no solo un
tooltip.

---

### 3 · Manuel Lima — la taxonomía de lo circular y las redes de muchas dimensiones

**Quién es y qué autoridad tiene** (confianza alta, Wikipedia y su propia web
[mslima.com](https://www.mslima.com/)): creador en 2005 de
[VisualComplexity.com](https://visualcomplexity.com/), un archivo de más de 600 proyectos de
visualización de redes «across disciplines as diverse as Biology, Social Networks or the World
Wide Web»; autor de *Visual Complexity* (2011), *The Book of Trees* (2014) y *The Book of
Circles* (2017).

**La taxonomía de *The Book of Circles*** (confianza media-alta en la estructura —converge en
varias reseñas independientes de la editorial, Goodreads y prensa cultural—; confianza baja en
el detalle de «para qué sirve cada una», que no pude leer del libro ni extraer de su propio
artículo en Medium, bloqueado con 403, así que la columna de aplicación es lectura propia, no
cita de Lima). Lima ordena más de trescientas piezas históricas —de petroglifos de hace 40.000
años a infografías contemporáneas— en **veintiún patrones agrupados en siete familias**:

| Familia | Qué agrupa (confianza media-alta, converge en reseñas) | Para qué sirve, aplicado (propuesta, confianza baja) |
|---|---|---|
| Rings & Spirals | Anillos concéntricos, espirales, patrones de crecimiento | Es la familia a la que pertenecen la cimática (imagen 6) y el espectrograma circular (imagen 3): forma legítima, sin que eso implique que codifiquen nada con precisión |
| Wheels & Pies | Ruedas, quesitos, mandalas, rosas | Antecedente directo de cualquier reparto-de-la-materia si algún día se dibuja como dona; la pieza 1 ya avisa que pierde contra una barra apilada salvo que el dato sea cíclico |
| Grids & Graticules | Rejillas circulares, coordenadas polares, graticulas geográficas | El propio radar/sello vive aquí, en su vertiente de coordenadas polares |
| Ebbs & Flows | Procesos cíclicos, mareas, flujos periódicos | Poco aplicable hoy: nada del ciclo de la app es periódico en ese sentido |
| Shapes & Boundaries | Diagramas de Venn, siluetas, territorios | Poco aplicable a datos de fórmula; más a taxonomías de familias olfativas superpuestas |
| Maps & Blueprints | Mapas circulares, cartas celestes, proyecciones | El mapa de olores posicional (PCA/UMAP) pertenece aquí si se mantiene como nube continua |
| Nodes & Links | Árboles radiales, diagramas de arco, *edge bundling* | El mapa de olores como red de similitud —si se elige esa opción— pertenece aquí, no en la anterior |

**Lo que aporta la evidencia experimental, no solo la reseña editorial**: tres hipótesis
evolutivas para el atractivo del círculo, tal como recoge Wikipedia (confianza alta, converge
con reseñas de Fast Company y BBC Science Focus sobre el mismo libro): preferencia infantil por
las curvas, asociación emocional de patrones curvos expansivos con estados positivos, y la
geometría esférica del propio ojo (un efecto de lente de ojo de pez en la percepción). Esto
importa porque **no** es una evidencia de precisión perceptiva —Munzner y Ware, pieza 1, siguen
mandando ahí—: es una evidencia de por qué lo circular **engancha**, que es una pregunta
distinta y compatible con que además sea un mal canal para leer magnitud.

**VisualComplexity y las nubes de muchas dimensiones**: aquí el hallazgo es más débil de lo que
esperaba, y toca decirlo. Lima habla de un movimiento cultural que llama **«Networkism»**,
movido por propiedades rizomáticas como la no linealidad, la multiplicidad o la interconexión,
y en su charla TED insiste en que las redes «embody notions of
decentralization, of interconnectedness, of interdependence» frente al árbol jerárquico de
siglos anteriores (confianza alta, de su charla TED «A visual history of human
knowledge»). Pero su archivo y sus libros son, ante todo, sobre **redes de nodos y enlaces**, no
sobre nubes continuas de alta dimensión (t-SNE, UMAP, embeddings): esa es la especialidad de
Distill y del propio POM, que corresponde a la pieza 3, no a esta. **NO ENCONTRADO**: una
declaración directa de Lima sobre cómo tratar una nube de puntos de cientos de dimensiones
proyectada a dos ejes (el caso concreto de las imágenes 2, 4 y 7). Su aportación real está en el
lado de las relaciones (qué se parece a qué, qué familia contiene a qué material), no en el lado
de la proyección estadística.

**Aplicado a la cimática y al espectrograma circular (imágenes 6 y 3).** Ambas pertenecen, por
forma, a «Rings & Spirals» — un patrón con siglos de precedentes, lo que explica por qué
enganchan sin necesidad de justificación estadística. Pero el propio libro de Lima es un atlas
de **formas**, no un manual de precisión como Munzner o Ware: incluye religión, biología y arte
junto a la infografía, sin distinguir cuáles de esos trescientos ejemplos codifican datos con
rigor y cuáles no. Que la cimática tenga un lugar histórico legítimo en la familia «Rings &
Spirals» **no** rescata su validez como codificación — confirma, desde un ángulo distinto, lo
que `06 §9` ya concluye: envoltura, no carga, y aprovechable como fuente de textura para el
textón, no como eje de dato.

**Aplicado al mapa de olores.** El conflicto 3 de `06 §8` («lista o mapa») ya preveía dos vistas
conmutables del mismo corpus. Lima da nombre y precedente a la segunda opción si se elige red en
vez de (o además de) posición: **árbol radial** para una jerarquía familia→subfamilia→material
(centro = raíz, borde = hoja), o **diagrama de arco / *edge bundling*** para relaciones que
cruzan familias (un material que hace de puente entre floral y ambarino, por ejemplo). Son
formas con historia y con reglas de legibilidad ya estudiadas por Lima, no una invención de
cero — pero siguen siendo una **vista distinta** de la nube continua (PCA/POM), no un sustituto:
la posición explora vecindad por parecido global, la red explora parentesco declarado
(familia, síntesis, química). Mezclarlas en un solo dibujo es probablemente el mismo error que
`06 §8` ya advierte para Zarzo-Stanton frente a GEOS: no un mapa, dos.

---

### 4 · Giorgia Lupi — humanismo de datos, lo imperfecto y lo que falta

**El manifiesto** (confianza alta; de
[giorgialupi.com/data-humanism-my-manifesto-for-a-new-data-wold](http://giorgialupi.com/data-humanism-my-manifesto-for-a-new-data-wold)
y de su charla TED de 2017 «How we can find ourselves in data», más de 1,4 millones de
visualizaciones). Cuatro ideas, parafraseadas: (1) abrazar la complejidad en vez de
simplificarla cuando el objetivo es enseñar algo nuevo; (2) empezar dibujando a mano antes de
digitalizar, para no quedar atrapado en plantillas; (3) meter siempre el contexto, porque la
subjetividad y el contexto pesan mucho para entender incluso los grandes acontecimientos, sobre
todo cuando los datos son de personas; (4) recordar que el dato es imperfecto:
«Data-driven doesn't mean unmistakably true, and it never did», así que hay que aceptar la
imperfección y la aproximación, y probar a visualizar la incertidumbre, los errores posibles y
las imperfecciones del dato.

**Dear Data, construcción del glifo y la leyenda** (confianza alta; de
[nightingaledvs.com](https://nightingaledvs.com/the-data-we-do-not-see-an-interview-with-giorgia-lupi/)
y de reseñas convergentes del libro). Cada semana, un tema de la vida cotidiana (pensamientos
negativos, el escritorio, cosas nuevas…); cada una dibuja a mano, en una postal, una
representación única de sus datos de la semana en el anverso, y en el reverso la clave
detallada del dibujo, el código para descifrarlo: la leyenda no es un
apéndice, es la mitad del objeto, sin la cual el anverso no significa nada. Lupi insiste en que
el proyecto es un «personal documentary», no un ejercicio de cuantificación de sí misma
(*quantified self*): la meta es hacerse más humanas y conectar con ellas mismas y con los
demás más a fondo, no medir por medir.

**Cómo enseña lo que falta — más allá del manifiesto, un proyecto entero dedicado a ello**:
*Bruises: The Data We Don't See* (Lupi + la música Kaki King, en Pentagram, confianza alta, de
[pentagram.com/work/bruises-the-data-we-dont-see](https://www.pentagram.com/work/bruises-the-data-we-dont-see/story)).
King documentó cuatro meses de la enfermedad autoinmune de su hija junto a los datos clínicos:
qué hacían cada día, qué tratamientos recibía la niña, sus lecturas y cómo se sentía ella
misma. El resultado mezcla, en una misma pieza, **datos exactos**
(recuento de plaquetas, rango normal 150-400, el de la niña entre 1-30, en puntos rojos) con
**datos que ningún hospital registra**: intensidad y ubicación del hematoma (manchas
moradas/verdes), días de gira de la madre (puntos negros), momentos buenos (puntos amarillos), y
un nivel diario de miedo y esperanza en una escala de 1 a 10 (líneas flotantes) — todo con notas
manuscritas encima. No hay un solo canal para «lo que no se sabe»: hay tantos canales
declarados como tipos de ausencia o subjetividad quiso capturar, cada uno con su propio color y
su propia leyenda.

**Aplicado a «lo desconocido nunca vale cero ni se pinta en verde» (`§1.2`/`06 §5`).** La regla
de la app ya coincide, en espíritu, con el punto 4 del manifiesto de Lupi antes de conocerlo:
no simular certeza donde no la hay. Lo que Lupi añade, que la regla actual todavía no dice, es
**cómo se ve** un hueco bien dibujado: no un espacio en blanco neutro, sino una marca positiva de
ausencia — un trazo distinto, una nota, un color de «esto no se sabe» que se lee tan
activamente como un valor sí conocido. `04 §5` ya lo intuye («un eje sin dato se dibuja como
hueco, no como cero») pero no especifica el lenguaje visual del hueco; *Bruises* y *Dear Data*
son el catálogo de cómo hacerlo sin que parezca un error de renderizado: textura de trazo
distinta (más suelta, más «a mano», con el mismo espíritu que el anillo exterior punteado de
`04 §6` para la confianza/dispersión), nunca solo «no dibujar nada».

**Aplicado a las catas del usuario como dato de primera mano (propuesta central de esta
pieza).** El bloque E de `04` (`hedonic`, `interest`, `confidence`) está deliberadamente fuera
del sello. *Dear Data* y *Bruises* muestran dónde debería vivir: no en ningún sitio genérico,
sino en una **categoría de infografía propia**, la bitácora personal — un glifo por sesión de
cata, no por material; con fecha, condiciones, y las mismas notas manuscritas que ya prevé el
protocolo de cata (`04 §5`); con una leyenda visible siempre, no solo al pasar el ratón, porque
en Dear Data la leyenda es la mitad del objeto; y con una calidad de trazo deliberadamente menos
pulida que el sello (más cerca de un boceto que de un icono vectorial limpio), para que el
propio aspecto del glifo diga «esto es una experiencia subjetiva de un día concreto», no «esto es
la ficha calibrada del material». Es la misma separación descriptivo/hedónico que `04 §3` ya
impone en los datos, llevada también al dibujo.

---

### 5 · Lo común a los cuatro

**La leyenda es carga, no envoltura** (confianza alta, confirmado en los cuatro: el reverso de
cada postal de Dear Data, el panel de pétalos de la OECD, el propio libro de Lima como leyenda
extendida de trescientos años de formas, y los anillos de referencia de Bremer). Ninguno de los
cuatro trata la leyenda como un adorno opcional; los cuatro la tratan como la mitad del contrato
de lectura. La app ya declara esto para el sello (`04 §6`, «modo sello + etiquetas»,
`role="img"` con `<title>`), pero la práctica de estos cuatro sugiere ir más lejos: cualquier
glifo nuevo (bitácora, visualizador, mapa) debería nacer con su leyenda visible por defecto, no
detrás de un hover — el hover es para el detalle exacto (`Tufte`, lectura micro/macro, pieza 1),
la leyenda es para saber qué está mirando el ojo antes de mirarlo.

**Capas: conjunto y detalle, con el usuario moviendo el propio dibujo.** Bremer resalta y filtra
en vivo (proyectos interactivos); Stefaner deja que el usuario reponderar y ve el glifo
reaccionar; Lupi separa anverso (conjunto, de un vistazo) de reverso (detalle, la clave); Lima
organiza trescientos años de historia en capas de familia→patrón→ejemplo. Es el mismo mantra de
Shneiderman que ya cita la pieza 1, pero los cuatro añaden algo que Shneiderman no dice: la capa
de detalle puede ser **el propio dibujo cambiando**, no solo un panel aparte.

**Cómo la estética engancha sin falsear.** El mecanismo es el mismo en los cuatro y es, palabra
por palabra, la separación carga/envoltura de `06 §2`: la métafora, la textura o el color pueden
ser libres (la flor de la OECD, las estrellas de Royal Constellations, el trazo a mano de Dear
Data, el círculo per se de Lima) mientras la codificación por debajo se mantenga literal y
documentada (longitud de pétalo = puntuación real; X/Y = año y parentesco reales; leyenda al
dorso = valores reales; posición = lo que de verdad mida el eje). Los cuatro son, en ese sentido,
la misma prueba —por existencia, no por experimento— que ya aporta Bateman et al. en la pieza 1:
el adorno bien elegido no cuesta precisión.

**Cuándo un glifo a medida gana a un gráfico estándar, y cuándo no** (síntesis propia, cruzando
los cuatro con Munzner/Ware de la pieza 1). Gana cuando: el ítem entero es la unidad de
comparación y tiene más ejes de los que un gráfico de catálogo soporta (el sello; el pétalo de
la OECD; la postal semanal); hay un vocabulario de anclas estable que premia la exposición
repetida (los anillos constantes de Bremer; los once pétalos siempre en el mismo orden de la
OECD; las anclas de `04 §4`); y el público va a ver muchas instancias seguidas, beneficiándose
del reconocimiento de patrón (una biblioteca de sellos; 52 postales). Pierde cuando: la tarea es
`lookup` de un valor exacto (la composición, el IFRA — para eso ya está la categoría «exacta /
tabular» de la pieza 1); el público no tiene exposición repetida y no va a aprender el código
(una sola cata, un informe de una vez); o la comparación es de **muchos** ítems en **una** sola
variable (ahí gana siempre una lista ordenada o una barra, nunca un glifo, por denso que sea).

**Cruce con las seis categorías de la pieza 1 — qué se afina.**

| Categoría (pieza 1) | Se mantiene / se parte | Motivo, con esta pieza |
|---|---|---|
| Exacta / tabular | Se mantiene igual | Ninguno de los cuatro referentes toca esta categoría: los cuatro trabajan en el extremo opuesto de fidelidad |
| Iconográfica ligada a datos | Se mantiene igual | Pirámide, reparto y proyección no tienen equivalente directo en Bremer/Stefaner/Lima/Lupi; siguen gobernadas por Munzner/Ware/Tufte |
| **Glifo de firma** | **Se parte en dos** | **Sello** (identidad, comparable, anclado — `04`) sigue como está. Nueva: **bitácora personal** (Lupi/Dear Data): una cata, un momento, trazo deliberadamente menos pulido, con el bloque E y las notas del protocolo de cata, leyenda siempre visible |
| **Mapa exploratorio** | **Se parte en dos** | **Mapa posicional** (nube continua, PCA/POM — familia «Maps & Blueprints» de Lima) y **red de relaciones** (familia→material, similitud declarada — familia «Nodes & Links» de Lima), conmutables, nunca mezcladas en un solo dibujo (conflicto 3 de `06 §8`) |
| Proceso / secuencia | Se mantiene, con una alternativa nueva | Además del *play* (pieza 1) y la tira estática (Tufte), cabe un «anillo de crecimiento» radial a la Olympic Feathers, si se quiere una vista compacta del historial completo sin animación |
| Atmósfera / marca | Se mantiene, con precedente histórico añadido | Cimática y espectrograma circular caen en «Rings & Spirals» (Lima): forma con siglos de legitimidad, cero legitimidad como codificación — mismo veredicto que `06 §9`, ahora con linaje |

---

## Aplicado a la app

### Reglas concretas, con su fuente

| Regla | Fuente | Confianza |
|---|---|---|
| Lo radial se justifica mejor cuando el propio autor puede nombrar la razón (ciclo, crecimiento, o solo envoltura) — nunca «porque es bonito» sin más | Bremer, tres proyectos propios | Alta en los hechos citados; media-alta en la generalización |
| Si se usa un radio o altura radial, añadir un segundo canal de apoyo no radial (anillos de referencia, arco constante, color) para que la lectura no dependa solo del canal débil | Bremer, *Baby Spike* y *Olympic Feathers* | Alta |
| El radar/sello de un solo material es legítimo; comparar varios por área superpuesta no lo es — usar superposición + tabla de deltas, no lectura de área | Bremer (indirecto) + `06 §9` (ya vigente) | Alta |
| Dejar que el usuario pese variables y ver el glifo reaccionar en vivo, no solo un ranking aparte | Stefaner, OECD Better Life Index | Alta |
| Mapa posicional (nube) y red de relaciones son dos vistas distintas, no una — nombrar cuál es cuál antes de dibujar el mapa de olores | Lima, taxonomía de *The Book of Circles* + `06 §8` (ya vigente) | Media-alta en la distinción; baja en el detalle de qué patrón radial concreto usar |
| Un patrón circular con siglos de legitimidad estética no adquiere por eso legitimidad como codificación | Lima (*The Book of Circles* como atlas de forma, no de precisión) + `06 §9` (ya vigente) | Media |
| Todo glifo nuevo nace con leyenda visible por defecto, no solo al pasar el ratón | Los cuatro referentes, convergente | Alta |
| Un hueco de dato debe dibujarse como marca positiva de ausencia (trazo distinto), nunca como espacio neutro indistinguible de «no se ha mirado aún» | Lupi, manifiesto + *Bruises* | Alta |
| El bloque E (`hedonic`, `interest`, `confidence`) y las catas necesitan su propia categoría de infografía, distinta del sello, con trazo menos pulido y leyenda siempre visible | Lupi, *Dear Data* + *Bruises* (propuesta de esta pieza) | Propuesta; alta en la fuente, media en la aplicación concreta |

### Categorías de infografía afinadas (propuesta)

Ampliando la tabla de la pieza 1 de seis a **ocho** entradas, partiendo dos:

1. Exacta / tabular — sin cambios.
2. Iconográfica ligada a datos — sin cambios.
3. **Sello** (antes «glifo de firma») — identidad comparable, anclada, canon fijo (`04`).
4. **Bitácora personal** (nueva) — una cata, un momento; bloque E; trazo menos pulido; leyenda
   siempre visible; no comparable entre materiales, solo legible en su propio contexto.
5. **Mapa posicional** (mitad de «mapa exploratorio») — nube continua derivada (PCA/POM),
   leyenda de varianza obligatoria (imagen 4 como modelo).
6. **Red de relaciones** (la otra mitad) — familia→subfamilia→material u otras relaciones
   declaradas; formas con precedente en Lima (árbol radial, *edge bundling*).
7. Proceso / secuencia — sin cambios, con la opción de un anillo de crecimiento como alternativa
   compacta al *play*.
8. Atmósfera / marca — sin cambios, con linaje histórico documentado (Lima) que confirma, no
   contradice, su estatus de envoltura.

---

## Evaluación de la concepción inicial (P34)

El usuario ha adelantado, antes de investigar y sin cerrarla, una primera idea del
**visualizador**: densidad de olor con puntos (algo de variación de tamaño), color para una
variable de tipo, opacidad para la transparencia del olor, y una silueta circular o
semicircular hecha de rayos punteados de largo variable (imágenes 9-11) o un arco de trazos que
adelgazan (imagen 11). Quedan fuera, por decisión del propio usuario, lo sinestésico y cómo se
agrega una fórmula — no se evalúan aquí.

**El hallazgo de fondo, antes de entrar en cada punto (propuesta de esta pieza):** los cuatro
elementos de la concepción inicial no leen como cuatro variables nuevas — leen, con una
precisión que probablemente sea coincidencia y no lectura previa de `04`, como **otra manera de
dibujar cuatro ejes que `04` ya tiene asignados a otra técnica**. La tabla siguiente cruza uno
con otro:

| Idea del usuario | Eje existente más cercano (`04 §6`) | Coincide en | Coincide en técnica |
|---|---|---|---|
| Densidad de puntos, con variación de tamaño | `grain` (trama del relleno: puntos de 14 a 5 px) | El propio dato de «materia/textura» | Sí — ambos son textura de puntos |
| Color para tipo de olor | `hue` (familia) | Exacto | Sí — ninguna tensión |
| Opacidad para transparencia | `weight` (opacidad y saturación del relleno: 70 % ligero, opaco pesado) | El propio dato de peso/ligereza | Sí — ambos usan opacidad |
| Silueta de rayos que salen del centro, largo variable | `diffusion` (halo concéntrico) y la `estela` (`tenacityHours`/`evolution`, barra que decrece) | El propio dato de proyección/estela | No — `04` dibuja esto como anillos u barra, no como rayos |

Esto **no** descarta la idea del usuario — al revés: que su instinto estético converja, sin
haber leído `04`, con los mismos cuatro ejes que ya sobrevivieron la criba de `06` es una señal
a favor de que esos cuatro ejes son los que de verdad importan. Pero cambia la pregunta de «qué
variables nuevas añado» a «¿es esto una piel nueva para el sello, o un segundo glifo con otra
sintaxis?» — decisión de producto, no algo que esta pieza cierre.

**1 · Los puntos como canal de densidad.** Legítimo, con matices. Ware reduce la textura a tres
ejes: orientación, escala (separación de los puntos) y contraste (pieza 1, §4; ya la usa
`grain`) — y la numerosidad (contar puntos) es preatentiva, según el propio Ware (pieza 1, tabla
de Treisman). Confianza alta en que la densidad de puntos es, en sí, un canal defendible.
El riesgo está en qué representa exactamente: si cada punto es una unidad discreta y contable
(al modo Isotype que `06 §4` ya prefiere para `power`), es un canal preciso; si es una textura
continua que solo *sugiere* más o menos cantidad (como el detalle de la nube de Osmo, imagen 8,
que en realidad es un mapa de miles de moléculas reales, no la textura de un solo material), se
hereda el mismo defecto que ya tiene el área — imprecisa, difícil de comparar entre dos glifos
(Cleveland-McGill vía Munzner, pieza 1). Bremer resuelve un problema parecido —datasets
demasiado grandes para mostrar punto a punto— agregando antes de dibujar, caso a caso, y
aceptando que a esa escala se lee la impresión, no el valor exacto (confianza media: es su
práctica en proyectos de millones de puntos, contada en entrevistas, no una regla que enuncie
para glifos pequeños).
La variación de tamaño añadida encima de la densidad es un segundo canal para lo que probablemente
sea el mismo dato (cuánto): expresivo si es una codificación redundante deliberada (más
robusta, mejor para daltonismo), un error de Munzner si son dos atributos distintos compitiendo
por el mismo canal (pieza 1, principio de expresividad). **Propuesta**: decidir primero si el
punto es Isotype (cuenta) o textura (impresión) antes de fijar si además varía de tamaño.

**2 · La opacidad junto al color.** Es el punto de más riesgo, por dos motivos con fuente
distinta. Primero, uno perceptual (confianza alta, ya establecido en la pieza 1): tono, croma y
luminancia son integrales, se leen como «un color», no como tres canales (Garner-Felfoldy,
confirmado en Munzner §5.5.3); la opacidad, al mezclarse con el fondo, se comporta
perceptualmente como una cuarta variable de luminancia/saturación, no como algo aparte — el ojo
tenderá a leer «opacidad + color» como una sola impresión de «color más o menos vivo», igual que
ya le pasa a hue+chroma+luminance en el sello. Segundo, uno textual y más contundente: `04 §6` **ya
usa la opacidad**, y la usa para `weight` («ligero = relleno al 70 % con borde visible; pesado =
relleno opaco sin borde»). «Transparencia del olor» y «ligero ↔ pesado» son, con otras palabras,
la misma pregunta. Confianza alta en que hay una colisión de hecho, no de interpretación: es el
mismo documento, el mismo canal, ya asignado. **Propuesta**: comprobar si «transparencia» es
`weight` con otro nombre antes de tratarla como un eje nuevo; si de verdad es otra cosa, necesita
un canal distinto de la opacidad, que ya está ocupada.

**3 · Lo radial o semicircular como silueta.** Aquí es donde más pesan Bremer y Lima. Ningún
dato de la app es cíclico (pieza 1, confirmado), así que un círculo completo no se justifica como
en *The Baby Spike*. Pero las imágenes 9-11 tampoco parecen pedir esa justificación: no son ejes
en coordenadas polares, son **rayos que emanan de un centro o de una base**, un lenguaje visual
mucho más cercano a la metáfora (el olor que se difunde en el aire) que al dato cíclico — y
Stefaner ya enseña (hallazgo 2) que la metáfora, el ajuste estético y la marca pueden decidir una
forma sin que eso sea una trampa, siempre que la codificación real quede declarada aparte. Dicho
esto, tres avisos concretos:
- Las imágenes 9 y 10 tienen del orden de cien a doscientos rayos cada una. Ningún presupuesto de
  canales de `06 §3` (cuatro o cinco a tamaño de ficha) admite esa cantidad de ejes reales: como
  están dibujadas, solo pueden leerse como **textura** (impresión de conjunto, categoría
  «atmósfera/envoltura» de esta misma pieza), no como un rayo por variable. Si la intención es
  que cada rayo (o un puñado de ellos) sea un canal de datos, hace falta reducir el número de
  rayos al presupuesto real, no al de la imagen de referencia.
- Si se conserva el largo de rayo como dato, hereda el problema que Bremer nombra ella misma:
  en un diseño radial cuesta más comparar alturas, porque la base es circular (hallazgo 1,
  confianza alta). Su solución —anillos de
  referencia concéntricos— encaja literalmente con la imagen 10, que ya insinúa anillos
  concéntricos en el hueco central de una de sus tres variantes: si el visualizador adopta esta
  silueta, adoptar también el anillo de referencia de Bremer sale casi gratis, porque el hueco
  central ya está previsto en el propio boceto.
- El arco de trazos que adelgazan (imagen 11) es, en la práctica, una reinterpretación curva de
  la estela horizontal que `04 §6` ya define para `tenacityHours`/`evolution` (una barra que
  decrece por tramos). Doblarla en arco no cambia el dato que lleva, solo la geometría — es
  compatible con lo ya decidido, no una variable nueva.

Sobre Lima en concreto: su taxonomía (hallazgo 3) no valida ni invalida esta silueta — *The Book
of Circles* es un atlas de formas con siglos de precedente, no un manual de precisión. Lo que sí
aporta es nombre y compañía: un estallido de rayos alrededor de un centro es la forma que el
campo del dataviz llama de forma independiente *sunburst* (variante radial de un icicle/treemap
jerárquico), normalmente reservada para **jerarquías** (anillo = nivel, sector = categoría). Si
el visualizador quisiera que cada rayo fuese legible, ese es el precedente a mirar — con el
mismo límite de rayos que cualquier jerarquía visual, no con cien.

**4 · Cuántas variables aguanta.** Contando solo lo que la concepción inicial ya nombra —tipo
(color), transparencia (opacidad), densidad, tamaño del punto, largo del rayo, grosor del rayo—
son entre cuatro y seis candidatos a canal, antes de sumar nada sinestésico (deliberadamente
fuera). El presupuesto de `06 §3` para una pieza de ficha grande es de cuatro a cinco canales
separables, y Ware pone un techo duro alrededor de treinta y dos combinaciones distinguibles para
un glifo de ocho ejes bien elegidos (pieza 1, confianza alta ambas). Si «color» y «opacidad»
terminan siendo el mismo eje que `weight`/`hue` de `04` (punto 2), y «densidad» y «tamaño de
punto» terminan siendo el mismo eje que `grain` (punto 1), el recuento real baja a dos o tres
ejes genuinamente nuevos — largo de rayo, grosor de rayo, y cuántos rayos — que es un presupuesto
mucho más razonable y, otra vez, muy cercano al que ya ocupan `diffusion` y la estela. La cuenta
no cierra por casualidad: confirma, con datos distintos, la misma cifra de `06`.

## Discrepancias

- **La cifra exacta de la definición de «verdad y belleza» de Stefaner** no se pudo verificar
  contra una transcripción primaria palabra por palabra; la anécdota de Buckminster Fuller
  circula en resúmenes de entrevistas (confianza media) pero no la encontré en una fuente
  primaria suya. No es una discrepancia entre fuentes que se contradicen, sino un dato con
  respaldo más débil de lo que me gustaría: se marca media, no alta.
- **Ninguna discrepancia real entre los cuatro autores** en el resto de hallazgos: los cuatro
  convergen, desde prácticas distintas, en la misma frontera carga/envoltura que ya tenía `06`.

## No encontrado

- No pude leer *Data Sketches*, *CHART*, *Visual Complexity*, *The Book of Circles* ni *Dear
  Data* como libros: todo lo dicho sobre su contenido viene de las propias webs de los autores,
  reseñas editoriales convergentes y entrevistas, nunca de las páginas originales. Se avisa,
  como pide el encargo: la web corrobora, no sustituye.
- El artículo propio de Manuel Lima en Medium sobre *The Book of Circles*
  (`medium.com/@mslima/the-book-of-circles-4b511a5bcffc`) devolvió error 403 en cada intento;
  la tabla de las siete familias se reconstruyó de reseñas de la editorial y de prensa cultural
  convergentes, no de su propio texto.
- No encontré una taxonomía publicada y verificable de los métodos de layout que usa
  VisualComplexity.com internamente para catalogar sus más de 600 proyectos (radial
  convergence, *arc diagrams*, etc.); lo que devolvió la herramienta de lectura web tenía forma
  sospechosamente pulida para ser texto literal del sitio, así que se descartó en vez de
  citarlo como si fuera fuente primaria.
- No encontré una declaración directa de ninguno de los cuatro autores sobre nubes de puntos de
  alta dimensión (t-SNE/UMAP/POM) — Lima es el más cercano, y su terreno real son las redes de
  nodos y enlaces, no la proyección estadística continua. Queda para la pieza 3.
- No encontré un episodio de Data Stories dedicado en solitario a «datos abstractos» como tema
  propio.
- No pude confirmar con una transcripción primaria las citas exactas del episodio 038 (Lima) más
  allá del resumen del propio sitio.

## Preguntas nuevas

- Si se adopta la «bitácora personal» como categoría nueva, ¿qué tan distinto debe ser su
  lenguaje visual del sello para que nadie confunda una experiencia subjetiva de un día con una
  ficha calibrada del material? ¿Basta con la calidad de trazo, o hace falta también un marco o
  fondo distintos?
- ¿El «visualizador» del README es el sello agregado de fórmula (`04 §7`) a mayor tamaño, o algo
  más elaborado en la línea de la flor de Stefaner —un glifo con regiones espacialmente
  separadas por variable, no capas integradas—? Es una decisión de producto, no algo que esta
  pieza pueda cerrar.
- Si el mapa de olores acaba siendo dos vistas (posicional y de red, según Lima), ¿comparten
  interacción (clic en un material selecciona en ambas) o son independientes? Afecta directamente
  al patrón de vistas coordinadas que la pieza 1 ya identificó en el resaltado cruzado.
- ¿Vale la pena, antes de diseñar la bitácora personal, mirar si el protocolo de cata (`04 §5`)
  ya captura suficientes campos de contexto (estado de ánimo, condiciones) como para que el
  glifo tenga con qué dibujarse, o hace falta ampliarlo primero?

## Fuentes

- Bremer, N. — «About», [visualcinnamon.com/about](https://www.visualcinnamon.com/about/)
- Bremer, N. — «Creating the Scientific American "Baby Spike" visual»,
  [visualcinnamon.com/2017/10/creating-baby-births-visual](https://www.visualcinnamon.com/2017/10/creating-baby-births-visual/)
- Bremer, N. — «Olympic Feathers», [olympicfeathers.visualcinnamon.com](https://olympicfeathers.visualcinnamon.com/)
- Bremer, N. — «Royal Constellations», [royalconstellations.visualcinnamon.com](https://royalconstellations.visualcinnamon.com/)
- Bremer, N. y Wu, S. — *Data Sketches*, [datasketch.es](https://www.datasketch.es/) y
  [datasketch.es/book](https://www.datasketch.es/book)
- Bremer, N. — *CHART: Designing Creative Data Visualizations from Charts to Art*, Routledge/AK
  Peters, 2024/25 — reseñada, no leída; vía
  [datawrapper.de/blog/chart-nadieh-bremer-book-club](https://www.datawrapper.de/blog/chart-nadieh-bremer-book-club)
- «Designing Data Visualizations: An Interview with Nadieh Bremer»,
  [pixelpioneers.co](https://pixelpioneers.co/blog/designing-data-visualisations-an-interview-with-nadieh-bremer)
- «Nadieh Bremer on thinking outside the (x,y) axes», Storybench,
  [storybench.org/nadieh-bremer-on-thinking-outside-the-lines](https://www.storybench.org/nadieh-bremer-on-thinking-outside-the-lines/)
- Wikipedia — «Nadieh Bremer», [en.wikipedia.org/wiki/Nadieh_Bremer](https://en.wikipedia.org/wiki/Nadieh_Bremer)
- Stefaner, M. — «Truth & Beauty», [truth-and-beauty.net](https://truth-and-beauty.net/) y
  [truth-and-beauty.net/about](https://truth-and-beauty.net/about)
- Stefaner, M. — «OECD Better Life Index»,
  [truth-and-beauty.net/projects/oecd-better-life-index](https://truth-and-beauty.net/projects/oecd-better-life-index)
- Wikipedia — «Moritz Stefaner», [en.wikipedia.org/wiki/Moritz_Stefaner](https://en.wikipedia.org/wiki/Moritz_Stefaner)
- Data Stories — episodio 032, Giorgia Lupi,
  [datastori.es/ds-32-giorgia-lupi](https://datastori.es/ds-32-giorgia-lupi/)
- Data Stories — episodio 036, Jer Thorp,
  [datastori.es/data-art-w-jer-thorp](https://datastori.es/data-art-w-jer-thorp/)
- Data Stories — episodio 038, Manuel Lima,
  [datastori.es/data-stories-38-visual-complexity-w-manuel-lima](https://datastori.es/data-stories-38-visual-complexity-w-manuel-lima/)
- Lima, M. — VisualComplexity.com, [visualcomplexity.com](https://visualcomplexity.com/)
- Lima, M. — *The Book of Circles: Visualizing Spheres of Knowledge*, Princeton Architectural
  Press, 2017 — reseñada, no leída; vía Princeton Architectural Press
  ([papress.com/products/the-book-of-circles-visualizing-spheres-of-knowledge](https://papress.com/products/the-book-of-circles-visualizing-spheres-of-knowledge))
  y reseñas convergentes (Goodreads, Hyperallergic)
- Lima, M. — «A visual history of human knowledge», charla TED,
  [ted.com/talks/manuel_lima_a_visual_history_of_human_knowledge](https://www.ted.com/talks/manuel_lima_a_visual_history_of_human_knowledge)
- Wikipedia — «Manuel Lima», [en.wikipedia.org/wiki/Manuel_Lima](https://en.wikipedia.org/wiki/Manuel_Lima)
- Lupi, G. — «Data Humanism, my manifesto for a new data wold»,
  [giorgialupi.com/data-humanism-my-manifesto-for-a-new-data-wold](http://giorgialupi.com/data-humanism-my-manifesto-for-a-new-data-wold)
- Lupi, G. — «Philosophy», [giorgialupi.com/philosophy](http://giorgialupi.com/philosophy)
- Lupi, G. — «How we can find ourselves in data», charla TED, 2017,
  [ted.com/talks/giorgia_lupi_how_we_can_find_ourselves_in_data](https://www.ted.com/talks/giorgia_lupi_how_we_can_find_ourselves_in_data)
- Lupi, G. y Posavec, S. — *Dear Data*, Princeton Architectural Press / Penguin, 2016; vía
  [giorgialupi.com/dear-data](http://giorgialupi.com/dear-data) y Wikipedia,
  [en.wikipedia.org/wiki/Dear_Data](https://en.wikipedia.org/wiki/Dear_Data)
- Forrest, J. y Bell, A. — «The Data We Do Not See: An Interview with Giorgia Lupi»,
  Nightingale, [nightingaledvs.com/the-data-we-do-not-see-an-interview-with-giorgia-lupi](https://nightingaledvs.com/the-data-we-do-not-see-an-interview-with-giorgia-lupi/)
- Lupi, G. y King, K. — «Bruises: The Data We Don't See», Pentagram,
  [pentagram.com/work/bruises-the-data-we-dont-see/story](https://www.pentagram.com/work/bruises-the-data-we-dont-see/story)
- Wikipedia — «Giorgia Lupi», [en.wikipedia.org/wiki/Giorgia_Lupi](https://en.wikipedia.org/wiki/Giorgia_Lupi)
- Documentos internos ya citados y no repetidos: `docs/investigacion/2026-09-26-visualizacion-de-datos/1-fundamentos.md`,
  `docs/antecedentes/lenguaje-visual/06-criba-lenguaje-pictorico.md`,
  `docs/antecedentes/lenguaje-visual/04-lenguaje-olfativo-visual.md`.

## Revisión (2026-09-26)

- **Citas:** el encargo pedía como mucho una cita literal breve por fuente, y la pieza citaba
  mucho y en largo. Se parafrasea el resto; queda una cita breve por fuente como mucho.
- **Una cita de Bremer** («when datasets are that big…») se daba como «ya recogida en el
  hallazgo 1», y no lo estaba. Se parafrasea, como práctica suya contada en entrevistas.
- **La bitácora personal** (Lupi) es para las catas, que hoy viven en el laboratorio, no en la
  app. Se valora en la síntesis, no se da por categoría de la app.
- **Longitud:** 645 líneas, por encima de lo pedido, porque se añadió la evaluación de P34 a
  mitad de trabajo. Se deja entera: es lo más útil de la pieza.
