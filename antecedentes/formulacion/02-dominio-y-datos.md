# 02 — Dominio y modelo de datos

---

## 1. La jerarquía de composición

Formulair tiene un solo nivel: "fórmula". Nosotros necesitamos cuatro, porque un acorde y un perfume no son la misma clase de objeto ni se manipulan igual.

```
Material        Materia atómica. Molécula, natural o base comercial.
   ↓
Accord          Composición reutilizable. Solo materiales y otros acordes.
                Expresada en partes relativas. Sin disolvente. Suma normalizada a 1000.
                Es la unidad de intercambio y tiene sello olfativo propio.
   ↓
Concentrate     El jus. Materiales y acordes. Expresado en peso.
                Puede llevar disolvente para diluciones de trabajo.
   ↓
Perfume         Concentrado + vehículo (alcohol, aceite, cera) a una graduación dada.
                Es lo que se produce, se etiqueta y se vende.
```

### Reglas de composición

- Un `Accord` puede contener `Material` y `Accord`. Profundidad máxima 5. Prohibida la recursión: al insertar, se comprueba el ciclo con una travesía del grafo y se rechaza con un error explícito, nunca con un desbordamiento de pila.
- Un `Accord` **no contiene disolventes ni vehículos**. Si lo necesitas diluido para olerlo, eso es una dilución de trabajo, no parte del acorde.
- Un `Concentrate` puede contener `Material`, `Accord` y disolvente.
- Un `Perfume` referencia exactamente un `Concentrate`, un vehículo y una graduación. La graduación es lo que distingue extracto, eau de parfum y eau de toilette, y es el número que necesita el cálculo IFRA.

### Vista plegada y vista desplegada

Toda composición se muestra en dos modos, y el conmutador vive en la barra de la fórmula:

- **Plegada**: el acorde aparece como una sola línea, con su nombre, su sello olfativo y su peso. Es como se piensa y como se escribe.
- **Desplegada**: el acorde se sustituye por sus componentes, con los pesos ya repartidos. Es como se pesa en la balanza y como se calcula todo lo que importa.

**Regla dura**: porcentajes reales, coste, IFRA, pirámide y consumo de stock se calculan **siempre sobre la versión desplegada**. La vista plegada es exclusivamente de presentación. El algoritmo de aplanado está en `docs/03-motor-de-calculo.md` §4.

Un acorde insertado en un concentrado guarda una referencia con `pinnedVersion`. Si el acorde cambia después, la fórmula que lo usa **no cambia sola**: aparece un aviso de "hay una versión más reciente de este acorde" y el usuario decide si actualiza. Esto es imprescindible para la reproducibilidad de lo ya producido.

---

## 2. Entidades

Notación: `?` opcional, `[]` colección, `→` relación.

### Material

```
id                 uuid
canonicalCode      texto           Ver doc 05. Único cuando existe.
name               texto           Nombre de trabajo del usuario
displayName?       texto           Nombre comercial si difiere
kind               enum            molecule | natural | base | solvent | vehicle
cas?               texto[]         Un natural puede tener varios
inchiKey?          texto
supplier?          → Supplier
category?          → Category
colorOverride?     texto           Color manual; por defecto lo da el sello
costPerGram?       decimal
density?           decimal         Necesario para convertir volumen↔peso
ifraLimits?        [→ IfraLimit]
volatilityClass    0..4            Salida … fondo. Compatible con Formulair
tenacityHours?     decimal         Valor medido; sustituye a la clase cuando existe
isSolvent          bool
defaultDilution    ppm             Concentración a la que se pesa por defecto
notes?             texto
seal?              → OlfactiveSeal
gender?            → GenderCoding
createdAt, updatedAt
```

### Accord

```
id, name, description?
category?          → Category
version            entero          Incrementa en cada cambio guardado
parentAccord?      → Accord        Grafo de derivaciones
components         [AccordComponent]
seal?              → OlfactiveSeal
contentHash        texto           Hash del contenido normalizado. Ver doc 05
license            enum            private | attribution | open
authorHandle?      texto
```

### AccordComponent

```
id
parent             → Accord
target             → Material | → Accord   (polimórfico)
targetVersion?     entero                   Solo si target es Accord
parts              entero                   Partes relativas. La suma se normaliza a 1000
note?              texto
```

### Concentrate

```
id, name, category?, notes?
version            entero
entries            [ConcentrateEntry]
seal?              → OlfactiveSeal
genderIntent?      GenderValue     Declarado por el autor
targetProfile?     → OlfactiveSeal Perfil objetivo, para comparar contra el real
createdAt, updatedAt
```

### ConcentrateEntry

```
id
parent             → Concentrate
target             → Material | → Accord
targetVersion?     entero
massUg             bigint          Masa PESADA, incluyendo el disolvente de la dilución
dilutionPpm        entero          Concentración de la materia en lo que se pesa
mark?              enum            tooStrong | tooWeak
lockedForScaling   bool            Si es true, el escalado no toca esta entrada
note?              texto
```

