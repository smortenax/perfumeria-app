# Auditoría del esquema de materiales

Oct 22, 2026 · @S Mort

## Veredicto

La arquitectura vale y no hay que rehacerla: tres zonas separadas, el CAS como única puerta a IFRA y cada dato con su fuente es más riguroso que lo que publica cualquiera de los referentes. Pero hay seis fallos de estructura que conviene corregir antes de crear una sola tabla, porque con datos dentro cuestan mucho más.

1. **La química está en el sitio equivocado.** Fórmula, peso molecular y SMILES son de la molécula, no del material: van en `sustancias`, que debe ser el centro del esquema y no una tabla de la regulación.
2. **La composición repite en cada línea lo que es de la lista entera.** Autoridad, documento, fuente y «incompleta» describen un análisis, no una sustancia. Falta una cabecera de composición.
3. **`datos_por_fuente` no sabe guardar listas.** Familias con %, descriptores o países son varios valores de una misma afirmación, y el «★ manda» por fila no funciona con ellos.
4. **`mis_cambios` es un texto sin tipo.** Tus cambios deben tener la misma forma que los datos del glosario, o la app no podrá comparar ni calcular con ellos.
5. **El glosario no tiene historia.** Faltan las tandas del script, la fusión de duplicados y una foto de lo que usó cada informe IFRA.
6. **La regulación tiene textos donde necesita tablas.** Enmienda y categoría IFRA aparecen como texto en seis tablas, y la 52.ª enmienda se notifica en enero de 2027.

El número de tablas apenas cambia, de 42 a 45: se quitan seis que no aportan y entran nueve que faltan. Lo que mejora es que cada regla la impone la base, no la app.

## Cómo lo hacen los referentes

Ninguno publica su esquema; lo que sigue se deduce de lo que enseñan sus fichas. Todos guardan bastante menos que tu propuesta, y casi todos mezclan identidad, producto y dato en un solo registro: justo lo que tu diseño evita.

