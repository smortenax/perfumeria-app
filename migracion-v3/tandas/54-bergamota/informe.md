# Tanda 54 · La bergamota sin bergaptenos, con una composición publicada (V3-103)

*Generada por `migracion-v3/tanda-54-bergamota.ts` sobre `v3/datos/`. Común: se aprueba con `aprobar.ts 54-bergamota` y entra en la nube al fusionar en `main`. Va con el cambio de código de V3-103.*

V3-103 (the user, 2026-11-09: «da números muy fuera de lo esperado de la orden de 5000% por encima de lo normal con una gota de Ae sobre 2g de mezcla»).

## Por qué salía tan alto

La bergamota sin bergaptenos es miembro del estándar 089 de IFRA, cuyo límite es de 5-MOP (bergapteno): 0,0015 % en la categoría 4. Como no tenía ninguna cifra de 5-MOP, la app lo contaba en el peor caso, como si **todo el aceite** fuera 5-MOP (V3-27). Una gota se leía como una gota de bergapteno puro.

## Lo que entra

Lo que certifica [Opella](https://opella.se/dokument/IFRA%20-%20Bergamot%20(FCF),%20essential%20oil,%20organic-%20E1004.pdf) para su bergamota sin bergaptenos (IFRA 49, producto E1004, con los mismos dos CAS que el material común). Es **literatura**, de otro proveedor y no de tu frasco: cuenta su máximo y nunca da «dentro». Si un día tienes el certificado de tu frasco, ese manda (V3-39).

| Constituyente | CAS | El documento («% level in product») |
|---|---|---|
| Limonene | 5989-27-5 | ≤47.0 % |
| Linalool | 78-70-6 | ≤15.0 % |
| Citral | 5392-40-5 | ≤0.7 % |
| Citronellol | 106-22-9 | ≤0.03 % |
| Citronellal | 106-23-0 | ≤0.01 % |
| Geraniol | 106-24-1 | ≤0.01 % |
| Bergaptene (5-MOP) | 484-20-8 | ≤0.0005 % |

**Cuánto cambia** con una gota (unos 30 mg) en 2 g de mezcla, un 1,5 % de bergamota:
- **5-MOP:** antes, hasta un 1,5 % de la mezcla; ahora, hasta un 0,0000075 %.
- **Citral:** hasta un 0,0105 % de la mezcla.

## El cambio de código (V3-103)

El 5-MOP «de cantidad desconocida» de V3-27 era de autoridad IFRA, así que habría mandado sobre cualquier cifra de literatura. Ahora espera una cifra: cualquier cifra del constituyente, de la autoridad que sea, ocupa su lugar.
