# 01 — El referente: Formulair

Análisis reconstruido a partir de la web oficial (`formulair.app`), la guía de usuario completa, la FAQ, la ficha de App Store y los comentarios públicos de usuarios. No hay acceso al código fuente: lo que sigue es ingeniería inversa desde el comportamiento documentado. Donde hay inferencia, está marcada como tal.

---

## 1. Qué es

Software ligero de formulación para perfumería, desarrollado por Sam Macer en Lux & Terra. Se posiciona explícitamente para el perfumista aprendiz y autodidacta: "tan fácil como lápiz y papel, pero conectando materias primas y fórmulas como un cuaderno no puede".

- Plataformas: iPhone, iPad y Mac. iOS 13+ / macOS 10.15+. No hay versión Windows ni Android, y el desarrollador ha declarado que no la habrá.
- Modelo de negocio: gratis hasta 25 materias primas y 25 fórmulas; compra única para desbloquear ilimitado, vinculada a la cuenta Apple.
- Datos: contenedor privado de iCloud del usuario. El desarrollador no tiene acceso, solo telemetría anónima. Sincroniza entre dispositivos, funciona sin iCloud renunciando a la sincronización.
- Estado del producto: se ofrece "as is", sin aceptar peticiones de funcionalidad. Hay reseñas que se quejan de año y medio sin actualizaciones, de la ausencia de edición por lotes y de un importador muy básico.

**Lectura estratégica**: es un producto congelado, monoplataforma, sin backend y sin comunidad. La calidad de ejecución es su foso; la ausencia de evolución es la puerta abierta.

---

## 2. Arquitectura técnica (declarada e inferida)

Declarado por el desarrollador: usa iCloud, Mac Catalyst y "el último framework de interfaz de Apple". Traducido:

- **SwiftUI** para la interfaz, con Catalyst para llevar la app de iPad a Mac con un solo código.
- **Core Data + NSPersistentCloudKitContainer** casi con seguridad, que es el camino estándar para sincronizar por iCloud con soporte offline y resolución de conflictos automática. (Inferencia, pero muy sólida: explica la sincronización transparente, el contenedor privado y la advertencia de que borrar datos exige ir a los ajustes de iCloud.)
- **Sin servidor propio**. Todo el estado vive en el dispositivo y en iCloud. Esto explica por qué no hay compartición real: no hay dónde alojarla.
- Exportación vía las hojas de compartir de iOS y exportación a carpeta en Mac.

Consecuencia para nosotros: la fluidez que admiran los usuarios viene en buena parte de que Apple resuelve la sincronización y la persistencia. Si abandonamos ese ecosistema, esa fluidez hay que ganársela: es la partida técnica más cara del proyecto.

---

## 3. Modelo de datos reconstruido

La pieza más valiosa del análisis es el formato de importación CSV documentado, que expone el orden real de los campos de una materia prima:

```
Name (texto), CAS (texto), Supplier (texto), Category (texto),
Inventory amount (texto), Cost per gram (número), IFRA limit (número),
Longevity (entero 0..4, 0 = nota de salida, 4 = nota de fondo),
Description (texto)
```

Nota reveladora: **`Inventory amount` es texto, no número**. El stock en Formulair es una nota escrita a mano, no una magnitud. No hay contabilidad de existencias. Este es exactamente el hueco que el usuario quiere cubrir.

De ahí y de la guía se deducen las entidades:

### RawMaterial
`id`, `name`, `cas`, `supplier` (relación), `category` (relación), `inventoryAmount` (texto libre), `costPerGram`, `ifraLimit`, `longevity` (0–4), `description`, `isSolvent` (booleano), fechas de compra y de preparación de diluciones, y una colección de `Dilution`.

### Dilution
Pertenece a una materia prima no disolvente. Guarda una concentración y un texto de notas, pensado para describir cómo huele esa materia a esa concentración. Se pueden borrar individualmente.

### Supplier
Entidad propia, gestionada desde el desplegable de la ficha: se crea, se renombra y se borra ahí mismo.

### Category
Dos gestores separados y sin relación entre sí: uno para materias primas (con color asignable) y otro para fórmulas (sin color). Cada entidad tiene una sola categoría.

