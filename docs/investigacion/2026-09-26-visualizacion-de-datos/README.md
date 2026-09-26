# Investigación: la visualización de datos, para las infografías de la app

*Abierta el 2026-09-26 por la pregunta P33 del [interrogatorio](../../interrogatorio.md).
Estado: en curso.*

## Para qué

El usuario quiere decidir aquí **las categorías de infografía de la app y cómo se dibuja
cada una**, con lo que dicen los expertos en visualización de datos, aplicado a esta app.
**Nada de lo visual está cerrado**: ni los gráficos de [decisiones §10.2](../../decisiones.md)
ni las variables del sello de los antecedentes. Primero se evalúa qué información enseñar, y
después cómo.

## Qué visualiza la app hoy (todo revisable)

- **El banco de formulación** ([decisiones §10.1](../../decisiones.md)):
  - **a la izquierda, imágenes:** un frasco que se llena con la masa pesada, y el
    **visualizador**, la pieza de firma de la app. Es única para cada fórmula, de muchas
    variables, y está sin diseñar (P23);
  - **a la derecha, datos:** la composición (material y %), la caja de IFRA con sus dos
    lecturas, y tres gráficos:
    - la **pirámide**: dónde cae cada material, de la salida al fondo;
    - el **reparto de la materia**: qué parte es cada material;
    - la **proyección por horas**: cuánto dura cada material;
  - **abajo, el historial como un dock:** cada adición es un icono con sigla y color. Un
    botón de *play* rehace la fórmula adición a adición, y los gráficos evolucionan con ella.
- **Reglas ya fijadas:**
  - los gráficos son iconográficos, y **los números salen al pasar** (§10.2);
  - **cada gráfico se calcula material a material**, para poder resaltar un material en todos
    a la vez (§10.3);
  - **lo desconocido nunca vale cero ni se pinta en verde** (§1.2). **Todo número lleva su
    base** (§1.1).
- **Los datos de cada material**, en investigación en el laboratorio (frente 6):
  - su posición entre salida y fondo, de 0 a 1;
  - su duración en horas y su intensidad;
  - su color por familia olfativa y su sigla;
  - sus tres descriptores del IFRA FIG, de un vocabulario de 27;
  - para las moléculas sueltas, el Principal Odor Map: un espacio de 256 dimensiones y 138
    etiquetas.

  Con eso se quiere un **mapa de olores propio, el AOM**. Se estudia también **enseñar qué
  zonas del cerebro activa un olor** (frente 7).
- **Una fórmula** tiene de 5 a 60 materiales con su % exacto, una historia de adiciones, y
  IFRA calculado por sustancia.

## Lo que ya hay: se parte de ahí, no se repite

- **[04 — El sello olfativo](../../antecedentes/lenguaje-visual/04-lenguaje-olfativo-visual.md):**
  - un glifo de **doce canales**, uno por eje perceptivo;
  - tres modos: 24 px, 320 px y comparar;
  - reglas para agregar el sello de una fórmula.
- **[06 — La criba](../../antecedentes/lenguaje-visual/06-criba-lenguaje-pictorico.md):**
  - **el presupuesto de canales**: 2 a 24 px, 4 o 5 a 300 px, y en un mapa 2 de posición más
    3 o 4 del glifo;
  - el aviso de las caras de Chernoff;
  - **cuatro conflictos abiertos**: la angularidad, la textura, lista o mapa, y continuo o
    cerrado.
- **[07 — Referencias nuevas](../../antecedentes/lenguaje-visual/07-referencias-nuevas.md):**
  Bertin, Cleveland y McGill, crossmodalidad, notación.
- **[Sistemas de codificación del olor](../../antecedentes/lenguaje-visual/sistemas-de-codificacion-del-olor.md)**
  y la **[comparativa FIG-POM](../../antecedentes/lenguaje-visual/2026-09-24-comparativa-ifra-fig-vs-pom.md)**.

## Las referencias del usuario

- **Un documento**, [referencias-semilla.md](referencias-semilla.md), salido de una
  conversación del usuario con otro asistente y copiado tal cual. Recoge:
  - los fundamentos: Munzner, Ware y Tufte;
  - el punto medio entre rigor y estética: Bremer, Stefaner, Lima y Lupi;
  - el arte de datos: Anadol e Ikeda;
  - los mapas de muchas dimensiones: el artículo de Distill sobre t-SNE, UMAP y el POM;
  - las herramientas: Observable, D3 y Three.js.
