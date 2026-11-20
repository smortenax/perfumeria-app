# Tanda 61 · Los rezagados y el uso habitual de las altas del 18-nov

*Generada por `migracion-v3/tanda-61-rezagados-y-usos.ts` sobre lo común de `6485db6`, desde `migracion-v3/web/info-61/`. Reescribe `materials.csv`, `material_doses.csv` y `material_descriptors.csv` enteros: solo llena campos vacíos y añade filas; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué:** el usuario, 2026-11-19: «si sigue con la 2 y acepta las dosis de otras referencias» (V3-105).

**Cómo:** lectores Sonnet de uno en uno, por lotes de 10, leyendo cada página con `pagina.py` (la página se guarda y se lee su texto, no un resumen). **`consolidar.py` comprueba que cada frase citada está en la página guardada:** la que no está no entra (lista en `no-usado-61.csv` y en las notas). Familia, horas y fuerza, con las reglas de las tandas 46 y 60 (orden de referencias; si no coinciden, va la primera y el campo queda disputado). El uso, por V3-105: una fila por referencia (como mucho tres), con su base si la frase la dice; un rango da mínimo y máximo, una mediana de Fraterworks da el típico. El uso de un material diluido o de otra tintura no cuenta.

**Resultado:** 3 campos llenos en 27 de 77 materiales; 34 usos habituales en 25 materiales; 0 descriptores; 1 campos disputados; 18 lecturas no usadas.

**Lo que no se buscó** (no aplica): el CAS de las bases (son mezclas) y la casa de las moléculas genéricas compradas en Maese Lab u Olfatorium, que no la nombran (bencilo, linalol, aldehídos…).

## Para mirar antes de aprobar

- **Casi todo lo que faltaba de los rezagados sigue faltando.** Para los de Harrison Joseph (4-propilfenol, Thialdine, Narcisse Oxyacetate…), las tinturas de Maese, la miel, la trufa y las bases de Perfumiarz no hay ninguna página que lo diga: Harrison Joseph solo da CAS y olor, y TGSC, la referencia que más dice, bloquea las lecturas (403). Queda «no lo dice».
- **Acetato de bornilo, hasta 9 % en el concentrado:** es la frase de recomendación de uso de TGSC («usage levels up to: 9.0000 % in the fragrance concentrate»), copiada por Perflavory; el lector creyó que era un tope de IFRA. Es la frase que la tanda 46 ya aceptaba como uso.
- **Rose Crystals:** 400 h (Fraterworks) frente a 300 h (PerfumersWorld): va la primera, disputado. Fraterworks nombra a VENTOS como proveedor, no como fabricante: la casa no se llena.
- **Cumin Nitrile, casa Synarome:** de un distribuidor indio («Make: Synarome»); Perflavory lo lista también con Givaudan como proveedor.
- **No entran:** los usos de la dilución (Levistamel 25 %, furfuril mercaptano 1 %, Ultravanil 80 %, Matcha Ketone 5 %), del Hercolyn D (no DW), del yuzu (su página no dice que sea destilado), de la tintura de canela al 25 % de Fraterworks y del Ambrettolide para el Scentolide; y las pautas de dilución («diluir al 5 % o 1 %»). Lista completa en `no-usado-61.csv`.

## Material por material

