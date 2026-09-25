# 07 — Referencias nuevas

Fuentes que **no** están en tus dieciséis referentes ni en el documento `Odor Description, Classification and Coding Systems at the Ingredient Level`. Organizadas por lo que aportan al problema, no por disciplina. Cada entrada indica para qué sirve y con qué cautela.

Formato pensado para cargarlo en tu cuaderno de fuentes.

---

## A. Codificación visual — el cuerpo bibliográfico que faltaba entero

Esta sección es la que cambia las decisiones. Es la disciplina que responde a "cuántos ejes caben y en qué canal".

**Jacques Bertin, *Sémiologie graphique*, 1967.**
Fundacional. Define las variables visuales —posición, tamaño, valor, textura, color, orientación, forma— y establece qué tipo de dato admite cada una (nominal, ordinal, cuantitativo) y sus niveles de lectura. Toda la teoría posterior es refinamiento de esto. *Uso*: la tabla de canales de `06` §6 deriva directamente de aquí.

**William Cleveland y Robert McGill, "Graphical Perception", *JASA*, 1984.**
Ordenaron empíricamente los canales por precisión de lectura para datos cuantitativos: posición sobre escala común primero, luego longitud, luego ángulo, después área y volumen, y color al final. *Uso*: es la razón por la que la potencia no debe ser el radio del núcleo. Extendido por Mackinlay (1986) y sistematizado por Munzner (*Visualization Analysis and Design*, 2014).

**Wendell Garner y Gordon Felfoldy, "Integrality of stimulus dimensions in various types of information processing", *Cognitive Psychology*, 1970.**
Distinguen dimensiones integrales de separables. Colin Ware propuso después un continuo de pares, de más integral a más separable, con rojo–verde y tono–luminosidad en el extremo integral y tono–textura en el separable. *Uso*: demuestra que tono, croma y luminosidad son un canal, no tres. Es la corrección más importante a `docs/04`.

**Anne Treisman — teoría de integración de rasgos, desde 1980.**
Identifica los rasgos preatentivos: color, orientación, tamaño, movimiento. Se detectan en paralelo; el resto exige inspección serial. *Uso*: define qué puede aparecer en la miniatura de 24 px de una lista larga.

**Rita Borgo, Johannes Kehrer, David Chung, Eamonn Maguire, Robert Laramee, Helwig Hauser, Matthew Ward y Min Chen, "Glyph-based Visualization: Foundations, Design Guidelines, Techniques and Applications", *Eurographics STAR*, 2013.**
El estado del arte del diseño de glifos. Catorce criterios de diseño: capacidad de canal, ordenabilidad, cercanía semántica, preatención, robustez, normalizabilidad, separabilidad de canales, balance de atención, buscabilidad, jerarquía visual, aprendibilidad, mapeo por importancia, mapeo redundante y elección del espacio visual según la tarea. *Uso*: lista de comprobación antes de cada iteración del sello. Disponible en abierto.

**Herman Chernoff, "The use of faces to represent points in k-dimensional space graphically", *JASA*, 1973.**
El intento más famoso de codificar multivariante en un icono. Fracasó por saliencia asimétrica entre rasgos y por lectura fisonómica involuntaria. *Uso*: cuento con moraleja. Cualquier glifo con muchos canales heredará sus problemas.

**Otto Neurath y Gerd Arntz — Isotype, años 20–30.**
El sistema pictórico que sí se adoptó. Regla central: **cantidad por repetición de signos idénticos, nunca por aumento de tamaño**. *Uso*: cómo codificar potencia e intensidad. Bibliografía moderna: Christopher Burke, Eric Kindel y Sue Walker, *Isotype: Design and Contexts 1925–1971*, 2013.

**Albert Munsell (1905, 1915) y el Natural Colour System sueco.**
Sistemas de notación perceptual con ejes ortogonales que triunfaron porque **distribuyeron muestras físicas**. *Uso*: el argumento de que tu kit de anclas es el producto, y el diagrama solo su documentación.

---

## B. La capa subjetiva, validada

