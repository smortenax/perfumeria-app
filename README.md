# perfumeria-app

App de **formulación de perfumería**: formular, documentar cada fórmula con su historia y
comprobar IFRA por sustancia, **sin conexión**. Primero un ejecutable de Windows (Tauri 2);
el móvil, después.

| | |
|---|---|
| 📐 **[Decisiones](docs/decisiones.md)** | **Lo que manda**: qué es la app y cómo se comporta. v3, 2026-09-25 |
| 🗺️ **[Plan de desarrollo](docs/plan-desarrollo.md)** | El orden de trabajo y cuándo está lista la formulación |
| ❓ [Interrogatorio](docs/interrogatorio.md) | De dónde sale cada decisión, con la respuesta literal del usuario |
| 📨 [Encargos al laboratorio](docs/encargos/README.md) | Lo que la app pide investigar al laboratorio, en el formato de sus frentes |
| 🗂️ [Antecedentes](docs/antecedentes/README.md) | Lo escrito antes, **no vinculante**: Formulair, el primer brief, el lenguaje visual, el Banco v2 |

## Los datos

**Todo lo de IFRA sale de IFRA, y nada del laboratorio entra en la app** (P37). Cada carpeta
tiene su `LEEME.md` y un `procedencia.json` con la huella de sus originales. **No se editan a
mano**: los generan los scripts.

| Carpeta | Qué es para la app | La genera |
|---|---|---|
| [`datos/ifra/51/`](datos/ifra/51/LEEME.md) | IFRA, 51.ª enmienda. Los originales van en `origen/`, y de ellos salen los estándares con sus 18 categorías, sus CAS, los constituyentes de los naturales y las bases de Schiff | [`importar_ifra.py`](scripts/importar_ifra.py) |
| [`datos/glosario/`](datos/glosario/LEEME.md) | **El desplegable del buscador:** 3370 materiales, del FIG y de IFRA, cada uno con su abreviatura, su estado frente a IFRA y sus constituyentes | [`generar_glosario.py`](scripts/generar_glosario.py) |
| `datos/fuente/` | Del laboratorio, solo los dos documentos del FIG: sus términos, con **la cita obligatoria de IFRA**, y sus 27 descriptores. Aquí entrará la capa propia (D4) | [`importar_datos.py`](scripts/importar_datos.py) |

🔴 **La regla 1.1 —todo número con su base— vale igual para los CSV.**

## Para arrancarla

```bash
npm install
npm run tauri dev
```

`npm run tauri build` genera el instalador de Windows en `src-tauri/target/release/bundle/`.
El código va en inglés y la interfaz en español, desde [`src/i18n/es.ts`](src/i18n/es.ts).

`npm test` pasa las pruebas del núcleo (`src/core/`): TypeScript puro, sin pantallas.

**Estado:** fases 1 y 2 terminadas: el esqueleto de Tauri 2 y el núcleo, con F-001-v1
reproducida al miligramo. Hay un **banco provisional para pruebas**: el instalador
(`Perfumeria_0.1.0_x64-setup.exe`) abre una pantalla de inicio con «Nuevo banco de
formulación», que lleva a un banco vacío con todo lo que hace el núcleo (ver el
[plan](docs/plan-desarrollo.md), fase 4). El diseño avanza en paralelo, en el
[lienzo de bocetos](https://claude.ai/artifact/RXLX4e5WKR6xFNApMeyphj) y en la
[investigación de visualización](docs/investigacion/2026-09-26-visualizacion-de-datos/README.md).
