# 06 — Criba del lenguaje pictórico

Documento de decisión, no de diseño. Aquí no se dibuja nada: se decide qué sobrevive y con qué criterio. Complementa a `04-lenguaje-olfativo-visual.md`, al que **corrige en varios puntos** (ver §7).

---

## 1. Dónde está realmente el problema

El research de partida (`Odor Description, Classification and Coding Systems at the Ingredient Level`) resuelve bien una mitad: qué sistemas existen para codificar el olor de una materia prima, cuáles replicaron y cuáles no, y qué ejes convergen entre autores. Su conclusión —agrado, díada fresco/cálido, intensidad y un puñado de clases cualitativas— es sólida.

La otra mitad está sin hacer, y es la que decide si el proyecto funciona: **cuántos ejes caben simultáneamente en un signo antes de que deje de leerse**.

Esa pregunta no la responde la literatura olfativa. La responde la teoría de codificación visual, que lleva desde 1967 midiendo exactamente eso. Y su respuesta es incómoda: el presupuesto es mucho más pequeño de lo que parece.

**El cuello de botella no es la falta de ejes. Es que sobran.** La criba no consiste en añadir sistemas hasta cubrirlo todo, sino en ordenar por prioridad y amputar. Todo lo que sigue está organizado para eso.

---

## 2. Los tres filtros

Cualquier candidato —eje, sistema, referente visual— pasa por los tres en orden. Falla uno, no pasa.

### Filtro 1 — ¿Qué mide exactamente?

Ya está en tu documento y es correcto: cualidad, intensidad, potencia, afecto y cinética son cosas distintas que se confunden constantemente. Añado dos categorías que faltan y que sí necesitas separar:

- **Convención cultural** (género, "limpio", lujo, estacionalidad): no es percepción, es lectura aprendida. Puede codificarse, pero declarada como tal.
- **Relación entre muestras** (esto huele como aquello): no es una propiedad de un material, es una propiedad de un par. Genji-kō, que es el precedente histórico más interesante, codifica exactamente esto y nada más (§4).

### Filtro 2 — ¿Es codificación o es evocación?

**La prueba de lectura inversa.** Enseña el signo a un experto que conozca el sistema, sin el material delante, y pídele los valores. Si no puede recuperarlos con precisión razonable, no tienes un lenguaje: tienes una ilustración.

Esta prueba es la que separa tus referentes visuales en dos montones, y es brutal: la cimática y la iridiscencia caen del lado de la evocación, no por feas, sino porque no son invertibles.

**Pero eso no las descarta.** La salida elegante es dividir el signo en dos zonas con reglas distintas:

- **Carga** — la parte que lleva datos. Reglas duras, invertible, verificable, aburrida si hace falta.
- **Envoltura** — la parte que hace que apetezca mirarlo. Libertad total, coherente con la carga, sin obligación de significar.

Esto resuelve la tensión que planteas entre "atractivo" y "descriptivo" sin tener que sacrificar ninguna de las dos. Lo que no se puede hacer es mezclarlas: en cuanto la envoltura parece que significa algo, el experto empieza a leerla y el sistema se corrompe.

### Filtro 3 — ¿Sobrevive al canal?

Aquí entra la literatura que falta en tu documento. Cuatro resultados que actúan como restricciones duras:

**a) No todos los canales son igual de precisos.** Bertin (1967) estableció las variables visuales y sus propiedades perceptivas; Cleveland y McGill (1984) y después Mackinlay y Munzner las ordenaron empíricamente por precisión de lectura. El orden, de más a menos preciso para datos cuantitativos: posición sobre escala común → longitud → ángulo/pendiente → **área** → volumen → color/densidad. **El área está en la mitad baja.** Codificar potencia como radio del núcleo —que es lo que propone `docs/04`— usa uno de los peores canales para el eje que luego pondera todo lo demás.

**b) Hay canales que no se pueden leer por separado.** Garner y Felfoldy (1970) distinguen dimensiones *integrales* de *separables*. Tono, saturación y luminosidad son integrales: el ojo las funde en "un color" y no las descompone. Ware demostró que los pares más separables (tono con textura, por ejemplo) dan lecturas más precisas que los integrales.

> **Consecuencia directa**: la propuesta de `docs/04` de codificar familia en el tono, pureza en el croma y luz en la luminosidad **no son tres ejes: es uno**. Es "un color", leído holísticamente. Si quieres tres, hacen falta tres canales separables.

