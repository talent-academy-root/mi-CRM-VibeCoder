import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Resolver nombres de personas para un listado, sin releer la misma fila una vez
 * por resultado (TAL-69, O1).
 *
 * El patrón que sustituye era un `ctx.db.get(fila.autorId)` dentro del `map` del
 * historial. Con `HISTORIAL_MAX = 100` y un equipo de cinco personas, eso son
 * hasta cien lecturas para resolver cinco nombres — noventa y cinco de ellas
 * repitiendo una fila que ya se había traído.
 *
 * Deduplicar y no colectar la tabla entera es deliberado: así el coste depende
 * de cuántas personas DISTINTAS aparecen en el listado (como mucho el tamaño del
 * equipo), y no de cuántas filas tiene `users`. Escala igual con cinco usuarios
 * que con cinco mil, cosa que un `collect()` no haría.
 */
export async function nombresDeUsuarios(
  ctx: QueryCtx,
  ids: Array<Id<"users">>,
): Promise<Map<Id<"users">, string | undefined>> {
  const unicos = [...new Set(ids)];
  const nombres = new Map<Id<"users">, string | undefined>();
  await Promise.all(
    unicos.map(async (id) => {
      const usuario = await ctx.db.get(id);
      // Se guarda la entrada aunque la persona ya no exista: quien pregunte
      // recibe `undefined`, igual que antes devolvía `autor?.name`.
      nombres.set(id, usuario?.name);
    }),
  );
  return nombres;
}
