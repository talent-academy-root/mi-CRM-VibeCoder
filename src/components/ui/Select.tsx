import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  children: ReactNode;
}

export function Select({
  label,
  error,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const selectId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-12 w-full appearance-none rounded-md border bg-surface px-3.5 pr-10 text-[15px] text-text outline-none transition-colors",
            error
              ? "border-error focus:border-error focus:ring-3 focus:ring-error-bg"
              : "border-border-strong focus:border-primary focus:ring-3 focus:ring-primary-subtle",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle"
          aria-hidden
        />
      </div>
    </div>
  );
}
