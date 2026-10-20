"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/ui/TabBar";
import { useNavItems } from "@/lib/useSesion";
import { esFichaCliente } from "@/lib/nav";

/**
 * Barra inferior móvil con los ítems filtrados por rol (Equipo solo dueña).
 * Se oculta en la ficha de cliente (pantalla "push" con botón atrás).
 */
export function TabBarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const items = useNavItems();
  if (esFichaCliente(pathname)) return null;
  return <TabBar items={items} className={className} />;
}
