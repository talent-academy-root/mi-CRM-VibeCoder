import { Mail, MessageCircle, Phone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Canal de una interacción (F7). Exactamente cuatro; "Reunión" aparece en datos de
 * ejemplo del prototipo pero no es una opción real. Espejo de `CANAL_INTERACCION`
 * en `convex/interacciones.ts`.
 */
export type CanalInteraccion = "llamada" | "email" | "whatsapp" | "en_persona";

/** Orden de los chips en el formulario. */
export const CANALES_INTERACCION: readonly CanalInteraccion[] = [
  "llamada",
  "email",
  "whatsapp",
  "en_persona",
];

export const CANAL_INTERACCION_LABEL: Record<CanalInteraccion, string> = {
  llamada: "Llamada",
  email: "Email",
  whatsapp: "WhatsApp",
  en_persona: "En persona",
};

/** Icono del canal en el historial de la ficha. */
export const CANAL_INTERACCION_ICON: Record<CanalInteraccion, LucideIcon> = {
  llamada: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  en_persona: Users,
};

/** Opciones listas para `ChipGroup`. */
export const CANAL_INTERACCION_OPCIONES = CANALES_INTERACCION.map((value) => ({
  value,
  label: CANAL_INTERACCION_LABEL[value],
}));
