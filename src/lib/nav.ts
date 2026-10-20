import { Home, Users, TrendingUp, Shield } from "lucide-react";

/**
 * Navegación principal (barra inferior en móvil, sidebar en escritorio).
 * "Equipo" solo se muestra a usuarios con rol "propietaria"; el filtrado por rol
 * lo aplica `useNavItems` (ver `useSesion`) según la sesión real.
 */
export const NAV_ITEMS = [
  { href: "/hoy", label: "Hoy", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ventas", label: "Ventas", icon: TrendingUp },
  { href: "/equipo", label: "Equipo", icon: Shield },
] as const;

export const SECTION_TITLES: Record<string, string> = {
  "/hoy": "Hoy",
  "/clientes": "Clientes",
  "/ventas": "Ventas",
  "/equipo": "Equipo",
  "/cuenta": "Mi cuenta",
};

/**
 * Rutas de detalle "push" (p. ej. la ficha de cliente `/clientes/:id`) que ocultan
 * la barra inferior. `/clientes` (la lista) NO casa; sí `/clientes/<id>`.
 */
export function esFichaCliente(pathname: string): boolean {
  return /^\/clientes\/[^/]+$/.test(pathname);
}
