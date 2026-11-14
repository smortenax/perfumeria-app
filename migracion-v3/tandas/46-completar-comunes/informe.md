# Tanda 46 · Completar los comunes que entraron a medias

*Generada por `migracion-v3/tanda-46-completar-comunes.ts` sobre lo común de `cc24d4d`, desde `migracion-v3/web/completar-comunes/propuesta.csv`. Escribe `v3/datos/materials.csv` y `material_doses.csv` enteros: solo llena campos vacíos; nada que ya tuviera valor cambia. Sin aprobar.*

**Por qué** (V3-101): el usuario, 2026-11-06: «lo importante es que se contraste las altas de referencia y se mire que falta para estos materiales y para otros que se quedaron con una "alta rapida" y no estan completos y que en ambos casos se complete el alta».

**Cómo:** `migracion-v3/web/completar-comunes/huecos.py` lista los 57 comunes con algún hueco (familia, nivel, horas en tira, fuerza, estado físico, uso). Para cada uno se leyeron en la web hasta tres páginas de referencia (`web-*.csv`, con la frase literal) y se miró PerfuMate en local. `consolidar.py` normaliza al vocabulario de la app y elige por este orden: TGSC, la casa, Fraterworks, Perfumer's Apprentice, ScenTree, Scentspiracy, PerfumersWorld, Premiere Peau, PerfuMate. Premiere Peau copia a menudo las cifras de TGSC: cuando coinciden, no cuenta como segunda referencia. Lo que habla de otro producto (el aceite puro para una tintura, el producto diluido) no se usa.

**Resultado:** 79 campos llenos (6 usos habituales); 13 disputados (las referencias no coinciden: va la primera y el campo queda marcado); 59 siguen vacíos porque ninguna referencia los dice.

**Para mirar antes de aprobar:**

- **La familia** sale de la palabra de la referencia («Odor Type: balsamic» → gourmand, por `family_palette.csv`): es una lectura de la sesión.
- **La fuerza** en palabras va en `strength` (cuatro niveles), no en el impacto (V3-97).
- **Las horas** que una referencia da como «más de» (> 7 días, > 90 h) entran como esa cifra; días, semanas y meses, pasados a horas (un mes, 720 h). Dos cifras de horas que no se separan más de un 25 % cuentan como la misma.
- **Cuatro sin buscar en la web** (Rose Crystals, Synthetic castoreum, Tonka bean tincture y Veramoss, solo les faltan las horas): se acabó el cupo de lecturas; los dos que PerfuMate tiene llevan su cifra.

## Disputados

| Material | Campo | Va | Otras referencias |
|---|---|---|---|
| Aldehyde C12 lauric (dodecanal) | tenacity_hours | 368 | Premiere Peau: 368; PerfuMate: 79 |
| Benzyl salicylate | physical_state | colorless to pale yellow clear oily liquid to solid (est) | Premiere Peau (AR): viscous colorless to pale yellow liquid, melts near room temperature |
| Myrrh, essential oil | strength | medium | Premiere Peau: low |
| Raspberry ketone | tier | heart_base | Premiere Peau: heart |
| Raspberry ketone | strength | medium | Scentspiracy: high; Premiere Peau: high |
| Cypriol / Nagarmotha EO | strength | very_high | Premiere Peau: medium |
| Juniper (berries), essential oil | tier | heart | Scentspiracy: top_heart |
| Galbanum, essential oil | tenacity_hours | 72 | Fraterworks: 70; PerfumersWorld: 7; PerfuMate: 72 |
| Opopanax, essential oil | tenacity_hours | 112 | PerfumersWorld: 5 |
| Para-cresol | tenacity_hours | 400 | PerfuMate: 20; TGSC: 400 (referido a 10 % en DPG) |
| Ambrettolide | tenacity_hours | 172 | PerfuMate: 240; TGSC: 248 (OJO: esa ficha TGSC es CAS 28645-51-4, no 63286-42-0; verificar identidad) |
| Ethyl vanillin | tenacity_hours | 720 | PerfuMate: 408; TGSC: 400 (figura a 20 % en DPG, no al 100 %) |
| Exaltolide Total | tenacity_hours | 400 | PerfuMate: 504; TGSC: 400 (ficha de exaltolide (Firmenich), CAS 106-02-5; figura al 10 % en DPG) |

## Lo que se llena

