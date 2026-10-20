import type { Doc } from "./_generated/dataModel";

/**
 * Cuándo sigue valiendo una invitación (TAL-69, S7).
 *
 * Vive aquí, y no dentro de quien la usa, porque la regla la leen DOS sitios que
 * tienen que decir lo mismo: el paso 1 del acceso (`acceso.estaPendiente`, que
 * decide si ofrecer configurar la contraseña) y el panel de equipo
 * (`usuarios.listarEquipo`, que decide qué etiqueta enseñar). Si se separaran, la
 * pantalla diría «pendiente de entrar» de alguien a quien el acceso ya trata como
 * caducado, y nadie entendería por qué.
 *
 * Módulo puro a propósito: no importa `./_generated/api`, así que puede usarlo
 * cualquiera sin arrastrar ciclos.
 */

/**
 * Catorce días. Suficiente para unas vacaciones, poco para que una dirección mal
 * tecleada se quede marcada meses.
 */
export const VALIDEZ_INVITACION_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * ¿Esta persona sigue teniendo una invitación en pie?
 *
 * Nadie se queda fuera cuando devuelve `false`: el paso 1 le manda a la pantalla
 * de contraseña, y desde ahí «He olvidado mi contraseña» le da un código
 * exactamente igual. Lo que caduca es el atajo, no el acceso.
 *
 * Sin `invitadaEn` se considera caducada: son las invitaciones anteriores a este
 * cambio, que además son las que llevan más tiempo abiertas.
 */
export function invitacionVigente(usuario: Doc<"users">, ahora: number): boolean {
  if (usuario.contrasenaPendiente !== true) return false;
  if (usuario.invitadaEn === undefined) return false;
  return ahora - usuario.invitadaEn < VALIDEZ_INVITACION_MS;
}
