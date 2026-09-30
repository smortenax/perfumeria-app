# Lote U-001 · uso habitual · resumen del piloto

**Qué es.** Los 54 materiales de la paleta del laboratorio, con su rango de uso de varias fuentes.
Datos en [`U-001.csv`](U-001.csv): 236 filas, una por fuente y material, con URL, cita (25 palabras
como mucho) y fecha (2026-09-30). **Solo recopilado, nada decidido**: la auditoría decide qué entra.

## Cuántas fuentes tiene cada material

La fila del laboratorio (`niveles-de-uso.md`) está en 53 de los 54 y **no es una fuente externa**:
es la columna «Consenso» del propio documento, que a su vez sale de foros, fichas y fórmulas. Por
eso cuento aparte las externas.

| Fuentes | Con la fila del laboratorio | Solo externas | Solo externas y sin las de peso bajo* |
|---|---|---|---|
| 0 | 1 (trufa) | 1 (trufa) | 1 (trufa) |
| 1 | 0 | 0 | 5 |
| 2 | 0 | 18 | 26 |
| 3 o más | 53 | 35 | 22 |

\* Peso bajo = glooshi y Ca Perfume (guías divulgativas sin autor ni bibliografía, con pinta de
texto generado) y un comentario de blog (Pell Wall).

**Materiales con una sola fuente externa de peso**: naranja dulce (TGSC), etil-4-fenol (TGSC),
castoreum (TGSC), cumarina natural (PerfumersWorld), resinoide de estoraque (PerfumersWorld).
**Trufa: no encontrado** (es una esencia compuesta de composición desconocida; en `notas` van las
cifras de *otros* productos de trufa, sin darlas como fila porque no son el mismo material).

## Qué fuentes rindieron más

| Fuente | Filas | Qué da |
|---|---|---|
| **PerfumersWorld** | 49 | **Mínimo, medio y máximo** «en compuestos de perfume» (la mejor: es la única con mínimo). Se ha tomado como `concentrado`. Cubre casi todos los sintéticos y muchos naturales. |
| **TGSC** | 45 | Solo el máximo («usage levels up to … in the fragrance concentrate»), base `concentrado` explícita. **Calla en los materiales con estándar IFRA** (amil cinamal, eugenol, geraniol, Mayol, γ-metilionona, Cashmeran, cumarina, Iso E Super, Polysantol): ahí remite a IFRA y no da uso. |
| glooshi | 27 | «De trace a 5 % del concentrado» casi siempre. Redundante y de peso bajo. |
| Scentspiracy | 23 | Rangos de uso en unos 20 materiales; a veces con base (`concentrado`), a veces sin ella. |
| Givaudan | 6 | Sus moléculas (Florosa, Safraleine, Stemone, Ebanol, Methyl Pamplemousse, Ambrofix): «Use level» sin base. |
| Perfumer's Apprentice | 5 | Ver «Problemas»: casi todo es copia de TGSC. |
| Fraterworks | 4 | Casi nada útil: sus fichas hablan de fórmulas famosas, no de rangos. |

## Dónde discrepan mucho (razón entre el mayor y el menor máximo, sin glooshi)

- **Etil-4-fenol**: TGSC y laboratorio dicen 0,05 %; glooshi dice «hasta 5 % del concentrado»
  (100×). Solo hay dos fuentes serias y coinciden; glooshi es la rara.
- **Aldehído C18 (γ-nonalactona)**: 0,3 % (Scentspiracy) frente a 10 % (TGSC): 33×.
- **Castoreum**: 0,2 % (Ca Perfume) frente a 5 % (TGSC, absoluto): 25×. Las formas no son iguales.
- **Aldehído C14 (γ-undecalactona)**: 0,5 % (Scentspiracy) frente a 10 % (TGSC): 20×.
- **Ethyl Maltol**: 0,2 % (PW) frente a 4 % (TGSC): 20×.
- **Cilantro**: 0,5 % (TGSC, hoja) frente a 10 % (TGSC, semilla): 20×. Son materiales distintos.
- **Dihydromyrcenol**: 5 % (Scentspiracy) frente a 75 % (TGSC, PA); PW dice 8 %. El 75 % coincide
  con el «proveedor hasta 75 %» del laboratorio.
- **Iso E Super**: laboratorio 5–30 %, glooshi 0,5–5 %, PA hasta 10 %, PW hasta 80 %.
- Ámbar gris (tintura), tabaco y Methyl Pamplemousse: 10×. Linalol, AAG e Iso E Super: 8×.

TGSC da un **techo** («hasta X %») y en los materiales potentes ese techo es mucho más alto que lo
que dicen el laboratorio y Scentspiracy. Conviene que la auditoría distinga «techo de uso» de «uso
habitual»: el consenso de la ficha sale del segundo.

## Problemas encontrados

