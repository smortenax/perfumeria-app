# Interrogatorio de diseño — la intención de la app

Registro de preguntas y respuestas para aclarar qué tiene que ser la app, empezando por
la **formulación**. **Se añade, no se reescribe**: si una respuesta cambia, se añade la
corrección con fecha debajo.

Método adaptado del [prompt de interrogatorio](antecedentes/formulacion/prompt-interrogatorio-diseno.md):
tandas de tres preguntas como máximo. El usuario puede responder **en prosa**. La
respuesta se interpreta, la lectura se escribe aquí y el usuario la confirma o la
corrige.

Cuando las rondas R1 a R4 estén cerradas, lo decidido pasa a [`decisiones.md`](decisiones.md)
como v3. Los [antecedentes](antecedentes/README.md) no obligan a nada.

Última sesión: 2026-09-25

---

## Ronda 1 — El núcleo

### P1 — ¿Qué es una fórmula?
- Bloque: 1 · el núcleo
- Abierta por: `antecedentes/formulacion/02-dominio-y-datos.md` §1 (composición cerrada con versiones) frente al Banco v2 (el historial de adiciones es la fórmula)
- Opciones presentadas: A) historial de adiciones · B) composición editable con versiones · C) las dos: se trabaja por adiciones y «cerrar versión» da una composición editable
- Recomendación: C
- Respuesta: **propia, más cercana a A**
- Razón del autor: *«lo ideal es que imiten la realidad, las formulas pueden ser editables pero aditivamente, pero con una sucesion de descendencia. por ejemplo si abro una formula que he creado y esta igual, añadirle productos la alterara pero esto no alterara las mezclas que se hayan creado a traves de la formula previa a la edicion. […] las formulas son una categoria de informacion en el proyecto que registrara una adicion de todos los componentes que la conforman. lo que hace falta es que luego puedan ser usadas para otros perfumes, por ejemplo, como acorde. creo que aqui el secreto seria seleccionar una opcion en opciones, importar formula como material. en cuanto la importas deja de ser una formula vinculada a otra formula, sino la formula importada se traduce en lo que la compone para la formula en la que se esta trabajando (se registra en el documento como el nombre de la formula ha sido agregada, pero internamente se desglosa en las materias primas que la componen)»*
- **Lectura:**
  1. Una fórmula es **un registro de adiciones**. Se edita **solo añadiendo**, como en el
     banco real, donde lo vertido no se desvierte.
  2. **Cada estado del registro queda fijo.** Lo que se haya hecho a partir de un estado
     anterior no cambia al añadir después: la versión de una fórmula es *hasta qué adición
     llega*.
  3. **Descendencia:** de cualquier estado puede nacer una fórmula hija que recuerda de qué
     madre y de qué estado sale.
  4. **Importar una fórmula como material.** Es una opción al añadir, y se hace **por
     copia desglosada, no por vínculo**:
     - el registro muestra una línea, «Fórmula X, 500 mg»;
     - por dentro se reparten esos 500 mg entre sus materias primas, en la proporción
       exacta de ese estado;
     - si la fórmula X cambia después, la que la importó no se entera.

     Es la «base inmutable» del Banco v2, generalizada a cualquier fórmula.
  5. **Lo que se descarta de los antecedentes:** acordes anidados con vínculo vivo, versión
     fijada, detección de ciclos y profundidad máxima (`02` §1, `03` §4). Al desglosar en
     el momento de importar, nada de eso hace falta.
- Fecha: 2026-09-25
- Estado: cerrada · lectura por confirmar
- Destino: decisiones.md

