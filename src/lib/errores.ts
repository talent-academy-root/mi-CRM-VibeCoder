import { ConvexError } from "convex/values";

/**
 * Mensaje legible de un error de Convex. Las funciones del backend lanzan
 * `ConvexError("texto para la persona")`, y ese texto viaja en `.data`.
 * Cualquier otra cosa (fallo de red, error interno) usa `fallback`: nunca se
 * enseña un stack ni el prefijo "[CONVEX ...]" que trae `String(error)`.
 */
export function mensajeError(e: unknown, fallback: string): string {
  return e instanceof ConvexError && typeof e.data === "string"
    ? e.data
    : fallback;
}
