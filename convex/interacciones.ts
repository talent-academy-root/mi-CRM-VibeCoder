import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUsuario } from "./authz";
import { nombresDeUsuarios } from "./nombres";
import { assertFechaISO, assertNoPosteriorAHoyMundial } from "./fechas";

export const CANAL_INTERACCION = v.union(
  v.literal("llamada"),
  v.literal("email"),
  v.literal("whatsapp"),
  v.literal("en_persona"),
);

const MAX_TEXTO = 2000;

/** Techo de lectura del historial. No se trunca en silencio: ver `listarPorCliente`. */
const HISTORIAL_MAX = 100;

/**
 * Registra una interacción (F7). El autor es SIEMPRE el usuario en sesión, nunca
 * un argumento. `fecha` la calcula el navegador en su zona local; se admite
 * backdating (anotar una llamada de la semana pasada) pero no fecha futura — con
 * la salvedad de husos horarios que documenta `assertNoPosteriorAHoyMundial`.
 */
export const crear = mutation({
  args: {
    clienteId: v.id("clientes"),
    canal: CANAL_INTERACCION,
    fecha: v.string(),
    texto: v.string(),
  },
  returns: v.id("interacciones"),
  handler: async (ctx, args) => {
    const usuario = await requireUsuario(ctx);
    assertFechaISO(args.fecha);
    assertNoPosteriorAHoyMundial(args.fecha, "interacciones");
    const texto = args.texto.trim();
    if (texto.length === 0) throw new ConvexError("Escribe qué se ha hablado");
    if (texto.length > MAX_TEXTO) {
      throw new ConvexError(
        `La nota es demasiado larga (máx. ${MAX_TEXTO} caracteres)`,
      );
    }
    const cliente = await ctx.db.get(args.clienteId);
    if (cliente === null) throw new ConvexError("Cliente no encontrado");
    return await ctx.db.insert("interacciones", {
      clienteId: args.clienteId,
      canal: args.canal,
      fecha: args.fecha,
      texto,
      autorId: usuario._id,
    });
  },
});

/**
 * Historial de interacciones de un cliente, más reciente primero (TAL-14, parte
 * de F2). El índice compuesto ya da el orden, así que no hay `sort` en memoria.
 *
 * Se leen `HISTORIAL_MAX + 1` para saber si hay más de las que se devuelven, y
 * `truncado` deja que la ficha lo diga en vez de recortar sin avisar.
 *
 * `_creationTime` viaja al cliente porque `fecha` no lleva hora: es lo que
 * desempata el historial cuando una interacción y una venta caen el mismo día.
 *
 * `clienteId` es `v.id` porque llega del doc ya cargado por `clientes.obtener`
 * (fuente confiable), no del segmento de URL.
 */
export const listarPorCliente = query({
  args: { clienteId: v.id("clientes") },
  returns: v.object({
    items: v.array(
      v.object({
        _id: v.id("interacciones"),
        _creationTime: v.number(),
        fecha: v.string(),
        canal: CANAL_INTERACCION,
        texto: v.string(),
        autorNombre: v.optional(v.string()),
      }),
    ),
    truncado: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const leidas = await ctx.db
      .query("interacciones")
      .withIndex("by_cliente_fecha", (q) => q.eq("clienteId", args.clienteId))
      .order("desc")
      .take(HISTORIAL_MAX + 1);
    const truncado = leidas.length > HISTORIAL_MAX;
    const mostradas = leidas.slice(0, HISTORIAL_MAX);
    // Una lectura por AUTOR distinto, no por interacción (TAL-69, O1).
    const nombres = await nombresDeUsuarios(
      ctx,
      mostradas.map((i) => i.autorId),
    );
    const items = mostradas.map((i) => ({
      _id: i._id,
      _creationTime: i._creationTime,
      fecha: i.fecha,
      canal: i.canal,
      texto: i.texto,
      autorNombre: nombres.get(i.autorId),
    }));
    return { items, truncado };
  },
});
