import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUsuario } from "./authz";
import { nombresDeUsuarios } from "./nombres";
import { estadoDe, ESTADO_CLIENTE } from "./clientes";
import { assertFechaISO, assertNoPosteriorAHoyMundial } from "./fechas";

/**
 * Todos los seguimientos pendientes del negocio, con datos del cliente y del
 * responsable. Regla de producto (TAL-16): NO se filtra por responsable —
 * todo el equipo ve todos los pendientes. La clasificación atrasado/hoy/próximo
 * es presentacional y se hace en el cliente con la fecha local del navegador.
 */
export const pendientesConCliente = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("seguimientos"),
      accion: v.string(),
      vence: v.string(),
      clienteId: v.id("clientes"),
      clienteNombre: v.string(),
      clienteEstado: ESTADO_CLIENTE,
      responsableId: v.id("users"),
      responsableNombre: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    await requireUsuario(ctx);
    const pend = await ctx.db
      .query("seguimientos")
      .withIndex("by_hecho_vence", (q) => q.eq("hecho", false))
      .collect();
    pend.sort((a, b) => a.vence.localeCompare(b.vence));
    // Una lectura por RESPONSABLE distinto, no por seguimiento (TAL-69, O1).
    const nombres = await nombresDeUsuarios(
      ctx,
      pend.map((s) => s.responsableId),
    );
    return await Promise.all(
      pend.map(async (s) => {
        const cliente = await ctx.db.get(s.clienteId);
        return {
          _id: s._id,
          accion: s.accion,
          vence: s.vence,
          clienteId: s.clienteId,
          clienteNombre: cliente?.nombre ?? "(cliente eliminado)",
          clienteEstado: await estadoDe(ctx, s.clienteId),
          responsableId: s.responsableId,
          responsableNombre: nombres.get(s.responsableId),
        };
      }),
    );
  },
});

/** Techo de lectura del historial, igual que `interacciones.listarPorCliente`. */
const HISTORIAL_MAX = 100;

/**
 * Seguimientos pendientes de un cliente, el más urgente primero (F8, ficha).
 * El índice compuesto ya ordena por `vence`, así que no hay `sort` en memoria.
 */
