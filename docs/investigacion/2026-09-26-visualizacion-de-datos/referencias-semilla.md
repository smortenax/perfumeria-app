# Referentes de Data Visualization
### Para explorar cómo mostrar datos complejos (mapas de olor, PCA, embeddings) de forma visualmente atractiva sin perder rigor representativo

---

## 1. Fundamentos teóricos (para no perder la función representativa)

Antes de ir a lo estético, conviene tener claro el marco de "qué se puede deformar y qué no" al codificar datos visualmente.

- **Tamara Munzner** — *Visualization Analysis and Design* (2014). El framework académico más citado hoy sobre qué datos, qué tareas y qué codificación visual usar. Tiene web propia del libro con todos los capítulos resumidos.
  🔗 https://www.cs.ubc.ca/~tmm/vadbook
- **Colin Ware** — *Visual Thinking for Design*. Traduce la ciencia de la percepción visual (color, textura, movimiento) en reglas prácticas de diseño. Muy útil para justificar decisiones de paleta y forma en gráficos multivariados como los radar charts que ya tienes.
  🔗 https://www.oreilly.com/library/view/visual-thinking-for/9780123708960/
- **Edward Tufte** — *The Visual Display of Quantitative Information*. El clásico sobre integridad gráfica y "data-ink ratio". Referencia obligada aunque su estética es minimalista, casi opuesta a lo que buscas — útil como contrapunto crítico.

---

## 2. El punto medio: rigor analítico + estética ("dataviz boutique")

Este es el grupo que probablemente más te interese: gente que trabaja con datasets grandes y complejos pero los resuelve con una estética deliberada y bella, sin falsear la estructura de los datos.

- **Nadieh Bremer** (Visual Cinnamon) — Astrónoma reconvertida en diseñadora de datos. Diseña visuales a medida para cada dataset específico, con uso intensivo de gráficos radiales/polares — directamente relevante para tu radar chart de descriptores de olor (imagen del paper de olfato). Coautora de los libros *Data Sketches* y *CHART*.
  🔗 https://www.visualcinnamon.com/
- **Moritz Stefaner** (Truth & Beauty) — Se define como "Truth and Beauty Operator": equilibra lo analítico y lo estético al mapear fenómenos abstractos complejos. Su podcast *Data Stories* (con Enrico Bertini) tiene años de entrevistas a gente de este campo, muy útil como archivo de investigación.
  🔗 https://truth-and-beauty.net/ · Podcast: https://datastori.es/
- **Manuel Lima** — Fundador de *VisualComplexity.com*, un repositorio curado de cientos de visualizaciones de redes y sistemas complejos cruzando disciplinas (biología, redes sociales, lingüística). Autor de *Visual Complexity: Mapping Patterns of Information*. Ideal para ver cómo otros han resuelto nubes de puntos y redes de alta dimensión.
  🔗 https://visualcomplexity.com/
- **Giorgia Lupi** (Pentagram / ex-Accurat) — Pionera del "Data Humanism": trata el dato como lenguaje humano, no solo como número. Coautora de *Dear Data*. Menos aplicable a gráficos científicos estrictos, pero muy útil si en algún momento quieres dar una capa narrativa/emocional a los perfiles de olor.

---

## 3. Data art / esculturas de datos (conecta con tus imágenes más abstractas)

Las imágenes que subiste del render tipo "cabeza wireframe", el espectrograma circular y los patrones tipo cimática encajan con la estética de este campo, donde el dato deja de ser gráfico "legible" y se convierte en experiencia visual generativa.

- **Refik Anadol Studio** — Toma datos masivos (incluyendo el *Human Connectome Project*, es decir, mapeo de conectividad cerebral) y los convierte en "esculturas de datos" mediante redes neuronales y point clouds/shaders. Es la referencia estética más directa para tus imágenes tipo render 3D/wireframe. Útil sobre todo para pensar el proceso técnico (nubes de puntos, campos de partículas, gradientes de color como codificación) más que para representar fielmente relaciones cuantitativas.
  🔗 https://refikanadol.com/

Para sonido/cimática específicamente (patrones circulares, mandalas de datos), vale la pena que busques también trabajo de **Ryoji Ikeda** (data + sonido) y proyectos de *generative art* con Processing/openFrameworks que usan sonificación como fuente — es un campo muy activo pero más disperso, sin un "canon" tan claro como el de la sección 2.

---

## 4. Técnicas específicas para tus datos (embeddings de alta dimensión: PCA, t-SNE, UMAP)

Esto es clave porque tus imágenes 2, 3 y 4 son justo proyecciones 2D de espacios de cientos de dimensiones — hay que saber qué se puede y qué no se puede leer en ellas.

- **"How to Use t-SNE Effectively"** (Wattenberg, Viégas & Johnson, Distill, 2016) — el artículo de referencia sobre cómo no malinterpretar clusters y distancias en proyecciones t-SNE. Interactivo, con simulaciones en vivo.
  🔗 https://distill.pub/2016/misread-tsne/
- **UMAP** como alternativa a t-SNE/PCA — preserva mejor la estructura global del espacio, interesante para comparar con las "islas" de olor que ya tienes mapeadas.
- **El paper POM original**: Lee, B.K. et al. "A Principal Odor Map Unifies Diverse Tasks in Olfactory Perception." *Science* 381, 999–1006 (2023).
  🔗 https://www.science.org/doi/10.1126/science.ade4401
  Post del blog de Osmo explicando el proyecto en lenguaje más accesible: 🔗 https://osmo.ai/blog/science-paper-shows-osmo-ai-passes-the-sniff-test

---

## 5. Herramientas prácticas para prototipar

- **Observable** (observablehq.com) — notebooks colaborativos en D3.js, el estándar de facto para dataviz custom en la web; ahí Bremer, Stefaner y muchos otros publican y comentan su código.
- **D3.js** (d3js.org) — la librería de base de casi todo lo mencionado en la sección 2.
- **Three.js / shaders (GLSL)** — la base técnica de las piezas tipo Anadol (point clouds, campos de partículas, gradientes de color en 3D).

---

## Cómo lo usaría yo para tu proyecto concreto

1. Para los **radar/spider charts** de descriptores de olor → mira específicamente el trabajo radial de Nadieh Bremer.
2. Para los **mapas PCA/t-SNE de moléculas** → lee primero el artículo de Distill antes de rediseñar nada, para saber qué distorsiones son inherentes al método.
3. Para una versión más **"escultura de datos"** del mapa de olor (menos gráfico, más experiencia) → estudia el proceso técnico de Refik Anadol Studio, aunque sacrificarás precisión cuantitativa a cambio de impacto visual.

¿Quieres que profundice en alguno de estos bloques — por ejemplo, un desglose técnico de cómo Bremer construye sus radiales en D3, o ejemplos concretos de proyectos que combinen PCA con estética tipo "point cloud"?
