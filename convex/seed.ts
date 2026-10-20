import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { migrarCorreo } from "./identidad";

/** Busca un usuario por email (uso interno del seed, para idempotencia). */
export const buscarPorEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    const u = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    return u === null ? null : u._id;
  },
});

/**
 * Seed dev-only de los usuarios del negocio. NO es invocable desde el cliente
 * (internalAction). Idempotente por email. El `rol` solo se produce por este
 * camino (createAccount con profile.rol → createOrUpdateUser lo acepta).
 *
 * Ejecutar en local:
 *   npx convex run seed:sembrarUsuarios '{"martaPassword":"...","carlosPassword":"..."}'
 */
export const sembrarUsuarios = internalAction({
  args: { martaPassword: v.string(), carlosPassword: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const cuentas = [
      {
        email: "admin@talent-network.org",
        name: "Marta López",
        rol: "propietaria" as const,
        password: args.martaPassword,
      },
      {
        email: "carlos@vibecrm.local",
        name: "Carlos Ruiz",
        rol: "comercial" as const,
        password: args.carlosPassword,
      },
    ];
    const resultado: string[] = [];
    for (const c of cuentas) {
      const existente = await ctx.runQuery(internal.seed.buscarPorEmail, {
        email: c.email,
      });
      if (existente !== null) {
        resultado.push(`ya existe: ${c.email}`);
        continue;
      }
      await createAccount<DataModel>(ctx, {
        provider: "password",
        account: { id: c.email, secret: c.password },
        profile: { email: c.email, name: c.name, rol: c.rol },
      });
      resultado.push(`creado: ${c.email} (${c.rol})`);
    }
    return resultado;
  },
});

/**
 * Seed de los usuarios para las pruebas e2e de Playwright (uno por rol).
 * Mismo mecanismo e idempotencia que `sembrarUsuarios`; emails `e2e.*` para
 * que se distingan a simple vista en /equipo. Las contraseñas se pasan por
 * args y viven en `.env.e2e` (gitignorado), nunca en el repo.
 *
 * Ejecutar en local:
 *   npx convex run seed:sembrarUsuariosPrueba \
 *     '{"propietariaPassword":"...","comercialPassword":"..."}'
 */
export const sembrarUsuariosPrueba = internalAction({
  args: { propietariaPassword: v.string(), comercialPassword: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const cuentas = [
      {
        email: "e2e.propietaria@vibecrm.local",
        name: "E2E Propietaria",
        rol: "propietaria" as const,
        password: args.propietariaPassword,
      },
      {
        email: "e2e.comercial@vibecrm.local",
        name: "E2E Comercial",
        rol: "comercial" as const,
        password: args.comercialPassword,
      },
    ];
    const resultado: string[] = [];
    for (const c of cuentas) {
      const existente = await ctx.runQuery(internal.seed.buscarPorEmail, {
        email: c.email,
      });
      if (existente !== null) {
        resultado.push(`ya existe: ${c.email}`);
        continue;
      }
      await createAccount<DataModel>(ctx, {
        provider: "password",
        account: { id: c.email, secret: c.password },
        profile: { email: c.email, name: c.name, rol: c.rol },
      });
      resultado.push(`creado: ${c.email} (${c.rol})`);
    }
    return resultado;
  },
});

/**
 * Migra el email de un usuario ya sembrado (uso puntual, ej. cuando el email
 * de prueba de la propietaria se sustituye por el email real que usará para
 * entrar, también con Google). Parchea, en la misma mutación transaccional:
 *   - `users.email`
 *   - `authAccounts.providerAccountId` de su cuenta `password` (el login por
 *     contraseña busca por ese campo, no por `users.email` — si no se migra
 *     junto, la contraseña deja de servir con el email nuevo).
 *
 * Idempotente: si `emailActual` ya no existe pero `emailNuevo` sí, se
 * considera ya migrado y no falla. Explícitamente NO idempotente ante
 * colisión: si `emailNuevo` ya pertenece a otro usuario o ya identifica otra
 * cuenta `password`, falla en vez de crear un duplicado. También falla si el
 * usuario no tiene exactamente una cuenta `password` asociada (0 o más de
 * 1): sin eso no hay un identificador único que migrar con garantías.
 *
 * Ejecutar en local:
 *   npx convex run seed:migrarEmailUsuario \
 *     '{"emailActual":"marta@vibecrm.local","emailNuevo":"admin@talent-network.org"}'
 */
export const migrarEmailUsuario = internalMutation({
  args: { emailActual: v.string(), emailNuevo: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Se normalizan los dos: `users.email` y `providerAccountId` se comparan por
    // índice con la cadena exacta, así que un correo con mayúsculas dejaría a esa
    // persona sin poder entrar ni con contraseña ni con Google (TAL-66).
    const emailActual = args.emailActual.trim().toLowerCase();
    const emailNuevo = args.emailNuevo.trim().toLowerCase();

    const usuario = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", emailActual))
      .unique();

    if (usuario === null) {
      const yaConEmailNuevo = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", emailNuevo))
        .unique();
      if (yaConEmailNuevo !== null) {
        return `ya migrado: ${emailActual} → ${emailNuevo}`;
      }
      throw new Error(`No existe ningún usuario con email ${emailActual}`);
    }

    // El movimiento en sí (los dos campos a la vez, con sus comprobaciones de
    // colisión) vive en `identidad.migrarCorreo`, compartido con
    // `usuarios.actualizar`: es lógica de identidad y no debe existir por
    // duplicado. Aquí queda solo lo propio del seed, que es la idempotencia.
    await migrarCorreo(ctx, usuario, emailNuevo);
    return `migrado: ${emailActual} → ${emailNuevo}`;
  },
});
