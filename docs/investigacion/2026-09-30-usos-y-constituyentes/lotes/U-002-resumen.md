# Lote U-002: usos de TGSC y PerfumersWorld por CAS, con script

Lo trae [`scripts/traer_usos.py`](../../../../scripts/traer_usos.py); filas en `U-002.csv` (mismas
columnas que U-001) y el rastro de cada búsqueda en `U-002-busqueda.csv`. **No lo ha auditado
Opus**: `auditoria` sale por regla (`aceptada` solo si el CAS sale en la página y la cifra se leyó
entera).

## Cómo se buscó (y por qué así)

- **TGSC.** Su `robots.txt` veta `/search.php`, así que **no se usa el buscador**. Se leen sus
  **12 índices estáticos de CAS** (`/allproc-1.html` a `-12.html`, 28.407 CAS) que enlazan cada CAS
  con sus páginas. Solo se piden las fichas de los CAS del glosario.
- **PerfumersWorld.** `product-search.php` devuelve el catálogo entero (1.216 productos, el filtro
  es del navegador) con `data-cas-no` en cada uno: una petición da el mapa CAS a producto
  (529 CAS). Su `robots.txt` no veta nada de esto.
- Una petición cada 3 s por sitio (los dos a la vez), `User-Agent` identificado, caché en
  `datos/glosario/.cache/usos/` (fuera de Git), solo HTML. Ni un 403 ni un 429 en toda la ejecución.
- **Peticiones:** unas 4.450 a TGSC y unas 670 a PerfumersWorld.

## Resultados

Materiales buscados: **3.561** (fase 1: 869, los de las tiendas que no estaban en U-001; fase 2:
2.692 moléculas del glosario con CAS). Filas: 4.549 (1.800 `aceptada`, 2.737 `forma ambigua`,
12 `cifra incompleta`).

Fuentes con cifra aceptada por material:

| | 0 fuentes | 1 fuente | 2 fuentes | total |
|---|---|---|---|---|
| **Fase 1 (tiendas)** | 546 | 241 | 82 | 869 |
| de ellos, moléculas | 73 | 222 | 79 | 374 |
| de ellos, naturales | 473 | 19 | 3 | 495 |
| **Fase 2 (moléculas)** | 1.396 | 1.197 | 99 | 2.692 |

Estado de la búsqueda, fase 1: TGSC con cifra 283, sin cifra 183, ambigua 392, sin página 11;
PerfumersWorld con cifra 123, sin página 386, ambigua 359, sin cifra 1.

**Forma ambigua: 513 materiales** (467 en fase 1, 46 en fase 2). Casi todos son naturales: su CAS
tiene varias páginas en la fuente, o lo comparten varios materiales del glosario (las formas de una
planta, P54). Esos no cuentan.

Franja de la ficha tras fusionar con U-001 (regenerado el glosario): **303 materiales con franja**
(49 `consenso`, 254 `recomendacion`) y **1.672 con techo**. Los 250 nuevos son de una sola fuente
para la franja (PerfumersWorld, mínimo y medio); TGSC solo da techo y **un techo sin franja no
sale en la ficha** (el catálogo solo crea `usage` si hay franja).

**Tiempo:** unas 3 h 45 min de peticiones (20 fichas por minuto en TGSC). La ejecución se cortó
con TGSC en 3.800/4.428 (el equipo se suspendió) y se reanudó desde la caché, 31 min más.

## Comprobación propia: 15 filas aceptadas al azar (semilla 20261001)

Releídas con una petición nueva a la página y comprobado que la cita sale tal cual en el texto y
que el CAS sale en la página: **15 de 15 bien.** Fueron 14 de TGSC y 1 de PerfumersWorld, por
la proporción real de filas.

| Material | CAS | Fuente | Cifra |
|---|---|---|---|
| fig:206 | 4747-07-3 | TGSC | techo 1 % |
| fig:535 | 111-13-7 | TGSC | techo 4 % |
| fig:670 | 10599-70-9 | TGSC | techo 0,1 % |
| tl:116-53-0 | 116-53-0 | TGSC | techo 0,02 % |
| fig:1470 | 7492-66-2 | PerfumersWorld | 0,04 / 0,4 / 3,5 % |
| fig:1728 | 67028-40-4 | TGSC | techo 1 % |
| fig:2339 | 93-58-3 | TGSC | techo 4 % |
| fig:1928 | 2565-82-4 | TGSC | techo 5 % |
| fig:788 | 76788-46-0 | TGSC | techo 0,05 % |
| fig:2794 | 10486-14-3 | TGSC | techo 5 % |
| fig:3033 | 64001-15-6 | TGSC | techo 20 % |
| fig:1788 | 77-83-8 | TGSC | techo 15 % |
| fig:1778 | 106-30-9 | TGSC | techo 10 % |
| fig:2352 | 8050-15-5 | TGSC | techo 20 % |
| fig:3029 | 122760-84-3 | TGSC | techo 20 % |

La comprobación confirma la **lectura** de la página, no que la página sea del material correcto
más allá del CAS: eso lo habría de auditar Opus.

## Problemas y límites

- **Los naturales casi no salen:** 473 de 495 naturales de las tiendas quedan sin fuente. Es
  deliberado (su CAS mezcla formas) y se puede aflojar si se quiere, pero habría que decidir cómo.
- **TGSC solo da techo** y nunca una franja; sin PerfumersWorld un material no tiene franja.
- **12 filas de PerfumersWorld con `cifra incompleta`:** algún valor a 0,000 % o fuera de orden.
  Un cero de la fuente no se toma como cifra (§1.2); no cuentan.
- Una molécula con varias páginas del mismo CAS solo se acepta si todas dan la misma cifra.
- Los materiales de fase 2 (moléculas que no venden las tiendas) tienen su techo en el CSV, pero no
  llegan a la ficha si no tienen franja.
- Hay CAS compartidos por varios materiales del glosario (211 CAS): cada uno recibe la misma
  fila; la nota lo dice.
