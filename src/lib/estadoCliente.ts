import type { BadgeStatus } from "@/components/ui/Badge";

/**
 * Estado del cliente — valor CALCULADO a partir de sus ventas (ver `estadoDe` en
 * `convex/clientes.ts`). Compartido por la pantalla Hoy y la lista de clientes.
 */
export type EstadoCliente = "nuevo_lead" | "en_negociacion" | "ganado" | "perdido";

/** Estado del cliente → variante de color del Badge. */
export const ESTADO_BADGE: Record<EstadoCliente, BadgeStatus> = {
  nuevo_lead: "info",
  en_negociacion: "primary",
  ganado: "success",
  perdido: "error",
};