`massUg` + `dilutionPpm` reproduce exactamente el modelo de Formulair, que funciona. `lockedForScaling` es una mejora: permite escalar una fórmula dejando fijo el disolvente o un ingrediente crítico.

### Perfume

```
id, name
concentrate        → Concentrate
concentrateVersion entero
vehicle            → Material      Alcohol, aceite portador, cera
strengthPpm        entero          Graduación: 200000 = 20%
waterPpm?          entero
productCategory    enum            Categoría IFRA de producto final, 1..12
macerationDays?    entero
genderIntent?      GenderValue
batches            [Batch]
```

### Supplier, Category

Como en Formulair. `Category` con color, aplicable a materiales, acordes y concentrados mediante un campo `scope`, en lugar de tener gestores separados y desconectados.

---

## 3. Stock

Aquí está la diferencia de fondo con Formulair, donde el inventario es un campo de texto. Modelamos existencias reales, pero sin convertir la app en un ERP: **el stock nunca bloquea la creación**. Se puede formular con materias que no tienes; simplemente aparecen marcadas.

### Lot

Un lote es una compra concreta de un material.

```
id
material           → Material
supplierRef?       texto           Referencia o número de lote del proveedor
purchasedAt        fecha
openedAt?          fecha
expiresAt?         fecha
initialMassUg      bigint
currentMassUg      bigint
purchasePrice?     decimal
currency?          texto
concentrationPpm   entero          1000000 para material puro
parentLot?         → Lot           Si es una dilución preparada a partir de otro lote
solventLot?        → Lot           De qué lote salió el disolvente de esta dilución
location?          texto           Estante, caja, nevera
notes?
```

Una **dilución preparada** es un `Lot` propio con `concentrationPpm < 1000000` y `parentLot` apuntando al lote puro. Al crearla se descuenta del lote padre y del lote de disolvente. Esto responde sola la pregunta "¿de qué botella salió esto?", que es exactamente lo que Formulair pide anotar a mano.

### StockMovement

Libro de movimientos, solo-añadir. Nunca se edita `currentMassUg` directamente: se registra un movimiento y se recalcula.

```
id
lot                → Lot
massUg             bigint          Negativo para salidas
reason             enum            purchase | dilution | production | sample | loss | correction | evaporation
reference?         uuid            Batch, Lot hijo, etc.
occurredAt         fecha
note?
```

### Batch

Producción real de un perfume o concentrado.

```
id
target             → Perfume | → Concentrate
targetVersion      entero
plannedMassUg      bigint
actualMassUg?      bigint
producedAt         fecha
snapshot           json            Copia congelada de la fórmula desplegada
movements          [→ StockMovement]
cost               decimal         Coste real calculado con los precios de los lotes usados
notes?
```

El `snapshot` es innegociable: lo que se produjo tiene que quedar reproducible aunque la fórmula evolucione después.

### Funciones derivadas del stock

Tres, y las tres son valor visible para el usuario:

1. **Viabilidad**: dada una fórmula y una masa objetivo, ¿alcanza el stock? Devuelve la lista de faltantes con el déficit exacto en gramos.
2. **Lote máximo fabricable**: `min` sobre todos los componentes de `stockDisponible_i / fracción_i`. Es la respuesta a "¿cuánto puedo hacer ahora mismo?" y no la da ningún competidor ligero.
3. **Avisos**: existencias bajo umbral, lotes caducando en 60 días, lotes abiertos hace más de N meses. Umbrales por material, con valor por defecto global.

**Aviso de diseño**: presenta el stock como una capa que se enciende, no como una obligación. Un icono discreto en la entrada de fórmula y un panel bajo demanda. En el momento en que haya que rellenar campos de inventario antes de poder escribir una fórmula, hemos perdido lo que fuimos a buscar.

---

## 4. El eje de género

El usuario pide "control de género". Se modela como **variable cultural declarada**, nunca como propiedad intrínseca del olor, y se dice así en la interfaz.

### GenderCoding sobre un material

```
polarity           -1000..1000     -1000 codificado femenino, +1000 masculino, 0 neutro
ambiguity          0..1000         Dispersión del consenso. Alto = lectura muy variable
source             enum            selfRated | panel | curated | inferred
sampleSize?        entero
```

### GenderValue sobre una fórmula

Dos números distintos, y mostrar los dos juntos es la función:

- **Intención**: lo que declara el autor. Un valor único en el mismo rango.
- **Lectura computada**: media de la `polarity` de los componentes ponderada por su contribución olfativa, no por su masa. La ponderación usa el peso perceptual del componente (ver `docs/04` §7), porque 0,5 g de un aldehído pesa más en la lectura que 20 g de dipropilenglicol.