| Material | Campos |
|---|---|
| Aldehyde C12 lauric (dodecanal) | tier = heart; tenacity_hours = 368 (disputado); strength = high; physical_state = colorless to pale yellow clear liquid (est); dose = 0.02 concentrate |
| Ambrette, tincture | tier = base |
| Amyl salicylate | tier = heart; tenacity_hours = 124; strength = medium; physical_state = colorless to pale yellow clear liquid (est); dose = 0.1 concentrate |
| Benzyl salicylate | tier = base; tenacity_hours = 384; strength = low; physical_state = colorless to pale yellow clear oily liquid to solid (est) (disputado) |
| Manzanate | tier = top; tenacity_hours = 90; strength = medium; physical_state = colourless liquid |
| Methyl linolenate | strength = low; dose = 0.2 concentrate |
| Phenethyl acetate | tenacity_hours = 16; strength = medium; physical_state = colorless clear liquid (est); dose = 0.5 concentrate |
| Green cardamom, tincture | tier = top_heart |
| Hyraceum (Africa stone), absolute | tier = base; physical_state = dark brown to black petrified solid (raw); amber-brown liquid (tincture) |
| Luminide | family = floral; tenacity_hours = 168 |
| Myrrh, essential oil | family = gourmand; tier = base; tenacity_hours = 400; strength = medium (disputado) |
| Raspberry ketone | tier = heart_base (disputado); tenacity_hours = 408; strength = medium (disputado); dose = 0.08 concentrate |
| Cypriol / Nagarmotha EO | strength = very_high (disputado) |
| Filbertone | tier = top; tenacity_hours = 2; strength = high |
| Juniper (berries), essential oil | tier = heart (disputado); tenacity_hours = 24; physical_state = pale yellow clear liquid (est) |
| Magnolan | tier = heart_base; physical_state = colorless to pale yellow clear liquid (est); dose = 0.08 concentrate |
| Aurantiol | tier = base; physical_state = yellow viscous liquid |
| Boisambrene Forte | tier = base; physical_state = colourless liquid |
| Galbanum, essential oil | tenacity_hours = 72 (disputado); strength = high |
| Indole | tenacity_hours = 408; strength = high |
| Isobutavan | tenacity_hours = 400; strength = medium |
| Javanol | tier = base; physical_state = colorless viscous liquid |
| Operanide | tenacity_hours = 72 |
| Opopanax, essential oil | tenacity_hours = 112 (disputado); strength = medium |
| Orris Givco | tenacity_hours = 360 |
| Para-cresol | tier = base; tenacity_hours = 400 (disputado) |
| Pink pepper (Schinus molle), essential oil | tier = base; physical_state = pale green clear oily liquid (est) |
| Shangralide | tenacity_hours = 260 |
| Ambrarome | tenacity_hours = 200 |
| Ambrettolide | tenacity_hours = 172 (disputado) |
| Black pepper, absolute | tenacity_hours = 40 |
| Cumin Nitrile | tenacity_hours = 4 |
| Ethyl vanillin | tenacity_hours = 720 (disputado) |
| Exaltolide Total | tenacity_hours = 400 (disputado) |
| Isobutyl acetate | tenacity_hours = 4 |
| Prunella | tenacity_hours = 24 |
| Synthetic castoreum | tenacity_hours = 79 |
| Veramoss | tenacity_hours = 240 |

## Lo que sigue vacío

| Material | Campos |
|---|---|
| Villous cardamom, tincture | family, tier, tenacity_hours, strength, physical_state, dose |
| Ambrette, tincture | tenacity_hours, strength, physical_state, dose |
| Benzyl salicylate | dose |
| Manzanate | dose |
| Methyl linolenate | family, tier, tenacity_hours |
| Phenethyl acetate | tier |
| Green cardamom, tincture | tenacity_hours, strength, dose |
| Hyraceum (Africa stone), absolute | tenacity_hours, dose |
| Luminide | strength, physical_state |
| 4-Propylphenol | tenacity_hours, strength, dose |
| Cypriol / Nagarmotha EO | tenacity_hours, dose |
| Honey, aromatic essence | tenacity_hours, strength, dose |
| Phenylethyl Mercaptan | tenacity_hours, strength, dose |
| Thialdine | tenacity_hours, strength, dose |
| Truffle essence | family, tenacity_hours, strength |
| 3,4-Xylenol | tenacity_hours, dose |
| Narcisse Oxyacetate | tenacity_hours, strength |
| Operanide | strength |
| Orris Givco | strength |
| Shangralide | dose |
| Vinyl Sulfurol | tenacity_hours, strength |
| 1-Octen-3-one Stabilised | tenacity_hours |
| 2-Hydroxybenzaldehyde | tenacity_hours |
| Aldambre | tenacity_hours |
| Alpha-hexyl cinnamic aldehyde | dose |
| Auranone | tenacity_hours |
| Black Agar 296985 | tenacity_hours |
| Chinese cedarwood, essential oil | dose |
| Dewfruit TEC | tenacity_hours |
| Rose Crystals | tenacity_hours |
| Tonka bean (seeds), commercial tincture | tenacity_hours |
