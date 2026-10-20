import { hoyLocalISO, shortDate } from "./utils";

/**
 * Etiqueta de vencimiento de un seguimiento pendiente, para la ficha del cliente:
 * "Venció ayer" / "Venció hace 3 días" / "Vence hoy" / "Vence el 12 jun".
 *
 * No sirve `relativeLabel`: allí "hoy" es "Hoy" a secas y el pasado no dice que
 * algo venció. La pantalla Hoy usa sus propias etiquetas ("Hoy", relativa), más
 * cortas porque la fila ya va acompañada del cliente.
 */
export function etiquetaVencimiento(
  vence: string,
  hoy: string = hoyLocalISO(),
): { texto: string; atrasado: boolean } {
  const dias = Math.round(
    (new Date(`${hoy}T00:00:00`).getTime() -
      new Date(`${vence}T00:00:00`).getTime()) /
      86_400_000,
  );
  if (dias === 1) return { texto: "Venció ayer", atrasado: true };
  if (dias > 1) return { texto: `Venció hace ${dias} días`, atrasado: true };
  if (dias === 0) return { texto: "Vence hoy", atrasado: false };
  // `shortDate` omite el año: "1 mar" para un vencimiento de 2027 es ambiguo.
  const otroAño = vence.slice(0, 4) !== hoy.slice(0, 4);
  const dia = otroAño
    ? `${shortDate(vence)} ${vence.slice(0, 4)}`
    : shortDate(vence);
  return { texto: `Vence el ${dia}`, atrasado: false };
}