**c) Solo unos pocos rasgos se ven sin mirar.** Treisman: color, orientación, tamaño y movimiento son preatentivos —se detectan en paralelo, sin barrido—. Todo lo demás exige inspección. Para el modo de 24 px en una lista de 300 materias, solo los preatentivos cuentan.

**d) Hay criterios de diseño de glifos ya sistematizados.** Borgo et al. (Eurographics 2013, *Glyph-based Visualization*) recopilan catorce criterios: capacidad del canal, ordenabilidad, cercanía semántica, preatención, robustez, normalizabilidad, separabilidad, balance de atención, buscabilidad, jerarquía visual y aprendibilidad. Es la lista de comprobación que deberías aplicar a cada versión del sello antes de dibujarla.

---

## 3. El presupuesto de canales

Esto es la conclusión operativa de todo el documento.

| Modo | Contexto | Canales de datos que caben |
|---|---|---|
| Miniatura 24 px | Lista de biblioteca, entrada de fórmula | **2**, y ambos preatentivos |
| Ficha 300 px | Tarjeta de material | **4–5** separables |
| Mapa | Biblioteca completa como espacio | **2 de posición + 3–4 del glifo** |
| Comparador | Dos o tres materiales enfrentados | 4–5, pero solo si los glifos son idénticos salvo en los ejes comparados |

Tu research identifica del orden de diez ejes defendibles. `docs/04` propone once canales. El presupuesto real es de cuatro o cinco.

**No es un problema de ejecución, es la restricción del medio.** Cualquier sistema que intente meter once ejes en un signo produce algo que se ve bonito, que nadie sabe leer, y que en seis meses todo el mundo interpreta a ojo como si fuera una mancha de color. Ese es el destino de las caras de Chernoff (1973), el intento más famoso de codificar multivariante en un icono: fracasó porque los rasgos faciales tienen saliencias muy distintas —el tamaño de la boca domina la curvatura de las cejas— y porque el lector aplica lectura fisonómica en lugar de lectura de datos.

---

## 4. Referentes nuevos y qué aporta cada uno

Los que faltan en tus dieciséis y en el research, ordenados por lo que resuelven. La ficha completa está en `07-referencias-nuevas.md`.

### Genji-kō (源氏香), Japón, s. XVI–XVII — el único ideograma olfativo que ha durado

En el juego, se pasan cinco muestras de madera aromática. Cada participante traza cinco líneas verticales de derecha a izquierda y **une con una horizontal las que le han olido igual**. Las agrupaciones posibles de cinco elementos son 52, y cada patrón lleva el nombre de un capítulo del *Genji Monogatari*.

Tres lecciones, y las tres son incómodas para tu planteamiento:

1. **Codifica relaciones, no cualidades.** No dice a qué huele nada. Dice qué se parece a qué. Es la operación olfativa que un experto sí puede hacer de forma fiable.
2. **El conjunto es cerrado y está nombrado.** 52 patrones, cada uno con nombre, resonancia literaria y estación asociada. Un sistema cerrado y bautizado se memoriza; una parametrización continua no. La gente habla con nombres, no con vectores.
3. **Sobrevivió porque salió del papel.** Los patrones acabaron en kimonos, biombos, papeles de regalo. La notación se volvió ornamento y el ornamento mantuvo viva la notación.

**Implicación concreta**: además del sello paramétrico continuo, define un conjunto cerrado de **20–30 tipos nombrados** —regiones del espacio, no puntos— para que la gente pueda decir "esto es un [nombre]" en vez de recitar coordenadas. Los sistemas de color hacen exactamente esto: Munsell es continuo y aun así todo el mundo dice "rojo".

### GEOS — Geneva Emotion and Odour Scale (Chrea, Grandjean, Delplanque, Scherer et al., 2009)

**Este es el hallazgo que más te interesa, porque es exactamente la capa subjetiva que echas en falta y resulta que está validada.**

Desarrollada en el Swiss Center for Affective Sciences con Firmenich. Parten de un conjunto inicial de cientos de términos afectivos y lo reducen en tres pasos hasta 36 términos agrupados en **seis dimensiones**. Compararon GEOS contra los modelos clásicos —emociones básicas y valencia×activación×dominancia— en intensidad reportada, acuerdo entre jueces y poder discriminativo, y GEOS gana en los tres.

