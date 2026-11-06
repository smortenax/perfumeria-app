# Tanda 49 · Los absolutos, CO2 y resinoides de Maese Lab que faltaban, en lo común

*Generada por `migracion-v3/tanda-48-maese-naturales.ts 49` sobre lo común de `3f36993` **con las tandas 46 a 48** (se aprueba después de ellas), desde `migracion-v3/web/maese-altas/propuesta-49.csv`. Escribe `v3/datos/materials.csv`, `material_categories.csv`, `material_descriptors.csv` y `material_doses.csv` enteros, con estos añadidos: lo de antes no cambia. Sin aprobar.*

**Por qué** (V3-99): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** como la tanda 47. La ficha de Maese Lab (tanda 45: especie por el INCI, parte, método, origen, CAS, pureza y perfil, citados); hasta dos páginas de referencia por producto, de la misma especie y parte (`migracion-v3/web/maese-altas/web-49-*.csv`); PerfuMate en local. Una página de otra especie o parte no cuenta. Un material por identidad (V3-85): especie, parte, proceso, tratamiento y quimiotipo; dos productos que solo cambian de origen o de grado son el mismo material. El nombre, el común en inglés de la referencia o, si no lo hay, la especie y la parte.

**Resultado:** 51 materiales nuevos; 12 no entran (ya son un común, o el mismo material que otro de la tanda). Con familia 33, impacto 26, fuerza en palabras 14, horas en tira 18, nivel 19; 3 usos habituales y 60 descriptores.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia (por `family_palette.csv`): es una lectura de la sesión.
- **Las tinturas y diluciones** van sin impacto (V3-97); la estimación desde el material puro está en la tanda 45 (`consenso.csv`).
- **Cómo se guarda la ficha de la tienda** (para el filtro por proveedor) está pendiente de tu respuesta en el hilo.

