# Tanda 4 · Las categorías y las fusiones

*Generada por `migracion-v3/tanda-4-categorias.ts` (plan, paso 4.8; V3-11, V3-13). Parte de lo que aprobaste en las tandas 1 a 3 (comprobado con su huella en `aprobadas.csv`) y de tus respuestas a `conflictos/duplicados.csv` (`respuestas/duplicados.csv`); la v2, del commit `d4c1e55`.*

**Qué cambia:** materiales, de 4355 a 4344; composición, de 3145 a 3114 filas; regulaciones, de 7451 a 7391. Entran 3498 categorías (`material_categories.csv`), y cada material común lleva la suya (`category_id`), salvo «Sin identificar», que no se pesa.

## Las fusiones (11, las que decidiste)

Queda la ficha que elegiste, con su id, su nombre y sus campos. De la que se va: su nombre, a otros nombres; su CAS, si es otro, a otros CAS; sus campos solo llenan los vacíos. La composición y las regulaciones, la unión: de un mismo componente, la fila de más autoridad, y a igual autoridad, la de la ficha que queda. Lo que apuntaba a la que se va apunta a la que queda (`migracion-v3/fusiones.csv`).

- M04120 «Lavender oil (Lavandula angustifolia, Lavandula angustifolia angustifolia, Lavandula officinalis)» → M00003 «Lavender oil»: otro nombre «Lavender oil (Lavandula angustifolia, Lavandula angustifolia angustifolia, Lavandula officinalis)»; otro nombre «LaLO»; 3 filas de composición y 0 regulaciones que no tenía
- M03525 «Lemon oil, expressed» → M00045 «Lemon oil, expressed»: otro nombre «LEEO»; 0 filas de composición y 0 regulaciones que no tenía
- M03556 «Mandarin oil» → M00047 «Mandarin oil»: otro nombre «MdO»; 0 filas de composición y 0 regulaciones que no tenía
- M03663 «Orange sweet, Valencia oil» → M00048 «Orange, sweet, Valencia oil»: otro nombre «Orange sweet, Valencia oil»; otro nombre «OVO»; 0 filas de composición y 0 regulaciones que no tenía
- M03997 «Vetiver oil (all origins)» → M00053 «Vetiver oil»: otro nombre «Vetiver oil (all origins)»; otro nombre «Vetiverol»; otro nombre «VeAO»; 0 filas de composición y 0 regulaciones que no tenía
- M01160 «Cistus absolute» → M00058 «Cistus absolute»: otro nombre «ABS. Cistus Jara al 10% en alcohol - DILUCION»; otro nombre «ABS. Cistus Jara al 50% en alcohol - DILUCION»; otro nombre «CiA»; 0 filas de composición y 0 regulaciones que no tenía
- M03943 «Jasmine absolute (sambac)» → M03477 «Jasmine sambac absolute»: otro nombre «Absoluto de Jazmín Sambac - India»; otro nombre «Jasmin Sambac Absolute (Biolandes)»; otro nombre «JaSA»; otro CAS 91770-14-8; otro CAS 103798-23-6; 8 filas de composición y 0 regulaciones que no tenía
- M04145 «Nutmeg oil, Java, terpeneless» → M03615 «Nutmeg oil terpeneless, JAVA»: otro nombre «Nutmeg oil, Java, terpeneless»; otro nombre «NuJO»; 0 filas de composición y 0 regulaciones que no tenía
- M04156 «Orange oil, sweet, folded» → M03662 «Orange sweet oil folded»: otro nombre «Orange oil, sweet, folded»; otro nombre «OrSO»; 0 filas de composición y 0 regulaciones que no tenía
- M03965 «Jasmine grandiflorum absolute» → M03931 «Jasmine absolute (grandiflorum)»: otro nombre «Jasmine grandiflorum absolute»; otro nombre «Jasmin Grandiflorum Absolute (Egypt)»; otro nombre «Jasmin Grandiflorum Absolute (Indie)»; otro nombre «JasmA»; otro CAS 8022-96-6; otro CAS 84776-64-7; species «Jasminum grandiflorum L.»; 5 filas de composición y 0 regulaciones que no tenía
- M04123 «Lemon (steam distilled) oil» → M03971 «Lemon oil steam distilled»: otro nombre «Lemon (steam distilled) oil»; otro nombre «LemoO»; 2 filas de composición y 0 regulaciones que no tenía

**No se fusionan** 38 candidatos (tus respuestas), y el DPG de la app es **M02952** (la clave `solv:dpg` apuntará a él en la fase 7).

## Las categorías (3498)

**La regla** (propuesta de la sesión en V3-13, para que la revises en `migracion-v3/categorias.csv`):

- **Un producto**, con su material (los fabricantes, debajo de la molécula o de la forma).
- **Un natural**, por su especie: el género y el epíteto, con la subespecie o la variedad si la dice, sin autor. Un epíteto que empieza otro del mismo género es la misma especie (*Cistus ladanifer* y *ladaniferus*). La parte casi nunca está en los datos, así que hoy no separa nada.
- **Un natural que no dice su especie**, por su CAS: con la especie que lo tiene, si solo lo tiene una; si no, con los otros naturales de ese CAS.
- **Una molécula**, por su CAS.
- **El mismo nombre** junta lo demás (los isómeros que IFRA lista con un nombre).
- **El nombre de la categoría:** la especie, en un natural; si no, las primeras palabras que comparten todas sus fichas generales (sin fabricante), y si no comparten ninguna, el nombre más corto. Los otros nombres de la categoría quedan vacíos: el buscador encuentra por los de cada ficha.

**Cuántas:** 3187 de una sola ficha y 311 de varias (85 por CAS; 5 por CAS de una especie; 91 por especie; 53 por producto, CAS; 6 por producto, CAS, nombre; 7 por especie, CAS de una especie; 34 por nombre; 1 por producto, especie, CAS, nombre; 11 por producto, especie; 6 por producto, nombre; 7 por producto, especie, CAS de una especie; 1 por producto, especie, nombre; 1 por especie, nombre; 2 por producto, especie, CAS de una especie, nombre; 1 por producto).

**Las más grandes**, para mirar si juntan de más:

- **Cistus ladanifer** (18, por producto, especie)
- **2,4-Dienals** (16, por nombre)
- **Myristica fragrans** (16, por especie)
- **Citrus sinensis** (13, por producto, especie)
- **Boswellia carterii** (12, por CAS de una especie)
- **Cananga odorata** (12, por especie, CAS de una especie)
- **Citrus reticulata** (12, por producto, especie, CAS de una especie)
- **Rose** (12, por CAS)
- **Cinnamomum camphora** (11, por especie)
- **Citrus aurantium** (11, por especie, CAS de una especie)
- **Citrus limon** (11, por producto, especie, CAS de una especie)
- **Citrus paradisi** (11, por especie, CAS de una especie)
- **Lavandin** (11, por CAS)
- **Liquidambar styraciflua** (11, por producto, especie, CAS de una especie)
- **Mentha spicata** (10, por especie)

**Lo que queda por hacer:** la forma de un natural (`form`, el segundo nivel de V3-13) sigue vacía; hoy el segundo nivel lo da el proceso.

**Para revisar** (0):

- Nada.