Después replicaron el procedimiento en Liverpool (LEOS) y Singapur (SEOS). Las dimensiones **compartidas por las tres culturas** son: **asco, felicidad/bienestar, sensualidad/deseo y energía**. Las dos europeas comparten además calma/serenidad. Placer sensorial es específica de Ginebra; nostalgia y hambre/sed de Liverpool; estimulación intelectual, espiritualidad y sentimientos negativos de Singapur.

Lee eso otra vez: **sensualidad/deseo** y **energía** son dimensiones afectivas del olor estables entre culturas, obtenidas por análisis factorial en 2009. Son, casi literalmente, los polos *erógeno* y *estimulante* que Paul Jellinek postuló en 1951 desde la pura intuición de perfumista.

Esa convergencia es el argumento más fuerte que puedes tener para conservar el plano de Jellinek. Y te da algo mejor que Jellinek: un instrumento con términos, con estructura factorial publicada y con datos de acuerdo entre jueces. Tu documento menciona el afecto solo como "agrado + activación + familiaridad", que es precisamente el modelo que GEOS demuestra insuficiente para olores.

**Decisión propuesta**: sustituir el plano Jellinek crudo por un plano GEOS de dos ejes —sensualidad/deseo y energía—, conservando la nomenclatura de Jellinek en la interfaz porque es la que habla el perfumista, y dejando asco y calma como ejes de segundo anillo.

### Teoría de codificación visual — Bertin, Cleveland–McGill, Garner–Felfoldy, Treisman, Borgo et al.

Ya desarrollada en §2. Es el cuerpo bibliográfico que faltaba por completo y el que impone el presupuesto de §3.

### Isotype — Otto Neurath y Gerd Arntz, años 20–30

El sistema pictórico que sí funcionó. Su regla central: **más cantidad se representa repitiendo el mismo signo, nunca agrandándolo**. Neurath lo impuso porque el área se juzga mal —lo que Cleveland y McGill medirían cuarenta años después—.

**Aplicación directa**: potencia e intensidad no deberían ser el radio del núcleo. Deberían ser un recuento de unidades repetidas. Es menos elegante y se lee mucho mejor.

### Munsell y NCS — cómo se consigue que una notación se adopte

Munsell no triunfó por tener tres ejes bien elegidos, sino porque **envió muestras físicas**. El sistema es la caja de referencias; el diagrama es documentación.

**Implicación estratégica, y creo que es la más importante de este documento**: tu foso competitivo probablemente no sea la app. Es el **kit de anclas** —los viales físicos que calibran cada eje— y el protocolo que los acompaña. Es lo que hicieron Le Nez du Vin, el léxico sensorial de World Coffee Research y Crocker–Henderson con su *Odor Directory*. Un lenguaje sin patrones físicos es una convención privada.

### Kate McLean — smellmaps, 2010 en adelante

La única persona que lleva quince años construyendo un vocabulario visual para el olor de forma sistemática. Su simbología declarada: **tono ← descriptor; saturación ← intensidad percibida; tamaño de la marca ← duración; posición ← secuencia en el recorrido**. La forma la declara arbitraria.

Dos cosas que aprender. Una: es una asignación de cuatro canales, no de once, y tres de ellos son separables. Dos: llama a sus mapas "propuestas" y "mapas de posibilidad", no representaciones. Esa honestidad epistémica es imitable y además protege el proyecto.

Nota: usa saturación para intensidad, que es un canal integral con el tono. Es una debilidad conocida de su sistema, no un modelo a copiar en ese punto concreto.

### Patentes de las grandes casas — precedente y aviso legal

Existen patentes concedidas sobre interfaces de formulación basadas en pictogramas donde **el tamaño del pictograma representa la contribución olfativa del ingrediente** y **el color representa la familia olfativa**, además de códigos pictóricos donde regiones de color y símbolos codifican acordes e ingredientes y son legibles por reconocimiento de imagen.

Dos consecuencias. Primera: la idea de "tamaño = contribución, color = familia" no es terreno virgen; conviene revisar el estado de la técnica con un agente de patentes antes de comercializar. Segunda: refuerza el argumento de que la diferenciación real está en la capa subjetiva y en el kit de anclas, no en el mapeo obvio.

### Ohloff, Pickenhagen y Kraft — *Scent and Chemistry* (2011, 2.ª ed. 2022)

No está en tus dieciséis y debería. Incluye un capítulo dedicado a la descripción y clasificación de la impresión odorante, y unos cuatrocientos ejemplos de perfumería. Es la fuente moderna de referencia para descripciones de materiales con rigor químico, el complemento técnico de Arctander.

---

## 5. Criba de ejes

