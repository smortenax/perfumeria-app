# Fase 5.1 · El IFRA de la v3 frente al de la v2, material a material

*Generado por `migracion-v3/fase-5/equivalencia.test.ts`: no se edita a mano. Lee la v2 de `datos/v2/` (commit `d4c1e55`) y la v3 de `v3/datos/` y de tu tanda 8 (commit `c74fbd0`), desde los CSV y sin base de datos, con la capa de IFRA de 263 estándares y 1030 filas del anexo. Compara el `IfraMaterial` del motor de cada material tuyo (el común y tu versión) con el de su pareja en la v2 (`migracion-v3/respuestas/laboratorio.csv`). El detalle, diferencia a diferencia, está en `diferencias.csv`.*

## Resultado

- **111 materiales tuyos:** 108 con pareja en la v2 (86 productos y 22 materiales) y 3 nuevos, sin pareja.
- **Tu versión** frente a su pareja: **95 iguales**, 13 distintas por motivos esperados y **0 con diferencias sin explicar**.
- **Lo común** frente a su pareja: 77 iguales, 31 distintas por motivos esperados y 0 con diferencias sin explicar.
- «Igual» es el mismo estado, las mismas sustancias con techo con la misma cifra exacta (o la misma cota), y las mismas condiciones, supuestas y pendientes. «Esperada» es que los datos prueban el motivo: quitando de la v2 lo que la v3 no trae, o por lo que es el material. Si no, «sin explicar».
- **V3-23 y V3-28:** de las 16 parejas con filas del anexo en la v2, 16 las tomaban de su propia entrada y 0 del máximo de las entradas de su CAS: ninguno de tus materiales cambia por V3-23 ni por V3-28.
- Las igualdades no son vacías: en los 95 iguales de tu versión coinciden exactamente 128 líneas de sustancia con techo, una por material y estándar (12 de ellas, topes del fabricante), 2 condiciones y 11 avisos pendientes.
- **Certificados de tu producto** (V3-39; sus cifras pasan tal cual, como el producto se compra, D12): 9 materiales llevan en tu versión la composición de su certificado, 13 un tope del fabricante y 2 una afirmación de especificación; de los 19 que llevan algo de eso, 18 dan en tu versión lo mismo que en la v2, y 19 difieren en lo común por no llevarlo.
- **Ficha** (el estado de IFRA que enseña, V3-25): coincide en 88 de 108 en tu versión y en 92 en lo común; el resto, en `diferencias.csv` (filas «ficha»). Sin explicar: 0 en tu versión y 0 en lo común.

## Motivos

| Motivo | Decisión | Materiales (tu versión) | Materiales (común) | Diferencias (tu versión / común) |
|---|---|---:|---:|---:|
| El certificado, el tope o la afirmación de tu producto van a tu versión, no al común | V3-39 | 0 | 19 | 0 / 83 |
| Cifras de documentos de otro proveedor (D9 de la v2): la v3 solo trae los certificados de tu producto y el anexo de IFRA | V3-34, V3-39 | 5 | 5 | 17 / 17 |
| El laboratorio tiene el material por otro tipo que la v2 (molécula, natural, composición) | V3-12, V3-34 | 2 | 2 | 2 / 2 |
| Aislado natural sin documentos: tu versión lleva «Sin identificar» y queda pendiente, como la v2 por sus impurezas; el común es la molécula | V3-29, V3-33 | 4 | 3 | 7 / 3 |
| La capa de IFRA lee por CAS: la v2 lo enlazaba por el grupo de la v2 o solo daba el anexo a los naturales del glosario | V3-35 | 1 | 1 | 1 / 1 |
| La variante prohibida se clasifica por especie y proceso | V3-31 | 1 | 1 | 1 / 1 |
| Cifras del anexo prestadas de otras formas: literatura, nunca «dentro» | V3-28 | 1 | 1 | 2 / 2 |
| Un límite expresado como constituyente (5-MOP) va como componente | V3-27 | 1 | 1 | 2 / 2 |
| La ficha lee todas las regulaciones de la ficha y su condición: el tope del fabricante cuenta como techo y el cade rectificado ya no sale «prohibido» | V3-25, V3-39 | 12 | 0 | 12 / 0 |
| La ficha sale del mismo cálculo: cambia porque cambia lo anterior | las de arriba | 8 | 16 | 8 / 16 |

