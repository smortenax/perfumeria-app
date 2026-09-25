# App — lo que se exporta al proyecto de la aplicación

La app es un **proyecto paralelo**: sus decisiones nacen aquí, al trabajar en el
laboratorio, y viven centralizadas en esta carpeta para llevarlas de una vez.

| | |
|---|---|
| 📐 **[Decisiones](decisiones.md)** | **v3, 2026-09-25, en revisión.** Qué es la app y cómo se comporta: materiales como vectores, fórmulas editables, IFRA por sustancia con dos lecturas, ejecutable propio con Tauri 2. **Se lee antes de tocar la app** |
| 🗺️ **[Plan de desarrollo](plan-desarrollo.md)** | El orden de trabajo, de preparar el ordenador al ejecutable de Windows, y cuándo está lista la formulación |
| ❓ **[Interrogatorio](interrogatorio.md)** | **La intención de la app, pregunta a pregunta.** Rondas de tres, empezando por la formulación. Lo cerrado aquí pasa a las decisiones |
| 🗂️ [Antecedentes](antecedentes/README.md) | Todo lo escrito sobre la app entre agosto y septiembre, **guardado y no vinculante**: brief, Formulair, dominio, motor, lenguaje visual. Se contradice; de ahí se extrae la intención |
| 🧪 [Banco de Formulación](../herramientas/README.md) | El prototipo actual, en `herramientas/`: un HTML autónomo que el usuario usa a diario |

## Qué se exporta y adónde

`app/` **no copia datos**: cada dato vive una vez en el repositorio. Al exportar, se
llevan estos archivos a la carpeta `datos/` del proyecto de la app:

| Archivo del repositorio | Qué es para la app |
|---|---|
| [`conocimiento/normativa/ifra-cat4.csv`](../conocimiento/normativa/ifra-cat4.csv) | IFRA: techo de categoría 4, tipo de estándar, condiciones y constituyentes regulados. **La única fuente de IFRA** |
| [`materias-primas/_datos/niveles-de-uso.csv`](../materias-primas/_datos/niveles-de-uso.csv) | Poder olfativo, consenso y dosis recomendada por material |
| [`materias-primas/_datos/limites-de-uso.csv`](../materias-primas/_datos/limites-de-uso.csv) | Rangos del proveedor, con su base y su naturaleza (*no es IFRA*) |
| [`vistas/inventario.csv`](../vistas/inventario.csv) | Los materiales y sus frascos, generado desde las fichas |
| [`conocimiento/lenguaje/fig/glosario-fig.csv`](../conocimiento/lenguaje/fig/glosario-fig.csv) | Descriptores oficiales IFRA FIG por CAS |

Lo hace el exportador, que copia `app/` entera y esos archivos al destino:

```
python app/exportar.py RUTA_DEL_PROYECTO_DE_LA_APP
```

🔴 **Antes de exportar**, regenerar las vistas (el inventario sale de las fichas) y leer
las decisiones: la regla 1.1 —todo número con su base— vale igual para los CSV.
