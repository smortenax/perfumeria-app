# Tanda 36 · Lo común, en inglés

*Generada por `migracion-v3/tanda-36-ingles.ts` sobre lo común como está en `v3/datos/` (commit `87e0daa`). La decisión es V3-71; el usuario, 2026-10-30: «Sí, todo». Cómo se hizo y con qué reglas: `migracion-v3/ingles/LEEME.md`.*

**Qué es.** Cada texto en prosa de lo común (nombres, descripciones, notas y fuentes) pasa al inglés, con los decimales en punto. Las citas de los documentos («…») se quedan como están, en su idioma. 3785 textos distintos se mandaron a traducir; 2929 cambian y 856 ya estaban en inglés. En total cambian 4068 celdas. Cada texto con su traducción, para revisarlo: `migracion-v3/ingles/traduccion.csv`.

**Comprobado en cada texto:** que siguen todas sus citas, todas sus URL y los mismos números.

| Tabla y columna | Celdas que cambian |
|---|---|
| `material_relations.other_text` | 647 |
| `material_relations.note` | 603 |
| `material_doses.notes` | 452 |
| `material_descriptors.text` | 307 |
| `materials.notes` | 147 |
| `materials.facets` | 136 |
| `materials.family_detail` | 130 |
| `materials.handling` | 129 |
| `materials.strength_source` | 122 |
| `materials.appearance` | 117 |
| `materials.physical_state` | 105 |
| `materials.blend_effect` | 102 |
| `materials.tenacity_source` | 96 |
| `materials.isomers` | 79 |
| `materials.recommended_dilution` | 77 |
| `materials.name` | 75 |
| `material_categories.name` | 75 |
| `materials.stability` | 70 |
| `material_components.source` | 57 |
| `material_references.note` | 57 |
| `materials.solubility` | 56 |
| `materials.sources` | 52 |
| `materials.form` | 41 |
| `materials.process` | 40 |
| `materials.part` | 39 |
| `materials.diffusion` | 37 |
| `materials.origin` | 29 |
| `ifra_substances.subgroup` | 26 |
| `materials.incompatibilities` | 23 |
| `materials.threshold` | 23 |
| `materials.vapor_pressure` | 22 |
| `materials.species` | 17 |
| `materials.chemotype` | 13 |
| `family_palette.colour_name` | 10 |
| `family_palette.covers` | 10 |
| `family_palette.source` | 10 |
| `materials.odor_target` | 8 |
| `materials.house` | 7 |
| `family_palette.name` | 7 |
| `materials.code` | 6 |
| `family_palette.short` | 6 |
| `materials.cost` | 1 |
| `ifra_annex.notice` | 1 |
| `ifra_spec_exclusions.note` | 1 |

## Lo que no cambia

- **Tu cuenta**: tus materiales, tus versiones, tus notas y tus nombres siguen como los escribiste (V3-71).
- **Los otros nombres** de cada material (sus alias), en todos sus idiomas: el buscador los sigue encontrando. **El nombre en español de un material o una categoría que cambia de nombre pasa a sus otros nombres**, así que buscar «2-Acetilpirazina» sigue llevando a 2-Acetylpyrazine.
- Los ids, los CAS, los INCI, las abreviaturas, las cifras, las familias, los perfumes y casas de las referencias, y los códigos de fuente (TG, web, FIG).

## IFRA, igual que antes

Tres reglas de IFRA leen el proceso con palabras (V3-31): la variante de Bálsamo del Perú, Estírax y Verbena, y la exclusión de la especificación del Estírax para el resinoide. Cada palabra en español gana la suya en inglés, y la española se queda para tus materiales, que siguen en español: 15 reglas nuevas (`ifra_variant_rules.csv`) y 1 exclusión nueva (`ifra_spec_exclusions.csv`).

| En español | En inglés |
|---|---|
| absoluto | absolute |
| extracto | extract |
| destilad | distill |
| aceite | oil, essential oil (al principio) |
| resinoide | resinoid |
| rectificado | rectified |

**Comprobado:** para cada común, en cada estándar con variante o exclusión en el que está (1 casos), la variante y la exclusión son las mismas antes y después; y su entrada del anexo de naturales (22 comunes con entrada por su CAS) es la misma.

## Los nombres que cambian (75 materiales)

