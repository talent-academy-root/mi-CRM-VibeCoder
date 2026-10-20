/** Dígitos con, como mucho, un separador decimal (coma o punto) y dos decimales. */
const IMPORTE = /^\d+([.,]\d{1,2})?$/;

/**
 * Convierte lo que se teclea en el campo Importe a un número, o `null` si no es
 * un importe. Acepta "1200", "1200.5" y "1200,50" — coma y punto valen igual,
 * porque el teclado numérico del móvil ofrece uno u otro según el idioma.
 *
 * Rechaza los separadores de miles ("1,200.50"): con dos separadores no hay forma
 * de saber cuál es el decimal sin adivinar la convención de quien escribe. También
 * rechaza más de dos decimales, en lugar de redondearlos por su cuenta.
 *
 * Devuelve 0 para "0", que sí es un importe bien escrito aunque no sea válido
 * como venta: así quien llama distingue "no se entiende" de "es cero" y puede dar
 * el mismo mensaje que el backend.
 */
export function parseImporte(texto: string): number | null {
  const limpio = texto.trim();
  if (!IMPORTE.test(limpio)) return null;
  const n = Number(limpio.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}
