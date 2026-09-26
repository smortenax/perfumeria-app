---
tipo: frente
numero: 6
herramienta: Claude Code en el laboratorio (repositorio y web); NotebookLM NB-A y NB-B para lo que esté en los libros
estado: pendiente
fecha: 2026-09-26
encargo: perfumeria-app, interrogatorio P32
---

# Frente 6 — La base descriptiva de cada material

## Contexto mínimo

La app de formulación, [`perfumeria-app`](https://github.com/smortenax/perfumeria-app), dibuja
gráficos por material: la pirámide por piso, el reparto de la materia, la proyección por
horas, el frasco y el historial, donde cada adición es un icono. **Cada gráfico se calcula
material a material** para poder enlazarlos: al pasar por un material del historial, se
ilumina en todos ([decisiones §10.2 y §10.3](https://github.com/smortenax/perfumeria-app/blob/main/docs/decisiones.md)).

Para eso, cada material de la base necesita unos pocos atributos: **la capa propia** (P29 y
P30 del [interrogatorio de la app](https://github.com/smortenax/perfumeria-app/blob/main/docs/interrogatorio.md)).

- **La base es el glosario IFRA FIG**, `conocimiento/lenguaje/fig/glosario-fig.csv`: 3119
  ingredientes con CAS y tres descriptores. A ellos se suman los 54 de la paleta.
- **La referencia IFRA no se toca.** Sus límites siguen en `ifra-cat4.csv`; esta capa va
  aparte, en su propio archivo.
- **La investigación vive aquí**, en el laboratorio. La app copia el archivo con
  `importar_datos.py` y nunca consulta nada en remoto.
- **La app puede acabar siendo un producto.** De cada fuente hace falta su licencia, y saber si
  permite meter sus datos en una app que se venda. Una fuente que no lo permita sirve para el
  trabajo propio, pero se marca.
- **Un dato que condiciona la clave: el CAS no es único en el glosario.** Las 3119 filas tienen
  2588 CAS distintos: 176 CAS se repiten y ocupan 707 filas. El 8024-01-9, por ejemplo, son
  seis estoraques, del absoluto al pirogenado. Además, 18 filas están repetidas enteras.
  *Contado por la app el 2026-09-26 sobre su copia del glosario, del commit 9949c5f.*

## Qué necesita la app, campo a campo

| # | Campo | Para qué | Estado |
|---|---|---|---|
| 1 | **Posición entre salida y fondo**, de 0 a 1 | La pirámide, compuesta material a material. Los cinco pisos son tramos de la escala | Seguro |
| 2 | **Duración, en horas** | La proyección por horas | Seguro |
| 3 | **Color** | Reconocer el material en todos los gráficos | Seguro. **La base, por decidir**: familias olfativas generales, quizá de un estándar comercial o de la industria |
| 4 | **Sigla**, para el icono del historial | Reconocer cada adición. Dos letras no bastan (P24) | Seguro |
| 5 | **Los tres descriptores del FIG** | El mapa de olores propio, el **AOM** (mapa agregado de olores) | Casi seguro. Ya están en el glosario |
| 6 | **Datos del POM** (Principal Odor Map) | El AOM, si cubre bastantes materiales | Casi seguro. **El frente 7 lo estudia a fondo** |
| 7 | **Intensidad**, el «peso» del olor | El AOM, y quizá el tamaño en los gráficos | Casi seguro |

**Ideas sin decidir, para ver si son manejables:**

- **Cinco pesos que suman 1**, en lugar de una sola posición. Un natural se reparte entre
  pisos: un cítrico sale casi entero arriba, pero un resinoide tiene salida y fondo.
- **El color de Fragrantica**, o de otro estándar comercial. Es lo más universal para el
  público, pero es de un tercero.
- **El AOM:** qué versión mínima sale con lo que ya hay (el FIG), y cuánto añaden el POM y la
  intensidad.
- **Otras variables** que usen los perfumistas para describir un material y que la app pueda
  dibujar. El laboratorio ya distingue impacto, tenacidad, difusión y volumen
  (`conocimiento/tecnicas/lenguaje-descriptivo.md`).

## Preguntas

### A · Las fuentes, campo a campo *(lo primero)*

1. **Qué es cada campo, con su base.**
   - La duración: ¿en tira o en piel? ¿Puro o diluido, y a qué %?
   - La posición: ¿sale de la volatilidad, de la presión de vapor o del coeficiente de Poucher?
   - La intensidad: ¿es el poder olfativo en palabras, el umbral de olor, o el valor de olor
     (la concentración en el aire dividida por el umbral)?
2. **Qué fuentes hay para cada campo.** De cada una: qué da, **cuántos de los 3119 y de los 54
   cubre**, su licencia, cómo se obtiene y su confianza. La cobertura, contada si el conjunto se
   puede descargar; si no, estimada, y diciéndolo. Candidatas **a verificar**; la lista no es
   cerrada:
   - The Good Scents Company: poder olfativo y sustantividad en horas;
   - Leffingwell, y los conjuntos de Pyrfume (`goodscents`, `leffingwell`, `arctander_1960`,
     `dravnieks_1985`, `keller_2016`…);
   - el coeficiente de evaporación de Poucher, de 1 a 100. Según `descriptores.csv`, la salida
     va de 1 a 14, el corazón de 15 a 60 y el fondo de 61 a 100;
   - PubChem y las estimaciones de la EPA (CompTox, EPI Suite): presión de vapor, punto de
     ebullición y SMILES;
   - las recopilaciones de umbrales de olor;
   - Arctander (NB-A) y Calkin & Jellinek (NB-B), para lo que esté en los libros;
   - lo que ya tiene el laboratorio: el piso y la familia de `inventario.csv`, el poder
     olfativo de `niveles-de-uso.csv` y las catas.
3. **Qué se recomienda para cada campo**, y qué se queda en hueco.

### B · Lo que no está claro: ¿es manejable?

4. Para cada idea sin decidir: **qué cuesta** (datos, tiempo, licencia), **qué da** y una
   recomendación: ahora, más adelante o descartarla.
5. **El color.** Compara las bases posibles:
   - los 27 descriptores del FIG, que ya están, con la cita obligatoria de IFRA;
   - los colores de los acordes de Fragrantica;
   - la rueda de Edwards, que clasifica perfumes acabados, no ingredientes, y es comercial;
   - la investigación sobre correspondencias entre olor y color (Spence y otros).

   ¿Hay un código de color por familia con respaldo, o siempre es una convención?
6. **La sigla.** ¿Hay convenciones en el oficio (por ejemplo, tablas periódicas de
   ingredientes, si existen)? Propón una regla para generarlas y cuenta las colisiones sobre
   los 3119.
7. **La clave de cada fila**, visto que el CAS se repite. Propón con qué une la app la capa con
   el glosario: CAS y nombre, un identificador propio… Di también qué hacer con las filas
   repetidas.

### C · Un piloto *(cuando A y B estén revisados)*

8. Rellena la capa para **los 24 materiales de F-001** con las fuentes recomendadas, para ver la
   cobertura y el trabajo reales. Las catas propias son fuente de primera mano, y se distinguen
   de lo documentado.

### D · El archivo que importará la app

9. **Propón su forma.** Una opción es un CSV con una fila por material; otra, una fila por dato,
   si un campo puede tener varias fuentes. En los dos casos, **cada dato con su base, su fuente
   y su confianza**. Lo que no se sepa es un hueco declarado, nunca un cero. Sin límites IFRA:
   esos siguen en `ifra-cat4.csv`.

## Dónde buscar

- The Good Scents Company; Leffingwell; el GitHub de Pyrfume (`pyrfume-data`); PubChem; la EPA
  (CompTox y EPI Suite).
- Poucher, *Perfumes, Cosmetics and Soaps*; NotebookLM NB-A y NB-B.
- Google Scholar: *odor detection threshold*, *fragrance substantivity*, *evaporation
  coefficient*, *odor color crossmodal*.
- Las condiciones de uso de Fragrantica.

**Antes, lo que ya se sabe.** En la app:
- [`sistemas-de-codificacion-del-olor.md`](https://github.com/smortenax/perfumeria-app/blob/main/docs/antecedentes/lenguaje-visual/sistemas-de-codificacion-del-olor.md),
  con correspondencias entre olor y color y licencias de Pyrfume;
- la [comparativa FIG-POM](https://github.com/smortenax/perfumeria-app/blob/main/docs/antecedentes/lenguaje-visual/2026-09-24-comparativa-ifra-fig-vs-pom.md).

El **frente 5**, el identificador olorífico, está pendiente y se solapa con la parte A. Si ya
está hecho, se parte de él.

## Formato extra de la entrega

- **Una tabla por campo**: fuente, qué da, cobertura (de 3119 y de 54), licencia, acceso,
  confianza y recomendación.
- **La cabecera del CSV propuesto**, con dos filas de ejemplo rellenas: un sintético (Hedione)
  y un natural (resinoide de estoraque).
- Si trabajas con subagentes: Sonnet, de uno en uno, y cada uno escribe su pieza nada más
  terminarla.

## Qué cambia con la respuesta

- **En la app:** la capa propia (D4) tiene sus campos, sus bases y su forma. Se cierran
  también las lecturas pendientes de P29: una posición o cinco pesos, la clave y la
  intensidad. Lo que afecte a la app va a la bandeja, `app/entradas.md`.
- **En el laboratorio:** el archivo de la capa, que se empieza a rellenar.

## Añadido el 2026-09-26: el nivel de uso habitual (P34)

Un campo más, pedido por el usuario después del encargo:

| # | Campo | Para qué | Estado |
|---|---|---|---|
| 8 | **Nivel de uso habitual**: qué % es un uso normal, y cuál ya es significativo, para cada CAS | Pesar cada material por su uso efectivo, no por su masa: un 1 % de castoreum pesa más que un 1 % de Hedione | Seguro |

- **Va en el mismo archivo que los demás campos**, para todo el universo de la app, con su
  base (% del concentrado o del producto acabado), su fuente y su confianza.
- **No vale el de los 54 de la paleta** (`niveles-de-uso.csv`): la capa es universal y no lleva
  valoraciones del usuario (P35).
- **Las mismas preguntas que para el resto:** qué fuentes lo dan, cuántos CAS cubren, con qué
  licencia, y qué se recomienda.

## Añadido el 2026-09-26: el listado entero de IFRA como base (P36)

**El universo de la app no es el FIG, que es la descripción olfativa: es el listado entero
de IFRA**, la *Transparency List* (3691 ingredientes en 2025, según la pieza 2), o su
combinación con el FIG por CAS, si así sale más completo.

1. **Conseguir la Transparency List de 2025** desde la web de IFRA. Es una descarga: hace
   falta el visto bueno del usuario.
2. **Leer sus condiciones de uso** (en la pieza 2 quedaron NO ENCONTRADO), sobre todo si
   permiten llevar la lista dentro de una app que se venda.
3. **Pasarla a CSV** (CAS, nombre y lo que traiga) en `conocimiento/normativa/`, para que
   `importar_datos.py` la traiga a la app.
4. **Contarla frente al FIG, por CAS:** cuántos CAS están en las dos, cuántos solo en una y
   cuántos se repiten. Con eso se decide la combinación.

Los materiales del usuario no entran en la app de ninguna forma (P36).
