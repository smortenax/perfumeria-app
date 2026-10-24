# Tanda 22 · Diez familias: Gourmand, la décima

*Generada por `migracion-v3/tanda-22-diez-familias.ts` sobre lo común como está en `v3/datos/` (commit `0e81550`). La decisión es V3-76 (el usuario, 2026-10-24: «Families: Ten families (Gourmand)»). Escribe `v3/datos/family_palette.csv` y `v3/datos/materials.csv`.*

## La paleta

| Familia | Clave | Color | Claro | Oscuro | Qué entra |
|---|---|---|---|---|---|
| Cítrico | citrus | amarillo | `#c3b503` | `#a19500` | cítricos |
| Verde | green | verde menta | `#43cd99` | `#4aa781` | verde, herbal, aromático, alcanforado, mentolado |
| Ozónico | ozonic | azul cielo | `#2db9f3` | `#237da9` | ozónico, marino, acuoso, aldehídico, limpio, metálico |
| Floral | floral | rosa malva | `#c475aa` | `#975482` | floral, miel, atalcado |
| Frutal | fruity | violeta | `#896ffb` | `#915fd8` | **frutal** (antes: frutal, gourmand) |
| Especiado | spicy | naranja | `#d86f0d` | `#bb704e` | **especiado, anisado** (antes: especiado, anisado, balsámico, ámbar) |
| Amaderado | woody | marrón | `#923002` | `#944e00` | maderas, terroso, ahumado, tabaco |
| Animal | animal | rojo | `#d22c50` | `#ca224a` | **animal, almizcle, cuero, ámbar** (antes: animal, almizcle, cuero) |
| Transformado | transformed | gris | `#8a8a8a` | `#8a8a8a` | tostados (pirazinas), ácidos, azufrados: olores de calor, fermentación o corte |
| Gourmand | gourmand | caramelo | `#d4a373` | `#b8875a` | **vainilla, caramelo, balsámico, cremoso, azucarado** (nueva) |

El color de Gourmand es el de la maqueta (`#d4a373` en claro, `#b8875a` en oscuro); el nombre «caramelo», propuesta de la sesión.

## Los materiales que cambian de familia (14)

Solo los comunes de Frutal y Especiado cuyo matiz (`family_detail`, tus palabras) nombra lo que esas dos familias dejan. Tu versión de cada uno hereda la familia nueva.

| Material | Tu matiz | Ahora | Pasa a | Por qué |
|---|---|---|---|---|
| 2-Acetilpirazina | tostada (pan, palomitas) | Frutal | **Transformado** | tostado: lo cubre Transformado (tostados, pirazinas) |
| 2-Hidroxibenzaldehído | tostada / almendra | Especiado | **Transformado** | tostado: lo cubre Transformado (tostados, pirazinas) |
| Aldehído C18 (gamma-nonalactona) | lactona (coco, lácteo) | Frutal | **Gourmand** | gourmand o cremoso: Frutal lo deja y pasa a Gourmand |
| Ámbar gris, tintura comercial (purificado) | animálica / ámbar (por confirmar) | Especiado | **Animal** | ámbar: Especiado lo deja y pasa a Animal |
| Ambermor | ámbar (ambróxido) | Especiado | **Animal** | ámbar: Especiado lo deja y pasa a Animal |
| Ambrinol S | ámbar gris / animálica | Especiado | **Animal** | ámbar: Especiado lo deja y pasa a Animal |
| Bálsamo de Tolú, resinoide | balsámica | Especiado | **Gourmand** | balsámico: Especiado lo deja y pasa a Gourmand |
| Cinamato de metilo | balsámica / frutal | Especiado | **Gourmand** | balsámico: Especiado lo deja y pasa a Gourmand |
| Ethyl Maltol | dulce / gourmand | Frutal | **Gourmand** | gourmand o cremoso: Frutal lo deja y pasa a Gourmand |
| Láudano de jara | ámbar / resina | Especiado | **Animal** | ámbar: Especiado lo deja y pasa a Animal |
| Olíbano (Boswellia sacra), aceite esencial | resinosa / incienso | Especiado | **Amaderado** | incienso: Especiado deja lo resinoso; la maqueta lleva el incienso a Amaderado |
| Resinoide de benjuí | balsámica | Especiado | **Gourmand** | balsámico: Especiado lo deja y pasa a Gourmand |
| Resinoide de estírax (estoraque) | balsámica | Especiado | **Gourmand** | balsámico: Especiado lo deja y pasa a Gourmand |
| Vainillina | ámbar / gourmand | Frutal | **Gourmand** | gourmand o cremoso: Frutal lo deja y pasa a Gourmand |

## Para que decidas tú (no cambian)

Son de otras familias y su matiz dice gourmand o cumarínico; V3-76 no los mueve.

| Material | Tu matiz | Familia |
|---|---|---|
| Cacao, absoluto | gourmand (chocolate) | Transformado |
| Haba tonka (semillas), tintura comercial | dulce / cumarínica (por confirmar) | Floral |
| Miel, esencia aromática | gourmand (miel) | Transformado |
| Vinyl Sulfurol | gourmand (cacao, fruto seco) | Transformado |