- **Siete imágenes**, que el usuario considera importantes conceptualmente: van de la figura
  científica exacta al arte de datos. **Son de terceros**, así que se guardan en local, fuera
  de Git, en `imagenes/`:

| # | Archivo | Qué es | Qué aporta |
|---|---|---|---|
| 1 | `1-neurociencia-radar-y-cerebro.webp` | Figura de un artículo de neurociencia del olfato:<br>• la tarea (oler, valorar);<br>• un radar de 21 escalas para dos moléculas y tres sujetos;<br>• un corte del cerebro con sus regiones (piriforme frontal y temporal, amígdala, orbitofrontal, y la auditiva como control);<br>• la correlación de patrones por región.<br>Parece Sagar et al., *Nature Neuroscience*, 2023: **a verificar** | La imagen del «olor en el cerebro», y un radar de descriptores |
| 2 | `2-islas-de-olor-en-pca.webp` | «Islas de olor» en un PCA:<br>• contornos por etiqueta (muguet, lavanda, jazmín…);<br>• sobre huellas moleculares, con la varianza escrita en los ejes (0,77 % y 0,60 %);<br>• frente a otro espacio cuyo segundo eje recoge el 12 %.<br>Del material del POM (Lee et al., 2023): **a verificar** | Cuánto se puede leer en una proyección: la varianza, dicha en el eje |
| 3 | `3-espectrograma-circular.webp` | Un espectrograma circular: anillos concéntricos de datos, blanco sobre negro | Lo radial y lo temporal como textura |
| 4 | `4-pom-infografia-explicativa.png` | Infografía divulgativa del POM:<br>• unas 5000 moléculas y 256 dimensiones, comprimidas a dos que recogen el 28 %;<br>• áreas tintadas por categoría amplia (floral, cárnica, etérea) y contornos por subcategoría;<br>• un punto gris por molécula.<br>Origen **a verificar** | Cómo se explica un mapa sin mentir: la leyenda dice qué se pierde |
| 5 | `5-malla-3d-cabeza.webp` | Una malla 3D con forma de cabeza, en degradado de color, sobre ondas | El arte de datos en 3D |
| 6 | `6-cimatica.webp` | Doce patrones cimáticos: mandalas azules sobre negro | Un patrón único que sale de una vibración |
| 7 | `7-pom-nube-de-osmo.png` | La visualización del POM hecha por Osmo:<br>• una nube de puntos con degradados (afrutado, almizcle, floral, cárnico);<br>• una molécula en cada esquina | El mapa como imagen de marca |

## Las preguntas

1. **¿Qué categorías de infografía necesita la app?** Se miden de dos maneras:
   - **por tarea:** leer un número exacto, comparar, ver el conjunto de un vistazo, seguir el
     tiempo, explorar un mapa, explicar;
   - **por fidelidad:** del gráfico exacto a la pieza de firma.
2. **Para cada categoría, cómo se codifica:** qué canal lleva cada dato, qué se puede deformar
   sin mentir y qué no.
3. **Qué se hace con lo que ya hay:** el sello de 04, los conflictos de 06 y los gráficos de
   §10.2.

## Cómo se investiga

Son cinco piezas, **cada una con un subagente Sonnet, de una en una**. Cada pieza se escribe
en su archivo al terminar y se revisa antes de lanzar la siguiente.

| # | Pieza | Referencias | Estado |
|---|---|---|---|
| 1 | [Fundamentos](1-fundamentos.md) | Munzner, Ware, Tufte | en curso |
| 2 | [Rigor y estética](2-rigor-y-estetica.md) | Bremer, Stefaner, Lima, Lupi | pendiente |
| 3 | [Mapas de muchas dimensiones](3-mapas.md) | Distill (t-SNE), UMAP, PCA, las figuras del POM | pendiente |
| 4 | [Arte de datos y cimática](4-arte-de-datos.md) | Anadol, Ikeda, la cimática, arte de datos frente a visualización | pendiente |
| 5 | [El olor ya dibujado](5-precedentes-del-olor.md) | Ruedas de aromas, perfiles sensoriales, figuras de neurociencia | pendiente |

Al final, **una síntesis con las categorías propuestas**. Se deciden de una en una, en el
interrogatorio.

## Reglas

- **Cada afirmación lleva su fuente y su confianza:** alta, media o baja. Lo que no se
  encuentra se marca «NO ENCONTRADO», y lo que se contradice, «DISCREPANCIA», como en el
  laboratorio.
- **Se parafrasea.** Como mucho, una cita breve por fuente.
- **Lo que proponga el investigador va marcado** como propuesta suya.
