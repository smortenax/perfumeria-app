# Cómo editar la app desde otro repositorio: push, pull, datos y versiones

Guía práctica para cambiar `perfumeria-app` (la app de la v3, sus datos y su esquema) trabajando
desde otro repositorio tuyo, sin romper `main` ni la web. Escrita el 2026-11-24 a partir de lo que
hay en el repo ese día: `.github/workflows/publicar-v3.yml`, `migracion-v3/LEEME.md`,
`v3/CLAUDE.md` y la sección «Ramas y publicación» del `CLAUDE.md` de la raíz.

En los comandos, `OTRO_REPO` es tu otro repositorio y `C:\Users\SERGI\Claude\Projects` la carpeta
donde tienes los repos. Los comandos valen tal cual en Git Bash y en PowerShell, salvo donde se dice.

---

## 0. Lo esencial, en seis reglas

1. **Fusionar en `main` es publicar.** Cada cambio de `v3/` que entra en `main` lanza la Action
   «Publicar v3», que comprueba, migra la base de la nube, carga los datos comunes y despliega la web.
2. **Nunca se trabaja directamente en `main`**: rama nueva desde el `main` actual, y una PR.
3. **Nunca `push --force` a `main`.** En tu propia rama, solo `--force-with-lease`, y solo si sabes
   por qué.
4. **Antes de empezar, `git pull`; antes de pedir la PR, traer `main` a tu rama.**
5. **Los datos (`v3/datos/`) no se editan a mano**: los escribe una tanda de `migracion-v3/` y se
   aprueban con `aprobar.ts`.
6. **Las claves nunca van a Git**: `.env.local` se queda en tu PC; en la nube son secretos del repo.

---

## 1. Qué hay en el repo y qué publica qué

| Lo que cambias | Dónde vive | Cómo llega a la web |
|---|---|---|
| Código de la app | `v3/src/`, `v3/public/`, `v3/index.html` | PR → `main` → la Action hace `tsc`, pruebas, build y `wrangler deploy` (Cloudflare) |
| Esquema de la base | `v3/supabase/migrations/*.sql` | La Action hace `supabase db push` contra la nube |
| Datos comunes (materiales, IFRA…) | `v3/datos/*.csv`, escritos por `migracion-v3/tanda-*.ts` | La Action hace `npm run datos:cargar:nube` |
| Reglas de sincronización | `v3/powersync/sync-config.yaml` | **A mano**, en el panel de PowerSync Cloud (instancia Perfurepo, Sync Rules). La Action solo avisa |
| Datos de tu cuenta (tu laboratorio) | `migracion-v3/tandas/<n>-…/` | **A mano, desde tu PC**: `node migracion-v3/cargar-laboratorio.ts <tu correo> --nube --tanda=<n>-…` |
| Documentación de la v3 | `docs-v3/` | No publica nada (la Action solo mira `v3/**`) |
| La v2 de la raíz (`src/`, `datos/`, `src-tauri/`) | raíz | **No se toca** (V3-21) |

Comprobar que se ha publicado: pestaña **Actions** del repo en GitHub, ejecución «Publicar v3» del
commit de la fusión, en verde. Si está en rojo, nada de la nube ha cambiado en los pasos que
fallaron; se mira el registro, se arregla en una rama nueva y otra PR.

---

## 2. Elegir el montaje

Hay tres formas de editar este repo «desde otro». **La recomendada es la A.**

### A. Dos clones, uno al lado del otro (recomendada)

Cada repo en su carpeta, con su propio historial. Trabajas en `OTRO_REPO` y, cuando toca cambiar la
app, abres la carpeta de `perfumeria-app` (o una sesión de Claude con ese repo). Es lo más simple y
lo único que no mezcla historiales.

```
C:\Users\SERGI\Claude\Projects\
├── perfumeria-app\     ← este repo
├── Perfumery\          ← el laboratorio (cargar-laboratorio.ts lo busca en ../Perfumery)
└── OTRO_REPO\
```

El laboratorio **tiene** que estar al lado, con el nombre `Perfumery`: los scripts lo leen de
`../Perfumery` y no escriben allí.

### B. Una copia de `v3/` dentro del otro repo, sincronizada con `git subtree`