**Christelle Chrea, Didier Grandjean, Sylvain Delplanque, Isabelle Cayeux, Bénédicte Le Calvé, Christelle Porcherot, David Sander y Klaus Scherer — Geneva Emotion and Odour Scale (GEOS), 2009.**
36 términos en seis dimensiones afectivas específicas del olor, obtenidas por reducción en tres pasos de un conjunto inicial de cientos de términos y validadas por análisis factorial confirmatorio. Superan a los modelos de emociones básicas y de valencia×activación×dominancia en intensidad reportada, acuerdo entre jueces y poder discriminativo.
Réplicas culturales: LEOS (Liverpool) y SEOS (Singapur), siete dimensiones cada una. **Compartidas por las tres culturas: asco, felicidad/bienestar, sensualidad/deseo y energía.** Calma/serenidad compartida por las dos europeas.
*Uso*: es la base empírica del plano de efecto. Sensualidad/deseo y energía recuperan, sesenta años después y por análisis factorial, los polos erógeno y estimulante de Paul Jellinek. Escalas distribuidas por el Swiss Center for Affective Sciences (unige.ch/cisa/eos).

**Christelle Porcherot, Sylvain Delplanque et al., "How do you feel when you smell this? Optimization of a verbal measurement of odor-elicited emotions", *Food Quality and Preference*, 2010.**
Versión reducida de GEOS para uso aplicado, con menos términos por categoría. *Uso*: es la que querrás implementar en la app; la completa es demasiado larga para una cata.

**Camille Ferdenzi et al., "Variability of Affective Responses to Odors: Culture, Gender, and Olfactory Knowledge", *Chemical Senses*, 2013.**
Cuantifica cuánto varía la respuesta afectiva según cultura, género y conocimiento olfativo. *Uso*: dimensiona el problema del sesgo del panel y justifica el offset de calibración por usuario.

**Charles Osgood — diferencial semántico, 1957.**
Las tres dimensiones universales del significado afectivo: evaluación, potencia y actividad. El ancestro metodológico de todas las escalas de pares de adjetivos opuestos, incluida la lógica "limpio ↔ erótico" que te interesa. *Uso*: fundamento del formato de captura por pares con anclas.

---

## C. Precedentes de notación olfativa

**Genji-kō (源氏香), Japón, desde el s. XVI.**
Cinco muestras, cinco líneas verticales, unión horizontal de las que huelen igual, 52 patrones posibles nombrados según capítulos del *Genji Monogatari*. La combinatoria es el número de Bell B₅ = 52. Los patrones migraron a kimonos, biombos y papelería, y así sobrevivieron.
Bibliografía: Oran Looney, "The Art and Mathematics of Genji-Kō" (oranlooney.com), buena introducción técnica; hay un trabajo en arXiv sobre los números de Bell en la combinatoria de Matsunaga y Arima; la colección Cooper Hewitt del Smithsonian conserva plantillas de motivos genji-kō.
*Uso*: el argumento para tener, además del sistema paramétrico continuo, un conjunto cerrado de tipos con nombre. Y el recordatorio de que codificar **relaciones** entre muestras es más fiable que codificar cualidades absolutas.

**Kate McLean — Sensory Maps, desde 2010.** sensorymaps.com
Smellmaps de más de una docena de ciudades, entre ellas Barcelona. Simbología declarada: tono según descriptor, saturación según intensidad percibida, tamaño de la marca según duración, posición según secuencia del recorrido; la forma, explícitamente arbitraria. Datos recogidos en *smellwalks* con voluntarios que registran descripción, expectativa, intensidad, asociación personal y reacción.
Textos: "Smellmap: Amsterdam — Olfactory Art & Smell Visualisation" (VISAP 2014, PDF abierto en vis.cs.ucdavis.edu); "Ex-formation as a method for mapping smellscapes"; coeditora de *Designing with Smell*.
*Uso*: la asignación de canales más cercana a lo que necesitas, hecha por una diseñadora gráfica y no por un científico. Copia el número de canales y la honestidad epistémica; no copies saturación para intensidad, que es integral con el tono.

