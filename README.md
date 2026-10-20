# Vibe CRM

CRM para un pequeño negocio de ventas digitales: organizar clientes y no perder ventas por falta de seguimiento.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Convex (+ Convex Auth).
- **Diseño:** ver [`design/design.md`](./design/design.md) (tokens) y [`design/design_handoff_crm_pwa/`](./design/design_handoff_crm_pwa) (prototipo y especificación pantalla por pantalla).
- **Planificación:** equipo `Talent-academy` en Linear, proyectos **CRM-MVP** y **CRM-RESTOPRD**.

## Empezar en local

```bash
npm install
npx convex dev      # backend: vincula/crea el deployment y genera .env.local
npm run dev         # frontend: http://localhost:3000
```

Hacen falta los dos procesos a la vez (Convex y Next). El primer `npx convex dev` pide login e inicializa el deployment; a partir de ahí `convex/_generated` y `.env.local` (con `NEXT_PUBLIC_CONVEX_URL`) quedan listos.

### Usuarios

El registro público está cerrado a propósito: nadie puede darse de alta ni asignarse un rol. Hay dos formas de crear personas, las dos desde el servidor.

**Desde la aplicación (lo normal).** La dueña las da de alta en `/equipo`. No se les pone contraseña: reciben una invitación por correo, entran en `/login`, escriben su dirección y configuran su contraseña con el código que les llega (TAL-60).

**Con el seed (arranque del proyecto).** Para crear la primera dueña, cuando todavía no hay nadie que pueda invitar:

```bash
npx convex run seed:sembrarUsuarios '{"martaPassword":"<pass>","carlosPassword":"<pass>"}'
```

Crea `admin@talent-network.org` (dueña) y `carlos@vibecrm.local` (comercial). Luego entra en `/login` con contraseña, o con Google si ese email ya está provisionado.

**Retirar el acceso** se hace desde `/equipo` y no borra a nadie: la persona deja de poder entrar, pero su nombre sigue apareciendo en las interacciones, ventas y seguimientos que registró. Se le puede devolver el acceso cuando sea, con su misma contraseña.

### Soporte (funciones internas, solo por CLI)

```bash
# Devuelve el acceso a alguien bloqueado por intentos fallidos (login y/o código).
# Borra las dos claves de authRateLimits y la cuota de solicitudes; devuelve
# cuántas filas ha borrado de cada tipo.
npx convex run soporte:desbloquearAcceso '{"email":"alguien@dominio.com"}'

# Diagnóstico: correos guardados que no están en minúsculas y sin espacios.
# Lista vacía = todo correcto. Conviene ejecutarlo antes de cada despliegue.
npx convex run soporte:revisarCorreos

# Diagnóstico de una persona: rol, si tiene el acceso retirado, si está
# pendiente de entrar por primera vez, qué cuentas de acceso tiene y cuántas
# sesiones abiertas. Responde a "¿por qué no puede entrar?".
npx convex run soporte:verUsuario '{"email":"alguien@dominio.com"}'
```

Hace falta la primera porque los límites de intentos de Convex Auth se pueden agotar desde fuera sin autenticarse: diez contraseñas equivocadas dejan una cuenta sin login durante ~1 h, y diez canjes fallidos hacen lo propio con el código de recuperación (ver TAL-67).

## Estructura

```
convex/            Esquema, funciones y auth de Convex (_generated SÍ se versiona)
design/            Design system y prototipo de referencia (no es código a portar)
src/app/           Rutas (App Router). (app) = shell autenticado, (auth) = login
src/proxy.ts       Proxy (antes «middleware») — redirección optimista de sesión
src/components/    UI del design system, layout (sidebar/tabbar) y overlays
src/lib/           Utilidades (fechas locales, api de Convex, guard de auth, nav)
```

## Seguridad / auth (resumen)

