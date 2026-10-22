# Tanda 21 · cómo resulta cargada

Las tandas 20 y 21 cargadas juntas con `npm run datos:cargar-comun -- <carpeta 20> <carpeta 21>` en
un Postgres 16 de prueba con todas las migraciones de `v3/supabase/migrations` (no en tu Supabase
local ni en la nube: **ninguna de las dos está aprobada**). Una segunda carga no cambia ninguna fila.
Las cifras son recuentos de esa base, del 2026-10-22.

## Las fichas

**1901 fichas:** 1824 genéricas (una por material) y 77 de producto (las de un producto con datos
propios). 4047 líneas de composición resuelta.

| Tipo | Materiales | Sin composición |
|---|---|---|
| Puro | 1126 | 0 (cada uno es su sustancia al 100 %) |
| Natural | 388 | 30 |
| Mezcla | 310 | 219 |

- **De dónde sale la composición:** identidad (un puro es su sustancia) en 1174 fichas; literatura
  (PerfuMate) en 460; el anexo de IFRA en 17, naturales sin composición en PerfuMate.
- **Las mezclas casi no tienen composición:** PerfuMate solo la da para 91 de 310. Es lo que más
  falta, y lo que pedirá documentos del fabricante (o tu GC-MS en tu frasco).
- **Lo que llevan:** nota 1878 de 1901, dilución de trabajo 1806, duración en tira 702.
- **IFRA:** 618 fichas tienen al menos una sustancia de un estándar de IFRA en su composición. El
  motor aún no lee estas tablas: eso es el siguiente paso de la app, no de la carga.

## La familia principal (A10, a prueba)

La general que más suma de las familias con ★ de cada ficha:

| Familia | Fichas | | Familia | Fichas |
|---|---|---|---|---|
| Floral | 364 | | Animal | 112 |
| Frutal | 347 | | Ozónico | 91 |
| Verde | 306 | | *Sin general:* Resinoso | 71 |
| Amaderado | 233 | | Dulce, Disolvente | 26 cada una |
| Especiado | 132 | | Tropical, Ámbar gris, Otra | 13, 11, 7 |
| Cítrico | 115 | | Sin ninguna familia | 47 |

154 fichas tienen como principal una familia detallada que tu paleta no pone bajo ninguna de tus
nueve: decidir dónde van (sobre todo Resinoso) es lo primero que enseña esta prueba.

## Dos ejemplos

- **Bergamot Essential Oil** (`natural:citrus bergamia::essential_oil::`): familia Cítrico; su composición es la de PerfuMate (literatura),
  incompleta: solo cuatro sustancias (limoneno 0,38, linalol 0,11, citral y geraniol), sin el
  acetato de linalilo.
- **6790-58-5 (el Ambroxan de siempre):** un solo material puro con seis productos: Ambrofix
  (Givaudan), Ambrox Super (dsm-firmenich), Ambroxan (Kao), Orcanox (Mane), Ambermor y
  Ambermor-Ex (IFF). El material se llama «Ambermor», el nombre de la primera entrada de
  PerfuMate: falta el nombre químico de PubChem (A9).

## Lo que enseña

- El esquema aguanta los datos reales: ni una fila rechazada por las comprobaciones (una ★ por
  material, producto y atributo; la clave de identidad; las columnas de cada tipo; los términos de
  la lista de su atributo).
- Lo flojo está en el contenido, no en la forma: nombres en inglés y comerciales, 387 términos sin
  traducir, calidades distintas en una misma identidad (Ylang Extra/I/II/III), mezclas sin
  composición y 292 entradas sin clasificar. Todo está listado en `revision/`.
