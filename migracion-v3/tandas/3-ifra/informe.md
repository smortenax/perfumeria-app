# Tanda 3 · IFRA y los topes de fabricante

*Generada por `migracion-v3/tanda-3-ifra.ts`. Los estándares, de los archivos de IFRA (`datos/ifra/51/estandares.csv`, 51.ª enmienda); quién es miembro de cada uno, de la v2 (`grupo-miembros.csv`); commit `d4c1e55`. `validar:v2`: sin errores.*

**Qué entra** (`regulations.csv`, 7451 filas; 694 de la categoría 4 o de todas, las que usa la app): 6949 techos, 123 prohibiciones, 110 especificaciones, 8 requisitos de «no es la variante prohibida», 2 afirmaciones de cumplimiento y 13 topes de fabricante, de 568 pertenencias a un estándar.

**Cómo se traduce, como la v2:**

- **Una regulación por miembro y categoría** (de la 1 a la 12): una cifra es un techo en fracción del producto terminado; «ver-nota», el techo de su nota; «prohibido», una prohibición en esa categoría; «sin-restriccion» o nada, ninguna fila. La enmienda va en la fuente.
- **El grupo** (`group_key`) es el estándar: el subgrupo de la v2 es un encabezado de la lista de IFRA, no otro techo, y todos los miembros de un estándar suman contra él (lo usa el 097, y el 137, el 138 y el 181 con «e.g.» o su especificación). El 089 y los estándares de los aceites fototóxicos que nombra (086 a 096) comparten «furocumarinas», y el motor suma la parte de cada uno sobre su techo.
- **El 089 va en el 5-MOP** (V3-27): su límite es del 5-MOP en el producto terminado, no del aceite.
- **Una prohibición sin techo en ninguna categoría** prohíbe el material como tal; con especificación, prohíbe una variante, y la permitida tiene que cumplirla (el 119, el cade; V3-25).
- **Una especificación** es un requisito con autoridad de IFRA, pendiente de acreditar, salvo donde el estándar habla de otros procesos (`exclusiones.csv`):
  - M00051 (Styrax resinoid): IFRA_STD_078
  - M04223 (Styrax resinoid (Liquidambar orientalis Mill.)): IFRA_STD_078
- **Las afirmaciones de cumplimiento** de `condiciones.csv` son requisitos con su autoridad (el cade rectificado, por consenso: supuesto).
- **Los topes de fabricante** de `topes.csv`, cada uno en su producto (D4).
- **Cada producto lleva las regulaciones de su material** (V3-2; 18 productos), como la v2 lo juzgaba.

**Prohibidas como tal, con su techo** (V3-30): IFRA prohíbe la sustancia como ingrediente y la limita en los naturales que la traen. Cada una lleva una prohibición para todas las categorías y sus techos; sus productos, lo mismo:
  - IFRA_STD_158 (7-Methoxycoumarin): 7-Methoxycoumarin (M02627)
  - IFRA_STD_179 (Safrole, Isosafrole and Dihydrosafrole): Safrol (M02687)
  - IFRA_STD_179 (Safrole, Isosafrole and Dihydrosafrole): Dihydrosafrole (M01754)
  - IFRA_STD_179 (Safrole, Isosafrole and Dihydrosafrole): Isosafrole (M02047)
  - IFRA_STD_110 (cis-and trans-Asarone): ß-Asarone (M02625)
  - IFRA_STD_110 (cis-and trans-Asarone): α-Asarone (M02604)
  - IFRA_STD_110 (cis-and trans-Asarone): Benzene, 1,2,4-trimethoxy-5-(1-propen-1-yl)- (unspecified isomer) (M02622)
  - IFRA_STD_112 (Benzyl cyanide): Benzyl cyanide (M02572)
  - IFRA_STD_154 (Isophorone): Isophorone (M02667)

**Una variante prohibida** (V3-31): cada miembro va por la especie y el proceso que tiene en la v2. La prohibida lleva solo la prohibición. La permitida, sus techos y su especificación. Lo que no se sabe, además, el requisito «No es la variante prohibida», con la frase de IFRA, pendiente hasta que un documento lo acredite. Lleva su propia clave («IFRA_STD_078 · variante»): acreditar la especificación del estándar no prueba que no sea la variante prohibida.
- **IFRA_STD_078** (Styrax), por el proceso: un extracto o un destilado de la exudación (absoluto, extracto, destilado, aceite, resinoide, rectificado), permitido; las gomas crudas, prohibidas:
  - Styrax resinoid (M00051): permitida
  - Styrax absolute (M03822): permitida
  - Styrax absolute (low sytrene) (M03823): permitida
  - Styrax absolute, Honduras (M03824): permitida
  - Styrax distillate (M03825): permitida
  - Styrax essence pyrogenated (M03826): no se sabe
  - Styrax extract (M03827): permitida
  - Styrax oil (M03828): permitida
  - Styrax oil, Honduras (M03829): permitida
  - Styrax oil, Oriental (M03830): permitida
  - Styrax oil, pyrogenated (M03831): permitida
  - Styrax oil, pyrogenated, distilled (M03832): permitida
  - Styrax (M03944): no se sabe
  - Styrax oil distillate, Honduras (M04219): permitida
  - Styrax oil, pyrogenated, distilled (Liquidambar orientalis Mill.) (M04220): no se sabe
  - Styrax oil, pyrogenated, distilled (Liquidambar styraciflua L.) (M04221): no se sabe
  - Styrax oil, rectified (M04222): permitida
  - Styrax resinoid (Liquidambar orientalis Mill.) (M04223): permitida
  - Styrax (M02544): no se sabe
- **IFRA_STD_071** (Peru balsam), por el proceso: un extracto o un destilado (absoluto, extracto, destilado, aceite, resinoide, rectificado), permitido; el crudo, prohibido:
  - Balsam absolute, Peru (M01027): permitida
  - Balsam absolute, Peru, pyrogenated (M01028): permitida
  - Balsam extract, Peru (M01029): permitida
  - Balsam oil, Peru (M01031): permitida
  - Balsam resinoid, Peru (M01032): permitida
  - Balsam, Peru (M01033): no se sabe
  - Peru balsam distillate (M03707): permitida
  - Balsam gum oleoresin rectified, Peru (M04017): permitida
  - Peru Balsam Oil (S00104): no se sabe
- **IFRA_STD_097** (Tagetes oil and absolute), por la especie: *Tagetes erecta*, prohibida; *T. minuta* y *T. patula*, permitidas:
  - Tagetes erecta absolute (M03833): prohibida
  - Tagetes erecta extract (M03834): prohibida
  - Tagetes erecta oil (M03835): prohibida
  - Tagetes minuta absolute (M03836): permitida
  - Tagetes minuta oil (M03837): permitida
  - Tagetes minuta oil, rectified (M03838): permitida
  - Tagetes patula absolute (M03839): permitida
  - Tagetes oil and absolute (M03942): no se sabe
  - Tagetes oil, low tertiophene (M04229): prohibida
- **IFRA_STD_083** (Verbena oil and absolute (Lippia citriodora Kunth.)), por el proceso: el absoluto, permitido; el aceite, prohibido:
  - Verbena oil and absolute (Lippia citriodora Kunth.) (M03930): permitida
  - Verbena absolute (M03996): permitida

**Para revisar** (0):

- Nada.