- **Convex Auth** con proveedores Password y Google. Google solo enlaza por email a un usuario ya provisionado (con `rol`) y con el correo verificado por el proveedor; nunca crea cuentas. La tabla `users` lleva `rol` (`propietaria` | `comercial`).
- Defensa en capas: `src/proxy.ts` (redirección optimista) + `guardAuth()` server-side por página + `requireUsuario()` en cada función Convex (exige sesión y rol válido). El registro público no puede autoasignarse rol.
- `/equipo` comprueba el rol server-side (solo la dueña), y las funciones del panel exigen además `requirePropietaria` por su cuenta. Las reglas que protegen el CRM —no retirarte el acceso a ti misma, no quitarte el rol de dueña, no dejar el negocio sin ninguna dueña activa— se comprueban **dentro de la mutation**, no ocultando botones.
- `auth:signIn` es una action **pública**: `Password.profile()` solo admite los flujos `signIn`, `reset` y `reset-verification`. En particular `signUp` está cerrado, porque con la cuenta ya creada ese camino comparaba contraseñas **sin pasar por el límite de intentos** (TAL-66).
- Duración de sesión, caducidad del JWT y número de intentos están **declarados** en `convex/auth.ts`, no heredados de la librería.
- La contraseña exige 8 caracteres **y** no estar en la lista de las adivinables (`convex/contrasenas.ts`). La longitud sola no significaba nada: `12345678` la cumplía.

### `auth:signIn` va envuelta, y por qué (TAL-69)

Los mensajes de error de la librería distinguen los casos entre sí — `InvalidAccountId` cuando ese correo no tiene cuenta, `InvalidSecret` cuando la tiene y la contraseña es otra, `Could not verify code` cuando el código no cuadra. Cualquiera puede leer esa diferencia desde la consola del navegador, y eso es **enumeración de cuentas**: exactamente lo que TAL-66 creyó cerrar clausurando `signUp`. La fuga no estaba en `signUp`, estaba en los textos, y salía por los tres flujos.

Por eso `convex/auth.ts` exporta un envoltorio: todo error que no sea un `ConvexError` deliberado sale con el mismo texto para cualquier correo. Se eligió `ConvexError` porque es el único que Convex **no redacta jamás**, así que funciona igual en dev que en producción — y hoy la web corre sobre dev (TAL-68).

Dos cosas que este envoltorio **no** arregla: las demás funciones del backend siguen mandando su mensaje interno y su traza mientras estemos en un deployment de desarrollo, y los **tiempos** no se igualan (una cuenta real ejecuta Scrypt y una inexistente no). Lo primero es TAL-68; lo segundo, TAL-67.

Consecuencia práctica: `validatePasswordRequirements` lanza `ConvexError` a propósito. Si dejara de hacerlo, quien escriba una contraseña mala vería «no se ha podido iniciar sesión» sin enterarse de por qué.

### Acceso retirado: dos candados, no uno (TAL-60)

Desactivar a alguien necesita las dos mitades, y por motivos distintos:

- `beforeSessionCreation` (`convex/auth.ts`) impide que nazca una sesión **nueva**. Es el único punto por el que pasan las tres vías —contraseña, Google y canje de código—; sin él, el login normal de una cuenta que ya existe no toca `createOrUpdateUser` y la persona volvería a entrar sin más.
- `requireUsuario` (`convex/authz.ts`) corta las sesiones que **ya estaban abiertas**: al desactivar se invalidan, pero el JWT que el navegador ya tiene sigue siendo válido hasta una hora.

Ese mismo callback es el único sitio que apaga la marca `contrasenaPendiente`, y va ahí porque es la misma transacción que inserta la sesión: si el acceso se abandona a mitad o se rechaza, Convex revierte también el apagado y la marca se conserva.

