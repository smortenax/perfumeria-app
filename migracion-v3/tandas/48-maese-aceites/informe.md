# Tanda 48 · Los aceites esenciales de Maese Lab que faltaban, en lo común

*Generada por `migracion-v3/tanda-48-maese-naturales.ts 48` sobre lo común de `768a9bd` **con las tandas 46 a 47** (se aprueba después de ellas), desde `migracion-v3/web/maese-altas/propuesta-48.csv`. Escribe `v3/datos/materials.csv`, `material_categories.csv`, `material_descriptors.csv` y `material_doses.csv` enteros, con estos añadidos: lo de antes no cambia. Sin aprobar.*

**Por qué** (V3-100): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** como la tanda 47. La ficha de Maese Lab (tanda 45: especie por el INCI, parte, método, origen, CAS, pureza y perfil, citados); hasta dos páginas de referencia por producto, de la misma especie y parte (`migracion-v3/web/maese-altas/web-48-*.csv`); PerfuMate en local. Una página de otra especie o parte no cuenta. Un material por identidad (V3-85): especie, parte, proceso, tratamiento y quimiotipo; dos productos que solo cambian de origen o de grado son el mismo material. El nombre, el común en inglés de la referencia o, si no lo hay, la especie y la parte.

**Resultado:** 159 materiales nuevos; 5 no entran (ya son un común, o el mismo material que otro de la tanda). Con familia 126, impacto 123, fuerza en palabras 64, horas en tira 96, nivel 74; 37 usos habituales y 212 descriptores.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia (por `family_palette.csv`): es una lectura de la sesión.
- **Las tinturas y diluciones** van sin impacto (V3-97); la estimación desde el material puro está en la tanda 45 (`consenso.csv`).
- **Cómo se guarda la ficha de la tienda** (para el filtro por proveedor) está pendiente de tu respuesta en el hilo.

