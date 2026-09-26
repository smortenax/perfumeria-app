---
tipo: frente
numero: 7
herramienta: chat con web (papers, datasets, documentación técnica); Claude Code si hace falta probar OpenPOM
estado: pendiente
fecha: 2026-09-26
encargo: perfumeria-app, interrogatorio P32
---

# Frente 7 — El POM a fondo, y lo que el olor hace en el cerebro

## Contexto mínimo

La app quiere un **mapa de olores propio, el AOM** (mapa agregado de olores). Se haría con los
descriptores del FIG, los datos del POM y la intensidad (frente 6).

El usuario cree que en el **Principal Odor Map** hay información muy valiosa si se indaga.
Tiene además una idea: **enseñar cómo estimulan los olores el cerebro, a nivel neuronal.** La
ve muy potente y poco explorada. En unas infografías sobre el POM que vio salía una imagen de
los olores estimulando zonas del cerebro.

**Lo que ya se sabe**, según la comparativa FIG-POM del 2026-09-24, sobre Lee et al.,
*Science*, 2023:

- el POM es un espacio de 256 dimensiones que una red neuronal de grafos calcula a partir de la
  estructura de una molécula;
- se entrenó con unas 5000 moléculas y 138 etiquetas (GoodScents y Leffingwell), y se validó
  con un panel de 15 personas sobre 400 moléculas nuevas;
- solo modela moléculas sueltas: no absolutos, resinoides, tinturas ni mezclas;
- la concentración no entra en el mapa: predice el umbral de detección, no la intensidad por
  encima del umbral;
- el modelo de Osmo no es público, pero existe una réplica abierta, OpenPOM. Según otro
  documento anterior, Osmo solo licencia el POM para uso no comercial: **a verificar**.

No hace falta repetirlo: este frente va más hondo.

## Preguntas

### A · Qué hace exactamente el POM

1. **Qué entra, qué sale y cómo se obtuvo.** Qué significa «principal» y qué es cada dimensión.
   El artículo dice que el mapa «unifica tareas diversas» de la percepción del olor: ¿cuáles
   son esas tareas?
2. **Qué sabe hacer y qué no:** mezclas, intensidad, enantiómeros, impurezas, almizcles.
3. **Qué ha salido después, de 2023 a hoy:** trabajos de Osmo y de otros que amplíen el POM (a
   mezclas, a la intensidad, a su relación con el metabolismo…), réplicas independientes y
   críticas.
4. **Qué se puede usar de verdad:**
   - OpenPOM: su licencia, si publica los pesos o hay que reentrenarlo;
   - el conjunto de entrenamiento, y su licencia;
   - cómo sacar el SMILES de cada CAS;
   - cuántos de los 3119 ingredientes del glosario FIG son moléculas sueltas con estructura
     conocida.
5. **Las condiciones de Osmo**, con su fuente: para uso no comercial y para un producto.

### B · El olor en el cerebro: qué se sabe y qué se puede enseñar

6. **El camino del olor**, del receptor de la nariz a la corteza. ¿Qué partes están bien
   establecidas en personas, y cuáles se conocen solo en animales?
7. **¿Hay datos, molécula a molécula, de qué receptores olfativos activa cada una?** Qué
   conjuntos existen, cuántos receptores y cuántos materiales de perfumería cubren, y cuántos
   de los 54 de la paleta.
8. **¿Hay datos que unan olores con zonas del cerebro en personas**, con resonancia, PET u
   otras técnicas? ¿A qué nivel: por molécula, por familia, por agrado o por intensidad? ¿Se
   repiten los resultados entre estudios?
9. **¿Se relaciona el POM con los receptores o con la actividad neuronal?** ¿Hay trabajos que
   lo comparen?
10. **La imagen del cerebro de las infografías:** ¿de dónde sale? ¿Es una figura científica,
    una ilustración de prensa o un dibujo generado?
11. **¿Se ha enseñado ya** la actividad neuronal de un olor, en apps, museos o divulgación?
    ¿Es de verdad poco explorado? Quién lo ha hecho y cómo.
12. **Qué sería honesto enseñar por material**, de lo más sólido a lo menos:
    - la activación de receptores, si hay datos;
    - las zonas del cerebro por familia o por agrado, que son generales y no de cada material;
    - un esquema, declarado como esquema.

    **Y qué sería pseudociencia:** un mapa cerebral por material sin datos detrás.

### C · Qué le sirve a la app

13. **Para el AOM:** qué aporta el POM, qué hacer con los naturales (¿a través de sus
    constituyentes, con el FIG?) y cuál es la versión mínima recomendable.
14. **Para la idea neuronal, un veredicto:** factible con datos, factible solo como esquema, o
    no factible. Con qué datos y con qué licencia.

## Dónde buscar

- El artículo de Lee et al. (*Science*, 2023), sus materiales suplementarios y su preprint en
  bioRxiv; las publicaciones y el blog de Osmo.
- OpenPOM en GitHub y su tutorial en DeepChem; Pyrfume.
- Google Scholar y PubMed: *principal odor map*, *odorant receptor deorphanization*,
  *olfactory receptor activation dataset*, *human olfactory cortex fMRI*, *odor valence
  orbitofrontal*.
- Revisiones en *Chemical Senses*, *Neuron* y *Nature Neuroscience*.

**Antes, lo que ya se sabe.** En la app:
- la [comparativa FIG-POM](https://github.com/smortenax/perfumeria-app/blob/main/docs/antecedentes/lenguaje-visual/2026-09-24-comparativa-ifra-fig-vs-pom.md);
- [`sistemas-de-codificacion-del-olor.md`](https://github.com/smortenax/perfumeria-app/blob/main/docs/antecedentes/lenguaje-visual/sistemas-de-codificacion-del-olor.md).

El **frente 5** pregunta por el POM entre otros sistemas; este frente cubre esa parte a fondo.

## Formato extra de la entrega

- **El POM explicado en una página**, sin jerga: de la molécula a la etiqueta, paso a paso.
- **Una tabla de fuentes de datos**: qué da por molécula, cobertura (de 3119 y de 54), licencia
  y si la app podría usarla.
- **El veredicto sobre la idea neuronal**, con los niveles de solidez de la pregunta 12.
- ⚠️ No se afirma que un material «activa» una zona del cerebro sin un estudio que lo diga.

## Qué cambia con la respuesta

- **En la app:** el diseño del AOM (P29, D4) y la idea neuronal, hoy aplazada (decisiones §8).
  Lo que afecte a la app va a la bandeja, `app/entradas.md`.
- **En el laboratorio:** la parte del POM del frente 5 queda cubierta.