| Referente | Qué guarda por material | Lección para tu esquema |
| --- | --- | --- |
| [PerfuMate](https://perfumate.app/landing) | 2.214 materiales: 1.642 con CAS, 5.899 nombres alternativos, 741 con desglose estimado de moléculas, 22 familias con 229 subnotas. Impacto 0-10, dilución típica, nota, familias con %. IFRA solo categoría 4 de la 51.ª | El desglose de los naturales es lo que hace posible IFRA; sumar moléculas entre materiales es el cálculo correcto. Una sola escala y una sola categoría IFRA: tú necesitas escalas por fuente y las 18 categorías |
| [ScentFriends](https://scentfriends.com/en/about-us/) | Tienda con más de 700 productos. CAS, perfil, volatilidad, IFRA y estructura en casi todos. Venden por producto y dilución: «Labdanum resinoid (IFF) 50% DPG» | Confirma tu separación identidad / producto: lo que se compra es un producto con fabricante y dilución de fábrica, no la identidad |
| [Première Peau](https://premierepeau.com/pages/glossary-terms/hedione) (glosario) | Campos con categoría: volatilidad, fuerza («Low»), pirámide, aspecto. Física copiada de TGSC con su condición: ebullición «109–112 °C @ 0,20 mm Hg», densidad «@ 25 °C». Pone Hedione HC como sinónimo de Hedione | Dos avisos: los datos físicos llegan como rango + condición, y un esquema sin forma isomérica confunde Hedione con Hedione HC. Tu regla de identidad ya lo resuelve |
| TGSC | La fuente que copian casi todos (Première Peau cita su duración en tira; hay bases nuevas acusadas de copiarla) | La copia es por dato, no por fuente: `copia_de` en `fuentes` no basta |
| [Coptis](https://coptis.com/Nouvelles-Matieres) (cosmética) | Más de 16.000 materias en unas 30 rúbricas, ordenadas por fabricante para que cada ficha sea única | La industria indexa por producto de fabricante. Tu identidad genérica es un nivel por encima, y es acertado |
| [PubChem](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | Fórmula, peso molecular, SMILES, InChIKey y logP calculado (XLogP), gratis y por API, buscando por nombre o CAS | Llena casi solo los huecos de los puros que hoy están a cero: SMILES, logP, peso molecular |
| [IFRA 52.ª](https://ifrafragrance.org/latest-updates/ifra-news/ifra-publishes-end-of-consultation-letter-for-the-52nd-amendment-to-the-ifra-standards) | 48 estándares nuevos y 15 revisados; notificación prevista en enero de 2027; entra en vigor a los 11 meses (creaciones nuevas) y 30 meses (existentes) | Convivirán dos enmiendas con fechas de vigor. La enmienda tiene que ser una tabla con fechas, no un texto |
| [Alérgenos UE 2023/1545](https://www.personalcareinsights.com/news/eu-fragrance-allergen-labeling-deadline.html) | Unas 80 entradas; declarar sobre 0,001 % sin aclarado y 0,01 % con aclarado; obligatorio para productos nuevos desde el 31-jul-2026 | Hay entradas que son aceites esenciales enteros y entradas que agrupan varias sustancias («Lemongrass Oil» cubre tres Cymbopogon). Una fila por CAS no basta |

## Problemas estructurales y su arreglo

Ordenados por lo caro que sale arreglarlos tarde. Los cinco primeros hay que resolverlos antes de crear la base.

### Antes de crear la base

1. **`sustancias` es el centro, no una tabla de la regulación.** Hoy un puro guarda su fórmula y su peso en `puros`, aunque Hedione y Hedione HC comparten molécula: el dato se repite. Además, el limoneno dentro del limón no tiene dónde guardar su peso ni su presión de vapor.
   - Arreglo: `sustancias` lleva CAS, nombre, fórmula, peso molecular, SMILES, InChIKey, CID de PubChem y un `tipo` (molécula definida, natural o UVCB, grupo). El puro apunta a su sustancia; el natural y la mezcla, a la suya si tienen CAS propio.
   - Así el CAS deja de estar en tres sitios (`sustancias`, `sustancia_alias` e `identificadores`) y queda en uno, con sus alias.
2. **La composición necesita cabecera.** «Incompleta», documento, página, fuente y autoridad se repiten en cada línea, y nada impide que dos líneas del mismo análisis digan cosas distintas.
   - Arreglo: `composiciones` (de qué cuelga, autoridad, documento, fuente, fecha, incompleta) y `composicion_lineas` (sustancia, tipo de cifra, valor, mínimo, máximo).
   - Un material puede tener varias composiciones a la vez (literatura, fabricante, anexo IFRA); la cabecera es lo que el motor elige por precedencia.
3. **Los datos por fuente no saben guardar listas.** «Familias: floral 46 %, gourmand 23 %» son varias filas sin nada que las agrupe, y el ★ marca una fila, no la lista de esa fuente. Además hay ocho columnas de valor, casi siempre vacías.
   - Arreglo: `afirmaciones` (una por material, atributo y fuente, con su ★, condición, escala y cita) y una tabla hija `afirmacion_terminos` (término y %) para los atributos de lista.
   - Los valores numéricos se guardan dos veces: como los dio la fuente y pasados a la unidad y escala propias (`valor_min`, `valor_max`). Solo los propios se usan para ordenar, filtrar y calcular.
4. **Tus cambios tienen que tener la misma forma que el glosario.** `mis_cambios` guarda `valor texto`: una densidad corregida no se puede usar para pasar de volumen a masa, y una lista de familias no cabe.
   - Arreglo: `mis_afirmaciones` con las mismas columnas que `afirmaciones` (y su tabla hija), colgando de `mis_materiales`. La separación se mantiene; la ficha se resuelve con la misma lógica en las dos zonas.
   - Lo mismo para tu composición: `mis_composiciones` con la forma de `composiciones`.
5. **La condición del dato es texto libre.** `base` («al 10 % en etanol», «@ 25 °C») impide comparar una duración al 10 % con otra pura, o una densidad a 20 °C con otra a 25 °C.
   - Arreglo: columnas de condición en cada afirmación: `dilucion`, `disolvente_id`, `temperatura_c`, `presion` y `soporte` (tira, piel). Un dato sin condición conocida se marca así, no se supone.

### Antes de cargar datos

6. **El glosario no tiene historia.** El script escribe por tandas que apruebas, pero ninguna fila dice de qué tanda viene. Si una tanda sale mal, no hay forma de deshacerla.
   - Arreglo: tabla `tandas` (fecha, script, fuente, estado, quién aprueba) y `tanda_id` en cada fila del glosario.
7. **Los duplicados se fusionarán y romperán tus vínculos.** Con 2.212 materiales de PerfuMate y 127 de la v3 aparecerán duplicados. Si se borra uno, tus materiales y fórmulas que apuntan a él se rompen.
   - Arreglo: `materiales.fusionado_en`. El material fusionado no se borra; redirige al que queda, y el script mueve después los vínculos.
8. **Una identidad sin clave única no es una identidad.** «CAS + forma isomérica» y «especie + parte + proceso + quimiotipo + tratamientos» son reglas que hoy solo existen en el documento.
   - Arreglo: columna `clave_identidad` calculada (por ejemplo `puro:24851-98-7:enriquecido`) con índice único. Es lo que impide crear dos Hedione HC.
9. **El tipo de vocabulario no se comprueba.** Con una sola tabla `vocabularios`, nada impide que una familia apunte a un término de la lista «partes».
   - Arreglo: clave foránea compuesta (lista, id), o tablas propias para los vocabularios ricos (familias con color y padre, descriptores). Las listas fijas y cortas (tipo de material, ★, estado) pasan a ser valores comprobados, no filas.
10. **Fracción y porcentaje conviven.** `ifra_limites` guarda fracción (0,006), y el resto, porcentaje. Un error de factor 100 en IFRA es silencioso.
    - Arreglo: todo en fracción (0 a 1) en la base, porcentaje solo en pantalla. Las masas, como ya hacen las fórmulas, en microgramos enteros.

### Puede esperar, pero decídelo ya

11. **Enmiendas y categorías como texto.** Aparecen en `ifra_estandares`, `ifra_anexo`, `documentos`, `mis_documentos`, `topes_fabricante` y `mis_limites`.
    - Arreglo: `enmiendas` (número, fecha de notificación, vigor para creaciones nuevas, vigor para existentes) y `categorias_ifra` (las 18 de la 51.ª: 1, 2, 3, 4, 5A–5D, 6, 7A–7B, 8, 9, 10A–10B, 11A–11B, 12).
12. **Los alérgenos no son una fila por CAS.** Hay entradas que son un aceite esencial entero y entradas que agrupan varias sustancias bajo un nombre de etiqueta.
    - Arreglo: `alergenos_entradas` (nombre de etiqueta, vigencia) y `alergeno_sustancias` (varias por entrada). El cálculo mira el material entero y su composición: la lavanda declara «Lavandula Oil/Extract» y, además, su linalool.
    - Los umbrales (0,001 % y 0,01 %) son de la norma, no de cada alérgeno: van una vez, en la entrada de la lista.
13. **Un informe IFRA no se puede repetir.** Se guarda la enmienda, pero no la composición que se usó; si el glosario corrige el limón, el informe de ayer da otro resultado.
    - Arreglo: el informe guarda una foto (JSON) de la composición efectiva y de los límites que usó.
14. **Dilución de fábrica contada dos veces.** Si la composición de Ambergris T Oliffac ya incluye el 90 % de etanol y además el producto dice «dilución 10 %», el motor puede diluir dos veces.
    - Arreglo: una regla escrita. La composición de un producto es siempre la del producto tal como se vende, disolvente incluido; `dilucion_pct` es informativa y no entra en el cálculo.
15. **`copia_de` está en la fuente, pero la copia es por dato.** PerfuMate copia la duración de TGSC, no sus familias.
    - Arreglo: `derivada_de` en cada afirmación, apuntando a la afirmación copiada. Las copias no cuentan como fuentes distintas para el consenso.

## Qué simplificar

Seis tablas sobran: o repiten lo que ya guarda otra, o son una relación uno a uno con dos o tres columnas. Quitarlas reduce uniones sin perder nada.

| Hoy | Propuesta | Por qué |
| --- | --- | --- |
| `puros` (5 campos) | Dos columnas en `materiales`: `sustancia_id` y `forma_isomerica` | Fórmula, peso y SMILES pasan a la sustancia. Lo que queda no justifica una tabla aparte |
| `naturales` (4 campos) | Cuatro columnas en `materiales`: especie, parte, proceso, quimiotipo | Con una comprobación por tipo (un puro no puede tener especie) se mantiene la ventaja de no tener «no aplica», sin la unión extra |
| `mezclas` (solo fabricante) | Desaparece | El fabricante ya está en `productos`. La regla «una mezcla del glosario tiene producto» se comprueba al aprobar la tanda |
| `mezcla_moleculas` | Una marca `define` en `composicion_lineas` | Las moléculas que definen una mezcla son parte de su composición. Hoy tienen 0 filas |
| `mezcla_reactivos` | Un tipo más en `relaciones`: «se obtiene de» | Es una relación entre dos materiales del glosario. Hoy tiene 5 filas |
| `mis_mezclas` | Una fila de `mis_materiales` con `tipo = acorde` y su `formula_id` | Un acorde se usa como un material: así la línea de fórmula apunta siempre al mismo sitio |
| `formula_eventos`: tres claves posibles | Una sola: `mi_material_id` | «Lo uso pero no lo tengo» es un material tuyo con estado «no lo tengo», creado solo al usarlo. «Dónde se usa» sale de su `material_id` |
| `identificadores` con CAS | Solo INCI, FEMA, EINECS y sinónimos | El CAS vive en `sustancias` y `sustancia_alias` |
| Columnas `ticker` y `ticker_origen` en `materiales` | Igual, pero con índice único en `ticker` | El ticker ya es único por regla; que lo imponga la base |

Lo que **no** conviene simplificar, aunque lo parezca:

- **`afirmaciones` como filas en vez de columnas.** Con 30 atributos, varias fuentes y la mayoría vacíos, las filas son la forma correcta: un atributo sin datos no cuesta nada, y añadir uno nuevo es una fila en `atributos`, no un cambio de tabla. Por eso la criba de campos no hace falta para la base, solo para la pantalla.
- **La ficha como vista.** Debe ser una vista materializada con columnas reales (familia principal, potencia en tu escala, densidad, nota), que el script regenera al aprobar cada tanda. La app lee solo de ahí; nunca reconstruye la ficha consulta a consulta.
- **La separación glosario / lo tuyo.** Se mantiene. Lo que se unifica es la forma de las tablas, no las tablas.

## Qué falta

Nueve tablas nuevas (contando la gemela de términos en lo tuyo y informes\_ifra, que guarda la foto de cada informe) y una docena de campos. Casi todo es trazabilidad y reglas que hoy dependen de la app.

| Nuevo | Dónde | Para qué |
| --- | --- | --- |
| `tandas` | Apoyo | Cada carga del script: fecha, fuente, script, estado (propuesta, aprobada, revertida). Permite deshacer una tanda entera |
| `composiciones` | Glosario | Cabecera de cada composición: de qué cuelga (identidad o producto), autoridad, documento, fuente, fecha, incompleta |
| `mis_composiciones` | Lo tuyo | La misma cabecera para tus GC-MS y declaraciones de proveedor |
| `afirmacion_terminos` (y su gemela en lo tuyo) | Glosario | Los valores de lista de una afirmación: término y % |
| `enmiendas` | Regulación | Número, notificación, vigor para creaciones nuevas y existentes. La 51.ª y la 52.ª convivirán desde enero de 2027 |
| `categorias_ifra` | Regulación | Las 18 categorías por enmienda, con su descripción. La usan límites IFRA, topes del fabricante y tus límites |
| `alergeno_sustancias` | Regulación | Qué sustancias (o qué natural entero) cubre cada entrada de alérgeno |

| Campo nuevo | Tabla | Para qué |
| --- | --- | --- |
| `tipo`, `formula`, `peso_molecular`, `smiles`, `inchikey`, `pubchem_cid` | `sustancias` | La química, una vez por molécula; PubChem la rellena por API |
| `sustancia_id`, `forma_isomerica`, `especie`, `parte`, `proceso`, `quimiotipo` | `materiales` | Los bloques de puro y natural, con comprobación por tipo |
| `clave_identidad` (única) | `materiales` | Impide identidades repetidas |
| `fusionado_en` | `materiales` | Fusionar duplicados sin romper tus vínculos |
| `tanda_id`, `creado`, `actualizado` | Todas las del glosario | Trazabilidad y reversión |
| `derivada_de` | `afirmaciones` | Saber qué dato es copia de otro |
| `dilucion`, `disolvente_id`, `temperatura_c`, `presion`, `soporte` | `afirmaciones` | Condición del dato, comparable |
| `valor_original`, `unidad_original` | `afirmaciones` | Lo que dijo la fuente, intacto, junto al valor ya convertido |
| `tipo_valor`, `unidad`, `es_lista` | `atributos` | Qué forma tiene cada atributo; la base valida contra ella |
| `foto` (JSON) | Informe IFRA de una fórmula | Repetir el veredicto tal como se dio |
| `rol` (fabricante, distribuidor, laboratorio) | `fabricantes`, que pasa a llamarse `empresas` | Tu proveedor deja de ser texto libre en `mis_materiales` |

## Esquema propuesto

Con los cambios, el esquema queda en 45 tablas y 2 vistas: verificacion\_ifra deja de ser una vista de la base y pasa a calcularse en la app (ver la propuesta general). Glosario, lo tuyo y regulación no se unen entre sí más que a través de `sustancias`, salvo el vínculo de tu frasco con su material.

&#91;embedded content: esquema propuesto · 5 zonas, uniones entre zonas\]

Composiciones, puros, IFRA y alérgenos llegan a la misma tabla; por eso un error de CAS se arregla en un solo sitio.

| Zona | Tablas | Vistas |
| --- | --- | --- |
| Apoyo (6) | `fuentes`, `empresas`, `vocabularios`, `equivalencias`, `escalas`, `tandas` | — |
| Núcleo químico (2) | `sustancias`, `sustancia_alias` | — |
| Glosario (14) | `materiales`, `natural_tratamientos`, `identificadores`, `productos`, `documentos`, `topes_fabricante`, `composiciones`, `composicion_lineas`, `atributos`, `afirmaciones`, `afirmacion_terminos`, `relaciones`, `perfumes_referencia`, `apuntes` | `ficha` (materializada) |
| Regulación (9) | `enmiendas`, `categorias_ifra`, `ifra_estandares`, `ifra_sustancias`, `ifra_limites`, `ifra_anexo`, `ifra_reglas`, `alergenos_entradas`, `alergeno_sustancias` | `verificacion_ifra` |
| Lo tuyo (13) | `mis_materiales`, `mis_afirmaciones`, `mi_afirmacion_terminos`, `mis_composiciones`, `mi_composicion_lineas`, `mis_documentos`, `mis_limites`, `mis_apuntes`, `diluciones`, `catas`, `evaluaciones`, `formulas`, `formula_eventos` | `mi_ficha` |

## Cómo llega una fórmula a IFRA

Tu idea de fondo está bien y la auditoría no la cambia: el material no guarda ningún límite, IFRA vive aparte por enmiendas, y el veredicto se calcula cada vez que se usa una fórmula, ponderando y sumando lo que aporta cada material. Sacar `sustancias` a un núcleo no mete IFRA en el glosario; solo deja la puerta (el CAS) en un sitio neutral que usan las tres zonas.

Lo que sí falla es que el esquema actual describe ese cálculo solo de palabra, en la vista `verificacion_ifra`, y le faltan cuatro relaciones para poder hacerlo. Mi dibujo de arriba tampoco lo enseña: muestra las tablas, no el recorrido.

El recorrido, paso a paso:

1. **Línea de fórmula** (`formula_eventos`): masa en µg de un material tuyo.
2. **Se deshace la dilución** (`diluciones`, y `dilucion_origen_id` si es dilución de otra dilución): masa real de material.
3. **Se deshace el acorde**, si la línea es un acorde: se repite el recorrido sobre su fórmula congelada.
4. **Composición efectiva del material**, por precedencia: tu composición › la del producto › la genérica › el anexo IFRA. Si no hay ninguna, el material se marca «sin composición», nunca cero.
5. **Suma por sustancia** en toda la fórmula, más el propio material como sustancia cuando tiene CAS propio (la bergamota cuenta como «Bergamot oil expressed» además de por su bergapteno).
6. **Agrupación por estándar** (`ifra_sustancias`): un estándar puede cubrir varios CAS y se compara la suma, no cada uno.
7. **Paso a producto acabado**: se multiplica por la concentración del concentrado en el producto (un extrait al 20 %).
8. **Comparación** con `ifra_limites` de la categoría y enmienda elegidas; después, topes del fabricante y tus límites. Manda el más estricto.
9. **Informe**: el veredicto se calcula, no se guarda; solo cuando emites un informe se guarda una foto de lo que se usó.

**Las cuatro relaciones que faltan:**

| Falta | Dónde | Sin ella |
| --- | --- | --- |
| Categoría IFRA, enmienda y concentración en producto de la fórmula | `formulas` → `categorias_ifra`, `enmiendas`; campo `concentracion_producto` | El paso 7 y 8 no tienen con qué calcularse. PerfuMate pide justo esto: categoría 4 a un 17,5 % |
| El material como sustancia en sí mismo | `materiales.sustancia_id` (propuesto en el problema 1) | Los estándares de naturales enteros, y los alérgenos que son aceites esenciales, no se detectan |
| CAS de IFRA resuelto a sustancia | `ifra_sustancias.sustancia_id` en vez de unir por texto | Un CAS escrito distinto o antiguo se salta el estándar sin avisar |
| Tipo de estándar | `ifra_estandares.tipo` usado por el motor: límite, prohibición, especificación | Un estándar de especificación (pureza, contenido máximo de una impureza) no es un % que sumar; hoy se trataría como límite |

La foto del informe (problema 13) no contradice el cálculo en tiempo de uso: el veredicto sigue sin guardarse en ningún material ni fórmula; la foto solo congela un informe que ya has emitido, para poder repetirlo si el glosario o IFRA cambian después.

## Reglas que debe imponer la base

Cada regla de tu documento que hoy solo existe en palabras debe ser una restricción. Si la impone la app, el script o una edición a mano acabarán saltándosela.

| Regla | Cómo se impone |
| --- | --- |
| Un puro tiene sustancia y forma isomérica; no tiene especie | Comprobación por `tipo` en `materiales` |
| Un natural tiene especie, parte y proceso; no tiene forma isomérica | Comprobación por `tipo` en `materiales` |
| No hay dos identidades iguales | Índice único en `clave_identidad` |
| Ticker único | Índice único en `ticker` |
| Una composición cuelga de una identidad o de un producto, nunca de los dos | Comprobación: exactamente uno de `material_id` y `producto_id` |
| Las líneas de una composición no pasan del 100 % | Comprobación al aprobar la tanda (con tolerancia y rangos) |
| Un solo ★ por material, producto y atributo | Índice único parcial donde `rango = manda` |
| Una familia apunta a un término de la lista «familias» | Clave foránea compuesta (lista, id) |
| Fracciones entre 0 y 1 | Comprobación en cada columna de fracción |
| Nadie apunta a un material fusionado | Disparador que lo rechaza y propone el destino |
| Una línea de fórmula apunta a un solo material tuyo | Columna única y obligatoria |
| Cada fila del glosario tiene tanda y fuente | `tanda_id` y `fuente_id` obligatorios |
| Todo CAS de IFRA está resuelto a una sustancia | `sustancia_id` en `ifra_sustancias`; los no resueltos van a una lista de pendientes |
| Lo tuyo solo lo ves tú; el glosario no lo toca la app | Seguridad por fila con `owner_id`; escritura del glosario solo con el rol del script |

## Decisiones que te tocan y orden de trabajo

Cinco decisiones cambian la forma de las tablas; el resto de la auditoría no depende de ellas.

- [ ] **Puros y naturales dentro de `materiales`.** Recomendado: sí, con comprobación por tipo. La alternativa es mantener las dos tablas uno a uno y aceptar una unión más en cada consulta.
- [ ] **Lo tuyo con la misma forma que el glosario.** Recomendado: tablas separadas y gemelas (`mis_afirmaciones`, `mis_composiciones`). La alternativa, una sola tabla con `owner_id`, es más corta pero rompe tu decisión de separarlo todo.
- [ ] **Fracción como unidad única en la base.** Recomendado: sí, porcentaje solo en pantalla.
- [ ] **Acordes y «no lo tengo» como materiales tuyos.** Recomendado: sí; deja una sola clave en las líneas de fórmula.
- [ ] **Listas con tabla hija.** Recomendado: `afirmacion_terminos`. La alternativa, un JSON dentro de la afirmación, no deja comprobar que el término existe.

Orden para construir, de dentro hacia fuera:

1. Núcleo químico: `sustancias` y alias, rellenos desde los CAS de la v3 e IFRA, completados con PubChem.
2. Regulación con `enmiendas` y `categorias_ifra`, cargando la 51.ª y dejando sitio a la 52.ª.
3. Identidad: `materiales`, `identificadores`, `productos`, `empresas`, con `clave_identidad` y `tandas` desde el primer día.
4. Composiciones con cabecera, y el motor IFRA probado contra los 15 casos de tu tabla de prueba.
5. `atributos`, `afirmaciones` y la ficha materializada; primero los atributos bien cubiertos (familias, potencia, duración, dilución).
6. Lo tuyo: `mis_materiales` y sus gemelas; después diluciones, catas y fórmulas, que solo cambian de clave.
7. Migración de la v3 y primera tanda de PerfuMate, con la fusión de duplicados ya disponible.

## TL;DR: qué tipo de fallo es cada cambio

De 24 cambios, 8 son de diseño, 10 de ejecución y 6 de interpretación de datos. Los de ejecución no tocan tu idea, solo hacen que la base la cumpla; los de diseño son los que conviene revisar, y en cinco puedo haberte entendido mal.

- **Diseño:** la estructura no puede representar algo que la app necesita.
- **Ejecución:** la idea ya estaba, pero el esquema no la impone o la aplica de forma desigual.
- **Interpretación:** cómo se leen los datos de las fuentes o de la norma.

| # | Cambio | Tipo | Por qué ese tipo | ¿Pude entenderte mal? | Tu respuesta |
| --- | --- | --- | --- | --- | --- |
| P1 | Fórmula, PM y SMILES a `sustancias`; sustancias como núcleo | Diseño | La química es de la molécula y se repetía | Sí, si `sustancias` en regulación fue a propósito. La unión con IFRA sigue siendo solo por CAS |  |
| P2 | Cabecera de composición | Diseño | Datos del análisis repetidos en cada línea | No |  |
| P3 | Afirmaciones con tabla hija para listas | Diseño | El ★ no cubre una lista de familias | No |  |
| P4 | `mis_cambios` con la forma del glosario | Diseño | Un texto no sirve para calcular | Sí, si lo pensaste como nota y no como dato |  |
| P5 | Condición del dato en columnas | Interpretación | «Al 10 % en etanol» no se compara como texto | No |  |
| P6 | `tandas` | Ejecución | Las tandas ya eran la idea; faltaba la tabla | No |  |
| P7 | `fusionado_en` | Ejecución | Fusionar duplicados sin romper vínculos | No |  |
| P8 | `clave_identidad` única | Ejecución | La regla existía solo en el documento | No |  |
| P9 | Vocabulario comprobado por lista | Ejecución | Una tabla única no impide mezclar listas | No |  |
| P10 | Fracción como unidad única | Ejecución | Fracción en IFRA y % en el resto | No |  |
| P11 | `enmiendas` y `categorias_ifra` como tablas | Ejecución | «Varias enmiendas a la vez» ya estaba previsto, como texto | No |  |
| P12 | Alérgenos por entradas y sustancias | Interpretación | La norma tiene entradas que son aceites enteros o grupos | No |  |
| P13 | Foto del informe IFRA | Diseño | Sin ella un informe no se repite | Sí, parece chocar con «se calcula cada vez»; no lo hace, ver la sección anterior |  |
| P14 | Regla de dilución de fábrica | Interpretación | No estaba escrito qué incluye la composición | No |  |
| P15 | Copia por dato (`derivada_de`) | Interpretación | PerfuMate copia unos datos de TGSC, no todos | No |  |
| S1 | Puros y naturales dentro de `materiales` | Diseño | Dos tablas uno a uno con pocos campos | Sí, elegiste una tabla por tipo para evitar «no aplica» |  |
| S2 | Quitar `mezclas`, `mezcla_moleculas`, `mezcla_reactivos` | Ejecución | Repiten producto, composición y relaciones | No |  |
| S3 | Acordes y «no lo tengo» como materiales tuyos | Diseño | Una sola clave por línea de fórmula | Sí, si «el acorde nunca es mezcla de laboratorio» incluía no mezclarlo con tus frascos |  |
| S4 | CAS fuera de `identificadores` | Ejecución | El CAS estaba en tres sitios | No |  |
| F1 | Categoría, enmienda y concentración en la fórmula | Ejecución | El cálculo estaba pensado, pero sin estos datos no corre | No |  |
| F2 | El material como sustancia en sí mismo | Diseño | Sin ello no se ven los estándares y alérgenos de naturales enteros | No |  |
| F3 | CAS de IFRA resuelto a sustancia | Ejecución | Hoy se une por texto | No |  |
| F4 | Tipo de estándar en el motor | Interpretación | Una especificación no es un % que sumar | No |  |
| F5 | Sumar por estándar, no por sustancia | Interpretación | La vista decía «por sustancia», y un estándar puede cubrir varios CAS | No |  |

## Propuesta general de cambios

De las 45 piezas del modelo base (42 tablas y 3 vistas), 10 se mantienen, 29 cambian y 6 se quitan; entran 7 tablas nuevas y dos se parten en cabecera y líneas. Resultado: 45 tablas y 2 vistas. Cada fila corresponde a una tabla de la radiografía, en su mismo orden, para contrastarla una a una.

**Motor IFRA en tiempo real.** La regulación sigue aparte y solo se lee. Al abrir una fórmula, la app carga la composición ya resuelta de cada material (de la ficha) y los límites de la enmienda y categoría elegidas. Al cambiar un gramo, la propia app recalcula: deshace diluciones y acordes, suma por CAS, añade el CAS propio de cada material, agrupa por estándar, pasa a producto acabado y contrasta. La base no interviene hasta que emites un informe.

### Apoyo

| Tabla del modelo base | Cambio | Propuesta |
| --- | --- | --- |
| `fuentes` | Cambia | Pierde `copia_de`: la copia pasa a cada afirmación (`derivada_de`) |
| `fabricantes` | Cambia | Se llama `empresas` y añade `rol` (fabricante, distribuidor, laboratorio). Tu proveedor apunta aquí |
| `vocabularios` | Cambia | Clave compuesta (lista, id). Las listas fijas y cortas pasan a valores comprobados; familias y descriptores pueden tener tabla propia |
| `equivalencias` | Se mantiene | Igual, apuntando a (lista, id) |
| `escalas` | Cambia | `conversion` deja de ser texto: regla mínimo-máximo o tabla de puntos. El valor convertido se guarda en la afirmación |
| — | Nueva | `tandas`: cada carga del script, con estado y quién aprueba |

### Núcleo químico (antes en regulación)

| Tabla del modelo base | Cambio | Propuesta |
| --- | --- | --- |
| `sustancias` | Cambia | Sale de regulación. Añade `tipo` (molécula, natural o UVCB, grupo), `formula`, `peso_molecular`, `smiles`, `inchikey`, `pubchem_cid` |
| `sustancia_alias` | Se mantiene | Igual, junto a `sustancias` |

### Glosario

| Tabla del modelo base | Cambio | Propuesta |
| --- | --- | --- |
| `materiales` | Cambia | Añade `sustancia_id`, `forma_isomerica`, `especie`, `parte`, `proceso`, `quimiotipo`, `clave_identidad` (única), `fusionado_en`, `tanda_id`. Ticker único. Comprobación por tipo |
| `identificadores` | Cambia | Sin CAS: solo INCI, FEMA, EINECS y sinónimos |
| `puros` | Se quita | Forma isomérica a `materiales`; fórmula, peso y SMILES a `sustancias` |
| `naturales` | Se quita | Sus cuatro campos a `materiales` |
| `natural_tratamientos` | Se mantiene | Igual; entra en `clave_identidad` |
| `mezclas` | Se quita | El fabricante ya está en `productos` |
| `mezcla_moleculas` | Se quita | Marca `define` en `composicion_lineas` |
| `mezcla_reactivos` | Se quita | Tipo «se obtiene de» en `relaciones` |
| `productos` | Cambia | Apunta a `empresas`. `dilucion_pct` es informativa: la composición es la del producto tal como se vende |
| `documentos` | Cambia | `enmienda_ifra` texto pasa a `enmienda_id` |
| `topes_fabricante` | Cambia | `categoria` texto pasa a `categoria_id`; tope en fracción |
| `composicion` | Cambia | Se parte en `composiciones` (cabecera: de qué cuelga, autoridad, documento, fuente, incompleta) y `composicion_lineas` |
| `datos_por_fuente` | Cambia | Pasa a `afirmaciones`: valor original y convertido, condición en columnas, `derivada_de`, un solo ★ impuesto por índice |
| — | Nueva | `afirmacion_terminos`: los valores de lista (término y %) |
| `atributos` | Cambia | De catálogo descriptivo a tabla con `tipo_valor`, `unidad` y `es_lista` |
| `relaciones` | Cambia | Nuevo tipo «se obtiene de» |
| `perfumes_referencia` | Se mantiene | Igual |
| `apuntes` | Se mantiene | Igual |
| `ficha` (vista) | Cambia | Vista materializada con columnas reales, regenerada al aprobar cada tanda. Incluye la composición resuelta de cada material, que es lo que carga el motor IFRA |

### Regulación

| Tabla del modelo base | Cambio | Propuesta |
| --- | --- | --- |
| — | Nueva | `enmiendas`: número, notificación, vigor para creaciones nuevas y existentes |
| — | Nueva | `categorias_ifra`: las 18 categorías por enmienda |
| `ifra_estandares` | Cambia | `enmienda_id`; el `tipo` (límite, prohibición, especificación) lo usa el motor |
| `ifra_sustancias` | Cambia | Añade `sustancia_id` resuelto; el CAS en texto queda como original |
| `ifra_limites` | Cambia | `categoria_id`; sigue en fracción |
| `ifra_anexo` | Cambia | `enmienda_id`; natural y constituyente resueltos a sustancia |
| `ifra_reglas` | Se mantiene | Igual |
| `alergenos_ue` | Cambia | Pasa a `alergenos_entradas` (nombre de etiqueta, vigencia); los umbrales, una vez por lista |
| — | Nueva | `alergeno_sustancias`: qué sustancias o naturales enteros cubre cada entrada |
| `verificacion_ifra` (vista) | Cambia | Deja de ser vista de la base: el cálculo corre en la app, en tiempo real |

### Lo tuyo

| Tabla del modelo base | Cambio | Propuesta |
| --- | --- | --- |
| `mis_materiales` | Cambia | Añade `tipo` (frasco o acorde), `formula_id` para acordes y estado «no lo tengo». Proveedor apunta a `empresas`. `material_id` obligatorio salvo en acordes |
| `mis_cambios` | Cambia | Pasa a `mis_afirmaciones`, con la forma de `afirmaciones` |
| — | Nueva | `mi_afirmacion_terminos`: gemela de `afirmacion_terminos` |
| `mi_composicion` | Cambia | Se parte en `mis_composiciones` (cabecera) y `mi_composicion_lineas` |
| `mis_documentos` | Cambia | `enmienda_id` |
| `mis_limites` | Cambia | `categoria_id`; tope en fracción |
| `mis_apuntes` | Se mantiene | Igual |
| `mi_ficha` (vista) | Se mantiene | Igual, leyendo de `mis_afirmaciones` |
| `diluciones` | Cambia | `disolvente` texto pasa a `disolvente_id` (un material) |
| `catas` | Se mantiene | Igual; tier y evolución llegan desde el material, como ya estaba previsto |
| `evaluaciones` | Se mantiene | Igual |
| `formulas` | Cambia | Añade `categoria_id`, `enmienda_id` y `concentracion_producto` |
| `formula_eventos` | Cambia | Una sola clave, `mi_material_id`; se quitan `material_id` y `mi_mezcla_id` |
| `mis_mezclas` | Se quita | Pasa a `mis_materiales` con tipo acorde |
| — | Nueva | `informes_ifra`: fórmula, enmienda, categoría, fecha y la foto de lo que se usó |

## Fuentes

- [PerfuMate · página principal y catálogo](https://perfumate.app/landing)
- [ScentFriends · quiénes somos](https://scentfriends.com/en/about-us/)
- [Première Peau · glosario, Hedione](https://premierepeau.com/pages/glossary-terms/hedione)
- [Coptis Ingredients](https://coptis.com/Nouvelles-Matieres)
- [IFRA · carta de fin de consulta de la 52.ª enmienda (31-ago-2026)](https://ifrafragrance.org/latest-updates/ifra-news/ifra-publishes-end-of-consultation-letter-for-the-52nd-amendment-to-the-ifra-standards)
- [Personal Care Insights · alérgenos UE 2023/1545 en vigor](https://www.personalcareinsights.com/news/eu-fragrance-allergen-labeling-deadline.html)
- [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest)
- Tus documentos: «Esquema completo de materiales», «Tabla de materiales de prueba» y «Radiografía de los datos»

La ordenación de Coptis por fabricante sale de [Premium Beauty News](https://www.premiumbeautynews.com/en/Coptis-A-saga-the-French-way-to,3491). Ningún referente publica su esquema interno: lo que se dice de ellos está deducido de sus fichas públicas.
