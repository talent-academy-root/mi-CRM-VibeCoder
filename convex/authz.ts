import { ConvexError } from "convex/values";
import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { SESION_INVALIDA } from "./mensajes";

/**
 * Usuario de la sesión actual. Lanza si no hay sesión, si la sesión ya no
 * existe, si el usuario no está provisionado (sin `rol` válido) o si tiene el
 * acceso retirado.
 *
 * Lo del rol bloquea las cuentas auto-registradas vía
 * `signIn("password", { flow: "signUp" })`, que nunca reciben rol.
 *
 * Es la garantía dura de autorización: toda función de datos empieza por aquí.
 */
export async function requireUsuario(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("No autenticado");

  await exigirSesionViva(ctx);

  const user = await ctx.db.get(userId);
  if (user === null) throw new ConvexError("Usuario no encontrado");
  if (user.rol !== "propietaria" && user.rol !== "comercial") {
    throw new ConvexError("Usuario no provisionado");
  }
  // Segunda capa de la desactivación (TAL-60), no una redundancia: la primera
  // —`beforeSessionCreation` en convex/auth.ts— impide crear sesiones NUEVAS,
  // pero no puede hacer nada con las que ya estaban abiertas cuando se retiró
  // el acceso. Desde TAL-61, `exigirSesionViva` ya corta ese caso en cuanto
  // `desactivar` invalida las sesiones; esto se queda como el filtro que mira el
  // estado de la PERSONA y no el de su sesión, y sigue siendo lo que responde si
  // algún día se marca `activo: false` sin cerrar sesiones.
  if (user.activo === false) {
    throw new ConvexError("Tu acceso ha sido desactivado");
  }
  return user;
}

/**
 * Que la sesión del token siga existiendo (TAL-61).
 *
 * EL PROBLEMA QUE CIERRA. `getAuthUserId` saca la identidad del subject del JWT
 * y no vuelve a mirar la base. Como el JWT dura una hora (`jwt.durationMs`, en
 * convex/auth.ts), borrar una sesión —`invalidateSessions`, que es lo que hacen
 * `usuarios.desactivar` y el cambio de contraseña de `cuenta.ts`— no echaba a
 * nadie de inmediato: el navegador afectado seguía consultando datos con el
 * token que ya tenía hasta que caducara. Para un cambio de contraseña hecho
 * justo para expulsar a un intruso, esa hora es exactamente lo que no se puede
 * conceder.
 *
 * Se comprueba aquí, dentro de `requireUsuario`, para que valga a la vez para
 * todas las funciones de datos: cualquier otro sitio sería una lista que
 * mantener.
 *
 * PRECIO: una lectura por documento más en cada llamada. Es el coste de que la
 * revocación sea inmediata y se paga a conciencia.
 *
 * También se mira la caducidad porque la fila no se borra sola al vencer: el
 * barrido de sesiones expiradas de la librería no es inmediato, y sin esta
 * comprobación una sesión vencida seguiría sirviendo mientras su fila exista.
 */
async function exigirSesionViva(ctx: QueryCtx | MutationCtx): Promise<void> {
  const sessionId = await getAuthSessionId(ctx);
  // El subject es `userId|sessionId`: si no trae sesión, este token no viene de
  // un acceso normal y no se le da el beneficio de la duda.
  if (sessionId === null) throw new ConvexError("No autenticado");
  const sesion = await ctx.db.get(sessionId);
  if (sesion === null || sesion.expirationTime < Date.now()) {
    // El texto exacto lo reconoce `LimiteDeError` para llevar a la persona al
    // login en vez de enseñarle una pantalla de expulsión: aquí no hay nada que
    // explicar, solo que vuelva a entrar. De ahí que sea una constante
    // compartida y no un literal.
    throw new ConvexError(SESION_INVALIDA);
  }
}

/** Como `requireUsuario`, pero además exige el rol `propietaria`. */
export async function requirePropietaria(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await requireUsuario(ctx);
  if (user.rol !== "propietaria") {
    throw new ConvexError("Acción restringida a la dueña");
  }
  return user;
}
