# CLAUDE.md — Brief de proyecto

> Este fichero va en la raíz del repositorio. Claude Code lo lee automáticamente en cada sesión.
> Los documentos de `docs/` son la especificación completa. Léelos antes de escribir código en el área correspondiente.

---

## 1. Qué estamos construyendo

Una aplicación de formulación de perfumería que toma como referente estético y de flujo de trabajo a **Formulair** (ver `docs/01-referente-formulair.md`) y la extiende con cinco cosas que ningún competidor tiene juntas:

1. **Un sistema de valoración olfativa parametrizado y visual** (el *sello olfativo*). Ver `docs/04-lenguaje-olfativo-visual.md`. Es la razón de ser del producto, no una función más.
2. **Una jerarquía real de fórmulas**: materia prima → acorde → concentrado → perfume. Las fórmulas se componen unas dentro de otras. Ver `docs/02-dominio-y-datos.md`.
3. **Una librería global de moléculas con identificadores canónicos**, que permite compartir fórmulas y acordes copiando y pegando texto plano. Ver `docs/05-libreria-global-e-intercambio.md`.
4. **Control de stock real**: lotes, diluciones que consumen de lotes, producción que descuenta, y la pregunta clave "¿puedo fabricar esto y en qué cantidad máxima?".
5. **Eje de género** como variable cultural declarada: intención del autor frente a lectura computada de la composición.

### Qué NO es

No es un ERP. No es un LIMS. No es una red social. La curva de fricción para "abro la app y apunto una idea" tiene que quedarse en cero: ese es exactamente el punto donde Formulair gana a sus competidores pesados y donde no podemos perder.

---

## 2. Principios de diseño (no negociables)

**El cálculo nunca miente.** Formulair admite en su propia FAQ que redondea a 3 decimales por entrada y que eso produce desviaciones al escalar. Nosotros almacenamos masas como enteros en microgramos y calculamos con decimales exactos. Cero aritmética en coma flotante en el dominio. Ver `docs/03-motor-de-calculo.md`.

**Una pantalla, una tarea.** Formulair funciona porque cada pantalla hace una cosa: la biblioteca de materias, la ficha de materia, la fórmula, las estadísticas. No metas paneles laterales con seis widgets.

**El color codifica, no decora.** En Formulair el color de categoría es una decisión de usuario que se propaga a las estadísticas. En nuestro caso el color es *dato olfativo*: el tono del sello viene de la valoración, no del gusto del usuario. Esta es la diferencia central. No permitas que se mezclen los dos usos del color en la misma vista.

**Lo descriptivo y lo hedónico van separados.** "Cómo huele" y "cuánto me gusta" son campos distintos, se capturan distinto y se muestran distinto. Confundirlos destruye el valor del sistema de valoración.

**Local-first.** La app funciona entera sin red. La red aporta la librería global y el intercambio, nunca es requisito para formular.

---

## 3. Stack recomendado

Formulair es Swift nativo sobre CloudKit, y de ahí viene su acabado — y también su límite: solo Apple, sin backend propio, sin comunidad posible. Nosotros necesitamos un servidor para la librería global, así que la decisión cambia.

**Propuesta por defecto** (revísala con el usuario antes de empezar la fase 1):

| Capa | Elección | Motivo |
|---|---|---|
| Núcleo de dominio | TypeScript puro, paquete `@app/core`, sin I/O | Portable, testeable exhaustivamente, reutilizable en servidor y cliente |
| Aritmética | `decimal.js` o `big.js`; almacenamiento en µg enteros | Precisión exacta, ver doc 03 |
| UI | React + Vite + TypeScript | Ecosistema, y permite empaquetar a móvil y escritorio |
| Estado | TanStack Query + Zustand | Separación limpia servidor/cliente |
| Persistencia local | SQLite (`wa-sqlite` / OPFS en web, `expo-sqlite` en móvil) | Consultas reales sobre la biblioteca, no un blob JSON |
| Sincronización | Cola de operaciones propia contra Postgres, o PowerSync/ElectricSQL | Local-first de verdad |
| Backend | Postgres + PostgREST/Supabase, o Hono + Drizzle | La librería global es relacional por naturaleza |
| Empaquetado | Tauri (escritorio) + Capacitor (iOS/Android) | Multiplataforma desde un código |
| Gráficos | SVG generado a mano, sin librería de charting | El sello olfativo es SVG específico, ver doc 04 |

**Alternativa** si se prioriza el acabado nativo Apple por encima de todo: SwiftUI + SwiftData + CloudKit para el cliente, y un backend aparte solo para librería global e intercambio. Coste: se pierde Android y Windows, que es justo la queja recurrente de los usuarios de Formulair.