Cuatro veredictos: **núcleo** (va en el sello, siempre), **segundo anillo** (va en la ficha, no en el sello), **metadato** (dato guardado y filtrable, sin representación visual) y **fuera**.

| Eje | Respaldo | Canal viable | Veredicto | Motivo |
|---|---|---|---|---|
| Clase cualitativa / familia | Muy alto, converge desde Zwaardemaker hasta POM | Color categórico | **Núcleo** | Es lo primero que pregunta cualquiera |
| Agrado / valencia | Muy alto (Khan–Sobel: primer componente) | Curvatura del contorno | **Núcleo, con conflicto** | Ver §8 |
| Fresco ↔ cálido | Alto (segundo eje de Zarzo–Stanton) | Posición en mapa | **Núcleo si hay mapa** | Solo funciona como coordenada |
| Ligero ↔ pesado / sustantividad | Alto (primer eje de Zarzo–Stanton) | Posición en mapa | **Núcleo si hay mapa** | Ídem |
| Sensualidad / deseo | Alto (GEOS, estable entre culturas) | Posición o marca | **Núcleo** | Es tu diferencial frente al POM |
| Energía / estimulación | Alto (GEOS) | Posición o marca | **Núcleo** | Ídem |
| Potencia (OAV / factor FD) | Muy alto como medida | Repetición de unidades | **Núcleo, no como área** | Regla Isotype |
| Intensidad percibida | Alto (gLMS) | — | **Metadato** | Redundante con potencia; elige una |
| Tenacidad | Muy alto | Longitud | **Segundo anillo** | Longitud es buen canal, pero no cabe a 24 px |
| Textura / grano | **Bajo** para olor→textura | Textón | **Núcleo provisional, declarado convención** | Ver §8 |
| Limpieza | Nulo experimental, alto en la práctica del oficio | — | **Segundo anillo** | Vocabulario real de perfumista, sin validación; no gastes canal en él |
| Comestibilidad | Medio (Zarzo, geometría hiperbólica) | — | **Metadato** | Muy correlacionado con agrado |
| Complejidad / nº de facetas | Medio | Recuento de sectores | **Segundo anillo** | Se lee bien pero no es prioritario |
| Evolución / linealidad | Medio | Animación o perfil de estela | **Segundo anillo** | Es temporal; pide TDS, no un glifo |
| Abstracción ↔ figurativo | Bajo | — | **Metadato** | Interesante, sin instrumento |
| Sequedad ↔ humedad | Muy bajo | — | **Fuera** | Sin respaldo y sin canal libre |
| Género | Convención cultural | — | **Metadato y filtro** | No merece canal; ver `docs/02` §4 |
| Hedónico personal | — | — | **Fuera del sello, siempre** | Corrompe el lenguaje compartido |

Ejes en el núcleo: siete candidatos para cuatro o cinco plazas. La decisión final depende de §8.

---

## 6. Criba de canales

| Canal | Capacidad | Tipo de dato | Separabilidad | ¿A 24 px? | Veredicto |
|---|---|---|---|---|---|
| Posición 2D | Muy alta | Cuantitativo | Máxima | Solo en mapa | **Adoptar** — el mejor canal, obliga a que la biblioteca sea un mapa |
| Color categórico | 8–12 categorías | Nominal | Alta frente a forma y textura | Sí, preatentivo | **Adoptar** — uno solo, leído en bloque |
| Curvatura del contorno | 3–5 niveles | Ordinal | Alta | Sí | **Adoptar** — el mapeo crossmodal mejor replicado |
| Textón / trama | 3–4 niveles | Nominal u ordinal | Muy alta frente a color | Marginal | **Adoptar con reservas** |
| Longitud | Alta | Cuantitativo | Alta | No | **Adoptar solo en ficha** |
| Recuento de unidades | 1–7 | Cuantitativo discreto | Alta | Marginal | **Adoptar** para potencia |
| Saturación y luminosidad | 3–4 niveles | Ordinal | **Nula frente al tono** | Engañoso | **Descartar como eje propio** |
| Área / radio | Baja precisión | Cuantitativo | Media | Sí | **Descartar** — canal impreciso |
| Opacidad | 3 niveles | Ordinal | Baja | No | **Descartar** — se confunde con color y tamaño |
| Orientación | ~4 niveles | Ordinal | Alta | Sí, preatentivo | **Reserva** — capacidad muy limitada |
| Halo / difuminado | 2–3 niveles | Ordinal | Baja | No | **Descartar** |
| Animación | Alta | Temporal | Alta | No | **Reserva** para la evolución temporal, solo en ficha |

