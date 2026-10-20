import { v, ConvexError } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { createAccount, invalidateSessions } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUsuario, requirePropietaria } from "./authz";
import { canonico, esCorreoValido, migrarCorreo } from "./identidad";
import { invitacionVigente } from "./invitacion";

const ROL = v.union(v.literal("propietaria"), v.literal("comercial"));

/**
 * Contraseña inicial de quien se invita: 40 caracteres de un alfabeto de 32
 * (200 bits). No la conoce NADIE, ni la dueña que da el alta — solo existe para
 * que exista la cuenta `password`, que es sobre la que después actúa el código
 * de configuración. Nunca se muestra, se registra ni se envía.
 *
 * `byte % 32` es uniforme porque 256 es múltiplo exacto de 32.
 */
function secretoInservible(): string {
  const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = new Uint8Array(40);
  crypto.getRandomValues(bytes);
  let secreto = "";
  for (const byte of bytes) {
    secreto += ALFABETO[byte % ALFABETO.length];
  }
  return secreto;
}

/** El usuario de la sesión actual (para la cabecera, autoría, etc.). */
export const actual = query({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    rol: ROL,
  }),
  handler: async (ctx) => {
    const u = await requireUsuario(ctx);
    return { _id: u._id, name: u.name, email: u.email, rol: u.rol! };
  },
});

/**
 * Usuarios provisionados del negocio, para el selector de responsable (TAL-15).
 * Excluye a quien tiene el acceso retirado: no tiene sentido asignarle una
 * tarea a alguien que ya no puede entrar a hacerla (TAL-60).
 */
export const listar = query({
  args: {},
  returns: v.array(
    v.object({ _id: v.id("users"), name: v.optional(v.string()), rol: ROL }),
  ),
  handler: async (ctx) => {
    await requireUsuario(ctx);
    const todos = await ctx.db.query("users").collect();
    return todos
      .filter((u) => u.rol === "propietaria" || u.rol === "comercial")
      .filter((u) => u.activo !== false)
      .map((u) => ({ _id: u._id, name: u.name, rol: u.rol! }));
  },
});

/**
 * La lista del panel de equipo (TAL-60). A diferencia de `listar`, SÍ incluye a
 * las personas desactivadas: es lo que permite volver a darles acceso.
 *
 * `activo`, `pendiente` y `caducada` se normalizan aquí a booleano para que la
 * pantalla no tenga que conocer el convenio de "undefined = activa" ni la regla
 * de caducidad.
 *
 * `pendiente` y `caducada` se calculan con `invitacionVigente`, el mismo helper
 * que usa el paso 1 del acceso: si divergieran, el panel diría "pendiente de
 * entrar" de alguien a quien el acceso ya trata como caducado.
 */
export const listarEquipo = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      rol: ROL,
      activo: v.boolean(),
      pendiente: v.boolean(),
      caducada: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    await requirePropietaria(ctx);
    const ahora = Date.now();
    const todos = await ctx.db.query("users").collect();
    return todos
      .filter((u) => u.rol === "propietaria" || u.rol === "comercial")
      .map((u) => {
        const invitada = u.contrasenaPendiente === true;
        const vigente = invitacionVigente(u, ahora);
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          rol: u.rol!,
          activo: u.activo !== false,
          pendiente: vigente,
          // Invitada, sin entrar, y ya fuera de plazo. Se distingue de
          // `pendiente` porque a la dueña le dicen cosas distintas: una espera
          // a que la persona entre, la otra pide actuar.
          caducada: invitada && !vigente,
        };
      })
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));
  },
});

/**
 * `requirePropietaria` desde una action, que no tiene `ctx.db`. Mismo patrón que
 * usa `recuperacion.solicitarCodigo` para llegar a la base desde fuera de una
 * mutation. Lanza igual que el original si quien llama no es la dueña.
 */
export const exigirPropietaria = internalQuery({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const duena = await requirePropietaria(ctx);
    return duena._id;
  },
});

/** Estado de un correo antes de invitarlo, para dar un mensaje que ayude. */
export const estadoDeCorreo = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({ activo: v.boolean(), name: v.optional(v.string()) }),
  ),
  handler: async (ctx, args) => {
    const u = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    if (u === null) return null;
    return { activo: u.activo !== false, name: u.name };
  },
});

