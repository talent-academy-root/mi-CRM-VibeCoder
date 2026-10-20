import type { BadgeStatus } from "@/components/ui/Badge";

/**
 * Estado de una venta u oportunidad (F5). Espejo de `ESTADO_VENTA` en
 * `convex/ventas.ts`. No confundir con el estado del CLIENTE (`estadoCliente.ts`),
 * que se calcula a partir de estos.
 */
export type EstadoVenta = "abierta" | "ganada" | "perdida";

/** Orden de los chips en el formulario. */
export const ESTADOS_VENTA: readonly EstadoVenta[] = [
  "abierta",
  "ganada",
  "perdida",
];

export const ESTADO_VENTA_LABEL: Record<EstadoVenta, string> = {
  abierta: "Oportunidad abierta",
  ganada: "Ganada",
  perdida: "Perdida",
};

/**
 * Variante de color del Badge. Cuidado: `STATUS_LABELS` de `Badge.tsx` NO sirve
 * aquí, porque allí `info` se llama "Nuevo lead" (es el estado de un cliente).
 */
export const ESTADO_VENTA_BADGE: Record<EstadoVenta, BadgeStatus> = {
  abierta: "info",
  ganada: "success",
  perdida: "error",
};

/** Círculo del icono en el historial y en el listado (`VENTA_EST` del prototipo). */
export const ESTADO_VENTA_ICONO: Record<EstadoVenta, string> = {
  abierta: "bg-info-bg text-info",
  ganada: "bg-success-bg text-success",
  perdida: "bg-error-bg text-error",
};

/** Color del importe: solo lo ganado va en verde y lo perdido en rojo. */
export const ESTADO_VENTA_IMPORTE: Record<EstadoVenta, string> = {
  abierta: "text-text",
  ganada: "text-success-text",
  perdida: "text-error-text",
};

/** Opciones listas para `ChipGroup`. */
export const ESTADO_VENTA_OPCIONES = ESTADOS_VENTA.map((value) => ({
  value,
  label: ESTADO_VENTA_LABEL[value],
}));

// --- Filtros de la pantalla /ventas (TAL-62) -------------------------------

export type FiltroVenta = "todas" | EstadoVenta;

export const FILTROS_VENTA: readonly FiltroVenta[] = [
  "todas",
  "abierta",
  "ganada",
  "perdida",
];

/** En los filtros la oportunidad abierta se llama "En marcha", no por su estado. */
export const FILTRO_VENTA_LABEL: Record<FiltroVenta, string> = {
  todas: "Todas",
  abierta: "En marcha",
  ganada: "Ganadas",
  perdida: "Perdidas",
};

/** Cada filtro vacío dice lo suyo: "sin ventas" no explica nada al filtrar. */
export const FILTRO_VENTA_VACIO: Record<FiltroVenta, string> = {
  todas: "Sin ventas registradas",
  abierta: "Sin oportunidades abiertas",
  ganada: "Sin ventas ganadas",
  perdida: "Sin ventas perdidas",
};
