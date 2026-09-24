# App — lo que se exporta al proyecto de la aplicación

La app es un **proyecto paralelo**: sus decisiones nacen aquí, al trabajar en el
laboratorio, y viven centralizadas en esta carpeta para llevarlas de una vez.

| | |
|---|---|
| 📐 **[Decisiones](decisiones.md)** | Lo ya decidido sobre cómo debe comportarse la herramienta: las tres reglas que no se negocian, los límites por sustancia, la dilución como estado del material, los IFRA de fuente primaria. **Se lee antes de tocar la app** |
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
| [`conocimiento/fig/glosario-fig.csv`](../conocimiento/fig/glosario-fig.csv) | Descriptores oficiales IFRA FIG por CAS |

Lo hace el exportador, que copia `app/` entera y esos archivos al destino:

```
python app/exportar.py RUTA_DEL_PROYECTO_DE_LA_APP
```

🔴 **Antes de exportar**, regenerar las vistas (el inventario sale de las fichas) y leer
las decisiones: la regla 1.1 —todo número con su base— vale igual para los CSV.
