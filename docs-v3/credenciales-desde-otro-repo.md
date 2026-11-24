# Credenciales para trabajar desde otro repositorio

Qué hace falta para entrar en cada sitio cuando editas `perfumeria-app` desde otro repo, de dónde
se saca cada cosa y dónde se pone. **Aquí no hay ni un valor, y no tiene que haberlo**: este
archivo está en Git, y lo que entra en Git (aunque sea en un repo privado) se queda en el historial
para siempre. Los valores van en tu gestor de contraseñas y en los archivos que Git ignora.

Acompaña a [`guia-git-desde-otro-repo.md`](guia-git-desde-otro-repo.md).

---

## 1. El mapa

| Para qué | Qué es | Dónde está el valor | Dónde se pone |
|---|---|---|---|
| Hacer push y pull | Tu cuenta de GitHub (`smortenax`) | Tu gestor de contraseñas | Lo guarda Git Credential Manager al primer `git push` (sección 2) |
| Entrar en la app publicada | Tu correo y tu contraseña de la app | Tu gestor de contraseñas | En la pantalla de entrada. El registro está cerrado: las cuentas se crean a mano |
| La app en local | Las variables de `v3/.env.local` | Las genera `npm run env:local` | `v3/.env.local` del PC (sección 3) |
| Migraciones a la nube desde el PC | `SUPABASE_DB_PASSWORD` | Supabase → proyecto → Settings → Database | `v3/.env.local` |
| Cargar tandas de tu cuenta en la nube | `DATABASE_URL_CLOUD` | Supabase → proyecto → Connect (cadena de conexión con la contraseña) | `v3/.env.local` |
| Que la Action publique | Seis secretos (sección 4) | Supabase, PowerSync y Cloudflare | GitHub → `perfumeria-app` → Settings → Secrets and variables → Actions |
| Paneles | Supabase, PowerSync Cloud, Cloudflare | Tu gestor de contraseñas | En la web de cada uno |

---

## 2. GitHub (push y pull)

No hay que copiar ninguna contraseña a ningún archivo:

1. Instala **Git para Windows** (trae Git Credential Manager).
2. En la otra carpeta, el primer `git pull` o `git push` contra `perfumeria-app` abre el navegador:
   entras con `smortenax` y el permiso queda guardado en el Administrador de credenciales de
   Windows.
3. Alternativa: `gh auth login` → GitHub.com → HTTPS → «Login with a web browser».

Si el otro repo es de otra cuenta u organización, esa cuenta necesita acceso de escritura a
`smortenax/perfumeria-app` (GitHub → Settings → Collaborators).

**Para una sesión de Claude de otro proyecto:** no se le dan claves. Se añade
`smortenax/perfumeria-app` a los repositorios del proyecto (y, si hace falta, se conecta GitHub en
claude.ai/connect-github); la app de Claude en GitHub tiene que estar instalada en el repo.

---

## 3. `v3/.env.local` (la app en tu PC)

Lo ignora Git (`v3/.gitignore`). Los nombres, sin valores, están en `v3/.env.example`.

**En un PC o carpeta nueva:**

```bash
cd v3
npm ci
npm run env:local          # escribe .env.local con lo del Supabase local
npm run db:powersync-password
npm run db:test-users      # solo si quieres los usuarios de prueba
```

Después añade a mano lo que no sale solo: `SUPABASE_DB_PASSWORD`, `DATABASE_URL_CLOUD` (si vas a
cargar en la nube desde ese PC) y `DEV_LOGIN_EMAIL` (tu correo, para «Entrar como tú, sin
contraseña» en desarrollo).

**Si ya lo tienes en otro PC:** cópialo tú, a mano (memoria USB, o pegándolo desde tu gestor de
contraseñas). Nunca por Git, ni por un chat, ni por correo.

---

## 4. Secretos de la Action

Son del repo `perfumeria-app`, y siguen funcionando editando desde cualquier otro repo, porque la
Action corre en `perfumeria-app` al fusionar. **Solo hace falta tocarlos** si cambias una clave o si
otro repo tiene que publicar por su cuenta (entonces se crean también allí, con los mismos nombres).

| Secreto | De dónde sale |
|---|---|
| `DATABASE_URL_CLOUD` | Supabase → proyecto → Connect → cadena de conexión (con la contraseña de la base) |
| `VITE_SUPABASE_URL` | Supabase → proyecto → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → proyecto → Settings → API → clave pública (anon / publishable) |
| `VITE_POWERSYNC_URL` | PowerSync Cloud → instancia Perfurepo → la URL de la instancia |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → plantilla «Edit Cloudflare Workers» |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages → panel derecho, Account ID |

GitHub no deja leer un secreto ya guardado: si no lo tienes en tu gestor, se genera otro en su
panel y se guarda en los dos sitios.

---

## 5. Si no puedes entrar en la app

