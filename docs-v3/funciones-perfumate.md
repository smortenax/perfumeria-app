# Funciones de PerfuMate: qué entra en la app

**De dónde sale:** un vídeo de 1 min 45 s que grabó el usuario el 2026-10-26 recorriendo
PerfuMate (perfumate.app). No tiene audio y se revisó con un fotograma cada 3 s. **Lo visual de
PerfuMate no se toma**: al usuario no le gusta. Las decisiones están en `decisiones-v3.md`, V3-78.

Estados: **entra** (tal cual), **matizada** (entra con los matices de abajo), **no entra** y
**pendiente** (falta matizarla).

| # | Función | Estado | En la v3 hoy |
|---|---|---|---|
| F1 | Lista de fórmulas con vista previa: todas / perfumes / acordes, buscar, filtros, ordenar, favorito, candado | entra | parcial (Formulación) |
| F2 | Barra de composición por familias en la tarjeta y la cabecera de la fórmula | entra | parcial (gráficos del banco) |
| F3 | Ingredientes agrupados por nota (salida / corazón / fondo), con subtotales | entra | por comprobar |
| F4 | Perfil olfativo | matizada | gráficos del banco y orbe |
| F5 | Deslizador de evaporación, de recién aplicado al fondo, sin cambiar la fórmula | entra | datos sí (V3-42); deslizador no |
| F6 | Resumen automático con su confianza | entra | no |
| F7 | Descripción y notas libres por fórmula | entra | parcial (intención) |
| F8 | Pasar de la fórmula a pesarla | entra | sí (V3-59) |
| F9 | Coste por línea | no entra | — |
| F10 | Árbol de versiones: ramas, «hecha», renombrar, numerar, borrar, instantánea con nombre | entra | árbol sí (V3-77); el resto, por comprobar |
| F11 | Estantería (lo que tengo) frente a catálogo | entra | sí (lo que tengo) |
| F12 | Ficha de material | matizada | hoja de datos (V3-47) |
| F13 | Constituyentes y alérgenos del material | decidida | diseño en V3-79 |
| F14 | Documentos del material con estado de verificación | decidida | diseño en V3-79 |
| F15 | Frascos por material | decidida | diseño en V3-79 |
| F16 | Stock | decidida | diseño en V3-79 |
| F17 | Ventana de dilución | decidida | diseño en V3-79 |
| F18 | «Usado en»: en qué fórmulas está un material | entra | parcial (acordes) |
| F19 | Importar: hoja de cálculo, kits de inicio, alta a mano | pendiente | por tandas |
| F20 | Aviso de IFRA en Inicio y etiqueta IFRA por fórmula | entra | panel por fórmula |
| F21 | Inicio con recientes, estantería, diario de maceración y libreta | entra | parcial (recuentos) |
| F22 | Asistente: describes un olor y propone una fórmula con tus materiales | pendiente | no |
| F23 | Exportar, sugerencias y contribuir documentos | pendiente | .json y hoja de pesada (V3-55) |

## Prioridad

1. Frascos y diluciones: el sistema (F13–F15), la ventana de dilución (F17) y una interfaz
   mejor para el registro de diluciones.
2. El resto.
3. Lo último, el perfil olfativo (F4): mejora algo que ya existe.

## Matices

- **F4.** Sin tarta. El perfil se ve en los orbes (V3-72, V3-73), que hay que iterar para que
  además de atractivos se lean.
- **F12.** A la ficha le faltan el impacto y las horas en tira, cada cifra con su fuente.
- **F13, F14 y F15** (decididas en V3-79: especificación y dilución). Antes hay que diseñar el sistema de frascos y diluciones: qué va al
  material y qué al frasco. Propuesta del usuario, en dos niveles:
  1. **Material**, con lo general (ligado al CAS y sacado del glosario) y la **especificación**
     (procedencia, fabricante, alérgenos cambiados o añadidos y, si corresponde, la composición o
     el GC-MS de ese producto).
  2. **Dilución**: solo el % de material y el % de cada disolvente.

  Abierto: si cada cambio de composición, origen o fabricante es otra especificación o va en un
  frasco.
- **F16.** No hay stock general enlazado a todo. A cambio, marcar a mano un material como «se
  acaba», y una lista de la compra con materiales que tienes o no tienes. Lo que falta para una
  receta mientras la usas queda apuntado en ella. La lista va discreta, en un apartado de
  usuario («Consultar la lista de la compra»), y desde ella se exporta o se pasa un material a
  «tuyo» cuando ya lo has comprado.
- **F17.** Una ventana emergente rápida, sin tocar ningún stock, donde conviven cuatro maneras:
  1. **Dar de alta una dilución ya hecha:** material, %, disolvente, y listo.
  2. **Desde lo pesado:** tras elegir material y %, salen en gris pesos de ejemplo (al 10 %:
     1 g = 0,100 g + 0,900 g; 10 g = 1 g + 9 g). Escribes lo que has pesado de material (0,800 g)
     y te da el disolvente (7,200 g).
  3. **Partir de lo ya diluido:** el origen se elige entre puro y las diluciones dadas de alta de
     ese material.
  4. **Desde el total:** dices cuánta dilución quieres y te da qué pesar de cada cosa.
