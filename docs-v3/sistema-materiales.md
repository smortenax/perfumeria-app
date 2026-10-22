# El sistema de materiales: cómo funciona

*Referencia del sistema nuevo de datos de los materiales (V3-70), tal como está escrito el
2026-10-22. La radiografía (`esquema-materiales/radiografia-de-los-datos.html`) enseña el diseño
entero, con lo tuyo; esto explica la parte que ya existe: lo común. Donde dice «propuesta de la
sesión», no lo has decidido tú.*

## En una frase

Cada material del glosario es una **identidad** (qué es), con sus **productos** (cómo lo vende
cada empresa); todo lo que se sabe de él es una **afirmación** de una fuente, con su cita; el
script elige la ★ de cada dato y escribe la **ficha**, que es lo que lee la app, con la
**composición resuelta** en sustancias por CAS, que es lo que lee IFRA.

## Dónde vive

- En Postgres, en un esquema propio, **`common`**, al lado de las tablas de hoy (`public`), que no
  toca: la app sigue leyendo las de hoy hasta que lo tuyo se mude. 33 tablas.
- **Los nombres de las tablas van en inglés** (el código, en inglés; propuesta de la sesión). La
  radiografía las nombra en español; la equivalencia está abajo.
- Lo escribe solo el script de carga, por tandas que apruebas. Un usuario con sesión **solo lee**
  (RLS: una política de lectura por tabla; ninguna de escritura). Cada fila dice de qué tanda salió
  (`batch_id`).
- Esquema: `v3/db/schema/common.ts`. Migraciones: `v3/supabase/migrations/20261022172501_common_materials.sql`
  (tablas), `…172524_common_rules.sql` (permisos, RLS, la regla de la ★, la clave de identidad) y
  `…172624_common_sheets.sql` (la ficha).

## Los cuatro grupos

| Grupo | Tablas (inglés · radiografía) | Para qué |
|---|---|---|
| Apoyo | `sources` · fuentes; `batches` · tandas; `vocabularies` · vocabularios; `equivalences` · equivalencias; `companies` · empresas; `scales` · escalas | De dónde sale cada dato, qué tanda lo trajo, las listas cerradas y cómo se traduce la palabra de cada fuente a la nuestra. |
| Núcleo | `substances` · sustancias; `substance_aliases` · sustancia_alias | Cada molécula (o natural UVCB) una vez, por su CAS. Es la única puerta entre el glosario, lo tuyo e IFRA. |
| Glosario | `materials` · materiales; `natural_treatments` · natural_tratamientos; `identifiers` · identificadores; `relations` · relaciones; `reference_perfumes` · perfumes_referencia; `material_texts` · apuntes; `products` · productos; `documents` · documentos; `manufacturer_caps` · topes_fabricante; `compositions` · composiciones; `composition_lines` · composicion_lineas; `attributes` · atributos; `claims` · afirmaciones; `claim_terms` · afirmacion_terminos; `sheets` · ficha; `sheet_composition` · ficha_composicion | Qué es cada material, quién lo vende, de qué está hecho y qué dice cada fuente. |
| Regulación | `amendments` · enmiendas; `ifra_categories` · categorias_ifra; `ifra_standards`, `ifra_substances`, `ifra_limits`, `ifra_annex`, `ifra_rules` · ifra_*; `allergen_entries` · alergenos_entradas; `allergen_substances` · alergeno_sustancias | IFRA por enmienda y los alérgenos de la UE. No vive en el material: se cruza por las sustancias. |

## Los tres tipos y la clave de identidad

Un material es de uno de tres tipos, por este orden de preguntas (V3-70, decidido el 2026-10-21):

1. ¿Es una molécula con fórmula y CAS? → **puro** (`pure`): su sustancia y su forma isomérica
   (sin especificar, racémico, enantiómero, enriquecido, isómero único).
2. ¿Sale directamente de una planta o un animal? → **natural** (`natural`): especie, parte,
   proceso, quimiotipo y tratamientos (rectificado, sin terpenos, FCF…).
3. Si no, y puede necesitar desglose → **mezcla** (`blend`): su empresa y su nombre.

Cada tipo tiene sus columnas y una comprobación (`materials_by_type`) deja vacías las de los otros.
La **clave de identidad** dice qué es, y es única: dos entradas con la misma clave son el mismo
material.

