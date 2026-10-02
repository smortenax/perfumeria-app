# Comparación de la fase 2: la misma pesada con la v1 y con la v2

Fecha: 2026-10-03. La reproducen las pruebas de
[`src/v2/comparacion.test.ts`](../../src/v2/comparacion.test.ts): cada diferencia de este
documento es una aserción de esa prueba. Las fórmulas están en
[`src/v2/fixtures/comparacion.ts`](../../src/v2/fixtures/comparacion.ts). Todo es categoría 4 y IFRA 51.

## Las dos fórmulas

**«Siete»**: los siete materiales de la fase 2 en un concentrado de 1,24 g, pesados como se
compran, y llevados a un perfume al 20 % (lote de trabajo 1,24 g, lote final 6,2 g; base
«completado»).

| Material | Pesado | Materia pura | v1 | v2 |
|---|---|---|---|---|
| Geraniol 98% (Maese Lab) | 0,200 g | 100 % | `fig:1906` | `P00001` |
| Linalol (Olfatorium) | 0,400 g | 50 % en DPG | `fig:2220` | `P00002` |
| Lavanda (Olfatorium) | 0,300 g | 100 % | `fig:2179` | `P00003` |
| Absoluto de Castoreum 20% (Maese Lab) | 0,100 g | 20 % en alcohol | `fig:1343` | `P00004` |
| Aldehyde C11 MOA (Symrise) | 0,050 g | 10 % en DPG | `prod:symrise-656012` | `P00005` |
| Oakmoss Absolute 50% (IFF) | 0,040 g | 50 % en IPM | `prod:iff-00133097` | `P00006` |
| Castoreum Synthetic (Firmenich) | 0,150 g | 100 % | `prod:firmenich-184004` | `P00007` |

Las cantidades son de prueba, no de una fórmula tuya: están elegidas para que cada material pese
algo en el resultado.

**F-001-v1, Lejía**: la del cuaderno, al miligramo. Para la v1, cada material va a la fila del
glosario de su CAS en el cuaderno (`materias-primas/`) y, si es un natural, de su forma. La haba
tonka y el ámbar gris van por nombre, porque su CAS no está en el glosario. La lavanda va a
`fig:2179`, donde apunta hoy. **La correspondencia la he elegido yo**: está en la fixture, y los
naturales con varias filas de su forma toman la primera.

## Resultado

| | Siete, v1 | Siete, v2 | F-001, v1 | F-001, v2 |
|---|---|---|---|---|
| ¿Pasa en el lote final? | No | No | No | No se sabe |
| Lo que se pasa | Musgo de roble 0,323 % (≤ 0,1), 7-metoxicumarina 0,387 % (≤ 0,01), metileugenol 0,016 % (≤ 0,011) | Musgo de roble 0,323 % (≤ 0,1) | 7-metoxicumarina 0,016 % (≤ 0,01) | — |
| ¿Hasta qué % en un perfume? | 0,517 % (lo limita la 7-metoxicumarina) | 6,200 % (lo limita el musgo de roble) | — | — |
| Sin comprobar | — | — | — | 23 materiales |
| Pendiente | castóreo; atranol y cloroatranol del musgo | castóreo | pachulí, ámbar gris, tabaco, estírax | — |

## Las diferencias, una a una

### 1. Lavanda: la peor de tres formas en la v1, el aceite en la v2

La v1 apunta a `fig:2179`, «Lavender» sin forma, y cuenta la peor de las tres variantes del
anexo: la del absoluto (cumarina 5,98 %, 7-metoxicumarina 3,8 %) y la del concreto
(7-metoxicumarina 8 %). La v2 da de alta el **aceite esencial**, como decidiste el 2026-10-03,
con lo que el anexo da para él: octenil acetato 1,04 %, geraniol 0,48 % y 2-hexenal 0,01 %.

- En «Siete», la 7-metoxicumarina (0,387 %, con un techo de 0,01 %) y la cumarina (0,289 %)
  desaparecen. El octenil acetato es igual en las dos (0,050 %).
- En la F-001 es **lo único que la hace fallar en la v1**: 17 mg de lavanda con el 8 % del
  concreto dan 0,016 % de 7-metoxicumarina. Con el aceite, ese «No» desaparece.

**La correcta es la v2**, siempre que tu lavanda sea aceite. La v1 no se equivocaba: no sabía qué
forma era y contaba la peor.

### 2. Linalol y geraniol: la v1 les cuelga las declaraciones de otros productos

La v1 añade a la molécula general lo que declaró un proveedor cualquiera:

- **Linalol (`fig:2220`)**: citral, geraniol, β-damascona, metileugenol 0,4972 %, safrol y
  limoneno, todos de un certificado de PerfumersWorld **de aceite esencial de hoja de champaca**
  (C-004, 7LN08199). Es un error de la v1: ese certificado no es de un linalol. De ahí salen el
  metileugenol que se pasa en «Siete» (0,016 %, con un techo de 0,011 %), la rosa cetona y el
  safrol.
- **Geraniol (`fig:1906`)**: citral 0,09 %, citronelol 0,5 % y linalol, de una lista de alérgenos
  de Perfumiarz (H07112) de otro producto, no del Geraniol 98% de Maese Lab.

