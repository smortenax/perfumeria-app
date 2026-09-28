---
tipo: frente
numero: 8
herramienta: Claude Code en el laboratorio (repositorio y web); NotebookLM NB-A y NB-B para lo que esté en los libros; un cuestionario al usuario
estado: pendiente
fecha: 2026-09-28
encargo: perfumeria-app, interrogatorio P46 (con P33, P34, P35 y P45)
---

# Frente 8 — Las categorías generales de olor

## Contexto mínimo

La app de formulación, [`perfumeria-app`](https://github.com/smortenax/perfumeria-app),
necesita **unas categorías generales de olor que el usuario vea directamente**. Llevan
tiempo arrastrándose (P29, P33, P35 y la parte B del frente 6), y el usuario ha pedido
cerrarlas aquí: evaluar los datos, investigar y hacerle un cuestionario (P46 del
[interrogatorio](https://github.com/smortenax/perfumeria-app/blob/main/docs/interrogatorio.md)).

**Para qué, en palabras del usuario:** *«las que seran directamente visibles para el usuario
en codigo de color sobre los materiales y las que se serian utiles por ejemplo para filtrar
formulas por predominancia de categorias (por ejemplo ordenar por afrutado ascendente o
descendente)»*. Son dos usos, y los dos tienen que salir del mismo sistema:

1. **El color de cada material**, en el buscador, la composición, el historial y los
   gráficos.
2. **La predominancia en una fórmula**: filtrar y ordenar la galería de fórmulas («la más
   afrutada primero»), junto al tipo de fórmula, acorde o perfume (P45).

Además alimentan las categorías de infografía (P33) y el visualizador (P34).

**Este frente se queda con dos preguntas de la parte B del frente 6:** el color (pregunta 5)
y el carácter, el campo 5 de la
[puesta en común](https://github.com/smortenax/perfumeria-lab/blob/master/fuentes/investigaciones/2026-09-27-frente-6-puesta-en-comun-app.md).
**La sigla y la clave ya están resueltas en la app:**
- el icono es la sigla comercial, o la abreviatura del usuario si no la hay (P39 y P40);
- la clave es el `id` del glosario de la app.

### Lo que ya está fijado

- **La app no usa las categorías del FIG.** El usuario elabora las suyas, y el FIG es
  material de estudio (P35).
- **El sistema lo decide el usuario; la asignación, las fuentes.**
  - El cuestionario decide qué categorías hay, cuántas, cómo se llaman y de qué color son.
  - La categoría de cada material sale de fuentes documentadas. Ninguna cata ni valoración
    del usuario entra en la capa (P35).
- **Lo de uso libre va directo al producto; lo restringido se asimila y se reinterpreta**,
  y el resultado se distingue de la fuente (P35). La app puede acabar siendo un producto: de
  cada fuente hace falta su licencia.
- **Una categoría plana por material puede ser ruido.** Lo dijo el usuario en P34: *«si es
  simplememnte una categoria plana por cada components no solo no sera efectivo sino sera
  ruido»*. Hay que valorar un reparto: un material 70 % afrutado y 30 % floral.
- **La predominancia se pesa por uso efectivo, no por masa**: *«un 1% de castoreum siempre
  gana a un 1% de hedione»* (P34). Eso enlaza con el nivel de uso habitual y la intensidad
  del frente 6.
- **Cuántos colores se distinguen:** de 6 a 12 códigos de color categóricos, y 8 en una
  lectura rápida. Lo dice Ware, en la
  [investigación de visualización](https://github.com/smortenax/perfumeria-app/blob/main/docs/investigacion/2026-09-26-visualizacion-de-datos/1-fundamentos.md)
  de la app. El daltonismo afecta a un 10 % de los hombres, según la misma fuente.
- **Lo que no se sabe es un hueco declarado, nunca una categoría adivinada**, como en toda la
  app (§1.2).

### El universo: el glosario de la app

[`datos/glosario/materiales.csv`](https://github.com/smortenax/perfumeria-app/blob/1d42701/datos/glosario/materiales.csv),
del commit `1d42701`, con su
[LEEME](https://github.com/smortenax/perfumeria-app/blob/1d42701/datos/glosario/LEEME.md).
**Se copia desde ahí**, porque la app no escribe en el laboratorio.

- **4320 materiales:** 3114 moléculas y 1206 naturales. De ellos, 3119 vienen del FIG y 1201
  solo de IFRA o de los catálogos de las casas.
- **Tiene los tres descriptores del FIG en sus 3119 filas.** El primero toma 27 valores, el
  segundo 189 y el tercero 249. Los más frecuentes en el primero son Floral (613), Fruity
  (488), Woody (330) y Herbal (284).
- **Los otros 1201 no tienen ningún descriptor**: 853 moléculas y 348 naturales.
- **Tiene más columnas que sirven:**
  - `clase` y `tipo_natural` (absoluto, aceite…);
  - los nombres comerciales;
  - los constituyentes regulados de los naturales;
  - `equivalencias.csv`, que liga moléculas iguales con otro CAS o con otra estereoquímica
    (P41).

*Contado por la app el 2026-09-28 sobre ese commit.*

## Preguntas

### A · El sistema *(lo primero)*

1. **Qué sistemas de categorías de olor existen**, para materiales y no para perfumes
   acabados. De cada uno: cuántas categorías tiene, a qué nivel clasifica, su licencia y
   cuántos de los 4320 podría cubrir. Candidatos, **a verificar**; la lista no es cerrada:
   - los 27 primeros descriptores del FIG, como material de estudio;
   - `descriptores.csv` del laboratorio: 153 términos de 13 sistemas, ya cruzados con el
     FIG;
   - las clasificaciones de materias primas de las casas y de la Osmothèque;
   - la rueda de Edwards, que clasifica perfumes acabados y es comercial;
   - Zarzo y Stanton (2009), sobre las dimensiones del espacio de olor de los perfumistas;
   - Castro, Ramanathan y Chennubhotla (2013), diez categorías sacadas de los descriptores
     de Dravnieks;
   - las 138 etiquetas del POM (frente 7).
2. **Dos o tres sistemas candidatos para la app**, de 6 a 12 categorías generales, con qué
   entra en cada una.
3. **¿Una categoría por material o un reparto?** Qué da cada opción, qué cuesta y una
   recomendación.
4. **¿Hace falta un segundo nivel?** Categorías generales para el color y subcategorías para
   filtrar más fino.

### B · La categoría de cada material

5. **Cómo se asigna de forma automática** desde datos documentados. Por ejemplo:
   - desde los tres descriptores del FIG y sus co-apariciones en las 3119 filas;
   - desde descriptores de fuentes de uso libre;
   - desde las probabilidades del POM;
   - para los 1201 sin FIG: por sus constituyentes, por la planta, o por una molécula
     equivalente.
6. **La cobertura:** cuántos de los 4320 quedan asignados, con qué confianza, y cuántos quedan
   en hueco.

### C · El color

7. **Un color por categoría.** Hay que decir:
   - si hay correspondencias entre olor y color con respaldo (Spence y otros) o si es una
     convención;
   - cómo se ve con daltonismo;
   - cómo se lee sobre el fondo claro de la app.

### D · La predominancia en una fórmula

8. **Cómo se calcula.** Por ejemplo: masa × reparto × un peso de uso efectivo o de intensidad.
   Hay que decir también:
   - qué dato hace falta de cada material, y si ya lo trae el frente 6;
   - qué se hace con lo que no tiene categoría. La predominancia tiene que decir qué parte de
     la fórmula queda fuera, nunca repartirla.

### E · El cuestionario al usuario

9. **Un cuestionario, una pregunta cada vez**, para que el usuario decida:
   - el sistema, cuántas categorías y sus nombres;
   - los colores;
   - si es una categoría por material o un reparto;
   - qué hacer con los materiales dudosos.

   Cada pregunta con sus opciones, una recomendación y lo que cuesta dejarla abierta, como
   en el interrogatorio de la app.

### F · El archivo que importará la app

10. **Propón su forma:** por `id` del glosario, con el CAS al lado, la categoría o el reparto,
    la fuente y la confianza de cada dato. Sigue lo que proponga la parte D del frente 6 (una
    fila por dato con su fuente), para que la capa propia sea un solo formato.

## Dónde buscar

- **En el laboratorio:**
  - `conocimiento/lenguaje/`: `descriptores.csv`, los autores y el FIG con sus condiciones
    de uso;
  - las piezas del frente 6: la 2, de licencias, y la puesta en común;
  - el frente 7, por las etiquetas del POM;
  - NotebookLM NB-A (Arctander) y NB-B (Calkin & Jellinek).
- **En la app:**
  - la [investigación de visualización](https://github.com/smortenax/perfumeria-app/tree/main/docs/investigacion/2026-09-26-visualizacion-de-datos);
  - [`sistemas-de-codificacion-del-olor.md`](https://github.com/smortenax/perfumeria-app/blob/main/docs/antecedentes/lenguaje-visual/sistemas-de-codificacion-del-olor.md).
- **Fuera:**
  - Google Scholar: *odor categories perfumery materials*, *odor descriptor space
    dimensions*, *odor color crossmodal correspondence*;
  - el GitHub de Pyrfume, por los conjuntos con licencia.

## Formato extra de la entrega

- **Una tabla por sistema candidato:** categorías, cobertura sobre el glosario de la app,
  licencia, confianza y recomendación.
- **Las cifras, contadas sobre el glosario del commit `1d42701`**, diciendo cuál.
- **El cuestionario, aparte**, listo para hacérselo al usuario.
- **Si trabajas con subagentes:** Sonnet, de uno en uno, y cada uno escribe su pieza nada
  más terminarla.

## Qué cambia con la respuesta

- **En la app:**
  - el color de cada material (decisiones §10);
  - los filtros y el orden de la galería (P45);
  - las categorías de infografía (P33).

  P46 se cierra con las respuestas del usuario al cuestionario. Lo que afecte a la app va a
  la bandeja, `app/entradas.md`.
- **En el laboratorio:** el archivo de categorías, que entra en la app con
  `importar_datos.py`, como la presión de vapor.

## Añadido el 2026-09-28: el primer nivel ya está hecho (P48)

**El mismo día, la parte B del frente 6 entregó el primer nivel de familias**: ocho con
color y un gris, asignadas a las 3119 filas del FIG, con su matiz y su confianza. La app ya
las enseña (P48). **Este frente se queda con lo que falta:**

- **Los 1198 materiales sin familia**, los que solo están en IFRA o en los catálogos. El
  glosario de la app cambió en el commit de P48: ahora son 4317 materiales, y 19 filas del
  FIG pasaron a naturales siguiendo la pieza 13.
- **La predominancia en una fórmula** (pregunta 8), que necesita el reparto entre familias
  por material. `familia` y `matiz` son un primer paso.
- **El segundo nivel**, en pausa hasta que el usuario vea el primero en pantalla.
- **Los 335 casos de confianza baja.**

Las preguntas A y C (el sistema y el color) quedan respondidas por la parte B del frente 6.

**Una corrección para la pieza 13.** 14 filas del FIG son naturales y la pieza 13 no las
tiene. La app las cuenta como naturales porque el usuario les dio tipo o porque IFRA tiene
su CAS en el anexo:

| Fila | Nombre |
|---|---|
| 1102 | Apple distillate |
| 1604 | Cypress |
| 1635 | Deer tongue pyrogenated |
| 1638 | Deertongue leaf incolore |
| 1934 | Ginger |
| 1941 | Ginger terpeneless |
| 2179 | Lavender |
| 2284 | Mentha arvensis |
| 2290 | Mentha arvensis, 3X |
| 2467 | Nutmeg |
| 2470 | Nutmeg distillate |
| 2797 | Rose |
| 2800 | Rose centifolia alcoholate |
| 3047 | Turmeric |