| Tipo | Clave | Ejemplo |
|---|---|---|
| Puro | `pure:<cas>:<forma>` (sin CAS: `pure:sub:<id de la sustancia>`) | `pure:6790-58-5:unspecified` |
| Natural | `natural:<especie>:<parte>:<proceso>:<quimiotipo>:<tratamientos ordenados, con +>` | `natural:citrus bergamia::essential_oil::` (la parte, vacía: el nombre no la dice) |
| Mezcla | `blend:<id de la empresa>:<nombre>` | `blend:<id de Givaudan>:bergamot givco 104` |

El texto va en minúsculas, sin espacios dobles ni en los extremos. La calcula el script
(`migracion-v3/lib/comun.ts`) y la base de datos la vuelve a calcular al cerrar la transacción
(`common.identity_key_of`): si no coincide, rechaza todo.

`merged_into_id` marca un material que resultó ser otro: no tiene ficha y lo suyo se lee en el
otro.

## Productos

Un producto es cómo vende el material una empresa (Ambroxan de Kao, Ambrofix de Givaudan: los dos,
productos del puro 6790-58-5). Lleva su nombre comercial y su dilución, que es informativa: si el
producto tiene composición propia, ya es la del frasco tal como se vende, disolvente incluido.

## Afirmaciones y la ★

Todo dato que va por fuente (familia, nota, duración, potencia, dilución de trabajo, densidad…) es
una fila de `claims`: qué dijo una fuente de un atributo de un material, o de uno de sus productos.

- **`attributes`** dice qué forma tiene cada dato (número con unidad, texto, lista de un
  vocabulario). Añadir un dato nuevo es añadir una fila, no una columna. Hay 31.
- **El valor**, como lo dijo la fuente (`original_value`, `original_unit`) y convertido a lo nuestro
  (`value_min`, `value_max`, `value_text`), con sus condiciones (`support`: tira o piel;
  `dilution`) y su escala si la hay.
- **Las listas** (familias con %, descriptores) van en `claim_terms`, un término por fila, que
  tiene que ser de la lista de su atributo (lo comprueba un disparador).
- **El rango** (`rank`): `star` (la que vale), `normal`, `discarded` o `disputed` (las fuentes no
  concuerdan y nadie ha decidido).
- **Una ★ por material, producto y atributo** (V3-70, decidido el 2026-10-22: «Por material y
  producto»): una genérica por material y otra por cada producto con datos propios. Lo garantiza
  un índice único (`claims_one_star`), también cuando no hay producto.

Hoy el script pone ★ cuando hay una sola afirmación o todas concuerdan; si no, todas quedan «en
disputa» y la tanda las lista en `revision/conflictos.csv` para que decidas (propuesta de la
sesión).

## Composición

Una composición es una cabecera (`compositions`: de quién es, quién la da, de qué documento, si
está completa) con sus líneas (`composition_lines`: sustancia, cifra y tipo de cifra: típica,
máxima, rango o «sin especificar»). Es de un material (genérica) o de un producto (tal como se
vende), nunca de los dos. Su autoridad es `product` (documento del fabricante), `literature` o
`consensus`. Una cifra de literatura o consenso nunca da «dentro» en IFRA.

## La ficha

`common.refresh_sheets()` reescribe `sheets` y `sheet_composition` enteras después de cada carga,
siempre con los mismos ids (la genérica, el del material; la de un producto, el del producto), para
que el móvil vea filas cambiadas y no nuevas.

- **Qué fichas hay:** una por material no fusionado, y una por producto que tenga una ★ o una
  composición propias.
- **Sus valores:** cada afirmación con ★, por código de atributo, en `values` (jsonb), y a la vista
  las que más se usan: familia principal, nota, duración, dilución de trabajo y densidad. La ficha
  de un producto toma la ★ del producto y, donde no tiene, la genérica.
- **La familia principal:** de las familias con ★, la que más suma. Hoy las familias van como
  las da cada fuente, sin general por encima (V3-71); cuando se estandaricen y una familia tenga
  `parent_id`, la principal será la general cuyas hijas suman más (A10): la función ya lo hace.