- **«Credenciales no válidas» en la web publicada:** la cuenta es la de la nube, no la de tu PC.
  Cambia la contraseña en Supabase → Authentication → Users → tu usuario → «Send password
  recovery», o pon una nueva desde ese panel.
- **En local, la cuenta no existe:** `npm run db:reset` borra las cuentas locales. Vuelve a
  crearla (Supabase local, panel en el puerto 55323 → Authentication) o usa «Entrar como tú, sin
  contraseña» con `DEV_LOGIN_EMAIL`.
- **La web carga pero no sincroniza:** revisa `VITE_POWERSYNC_URL` y que el sync-config de
  PowerSync Cloud esté desplegado.

---

## 6. Tu hoja de valores, solo en tu PC

**Ya existe en tu PC** (2026-11-24): `C:\Users\SERGI\Claude\Projects\perfumeria-app\credenciales.local.md`,
generado desde `v3/.env.local` y `v3/.env.production.local`, con los huecos que no estaban en
ningún archivo (contraseñas de GitHub, de la app y de los paneles) para que los rellenes tú. Git lo
ignora (`.gitignore` y `.git/info/exclude` de ese clon), así que no se sube nunca. Para llevarlo a
otra carpeta o PC, se copia a mano, igual que los `.env`. Si lo creas de cero, esta es la forma:

```markdown
# Mis credenciales (NO SUBIR)
GitHub: usuario smortenax · contraseña/2FA: en el gestor
App publicada: correo … · contraseña …
Supabase (panel): …            · contraseña de la base: …
PowerSync Cloud (panel): …
Cloudflare (panel): …
DATABASE_URL_CLOUD=…
```

Antes de cada commit, `git status` no debe enseñarlo. Si alguna vez se sube una clave por error,
borrarla en el commit siguiente **no basta**: hay que cambiarla en su panel.

---

## 7. Usar las claves desde el otro repo sin copiarlas (recomendado)

Mejor que copiar valores: que el otro repo **lea los archivos de `perfumeria-app`**, que ya están
en tu PC y ya los ignora Git. Así hay una sola copia de cada clave y, si cambia, cambia en un sitio.

**La carpeta segura:** `C:\Users\SERGI\Claude\Projects\perfumeria-app\`

| Archivo | Qué lleva |
|---|---|
| `v3\.env.local` | Lo local (Supabase y PowerSync en Docker), `DEV_LOGIN_EMAIL` y `DATABASE_URL_CLOUD` |
| `v3\.env.production.local` | La nube que usa la app publicada (URL de Supabase, clave pública, URL de PowerSync) |
| `credenciales.local.md` | Todo junto, más los huecos de contraseñas de paneles que rellenas tú |

**Requisito:** los dos repos, uno al lado del otro en `C:\Users\SERGI\Claude\Projects\` (montaje A
de la guía). Desde el otro repo, la carpeta es siempre `../perfumeria-app`.

### 7.1. Formas de leerlas desde el otro repo

- **Lo más simple: los comandos de la app se lanzan dentro de `perfumeria-app`.** `cd
  ../perfumeria-app/v3 && npm run dev` (o `datos:cargar:nube`, o `cargar-laboratorio.ts`): ya
  encuentran su `.env.local` sin hacer nada.
- **Un script de Node del otro repo:**
  ```bash
  node --env-file=../perfumeria-app/v3/.env.local mi-script.ts
  ```
- **Una app con Vite en el otro repo:** en su `vite.config.ts`, `envDir: "../perfumeria-app/v3"`.
- **Un enlace en vez de una copia** (PowerShell como administrador, o con el modo desarrollador de
  Windows activado), dentro de la carpeta del otro repo:
  ```powershell
  New-Item -ItemType SymbolicLink -Path .env.local -Target ..\perfumeria-app\v3\.env.local
  ```

### 7.2. Antes de nada, en el otro repo

Añade a su `.gitignore`, **antes del primer commit que toque claves**:

```
.env.local
.env.*.local
credenciales.local.md
```

y comprueba con `git check-ignore -v .env.local` que lo ignora. Un enlace simbólico que Git no
ignora se sube como enlace (sin el contenido), pero mejor que no llegue a estar.

### 7.3. Claude trabajando desde el otro repo

- **Claude en tu PC (app de escritorio o Claude Code en local):** aprueba también la carpeta
  `C:\Users\SERGI\Claude\Projects\perfumeria-app` en el proyecto del otro repo. Así lee los `.env`
  en su sitio, sin que pasen por el chat.
- **Claude en la nube:** no ve tu disco. Si el proyecto tiene tu PC conectado, lee esa carpeta por
  el acceso a carpetas que apruebas tú; si no, trabaja sin las claves (código, datos por tanda,
  PR), y lo que necesita claves (cargar tu cuenta en la nube) lo lanzas tú desde el PC.
- **Nunca** se pegan las claves en un mensaje, ni en los archivos del proyecto de Claude, ni en un
  issue o una PR.