### Formula
`id`, `name`, `category` (relación), `notes`, y una colección de `FormulaEntry`.

### FormulaEntry
`rawMaterial` (relación), `weight` en gramos con 3 decimales, `dilution` (la concentración a la que se pesa esa entrada en esta fórmula concreta), y `mark` ∈ {ninguna, demasiado fuerte, demasiado débil}.

**El punto clave de todo el modelo**: la dilución vive en la entrada de fórmula, no en la fórmula ni en la materia. Una misma materia puede aparecer en dos fórmulas a diluciones distintas, y en cada una el motor recalcula el porcentaje real. Es elegante — y es también la razón por la que las fórmulas de Formulair no son compartibles: llevan pegada la infraestructura del taller de quien las escribió. Ver `docs/05-libreria-global-e-intercambio.md`.

---

## 4. Funcionalidad, pantalla por pantalla

### Biblioteca de materias primas
Lista con búsqueda. Icono de hoja arriba a la izquierda abre el gestor de categorías; botón `+` arriba a la derecha añade materia; un cajón superior expone exportar TSV e importar CSV. En iPad y Mac es el panel izquierdo de una vista dividida.

### Ficha de materia prima
Campos editables tocando el valor o el texto de marcador de posición. Detalles de acabado que merece la pena copiar:

- Pulsación larga o clic derecho sobre `Coste / g` abre una calculadora que deriva el coste unitario de un coste total y un peso total.
- El interruptor "¿tratar como disolvente?" cambia el comportamiento de la materia en todo el motor de escalado.
- Las diluciones se despliegan con `+` y cada una abre una caja de texto para anotar cómo huele a esa concentración.
- Al final de la ficha, la **tabla de uso**: todas las fórmulas donde aparece esa materia, ordenadas de mayor a menor concentración, arrastrando las marcas de "demasiado fuerte / débil". Es la función que los usuarios citan como la que no puede dar un cuaderno.
- Ajuste global para "revolver" esa tabla con entradas falsas y proteger la confidencialidad de las fórmulas si trabajas en público.

### Biblioteca de fórmulas
Igual que la de materias. Pulsación larga sobre el botón `+` crea una **fórmula aleatoria** — un generador de ideas.

### Editor de fórmula
Lista de entradas. Cada entrada: nombre de la materia, campo de peso en gramos, y a la derecha un valor que cicla entre tres modos al tocarlo: concentración absoluta, concentración relativa, y coste de esa entrada. Menú contextual por entrada: ver ficha, marcar como fuerte o débil, sustituir la materia conservando el peso (la nueva entra al 100%), borrar. Barra de navegación con cuatro acciones: compartir, duplicar fórmula, ordenar entradas por distintos criterios, y abrir estadísticas.

### Estadísticas de fórmula
Pirámide olfativa repartida en cinco niveles de sustantividad, más desglose visual por categoría de materia. Desde aquí se asigna la categoría y se escriben las notas de la fórmula.

### Ajustes
Solo tres: formato de exportación (PDF, Markdown o TSV), usar el selector de color de iOS en lugar de la paleta propia, y ocultar la tabla de uso.

---

## 5. El motor de cálculo

Es el corazón del producto y lo que lo separa de una hoja de cálculo. Ocho operaciones, agrupadas en tres familias. La reconstrucción matemática completa está en `docs/03-motor-de-calculo.md`; aquí queda el inventario.

**Cambio de dilución de una entrada** — tres métodos:
1. *Conservar peso*: cambia la dilución dejando el peso pesado igual. Cambia la cantidad de materia pura.
2. *Conservar porcentaje*: mantiene la proporción relativa y ajusta el peso. Como efecto colateral, el peso total varía.
3. *Intercambiar disolvente*: usa el disolvente ya presente en la fórmula para rediluir la entrada, de modo que peso total y concentración se mantienen. Es la operación conceptualmente más lograda de la app: te permite reescribir una fórmula para usar una dilución más concentrada sin cambiar las proporciones, evitando tener que preparar de antemano grandes cantidades de prediluido.

**Escalado respecto a una entrada** — dos métodos: llevar el peso de esa entrada a un valor objetivo, o llevar su concentración a un valor objetivo añadiendo o quitando disolvente libre.