/**
 * Alta de una persona en el CRM (TAL-60).
 *
 * Es una `action` y no una `mutation` porque `createAccount` lo exige: necesita
 * hashear el secreto, que no se puede hacer dentro de una transacción.
 *
 * El registro sigue CERRADO: esto no abre ningún camino nuevo. `createAccount`
 * entra directo en la mutation de la librería sin pasar por `Password.profile()`
 * —donde `flow:"signUp"` está cerrado—, y el `rol` que lleva el perfil solo
 * puede venir de aquí o del seed, las dos cosas en el servidor.
 *
 * La persona NO recibe ninguna contraseña: se le crea una imposible de adivinar
 * y se le manda un correo diciéndole que entre en /login, escriba su correo y
 * configure la suya con el código que le llegará.
 */
export const invitar = action({
  args: { nombre: v.string(), email: v.string(), rol: ROL },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runQuery(internal.usuarios.exigirPropietaria, {});

    const nombre = args.nombre.trim();
    if (nombre.length === 0) {
      throw new ConvexError("Indica el nombre de la persona");
    }
    const email = canonico(args.email);
    if (!esCorreoValido(email)) {
      throw new ConvexError("Ese correo no parece válido");
    }

    // Comprobación amable: `createAccount` ya falla solo si la cuenta existe,
    // pero con un error de librería que no le dice nada a la dueña. Aquí se
    // distingue el caso útil, que es el de alguien a quien se desactivó y en
    // realidad solo hay que volver a activar.
    const existente = await ctx.runQuery(internal.usuarios.estadoDeCorreo, {
      email,
    });
    if (existente !== null) {
      throw new ConvexError(
        existente.activo
          ? "Ese correo ya pertenece a alguien del equipo"
          : "Ese correo pertenece a alguien con el acceso retirado: reactívalo en vez de crearlo de nuevo",
      );
    }

    await createAccount<DataModel>(ctx, {
      provider: "password",
      account: { id: email, secret: secretoInservible() },
      profile: {
        email,
        name: nombre,
        rol: args.rol,
        contrasenaPendiente: true,
        // Marca de tiempo para que la invitación caduque (TAL-69, S7). Los dos
        // campos viajan juntos y `createOrUpdateUser` los persiste juntos.
        invitadaEn: Date.now(),
      },
    });

    // El correo va en una tarea aparte y su fallo NO deshace el alta: la
    // persona ya existe y puede entrar por /login sin ayuda de nadie. Si no
    // llega, queda en los logs de Convex.
    await ctx.scheduler.runAfter(0, internal.correo.invitarUsuario, {
      email,
      nombre,
    });
    return null;
  },
});

/**
 * Edita nombre, correo y rol de alguien del equipo (TAL-60).
 *
 * Las dos reglas que protegen el acceso al CRM se comprueban AQUÍ, dentro de la
 * transacción, y no solo escondiendo botones en la pantalla.
 */
export const actualizar = mutation({
  args: {
    id: v.id("users"),
    nombre: v.string(),
    email: v.string(),
    rol: ROL,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const duena = await requirePropietaria(ctx);
    const usuario = await ctx.db.get(args.id);
    if (usuario === null) throw new ConvexError("Esa persona ya no existe");

    const nombre = args.nombre.trim();
    if (nombre.length === 0) {
      throw new ConvexError("Indica el nombre de la persona");
    }
    const email = canonico(args.email);
    if (!esCorreoValido(email)) {
      throw new ConvexError("Ese correo no parece válido");
    }

    // Quitarse a una misma el rol de dueña es la forma más fácil de perder el
    // control del CRM sin darse cuenta.
    if (usuario._id === duena._id && args.rol !== "propietaria") {
      throw new ConvexError("No puedes quitarte a ti misma el rol de dueña");
    }
    // El correo PROPIO no se cambia desde aquí (TAL-61).
    //
    // En "Mi cuenta", cambiar el correo exige escribir la contraseña actual,
    // porque el correo es la identidad de acceso: con él se recupera la
    // contraseña. Sin esta línea, ese control se saltaba por la puerta de al
    // lado —la dueña se edita a sí misma en /equipo, donde no se pide nada— y
    // cualquiera que encontrara una sesión de dueña abierta podía mover la
    // cuenta a un buzón propio y quedársela. Editar el correo de OTRA persona
    // sigue permitido: ahí la contraseña de esa persona no la conoce nadie, y
    // el gesto ya es deliberado y trazable.
    if (usuario._id === duena._id && email !== usuario.email) {
      throw new ConvexError(
        "Tu propio correo se cambia desde Mi cuenta, escribiendo tu contraseña",
      );
    }
    // Y esta es la misma regla vista desde el otro lado: si esta persona es la
    // última dueña activa, degradarla dejaría el negocio sin nadie que pueda
    // gestionar el equipo, para siempre.
    if (usuario.rol === "propietaria" && args.rol !== "propietaria") {
      await exigirOtraPropietariaActiva(ctx, usuario._id);
    }

    if (email !== usuario.email) {
      await migrarCorreo(ctx, usuario, email);
    }
    await ctx.db.patch(usuario._id, { name: nombre, rol: args.rol });
    return null;
  },
});

