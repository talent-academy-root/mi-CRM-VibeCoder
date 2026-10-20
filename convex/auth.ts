import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexError, v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { CodigoRecuperacion } from "./codigoRecuperacion";
import { validarContrasena } from "./contrasenas";

const UNA_HORA_MS = 60 * 60 * 1000;
const UN_DIA_MS = 24 * UNA_HORA_MS;

/**
 * Los únicos flujos del proveedor Password que esta aplicación usa.
 *
 * `auth:signIn` es una action PÚBLICA: la pantalla de acceso solo manda
 * flow:"signIn", pero cualquiera puede pedir otro flujo desde la consola del
 * navegador. Por eso la lista vive en el servidor y no en la UI.
 *
 * Es lista BLANCA a propósito: si una versión futura de la librería añade un
 * flujo nuevo, entra cerrado en vez de abrirse solo.
 */
const FLUJOS_PERMITIDOS = new Set(["signIn", "reset", "reset-verification"]);

const {
  auth,
  // Se renombra porque `signIn` es ahora el envoltorio del final del fichero.
  // El nombre público de la action NO puede cambiar: `useAuthActions()` llama a
  // `api.auth.signIn` por nombre fijo.
  signIn: signInLibreria,
  signOut,
  store,
  isAuthenticated,
} = convexAuth({
  providers: [
    Password<DataModel>({
      // Perfil PÚBLICO del signUp: solo email/name, NUNCA rol. Así una llamada
      // maliciosa a signIn("password", { flow: "signUp" }) no puede autoasignarse
      // un rol; el único profile con rol lo produce el seed (createAccount).
      //
      // El correo se normaliza AQUÍ porque este es el punto único desde el que
      // la librería lo lee: los cuatro flujos (signUp, signIn, reset y
      // reset-verification) localizan la cuenta con el `email` que devuelve este
      // profile. Sin esta normalización, escribir " Admin@X.com " en la pantalla
      // de recuperación no encontraría la cuenta y la persona esperaría un
      // correo que nunca sale.
      profile(params) {
        // Cierre de `flow:"signUp"` (auditoría 2026-07-24, TAL-66). No era solo
        // "registro abierto", que ya lo bloqueaba `createOrUpdateUser`: cuando
        // la cuenta YA existe, `createAccountFromCredentials` compara la
        // contraseña y devuelve la cuenta SIN pasar por el límite de intentos
        // —no lo consulta ni registra el fallo—, así que era fuerza bruta
        // ilimitada y sin rastro. Y sus dos respuestas eran distinguibles
        // (cuenta nueva rechazada / cuenta existente), lo que permitía saber qué
        // correos están dados de alta.
        //
        // Se comprueba lo primero de todo y con el mismo error para cualquier
        // correo, así que este camino tampoco dice ya quién tiene cuenta.
        if (
          typeof params.flow !== "string" ||
          !FLUJOS_PERMITIDOS.has(params.flow)
        ) {
          throw new Error("Invalid request");
        }

        // `auth:signIn` acepta flow:"reset" viniendo de cualquiera, así que sin
        // esta comprobación el envoltorio `recuperacion.solicitarCodigo`
        // (cuota + respuesta neutra) sería saltable llamando a la acción de
        // debajo: se podrían pedir códigos sin límite, distinguir qué correos
        // existen e invalidar sin parar el código de quien está intentando
        // recuperar su cuenta.
        //
        // La prueba es un secreto que solo vive en el entorno del deployment:
        // `solicitarCodigo` lo añade desde el servidor y el navegador no puede
        // conocerlo. Se comprueba AQUÍ porque `profile()` corre al principio de
        // `authorize`, antes de buscar la cuenta, de crear el código y de tocar
        // Resend; y se lanza igual para cualquier correo, así que tampoco este
        // camino sirve para averiguar quién está dado de alta.
        //
        // Solo afecta a "reset": "reset-verification" tiene que seguir siendo
        // invocable desde el cliente para poder canjear el código.
        if (params.flow === "reset") {
          const esperado = process.env.RECUPERACION_SECRETO;
          // Fail-closed: sin la variable configurada no se emite ningún código.
          if (esperado === undefined || params.secretoInterno !== esperado) {
            throw new Error("Invalid request");
          }
        }

        // `correo` es el nombre que usa el canje (flow:"reset-verification");
        // el resto de flujos siguen mandando `email`. Ver el comentario de
        // `RecuperarContrasena.tsx`: el canje evita el campo `email` para que
        // nadie pueda envenenar su límite de intentos, y aquí se aceptan los dos
        // nombres para que un frontend antiguo siga funcionando durante el
        // despliegue.
        const correo = params.email ?? params.correo;
        if (typeof correo !== "string" || correo.trim() === "") {
          throw new Error("Invalid request");
        }
        return {
          email: correo.trim().toLowerCase(),
          name: (params.name as string | undefined) || undefined,
        };
      },
      // Código de un solo uso para recuperar la contraseña (TAL-65). Va SOLO
      // aquí: si además se registrara en `providers[]`, el código valdría como
      // login sin contraseña y no invalidaría las sesiones abiertas.
      reset: CodigoRecuperacion,
      // Mismo umbral que el validador por defecto de la librería (8), pero con
      // ConvexError y texto en español para que `mensajeError` lo muestre tal
      // cual en vez de caer en el mensaje genérico. Se ejecuta ANTES de
      // verificar el código, así que una contraseña corta no lo consume.
      //
      // La política vive en `contrasenas.ts` y no aquí desde TAL-61, porque el
      // cambio de contraseña de "Mi cuenta" tiene que aplicar exactamente la
      // misma: `modifyAccountCredentials` no valida nada por su cuenta.
      validatePasswordRequirements: validarContrasena,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // `profile` propio porque el de serie descarta `email_verified`, y sin ese
      // dato `createOrUpdateUser` no puede comprobar que el correo con el que se
      // enlaza la cuenta es realmente de quien entra.
      //
      // El objeto se devuelve desde una variable, no como literal, porque el
      // tipo `User` de Auth.js no declara `emailVerified` y un literal fresco
      // dispararía el aviso de propiedad desconocida de TypeScript.
      profile: (perfil) => {
        const datos = {
          id: perfil.sub,
          email: perfil.email,
          emailVerified: perfil.email_verified === true,
          name: perfil.name,
          image: perfil.picture,
        };
        return datos;
      },
    }),
  ],
  // Declarados en vez de heredados: son los mismos valores por defecto que la
  // librería aplica hoy (salvo la inactividad, que baja de 30 a 14 días), pero
  // escritos aquí una actualización no puede cambiarlos sin que se vea en el
  // diff.
  session: {
    totalDurationMs: 30 * UN_DIA_MS,
    inactiveDurationMs: 14 * UN_DIA_MS,
  },
  jwt: { durationMs: UNA_HORA_MS },
  // El nombre lleva el error de escritura de la librería ("Attemps").
  signIn: { maxFailedAttempsPerHour: 10 },
  callbacks: {
    // Regla de aprovisionamiento (no "rechazar toda creación", que bloquearía el
    // propio seed): se crea un usuario nuevo SOLO si el profile trae un rol
    // válido, y ese rol solo lo produce el seed interno vía createAccount.
    //
    // Nota: con el proveedor Password, el sign-in normal NO pasa por este
    // callback (solo se invoca al CREAR cuenta: signUp público o createAccount).
    //
    // El branch `existingUserId` SÍ se ejerce: la recuperación de contraseña
    // (TAL-65) entra por aquí DOS veces —al crear el código y al verificarlo—
    // siempre con `existingUserId` distinto de null. El return temprano es lo
    // que deja `rol` y `name` intactos durante el reset: quitarlo rompería la
    // recuperación en silencio (el usuario perdería su rol y `requireUsuario`
    // empezaría a rechazarlo).
    async createOrUpdateUser(ctx, args) {
      // Aviso "tu contraseña ha cambiado" (TAL-66).
      //
      // VA ANTES del return de abajo, y no es un detalle de estilo: en la
      // recuperación `existingUserId` NUNCA es null —la cuenta password ya
      // existe—, así que cualquier cosa escrita después de ese return sería
      // código muerto y el aviso no saldría jamás.
      //
      // El discriminador es `type:"verification"` + provider `password`: al
      // canjear el código, la librería llama a este callback con el proveedor de
      // la CUENTA (password), no con el que emitió el código
      // (codigo-recuperacion), que solo autoriza. Y `type:"verification"` solo
      // ocurre al canjear un código: hoy la recuperación es el único mecanismo
      // de verificación configurado (no hay `verify` en Password ni proveedores
      // de email en `providers[]`). Si algún día se añade verificación de correo
      // en el alta, este filtro deja de ser exclusivo de la recuperación y hay
      // que afinarlo.
      //
      // Se programa en la mutation del canje, que es anterior al cambio real de
      // la contraseña (ocurre en la action, después). Si ese paso posterior
      // fallara —solo pasa si el código pertenece a otra cuenta, que ya es un
      // abuso— se habría avisado de un cambio que no llegó a producirse. Se
      // acepta: el correo es informativo y no toca nada.
      if (args.type === "verification" && args.provider.id === "password") {
        // Quien acaba de configurar su contraseña POR PRIMERA VEZ no debe
        // recibir el aviso: no ha cambiado nada, la ha puesto, y avisarle de un
        // cambio sospechoso justo entonces solo asusta (TAL-60).
        //
        // Esta lectura es segura aquí y solo aquí: dentro de
        // `verifyCodeAndSignIn` este callback corre en `verifyCodeOnly`, ANTES
        // de `createNewAndDeleteExistingSession`, así que la marca todavía no
        // la ha apagado `beforeSessionCreation`. Este enganche NO escribe: si
        // apagara la marca él mismo, lo haría también en accesos que luego se
        // rechazan.
        const db = (ctx as unknown as MutationCtx).db;
        const invitada =
          args.existingUserId !== null
            ? (await db.get(args.existingUserId))?.contrasenaPendiente === true
            : false;

        const correo =
          typeof args.profile.email === "string"
            ? args.profile.email
            : undefined;
        if (correo === undefined) {
          console.error("aviso de cambio: el código verificado no traía correo");
        } else if (!invitada) {
          await ctx.scheduler.runAfter(
            0,
            internal.correo.avisarCambioContrasena,
            { email: correo },
          );
        }
      }

      if (args.existingUserId !== null) {
        return args.existingUserId;
      }
      const profile = args.profile as Record<string, unknown>;

      // Google: registro cerrado por diseño también aquí. Con un
      // createOrUpdateUser personalizado, Convex Auth NO enlaza
      // automáticamente por email (esa lógica solo existe en su
      // implementación por defecto), así que lo hacemos a mano: solo se
      // permite entrar si el email ya pertenece a un usuario provisionado
      // (con rol) por el seed. Nunca se crea un usuario nuevo desde OAuth.
      // (Cubre específicamente Google; otro proveedor OAuth futuro debe
      // evaluarse por separado antes de reusar esta rama.)
      if (args.type === "oauth") {
        // Observado al probar TAL-60: si esta persona tiene el acceso retirado,
        // su cuenta de Google SÍ queda enlazada aquí y el acceso se rechaza
        // después, en `beforeSessionCreation`. Es así porque el enlace ocurre en
        // `userOAuth`, una mutation anterior y ya confirmada cuando se intenta
        // crear la sesión. No se fuerza que falle antes: no entra igualmente, no
        // se crea ninguna sesión, y el enlace le sirve tal cual el día que se le
        // devuelva el acceso.
        //
        // Sin correo verificado no se enlaza nada: el enlace se hace POR correo,
        // así que aceptar uno sin verificar sería aceptar que el proveedor no
        // garantiza de quién es. Google lo entrega siempre verificado en sus
        // cuentas, de modo que en la práctica esto solo se dispara si algún día
        // se añade otro proveedor OAuth a esta rama.
        if (args.profile.emailVerified !== true) {
          throw new ConvexError(
            "Cuenta de Google no provisionada: no coincide con ningún usuario autorizado.",
          );
        }
        // Se normaliza igual que en el camino de contraseña: `users.email` puede
        // haber quedado con otra forma (por ejemplo tras `migrarEmailUsuario`) y
        // el índice compara la cadena exacta.
        const email =
          typeof profile.email === "string"
            ? profile.email.trim().toLowerCase()
            : undefined;
        // `ctx` llega tipado por la librería como GenericMutationCtx<AnyDataModel>,
        // que no conoce el índice `email` de nuestro `users`. En tiempo de
        // ejecución es, literalmente, el MutationCtx real de este deployment
        // (se invoca dentro de la mutation `auth:store`), así que el cast es
        // seguro.
        const db = (ctx as unknown as MutationCtx).db;
        const existente =
          email !== undefined
            ? await db
                .query("users")
                .withIndex("email", (q) => q.eq("email", email))
                .unique()
            : null;
        if (existente === null || existente.rol === undefined) {
          throw new ConvexError(
            "Cuenta de Google no provisionada: no coincide con ningún usuario autorizado.",
          );
        }
        return existente._id;
      }

      const rol = profile.rol;
      if (rol !== "propietaria" && rol !== "comercial") {
        // Error normal y no ConvexError: los ConvexError llegan al navegador con
        // su texto intacto incluso en producción, y este mensaje distinguía una
        // cuenta existente de una que no lo es. Hoy solo es alcanzable desde el
        // seed —`flow:"signUp"` está cerrado más arriba—, pero el mensaje no
        // tiene por qué viajar si mañana se abre otro camino.
        throw new Error("Registro no permitido");
      }
      return await ctx.db.insert("users", {
        email: typeof profile.email === "string" ? profile.email : undefined,
        name: typeof profile.name === "string" ? profile.name : undefined,
        rol,
        // Marca de "invitada, aún sin entrar" (TAL-60). Se lee del profile por
        // la MISMA razón por la que es seguro leer `rol`: a esta rama solo se
        // llega desde `createAccount` invocado en el servidor, porque
        // `flow:"signUp"` está cerrado arriba. Se normaliza a booleano estricto
        // para que ningún valor raro del profile se cuele como "true".
        contrasenaPendiente:
          profile.contrasenaPendiente === true ? true : undefined,
        // Cuándo se invitó, para que la marca de arriba pueda caducar (TAL-69,
        // S7). Sin esto, una dirección invitada que nunca llega a entrar queda
        // señalada para siempre en el paso 1 del acceso.
        invitadaEn:
          typeof profile.invitadaEn === "number" ? profile.invitadaEn : undefined,
      });
    },

    /**
     * Último filtro antes de que exista una sesión (TAL-60).
     *
     * La librería lo invoca desde `createSession`, que es el EMBUDO ÚNICO de
     * las tres vías de acceso: contraseña, Google y canje de código. Es el
     * único sitio donde estas dos cosas se pueden garantizar.
     *
     * 1. Rechazar a quien tiene el acceso retirado. Sin esto, desactivar a
     *    alguien no le impediría volver a entrar: el login normal de una cuenta
     *    `password` que ya existe NO pasa por `createOrUpdateUser`, y
     *    `requireUsuario` solo actúa al pedir datos, cuando la sesión ya se ha
     *    creado. Quedaría autenticada dentro de una aplicación que falla.
     *
     * 2. Apagar la marca de invitación. Va aquí y en ningún otro lado porque
     *    esta es la misma transacción que inserta la fila de `authSessions`:
     *    "marca apagada" y "sesión creada" ocurren juntas o no ocurren. Si se
     *    apagara en la rama OAuth de `createOrUpdateUser`, significaría
     *    "empezó a entrar" y no "entró" — `userOAuthImpl` solo emite un código
     *    de dos minutos, y la sesión nace después, en otra mutation: bastaría
     *    con abandonar el retorno de Google para perder la marca sin haber
     *    accedido nunca.
     *
     * El orden importa: primero se comprueba el acceso y solo si pasa se apaga
     * la marca. Y el `throw` revierte la transacción entera, así que un acceso
     * rechazado tampoco la pierde.
     *
     * El texto puede ser explícito sin abrir ninguna vía de enumeración: aquí
     * solo se llega DESPUÉS de autenticarse, así que quien lo lee ya conocía la
     * contraseña o controlaba la cuenta de Google.
     *
     * Aviso comprobado en las pruebas: aunque este ConvexError lleve su texto,
     * la librería lo vuelve a envolver al cruzar de su mutation a la action, y
     * al navegador llega sin `data`. La pantalla de acceso acaba enseñando su
     * mensaje genérico. No se fuerza: falla del lado seguro. Quien sí lee el
     * motivo es quien estaba dentro cuando se le retiró el acceso, porque ahí
     * el ConvexError sale de una query (`requireUsuario`) y conserva su texto.
     */
    async beforeSessionCreation(ctx, { userId }) {
      // `ctx` llega tipado como GenericMutationCtx<AnyDataModel>; en ejecución
      // es el MutationCtx real de este deployment, igual que en la rama de
      // Google de arriba.
      const db = (ctx as unknown as MutationCtx).db;
      const usuario = await db.get(userId as Id<"users">);
      if (usuario === null) return;
      if (usuario.activo === false) {
        throw new ConvexError("Tu acceso ha sido desactivado.");
      }
      if (usuario.contrasenaPendiente === true) {
        await db.patch(usuario._id, {
          contrasenaPendiente: undefined,
          // `invitadaEn` solo existe para que la marca pueda caducar; una vez
          // apagada no significa nada y se limpia con ella (TAL-69, S7).
          invitadaEn: undefined,
        });
      }
    },
  },
});

