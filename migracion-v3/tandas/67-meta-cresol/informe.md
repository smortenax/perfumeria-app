# Tanda 67 · Meta-cresol: como mucho un 2 % de p-cresol (IFRA 260)

*Generada por `migracion-v3/tanda-67-meta-cresol.ts` sobre lo común de `5d9848a`. Reescribe `material_components.csv` entero (añade una fila). Aprobada el 2026-11-25 («apruebo 67»).*

**Por qué:** la bandeja del laboratorio (2026-11-25): la app no daba límite IFRA al Meta Cresol 10 % (DPG) de Perfumiarz. El usuario, 2026-11-25: «vale ahora creo que si esta cerrado y apruebo el limite». La investigación, con sus citas: `/mnt/project-files/investigaciones/2026-11-25-meta-cresol-ifra.md` (carpeta del proyecto).

**Qué:** un constituyente del meta-cresol común (`a4ff5fda-3038-5073-8059-0869f8500daa`): p-cresol (106-44-5), `max` 2 %, autoridad `literature`.

- **IFRA no regula el m-cresol.** El estándar 260 es del p-cresol (106-44-5) y de los cresoles mezclados (1319-77-3), por despigmentación; el 108-39-4 no aparece en su PDF.
- **Lo que sí cuenta es el p-cresol que lleve.** Perfumiarz lo vende como «PRODUCENT: Sigma Aldrich», y su SDS es la de Aldrich W353000. Sigma da «≥98%» y no lista impurezas: en el peor caso, todo lo demás sería p-cresol, un 2 %.
- **Es una cota, no un análisis:** por eso va como `literature`, y la comprobación sale **acotada, nunca dentro** (V3-7).

**Cómo lo lee la app:** el meta-cresol deja de ser «sin estándar» y cuenta su 2 % de p-cresol contra el 260 (0,005 % en la categoría 4). El 260 manda sobre el m-cresol a partir de un 0,25 % en el producto terminado; con el uso de TGSC (0,01 % del concentrado, ya en `material_doses.csv`) queda muy por debajo.

**Lo que no hace esta tanda:** el límite orientativo del m-cresol (0,027 % en la categoría 4, por analogía con la tabla de RIFM del o-cresol). La app solo admite límites de IFRA o del fabricante; cómo guardarlo está pendiente de decidir.