1. **WebFetch no veía lo que había en TGSC**: su resumidor contestaba «no hay niveles de uso» en
   páginas donde el HTML sí trae la frase. Y los resúmenes de WebSearch se equivocaron
   alguna vez (PA linalool: «10 %», la página dice 12 %). **Todas las cifras están releídas de la
   página**, con peticiones HTTP directas (Python `urllib`, **una petición cada 3 s** a cada sitio
   y 6 s a Perfumer's Apprentice, cuyo `robots.txt` pide 5 s) que imprimen la frase y **no
   guardan el archivo**. Me aparto de «usa WebSearch y WebFetch» por esa razón. En el
   directorio temporal de la sesión quedan listados de URL y de nombres (sitemap de Scentspiracy
   y Fraterworks, lista de PerfumersWorld), nada del repositorio. WebFetch de un PDF de Firmenich
   (ficha de Mayol) guardó el PDF en la carpeta de resultados de la herramienta sin que yo lo
   pidiera; no traía texto legible y no se usa.
2. **Perfumer's Apprentice copia a TGSC** (dihydromyrcenol 75 %, acetato de bencilo 30 %, AAG 1 %,
   litsea 9 %, diphenyl oxide 1 %, linalool 12 %, naranja 10 %) y la ficha de Methyl Pamplemousse
   copia a Givaudan (0,1–10 %). **Solo he dejado las filas de PA que aportan algo distinto**
   (eugenol, geraniol, Iso E Super, Mayol, Dartanol). Las demás no cuentan como independientes.
3. **Scentspiracy arrastra textos de otros productos** (un bloque de Tabanone y Safraleine,
   «dosage typically 0.1–1 %», sale en páginas de otros materiales). Filtrado leyendo cada
   cifra dentro de su propia ficha. Su «Brahmanol» es CAS 72089-08-8, **no** el Sandalmysore Core
   (28219-60-5): descartada.
4. **Hay fuentes que no se pudieron leer**: `pellwall.com` no resuelve desde aquí (DNS) y solo
   se ha usado su blog (`pellwall-perfumes.blogspot.com`); ScenTree marca el uso como «dato no
   disponible»; Perfumer Supply House y Basenotes dan 403; las fichas de Firmenich son JavaScript o
   PDF. La ficha de Maese Lab que miré (etil-4-fenol) no trae rango de uso en el texto; no revisé las de Olfatorium.
5. **La base no siempre se dice.** `concentrado` solo cuando la fuente lo dice
   (TGSC, PW «perfume compounds», «in the concentrate», «of the compound»). Givaudan, Scentspiracy
   a menudo, PA y las cifras que dicen «en fragancia fina» van como `desconocida`. **No se ha
   convertido nada.** Las filas «proveedor» sacadas de `niveles-de-uso.md` también son
   `desconocida`: el documento no declara su base y, en otro apartado, Maese Lab expresa sus
   rangos sobre producto terminado.
6. **Identidades ajustadas por nombre comercial** (en `notas`): Ambermor = ambroxano (TGSC lo
   lista como nombre de Aromor); Dartanol = Bacdanol (CAS 28219-61-6); Sandalmysore Core = Hindinol
   / «sandal butenol» (28219-60-5); Florosa = Florol/pyranol; Methyl Pamplemousse = «grapefruit
   acetal» en TGSC; Safraleine = «saffron indenone»; Stemone = «leafy oxime».
7. **Formas dudosas**: cilantro (hoja/hierba frente a semilla: las filas de semilla van marcadas
   OJO); haba tonka **tintura** (solo hay cifras del absoluto, marcadas OJO); castoreum (el
   laboratorio habla del producto al 20 %; las fuentes, del absoluto o del sintético); Mayol
   (hay tres entradas en el glosario: cis, cis/trans…); laudano de jara (jara y laudano
   comparten CAS 8016-26-0; PW tiene ambos). Patchouli, lavanda, limón, mandarina, naranja:
   elegí la forma de aceite común y lo anoto.
8. **`material_id`**: en todos los casos hay uno salvo **trufa**, que no está en el glosario. Los
   CAS del laboratorio de cilantro (84775-50-8), láudano (89997-74-0) y ámbar gris (84836-94-2) no
   coinciden con el del glosario; uso el del glosario en la columna `cas`.
9. **IBQ**: el `id` que he usado (fig:938, 6-sec-butilquinolina) es el que lleva el CAS del
   laboratorio 65442-31-1; el glosario tiene otras dos entradas «Isobutyl quinoline».
10. **Cifra única** de Scentspiracy para el Cashmeran («around 2 %»): va como `min=max=2` y
    avisado en `notas`. Dos filas de TGSC para el limón (destilado 15 %, lavado 8 %) y una de
    PW con la variante sin furocumarinas en `notas`: el aceite de limón genérico de TGSC no da
    recomendación.
11. **«Sin fila de TGSC» no es «TGSC dice cero»**: en los materiales con estándar IFRA, TGSC no dice nada. TGSC, en la página de `styrax (liquidambar orientalis)`, dice
    «PROHIBITED: Should not be used as a fragrance ingredient», que es la restricción IFRA de la
    goma cruda, no un uso; queda en `notas` del estoraque y no entra como número.
12. **glooshi y Ca Perfume** dicen casi siempre «de traza a 5 %»: no contrastan nada, solo
    repiten una plantilla. Conviene que la auditoría los descarte como independientes.