---

## 7. Correcciones a `docs/04`

El documento anterior propone once canales. Falla en cuatro puntos concretos:

1. **Tono, croma y luminosidad como tres ejes independientes.** Son dimensiones integrales: es un solo canal. Corregir a un color = una identidad cualitativa.
2. **Potencia como radio del núcleo.** El área es un canal impreciso. Cambiar a repetición de unidades (regla Isotype).
3. **Once canales frente a un presupuesto de cinco.** Aguja de efecto, muesca de limpieza, calidad de borde por sequedad, halo de difusión, opacidad por peso y barra de género salen del sello y pasan a ficha o a metadato.
4. **La aguja de Jellinek dentro del núcleo.** Un vector sobre un fondo texturado y coloreado es ilegible a cualquier tamaño. Si el plano de efecto es importante —y con GEOS detrás lo es—, tiene que ser **posición en el mapa**, no una marca dentro del glifo.

El resto del documento 04 —la separación descriptivo/hedónico, las anclas de calibración, el protocolo de cata, la agregación por percentiles, el perfil objetivo frente al conseguido— sigue en pie y es lo mejor que tiene.

---

## 8. Los cuatro conflictos que hay que resolver antes de dibujar

Ninguno se resuelve pensando. Los cuatro tienen un test asociado.

### Conflicto 1 — La angularidad codifica agrado, que dijiste dejar fuera

El mapeo olor→forma es el crossmodal con más respaldo, y lo que predice la angularidad es el **desagrado y la intensidad**, mediados por estimulación trigeminal. Pero tú separaste deliberadamente lo descriptivo de lo hedónico. Si el mejor canal disponible codifica justo lo que querías excluir, hay que elegir.

- **Opción A**: angularidad ← trigeminalidad/pungencia. Más objetivo, menos respaldo directo.
- **Opción B**: angularidad ← agrado de panel, no personal. El agrado agregado sí es descriptivo del material.
- **Opción C**: angularidad ← otro eje declarado como convención pura.

Recomiendo B. *Test*: 15 perfumistas, 30 materiales, escala redondo–anguloso; correlacionar con agrado de panel y con pungencia por separado. Gana la que correlacione más.

### Conflicto 2 — ¿La textura tiene base o es convención?

Tú la nombras como uno de los tres descriptores sinestésicos centrales, junto a color y potencia. La evidencia es más débil de lo que parece: existen correspondencias intermodales robustas entre textura táctil y luminosidad, entre textura y sonido, entre gusto y textura; **para olor→textura táctil la evidencia es escasa y hay estudios que no encuentran efecto** al intentar sesgar la percepción de rugosidad con odorantes.

No es motivo para descartarla. Es motivo para **declararla convención del sistema** en vez de venderla como correspondencia natural. Un lenguaje puede tener signos arbitrarios: el alfabeto lo es. *Test*: si tras el free sorting con perfumistas emerge una dimensión que ellos verbalizan como textura, mantenla; si no, es un canal libre y puedes asignarle otra cosa.

### Conflicto 3 — Lista o mapa

El canal más potente es la posición, y solo existe si la biblioteca **es un mapa**, no una lista. Eso cambia el producto: dejas de tener el patrón de Formulair y pasas a tener un espacio navegable donde cada materia ocupa un lugar por lo que huele.

Es una decisión de producto grande, con un coste real: en un mapa se busca peor. La solución probable es tener ambos y que el mapa sea la vista por defecto de exploración, la lista la de trabajo.

Si eliges mapa, la segunda decisión es qué plano: el de Zarzo–Stanton (ligero/pesado × fresco/cálido, interpretable, publicado) o el de GEOS (sensualidad × energía, subjetivo, es tu diferencial). **No los mezcles en un solo mapa**: haz dos vistas conmutables del mismo corpus. Ver también §9 sobre por qué no usar directamente el PCA del POM.

### Conflicto 4 — Continuo o cerrado

Un espacio continuo permite precisión; un conjunto cerrado de tipos nombrados permite hablar. Genji-kō, Munsell y las ruedas de café resuelven lo mismo de la misma forma: base continua, encima una capa de regiones con nombre.

Recomiendo derivar los nombres empíricamente en lugar de inventarlos: clustering sobre las valoraciones reales una vez tengas 200–300 materias evaluadas, y bautizar los clusters resultantes. *Test*: dos perfumistas que no se hayan puesto de acuerdo asignan el mismo nombre al mismo material más del 70 % de las veces.

