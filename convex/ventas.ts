import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUsuario } from "./authz";
import { nombresDeUsuarios } from "./nombres";
import { assertFechaISO, assertNoPosteriorAHoyMundial } from "./fechas";

export const ESTADO_VENTA = v.union(
  v.literal("abierta"),
  v.literal("ganada"),
  v.literal("perdida"),
);

const MAX_CONCEPTO = 200;
/** Techo del importe. Un apunte más alto es un error de tecleo, no una venta. */
const MAX_IMPORTE = 1_000_000_000;

/** Techo de lectura del historial, igual que `interacciones.listarPorCliente`. */
const HISTORIAL_MAX = 100;

/** Recorta el concepto y valida que diga algo. */
function conceptoValido(concepto: string): string {
  const limpio = concepto.trim();
  if (limpio.length === 0) throw new ConvexError("Indica qué se vende");
  if (limpio.length > MAX_CONCEPTO) {
    throw new ConvexError(
      `El concepto es demasiado largo (máx. ${MAX_CONCEPTO} caracteres)`,
    );
  }
  return limpio;
}

/**
 * Normaliza el importe a dos decimales y lo valida. Se redondea ANTES de exigir
 * que sea mayor que cero: así un `0.001` acaba en 0 y se rechaza, en vez de
 * colarse como una venta de cero dólares.
 */
function importeValido(importe: number): number {
  if (!Number.isFinite(importe)) throw new ConvexError("Indica un importe válido");
  const redondeado = Math.round(importe * 100) / 100;
  if (redondeado <= 0) {
    throw new ConvexError("Indica un importe mayor que cero");
  }
  if (redondeado > MAX_IMPORTE) {
    throw new ConvexError("El importe es demasiado alto");
  }
  return redondeado;
}

/**
 * Registra una venta u oportunidad (F5). El autor es SIEMPRE el usuario en
 * sesión, nunca un argumento. `fecha` es cuándo ocurrió la operación, así que se
 * admite backdating pero no fecha futura, igual que en una interacción.
 *
 * Efecto secundario buscado: el estado del cliente es un valor calculado sobre
 * esta tabla (`estadoDe` en clientes.ts), así que insertar aquí lo recalcula solo.
 */
export const crear = mutation({
  args: {
    clienteId: v.id("clientes"),
    concepto: v.string(),
    importe: v.number(),
    estado: ESTADO_VENTA,
    fecha: v.string(),
  },
  returns: v.id("ventas"),
  handler: async (ctx, args) => {
    const usuario = await requireUsuario(ctx);
    assertFechaISO(args.fecha);
    assertNoPosteriorAHoyMundial(args.fecha, "ventas");
    const concepto = conceptoValido(args.concepto);
    const importe = importeValido(args.importe);
    const cliente = await ctx.db.get(args.clienteId);
    if (cliente === null) throw new ConvexError("Cliente no encontrado");
    return await ctx.db.insert("ventas", {
      clienteId: args.clienteId,
      concepto,
      importe,
      estado: args.estado,
      fecha: args.fecha,
      autorId: usuario._id,
    });
  },
});

/**
 * Edita una venta ya registrada (TAL-13: "se puede cambiar el estado, p. ej. de
 * abierta a ganada"). Se llega desde el historial de la ficha.
 *
 * NO toca `clienteId` ni `autorId`: una venta no cambia de cliente, y el pie del
 * historial sigue diciendo quién la registró. Puede editarla cualquier miembro
 * del equipo, como `clientes.actualizar` (a diferencia de `seguimientos.deshacer`,
 * reservada a quien completó el seguimiento).
 */
export const actualizar = mutation({
  args: {
    id: v.id("ventas"),
    concepto: v.string(),
    importe: v.number(),
    estado: ESTADO_VENTA,
    fecha: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const venta = await ctx.db.get(args.id);
    if (venta === null) throw new ConvexError("Venta no encontrada");
    assertFechaISO(args.fecha);
    assertNoPosteriorAHoyMundial(args.fecha, "ventas");
    await ctx.db.patch(args.id, {
      concepto: conceptoValido(args.concepto),
      importe: importeValido(args.importe),
      estado: args.estado,
      fecha: args.fecha,
    });
    return null;
  },
});

/**
 * Ventas de un cliente, más reciente primero, para el historial de la ficha
 * (TAL-14). El índice compuesto ya da el orden, así que no hay `sort` en memoria,
 * y se lee una de más para poder decir `truncado` en vez de recortar sin avisar.
 */
export const listarPorCliente = query({
  args: { clienteId: v.id("clientes") },
  returns: v.object({
    items: v.array(
      v.object({
        _id: v.id("ventas"),
        _creationTime: v.number(),
        concepto: v.string(),
        importe: v.number(),
        estado: ESTADO_VENTA,
        fecha: v.string(),
        autorNombre: v.optional(v.string()),
      }),
    ),
    truncado: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const leidas = await ctx.db
      .query("ventas")
      .withIndex("by_cliente_fecha", (q) => q.eq("clienteId", args.clienteId))
      .order("desc")
      .take(HISTORIAL_MAX + 1);
    const truncado = leidas.length > HISTORIAL_MAX;
    const mostradas = leidas.slice(0, HISTORIAL_MAX);
    // Una lectura por AUTOR distinto, no por venta (TAL-69, O1).
    const nombres = await nombresDeUsuarios(
      ctx,
      mostradas.map((venta) => venta.autorId),
    );
    const items = mostradas.map((venta) => ({
      _id: venta._id,
      _creationTime: venta._creationTime,
      concepto: venta.concepto,
      importe: venta.importe,
      estado: venta.estado,
      fecha: venta.fecha,
      autorNombre: nombres.get(venta.autorId),
    }));
    return { items, truncado };
  },
});

/** Orden de desempate entre ventas del mismo día: lo abierto primero. */
const ORDEN_ESTADO = { abierta: 0, ganada: 1, perdida: 2 } as const;

/**
 * Todas las ventas del negocio con el nombre de su cliente, para /ventas (TAL-62).
 * La pantalla calcula ahí sus métricas y los contadores de cada filtro, de forma
 * que el número del chip y las filas de la lista no puedan discrepar.
 *
 * Escala MVP: `collect()` de las dos tablas, como `clientes.listarConEstado`.
 * Aceptable para decenas de ventas; a miles habría que paginar. Los clientes se
 * leen UNA vez a un Map en lugar de un `db.get` por fila (N+1).
 */
export const listarTodas = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("ventas"),
      clienteId: v.id("clientes"),
      clienteNombre: v.string(),
      concepto: v.string(),
      importe: v.number(),
      estado: ESTADO_VENTA,
      fecha: v.string(),
    }),
  ),
  handler: async (ctx) => {
    await requireUsuario(ctx);
    const [ventas, clientes] = await Promise.all([
      ctx.db.query("ventas").collect(),
      ctx.db.query("clientes").collect(),
    ]);
    const nombrePorId = new Map(clientes.map((c) => [c._id, c.nombre]));
    const filas = ventas.map((venta) => ({
      _id: venta._id,
      clienteId: venta.clienteId,
      clienteNombre: nombrePorId.get(venta.clienteId) ?? "(cliente eliminado)",
      concepto: venta.concepto,
      importe: venta.importe,
      estado: venta.estado,
      fecha: venta.fecha,
    }));
    filas.sort(
      (a, b) =>
        b.fecha.localeCompare(a.fecha) ||
        ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado],
    );
    return filas;
  },
});
