# Mejoras del glosario de materiales

*Generada por `migracion-v3/mejoras-glosario.ts` desde lo común aprobado (`v3/datos/`, commit `6d4b353`). No se edita a mano: cuando vuelvas a ella, se ejecuta otra vez y dice lo que sigue faltando. No cambia ningún dato.*

**Por qué existe (V3-46).** Las tandas 7 y 9 entraron con huecos, aceptados de momento: «si de momento acepto para materiales vacios como seuderal y otros sin registro de familia se documenta en una ficha de mejoras de app:glosario materiales que se revisitara para ir teniendo los materiales al orden necesario» (orko kill, 2026-10-14). Esta es esa ficha. Cada hueco se llena con su fuente, por una tanda que apruebas, nunca a mano.

## Resumen

111 materiales comunes. Lo que le falta a cada campo del registro general, contando solo donde aplica: el CAS, en las moléculas; la especie, en los naturales; y del olor y el uso, nada en los 3 disolventes.

| Campo | Le falta a | De |
|---|---|---|
| CAS | 0 | 74 |
| especie | 1 | 30 |
| abreviatura | 9 | 111 |
| familia | 11 | 108 |
| nivel | 0 | 108 |
| tenacidad | 14 | 108 |
| intensidad | 3 | 108 |
| evolución | 108 | 108 |
| descriptores | 3 | 108 |
| dosis | 4 | 108 |
| estado físico | 4 | 111 |

**La evolución** está vacía en todos: el laboratorio no la da por tramos, y repartirla en los cinco de V3-42 queda por hacer.

## Los más vacíos (les faltan 4 campos o más)

| Material | Tipo | Le falta |
|---|---|---|
| Miel, esencia aromática | base | abreviatura, familia, tenacidad, intensidad, evolución, descriptores, dosis |
| Aldehído alfa-hexil cinámico | molécula | tenacidad, intensidad, evolución, descriptores, dosis, estado físico |
| Esencia de trufa | base | abreviatura, familia, tenacidad, intensidad, evolución, descriptores |
| Auranone | base | abreviatura, familia, tenacidad, evolución |
| Black Agar 296985 | base | abreviatura, familia, tenacidad, evolución |
| Dewfruit TEC | base | abreviatura, familia, tenacidad, evolución |
| Suederal | natural | especie, abreviatura, familia, evolución |

## Sin familia (11)

Sin familia, la app no le da color (V3-38). La familia sale de la pareja en la v1 (tanda 7): un material sin pareja en la v2, o cuya fila de la v1 no la tiene, queda sin ella.

- Aldambre (molécula)
- Auranone (base)
- Bálsamo de Tolú, resinoide (natural)
- Black Agar 296985 (base)
- Cacao, absoluto (natural)
- Cassis Base 345 B (base)
- Castóreo sintético (base)
- Dewfruit TEC (base)
- Esencia de trufa (base)
- Miel, esencia aromática (base)
- Suederal (natural)

## Abreviaturas

- **Sin abreviatura (9):** Auranone · Bálsamo de Tolú, resinoide · Black Agar 296985 · Cacao, absoluto · Cassis Base 345 B · Dewfruit TEC · Esencia de trufa · Miel, esencia aromática · Suederal.
- **Generadas, provisionales:** 5. **Tuyas, del glosario de la v1:** 97.
- **A revisar (V3-45):** muchas salen del nombre químico en vez del comercial, y eso confunde. La lista entera, con la columna «abreviatura» de la tabla de abajo. Los otros códigos de la v1 de cada pareja no entraron (V3-45).

## A auditar (V3-51)

Lo que se sabe mal o dudoso, para corregirlo como detalle: mala información es peor que falta de información. La lista es `migracion-v3/auditoria.csv`; se añade una fila por hallazgo.

