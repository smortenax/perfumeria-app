# Tanda 48 · Los aceites esenciales de Maese Lab que faltaban, en lo común

*Generada por `migracion-v3/tanda-48-maese-naturales.ts 48` sobre lo común de `1a4c502` **con las tandas 46 a 47** (se aprueba después de ellas), desde `migracion-v3/web/maese-altas/propuesta-48.csv`. Escribe `v3/datos/materials.csv`, `material_categories.csv`, `material_descriptors.csv` y `material_doses.csv` enteros, con estos añadidos: lo de antes no cambia. Sin aprobar.*

**Por qué** (V3-99): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** como la tanda 47. La ficha de Maese Lab (tanda 45: especie por el INCI, parte, método, origen, CAS, pureza y perfil, citados); hasta dos páginas de referencia por producto, de la misma especie y parte (`migracion-v3/web/maese-altas/web-48-*.csv`); PerfuMate en local. Una página de otra especie o parte no cuenta. Un material por identidad (V3-85): especie, parte, proceso, tratamiento y quimiotipo; dos productos que solo cambian de origen o de grado son el mismo material. El nombre, el común en inglés de la referencia o, si no lo hay, la especie y la parte.

**Resultado:** 159 materiales nuevos; 5 no entran (ya son un común, o el mismo material que otro de la tanda). Con familia 21, impacto 123, fuerza en palabras 11, horas en tira 15, nivel 8; 9 usos habituales y 31 descriptores.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia (por `family_palette.csv`): es una lectura de la sesión.
- **Las tinturas y diluciones** van sin impacto (V3-97); la estimación desde el material puro está en la tanda 45 (`consenso.csv`).
- **Cómo se guarda la ficha de la tienda** (para el filtro por proveedor) está pendiente de tu respuesta en el hilo.

