import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Herramientas de soporte para la dueña, ejecutables solo por CLI
 * (`npx convex run ...`). Nunca invocables desde el cliente: son `internal*`.
 */

/** Forma canónica de un correo: la que se guarda y con la que se compara. */
function canonico(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Devuelve el acceso a una persona a la que han bloqueado a base de intentos
 * fallidos (TAL-66).
 *
 * Hace falta porque los dos límites de la librería se pueden agotar desde
 * fuera, sin autenticarse: diez contraseñas equivocadas dejan la cuenta sin
 * login durante ~1 h, y diez canjes fallidos hacen lo propio con el código de
 * recuperación. Ninguno de los dos se puede evitar del todo desde el código
 * (ver TAL-67), así que la salida es poder limpiarlos a mano.
 *
 * Son DOS claves distintas dentro de `authRateLimits` y hay que borrar las dos:
 * la librería identifica el límite del login por el `_id` de la cuenta
 * `password`, y el del canje de códigos por el correo tal cual.
 *
 * Devuelve cuántas filas ha borrado de cada tipo: sirve de evidencia de qué
 * bloqueo existía de verdad (0 en todas = no había ninguno).
 *
 *   npx convex run soporte:desbloquearAcceso '{"email":"alguien@dominio.com"}'
 */
export const desbloquearAcceso = internalMutation({
  args: { email: v.string() },
  returns: v.object({
    limiteCorreo: v.number(),
    limiteCuenta: v.number(),
    solicitudes: v.number(),
  }),
  handler: async (ctx, args) => {
    const email = canonico(args.email);

    // 1. Límite del canje de códigos: identificado por el correo.
    const porCorreo = await ctx.db
      .query("authRateLimits")
      .withIndex("identifier", (q) => q.eq("identifier", email))
      .unique();
    if (porCorreo !== null) {
      await ctx.db.delete(porCorreo._id);
    }

    // 2. Límite del login: identificado por el _id de la cuenta `password`.
    const cuenta = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    let limiteCuenta = 0;
    if (cuenta !== null) {
      const porCuenta = await ctx.db
        .query("authRateLimits")
        .withIndex("identifier", (q) => q.eq("identifier", cuenta._id))
        .unique();
      if (porCuenta !== null) {
        await ctx.db.delete(porCuenta._id);
        limiteCuenta = 1;
      }
    }

    // 3. Cuota de solicitudes de código de esta aplicación.
    const solicitudes = await ctx.db
      .query("intentosRecuperacion")
      .withIndex("by_email_momento", (q) => q.eq("email", email))
      .collect();
    for (const solicitud of solicitudes) {
      await ctx.db.delete(solicitud._id);
    }

    return {
      limiteCorreo: porCorreo !== null ? 1 : 0,
      limiteCuenta,
      solicitudes: solicitudes.length,
    };
  },
});

/**
 * Diagnóstico de una persona concreta (TAL-60). Responde a "¿por qué no puede
 * entrar?" sin tener que abrir el panel de datos de Convex.
 *
 * Devuelve el estado de acceso, si tiene cuenta con contraseña y cuántas
 * sesiones abiertas tiene ahora mismo — ese contador es lo que distingue "no se
 * le ha creado sesión" de "tiene sesión pero le rechazan los datos", que son
 * dos fallos muy distintos.
 *
 * Nunca devuelve el hash de la contraseña ni ningún secreto.
 *
 *   npx convex run soporte:verUsuario '{"email":"alguien@dominio.com"}'
 */
export const verUsuario = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("users"),
      name: v.optional(v.string()),
      rol: v.optional(v.string()),
      activo: v.boolean(),
      contrasenaPendiente: v.boolean(),
      tieneCuentaPassword: v.boolean(),
      tieneCuentaGoogle: v.boolean(),
      sesionesAbiertas: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const email = canonico(args.email);
    const u = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (u === null) return null;

    const cuentas = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", u._id))
      .collect();
    const sesiones = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", u._id))
      .collect();

    return {
      id: u._id,
      name: u.name,
      rol: u.rol,
      activo: u.activo !== false,
      contrasenaPendiente: u.contrasenaPendiente === true,
      tieneCuentaPassword: cuentas.some((c) => c.provider === "password"),
      tieneCuentaGoogle: cuentas.some((c) => c.provider === "google"),
      sesionesAbiertas: sesiones.length,
    };
  },
});

/**
 * Caduca ya una invitación que sigue abierta (TAL-69, S7).
 *
 * Sirve para dos cosas. La operativa: se invitó a una dirección equivocada y se
 * quiere cortar el atajo sin esperar los 14 días ni tocar a la persona — el
 * usuario sigue existiendo, con su rol, y solo deja de salir marcado en el paso
 * 1 del acceso. Y la de verificación: es la única forma de comprobar el límite
 * de la caducidad sin esperar dos semanas.
 *
 * No retira el acceso ni borra nada: quien tenga esta invitación caducada puede
 * entrar igual con «He olvidado mi contraseña».
 *
 *   npx convex run soporte:caducarInvitacion '{"email":"alguien@dominio.com"}'
 */
export const caducarInvitacion = internalMutation({
  args: { email: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const email = canonico(args.email);
    const u = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (u === null) return `no existe ningún usuario con email ${email}`;
    if (u.contrasenaPendiente !== true) {
      return `${email} no tiene ninguna invitación pendiente`;
    }
    // Se retrasa la fecha en vez de borrar la marca: así el panel puede seguir
    // distinguiendo "invitada y sin entrar" de "nunca se le invitó", que es lo
    // que la etiqueta «Invitación caducada» necesita decir.
    await ctx.db.patch(u._id, { invitadaEn: 0 });
    return `invitación de ${email} marcada como caducada`;
  },
});

/**
 * Diagnóstico: correos guardados que NO están en forma canónica.
 *
 * El login con Google enlaza buscando `users.email` por índice, que compara la
 * cadena exacta; y el login con contraseña busca `authAccounts.providerAccountId`
 * igual. Si alguno quedara con mayúsculas o espacios (por ejemplo tras un
 * `migrarEmailUsuario` antiguo), esa persona no podría entrar y el motivo sería
 * invisible. Se ejecuta antes de desplegar.
 *
 * Devuelve solo las filas problemáticas: lista vacía = todo correcto.
 *
 * Usa `collect()` sin paginar a propósito: este CRM tiene un puñado de usuarios
 * y es una función de diagnóstico manual. Si algún día crece, hay que paginarla.
 *
 *   npx convex run soporte:revisarCorreos
 */
export const revisarCorreos = internalQuery({
  args: {},
  returns: v.object({
    usuarios: v.array(v.object({ id: v.id("users"), email: v.string() })),
    cuentas: v.array(v.object({ id: v.id("authAccounts"), email: v.string() })),
  }),
  handler: async (ctx) => {
    const usuarios = (await ctx.db.query("users").collect())
      .filter((u) => u.email !== undefined && u.email !== canonico(u.email))
      .map((u) => ({ id: u._id, email: u.email! }));

    const cuentas = (
      await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) => q.eq("provider", "password"))
        .collect()
    )
      .filter((c) => c.providerAccountId !== canonico(c.providerAccountId))
      .map((c) => ({ id: c._id, email: c.providerAccountId }));

    return { usuarios, cuentas };
  },
});
