# IFRA a mano: tres casos para el paso 8.4

*2026-10-15. El «hecho cuando» del 8.4: las dos lecturas del panel de IFRA del banco, sobre la capa
de IFRA de la v3, coinciden con el cálculo a mano en tres casos. Lo comprueba
`v3/db-tests/ifra-by-hand.test.ts`: vierte cada fórmula como la escribe el banco, la lee de la copia
y dibuja el panel con su informe.*

## Las cifras de IFRA que se usan

Categoría 4 (perfume fino), la que lee la app (`v3/src/db/to-ifra.ts`, `CATEGORY`). Los techos salen
de `v3/datos/ifra_limits.csv` (columna `max_value`, en fracción), por el estándar de cada CAS en
`v3/datos/ifra_substances.csv`:

| Material común | CAS | Estándar | Enmienda | Techo cat. 4 |
|---|---|---|---|---|
| Cumarina natural | 91-64-5 | IFRA_STD_023 · Coumarin | 49 | 0,015 = 1,5 % |
| Iso E Super | 54464-57-2 | IFRA_STD_068 · OTNE | 49 | 0,2 = 20 % |
| Eugenol 98% | 97-53-0 | IFRA_STD_035 · Eugenol | 51 | 0,025 = 2,5 % |

Etanol y DPG no tienen estándar: no suman sustancias, sí masa. Ninguno de los cinco tiene
constituyentes en `material_components.csv`, así que nada queda «sin comprobar».

## Las dos lecturas

- **Lectura 1, «¿Pasa los límites en el lote final?»:** cada sustancia, su masa entre el producto,
  frente a su techo. Llegar justo al techo pasa; superarlo, no. El producto depende de la base
  (P58): sin lote final, **el frasco tal cual**; con lote final, **ahora** (el lote final); con lote
  final y de trabajo, además **completado** (lo que hay en el frasco × lote final / lote de trabajo).
- **Lectura 2, «¿Hasta qué % en un perfume final?»:** para cada sustancia, techo × masa total de la
  fórmula / masa de la sustancia; la menor de todas, y nunca más del 100 %.

## Caso 1 · El frasco tal cual

Cumarina 30 mg pura, Iso E Super 200 mg puro, etanol 770 mg. Sin lote final: el producto es el
frasco, 1 000 mg.

- Cumarina: 30 / 1 000 = **3 %** > 1,5 % → se pasa. OTNE: 200 / 1 000 = 20 %, justo su techo → pasa.
- **Lectura 1: No.**
- Lectura 2: cumarina 0,015 × 1 000 / 30 = 0,5; OTNE 0,2 × 1 000 / 200 = 1. **Lectura 2: 50,00 %.**

## Caso 2 · Lote final de 2 g, y eugenol de dos vertidos, uno diluido

Eugenol 10 mg puro; eugenol 200 mg al 10 % en DPG (20 mg puros y 180 mg de DPG); Iso E Super 100 mg.
En el frasco, 310 mg. Lote final, 2 g; sin lote de trabajo: la base es «ahora», 2 000 mg.

- Eugenol, sumado de donde venga (§5.3): 10 + 20 = 30 mg; 30 / 2 000 = **1,5 %** ≤ 2,5 %. OTNE:
  100 / 2 000 = 5 % ≤ 20 %. **Lectura 1: Sí.**
- Lectura 2: eugenol 0,025 × 310 / 30 = 7,75 / 30 = 31/120 = 0,2583…; OTNE 0,2 × 310 / 100 = 0,62.
  **Lectura 2: 25,83 %.**

## Caso 3 · La mitad de un lote de trabajo de 1 g, para 10 g

Cumarina 100 mg, Iso E Super 90 mg, etanol 310 mg: 500 mg en el frasco. Lote de trabajo 1 g, lote
final 10 g.

- **Ahora** (sobre 10 000 mg): cumarina 100 / 10 000 = 1 % ≤ 1,5 %; OTNE 0,9 % → **Sí**.
- **Completado** (500 × 10 / 1 = 5 000 mg): cumarina 100 / 5 000 = **2 %** > 1,5 % → **No**. Es la base
  que el panel enseña por defecto, la más completa: **Lectura 1: No** (y «Sí» con el interruptor en
  «ahora»).
- Lectura 2: cumarina 0,015 × 500 / 100 = 0,075; OTNE 0,2 × 500 / 90 > 1. **Lectura 2: 7,50 %.**

## Resultado

Los tres casos coinciden, en las cifras exactas del informe y en lo que dibuja el panel («No» /
«50,00 %», «Sí» / «25,83 %», «No» / «7,50 %»).