export const pendientesDeCliente = query({
  args: { clienteId: v.id("clientes") },
  returns: v.array(
    v.object({
      _id: v.id("seguimientos"),
      accion: v.string(),
      vence: v.string(),
      responsableNombre: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const pend = await ctx.db
      .query("seguimientos")
      .withIndex("by_cliente_hecho_vence", (q) =>
        q.eq("clienteId", args.clienteId).eq("hecho", false),
      )
      .collect();
    const nombres = await nombresDeUsuarios(
      ctx,
      pend.map((s) => s.responsableId),
    );
    return pend.map((s) => ({
      _id: s._id,
      accion: s.accion,
      vence: s.vence,
      responsableNombre: nombres.get(s.responsableId),
    }));
  },
});

/**
 * Seguimientos completados de un cliente, el más reciente primero — para el
 * historial de la ficha (TAL-14).
 *
 * Se ordenan por `fechaHecho` (cuándo se cerraron), NO por `vence`: un seguimiento
 * que vencía hace meses y se completó hoy debe encabezar el historial. De ahí el
 * índice `by_cliente_hecho_fechaHecho` — con el de `vence`, el `take` de abajo lo
 * habría descartado. Se lee uno de más para poder avisar de truncamiento.
 *
 * `_creationTime` desempata el historial dentro de un mismo día. Ojo: es cuándo se
 * CREÓ el seguimiento, no cuándo se completó (no hay timestamp de completado, solo
 * el día `fechaHecho`), así que uno viejo cerrado hoy cae al final de su día. El
 * orden es determinista y estable, que es lo que la lista necesita.
 */
export const completadosDeCliente = query({
  args: { clienteId: v.id("clientes") },
  returns: v.object({
    items: v.array(
      v.object({
        _id: v.id("seguimientos"),
        _creationTime: v.number(),
        accion: v.string(),
        fecha: v.string(),
        responsableNombre: v.optional(v.string()),
      }),
    ),
    truncado: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const leidos = await ctx.db
      .query("seguimientos")
      .withIndex("by_cliente_hecho_fechaHecho", (q) =>
        q.eq("clienteId", args.clienteId).eq("hecho", true),
      )
      .order("desc")
      .take(HISTORIAL_MAX + 1);
    const truncado = leidos.length > HISTORIAL_MAX;
    const mostrados = leidos.slice(0, HISTORIAL_MAX);
    const nombres = await nombresDeUsuarios(
      ctx,
      mostrados.map((s) => s.responsableId),
    );
    const items = mostrados.map((s) => ({
      _id: s._id,
      _creationTime: s._creationTime,
      accion: s.accion,
      // `hecho: true` siempre trae `fechaHecho`; el fallback es defensivo.
      fecha: s.fechaHecho ?? s.vence,
      responsableNombre: nombres.get(s.responsableId),
    }));
    return { items, truncado };
  },
});

/** Programa un seguimiento (F8). `responsableId` por defecto = usuario actual. */
export const crear = mutation({
  args: {
    clienteId: v.id("clientes"),
    accion: v.string(),
    vence: v.string(),
    responsableId: v.optional(v.id("users")),
  },
  returns: v.id("seguimientos"),
  handler: async (ctx, args) => {
    const usuario = await requireUsuario(ctx);
    const accion = args.accion.trim();
    if (accion.length === 0) throw new ConvexError("Indica qué hay que hacer");
    // Sin cota superior: un seguimiento se programa hacia el futuro.
    assertFechaISO(args.vence);
    const cliente = await ctx.db.get(args.clienteId);
    if (cliente === null) throw new ConvexError("Cliente no encontrado");
    const responsableId = args.responsableId ?? usuario._id;
    const responsable = await ctx.db.get(responsableId);
    if (
      responsable === null ||
      (responsable.rol !== "propietaria" && responsable.rol !== "comercial") ||
      // Con el acceso retirado no puede entrar a hacer la tarea, así que
      // asignársela sería programar algo que nadie va a ver (TAL-60). El
      // selector ya no la ofrece; esto lo garantiza en el servidor.
      responsable.activo === false
    ) {
      throw new ConvexError("Responsable inválido");
    }
    return await ctx.db.insert("seguimientos", {
      clienteId: args.clienteId,
      accion,
      vence: args.vence,
      responsableId,
      hecho: false,
    });
  },
});

/**
 * Marca un seguimiento como hecho. `fechaHecho` = fecha local del cliente.
 *
 * Se acota igual que en ventas e interacciones, y por un motivo propio:
 * `completadosDeCliente` ORDENA por `fechaHecho` y trunca a `HISTORIAL_MAX`, así
 * que una fecha futura —un reloj mal puesto, una petición manipulada— encabezaría
 * el historial para siempre y empujaría fuera del corte a los reales. `vence` sí
 * admite futuro (ver `crear`); esto es cuándo se HIZO.
 */
export const marcarHecho = mutation({
  args: { id: v.id("seguimientos"), fechaHecho: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const usuario = await requireUsuario(ctx);
    assertFechaISO(args.fechaHecho);
    assertNoPosteriorAHoyMundial(args.fechaHecho, "seguimientos completados");
    const s = await ctx.db.get(args.id);
    if (s === null) throw new ConvexError("Seguimiento no encontrado");
    // Ya cerrado: no se reescribe. Sin esto, re-marcar lo de otra persona movía
    // `completadoPorId` a quien lo re-marcó y le quitaba a quien lo completó la
    // única vía de deshacerlo (ver `deshacer`). Simétrico a su `if (!s.hecho)`.
    if (s.hecho) return null;
    await ctx.db.patch(args.id, {
      hecho: true,
      fechaHecho: args.fechaHecho,
      completadoPorId: usuario._id,
    });
    return null;
  },
});

/** Deshace el "hecho" — solo quien lo completó, para no reabrir lo de otro. */
export const deshacer = mutation({
  args: { id: v.id("seguimientos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const usuario = await requireUsuario(ctx);
    const s = await ctx.db.get(args.id);
    if (s === null) throw new ConvexError("Seguimiento no encontrado");
    if (!s.hecho) return null;
    if (s.completadoPorId !== usuario._id) {
      throw new ConvexError("Solo quien lo completó puede deshacerlo");
    }
    await ctx.db.patch(args.id, {
      hecho: false,
      fechaHecho: undefined,
      completadoPorId: undefined,
    });
    return null;
  },
});
