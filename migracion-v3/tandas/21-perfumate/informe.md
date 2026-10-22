# Tanda 21 · PerfuMate en el sistema nuevo

El catálogo de PerfuMate (2212 entradas, scrape del 2026-10-20) en el esquema nuevo (V3-70; `docs-v3/sistema-materiales.md`). Todo lo que dice PerfuMate entra como afirmación suya, con la página como cita. **En revisión: no está aprobada.**

## Cuánto entra

- **1920 de 2212 entradas** entran; **292 no** (`revision/pendientes.csv`): 225 por «sintético sin CAS y sin empresa: ni puro ni mezcla»; 67 por «natural: no se lee la especie en su nombre ni en sus sinónimos».
- Dan **1824 materiales**: 1126 puros, 388 naturales, 310 mezclas. 69 identidades reúnen varias entradas (`revision/identidades-con-varias-entradas.csv`): el mismo CAS es el mismo puro, y cada entrada con proveedor pasa a ser un producto suyo.
- 391 productos de 38 empresas; 5803 identificadores (sinónimos y nombres comerciales); 1920 descripciones (en inglés).
- 1231 sustancias nuevas; las demás ya estaban en la tanda 20 (IFRA).
- 483 composiciones con 2946 líneas, autoridad «literatura» y cifra «sin especificar» (PerfuMate no dice si es típica o máxima): nunca dan «dentro» en IFRA.
- 13985 afirmaciones con 24702 términos; 13602 con ★. 117 grupos no concuerdan y quedan «en disputa», sin ★ (`revision/conflictos.csv`).

## Lo que infiere el script (propuesta de la sesión)

- **El tipo.** Origen «natural» de PerfuMate con especie legible → natural; sin especie, con un CAS de molécula y un nombre que no es de aceite ni extracto → puro de origen «natural_isolate» (13). Origen «synthetic» con CAS → puro; sin CAS y con empresa (proveedor o catálogo) → mezcla.
- **Los naturales (421).** La especie sale de un sinónimo en latín («Salvia sclarea absolute»), si su género está en el anexo de IFRA o parece latino y no es un nombre común de PerfuMate: 363. Sin sinónimo en latín, la del CAS en el anexo de IFRA: 38; la de otra entrada de PerfuMate con el mismo CAS: 20. La parte, del nombre: 132; el proceso: 412; con tratamientos (FCF, sin terpenos…): 14; con quimiotipo: 6. Lo que no se lee queda vacío en la clave, no se supone.
- **El nombre de la identidad** es el de PerfuMate (en inglés). Para un puro con proveedor es el comercial («Hedione»), no el químico que pide A9: falta traerlo de PubChem.
- **De quién son los datos.** Si un material tiene una sola entrada, lo que dice PerfuMate es del material, aunque nombre un proveedor (el producto se crea igual). Si tiene varias, lo de cada entrada con proveedor va a su producto.
- **Las familias, como las da PerfuMate** (V3-71): cada una es un término suyo, con su nombre en inglés y sin general por encima. Cuáles se unen, o si se simplifican en menos, se decide cuando haya más fuentes. La familia principal de la ficha es la que más suma.
- **Subfamilias repetidas** en una misma entrada (bajo dos familias de PerfuMate): 111; quedan como un término con los pesos sumados.
- **En inglés, tal como vienen** (V3-71): 387 subfamilias y descriptores, las familias, las notas y las descripciones.
- **La potencia** (el «impact» de PerfuMate, de 1 a 10 en lo descargado) se guarda tal cual, sin pasar a tu escala, que sigue abierta.

## Más cosas que mirar

