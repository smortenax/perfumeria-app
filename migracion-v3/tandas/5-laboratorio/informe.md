# Tanda 5 · Tus materiales del laboratorio, en tu cuenta

*Generada por `migracion-v3/tanda-5-laboratorio.ts` desde `../Perfumery/biblioteca/materiales.sqlite` (commit `c0e81e3` del laboratorio, abierto solo para leer) y tus respuestas a `conflictos/laboratorio.csv` (`respuestas/laboratorio.csv`). **No va a `v3/datos/`**: es tuyo (V3-15). Con tu visto bueno, `migracion-v3/cargar-laboratorio.ts` lo carga en tu cuenta, con tu `owner_id`.*

**Qué entra** (V3-15, V3-18, V3-32, V3-33):

- **111 materiales tuyos** (`materials.csv`): 108 versiones de un común (`based_on_id`, V3-5), con la categoría de su común, y 3 nuevos. Tu versión hereda del común lo que el material es (CAS, especie, proceso…), su composición y su IFRA, y no los repite; un material nuevo lleva los suyos.
- **Tu ficha:** tu nombre y tus sinónimos (111 con otros nombres); tu familia en texto libre, a `family_detail` (V3-18: la familia cerrada la hereda del común); facetas, piso, evolución, potencia, umbral, difusión, efecto en la mezcla, función (en inglés, como el esquema), dilución recomendada, fuentes y confianza; la tenacidad, como texto («400 h, según el laboratorio»); tu tienda y tu grado, de tus frascos.
- **El disolvente es una marca** (V3-12): la función «disolvente» del laboratorio pasa a `solvent` (3 materiales).
- **El IFRA de segunda mano** (V3-32), en `ifra_unverified`, en 107 materiales: el tipo y el estándar, «· sin verificar», y la condición solo si no lleva cifras. **74 notas de condición llevan cifras** (límites copiados de tiendas y glosarios) **y se quedan en el laboratorio**: «sin la cifra».
- **En disputa** (V3-17): 87 materiales con algún campo de conflicto pendiente en el laboratorio; los del estado físico (densidad, punto de fusión…) no entran, porque esos datos tampoco.
- **Tus dosis** (`material_doses.csv`, 421): con su base (del concentrado, del producto terminado o «sin declarar»), en fracción; la autoridad, la del laboratorio (consenso, literatura; la de una tienda, `product`). 156 en disputa. **62 dosis sin ninguna cifra** (solo texto) **no entran**: el esquema pide al menos una.
- **Lo que tengo** (`lab_materials.csv`, 110): tus frascos de `user_materials`, sin la dilución de compra.

**Lo que no entra todavía:** la composición del laboratorio (V3-33); tu cata, tus ejes y tus frascos preparados (la capa del usuario, plan §46); los descriptores, las relaciones, los perfumes de referencia y el estado físico (después, V3-14); la procedencia, el coste, la manipulación y la monografía, que no tienen columna en la v3.

**Para revisar** (2):

- MAT-esencia-de-trufa: potencia «sin medir» no está en la escala de la v3; queda vacío.
- MAT-haba-tonka-tintura: potencia «bajo (es una tintura)» se lee como «low».
