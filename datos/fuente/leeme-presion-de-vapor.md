> 📥 **Copiado del laboratorio** (`fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-8-presion-de-vapor-estimada.md`, commit `776e932`) por `scripts/importar_datos.py`. **No se edita aquí**: se corrige en el laboratorio y se vuelve a importar.

---
pieza: 8 — Presión de vapor estimada (OPERA) y duración propia
frente: 6 (parte A, campos 1 y 2)
fecha: 2026-09-26
herramienta: Claude Code (Opus); búsqueda por lotes del CompTox de la EPA (predicciones OPERA) y scripts
confianza: media   # OPERA está validado contra lo experimental; la duración estimada solo da el orden de magnitud
---

# Pieza 8 — Presión de vapor estimada y una duración propia

## Qué se hizo

- **La búsqueda por lotes del CompTox de la EPA** (dashboard, sin cuenta) se lanzó con los 2247 CAS
  del FIG que no son naturales. De ahí se bajaron las predicciones de OPERA: presión de vapor,
  punto de ebullición y log Kow, entre otras.
  - Los datos son de **dominio público**, y OPERA tiene licencia MIT: pueden ir directos al producto
    ([pieza 2](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-2-licencias.md)).
  - El CompTox reconoció 2216 CAS por su número; 10 figuraban como CAS dado de baja; 21 no dieron
    resultado.
- **La tabla CAS a CAS** es [`pieza-8-presion-de-vapor-opera.csv`](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-8-presion-de-vapor-opera.csv):
  CAS, DTXSID, nombre, presión de vapor (mmHg), punto de ebullición (°C) y log Kow.

## Cobertura

| Presión de vapor | CAS (de 2588) | Moléculas (de 2140) | Sin estructura (de 102) |
|---|---|---|---|
| OPERA, estimada | 2069 (79,9 %) | 2060 (96,3 %) | 8 |
| PubChem, experimental legible | 230 (8,9 %) | 228 | 0 |
| Una u otra | 2074 (80,1 %) | 2063 | 8 |

La posición deja de ser un hueco para las moléculas: quedan fuera 77 moléculas, los naturales y
casi todo lo que no tiene estructura.

## ¿Es fiable OPERA?

- **Frente a la presión de vapor experimental de PubChem** (n = 225):
  - rho = 0,77;
  - error mediano de 0,10 en log10, un factor 1,2;
  - 150 de los 225 casos, dentro de un factor 2.

  Para ordenar materiales por volatilidad basta. `alta`.
- **La correlación no es mayor por los casos extremos, y buena parte son errores del lado
  experimental.** En el [piloto](https://github.com/smortenax/perfumeria-lab/blob/776e9326e5c08419d92636fe30e348f9fb28faed/fuentes/investigaciones/2026-09-26-frente-6-parte-C-piloto.md), el lector de PubChem
  cogió valores a otra temperatura: heliotropina ×50, guayacol ×25, salicilato de bencilo ×120.
  Con los valores bien leídos, OPERA coincide (limoneno, eucaliptol, indol y p-cresol: factor 1,0).
  `alta`.

## La duración propia

Horas de TGSC (al 100 %) frente a la presión de vapor de OPERA, en 867 moléculas:

- **rho = −0,60.** Recta en escala logarítmica: log10(h) = 1,32 − 0,24·log10(PV), con R² = 0,31 y
  un error típico de 0,57 en log10, es decir, **un factor 3,7**.
- **La relación no es una recta:** se aplana arriba y abajo.
  - Por arriba, 78 materiales tienen exactamente 400 h, que es donde TGSC trunca la escala (Zarzo,
    2012).
  - Por abajo, los muy volátiles se quedan en unas 4 h.

| Presión de vapor (mmHg) | n | Horas de TGSC, mediana | Recta |
|---|---|---|---|
| más de 10 | 20 | 4 | 7 |
| 1 a 10 | 71 | 4 | 16 |
| 0,1 a 1 | 206 | 18 | 27 |
| 0,01 a 0,1 | 312 | 64 | 47 |
| 0,001 a 0,01 | 128 | 204 | 82 |
| 0,0001 a 0,001 | 44 | 150 | 142 |
| menos de 0,0001 | 86 | 308 | 322 |

**Lectura (mía, `media`):**

- **La presión de vapor da el orden de magnitud de la duración, no más.** Un factor 3,7 de error
  típico separa 20 h de 75 h. Para una pirámide y una proyección por horas sirve; para prometer
  horas exactas, no.
- **Una recta no es buena estimación:** se equivoca en el centro de la escala.
- **Mejor estimación propia: la mediana de las horas de TGSC de las moléculas con presión de vapor
  parecida** (una ventana en log10(PV)). Es monótona, se explica en una frase y no copia ningún
  valor: resume cientos. Es la «otra valoración» de TGSC que propone el usuario.
- **El tope de 400 h de TGSC se hereda.** Por encima, la estimación dice «más de 400 h», no un
  número.

## Una escala de posición

Reparto de log10(PV) en las moléculas del FIG, en mmHg:

| Percentil | 1 | 5 | 25 | 50 | 75 | 95 | 99 |
|---|---|---|---|---|---|---|---|
| log10(PV) | −7,0 | −5,1 | −2,3 | −1,3 | −0,5 | 0,8 | 1,6 |

- **Propuesta para la posición de 0 a 1:** posición = (0,8 − log10 PV) / (0,8 − (−5,1)), recortada
  entre 0 y 1. Así el 5 % más volátil marca 0 (salida) y el 5 % menos volátil marca 1 (fondo).
- Los anclajes son una elección, no un dato: los decide la parte D. Es propuesta, `media`.

## El valor de olor

- Con la presión de vapor de OPERA, el valor de olor calculable pasa de 136 a **158 CAS**.
- El límite es el umbral, que solo está para 160 CAS: la presión de vapor ya no es el cuello de
  botella.

## Límites

- **Los naturales siguen fuera:** OPERA necesita una estructura.
- **La posición «física»** es la del material puro. En una fórmula, la fracción molar y el
  coeficiente de actividad la mueven (pieza 4).
- **Las 21 no encontradas y las 10 con CAS de baja,** sin revisar una a una.
