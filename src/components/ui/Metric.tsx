import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: string;
  /** Texto simple bajo la cifra (p. ej. "3 oportunidades"). */
  sub?: string;
  /** Pill de variación (p. ej. Badge con delta), si aplica. */
  delta?: ReactNode;
  valueClassName?: string;
}

export function Metric({ label, value, sub, delta, valueClassName }: MetricProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-text-muted">{label}</span>
      <span
        className={cn(
          "font-mono text-[28px] leading-tight font-medium tabular-nums text-text",
          valueClassName,
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-text-subtle">{sub}</span>}
      {delta}
    </div>
  );
}