| Id | Material | Campo | Problema | Pista |
|---|---|---|---|---|
| A001 | Aldambre | aliases | Tiene sinónimos que no son el Aldambre: Dodecanolactone, dodecalactone, Oxacyclododecan-2-one, 2-Oxacyclododecan-1-one, 12-dodecanolide | Vienen de la fila tl:947-05-7 de la v1 («Oxacyclotridecan-2-one»), que la v2 juntó con su pareja; su CAS ya quedó fuera (V3-45) |
| A002 | (varios) | aliases | Otras filas de la v1 de una pareja que no comparten nombre ni CAS con tu material pueden haber traído sinónimos ajenos | Las 6 de la fase 5.2: Aldambre, Artemisa, Cedro chino, Cilantro, Haba tonka, Láudano de jara (migracion-v3/fase-5/buscador.md) |

## Material por material

«sí»: lo tiene; «—»: le falta; «·»: no aplica.

| Material | Tipo | Abreviatura | CAS | especie | familia | nivel | tenacidad | intensidad | evolución | descriptores | dosis | estado físico |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2-Acetilpirazina | molécula | Ac5 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| 2-Hidroxibenzaldehído | molécula | Sl | sí | · | sí | sí | **—** | sí | **—** | sí | sí | sí |
| 3,4-Xilenol | molécula | Xn | sí | · | sí | sí | **—** | sí | **—** | sí | **—** | sí |
| Absoluto de Tabaco | natural | TOLA | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aceite de cade (enebro) | natural | CdO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Acetato de bencilo | molécula | BA8 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Acetato de estiralilo | molécula | αMEA | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Acetato de geranilo | molécula | GEA | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Acetato de guayilo (palo santo acetilado) | natural | BUS | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Acetato de linalilo | molécula | LIA | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Acetato de terpinilo | molécula | TAI | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ajenjo, aceite esencial | natural | WoO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Alcohol Feniletílico | molécula | PA5 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldambre | molécula | OxO (generada) | sí | · | **—** | sí | **—** | sí | **—** | sí | sí | sí |
| Aldehído alfa-amil cinámico | molécula | αAm | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldehído alfa-hexil cinámico | molécula | αHe | sí | · | sí | sí | **—** | **—** | **—** | **—** | **—** | **—** |
| Aldehído benzoico (benzaldehído) | molécula | Bz | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldehído C10 (decanal) | molécula | De9 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldehído C11 MOA | molécula | Met | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldehído C12 MNA | molécula | Me7 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldehído C14 (gamma-undecalactona) | molécula | γUn | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Aldehído C18 (gamma-nonalactona) | molécula | γNo | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Allyl Amyl Glycolate | molécula | ALM | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ámbar gris, tintura comercial (purificado) | natural | AmT | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ambermor | molécula | NFD | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ambrettolide | molécula | HH | sí | · | sí | sí | **—** | sí | **—** | sí | sí | sí |
| Ambrinol S | molécula | OTN | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Antranilato de metilo | molécula | MA16 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Artemisa (Artemisia vulgaris), aceite esencial | natural | ARVO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Auranone | base | **—** | · | · | **—** | sí | **—** | sí | **—** | sí | sí | sí |
| Bálsamo de Tolú, resinoide | natural | **—** | · | sí | **—** | sí | sí | sí | **—** | sí | sí | sí |
| Bergamota sin bergaptenos | natural | BFO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Black Agar 296985 | base | **—** | · | · | **—** | sí | **—** | sí | **—** | sí | sí | sí |
| Cacao, absoluto | natural | **—** | · | sí | **—** | sí | sí | sí | **—** | sí | sí | sí |
| Calone | molécula | MBD | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Canela de Ceilán, aceite esencial de corteza | natural | CIBO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Cashmeran | molécula | DPI | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Cassis Base 345 B | base | **—** | · | · | **—** | sí | sí | sí | **—** | sí | sí | sí |
| Castóreo sintético | base | CaS (generada) | · | · | **—** | sí | **—** | sí | **—** | sí | sí | sí |
| Castoreum | natural | CtA | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Cedramber | molécula | CME | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Cedro Atlas | natural | CATO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Cedro chino, aceite esencial | natural | CECO | · | sí | sí | sí | sí | sí | **—** | sí | **—** | sí |
| Cilantro | natural | COSO | · | sí | sí | sí | **—** | sí | **—** | sí | sí | sí |
| Cinamato de metilo | molécula | MCI | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| cis-3-Hexenol | molécula | He9 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Cumarina natural | molécula | Cu | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Dartanol | molécula | EY | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Datilat | molécula | CB | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Dewfruit TEC | base | **—** | · | · | **—** | sí | **—** | sí | **—** | sí | sí | sí |
| Dihydromyrcenol | molécula | Di18 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Diphenyl Oxide | molécula | DE13 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| DPG (dipropilenglicol) | molécula, disolvente | Dipr (generada) | sí | · | · | · | · | · | · | · | · | sí |
| Ebanol | molécula | MT3 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Esencia de trufa | base | **—** | · | · | **—** | sí | **—** | **—** | **—** | **—** | sí | sí |
| Etanol | molécula, disolvente | EA8 (generada) | sí | · | · | · | · | · | · | · | · | **—** |
| Ethyl Maltol | molécula | EMA | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ethylene Brassylate | molécula | EBR | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Etil-4-fenol | molécula | Et5 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Eucaliptol | molécula | Eu | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Eugenol 98% | molécula | Eg | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Florosa | molécula | IMP | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Fructone | molécula | EMD | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Galaxolide | molécula | γHH | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Geosmina | molécula | ODI | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Geraniol 98% | molécula | Ga | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Guaiacol | molécula | Gua | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Haba tonka (semillas), tintura comercial | natural | TBT | · | sí | sí | sí | **—** | sí | **—** | sí | sí | sí |
| Habanolide | molécula | OEN | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Hedione | molécula | MD8 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Helional | molécula | αMB | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Heliotropina | molécula | Pi3 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Hidroxicitronelal (Cyclosia) | molécula | Ho | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ionona Alpha | molécula | αIn | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Ionona beta | molécula | βIo | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| IPM (miristato de isopropilo) | molécula, disolvente | IsM (generada) | sí | · | · | · | · | · | · | · | · | **—** |
| Iso E Super | molécula | OT | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Isobutilquinoleína (IBQ) | molécula | Bu4 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Kephalis | molécula | TEE | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Láudano de jara | natural | LaA | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Lavanda | natural | LnO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Limón | natural | LmO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Linalol | molécula | Li | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Litsea Cubeba | natural | LICO | · | sí | sí | sí | sí | sí | **—** | sí | sí | **—** |
| Mandarina | natural | MnO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Maritima | molécula | DD2 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Mayol | molécula | ISC | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Methyl Pamplemousse | molécula | DTE | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Metil ionona gamma | molécula | αISM | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Miel, esencia aromática | base | **—** | · | · | **—** | sí | **—** | **—** | **—** | **—** | **—** | sí |
| Musgo de roble, absoluto | natural | OaA | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Naranja dulce | natural | ORSO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Norlimbanol | molécula | TRH | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Olíbano (Boswellia sacra), aceite esencial | natural | OlO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Óxido de rosa | molécula | TME | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Paradisamide | molécula | BUE | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Patchouli | natural | PtO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Pimienta negra, absoluto | natural | PBA | · | sí | sí | sí | **—** | sí | **—** | sí | sí | sí |
| Polysantol | molécula | DTR | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Prismantol | molécula | TDE | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Resinoide de benjuí | natural | BSR | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Resinoide de estírax (estoraque) | natural | StR | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Safraleine | molécula | Te | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Salvia Officinalis | natural | SDO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Sandalmysore Core | molécula | MTC | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Stemone | molécula | MH4 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Suederal | natural | **—** | · | **—** | **—** | sí | sí | sí | **—** | sí | sí | sí |
| Vainillina | molécula | Vn | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Vertenex (PTBCHA) | molécula | BA4 | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
| Vetiver | natural | VeO | · | sí | sí | sí | sí | sí | **—** | sí | sí | sí |
| Whisky lactona | molécula | HL | sí | · | sí | sí | sí | sí | **—** | sí | sí | sí |