| n | Material | Especie | Familia | Impacto | Fuerza | Horas | Nivel | Uso hasta | Disputado |
|---|---|---|---|---|---|---|---|---|---|
| 226 | Birch tar, essential oil | *Betula pendula* | — | 9 | — | 24 h | heart | — |  |
| 227 | Betula lenta (bark), essential oil | *Betula lenta* | green | — | medium | 12 h | — | 15 % |  |
| 228 | Siberian fir, essential oil | *Abies sibirica* | gourmand | 6 | medium | 16 h | top_heart | 12 % |  |
| 229 | Agarwood, essential oil | *Aquilaria malaccensis* | — | 8 | — | — | base | — |  |
| 231 | Winter savory, essential oil | *Satureja montana* | spicy | 8 | — | — | — | — |  |
| 232 | Allium sativum (bulb), essential oil | *Allium sativum* | — | — | — | — | — | — |  |
| 233 | Trachyspermum ammi fruit, essential oil | *Carum copticum* | green | 8 | — | — | — | 2 % |  |
| 234 | Ocimum basilicum (leaf), essential oil | *Ocimum basilicum* | — | 7 | — | — | — | — |  |
| 235 | Cinnamomum camphora (bark), essential oil | *Cinnamomum camphora* | green | 7 | high | 4 h | — | 5 % |  |
| 236 | Carum carvi (seed), essential oil | *Carum carvi* | green | 7 | medium | 20 h | — | — |  |
| 237 | Amyris balsamifera (bark), essential oil | *Amyris balsamifera* | — | 4 | — | — | — | — |  |
| 238 | Angelica archangelica (root), essential oil | *Angelica archangelica* | animal | 7 | medium | 31 h | — | — |  |
| 239 | Illicium verum (fruit), essential oil | *Illicium verum* | spicy | 7 | — | — | — | 8 % |  |
| 240 | Pimpinella anisum (seed), essential oil | *Pimpinella anisum* | spicy | 7 | medium | 68 h | — | 8 % |  |
| 241 | Tea tree, essential oil | *Melaleuca alternifolia* | spicy | 6 | — | — | — | — |  |
| 243 | Artemisia annua (leaf), essential oil | *Artemisia annua* | green | — | — | — | — | — |  |
| 244 | Neroli, reduction | *Citrus aurantium* | — | — | — | — | — | — |  |
| 245 | Copaiba balsam, essential oil | *Copaifera officinalis* | woody | 4 | — | — | — | — |  |
| 246 | Dipterocarpus turbinatus (resin), essential oil | *Dipterocarpus turbinatus* | woody | 4 | medium | 400 h | — | 20 % |  |
| 248 | Myroxylon pereirae (balsam), essential oil | *Myroxylon pereirae* | gourmand | 7 | medium | 400 h | — | — |  |
| 250 | Bergamot peel, essential oil | *Citrus bergamia* | — | 6 | medium | 4 h | top | — |  |
| 251 | Barosma betulina (leaf), essential oil | *Barosma betulina* | green | 9 | high | 176 h | base | 0.8 % | tenacity_hours |
| 252 | Cabreuva wood, essential oil | *Myrocarpus fastigiatus* | woody | — | — | 100 h | base | — |  |
| 253 | Calamus, essential oil | *Acorus calamus* | green | 7 | — | 120 h | base | — |  |
| 257 | Cassia bark, essential oil | *Cinnamomun cassia* | spicy | 8 | medium | 160 h | — | 1 % |  |
| 258 | Vitis vinifera (fruits, cava / champagne), essential oil | *Vitis vinifera* | — | — | — | — | — | — |  |
| 259 | Melaleuca leucadendron (leaf), essential oil | *Melaleuca leucadendron* | green | 6 | — | — | — | — |  |
| 260 | Onion, essential oil | *Allium cepa* | transformed | — | — | — | — | — |  |
| 263 | Cedrus libani (bark), essential oil | *Cedrus libani* | — | — | — | — | — | — |  |
| 264 | Cedarwood, essential oil | *Juniperus mexicana* | woody | 5 | — | 16 h | base | — | tenacity_hours |
| 265 | Juniperus virginiana (wood), essential oil | *Juniperus virginiana* | — | 5 | — | — | — | — |  |
| 266 | Cedrus deodara (wood), essential oil | *Cedrus deodara* | — | 5 | — | — | — | — |  |
| 268 | Cupressus sempervirens (leaves), essential oil | *Cupressus sempervirens* | — | 5 | — | — | — | — |  |
| 269 | Callitris intratropica (wood), essential oil | *Callitris intratropica* | — | 5 | — | — | — | — |  |
| 271 | Cymbopogon citratus (leaf), essential oil | *Cymbopogon citratus* | — | — | — | — | — | — |  |
| 272 | Cymbopogon nardus (herb), essential oil | *Cymbopogon nardus* | — | 7 | — | — | — | — |  |
| 273 | Eugenia caryophyllus (flower), essential oil | *Eugenia caryophyllus* | — | 8 | — | — | — | — |  |
| 274 | Eugenia caryophyllus (leaf), essential oil | *Eugenia caryophyllus* | — | 8 | — | — | — | — |  |
| 275 | Cuminum cyminum (seed), essential oil | *Cuminum cyminum* | — | 8 | — | — | — | — |  |
| 276 | Curcuma longa (root), essential oil | *Curcuma longa* | — | 6 | — | — | — | — |  |
| 277 | Murraya koenigii (leaf), essential oil | *Murraya koenigii* | — | 7 | — | — | — | — |  |
| 278 | Canarium luzonicum (resin), essential oil | *Canarium luzonicum* | — | 5 | — | — | — | — |  |
| 281 | Anethum graveolens (leaf), essential oil | *Anethum graveolens* | — | 6 | — | — | — | — |  |
| 282 | Anethum graveolens (seed), essential oil | *Anethum graveolens* | — | 7 | — | — | — | — |  |
| 283 | Artemisia dracunculus (plant), essential oil | *Artemisia dracunculus* | — | 7 | — | — | — | — |  |
| 284 | Eucalyptus citriodora (leaf), essential oil | *Eucalyptus citriodora* | — | 7 | — | — | — | — |  |
| 285 | Eucalyptus dives (leaf), essential oil | *Eucalyptus dives* | — | — | — | — | — | — |  |
| 286 | Eucalyptus globulus (leaf), essential oil | *Eucalyptus globulus* | — | 7 | — | — | — | — |  |
| 287 | Eucalyptus radiata (leaf), essential oil | *Eucalyptus radiata* | — | — | — | — | — | — |  |
| 288 | Eucalyptus smithii (leaf), essential oil | *Eucalyptus smithii* | — | — | — | — | — | — |  |
| 289 | Eucalyptus staigeriana (leaf), essential oil | *Eucalyptus staigeriana* | — | — | — | — | — | — |  |
| 290 | Hedychium spicatum (flower), essential oil | *Hedychium spicatum* | — | 6 | — | — | — | — |  |
| 291 | Plumeria alba (flower), essential oil | *Plumeria alba* | — | — | — | — | — | — |  |
| 293 | Gaultheria fragrantissima (leaf), essential oil | *Gaultheria fragrantissima* | — | 8 | — | — | — | — |  |
| 294 | Pelargonium graveolens (flower), essential oil | *Pelargonium graveolens* | — | 7 | — | — | — | — |  |
| 295 | Pelargonium graveolens (aerial parts, var. China), essential oil | *Pelargonium graveolens* | — | 7 | — | — | — | — |  |
| 296 | Pelargonium graveolens (aerial parts, var. Egypt), essential oil | *Pelargonium graveolens* | — | 6 | — | — | — | — |  |
| 297 | Guaiacum officinale (wood), essential oil | *Guaiacum officinale* | — | 4 | — | — | — | — |  |
| 299 | Commiphora mukul (resin), essential oil | *Commiphora mukul* | — | — | — | — | — | — |  |
| 300 | Hamamelis virginiana (leaf), essential oil | *Hamamelis virginiana* | — | — | — | — | — | — |  |
| 301 | Helichrysum italicum (flower), essential oil | *Helichrysum italicum* | — | 7 | — | — | — | — |  |
| 302 | Helichrysum gymnocephalum (flower), essential oil | *Helichrysum gymnocephalum* | — | — | — | — | — | — |  |
| 303 | Helichrysum italicum (flower, var. picardii, Spain), essential oil | *Helichrysum italicum* | — | 7 | — | — | — | — |  |
| 304 | Foeniculum vulgare (whole plant), essential oil | *Foeniculum vulgare* | — | 7 | — | — | — | — |  |
| 305 | Foeniculum vulgare (seeds), essential oil | *Foeniculum vulgare* | — | 7 | — | — | — | — |  |
| 306 | Hyssopus officinalis (plant), essential oil | *Hyssopus officinalis* | — | 7 | — | — | — | — |  |
| 307 | Hyssopus officinalis (flowers and leaves), essential oil | *Hyssopus officinalis* | — | 7 | — | — | — | — |  |
| 309 | Boswellia serrata (resin), essential oil | *Boswellia serrata* | — | 6 | — | — | — | — |  |
| 311 | Nardostachys jatamansi (root), essential oil | *Nardostachys jatamansi* | — | 6 | — | — | — | — |  |
| 312 | Zingiber officinale (root), essential oil | *Zingiber officinale* | — | 7 | — | — | — | — |  |
| 313 | Zingiber cassumunar (root), essential oil | *Zingiber cassumunar* | — | 5 | — | — | — | — |  |
| 314 | Cedrelopsis grevei (bark), essential oil | *Cedrelopsis grevei* | — | 5 | — | — | — | — |  |
| 315 | Laurus nobilis (leaf), essential oil | *Laurus nobilis* | — | 7 | — | — | — | — |  |
| 317 | Lavandula latifolia (flower), essential oil | *Lavandula latifolia* | — | 6 | — | — | — | — |  |
| 319 | Lavandula hybrida (aerial parts), essential oil | *Lavandula hybrida* | — | 6 | — | — | — | — |  |
| 320 | Lavandula hybrida (flower, lavandin extra), essential oil | *Lavandula hybrida* | — | 6 | — | — | — | — |  |
| 321 | Lavandula hybrida (flower, lavandin grosso), essential oil | *Lavandula hybrida* | — | 6 | — | — | — | — |  |
| 322 | Cymbopogon flexuosus (plant), essential oil | *Cymbopogon flexuosus* | — | 7 | — | — | — | — |  |
| 323 | Pistacia lentiscus (resin), essential oil | *Pistacia lentiscus* | — | 5 | — | — | — | — |  |
| 324 | Levisticum officinale (root), essential oil | *Levisticum officinale* | — | 9 | — | — | — | — |  |
| 325 | Citrus aurantifolia (peel, furocoumarin-free), essential oil | *Citrus aurantifolia* | — | 6 | — | — | — | — |  |
| 326 | Citrus aurantifolia (peel), essential oil | *Citrus aurantifolia* | — | 6 | — | — | — | — |  |
| 327 | Citrus hystrix (peel), essential oil | *Citrus hystrix* | — | 7 | — | — | — | — |  |
| 328 | Citrus aurantifolia (peel), essential oil | *Citrus aurantifolia* | — | 6 | — | — | — | — |  |
| 330 | Thujopsis dolabrata (wood), essential oil | *Thujopsis dolabrata* | — | 5 | — | — | — | — |  |
| 331 | Cinnamomum camphora (wood), essential oil | *Cinnamomum camphora* | — | 5 | — | — | — | — |  |
| 332 | Aquilaria crassna (wood), essential oil | *Aquilaria crassna* | — | 8 | — | — | — | — |  |
| 333 | Magnolia alba (leaf), essential oil | *Magnolia alba* | — | 4 | — | — | — | — |  |
| 334 | Magnolia grandiflora (flower), essential oil | *Magnolia grandiflora* | — | — | — | — | — | — |  |
| 336 | Citrus clementina (peel), essential oil | *Citrus clementina* | — | 6 | — | — | — | — |  |
| 339 | Leptospermum scoparium (leaf), essential oil | *Leptospermum scoparium* | — | 6 | — | — | — | — |  |
| 340 | Matricaria recutita (flower), essential oil | *Matricaria recutita* | — | 7 | — | — | — | — |  |
| 341 | Ormenis multicaulis (aerial parts), essential oil | *Ormenis multicaulis* | — | — | — | — | — | — |  |
| 342 | Anthemis nobilis (flower), essential oil | *Anthemis nobilis* | — | 7 | — | — | — | — |  |
| 343 | Origanum majorana (flower), essential oil | *Origanum majorana* | — | 6 | — | — | — | — |  |
| 344 | Melissa officinalis (aerial parts), essential oil | *Melissa officinalis* | — | 7 | — | — | — | — |  |
| 345 | Mentha arvensis (leaf), essential oil | *Mentha arvensis* | — | 7 | — | — | — | — |  |
| 346 | Mentha citrata (leaf), essential oil | *Mentha citrata* | — | 6 | — | — | — | — |  |
| 347 | Mentha piperita (leaf), essential oil | *Mentha piperita* | — | 7 | — | — | — | — |  |
| 348 | Mentha polegium (leaf), essential oil | *Mentha polegium* | — | — | — | — | — | — |  |
| 349 | Mentha spicata (leaf), essential oil | *Mentha spicata* | — | 7 | — | — | — | — |  |
| 350 | Achillea millefolium (flowering tops), essential oil | *Achillea millefolium* | — | 6 | — | — | — | — |  |
| 351 | Acacia decurrens (flowers), essential oil | *Acacia decurrens* | — | — | — | — | — | — |  |
| 353 | Backhousia citriodora (leaf), essential oil | *Backhousia citriodora* | — | 8 | — | — | — | — |  |
| 354 | Myrtus communis (leaf, red), essential oil | *Myrtus communis* | — | 6 | — | — | — | — |  |
| 355 | Myrtus communis (leaf, green), essential oil | *Myrtus communis* | — | 6 | — | — | — | — |  |
| 356 | Citrus aurantium (peel), essential oil | *Citrus aurantium* | — | 5 | — | — | — | — |  |
| 359 | Cyperus scariosus (root), essential oil | *Cyperus scariosus* | — | 6 | — | — | — | — |  |
| 360 | Melaleuca viridiflora (leaf), essential oil | *Melaleuca viridiflora* | — | 5 | — | — | — | — |  |
| 361 | Myristica fragrans (grain), essential oil | *Myristica fragrans* | — | 6 | — | — | — | — |  |
| 363 | Origanum vulgare (leaf), essential oil | *Origanum vulgare* | — | 8 | — | — | — | — |  |
| 365 | Cymbopogon martini (aerial parts), essential oil | *Cymbopogon martini* | — | 6 | — | — | — | — |  |
| 366 | Aniba rosaeodora (wood), essential oil | *Aniba rosaeodora* | — | 5 | — | — | — | — |  |
| 367 | Fokienia hodginsii (wood), essential oil | *Fokienia hodginsii* | — | 5 | — | — | — | — |  |
| 368 | Bursera graveolens (fruit), essential oil | *Bursera graveolens* | — | 6 | — | — | — | — |  |
| 369 | Petroselinum crispum (seed), essential oil | *Petroselinum crispum* | — | 7 | — | — | — | — |  |
| 370 | Citrus aurantium (leaf), essential oil | *Citrus aurantium* | — | 5 | — | — | — | — |  |
| 373 | Citrus aurantium (leaves), essential oil | *Citrus aurantium* | — | 5 | — | — | — | — |  |
| 374 | Picea mariana (aerial parts), essential oil | *Picea mariana* | — | 5 | — | — | — | — |  |
| 375 | Piper nigrum (fruit, white), essential oil | *Piper nigrum* | — | — | — | — | — | — |  |
| 376 | Pimenta officinalis (leaf), essential oil | *Pimenta officinalis* | — | 7 | — | — | — | — |  |
| 377 | Piper cubeba (fruit), essential oil | *Piper cubeba* | — | 5 | — | — | — | — |  |
| 378 | Piper nigrum (fruit, black), essential oil | *Piper nigrum* | — | 6 | — | — | — | — |  |
| 379 | Piper nigrum (fruit, green), essential oil | *Piper nigrum* | — | — | — | — | — | — |  |
| 380 | Pinus sibirica (needles), essential oil | *Pinus sibirica* | — | — | — | — | — | — |  |
| 381 | Pinus sylvestris (needles), essential oil | *Pinus sylvestris* | — | 5 | — | — | — | — |  |
| 382 | Citrus paradisi (peel, white), essential oil | *Citrus paradisi* | — | 5 | — | — | — | — |  |
| 383 | Citrus paradisi (peel, pink), essential oil | *Citrus paradisi* | — | 5 | — | — | — | — |  |
| 384 | Ravensara aromatica (leaf), essential oil | *Ravensara aromatica* | — | — | — | — | — | — |  |
| 385 | Cinnamomum camphora (leaf), essential oil | *Cinnamomum camphora* | — | 6 | — | — | — | — |  |
| 386 | Rosmarinus officinalis (leaf, ct. camphor), essential oil | *Rosmarinus officinalis* | — | 6 | — | — | — | — |  |
| 387 | Rosmarinus officinalis (leaf, ct. cineole), essential oil | *Rosmarinus officinalis* | — | 6 | — | — | — | — |  |
| 388 | Rosa damascena (flower), essential oil | *Rosa damascena* | — | — | — | — | — | — |  |
| 390 | Pelargonium capitatum (leaf), essential oil | *Pelargonium capitatum* | — | — | — | — | — | — |  |
| 391 | Ruta graveolens (buds and leaves), essential oil | *Ruta graveolens* | — | — | — | — | — | — |  |
| 392 | Salvia apiana (leaf), essential oil | *Salvia apiana* | — | — | — | — | — | — |  |
| 394 | Salvia sclarea (aerial parts), essential oil | *Salvia sclarea* | — | 6 | — | — | — | — |  |
| 395 | Santalum album (heartwood), essential oil | *Santalum album* | — | 6 | — | — | — | — |  |
| 396 | Cinnamosma fragrans (leaf), essential oil | *Cinnamosma fragrans* | — | — | — | — | — | — |  |
| 397 | Apium graveolens (seed), essential oil | *Apium graveolens* | — | 8 | — | — | — | — |  |
| 398 | Tagetes minuta (flower), essential oil | *Tagetes minuta* | — | 8 | — | — | — | — |  |
| 399 | Tanacetum vulgare (flower), essential oil | *Tanacetum vulgare* | — | — | — | — | — | — |  |
| 400 | Thymus vulgaris (flowers and leaves), essential oil | *Thymus vulgaris* | — | 7 | — | — | — | — |  |
| 401 | Thymus hyemalis (aerial parts), essential oil | *Thymus hyemalis* | — | — | — | — | — | — |  |
| 402 | Thymus mastichina (leaves), essential oil | *Thymus mastichina* | — | — | — | — | — | — |  |
| 403 | Thymus zygis (flower), essential oil | *Thymus zygis* | — | 8 | — | — | — | — |  |
| 404 | Turpentine essential (resin), essential oil | *Turpentine essential* | — | 5 | — | — | — | — |  |
| 405 | Tsuga canadensis (leaves), essential oil | *Tsuga canadensis* | — | — | — | — | — | — |  |
| 406 | Thuja occidentalis (leaves), essential oil | *Thuja occidentalis* | — | 7 | — | — | — | — |  |
| 407 | Valeriana officinalis (root), essential oil | *Valeriana officinalis* | — | 7 | — | — | — | — |  |
| 410 | Vitis vinifera (fruits, white wine), essential oil | *Vitis vinifera* | — | — | — | — | — | — |  |
| 411 | Cananga odorata (flower, first distillation), essential oil | *Cananga odorata* | — | 7 | — | — | — | — |  |
| 412 | Cananga odorata (flower, second distillation), essential oil | *Cananga odorata* | — | 6 | — | — | — | — |  |
| 413 | Cananga odorata (flower, third distillation), essential oil | *Cananga odorata* | — | 6 | — | — | — | — |  |
| 414 | Cananga odorata (flower, complete), essential oil | *Cananga odorata* | — | 7 | — | — | — | — |  |
| 415 | Cananga odorata (flower, extra), essential oil | *Cananga odorata* | — | 7 | — | — | — | — |  |
| 416 | Citrus junos (peel), essential oil | *Citrus junos* | — | 6 | — | — | — | — |  |
| 417 | Daucus carota (seed), essential oil | *Daucus carota* | — | 6 | — | — | — | — |  |
| 418 | Styrax benzoin (resin), dilution | *Styrax benzoin* | — | — | — | — | — | — |  |

## No entran

| n | Producto | Por qué |
|---|---|---|
| 249 | Citrus bergamia (peel), essential oil | ya es un común: Bergamot, bergapten-free (798f4933-21c6-5840-a52b-8f4d4bf10c64) |
| 298 | Guaiacum officinale (wood), essential oil | el mismo material que el n.º 297: the same guaiacwood oil, sold at 50 % in DPG (una especificación, V3-85) |
| 337 | Citrus reticulata (peel), essential oil | ya es un común: Mandarin (19f5072c-dcc5-5f96-a226-269c5b413c6d) |
| 352 | Commiphora myrrha (resin), essential oil | ya es un común: Myrrh, essential oil (7c27cec2-aaf6-510f-a49f-7e94fd626f20) |
| 389 | Rosa damascena (flower), essential oil | el mismo material que el n.º 388: the same Rosa damascena flower oil; «Otto Bulgaria» and «Extra» are origin and grade (una especificación, V3-85) |
