# Tanda 9 · Las categorías de lo común

*Generada por `migracion-v3/tanda-9-categorias.ts` (V3-13) sobre los materiales comunes de la tanda 7 tal como se aprobaron (`v3/datos/materials.csv`). Agrupar no mezcla datos: cada material sigue con su ficha, su composición y sus límites.*

**Qué entra:** 111 categorías (`material_categories.csv`) y los 111 materiales comunes con la suya (`materials.csv`: solo cambia `category_id`). 111 categorías tienen un solo material y 0 juntan varios.

**La regla** (V3-13, como la aplicó la tanda 4): un natural, por su especie; uno sin especie, por su CAS (con la especie que lo tiene, si solo lo tiene una); una molécula, por su CAS; el mismo nombre junta lo demás. El id de una categoría sale de lo que la junta (la especie, el CAS o su primer material), así que una forma que entre más adelante (un absoluto de lavanda) se une a la suya sin cambiarla. **Su nombre:** el del material mientras sea uno; con varios, la especie de un natural, o las palabras que comparten, o el nombre más corto.

**Tus versiones** toman la categoría de su común por `based_on_id` (V3-13): no hace falta escribirla en tu cuenta.

**Las que juntan varios materiales:**

- Ninguna: hoy cada uno de tus materiales es de una especie o un CAS distintos.