Las filas «ficha» (V3-25 y la consecuencia de lo anterior) cuentan solo el estado que enseña la ficha, no el `IfraMaterial`.

Motivos que no aparecen en ninguno de tus 111 materiales: V3-23 (propia entrada del anexo); V3-30 (prohibida como tal con techo).

## Sin explicar

Ninguna diferencia queda sin explicar.

## Tu versión: los 13 materiales que difieren de su pareja

| Material | Nombre | Pareja | Qué cambia | Motivo |
|---|---|---|---|---|
| MAT-absoluto-de-tabaco | Absoluto de Tabaco | P00041 | STD 023 Coumarin: ≤ 0,1561 % → —; pendiente «composición parcial» (solo v2); pendiente «sin datos de sus constituyentes» (solo v3) | V3-34, V3-39: cifras de otro proveedor |
| MAT-acetato-de-guayilo-palo-santo-acetilado | Acetato de guayilo (palo santo acetilado) | M01496 | pendiente «sin datos de sus constituyentes» (solo v3) | V3-12, V3-34: tipo del laboratorio |
| MAT-aldehido-alfa-amil-cinamico | Aldehído alfa-amil cinámico | M00010 | STD 004 alpha-Amyl cinnamic alcohol: ≤ 0,5 % → —; STD 007 Benzaldehyde: ≤ 0,05 % → —; STD 008 Benzyl alcohol: ≤ 0,2 % → —; STD 040 alpha-Hexyl cinnamic aldehyde: ≤ 0,5 % → — | V3-34, V3-39: cifras de otro proveedor |
| MAT-bergamota-sin-bergaptenos | Bergamota sin bergaptenos | P00042 | STD 021 Citral: ≤ 0,8698 % → —; pendiente «composición parcial» (solo v2) — STD 089 Citrus oils and other furocoumarins containing essential oils: — → ≤ 100 %; pendiente «límite de un constituyente STD 089» (solo v2) | V3-34, V3-39: cifras de otro proveedor / V3-27: 5-MOP como componente |
| MAT-cumarina-natural | Cumarina natural | P00014 | pendiente «impurezas sin declarar» (solo v2); pendiente «sin datos de sus constituyentes» (solo v3) | V3-29, V3-33: aislado natural, «Sin identificar» en tu versión |
| MAT-eucaliptol | Eucaliptol | P00073 | pendiente «sin datos de sus constituyentes» (solo v3) | V3-29, V3-33: aislado natural, «Sin identificar» en tu versión |
| MAT-eugenol-98 | Eugenol 98% | P00019 | pendiente «impurezas sin declarar» (solo v2); pendiente «sin datos de sus constituyentes» (solo v3) | V3-29, V3-33: aislado natural, «Sin identificar» en tu versión |
| MAT-geraniol-98 | Geraniol 98% | P00001 | pendiente «impurezas sin declarar» (solo v2); pendiente «sin datos de sus constituyentes» (solo v3) | V3-29, V3-33: aislado natural, «Sin identificar» en tu versión |
| MAT-haba-tonka-tintura | Haba tonka (semillas), tintura comercial | P00057 | pendiente «sin datos de sus constituyentes» (solo v2) — STD 023 Coumarin: — → ≤ 56,77 %; STD 029 Dihydrocoumarin: — → ≤ 1,85 % | V3-35: capa de IFRA por CAS / V3-28: anexo prestado, literatura |
| MAT-resinoide-benjui | Resinoide de benjuí | M00050 | STD 008 Benzyl alcohol: ≤ 0,0293 % → —; STD 009 Benzyl benzoate: ≤ 2,1895 % → —; STD 048 Isoeugenol: ≤ 0,1835 % → —; STD 190 Propenylguaethol: ≤ 1,7952 % → —; STD 191 2-Methoxy-4-propylphenol: ≤ 0,1212 % → —; +2 más | V3-34, V3-39: cifras de otro proveedor |
| MAT-resinoide-estyrax-estoraque | Resinoide de estírax (estoraque) | P00051 | nota «una variante está prohibida STD 078» (solo v2) | V3-31: variante por especie y proceso |
| MAT-safraleine | Safraleine | P00023 | STD 008 Benzyl alcohol: ≤ 0,007 % → — | V3-34, V3-39: cifras de otro proveedor |
| MAT-sandalmysore-core | Sandalmysore Core | P00038 | pendiente «sin datos de sus constituyentes» (solo v2) | V3-12, V3-34: tipo del laboratorio |