/**
 * Comprueba que queda alguna OTRA dueña activa además de `salvo`.
 *
 * ATENCIÓN, y esto lo aclaró la auditoría de TAL-69 (S6): desde sus dos llamadas
 * actuales **este error no se puede producir nunca**. En `actualizar` y en
 * `marcarAcceso`, la comprobación de «no a ti misma» corre ANTES, así que la
 * persona afectada nunca es quien llama; y quien llama pasó por
 * `requirePropietaria`, luego es una dueña activa que no está en `salvo` y que
 * por tanto siempre cuenta. El resultado nunca puede ser cero.
 *
 * La invariante «nunca cero dueñas activas» SÍ se cumple, pero la sostienen esas
 * dos reglas de autoprotección, no esta función. Incluso en concurrencia: si dos
 * dueñas se desactivaran a la vez, `requirePropietaria` mete la fila de la
 * llamante en el conjunto de lectura, así que el control optimista de Convex
 * serializa las mutations y la segunda ya se encuentra rechazada.
 *
 * No se borra porque es la red del día en que aparezca un TERCER sitio que
 * degrade o desactive sin esa comprobación previa. Pero conviene no confundirse:
 * hoy es un cinturón, no el tirante.
 */
async function exigirOtraPropietariaActiva(
  ctx: MutationCtx,
  salvo: Id<"users">,
): Promise<void> {
  const usuarios = await ctx.db.query("users").collect();
  const otras = usuarios.filter(
    (u) => u._id !== salvo && u.rol === "propietaria" && u.activo !== false,
  );
  if (otras.length === 0) {
    throw new ConvexError(
      "No puedes dejar el negocio sin ninguna dueña activa: nombra antes a otra",
    );
  }
}

/**
 * Marca el acceso de alguien, con las reglas de seguridad dentro de la
 * transacción. Interna: la abren las actions de abajo, que además cierran las
 * sesiones abiertas.
 *
 * NO EJECUTAR SUELTA POR CLI para retirar un acceso. Hace falta `desactivar`,
 * que además invalida las sesiones, y el motivo es más fuerte de lo que parece:
 * `beforeSessionCreation` —el candado que comprueba `activo`— solo se invoca
 * desde `createSession`. El refresco de token NO pasa por ahí (verificado en
 * `refreshSession.js`, TAL-69 S10), así que emite JWT nuevos sin volver a mirar
 * este campo. Con la marca puesta pero la sesión viva, esa persona seguiría
 * renovando su token indefinidamente: solo le fallarían los datos, por
 * `requireUsuario`. Lo que de verdad la echa es borrar la sesión.
 */
export const marcarAcceso = internalMutation({
  args: { id: v.id("users"), activo: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const duena = await requirePropietaria(ctx);
    const usuario = await ctx.db.get(args.id);
    if (usuario === null) throw new ConvexError("Esa persona ya no existe");

    if (!args.activo) {
      if (usuario._id === duena._id) {
        throw new ConvexError("No puedes retirarte el acceso a ti misma");
      }
      if (usuario.rol === "propietaria") {
        await exigirOtraPropietariaActiva(ctx, usuario._id);
      }
    }
    // `undefined` en vez de `true` para no dejar el campo escrito en las filas
    // que nunca se han desactivado: el convenio es que ausente = activa.
    await ctx.db.patch(usuario._id, {
      activo: args.activo ? undefined : false,
    });
    return null;
  },
});

/**
 * Retira el acceso a alguien (TAL-60). Hacen falta las dos mitades:
 *   - la marca `activo: false`, que impide crear sesiones NUEVAS
 *     (`beforeSessionCreation` en convex/auth.ts) y corta las consultas de
 *     datos (`requireUsuario`);
 *   - `invalidateSessions`, que cierra las que tuviera abiertas ahora mismo.
 * Con solo la primera seguiría trabajando hasta que caducara su sesión; con
 * solo la segunda le bastaría con volver a entrar.
 */
export const desactivar = action({
  args: { id: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runMutation(internal.usuarios.marcarAcceso, {
      id: args.id,
      activo: false,
    });
    await invalidateSessions<DataModel>(ctx, { userId: args.id });
    return null;
  },
});

/**
 * Devuelve el acceso. No hay nada más que hacer: conserva su rol, su contraseña
 * y su cuenta de Google, porque desactivar nunca los tocó.
 */
export const reactivar = action({
  args: { id: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runMutation(internal.usuarios.marcarAcceso, {
      id: args.id,
      activo: true,
    });
    return null;
  },
});
