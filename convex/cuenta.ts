import { v, ConvexError } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import {
  getAuthSessionId,
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { requireUsuario } from "./authz";
import { canonico, esCorreoValido, migrarCorreo } from "./identidad";
import { validarContrasena } from "./contrasenas";

/**
 * Lo que cada persona puede hacer con SU cuenta sin pedírselo a nadie (TAL-61,
 * F17): corregir su nombre, cambiar su correo y cambiar su contraseña.
 *
 * Está separado de `usuarios.ts` a propósito: allí todo empieza por
 * `requirePropietaria` —es la dueña actuando sobre su equipo— y aquí todo
 * empieza por `requireUsuario` y actúa sobre una misma. Mezclarlos sería la
 * forma más fácil de que un día una comprobación de rol se caiga en el sitio
 * equivocado.
 *
 * Las dos entradas públicas son `action` y no `mutation` porque las funciones de
 * contraseña de la librería (`retrieveAccount`, `modifyAccountCredentials`)
 * hashean, y eso no cabe dentro de una transacción.
 */

/** Quién soy y desde qué sesión, para las actions, que no tienen `ctx.db`. */
export const misDatos = internalQuery({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    sessionId: v.union(v.id("authSessions"), v.null()),
  }),
  handler: async (ctx) => {
    const yo = await requireUsuario(ctx);
    return {
      _id: yo._id,
      name: yo.name,
      email: yo.email,
      sessionId: await getAuthSessionId(ctx),
    };
  },
});

/**
 * Traduce los fallos de `retrieveAccount` a algo que se pueda leer.
 *
 * La librería los lanza como `Error` con el nombre del caso dentro
 * ("InvalidSecret", "TooManyFailedAttempts", "InvalidAccountId"), y esos no
 * pueden salir tal cual: en un deployment de desarrollo viajan con traza al
 * navegador (TAL-68 sigue abierta).
 *
 * Aquí no hay riesgo de enumeración —quien llega ya tiene sesión y está
 * consultando su PROPIA cuenta—, así que el texto puede ser explícito y decir
 * qué ha pasado de verdad.
 */
function errorDeCredenciales(error: unknown): ConvexError<string> {
  const texto = error instanceof Error ? error.message : "";
  if (texto.includes("TooManyFailedAttempts")) {
    return new ConvexError(
      "Demasiados intentos fallidos. Espera un rato antes de volver a probar.",
    );
  }
  if (texto.includes("InvalidAccountId")) {
    return new ConvexError(
      "Tu acceso no usa contraseña. Pide a la dueña que haga este cambio por ti.",
    );
  }
  return new ConvexError("La contraseña actual no es correcta.");
}

/**
 * Comprueba la contraseña actual de quien llama.
 *
 * `retrieveAccount` pasa por el mismo límite de intentos que el login (lo
 * aplica `retrieveAccountWithCredentials` en la librería), así que este camino
 * no es un sitio cómodo desde el que probar contraseñas a discreción.
 */
async function exigirContrasenaActual(
  ctx: ActionCtx,
  email: string,
  contrasena: string,
): Promise<void> {
  try {
    await retrieveAccount<DataModel>(ctx, {
      provider: "password",
      account: { id: email, secret: contrasena },
    });
  } catch (error) {
    throw errorDeCredenciales(error);
  }
}

/** Solo el nombre: no toca la identidad de acceso y no pide nada más. */
export const guardarNombre = internalMutation({
  args: { nombre: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const yo = await requireUsuario(ctx);
    await ctx.db.patch(yo._id, { name: args.nombre });
    return null;
  },
});

/**
 * Nombre y correo a la vez, en UNA transacción.
 *
 * Que vayan juntos importa: si el correo no se pudiera mover —porque ya es de
 * otra persona, o porque esta cuenta no tiene una única cuenta de contraseña—,
 * `migrarCorreo` lanza y el nombre tampoco se guarda. Media edición aplicada
 * sería peor que ninguna.
 */
export const guardarNombreYCorreo = internalMutation({
  args: { nombre: v.string(), email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const yo = await requireUsuario(ctx);
    if (args.email !== yo.email) {
      await migrarCorreo(ctx, yo, args.email);
    }
    await ctx.db.patch(yo._id, { name: args.nombre });
    return null;
  },
});

/**
 * Editar mis datos (nombre y correo).
 *
 * Cambiar el correo EXIGE la contraseña actual, y esa es la decisión de diseño
 * de esta función. El correo es la identidad de acceso: con él se pide el código
 * de recuperación. Sin esta reautenticación, cualquiera que encontrara una
 * sesión abierta y desatendida podría mover la cuenta a un buzón propio y
 * quedársela para siempre, sin haber conocido nunca la contraseña.
 *
 * Cambiar solo el nombre no pide nada: no abre ninguna puerta y pedir la
 * contraseña para corregir una tilde solo enseñaría a la gente a escribirla sin
 * pensar.
 *
 * La misma regla se cierra por el otro lado en `usuarios.actualizar`, que
 * rechaza que la dueña se cambie el correo a sí misma desde /equipo.
 */
