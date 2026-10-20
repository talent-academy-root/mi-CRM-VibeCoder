import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** "12 jun" a partir de una fecha ISO (YYYY-MM-DD). */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${parseInt(d, 10)} ${MESES[parseInt(m, 10) - 1]}`;
}

/**
 * Fecha local "YYYY-MM-DD" (zona horaria del navegador del usuario, NO UTC).
 * Usar SIEMPRE esto para "hoy" — `toISOString()` daría el día en UTC y, cerca de
 * medianoche en husos como México (UTC-6), clasificaría mal atrasado/hoy/próximo.
 */
export function hoyLocalISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * "Hoy" / "Ayer" / "Hace N días" / "Hace N semanas" respecto a una fecha de referencia.
 * Una fecha futura NO es "Hoy": se muestra su día ("9 jul"). El backend admite un día
 * de holgura por husos horarios (convex/fechas.ts), y sin esto la lista de clientes
 * enseñaría como "Hoy" un último contacto de mañana.
 */
export function relativeLabel(iso: string, today: Date = new Date()): string {
  const ref = new Date(hoyLocalISO(today) + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  const days = Math.round((ref.getTime() - target.getTime()) / 86_400_000);
  if (days < 0) return shortDate(iso);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.round(days / 7);
  return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
}

/**
 * Importe en dólares: 21000 -> "$21,000"; 1200.5 -> "$1,200.50". Los decimales
 * solo aparecen si los hay, así que un apunte redondo no arrastra un ",00".
 *
 * Formateado a mano y no con `Intl`: el resultado tiene que ser idéntico en el
 * render de servidor y en el del navegador (si no, React avisa de un desajuste
 * de hidratación), y eso depende de qué datos ICU lleve compilado cada Node.
 */
export function formatMoneda(n: number): string {
  const centavos = Math.round(n * 100);
  const miles = String(Math.trunc(centavos / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
  const resto = Math.abs(centavos % 100);
  return resto === 0
    ? `$${miles}`
    : `$${miles}.${String(resto).padStart(2, "0")}`;
}

/** Normaliza un teléfono dejando solo dígitos, para comparar en búsquedas. */
export function normalizePhone(s: string): string {
  return (s || "").replace(/[^0-9]/g, "");
}

/** Iniciales de un nombre para los avatares ("Marta López" -> "ML"). */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