| Antes | Ahora |
|---|---|
| 2-Acetilpirazina | 2-Acetylpyrazine |
| 2-Hidroxibenzaldehído | 2-Hydroxybenzaldehyde |
| 3,4-Xilenol | 3,4-Xylenol |
| Absoluto de Tabaco | Tobacco absolute |
| Aceite de cade (enebro) | Cade oil (juniper) |
| Acetato de bencilo | Benzyl acetate |
| Acetato de estiralilo | Styrallyl acetate |
| Acetato de geranilo | Geranyl acetate |
| Acetato de guayilo (palo santo acetilado) | Guaiyl acetate (acetylated palo santo) |
| Acetato de linalilo | Linalyl acetate |
| Acetato de terpinilo | Terpinyl acetate |
| Ajenjo, aceite esencial | Wormwood, essential oil |
| Alcohol Feniletílico | Phenylethyl alcohol |
| Aldehído alfa-amil cinámico | Alpha-amyl cinnamic aldehyde |
| Aldehído alfa-hexil cinámico | Alpha-hexyl cinnamic aldehyde |
| Aldehído benzoico (benzaldehído) | Benzoic aldehyde (benzaldehyde) |
| Aldehído C10 (decanal) | Aldehyde C10 (decanal) |
| Aldehído C11 MOA | Aldehyde C11 MOA |
| Aldehído C12 MNA | Aldehyde C12 MNA |
| Aldehído C14 (gamma-undecalactona) | Aldehyde C14 (gamma-undecalactone) |
| Aldehído C18 (gamma-nonalactona) | Aldehyde C18 (gamma-nonalactone) |
| Ámbar gris, tintura comercial (purificado) | Ambergris, commercial tincture (purified) |
| Ambreta, tintura | Ambrette, tincture |
| Antranilato de metilo | Methyl anthranilate |
| Artemisa (Artemisia vulgaris), aceite esencial | Mugwort (Artemisia vulgaris), essential oil |
| Bálsamo de Tolú, resinoide | Tolu balsam, resinoid |
| Benzoato de bencilo | Benzyl benzoate |
| Bergamota sin bergaptenos | Bergamot, bergapten-free |
| Cacao, absoluto | Cocoa, absolute |
| Canela de Ceilán, aceite esencial de corteza | Ceylon cinnamon, bark essential oil |
| Cardamomo verde, tintura | Green cardamom, tincture |
| Cardamomo villoso, tintura | Villous cardamom, tincture |
| Castóreo sintético | Synthetic castoreum |
| Cedro Atlas | Atlas cedarwood |
| Cedro chino, aceite esencial | Chinese cedarwood, essential oil |
| Cinamato de metilo | Methyl cinnamate |
| Cumarina natural | Natural coumarin |
| DPG (dipropilenglicol) | DPG (dipropylene glycol) |
| Enebro (bayas), aceite esencial | Juniper (berries), essential oil |
| Esencia de trufa | Truffle essence |
| Etanol | Ethanol |
| Etil vainillina | Ethyl vanillin |
| Etil-4-fenol | Ethyl-4-phenol |
| Eucaliptol | Eucalyptol |
| Gálbano, aceite esencial | Galbanum, essential oil |
| Geosmina | Geosmin |
| Haba tonka (semillas), tintura comercial | Tonka bean (seeds), commercial tincture |
| Heliotropina | Heliotropin |
| Hidroxicitronelal (Cyclosia) | Hydroxycitronellal (Cyclosia) |
| Hyraceum (piedra de África), absoluto | Hyraceum (Africa stone), absolute |
| Indol | Indole |
| Ionona Alpha | Alpha ionone |
| Ionona beta | Beta ionone |
| IPM (miristato de isopropilo) | IPM (isopropyl myristate) |
| Isobutilquinoleína (IBQ) | Isobutylquinoline (IBQ) |
| Láudano de jara | Rockrose labdanum |
| Lavanda | Lavender |
| Limón | Lemon |
| Linalol | Linalool |
| Mandarina | Mandarin |
| Metil ionona gamma | Gamma methyl ionone |
| Miel, esencia aromática | Honey, aromatic essence |
| Mirra, aceite esencial | Myrrh, essential oil |
| Musgo de roble, absoluto | Oakmoss, absolute |
| Naranja dulce | Sweet orange |
| Olíbano (Boswellia sacra), aceite esencial | Frankincense (Boswellia sacra), essential oil |
| Opopónax, aceite esencial | Opopanax, essential oil |
| Óxido de rosa | Rose oxide |
| Pimienta negra, absoluto | Black pepper, absolute |
| Pimienta rosa (Schinus molle), aceite esencial | Pink pepper (Schinus molle), essential oil |
| Resinoide de benjuí | Benzoin resinoid |
| Resinoide de estírax (estoraque) | Styrax resinoid (storax) |
| Triacetina | Triacetin |
| Vainillina | Vanillin |
| Whisky lactona | Whisky lactone |

