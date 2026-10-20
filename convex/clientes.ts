import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUsuario } from "./authz";

export const ESTADO_CLIENTE = v.union(
  v.literal("nuevo_lead"),
  v.literal("en_negociacion"),
  v.literal("ganado"),
  v.literal("perdido"),
);

export const CANAL_ORIGEN = v.union(
  v.literal("web"),
  v.literal("redes"),
  v.literal("email"),
  v.literal("whatsapp"),
);

/**
 * Estado calculado del cliente a partir de sus ventas (regla en schema.ts).
 * No es una función pública; se reutiliza desde otras funciones Convex.
 *
 * UNA sola fila resuelve el estado. Se apoya en que `by_cliente_estado` ordena
 * por `estado` y en que el orden ascendente de los literales coincide con la
 * prioridad de la regla: abierta < ganada < perdida. La primera fila del índice
 * es, por tanto, la que manda; sin filas, el cliente no tiene ventas.
 *
 * ⚠️ ANTES DE AÑADIR UN ESTADO A `ventas`, VUELVE AQUÍ. Esa coincidencia entre
 * el alfabeto y la prioridad del negocio es una casualidad afortunada, no un
 * diseño: un literal como "cancelada" se ordenaría el PRIMERO y falsearía el
 * estado de todos los clientes que lo tuvieran. Si el orden deja de coincidir,
 * esta función necesita una consulta por estado en orden de prioridad (más
 * rangos de índice por cliente) o un mapa explícito de orden.
 *
 * Se leía antes con `collect()` de todas las ventas del cliente, lo que hacía
 * que /clientes y /hoy —que llaman a esto una vez por fila— dependieran del
 * volumen de ventas de cada uno. El `.order("asc")` es el valor por defecto de
 * Convex y va explícito a propósito: deja a la vista que aquí importa cuál es
 * la primera fila.
 */
export async function estadoDe(ctx: QueryCtx, clienteId: Id<"clientes">) {
  const venta = await ctx.db
    .query("ventas")
    .withIndex("by_cliente_estado", (q) => q.eq("clienteId", clienteId))
    .order("asc")
    .first();
  if (venta === null) return "nuevo_lead" as const;
  if (venta.estado === "abierta") return "en_negociacion" as const;
  if (venta.estado === "ganada") return "ganado" as const;
  return "perdido" as const;
}

/** Lista mínima de clientes para los selectores (Nueva tarea, etc.). */
export const listar = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("clientes"), nombre: v.string() })),
  handler: async (ctx) => {
    await requireUsuario(ctx);
    const cs = await ctx.db.query("clientes").collect();
    return cs.map((c) => ({ _id: c._id, nombre: c.nombre }));
  },
});

/**
 * Lista de clientes con estado calculado y "último contacto", para /clientes (F3).
 *
 * Escala MVP: `collect()` de toda la tabla + dos consultas por cliente (`estadoDe` y
 * el último contacto), ambas de una fila. El coste ya NO depende de cuántas ventas
 * tenga cada cliente, pero sí sigue creciendo con el número de clientes: dos rangos
 * de índice por fila, sobre un techo de 4.096 por transacción. A miles habría que
 * paginar o mover la búsqueda al servidor — NO dejar este patrón como implícito si
 * el volumen crece.
 *
 * "Último contacto" = la interacción más reciente, leída del índice compuesto
 * `by_cliente_fecha` en orden descendente (una sola fila, sin collect+reduce).
 */
export const listarConEstado = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("clientes"),
      nombre: v.string(),
      empresa: v.optional(v.string()),
      email: v.optional(v.string()),
      telefono: v.optional(v.string()),
      estado: ESTADO_CLIENTE,
      ultimoContacto: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    await requireUsuario(ctx);
    const clientes = await ctx.db.query("clientes").collect();
    const filas = await Promise.all(
      clientes.map(async (c) => {
        const estado = await estadoDe(ctx, c._id);
        const ultima = await ctx.db
          .query("interacciones")
          .withIndex("by_cliente_fecha", (q) => q.eq("clienteId", c._id))
          .order("desc")
          .first();
        const ultimoContacto = ultima?.fecha ?? null;
        return {
          _id: c._id,
          nombre: c.nombre,
          empresa: c.empresa,
          email: c.email,
          telefono: c.telefono,
          estado,
          ultimoContacto,
        };
      }),
    );
    filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return filas;
  },
});

/**
 * Un cliente por id con su estado calculado, para la ficha (F2). `id` llega como
 * string (segmento de URL, no confiable) y se valida con `normalizeId`: cualquier id
 * inválido, de otra tabla o inexistente devuelve `null` — la ficha muestra "Cliente no
 * encontrado" en vez de propagar un error de argumento de Convex.
 */
export const obtener = query({
  args: { id: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("clientes"),
      nombre: v.string(),
      empresa: v.optional(v.string()),
      telefono: v.optional(v.string()),
      email: v.optional(v.string()),
      canalOrigen: v.optional(CANAL_ORIGEN),
      estado: ESTADO_CLIENTE,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const id = ctx.db.normalizeId("clientes", args.id);
    if (id === null) return null;
    const c = await ctx.db.get(id);
    if (c === null) return null;
    return {
      _id: c._id,
      nombre: c.nombre,
      empresa: c.empresa,
      telefono: c.telefono,
      email: c.email,
      canalOrigen: c.canalOrigen,
      estado: await estadoDe(ctx, c._id),
    };
  },
});

/** Alta rápida de cliente (F1, base). Requiere nombre y ≥1 medio de contacto. */
export const crear = mutation({
  args: {
    nombre: v.string(),
    empresa: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    canalOrigen: v.optional(CANAL_ORIGEN),
    nota: v.optional(v.string()),
  },
  returns: v.id("clientes"),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const nombre = args.nombre.trim();
    if (nombre.length === 0) throw new ConvexError("El nombre es obligatorio");
    const telefono = args.telefono?.trim() || undefined;
    const email = args.email?.trim() || undefined;
    if (!telefono && !email) {
      throw new ConvexError("Indica al menos un teléfono o un email");
    }
    return await ctx.db.insert("clientes", {
      nombre,
      empresa: args.empresa?.trim() || undefined,
      telefono,
      email,
      canalOrigen: args.canalOrigen,
      nota: args.nota?.trim() || undefined,
    });
  },
});

/**
 * Edita los datos de contacto de un cliente (F2). NO toca `canalOrigen`/`nota` ni el
 * estado (calculado desde ventas). Misma regla que el alta: nombre + ≥1 medio de
 * contacto. `id` es `v.id` porque llega del doc ya cargado (fuente confiable), no de la URL.
 */
export const actualizar = mutation({
  args: {
    id: v.id("clientes"),
    nombre: v.string(),
    empresa: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUsuario(ctx);
    const cliente = await ctx.db.get(args.id);
    if (cliente === null) throw new ConvexError("Cliente no encontrado");
    const nombre = args.nombre.trim();
    if (nombre.length === 0) throw new ConvexError("El nombre es obligatorio");
    const telefono = args.telefono?.trim() || undefined;
    const email = args.email?.trim() || undefined;
    if (!telefono && !email) {
      throw new ConvexError("Indica al menos un teléfono o un email");
    }
    // patch con `undefined` borra el campo opcional (empresa/teléfono/email vaciados).
    await ctx.db.patch(args.id, {
      nombre,
      empresa: args.empresa?.trim() || undefined,
      telefono,
      email,
    });
    return null;
  },
});