Solo si `OTRO_REPO` va a llevar dentro la app (por ejemplo, cuando la v3 se mude a su propio
repositorio, como prevé V3-21). Ver la sección 9. Es más delicado: dos copias del mismo código que
hay que mantener iguales.

### C. Una sesión de Claude de otro proyecto

Si trabajas con Claude desde un proyecto que tiene otro repo, añade `smortenax/perfumeria-app` a
ese proyecto (en los ajustes del proyecto, repositorios) para que la sesión pueda clonarlo, hacer
su rama y abrir la PR. Las mismas reglas de esta guía valen para ella: el `CLAUDE.md` de la raíz
se lo dice al arrancar.

---

## 3. Preparación (una vez por PC)

### 3.1. Identidad y finales de línea

```bash
git config --global user.name  "smortenax"
git config --global user.email "<el correo de tu cuenta de GitHub>"
# El repo fija LF con .gitattributes; que Git no lo cambie en Windows:
git config --global core.autocrlf false
# Que un pull nunca reescriba tu historial sin preguntarte:
git config --global pull.ff only
```

`.gitattributes` ya fuerza LF en todo el texto y CRLF solo en los `.cmd`. Guarda los archivos en
UTF-8.

### 3.2. Acceso a GitHub (elige una)

Qué credencial va dónde, en [`credenciales-desde-otro-repo.md`](credenciales-desde-otro-repo.md).


- **HTTPS con Git Credential Manager** (viene con Git para Windows): el primer `git push` abre el
  navegador para entrar en GitHub y se acuerda. Es lo más sencillo.
- **`gh auth login`** (GitHub CLI): elige HTTPS y «Login with a web browser».
- **SSH**: `ssh-keygen -t ed25519`, sube la clave pública en GitHub → Settings → SSH and GPG keys,
  y clona con `git@github.com:smortenax/perfumeria-app.git`.

Nunca pegues un token en una URL de remoto ni en un archivo del repo.

### 3.3. Clonar y comprobar los remotos

```bash
cd C:/Users/SERGI/Claude/Projects
git clone https://github.com/smortenax/perfumeria-app.git
git clone https://github.com/smortenax/perfumeria-lab.git Perfumery   # si no lo tienes ya
cd perfumeria-app
git remote -v          # origin → github.com/smortenax/perfumeria-app
```

### 3.4. Lo de la v3 en local (solo si vas a probar la app en tu PC)

Dentro de `v3/`: `npm ci`, `npm run env:local` (escribe `.env.local`), Docker Desktop abierto y
doble clic en `Abrir Perfumería.cmd`. `.env.example` lista los nombres de las variables;
los valores van solo en `.env.local`, que Git ignora.

---

## 4. El ciclo de trabajo, paso a paso

### 4.1. Antes de empezar

```bash
cd C:/Users/SERGI/Claude/Projects/perfumeria-app
git status                      # tiene que decir «nothing to commit»; si no, guarda o descarta primero
git switch main
git pull                        # trae lo último de main
git fetch --prune origin        # y la lista de ramas al día
```

**Mira si hay trabajo pendiente en otras ramas** (regla del 2026-10-27):

```bash
git for-each-ref --format='%(refname:short)' refs/remotes/origin | while read b; do
  n=$(git rev-list --count origin/main..$b); [ "$n" -gt 0 ] && echo "$b  $n commits"; done
```

(En PowerShell, usa Git Bash para este bucle.) Una rama con pocos commits que `main` no tiene puede
ser trabajo sin fusionar: se trae o se fusiona **antes** de empezar algo nuevo. Las que salen con
cientos de commits suelen ser ramas viejas de antes de la PR #9, con historial distinto; no se
fusionan sin mirarlas.

### 4.2. Crear tu rama

```bash
git switch -c <tema-corto>      # p. ej. etiquetas-p15 o tanda-67-pedido-25-nov
```

Una sola rama de trabajo a la vez, siempre desde el `main` recién traído.

### 4.3. Cambiar, comprobar, guardar

```bash
# … editas …
cd v3
npx tsc -b && npm test && npm run build      # lo mismo que la Action; si falla aquí, fallará allí
cd ..
git add <archivos concretos>                 # mejor que «git add .»: así no se cuela un .env
git status                                   # repasa la lista antes de confirmar
git commit -F mensaje.txt                    # en Windows, el mensaje desde un archivo (tildes, «»)
```

