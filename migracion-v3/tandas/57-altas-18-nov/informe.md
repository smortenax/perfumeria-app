# Tanda 57 · Altas del 18-nov en lo común: la tintura de canela de Maese Lab y el pedido de Perfumiarz

*Generada por `migracion-v3/tanda-57-altas-18-nov.ts` sobre los datos comunes de `2251e19`. bandeja del laboratorio, 2026-11-18 (hilo «Planificar diluciones y altas de materiales»), secciones 2a y 2b. Reescribe `materials.csv` y `material_categories.csv` enteros. Sin aprobar.*

**Resultado:** 44 materiales comunes nuevos (la tintura y 43 de Perfumiarz); 11 productos de Perfumiarz que ya eran comunes, marcados «Perfumiarz sells it»; 1 en espera. Cada cifra sale de la página del producto (`migracion-v3/web/perfumiarz-pedido-18-nov/fichas.csv`, leída por `leer.py` el 2026-11-19), con su frase. **Las fichas van a medias, como pide la bandeja:** sin familia, duración, dosis ni composición; eso es la línea de información. Los documentos (SDS, IFRA, alérgenos) se apuntan en las notas y aún no se han leído.

## La tintura de canela (Maese Lab, producto 461)

*Ceylon cinnamon (bark), tincture*: *Cinnamomum verum*, corteza, Ceilán, 80º. Es otro material que el aceite de corteza: la tanda 56 la había dejado fuera porque se emparejó con él. Sin composición ni impacto: el panel de IFRA dirá «desconocido» hasta que se sepa cuánta corteza lleva.

## Los de Perfumiarz que ya eran comunes (solo se marcan)

| n | Producto | Común | Por qué |
|---|---|---|---|
| 8 | Ginger Oil Fresh (Madagascar) | Ginger root, essential oil | the same CAS 8007-08-7 and Zingiber officinale root oil; «Fresh» is a grade |
| 9 | Melonal | Melon heptenal | CAS 106-72-9, already common as «Melon heptenal» (alias Melonal) |
| 10 | Ambrox DL | Ambermor | CAS 3738-00-9, the racemic ambroxide, already common as Ambermor (it lists 3738-00-9) |
| 11 | Hedione® HC | Hedione | CAS 24851-98-7, Hedione; HC (high cis) is another grade of the same molecule (bandeja: «otro grado: producto nuevo») |
| 13 | Amber Xtreme™ | Musk indenofuran | CAS 476332-65-7, already common as «Musk indenofuran» (alias Amber Xtreme) |
| 16 | Patchouli Crude Organic (Madagascar) | Patchouli | CAS 8014-09-3, Pogostemon cablin leaf oil: the common Patchouli («crude», «organic» and Madagascar are grade and origin) |
| 17 | Ylang Ylang Oil Extra | Cananga odorata (flower, extra), essential oil | Cananga odorata flower oil, extra (CAS 8006-81-3 among its CAS) |
| 22 | Petitgrain Bigarade | Petitgrain bigarade, essential oil | Citrus aurantium amara leaf oil, the common «Petitgrain bigarade, essential oil» (Perfumiarz gives CAS 8014-17-3; the common, 68916-04-1) |
| 33 | Paradisamide | Paradisamide | CAS 406488-30-0, already common |
| 47 | Ambroxan® (powder) | Ambermor | CAS 6790-58-5, Ambroxan: the common Ambermor carries it (aliases «Ambroxan», «Ambrox Super (Firmenich)») |
| 52 | Ambrox Super (powder) | Ambermor | CAS 6790-58-5: the common Ambermor carries «Ambrox Super (Firmenich)» among its names |

**A mirar:** Ambrox DL (racémico, 3738-00-9), Ambroxan y Ambrox Super (el (−)-ambróxido, 6790-58-5) caen los tres en el común Ambermor, que ya junta los dos CAS. Si quieres separarlos, es una decisión aparte.

## Los nuevos

Nota (*tier*), de «NUTA» de la página: Głowa = salida, Serce = corazón, Baza = fondo. «Fuerza» es la «MOC ZAPACHU» de la tienda: va solo en las notas, no como impacto (V3-97).