export const guardarMisDatos = action({
  args: {
    nombre: v.string(),
    email: v.string(),
    contrasenaActual: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const yo = await ctx.runQuery(internal.cuenta.misDatos, {});

    const nombre = args.nombre.trim();
    if (nombre.length === 0) {
      throw new ConvexError("Indica tu nombre");
    }
    const email = canonico(args.email);
    if (!esCorreoValido(email)) {
      throw new ConvexError("Ese correo no parece válido");
    }

    if (email === yo.email) {
      await ctx.runMutation(internal.cuenta.guardarNombre, { nombre });
      return null;
    }

    const contrasena = args.contrasenaActual ?? "";
    if (contrasena === "") {
      throw new ConvexError(
        "Para cambiar tu correo, escribe tu contraseña actual",
      );
    }
    // Con el correo ACTUAL: es el que identifica hoy la cuenta de contraseña.
    // El de destino todavía no identifica nada.
    if (yo.email === undefined) {
      throw new ConvexError(
        "Tu cuenta no tiene correo. Pide a la dueña que lo arregle.",
      );
    }
    await exigirContrasenaActual(ctx, yo.email, contrasena);

    const emailAnterior = yo.email;
    await ctx.runMutation(internal.cuenta.guardarNombreYCorreo, {
      nombre,
      email,
    });

    // Aviso al buzón que se acaba de perder. Va DESPUÉS del cambio y en una
    // tarea aparte: si Resend falla, el cambio ya está hecho y no se deshace.
    // Es el mismo criterio que el aviso de cambio de contraseña (TAL-66):
    // avisar en el canal que deja de ser tuyo es la única señal que le queda a
    // la persona si quien hizo el cambio no fue ella.
    await ctx.scheduler.runAfter(0, internal.correo.avisarCambioCorreo, {
      email: emailAnterior,
      emailNuevo: email,
    });
    return null;
  },
});

/**
 * Cambiar mi contraseña.
 *
 * El ORDEN de las comprobaciones no es casual: la nueva se valida ANTES de
 * verificar la actual. Al revés, escribir una contraseña nueva demasiado corta
 * consumiría un intento del límite de la librería, y bastarían unos cuantos
 * despistes para quedarse fuera del CRM sin haber fallado nunca la contraseña.
 */
export const cambiarContrasena = action({
  args: { actual: v.string(), nueva: v.string() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const yo = await ctx.runQuery(internal.cuenta.misDatos, {});
    if (yo.email === undefined) {
      throw new ConvexError(
        "Tu cuenta no tiene correo. Pide a la dueña que lo arregle.",
      );
    }

    // La MISMA política que aplica el canje del código de recuperación. Hace
    // falta escribirla aquí porque `modifyAccountCredentials` no valida nada.
    validarContrasena(args.nueva);
    if (args.nueva === args.actual) {
      throw new ConvexError("La contraseña nueva es igual que la actual.");
    }

    await exigirContrasenaActual(ctx, yo.email, args.actual);

    await modifyAccountCredentials<DataModel>(ctx, {
      provider: "password",
      account: { id: yo.email, secret: args.nueva },
    });

    // Se cierran las sesiones de los DEMÁS dispositivos y se conserva esta.
    //
    // Sin esto, cambiar la contraseña porque sospechas que alguien entró no
    // serviría de nada: quien ya estuviera dentro seguiría dentro hasta 30 días.
    // Y para que la expulsión sea inmediata y no dentro de una hora hace falta
    // la otra mitad, `exigirSesionViva` en convex/authz.ts: borrar la sesión no
    // invalida por sí solo el JWT que el otro navegador ya tiene.
    //
    // `except` conserva la sesión actual para que quien acaba de cambiarla no
    // se eche a sí misma y tenga que volver a entrar.
    //
    // El `null` no es alcanzable —`misDatos` pasa por `requireUsuario`, que ya
    // exige una sesión viva—, y si algún día lo fuera, la lista vacía cierra
    // TODAS las sesiones. Es el lado seguro: peor que echar de más sería dejar
    // viva justo la que se quería cerrar.
    const except: Id<"authSessions">[] =
      yo.sessionId !== null ? [yo.sessionId] : [];
    await invalidateSessions<DataModel>(ctx, { userId: yo._id, except });

    await ctx.scheduler.runAfter(0, internal.correo.avisarCambioContrasena, {
      email: yo.email,
    });
    return null;
  },
});
