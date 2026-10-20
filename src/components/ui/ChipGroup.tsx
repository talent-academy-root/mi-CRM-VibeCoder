"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  label?: string;
  options: ReadonlyArray<ChipOption<T>>;
  value: T | null;
  onChange: (value: T | null) => void;
}

/**
 * Grupo de chips de selección única y opcional: al pulsar el chip activo se
 * deselecciona (`onChange(null)`). Presentacional; sigue los tokens del design
 * system (chip activo en `primary`, inactivo en superficie con borde fuerte).
 * Toggle buttons con `aria-pressed` dentro de un `role="group"` etiquetado.
 */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span id={labelId} className="text-[14px] font-medium text-text">
          {label}
        </span>
      )}
      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className="flex flex-wrap gap-2"
      >
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : o.value)}
              className={cn(
                "rounded-md px-[14px] py-[9px] text-[14px] font-medium transition-colors duration-150 ease-[var(--ease-standard)]",
                selected
                  ? "border border-primary bg-primary-subtle text-primary"
                  : "border border-border-strong bg-surface text-text-muted hover:bg-surface-2",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