| n | Producto | Nombre en la app | Tipo | CAS | Fabricante | Nota | Fuerza (tienda) | Documentos |
|---|---|---|---|---|---|---|---|---|
| 1 | 2-Methyl Pyrazine 5% (IPM) | 2-Methylpyrazine | molecule | 109-08-0 | PCW | top | 8/10 | SDS, IFRA, EU allergens |
| 2 | Wool Absolute | Wool, absolute | natural | 91079-01-5 | Biolandes | heart_base | 6/10 | SDS |
| 3 | Frangipani Bold Base | Frangipani Bold Base (Moellhausen) | composition | — | Moellhausen | heart | 7/10 | SDS, IFRA, EU allergens |
| 4 | Fig Base | Fig Base (PCW) | composition | — | PCW | top_heart | 7/10 | — |
| 5 | Matcha Ketone 5% (TEC) | Matcha Ketone | molecule | 113486-29-6 | Sigma Aldrich | heart | 9/10 | SDS |
| 6 | Yuzu Distilled | Yuzu peel, distilled essential oil | natural | 233683-84-6 | Oleolio | top | 7/10 | — |
| 7 | Bornyl Acetate | Bornyl acetate | molecule | 76-49-3 | Ventos | heart_base | 7/10 | — |
| 12 | Muscenone® | Muscenone | molecule | 82356-51-2 | Firmenich | base | 5/10 | SDS, IFRA, EU allergens |
| 14 | Hot Milk Bold Base | Hot Milk Bold Base (Moellhausen) | composition | — | Moellhausen | heart_base | 7/10 | — |
| 15 | Jasmal | Jasmal | molecule | 18871-14-2 | IFF | heart | 4/10 | SDS, IFRA, EU allergens |
| 18 | Ambrostar® | Ambrostar | molecule | — | — | — |  | — |
| 19 | Edenolide | Edenolide | molecule | 478695-70-4 | IFF | heart_base | 5/10 | SDS, IFRA, EU allergens |
| 20 | Scentolide | Scentolide | molecule | 28645-51-4 | Synarome | base | 5/10 | SDS, IFRA |
| 21 | Delta Decalactone | Delta-decalactone | molecule | 705-86-2 | Firmenich | base | 6/10 | — |
| 23 | Oxyoctaline Formate | Oxyoctaline formate | molecule | 65405-72-3 | Givaudan | base | 5/10 | SDS, IFRA, EU allergens |
| 24 | Hercolyn DW | Hercolyn DW (methyl hydrogenated rosinate) | molecule | 8050-15-5 | Ventos | base | 2/10 | SDS, IFRA, EU allergens |
| 25 | Cuir 17500 | Cuir 17500 (Synarome) | composition | — | Synarome | heart_base | 8/10 | SDS |
| 26 | Ylanganate | Ylanganate | molecule | 89-71-4 | IFF | heart | 8/10 | SDS, IFRA, EU allergens |
| 27 | Veraspice™ | Veraspice | molecule | 1631145-49-7 | IFF | heart_base | 7/10 | SDS, IFRA, EU allergens |
| 28 | Velvione™ | Velvione | molecule | 37609-25-9 | Givaudan | base | 5/10 | SDS, IFRA, EU allergens |
| 29 | Ultravanil 80% (DPG) | Ultravanil | molecule | 2563-07-7 | Givaudan | heart | 8/10 | SDS, IFRA, EU allergens |
| 31 | Thujopsene natural | Thujopsene | molecule | 470-40-6 | Ventos | heart | 7/10 | SDS, IFRA, EU allergens |
| 32 | Pear Bold Base | Pear Bold Base (Moellhausen) | composition | — | Moellhausen | top | 8/10 | — |
| 34 | Olibanum Oil (Oman) | Frankincense (Boswellia carterii), essential oil | natural | 8016-36-2 | Biolandes | heart | 7/10 | — |
| 35 | Meta Cresol 10 % (DPG) | meta-Cresol | molecule | 108-39-4 | Sigma Aldrich | heart_base | 7/10 | SDS |
| 36 | Gamma Valerolactone | Gamma-valerolactone | molecule | 108-29-2 | Ventos | top | 7/10 | SDS |
| 37 | Furfuryl Mercaptan 1% (DPG) | Furfuryl mercaptan | molecule | 98-02-2 | PCW | top | 10/10 | — |
| 38 | Fructalate | Fructalate | molecule | 72903-27-6 | Firmenich | heart | 5/10 | SDS, IFRA, EU allergens |
| 39 | Ethyl Linalool | Ethyl linalool | molecule | 10339-55-6 | Givaudan | top_heart | 6/10 | SDS, IFRA, EU allergens |
| 40 | Hydroxyambran 50% (IPM) | Hydroxyambran | molecule | 118562-73-5 | Ventos | base | 7/10 | SDS, IFRA, EU allergens |
| 41 | Cinnamalva 50% (DPG) | Cinnamalva (cinnamyl nitrile) | molecule | 1885-38-7 | IFF | heart | 8/10 | SDS, EU allergens |
| 42 | Ethyl Pelargonate | Ethyl pelargonate | molecule | 123-29-5 | Ventos | top | 7/10 | — |
| 43 | Orionide™ Oliffac | Orionide | molecule | — | — | — |  | — |
| 44 | Isolongifolene | Isolongifolene | molecule | 1135-66-6 | — | heart | 6/10 | — |
| 45 | Ambrocenide Crystals | Ambrocenide | molecule | 211299-54-6 | Symrise | base | 10/10 | SDS, IFRA, EU allergens |
| 46 | Levistamel 25% (TEC) | Levistamel | molecule | 675-09-2 | Givaudan | base | 8/10 | — |
| 48 | Oakwood Chip SFE | Oak wood (chips), CO2 extract | natural | 71011-28-4 | Firmenich | heart | 7/10 | SDS, IFRA, EU allergens |
| 49 | Cocoa Thiazole 10% (IPM) | Cocoa thiazole (trimethylthiazole) | molecule | 13623-11-5 | Sigma Aldrich | top | 9/10 | — |
| 50 | Ysamber® K | Ysamber K | molecule | 154171-77-4 | Symrise | base | 6/10 | SDS, IFRA |
| 51 | Trisamber® | Trisamber | molecule | — | IFF | heart_base | 7/10 | SDS, IFRA, EU allergens |
| 53 | Coffee Absolute | Coffee, absolute | natural | 84650-00-0 | Robertet | heart | 6/10 | SDS, IFRA, EU allergens, CoA |
| 54 | Jasmin Floraline 99 | Jasmin Floraline 99 (Robertet) | composition | — | Robertet | heart | 7/10 | SDS, IFRA, EU allergens, CoA |
| 55 | Muscone | Muscone | molecule | 541-91-3 | Firmenich | base | 5/10 | SDS, IFRA, EU allergens |