| n | Material | Se buscaba | Lo que se llena |
|---|---|---|---|
| 1 | 4-Propylphenol | casa dosis horas fuerza | — |
| 2 | Methyl linolenate | familia casa horas olor | — |
| 3 | Thialdine | casa dosis horas fuerza | — |
| 4 | Villous cardamom, tincture | cas familia dosis horas fuerza | — |
| 5 | Honey, aromatic essence | dosis horas fuerza | — |
| 6 | Narcisse Oxyacetate | casa horas fuerza | — |
| 7 | Phenylethyl Mercaptan | casa dosis horas | — |
| 8 | Truffle essence | familia horas fuerza | — |
| 9 | 1-Octen-3-one Stabilised | casa horas | — |
| 10 | Ambergris, commercial tincture (purified) | cas dosis horas | — |
| 11 | Cypriol / Nagarmotha EO | dosis horas | tenacity_hours = 140; uso typical 1.5 % (concentrate); uso from 0.5 %, up to 3 % (finished_product) |
| 12 | Rose Crystals | casa horas | tenacity_hours = 400 (disputado) |
| 13 | Vinyl Sulfurol | casa horas | — |
| 14 | 3,4-Xylenol | dosis horas | — |
| 15 | Alpha-hexyl cinnamic aldehyde | dosis | uso typical 1.93 % (concentrate); uso up to 10 % (concentrate) |
| 16 | Ambrette, tincture | dosis horas | — |
| 17 | Cumin Nitrile | casa | house = Synarome |
| 18 | Dewfruit TEC | horas | — |
| 19 | Ethyl decanoate | casa | — |
| 20 | Green cardamom, tincture | dosis horas | — |
| 21 | Hyraceum (Africa stone), absolute | dosis horas | — |
| 22 | Isobutyl acetate | casa | — |
| 23 | Suederal | cas especie | — |
| 24 | 2-Hydroxybenzaldehyde | horas | — |
| 25 | Aldambre | horas | — |
| 26 | Auranone | horas | — |
| 27 | Black Agar 296985 | horas | — |
| 28 | Chinese cedarwood, essential oil | dosis | — |
| 29 | Manzanate | dosis | uso typical 0.027 % (concentrate) |
| 30 | Orris Givco | fuerza | — |
| 31 | Shangralide | dosis | uso from 1 %, up to 10 % (concentrate); uso from 0.5 %, up to 5 % (undeclared) |
| 32 | Tonka bean (seeds), commercial tincture | horas | — |
| 33 | Jasmin Floraline 99 (Robertet) | dosis | — |
| 34 | Levistamel | dosis | — |
| 35 | Pear Bold Base (Moellhausen) | dosis | — |
| 36 | Fig Base (PCW) | dosis | — |
| 37 | Oak wood (chips), CO2 extract | dosis | — |
| 38 | Furfuryl mercaptan | dosis | — |
| 39 | Trisamber | dosis | uso typical 2.29 % (concentrate) |
| 40 | Ambrocenide | dosis | uso up to 2 % (undeclared) |
| 41 | Frankincense (Boswellia carterii), essential oil | dosis | — |
| 42 | Frangipani Bold Base (Moellhausen) | dosis | — |
| 43 | 2-Methylpyrazine | dosis | — |
| 44 | Gamma-valerolactone | dosis | — |
| 45 | Hydroxyambran | dosis | — |
| 46 | Thujopsene | dosis | uso typical 0.239 % (concentrate) |
| 47 | Isolongifolene | dosis | — |
| 48 | Wool, absolute | dosis | — |
| 49 | Hercolyn DW (methyl hydrogenated rosinate) | dosis | — |
| 50 | Ultravanil | dosis | — |
| 51 | meta-Cresol | dosis | — |
| 52 | Yuzu peel, distilled essential oil | dosis | — |
| 53 | Coffee, absolute | dosis | — |
| 54 | Edenolide | dosis | uso up to 30 % (undeclared); uso up to 30 % (undeclared); uso typical 7.25 % (concentrate) |
| 55 | Ceylon cinnamon (bark), tincture | dosis | — |
| 56 | Matcha Ketone | dosis | — |
| 57 | Muscone | dosis | uso from 0.4 %, up to 2 % (undeclared); uso typical 0.2 % (concentrate) |
| 58 | Cuir 17500 (Synarome) | dosis | — |
| 59 | Bornyl acetate | dosis | uso up to 9 % (concentrate) |
| 60 | Hot Milk Bold Base (Moellhausen) | dosis | — |
| 61 | Oxyoctaline formate | dosis | uso from 0.5 %, up to 10 % (undeclared); uso typical 0.56 % (concentrate) |
| 62 | Ethyl linalool | dosis | uso typical 2 % (concentrate) |
| 63 | Scentolide | dosis | uso from 0.1 %, up to 2 % (undeclared) |
| 64 | Cinnamalva (cinnamyl nitrile) | dosis | uso from 0.1 %, up to 2 % (finished_product) |
| 65 | Ethyl pelargonate | dosis | uso up to 8 % (undeclared) |
| 66 | Fructalate | dosis | — |
| 67 | Orionide | dosis | uso up to 10 % (concentrate); uso from 0.5 %, up to 5 % (finished_product) |
| 68 | Cocoa thiazole (trimethylthiazole) | dosis | — |
| 69 | Tropicalia | dosis | uso from 0.1 %, up to 1 % (undeclared) |
| 60:17af28d8-a8bb-548b-931f-198524658039 | Muscenone | dosis | uso from 0.05 %, up to 0.5 % (undeclared) |
| 60:38adcfe2-bf52-5770-87ac-e32b8f17453a | Delta-decalactone | dosis | uso from 0.1 %, up to 2 % (finished_product) |
| 60:448a5e1c-f5df-55cf-be37-e5f173680e7d | Velvione | dosis | uso from 0.2 %, up to 4 % (undeclared) |
| 60:81a3a9ca-9bcb-5828-981b-f0b8afba81d3 | Veraspice | dosis | uso up to 1 % (undeclared) |
| 60:960113a8-0768-5e7b-b89f-17bb42bb9549 | Jasmal | dosis | uso typical 0.7 % (concentrate) |
| 60:97eaf150-cea7-57f5-9af3-85c3b7343e29 | Ambrostar | dosis | uso from 0.01 %, up to 0.5 % (finished_product) |
| 60:b3e2e7c7-7b43-55d5-8b81-c02f9b189e80 | Ylanganate | dosis | uso typical 5.87 % (concentrate) |
| 60:eaea5ef7-3a53-5e4c-bd10-d9202611c4e4 | Ysamber K | dosis | uso from 1 %, up to 10 % (undeclared); uso from 1 %, up to 10 % (concentrate) |

## Disputados

| Material | Campo | Va | Otras |
|---|---|---|---|
| Rose Crystals | tenacity_hours | 400 | PerfumersWorld: 300 |
