# Tanda 48 · Los aceites esenciales de Maese Lab que faltaban, en lo común

*Generada por `migracion-v3/tanda-48-maese-naturales.ts 48` sobre lo común de `17e0b5f` **con las tandas 46 a 47** (se aprueba después de ellas), desde `migracion-v3/web/maese-altas/propuesta-48.csv`. Escribe `v3/datos/materials.csv`, `material_categories.csv`, `material_descriptors.csv` y `material_doses.csv` enteros, con estos añadidos: lo de antes no cambia. Sin aprobar.*

**Por qué** (V3-99): el usuario, 2026-11-06: «creo que es clave tener todo el glosario de maese dentro de la app» y «lo importante es que se contraste las altas de referencia […] y que en ambos casos se complete el alta».

**Cómo:** como la tanda 47. La ficha de Maese Lab (tanda 45: especie por el INCI, parte, método, origen, CAS, pureza y perfil, citados); hasta dos páginas de referencia por producto, de la misma especie y parte (`migracion-v3/web/maese-altas/web-48-*.csv`); PerfuMate en local. Una página de otra especie o parte no cuenta. Un material por identidad (V3-85): especie, parte, proceso, tratamiento y quimiotipo; dos productos que solo cambian de origen o de grado son el mismo material. El nombre, el común en inglés de la referencia o, si no lo hay, la especie y la parte.

