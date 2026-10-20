import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeStatus =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary"
  | "neutral";

interface BadgeProps {
  status?: BadgeStatus;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const styles: Record<BadgeStatus, { chip: string; dot: string }> = {
  success: { chip: "bg-success-bg text-success-text", dot: "bg-success" },
  warning: { chip: "bg-warning-bg text-warning-text", dot: "bg-warning" },
  error: { chip: "bg-error-bg text-error-text", dot: "bg-error" },
  info: { chip: "bg-info-bg text-info-text", dot: "bg-info" },
  primary: { chip: "bg-primary-subtle text-primary", dot: "bg-primary" },
  neutral: {
    chip: "bg-surface-2 text-text-muted border border-border",
    dot: "bg-text-subtle",
  },
};

/** Etiquetas en español para los estados de cliente/venta que usa el CRM. */
export const STATUS_LABELS: Record<BadgeStatus, string> = {
  info: "Nuevo lead",
  primary: "En negociación",
  warning: "Pendiente",
  success: "Ganado",
  error: "Perdido",
  neutral: "Borrador",
};

export function Badge({
  status = "neutral",
  dot = true,
  children,
  className,
}: BadgeProps) {
  const s = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[13px] font-medium",
        s.chip,
        className,
      )}
    >
      {dot && <span className={cn("size-[7px] shrink-0 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}
