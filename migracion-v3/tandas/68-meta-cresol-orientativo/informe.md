# Tanda 68 · Meta-cresol: límite orientativo del 0,027 % en la categoría 4 (V3-112)

*Generada por `migracion-v3/tanda-68-meta-cresol-orientativo.ts` sobre lo común de `e595f53`. Reescribe `regulations.csv` entero (añade una fila). Aprobada el 2026-11-25 («apruebo el limite»).*

**Por qué:** el usuario, 2026-11-25: «apruebo el limite» (el 0,027 % que propuso la sesión), y en la tarjeta: «Tipo nuevo: límite orientativo».

**Qué:** una fila en `regulations.csv` del meta-cresol común (`a4ff5fda-3038-5073-8059-0869f8500daa`): régimen `guidance`, categoría 4, `max` 0,027 %, autoridad `literature`.

- **De dónde sale:** la tabla 1 (p. 5) de la evaluación de RIFM del o-cresol (2021): 0,027 % en la categoría 4, por el umbral por defecto de las moléculas reactivas sin datos de sensibilización. El m-cresol tampoco tiene ensayos (OCDE, 2003). La evaluación de RIFM del propio m-cresol no se pudo leer.
- **No es de IFRA:** IFRA no regula el 108-39-4. Lo que IFRA cuenta es su p-cresol (tanda 67, como mucho un 2 %, contra el estándar 260).

**Cómo lo lee la app** (`v3/src/db/to-ifra.ts`): se suma aparte, como un tope de fabricante, en «Caps apart from IFRA», sin decidir las lecturas de IFRA, y nunca da «dentro». La ficha lo enseña como «Guidance (not IFRA)».