En cualquier caso: **el núcleo de dominio se escribe primero, aislado y con tests, antes de tocar una sola pantalla.**

---

## 4. Estructura del repositorio

```
/
├── CLAUDE.md
├── docs/
│   ├── 01-referente-formulair.md      Análisis del referente
│   ├── 02-dominio-y-datos.md          Modelo de datos y jerarquía
│   ├── 03-motor-de-calculo.md         Matemática, IFRA, casos de prueba
│   ├── 04-lenguaje-olfativo-visual.md Sistema de valoración y sello
│   └── 05-libreria-global-e-intercambio.md
├── packages/
│   ├── core/          Dominio puro: cálculo, aplanado, valoración, códigos
│   ├── seal/          Generación de SVG del sello olfativo
│   ├── exchange/      Serializar/parsear el formato de intercambio
│   ├── db/            Esquema, migraciones, repositorios
│   └── ui/            Componentes compartidos y tokens de diseño
├── apps/
│   ├── client/        Aplicación
│   └── server/        API de librería global e intercambio
└── fixtures/
    ├── formulas/      Fórmulas de referencia para tests golden
    └── materials/     Semilla de materias primas
```

---

## 5. Convenciones

- **Idioma**: la documentación y la interfaz en español; el código, los identificadores, los nombres de tabla y los comentarios en inglés. Los textos de interfaz salen siempre de ficheros de traducción, nunca inline — habrá versión en inglés.
- **Unidades**: internamente todo en microgramos enteros (`bigint`). La interfaz muestra gramos con 3 decimales. Nunca guardes gramos como `number`.
- **Porcentajes**: guardados como enteros en partes por millón (`ppm`), no como `0.125`.
- **Identificadores**: UUIDv7 para entidades locales; los códigos canónicos de material (ver doc 05) son claves de negocio, no claves primarias.
- **Tests**: cada operación del motor de cálculo tiene un test golden con una fórmula real de `fixtures/`. Si cambias el motor y un golden se rompe, no actualices el golden: explica por qué el resultado anterior era incorrecto.
- **Migraciones**: siempre reversibles, siempre con datos de prueba.

---

## 6. Hoja de ruta

### Fase 0 — Núcleo (sin interfaz)
`packages/core` con: modelo de entidades, aritmética exacta, aplanado de acordes, las ocho operaciones de escalado y dilución del doc 03, y su batería de tests. Criterio de salida: los casos de prueba del doc 03 pasan todos.

### Fase 1 — Paridad con el referente
Biblioteca de materias primas con ficha, categorías con color, fórmulas con entradas y diluciones, escalado, tabla de uso por materia, pirámide olfativa, exportación a PDF/Markdown/TSV, importación CSV. Criterio de salida: un usuario de Formulair puede migrar sus datos y trabajar igual.

### Fase 2 — Jerarquía y stock
Acordes como entidades compuestas, vista plegada y desplegada, concentrado y perfume como niveles distintos, lotes, consumo, alertas, y la función "cantidad máxima fabricable". Criterio de salida: producir un lote descuenta stock correctamente en todo el árbol.

### Fase 3 — Sistema olfativo
Protocolo de cata guiado, ejes con anclas de calibración, el sello en sus tres modos, comparador de sellos, sello agregado de fórmula. Criterio de salida: dos catadores distintos evalúan la misma materia y la dispersión se ve en el sello.

### Fase 4 — Librería global e intercambio
Códigos canónicos, resolución al pegar, formato de texto e importación, atribución y licencia, grafo de derivaciones. Criterio de salida: una fórmula copiada en WhatsApp y pegada en otra instalación se reconstruye idéntica.

### Fase 5 — Género, IFRA y afinado
Índice de género computado, comprobación IFRA por categoría de producto, informes.

---

## 7. Riesgos conocidos

- **IFRA**: los límites son datos que el usuario introduce o importa. No incluyas una base IFRA precargada sin verificar la licencia; Formulair evita deliberadamente hacerlo. Diseña el modelo para admitirla, pero deja el dato fuera del repositorio.
- **Nombres comerciales**: muchos materiales de perfumería son bases o cautivos propietarios sin estructura pública. El sistema de códigos tiene que degradar con elegancia, no fallar. Ver doc 05.
- **El sello puede volverse decorativo**. Cada canal visual codifica exactamente un eje. En cuanto un canal codifique dos cosas o ninguna, el lenguaje deja de ser legible y el proyecto pierde su diferencial.
- **Sobrecarga de la cata**. Si evaluar una materia cuesta quince minutos, nadie lo hará. El protocolo tiene un modo rápido de seis ejes y uno completo. Ver doc 04.