- **Ambrostar y Orionide:** Perfumiarz no tiene hoy su página (el buscador la enlaza y da 404): entran solo con su nombre y el tipo de la bandeja.
- **Isolongifolene:** la página da «CAS#: 1135-66-6» (isolongifoleno) e «INCI: ISOLONGIFOLANONE» (otra molécula): CAS en disputa.
- **Levistamel:** la página da «675-09-2 / 77-93-0»; el segundo es el TEC en que viene.
- **Yuzu destilado:** el común que ya había es el de presión en frío (Maese Lab); este es otro proceso, así que es otro material (V3-85). Que es destilado lo dice solo el nombre del producto.
- **Olíbano de Omán:** la página dice *Boswellia carterii*; el olíbano común es *B. sacra*: otro material.
- **Café absoluto:** el común que había es el extracto de CO2: otro material.
- **Diluidos de fábrica** (2-metilpirazina al 5 % en IPM, Matcha Ketone, Ultravanil, meta-cresol, furfuril mercaptano, Hydroxyambran, Cinnamalva, Levistamel, Cocoa Thiazole): lo común es el material puro; el % va en tu especificación cuando llegue el pedido.

## En espera

| n | Producto | Por qué |
|---|---|---|
| 30 | Tropicalia™ | Perfumiarz has no page for it today, so not even its kind is known: it waits for the information line |