**Tiziana Alocci, "Scented Connections", para el Grupo Robertet.**
Treinta retratos de datos de fragancias, cada uno una "huella olfativa" a base de nodos y líneas. *Uso*: precedente estético de alto nivel para la envoltura. No es codificación invertible.

**Patentes de interfaz de formulación por pictogramas.**
Hay patentes concedidas en EE. UU. sobre sistemas donde el tamaño del pictograma de un ingrediente representa su contribución olfativa a la composición y el color representa su familia olfativa, con visualización del perfil temporal por grupos de presión de vapor; y sobre códigos pictóricos donde regiones de color y símbolos codifican acordes e ingredientes de forma legible por reconocimiento de imagen.
*Uso*: dos cosas. Que el mapeo obvio "tamaño = contribución, color = familia" está patentado en algunas jurisdicciones y conviene revisión profesional antes de comercializar. Y que el espacio libre está en la capa afectiva y en el kit de anclas.

---

## D. Notación y lenguaje en otras artes — lo que funcionó y lo que no

**Vasili Kandinsky y el cuestionario de la Bauhaus, 1923.**
La correspondencia forma–color: triángulo–amarillo, cuadrado–rojo, círculo–azul. Enormemente influyente y **no replicable**: los intentos posteriores no encuentran consenso más allá del azar. *Uso*: aviso de que una correspondencia intermodal puede ser cultural, hermosa, célebre y falsa a la vez.

**Partituras gráficas: Cornelius Cardew, *Treatise* (1963–67); György Ligeti, *Artikulation* (transcripción de Rainer Wehinger, 1970).**
Notación visual bellísima e influyente. *Treatise* no lleva instrucciones de interpretación y cada intérprete lo lee distinto; la transcripción de *Artikulation* sí es legible porque la hizo alguien que conocía la pieza y definió el código. *Uso*: la diferencia entre las dos es exactamente la prueba de lectura inversa. Es el ejemplo más limpio que conozco de por qué la belleza no basta.

**Léxicos con referencias físicas: Le Nez du Vin (Jean Lenoir), World Coffee Research Sensory Lexicon, rueda de sabores de la cerveza de Meilgaard.**
Tu documento ya cubre las ruedas. Lo que subrayo aquí es el patrón común: **todos venden o distribuyen las referencias físicas**. El vocabulario sin las muestras no se adopta.

---

## E. Descripción de materiales — autores que faltan en tus dieciséis

**Günther Ohloff, Wilhelm Pickenhagen y Philip Kraft, *Scent and Chemistry: The Molecular World of Odors*, Wiley-VCH, 2011; 2.ª ed. 2022.**
Revisión y ampliación de *Riechstoffe und Geruchssinn* de Ohloff. Incluye capítulo sobre descripción y clasificación de la impresión odorante, relaciones estructura-olor y unos cuatrocientos ejemplos de perfumería. *Uso*: el complemento moderno y químicamente riguroso de Arctander. Debería estar en tus referentes principales.

**Philip Kraft — artículos sobre relaciones estructura-olor, Givaudan.**
Autor de moléculas comerciales como Super Muguet y Azurone. Sus artículos describen materiales con un vocabulario que cruza precisión química y descripción sensorial. *Uso*: modelo de escritura descriptiva para las fichas de material.

**Roman Kaiser, *Meaningful Scents Around the World* y *Scent of the Vanishing Flora*.**
Headspace de flores y ecosistemas, con descripciones olfativas de una precisión evocadora poco común. *Uso*: fuente de vocabulario descriptivo de alta calidad para poblar los descriptores; y modelo de cómo describir sin caer en el adjetivo genérico.

**Arcadi Boix Camps, *Perfumery: Techniques in Evolution* (2.ª ed., 2009).**
Descripciones de materiales notablemente idiosincrásicas, con juicios estéticos explícitos. *Uso*: es el extremo opuesto a Dravnieks —descripción subjetiva de autor, sin panel— y por eso es útil para calibrar hasta dónde puede llegar la capa subjetiva sin dejar de ser informativa.

