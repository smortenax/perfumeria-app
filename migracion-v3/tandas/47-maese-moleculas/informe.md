# Tanda 47 · Las moléculas de Maese Lab que faltaban, en lo común

*Generada por `migracion-v3/tanda-47-maese-moleculas.ts` sobre lo común de `3f36993` **con la tanda 46** (se aprueba después de ella), desde `migracion-v3/web/maese-altas/propuesta-47.csv`. Escribe `v3/datos/materials.csv`, `material_categories.csv`, `material_descriptors.csv` y `material_doses.csv` enteros, con estos añadidos: lo de antes no cambia. En inglés, como lo común desde la tanda 36. Sin aprobar.*

**Por qué** (V3-99): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** la ficha de Maese Lab de la tanda 45 (nombre, CAS comprobado, INCI, pureza y perfil, citados); para cada producto se leyeron hasta dos páginas de referencia (TGSC primero, y una independiente: Fraterworks, la casa, Perfumer's Apprentice…; `migracion-v3/web/maese-altas/web-47-*.csv`, con la frase literal) y PerfuMate en local. Una página de otro CAS no cuenta. `consolidar.py` elige con las mismas reglas que la tanda 46: orden de referencias, y si no coinciden, va la primera y el campo queda disputado. El impacto, solo de PerfuMate y cuando es el mismo material (V3-97); la fuerza en palabras va aparte, en `strength`.

**Resultado:** 75 materiales nuevos (3 bases o especialidades); 5 no entran porque ya son un común. Con familia 72, impacto 71, fuerza en palabras 55, horas en tira 71, nivel 53, estado 71; 38 usos habituales y 196 descriptores.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia («Odor Type: balsamic» → gourmand, por `family_palette.csv`): es una lectura de la sesión.
- **IFRA** no se escribe aquí: la app lo lee por el CAS de la capa de IFRA (V3-35).
- **Lo que Maese escribe mal:** 4940-97-3 → 101-97-3.
- **Cómo se guarda la ficha de la tienda** (para el filtro por proveedor) está pendiente de tu respuesta en el hilo. Esta tanda solo da de alta el material, como la 38.

| n | Material | CAS | Familia | Impacto | Fuerza | Horas | Nivel | Uso hasta | Disputado |
|---|---|---|---|---|---|---|---|---|---|
| 2 | Amyl acetate | 628-63-7 | fruity | 5 | — | 4 h | top | 8 % | family |
| 4 | Hexyl acetate | 142-92-7 | fruity | 5 | medium | 5 h | heart | 5 % | strength |
| 7 | Ethyl acetate | 141-78-6 | fruity | 4 | high | 4 h | top | 10 % |  |
| 9 | Gardenia pentyl acetate | 68083-58-9 | floral | 6 | medium | 52 h | base | 5 % | family |
| 10 | Acetophenone | 98-86-2 | floral | 6 | — | 300 h | base | — | tenacity_hours |
| 11 | Benzyl alcohol | 100-51-6 | floral | 2 | medium | 35 h | heart | — |  |
| 12 | Styralyl Alcohol | 98-85-1 | green | 4 | — | 8 h | — | — |  |
| 14 | 3-phenyl propyl alcohol | 1335-12-2 | gourmand | 4 | medium | 152 h | base | 8 % | family, tenacity_hours |
| 15 | Cyclamen aldehyde | 103-95-7 | floral | 8 | medium | 72 h | base | 8 % | family |
| 18 | Undecanal | 112-44-7 | ozonic | 8 | high | 72 h | base | 1 % | strength |
| 22 | Strawberry glycidate 1 | 77-83-8 | fruity | 7 | medium | 241 h | base | 15 % | tenacity_hours |
| 24 | Octanal | 124-13-0 | ozonic | 8 | high | 7 h | heart | 1 % | family, tenacity_hours |
| 25 | L-(-)-alpha-pinene | 7785-26-4 | green | 5 | — | 1 h | — | 10 % | family |
| 26 | Alpha-terpineol | 98-55-5 | floral | 4 | medium | 20 h | top_heart | 30 % | physical_state |
| 27 | Allyl cyclohexyl propionate | 2705-87-5 | fruity | 7 | medium | 251 h | base | 5 % | strength |
| 29 | Alpha-phellandrene | 99-83-2 | citrus | 5 | medium | 4 h | — | 8 % |  |
| 30 | Amber Core | 139504-68-0 | woody | 7 | — | 182 h | base | — | family |
| 31 | Musk indenofuran | 476332-65-7 | animal | 10 | medium | 168 h | base | — | strength |
| 37 | Animalis | — | animal | 8 | — | — | — | — |  |
| 40 | Avalone | — | — | — | — | — | — | — |  |
| 44 | Beta-caryophyllene | 87-44-5 | spicy | 4 | medium | 44 h | heart | 12 % |  |
| 45 | Beta-pinene | 127-91-3 | green | 5 | high | 4 h | top | 12 % |  |
| 46 | Alpha-bisabolene | 17627-44-0 | gourmand | 4 | medium | 48 h | heart | — |  |
| 48 | Dextro,laevo-borneol | 507-70-0 | gourmand | 5 | medium | 4 h | top_heart | — | family, tenacity_hours |
| 50 | Allyl hexanoate | 123-68-2 | fruity | 7 | high | 1 h | top | — | tenacity_hours |
| 51 | Carvacrol | 499-75-2 | green | 8 | — | 272 h | base | — |  |
| 55 | Cedrol | 77-53-2 | woody | 3 | low | 400 h | base | — |  |
| 56 | Cedryl acetate | 77-54-3 | woody | 4 | — | 400 h | base | — |  |
| 57 | Musk dimethyl indane | 13171-00-1 | animal | 3 | medium | 400 h | base | — | tenacity_hours |
| 58 | Cinnamyl Alcohol | 104-54-1 | floral | 5 | — | 350 h | base | — | family |
| 60 | Citronellol | 106-22-9 | floral | 5 | medium | 56 h | base | — |  |
| 61 | Civette Synthetic | — | animal | 8 | — | 240 h | base | — |  |
| 68 | Dihydro-beta-ionone | 17283-81-7 | woody | 5 | medium | 9 h | heart | 8 % | tenacity_hours |
| 72 | Ethyl phenyl acetate | 101-97-3 | floral | 5 | high | 312 h | base | 8 % |  |
| 80 | Farnesol | 4602-84-0 | floral | 3 | low | 400 h | base | — | family |
| 81 | Green ether | 56011-02-0 | green | 6 | medium | 32 h | — | 5 % | tenacity_hours |
| 82 | Ozone propanal | 67634-15-5 | ozonic | 7 | medium | 80 h | base | 10 % |  |
| 83 | Floral butanal | 125109-85-5 | floral | 8 | medium | 144 h | base | 2 % | family |
| 86 | Furfural | 98-01-1 | gourmand | 5 | medium | 4 h | top | — |  |
| 89 | Tricyclodecenyl isobutyrate | 67634-20-2 | green | 6 | medium | 344 h | — | 10 % |  |
| 91 | Musk decenone | 34902-57-3 | animal | 4 | medium | 348 h | base | 5 % | family |
| 94 | Hexyl benzoate | 6789-88-4 | gourmand | 3 | medium | 192 h | base | 5 % |  |
| 95 | Hydroxycitronellol | 107-74-4 | floral | 3 | low | 248 h | — | 20 % |  |
| 100 | Linalyl isobutyrate | 78-35-3 | fruity | — | medium | 8 h | — | 8 % |  |
| 101 | N-methyl ionone | 1335-46-2 | floral | 6 | medium | 184 h | — | — |  |
| 102 | Jasmin lactone | 34686-71-0 | floral | 6 | medium | 400 h | — | 3 % | family |
| 104 | (Z)-woody amylene | 81786-73-4 | woody | 3 | medium | 12 h | heart | 30 % |  |
| 105 | Butyl lactate | 138-22-7 | — | — | — | — | — | — |  |
| 106 | Ethyl lactate | 97-64-3 | fruity | 3 | high | 4 h | — | 12 % |  |
| 107 | 2,4-ivy carbaldehyde | 68039-49-6 | green | 8 | high | 8 h | base | — | tenacity_hours |
| 108 | Limonene | 138-86-3 | citrus | 3 | medium | 3 h | — | — | tenacity_hours |
| 112 | Methyl cedryl ketone | 32388-55-9 | woody | 6 | — | 400 h | base | — |  |
| 113 | Melon heptenal | 106-72-9 | — | 8 | — | 160 h | base | — |  |
| 114 | Dextro,laevo-menthol | 89-78-1 | green | 7 | medium | 32 h | — | 8 % |  |
| 117 | Ethyl myristate | 124-06-1 | ozonic | 2 | — | 4 h | top | — |  |
| 119 | Myrcene | 123-35-3 | spicy | 4 | high | 1 h | top | 4 % | family, tenacity_hours |
| 120 | Nerol | 106-25-2 | floral | 5 | medium | 44 h | heart | 20 % | family, strength |
| 121 | Nerolidol | 7212-44-4 | floral | 3 | low | 100 h | base | 15 % | family |
| 123 | 2-(2-methylphenyl)ethanol | 19819-98-8 | floral | 4 | medium | 400 h | base | — |  |
| 124 | 2-cyclohexylidene-2-phenylacetonitrile | 10461-98-0 | floral | 4 | medium | 400 h | base | — | family, tenacity_hours, physical_state |
| 126 | Rose absolute pentanol | 55066-48-3 | floral | 4 | medium | 400 h | — | 5 % |  |
| 127 | PICONIA | 23787-90-8 | woody | 5 | medium | 240 h | heart_base | 15 % |  |
| 129 | Myrmac carboxaldehyde | 52475-86-2 | ozonic | 8 | — | 48 h | top_heart | — | tenacity_hours |
| 130 | Citronellyl propionate | 141-14-0 | floral | 4 | medium | 20 h | — | 6 % |  |
| 132 | (R)-(+)-pulegone | 89-82-7 | green | 6 | medium | 8 h | — | 5 % |  |
| 138 | Sandalore | 65113-99-7 | woody | 7 | — | 400 h | base | — |  |
| 139 | Sandela | 3407-42-9 | woody | 5 | — | 408 h | base | — |  |
| 140 | Styrene | 100-42-5 | gourmand | — | — | — | — | — |  |
| 141 | Diethyl succinate | 123-25-1 | fruity | 1 | low | 20 h | — | 12 % |  |
| 142 | Terpinolene | 586-62-9 | green | 4 | medium | 4 h | — | — | family, tenacity_hours |
| 143 | 5-methyl-2-propan-2-ylphenol | 89-83-8 | green | 7 | high | 176 h | base | — |  |
| 145 | Tonalide | 21145-77-7 | animal | 3 | medium | 400 h | base | — | family, tenacity_hours |
| 146 | Dec-9-en-1-ol | 13019-22-2 | floral | 7 | high | 340 h | — | 4 % | family, tenacity_hours |
| 147 | Trimofix | 144020-22-4 | woody | 7 | — | 250 h | base | — |  |
| 148 | Violet decenol | 81782-77-6 | green | 8 | medium | 31 h | heart | — | tenacity_hours |

## No entran (ya son un común)

| n | Producto | Común |
|---|---|---|
| 16 | Aldehido alfa hexil cinamico | Alpha-hexyl cinnamic aldehyde (c833332c-de03-50d6-9703-c7c8eddbb59e) |
| 34 | Isoambrettolide | Ambrettolide (e4d36415-6b7e-513b-9d8b-65d0e4373e62) |
| 53 | Cassis specialty | Cassis Base 345 B (15271dd5-2bab-5ed0-a742-f86d66485282) |
| 97 | Beta-ionone | Beta ionone (f499981b-c7ef-53c5-bc9f-20e24218a042) |
| 136 | Bacdanol | Dartanol (a4c3d63b-a406-5761-888e-785cb9c707c5) |