**Escalado respecto al total** — cuatro métodos: a un peso total, por un factor de peso, a un porcentaje absoluto, o por un factor de porcentaje.

La distinción entre **disolvente ligado** (el que está dentro de una dilución) y **disolvente libre** (el que está como entrada propia) es la abstracción que hace que todo esto funcione. Adóptala tal cual.

**Limitación admitida**: el motor mantiene 3 decimales por entrada y redondea en cada paso, lo que produce desviaciones acumuladas al escalar. La FAQ lo reconoce. Es un defecto corregible y merece la pena corregirlo.

---

## 6. Lenguaje visual

Lo que hace que la app se sienta pulida, en orden de importancia:

- **Paleta propia con colores dinámicos**. El usuario asigna un color a cada categoría desde una paleta diseñada que se adapta sola a modo claro y oscuro. Si el usuario usa el selector nativo de iOS, la app avisa de que pierde esa adaptación. Ese nivel de cuidado es el estándar a igualar.
- **Densidad baja y jerarquía clara**. Fichas de tarjeta, campos que se editan in situ tocando el valor, sin modales innecesarios.
- **Todo lo secundario vive en menús contextuales**. Pulsación larga en táctil, clic derecho en escritorio. La superficie visible se mantiene limpia.
- **Un solo valor con tres lecturas**. La cifra de la derecha de cada entrada cambia de significado al tocarla en vez de ocupar tres columnas.
- **Vista dividida en pantallas grandes**, navegación por pila en teléfono, con el mismo modelo mental.

---

## 7. Lo que Formulair no hace (nuestro terreno)

| Hueco | Qué falta | Nuestro documento |
|---|---|---|
| Valoración olfativa | Solo un campo de descripción en texto libre y un entero de sustantividad 0–4 | 04 |
| Jerarquía de fórmulas | Todo es "fórmula". No hay acordes reutilizables ni distinción concentrado/perfume | 02 |
| Stock | El inventario es un campo de texto. No hay lotes, ni consumo, ni caducidad | 02 |
| Compartición | Exporta PDF/MD/TSV para humanos. No hay formato de reimportación entre usuarios | 05 |
| Identidad de materiales | Guarda el CAS como texto libre, sin validar ni resolver | 05 |
| Género | No existe como concepto | 02 |
| IFRA | Un solo número por materia, sin categorías de producto ni cálculo sobre la fórmula | 03 |
| Versiones | Duplicar una fórmula es la única forma de iterar; no hay historial ni comparación | 02 |
| Precisión | Redondeo a 3 decimales acumulativo | 03 |
| Plataformas | Solo Apple | CLAUDE.md |
| Edición por lotes | Inexistente, es la queja más repetida | 02 |

---

## 8. Otros referentes que conviene mirar

- **Perfumers Vault** (`github.com/jbparfum/parfumvault`, licencia MIT, PHP + MariaDB, con imagen Docker). Es la mejor fuente de esquema relacional disponible libremente: gestión de fórmulas con revisiones y comparación, inventario de ingredientes y proveedores, generación de documentos SDS e IFRA, importación CSV/JSON, historial de lotes. **Acción concreta para Claude Code**: clonar el repositorio y leer el directorio `db/` antes de diseñar nuestro esquema, para no reinventar decisiones ya resueltas. Su interfaz es lo contrario de lo que queremos; su modelo de datos, no.
- **Perfume Workbench** (web): versionado de fórmulas, acordes reutilizables insertables con un clic, avisos IFRA en tiempo real, exportación JSON completa. Es el competidor más cercano a lo que planteamos y conviene vigilarlo.
- **The Aroma Forge**: el extremo ERP — seguimiento de lotes, inventario global, costes al céntimo. Reseñado como pesado de usar, con demasiada entrada de datos antes de poder mezclar. Es la trampa en la que no debemos caer al añadir stock.
- **PerfumeLab** (iOS): formulación por porcentajes en lugar de por pesos, biblioteca estructurada de ingredientes, exportación a PDF.
- **The Good Scents Company**: base de referencia de ingredientes con sinónimos y descriptores olfativos. Útil como fuente de consulta para poblar descriptores, con las cautelas de licencia habituales.
