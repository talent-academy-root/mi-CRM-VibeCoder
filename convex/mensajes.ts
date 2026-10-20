/**
 * Mensajes de autorización que el navegador necesita RECONOCER, no solo mostrar.
 *
 * Vive en un módulo propio, sin dependencias, porque lo importan los dos lados:
 * `convex/authz.ts` para lanzarlo y `src/components/layout/LimiteDeError.tsx`
 * para decidir qué hacer con él. Comparar por texto suelto en el cliente
 * funcionaría hasta el día en que alguien corrigiera una coma.
 */

/**
 * La sesión del token ya no existe (la cerró `invalidateSessions`, o caducó).
 *
 * A diferencia de "tu acceso ha sido desactivado", esto NO es una decisión sobre
 * la persona y no hay nada que explicarle: lo único que procede es volver a la
 * pantalla de acceso. Por eso el límite de error lo trata aparte.
 */
export const SESION_INVALIDA =
  "Tu sesión ya no es válida. Vuelve a iniciar sesión.";
