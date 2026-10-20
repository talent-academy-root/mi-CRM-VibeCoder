import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * Forma canónica de un correo: la que se guarda y con la que se compara.
 *
 * Vive aquí desde TAL-61 porque ya son tres los sitios que la necesitan —el
 * alta y la edición de `usuarios.ts`, y la edición del correo propio de
 * `cuenta.ts`— y `migrarCorreo`, justo debajo, exige recibirlo ya normalizado:
 * los dos campos que mueve se comparan por índice con la cadena exacta.
 */
export function canonico(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validación de correo deliberadamente laxa: algo@algo.algo, sin espacios.
 * Las reglas reales de una dirección de correo son mucho más raras de lo que
 * cualquier expresión regular admite, y rechazar una dirección legítima deja a
 * una persona fuera del CRM. Quien de verdad valida el correo es el envío.
 */
export function esCorreoValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Cambiar el correo de un usuario, que es más delicado de lo que parece.
 *
 * La identidad de una persona vive en DOS sitios que hay que mover juntos:
 *   - `users.email`, con el que enlaza el acceso por Google la primera vez;
 *   - `authAccounts.providerAccountId` de su cuenta `password`, que es por
 *     donde busca el login por contraseña.
 *
 * Migrar solo el primero deja a esa persona sin poder entrar con su contraseña
 * y sin ninguna pista de por qué. Por eso los dos `patch` van en la misma
 * mutation: o se mueven los dos, o no se mueve ninguno.
 *
 * Vive aquí, y no duplicado, porque lo necesitan dos caminos distintos —
 * `usuarios.actualizar` (la dueña edita a alguien de su equipo) y
 * `seed.migrarEmailUsuario` (uso puntual por CLI)— y es lógica de identidad:
 * duplicarla es pedir que las dos copias se separen con el tiempo.
 *
 * Exige que el usuario tenga exactamente UNA cuenta `password`: sin eso no hay
 * un identificador único que migrar con garantías. Falla, en vez de adivinar,
 * si el correo nuevo ya pertenece a otra persona o identifica otra cuenta.
 *
 * `emailNuevo` debe llegar ya en forma canónica (`trim().toLowerCase()`): los
 * dos campos se comparan por índice con la cadena exacta.
 */
export async function migrarCorreo(
  ctx: MutationCtx,
  usuario: Doc<"users">,
  emailNuevo: string,
): Promise<void> {
  const yaConEmailNuevo = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", emailNuevo))
    .unique();
  if (yaConEmailNuevo !== null && yaConEmailNuevo._id !== usuario._id) {
    throw new ConvexError(`${emailNuevo} ya pertenece a otra persona`);
  }

  const cuentaPassword = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", usuario._id).eq("provider", "password"),
    )
    .unique();
  if (cuentaPassword === null) {
    throw new ConvexError(
      "Esa persona no tiene exactamente una cuenta de acceso con contraseña; no se puede cambiar su correo con garantías",
    );
  }

  const colisionPassword = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", emailNuevo),
    )
    .unique();
  if (colisionPassword !== null && colisionPassword._id !== cuentaPassword._id) {
    throw new ConvexError(`${emailNuevo} ya identifica otra cuenta de acceso`);
  }

  await ctx.db.patch(usuario._id, { email: emailNuevo });
  await ctx.db.patch(cuentaPassword._id, { providerAccountId: emailNuevo });
}
