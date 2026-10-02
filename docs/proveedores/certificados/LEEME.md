# Certificados de los proveedores del usuario

Certificados de conformidad IFRA de productos concretos que el usuario tiene o va a comprar. Los
PDF son los originales; [`certificados.csv`](certificados.csv) los transcribe
[`scripts/leer_certificados.py`](../../../scripts/leer_certificados.py): los topes por categoría
(sección 1) y cada sustancia con su cantidad en el producto (2.1 prohibidas, 2.2 restringidas).
**No se edita a mano.**

| Archivo | Producto | Proveedor | Revisado | Nota |
|---|---|---|---|---|
| `firmenich-castoreum-synth-184004-ifra51.pdf` | Castoreum Synth 184004 | Firmenich (lo vende Perfumiarz) | 2023-08-25 | El castóreo sintético que el usuario piensa comprar; el suyo de hoy es el absoluto natural, sin constituyentes conocidos. Sus 11 alérgenos coinciden con la lista de Perfumiarz (C-003, sin fila en el glosario); el certificado da 20 sustancias |
| `firmenich-black-agar-296985-ifra51.pdf` | Black Agar 296985 | Firmenich | 2023-08-25 | El ejemplo del formato (P61) |
| `firmenich-habanolide-947303-ifra51.pdf` | Habanolide 947303 | Firmenich | | Aportado por el usuario el 2026-10-02. Declara 5 % de ciclopentadecanolida (Exaltolide), y un tope de Firmenich del 48 % en la cat. 4 |
| `symrise-aldehyde-c11-moa-656012-ifra51.pdf` | Aldehyde C11 MOA 656012 | Symrise | | Aportado por el usuario el 2026-10-02 (la tienda solo enlaza la ficha de seguridad). Declara 0,0046 % de hexilcinamaldehído, y un tope de Symrise del 2,50 % en la cat. 4 |

**Entran en la app ya** (2026-10-02): `scripts/generar_glosario.py` (paso 3e) da a cada producto
una fila del glosario, de clase «base» (`cert:firmenich-184004`), y su sección 2.2 son sus
constituyentes (paso 6c), que la app suma por sustancia con lo que traen los demás materiales
(§5.3). Para añadir otro: se deja su PDF aquí y se ejecutan `leer_certificados.py` y
`generar_glosario.py`. Cuando exista el alta de materiales propios (P61), se hará desde la app.
**El certificado no manda sobre IFRA:** cada sustancia se juzga con los estándares de `datos/ifra/`.

**Transcripciones a mano** ([`transcripciones.csv`](transcripciones.csv)): un certificado que el
script no puede leer (un PDF con cifrado de permisos, como el del acetato de linalilo de BASF) se
transcribe aquí con su fuente, y el registro lo usa como si lo hubiera leído.
