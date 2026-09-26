# Los archivos de IFRA de la 51.ª enmienda

**2026-09-26.** El usuario los descargó de IFRA y los trajo a la sesión para ver cuál sirve
como listado de restricciones por CAS. **No están en el repositorio:** por dónde entran lo
decide [P37](../../interrogatorio.md). Las cifras de este documento salen de contar los
archivos con un script de la biblioteca estándar de Python; los CAS se cuentan con el patrón
`NNNNNNN-NN-N`.

## Qué es cada archivo

| Archivo | Qué trae | Cuánto |
|---|---|---|
| `ifra-51st-amendment-ifra-standards-overview.xlsx` | **Una fila por estándar:** CAS, sinónimos, tipo, notas, si hay contribuciones de otras fuentes, y **el límite en cada una de las 12 categorías** | 263 estándares (de `IFRA_STD_001` a `IFRA_STD_267`), 455 CAS |
| `ifra-51st-amendment-index-of-ifra-standards.pdf` | Índice: nombre, CAS, tipo y año, **sin límites** | Los mismos 455 CAS, ni uno más ni uno menos |
| `ifra-51st-amendment-annex-on-contributions-from-other-sources.xlsx` | **Los naturales:** cuánto trae cada uno de cada constituyente regulado. Otra hoja, las bases de Schiff | 1031 filas: 302 variantes de natural, 195 CAS principales (377 contando los otros CAS), 63 constituyentes. 16 bases de Schiff |
| `ifra-51st-amendment-standards-1.zip` *(estaba en Descargas; no se adjuntó)* | Los PDF de los estándares nuevos o cambiados en la 51.ª | 62 PDF |

## Lo que sale

1. **El overview es el índice con los límites al lado.** Tiene exactamente los 455 CAS del
   índice, y el índice dice de sí mismo que es completo. **Un CAS que no está no tiene
   estándar propio.** Hay tres excepciones que van por familia y no por CAS:
   - `IFRA_STD_089`, aceites cítricos y otros con furocumarinas: restricción, 0,0015 % en
     categoría 4, contado como 5-MOP;
   - `IFRA_STD_184`, derivados de pináceas: especificación;
   - `IFRA_STD_188`, ésteres alílicos: especificación.
2. **Los tipos:**
   - 156 restricciones;
   - 68 prohibiciones;
   - 10 especificaciones;
   - 29 combinaciones de dos o tres tipos.
3. **La categoría 4 no siempre es un número.** 169 estándares traen cifra, y 86 van vacíos:
   - los 68 de prohibición;
   - los 10 de especificación;
   - los 8 de prohibición con especificación.

   Los 8 que quedan traen texto:
   - 5 dicen «See Notebox», y remiten al recuadro del PDF;
   - 2 llevan coma decimal: `0,40` en el 076 y `0,10` en el 094;
   - 1 dice `0.0015 (5-MOP)`, el 089.

   IFRA avisa en la primera celda de que el Excel es una ayuda: **manda el PDF de cada
   estándar**, y no garantiza que el Excel esté bien.
4. **Frente a lo que transcribió el laboratorio** (`ifra-cat4.csv`, 55 filas), coincide todo:
   - los 14 estándares que asignó, cada uno con su número;
   - las 12 cifras de categoría 4, exactas;
   - los 38 materiales que marcó «sin estándar propio», que en efecto no están en el índice.
5. **El laboratorio bajó 216 estándares, y hay 263.** Descargó los PDF del 001 al 220, pero
   la 51.ª enmienda llega al 267: **quedan fuera 46 estándares**, del 221 al 267, todos de la
   51.ª. A sus 55 materiales no les afecta, porque los comprobó también contra el índice.
   Pero el plan (D1) hablaba de «los 216 estándares», y son 263.
6. **Los naturales del laboratorio llevan menos constituyentes de los que da el anexo.** 11
   de sus naturales están en el anexo:
   - **4 los dejó sin ningún constituyente:** cedro del Atlas, láudano, naranja dulce y
     vetiver;
   - **los demás tienen algunos, no todos:** la lavanda solo lleva el linalol, y el anexo le
     da además cumarina, 7-metoxicumarina, geraniol y otros.

   Un ejemplo: el cedro del Atlas trae un 1,5 % de α-cedreno y un 0,6 % de longifoleno, y
   los dos tienen techo del 1,5 % en categoría 4 (`IFRA_STD_197` y `IFRA_STD_199`).

   **En el banco provisional, el cedro del Atlas, la naranja dulce y el vetiver del FIG
   salen sin nada que comprobar**, y no es así. En cambio, **el anexo resuelve los
   «pendientes»:** el aceite de limón exprimido trae un 3,5 % de citral.
7. **Un CAS de natural no basta para identificarlo.** 54 CAS principales del anexo cubren
   varias variantes con valores distintos. El 8008-56-8, del limón, reúne tres:
   - el exprimido, con un 3,5 % de citral;
   - la esencia, con un 2,03 %;
   - el destilado, que da geranial y neral por separado.

   IFRA lo dice en el apéndice del anexo: la industria identifica los naturales por la norma
   ISO 9235. El limón exprimido, por ejemplo, es el 136-G2.5. **Para la clave de D3, un
   natural necesita su variante, no solo el CAS.**
8. **Frente al FIG**, de sus 2588 CAS:
   - **262** tienen estándar propio;
   - **169** son naturales del anexo, y 16 de ellos tienen además estándar;
   - **2173** no están en ninguno de los dos, así que no tienen estándar propio, salvo las
     tres familias del punto 1.
9. **El overview trae 1796 líneas de sinónimos** para sus 263 estándares. Sirven para buscar
   por nombre comercial, pero solo los materiales regulados.
10. **El overview trae las 12 categorías.** La app usa la 4 (§5), y las demás quedan a mano
   si el producto las necesita.

## Lo que no resuelve

**El universo de materiales.** El overview dice qué está regulado, no qué existe. El listado
entero sigue siendo la *Transparency List*: 3691 ingredientes en 2025, según la pieza 2 del
frente 6 del laboratorio. **No hace falta otro glosario con «todos los materiales y su
restricción al lado»:** lo que no está en el índice no tiene estándar propio, así que ese
glosario sale de cruzar la *Transparency List* con el overview por CAS, y con el anexo para
los naturales.