| n | Material | Especie | Familia | Impacto | Fuerza | Horas | Nivel | Uso hasta | Disputado |
|---|---|---|---|---|---|---|---|---|---|
| 226 | Birch tar, essential oil | *Betula pendula* | woody | 9 | — | 24 h | heart | — | tenacity_hours |
| 227 | Betula lenta (bark), essential oil | *Betula lenta* | green | — | medium | 12 h | — | 15 % |  |
| 228 | Siberian fir, essential oil | *Abies sibirica* | gourmand | 6 | medium | 16 h | top_heart | 12 % | family |
| 229 | Agarwood, essential oil | *Aquilaria malaccensis* | — | 8 | — | — | base | — |  |
| 231 | Winter savory, essential oil | *Satureja montana* | spicy | 8 | — | — | — | — |  |
| 232 | Allium sativum (bulb), essential oil | *Allium sativum* | — | — | — | — | — | — |  |
| 233 | Trachyspermum ammi fruit, essential oil | *Carum copticum* | green | 8 | — | — | — | 2 % |  |
| 234 | Ocimum basilicum (leaf), essential oil | *Ocimum basilicum* | green | 7 | — | — | — | — |  |
| 235 | Cinnamomum camphora (bark), essential oil | *Cinnamomum camphora* | green | 7 | high | 4 h | — | 5 % | tenacity_hours |
| 236 | Carum carvi (seed), essential oil | *Carum carvi* | green | 7 | medium | 20 h | — | — | family |
| 237 | Amyris balsamifera (bark), essential oil | *Amyris balsamifera* | woody | 4 | — | — | — | — |  |
| 238 | Angelica archangelica (root), essential oil | *Angelica archangelica* | animal | 7 | medium | 31 h | — | — |  |
| 239 | Illicium verum (fruit), essential oil | *Illicium verum* | spicy | 7 | — | — | — | 8 % |  |
| 240 | Pimpinella anisum (seed), essential oil | *Pimpinella anisum* | spicy | 7 | medium | 68 h | — | 8 % |  |
| 241 | Tea tree, essential oil | *Melaleuca alternifolia* | spicy | 6 | — | 44 h | — | — |  |
| 243 | Artemisia annua (leaf), essential oil | *Artemisia annua* | green | — | — | — | — | — |  |
| 244 | Neroli, reduction | *Citrus aurantium* | floral | — | — | — | — | — | family |
| 245 | Copaiba balsam, essential oil | *Copaifera officinalis* | woody | 4 | — | 101 h | — | — | family |
| 246 | Dipterocarpus turbinatus (resin), essential oil | *Dipterocarpus turbinatus* | woody | 4 | medium | 400 h | — | 20 % | family |
| 248 | Myroxylon pereirae (balsam), essential oil | *Myroxylon pereirae* | gourmand | 7 | medium | 400 h | — | — |  |
| 250 | Bergamot peel, essential oil | *Citrus bergamia* | citrus | 6 | medium | 4 h | top | — |  |
| 251 | Barosma betulina (leaf), essential oil | *Barosma betulina* | green | 9 | high | 176 h | base | 0.8 % | tenacity_hours |
| 252 | Cabreuva wood, essential oil | *Myrocarpus fastigiatus* | woody | — | — | 100 h | base | — |  |
| 253 | Calamus, essential oil | *Acorus calamus* | green | 7 | — | 120 h | base | — |  |
| 257 | Cassia bark, essential oil | *Cinnamomun cassia* | spicy | 8 | medium | 160 h | — | 1 % |  |
| 258 | Vitis vinifera (fruits, cava / champagne), essential oil | *Vitis vinifera* | — | — | — | — | — | — |  |
| 259 | Melaleuca leucadendron (leaf), essential oil | *Melaleuca leucadendron* | green | 6 | — | — | — | — |  |
| 260 | Onion, essential oil | *Allium cepa* | transformed | — | — | — | — | — |  |
| 263 | Cedrus libani (bark), essential oil | *Cedrus libani* | — | — | — | — | — | — |  |
| 264 | Cedarwood, essential oil | *Juniperus mexicana* | woody | 5 | — | 16 h | base | — | tenacity_hours |
| 265 | Cedarwood, essential oil | *Juniperus virginiana* | woody | 5 | — | 380 h | base | — |  |
| 266 | Cedarwood, essential oil | *Cedrus deodara* | woody | 5 | medium | 400 h | — | 5 % |  |
| 268 | Cypress leaf, essential oil | *Cupressus sempervirens* | woody | 5 | medium | 44 h | — | 2 % |  |
| 269 | Blue Cypress, essential oil | *Callitris intratropica* | woody | 5 | medium | 120 h | base | — |  |
| 271 | Lemongrass, essential oil | *Cymbopogon citratus* | citrus | — | medium | 92 h | — | 4 % |  |
| 272 | Cymbopogon nardus (herb), essential oil | *Cymbopogon nardus* | — | 7 | — | — | — | — |  |
| 273 | Syzygium aromaticum l. bud, essential oil | *Eugenia caryophyllus* | spicy | 8 | medium | 188 h | heart_base | — | family, strength |
| 274 | Syzygium aromaticum l. leaf, essential oil | *Eugenia caryophyllus* | spicy | 8 | medium | 116 h | — | — |  |
| 275 | Cuminum cyminum (seed), essential oil | *Cuminum cyminum* | spicy | 8 | high | 408 h | — | — |  |
| 276 | Curcuma longa (root), essential oil | *Curcuma longa* | spicy | 6 | — | — | — | — |  |
| 277 | Murraya koenigii (leaf), essential oil | *Murraya koenigii* | green | 7 | — | — | — | — |  |
| 278 | Canarium luzonicum (resin), essential oil | *Canarium luzonicum* | — | 5 | — | 20 h | — | — |  |
| 281 | Anethum graveolens (leaf), essential oil | *Anethum graveolens* | green | 6 | — | 108 h | — | — |  |
| 282 | Dill seed, essential oil | *Anethum graveolens* | green | 7 | — | — | — | — | family |
| 283 | Artemisia dracunculus (plant), essential oil | *Artemisia dracunculus* | spicy | 7 | medium | 12 h | — | — | tenacity_hours |
| 284 | Eucalyptus citriodora (leaf), essential oil | *Eucalyptus citriodora* | green | 7 | — | — | — | — |  |
| 285 | Eucalyptus dives (leaf), essential oil | *Eucalyptus dives* | spicy | — | — | — | — | — |  |
| 286 | Eucalyptus globulus (leaf), essential oil | *Eucalyptus globulus* | green | 7 | high | 4 h | — | — |  |
| 287 | Eucalyptus radiata (leaf), essential oil | *Eucalyptus radiata* | green | — | medium | 7 h | — | — |  |
| 288 | Eucalyptus smithii (leaf), essential oil | *Eucalyptus smithii* | — | — | — | — | — | — |  |
| 289 | Eucalyptus staigeriana (leaf), essential oil | *Eucalyptus staigeriana* | fruity | — | — | — | — | — |  |
| 290 | Hedychium spicatum (flower), essential oil | *Hedychium spicatum* | woody | 6 | — | — | — | — |  |
| 291 | Frangipani, essential oil | *Plumeria alba* | — | — | medium | 50 h | base | — |  |
| 293 | Gaultheria fragrantissima (leaf), essential oil | *Gaultheria fragrantissima* | — | 8 | — | — | — | — |  |
| 294 | Geranium, essential oil | *Pelargonium graveolens* | floral | 7 | medium | 28 h | heart | — |  |
| 295 | Geranium (var. China), essential oil | *Pelargonium graveolens* | floral | 7 | — | — | — | — |  |
| 296 | Pelargonium graveolens (aerial parts, var. Egypt), essential oil | *Pelargonium graveolens* | floral | 6 | medium | 28 h | — | — |  |
| 297 | Guaiacwood, essential oil | *Guaiacum officinale* | woody | 4 | medium | 400 h | — | 10 % |  |
| 299 | Commiphora mukul (resin), essential oil | *Commiphora mukul* | — | — | — | — | — | — |  |
| 300 | Hamamelis virginiana (leaf), essential oil | *Hamamelis virginiana* | — | — | — | — | — | — |  |
| 301 | Helichrysum italicum (flower), essential oil | *Helichrysum italicum* | green | 7 | — | — | — | — |  |
| 302 | Helichrysum gymnocephalum (flower), essential oil | *Helichrysum gymnocephalum* | — | — | — | — | — | — |  |
| 303 | Helichrysum italicum (flower, var. picardii, Spain), essential oil | *Helichrysum italicum* | green | 7 | — | — | — | — |  |
| 304 | Foeniculum vulgare (whole plant), essential oil | *Foeniculum vulgare* | spicy | 7 | — | — | — | — |  |
| 305 | Sweet fennel seed, essential oil | *Foeniculum vulgare* | spicy | 7 | medium | 24 h | heart | 5 % |  |
| 306 | Hyssop, essential oil | *Hyssopus officinalis* | green | 7 | medium | 92 h | base | — | strength |
| 307 | Hyssopus officinalis (flowers and leaves), essential oil | *Hyssopus officinalis* | green | 7 | — | 91 h | heart | — |  |
| 309 | Boswellia serrata (resin), essential oil | *Boswellia serrata* | woody | 6 | — | — | — | — |  |
| 311 | Nardostachys jatamansi (root), essential oil | *Nardostachys jatamansi* | — | 6 | medium | 240 h | base | — | tenacity_hours |
| 312 | Ginger root, essential oil | *Zingiber officinale* | spicy | 7 | medium | 292 h | — | 8 % | tenacity_hours |
| 313 | Zingiber cassumunar (root), essential oil | *Zingiber cassumunar* | — | 5 | — | 20 h | — | — |  |
| 314 | Cedrelopsis grevei (bark), essential oil | *Cedrelopsis grevei* | woody | 5 | — | 72 h | base | — |  |
| 315 | Laurus nobilis (leaf), essential oil | *Laurus nobilis* | green | 7 | medium | 117 h | base | — |  |
| 317 | Spike lavender, essential oil | *Lavandula latifolia* | green | 6 | medium | 184 h | top | 0.2 % | tier, tenacity_hours |
| 319 | Lavandin abrialis, essential oil | *Lavandula hybrida* | floral | 6 | — | 4 h | top | — | family, tenacity_hours |
| 320 | Lavandula hybrida (flower, lavandin extra), essential oil | *Lavandula hybrida* | green | 6 | — | 20 h | — | — | tenacity_hours |
| 321 | Grosso lavandin (lavandin grosso), essential oil | *Lavandula hybrida* | floral | 6 | high | 4 h | top | — | family, tenacity_hours |
| 322 | Cymbopogon flexuosus (plant), essential oil | *Cymbopogon flexuosus* | citrus | 7 | — | 11 h | — | — | tenacity_hours |
| 323 | Pistacia lentiscus (resin), essential oil | *Pistacia lentiscus* | gourmand | 5 | — | — | — | — |  |
| 324 | Levisticum officinale (root), essential oil | *Levisticum officinale* | — | 9 | very_high | 240 h | base | — | tenacity_hours, strength |
| 325 | Lime (furocoumarin-free), essential oil | *Citrus aurantifolia* | citrus | 6 | — | 20 h | — | — |  |
| 326 | Lime, essential oil | *Citrus aurantifolia* | citrus | 6 | medium | 20 h | top_heart | 15 % | tenacity_hours |
| 327 | Citrus hystrix (peel), essential oil | *Citrus hystrix* | citrus | 7 | — | — | — | — |  |
| 328 | Lime, essential oil | *Citrus aurantifolia* | citrus | 6 | — | 20 h | — | — |  |
| 330 | Thujopsis dolabrata (wood), essential oil | *Thujopsis dolabrata* | woody | 5 | medium | 100 h | heart_base | — |  |
| 331 | Ho Wood, essential oil | *Cinnamomum camphora* | — | 5 | — | — | top | — |  |
| 332 | Aquilaria crassna (wood), essential oil | *Aquilaria crassna* | woody | 8 | — | — | base | — |  |
| 333 | Michelia alba dc. leaf, essential oil | *Magnolia alba* | green | 4 | — | 5 h | heart | — |  |
| 334 | Magnolia grandiflora (flower), essential oil | *Magnolia grandiflora* | green | — | — | — | top_heart | — |  |
| 336 | Clementine mandarin peel, essential oil | *Citrus clementina* | citrus | 6 | — | 6 h | — | 10 % |  |
| 337 | Tangor murcote peel, essential oil | *Citrus reticulata* | citrus | 5 | — | 8 h | — | — |  |
| 339 | Leptospermum scoparium (leaf), essential oil | *Leptospermum scoparium* | woody | 6 | — | 40 h | top_heart | — |  |
| 340 | Matricaria recutita (flower), essential oil | *Matricaria recutita* | green | 7 | — | — | — | — | physical_state |
| 341 | Ormenis multicaulis (aerial parts), essential oil | *Ormenis multicaulis* | green | — | — | — | — | — |  |
| 342 | Anthemis nobilis (flower), essential oil | *Anthemis nobilis* | green | 7 | high | 4 h | heart | — | physical_state |
| 343 | Origanum majorana (flower), essential oil | *Origanum majorana* | green | 6 | — | 12 h | heart | — |  |
| 344 | Melissa officinalis (aerial parts), essential oil | *Melissa officinalis* | green | 7 | medium | 120 h | top_heart | — | family |
| 345 | Mentha arvensis (leaf), essential oil | *Mentha arvensis* | green | 7 | high | 16 h | heart | 8 % |  |
| 346 | Bergamot mint herb, essential oil | *Mentha citrata* | green | 6 | — | — | top | — |  |
| 347 | Mentha piperita (leaf), essential oil | *Mentha piperita* | green | 7 | medium | 16 h | top | 6 % |  |
| 348 | Mentha polegium (leaf), essential oil | *Mentha polegium* | green | — | medium | 168 h | top | 1 % |  |
| 349 | Mentha spicata (leaf), essential oil | *Mentha spicata* | green | 7 | medium | 36 h | top_heart | 8 % |  |
| 350 | Achillea millefolium (flowering tops), essential oil | *Achillea millefolium* | green | 6 | medium | 408 h | top_heart | — |  |
| 351 | Acacia decurrens (flowers), essential oil | *Acacia decurrens* | — | — | — | — | — | — |  |
| 353 | Backhousia citriodora (leaf), essential oil | *Backhousia citriodora* | citrus | 8 | — | — | — | — | physical_state |
| 354 | Myrtle (red), essential oil | *Myrtus communis* | green | 6 | — | — | — | — |  |
| 355 | Myrtus communis (leaf, green), essential oil | *Myrtus communis* | green | 6 | — | — | — | — |  |
| 356 | Citrus aurantium (peel), essential oil | *Citrus aurantium* | citrus | 5 | medium | 32 h | heart | — | tenacity_hours |
| 359 | Cyperus scariosus (root), essential oil | *Cyperus scariosus* | woody | 6 | — | — | heart_base | — |  |
| 360 | Niaouli - Melaleuca quinquenervia viridiflora ct cineole, essential oil | *Melaleuca viridiflora* | green | 5 | — | 3 h | top | — |  |
| 361 | Myristica fragrans (grain), essential oil | *Myristica fragrans* | spicy | 6 | medium | 52 h | top_heart | 2 % | family, strength |
| 363 | Oregano - Organic EO, Origanum vulgare L., essential oil | *Origanum vulgare* | — | 8 | — | 72 h | top_heart | — |  |
| 365 | Palmarosa, essential oil | *Cymbopogon martini* | floral | 6 | medium | 380 h | base | — | tenacity_hours |
| 366 | Bois de rose, essential oil | *Aniba rosaeodora* | floral | 5 | medium | 12 h | heart | 20 % | family |
| 367 | Siam wood, essential oil | *Fokienia hodginsii* | woody | 5 | — | — | base | — |  |
| 368 | Palo Santo Fruit, essential oil | *Bursera graveolens* | woody | 6 | — | — | top | — |  |
| 369 | Petroselinum crispum (seed), essential oil | *Petroselinum crispum* | green | 7 | — | — | — | — |  |
| 370 | Petitgrain bigarade, essential oil | *Citrus aurantium* | floral | 5 | — | — | — | 15 % | family |
| 374 | Picea mariana (aerial parts), essential oil | *Picea mariana* | green | 5 | — | — | top | 5 % | family |
| 375 | Piper nigrum (fruit, white), essential oil | *Piper nigrum* | spicy | — | — | — | — | — |  |
| 376 | Pimenta officinalis (leaf), essential oil | *Pimenta officinalis* | spicy | 7 | — | 115 h | — | — |  |
| 377 | Piper cubeba (fruit), essential oil | *Piper cubeba* | spicy | 5 | medium | 268 h | heart | 1 % | strength |
| 378 | Black pepper (black), essential oil | *Piper nigrum* | spicy | 6 | medium | 48 h | heart | 0.8 % |  |
| 379 | Piper nigrum (fruit, green), essential oil | *Piper nigrum* | — | — | — | — | top | — |  |
| 380 | Pinus sibirica (needles), essential oil | *Pinus sibirica* | — | — | — | — | — | — |  |
| 381 | Scotch pine needle, essential oil | *Pinus sylvestris* | woody | 5 | medium | 16 h | heart | 10 % |  |
| 382 | Grapefruit (white), essential oil | *Citrus paradisi* | — | 5 | high | 2 h | top | — |  |
| 383 | Grapefruit (pink), essential oil | *Citrus paradisi* | — | 5 | — | 16 h | — | — |  |
| 384 | Ravensara aromatica (leaf), essential oil | *Ravensara aromatica* | green | — | medium | 12 h | heart | — | family, physical_state |
| 385 | Ravintsara, essential oil | *Cinnamomum camphora* | green | 6 | — | — | top | — |  |
| 386 | Rosemary (ct. camphor), essential oil | *Rosmarinus officinalis* | green | 6 | medium | 4 h | — | — |  |
| 387 | Rosemary (ct. cineole), essential oil | *Rosmarinus officinalis* | — | 6 | medium | 4 h | top | 10 % |  |
| 388 | Rosa damascena (flower), essential oil | *Rosa damascena* | — | — | — | — | — | — |  |
| 390 | Pelargonium capitatum (leaf), essential oil | *Pelargonium capitatum* | — | — | — | — | — | — |  |
| 391 | Rue, essential oil | *Ruta graveolens* | green | — | — | 200 h | heart | — |  |
| 392 | White sage, essential oil | *Salvia apiana* | — | — | — | — | top_heart | — |  |
| 394 | Clary sage, essential oil | *Salvia sclarea* | green | 6 | medium | 36 h | heart | 15 % | family, tenacity_hours |
| 395 | Sandalwood, essential oil | *Santalum album* | woody | 6 | medium | 400 h | base | — | strength |
| 396 | Cinnamosma fragrans (leaf), essential oil | *Cinnamosma fragrans* | — | — | — | — | — | — |  |
| 397 | Celery seed, essential oil | *Apium graveolens* | green | 8 | medium | 400 h | heart | 4 % | tenacity_hours, strength |
| 398 | Tagetes minuta (flower), essential oil | *Tagetes minuta* | green | 8 | — | — | top | — | family |
| 399 | Tansy, essential oil | *Tanacetum vulgare* | green | — | high | 12 h | heart | — |  |
| 400 | Thyme, essential oil | *Thymus vulgaris* | green | 7 | high | 83 h | — | 2 % |  |
| 401 | Thymus hyemalis (aerial parts), essential oil | *Thymus hyemalis* | — | — | — | — | — | — |  |
| 402 | Wild marjoram, essential oil | *Thymus mastichina* | — | — | — | 12 h | heart | — |  |
| 403 | Red thyme, essential oil | *Thymus zygis* | green | 8 | medium | 172 h | — | — |  |
| 404 | Turpentine essential (resin), essential oil | *Turpentine essential* | woody | 5 | — | 2 h | — | — |  |
| 405 | Spruce, essential oil | *Tsuga canadensis* | woody | — | medium | 24 h | heart_base | 10 % |  |
| 406 | Cedarleaf, essential oil | *Thuja occidentalis* | woody | 7 | high | 8 h | — | — | family |
| 407 | Valerian rhizome, essential oil | *Valeriana officinalis* | green | 7 | — | — | — | 1 % |  |
| 410 | Vitis vinifera (fruits, white wine), essential oil | *Vitis vinifera* | — | — | — | — | — | — |  |
| 411 | Ylang Ylang I - Organic EO (first distillation), essential oil | *Cananga odorata* | floral | 7 | — | — | top_heart | — |  |
| 412 | Ylang Ylang II - Organic EO (second distillation), essential oil | *Cananga odorata* | — | 6 | — | — | top_heart | — |  |
| 413 | Ylang-Ylang III (third distillation), essential oil | *Cananga odorata* | — | 6 | — | 140 h | base | — |  |
| 414 | Ylang-Ylang Complete (complete), essential oil | *Cananga odorata* | floral | 7 | medium | 140 h | base | — |  |
| 415 | Cananga odorata (flower, extra), essential oil | *Cananga odorata* | — | 7 | — | 140 h | base | — |  |
| 416 | Yuzu peel, essential oil | *Citrus junos* | citrus | 6 | high | 24 h | top | — | family |
| 417 | Carrot seed, essential oil | *Daucus carota* | green | 6 | high | 96 h | heart | 4 % | family |
| 418 | Styrax benzoin (resin), dilution | *Styrax benzoin* | gourmand | — | — | 400 h | base | 6 % | physical_state |

## No entran

| n | Producto | Por qué |
|---|---|---|
| 249 | Citrus bergamia (peel), essential oil | ya es un común: Bergamot, bergapten-free (798f4933-21c6-5840-a52b-8f4d4bf10c64) |
| 298 | Guaiacwood, essential oil | el mismo material que el n.º 297: the same guaiacwood oil, sold at 50 % in DPG (una especificación, V3-85) |
| 352 | Myrrh, essential oil | ya es un común: Myrrh, essential oil (7c27cec2-aaf6-510f-a49f-7e94fd626f20) |
| 373 | Petitgrain bigarade, essential oil | el mismo material que el n.º 370: the same Citrus aurantium amara leaf/twig oil; Paraguay is the origin (Maese wrote «Hojas» there and «Hoja» in 370) (una especificación, V3-85) |
| 389 | Rosa damascena (flower), essential oil | el mismo material que el n.º 388: the same Rosa damascena flower oil; «Otto Bulgaria» and «Extra» are origin and grade (una especificación, V3-85) |