### P2 — ¿Dónde vive la verdad?
- Bloque: 1 · el núcleo
- Abierta por: la app lee los CSV del repositorio (`README.md` de la app, `exportar.py`) frente a un almacén propio
- Opciones presentadas: A) en el repositorio · B) en la app · C) repartida: referencia en el repositorio, fórmulas en la app
- Recomendación: C
- Respuesta: **propia: la app es autónoma, y el repositorio la alimenta mientras se construye**
- Razón del autor: *«la app aunque sea para empezar usandola yo tiene que ser autonoma, porque la infraestructura tiene que existir por si misma, yo diria que lo mejor seria que para la creacion de la app se importe informacion de la repo hasta que pueda existir por si misma, por ejemplo en cuanto la quiera hacer usable y que sea un ejecutable en mi movil si quiero que autocontenga regulacion ifra no que tenga que ir a un repositorio de mi ordenador»*
- **Lectura:**
  1. La app **funciona sola, también en el móvil y sin conexión**. Lleva dentro sus datos:
     IFRA, materiales, niveles de uso.
  2. El repositorio es **la fuente de la que se alimenta**. Los datos de referencia se
     importan del repositorio como un **paquete de datos versionado**. Es lo que ya hace
     [`exportar.py`](exportar.py), convertido en paso de construcción.
  3. **Autonomía de ejecución no es un repositorio aparte.** El código puede seguir en
     `app/`: lo que no puede hacer la app es necesitar el repositorio para funcionar.
  4. **Queda abierto (P5):** una vez autónoma, dónde se dan de alta los frascos y
     materiales nuevos, y cómo vuelve al repositorio lo que se crea en la app.
- Fecha: 2026-09-25
- Estado: cerrada · lectura por confirmar
- Destino: decisiones.md

### P3 — ¿Hasta dónde llega IFRA desde el primer día?
- Bloque: 1 · el núcleo
- Abierta por: `decisiones.md` §2.1 (suma por sustancia «para una iteración futura») y `antecedentes/formulacion/entradas-para-decisiones-app.md` (IFRA aplazado, **superado**: la fuente primaria ya existe)
- Opciones presentadas: A) techo por material · B) A + suma por sustancia donde haya datos · C) B + alérgenos declarables
- Recomendación: A ya y B enseguida
- Respuesta: **B, con el diseño preparado para C**
- Razón del autor: *«teniendo la bas de datos de ifra ya lo mejor seria estar diseñando de manera que se ponderen ya los alergenos que convergen entre materiales, al menos por diseño, aunque haya materiales que tengan solapamiento de alergenos no registrados es mejor registrar los que si se sepan porque es el estado esperado del funcionamiento, y en caso que no se tenga la informacion de unos simplemente funcionara como si solo tuviera el techo por cada material. en cualquier caso es mejor la segunda creo yo. por ultimo siempre que haya elementos desconocidos se debe avisar en la formulacion»*
- **Lectura:**
  1. **El modelo lleva constituyentes desde el principio.** Cada material puede declarar
     las sustancias reguladas o alérgenas que contiene, con su porcentaje, su base y su
     fuente.
  2. **El cálculo suma por sustancia** sobre toda la fórmula, desglosada: cumarina del
     frasco más la de la tintura, HAP de cade más estoraque, linalol de todas partes.
  3. **Se carga lo que se sabe.** Si un material no tiene constituyentes declarados,
     cuenta solo su techo propio. Ese es el funcionamiento esperado, no un error.
  4. **Lo desconocido siempre se avisa en la formulación.** Un material sin datos, una
     carga `SIN DATO` o un constituyente sin cuantificar salen marcados; nunca en verde.
     Es la regla 1.2 de `decisiones.md`.
  5. **Los alérgenos van en el diseño; los umbrales, pendientes.** Los umbrales de
     declaración en etiqueta de la UE son el vacío 12 de `fuentes/vacios.md`. No se
     inventan.
- Fecha: 2026-09-25
- Estado: cerrada · lectura por confirmar
- Destino: decisiones.md

---

## Estado

| Ronda | Cerradas | Abiertas | Siguiente |
|---|---|---|---|
| R1 · El núcleo | 3 (lectura por confirmar) | 0 | — |
| R2 · Registro, materiales y frascos | 0 | 3 | P4 |
| R3 · Cálculos concretos | 0 | — | — |
| R4 · Dónde se usa | 0 | — | — |
| R5 · Lo aplazado | 0 | — | — |