**Resultado:** 160 materiales nuevos; 4 no entran (ya son un común, o el mismo material que otro de la tanda). Con familia 70, impacto 124, fuerza en palabras 42, horas en tira 55, nivel 39; 22 usos habituales y 130 descriptores.

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
| 244 | Neroli, reduction | *Citrus aurantium* | floral | — | — | — | — | — |  |
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
| 265 | Cedarwood, essential oil | *Juniperus virginiana* | woody | 5 | — | 380 h | base | — |  |
| 266 | Cedarwood, essential oil | *Cedrus deodara* | woody | 5 | medium | 400 h | — | 5 % |  |
| 268 | Cypress leaf, essential oil | *Cupressus sempervirens* | — | 5 | medium | 44 h | — | 2 % |  |
| 269 | Blue Cypress, essential oil | *Callitris intratropica* | woody | 5 | medium | 120 h | base | — |  |
| 271 | Lemongrass, essential oil | *Cymbopogon citratus* | citrus | — | medium | 92 h | — | 4 % |  |
| 272 | Cymbopogon nardus (herb), essential oil | *Cymbopogon nardus* | — | 7 | — | — | — | — |  |
| 273 | Syzygium aromaticum l. bud, essential oil | *Eugenia caryophyllus* | spicy | 8 | medium | 188 h | heart_base | — | family, strength |
| 274 | Syzygium aromaticum l. leaf, essential oil | *Eugenia caryophyllus* | spicy | 8 | medium | 116 h | — | — |  |
| 275 | Cuminum cyminum (seed), essential oil | *Cuminum cyminum* | spicy | 8 | high | 408 h | — | — |  |
| 276 | Curcuma longa (root), essential oil | *Curcuma longa* | spicy | 6 | — | — | — | — |  |
| 277 | Murraya koenigii (leaf), essential oil | *Murraya koenigii* | green | 7 | — | — | — | — |  |
| 278 | Canarium luzonicum (resin), essential oil | *Canarium luzonicum* | — | 5 | — | — | — | — |  |
| 281 | Anethum graveolens (leaf), essential oil | *Anethum graveolens* | green | 6 | — | — | — | — |  |
| 282 | Dill seed, essential oil | *Anethum graveolens* | green | 7 | — | — | — | — |  |
| 283 | Artemisia dracunculus (plant), essential oil | *Artemisia dracunculus* | spicy | 7 | medium | 12 h | — | — |  |
| 284 | Eucalyptus citriodora (leaf), essential oil | *Eucalyptus citriodora* | green | 7 | — | — | — | — |  |
| 285 | Eucalyptus dives (leaf), essential oil | *Eucalyptus dives* | spicy | — | — | — | — | — |  |
| 286 | Eucalyptus globulus (leaf), essential oil | *Eucalyptus globulus* | green | 7 | high | 4 h | — | — |  |
| 287 | Eucalyptus radiata (leaf), essential oil | *Eucalyptus radiata* | green | — | medium | 7 h | — | — |  |
| 288 | Eucalyptus smithii (leaf), essential oil | *Eucalyptus smithii* | — | — | — | — | — | — |  |
| 289 | Eucalyptus staigeriana (leaf), essential oil | *Eucalyptus staigeriana* | fruity | — | — | — | — | — |  |
| 290 | Hedychium spicatum (flower), essential oil | *Hedychium spicatum* | — | 6 | — | — | — | — |  |
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
| 303 | Helichrysum italicum (flower, var. picardii, Spain), essential oil | *Helichrysum italicum* | — | 7 | — | — | — | — |  |
| 304 | Foeniculum vulgare (whole plant), essential oil | *Foeniculum vulgare* | — | 7 | — | — | — | — |  |
| 305 | Sweet fennel seed, essential oil | *Foeniculum vulgare* | spicy | 7 | medium | 24 h | heart | 5 % |  |
| 306 | Hyssop, essential oil | *Hyssopus officinalis* | green | 7 | medium | 92 h | base | — | strength |
| 307 | Hyssopus officinalis (flowers and leaves), essential oil | *Hyssopus officinalis* | — | 7 | — | — | heart | — |  |
| 309 | Boswellia serrata (resin), essential oil | *Boswellia serrata* | woody | 6 | — | — | — | — |  |
| 311 | Nardostachys jatamansi (root), essential oil | *Nardostachys jatamansi* | — | 6 | medium | 240 h | base | — |  |
| 312 | Ginger root, essential oil | *Zingiber officinale* | spicy | 7 | medium | 292 h | — | 8 % | tenacity_hours |
| 313 | Zingiber cassumunar (root), essential oil | *Zingiber cassumunar* | — | 5 | — | 20 h | — | — |  |
| 314 | Cedrelopsis grevei (bark), essential oil | *Cedrelopsis grevei* | woody | 5 | — | 72 h | base | — |  |
| 315 | Laurus nobilis (leaf), essential oil | *Laurus nobilis* | — | 7 | medium | 117 h | base | — |  |
| 317 | Spike lavender, essential oil | *Lavandula latifolia* | green | 6 | medium | 184 h | top | 0.2 % | tier |
| 319 | Lavandin abrialis, essential oil | *Lavandula hybrida* | floral | 6 | — | 4 h | top | — |  |
| 320 | Lavandula hybrida (flower, lavandin extra), essential oil | *Lavandula hybrida* | — | 6 | — | 20 h | — | — |  |
| 321 | Grosso lavandin (lavandin grosso), essential oil | *Lavandula hybrida* | floral | 6 | high | 4 h | top | — |  |
| 322 | Cymbopogon flexuosus (plant), essential oil | *Cymbopogon flexuosus* | citrus | 7 | — | 11 h | — | — |  |
| 323 | Pistacia lentiscus (resin), essential oil | *Pistacia lentiscus* | — | 5 | — | — | — | — |  |
| 324 | Levisticum officinale (root), essential oil | *Levisticum officinale* | — | 9 | very_high | 240 h | base | — | strength |
| 325 | Lime (furocoumarin-free), essential oil | *Citrus aurantifolia* | — | 6 | — | — | — | — |  |
| 326 | Lime, essential oil | *Citrus aurantifolia* | citrus | 6 | medium | 20 h | top_heart | 15 % | tenacity_hours |
| 327 | Citrus hystrix (peel), essential oil | *Citrus hystrix* | citrus | 7 | — | — | — | — |  |
| 328 | Lime, essential oil | *Citrus aurantifolia* | — | 6 | — | — | — | — |  |
| 330 | Thujopsis dolabrata (wood), essential oil | *Thujopsis dolabrata* | woody | 5 | medium | 100 h | heart_base | — |  |
| 331 | Ho Wood, essential oil | *Cinnamomum camphora* | — | 5 | — | — | top | — |  |
| 332 | Aquilaria crassna (wood), essential oil | *Aquilaria crassna* | woody | 8 | — | — | base | — |  |
| 333 | Michelia alba dc. leaf, essential oil | *Magnolia alba* | green | 4 | — | 5 h | heart | — |  |
| 334 | Magnolia grandiflora (flower), essential oil | *Magnolia grandiflora* | green | — | — | — | top_heart | — |  |
| 336 | Clementine mandarin peel, essential oil | *Citrus clementina* | citrus | 6 | — | 6 h | — | 10 % |  |
| 337 | Tangor murcote peel, essential oil | *Citrus reticulata* | — | 5 | — | — | — | — |  |
| 339 | Leptospermum scoparium (leaf), essential oil | *Leptospermum scoparium* | woody | 6 | — | — | top_heart | — |  |
| 340 | Matricaria recutita (flower), essential oil | *Matricaria recutita* | green | 7 | — | — | — | — | physical_state |
| 341 | Ormenis multicaulis (aerial parts), essential oil | *Ormenis multicaulis* | green | — | — | — | — | — |  |
| 342 | Anthemis nobilis (flower), essential oil | *Anthemis nobilis* | green | 7 | high | 4 h | heart | — | physical_state |
| 343 | Origanum majorana (flower), essential oil | *Origanum majorana* | — | 6 | — | 12 h | heart | — |  |
| 344 | Melissa officinalis (aerial parts), essential oil | *Melissa officinalis* | citrus | 7 | medium | 120 h | top_heart | — |  |
| 345 | Mentha arvensis (leaf), essential oil | *Mentha arvensis* | — | 7 | high | 16 h | heart | 8 % |  |
| 346 | Bergamot mint herb, essential oil | *Mentha citrata* | green | 6 | — | — | top | — |  |
| 347 | Mentha piperita (leaf), essential oil | *Mentha piperita* | green | 7 | medium | 16 h | top | 6 % |  |
| 348 | Mentha polegium (leaf), essential oil | *Mentha polegium* | green | — | medium | 168 h | top | 1 % |  |
| 349 | Mentha spicata (leaf), essential oil | *Mentha spicata* | green | 7 | medium | 36 h | top_heart | 8 % |  |
| 350 | Achillea millefolium (flowering tops), essential oil | *Achillea millefolium* | green | 6 | medium | 396 h | top_heart | — |  |
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
| 298 | Guaiacwood, essential oil | el mismo material que el n.º 297: the same guaiacwood oil, sold at 50 % in DPG (una especificación, V3-85) |
| 352 | Commiphora myrrha (resin), essential oil | ya es un común: Myrrh, essential oil (7c27cec2-aaf6-510f-a49f-7e94fd626f20) |
| 389 | Rosa damascena (flower), essential oil | el mismo material que el n.º 388: the same Rosa damascena flower oil; «Otto Bulgaria» and «Extra» are origin and grade (una especificación, V3-85) |