- **La composición resuelta**, la primera que exista de:
  1. la del producto (tal como se vende);
  2. la genérica del material (primero la de fabricante, luego literatura, luego consenso; la
     completa antes que la incompleta);
  3. la del anexo de IFRA para la sustancia del natural (la cifra más alta de cada constituyente);
  4. para un puro, su sustancia al 100 % («identidad»).

## Vocabularios

Todas las listas en una tabla, `vocabularies`, con clave (lista, id), `parent_id` (la familia
detallada apunta a su general) y `color`. Las columnas que apuntan a ella llevan su lista como
columna generada constante, para que la clave foránea sea (lista, id): una familia no puede
acabar en la columna de la parte. Las listas cortas que no crecen (tipo, rango, autoridad) son
valores comprobados. `equivalences` dice qué palabra de cada fuente es qué término nuestro.

**El idioma de los datos es el inglés** (V3-71): códigos y nombres de las listas, atributos,
categorías de IFRA, notas de las fuentes. Lo de PerfuMate entra tal como viene. **Las familias, como
las da cada fuente:** las 24 de PerfuMate son términos suyos (Floral, Woody, Gourmand, Musk…), sin
ponerlas bajo tus nueve, que de momento siguen solo en la app actual con su color (V3-38). Cuando
haya más fuentes se decide cuáles se unen y si se simplifican en menos.

## Cifras

Toda fracción es `numeric` (exacta) en Postgres, texto en el móvil y fracción exacta en el motor;
nunca un decimal de coma flotante (A3).

## Tandas y carga

Cada tanda es una carpeta con un CSV por tabla, `batches.csv` (su única tanda), `informe.md` y
`revision/` (lo que pide tu mirada). La escribe un script determinista y los ids son UUID v5 de
una clave estable (`migracion-v3/lib/ids.ts`): repetir el script da los mismos.

| Tanda | Qué trae | Script |
|---|---|---|
| 20 · base | Fuentes, vocabularios (formas isoméricas, tratamientos, notas, sin familias), 31 atributos, todo en inglés, la 51.ª enmienda con sus 18 categorías, y IFRA reordenado (652 sustancias, 263 estándares, 3004 límites, 1030 filas del anexo) | `node migracion-v3/tanda-20-comun-base.ts` |
| 21 · PerfuMate | 1920 de 2212 entradas: 1824 materiales, 391 productos, 38 empresas, 13985 afirmaciones, 483 composiciones | `node --no-warnings migracion-v3/tanda-21-perfumate.ts` |

La carga, desde `v3/`:

```
npm run datos:cargar-comun                          # todas las carpetas de v3/datos/comun/, por número
npm run datos:cargar-comun -- <carpeta> [<carpeta>…] # una tanda en revisión, para mirarla
DATABASE_URL=… npm run datos:cargar-comun           # otra base, cuando lo pidas
```

- Una sola transacción: si una fila se rechaza, no queda nada a medias.
- Inserta o actualiza por id, y solo cuando la fila cambia: una segunda carga no cambia nada.
- Una tanda no reescribe filas de otra (para).
- Borra las filas de la tanda que ya no están en su CSV.
- Apunta el commit de la tanda si está aprobada y en Git.
- Al final, llama a `common.refresh_sheets()`.

Las pruebas, en `v3/db-tests/common.test.ts` (`npm run test:db`): solo lectura, la ★ única, los
términos de su lista, las columnas por tipo, la clave al cerrar y la ficha.

## Lo que falta

- **Lo tuyo** (tus materiales, tus afirmaciones y tu composición, frascos, diluciones, catas,
  fórmulas, informes de IFRA): diseñado en la radiografía, sin escribir. Se migra aparte, porque
  toca tus datos y la app.
- **La app aún no lee `common`:** ni el glosario, ni el banco, ni el motor de IFRA. Tampoco las
  reglas de sincronización de PowerSync.
- **`aprobar.ts`** aún no copia una tanda a `v3/datos/comun/<tanda>/`.
- **Datos:** el nombre químico de los puros (PubChem, A9); estandarizar las familias entre
  fuentes (V3-71); la escala de potencia; los alérgenos de la
  UE (A8); las 292 entradas sin clasificar.
- **Por comprobar con el motor:** la regla contra el doble cómputo (A7).