Un commit por paso terminado, con un mensaje que diga qué y por qué, en español.

### 4.4. Subir y abrir la PR

```bash
git push -u origin <tema-corto>
```

GitHub muestra un enlace «Compare & pull request». La PR va contra `main`. Si `main` ha avanzado
mientras trabajabas, trae sus cambios **a tu rama** (sección 6) antes de fusionar.

### 4.5. Fusionar y comprobar que está en la web

1. Fusiona la PR en GitHub (botón «Merge pull request»).
2. Pestaña **Actions** → «Publicar v3» del commit de la fusión → espera al verde.
3. Si cambiaste `v3/powersync/sync-config.yaml`, despliégalo a mano en PowerSync Cloud.
4. Si la tanda era de tu cuenta, cárgala desde tu PC (sección 5.3).
5. `git switch main && git pull`, y borra la rama: `git branch -d <tema-corto>` y
   `git push origin --delete <tema-corto>`.

Hasta el paso 2 en verde, el cambio está «en `main`», no «en la web».

---

## 5. Cambios de datos

### 5.1. Datos comunes (`v3/datos/`): siempre por tanda

`v3/datos/` no se edita a mano: lo escribe la migración, con la cita de cada dato.

1. **Número de tanda:** el siguiente libre mirando `migracion-v3/tandas/` en `main` **y** en las
   ramas abiertas (dos ramas no pueden usar el mismo número). Hoy la última es la 66.
2. **Escribir la tanda:** `migracion-v3/tanda-<n>-<nombre>.ts`, que lee las fuentes y escribe sus
   CSV y su `informe.md` en `migracion-v3/tandas/<n>-<nombre>/`. Determinista: dos ejecuciones dan
   los mismos bytes.
   ```bash
   node migracion-v3/tanda-<n>-<nombre>.ts
   ```
3. **Revisar el informe** y aprobar con tus palabras:
   ```bash
   node migracion-v3/aprobar.ts <n>-<nombre> "<tu frase de aprobación>"
   ```
   Copia los CSV a `v3/datos/` y apunta la aprobación, con el `sha256` de cada archivo, en
   `migracion-v3/tandas/aprobadas.csv` y en `v3/datos/tandas.csv`.
4. **Probar en local** (opcional): desde `v3/`, `npm run datos:cargar`. Una segunda carga no cambia
   ninguna fila.
5. **Commit y PR.** Al fusionar, la Action hace `npm run datos:cargar:nube`.

### 5.2. Por qué no se toca un CSV a mano

`tandas.csv` guarda el `sha256` de cada CSV aprobado: un CSV editado a mano ya no coincide con lo
aprobado, y la siguiente tanda que lo regenere pisará el cambio. Si un dato está mal, se corrige en
el script de la tanda (o en una tanda nueva) y se vuelve a aprobar.

### 5.3. Datos de tu cuenta (tu laboratorio)

No pasan por la Action. Con la tanda aprobada y en `main`, desde la raíz del repo:

```bash
node migracion-v3/cargar-laboratorio.ts <tu correo> --prueba --tanda=<n>-<nombre>   # carga y deshace: ensayo
node migracion-v3/cargar-laboratorio.ts <tu correo> --nube   --tanda=<n>-<nombre>   # de verdad, en la nube
```

`--nube` usa `DATABASE_URL_CLOUD` de `v3/.env.local`. Una segunda carga no cambia nada, y lo que
cambiaste en la app desde entonces se respeta.

---

## 6. Traer cambios (pull) sin perder nada

### 6.1. Traer `main` a tu rama

```bash
git switch <tu-rama>
git fetch origin
git merge origin/main           # merge, no rebase, si la rama ya está subida
# resuelve conflictos si los hay (6.2), luego:
git push
```

`rebase` reescribe tus commits: úsalo solo en una rama que no hayas subido todavía.

### 6.2. Conflictos

- **En código:** abre el archivo, busca `<<<<<<<`, `=======`, `>>>>>>>`, deja la versión buena,
  borra las marcas, `git add <archivo>` y `git commit`. Antes de subir, `tsc`, pruebas y build.
- **En CSV generados (`v3/datos/`, `migracion-v3/tandas/`):** **no se resuelven a mano.** Quédate
  con la versión de `main` (`git checkout --theirs <archivo>` durante el merge), vuelve a ejecutar
  tu tanda y `aprobar.ts`, y confirma el resultado.