Las categorías del buscador, igual que su material (75).

## Para mirar

45 textos traducidos conservan, fuera de las citas, algo que parece español (a veces es un nombre propio, como Hermès o Perú):

- `23931cd2ef`: maté absolute
- `4606be8251`: Ernesto Ventós (Isonaline 70 DSM) (70 % sheet): WOODY, VIOLET, FRUITY
- `47eef6fb5d`: Ernesto Ventós (Mayol Firmenich 957230) (cis+trans sheet, 5502-75-0): FRESH, FLORAL, MAGNOLIA, MUGUET
- `67961a0324`: Ernesto Ventós (Methylionone Coeur Gamma IFF) (70 % sheet): WOODY, FLORAL, VIOLET
- `134fed500a`: Ernesto Ventós: SWEET, BALSAMIC, WOODY (Firmenich 118594 and 953418); BALSAMIC, WOODY, ANIMAL (Light); AMBER-LIKE (1465)
- `277ae483d2`: Ernesto Ventós listing / ALDAMBRE SYNAROME (the page does not attribute clearly): WOODY, AMBER, DRY, MUSKY
- `95aafaae46`: TGSC (Luebke, William, 1981), at 10 % in dipropylene glycol (sample from Berjé Inc.): sweet vanilla creamy chocolate
- `ec2c3828f6`: TGSC (Luebke, William, 1983), at 100 %: citrus floral sweet bois de rose woody green blueberry
- `c8ae7e51eb`: De Kruiderie (via search engine): 0.1 % to 10 % in fragrance compositions · confidence: medium
- `b050c31225`: Scentspiracy: 0.1–3% in extrait de parfum · confidence: medium
- `b89d27cf95`: Scentspiracy: André Fraysse added it around 1934 (historical use, not a stated reference); a glossary page (via search engine) places it in the 1927 Arpège base
- `85d2d16003`: ScenTree: it has one asymmetric carbon; only the racemic mixture is used in perfumery. The (R) enantiomer smells floral-jasmine, close to gardenia; the (S), mor
- `af9e8c417e`: Name: session proposal: like the oils in the common data; «Aguaribay o Pimienta Rosa» remains as another name · Species: Maese Lab, https://maeselab.com/aceite-
- `df4e0fe528`: Name: session proposal: so as not to confuse it with cade oil, which is another juniper (Juniperus oxycedrus) · Species: Maese Lab, https://maeselab.com/aceite-
- `e64b7a3505`: Name: session proposal: from Maese Lab's title, «ABS. Hyraceum (Piedra de África)» · Species: Fraterworks, https://fraterworks.com/products/hyraceum-signature-a
- `00c84a2fef`: Added on 2026-10-26 (batch 23), with its sheet from the laboratory research, biblioteca/investigaciones/2026-10-26-altas (commit eef4193). Form, according to TG
- `dc3544c463`: Added on 2026-10-28 (batch 32), with the sheet from Maese Lab and TGSC. Maese Lab, https://maeselab.com/aceite-esencial-de-aguaribay-o-pimienta-rosa-100-natural
- `667f720b46`: Added on 2026-10-28 (batch 32), with the sheet from Maese Lab, Scentspiracy, PerfumersWorld and Fraterworks. Maese Lab, https://maeselab.com/aceite-esencial-de-
- `fe1bc4881e`: Added on 2026-10-28 (batch 32), with the sheet from Maese Lab, TGSC and Fraterworks. Maese Lab does not give the CAS (https://maeselab.com/abs-hyraceum-piedra-d
- `8c859eed74`: IFF sells it as a base; it is a rosin derivative, of variable composition. Web: Found out: it is a semisynthetic IFF base made of methyl esters of hydrogenated 
- `b277be9365`: Potency according to the repo, on its old scale: «EXTREMO». Web: The melting point is around 45 °C (Wikipedia 45.1; scent.vn 46 and 44–46; its IFRA, flash point
- `d35cdc9caf`: Potency according to the repo, on its old scale: «EXTREMO». Web: The Fraterworks and Scentspiracy sheets describe a rectified tar (pyrolysis). There is no way o
- `13ed5ab69f`: Potency according to the repo, on its old scale: «EXTREMO». Web: Pell Wall failed twice because of a network error and what comes from Basenotes and the other s
- `df735a1be0`: Potency according to the repo, on its old scale: «medio-alto». Web: The rest of the sources (Scentspiracy, Esans) speak of coumarin in general and say that toda
- `32aa799b74`: Potency according to the repo, on its old scale: «medio-bajo (bloque)». Web: There is no sheet from a purchase shop. ScenTree, Scentspiracy and the BC Fragrance
- `c38cb8a310`: TGSC uses CAS 977059-15-6. Web: The ScenTree and Fraterworks sheets describe the neat absolute (low in atranol / «IFRA 43» from LMR), so the physical data, stre
- `b633b6b4d6`: Web: (Perfumer's Apprentice marks it as «100 % Natural»); no page states the species or the origin, hence `natural` is empty. PerfumersWorld fills the density a
- `d77e129561`: Web: INCI «-»). Most of the pages repeat Firmenich's technical text. The same source (Fraterworks) gives 48 % as the IFRA limit, which it has not been possible 
- `cd4c29f345`: Web: It gives it as a top note, colourless liquid. ScenTree returned an error (410) and the IFF page a 403, so the data from IFF, Pell Wall, Perfumer's World, O
- `772bcaa084`: Web: The IFF sheet (compendium) returned 403 and only what the search engine showed is cited (chemical name, CAS and formula C16H23N). A search-engine snippet f
- `0c63935330`: Web: The list gives neither CAS nor shop sheet; there is also a separate 10 % version). CAS 8002-31-1 appears in other sources also for cocoa butter (search-eng
- `b7d049f0eb`: Web: The IFF page was not opened (it gave 403 with another material from the same batch); what is from IFF comes from search-engine snippets. The missing physic
- `b69a54d854`: Web: The Fraterworks and Scentspiracy sheets are for other trade names of ambroxide (Ambroxan crystals and Ambroxide Crystals from Symrise), not for Ambermor fr
- `abe3fb318c`: Web: The commercial sources read attribute it to Firmenich, not to Givaudan, and distinguish Dartanol from Bacdanol (IFF): Dartanol would be the laevorotatory f
- `1c79766b95`: Web: The quantitative data come from the other two, whose material might not be the same grade. Price from 10 ml to 1 L). Identity doubt: 127-51-5 is alpha-isom
- `2c9a531907`: Web: Scentspiracy's data are for a generic resinoid (CAS 9000-64-0, «Various») and Fraterworks' for a grade diluted to 50 % in triethyl citrate: they are not ex
- `3e32bed8d4`: Web: ScenTree, Fraterworks, GetChem and Parchem only through the search-engine snippets. The ScenTree data on IFRA were cut off. Density: Privi 0.830–0.840 at 2
- `afb17844db`: Web: Fraterworks (made by Payan Bertrand, Dalmatia origin), Scentspiracy (sold out in the shop) and PerfumersWorld were opened. The list gives no shop sheet. Th
- `e43dafaa7d`: Web: According to the Academia del Perfume, via the search engine, the leaf oil is not usually used in fragrances). The individual sheet gives it as «Puro». Tho
- `e6b0ec3af6`: Web: No dose or physical data. TGSC: TGSC sheet titled «diphenyl oxide, 101-84-8» (header «diphenyl oxide / phenoxybenzene»); the CAS matches the list. Melting 
- … y 5 más.

Ningún número con coma decimal fuera de las citas.

Ningún texto largo queda mucho más corto en inglés (menos del 70 %).

Tablas que escribe: `materials.csv`, `material_categories.csv`, `material_relations.csv`, `material_components.csv`, `material_descriptors.csv`, `material_doses.csv`, `material_references.csv`, `ifra_substances.csv`, `ifra_annex.csv`, `ifra_spec_exclusions.csv`, `family_palette.csv`, `ifra_variant_rules.csv`.