---

## 9. Tus referentes visuales, uno a uno

| Referente | Qué es en realidad | Veredicto |
|---|---|---|
| Nube del POM y mapas PCA | Mapa de un corpus, no signo de un material | **Vista de biblioteca, no glifo.** Y con cautela: en el gráfico que aportas, PC1 y PC2 juntos recogen el 28 % de la información del conjunto; en la variante de fingerprints, décimas de punto porcentual. Un plano 2D de un embedding de alta dimensión no es un mapa legible, es una sombra |
| Islas de olor en espacio PCA | Ídem, con densidades por categoría | **Referencia de forma, no de método.** Sus ejes no son interpretables; los de Zarzo–Stanton sí. Prefiere ejes que se puedan nombrar |
| Radar de descriptores del estudio de fMRI | Perfil multivariante clásico | **Panel de detalle en la ficha.** El radar tiene mala reputación merecida para comparar entre ítems: el área depende del orden de los ejes y engaña. Como perfil de un solo material, funciona |
| Nube coloreada con descriptores sobrepuestos | Mapa + etiquetas | **Buen modelo de presentación** para la vista de mapa. Las etiquetas flotantes sobre densidad son legibles |
| Baldosa de gradiente "Floral / Balsámico" | Dos facetas y su proporción en un solo cuadrado | **El candidato más fuerte para el modo 24 px.** Escala, imprime, se lee de un vistazo. Aviso: el gradiente es integral, no admite un tercer dato encima |
| Kiki y bouba | El mapeo crossmodal mejor replicado | **Adoptar como canal de contorno**, sujeto al conflicto 1 |
| Iridiscencia / interferencia de capa fina | Evocación | **Envoltura, no carga.** Un solo uso legítimo como dato: color dependiente del ángulo para representar el viraje de facetas en el tiempo, y solo en un medio interactivo |
| Cimática y figuras de Chladni | Evocación | **Rechazar como codificación.** El patrón lo determinan frecuencia y geometría de la placa; no hay mapeo principiado desde el olor, y la correspondencia olor→tono está mediada por lo hedónico y medida en muestras pequeñas. **Pero**: como fuente de tramas para el canal de textón, declarada como convención, es aprovechable, y su estética de línea conecta mejor de lo esperable con Genji-kō |

---

## 10. La prueba que decide si esto funciona

Un solo criterio de aceptación, y conviene fijarlo ahora, antes de que haya nada dibujado y de que dé pena tirarlo:

> Se enseñan **20 sellos** a **10 perfumistas** que hayan recibido **una hora** de formación en el sistema, sin los materiales delante. Cada uno estima los valores de cada eje. El sistema es válido si la correlación entre valores estimados y valores reales supera **0,7** en todos los ejes del núcleo.

Debajo de 0,7 en algún eje: ese eje sale del núcleo, no se rediseña. Debajo en tres o más: el presupuesto de canales sigue siendo demasiado alto y hay que amputar otra vez.

Pruebas secundarias, en este orden:

1. **Discriminación a 24 px.** Dos materias vecinas en el espacio, ¿se distinguen en la miniatura? Si no, la miniatura sobra y en la lista va texto.
2. **Memorabilidad.** A una semana, ¿reconocen el sello de una materia que conocen bien?
3. **Agrado.** Sí, hay que medirlo: si nadie quiere mirarlo, no se usa. Pero se mide **después** de la lectura inversa, nunca antes, porque un signo bonito e ilegible siempre gana en una comparación a ciegas.

---

## 11. Orden de trabajo propuesto

1. **Resolver el conflicto 3** (lista o mapa). Condiciona todo lo demás y es decisión tuya, no de un test.
2. **Free sorting con 15 perfumistas sobre 40 materias**, con MDS y clustering. Sale de ahí: cuántas dimensiones emergen de verdad, si la textura es una de ellas (conflicto 2), y los clusters que darán nombre a los tipos (conflicto 4).
3. **Correlacionar angularidad contra agrado y contra pungencia** (conflicto 1).
4. **Congelar el núcleo**: cuatro o cinco ejes, ni uno más, por escrito y con el canal asignado.
5. **Definir el kit de anclas** y fabricar la primera tanda de viales. Antes de dibujar nada.
6. **Entonces sí, bocetos.** Tres direcciones distintas para el mismo núcleo congelado, y la prueba de §10 decide.