## Lo común: los 31 materiales que difieren de su pareja

Lo común no trae el certificado, el tope ni las afirmaciones de tu producto (V3-39): por eso difiere más que tu versión. Aquí, cuántas diferencias tiene cada uno y por qué; lo que comparte con tu versión es lo de la tabla anterior.

| Material | Pareja | Diferencias | Motivos |
|---|---|---|---|
| MAT-absoluto-de-tabaco | P00041 | 1 sustancia, 2 pendiente | cifras de otro proveedor (3) |
| MAT-aceite-de-cade-enebro | P00054 | 1 supuesta, 1 pendiente | certificado, tope y afirmaciones, a tu versión (2) |
| MAT-acetato-de-estiralilo | P00064 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-acetato-de-geranilo | P00065 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-acetato-de-guayilo-palo-santo-acetilado | M01496 | 1 pendiente | tipo del laboratorio (1) |
| MAT-acetato-de-terpinilo | P00080 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-aldehido-alfa-amil-cinamico | M00010 | 4 sustancia | cifras de otro proveedor (4) |
| MAT-aldehido-c11-moa | P00005 | 2 sustancia | certificado, tope y afirmaciones, a tu versión (2) |
| MAT-ambrettolide | P00072 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-ambrinol-s | P00068 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-balsamo-de-tolu-resinoide | P00079 | 15 sustancia, 1 pendiente | certificado, tope y afirmaciones, a tu versión (16) |
| MAT-bergamota-sin-bergaptenos | P00042 | 2 sustancia, 2 pendiente | cifras de otro proveedor (2), 5-MOP como componente (2) |
| MAT-black-agar-296985 | P00061 | 16 sustancia, 1 pendiente | certificado, tope y afirmaciones, a tu versión (17) |
| MAT-cassis-base-345-b | P00067 | 6 sustancia, 1 pendiente | certificado, tope y afirmaciones, a tu versión (7) |
| MAT-castoreo-sintetico | P00007 | 20 sustancia, 1 pendiente | certificado, tope y afirmaciones, a tu versión (21) |
| MAT-cedramber | P00066 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-cinamato-de-metilo | P00069 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-cumarina-natural | P00014 | 1 pendiente | aislado natural, «Sin identificar» en tu versión (1) |
| MAT-eucaliptol | P00073 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-eugenol-98 | P00019 | 1 pendiente | aislado natural, «Sin identificar» en tu versión (1) |
| MAT-geosmina | P00075 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-geraniol-98 | P00001 | 1 pendiente | aislado natural, «Sin identificar» en tu versión (1) |
| MAT-haba-tonka-tintura | P00057 | 2 sustancia, 1 pendiente | capa de IFRA por CAS (1), anexo prestado, literatura (2) |
| MAT-habanolide | P00077 | 2 sustancia | certificado, tope y afirmaciones, a tu versión (2) |
| MAT-hidroxicitronelal-cyclosia | P00070 | 1 sustancia | certificado, tope y afirmaciones, a tu versión (1) |
| MAT-musgo-de-roble-absoluto | P00006 | 1 condición, 2 pendiente | certificado, tope y afirmaciones, a tu versión (3) |
| MAT-pimienta-negra-absoluto | P00062 | 2 sustancia, 1 pendiente | certificado, tope y afirmaciones, a tu versión (3) |
| MAT-resinoide-benjui | M00050 | 5 sustancia, 2 pendiente | cifras de otro proveedor (7) |
| MAT-resinoide-estyrax-estoraque | P00051 | 1 condición | variante por especie y proceso (1) |
| MAT-safraleine | P00023 | 1 sustancia | cifras de otro proveedor (1) |
| MAT-sandalmysore-core | P00038 | 1 pendiente | tipo del laboratorio (1) |