| n | Material | Especie | Familia | Impacto | Fuerza | Horas | Nivel | Uso hasta | Disputado |
|---|---|---|---|---|---|---|---|---|---|
| 152 | Seaweed fucus, absolute | *Fucus vesiculosus* | ozonic | 8 | — | 408 h | — | — |  |
| 153 | Calendula officinalis (petals), absolute | *Calendula officinalis* | green | — | — | — | — | — |  |
| 154 | Black currant bud, absolute | *Ribes nigrum* | spicy | 8 | high | 344 h | heart_base | 1 % | family |
| 155 | Red champaca, absolute | *Michelia champaca* | floral | 7 | low | 200 h | base | — |  |
| 158 | Frangipani, absolute | *Plumeria rubra* | — | 7 | — | — | — | — |  |
| 159 | Genista tinctoria (flower), absolute | *Genista tinctoria* | — | — | — | — | — | — |  |
| 160 | Geranium macrorrhizum (leaf), absolute | *Geranium macrorrhizum* | — | — | — | — | — | — |  |
| 161 | Tonka bean, absolute | *Dipteryx odorata* | gourmand | 6 | — | — | heart_base | — |  |
| 163 | Sideritis scardica (leaf), absolute | *Sideritis scardica* | — | — | — | — | — | — |  |
| 164 | Mate, absolute | *Ilex paraguariensis* | green | 7 | — | 24 h | — | — |  |
| 165 | Cassie, absolute | *Acacia farnesiana* | floral | 8 | very_high | 408 h | base | — |  |
| 166 | Cynara scolymus (leaves), absolute | *Cynara scolymus* | — | — | — | — | — | — |  |
| 172 | White beeswax, absolute | — | floral | 6 | low | 408 h | base | — | physical_state |
| 174 | Civet, absolute | *Viverra civetta* | animal | 9 | high | 400 h | base | 4 % | strength, physical_state |
| 175 | Carnation, absolute | *Dianthus caryophyllus* | spicy | 7 | — | 24 h | heart | 0.5 % |  |
| 176 | Trigonella foenum (seed), absolute | *Trigonella foenum* | gourmand | 8 | — | 400 h | — | — |  |
| 177 | Gardenia florida (flowers), absolute | *Gardenia florida* | — | — | — | — | — | — |  |
| 178 | Boletus edulis (fruiting bodies (mushroom)), absolute | *Boletus edulis* | woody | 8 | — | — | — | — |  |
| 179 | Hyacinth, absolute | *Hyacinthus orientalis* | green | 7 | high | — | heart | — |  |
| 180 | Jasminum officinale (flower), absolute | *Jasminum officinale* | floral | 8 | — | — | — | — |  |
| 181 | Jasmine grandiflorum, absolute | *Jasminum grandiflorum* | floral | 8 | medium | 312 h | base | — | tenacity_hours |
| 182 | Jasmine sambac, absolute | *Jasminum sambac* | floral | 8 | — | 45 h | heart | — | family |
| 183 | Lotus (white), absolute | *Nelumbo nucifera* | — | 6 | — | — | heart | — |  |
| 184 | Nelumbo nucifera (flower, pink), absolute | *Nelumbo nucifera* | floral | 6 | high | 200 h | base | — |  |
| 185 | Lonicera periclymenum (flower), absolute | *Lonicera periclymenum* | — | — | — | — | — | — |  |
| 187 | Narcissus, absolute | *Narcissus poeticus* | green | 8 | medium | 400 h | — | — |  |
| 188 | Iris florentina (root), absolute | *Iris florentina* | — | — | — | — | — | — |  |
| 189 | Osmanthus fragrans (flower), absolute | *Osmanthus fragrans* | floral | 7 | medium | 48 h | heart | — | tier, tenacity_hours, physical_state |
| 190 | Cyperus papyrus (root), absolute | *Cyperus papyrus* | woody | — | — | — | — | — |  |
| 191 | Rosa centifolia (flower), absolute | *Rosa centifolia* | floral | 8 | medium | 168 h | — | — | tenacity_hours |
| 192 | Rosa damascena (flower), absolute | *Rosa damascena* | floral | 8 | medium | 168 h | heart | — |  |
| 195 | Camellia sinensis (leaves), absolute | *Camellia sinensis* | green | — | — | — | — | — |  |
| 196 | Tilia americana (flower), absolute | *Tilia americana* | — | 6 | — | — | — | — |  |
| 197 | Tuberose, absolute | *Polianthes tuberosa* | floral | 9 | — | 200 h | base | — | tenacity_hours |
| 198 | Violet leaf, absolute | *Viola odorata* | green | 8 | high | 408 h | — | — |  |
| 199 | Prunus amygdalus (fruit), CO2 extract | *Prunus amygdalus* | — | — | — | — | — | — |  |
| 200 | Amber, dilution | *Pinus succinifera* | — | — | — | — | — | — |  |
| 202 | Coffee, CO2 extract | *Coffea arabica* | woody | — | high | — | top_heart | — |  |
| 203 | Rose concrete, absolute | *Rosa damascena* | floral | 8 | — | — | — | — |  |
| 204 | Cynara scolymus (flowers and leaves), dilution | *Cynara scolymus* | — | — | — | — | — | — |  |
| 206 | Lonicera caprifolium (flower), dilution | *Lonicera caprifolium* | floral | — | — | — | — | — |  |
| 216 | Sideritis scardica (flower), dilution | *Sideritis scardica* | — | — | — | — | — | — |  |
| 217 | Acacia dealbata (flower), dilution | *Acacia dealbata* | floral | — | — | — | heart | — |  |
| 218 | Butter, CO2 extract | — | gourmand | — | — | — | base | — |  |
| 219 | Inula viscosa (leaves), reduction | *Inula viscosa* | — | — | — | — | — | — |  |
| 220 | Cucumis sativus (fruits), CO2 extract | *Cucumis sativus* | green | — | — | — | — | — |  |
| 221 | Boswellia sacra (resin), resinoid | *Boswellia sacra* | — | — | — | — | — | — |  |
| 222 | Vanilla planifolia (fruit), resinoid | *Vanilla planifolia* | gourmand | — | — | — | — | — |  |
| 223 | Camellia sinensis (leaves), CO2 extract | *Camellia sinensis* | — | — | — | — | — | — |  |
| 224 | Tetrapleura tetraptera (pods), reduction | *Tetrapleura tetraptera* | — | — | — | — | — | — |  |
| 225 | Vanilla planifolia (fruit), reduction | *Vanilla planifolia* | gourmand | — | — | — | base | — |  |

## No entran

| n | Producto | Por qué |
|---|---|---|
| 162 | Hyraceum "Signature", absolute | ya es un común: Hyraceum (Africa stone), absolute (7e8265a2-c890-5476-a722-23ed3282820f) |
| 193 | Rose, absolute | el mismo material que el n.º 192: the same Rosa damascena flower absolute; Bulgaria and India are origins (una especificación, V3-85) |
| 194 | Tobacco, absolute | ya es un común: Tobacco absolute (81768544-f612-5a82-b792-f1becdf3d2d5) |
| 205 | Ribes nigrum (buds), dilution | el mismo material que el n.º 154, vendido diluido (una especificación, V3-85) |
| 207 | Osmanthus fragrans (flower), dilution | el mismo material que el n.º 189, vendido diluido (una especificación, V3-85) |
| 208 | Polianthes tuberosa (flower), dilution | el mismo material que el n.º 197, vendido diluido (una especificación, V3-85) |
| 209 | Violet leaf, dilution | el mismo material que el n.º 198, vendido diluido (una especificación, V3-85) |
| 210 | Calendula officinalis (petals), dilution | el mismo material que el n.º 153, vendido diluido (una especificación, V3-85) |
| 211 | Viverra civetta (excretion), dilution | el mismo material que el n.º 174, vendido diluido (una especificación, V3-85) |
| 212 | Geranium macrorrhizum (leaf), dilution | el mismo material que el n.º 160, vendido diluido (una especificación, V3-85) |
| 214 | Iris florentina (root), dilution | el mismo material que el n.º 188, vendido diluido (una especificación, V3-85) |
| 215 | Nicotiana tabacum (leaf), dilution | el mismo material que el n.º 194: tobacco absolute sold diluted in alcohol; the absolute is already a common (una especificación, V3-85) |