**Luca Turin y Tania Sanchez, *Perfumes: The Guide*.**
La tradición del descriptor de dos palabras y la reseña comprimida. *Uso*: para perfumes terminados, no para materias, pero es el mejor ejemplo de compresión descriptiva subjetiva que existe. Relevante para nombrar los tipos cerrados del conflicto 4.

---

## F. Crossmodalidad — matices que faltan

**Charles Spence, "Temperature-Based Crossmodal Correspondences: Causes and Consequences", *Multisensory Research*, 2020.**
Revisión de las correspondencias táctiles y térmicas. Hallazgo relevante: las correspondencias de temperatura se apoyan en el **tono**, mientras que peso, dureza y rugosidad se apoyan en **luminosidad y, en menor medida, saturación**. *Uso*: si alguna vez codificas peso o textura mediante color, estarás usando el canal que la evidencia señala, pero chocando con la integralidad del color. Es un callejón conocido.

**Alberto Gallace, Chiara Etzi y colaboradores — texturas táctiles y correspondencias.**
Las texturas suaves se asocian a alta luminosidad, alta saturación cromática, sonidos graves y de baja intensidad, y a palabras de sonoridad redondeada; las rugosas, a lo contrario. *Uso*: dice que la textura **visual** tiene correspondencias sólidas con otras modalidades; **no** dice que el olor las tenga con la textura.

**Estudios de rugosidad táctil con estimulación olfativa y trigeminal.**
Hay trabajos que intentan sesgar la percepción de rugosidad presentando feniletanol —esperando sesgo hacia lo liso— o etanol —hacia lo rugoso— y **no encuentran interacción significativa**. *Uso*: es el dato que obliga a declarar el eje de textura como convención del sistema y no como correspondencia natural. Ver `06` §8, conflicto 2.

**Ophelia Deroy, Anne-Sylvie Crisinel y Charles Spence, "Crossmodal correspondences between odors and contingent features: odors, musical notes, and geometrical shapes", *Psychonomic Bulletin & Review*, 2013.**
Revisión que argumenta que las asociaciones olor-sonido no son primariamente conceptuales ni lingüísticas, sino mapeos amodales, indirectos y transitivos. *Uso*: complementa lo que ya tienes de Hanson-Vaux y Crisinel, y aporta el marco teórico de por qué existen.

**Nicola Di Stefano, Maurizio Murari y Charles Spence — "Crossmodal correspondences in art and science: odours, poetry, and music".**
*Uso*: el puente explícito entre la evidencia experimental y la práctica artística. Útil para justificar la separación carga/envoltura de `06` §2.

---

## G. Herramientas y datos

- **Pyrfume** — repositorio abierto de datasets olfativos. Tu documento ya cita `dravnieks_1985` y `keller_2016`. Añade `arctander_1960` y los volcados de GoodScents y Leffingwell.
- **Swiss Center for Affective Sciences, Universidad de Ginebra** — unige.ch/cisa/eos, distribución de GEOS, LEOS y SEOS.
- **Eurographics Digital Library** — el STAR de Borgo et al. en abierto.
- **sensorymaps.com** — archivo completo del trabajo de Kate McLean.

---

## H. Qué buscar todavía

Huecos que este research no ha cerrado y que conviene atacar antes de congelar el núcleo:

1. **Vocabulario de evaluación del oficio.** Términos como difusión, radiancia, volumen, lift, bloom, transparencia y linealidad se usan a diario en evaluación y no aparecen sistematizados en ninguna fuente académica que haya localizado. La vía probable es material de formación de ISIPCA, del Grasse Institute of Perfumery o de las escuelas internas de las casas. Puede que haya que reconstruirlo por entrevistas.
2. **Ruedas y mapas internos de las casas.** Rosace de Firmenich, genealogías de Symrise y H&R, el círculo de Drom. Publicados de forma fragmentaria; merecen una búsqueda dedicada.
3. **Estado de la técnica en patentes.** Antes de comercializar cualquier sello, revisión profesional del espacio de patentes sobre representación visual de fragancias.
4. **Evidencia de olor→textura visual**, distinta de olor→textura táctil. Es una pregunta que no parece estar hecha, y es exactamente la que tu sistema necesita. Podría ser un estudio propio pequeño y publicable.
