"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/lib/convexApi";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Usuario de la sesión actual. Devuelve `undefined` mientras carga o sin sesión.
 * Se salta la query si aún no hay sesión (evita el error de `requireUsuario`).
 */
export function useUsuarioActual() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.usuarios.actual, isAuthenticated ? {} : "skip");
}

/**
 * Ítems de navegación filtrados por rol: "Equipo" solo para la dueña. Es el gate
 * VISUAL; la autorización real de /equipo se hace server-side en su página.
 */
export function useNavItems() {
  const user = useUsuarioActual();
  const esPropietaria = user?.rol === "propietaria";
  return NAV_ITEMS.filter((i) => i.href !== "/equipo" || esPropietaria);
}
