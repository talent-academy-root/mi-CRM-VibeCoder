import { ConvexError } from "convex/values";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida que `fecha` sea un día real en formato ISO "YYYY-MM-DD" y lo devuelve.
 * El regex por sí solo acepta "2026-02-31" o "2026-13-01"; el round-trip por
 * `Date` los descarta (Date normaliza el 31 de febrero a marzo, y entonces la
 * fecha reconstruida ya no coincide con la de entrada).
 */
export function assertFechaISO(fecha: string): string {
  if (!ISO.test(fecha)) throw new ConvexError("Fecha inválida");
  const d = new Date(`${fecha}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) {
    throw new ConvexError("Fecha inválida");
  }
  return fecha;
}

/** Huso más adelantado del planeta (Kiritimati, UTC+14). */
const MAX_OFFSET_HORAS = 14;

/**
 * Rechaza la fecha solo si es futura en TODOS los husos horarios del planeta.
 *
 * Convex ejecuta en UTC y la fecha la calcula el navegador en su zona local, así
 * que "no futura para el usuario" NO es comprobable aquí: la zona horaria que el
 * cliente declare es tan manipulable como la propia fecha. La cota más estricta
 * que el servidor puede garantizar es el día en curso en UTC+14.
 *
 * Consecuencia asumida: durante parte del día UTC, "mañana en UTC" es un día
 * válido porque ya es hoy en Oceanía. Pasado mañana se rechaza siempre. La UI
 * pone `max` en el input (ayuda) y `relativeLabel` nunca etiqueta una fecha
 * futura como "Hoy" (src/lib/utils.ts), así que la holgura no se ve.
 *
 * `entidad` va en plural y en el mensaje que lee la persona ("interacciones",
 * "ventas"): quien llama sabe qué está guardando, esta función no.
 */
export function assertNoPosteriorAHoyMundial(
  fecha: string,
  entidad: string,
): void {
  const limite = new Date(Date.now() + MAX_OFFSET_HORAS * 3_600_000)
    .toISOString()
    .slice(0, 10);
  if (fecha > limite) {
    throw new ConvexError(`No se pueden registrar ${entidad} con fecha futura`);
  }
}
