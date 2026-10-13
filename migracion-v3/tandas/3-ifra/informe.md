# Tanda 3 · IFRA y los topes de fabricante

*Generada por `migracion-v3/tanda-3-ifra.ts`. Los estándares, de los archivos de IFRA (`datos/ifra/51/estandares.csv`, 51.ª enmienda); quién es miembro de cada uno, de la v2 (`grupo-miembros.csv`); commit `d4c1e55`. `validar:v2`: sin errores.*

**Qué entra** (`regulations.csv`, 7498 filas; 681 de la categoría 4 o de todas, las que usa la app): 7013 techos, 110 prohibiciones, 114 especificaciones, 2 afirmaciones de cumplimiento y 13 topes de fabricante, de 568 pertenencias a un estándar.

**Cómo se traduce, como la v2:**

- **Una regulación por miembro y categoría** (de la 1 a la 12): una cifra es un techo en fracción del producto terminado; «ver-nota», el techo de su nota; «prohibido», una prohibición en esa categoría; «sin-restriccion» o nada, ninguna fila. La enmienda va en la fuente.
- **El grupo** (`group_key`) es el estándar, con su subgrupo donde lo tiene; el 089 y los estándares de los aceites fototóxicos que nombra (086 a 096) comparten «furocumarinas», y el motor suma la parte de cada uno sobre su techo.
- **El 089 va en el 5-MOP** (V3-27): su límite es del 5-MOP en el producto terminado, no del aceite.
- **Una prohibición sin techo en ninguna categoría** prohíbe el material como tal; con especificación, prohíbe una variante, y la permitida tiene que cumplirla (el 119, el cade; V3-25).
- **Una especificación** es un requisito con autoridad de IFRA, pendiente de acreditar, salvo donde el estándar habla de otros procesos (`exclusiones.csv`):
  - M00051 (Styrax resinoid): IFRA_STD_078
  - M04223 (Styrax resinoid (Liquidambar orientalis Mill.)): IFRA_STD_078
- **Las afirmaciones de cumplimiento** de `condiciones.csv` son requisitos con su autoridad (el cade rectificado, por consenso: supuesto).
- **Los topes de fabricante** de `topes.csv`, cada uno en su producto (D4).
- **Cada producto lleva las regulaciones de su material** (V3-2; 18 productos), como la v2 lo juzgaba.

**Lo que se pierde, para revisar:** estos estándares prohíben una variante y ponen techo a la permitida; entran los techos, y la nota de la variante prohibida no tiene sitio (la v2 la enseñaba como nota):
  - IFRA_STD_158 (7-Methoxycoumarin)
  - IFRA_STD_179 (Safrole, Isosafrole and Dihydrosafrole)
  - IFRA_STD_078 (Styrax)
  - IFRA_STD_071 (Peru balsam)
  - IFRA_STD_110 (cis-and trans-Asarone)
  - IFRA_STD_112 (Benzyl cyanide)
  - IFRA_STD_154 (Isophorone)
  - IFRA_STD_015 (p-tert-Butyl-α-methylhydrocinnamic aldehyde (p-BMHCA))
  - IFRA_STD_097 (Tagetes oil and absolute)
  - IFRA_STD_083 (Verbena oil and absolute (Lippia citriodora Kunth.))

**Para revisar** (0):

- Nada.