## A vigilar

Diferencias con motivo, pero en las que la v3 deja de pedir en tu versión algo que la v2 pedía:

- **V3-34, V3-39** · Cifras de documentos de otro proveedor (D9 de la v2): la v3 solo trae los certificados de tu producto y el anexo de IFRA: 5 materiales (MAT-absoluto-de-tabaco, MAT-aldehido-alfa-amil-cinamico, MAT-bergamota-sin-bergaptenos, MAT-resinoide-benjui, MAT-safraleine).
- **V3-12, V3-34** · El laboratorio tiene el material por otro tipo que la v2 (molécula, natural, composición): 1 material (MAT-sandalmysore-core).
- **V3-29, V3-33** · Aislado natural sin documentos: tu versión lleva «Sin identificar» y queda pendiente, como la v2 por sus impurezas; el común es la molécula: 3 materiales (MAT-cumarina-natural, MAT-eugenol-98, MAT-geraniol-98).
- **V3-35** · La capa de IFRA lee por CAS: la v2 lo enlazaba por el grupo de la v2 o solo daba el anexo a los naturales del glosario: 1 material (MAT-haba-tonka-tintura).
- **V3-31** · La variante prohibida se clasifica por especie y proceso: 1 material (MAT-resinoide-estyrax-estoraque).
- **V3-27** · Un límite expresado como constituyente (5-MOP) va como componente: 1 material (MAT-bergamota-sin-bergaptenos).

La ficha de tu versión dice «con techo» en 11 materiales por el tope del fabricante de tu producto (V3-25, V3-39), no por un estándar de IFRA; la v2 decía otra cosa. Conviene decidir si ese «techo» se enseña distinto.

## Materiales nuevos, sin pareja en la v2 (3)

No hay con qué comparar. Esto es lo que dice la v3 de cada uno, para ver que ninguno sale en verde sin datos.

| Material | Nombre | Tipo | Lo común | Tu versión |
|---|---|---|---|---|
| MAT-dewfruit-tec | Dewfruit TEC | composition | comprobado; sin sustancias con techo; pendiente «sin datos de sus constituyentes» | comprobado; sin sustancias con techo; pendiente «sin datos de sus constituyentes» |
| MAT-miel-esencia-aromatica | Miel, esencia aromática | composition | comprobado; sin sustancias con techo; pendiente «sin datos de sus constituyentes» | comprobado; sin sustancias con techo; pendiente «sin datos de sus constituyentes» |
| MAT-suederal | Suederal | natural | comprobado; sin sustancias con techo; pendiente «sin datos de sus constituyentes» | comprobado; sin sustancias con techo; pendiente «sin datos de sus constituyentes» |

## Cómo repetirlo

Desde la raíz del repositorio (en Git Bash, antes: `export PATH="/c/Program Files/nodejs:$PATH"`):

```
npx vitest run --config migracion-v3/fase-5/vitest.config.ts
```

Reescribe este informe y `diferencias.csv` con los mismos bytes si los datos no cambian. No toca la base de datos, `v3/datos/`, `datos/` ni el laboratorio.