```
readPolarity = Σ (polarity_i · weight_i) / Σ weight_i
donde weight_i = fracciónMasa_i · potencia_i
```

La interfaz muestra una barra con dos marcas: dónde querías estar y dónde estás. La brecha entre ambas es información de diseño accionable — "querías un fondo masculino y la lectura te sale neutra: la culpa es de estos tres materiales", con la lista ordenada por contribución.

También sirve de filtro en la biblioteca, de faceta en la librería global y de etiqueta en los informes.

### Precaución de producto

En la interfaz esto se llama **codificación de género** o **convención de mercado**, y lleva una nota breve, una sola vez, explicando que refleja asociaciones culturales aprendidas y no propiedades del material. Es honesto y además es lo que lo hace útil: un perfumista quiere saber cómo *se leerá* su fórmula, y esa lectura es cultural por definición.

---

## 5. Versionado y comparación

- `Accord` y `Concentrate` llevan `version` entera y una tabla `Revision` con el diff serializado, autor, fecha y mensaje.
- **Comparador de dos versiones**: tabla a tres columnas con entradas añadidas, quitadas y modificadas, con el delta en gramos y en porcentaje relativo. Es una de las carencias más citadas de Formulair, donde la única forma de iterar es duplicar.
- `parentAccord` / `parentConcentrate` construyen un grafo de derivaciones. Sirve para el historial personal y, con la librería global, para el grafo de bifurcaciones entre usuarios.

---

## 6. Edición por lotes

Queja número uno de las reseñas de Formulair, y es barata de resolver: modo selección múltiple en la biblioteca, con acciones de asignar categoría, asignar proveedor, ajustar coste por porcentaje, marcar como disolvente, exportar selección y borrar. Añádelo en la fase 1, no lo dejes para después.

---

## 7. Esquema SQL de referencia

Fragmento de las tablas centrales, para arrancar las migraciones. Los tipos son de Postgres; en SQLite, `bigint` → `INTEGER` y `numeric` → `TEXT` con conversión en el repositorio.

```sql
create table materials (
  id              uuid primary key,
  canonical_code  text unique,
  name            text not null,
  kind            text not null check (kind in
                    ('molecule','natural','base','solvent','vehicle')),
  inchi_key       text,
  supplier_id     uuid references suppliers(id) on delete set null,
  category_id     uuid references categories(id) on delete set null,
  cost_per_gram   numeric(12,4),
  density         numeric(8,4),
  volatility_class smallint check (volatility_class between 0 and 4),
  tenacity_hours  numeric(8,2),
  is_solvent      boolean not null default false,
  default_dilution_ppm integer not null default 1000000,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table material_cas (
  material_id uuid references materials(id) on delete cascade,
  cas         text not null,
  primary key (material_id, cas)
);

create table accords (
  id           uuid primary key,
  name         text not null,
  version      integer not null default 1,
  parent_id    uuid references accords(id) on delete set null,
  content_hash text not null,
  license      text not null default 'private',
  category_id  uuid references categories(id) on delete set null,
  description  text
);

create table accord_components (
  id             uuid primary key,
  accord_id      uuid not null references accords(id) on delete cascade,
  material_id    uuid references materials(id) on delete restrict,
  sub_accord_id  uuid references accords(id) on delete restrict,
  sub_version    integer,
  parts          integer not null check (parts > 0),
  note           text,
  check (num_nonnulls(material_id, sub_accord_id) = 1)
);

create table concentrate_entries (
  id             uuid primary key,
  concentrate_id uuid not null references concentrates(id) on delete cascade,
  material_id    uuid references materials(id) on delete restrict,
  accord_id      uuid references accords(id) on delete restrict,
  accord_version integer,
  mass_ug        bigint not null check (mass_ug >= 0),
  dilution_ppm   integer not null check (dilution_ppm between 1 and 1000000),
  mark           text check (mark in ('tooStrong','tooWeak')),
  locked         boolean not null default false,
  note           text,
  check (num_nonnulls(material_id, accord_id) = 1)
);

create table lots (
  id                 uuid primary key,
  material_id        uuid not null references materials(id) on delete cascade,
  supplier_ref       text,
  purchased_at       date,
  opened_at          date,
  expires_at         date,
  initial_mass_ug    bigint not null,
  current_mass_ug    bigint not null,
  concentration_ppm  integer not null default 1000000,
  parent_lot_id      uuid references lots(id) on delete set null,
  solvent_lot_id     uuid references lots(id) on delete set null,
  purchase_price     numeric(12,2),
  currency           text,
  location           text
);

create table stock_movements (
  id           uuid primary key,
  lot_id       uuid not null references lots(id) on delete cascade,
  mass_ug      bigint not null,
  reason       text not null,
  reference_id uuid,
  occurred_at  timestamptz not null default now(),
  note         text
);
create index on stock_movements (lot_id, occurred_at);
```