- **En `tandas.csv` / `aprobadas.csv`:** suelen ser dos líneas añadidas al final por dos ramas; se
  conservan las dos, en orden de tanda.
- **En una migración SQL:** no debería pasar (cada una es un archivo nuevo). Si dos ramas crean
  migraciones, conserva las dos; si chocan, la de tu rama se rehace con una marca de tiempo
  posterior.
- **Si te lías:** `git merge --abort` deja la rama como estaba antes del merge.

### 6.3. Cambios sin guardar cuando quieres hacer pull

```bash
git stash push -m "a medias"    # los aparta
git pull
git stash pop                   # los recupera
```

---

## 7. Precauciones de Git

- **`main` está prohibido para `push --force`** y para commits directos. Recomendado: en GitHub →
  Settings → Branches, una regla de protección para `main` que exija PR y bloquee los force-push.
- **`--force-with-lease`, nunca `--force`**, y solo en tu propia rama: falla si alguien subió algo
  que no tienes, en vez de borrarlo.
- **Si `git push` te lo rechaza** porque el remoto tiene commits que tú no: `git pull` (o
  `git fetch` + `git merge`), y vuelve a subir. Nunca fuerces para «arreglarlo».
- **Nada de secretos:** `.env.local`, contraseñas, tokens, `supabase/signing_key.json`. Si se
  cuela uno en un commit, no basta con borrarlo en el siguiente: hay que cambiar la clave.
- **`git add` con nombres de archivo**, y `git status` antes de cada commit.
- **No se tocan** la v1 congelada (`datos/glosario/`, `scripts/generar_glosario.py`), la v2 de la
  raíz, ni el laboratorio (`../Perfumery`) salvo para marcar como llevada una entrada de la bandeja.
- **Una migración SQL ya publicada no se edita nunca:** el cambio va en una migración nueva.
  `supabase db push` solo aplica las que la nube no tiene.
- **Copia de seguridad antes de algo gordo:**
  ```bash
  git tag respaldo-2026-11-24 && git push origin respaldo-2026-11-24   # marca recuperable en GitHub
  git bundle create ../perfumeria-app-2026-11-24.bundle --all          # el repo entero en un archivo
  ```
  Un `bundle` se clona como un repo: `git clone perfumeria-app-2026-11-24.bundle`.
- **Deshacer:**
  - Un commit ya en `main`: `git revert <commit>` en una rama y PR (no reescribe historial; la
    Action vuelve a publicar).
  - Algo que creías perdido en tu PC: `git reflog` enseña dónde estuvo cada rama, y
    `git switch -c rescate <hash>` lo recupera.
  - Un dato publicado: se corrige con una tanda nueva; el revert del CSV no borra filas de la nube.

---

## 8. Versiones

Hay cuatro cosas que llevan versión, y cada una se lee en su sitio:

| Qué | Dónde | Cómo cambia |
|---|---|---|
| **La app** | `v3/package.json`, campo `version` (hoy `0.3.0`) | A mano, en la PR que lo merece: `0.3.1` arreglo, `0.4.0` función nueva, `1.0.0` cuando la des por estable |
| **El esquema de la base** | `v3/supabase/migrations/<AAAAMMDDhhmmss>_<nombre>.sql` | Cada cambio, un archivo nuevo con su marca de tiempo; el orden de los nombres es el orden en que se aplican |
| **Los datos comunes** | `v3/datos/tandas.csv` (tanda, fecha, aprobación, archivo, `sha256`) | Cada tanda aprobada añade sus líneas |
| **Lo que hay cargado en una base** | tabla `data_version` (commit de los datos y tandas), V3-26 | La escribe `npm run datos:cargar` / `datos:cargar:nube` en cada carga |

`data_version` es la respuesta a «¿con qué datos está la web?»: el commit que guarda se busca en
GitHub y se ve qué `v3/datos/` había.

### Etiquetas (tags)

Hoy hay dos: `glosario-v1` y `v2-final`, marcas de hitos. **Propuesta de esta guía (no decidida):**
cuando subas `version` en `v3/package.json` y la Action quede en verde, etiqueta el commit de la
fusión:

```bash
git switch main && git pull
git tag -a v3-0.4.0 -m "v3 0.4.0: <qué trae>"
git push origin v3-0.4.0
```

El prefijo `v3-` evita mezclarlas con las de la v1 y la v2. Una etiqueta subida no se mueve: si te
equivocas, se crea la siguiente.

---

## 9. Montaje B: la app dentro de otro repo con `git subtree`

Para cuando `OTRO_REPO` lleve una copia de `v3/` (y quizá de `docs-v3/`) que quieras mantener al
día en los dos sentidos.

### 9.1. Una vez: la primera copia

```bash
cd C:/Users/SERGI/Claude/Projects/perfumeria-app
git switch main && git pull
git subtree split --prefix=v3 -b solo-v3          # v3/ sola, como rama propia
cd ../OTRO_REPO
git subtree add --prefix=app ../perfumeria-app solo-v3
git tag -f enviado-a-perfumeria                   # marca: hasta aquí, las dos copias iguales
```

(`app` es la carpeta donde la quieres en `OTRO_REPO`; cámbiala si prefieres otra.)

### 9.2. Traer cambios de perfumeria-app (pull)

```bash
cd C:/Users/SERGI/Claude/Projects/perfumeria-app
git switch main && git pull
git branch -D solo-v3; git subtree split --prefix=v3 -b solo-v3   # rehace la rama con lo último
cd ../OTRO_REPO
git subtree pull --prefix=app ../perfumeria-app solo-v3 -m "app: al día con perfumeria-app"
```

### 9.3. Llevar cambios a perfumeria-app (push): parches, a una rama y por PR

El historial de `v3/` en `perfumeria-app` no es un subtree, así que de vuelta no vale
`subtree pull` (Git lo rechaza: «unrelated histories»). Se llevan los commits como parches, que
conservan autor, fecha y mensaje:

```bash
cd C:/Users/SERGI/Claude/Projects/OTRO_REPO
git format-patch --relative=app -o ../parches enviado-a-perfumeria..HEAD -- app
cd ../perfumeria-app
git switch main && git pull
git switch -c desde-otro-repo-<tema>
git am --directory=v3 ../parches/*.patch          # si uno no entra: arréglalo, git add, git am --continue
                                                  # o git am --abort para dejarlo como estaba
cd v3 && npx tsc -b && npm test && npm run build && cd ..
git push -u origin desde-otro-repo-<tema>         # … y PR a main, como en 4.4
cd ../OTRO_REPO && git tag -f enviado-a-perfumeria && cd ..
rm -r parches
```

Comprobado el 2026-11-24 con dos repos de prueba: el `subtree add`, el `subtree pull` y los
parches llevan los cambios en los dos sentidos.

**Nunca** `git subtree push` ni `git push` a `main` de `perfumeria-app` desde el otro repo: sube
directo a `main` y publica sin revisión.

### 9.4. Cuidados propios del subtree

- Cambios en `app/` y en el resto de `OTRO_REPO`, **en commits separados**: así cada parche
  lleva solo lo de la app.
- Si las dos copias se editan a la vez, los conflictos aparecen en el `subtree pull` o en el
  `git am`; se resuelven como en 6.2.
- `v3/` funciona sola dentro de su carpeta (`npm ci && npm test` en una copia aislada debe pasar),
  así que la copia de `OTRO_REPO` también. Pero **los secretos de la Action y la Action misma son de
  `perfumeria-app`**: publicar sigue pasando por fusionar allí.
- `migracion-v3/` no forma parte de `v3/`: las tandas se escriben y aprueban en `perfumeria-app`.

---

## 10. Chuleta

```bash
# Empezar
git switch main && git pull && git fetch --prune origin
git switch -c <tema>

# Trabajar
cd v3 && npx tsc -b && npm test && npm run build && cd ..
git add <archivos> && git status && git commit -F mensaje.txt
git push -u origin <tema>          # y PR a main en GitHub

# Ponerse al día con main
git fetch origin && git merge origin/main && git push

# Tras fusionar
# Actions → «Publicar v3» en verde · sync-config a mano si cambió · tandas de cuenta desde el PC
git switch main && git pull && git branch -d <tema>

# Salvavidas
git merge --abort · git stash · git reflog · git revert <commit>
git tag respaldo-AAAA-MM-DD && git push origin respaldo-AAAA-MM-DD
```