La v2 pone los datos del proveedor en su producto (D3). Tu linalol y tu geraniol no tienen
documentos, así que cuentan como su sustancia al 100 %, sin impurezas. Por eso el geraniol pasa
de 3,260 % a 3,249 %: falta lo que aportaba el linalol.

**La v2 es la correcta en el método.** Pero deja una pregunta abierta (abajo, la **A**): hoy, una
molécula sin documentos no deja nada pendiente, y un linalol natural puede traer impurezas
reguladas.

La v1 está congelada y no la he tocado. El error del linalol desaparece cuando la v2 la sustituya.

### 3. Hasta qué % en un perfume: 0,517 % frente a 6,200 %

Es consecuencia de la diferencia 1. En la v1 limita la 7-metoxicumarina de la lavanda, y en la
v2, el musgo de roble (0,1 % de techo y 0,323 % en el perfume al 20 %: el concentrado cabe hasta
el 6,2 %).

### 4. El tope de Symrise: por CAS en la v1, de su producto en la v2 (D4)

Los dos dan lo mismo aquí: el 2-metildecanal de Symrise es el 0,081 % del perfume, bajo su tope
del 2,5 %, y ninguno de los dos decide las lecturas de IFRA.

La diferencia está en lo que **no** sale en esta fórmula. La v1 aplica el tope a todo material con
el CAS 19009-56-4, como el aldehído C11 MOA de otra casa o el genérico. La v2 lo aplica solo al
producto de Symrise (`tope:P00005`): el tope es suyo, por la composición de su producto.

### 5. Lo que queda abierto: los atranoles del musgo

La v1 deja pendientes el atranol y el cloroatranol del musgo de roble: su certificado los declara,
pero no tienen estándar propio. La v2 no los deja pendientes, porque IFRA los trata dentro del
STD 067: su especificación pide menos de 100 ppm de cada uno en el extracto de musgo. Por eso la
v2 enseña la condición **«especificación (STD 067)»**, y el certificado de IFF dice que las
especificaciones se cumplen.

Ojo: la cifra del certificado («<0,1 %», es decir, menos de 1000 ppm) no prueba por sí sola los
100 ppm. La v2 guarda los dos atranoles como cifra máxima del producto, pero no los suma contra
ningún techo.

Las dos fórmulas quedan parciales por el absoluto de castóreo, que no tiene datos de
constituyentes en ninguna de las dos versiones: es desconocido, no libre.

Además, la v1 enseña como condiciones unas líneas informativas: «variante sin concretar», «el
certificado declara N sustancias» e «incluye constituyentes declarados por proveedores». La v2
enseña solo las condiciones de IFRA, la del linalol (STD 187) y la del musgo (STD 067).

### 6. Lo que no cambia

- **Castoreum Synthetic**: las mismas 20 sustancias de la sección 2.2 de su certificado, con las
  mismas cifras. Lo he cotejado con el PDF. La categoría 4 de Firmenich, «No Restriction», no es
  un tope en ninguna de las dos.
- **Musgo de roble**: el 0,323 % en las dos, y el mismo «se pasa». En la v1 lo limita su CAS. En
  la v2, IFRA lo limita como material: es miembro del STD 067. Su certificado es del absoluto puro
  («Oakmoss extracts 100 %»), así que el 50 % en IPM se elige al pesar y no toca sus cifras.
- **Absoluto de castóreo**: pendiente en las dos. El texto cambia un poco: la v2 ya no dice «en el
  anexo de IFRA».

### 7. F-001 en la v2: no se sabe, porque solo está la lavanda

De los 24 materiales de la F-001, la v2 solo tiene la lavanda. Los otros 23 salen «sin comprobar»,
y la lectura 1 es «no se sabe»: nunca se toman por libres. No es una diferencia de cálculo, sino de
lo que está dado de alta. Lo que la v2 sí sabe de la lavanda coincide con la v1 en el octenil
acetato, el geraniol y el 2-hexenal.

## Después de la revisión: la D7 (2026-10-03)

Con la D7, el Geraniol 98% de Maese Lab, que es un aislado natural («Nat») sin documentos, deja
pendientes sus «impurezas sin declarar». En «Siete», la v2 queda con dos pendientes, el geraniol y
el castóreo, y la prueba 5 lo recoge. El resto de las cifras no cambia. El linalol, de origen
desconocido, sigue como puro por convención, y su ficha lo dice.

## Lo que esta comparación no prueba

- **Los placeholders (D2)**: ninguno de los siete tiene cifras de literatura o de consenso. Lo
  prueban conjuntos pequeños en `src/v2/to-ifra.test.ts`, y el cambio del motor, en
  `src/core/ifra.test.ts`.
- **Los lotes y los alérgenos de la UE**: el modelo los admite, pero no hay datos.

## Preguntas para ti

- **A.** ¿Una molécula sin documentos de su producto (tu linalol, tu geraniol) debe dejar un
  pendiente del tipo «impurezas sin declarar», o cuenta como pura, que es lo que dice hoy
  `datos/v2/LEEME.md`?
- **B.** ¿Damos de alta en la v2 los 23 materiales que le faltan a la F-001? Las moléculas pueden
  ir solas desde la v1. Los naturales (cedro, pachulí, tonka, ámbar gris, tabaco, estírax y benjuí)
  necesitan que me digas su forma, como la lavanda.