**Matiz que importa (TAL-69):** el primer candado actúa al **nacer** la sesión y nunca después. El refresco de token no pasa por `beforeSessionCreation` —solo lo invoca `createSession`—, así que emite JWT nuevos sin volver a mirar `activo`. Lo que de verdad echa a alguien es borrar su sesión, que es lo que hace `usuarios.desactivar` con `invalidateSessions`. Por eso **`usuarios:marcarAcceso` no debe ejecutarse suelta por CLI** para retirar un acceso: dejaría a esa persona renovando su token indefinidamente, con los datos fallando pero la sesión viva.

### Acceso en dos pasos, y lo que revela

`/login` pide primero el correo y `acceso.comprobarCorreo` decide qué viene después. Solo responde «código» a quien fue invitado y aún no ha entrado; **un correo desconocido se comporta exactamente igual que uno que ya tiene contraseña**, así que esa pantalla no dice quién tiene cuenta. Lo único distinguible es el estado de invitación pendiente: riesgo aceptado y documentado en TAL-67.

Ese estado se apaga al primer acceso y, si la persona no llega a entrar nunca, **caduca a los 14 días** (`convex/invitacion.ts`). Sin esa caducidad, una dirección mal tecleada quedaba señalada ahí para siempre. Quien caduque no pierde el acceso: el paso 1 le manda a la pantalla de contraseña y «He olvidado mi contraseña» le da un código igual. En `/equipo` se distingue con la etiqueta «Invitación caducada».

### Correos: ningún enlace de un solo uso

Los antivirus y los filtros de correo corporativos abren los enlaces antes que la persona para inspeccionarlos. Un enlace mágico o un código incrustado en la URL llegaría **ya gastado**. Por eso ningún correo del producto lleva nada consumible: solo la dirección de `/login`, que es una página normal, y los códigos se teclean.

### Variables de entorno sensibles (Convex)

- `RECUPERACION_SECRETO` es imprescindible: sin ella no se emite ningún código de recuperación (fail-closed) y queda registrado `recuperacion: falta RECUPERACION_SECRETO` en los logs. También deja sin efecto la invitación, porque el código de configuración sale por ese mismo camino.
- `RESEND_API_KEY`: sin ella no sale ningún correo (código, aviso de cambio ni invitación).
- `SITIO_URL`: dirección pública de la web, la que se escribe en el correo de invitación. No es un secreto; si falta se usa la de Railway.
- `AUTH_LOG_LEVEL` **nunca** en `DEBUG` en producción: ese nivel registra el código de recuperación en claro. Tampoco `AUTH_LOG_SECRETS=true`.

## Despliegue

### Backend — Convex (se despliega aparte)

```bash
npx convex deploy            # despliega funciones + esquema al deployment de producción
```

En ese deployment de producción hay que dejar configurado **Convex Auth** una sola vez:

```bash
npx @convex-dev/auth --prod --web-server-url https://<tu-dominio-railway>
```

Esto fija `SITE_URL`, `JWT_PRIVATE_KEY` y `JWKS` en producción. `SITE_URL` debe ser el dominio público (el de Railway).

Para que el login con Google funcione en ese deployment, además hace falta:

```bash
npx convex env set AUTH_GOOGLE_ID <client-id>
npx convex env set AUTH_GOOGLE_SECRET <client-secret>
```

La redirect URI que hay que dar de alta en Google es `<dominio-.convex.site del deployment>/api/auth/callback/google`.

### Frontend — Railway (publicación automática desde GitHub)

Railway construye con Nixpacks (`railway.json`): `npm run build` → `npm run start` (Next.js respeta la variable `PORT`). En **Variables** de Railway define:

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | URL del deployment de Convex de producción (`https://<algo>.convex.cloud`) |

Con GitHub conectado, cada push a `main` dispara build + deploy. `convex/_generated` está versionado, así que `npm run build` es reproducible sin credenciales de Convex.

> **Nota:** con esta configuración el backend Convex NO se despliega desde Railway; actualízalo con `npx convex deploy` cuando cambien las funciones o el esquema.