export { auth, signOut, store, isAuthenticated };

/**
 * `signIn` envuelta para que NADA que no sea un ConvexError deliberado salga de
 * ella (TAL-69, S1).
 *
 * ## Qué arregla
 *
 * Hasta aquí, la respuesta de esta action decía si un correo tenía cuenta. Los
 * mensajes son de la librería y distinguen los casos entre sí:
 *
 *   InvalidAccountId ......... ese correo no tiene cuenta de contraseña
 *   InvalidSecret ............ la tiene, y la contraseña es otra
 *   Could not verify code .... la tiene, y el código es otro
 *   TooManyFailedAttempts .... la tiene, y está bloqueada
 *
 * Comprobado en vivo el 2026-07-24 contra el deployment que sirve la web, sin
 * autenticar y con la traza de pila incluida. Salía por TRES flujos —`signIn`,
 * `reset` y `reset-verification`— y por el tercero sin límite ninguno de
 * intentos: `retrieveAccount` se llama ahí sin `secret`, así que no consulta el
 * rate limit, y como el canje manda `correo` en vez de `email` (defensa de
 * TAL-66) tampoco hay clave con la que limitar en `verifyCodeAndSignIn`.
 *
 * Al convertirlos todos en el mismo ConvexError, la respuesta deja de depender
 * de si la cuenta existe. Los ConvexError son además el único error que Convex
 * NO redacta jamás, así que esto se comporta igual en dev que en producción —
 * que es justo lo que hace falta mientras la web corra sobre dev (TAL-68).
 *
 * ## Qué NO arregla
 *
 * Las demás funciones del backend siguen devolviendo su mensaje interno y su
 * traza mientras estemos en un deployment de desarrollo. Ya no delatan qué
 * cuentas existen, pero sí filtran rutas e internos. Eso solo lo cierra TAL-68.
 *
 * Tampoco iguala los TIEMPOS: una cuenta real ejecuta Scrypt y una inexistente
 * no. Riesgo aceptado y medido, en TAL-67 punto 3.
 *
 * ## El punto frágil
 *
 * `_handler` es API interna de Convex. Es la única vía posible: el cliente de
 * `@convex-dev/auth/react` llama a `api.auth.signIn` por nombre fijo, así que la
 * action tiene que seguir llamándose así y siendo pública, y una action
 * registrada no se puede invocar directamente. Presente y tipado en Convex
 * 1.42.1. Si una actualización lo quitara, el acceso dejaría de funcionar de
 * forma evidente —no en silencio— y lo detecta la primera prueba de acceso.
 */
export const signIn = action({
  // Los MISMOS argumentos que declara la librería. Si divergen, el cliente deja
  // de poder entrar.
  args: {
    provider: v.optional(v.string()),
    params: v.optional(v.any()),
    verifier: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    calledBy: v.optional(v.string()),
  },
  // `v.any()` porque la forma de la respuesta depende del flujo: `{redirect,
  // verifier}` al empezar con Google, `{tokens}` al entrar, `{started:true}` al
  // pedir un código. Es el mismo contrato que la librería, que no lo declara.
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      const manejador = (
        signInLibreria as unknown as {
          _handler: (ctx: ActionCtx, args: unknown) => Promise<unknown>;
        }
      )._handler;
      return await manejador(ctx, args);
    } catch (error) {
      // Los ConvexError son mensajes escritos por nosotros a propósito y que la
      // persona necesita leer: contraseña demasiado corta o demasiado fácil.
      // Todo lo demás sale con el mismo texto para cualquier correo.
      if (error instanceof ConvexError) throw error;
      throw new ConvexError("No se ha podido iniciar sesión.");
    }
  },
});
