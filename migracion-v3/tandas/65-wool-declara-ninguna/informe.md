# Tanda 65 · Wool Absolute: el certificado no declara sustancias restringidas (V3-108)

*Generada por `migracion-v3/tanda-65-wool-declara-ninguna.ts` sobre lo común de `663a8a0`. Reescribe `regulations.csv` entero (añade una fila). Aprobada el 2026-11-23 («Apruebo la 65, fusiona y publica»).*

**Por qué:** el usuario, 2026-11-23: «Sí, añade la marca para Wool».

**Qué:** una afirmación del material (V3-39) en `regulations.csv`: grupo `declares-none`, «declares no IFRA-restricted material (detection limit 0.001 %)», autoridad `literature` (el certificado público de Biolandes, F2915, que enlaza Fraterworks; no es el de tu frasco). La frase: «RESTRICTED MATERIAL(S) / MATIERE(S) RESTREINTE(S) None / Aucune».

**Cómo lo lee la app** (`v3/src/db/to-ifra.ts`): un natural o una base sin constituyentes y con esta marca ya no es «sin datos». Desde la literatura cuenta una carga desconocida bajo un techo del 100 %: la fórmula sale **acotada, nunca dentro**, y la ficha dice «supuesto, no probado». Si la marca viene del certificado de tu frasco (autoridad `lot` o `product`), queda acreditada.
